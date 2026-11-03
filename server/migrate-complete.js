require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function runFullMigration() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Complete Schema Migration ---');

    // 1. Extend mentors table
    await client.query(`
      ALTER TABLE public.mentors 
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS phone VARCHAR(25),
        ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT 'Assistant Professor',
        ADD COLUMN IF NOT EXISTS college VARCHAR(200) DEFAULT 'School of Engineering & Technology',
        ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) DEFAULT 'EMP-1024',
        ADD COLUMN IF NOT EXISTS batch VARCHAR(50) DEFAULT '2024-2028',
        ADD COLUMN IF NOT EXISTS avatar_url TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log('✅ Mentors table columns verified/extended');

    // Ensure demo mentor has password 'password123'
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('password123', salt);

    await client.query(`
      UPDATE public.mentors 
      SET 
        password_hash = COALESCE(password_hash, $1),
        phone = COALESCE(phone, '+91 98765 43210'),
        designation = COALESCE(designation, 'Associate Professor & Mentor Coordinator'),
        college = COALESCE(college, 'Faculty of Computer Science & Engineering'),
        employee_id = COALESCE(employee_id, 'CSE-FAC-014'),
        batch = COALESCE(batch, 'Batch 2024–28')
      WHERE email = 'mentor.demo@example.com';
    `, [demoPasswordHash]);

    // Also insert Dr. Sharma demo mentor if not present for multiple mentor testing
    const existingSharma = await client.query(`SELECT id FROM public.mentors WHERE email = 'mentor.sharma@example.com'`);
    if (existingSharma.rows.length === 0) {
      await client.query(`
        INSERT INTO public.mentors (full_name, email, department, password_hash, phone, designation, college, employee_id, batch)
        VALUES ('Dr. Ananya Sharma', 'mentor.sharma@example.com', 'Information Technology', $1, '+91 91234 56789', 'Professor & Head', 'Department of Information Technology', 'IT-FAC-002', 'Batch 2023–27');
      `, [demoPasswordHash]);
      console.log('✅ Second demo mentor Dr. Ananya Sharma created for data isolation tests');
    }

    // 2. Extend mentees table
    await client.query(`
      ALTER TABLE public.mentees 
        ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026-27',
        ADD COLUMN IF NOT EXISTS batch VARCHAR(50) DEFAULT '2024-2028',
        ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'A',
        ADD COLUMN IF NOT EXISTS phone VARCHAR(25),
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
        ADD COLUMN IF NOT EXISTS profile_status VARCHAR(30) DEFAULT 'Incomplete',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log('✅ Mentees table columns extended');

    // 3. Extend mentee_profiles table
    await client.query(`
      ALTER TABLE public.mentee_profiles
        ADD COLUMN IF NOT EXISTS skills_technical TEXT,
        ADD COLUMN IF NOT EXISTS skills_soft TEXT,
        ADD COLUMN IF NOT EXISTS areas_of_interest TEXT,
        ADD COLUMN IF NOT EXISTS career_goals TEXT,
        ADD COLUMN IF NOT EXISTS preferred_career_path TEXT,
        ADD COLUMN IF NOT EXISTS certifications TEXT,
        ADD COLUMN IF NOT EXISTS internships TEXT,
        ADD COLUMN IF NOT EXISTS projects TEXT,
        ADD COLUMN IF NOT EXISTS extracurricular TEXT,
        ADD COLUMN IF NOT EXISTS academic_goals TEXT,
        ADD COLUMN IF NOT EXISTS support_needed TEXT,
        ADD COLUMN IF NOT EXISTS challenges TEXT,
        ADD COLUMN IF NOT EXISTS mentor_support_topics TEXT,
        ADD COLUMN IF NOT EXISTS additional_info TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(25),
        ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT TRUE;
    `);
    console.log('✅ Mentee profiles table columns extended');

    // 4. Create form_links table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.form_links (
        id SERIAL PRIMARY KEY,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        department VARCHAR(100),
        batch VARCHAR(50),
        academic_year VARCHAR(50) DEFAULT '2026-27',
        purpose VARCHAR(255) DEFAULT 'General Mentoring Profile Collection',
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
        is_active BOOLEAN DEFAULT TRUE,
        submissions_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table form_links ready');

    // 5. Create achievements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.achievements (
        id SERIAL PRIMARY KEY,
        mentee_id BIGINT NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'academic',
        description TEXT,
        achievement_date DATE,
        organization VARCHAR(255),
        competition_name VARCHAR(255),
        level VARCHAR(50) DEFAULT 'college',
        position VARCHAR(100),
        proof_url TEXT,
        proof_filename VARCHAR(255),
        verification_status VARCHAR(50) DEFAULT 'Pending Verification',
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table achievements ready');

    // 6. Create academic_results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.academic_results (
        id SERIAL PRIMARY KEY,
        mentee_id BIGINT NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        examination_name VARCHAR(150) NOT NULL,
        academic_year VARCHAR(50) DEFAULT '2026-27',
        semester INT,
        subject VARCHAR(150),
        max_marks NUMERIC(6,2),
        marks_obtained NUMERIC(6,2),
        percentage NUMERIC(5,2),
        cgpa NUMERIC(4,2),
        sgpa NUMERIC(4,2),
        result_status VARCHAR(50) DEFAULT 'Pass',
        result_date DATE,
        remarks TEXT,
        document_url TEXT,
        document_filename VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table academic_results ready');

    // 7. Create issues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.issues (
        id SERIAL PRIMARY KEY,
        mentee_id BIGINT NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL DEFAULT 'academic',
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'New',
        document_url TEXT,
        document_filename VARCHAR(255),
        preferred_contact VARCHAR(100),
        resolution_summary TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table issues ready');

    // 8. Create issue_notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.issue_notes (
        id SERIAL PRIMARY KEY,
        issue_id INT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table issue_notes ready');

    // 9. Create mentor_notes table (mentor-only confidential mentoring notes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.mentor_notes (
        id SERIAL PRIMARY KEY,
        mentee_id BIGINT NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        note_type VARCHAR(50) DEFAULT 'General',
        title VARCHAR(200),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table mentor_notes ready');

    // 10. Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id SERIAL PRIMARY KEY,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        link_url VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table notifications ready');

    // Update existing mentees profile_status if they have a profile
    await client.query(`
      UPDATE public.mentees m
      SET profile_status = 'Complete'
      WHERE EXISTS (
        SELECT 1 FROM public.mentee_profiles p WHERE p.mentee_id = m.id AND p.submitted_at IS NOT NULL
      );
    `);
    console.log('✅ Updated profile status on existing mentees');

    console.log('🎉 --- Full Database Schema Migration Completed Successfully --- 🎉');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runFullMigration();

