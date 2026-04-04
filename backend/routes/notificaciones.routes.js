import { Router } from "express";
import pool from "../db.js";
import {
  guardarNotificacion,
  obtenerHistorial,
  obtenerPorArrendatario,
} from "../HistorialNotif.js";
import { generarNotificaciones } from "../Notificaciones.js";

const router = Router();
const UNDEFINED_COLUMN = "42703";

const obtenerPagosPendientes = async () => {
  try {
    const result = await pool.query(
      `
        SELECT
          i.id AS invoice_id,
          i.amount AS monto,
          i.duedate AS vencimiento,
          i.status,
          rc.id AS contract_id,
          t.id AS tenant_id,
          t.name AS nombre,
          a.id AS apartment_id,
          a.address AS apartamento
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.id
      `
    );
    return result.rows;
  } catch (err) {
    if (err?.code !== UNDEFINED_COLUMN) throw err;

    const result = await pool.query(
      `
        SELECT
          i.invoiceid AS invoice_id,
          i.amount AS monto,
          i.duedate AS vencimiento,
          i.status,
          rc.contractid AS contract_id,
          t.tenantid AS tenant_id,
          t.name AS nombre,
          a.apartmentid AS apartment_id,
          a.address AS apartamento
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.contractid
        JOIN tenants t ON rc.tenantid = t.tenantid
        JOIN apartments a ON rc.apartmentid = a.apartmentid
      `
    );
    return result.rows;
  }
};

router.get("/notificaciones/historial", async (req, res) => {
  try {
    const { tenant_id: tenantId, tenant_name: tenantName, limit, offset } =
      req.query;

    const historial = await obtenerHistorial({
      tenantId: tenantId ? Number(tenantId) : null,
      tenantName: tenantName || null,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });

    return res.json(historial);
  } catch (err) {
    console.error("Error consultando historial de notificaciones:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/notificaciones/historial/:tenantId", async (req, res) => {
  try {
    const historial = await obtenerPorArrendatario(req.params.tenantId);
    return res.json(historial);
  } catch (err) {
    console.error("Error consultando historial por arrendatario:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/notificaciones/registrar", async (req, res) => {
  try {
    const registro = await guardarNotificacion(req.body);
    return res.status(201).json(registro);
  } catch (err) {
    console.error("Error registrando notificacion:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/notificaciones/generar-pagos", async (req, res) => {
  try {
    const { diasAviso = 10, guardar = true } = req.body || {};

    const pagos = await obtenerPagosPendientes();
    const pagosPendientes = pagos.filter(
      (pago) => String(pago.status).toUpperCase() !== "PAID"
    );

    const alertas = generarNotificaciones(
      pagosPendientes,
      Number(diasAviso) || 10
    );

    let guardadas = 0;
    if (guardar) {
      for (const alerta of alertas) {
        await guardarNotificacion({
          tenantId: alerta.tenant_id || null,
          tenantName: alerta.nombre,
          apartmentId: alerta.apartment_id || null,
          apartmentLabel: alerta.apartamento,
          tipo: alerta.estado,
          mensaje: alerta.mensaje,
          estado: "SENT",
        });
        guardadas += 1;
      }
    }

    return res.json({
      total_generadas: alertas.length,
      total_guardadas: guardadas,
      notificaciones: alertas,
    });
  } catch (err) {
    console.error("Error generando notificaciones:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
