import { Router } from 'express';
import pool from '../db.js'; // adjust path if needed
import Openpay from 'openpay';

import { authMiddleware } from '../middlewares/auth.js'

const router = Router();

// --- NUEVA RUTA: INICIAR PAGO CON OPENPAY ---
router.post('/pagos/openpay', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const openpay = new Openpay(
        process.env.OPENPAY_MERCHANT_ID,
        process.env.OPENPAY_PRIVATE_KEY,
        false
    );

    const client = await pool.connect();

    try {
        /* -------- GET TENANT -------- */
        const tenantResult = await client.query(
            `
            SELECT id, name, email, phone
            FROM tenants
            WHERE id = $1
            `,
            [userId]
        );

        if (tenantResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found"
            });
        }

        const tenant = tenantResult.rows[0];

        /* -------- GET LAST UNPAID INVOICE -------- */
        const invoiceResult = await client.query(
            `
            SELECT i.*
            FROM invoices i
            JOIN rentalcontracts rc ON rc.id = i.contractid
            WHERE rc.tenantid = $1
              AND i.status = 'pending'  -- adjust if your status differs
            ORDER BY i.duedate ASC
            LIMIT 1
            `,
            [userId]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No unpaid invoices found"
            });
        }

        const invoice = invoiceResult.rows[0];

        /* -------- BUILD CUSTOMER -------- */
        const customerName = tenant.name || 'Inquilino';
        const customerLastName = ''; // adjust if you store it separately
        const customerPhone = tenant.phone || '';
        const customerEmail =
            tenant.email ||
            `${String(tenant.name || 'cliente').replace(/\s+/g, '.').toLowerCase()}@example.com`;

        /* -------- CREATE CHARGE -------- */
        const chargeRequest = {
            method: 'card',
            amount: invoice.amount, // <-- from invoice
            description: `Pago de renta - Factura #${invoice.id}`,
            order_id: `REC-${invoice.id}`,
            customer: {
                name: customerName,
                last_name: customerLastName,
                phone_number: customerPhone,
                email: customerEmail
            },
            send_email: true,
            confirm: false,
            redirect_url: 'http://localhost:3000/Home?pago=exitoso'
        };

        openpay.charges.create(chargeRequest, (error, charge) => {
            if (error) {
                console.error("❌ Error de Openpay:", error);
                return res.status(400).json({
                    success: false,
                    message: "No se pudo generar el cobro",
                    detalles: error.description
                });
            }

            console.log("✅ Link de Openpay generado");
            res.status(200).json({
                success: true,
                payment_url: charge.payment_method.url,
                invoice_id: invoice.id
            });
        });

    } catch (err) {
        console.error("❌ Server error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
});

router.get('/dashboard-cliente', authMiddleware, async (req, res) => {
    try {
        const id = req.user.id;

        // 👉 MODIFICADO: Agregamos i.id as invoiceid
        const queryFactura = `
      SELECT i.id as invoiceid, rc.id as contractid, i.amount, i.duedate, i.status, t.name, t.phone, t.email, a.street as address, a.division
      FROM invoices i
      JOIN rentalcontracts rc ON i.contractid = rc.id
      JOIN tenants t ON rc.tenantid = t.id
      JOIN apartments a ON rc.apartmentid = a.id
      WHERE t.id = $1
      ORDER BY i.duedate DESC LIMIT 1
    `;
        const resFactura = await pool.query(queryFactura, [id]);

        const queryRecibos = `
      SELECT i.id, i.duedate, i.amount 
      FROM invoices i
      JOIN rentalcontracts rc ON i.contractid = rc.id
      WHERE rc.tenantid = $1 AND i.status = 'PAID'
      ORDER BY i.duedate DESC
    `;
        const resRecibos = await pool.query(queryRecibos, [id]);

        res.json({
            datosVivienda: resFactura.rows[0] || null,
            historialRecibos: resRecibos.rows || []
        });
    } catch (err) {
        console.error("❌ Error en dashboard:", err.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.post('/webhooks/openpay', async (req, res) => {
    console.log("🔔 Webhook recibido de Openpay:", req.body.type);

    const client = await pool.connect();

    try {
        const evento = req.body;

        /* -------- VALIDATE EVENT -------- */
        if (!evento || evento.type !== 'charge.succeeded') {
            return res.status(200).send('Evento ignorado');
        }

        const transaccion = evento.transaction;

        if (!transaccion) {
            return res.status(400).send('Invalid payload');
        }

        const { order_id, amount, id: openpayChargeId } = transaccion;

        if (!order_id || !order_id.startsWith('REC-')) {
            return res.status(200).send('No es un pago válido del sistema');
        }

        /* -------- EXTRACT INVOICE ID -------- */
        // Supports formats like REC-5 or REC-5-123456789
        const parts = order_id.split('-');
        const invoiceId = parts[1];

        if (!invoiceId) {
            return res.status(400).send('Invalid order_id');
        }

        console.log(`✅ Procesando pago para invoice ${invoiceId}`);

        await client.query('BEGIN');

        /* -------- CHECK IF ALREADY PROCESSED (IDEMPOTENCY) -------- */
        const existingPayment = await client.query(
            `SELECT id FROM payments WHERE external_id = $1`,
            [openpayChargeId]
        );

        if (existingPayment.rows.length > 0) {
            console.log("⚠️ Webhook duplicado ignorado");
            await client.query('ROLLBACK');
            return res.status(200).send('Duplicado');
        }

        /* -------- CHECK INVOICE STATUS -------- */
        const invoiceResult = await client.query(
            `SELECT id, status FROM invoices WHERE id = $1 FOR UPDATE`,
            [invoiceId]
        );

        if (invoiceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Invoice no encontrada');
        }

        const invoice = invoiceResult.rows[0];

        if (invoice.status === 'PAID') {
            console.log("⚠️ Invoice ya estaba pagada");
            await client.query('ROLLBACK');
            return res.status(200).send('Ya pagada');
        }

        /* -------- UPDATE INVOICE -------- */
        await client.query(
            `UPDATE invoices 
             SET status = 'PAID', paidat = NOW() 
             WHERE id = $1`,
            [invoiceId]
        );

        /* -------- INSERT PAYMENT -------- */
        await client.query(
            `INSERT INTO payments 
             (invoiceid, paymentdate, amount, method, external_id)
             VALUES ($1, NOW(), $2, 'OPENPAY_CARD', $3)`,
            [invoiceId, amount, openpayChargeId]
        );

        await client.query('COMMIT');

        console.log("💾 Pago aplicado correctamente");

        res.status(200).send('Webhook procesado');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Error en webhook:", error);

        res.status(500).send('Error interno');
    } finally {
        client.release();
    }
});

export default router;
