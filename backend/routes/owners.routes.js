// routes/owners.routes.js
import { Router } from 'express';
import pool from '../db.js';  // adjust path if needed
import {hash, compare} from 'bcryptjs';
import {JWT_EXPIRES_IN, JWT_SECRET} from '../config.js'
import jwt from "jsonwebtoken";

const router = Router();


// GET all owners
router.get('/owners', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM owners');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// GET owner by ID
router.get('/owners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM owners WHERE ownerid = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// CREATE owner
router.post('/owners', async (req, res) => {
  const { name, phone, email, governmentid, password} = req.body;
  
  const passwordhash = await hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO owners (name, phone, email, governmentid, passwordhash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, phone, email, governmentid, passwordhash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// UPDATE owner
router.put('/owners/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, governmentid, password} = req.body;
  
  const passwordhash = await hash(password, 10);
  try {
    const result = await pool.query(
      `UPDATE owners
       SET name = $1, phone = $2, email = $3, governmentid = $4, passwordhash = $5
       WHERE ownerid = $6 RETURNING *`,
      [name, phone, email, governmentid, passwordhash, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// DELETE owner
router.delete('/owners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM owners WHERE ownerid = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    res.json({ message: `Owner ${id} deleted`, owner: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    const ownerResult = await pool.query(
      `SELECT * FROM owners WHERE name = $1`,
      [name]
    );

    let ownerFound = false;
    if (ownerResult.rows.length > 0) {
      ownerFound = true;
      const owner = ownerResult.rows[0];
      const validPassword = await compare(password, owner.passwordhash);

      if (validPassword) {
        const ownerId = owner.id ?? owner.ownerid;

        const token = jwt.sign(
          {
            id: ownerId,
            name: owner.name,
            role: 'owner'
          },
          JWT_SECRET,
          {
            expiresIn: JWT_EXPIRES_IN || "1d"
          }
        );

        return res.status(200).json({
          message: "Login successful",
          token,
          user: {
            id: ownerId,
            name: owner.name,
            role: 'owner'
          }
        });
      }
    }

    const tenantResult = await pool.query(
      `SELECT * FROM tenants WHERE name = $1`,
      [name]
    );

    if (tenantResult.rows.length === 0) {
      if (ownerFound) {
        return res.status(401).json({ message: "Wrong password" });
      }
      return res.status(404).json({ message: "Name not found" });
    }

    const tenant = tenantResult.rows[0];
    const validPassword = await compare(password, tenant.passwordhash);

    if (!validPassword) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const tenantId = tenant.id ?? tenant.tenantid;

    const token = jwt.sign(
      {
        id: tenantId,
        name: tenant.name,
        role: 'tenant'
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN || "1d"
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: tenantId,
        name: tenant.name,
        role: 'tenant'
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
