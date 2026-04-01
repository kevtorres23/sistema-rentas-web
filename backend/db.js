import pkg from "pg";
const { Pool } = pkg;

const globalPool = globalThis.__rentasPgPool;

const pool =
  globalPool ||
  new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres.ckxadrogfdgzlsrpwmvt:S7LwgfkwmM7K6izM@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false },
    max: Number(process.env.PG_POOL_MAX || 1),
    min: 0,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 5000),
    connectionTimeoutMillis: Number(
      process.env.PG_CONNECTION_TIMEOUT_MS || 10000
    ),
    allowExitOnIdle: true,
  });

if (!globalPool) {
  globalThis.__rentasPgPool = pool;
}

export default pool;
