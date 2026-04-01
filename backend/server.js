import express from 'express';
import cors from 'cors';
import poolOriginal from './db.js';
import pkg from 'pg';

import dotenv from 'dotenv';
import Openpay from 'openpay';

dotenv.config();

const openpay = new Openpay(process.env.OPENPAY_MERCHANT_ID, process.env.OPENPAY_PRIVATE_KEY, false);

const { Pool } = pkg;
const app = express();
const PORT = 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📡 Petición entrante: ${req.method} ${req.url}`);
  next();
});

// --- BASE DE DATOS ---
const pool = new Pool({
  connectionString: "postgresql://postgres.ckxadrogfdgzlsrpwmvt:S7LwgfkwmM7K6izM@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: false
});

// 👉 BYPASS DE LOGIN TEMPORAL
app.post('/api/login', async (req, res) => {
  console.log("✅ Dejando entrar al usuario al sistema...");
  return res.status(200).json({
    success: true,
    message: "Login exitoso",
    token: "token-maestro-123",
    user: {
      id: 1,
      nombre: "Administrador",
      rol: "admin"
    }
  });
});

// ========================================================
// 👉 DATOS DEL DASHBOARD PARA EL INQUILINO
// ========================================================
app.get('/api/dashboard-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 👉 MODIFICADO: Agregamos i.id as invoiceid
    const queryFactura = `
      SELECT i.id as invoiceid, i.amount, i.duedate, i.status, t.name, t.phone, t.email, a.address
      FROM invoices i
      JOIN rentalcontracts rc ON i.contractid = rc.id
      JOIN tenants t ON rc.tenantid = t.tenantid
      JOIN apartments a ON rc.apartmentid = a.id
      WHERE t.tenantid = $1
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
// ========================================================

// --- API ROUTES ORIGINALES ---

app.get('/api/mora-settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT tipo, valor FROM morasettings WHERE id = 1');

    if (result.rows.length === 0) {
      const defaults = { tipo: 'PORCENTAJE', valor: 10 };
      await pool.query(
        'INSERT INTO morasettings (id, tipo, valor) VALUES (1, $1, $2)',
        [defaults.tipo, defaults.valor]
      );
      return res.json(defaults);
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Mora settings read error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/mora-settings', async (req, res) => {
  try {
    const { tipo, valor } = req.body;
    const tipoNormalizado = tipo === 'FIJO' ? 'FIJO' : 'PORCENTAJE';
    const valorNormalizado = Number(valor) || 0;

    const result = await pool.query(
      `
        INSERT INTO morasettings (id, tipo, valor, updatedat)
        VALUES (1, $1, $2, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          tipo = EXCLUDED.tipo,
          valor = EXCLUDED.valor,
          updatedat = NOW()
        RETURNING tipo, valor
      `,
      [tipoNormalizado, valorNormalizado]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Mora settings save error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/facturas', async (req, res) => {
  try {
    const sql = `
      SELECT i.id AS invoiceid, i.amount, i.duedate, i.status,
             t.name AS tenant_name, t.phone AS tenant_phone,
             a.address AS apartment_address
      FROM invoices i
      JOIN rentalcontracts rc ON i.contractid = rc.id
      JOIN tenants t ON rc.tenantid = t.tenantid
      JOIN apartments a ON rc.apartmentid = a.id
      ORDER BY i.duedate DESC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ API Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generar-facturas', async (req, res) => {
  try {
    let { moraType, moraValue } = req.body;

    if (!moraType || moraValue === undefined || moraValue === null) {
      try {
        const settingsResult = await pool.query(
          'SELECT tipo, valor FROM morasettings WHERE id = 1'
        );

        if (settingsResult.rows.length > 0) {
          moraType = settingsResult.rows[0].tipo;
          moraValue = settingsResult.rows[0].valor;
        }
      } catch (settingsError) {
        console.error("❌ Mora fallback error:", settingsError.message);
      }
    }

    const valorMora = parseFloat(moraValue) || 0;
    const contratos = await pool.query("SELECT * FROM rentalcontracts WHERE status = 'ACTIVE'");
    const periodo = new Date().toISOString().slice(0, 7);

    const vto = new Date();
    vto.setDate(vto.getDate() + 10);
    const vtoStr = vto.toISOString().slice(0, 10);

    let creadas = 0;

    for (const contrato of contratos.rows) {
      const existe = await pool.query(
        "SELECT * FROM invoices WHERE contractid = $1 AND TO_CHAR(duedate, 'YYYY-MM') = $2",
        [contrato.id, periodo]
      );

      if (existe.rows.length === 0) {
        const apto = await pool.query("SELECT monthlyrent FROM apartments WHERE id = $1", [contrato.apartmentid]);

        if (apto.rows.length > 0) {
          let rentaBase = parseFloat(apto.rows[0].monthlyrent);
          let totalAPagar = rentaBase;

          if (valorMora > 0) {
            if (moraType === 'FIJO') {
              totalAPagar += valorMora;
            } else if (moraType === 'PORCENTAJE') {
              const extra = (rentaBase * (valorMora / 100));
              totalAPagar += extra;
            }
          }

          await pool.query(
            "INSERT INTO invoices (contractid, amount, duedate, status) VALUES ($1, $2, $3, 'PENDING')",
            [contrato.id, totalAPagar, vtoStr]
          );
          creadas++;
        }
      }
    }
    res.json({ success: true, message: `Successfully generated ${creadas} new invoices.` });

  } catch (err) {
    console.error("❌ Generation Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/registrar-pago', async (req, res) => {
  const { invoiceid, amount, method } = req.body;
  try {
    await pool.query(
      "INSERT INTO payments (invoiceid, paymentdate, amount, method) VALUES ($1, CURRENT_DATE, $2, $3)",
      [invoiceid, amount, method]
    );
    await pool.query("UPDATE invoices SET status = 'PAID' WHERE id = $1", [invoiceid]);

    res.json({ success: true, message: "Payment registered successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/propiedades', async (req, res) => {
  try {
    const { nombre, direccion, renta, fecha_limite, tipo_mora, valor_mora } = req.body;
    const query = `
      INSERT INTO propiedades 
      (nombre, direccion, renta, fecha_limite, tipo_mora, valor_mora) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const values = [nombre, direccion, renta, fecha_limite, tipo_mora, valor_mora];
    const newProperty = await pool.query(query, values);
    res.json(newProperty.rows[0]);
  } catch (err) {
    console.error("Error saving property:", err.message);
    res.status(500).send("Server Error");
  }
});

// ========================================================
// 👉 INICIAR PAGO CON OPENPAY (MODIFICADO PARA WEBHOOKS)
// ========================================================
app.post('/api/pagos/openpay', (req, res) => {
  // 👉 Ahora recibimos el invoiceid
  const { monto, descripcion, cliente, invoiceid } = req.body;

  const chargeRequest = {
    method: 'card',
    amount: monto,
    description: descripcion,
    // 👉 VINCULACIÓN: Openpay sabrá a qué factura pertenece este cobro
    order_id: `REC-${invoiceid}`,
    customer: {
      name: cliente.nombre,
      last_name: cliente.apellidos,
      phone_number: cliente.telefono,
      email: cliente.correo
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

    console.log(`✅ Link generado para Recibo ID: ${invoiceid}`);
    res.status(200).json({
      success: true,
      payment_url: charge.payment_method.url
    });
  });
});

// ========================================================
// 👉 WEBHOOK DE OPENPAY (ACTUALIZA ESTADO AUTOMÁTICAMENTE)
// ========================================================
app.post('/api/webhooks/openpay', async (req, res) => {
  console.log("🔔 Webhook recibido de Openpay. Evento:", req.body.type);

  try {
    const evento = req.body;

    if (evento.type === 'charge.succeeded') {
      const transaccion = evento.transaction;
      const orderId = transaccion.order_id; // Ejemplo: "REC-5"
      const monto = transaccion.amount;

      // Verificamos que traiga nuestro identificador
      if (orderId && orderId.startsWith('REC-')) {
        const invoiceId = orderId.split('-')[1]; // Extraemos el "5"

        console.log(`✅ Pago detectado. Actualizando Recibo ID: ${invoiceId}...`);

        // Cambiamos el estado en la base de datos a PAGADO
        await pool.query("UPDATE invoices SET status = 'PAID' WHERE id = $1", [invoiceId]);

        // Guardamos el registro en la tabla de pagos
        await pool.query(
          "INSERT INTO payments (invoiceid, paymentdate, amount, method) VALUES ($1, CURRENT_DATE, $2, 'TARJETA_OPENPAY')",
          [invoiceId, monto]
        );

        console.log("💾 ¡Recibo procesado y actualizado con éxito!");
      }
    }

    // MANDATORIO: Responder 200 OK para que Openpay deje de insistir
    res.status(200).send('Webhook procesado');
  } catch (error) {
    console.error("❌ Error procesando el Webhook:", error.message);
    res.status(500).send('Error interno');
  }
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`🚀 API Backend Ready at http://localhost:${PORT}`));