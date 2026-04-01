import express from 'express';
import cors from 'cors';
import pool from './db.js';

// Routers
import ownersRouter from './routes/owners.routes.js';
import tenantsRouter from './routes/tenants.routes.js';
import guarantorsRouter from './routes/guarantors.routes.js';
import apartmentsRouter from './routes/aparments.routes.js';
import rentalContractsRouter from './routes/rentalContracts.routes.js';
import invoicesRouter from './routes/invoices.routes.js';
import paymentsRouter from './routes/payments.routes.js';
import documentsRouter from './routes/documents.routes.js';
import maintenanceRequestsRouter from './routes/maintenanceRequests.routes.js';
import moraSettingsRouter from './routes/moraSettings.routes.js';
import openpayRouter from './routes/openpay.routes.js';
import reportesRouter from './routes/reportes.routes.js';
import notificacionesRouter from './routes/notificaciones.routes.js';
import ticketsRouter from './routes/tickets.js';
import dashboardRouter from './routes/dashboardMonth.routes.js';

//import Pagosrouter from './routes/PagoNotif.js';

const app = express();

const ensureMaintenanceRequestsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS maintenancerequests (
      requestid SERIAL PRIMARY KEY,
      apartmentid INT NOT NULL,
      tenantid INT,
      requestdate DATE NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      completiondate DATE
    )
  `);

  await pool.query(`
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
  `);
};

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', ownersRouter);
app.use('/api', tenantsRouter);
app.use('/api', guarantorsRouter);
app.use('/api', apartmentsRouter);
app.use('/api', rentalContractsRouter);
app.use('/api', invoicesRouter);
app.use('/api', paymentsRouter);
app.use('/api', documentsRouter);
app.use('/api', maintenanceRequestsRouter);
app.use('/api', moraSettingsRouter);
app.use('/api', openpayRouter)
app.use('/api', reportesRouter);
app.use('/api', notificacionesRouter);
app.use('/api', ticketsRouter);
app.use('/api', dashboardRouter);
//app.use('/api', Pagosrouter);

// ❗ Export the app as the default handler
ensureMaintenanceRequestsTable().catch((error) => {
  console.error('Error ensuring maintenancerequests table:', error);
});

export default app;
