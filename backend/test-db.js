import pool from "./db.js";

async function test() {
  const result = await pool.query("SELECT now()");
  console.log(result.rows);
  pool.end();
}

test();
