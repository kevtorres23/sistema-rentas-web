import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();
const UNDEFINED_COLUMN = '42703';
const UPLOAD_ROOT = path.resolve('backend', 'uploads', 'maintenancerequests');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EXTENSIONS_VALIDAS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.mp4',
  '.webm',
  '.mov',
]);

let maintenanceRequestsReadyPromise = null;

const ensureMaintenanceRequestsTable = async () => {
  if (!maintenanceRequestsReadyPromise) {
    maintenanceRequestsReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS maintenancerequests (
        requestid SERIAL PRIMARY KEY,
        apartmentid INT NOT NULL,
        tenantid INT,
        requestdate DATE NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        completiondate DATE
      )
    `)
      .then(() =>
        pool.query(`
          CREATE TABLE IF NOT EXISTS maintenancerequest_media (
            id SERIAL PRIMARY KEY,
            request_id INT NOT NULL REFERENCES maintenancerequests(requestid) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_size INT NOT NULL,
            storage_path TEXT NOT NULL,
            tipo VARCHAR(10) CHECK (tipo IN ('IMAGEN','VIDEO')) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `)
      )
      .catch((err) => {
        maintenanceRequestsReadyPromise = null;
        throw err;
      });
  }

  return maintenanceRequestsReadyPromise;
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXTENSIONS_VALIDAS.has(ext)) {
      return cb(new Error('Tipo de archivo no permitido. Usa imagen o video.'));
    }
    cb(null, true);
  },
});

const obtenerUsuarioDesdeToken = (req) => {
  const header = req.headers.authorization;
  const token = header?.split(' ')[1] || req.query?.token;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const normalizeStatus = (status) =>
  String(status || 'PENDING').toUpperCase() === 'COMPLETED' ? 'resuelta' : 'pendiente';

const mapRequestRow = (row) => ({
  id: row.request_id,
  apartmentid: row.apartment_id,
  tenantid: row.tenant_id,
  status: normalizeStatus(row.status),
  fecha: row.request_date,
  descripcion: row.description,
  completiondate: row.completion_date,
  ubicacion: row.apartment_address || 'Sin ubicacion',
  arrendatario: row.tenant_name || 'Sin asignar',
  avatar: null,
  img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
  media: Array.isArray(row.media) ? row.media : [],
});

const getMediaByRequestIds = async (requestIds) => {
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return new Map();
  }

  const result = await pool.query(
    `
      SELECT *
      FROM maintenancerequest_media
      WHERE request_id = ANY($1::int[])
      ORDER BY request_id ASC, created_at DESC
    `,
    [requestIds]
  );

  const mediaByRequestId = new Map();

  result.rows.forEach((row) => {
    const key = Number(row.request_id);
    if (!mediaByRequestId.has(key)) {
      mediaByRequestId.set(key, []);
    }
    mediaByRequestId.get(key).push(row);
  });

  return mediaByRequestId;
};

const runRequestsQuery = async (role, userId) => {
  await ensureMaintenanceRequestsTable();

  const ownerFilter = role === 'owner';
  const whereClause = ownerFilter
    ? 'WHERE a.ownerid = $1'
    : 'WHERE mr.tenantid = $1';

  const queryWithCurrentColumns = `
    SELECT
      mr.requestid AS request_id,
      mr.apartmentid AS apartment_id,
      mr.tenantid AS tenant_id,
      mr.requestdate AS request_date,
      mr.description,
      mr.status,
      mr.completiondate AS completion_date,
      CONCAT_WS(', ', a.street, a.division, a.int_num, a.city, a.state, a.postal_code) AS apartment_address,
      t.name AS tenant_name
    FROM maintenancerequests mr
    JOIN apartments a ON a.id = mr.apartmentid
    LEFT JOIN tenants t ON t.id = mr.tenantid
    ${whereClause}
    ORDER BY mr.requestdate DESC, mr.requestid DESC
  `;

  const queryWithLegacyColumns = `
    SELECT
      mr.requestid AS request_id,
      mr.apartmentid AS apartment_id,
      mr.tenantid AS tenant_id,
      mr.requestdate AS request_date,
      mr.description,
      mr.status,
      mr.completiondate AS completion_date,
      a.address AS apartment_address,
      t.name AS tenant_name
    FROM maintenancerequests mr
    JOIN apartments a ON a.apartmentid = mr.apartmentid
    LEFT JOIN tenants t ON t.tenantid = mr.tenantid
    ${whereClause}
    ORDER BY mr.requestdate DESC, mr.requestid DESC
  `;

  try {
    return await pool.query(queryWithCurrentColumns, [userId]);
  } catch (err) {
    if (err?.code !== UNDEFINED_COLUMN) {
      throw err;
    }
    return pool.query(queryWithLegacyColumns, [userId]);
  }
};

const getRequestAccessInfo = async (requestId) => {
  const queryCurrent = `
    SELECT
      mr.requestid AS request_id,
      mr.tenantid AS tenant_id,
      a.ownerid AS owner_id
    FROM maintenancerequests mr
    JOIN apartments a ON a.id = mr.apartmentid
    WHERE mr.requestid = $1
  `;

  const queryLegacy = `
    SELECT
      mr.requestid AS request_id,
      mr.tenantid AS tenant_id,
      a.ownerid AS owner_id
    FROM maintenancerequests mr
    JOIN apartments a ON a.apartmentid = mr.apartmentid
    WHERE mr.requestid = $1
  `;

  try {
    const result = await pool.query(queryCurrent, [requestId]);
    return result.rows[0] || null;
  } catch (err) {
    if (err?.code !== UNDEFINED_COLUMN) {
      throw err;
    }
    const result = await pool.query(queryLegacy, [requestId]);
    return result.rows[0] || null;
  }
};

const findTenantApartmentId = async (tenantId) => {
  const queryCurrent = `
    SELECT rc.apartmentid
    FROM rentalcontracts rc
    WHERE rc.tenantid = $1
    ORDER BY rc.startdate DESC NULLS LAST, rc.id DESC
    LIMIT 1
  `;

  const queryLegacy = `
    SELECT rc.apartmentid
    FROM rentalcontracts rc
    WHERE rc.tenantid = $1
    ORDER BY rc.startdate DESC NULLS LAST, rc.contractid DESC
    LIMIT 1
  `;

  try {
    const result = await pool.query(queryCurrent, [tenantId]);
    return result.rows[0]?.apartmentid ?? null;
  } catch (err) {
    if (err?.code !== UNDEFINED_COLUMN) {
      throw err;
    }
    const result = await pool.query(queryLegacy, [tenantId]);
    return result.rows[0]?.apartmentid ?? null;
  }
};

router.get('/maintenancerequests', authMiddleware, async (req, res) => {
  try {
    await ensureMaintenanceRequestsTable();
    const result = await runRequestsQuery(req.user.role, req.user.id);
    const requestIds = result.rows
      .map((row) => Number(row.request_id))
      .filter((id) => Number.isInteger(id));
    const mediaByRequestId = await getMediaByRequestIds(requestIds);

    res.json(
      result.rows.map((row) =>
        mapRequestRow({
          ...row,
          media: mediaByRequestId.get(Number(row.request_id)) || [],
        })
      )
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/maintenancerequests', authMiddleware, async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can create maintenance requests' });
  }

  const description = req.body.description?.trim();

  if (!description) {
    return res.status(400).json({ message: 'description is required' });
  }

  try {
    await ensureMaintenanceRequestsTable();
    const apartmentid = await findTenantApartmentId(req.user.id);

    if (!apartmentid) {
      return res.status(400).json({ message: 'No active apartment found for this tenant' });
    }

    const insertResult = await pool.query(
      `
      INSERT INTO maintenancerequests (apartmentid, tenantid, requestdate, description, status, completiondate)
      VALUES ($1, $2, CURRENT_DATE, $3, 'PENDING', NULL)
      RETURNING requestid
      `,
      [apartmentid, req.user.id, description]
    );

    const allRequests = await runRequestsQuery('tenant', req.user.id);
    const created = allRequests.rows.find(
      (row) => row.request_id === insertResult.rows[0].requestid
    );

    res.status(201).json(created ? mapRequestRow(created) : { id: insertResult.rows[0].requestid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/maintenancerequests/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'User role not allowed to update request status' });
  }

  const { id } = req.params;
  const status = req.body.status === 'resuelta' ? 'COMPLETED' : req.body.status === 'pendiente' ? 'PENDING' : null;

  if (!status) {
    return res.status(400).json({ message: 'status must be resuelta or pendiente' });
  }

  const completionValue = status === 'COMPLETED' ? 'CURRENT_DATE' : 'NULL';

  try {
    await ensureMaintenanceRequestsTable();
    const result = await pool.query(
      `
      UPDATE maintenancerequests
      SET status = $1, completiondate = ${completionValue}
      WHERE requestid = $2
        AND tenantid = $3
      RETURNING requestid
      `,
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const allRequests = await runRequestsQuery('tenant', req.user.id);
    const updated = allRequests.rows.find(
      (row) => row.request_id === result.rows[0].requestid
    );

    res.json(updated ? mapRequestRow(updated) : { id: Number(id), status: normalizeStatus(status) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post(
  '/maintenancerequests/:id/media',
  authMiddleware,
  upload.array('media', 8),
  async (req, res) => {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can upload media' });
    }

    try {
      await ensureMaintenanceRequestsTable();
      const requestId = Number(req.params.id);

      if (!requestId) {
        return res.status(400).json({ message: 'Invalid request id' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Archivo requerido' });
      }

      const access = await getRequestAccessInfo(requestId);
      if (!access || Number(access.tenant_id) !== Number(req.user.id)) {
        return res.status(404).json({ message: 'Request not found' });
      }

      const insertPromises = req.files.map(async (file) => {
        const tipoMime = file.mimetype || 'application/octet-stream';
        const tipo = tipoMime.startsWith('video/') ? 'VIDEO' : 'IMAGEN';

        const ext = path.extname(file.originalname).toLowerCase();
        const random = crypto.randomBytes(8).toString('hex');
        const uniqueName = `request_${requestId}_${Date.now()}_${random}${ext}`;

        const { error } = await supabase.storage
          .from('maintenancerequests')
          .upload(uniqueName, file.buffer, {
            contentType: tipoMime,
            upsert: false
          });

        if (error) {
          throw error;
        }

        const { data: publicUrlData } = supabase.storage
          .from('maintenancerequests')
          .getPublicUrl(uniqueName);

        const storagePath = publicUrlData.publicUrl;

        return pool.query(
          `
            INSERT INTO maintenancerequest_media
              (request_id, filename, original_name, mime_type, file_size, storage_path, tipo)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `,
          [
            requestId,
            uniqueName,
            file.originalname,
            tipoMime,
            file.size,
            storagePath,
            tipo,
          ]
        );
      });

      const results = await Promise.all(insertPromises);
      const created = results.map((result) => result.rows[0]);

      return res.status(201).json(created);
    } catch (err) {
      console.error('Error subiendo archivo:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }
);

router.get('/maintenancerequests/:id/media', authMiddleware, async (req, res) => {
  try {
    await ensureMaintenanceRequestsTable();
    const requestId = Number(req.params.id);
    const access = await getRequestAccessInfo(requestId);

    if (!access) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (
      (req.user.role === 'tenant' && Number(access.tenant_id) !== Number(req.user.id)) ||
      (req.user.role === 'owner' && Number(access.owner_id) !== Number(req.user.id))
    ) {
      return res.status(403).json({ message: 'Not authorized to view media' });
    }

    const result = await pool.query(
      `
        SELECT *
        FROM maintenancerequest_media
        WHERE request_id = $1
        ORDER BY created_at DESC
      `,
      [requestId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error consultando media:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/maintenancerequests/media/:mediaId', async (req, res) => {
  try {
    await ensureMaintenanceRequestsTable();
    const mediaId = Number(req.params.mediaId);
    const user = obtenerUsuarioDesdeToken(req);

    if (!user) {
      return res.status(401).json({ message: 'Token missing or invalid' });
    }

    const queryCurrent = `
      SELECT m.*, mr.tenantid AS tenant_id, a.ownerid AS owner_id
      FROM maintenancerequest_media m
      JOIN maintenancerequests mr ON mr.requestid = m.request_id
      JOIN apartments a ON a.id = mr.apartmentid
      WHERE m.id = $1
    `;

    const queryLegacy = `
      SELECT m.*, mr.tenantid AS tenant_id, a.ownerid AS owner_id
      FROM maintenancerequest_media m
      JOIN maintenancerequests mr ON mr.requestid = m.request_id
      JOIN apartments a ON a.apartmentid = mr.apartmentid
      WHERE m.id = $1
    `;

    let result;
    try {
      result = await pool.query(queryCurrent, [mediaId]);
    } catch (err) {
      if (err?.code !== UNDEFINED_COLUMN) {
        throw err;
      }
      result = await pool.query(queryLegacy, [mediaId]);
    }

    if (!result || result.rows.length === 0) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    const media = result.rows[0];
    if (
      (user.role === 'tenant' && Number(media.tenant_id) !== Number(user.id)) ||
      (user.role === 'owner' && Number(media.owner_id) !== Number(user.id))
    ) {
      return res.status(403).json({ message: 'Not authorized to view media' });
    }

    if (media.storage_path && media.storage_path.startsWith('http')) {
      return res.redirect(media.storage_path);
    }
    return res.sendFile(path.resolve(media.storage_path));
  } catch (err) {
    console.error('Error descargando media:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
