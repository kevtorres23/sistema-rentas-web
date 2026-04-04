// routes/tenants.routes.js
import { Router } from 'express';
import pool from '../db.js';  // adjust path if needed
import { hash } from 'bcryptjs';

const router = Router();
const UNDEFINED_COLUMN = '42703';

const runWithTenantIdFallback = async (primaryQuery, fallbackQuery, values) => {
  try {
    return await pool.query(primaryQuery, values);
  } catch (err) {
    if (err?.code === UNDEFINED_COLUMN) {
      return pool.query(fallbackQuery, values);
    }
    throw err;
  }
};

// GET all tenants
router.get('/tenants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenants');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET tenant by ID
router.get('/tenants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await runWithTenantIdFallback(
      'SELECT * FROM tenants WHERE tenantid = $1',
      'SELECT * FROM tenants WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE tenant
router.post('/tenants', async (req, res) => {
  const { name, phone, email, governmentid, password } = req.body;
  try {
    if (!name || !governmentid || !password) {
      return res.status(400).json({ message: 'name, governmentid and password are required' });
    }

    const passwordhash = await hash(password, 10);

    const result = await pool.query(
      `INSERT INTO tenants (name, phone, email, governmentid, passwordhash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, phone || null, email || null, governmentid, passwordhash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE tenant
router.put('/tenants/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, governmentid, password } = req.body;
  try {
    if (!name || !governmentid) {
      return res.status(400).json({ message: 'name and governmentid are required' });
    }

    const current = await runWithTenantIdFallback(
      'SELECT passwordhash FROM tenants WHERE tenantid = $1',
      'SELECT passwordhash FROM tenants WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const passwordhash = password
      ? await hash(password, 10)
      : current.rows[0].passwordhash;

    const result = await runWithTenantIdFallback(
      `UPDATE tenants
       SET name = $1, phone = $2, email = $3, governmentid = $4, passwordhash = $5
       WHERE tenantid = $6 RETURNING *`,
      `UPDATE tenants
       SET name = $1, phone = $2, email = $3, governmentid = $4, passwordhash = $5
       WHERE id = $6 RETURNING *`,
      [name, phone || null, email || null, governmentid, passwordhash, id]
    );    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE tenant
router.delete('/tenants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await runWithTenantIdFallback(
      'DELETE FROM tenants WHERE tenantid = $1 RETURNING *',
      'DELETE FROM tenants WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    res.json({ message: `Tenant ${id} deleted`, tenant: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
