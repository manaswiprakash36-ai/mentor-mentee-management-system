// server/migrate-sections.js
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

async function runSectionsMigration() {
  const client = await pool.connect();
  try {
    console.log('--- Migrating Database for 12-Section Mentee Form ---');

    // 1. Extend mentees table
    await client.query(`
      ALTER TABLE public.mentees
        ADD COLUMN IF NOT EXISTS university_roll_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS course VARCHAR(150),
        ADD COLUMN IF NOT EXISTS college_name VARCHAR(200);
    `);
    console.log('✓ mentees table extended');

    // 2. Extend mentee_profiles table
    await client.query(`
      ALTER TABLE public.mentee_profiles
        -- Section 1: Personal & Address
        ADD COLUMN IF NOT EXISTS alt_phone VARCHAR(25),
        ADD COLUMN IF NOT EXISTS house_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS street VARCHAR(150),
        ADD COLUMN IF NOT EXISTS locality VARCHAR(150),
        ADD COLUMN IF NOT EXISTS district VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
        ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
        ADD COLUMN IF NOT EXISTS is_permanent_same BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS permanent_address TEXT,

        -- Section 2: Family Information
        ADD COLUMN IF NOT EXISTS father_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS father_phone VARCHAR(25),
        ADD COLUMN IF NOT EXISTS father_email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(150),
        ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(25),
        ADD COLUMN IF NOT EXISTS mother_email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(150),
        ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(100),
        ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(25),
        ADD COLUMN IF NOT EXISTS guardian_occupation VARCHAR(150),

        -- Section 3: Student and Parents' Photographs
        ADD COLUMN IF NOT EXISTS student_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS student_photo_filename VARCHAR(255),
        ADD COLUMN IF NOT EXISTS father_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS father_photo_filename VARCHAR(255),
        ADD COLUMN IF NOT EXISTS mother_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS mother_photo_filename VARCHAR(255),

        -- Section 4: Class 10th
        ADD COLUMN IF NOT EXISTS tenth_board_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS tenth_board_type VARCHAR(50) DEFAULT 'CBSE',
        ADD COLUMN IF NOT EXISTS tenth_school_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS tenth_year_of_passing INTEGER,
        ADD COLUMN IF NOT EXISTS tenth_max_marks NUMERIC(6,2),
        ADD COLUMN IF NOT EXISTS tenth_marks_obtained NUMERIC(6,2),
        ADD COLUMN IF NOT EXISTS tenth_cgpa_grade VARCHAR(50),
        ADD COLUMN IF NOT EXISTS tenth_marksheet_url TEXT,
        ADD COLUMN IF NOT EXISTS tenth_marksheet_filename VARCHAR(255),

        -- Section 5: Class 12th
        ADD COLUMN IF NOT EXISTS twelfth_board_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS twelfth_board_type VARCHAR(50) DEFAULT 'CBSE',
        ADD COLUMN IF NOT EXISTS twelfth_school_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS twelfth_stream VARCHAR(100) DEFAULT 'Science',
        ADD COLUMN IF NOT EXISTS twelfth_year_of_passing INTEGER,
        ADD COLUMN IF NOT EXISTS twelfth_max_marks NUMERIC(6,2),
        ADD COLUMN IF NOT EXISTS twelfth_marks_obtained NUMERIC(6,2),
        ADD COLUMN IF NOT EXISTS twelfth_cgpa_grade VARCHAR(50),
        ADD COLUMN IF NOT EXISTS twelfth_marksheet_url TEXT,
        ADD COLUMN IF NOT EXISTS twelfth_marksheet_filename VARCHAR(255),

        -- Section 6: College Performance
        ADD COLUMN IF NOT EXISTS current_sgpa NUMERIC(4,2),
        ADD COLUMN IF NOT EXISTS previous_sgpas JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS has_backlogs BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS academic_strengths TEXT,
        ADD COLUMN IF NOT EXISTS subjects_requiring_improvement TEXT,

        -- Section 7: Attendance
        ADD COLUMN IF NOT EXISTS attendance_semester INTEGER,
        ADD COLUMN IF NOT EXISTS total_classes_conducted INTEGER,
        ADD COLUMN IF NOT EXISTS classes_attended INTEGER,
        ADD COLUMN IF NOT EXISTS subject_wise_attendance TEXT,
        ADD COLUMN IF NOT EXISTS attendance_challenges TEXT,
        ADD COLUMN IF NOT EXISTS low_attendance_reason TEXT,
        ADD COLUMN IF NOT EXISTS mentor_attendance_support TEXT,

        -- Section 9 & 10 flags
        ADD COLUMN IF NOT EXISTS has_no_achievements BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS has_no_issues BOOLEAN DEFAULT false,

        -- Section 12 Reference code
        ADD COLUMN IF NOT EXISTS submission_reference VARCHAR(60);
    `);
    console.log('✓ mentee_profiles table extended');

    // 3. Extend achievements table
    await client.query(`
      ALTER TABLE public.achievements
        ADD COLUMN IF NOT EXISTS is_team_achievement BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS team_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS role_in_team VARCHAR(150),
        ADD COLUMN IF NOT EXISTS certificate_url TEXT,
        ADD COLUMN IF NOT EXISTS certificate_filename VARCHAR(255);
    `);
    console.log('✓ achievements table extended');

    // 4. Extend issues table
    await client.query(`
      ALTER TABLE public.issues
        ADD COLUMN IF NOT EXISTS issue_started_when VARCHAR(100),
        ADD COLUMN IF NOT EXISTS impact_on_studies TEXT,
        ADD COLUMN IF NOT EXISTS support_required TEXT;
    `);
    console.log('✓ issues table extended');

    // 5. Create university_suggestions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.university_suggestions (
        id SERIAL PRIMARY KEY,
        mentee_id BIGINT NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
        mentor_id BIGINT NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
        teaching_learning_suggestions TEXT,
        practical_explanation_topics TEXT,
        lab_facilities_changes TEXT,
        infrastructure_improvements TEXT,
        internship_placement_guidance TEXT,
        technical_workshops_wanted TEXT,
        mentor_communication_improvements TEXT,
        academic_performance_support TEXT,
        exam_administration_changes TEXT,
        wellbeing_campus_life TEXT,
        other_suggestions TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_mentee_suggestions UNIQUE (mentee_id)
      );
    `);
    console.log('✓ university_suggestions table ready');

    console.log('★ All 12 Sections Database Schema Migration Completed Successfully! ★');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSectionsMigration();

