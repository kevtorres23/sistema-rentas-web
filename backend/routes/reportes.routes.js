import express from 'express';
import pool from '../db.js';
import { generarReporteOcupacion } from '../Reportes/FuncionReportesO.js';
import { reportePorArrendatario } from '../Reportes/ReporteFArrendatario.js';
import { reportePorContrato } from '../Reportes/ReporteFContrato.js';
import { reportePorPropiedad } from '../Reportes/ReporteFPropiedad.js';

const router = express.Router();
const UNDEFINED_COLUMN = '42703';

const mapInvoiceRowsToPagos = (rows) =>
  rows.map((row) => ({
    arrendatario: row.tenant_name,
    contrato: row.contractid,
    propiedad: row.apartment_street,
    monto: Number(row.amount) || 0,
    estado: row.status === 'PAID' ? 'Pagado' : 'Pendiente',
  }));

router.get('/reportes/ocupacion', async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        'SELECT id, street, status FROM apartments ORDER BY id'
      );
    } catch (err) {
      if (err?.code !== UNDEFINED_COLUMN) throw err;
      result = await pool.query(
        'SELECT id, street, status FROM apartments ORDER BY apartmentid'
      );
    }

    const unidades = result.rows.map((row) => ({
      id: row.id,
      numero: row.street,
      estado: row.status === 'OCCUPIED' ? 'ocupado' : 'disponible',
    }));

    const reporte = generarReporteOcupacion(unidades);
    return res.json(reporte);
  } catch (err) {
    console.error('Error generando reporte de ocupacion:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/reportes/arrendatarios', async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `
        SELECT i.amount, i.status,
               rc.id AS contractid,
               t.name AS tenant_name,
               a.street AS apartment_street
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.id
        ORDER BY t.name, rc.id, i.id
        `
      );
    } catch (err) {
      if (err?.code !== UNDEFINED_COLUMN) throw err;
      result = await pool.query(
        `
        SELECT i.amount, i.status,
               rc.id AS contractid,
               t.name AS tenant_name,
               a.street AS apartment_street
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        ORDER BY t.name, rc.id, i.invoiceid
        `
      );
    }

    const pagos = mapInvoiceRowsToPagos(result.rows);
    const reporte = reportePorArrendatario(pagos);
    return res.json(reporte);
  } catch (err) {
    console.error('Error generando reporte por arrendatario:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/reportes/contratos', async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `
        SELECT i.amount, i.status,
               rc.id AS contractid,
               t.name AS tenant_name,
               a.street AS apartment_street
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.id
        ORDER BY rc.id, i.id
        `
      );
    } catch (err) {
      if (err?.code !== UNDEFINED_COLUMN) throw err;
      result = await pool.query(
        `
        SELECT i.amount, i.status,
               rc.id AS contractid,
               t.name AS tenant_name,
               a.street AS apartment_street
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        ORDER BY rc.id, i.invoiceid
        `
      );
    }

    const pagos = mapInvoiceRowsToPagos(result.rows);
    const reporte = reportePorContrato(pagos);
    return res.json(reporte);
  } catch (err) {
    console.error('Error generando reporte por contrato:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/reportes/propiedades', async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `
        SELECT i.amount, i.status,
               rc.id AS contractid,
               t.name AS tenant_name,
               a.street AS apartment_street
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.id
        ORDER BY a.street, i.id
        `
      );
    } catch (err) {
      if (err?.code !== UNDEFINED_COLUMN) throw err;
      result = await pool.query(
        `
        SELECT i.amount, i.status,
               rc.id AS contractid,
               t.name AS tenant_name,
               a.street AS apartment_street
        FROM invoices i
        JOIN rentalcontracts rc ON i.contractid = rc.id
        JOIN tenants t ON rc.tenantid = t.id
        JOIN apartments a ON rc.apartmentid = a.apartmentid
        ORDER BY a.street, i.invoiceid
        `
      );
    }

    const pagos = mapInvoiceRowsToPagos(result.rows);
    const reporte = reportePorPropiedad(pagos);
    return res.json(reporte);
  } catch (err) {
    console.error('Error generando reporte por propiedad:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
