// routes/guarantors.routes.js
import { Router } from 'express';
import pool from '../db.js';  // adjust path if needed

const router = Router();

// ✅ GET all guarantors
router.get('/guarantors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guarantors');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET guarantor by ID
router.get('/guarantors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM guarantors WHERE guarantorid = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Guarantor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ CREATE guarantor
router.post('/guarantors', async (req, res) => {
  const { name, email, phone, address, governmentid } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO guarantors (name, email, phone, address, governmentid)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, phone, address, governmentid]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE guarantor
router.put('/guarantors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, governmentid } = req.body;
  try {
    const result = await pool.query(
      `UPDATE guarantors
       SET name = $1, email = $2, phone = $3, address = $4, governmentid = $5
       WHERE guarantorid = $6 RETURNING *`,
      [name, email, phone, address, governmentid, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Guarantor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE guarantor
router.delete('/guarantors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM guarantors WHERE guarantorid = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Guarantor not found' });
    }
    res.json({ message: `Guarantor ${id} deleted`, guarantor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
