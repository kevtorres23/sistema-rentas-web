import pool from "./db.js";

export const guardarNotificacion = async ({
  tenantId = null,
  tenantName = null,
  apartmentId = null,
  apartmentLabel = null,
  tipo,
  mensaje,
  estado = "SENT",
  fechaEnvio = null,
} = {}) => {
  const sentAt = fechaEnvio ? new Date(fechaEnvio) : new Date();

  const result = await pool.query(
    `
      INSERT INTO notifications_history
        (tenant_id, tenant_name, apartment_id, apartment_label, message_type, message, status, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      tenantId,
      tenantName,
      apartmentId,
      apartmentLabel,
      tipo,
      mensaje,
      estado,
      sentAt,
    ]
  );

  return result.rows[0];
};

export const obtenerHistorial = async ({
  tenantId = null,
  tenantName = null,
  limit = 100,
  offset = 0,
} = {}) => {
  const filtros = [];
  const valores = [];

  if (tenantId) {
    valores.push(tenantId);
    filtros.push(`tenant_id = $${valores.length}`);
  }

  if (tenantName) {
    valores.push(`%${tenantName}%`);
    filtros.push(`tenant_name ILIKE $${valores.length}`);
  }

  valores.push(limit);
  valores.push(offset);

  const whereClause = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

  const result = await pool.query(
    `
      SELECT *
      FROM notifications_history
      ${whereClause}
      ORDER BY sent_at DESC
      LIMIT $${valores.length - 1} OFFSET $${valores.length}
    `,
    valores
  );

  return result.rows;
};

export const obtenerPorArrendatario = async (tenantIdOrName) => {
  if (!tenantIdOrName) return [];

  const esNumero = /^[0-9]+$/.test(String(tenantIdOrName));

  return obtenerHistorial({
    tenantId: esNumero ? Number(tenantIdOrName) : null,
    tenantName: esNumero ? null : tenantIdOrName,
  });
};

export default {
  guardarNotificacion,
  obtenerHistorial,
  obtenerPorArrendatario,
};
