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
  const r = await pool.query(`
    UPDATE public.mentees 
    SET password_hash = NULL, account_status = 'not_activated', must_change_password = false 
    WHERE roll_number = 'A60205224158'
    RETURNING id, full_name, roll_number, email, account_status, must_change_password, password_hash
  `);
  console.log('Mahi Sharma is set to:', r.rows[0]);
  await pool.end();
}
main();

