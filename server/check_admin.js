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
  const admins = await pool.query("SELECT id, full_name, email, role, employee_id, password_hash FROM public.mentors WHERE role = 'admin'");
  console.log('Admins in database:', admins.rows.map(a => ({ id: a.id, email: a.email, role: a.role, employee_id: a.employee_id, has_pwd: !!a.password_hash })));
  await pool.end();
}
main();

