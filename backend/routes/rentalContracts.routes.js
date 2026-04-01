// routes/rentalcontracts.routes.js
import { Router } from 'express';
import pool from '../db.js';
import { createClient } from '@supabase/supabase-js';
import multer from "multer";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

// ⚙️ Configure multer to use memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

const getMonthsDuration = (startdate, enddate) => {
  if (!startdate) {
    return 1;
  }

  if (!enddate) {
    return 1;
  }

  const start = new Date(startdate);
  const end = new Date(enddate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }

  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();

  return Math.max(1, years * 12 + months + 1);
};

// GET all contracts
router.get('/rentalcontracts', async (req, res) => {
  try {
    const result = await pool.query("SELECT  c.id, a.name, t.name as tenantname, c.startdate, c.enddate, c.depositamount FROM rentalcontracts c INNER JOIN apartments a ON c.apartmentid = a.id INNER JOIN tenants t ON c.tenantid = t.id;");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET contract by ID
router.get('/rentalcontracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM rentalcontracts WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/rentalcontracts', upload.single("file"), async (req, res) => {
  let {
    apartmentid,
    tenant,
    guarantor,
    startdate,
    enddate,
    depositamount,
    status
  } = req.body;

  if (typeof tenant === 'string') {
    try { tenant = JSON.parse(tenant); } catch (e) { }
  }
  if (typeof guarantor === 'string') {
    try { guarantor = JSON.parse(guarantor); } catch (e) { }
  }

  const file = req.file;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -------- TENANT UPSERT -------- */
    const existingTenant = await client.query(
      `SELECT id FROM tenants WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [tenant.name]
    );

    let tenantId;

    if (existingTenant.rows.length > 0) {
      tenantId = existingTenant.rows[0].id;

      await client.query(
        `UPDATE tenants
         SET email = COALESCE($1, email),
             phone = COALESCE($2, phone)
         WHERE id = $3`,
        [tenant.email || null, tenant.phone || null, tenantId]
      );
    } else {
      const tenantInsert = await client.query(
        `INSERT INTO tenants (name, email, phone, governmentid, passwordhash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          tenant.name,
          tenant.email || null,
          tenant.phone || null,
          tenant.governmentid || `TEMP-${Date.now()}`,
          tenant.passwordhash || 'TEMP_PASSWORDHASH'
        ]
      );

      tenantId = tenantInsert.rows[0].id;
    }

    /* -------- GUARANTOR UPSERT -------- */
    let guarantorId = null;

    if (guarantor?.name) {
      const existingGuarantor = await client.query(
        `SELECT id FROM guarantors WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [guarantor.name]
      );

      if (existingGuarantor.rows.length > 0) {
        guarantorId = existingGuarantor.rows[0].id;

        await client.query(
          `UPDATE guarantors
           SET address = COALESCE($1, address),
               email = COALESCE($2, email),
               phone = COALESCE($3, phone)
           WHERE id = $4`,
          [
            guarantor.address || null,
            guarantor.email || null,
            guarantor.phone || null,
            guarantorId
          ]
        );
      } else {
        const guarantorInsert = await client.query(
          `INSERT INTO guarantors (name, address, email, phone, governmentid)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            guarantor.name,
            guarantor.address || null,
            guarantor.email || null,
            guarantor.phone || null,
            guarantor.governmentid || `TEMP-${Date.now()}`
          ]
        );

        guarantorId = guarantorInsert.rows[0].id;
      }
    }

    /* -------- CONTRACT INSERT -------- */
    const contractResult = await client.query(
      `INSERT INTO rentalcontracts
       (apartmentid, tenantid, guarantorid, startdate, enddate, depositamount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        apartmentid,
        tenantId,
        guarantorId,
        startdate,
        enddate || null,
        depositamount || null,
        status || "ACTIVE"
      ]
    );

    const contract = contractResult.rows[0];

    /* -------- FILE UPLOAD -------- */
    let fileUrl = null;

    if (file) {
      const uniqueName = `${Date.now()}-${file.originalname}`;

      const { error } = await supabase.storage
        .from('Documents')
        .upload(uniqueName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('Documents')
        .getPublicUrl(uniqueName);

      fileUrl = publicUrlData.publicUrl;

      // OPTIONAL: store file in DB
      await client.query(
        `INSERT INTO documents (contractid, fileurl, filename)
         VALUES ($1, $2, $3)`,
        [contract.id, fileUrl, uniqueName]
      );
    }

    /* -------- INVOICES -------- */
    const start = new Date(startdate);
    const monthlyAmount = depositamount || 0;
    const monthsDuration = getMonthsDuration(startdate, enddate);

    for (let i = 1; i < monthsDuration; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);

      await client.query(
        `INSERT INTO invoices (contractid, amount, duedate, status)
         VALUES ($1, $2, $3, $4)`,
        [contract.id, monthlyAmount, dueDate, "PENDING"]
      );
    }

    /* -------- UPDATE APARTMENT -------- */
    await client.query(
      `UPDATE apartments SET status = 'OCCUPIED' WHERE id = $1`,
      [apartmentid]
    );

    await client.query("COMMIT");

    res.status(201).json({
      contract,
      fileUrl
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });

  } finally {
    client.release();
  }
});

// UPDATE contract
router.put('/rentalcontracts/:id', async (req, res) => {
  const { id } = req.params;
  const { apartmentid, tenantid, guarantorid, startdate, enddate, depositamount, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rentalcontracts
       SET apartmentid = $1, tenantid = $2, guarantorid = $3, startdate = $4, enddate = $5, depositamount = $6, status = $7
       WHERE id = $8 RETURNING *`,
      [apartmentid, tenantid, guarantorid || null, startdate, enddate || null, depositamount || null, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE contract
router.delete('/rentalcontracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM rentalcontracts WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json({ message: `Contract ${id} deleted`, contract: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
