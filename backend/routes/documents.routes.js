// routes/documents.routes.js
import { Router } from 'express';
import pool from '../db.js';  // adjust path if needed

import express from 'express';
import multer from "multer";
import { createClient } from '@supabase/supabase-js';

const router = Router();

// ⚙️ Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ⚙️ Configure multer to use memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📤 Upload route (single file) to Supabase
router.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Prepare unique filename
    const uniqueName = Date.now() + "-" + file.originalname;

    // Upload to Supabase 'contracts' bucket
    const { data, error } = await supabase.storage
      .from('Documents')
      .upload(uniqueName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get the public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from('Documents')
      .getPublicUrl(uniqueName);

    res.json({
      message: "File uploaded successfully to Supabase",
      filename: uniqueName,
      path: publicUrlData.publicUrl
    });
  } catch (error) {
    console.error("Supabase upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/documents/contract/:contractId", async (req, res) => {
  const { contractId } = req.params;

  try {
    // 1. Get document from DB
    const result = await pool.query(
      `SELECT filename FROM documents WHERE contractid = $1 LIMIT 1`,
      [contractId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const { filename } = result.rows[0];

    // 2. Generate signed URL
    const { data, error } = await supabase.storage
      .from("Documents")
      .createSignedUrl(filename, 60); // 60 sec

    if (error) throw error;

    // 3. Return URL
    res.json({
      url: data.signedUrl,
      filename
    });

  } catch (error) {
    console.error("Error getting document:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET all documents
router.get('/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ CREATE document
router.post('/documents', async (req, res) => {
  const { contractid, type, filepath } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO documents (contractid, type, filepath)
       VALUES ($1, $2, $3) RETURNING *`,
      [contractid, type, filepath]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE document
router.put('/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { contractid, type, filepath } = req.body;
  try {
    const result = await pool.query(
      `UPDATE documents
       SET contractid = $1, type = $2, filepath = $3
       WHERE documentid = $4 RETURNING *`,
      [contractid, type, filepath, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE document
router.delete('/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE documentid = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ message: `Document ${id} deleted`, document: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
