// routes/invoices.routes.js
import { Router } from 'express';
import pool from '../db.js';  // adjust path if needed

const router = Router();

// GET all invoices
router.get('/invoices', async (req, res) => {
  const { contract_id } = req.query;

  if (!contract_id) {
    return res.status(400).json({ error: "contract_id is required" });
  }

  try {
    const result = await pool.query(
      `SELECT 
         i.*, 
         COALESCE(SUM(p.amount), 0) AS total_paid
       FROM invoices i
       LEFT JOIN payments p 
         ON p.invoiceid = i.id
       WHERE i.contractid = $1
       GROUP BY i.id`,
      [contract_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET invoice by ID
router.get('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE invoice
router.post('/invoices', async (req, res) => {
  const { contractid, amount, duedate, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO invoices (contractid, amount, duedate, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [contractid, amount, duedate, status || 'PENDING']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE invoice
router.put('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { contractid, amount, duedate, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE invoices
       SET contractid = $1, amount = $2, duedate = $3, status = $4
       WHERE id = $5 RETURNING *`,
      [contractid, amount, duedate, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE invoice
router.delete('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM invoices WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: `Invoice ${id} deleted`, invoice: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

