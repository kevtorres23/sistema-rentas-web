// apartments.routes.js
import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middlewares/auth.js'

const router = Router();
const UNDEFINED_COLUMN = '42703';

// GET all apartments
router.get("/apartments", authMiddleware, async (req, res) => {
  try {
    const ownerId = req.user.id;

    const result = await pool.query(
      `
      SELECT
          a.*,
          rc.depositamount,
          rc.id as rc_id,
          t.name AS tenant_name,
          i.duedate AS latest_due_date
      FROM apartments a
      LEFT JOIN LATERAL (
          SELECT id, depositamount, tenantid
          FROM rentalcontracts
          WHERE apartmentid = a.id
          ORDER BY startdate DESC NULLS LAST, id DESC
          LIMIT 1
      ) rc ON true
      LEFT JOIN tenants t
          ON rc.tenantid = t.id
      LEFT JOIN LATERAL (
          SELECT duedate
          FROM invoices
          WHERE contractid = rc.id
          ORDER BY duedate DESC
          LIMIT 1
      ) i ON true
      WHERE a.ownerid = $1;
      `,
      [ownerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err); // important for debugging
    res.status(500).json({ error: "Error fetching apartments" });
  }
});

// GET apartment by ID (with tenant/contract summary)
router.get('/apartments/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;
  try {
    let result;
    try {
      result = await pool.query(
        `
      SELECT
        a.*,
        rc.id AS contract_id,
        rc.tenantid AS tenant_id,
        rc.depositamount,
        t.name AS tenant_name,
        t.phone AS tenant_phone,
        t.email AS tenant_email,
        i.duedate AS latest_due_date
      FROM apartments a
      LEFT JOIN LATERAL (
        SELECT *
        FROM rentalcontracts
        WHERE apartmentid = a.id
        ORDER BY startdate DESC NULLS LAST, id DESC
        LIMIT 1
      ) rc ON true
      LEFT JOIN tenants t
        ON rc.tenantid = t.id
      LEFT JOIN LATERAL (
        SELECT duedate
        FROM invoices
        WHERE contractid = rc.id
        ORDER BY duedate DESC
        LIMIT 1
      ) i ON true
      WHERE a.id = $1 AND a.ownerid = $2
      `,
        [id, ownerId]
      );
    } catch (err) {
      if (err?.code !== UNDEFINED_COLUMN) throw err;

      result = await pool.query(
        `
      SELECT
        a.*,
        rc.id AS contract_id,
        rc.tenantid AS tenant_id,
        rc.depositamount,
        t.name AS tenant_name,
        t.phone AS tenant_phone,
        t.email AS tenant_email,
        i.duedate AS latest_due_date
      FROM apartments a
      LEFT JOIN LATERAL (
        SELECT *
        FROM rentalcontracts
        WHERE apartmentid = a.id
        ORDER BY startdate DESC NULLS LAST, id DESC
        LIMIT 1
      ) rc ON true
      LEFT JOIN tenants t
        ON rc.tenantid = t.id
      LEFT JOIN LATERAL (
        SELECT duedate
        FROM invoices
        WHERE contractid = rc.id
        ORDER BY duedate DESC
        LIMIT 1
      ) i ON true
      WHERE a.id = $1 AND a.ownerid = $2
      `,
        [id, ownerId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST (create) a new apartment
router.post('/apartments', authMiddleware, async (req, res) => {
  const ownerId = req.user.id;
  const { postal_code, street, division, int_num, name, city, state, ext_num } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO apartments (ownerid, postal_code, street, division, int_num, name, city, state, ext_num) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [ownerId, postal_code, street, division, int_num, name, city, state, ext_num]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH assign tenant to the latest contract for an apartment
router.patch('/apartments/:id/tenant', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { tenantid } = req.body;
  const ownerId = req.user.id;

  if (!tenantid) {
    return res.status(400).json({ error: 'tenantid is required' });
  }

  try {
    const apartmentCheck = await pool.query(
      'SELECT id FROM apartments WHERE id = $1 AND ownerid = $2',
      [id, ownerId]
    );

    if (apartmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Apartment not found' });
    }

    let tenantCheck;
    try {
      tenantCheck = await pool.query(
        'SELECT id, name, email, phone FROM tenants WHERE id = $1',
        [tenantid]
      );
    } catch (err) {
      if (err?.code !== UNDEFINED_COLUMN) throw err;
      tenantCheck = await pool.query(
        'SELECT tenantid AS id, name, email, phone FROM tenants WHERE tenantid = $1',
        [tenantid]
      );
    }

    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const updateResult = await pool.query(
      `
      WITH latest_contract AS (
        SELECT id
        FROM rentalcontracts
        WHERE apartmentid = $1
        ORDER BY startdate DESC NULLS LAST, id DESC
        LIMIT 1
      )
      UPDATE rentalcontracts rc
      SET tenantid = $2
      FROM latest_contract lc
      WHERE rc.id = lc.id
      RETURNING rc.id AS contract_id, rc.apartmentid, rc.tenantid
      `,
      [id, tenantid]
    );

    if (updateResult.rows.length === 0) {
      return res.status(400).json({
        message: 'No contract found for this apartment. Create a contract first.'
      });
    }

    const tenant = tenantCheck.rows[0];

    res.json({
      ...updateResult.rows[0],
      tenant_name: tenant.name,
      tenant_email: tenant.email,
      tenant_phone: tenant.phone
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

// PATCH status only
router.patch('/apartments/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ownerId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE apartments SET status = $1 WHERE id = $2 AND ownerid = $3 RETURNING *',
      [status, id, ownerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Apartment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

// PUT (update) an apartment
router.put('/apartments/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  const {
    postal_code,
    street,
    division,
    int_num,
    name,
    city,
    state,
    status,
    ext_num
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE apartments
      SET
        postal_code = $1,
        street = $2,
        division = $3,
        int_num = $4,
        name = $5,
        city = $6,
        state = $7,
        status = $8,
        ext_num = $11
      WHERE id = $9 AND ownerid = $10
      RETURNING *
      `,
      [
        postal_code,
        street,
        division,
        int_num,
        name,
        city,
        state,
        status,
        id,
        ownerId,
        ext_num
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});
// DELETE an apartment
router.delete('/apartments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM apartments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    res.json({ message: `Apartment ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
