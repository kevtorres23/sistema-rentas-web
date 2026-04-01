import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
const UNDEFINED_COLUMN = '42703';

const runWithFallback = async (primaryQuery, fallbackQuery, values) => {
  try {
    return await pool.query(primaryQuery, values);
  } catch (err) {
    if (err?.code !== UNDEFINED_COLUMN || !fallbackQuery) {
      throw err;
    }
    return pool.query(fallbackQuery, values);
  }
};

const parseMoney = (value) => Number.parseFloat(value || 0) || 0;
const parseCount = (value) => Number.parseInt(value || 0, 10) || 0;
const toSqlDate = (date) => date.toISOString().slice(0, 10);

router.get('/dashboard/admin', authMiddleware, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const month = Number.parseInt(req.query.month, 10);
    const year = Number.parseInt(req.query.year, 10) || new Date().getFullYear();
    const hasMonthFilter = Number.isInteger(month) && month >= 1 && month <= 12;

    const start = hasMonthFilter ? new Date(Date.UTC(year, month - 1, 1)) : null;
    const end = hasMonthFilter ? new Date(Date.UTC(year, month, 1)) : null;
    const startDate = start ? toSqlDate(start) : null;
    const endDate = end ? toSqlDate(end) : null;
    const values = hasMonthFilter ? [ownerId, startDate, endDate] : [ownerId];

    const gainsDateFilter = hasMonthFilter
      ? `AND i.duedate >= $2 AND i.duedate < $3`
      : `AND DATE_TRUNC('month', i.duedate) = DATE_TRUNC('month', CURRENT_DATE)`;

    const invoicesDateFilter = hasMonthFilter
      ? `AND i.duedate >= $2 AND i.duedate < $3`
      : ``;

    const incomeDateFilter = hasMonthFilter
      ? `AND i.duedate >= $2 AND i.duedate < $3`
      : `AND i.duedate >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'`;

    const requestDateFilter = hasMonthFilter
      ? `AND mr.requestdate >= $2 AND mr.requestdate < $3`
      : ``;

    const occupiedJoinCurrent = hasMonthFilter
      ? `
        LEFT JOIN LATERAL (
          SELECT id
          FROM rentalcontracts
          WHERE apartmentid = a.id
            AND status = 'ACTIVE'
            AND startdate < $3
            AND (enddate IS NULL OR enddate >= $2)
          ORDER BY startdate DESC NULLS LAST, id DESC
          LIMIT 1
        ) rc ON true
      `
      : `
        LEFT JOIN LATERAL (
          SELECT id
          FROM rentalcontracts
          WHERE apartmentid = a.id AND status = 'ACTIVE'
          ORDER BY startdate DESC NULLS LAST, id DESC
          LIMIT 1
        ) rc ON true
      `;

    const occupiedJoinLegacy = hasMonthFilter
      ? `
        LEFT JOIN LATERAL (
          SELECT contractid
          FROM rentalcontracts
          WHERE apartmentid = a.apartmentid
            AND status = 'ACTIVE'
            AND startdate < $3
            AND (enddate IS NULL OR enddate >= $2)
          ORDER BY startdate DESC NULLS LAST, contractid DESC
          LIMIT 1
        ) rc ON true
      `
      : `
        LEFT JOIN LATERAL (
          SELECT contractid
          FROM rentalcontracts
          WHERE apartmentid = a.apartmentid AND status = 'ACTIVE'
          ORDER BY startdate DESC NULLS LAST, contractid DESC
          LIMIT 1
        ) rc ON true
      `;

    const gananciaResult = await runWithFallback(
      `
        SELECT COALESCE(SUM(i.amount), 0) AS total
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN apartments a ON rc.apartmentid = a.id
        WHERE a.ownerid = $1
          AND i.status = 'PAID'
          ${gainsDateFilter}
      `,
      `
        SELECT COALESCE(SUM(i.amount), 0) AS total
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.contractid
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        WHERE a.ownerid = $1
          AND i.status = 'PAID'
          ${gainsDateFilter}
      `,
      values
    );
    const gananciaMensual = parseMoney(gananciaResult.rows[0]?.total);

    const ocupadasResult = await runWithFallback(
      `
        SELECT
          COUNT(a.id) AS total_apartments,
          SUM(CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END) AS occupied_apartments
        FROM apartments a
        ${occupiedJoinCurrent}
        WHERE a.ownerid = $1
      `,
      `
        SELECT
          COUNT(a.apartmentid) AS total_apartments,
          SUM(CASE WHEN rc.contractid IS NOT NULL THEN 1 ELSE 0 END) AS occupied_apartments
        FROM apartments a
        ${occupiedJoinLegacy}
        WHERE a.ownerid = $1
      `,
      values
    );
    const viviendasOcupadas = parseCount(ocupadasResult.rows[0]?.occupied_apartments);
    const viviendasTotal = parseCount(ocupadasResult.rows[0]?.total_apartments);

    const facturasResult = await runWithFallback(
      `
        WITH pagos_por_factura AS (
          SELECT invoiceid, COALESCE(SUM(amount), 0) AS total_paid
          FROM payments
          GROUP BY invoiceid
        )
        SELECT
          COUNT(*) AS total_invoices,
          SUM(
            CASE
              WHEN i.status = 'PENDING'
                AND i.duedate < CURRENT_DATE
                AND GREATEST(i.amount - COALESCE(ppf.total_paid, 0), 0) > 0
              THEN 1
              ELSE 0
            END
          ) AS overdue_invoices,
          SUM(
            CASE
              WHEN i.status = 'PENDING'
              THEN GREATEST(i.amount - COALESCE(ppf.total_paid, 0), 0)
              ELSE 0
            END
          ) AS pending_amount,
          SUM(
            CASE
              WHEN i.status = 'PENDING' AND i.duedate < CURRENT_DATE
              THEN GREATEST(i.amount - COALESCE(ppf.total_paid, 0), 0)
              ELSE 0
            END
          ) AS overdue_amount
        FROM invoices i
        LEFT JOIN pagos_por_factura ppf ON ppf.invoiceid = i.id
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN apartments a ON rc.apartmentid = a.id
        WHERE a.ownerid = $1
          ${invoicesDateFilter}
      `,
      `
        WITH pagos_por_factura AS (
          SELECT invoiceid, COALESCE(SUM(amount), 0) AS total_paid
          FROM payments
          GROUP BY invoiceid
        )
        SELECT
          COUNT(*) AS total_invoices,
          SUM(
            CASE
              WHEN i.status = 'PENDING'
                AND i.duedate < CURRENT_DATE
                AND GREATEST(i.amount - COALESCE(ppf.total_paid, 0), 0) > 0
              THEN 1
              ELSE 0
            END
          ) AS overdue_invoices,
          SUM(
            CASE
              WHEN i.status = 'PENDING'
              THEN GREATEST(i.amount - COALESCE(ppf.total_paid, 0), 0)
              ELSE 0
            END
          ) AS pending_amount,
          SUM(
            CASE
              WHEN i.status = 'PENDING' AND i.duedate < CURRENT_DATE
              THEN GREATEST(i.amount - COALESCE(ppf.total_paid, 0), 0)
              ELSE 0
            END
          ) AS overdue_amount
        FROM invoices i
        LEFT JOIN pagos_por_factura ppf ON ppf.invoiceid = i.invoiceid
        JOIN rentalcontracts rc ON i.contractid = rc.contractid
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        WHERE a.ownerid = $1
          ${invoicesDateFilter}
      `,
      values
    );
    const facturasVencidas = parseCount(facturasResult.rows[0]?.overdue_invoices);
    const facturasTotal = parseCount(facturasResult.rows[0]?.total_invoices);
    const cobroPendiente = parseMoney(facturasResult.rows[0]?.pending_amount);
    const cobroVencido = parseMoney(facturasResult.rows[0]?.overdue_amount);

    const ingresosResult = await runWithFallback(
      `
        SELECT
          TO_CHAR(i.duedate, 'Mon') AS name,
          EXTRACT(MONTH FROM i.duedate) AS month_num,
          COALESCE(SUM(CASE WHEN i.status = 'PAID' THEN i.amount ELSE 0 END), 0) AS ingreso,
          COALESCE(SUM(CASE WHEN i.status = 'PENDING' THEN i.amount ELSE 0 END), 0) AS pendiente
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN apartments a ON rc.apartmentid = a.id
        WHERE a.ownerid = $1
          ${incomeDateFilter}
        GROUP BY TO_CHAR(i.duedate, 'Mon'), EXTRACT(MONTH FROM i.duedate)
        ORDER BY EXTRACT(MONTH FROM i.duedate) ASC
      `,
      `
        SELECT
          TO_CHAR(i.duedate, 'Mon') AS name,
          EXTRACT(MONTH FROM i.duedate) AS month_num,
          COALESCE(SUM(CASE WHEN i.status = 'PAID' THEN i.amount ELSE 0 END), 0) AS ingreso,
          COALESCE(SUM(CASE WHEN i.status = 'PENDING' THEN i.amount ELSE 0 END), 0) AS pendiente
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.contractid
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        WHERE a.ownerid = $1
          ${incomeDateFilter}
        GROUP BY TO_CHAR(i.duedate, 'Mon'), EXTRACT(MONTH FROM i.duedate)
        ORDER BY EXTRACT(MONTH FROM i.duedate) ASC
      `,
      values
    );

    const dataIngresos = ingresosResult.rows.map((row) => ({
      name: row.name,
      ingreso: parseMoney(row.ingreso),
      gasto: parseMoney(row.pendiente) * 0.2,
      neto: parseMoney(row.ingreso),
    }));

    const fallbackIngresos = dataIngresos.length > 0
      ? dataIngresos
      : [{ name: hasMonthFilter ? String(month).padStart(2, '0') : 'Mes', ingreso: 0, gasto: 0, neto: 0 }];

    let dataIncidencias = [];
    try {
      const incidenciasResult = await runWithFallback(
        `
          SELECT mr.status, COUNT(*) AS count
          FROM maintenancerequests mr
          JOIN apartments a ON mr.apartmentid = a.id
          WHERE a.ownerid = $1
            ${requestDateFilter}
          GROUP BY mr.status
        `,
        `
          SELECT mr.status, COUNT(*) AS count
          FROM maintenancerequests mr
          JOIN apartments a ON mr.apartmentid = a.apartmentid
          WHERE a.ownerid = $1
            ${requestDateFilter}
          GROUP BY mr.status
        `,
        values
      );

      let porResolver = 0;
      let resueltas = 0;
      let pendientes = 0;

      incidenciasResult.rows.forEach((row) => {
        const status = String(row.status || '').toUpperCase();
        const count = parseCount(row.count);
        if (status === 'COMPLETED' || status === 'RESOLVED') {
          resueltas += count;
        } else if (status === 'IN_PROGRESS' || status === 'OPEN') {
          porResolver += count;
        } else {
          pendientes += count;
        }
      });

      dataIncidencias = [
        { name: 'Por resolver', value: porResolver, color: '#F4C8FC' },
        { name: 'Resueltas', value: resueltas, color: '#3A2C60' },
        { name: 'Pendientes', value: pendientes, color: '#A685FA' },
      ];
    } catch {
      dataIncidencias = [
        { name: 'Por resolver', value: 0, color: '#F4C8FC' },
        { name: 'Resueltas', value: 0, color: '#3A2C60' },
        { name: 'Pendientes', value: 0, color: '#A685FA' },
      ];
    }

    const contratosPrimary = hasMonthFilter
      ? `
        SELECT
          rc.id AS raw_id,
          COALESCE(
            a.name,
            CONCAT_WS(', ', a.street, a.division, a.int_num, a.city, a.state, a.postal_code),
            'S/N'
          ) AS departamento,
          t.name AS inquilino,
          COALESCE(month_invoice.amount, rc.depositamount, 0) AS monto_original,
          (
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 'NO_INVOICES'
                WHEN SUM(CASE WHEN status = 'PENDING' AND duedate < $3 THEN 1 ELSE 0 END) > 0 THEN 'VENCIDO'
                WHEN SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) > 0 THEN 'PENDIENTE'
                ELSE 'PAGADO'
              END
            FROM invoices inv
            WHERE inv.contractid = rc.id
              AND inv.duedate >= $2
              AND inv.duedate < $3
          ) AS computed_status,
          GREATEST(EXTRACT(MONTH FROM AGE(rc.enddate, $2::date))::integer, 0) AS meses_restantes
        FROM rentalcontracts rc
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.id
        LEFT JOIN LATERAL (
          SELECT amount
          FROM invoices
          WHERE contractid = rc.id
            AND duedate >= $2
            AND duedate < $3
          ORDER BY duedate DESC
          LIMIT 1
        ) month_invoice ON true
        WHERE a.ownerid = $1
          AND rc.status = 'ACTIVE'
          AND rc.startdate < $3
          AND (rc.enddate IS NULL OR rc.enddate >= $2)
          AND month_invoice.amount IS NOT NULL
      `
      : `
        SELECT
          rc.id AS raw_id,
          COALESCE(
            a.name,
            CONCAT_WS(', ', a.street, a.division, a.int_num, a.city, a.state, a.postal_code),
            'S/N'
          ) AS departamento,
          t.name AS inquilino,
          COALESCE(last_invoice.amount, rc.depositamount, 0) AS monto_original,
          (
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 'NO_INVOICES'
                WHEN SUM(CASE WHEN status = 'PENDING' AND duedate < CURRENT_DATE THEN 1 ELSE 0 END) > 0 THEN 'VENCIDO'
                WHEN SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) > 0 THEN 'PENDIENTE'
                ELSE 'PAGADO'
              END
            FROM invoices inv
            WHERE inv.contractid = rc.id
          ) AS computed_status,
          GREATEST(EXTRACT(MONTH FROM AGE(rc.enddate, CURRENT_DATE))::integer, 0) AS meses_restantes
        FROM rentalcontracts rc
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.id
        LEFT JOIN LATERAL (
          SELECT amount
          FROM invoices
          WHERE contractid = rc.id
          ORDER BY duedate DESC
          LIMIT 1
        ) last_invoice ON true
        WHERE a.ownerid = $1
          AND rc.status = 'ACTIVE'
      `;

    const contratosLegacy = hasMonthFilter
      ? `
        SELECT
          rc.contractid AS raw_id,
          COALESCE(a.address, 'S/N') AS departamento,
          t.name AS inquilino,
          COALESCE(month_invoice.amount, rc.depositamount, a.monthlyrent, 0) AS monto_original,
          (
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 'NO_INVOICES'
                WHEN SUM(CASE WHEN status = 'PENDING' AND duedate < $3 THEN 1 ELSE 0 END) > 0 THEN 'VENCIDO'
                WHEN SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) > 0 THEN 'PENDIENTE'
                ELSE 'PAGADO'
              END
            FROM invoices inv
            WHERE inv.contractid = rc.contractid
              AND inv.duedate >= $2
              AND inv.duedate < $3
          ) AS computed_status,
          GREATEST(EXTRACT(MONTH FROM AGE(rc.enddate, $2::date))::integer, 0) AS meses_restantes
        FROM rentalcontracts rc
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        LEFT JOIN LATERAL (
          SELECT amount
          FROM invoices
          WHERE contractid = rc.contractid
            AND duedate >= $2
            AND duedate < $3
          ORDER BY duedate DESC
          LIMIT 1
        ) month_invoice ON true
        WHERE a.ownerid = $1
          AND rc.status = 'ACTIVE'
          AND rc.startdate < $3
          AND (rc.enddate IS NULL OR rc.enddate >= $2)
          AND month_invoice.amount IS NOT NULL
      `
      : `
        SELECT
          rc.contractid AS raw_id,
          COALESCE(a.address, 'S/N') AS departamento,
          t.name AS inquilino,
          COALESCE(last_invoice.amount, rc.depositamount, a.monthlyrent, 0) AS monto_original,
          (
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 'NO_INVOICES'
                WHEN SUM(CASE WHEN status = 'PENDING' AND duedate < CURRENT_DATE THEN 1 ELSE 0 END) > 0 THEN 'VENCIDO'
                WHEN SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) > 0 THEN 'PENDIENTE'
                ELSE 'PAGADO'
              END
            FROM invoices inv
            WHERE inv.contractid = rc.contractid
          ) AS computed_status,
          GREATEST(EXTRACT(MONTH FROM AGE(rc.enddate, CURRENT_DATE))::integer, 0) AS meses_restantes
        FROM rentalcontracts rc
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        LEFT JOIN LATERAL (
          SELECT amount
          FROM invoices
          WHERE contractid = rc.contractid
          ORDER BY duedate DESC
          LIMIT 1
        ) last_invoice ON true
        WHERE a.ownerid = $1
          AND rc.status = 'ACTIVE'
      `;

    const contratosResult = await runWithFallback(contratosPrimary, contratosLegacy, values);

    const dataBaseInquilinos = contratosResult.rows.map((row) => {
      let estatus = 'Pendiente';
      if (row.computed_status === 'PAGADO' || row.computed_status === 'NO_INVOICES') {
        estatus = 'Pagado';
      } else if (row.computed_status === 'VENCIDO') {
        estatus = 'Vencido';
      }

      return {
        id: row.raw_id,
        departamento: row.departamento || 'S/N',
        inquilino: row.inquilino || 'Sin inquilino',
        montoOriginal: parseMoney(row.monto_original),
        estatus,
        mesesRestantes: parseCount(row.meses_restantes),
      };
    });

    res.json({
      gananciaMensual,
      viviendasOcupadas,
      viviendasTotal,
      facturasVencidas,
      facturasTotal,
      cobroPendiente,
      cobroVencido,
      dataIngresos: fallbackIngresos,
      dataIncidencias,
      dataBaseInquilinos,
      selectedMonth: hasMonthFilter ? { month, year } : null,
    });
  } catch (err) {
    console.error('Error fetch admin dashboard:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
