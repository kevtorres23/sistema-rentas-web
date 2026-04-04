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

router.get('/dashboard/admin', authMiddleware, async (req, res) => {
  try {
    const ownerId = req.user.id;

    const gananciaResult = await runWithFallback(
      `
        SELECT COALESCE(SUM(i.amount), 0) AS total
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN apartments a ON rc.apartmentid = a.id
        WHERE a.ownerid = $1
          AND i.status = 'PAID'
          AND DATE_TRUNC('month', i.duedate) = DATE_TRUNC('month', CURRENT_DATE)
      `,
      `
        SELECT COALESCE(SUM(i.amount), 0) AS total
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.contractid
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        WHERE a.ownerid = $1
          AND i.status = 'PAID'
          AND DATE_TRUNC('month', i.duedate) = DATE_TRUNC('month', CURRENT_DATE)
      `,
      [ownerId]
    );
    const gananciaMensual = parseMoney(gananciaResult.rows[0]?.total);

    const ocupadasResult = await runWithFallback(
      `
        SELECT
          COUNT(a.id) AS total_apartments,
          SUM(CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END) AS occupied_apartments
        FROM apartments a
        LEFT JOIN LATERAL (
          SELECT id
          FROM rentalcontracts
          WHERE apartmentid = a.id AND status = 'ACTIVE'
          ORDER BY startdate DESC NULLS LAST, id DESC
          LIMIT 1
        ) rc ON true
        WHERE a.ownerid = $1
      `,
      `
        SELECT
          COUNT(a.apartmentid) AS total_apartments,
          SUM(CASE WHEN rc.contractid IS NOT NULL THEN 1 ELSE 0 END) AS occupied_apartments
        FROM apartments a
        LEFT JOIN LATERAL (
          SELECT contractid
          FROM rentalcontracts
          WHERE apartmentid = a.apartmentid AND status = 'ACTIVE'
          ORDER BY startdate DESC NULLS LAST, contractid DESC
          LIMIT 1
        ) rc ON true
        WHERE a.ownerid = $1
      `,
      [ownerId]
    );
    const viviendasOcupadas = parseCount(ocupadasResult.rows[0]?.occupied_apartments);
    const viviendasTotal = parseCount(ocupadasResult.rows[0]?.total_apartments);

    const facturasResult = await runWithFallback(
      `
        SELECT
          COUNT(*) AS total_invoices,
          SUM(CASE WHEN i.status = 'PENDING' AND i.duedate < CURRENT_DATE THEN 1 ELSE 0 END) AS overdue_invoices,
          SUM(CASE WHEN i.status = 'PENDING' THEN i.amount ELSE 0 END) AS pending_amount
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN apartments a ON rc.apartmentid = a.id
        WHERE a.ownerid = $1
      `,
      `
        SELECT
          COUNT(*) AS total_invoices,
          SUM(CASE WHEN i.status = 'PENDING' AND i.duedate < CURRENT_DATE THEN 1 ELSE 0 END) AS overdue_invoices,
          SUM(CASE WHEN i.status = 'PENDING' THEN i.amount ELSE 0 END) AS pending_amount
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.contractid
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        WHERE a.ownerid = $1
      `,
      [ownerId]
    );
    const facturasVencidas = parseCount(facturasResult.rows[0]?.overdue_invoices);
    const facturasTotal = parseCount(facturasResult.rows[0]?.total_invoices);
    const cobroPendiente = parseMoney(facturasResult.rows[0]?.pending_amount);

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
          AND i.duedate >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
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
          AND i.duedate >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY TO_CHAR(i.duedate, 'Mon'), EXTRACT(MONTH FROM i.duedate)
        ORDER BY EXTRACT(MONTH FROM i.duedate) ASC
      `,
      [ownerId]
    );

    const dataIngresos = ingresosResult.rows.map((row) => ({
      name: row.name,
      ingreso: parseMoney(row.ingreso),
      gasto: parseMoney(row.pendiente) * 0.2,
      neto: parseMoney(row.ingreso),
    }));

    const fallbackIngresos = dataIngresos.length > 0
      ? dataIngresos
      : [
          { name: 'Jan', ingreso: 0, gasto: 0, neto: 0 },
          { name: 'Feb', ingreso: 0, gasto: 0, neto: 0 },
          { name: 'Mar', ingreso: 0, gasto: 0, neto: 0 },
        ];

    let dataIncidencias = [];
    try {
      const ticketsResult = await runWithFallback(
        `
          SELECT mr.status, COUNT(*) AS count
          FROM maintenancerequests mr
          JOIN apartments a ON mr.apartmentid = a.id
          WHERE a.ownerid = $1
          GROUP BY mr.status
        `,
        `
          SELECT mr.status, COUNT(*) AS count
          FROM maintenancerequests mr
          JOIN apartments a ON mr.apartmentid = a.apartmentid
          WHERE a.ownerid = $1
          GROUP BY mr.status
        `,
        [ownerId]
      );

      let porResolver = 0;
      let resueltas = 0;
      let pendientes = 0;

      ticketsResult.rows.forEach((row) => {
        const status = String(row.status || '').toUpperCase();
        const count = parseCount(row.count);

        if (status === 'COMPLETED' || status === 'RESOLVED') {
          resueltas += count;
          return;
        }

        if (status === 'IN_PROGRESS' || status === 'OPEN') {
          porResolver += count;
          return;
        }

        pendientes += count;
      });

      dataIncidencias = [
        { name: 'Por resolver', value: porResolver, color: '#F4C8FC' },
        { name: 'Resueltas', value: resueltas, color: '#3A2C60' },
        { name: 'Pendientes', value: pendientes, color: '#A685FA' },
      ];
    } catch (err) {
      dataIncidencias = [
        { name: 'Por resolver', value: 0, color: '#F4C8FC' },
        { name: 'Resueltas', value: 0, color: '#3A2C60' },
        { name: 'Pendientes', value: 0, color: '#A685FA' },
      ];
    }

    const inquilinosResult = await runWithFallback(
      `
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
      `,
      `
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
      `,
      [ownerId]
    );

    const dataBaseInquilinos = inquilinosResult.rows.map((row) => {
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
      dataIngresos: fallbackIngresos,
      dataIncidencias,
      dataBaseInquilinos,
    });
  } catch (err) {
    console.error('Error fetch admin dashboard:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
