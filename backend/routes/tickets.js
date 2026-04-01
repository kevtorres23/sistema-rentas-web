import { Router } from "express";
import pool from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import plantillas from "../Plantillas.js";
import { guardarNotificacion } from "../HistorialNotif.js";

const router = Router();

const ESTATUS_VALIDOS = ["ABIERTO", "EN_PROCESO", "EN_ESPERA", "RESUELTO"];

const normalizarEstatus = (estatus) => {
  const upper = String(estatus || "").toUpperCase();
  return ESTATUS_VALIDOS.includes(upper) ? upper : null;
};

const construirMensajeTicket = ({ estatus, ticketId, nombre, responsable, motivo }) => {
  if (estatus === "EN_PROCESO" && responsable) {
    return plantillas.ticketAsignado({ nombre, ticketId, responsable });
  }
  if (estatus === "EN_PROCESO") {
    return plantillas.ticketEnProceso({ nombre, ticketId });
  }
  if (estatus === "EN_ESPERA") {
    return plantillas.ticketEnEspera({ nombre, ticketId, motivo });
  }
  if (estatus === "RESUELTO") {
    return plantillas.ticketResuelto({ nombre, ticketId });
  }
  return "";
};

const UPLOAD_ROOT = path.resolve("backend", "uploads", "tickets");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EXTENSIONS_VALIDAS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mov",
]);

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_ROOT);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const random = crypto.randomBytes(8).toString("hex");
    cb(null, `ticket_${req.params.id}_${Date.now()}_${random}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXTENSIONS_VALIDAS.has(ext)) {
      return cb(
        new Error("Tipo de archivo no permitido. Usa imagen o video.")
      );
    }
    cb(null, true);
  },
});

// Crear ticket
router.post("/tickets", async (req, res) => {
  try {
    const {
      descripcion,
      apartmentId,
      apartment_id,
      apartmentLabel,
      apartment_label,
      tenantId,
      tenant_id,
      tenantName,
      tenant_name,
      estatus,
      responsable,
    } = req.body || {};

    if (!descripcion) {
      return res.status(400).json({ error: "Descripcion requerida" });
    }

    const estatusFinal = normalizarEstatus(estatus) || "ABIERTO";

    const result = await pool.query(
      `
        INSERT INTO maintenance_tickets
          (apartment_id, apartment_label, tenant_id, tenant_name, descripcion, estatus, responsable, fecha_asignacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        apartmentId ?? apartment_id ?? null,
        apartmentLabel ?? apartment_label ?? null,
        tenantId ?? tenant_id ?? null,
        tenantName ?? tenant_name ?? null,
        descripcion,
        estatusFinal,
        responsable || null,
        responsable ? new Date() : null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creando ticket:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Ver todos los tickets
router.get("/tickets", async (req, res) => {
  try {
    const { estatus } = req.query;
    const estatusNormalizado = estatus ? normalizarEstatus(estatus) : null;

    if (estatus && !estatusNormalizado) {
      return res.status(400).json({ error: "Estatus invalido" });
    }

    const filtros = [];
    const valores = [];

    if (estatusNormalizado) {
      valores.push(estatusNormalizado);
      filtros.push(`estatus = $${valores.length}`);
    }

    const whereClause = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const result = await pool.query(
      `
        SELECT *
        FROM maintenance_tickets
        ${whereClause}
        ORDER BY fecha_creacion DESC
      `,
      valores
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Error consultando tickets:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Ver ticket por ID
router.get("/tickets/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query(
      "SELECT * FROM maintenance_tickets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Error consultando ticket:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Asignar ticket a tecnico/responsable
router.put("/tickets/:id/asignar", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { responsable, estatus, motivo } = req.body || {};

    if (!responsable) {
      return res.status(400).json({ error: "Responsable requerido" });
    }

    const estatusFinal = normalizarEstatus(estatus) || "EN_PROCESO";

    const result = await pool.query(
      `
        UPDATE maintenance_tickets
        SET responsable = $1,
            estatus = $2,
            fecha_asignacion = COALESCE(fecha_asignacion, NOW()),
            fecha_actualizacion = NOW()
        WHERE id = $3
        RETURNING *
      `,
      [responsable, estatusFinal, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const ticket = result.rows[0];
    const tenantName = ticket.tenant_name || "Arrendatario";
    const mensaje = construirMensajeTicket({
      estatus: ticket.estatus,
      ticketId: ticket.id,
      nombre: tenantName,
      responsable,
      motivo,
    });

    if (mensaje) {
      await guardarNotificacion({
        tenantId: ticket.tenant_id,
        tenantName,
        apartmentId: ticket.apartment_id,
        apartmentLabel: ticket.apartment_label,
        tipo: ticket.estatus,
        mensaje,
        estado: "SENT",
      });
    }

    return res.json(ticket);
  } catch (err) {
    console.error("Error asignando ticket:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Cambiar estatus
router.put("/tickets/:id/estatus", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const estatusFinal = normalizarEstatus(req.body?.estatus);
    const motivo = req.body?.motivo || null;

    if (!estatusFinal) {
      return res.status(400).json({ error: "Estatus invalido" });
    }

    const result = await pool.query(
      `
        UPDATE maintenance_tickets
        SET estatus = $1,
            fecha_actualizacion = NOW(),
            fecha_resolucion = CASE WHEN $1 = 'RESUELTO' THEN NOW() ELSE fecha_resolucion END
        WHERE id = $2
        RETURNING *
      `,
      [estatusFinal, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const ticket = result.rows[0];
    const tenantName = ticket.tenant_name || "Arrendatario";
    const mensaje = construirMensajeTicket({
      estatus: ticket.estatus,
      ticketId: ticket.id,
      nombre: tenantName,
      responsable: ticket.responsable,
      motivo,
    });

    if (mensaje) {
      await guardarNotificacion({
        tenantId: ticket.tenant_id,
        tenantName,
        apartmentId: ticket.apartment_id,
        apartmentLabel: ticket.apartment_label,
        tipo: ticket.estatus,
        mensaje,
        estado: "SENT",
      });
    }

    return res.json(ticket);
  } catch (err) {
    console.error("Error cambiando estatus:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Adjuntar archivo multimedia al ticket
router.post(
  "/tickets/:id/media",
  upload.single("media"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!req.file) {
        return res.status(400).json({ error: "Archivo requerido" });
      }

      const ticketRes = await pool.query(
        "SELECT id FROM maintenance_tickets WHERE id = $1",
        [id]
      );
      if (ticketRes.rows.length === 0) {
        return res.status(404).json({ error: "Ticket no encontrado" });
      }

      const archivo = req.file;
      const tipoMime = archivo.mimetype || "application/octet-stream";
      const tipo = tipoMime.startsWith("video/") ? "VIDEO" : "IMAGEN";

      const result = await pool.query(
        `
          INSERT INTO maintenance_ticket_media
            (ticket_id, filename, original_name, mime_type, file_size, storage_path, tipo)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
        [
          id,
          archivo.filename,
          archivo.originalname,
          tipoMime,
          archivo.size,
          archivo.path,
          tipo,
        ]
      );

      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error subiendo archivo:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }
);

// Listar archivos asociados a un ticket
router.get("/tickets/:id/media", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query(
      `
        SELECT *
        FROM maintenance_ticket_media
        WHERE ticket_id = $1
        ORDER BY created_at DESC
      `,
      [id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Error consultando media:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Descargar archivo por id de media
router.get("/tickets/media/:mediaId", async (req, res) => {
  try {
    const mediaId = Number(req.params.mediaId);
    const result = await pool.query(
      "SELECT * FROM maintenance_ticket_media WHERE id = $1",
      [mediaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    const media = result.rows[0];
    return res.sendFile(path.resolve(media.storage_path));
  } catch (err) {
    console.error("Error descargando media:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
