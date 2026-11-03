require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Connected to Supabase. Running migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.mentee_tokens (
        id SERIAL PRIMARY KEY,
        mentee_id INTEGER NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
        token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        is_used BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ Table "mentee_tokens" created (or already exists).');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.mentee_profiles (
        id SERIAL PRIMARY KEY,
        mentee_id INTEGER NOT NULL UNIQUE REFERENCES public.mentees(id) ON DELETE CASCADE,
        phone VARCHAR(15),
        date_of_birth DATE,
        blood_group VARCHAR(5),
        address TEXT,
        parent_name VARCHAR(150),
        parent_phone VARCHAR(15),
        tenth_percentage DECIMAL(5,2),
        twelfth_percentage DECIMAL(5,2),
        entrance_exam_score VARCHAR(50),
        current_cgpa DECIMAL(4,2),
        total_backlogs INTEGER DEFAULT 0,
        attendance_percentage DECIMAL(5,2),
        current_year INTEGER,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table "mentee_profiles" created (or already exists).');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
