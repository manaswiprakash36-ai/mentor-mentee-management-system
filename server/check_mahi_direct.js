const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const res = await pool.query("SELECT * FROM public.mentees WHERE roll_number = 'A60205224158' OR admission_number = 'A60205224158' OR full_name ILIKE '%Mahi%'");
  console.log('Mahi rows:', res.rows);
  const cols = await pool.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'mentees'");
  console.log('Columns of mentees:', cols.rows.map(c => c.column_name));
  await pool.end();
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
