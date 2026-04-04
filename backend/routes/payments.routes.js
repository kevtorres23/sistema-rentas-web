// routes/payments.routes.js
import { Router } from 'express';
import pool from '../db.js';  // adjust path if needed
import Openpay from 'openpay';

const router = Router();
const isProduction = false;

const openpay = new Openpay(
  process.env.OPENPAY_MERCHANT_ID,
  process.env.OPENPAY_PRIVATE_KEY,
  isProduction
);

// GET all payments
router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET payment by ID
router.get('/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE payment
router.post('/payments', async (req, res) => {
  const { invoiceid, paymentdate, amount, method } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO payments (invoiceid, paymentdate, amount, method)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [invoiceid, paymentdate, amount, method]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE payment
router.put('/payments/:id', async (req, res) => {
  const { id } = req.params;
  const { invoiceid, paymentdate, amount, method } = req.body;
  try {
    const result = await pool.query(
      `UPDATE payments
       SET invoiceid = $1, paymentdate = $2, amount = $3, method = $4
       WHERE id = $5 RETURNING *`,
      [invoiceid, paymentdate, amount, method, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE payment
router.delete('/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM payments WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json({ message: `Payment ${id} deleted`, payment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE Openpay checkout URL
router.post('/pagos/openpay', (req, res) => {
  const { monto, descripcion, cliente } = req.body;

  const frontendBase = (process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:3000')
    .replace(/\/$/, '');

  const chargeRequest = {
    method: 'card',
    amount: Number(monto),
    description: descripcion,
    order_id: `REC-${Date.now()}`,
    customer: {
      name: cliente?.nombre || 'Inquilino',
      last_name: cliente?.apellidos || 'Ejemplo',
      phone_number: cliente?.telefono || '',
      email: cliente?.correo || ''
    },
    send_email: true,
    confirm: false,
    redirect_url: `${frontendBase}/home?pago=exitoso`
  };

  openpay.charges.create(chargeRequest, (error, charge) => {
    if (error) {
      console.error('Openpay error:', error);
      return res.status(400).json({
        success: false,
        message: 'No se pudo generar el cobro',
        details: error?.description || error?.message || 'Unknown Openpay error'
      });
    }

    return res.status(200).json({
      success: true,
      payment_url: charge?.payment_method?.url
    });
  });
});

export default router;
