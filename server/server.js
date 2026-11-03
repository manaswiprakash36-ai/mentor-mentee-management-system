const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mentora-secure-jwt-secret-academic-2026';

// ── Database Connection ──────────────────────────
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.warn('PostgreSQL pool notice (auto-recovering):', err.message);
});

// ── Uploads Storage ──────────────────────────────
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.warn('Notice: uploads directory initialization:', e.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and DOC are allowed.'));
    }
  },
});

// ── Middlewares ──────────────────────────────────
app.use(cors({
  origin: true, // Reflect request origin to support decoupled frontend deployments
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Role-Aware Authentication & RBAC Middleware ────────────────────
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const role = decoded.role || 'mentor';
    req.role = role;

    if (role === 'admin') {
      const result = await pool.query(
        `SELECT id, full_name, email, department, designation, college, employee_id, phone, role, cabin_number
         FROM public.mentors WHERE id = $1 AND role = 'admin'`,
        [decoded.id || decoded.mentorId]
      );
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Admin account not found or deactivated.' });
      }
      req.user = req.admin = req.mentor = result.rows[0];
      return next();
    }

    if (role === 'student') {
      const result = await pool.query(
        `SELECT id, full_name, email, roll_number, admission_number, department, semester, mentor_id, batch, academic_year, section, phone, profile_status,
                COALESCE(account_status, CASE WHEN password_hash IS NULL THEN 'not_activated' ELSE 'active' END) AS account_status,
                COALESCE(must_change_password, false) AS must_change_password
         FROM public.mentees WHERE id = $1`,
        [decoded.studentId || decoded.id]
      );
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Student record not found.' });
      }
      req.user = req.student = result.rows[0];
      return next();
    }

    // Default: Faculty Mentor
    const result = await pool.query(
      `SELECT id, full_name, email, department, designation, college, employee_id, batch, phone, avatar_url, cabin_number, address, settings, role 
       FROM public.mentors WHERE id = $1`,
      [decoded.mentorId || decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Mentor account not found or deactivated.' });
    }

    req.user = req.mentor = result.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

// RBAC Guards
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Institutional Administrator role required.' });
    }
    next();
  });
}

function requireMentor(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.role !== 'mentor' && req.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Faculty Mentor role required.' });
    }
    next();
  });
}

function requireStudent(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.role !== 'student') {
      return res.status(403).json({ error: 'Access forbidden: Student Mentee role required.' });
    }
    next();
  });
}

async function requireCoordinator(req, res, next) {
  authenticateToken(req, res, async () => {
    if (req.role !== 'mentor' && req.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Faculty Mentor or Class Coordinator role required.' });
    }

    try {
      const coordRes = await pool.query(
        `SELECT id, department, course, academic_year, semester, section, status, assigned_at
         FROM public.class_coordinators
         WHERE mentor_id = $1 AND status = 'active'
         ORDER BY semester ASC, section ASC`,
        [req.mentor?.id || req.user?.id]
      );

      if (coordRes.rows.length === 0 && req.role !== 'admin') {
        return res.status(403).json({
          error: 'Access forbidden: You do not have active Class Coordinator responsibilities.',
        });
      }

      req.coordinatedClasses = coordRes.rows;
      next();
    } catch (err) {
      console.error('requireCoordinator error:', err.message);
      return res.status(500).json({ error: 'Failed to verify Class Coordinator permissions.' });
    }
  });
}

// ─────────────────────────────────────────────────
// 1. INDEPENDENT ROLE-BASED AUTHENTICATION ROUTES
// ─────────────────────────────────────────────────

// POST /api/auth/admin/login — College Administrator Login
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Admin email and password are required.' });
    }

    const adminResult = await pool.query(
      `SELECT * FROM public.mentors 
       WHERE (LOWER(email) = LOWER($1) OR LOWER(employee_id) = LOWER($1)) AND role = 'admin'
       LIMIT 1`,
      [email.trim()]
    );

    if (adminResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials or unauthorized account.' });
    }

    const admin = adminResult.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userSafe = {
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      department: admin.department,
      designation: admin.designation,
      role: 'admin',
    };

    res.json({
      message: 'Admin authentication successful',
      token,
      role: 'admin',
      user: userSafe,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during admin authentication.' });
  }
});

// POST /api/auth/mentor/login & /api/auth/login — Faculty Mentor Login
app.post(['/api/auth/mentor/login', '/api/auth/login'], async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/Mentor ID and password are required.' });
    }

    const mentorResult = await pool.query(
      `SELECT * FROM public.mentors 
       WHERE (LOWER(email) = LOWER($1) OR LOWER(employee_id) = LOWER($1)) AND (role = 'mentor' OR role IS NULL)
       LIMIT 1`,
      [email.trim()]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid faculty credentials.' });
    }

    const mentor = mentorResult.rows[0];

    if (!mentor.password_hash) {
      const salt = await bcrypt.genSalt(10);
      mentor.password_hash = await bcrypt.hash('password123', salt);
      await pool.query('UPDATE public.mentors SET password_hash = $1 WHERE id = $2', [mentor.password_hash, mentor.id]);
    }

    const isMatch = await bcrypt.compare(password, mentor.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid faculty credentials.' });
    }

    const token = jwt.sign(
      { mentorId: mentor.id, id: mentor.id, email: mentor.email, role: 'mentor' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Check active Class Coordinator assignments
    let coordinatedClasses = [];
    try {
      const coordRes = await pool.query(
        `SELECT id, department, course, academic_year, semester, section, status, assigned_at
         FROM public.class_coordinators
         WHERE mentor_id = $1 AND status = 'active'
         ORDER BY semester ASC, section ASC`,
        [mentor.id]
      );
      coordinatedClasses = coordRes.rows;
    } catch (e) {
      console.error('Login coordinator query error:', e.message);
    }
    const isCoordinator = coordinatedClasses.length > 0;

    const mentorSafe = {
      id: mentor.id,
      full_name: mentor.full_name,
      email: mentor.email,
      department: mentor.department,
      designation: mentor.designation,
      college: mentor.college,
      employee_id: mentor.employee_id,
      batch: mentor.batch,
      phone: mentor.phone,
      avatar_url: mentor.avatar_url,
      cabin_number: mentor.cabin_number,
      address: mentor.address,
      settings: mentor.settings || {},
      role: 'mentor',
      isCoordinator,
      coordinatedClasses,
    };

    res.json({
      message: 'Mentor login successful',
      token,
      role: 'mentor',
      isCoordinator,
      coordinatedClasses,
      mentor: mentorSafe,
      user: mentorSafe,
    });
  } catch (error) {
    console.error('Mentor login error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during mentor login.' });
  }
});

// POST /api/auth/student/login — Student / Mentee Login
app.post('/api/auth/student/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Roll number or Email and password are required.' });
    }

    const studentResult = await pool.query(
      `SELECT * FROM public.mentees 
       WHERE LOWER(roll_number) = LOWER($1) OR LOWER(email) = LOWER($1) OR LOWER(admission_number) = LOWER($1)
       LIMIT 1`,
      [identifier.trim()]
    );

    if (studentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Student record not found. Check your roll number or email.' });
    }

    const student = studentResult.rows[0];

    // Check account activation
    const currentStatus = student.account_status || (student.password_hash ? 'active' : 'not_activated');
    if (!student.password_hash || currentStatus === 'not_activated') {
      return res.status(403).json({
        error: 'Your student account is not activated yet. Please contact your College Administrator to activate your account and set up your login credentials.',
        account_status: 'not_activated',
      });
    }

    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid Student ID or password. Please verify your credentials and try again.' });
    }

    const mustChangePassword = !!student.must_change_password;

    const token = jwt.sign(
      {
        studentId: student.id,
        id: student.id,
        email: student.email,
        roll_number: student.roll_number,
        role: 'student',
        must_change_password: mustChangePassword,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const studentSafe = {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      roll_number: student.roll_number,
      admission_number: student.admission_number,
      department: student.department,
      semester: student.semester,
      batch: student.batch,
      mentor_id: student.mentor_id,
      role: 'student',
      account_status: currentStatus,
      must_change_password: mustChangePassword,
    };

    res.json({
      message: 'Student login successful',
      token,
      role: 'student',
      student: studentSafe,
      user: studentSafe,
      must_change_password: mustChangePassword,
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Server error during student login.' });
  }
});

// GET /api/auth/me — Current Session User (Role-Aware)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  let coordinatedClasses = [];
  if (req.mentor) {
    try {
      const coordRes = await pool.query(
        `SELECT id, department, course, academic_year, semester, section, status, assigned_at
         FROM public.class_coordinators
         WHERE mentor_id = $1 AND status = 'active'
         ORDER BY semester ASC, section ASC`,
        [req.mentor.id]
      );
      coordinatedClasses = coordRes.rows;
    } catch (e) {
      console.error('auth/me coordinator query error:', e.message);
    }
  }
  const isCoordinator = coordinatedClasses.length > 0;

  res.json({
    role: req.role,
    user: req.user,
    mentor: req.mentor ? {
      ...req.mentor,
      isCoordinator,
      coordinatedClasses,
    } : null,
    student: req.student,
    isCoordinator,
    coordinatedClasses,
  });
});

// POST /api/auth/logout — Unified Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────
// 2. MENTOR PROFILE & DASHBOARD
// ─────────────────────────────────────────────────

// GET /api/mentor/profile
app.get('/api/mentor/profile', authenticateToken, async (req, res) => {
  res.json(req.mentor);
});

// PUT /api/mentor/profile — Update Profile Fields
app.put('/api/mentor/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, department, designation, college, employee_id, batch, avatar_url, cabin_number, address } = req.body;

    const result = await pool.query(
      `UPDATE public.mentors SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         department = COALESCE($3, department),
         designation = COALESCE($4, designation),
         college = COALESCE($5, college),
         employee_id = COALESCE($6, employee_id),
         batch = COALESCE($7, batch),
         avatar_url = COALESCE($8, avatar_url),
         cabin_number = COALESCE($9, cabin_number),
         address = COALESCE($10, address),
         updated_at = NOW()
       WHERE id = $11
       RETURNING id, full_name, email, department, designation, college, employee_id, batch, phone, avatar_url, cabin_number, address`,
      [full_name, phone, department, designation, college, employee_id, batch, avatar_url, cabin_number, address, req.mentor.id]
    );

    res.json({ message: 'Profile updated successfully', mentor: result.rows[0] });
  } catch (err) {
    console.error('Update mentor profile error:', err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// POST /api/mentor/avatar — Upload Mentor Profile Photo
app.post('/api/mentor/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose an image file (JPG, PNG, WebP).' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      `UPDATE public.mentors SET avatar_url = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, email, department, designation, college, employee_id, batch, phone, avatar_url, cabin_number, address`,
      [avatarUrl, req.mentor.id]
    );

    res.json({
      message: 'Profile photo updated successfully',
      avatar_url: avatarUrl,
      mentor: result.rows[0],
    });
  } catch (err) {
    console.error('Mentor avatar upload error:', err);
    res.status(500).json({ error: 'Could not upload profile photo' });
  }
});

// POST /api/mentor/change-password — Update Mentor Password Securely
app.post('/api/mentor/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation password do not match.' });
    }

    // Get current password hash
    const mentorRes = await pool.query(
      `SELECT password_hash FROM public.mentors WHERE id = $1`,
      [req.mentor.id]
    );

    if (mentorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor account not found.' });
    }

    let currentHash = mentorRes.rows[0].password_hash;
    if (!currentHash) {
      const salt = await bcrypt.genSalt(10);
      currentHash = await bcrypt.hash('password123', salt);
    }

    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password. Please check and try again.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      `UPDATE public.mentors SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, req.mentor.id]
    );

    res.json({ message: 'Password updated successfully! You can now use your new password.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Could not update password' });
  }
});

// GET /api/mentor/settings — Retrieve current settings
app.get('/api/mentor/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT email, settings, created_at, updated_at FROM public.mentors WHERE id = $1`,
      [req.mentor.id]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Could not fetch settings' });
  }
});

// PUT /api/mentor/settings — Update Mentor System & Security Settings
app.put('/api/mentor/settings', authenticateToken, async (req, res) => {
  try {
    const { email, full_name, settings } = req.body;

    // Check email uniqueness if email is changed
    if (email && email.trim().toLowerCase() !== req.mentor.email.toLowerCase()) {
      const emailCheck = await pool.query(
        `SELECT id FROM public.mentors WHERE LOWER(email) = LOWER($1) AND id != $2`,
        [email.trim(), req.mentor.id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'This email is already registered to another faculty account.' });
      }
    }

    const updatedEmail = email ? email.trim() : req.mentor.email;
    const updatedName = full_name ? full_name.trim() : req.mentor.full_name;

    const result = await pool.query(
      `UPDATE public.mentors SET
         email = $1,
         full_name = $2,
         settings = COALESCE(settings, '{}'::jsonb) || COALESCE($3::jsonb, '{}'::jsonb),
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, full_name, email, department, designation, college, employee_id, batch, phone, avatar_url, cabin_number, address, settings`,
      [updatedEmail, updatedName, settings ? JSON.stringify(settings) : null, req.mentor.id]
    );

    res.json({
      message: 'Settings updated successfully',
      mentor: result.rows[0],
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Could not update settings' });
  }
});

// GET /api/mentor/dashboard — Comprehensive Live Stats & Feeds
app.get('/api/mentor/dashboard', authenticateToken, async (req, res) => {
  try {
    const mentorId = req.mentor.id;

    // Total assigned mentees
    const menteesCountRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.mentees WHERE mentor_id = $1`,
      [mentorId]
    );
    const totalMentees = menteesCountRes.rows[0].count;

    // Completed vs Incomplete Profiles
    const completedRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.mentees m
       JOIN public.mentee_profiles p ON p.mentee_id = m.id
       WHERE m.mentor_id = $1 AND p.submitted_at IS NOT NULL`,
      [mentorId]
    );
    const completedProfiles = completedRes.rows[0].count;
    const incompleteProfiles = Math.max(0, totalMentees - completedProfiles);

    // Achievements Count & Pending Verification
    const achCountRes = await pool.query(
      `SELECT 
         COUNT(*)::int AS total,
         COUNT(CASE WHEN verification_status = 'Pending Verification' THEN 1 END)::int AS pending
       FROM public.achievements WHERE mentor_id = $1`,
      [mentorId]
    );
    const totalAchievements = achCountRes.rows[0].total;
    const pendingAchievements = achCountRes.rows[0].pending;

    // Results Count
    const resCountRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.academic_results WHERE mentor_id = $1`,
      [mentorId]
    );
    const totalResults = resCountRes.rows[0].count;

    // Issues Counts
    const issuesCountRes = await pool.query(
      `SELECT 
         COUNT(*)::int AS total,
         COUNT(CASE WHEN status IN ('New', 'Under Review', 'In Progress') THEN 1 END)::int AS open,
         COUNT(CASE WHEN status = 'Resolved' THEN 1 END)::int AS resolved
       FROM public.issues WHERE mentor_id = $1`,
      [mentorId]
    );
    const openIssues = issuesCountRes.rows[0].open;
    const resolvedIssues = issuesCountRes.rows[0].resolved;

    // Recent Mentees
    const recentMentees = await pool.query(
      `SELECT m.id, m.full_name, m.roll_number, m.department, m.semester, m.created_at,
              p.current_cgpa, p.attendance_percentage, p.total_backlogs, p.submitted_at,
              COALESCE(m.profile_status, CASE WHEN p.submitted_at IS NOT NULL THEN 'Complete' ELSE 'Incomplete' END) AS profile_status
       FROM public.mentees m
       LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
       WHERE m.mentor_id = $1
       ORDER BY m.created_at DESC
       LIMIT 6`,
      [mentorId]
    );

    // Recent Issues
    const recentIssues = await pool.query(
      `SELECT i.*, m.full_name AS mentee_name, m.roll_number
       FROM public.issues i
       JOIN public.mentees m ON m.id = i.mentee_id
       WHERE i.mentor_id = $1
       ORDER BY i.created_at DESC
       LIMIT 5`,
      [mentorId]
    );

    // Recent Achievements
    const recentAchievements = await pool.query(
      `SELECT a.*, m.full_name AS mentee_name, m.roll_number
       FROM public.achievements a
       JOIN public.mentees m ON m.id = a.mentee_id
       WHERE a.mentor_id = $1
       ORDER BY a.created_at DESC
       LIMIT 5`,
      [mentorId]
    );

    // Active Form Links Count
    const linksCountRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.form_links WHERE mentor_id = $1 AND is_active = true AND expires_at > NOW()`,
      [mentorId]
    );
    const activeFormLinks = linksCountRes.rows[0].count;

    res.json({
      stats: {
        totalMentees,
        completedProfiles,
        incompleteProfiles,
        totalAchievements,
        pendingAchievements,
        totalResults,
        openIssues,
        resolvedIssues,
        activeFormLinks,
      },
      recentMentees: recentMentees.rows,
      recentIssues: recentIssues.rows,
      recentAchievements: recentAchievements.rows,
      mentor: req.mentor,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Could not fetch dashboard analytics' });
  }
});

// ─────────────────────────────────────────────────
// 3. FORM LINKS MANAGEMENT
// ─────────────────────────────────────────────────

// POST /api/form-links — Generate Unique Form Link
app.post('/api/form-links', authenticateToken, async (req, res) => {
  try {
    const { department, batch, academic_year, purpose, expires_in_days } = req.body;
    const token = randomUUID();
    const days = Number(expires_in_days) || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO public.form_links
         (mentor_id, token, department, batch, academic_year, purpose, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.mentor.id,
        token,
        department || req.mentor.department || null,
        batch || req.mentor.batch || null,
        academic_year || '2026-27',
        purpose || 'Student Profile & Academic Status Submission',
        expiresAt,
      ]
    );

    res.status(201).json({
      message: 'Form link generated successfully',
      link: result.rows[0],
    });
  } catch (err) {
    console.error('Generate form link error:', err);
    res.status(500).json({ error: 'Could not generate form link' });
  }
});

// GET /api/form-links — List Links for Authenticated Mentor
app.get('/api/form-links', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.form_links 
       WHERE mentor_id = $1 
       ORDER BY created_at DESC`,
      [req.mentor.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch form links error:', err);
    res.status(500).json({ error: 'Could not fetch form links' });
  }
});

// PATCH /api/form-links/:id/status — Toggle Form Link Status
app.patch('/api/form-links/:id/status', authenticateToken, async (req, res) => {
  try {
    const linkId = Number(req.params.id);
    const { is_active } = req.body;

    const result = await pool.query(
      `UPDATE public.form_links 
       SET is_active = $1 
       WHERE id = $2 AND mentor_id = $3
       RETURNING *`,
      [Boolean(is_active), linkId, req.mentor.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form link not found' });
    }

    res.json({ message: 'Form link status updated', link: result.rows[0] });
  } catch (err) {
    console.error('Update link status error:', err);
    res.status(500).json({ error: 'Could not update link status' });
  }
});

// ─────────────────────────────────────────────────
// 4. PUBLIC MENTEE REGISTRATION FORM & UPLOADS
// ─────────────────────────────────────────────────

// POST /api/public/upload — Secure File Upload (Certificates, Results, Proofs)
app.post('/api/public/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'File upload failed.' });
  }
});

// GET /api/public/forms/:token — Validate & Load Form Info
app.get('/api/public/forms/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Check if token is in form_links
    const linkResult = await pool.query(
      `SELECT fl.*, m.full_name AS mentor_name, m.department AS mentor_department, m.college AS mentor_college, m.email AS mentor_email
       FROM public.form_links fl
       JOIN public.mentors m ON m.id = fl.mentor_id
       WHERE fl.token = $1`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or non-existent form link.' });
    }

    const link = linkResult.rows[0];

    if (!link.is_active) {
      return res.status(410).json({ error: 'This form link has been deactivated by the mentor.' });
    }

    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This form link has expired.' });
    }

    res.json({
      valid: true,
      link: {
        department: link.department,
        batch: link.batch,
        academic_year: link.academic_year,
        purpose: link.purpose,
        mentor_name: link.mentor_name,
        mentor_department: link.mentor_department,
        mentor_college: link.mentor_college,
      },
    });
  } catch (err) {
    console.error('Validate form token error:', err);
    res.status(500).json({ error: 'Could not validate form link' });
  }
});

// POST /api/public/forms/:token/submit — Comprehensive Multi-Section Submission
app.post('/api/public/forms/:token/submit', async (req, res) => {
  const client = await pool.connect();
  try {
    const { token } = req.params;

    // 1. Validate Form Link
    const linkResult = await client.query(
      `SELECT * FROM public.form_links WHERE token = $1`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or unknown form link.' });
    }

    const link = linkResult.rows[0];

    if (!link.is_active) {
      return res.status(410).json({ error: 'This form link is no longer accepting submissions.' });
    }

    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This form link has expired.' });
    }

    const mentorId = link.mentor_id;

    // Extract All 12 Sections
    const {
      // 1. Personal Details
      full_name,
      roll_number,
      university_roll_number,
      admission_number,
      course,
      course_degree,
      department,
      semester,
      academic_year,
      batch,
      section,
      college_name,
      email,
      phone,
      alt_phone,
      date_of_birth,
      gender,
      blood_group,
      house_no,
      street,
      locality,
      city,
      district,
      state,
      pincode,
      country = 'India',
      is_permanent_same = true,
      permanent_address,
      address,

      // 2. Family Information
      father_name,
      father_phone,
      father_email,
      father_occupation,
      mother_name,
      mother_phone,
      mother_email,
      mother_occupation,
      guardian_name,
      guardian_relationship,
      guardian_phone,
      guardian_occupation,
      parent_name,
      parent_phone,
      emergency_contact_name,
      emergency_contact_phone,

      // 3. Photographs
      student_photo_url,
      student_photo_filename,
      father_photo_url,
      father_photo_filename,
      mother_photo_url,
      mother_photo_filename,

      // 4. Class 10th
      tenth_board_name,
      tenth_board_type,
      tenth_school_name,
      tenth_year_of_passing,
      tenth_max_marks,
      tenth_marks_obtained,
      tenth_percentage,
      tenth_cgpa_grade,
      tenth_marksheet_url,
      tenth_marksheet_filename,

      // 5. Class 12th
      twelfth_board_name,
      twelfth_board_type,
      twelfth_school_name,
      twelfth_stream,
      twelfth_year_of_passing,
      twelfth_max_marks,
      twelfth_marks_obtained,
      twelfth_percentage,
      twelfth_cgpa_grade,
      twelfth_marksheet_url,
      twelfth_marksheet_filename,

      // 6. College Academic Details
      current_cgpa,
      current_sgpa,
      previous_sgpas = [],
      has_backlogs = false,
      total_backlogs = 0,
      academic_strengths,
      subjects_requiring_improvement,
      academic_goals,
      current_year,
      support_needed,

      // 7. Attendance Details
      attendance_semester,
      attendance_percentage,
      total_classes_conducted,
      classes_attended,
      subject_wise_attendance,
      attendance_challenges,
      low_attendance_reason,
      mentor_attendance_support,

      // 8. Academic Results (Array)
      academic_results = [],

      // 9. Achievements (Array)
      has_no_achievements = false,
      achievements = [],

      // 10. Issues (Array)
      has_no_issues = false,
      issues = [],

      // 11. Suggestions for Improving Education & University
      suggestions = {},

      // Skills & Additional (Preserve legacy)
      skills_technical,
      skills_soft,
      areas_of_interest,
      career_goals,
      preferred_career_path,
      certifications,
      internships,
      projects,
      extracurricular,
      challenges,
      mentor_support_topics,
      additional_info,
    } = req.body;

    if (!full_name || !roll_number || !email) {
      return res.status(400).json({ error: 'Full name, roll number, and email are required.' });
    }

    await client.query('BEGIN');

    // 2. Check or create/update Mentee in mentees table
    let menteeId;
    const existingMentee = await client.query(
      `SELECT id FROM public.mentees WHERE LOWER(roll_number) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1`,
      [roll_number.trim(), email.trim()]
    );

    const resolvedCourse = course || course_degree || 'B.Tech in Computer Science & Engineering';

    if (existingMentee.rows.length > 0) {
      menteeId = existingMentee.rows[0].id;
      await client.query(
        `UPDATE public.mentees SET
           mentor_id = $1,
           full_name = $2,
           email = $3,
           roll_number = $4,
           admission_number = COALESCE($5, admission_number),
           university_roll_number = COALESCE($6, university_roll_number),
           course = COALESCE($7, course),
           department = COALESCE($8, department),
           college_name = COALESCE($9, college_name),
           semester = COALESCE($10, semester),
           academic_year = COALESCE($11, academic_year),
           batch = COALESCE($12, batch),
           section = COALESCE($13, section),
           phone = COALESCE($14, phone),
           gender = COALESCE($15, gender),
           profile_status = 'Complete',
           updated_at = NOW()
         WHERE id = $16`,
        [
          mentorId,
          full_name.trim(),
          email.trim(),
          roll_number.trim(),
          admission_number || null,
          university_roll_number || null,
          resolvedCourse,
          department || link.department || null,
          college_name || link.mentor_college || null,
          semester ? Number(semester) : null,
          academic_year || link.academic_year || null,
          batch || link.batch || null,
          section || null,
          phone || null,
          gender || null,
          menteeId,
        ]
      );
    } else {
      const newMentee = await client.query(
        `INSERT INTO public.mentees
           (mentor_id, full_name, email, roll_number, admission_number, university_roll_number, course, department, college_name, semester, academic_year, batch, section, phone, gender, profile_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Complete')
         RETURNING id`,
        [
          mentorId,
          full_name.trim(),
          email.trim(),
          roll_number.trim(),
          admission_number || null,
          university_roll_number || null,
          resolvedCourse,
          department || link.department || null,
          college_name || link.mentor_college || null,
          semester ? Number(semester) : null,
          academic_year || link.academic_year || null,
          batch || link.batch || null,
          section || null,
          phone || null,
          gender || null,
        ]
      );
      menteeId = newMentee.rows[0].id;
    }

    const referenceNumber = `MEN-${new Date().getFullYear()}-${menteeId.toString().padStart(5, '0')}`;

    // Combine address if not separately given
    const formattedCurrentAddress = address || [house_no, street, locality, city, district, state, pincode].filter(Boolean).join(', ');

    // 3. Upsert Mentee Profile
    await client.query(
      `INSERT INTO public.mentee_profiles
         (mentee_id, phone, alt_phone, date_of_birth, blood_group,
          house_no, street, locality, city, district, state, pincode, country,
          is_permanent_same, permanent_address, address,
          father_name, father_phone, father_email, father_occupation,
          mother_name, mother_phone, mother_email, mother_occupation,
          guardian_name, guardian_relationship, guardian_phone, guardian_occupation,
          parent_name, parent_phone, emergency_contact_name, emergency_contact_phone,
          student_photo_url, student_photo_filename,
          father_photo_url, father_photo_filename,
          mother_photo_url, mother_photo_filename,
          tenth_board_name, tenth_board_type, tenth_school_name, tenth_year_of_passing,
          tenth_max_marks, tenth_marks_obtained, tenth_percentage, tenth_cgpa_grade,
          tenth_marksheet_url, tenth_marksheet_filename,
          twelfth_board_name, twelfth_board_type, twelfth_school_name, twelfth_stream, twelfth_year_of_passing,
          twelfth_max_marks, twelfth_marks_obtained, twelfth_percentage, twelfth_cgpa_grade,
          twelfth_marksheet_url, twelfth_marksheet_filename,
          current_cgpa, current_sgpa, previous_sgpas, has_backlogs, total_backlogs,
          academic_strengths, subjects_requiring_improvement, academic_goals, current_year, support_needed,
          attendance_semester, attendance_percentage, total_classes_conducted, classes_attended,
          subject_wise_attendance, attendance_challenges, low_attendance_reason, mentor_attendance_support,
          has_no_achievements, has_no_issues, submission_reference,
          skills_technical, skills_soft, areas_of_interest, career_goals, preferred_career_path,
          certifications, internships, projects, extracurricular, challenges, mentor_support_topics, additional_info,
          declaration_accepted, submitted_at, updated_at)
       VALUES 
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69,$70,$71,$72,$73,$74,$75,$76,$77,$78,$79,$80,$81,$82,$83,$84,$85,$86,$87,$88,$89,$90,$91,$92,TRUE,NOW(),NOW())
       ON CONFLICT (mentee_id) DO UPDATE SET
         phone = EXCLUDED.phone,
         alt_phone = EXCLUDED.alt_phone,
         date_of_birth = EXCLUDED.date_of_birth,
         blood_group = EXCLUDED.blood_group,
         house_no = EXCLUDED.house_no,
         street = EXCLUDED.street,
         locality = EXCLUDED.locality,
         city = EXCLUDED.city,
         district = EXCLUDED.district,
         state = EXCLUDED.state,
         pincode = EXCLUDED.pincode,
         country = EXCLUDED.country,
         is_permanent_same = EXCLUDED.is_permanent_same,
         permanent_address = EXCLUDED.permanent_address,
         address = EXCLUDED.address,
         father_name = EXCLUDED.father_name,
         father_phone = EXCLUDED.father_phone,
         father_email = EXCLUDED.father_email,
         father_occupation = EXCLUDED.father_occupation,
         mother_name = EXCLUDED.mother_name,
         mother_phone = EXCLUDED.mother_phone,
         mother_email = EXCLUDED.mother_email,
         mother_occupation = EXCLUDED.mother_occupation,
         guardian_name = EXCLUDED.guardian_name,
         guardian_relationship = EXCLUDED.guardian_relationship,
         guardian_phone = EXCLUDED.guardian_phone,
         guardian_occupation = EXCLUDED.guardian_occupation,
         parent_name = EXCLUDED.parent_name,
         parent_phone = EXCLUDED.parent_phone,
         emergency_contact_name = EXCLUDED.emergency_contact_name,
         emergency_contact_phone = EXCLUDED.emergency_contact_phone,
         student_photo_url = COALESCE(EXCLUDED.student_photo_url, public.mentee_profiles.student_photo_url),
         student_photo_filename = COALESCE(EXCLUDED.student_photo_filename, public.mentee_profiles.student_photo_filename),
         father_photo_url = COALESCE(EXCLUDED.father_photo_url, public.mentee_profiles.father_photo_url),
         father_photo_filename = COALESCE(EXCLUDED.father_photo_filename, public.mentee_profiles.father_photo_filename),
         mother_photo_url = COALESCE(EXCLUDED.mother_photo_url, public.mentee_profiles.mother_photo_url),
         mother_photo_filename = COALESCE(EXCLUDED.mother_photo_filename, public.mentee_profiles.mother_photo_filename),
         tenth_board_name = EXCLUDED.tenth_board_name,
         tenth_board_type = EXCLUDED.tenth_board_type,
         tenth_school_name = EXCLUDED.tenth_school_name,
         tenth_year_of_passing = EXCLUDED.tenth_year_of_passing,
         tenth_max_marks = EXCLUDED.tenth_max_marks,
         tenth_marks_obtained = EXCLUDED.tenth_marks_obtained,
         tenth_percentage = EXCLUDED.tenth_percentage,
         tenth_cgpa_grade = EXCLUDED.tenth_cgpa_grade,
         tenth_marksheet_url = COALESCE(EXCLUDED.tenth_marksheet_url, public.mentee_profiles.tenth_marksheet_url),
         tenth_marksheet_filename = COALESCE(EXCLUDED.tenth_marksheet_filename, public.mentee_profiles.tenth_marksheet_filename),
         twelfth_board_name = EXCLUDED.twelfth_board_name,
         twelfth_board_type = EXCLUDED.twelfth_board_type,
         twelfth_school_name = EXCLUDED.twelfth_school_name,
         twelfth_stream = EXCLUDED.twelfth_stream,
         twelfth_year_of_passing = EXCLUDED.twelfth_year_of_passing,
         twelfth_max_marks = EXCLUDED.twelfth_max_marks,
         twelfth_marks_obtained = EXCLUDED.twelfth_marks_obtained,
         twelfth_percentage = EXCLUDED.twelfth_percentage,
         twelfth_cgpa_grade = EXCLUDED.twelfth_cgpa_grade,
         twelfth_marksheet_url = COALESCE(EXCLUDED.twelfth_marksheet_url, public.mentee_profiles.twelfth_marksheet_url),
         twelfth_marksheet_filename = COALESCE(EXCLUDED.twelfth_marksheet_filename, public.mentee_profiles.twelfth_marksheet_filename),
         current_cgpa = EXCLUDED.current_cgpa,
         current_sgpa = EXCLUDED.current_sgpa,
         previous_sgpas = EXCLUDED.previous_sgpas,
         has_backlogs = EXCLUDED.has_backlogs,
         total_backlogs = EXCLUDED.total_backlogs,
         academic_strengths = EXCLUDED.academic_strengths,
         subjects_requiring_improvement = EXCLUDED.subjects_requiring_improvement,
         academic_goals = EXCLUDED.academic_goals,
         current_year = EXCLUDED.current_year,
         support_needed = EXCLUDED.support_needed,
         attendance_semester = EXCLUDED.attendance_semester,
         attendance_percentage = EXCLUDED.attendance_percentage,
         total_classes_conducted = EXCLUDED.total_classes_conducted,
         classes_attended = EXCLUDED.classes_attended,
         subject_wise_attendance = EXCLUDED.subject_wise_attendance,
         attendance_challenges = EXCLUDED.attendance_challenges,
         low_attendance_reason = EXCLUDED.low_attendance_reason,
         mentor_attendance_support = EXCLUDED.mentor_attendance_support,
         has_no_achievements = EXCLUDED.has_no_achievements,
         has_no_issues = EXCLUDED.has_no_issues,
         submission_reference = EXCLUDED.submission_reference,
         skills_technical = EXCLUDED.skills_technical,
         skills_soft = EXCLUDED.skills_soft,
         areas_of_interest = EXCLUDED.areas_of_interest,
         career_goals = EXCLUDED.career_goals,
         preferred_career_path = EXCLUDED.preferred_career_path,
         certifications = EXCLUDED.certifications,
         internships = EXCLUDED.internships,
         projects = EXCLUDED.projects,
         extracurricular = EXCLUDED.extracurricular,
         challenges = EXCLUDED.challenges,
         mentor_support_topics = EXCLUDED.mentor_support_topics,
         additional_info = EXCLUDED.additional_info,
         declaration_accepted = TRUE,
         submitted_at = NOW(),
         updated_at = NOW()`,
      [
        menteeId, // 1
        phone || null, // 2
        alt_phone || null, // 3
        date_of_birth || null, // 4
        blood_group || null, // 5
        house_no || null, // 6
        street || null, // 7
        locality || null, // 8
        city || null, // 9
        district || null, // 10
        state || null, // 11
        pincode || null, // 12
        country || 'India', // 13
        Boolean(is_permanent_same), // 14
        permanent_address || null, // 15
        formattedCurrentAddress || null, // 16
        father_name || parent_name || null, // 17
        father_phone || parent_phone || null, // 18
        father_email || null, // 19
        father_occupation || null, // 20
        mother_name || null, // 21
        mother_phone || null, // 22
        mother_email || null, // 23
        mother_occupation || null, // 24
        guardian_name || null, // 25
        guardian_relationship || null, // 26
        guardian_phone || null, // 27
        guardian_occupation || null, // 28
        parent_name || father_name || null, // 29
        parent_phone || father_phone || null, // 30
        emergency_contact_name || null, // 31
        emergency_contact_phone || null, // 32
        student_photo_url || null, // 33
        student_photo_filename || null, // 34
        father_photo_url || null, // 35
        father_photo_filename || null, // 36
        mother_photo_url || null, // 37
        mother_photo_filename || null, // 38
        tenth_board_name || null, // 39
        tenth_board_type || 'CBSE', // 40
        tenth_school_name || null, // 41
        tenth_year_of_passing ? Number(tenth_year_of_passing) : null, // 42
        tenth_max_marks != null && tenth_max_marks !== '' ? Number(tenth_max_marks) : null, // 43
        tenth_marks_obtained != null && tenth_marks_obtained !== '' ? Number(tenth_marks_obtained) : null, // 44
        tenth_percentage != null && tenth_percentage !== '' ? Number(tenth_percentage) : null, // 45
        tenth_cgpa_grade || null, // 46
        tenth_marksheet_url || null, // 47
        tenth_marksheet_filename || null, // 48
        twelfth_board_name || null, // 49
        twelfth_board_type || 'CBSE', // 50
        twelfth_school_name || null, // 51
        twelfth_stream || 'Science', // 52
        twelfth_year_of_passing ? Number(twelfth_year_of_passing) : null, // 53
        twelfth_max_marks != null && twelfth_max_marks !== '' ? Number(twelfth_max_marks) : null, // 54
        twelfth_marks_obtained != null && twelfth_marks_obtained !== '' ? Number(twelfth_marks_obtained) : null, // 55
        twelfth_percentage != null && twelfth_percentage !== '' ? Number(twelfth_percentage) : null, // 56
        twelfth_cgpa_grade || null, // 57
        twelfth_marksheet_url || null, // 58
        twelfth_marksheet_filename || null, // 59
        current_cgpa != null && current_cgpa !== '' ? Number(current_cgpa) : null, // 60
        current_sgpa != null && current_sgpa !== '' ? Number(current_sgpa) : null, // 61
        JSON.stringify(Array.isArray(previous_sgpas) ? previous_sgpas : []), // 62
        Boolean(has_backlogs), // 63
        total_backlogs != null && total_backlogs !== '' ? Number(total_backlogs) : 0, // 64
        academic_strengths || null, // 65
        subjects_requiring_improvement || null, // 66
        academic_goals || null, // 67
        current_year ? Number(current_year) : null, // 68
        support_needed || null, // 69
        attendance_semester ? Number(attendance_semester) : (semester ? Number(semester) : null), // 70
        attendance_percentage != null && attendance_percentage !== '' ? Number(attendance_percentage) : null, // 71
        total_classes_conducted != null && total_classes_conducted !== '' ? Number(total_classes_conducted) : null, // 72
        classes_attended != null && classes_attended !== '' ? Number(classes_attended) : null, // 73
        subject_wise_attendance || null, // 74
        attendance_challenges || null, // 75
        low_attendance_reason || null, // 76
        mentor_attendance_support || null, // 77
        Boolean(has_no_achievements), // 78
        Boolean(has_no_issues), // 79
        referenceNumber, // 80
        skills_technical || null, // 81
        skills_soft || null, // 82
        areas_of_interest || null, // 83
        career_goals || null, // 84
        preferred_career_path || null, // 85
        certifications || null, // 86
        internships || null, // 87
        projects || null, // 88
        extracurricular || null, // 89
        challenges || null, // 90
        mentor_support_topics || null, // 91
        additional_info || null, // 92
      ]
    );

    // 4. Insert Achievements if provided (and student didn't check has_no_achievements)
    if (!has_no_achievements && Array.isArray(achievements) && achievements.length > 0) {
      for (const ach of achievements) {
        if (ach.title && ach.title.trim()) {
          await client.query(
            `INSERT INTO public.achievements
               (mentee_id, mentor_id, title, category, description, achievement_date, organization, competition_name, level, position, is_team_achievement, team_name, role_in_team, certificate_url, certificate_filename, proof_url, proof_filename)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
              menteeId,
              mentorId,
              ach.title.trim(),
              ach.category || 'academic',
              ach.description || null,
              ach.achievement_date || null,
              ach.organization || null,
              ach.competition_name || null,
              ach.level || 'college',
              ach.position || null,
              Boolean(ach.is_team_achievement),
              ach.team_name || null,
              ach.role_in_team || null,
              ach.certificate_url || null,
              ach.certificate_filename || null,
              ach.proof_url || ach.certificate_url || null,
              ach.proof_filename || ach.certificate_filename || null,
            ]
          );
        }
      }
    }

    // 5. Insert Academic Results if provided
    if (Array.isArray(academic_results) && academic_results.length > 0) {
      for (const resItem of academic_results) {
        if (resItem.examination_name && resItem.examination_name.trim()) {
          await client.query(
            `INSERT INTO public.academic_results
               (mentee_id, mentor_id, examination_name, academic_year, semester, subject, max_marks, marks_obtained, percentage, cgpa, sgpa, result_status, result_date, remarks, document_url, document_filename)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
              menteeId,
              mentorId,
              resItem.examination_name.trim(),
              resItem.academic_year || academic_year || null,
              resItem.semester ? Number(resItem.semester) : null,
              resItem.subject || null,
              resItem.max_marks ? Number(resItem.max_marks) : null,
              resItem.marks_obtained ? Number(resItem.marks_obtained) : null,
              resItem.percentage ? Number(resItem.percentage) : null,
              resItem.cgpa ? Number(resItem.cgpa) : null,
              resItem.sgpa ? Number(resItem.sgpa) : null,
              resItem.result_status || 'Pass',
              resItem.result_date || null,
              resItem.remarks || null,
              resItem.document_url || null,
              resItem.document_filename || null,
            ]
          );
        }
      }
    }

    // 6. Insert Issues if reported (and student didn't check has_no_issues)
    if (!has_no_issues && Array.isArray(issues) && issues.length > 0) {
      for (const issue of issues) {
        if (issue.title && issue.title.trim() && issue.description) {
          await client.query(
            `INSERT INTO public.issues
               (mentee_id, mentor_id, category, title, description, priority, status, issue_started_when, impact_on_studies, support_required, document_url, document_filename, preferred_contact)
             VALUES ($1, $2, $3, $4, $5, $6, 'New', $7, $8, $9, $10, $11, $12)`,
            [
              menteeId,
              mentorId,
              issue.category || 'academic',
              issue.title.trim(),
              issue.description.trim(),
              issue.priority || 'Medium',
              issue.issue_started_when || null,
              issue.impact_on_studies || null,
              issue.support_required || null,
              issue.document_url || null,
              issue.document_filename || null,
              issue.preferred_contact || null,
            ]
          );
        }
      }
    }

    // 7. Upsert University Improvement Suggestions (Section 11)
    if (suggestions && Object.keys(suggestions).length > 0) {
      await client.query(
        `INSERT INTO public.university_suggestions
           (mentee_id, mentor_id,
            teaching_learning_suggestions, practical_explanation_topics, lab_facilities_changes,
            infrastructure_improvements, internship_placement_guidance, technical_workshops_wanted,
            mentor_communication_improvements, academic_performance_support, exam_administration_changes,
            wellbeing_campus_life, other_suggestions, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         ON CONFLICT (mentee_id) DO UPDATE SET
           teaching_learning_suggestions = EXCLUDED.teaching_learning_suggestions,
           practical_explanation_topics = EXCLUDED.practical_explanation_topics,
           lab_facilities_changes = EXCLUDED.lab_facilities_changes,
           infrastructure_improvements = EXCLUDED.infrastructure_improvements,
           internship_placement_guidance = EXCLUDED.internship_placement_guidance,
           technical_workshops_wanted = EXCLUDED.technical_workshops_wanted,
           mentor_communication_improvements = EXCLUDED.mentor_communication_improvements,
           academic_performance_support = EXCLUDED.academic_performance_support,
           exam_administration_changes = EXCLUDED.exam_administration_changes,
           wellbeing_campus_life = EXCLUDED.wellbeing_campus_life,
           other_suggestions = EXCLUDED.other_suggestions,
           updated_at = NOW()`,
        [
          menteeId,
          mentorId,
          suggestions.teaching_learning_suggestions || null,
          suggestions.practical_explanation_topics || null,
          suggestions.lab_facilities_changes || null,
          suggestions.infrastructure_improvements || null,
          suggestions.internship_placement_guidance || null,
          suggestions.technical_workshops_wanted || null,
          suggestions.mentor_communication_improvements || null,
          suggestions.academic_performance_support || null,
          suggestions.exam_administration_changes || null,
          suggestions.wellbeing_campus_life || null,
          suggestions.other_suggestions || null,
        ]
      );
    }

    // 8. Update submissions count on link
    await client.query(
      `UPDATE public.form_links SET submissions_count = submissions_count + 1 WHERE id = $1`,
      [link.id]
    );

    // 9. Create in-app Notifications for Mentor based on their notification preferences
    const mentorSetRes = await client.query('SELECT settings FROM public.mentors WHERE id = $1', [mentorId]);
    const mSettings = mentorSetRes.rows[0]?.settings || {};

    if (mSettings.notif_new_mentee !== false) {
      await client.query(
        `INSERT INTO public.notifications (mentor_id, title, message, type, link_url)
         VALUES ($1, $2, $3, 'submission', $4)`,
        [
          mentorId,
          'Comprehensive Mentee Registration',
          `${full_name.trim()} (${roll_number.trim()}) submitted complete 12-section profile.`,
          `/mentees/${menteeId}`,
        ]
      ).catch(() => {});
    }

    if (mSettings.notif_issues !== false && issues && issues.length > 0) {
      await client.query(
        `INSERT INTO public.notifications (mentor_id, title, message, type, link_url)
         VALUES ($1, $2, $3, 'issue', $4)`,
        [
          mentorId,
          'Student Issue Reported',
          `${full_name.trim()} reported ${issues.length} issue(s) requiring mentor guidance.`,
          `/mentees/${menteeId}`,
        ]
      ).catch(() => {});
    }

    if (mSettings.notif_achievements !== false && achievements && achievements.length > 0) {
      await client.query(
        `INSERT INTO public.notifications (mentor_id, title, message, type, link_url)
         VALUES ($1, $2, $3, 'achievement', $4)`,
        [
          mentorId,
          'Achievement Verification Pending',
          `${full_name.trim()} submitted ${achievements.length} achievement(s) for verification.`,
          `/mentees/${menteeId}`,
        ]
      ).catch(() => {});
    }

    await client.query('COMMIT');

    res.json({
      message: 'Mentee registration completed successfully',
      reference_number: referenceNumber,
      mentee: {
        id: menteeId,
        full_name,
        roll_number,
        email,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Mentee submission error:', err);
    res.status(500).json({ error: 'Failed to process student submission. Please try again.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────
// 5. MENTEES DIRECTORY & PROFILE (Scoped to Mentor)
// ─────────────────────────────────────────────────

// POST /api/mentees — Add Mentee Directly (Supports authenticated mentor or fallback)
app.post('/api/mentees', async (req, res) => {
  try {
    let mentorId = null;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        mentorId = decoded.mentorId;
      } catch (e) {
        // ignore invalid token
      }
    }

    // If not in token, check body
    if (!mentorId && req.body.mentor_id) {
      mentorId = Number(req.body.mentor_id) || req.body.mentor_id;
    }

    // Fallback to first mentor if still null
    if (!mentorId) {
      const defaultMentor = await pool.query('SELECT id FROM public.mentors ORDER BY id ASC LIMIT 1');
      if (defaultMentor.rows.length > 0) {
        mentorId = defaultMentor.rows[0].id;
      }
    }

    const {
      full_name,
      email,
      roll_number,
      admission_number,
      department,
      semester,
      academic_year,
      batch,
      section,
      phone,
      gender,
    } = req.body;

    if (!full_name || !email || !roll_number) {
      return res.status(400).json({ error: 'Full name, email, and roll number are required.' });
    }

    let parsedSemester = null;
    if (semester != null && semester !== '') {
      const semMatch = String(semester).match(/\d+/);
      parsedSemester = semMatch ? parseInt(semMatch[0], 10) : null;
    }

    const insertResult = await pool.query(
      `INSERT INTO public.mentees
         (mentor_id, full_name, email, roll_number, admission_number, department, semester, academic_year, batch, section, phone, gender, profile_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Incomplete')
       RETURNING *`,
      [
        mentorId,
        full_name.trim(),
        email.trim(),
        roll_number.trim(),
        admission_number || null,
        department ? department.trim() : null,
        parsedSemester,
        academic_year || '2026-27',
        batch || null,
        section || null,
        phone || null,
        gender || null,
      ]
    );

    const newMentee = insertResult.rows[0];

    // Ensure a corresponding mentee_profiles row exists
    await pool.query(
      `INSERT INTO public.mentee_profiles (mentee_id) VALUES ($1) ON CONFLICT (mentee_id) DO NOTHING`,
      [newMentee.id]
    );

    // Create in-app notification for the mentor
    if (mentorId) {
      await pool.query(
        `INSERT INTO public.notifications (mentor_id, title, message, type, link_url)
         VALUES ($1, $2, $3, 'system', $4)`,
        [
          mentorId,
          'Mentee Added',
          `${newMentee.full_name} (${newMentee.roll_number}) was added to your mentees list.`,
          `/mentees/${newMentee.id}`,
        ]
      ).catch(() => {});
    }

    return res.status(201).json({
      message: 'Mentee added successfully',
      mentee: newMentee,
      ...newMentee,
    });
  } catch (err) {
    console.error('Error adding mentee:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A mentee with this roll number or email already exists in the system.' });
    }
    return res.status(500).json({ error: 'Database error adding mentee.' });
  }
});

// GET /api/mentees — List Mentees for Authenticated Mentor (with unauthenticated fallback)
app.get('/api/mentees', async (req, res) => {
  try {
    let mentorId = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        mentorId = decoded.mentorId;
      } catch (err) {
        return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
      }
    } else {
      // Unauthenticated fallback: pick default demo mentor
      const defaultMentor = await pool.query('SELECT id FROM public.mentors ORDER BY id ASC LIMIT 1');
      if (defaultMentor.rows.length > 0) {
        mentorId = defaultMentor.rows[0].id;
      }
    }
    const { search, department, batch, semester, status, sort = 'newest', page = 1, limit = 25 } = req.query;

    let query = `
      SELECT m.id, m.full_name, m.email, m.roll_number, m.admission_number,
             m.department, m.course, COALESCE(m.semester, p.attendance_semester, 1) AS semester,
             m.batch, m.academic_year, m.section, m.phone,
             m.created_at, m.updated_at,
             p.student_photo_url,
             p.current_cgpa, p.attendance_percentage, p.total_backlogs, p.submitted_at,
             COALESCE(m.profile_status, CASE WHEN p.submitted_at IS NOT NULL THEN 'Complete' ELSE 'Incomplete' END) AS profile_status,
             (SELECT COUNT(*)::int FROM public.issues i WHERE i.mentee_id = m.id AND i.status IN ('New', 'Under Review', 'In Progress')) AS open_issues_count,
             (SELECT COUNT(*)::int FROM public.achievements a WHERE a.mentee_id = m.id) AS achievements_count
      FROM public.mentees m
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
      WHERE m.mentor_id = $1
    `;

    let countQuery = `
      SELECT COUNT(m.id)::int AS count
      FROM public.mentees m
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
      WHERE m.mentor_id = $1
    `;

    const params = [mentorId];
    const countParams = [mentorId];
    let pIdx = 2;

    if (search && search.trim()) {
      const searchClause = ` AND (LOWER(m.full_name) LIKE $${pIdx} OR LOWER(m.roll_number) LIKE $${pIdx} OR LOWER(COALESCE(m.admission_number, '')) LIKE $${pIdx} OR LOWER(m.email) LIKE $${pIdx})`;
      query += searchClause;
      countQuery += searchClause;
      params.push(`%${search.trim().toLowerCase()}%`);
      countParams.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    if (department) {
      const deptClause = ` AND m.department = $${pIdx}`;
      query += deptClause;
      countQuery += deptClause;
      params.push(department);
      countParams.push(department);
      pIdx++;
    }

    if (batch) {
      const batchClause = ` AND m.batch = $${pIdx}`;
      query += batchClause;
      countQuery += batchClause;
      params.push(batch);
      countParams.push(batch);
      pIdx++;
    }

    if (semester) {
      const semClause = ` AND COALESCE(m.semester, p.attendance_semester) = $${pIdx}`;
      query += semClause;
      countQuery += semClause;
      params.push(Number(semester));
      countParams.push(Number(semester));
      pIdx++;
    }

    if (status === 'Complete') {
      const statusClause = ` AND (p.submitted_at IS NOT NULL OR m.profile_status = 'Complete')`;
      query += statusClause;
      countQuery += statusClause;
    } else if (status === 'Incomplete') {
      const statusClause = ` AND p.submitted_at IS NULL AND (m.profile_status IS NULL OR m.profile_status != 'Complete')`;
      query += statusClause;
      countQuery += statusClause;
    }

    // Sorting
    if (sort === 'name_asc') query += ` ORDER BY m.full_name ASC`;
    else if (sort === 'name_desc') query += ` ORDER BY m.full_name DESC`;
    else if (sort === 'roll_asc') query += ` ORDER BY m.roll_number ASC`;
    else if (sort === 'cgpa_desc') query += ` ORDER BY p.current_cgpa DESC NULLS LAST`;
    else if (sort === 'updated_desc') query += ` ORDER BY COALESCE(m.updated_at, m.created_at) DESC`;
    else query += ` ORDER BY m.created_at DESC`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    params.push(Number(limit), offset);

    const [result, totalCountRes] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      mentees: result.rows,
      total: totalCountRes.rows[0]?.count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('Fetch mentees error:', err);
    res.status(500).json({ error: 'Could not fetch mentees' });
  }
});

// GET /api/mentees/semesters — Dynamic Semester Summary for Mentor
app.get('/api/mentees/semesters', async (req, res) => {
  try {
    let mentorId = 1;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        mentorId = decoded.mentorId;
      } catch (err) {
        return res.status(403).json({ error: 'Session expired or invalid token.' });
      }
    } else {
      const defaultMentor = await pool.query('SELECT id FROM public.mentors ORDER BY id ASC LIMIT 1');
      if (defaultMentor.rows.length > 0) mentorId = defaultMentor.rows[0].id;
    }

    const summaryQuery = `
      SELECT 
        COALESCE(m.semester, p.attendance_semester, 1)::int AS semester,
        COUNT(m.id)::int AS total_mentees,
        COUNT(CASE WHEN p.submitted_at IS NOT NULL OR m.profile_status = 'Complete' THEN 1 END)::int AS completed_profiles,
        COUNT(CASE WHEN p.submitted_at IS NULL AND (m.profile_status IS NULL OR m.profile_status != 'Complete') THEN 1 END)::int AS pending_profiles,
        ARRAY_AGG(DISTINCT m.department) FILTER (WHERE m.department IS NOT NULL) AS departments,
        ARRAY_AGG(DISTINCT m.batch) FILTER (WHERE m.batch IS NOT NULL) AS batches,
        ARRAY_AGG(DISTINCT m.academic_year) FILTER (WHERE m.academic_year IS NOT NULL) AS academic_years,
        ROUND(AVG(NULLIF(p.attendance_percentage, 0))::numeric, 1) AS avg_attendance,
        ROUND(AVG(NULLIF(p.current_cgpa, 0))::numeric, 2) AS avg_cgpa
      FROM public.mentees m
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
      WHERE m.mentor_id = $1
      GROUP BY COALESCE(m.semester, p.attendance_semester, 1)
      ORDER BY semester ASC
    `;

    const [result, totalCountRes] = await Promise.all([
      pool.query(summaryQuery, [mentorId]),
      pool.query(`SELECT COUNT(*)::int AS count FROM public.mentees WHERE mentor_id = $1`, [mentorId]),
    ]);

    function getSemesterLabel(sem) {
      const s = Number(sem);
      if (s === 1) return '1st Semester';
      if (s === 2) return '2nd Semester';
      if (s === 3) return '3rd Semester';
      return `${s}th Semester`;
    }

    const semesters = result.rows.map((row) => ({
      semester: row.semester,
      semester_label: getSemesterLabel(row.semester),
      total_mentees: row.total_mentees,
      completed_profiles: row.completed_profiles,
      pending_profiles: row.pending_profiles,
      departments: row.departments || [],
      batches: row.batches || [],
      academic_years: row.academic_years || [],
      avg_attendance: row.avg_attendance ? Number(row.avg_attendance) : null,
      avg_cgpa: row.avg_cgpa ? Number(row.avg_cgpa) : null,
    }));

    res.json({
      semesters,
      total_assigned_mentees: totalCountRes.rows[0]?.count || 0,
      active_semesters_count: semesters.length,
    });
  } catch (err) {
    console.error('Fetch mentee semesters error:', err);
    res.status(500).json({ error: 'Could not fetch semester summary.' });
  }
});

// GET /api/mentees/:id — Full Mentee Profile (Strictly Scoped)
app.get('/api/mentees/:id', authenticateToken, async (req, res) => {
  try {
    const menteeId = Number(req.params.id);
    const mentorId = req.mentor.id;

    // Fetch mentee basic info
    const menteeRes = await pool.query(
      `SELECT m.*, 
              COALESCE(m.profile_status, CASE WHEN p.submitted_at IS NOT NULL THEN 'Complete' ELSE 'Incomplete' END) AS profile_status
       FROM public.mentees m
       LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
       WHERE m.id = $1 AND m.mentor_id = $2`,
      [menteeId, mentorId]
    );

    if (menteeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mentee not found or not assigned to your account.' });
    }

    const mentee = menteeRes.rows[0];

    // Fetch profile
    const profileRes = await pool.query(
      `SELECT * FROM public.mentee_profiles WHERE mentee_id = $1`,
      [menteeId]
    );
    const profile = profileRes.rows[0] || null;

    // Fetch achievements
    const achRes = await pool.query(
      `SELECT * FROM public.achievements WHERE mentee_id = $1 ORDER BY created_at DESC`,
      [menteeId]
    );

    // Fetch results
    const resultsRes = await pool.query(
      `SELECT * FROM public.academic_results WHERE mentee_id = $1 ORDER BY semester ASC, created_at DESC`,
      [menteeId]
    );

    // Fetch issues
    const issuesRes = await pool.query(
      `SELECT * FROM public.issues WHERE mentee_id = $1 ORDER BY created_at DESC`,
      [menteeId]
    );

    // Fetch mentor notes (mentor-only)
    const notesRes = await pool.query(
      `SELECT * FROM public.mentor_notes WHERE mentee_id = $1 AND mentor_id = $2 ORDER BY created_at DESC`,
      [menteeId, mentorId]
    );

    // Fetch university suggestions (Section 11)
    const suggestionsRes = await pool.query(
      `SELECT * FROM public.university_suggestions WHERE mentee_id = $1`,
      [menteeId]
    );

    res.json({
      mentee,
      profile,
      achievements: achRes.rows,
      academic_results: resultsRes.rows,
      issues: issuesRes.rows,
      mentor_notes: notesRes.rows,
      university_suggestions: suggestionsRes.rows[0] || null,
    });
  } catch (err) {
    console.error('Fetch mentee detail error:', err);
    res.status(500).json({ error: 'Could not fetch mentee details' });
  }
});

// PATCH /api/mentees/:id — Edit Permitted Mentee Details
app.patch('/api/mentees/:id', authenticateToken, async (req, res) => {
  try {
    const menteeId = Number(req.params.id);
    const mentorId = req.mentor.id;
    const { full_name, email, roll_number, department, semester, batch, section, phone } = req.body;

    const result = await pool.query(
      `UPDATE public.mentees SET
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         roll_number = COALESCE($3, roll_number),
         department = COALESCE($4, department),
         semester = COALESCE($5, semester),
         batch = COALESCE($6, batch),
         section = COALESCE($7, section),
         phone = COALESCE($8, phone),
         updated_at = NOW()
       WHERE id = $9 AND mentor_id = $10
       RETURNING *`,
      [full_name, email, roll_number, department, semester ? Number(semester) : null, batch, section, phone, menteeId, mentorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mentee not found or not assigned to you.' });
    }

    res.json({ message: 'Mentee details updated', mentee: result.rows[0] });
  } catch (err) {
    console.error('Update mentee error:', err);
    res.status(500).json({ error: 'Could not update mentee' });
  }
});

// DELETE /api/mentees/:id — Remove/Delete mentee from mentor roster
app.delete('/api/mentees/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const menteeId = Number(req.params.id);
    const mentorId = req.mentor.id;

    if (!menteeId || isNaN(menteeId)) {
      return res.status(400).json({ error: 'Valid mentee ID is required.' });
    }

    // Verify mentee exists and belongs to this mentor
    const checkRes = await client.query(
      `SELECT id, full_name, roll_number FROM public.mentees WHERE id = $1 AND mentor_id = $2`,
      [menteeId, mentorId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mentee not found or not assigned to your account.' });
    }

    const targetMentee = checkRes.rows[0];

    await client.query('BEGIN');

    // Delete cascading references
    await client.query(`DELETE FROM public.mentor_notes WHERE mentee_id = $1`, [menteeId]);
    await client.query(`DELETE FROM public.university_suggestions WHERE mentee_id = $1`, [menteeId]);
    await client.query(`DELETE FROM public.achievements WHERE mentee_id = $1`, [menteeId]);
    await client.query(`DELETE FROM public.academic_results WHERE mentee_id = $1`, [menteeId]);
    await client.query(`DELETE FROM public.issues WHERE mentee_id = $1`, [menteeId]);
    await client.query(`DELETE FROM public.mentee_profiles WHERE mentee_id = $1`, [menteeId]);
    await client.query(`DELETE FROM public.mentees WHERE id = $1 AND mentor_id = $2`, [menteeId, mentorId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Mentee ${targetMentee.full_name} (${targetMentee.roll_number}) was removed successfully.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete mentee error:', err);
    res.status(500).json({ error: 'Failed to remove mentee record.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────
// 6. ACHIEVEMENTS & RESULTS MANAGEMENT
// ─────────────────────────────────────────────────

// GET /api/achievements — List achievements for mentor
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const { category, verification_status } = req.query;

    let query = `
      SELECT a.*, m.full_name AS mentee_name, m.roll_number, m.department, m.semester
      FROM public.achievements a
      JOIN public.mentees m ON m.id = a.mentee_id
      WHERE a.mentor_id = $1
    `;
    const params = [mentorId];
    let pIdx = 2;

    if (category) {
      query += ` AND a.category = $${pIdx}`;
      params.push(category);
      pIdx++;
    }

    if (verification_status) {
      query += ` AND a.verification_status = $${pIdx}`;
      params.push(verification_status);
      pIdx++;
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch achievements error:', err);
    res.status(500).json({ error: 'Could not fetch achievements' });
  }
});

// PATCH /api/achievements/:id/verify — Verify or Reject Achievement
app.patch('/api/achievements/:id/verify', authenticateToken, async (req, res) => {
  try {
    const achId = Number(req.params.id);
    const mentorId = req.mentor.id;
    const { status, rejection_reason } = req.body;

    if (!['Verified', 'Rejected', 'Pending Verification'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const result = await pool.query(
      `UPDATE public.achievements SET
         verification_status = $1,
         rejection_reason = $2
       WHERE id = $3 AND mentor_id = $4
       RETURNING *`,
      [status, rejection_reason || null, achId, mentorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement record not found' });
    }

    res.json({ message: `Achievement ${status}`, achievement: result.rows[0] });
  } catch (err) {
    console.error('Verify achievement error:', err);
    res.status(500).json({ error: 'Could not update achievement verification' });
  }
});

// GET /api/academic-results — List academic records for mentor's mentees
app.get('/api/academic-results', authenticateToken, async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const { semester, academic_year } = req.query;

    let query = `
      SELECT r.*, m.full_name AS mentee_name, m.roll_number, m.department
      FROM public.academic_results r
      JOIN public.mentees m ON m.id = r.mentee_id
      WHERE r.mentor_id = $1
    `;
    const params = [mentorId];
    let pIdx = 2;

    if (semester) {
      query += ` AND r.semester = $${pIdx}`;
      params.push(Number(semester));
      pIdx++;
    }

    if (academic_year) {
      query += ` AND r.academic_year = $${pIdx}`;
      params.push(academic_year);
      pIdx++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch results error:', err);
    res.status(500).json({ error: 'Could not fetch academic results' });
  }
});

// ─────────────────────────────────────────────────
// 7. ISSUES & CONCERNS MANAGEMENT
// ─────────────────────────────────────────────────

// GET /api/issues — List issues for mentor
app.get('/api/issues', authenticateToken, async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const { status, category, priority } = req.query;

    let query = `
      SELECT i.*, m.full_name AS mentee_name, m.roll_number, m.department, m.email, m.phone,
             (SELECT COUNT(*)::int FROM public.issue_notes n WHERE n.issue_id = i.id) AS notes_count
      FROM public.issues i
      JOIN public.mentees m ON m.id = i.mentee_id
      WHERE i.mentor_id = $1
    `;
    const params = [mentorId];
    let pIdx = 2;

    if (status) {
      query += ` AND i.status = $${pIdx}`;
      params.push(status);
      pIdx++;
    }

    if (category) {
      query += ` AND i.category = $${pIdx}`;
      params.push(category);
      pIdx++;
    }

    if (priority) {
      query += ` AND i.priority = $${pIdx}`;
      params.push(priority);
      pIdx++;
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch issues error:', err);
    res.status(500).json({ error: 'Could not fetch issues' });
  }
});

// GET /api/issues/:id — Single Issue Details with Notes
app.get('/api/issues/:id', authenticateToken, async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const mentorId = req.mentor.id;

    const issueRes = await pool.query(
      `SELECT i.*, m.full_name AS mentee_name, m.roll_number, m.department, m.email, m.phone
       FROM public.issues i
       JOIN public.mentees m ON m.id = i.mentee_id
       WHERE i.id = $1 AND i.mentor_id = $2`,
      [issueId, mentorId]
    );

    if (issueRes.rows.length === 0) {
      return res.status(404).json({ error: 'Issue record not found' });
    }

    const notesRes = await pool.query(
      `SELECT n.*, m.full_name AS mentor_name
       FROM public.issue_notes n
       JOIN public.mentors m ON m.id = n.mentor_id
       WHERE n.issue_id = $1
       ORDER BY n.created_at ASC`,
      [issueId]
    );

    res.json({
      issue: issueRes.rows[0],
      notes: notesRes.rows,
    });
  } catch (err) {
    console.error('Fetch single issue error:', err);
    res.status(500).json({ error: 'Could not fetch issue details' });
  }
});

// PATCH /api/issues/:id/status — Update Issue Status & Resolution
app.patch('/api/issues/:id/status', authenticateToken, async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const mentorId = req.mentor.id;
    const { status, resolution_summary, note } = req.body;

    const validStatuses = ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await pool.query(
      `UPDATE public.issues SET
         status = $1,
         resolution_summary = COALESCE($2, resolution_summary),
         updated_at = NOW()
       WHERE id = $3 AND mentor_id = $4
       RETURNING *`,
      [status, resolution_summary || null, issueId, mentorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (note && note.trim()) {
      await pool.query(
        `INSERT INTO public.issue_notes (issue_id, mentor_id, note, is_internal)
         VALUES ($1, $2, $3, true)`,
        [issueId, mentorId, note.trim()]
      );
    }

    res.json({ message: 'Issue status updated successfully', issue: result.rows[0] });
  } catch (err) {
    console.error('Update issue status error:', err);
    res.status(500).json({ error: 'Could not update issue status' });
  }
});

// POST /api/issues/:id/notes — Add Internal Note to Issue
app.post('/api/issues/:id/notes', authenticateToken, async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const mentorId = req.mentor.id;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note text cannot be empty' });
    }

    // Verify issue ownership
    const issueCheck = await pool.query(
      `SELECT id FROM public.issues WHERE id = $1 AND mentor_id = $2`,
      [issueId, mentorId]
    );
    if (issueCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const result = await pool.query(
      `INSERT INTO public.issue_notes (issue_id, mentor_id, note, is_internal)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [issueId, mentorId, note.trim()]
    );

    res.status(201).json({ message: 'Internal note added', note: result.rows[0] });
  } catch (err) {
    console.error('Add issue note error:', err);
    res.status(500).json({ error: 'Could not add note' });
  }
});

// ─────────────────────────────────────────────────
// 8. MENTOR CONFIDENTIAL NOTES (Private to Mentor)
// ─────────────────────────────────────────────────

// POST /api/mentees/:id/notes — Add Mentor-Only Note
app.post('/api/mentees/:id/notes', authenticateToken, async (req, res) => {
  try {
    const menteeId = Number(req.params.id);
    const mentorId = req.mentor.id;
    const { note_type = 'General', title, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    // Verify ownership
    const menteeCheck = await pool.query(
      `SELECT id FROM public.mentees WHERE id = $1 AND mentor_id = $2`,
      [menteeId, mentorId]
    );
    if (menteeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mentee not found' });
    }

    const result = await pool.query(
      `INSERT INTO public.mentor_notes (mentee_id, mentor_id, note_type, title, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [menteeId, mentorId, note_type, title || 'Observation Note', content.trim()]
    );

    res.status(201).json({ message: 'Confidential note saved', note: result.rows[0] });
  } catch (err) {
    console.error('Save mentor note error:', err);
    res.status(500).json({ error: 'Could not save note' });
  }
});

// DELETE /api/mentees/:id/notes/:noteId — Delete Mentor Note
app.delete('/api/mentees/:id/notes/:noteId', authenticateToken, async (req, res) => {
  try {
    const menteeId = Number(req.params.id);
    const noteId = Number(req.params.noteId);
    const mentorId = req.mentor.id;

    await pool.query(
      `DELETE FROM public.mentor_notes WHERE id = $1 AND mentee_id = $2 AND mentor_id = $3`,
      [noteId, menteeId, mentorId]
    );

    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Delete mentor note error:', err);
    res.status(500).json({ error: 'Could not delete note' });
  }
});

// ─────────────────────────────────────────────────
// 9. REPORTS & EXPORT
// ─────────────────────────────────────────────────

// GET /api/reports/analytics — Comprehensive Mentor Reports & Analytics
app.get('/api/reports/analytics', authenticateToken, async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const { academic_year, semester, search, date_from, date_to } = req.query;

    // Build base query conditions for mentees
    let menteeWhere = `WHERE m.mentor_id = $1`;
    const menteeParams = [mentorId];
    let pIdx = 2;

    if (academic_year && academic_year !== 'all') {
      menteeWhere += ` AND (m.academic_year = $${pIdx} OR m.batch ILIKE $${pIdx} OR p.attendance_semester::text = $${pIdx})`;
      menteeParams.push(academic_year);
      pIdx++;
    }

    if (semester && semester !== 'all') {
      menteeWhere += ` AND m.semester = $${pIdx}`;
      menteeParams.push(Number(semester));
      pIdx++;
    }

    if (search && search.trim()) {
      menteeWhere += ` AND (m.full_name ILIKE $${pIdx} OR m.roll_number ILIKE $${pIdx} OR m.department ILIKE $${pIdx})`;
      menteeParams.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (date_from) {
      menteeWhere += ` AND m.created_at >= $${pIdx}::timestamptz`;
      menteeParams.push(date_from);
      pIdx++;
    }

    if (date_to) {
      menteeWhere += ` AND m.created_at <= $${pIdx}::timestamptz`;
      menteeParams.push(date_to);
      pIdx++;
    }

    // 1. Fetch filtered mentees and profiles
    const menteesQuery = `
      SELECT 
        m.id,
        m.full_name,
        m.roll_number,
        m.email,
        m.phone,
        m.department,
        m.semester,
        m.academic_year,
        m.batch,
        m.created_at,
        p.current_cgpa,
        p.current_sgpa,
        p.attendance_percentage,
        p.total_backlogs,
        p.has_backlogs,
        p.tenth_percentage,
        p.twelfth_percentage,
        p.submitted_at,
        p.previous_sgpas,
        p.parent_name,
        p.student_photo_url,
        p.submission_reference,
        COALESCE(m.profile_status, CASE WHEN p.submitted_at IS NOT NULL THEN 'Complete' ELSE 'Incomplete' END) AS profile_status
      FROM public.mentees m
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
      ${menteeWhere}
      ORDER BY m.roll_number ASC
    `;

    const menteesRes = await pool.query(menteesQuery, menteeParams);
    const mentees = menteesRes.rows;
    const menteeIds = mentees.map(m => m.id);

    // 2. Fetch Achievements for filtered mentees
    let achievements = [];
    if (menteeIds.length > 0) {
      const achRes = await pool.query(
        `SELECT a.*, m.full_name AS mentee_name, m.roll_number
         FROM public.achievements a
         JOIN public.mentees m ON m.id = a.mentee_id
         WHERE a.mentor_id = $1 AND a.mentee_id = ANY($2::bigint[])
         ORDER BY a.created_at DESC`,
        [mentorId, menteeIds]
      );
      achievements = achRes.rows;
    }

    // 3. Fetch Issues for filtered mentees
    let issues = [];
    if (menteeIds.length > 0) {
      const issuesRes = await pool.query(
        `SELECT i.*, m.full_name AS mentee_name, m.roll_number
         FROM public.issues i
         JOIN public.mentees m ON m.id = i.mentee_id
         WHERE i.mentor_id = $1 AND i.mentee_id = ANY($2::bigint[])
         ORDER BY i.created_at DESC`,
        [mentorId, menteeIds]
      );
      issues = issuesRes.rows;
    }

    // 4. Fetch Results from academic_results
    let results = [];
    if (menteeIds.length > 0) {
      const resultsRes = await pool.query(
        `SELECT r.*, m.full_name AS mentee_name, m.roll_number
         FROM public.academic_results r
         JOIN public.mentees m ON m.id = r.mentee_id
         WHERE r.mentor_id = $1 AND r.mentee_id = ANY($2::bigint[])
         ORDER BY r.semester ASC, r.created_at DESC`,
        [mentorId, menteeIds]
      );
      results = resultsRes.rows;
    }

    // Synthesize results from previous_sgpas in mentee_profiles if historical semesters exist
    mentees.forEach(m => {
      if (Array.isArray(m.previous_sgpas) && m.previous_sgpas.length > 0) {
        m.previous_sgpas.forEach(prev => {
          results.push({
            id: `sgpa-${m.id}-${prev.semester}`,
            mentee_id: m.id,
            mentee_name: m.full_name,
            roll_number: m.roll_number,
            semester: Number(prev.semester) || 1,
            academic_year: prev.academic_year || m.academic_year || '2024-25',
            sgpa: parseFloat(prev.sgpa) || null,
            cgpa: parseFloat(m.current_cgpa) || null,
            result_status: (parseFloat(prev.sgpa) >= 5.0) ? 'Passed' : 'Needs Support',
            document_status: m.submitted_at ? 'Attached in Registration' : 'Pending',
          });
        });
      }
    });

    // 5. Aggregate KPI Summary
    const totalMentees = mentees.length;
    const completedProfiles = mentees.filter(m => m.submitted_at !== null || m.profile_status === 'Complete').length;
    const incompleteProfiles = totalMentees - completedProfiles;
    const completionRate = totalMentees > 0 ? Math.round((completedProfiles / totalMentees) * 100) : 0;

    const cgpaValues = mentees.map(m => parseFloat(m.current_cgpa)).filter(v => !isNaN(v) && v > 0);
    const avgCgpa = cgpaValues.length > 0 ? Number((cgpaValues.reduce((a, b) => a + b, 0) / cgpaValues.length).toFixed(2)) : null;

    const attendanceValues = mentees.map(m => parseFloat(m.attendance_percentage)).filter(v => !isNaN(v) && v >= 0);
    const avgAttendance = attendanceValues.length > 0 ? Number((attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length).toFixed(1)) : null;

    const verifiedAchievements = achievements.filter(a => a.verification_status === 'Verified').length;
    const pendingAchievements = achievements.filter(a => a.verification_status === 'Pending Verification' || !a.verification_status).length;

    const pendingIssues = issues.filter(i => ['New', 'Under Review', 'In Progress'].includes(i.status)).length;
    const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;

    // Calculate average resolution time for resolved issues
    const resolvedWithDates = issues.filter(i => i.status === 'Resolved' && i.updated_at && i.created_at);
    let avgResolutionDays = null;
    if (resolvedWithDates.length > 0) {
      const totalDays = resolvedWithDates.reduce((acc, curr) => {
        const diff = Math.max(0, (new Date(curr.updated_at) - new Date(curr.created_at)) / (1000 * 60 * 60 * 24));
        return acc + diff;
      }, 0);
      avgResolutionDays = Number((totalDays / resolvedWithDates.length).toFixed(1));
    }

    // 6. Academic Performance & Distribution
    const cgpaDistribution = {
      excellent: mentees.filter(m => parseFloat(m.current_cgpa) >= 9.0).length,
      veryGood: mentees.filter(m => parseFloat(m.current_cgpa) >= 8.0 && parseFloat(m.current_cgpa) < 9.0).length,
      good: mentees.filter(m => parseFloat(m.current_cgpa) >= 7.0 && parseFloat(m.current_cgpa) < 8.0).length,
      average: mentees.filter(m => parseFloat(m.current_cgpa) >= 6.0 && parseFloat(m.current_cgpa) < 7.0).length,
      supportNeeded: mentees.filter(m => parseFloat(m.current_cgpa) < 6.0 && parseFloat(m.current_cgpa) > 0).length,
    };

    // Calculate performance trends for each mentee
    let improvingCount = 0;
    let decliningCount = 0;
    let steadyCount = 0;

    const enrichedMentees = mentees.map(m => {
      const cgpa = parseFloat(m.current_cgpa);
      const sgpa = parseFloat(m.current_sgpa);
      let trend = 'steady';
      let trendLabel = 'Steady';

      if (!isNaN(cgpa) && !isNaN(sgpa)) {
        if (sgpa > cgpa + 0.05) {
          trend = 'improving';
          trendLabel = 'Improving (+SGPA)';
          improvingCount++;
        } else if (sgpa < cgpa - 0.05) {
          trend = 'declining';
          trendLabel = 'Declining (-SGPA)';
          decliningCount++;
        } else {
          steadyCount++;
        }
      } else if (!isNaN(cgpa)) {
        steadyCount++;
      } else {
        trend = 'n/a';
        trendLabel = 'Pending Records';
      }

      // Check section completion
      const missingSections = [];
      if (!m.tenth_percentage) missingSections.push('10th Marks');
      if (!m.twelfth_percentage) missingSections.push('12th Marks');
      if (!m.attendance_percentage) missingSections.push('Attendance');
      if (!m.student_photo_url) missingSections.push('Photographs');
      if (!m.parent_name) missingSections.push('Family Information');

      const totalRequired = 5;
      const completedCount = totalRequired - missingSections.length;
      const completionPct = m.submitted_at ? 100 : Math.round((completedCount / totalRequired) * 100);

      return {
        ...m,
        trend,
        trendLabel,
        completionPct,
        missingSections,
      };
    });

    // Semester-wise average trends
    const semesterBuckets = {};
    results.forEach(r => {
      const sem = r.semester;
      if (sem && r.sgpa) {
        if (!semesterBuckets[sem]) semesterBuckets[sem] = [];
        semesterBuckets[sem].push(parseFloat(r.sgpa));
      }
    });
    enrichedMentees.forEach(m => {
      if (m.semester && m.current_cgpa) {
        if (!semesterBuckets[m.semester]) semesterBuckets[m.semester] = [];
        semesterBuckets[m.semester].push(parseFloat(m.current_cgpa));
      }
    });

    const semesterTrends = Object.keys(semesterBuckets).sort((a,b) => Number(a)-Number(b)).map(sem => {
      const vals = semesterBuckets[sem];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return {
        semester: `Sem ${sem}`,
        semNumber: Number(sem),
        avgSgpa: Number(avg.toFixed(2)),
        studentCount: vals.length,
      };
    });

    // 7. Attendance Analytics
    const attendanceThreshold = 75;
    const belowThresholdStudents = enrichedMentees.filter(m => parseFloat(m.attendance_percentage) < attendanceThreshold && parseFloat(m.attendance_percentage) >= 0);

    const attendanceDistribution = {
      distinction: enrichedMentees.filter(m => parseFloat(m.attendance_percentage) >= 85).length,
      satisfactory: enrichedMentees.filter(m => parseFloat(m.attendance_percentage) >= 75 && parseFloat(m.attendance_percentage) < 85).length,
      warning: enrichedMentees.filter(m => parseFloat(m.attendance_percentage) >= 65 && parseFloat(m.attendance_percentage) < 75).length,
      critical: enrichedMentees.filter(m => parseFloat(m.attendance_percentage) < 65 && parseFloat(m.attendance_percentage) >= 0).length,
    };

    // 8. Achievements Breakdown
    const achievementCategories = {};
    achievements.forEach(a => {
      const cat = a.category || 'Other';
      achievementCategories[cat] = (achievementCategories[cat] || 0) + 1;
    });

    // 9. Issues Breakdown
    const issueCategories = {};
    const issueStatuses = { New: 0, 'Under Review': 0, 'In Progress': 0, Resolved: 0 };
    issues.forEach(i => {
      const cat = i.category || 'General';
      issueCategories[cat] = (issueCategories[cat] || 0) + 1;
      if (issueStatuses[i.status] !== undefined) {
        issueStatuses[i.status]++;
      } else {
        issueStatuses[i.status] = 1;
      }
    });

    // 10. Students Requiring Attention (Non-stigmatizing, transparent)
    const requiringAttention = [];
    enrichedMentees.forEach(m => {
      const att = parseFloat(m.attendance_percentage);
      const cgpa = parseFloat(m.current_cgpa);
      const backlogs = Number(m.total_backlogs) || 0;
      const menteeIssues = issues.filter(i => i.mentee_id == m.id && i.status !== 'Resolved');

      if (!isNaN(att) && att < 75) {
        requiringAttention.push({
          id: `att-${m.id}`,
          menteeId: m.id,
          fullName: m.full_name,
          rollNumber: m.roll_number,
          department: m.department,
          reason: 'Attendance Below 75%',
          metric: `${att}% Attendance`,
          details: `Current attendance is below the institutional 75% threshold.`,
          severity: att < 65 ? 'high' : 'medium',
          type: 'attendance',
        });
      }

      if (backlogs > 0 || (!isNaN(cgpa) && cgpa < 6.0)) {
        requiringAttention.push({
          id: `acad-${m.id}`,
          menteeId: m.id,
          fullName: m.full_name,
          rollNumber: m.roll_number,
          department: m.department,
          reason: backlogs > 0 ? `Active Backlogs (${backlogs})` : 'Academic Support Opportunity',
          metric: backlogs > 0 ? `${backlogs} Backlog(s)` : `${cgpa} CGPA`,
          details: backlogs > 0 ? `${backlogs} backlogs require remedial planning.` : `CGPA is below 6.0. Recommend counseling.`,
          severity: backlogs > 0 ? 'high' : 'medium',
          type: 'academic',
        });
      }

      if (menteeIssues.length > 0) {
        requiringAttention.push({
          id: `issue-${m.id}`,
          menteeId: m.id,
          fullName: m.full_name,
          rollNumber: m.roll_number,
          department: m.department,
          reason: `Open Student Issue (${menteeIssues.length})`,
          metric: menteeIssues[0].category,
          details: menteeIssues[0].title,
          severity: menteeIssues[0].priority === 'High' ? 'high' : 'medium',
          type: 'issue',
        });
      }

      if (!m.submitted_at && m.profile_status === 'Incomplete') {
        requiringAttention.push({
          id: `prof-${m.id}`,
          menteeId: m.id,
          fullName: m.full_name,
          rollNumber: m.roll_number,
          department: m.department,
          reason: 'Profile Incomplete',
          metric: `${m.completionPct}% Done`,
          details: `Pending: ${m.missingSections.join(', ') || 'Submission not completed'}`,
          severity: 'medium',
          type: 'profile',
        });
      }
    });

    // 11. Distinct Filter Options
    const distinctYearsRes = await pool.query(
      `SELECT DISTINCT academic_year FROM public.mentees WHERE mentor_id = $1 AND academic_year IS NOT NULL
       UNION
       SELECT DISTINCT academic_year FROM public.academic_results WHERE mentor_id = $1 AND academic_year IS NOT NULL`,
      [mentorId]
    );
    const academicYears = distinctYearsRes.rows.map(r => r.academic_year).filter(Boolean);

    const distinctSemestersRes = await pool.query(
      `SELECT DISTINCT semester FROM public.mentees WHERE mentor_id = $1 AND semester IS NOT NULL
       ORDER BY semester ASC`,
      [mentorId]
    );
    const semesters = distinctSemestersRes.rows.map(r => r.semester);

    res.json({
      summary: {
        total_mentees: totalMentees,
        completed_profiles: completedProfiles,
        incomplete_profiles: incompleteProfiles,
        completion_rate: completionRate,
        avg_cgpa: avgCgpa,
        avg_attendance: avgAttendance,
        total_achievements: achievements.length,
        verified_achievements: verifiedAchievements,
        pending_achievements: pendingAchievements,
        total_issues: issues.length,
        pending_issues: pendingIssues,
        resolved_issues: resolvedIssues,
        avg_resolution_days: avgResolutionDays,
        improving_count: improvingCount,
        declining_count: decliningCount,
        steady_count: steadyCount,
        below_attendance_threshold_count: belowThresholdStudents.length,
      },
      academic: {
        mentees: enrichedMentees,
        cgpa_distribution: cgpaDistribution,
        semester_trends: semesterTrends,
      },
      attendance: {
        avg_attendance: avgAttendance,
        below_threshold_count: belowThresholdStudents.length,
        distribution: attendanceDistribution,
        records: enrichedMentees.map(m => ({
          id: m.id,
          fullName: m.full_name,
          rollNumber: m.roll_number,
          semester: m.semester,
          attendancePercentage: m.attendance_percentage ? parseFloat(m.attendance_percentage) : null,
          status: parseFloat(m.attendance_percentage) >= 75 ? 'Satisfactory' : 'Critical',
        })),
      },
      achievements: {
        list: achievements,
        category_distribution: achievementCategories,
      },
      results: {
        list: results,
      },
      issues: {
        list: issues,
        category_distribution: issueCategories,
        status_distribution: issueStatuses,
      },
      profile_completion: {
        list: enrichedMentees.map(m => ({
          id: m.id,
          fullName: m.full_name,
          rollNumber: m.roll_number,
          status: m.submitted_at ? 'Submitted' : (m.profile_status || 'Incomplete'),
          completionPct: m.completionPct,
          missingSections: m.missingSections,
          lastUpdated: m.created_at,
        })),
      },
      requiring_attention: requiringAttention,
      filter_options: {
        academic_years: academicYears.length > 0 ? academicYears : ['2026-27', '2025-26', '2024-25'],
        semesters: semesters.length > 0 ? semesters : [1, 2, 3, 4, 5, 6, 7, 8],
      },
    });
  } catch (err) {
    console.error('Fetch reports analytics error:', err);
    res.status(500).json({ error: 'Could not fetch analytics data' });
  }
});

// GET /api/reports/summary — Mentee Analytics Summary
app.get('/api/reports/summary', authenticateToken, async (req, res) => {
  try {
    const mentorId = req.mentor.id;

    const summaryRes = await pool.query(
      `SELECT 
         COUNT(m.id)::int AS total_mentees,
         COUNT(CASE WHEN p.submitted_at IS NOT NULL THEN 1 END)::int AS completed_profiles,
         COUNT(CASE WHEN p.submitted_at IS NULL THEN 1 END)::int AS pending_profiles,
         ROUND(AVG(p.current_cgpa), 2) AS avg_cgpa,
         ROUND(AVG(p.attendance_percentage), 2) AS avg_attendance,
         COUNT(CASE WHEN p.total_backlogs > 0 OR p.current_cgpa < 6.0 THEN 1 END)::int AS at_risk_students,
         (SELECT COUNT(*)::int FROM public.achievements WHERE mentor_id = $1) AS total_achievements,
         (SELECT COUNT(*)::int FROM public.issues WHERE mentor_id = $1 AND status IN ('New', 'Under Review', 'In Progress')) AS open_issues
       FROM public.mentees m
       LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
       WHERE m.mentor_id = $1`,
      [mentorId]
    );

    res.json(summaryRes.rows[0]);
  } catch (err) {
    console.error('Report summary error:', err);
    res.status(500).json({ error: 'Could not fetch report summary' });
  }
});

// GET /api/reports/mentees-export — Full CSV-Ready Export Data
app.get('/api/reports/mentees-export', authenticateToken, async (req, res) => {
  try {
    const mentorId = req.mentor.id;

    const result = await pool.query(
      `SELECT 
         m.roll_number,
         m.full_name,
         m.email,
         m.phone,
         m.department,
         m.semester,
         m.batch,
         p.current_cgpa,
         p.attendance_percentage,
         p.total_backlogs,
         p.tenth_percentage,
         p.twelfth_percentage,
         p.parent_name,
         p.parent_phone,
         p.address,
         p.skills_technical,
         p.career_goals,
         p.submitted_at
       FROM public.mentees m
       LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
       WHERE m.mentor_id = $1
       ORDER BY m.roll_number ASC`,
      [mentorId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({ error: 'Could not export records' });
  }
});

// ─────────────────────────────────────────────────
// 10. NOTIFICATIONS
// ─────────────────────────────────────────────────

// GET /api/notifications — In-App Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.notifications 
       WHERE mentor_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [req.mentor.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Could not fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read — Mark Notification as Read
app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notifId = Number(req.params.id);
    await pool.query(
      `UPDATE public.notifications SET is_read = true WHERE id = $1 AND mentor_id = $2`,
      [notifId, req.mentor.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Could not update notification' });
  }
});

// POST /api/notifications/mark-all-read — Mark All Read
app.post('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `UPDATE public.notifications SET is_read = true WHERE mentor_id = $1`,
      [req.mentor.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Could not update notifications' });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. STUDENT / MENTEE PORTAL API ENDPOINTS (Protected)
// ─────────────────────────────────────────────────────────────

// GET /api/student/dashboard - Student Overview & Assigned Faculty Details
app.get('/api/student/dashboard', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;

    const [studentRes, profileRes, resultsRes, issuesRes] = await Promise.all([
      pool.query(`
        SELECT 
          s.id, s.full_name, s.email, s.roll_number, s.admission_number, s.department, s.semester, s.batch, s.academic_year, s.section, s.phone, s.mentor_id,
          m.full_name AS mentor_name,
          m.email AS mentor_email,
          m.department AS mentor_department,
          m.designation AS mentor_designation,
          m.phone AS mentor_phone,
          m.cabin_number AS mentor_cabin,
          m.avatar_url AS mentor_avatar,
          m.college AS mentor_college
        FROM public.mentees s
        LEFT JOIN public.mentors m ON m.id = s.mentor_id
        WHERE s.id = $1
      `, [studentId]),
      pool.query(`
        SELECT student_photo_url, attendance_percentage, current_cgpa, total_backlogs, submitted_at, submission_reference
        FROM public.mentee_profiles WHERE mentee_id = $1
      `, [studentId]),
      pool.query('SELECT COUNT(*)::int AS count FROM public.academic_results WHERE mentee_id = $1', [studentId]),
      pool.query("SELECT COUNT(*)::int AS count, COUNT(CASE WHEN status != 'Resolved' THEN 1 END)::int AS open_count FROM public.issues WHERE mentee_id = $1", [studentId]),
    ]);

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    const studentData = studentRes.rows[0];
    const profileData = profileRes.rows[0] || {};

    // Fetch Class Coordinator & Announcements for this student's class
    let classCoordinator = null;
    let classAnnouncements = [];
    try {
      const [coordRes, annRes] = await Promise.all([
        pool.query(`
          SELECT cc.id, m.full_name, m.email, m.phone, m.designation, m.department, m.cabin_number
          FROM public.class_coordinators cc
          JOIN public.mentors m ON cc.mentor_id = m.id
          WHERE cc.department = $1 AND cc.semester = $2 AND cc.section = $3 AND cc.status = 'active'
          LIMIT 1
        `, [studentData.department, studentData.semester, studentData.section || 'A']),
        pool.query(`
          SELECT ca.id, ca.title, ca.content, ca.priority, ca.created_at, m.full_name AS coordinator_name
          FROM public.class_announcements ca
          JOIN public.mentors m ON ca.mentor_id = m.id
          WHERE ca.department = $1 AND ca.semester = $2 AND ca.section = $3
          ORDER BY ca.created_at DESC LIMIT 5
        `, [studentData.department, studentData.semester, studentData.section || 'A']),
      ]);
      classCoordinator = coordRes.rows[0] || null;
      classAnnouncements = annRes.rows;
    } catch (e) {
      console.warn('Student dashboard coordinator query notice:', e.message);
    }

    res.json({
      student: {
        id: studentData.id,
        full_name: studentData.full_name,
        email: studentData.email,
        roll_number: studentData.roll_number,
        admission_number: studentData.admission_number,
        department: studentData.department,
        semester: studentData.semester,
        batch: studentData.batch,
        section: studentData.section,
        phone: studentData.phone,
        photo_url: profileData.student_photo_url || null,
        attendance_percentage: profileData.attendance_percentage ? Number(profileData.attendance_percentage) : null,
        current_cgpa: profileData.current_cgpa ? Number(profileData.current_cgpa) : null,
        total_backlogs: profileData.total_backlogs ? Number(profileData.total_backlogs) : 0,
        submitted_at: profileData.submitted_at || null,
        submission_reference: profileData.submission_reference || null,
      },
      assigned_mentor: studentData.mentor_id ? {
        id: studentData.mentor_id,
        full_name: studentData.mentor_name,
        email: studentData.mentor_email,
        department: studentData.mentor_department,
        designation: studentData.mentor_designation,
        phone: studentData.mentor_phone,
        cabin_number: studentData.mentor_cabin,
        college: studentData.mentor_college,
      } : null,
      class_coordinator: classCoordinator,
      class_announcements: classAnnouncements,
      results_count: resultsRes.rows[0].count,
      issues_count: issuesRes.rows[0].count,
      open_issues_count: issuesRes.rows[0].open_count,
    });
  } catch (err) {
    console.error('Student dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load student dashboard' });
  }
});

// GET /api/student/profile - Complete Dossier Inspection for Logged-In Student
app.get('/api/student/profile', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;
    const [menteeRes, profileRes] = await Promise.all([
      pool.query('SELECT * FROM public.mentees WHERE id = $1', [studentId]),
      pool.query('SELECT * FROM public.mentee_profiles WHERE mentee_id = $1', [studentId]),
    ]);

    if (menteeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    res.json({
      mentee: menteeRes.rows[0],
      profile: profileRes.rows[0] || null,
    });
  } catch (err) {
    console.error('Student profile error:', err.message);
    res.status(500).json({ error: 'Failed to load student profile' });
  }
});

// GET /api/student/results - Student Academic Semester Results
app.get('/api/student/results', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;
    const result = await pool.query(
      'SELECT * FROM public.academic_results WHERE mentee_id = $1 ORDER BY semester ASC, id ASC',
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch academic results' });
  }
});

// GET /api/student/issues - Student Issues & Concerns
app.get('/api/student/issues', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;
    const result = await pool.query(
      'SELECT * FROM public.issues WHERE mentee_id = $1 ORDER BY created_at DESC',
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student concerns' });
  }
});

// POST /api/student/issues - Student Logs New Concern for Assigned Mentor
app.post('/api/student/issues', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;
    const { title, description, category, severity } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const sRes = await pool.query('SELECT mentor_id, full_name, roll_number FROM public.mentees WHERE id = $1', [studentId]);
    const mentorId = sRes.rows[0]?.mentor_id;

    const result = await pool.query(`
      INSERT INTO public.issues 
        (mentee_id, mentor_id, title, description, category, severity, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Open')
      RETURNING *
    `, [
      studentId,
      mentorId || null,
      title.trim(),
      description.trim(),
      category || 'Academic',
      severity || 'Normal',
    ]);

    if (mentorId) {
      try {
        await pool.query(`
          INSERT INTO public.notifications (mentor_id, title, message, type)
          VALUES ($1, $2, $3, 'issue')
        `, [
          mentorId,
          `New Concern Raised by ${sRes.rows[0].full_name}`,
          `Student ${sRes.rows[0].full_name} (${sRes.rows[0].roll_number}) has submitted a new concern: "${title.trim()}".`,
        ]);
      } catch (e) {}
    }

    res.status(201).json({
      message: 'Concern submitted to your mentor successfully',
      issue: result.rows[0],
    });
  } catch (err) {
    console.error('Student issue error:', err.message);
    res.status(500).json({ error: 'Failed to submit concern' });
  }
});

// ── Student Settings & Security ──

// GET /api/student/settings - Retrieve Student Account Profile & Security Overview
app.get('/api/student/settings', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;
    const result = await pool.query(`
      SELECT 
        s.id, s.full_name, s.email, s.roll_number, s.admission_number, 
        s.university_roll_number, s.department, s.course, s.semester, 
        s.batch, s.academic_year, s.section, s.phone, s.profile_status,
        s.created_at, s.updated_at,
        m.id AS mentor_id, m.full_name AS mentor_name, m.email AS mentor_email,
        m.department AS mentor_department, m.designation AS mentor_designation,
        m.phone AS mentor_phone, m.cabin_number AS mentor_cabin
      FROM public.mentees s
      LEFT JOIN public.mentors m ON s.mentor_id = m.id
      WHERE s.id = $1
    `, [studentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student account record not found.' });
    }

    res.json({ student: result.rows[0] });
  } catch (err) {
    console.error('Fetch student settings error:', err.message);
    res.status(500).json({ error: 'Failed to load student settings' });
  }
});

// PUT /api/student/settings - Update Student Contact Preferences
app.put('/api/student/settings', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;
    const { phone, email } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const updateRes = await pool.query(`
      UPDATE public.mentees
      SET 
        phone = COALESCE($1, phone),
        email = COALESCE($2, email),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, full_name, email, phone, updated_at
    `, [
      phone ? phone.trim() : null,
      email ? email.trim().toLowerCase() : null,
      studentId
    ]);

    res.json({
      message: 'Student account contact details updated successfully.',
      student: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Update student settings error:', err.message);
    res.status(500).json({ error: 'Failed to update contact settings' });
  }
});

// PUT /api/student/change-password - Change Student Password
app.put('/api/student/change-password', requireStudent, async (req, res) => {
  try {
    const studentId = req.student.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation password do not match.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password cannot be the same as your current password.' });
    }

    // Retrieve current password hash
    const studentRes = await pool.query(
      'SELECT id, password_hash, roll_number, email FROM public.mentees WHERE id = $1',
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    let currentHash = studentRes.rows[0].password_hash;
    if (!currentHash) {
      currentHash = await bcrypt.hash('student123', 10);
    }

    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password. Please check and try again.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE public.mentees 
       SET password_hash = $1, account_status = 'active', must_change_password = false, updated_at = NOW() 
       WHERE id = $2`,
      [newHash, studentId]
    );

    res.json({
      message: 'Your password has been changed successfully! Please use your new password next time you log in.',
      account_status: 'active',
      must_change_password: false,
    });
  } catch (err) {
    console.error('Student password update error:', err.message);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 10. ENTERPRISE ADMIN ENGINE & INSTITUTIONAL ORCHESTRATION (Strictly Admin-Protected)
// ─────────────────────────────────────────────────────────────

// GET /api/admin/overview - Institutional KPI & Department Breakdown
app.get('/api/admin/overview', requireAdmin, async (req, res) => {
  try {
    const [
      totalMentorsRes,
      totalStudentsRes,
      assignedStudentsRes,
      profileMetricsRes,
      kpiRes,
      deptRes,
      semRes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM public.mentors'),
      pool.query('SELECT COUNT(*)::int AS count FROM public.mentees'),
      pool.query('SELECT COUNT(*)::int AS count FROM public.mentees WHERE mentor_id IS NOT NULL'),
      pool.query(`
        SELECT 
          COUNT(CASE WHEN p.submitted_at IS NOT NULL OR m.profile_status = 'Complete' THEN 1 END)::int AS completed,
          COUNT(CASE WHEN p.submitted_at IS NULL AND (m.profile_status IS NULL OR m.profile_status != 'Complete') THEN 1 END)::int AS pending
        FROM public.mentees m
        LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
      `),
      pool.query(`
        SELECT 
          ROUND(AVG(NULLIF(attendance_percentage, 0))::numeric, 1) AS avg_attendance,
          ROUND(AVG(NULLIF(current_cgpa, 0))::numeric, 2) AS avg_cgpa
        FROM public.mentee_profiles
      `),
      pool.query(`
        SELECT 
          COALESCE(m.department, 'Computer Science') AS department,
          COUNT(DISTINCT m.mentor_id) FILTER (WHERE m.mentor_id IS NOT NULL)::int AS active_mentors,
          COUNT(m.id)::int AS total_students,
          COUNT(CASE WHEN m.mentor_id IS NOT NULL THEN 1 END)::int AS assigned_students,
          COUNT(CASE WHEN m.mentor_id IS NULL THEN 1 END)::int AS unassigned_students
        FROM public.mentees m
        WHERE m.department IS NOT NULL
        GROUP BY m.department
        ORDER BY total_students DESC
      `),
      pool.query(`
        SELECT 
          COALESCE(m.semester, p.attendance_semester, 1)::int AS semester,
          COUNT(m.id)::int AS total_students,
          COUNT(CASE WHEN p.submitted_at IS NOT NULL OR m.profile_status = 'Complete' THEN 1 END)::int AS completed_students
        FROM public.mentees m
        LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
        GROUP BY COALESCE(m.semester, p.attendance_semester, 1)
        ORDER BY semester ASC
      `),
    ]);

    const totalMentors = totalMentorsRes.rows[0].count;
    const totalStudents = totalStudentsRes.rows[0].count;
    const assignedStudents = assignedStudentsRes.rows[0].count;
    const unassignedStudents = Math.max(0, totalStudents - assignedStudents);
    const completedProfiles = profileMetricsRes.rows[0].completed;
    const pendingProfiles = profileMetricsRes.rows[0].pending;
    const allocationCoverage = totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0;
    const completionRate = totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0;

    res.json({
      summary: {
        total_mentors: totalMentors,
        total_students: totalStudents,
        assigned_students: assignedStudents,
        unassigned_students: unassignedStudents,
        completed_profiles: completedProfiles,
        pending_profiles: pendingProfiles,
        allocation_coverage: allocationCoverage,
        completion_rate: completionRate,
        avg_attendance: kpiRes.rows[0].avg_attendance ? Number(kpiRes.rows[0].avg_attendance) : null,
        avg_cgpa: kpiRes.rows[0].avg_cgpa ? Number(kpiRes.rows[0].avg_cgpa) : null,
      },
      departments: deptRes.rows,
      semesters: semRes.rows,
    });
  } catch (err) {
    console.error('Admin overview error:', err.message);
    res.status(500).json({ error: 'Could not fetch admin overview metrics' });
  }
});

// GET /api/admin/mentors - Full Faculty Mentors Workload & Roster
app.get('/api/admin/mentors', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id,
        m.full_name,
        m.email,
        m.department,
        m.designation,
        m.employee_id,
        m.phone,
        m.college,
        m.cabin_number,
        m.created_at,
        COALESCE(m.status, 'active') AS status,
        COALESCE(m.max_capacity, 30)::int AS max_capacity,
        COUNT(s.id)::int AS allocated_students,
        COUNT(CASE WHEN p.submitted_at IS NOT NULL OR s.profile_status = 'Complete' THEN 1 END)::int AS completed_profiles,
        COUNT(CASE WHEN p.submitted_at IS NULL AND (s.profile_status IS NULL OR s.profile_status != 'Complete') THEN 1 END)::int AS pending_profiles,
        ARRAY_AGG(DISTINCT COALESCE(s.semester, p.attendance_semester)) FILTER (WHERE COALESCE(s.semester, p.attendance_semester) IS NOT NULL) AS active_semesters,
        ROUND(AVG(NULLIF(p.attendance_percentage, 0))::numeric, 1) AS cohort_avg_attendance,
        ROUND(AVG(NULLIF(p.current_cgpa, 0))::numeric, 2) AS cohort_avg_cgpa
      FROM public.mentors m
      LEFT JOIN public.mentees s ON s.mentor_id = m.id
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = s.id
      WHERE m.role != 'admin' OR m.role IS NULL
      GROUP BY m.id
      ORDER BY m.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Admin mentors error:', err.message);
    res.status(500).json({ error: 'Could not fetch faculty mentors directory' });
  }
});

// GET /api/admin/mentors/:id - Deep Mentor Details + Assigned Students + Coordinated Classes
app.get('/api/admin/mentors/:id', requireAdmin, async (req, res) => {
  try {
    const mentorId = parseInt(req.params.id, 10);
    if (isNaN(mentorId)) {
      return res.status(400).json({ error: 'Invalid mentor ID' });
    }

    // 1. Get mentor profile & aggregated stats
    const mentorRes = await pool.query(`
      SELECT 
        m.id,
        m.full_name,
        m.email,
        m.department,
        m.designation,
        m.employee_id,
        m.phone,
        m.college,
        m.cabin_number,
        m.created_at,
        COALESCE(m.status, 'active') AS status,
        COALESCE(m.max_capacity, 30)::int AS max_capacity,
        COUNT(s.id)::int AS allocated_students,
        COUNT(CASE WHEN p.submitted_at IS NOT NULL OR s.profile_status = 'Complete' THEN 1 END)::int AS completed_profiles,
        COUNT(CASE WHEN p.submitted_at IS NULL AND (s.profile_status IS NULL OR s.profile_status != 'Complete') THEN 1 END)::int AS pending_profiles,
        ARRAY_AGG(DISTINCT COALESCE(s.semester, p.attendance_semester)) FILTER (WHERE COALESCE(s.semester, p.attendance_semester) IS NOT NULL) AS active_semesters,
        ROUND(AVG(NULLIF(p.attendance_percentage, 0))::numeric, 1) AS cohort_avg_attendance,
        ROUND(AVG(NULLIF(p.current_cgpa, 0))::numeric, 2) AS cohort_avg_cgpa
      FROM public.mentors m
      LEFT JOIN public.mentees s ON s.mentor_id = m.id
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = s.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [mentorId]);

    if (mentorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Faculty mentor not found' });
    }

    const mentor = mentorRes.rows[0];

    // 2. Coordinated Classes (if any)
    const coordRes = await pool.query(`
      SELECT 
        id, department, course, academic_year, semester, section, status, assigned_at, notes
      FROM public.class_coordinators
      WHERE mentor_id = $1 AND status = 'active'
      ORDER BY semester ASC, section ASC
    `, [mentorId]);

    // 3. Assigned Mentees list
    const studentsRes = await pool.query(`
      SELECT 
        s.id,
        s.full_name,
        s.roll_number,
        s.email,
        s.phone,
        s.department,
        COALESCE(s.semester, p.attendance_semester, 1) AS semester,
        s.section,
        COALESCE(s.academic_year, 'AY 2026-27') AS academic_year,
        COALESCE(s.course, 'B.Tech Computer Science') AS course,
        CASE 
          WHEN p.submitted_at IS NOT NULL OR s.profile_status = 'Complete' THEN 'Complete'
          ELSE 'Pending'
        END AS dossier_status,
        COALESCE(p.attendance_percentage, 0) AS attendance_percentage,
        COALESCE(p.current_cgpa, 0) AS current_cgpa,
        COALESCE(s.account_status, 'not_activated') AS account_status,
        s.created_at
      FROM public.mentees s
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = s.id
      WHERE s.mentor_id = $1
      ORDER BY s.full_name ASC
    `, [mentorId]);

    res.json({
      mentor,
      coordinator_classes: coordRes.rows,
      assigned_students: studentsRes.rows,
    });
  } catch (err) {
    console.error('Admin get mentor details error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve mentor details' });
  }
});

// POST /api/admin/mentors - Create New Faculty Mentor
app.post('/api/admin/mentors', requireAdmin, async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      department,
      designation,
      employee_id,
      phone,
      college,
      cabin_number,
      max_capacity,
    } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'Mentor full name and email are required' });
    }

    const existing = await pool.query('SELECT id FROM public.mentors WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A mentor with this email already exists' });
    }

    const hash = await bcrypt.hash(password || 'password123', 10);

    const result = await pool.query(`
      INSERT INTO public.mentors 
        (full_name, email, password_hash, department, designation, employee_id, phone, college, cabin_number, max_capacity, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'mentor')
      RETURNING id, full_name, email, department, designation, employee_id, phone, college, cabin_number, max_capacity, created_at
    `, [
      full_name.trim(),
      email.toLowerCase().trim(),
      hash,
      department || 'Computer Science',
      designation || 'Academic Mentor',
      employee_id || null,
      phone || null,
      college || 'School of Engineering & Technology',
      cabin_number || null,
      max_capacity ? Number(max_capacity) : 30,
    ]);

    res.status(201).json({
      message: 'Faculty mentor created successfully',
      mentor: result.rows[0],
    });
  } catch (err) {
    console.error('Create mentor error:', err.message);
    res.status(500).json({ error: 'Failed to create faculty mentor' });
  }
});

// PUT /api/admin/mentors/:id - Update Mentor Details
app.put('/api/admin/mentors/:id', requireAdmin, async (req, res) => {
  try {
    const {
      full_name,
      email,
      department,
      designation,
      employee_id,
      phone,
      college,
      cabin_number,
      max_capacity,
    } = req.body;

    const result = await pool.query(`
      UPDATE public.mentors
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          department = COALESCE($3, department),
          designation = COALESCE($4, designation),
          employee_id = COALESCE($5, employee_id),
          phone = COALESCE($6, phone),
          college = COALESCE($7, college),
          cabin_number = COALESCE($8, cabin_number),
          max_capacity = COALESCE($9, max_capacity),
          updated_at = NOW()
      WHERE id = $10
      RETURNING id, full_name, email, department, designation, employee_id, phone, college, cabin_number, max_capacity, updated_at
    `, [
      full_name,
      email ? email.toLowerCase().trim() : null,
      department,
      designation,
      employee_id,
      phone,
      college,
      cabin_number,
      max_capacity !== undefined ? Number(max_capacity) : null,
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    res.json({
      message: 'Faculty mentor updated successfully',
      mentor: result.rows[0],
    });
  } catch (err) {
    console.error('Update mentor error:', err.message);
    res.status(500).json({ error: 'Failed to update faculty mentor' });
  }
});

// DELETE /api/admin/mentors/:id - Remove Mentor with Safe Student Reassignment
app.delete('/api/admin/mentors/:id', requireAdmin, async (req, res) => {
  try {
    const mentorId = req.params.id;
    const reassignTo = req.query.reassign_to ? Number(req.query.reassign_to) : null;

    if (reassignTo) {
      await pool.query('UPDATE public.mentees SET mentor_id = $1 WHERE mentor_id = $2', [reassignTo, mentorId]);
    } else {
      await pool.query('UPDATE public.mentees SET mentor_id = NULL WHERE mentor_id = $1', [mentorId]);
    }

    await pool.query('DELETE FROM public.form_links WHERE mentor_id = $1', [mentorId]);
    await pool.query('DELETE FROM public.notifications WHERE mentor_id = $1', [mentorId]);
    const delRes = await pool.query('DELETE FROM public.mentors WHERE id = $1 RETURNING id, full_name', [mentorId]);

    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    res.json({
      message: `Mentor ${delRes.rows[0].full_name} removed. Allocated students have been ${reassignTo ? 'reassigned' : 'moved to unassigned pool'}.`,
    });
  } catch (err) {
    console.error('Delete mentor error:', err.message);
    res.status(500).json({ error: 'Failed to remove faculty mentor' });
  }
});

// GET /api/admin/students - Institutional Student Directory with Mentor Metadata
app.get('/api/admin/students', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      department = '',
      semester = '',
      mentor_id = '',
      status = '',
      account_status = '',
      sort = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = [];
    let queryParams = [];

    if (search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      whereConditions.push(`(
        m.full_name ILIKE $${queryParams.length} OR
        m.email ILIKE $${queryParams.length} OR
        m.roll_number ILIKE $${queryParams.length} OR
        m.admission_number ILIKE $${queryParams.length}
      )`);
    }

    if (department) {
      queryParams.push(department);
      whereConditions.push(`m.department = $${queryParams.length}`);
    }

    if (semester) {
      queryParams.push(Number(semester));
      whereConditions.push(`COALESCE(m.semester, p.attendance_semester) = $${queryParams.length}`);
    }

    if (mentor_id) {
      if (mentor_id === 'unassigned') {
        whereConditions.push(`m.mentor_id IS NULL`);
      } else {
        queryParams.push(Number(mentor_id));
        whereConditions.push(`m.mentor_id = $${queryParams.length}`);
      }
    }

    if (status) {
      if (status === 'Complete') {
        whereConditions.push(`(p.submitted_at IS NOT NULL OR m.profile_status = 'Complete')`);
      } else if (status === 'Incomplete') {
        whereConditions.push(`(p.submitted_at IS NULL AND (m.profile_status IS NULL OR m.profile_status != 'Complete'))`);
      }
    }

    if (account_status) {
      if (account_status === 'not_activated') {
        whereConditions.push(`(m.account_status = 'not_activated' OR m.password_hash IS NULL)`);
      } else if (account_status === 'active') {
        whereConditions.push(`(m.account_status = 'active' AND m.password_hash IS NOT NULL)`);
      } else if (account_status === 'password_reset_required') {
        whereConditions.push(`(m.account_status = 'password_reset_required')`);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let orderBy = 'm.id DESC';
    if (sort === 'name_asc') orderBy = 'm.full_name ASC';
    else if (sort === 'name_desc') orderBy = 'm.full_name DESC';
    else if (sort === 'roll_asc') orderBy = 'm.roll_number ASC';
    else if (sort === 'cgpa_desc') orderBy = 'p.current_cgpa DESC NULLS LAST';
    else if (sort === 'updated_desc') orderBy = 'm.updated_at DESC';

    const countSql = `
      SELECT COUNT(*)::int AS count 
      FROM public.mentees m
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
      ${whereClause}
    `;

    const selectSql = `
      SELECT 
        m.id,
        m.full_name,
        m.email,
        m.roll_number,
        m.admission_number,
        m.department,
        COALESCE(m.semester, p.attendance_semester, 1)::int AS semester,
        m.batch,
        m.academic_year,
        m.section,
        m.phone,
        m.mentor_id,
        mentors.full_name AS mentor_name,
        mentors.email AS mentor_email,
        mentors.department AS mentor_department,
        m.created_at,
        m.updated_at,
        p.student_photo_url,
        p.current_cgpa,
        p.attendance_percentage,
        p.total_backlogs,
        p.submitted_at,
        CASE 
          WHEN p.submitted_at IS NOT NULL OR m.profile_status = 'Complete' THEN 'Complete'
          ELSE 'Incomplete'
        END AS profile_status,
        COALESCE(m.account_status, CASE WHEN m.password_hash IS NULL THEN 'not_activated' ELSE 'active' END) AS account_status,
        COALESCE(m.must_change_password, false) AS must_change_password,
        (m.password_hash IS NOT NULL) AS has_password
      FROM public.mentees m
      LEFT JOIN public.mentors mentors ON mentors.id = m.mentor_id
      LEFT JOIN public.mentee_profiles p ON p.mentee_id = m.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const [countRes, rowsRes] = await Promise.all([
      pool.query(countSql, queryParams),
      pool.query(selectSql, [...queryParams, limitNum, offset]),
    ]);

    res.json({
      students: rowsRes.rows,
      total: countRes.rows[0].count,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error('Admin students error:', err.message);
    res.status(500).json({ error: 'Could not fetch students directory' });
  }
});

// POST /api/admin/students - Register New Student with Direct Mentor Allotment
app.post('/api/admin/students', requireAdmin, async (req, res) => {
  try {
    const {
      full_name,
      email,
      roll_number,
      admission_number,
      department,
      semester,
      batch,
      academic_year,
      section,
      phone,
      mentor_id,
      initial_password,
    } = req.body;

    if (!full_name || !email || !roll_number) {
      return res.status(400).json({ error: 'Name, email, and roll number are required' });
    }

    const existing = await pool.query(
      'SELECT id FROM public.mentees WHERE LOWER(email) = LOWER($1) OR roll_number = $2',
      [email.trim(), roll_number.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A student with this email or roll number already exists' });
    }

    let passwordHash = null;
    let accountStatus = 'not_activated';
    let mustChangePassword = false;

    if (initial_password && initial_password.trim()) {
      passwordHash = await bcrypt.hash(initial_password.trim(), 10);
      accountStatus = 'active';
      mustChangePassword = true;
    }

    const result = await pool.query(`
      INSERT INTO public.mentees
        (full_name, email, roll_number, admission_number, department, semester, batch, academic_year, section, phone, mentor_id, profile_status, password_hash, account_status, must_change_password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Incomplete', $12, $13, $14)
      RETURNING *
    `, [
      full_name.trim(),
      email.toLowerCase().trim(),
      roll_number.trim(),
      admission_number || null,
      department || 'Computer Science',
      semester ? Number(semester) : 1,
      batch || '2024-2028',
      academic_year || '2026-27',
      section || 'A',
      phone || null,
      mentor_id ? Number(mentor_id) : null,
      passwordHash,
      accountStatus,
      mustChangePassword,
    ]);

    res.status(201).json({
      message: 'Student enrolled successfully',
      student: result.rows[0],
    });
  } catch (err) {
    console.error('Create student error:', err.message);
    res.status(500).json({ error: 'Could not enroll student' });
  }
});

// PUT /api/admin/students/:id - Update Student Academic & Mentor Allocation
app.put('/api/admin/students/:id', requireAdmin, async (req, res) => {
  try {
    const {
      full_name,
      email,
      roll_number,
      admission_number,
      department,
      semester,
      batch,
      academic_year,
      section,
      phone,
      mentor_id,
      profile_status,
    } = req.body;

    const result = await pool.query(`
      UPDATE public.mentees
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          roll_number = COALESCE($3, roll_number),
          admission_number = COALESCE($4, admission_number),
          department = COALESCE($5, department),
          semester = COALESCE($6, semester),
          batch = COALESCE($7, batch),
          academic_year = COALESCE($8, academic_year),
          section = COALESCE($9, section),
          phone = COALESCE($10, phone),
          mentor_id = $11,
          profile_status = COALESCE($12, profile_status),
          updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [
      full_name,
      email ? email.toLowerCase().trim() : null,
      roll_number,
      admission_number,
      department,
      semester ? Number(semester) : null,
      batch,
      academic_year,
      section,
      phone,
      mentor_id === null || mentor_id === '' ? null : Number(mentor_id),
      profile_status,
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      message: 'Student record updated successfully',
      student: result.rows[0],
    });
  } catch (err) {
    console.error('Update student error:', err.message);
    res.status(500).json({ error: 'Could not update student' });
  }
});

// DELETE /api/admin/students/:id - Cascade Removal of Student
app.delete('/api/admin/students/:id', requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;

    await pool.query('DELETE FROM public.mentee_tokens WHERE mentee_id = $1', [studentId]);
    await pool.query('DELETE FROM public.mentor_notes WHERE mentee_id = $1', [studentId]);
    await pool.query('DELETE FROM public.university_suggestions WHERE mentee_id = $1', [studentId]);
    await pool.query('DELETE FROM public.achievements WHERE mentee_id = $1', [studentId]);
    await pool.query('DELETE FROM public.academic_results WHERE mentee_id = $1', [studentId]);

    const issuesRes = await pool.query('SELECT id FROM public.issues WHERE mentee_id = $1', [studentId]);
    const issueIds = issuesRes.rows.map((r) => r.id);
    if (issueIds.length > 0) {
      await pool.query('DELETE FROM public.issue_notes WHERE issue_id = ANY($1::bigint[])', [issueIds]);
      await pool.query('DELETE FROM public.issues WHERE mentee_id = $1', [studentId]);
    }

    await pool.query('DELETE FROM public.mentee_profiles WHERE mentee_id = $1', [studentId]);
    const delRes = await pool.query('DELETE FROM public.mentees WHERE id = $1 RETURNING id, full_name', [studentId]);

    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: `Student ${delRes.rows[0].full_name} removed successfully` });
  } catch (err) {
    console.error('Delete student error:', err.message);
    res.status(500).json({ error: 'Failed to remove student record' });
  }
});

// Helper: Generate Secure Temporary Password
function generateSecureTempPassword(prefix = 'Temp#') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${rand}!`;
}

// POST /api/admin/students/:id/activate - Activate Student Login & Generate Temporary Password
app.post('/api/admin/students/:id/activate', requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { custom_password } = req.body;

    const studentRes = await pool.query(
      `SELECT id, full_name, email, roll_number, admission_number, department, semester, section, account_status, password_hash
       FROM public.mentees WHERE id = $1`,
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const student = studentRes.rows[0];

    const tempPassword = (custom_password && custom_password.trim().length >= 6)
      ? custom_password.trim()
      : generateSecureTempPassword();

    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const updateRes = await pool.query(
      `UPDATE public.mentees
       SET password_hash = $1,
           account_status = 'active',
           must_change_password = true,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, email, roll_number, admission_number, department, semester, section, account_status, must_change_password`,
      [passwordHash, studentId]
    );

    res.json({
      message: `Account activated successfully for ${student.full_name}`,
      temp_password: tempPassword,
      student: updateRes.rows[0],
      activation_type: custom_password ? 'custom' : 'generated',
    });
  } catch (err) {
    console.error('Activate student error:', err.message);
    res.status(500).json({ error: 'Failed to activate student account' });
  }
});

// POST /api/admin/students/:id/reset-password - Admin Reset Student Password
app.post('/api/admin/students/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { custom_password } = req.body;

    const studentRes = await pool.query(
      `SELECT id, full_name, email, roll_number, admission_number, department, semester, section, account_status
       FROM public.mentees WHERE id = $1`,
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const student = studentRes.rows[0];

    const tempPassword = (custom_password && custom_password.trim().length >= 6)
      ? custom_password.trim()
      : generateSecureTempPassword();

    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const updateRes = await pool.query(
      `UPDATE public.mentees
       SET password_hash = $1,
           account_status = 'password_reset_required',
           must_change_password = true,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, email, roll_number, admission_number, department, semester, section, account_status, must_change_password`,
      [passwordHash, studentId]
    );

    res.json({
      message: `Temporary password generated for ${student.full_name}`,
      temp_password: tempPassword,
      student: updateRes.rows[0],
      activation_type: custom_password ? 'custom' : 'generated',
    });
  } catch (err) {
    console.error('Reset student password error:', err.message);
    res.status(500).json({ error: 'Failed to reset student password' });
  }
});

// POST /api/admin/students/bulk-activate - Bulk Student Activation & Temporary Password Generation
app.post('/api/admin/students/bulk-activate', requireAdmin, async (req, res) => {
  try {
    const {
      target_type = 'unactivated', // 'unactivated' | 'all' | 'selected'
      student_ids = [],
      department = '',
      semester = '',
      section = '',
      password_type = 'unique', // 'unique' | 'common'
      common_password = '',
    } = req.body;

    let queryConditions = [];
    let queryParams = [];

    if (target_type === 'selected') {
      if (!Array.isArray(student_ids) || student_ids.length === 0) {
        return res.status(400).json({ error: 'Please select at least one student for bulk activation.' });
      }
      queryParams.push(student_ids);
      queryConditions.push(`id = ANY($${queryParams.length}::bigint[])`);
    } else if (target_type === 'unactivated') {
      queryConditions.push(`(password_hash IS NULL OR account_status = 'not_activated')`);
    }

    if (department) {
      queryParams.push(department);
      queryConditions.push(`department = $${queryParams.length}`);
    }

    if (semester) {
      queryParams.push(Number(semester));
      queryConditions.push(`semester = $${queryParams.length}`);
    }

    if (section) {
      queryParams.push(section);
      queryConditions.push(`section = $${queryParams.length}`);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';
    const studentsRes = await pool.query(
      `SELECT id, full_name, roll_number, email, department, semester, section, account_status
       FROM public.mentees
       ${whereClause}
       ORDER BY roll_number ASC, full_name ASC`,
      queryParams
    );

    const students = studentsRes.rows;
    if (students.length === 0) {
      return res.status(400).json({
        error: target_type === 'unactivated'
          ? 'No unactivated students found matching your criteria.'
          : 'No students found matching your criteria.',
      });
    }

    const results = [];
    const batchSize = 10;
    for (let i = 0; i < students.length; i += batchSize) {
      const slice = students.slice(i, i + batchSize);
      await Promise.all(
        slice.map(async (st) => {
          const tempPassword = (password_type === 'common' && common_password && common_password.trim().length >= 6)
            ? common_password.trim()
            : generateSecureTempPassword();

          const hash = await bcrypt.hash(tempPassword, 10);
          await pool.query(
            `UPDATE public.mentees
             SET password_hash = $1,
                 account_status = 'active',
                 must_change_password = true,
                 updated_at = NOW()
             WHERE id = $2`,
            [hash, st.id]
          );

          results.push({
            id: st.id,
            full_name: st.full_name,
            roll_number: st.roll_number,
            email: st.email,
            department: st.department || 'Computer Science',
            semester: st.semester || 1,
            section: st.section || 'A',
            temp_password: tempPassword,
          });
        })
      );
    }

    res.json({
      message: `Successfully generated temporary passwords for ${results.length} students!`,
      count: results.length,
      credentials: results,
    });
  } catch (err) {
    console.error('Bulk activate students error:', err.message);
    res.status(500).json({ error: 'Failed to complete bulk student activation.' });
  }
});

// POST /api/admin/allocate - Reassign Single or Multiple Students to a Mentor
app.post('/api/admin/allocate', requireAdmin, async (req, res) => {
  try {
    const { student_ids, target_mentor_id } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: 'student_ids must be a non-empty array' });
    }

    const mentorId = target_mentor_id ? Number(target_mentor_id) : null;

    // Fetch previous details for history
    const prevStudentsRes = await pool.query(`
      SELECT s.id, s.full_name, s.roll_number, s.admission_number, s.mentor_id, m.full_name AS previous_mentor_name
      FROM public.mentees s
      LEFT JOIN public.mentors m ON m.id = s.mentor_id
      WHERE s.id = ANY($1::bigint[])
    `, [student_ids]);

    const result = await pool.query(`
      UPDATE public.mentees 
      SET mentor_id = $1, updated_at = NOW()
      WHERE id = ANY($2::bigint[])
      RETURNING id, full_name, roll_number, mentor_id
    `, [mentorId, student_ids]);

    let targetMentorName = 'Unassigned Pool';
    if (mentorId) {
      const tMentorRes = await pool.query('SELECT full_name FROM public.mentors WHERE id = $1', [mentorId]);
      targetMentorName = tMentorRes.rows[0]?.full_name || `Mentor #${mentorId}`;

      try {
        await pool.query(`
          INSERT INTO public.notifications (mentor_id, title, message, type)
          VALUES ($1, $2, $3, 'system')
        `, [
          mentorId,
          'New Mentees Allocated',
          `Institutional administration has allocated ${result.rowCount} student(s) to your mentoring portfolio.`,
        ]);
      } catch (e) {
        console.warn('Failed to insert mentor allocation notification:', e.message);
      }
    }

    // Log to allocation history
    const adminUser = req.admin || req.user || {};
    try {
      const affectedList = prevStudentsRes.rows.map((s) => ({
        id: s.id,
        full_name: s.full_name,
        roll_number: s.roll_number || s.admission_number || '—',
        previous_mentor_id: s.mentor_id,
        previous_mentor_name: s.previous_mentor_name || 'Unassigned',
      }));

      await pool.query(`
        INSERT INTO public.allocation_history (
          admin_id, admin_name, target_mentor_id, target_mentor_name,
          department, semester, unassigned_only, action_type,
          total_matched, successful_count, skipped_count, failed_count,
          affected_students, notes
        ) VALUES ($1, $2, $3, $4, 'Various', NULL, false, 'manual_batch', $5, $6, 0, 0, $7, $8)
      `, [
        adminUser.id ? Number(adminUser.id) : null,
        adminUser.full_name || adminUser.email || 'Administrator',
        mentorId,
        targetMentorName,
        student_ids.length,
        result.rowCount,
        JSON.stringify(affectedList),
        `Manual batch allocation of ${result.rowCount} student(s) to ${targetMentorName}`,
      ]);
    } catch (histErr) {
      console.warn('Failed to log batch allocation history:', histErr.message);
    }

    res.json({
      message: `Successfully allocated ${result.rowCount} student(s) ${mentorId ? `to ${targetMentorName}` : 'to unassigned pool'}.`,
      updated_count: result.rowCount,
    });
  } catch (err) {
    console.error('Allocation error:', err.message);
    res.status(500).json({ error: 'Failed to reallocate students' });
  }
});

// GET /api/admin/bulk-allocate/preview - Real-Time Cohort & Capacity Analysis
app.get('/api/admin/bulk-allocate/preview', requireAdmin, async (req, res) => {
  try {
    const { department, semester, target_mentor_id, unassigned_only, capacity_limit } = req.query;
    const isUnassignedOnly = unassigned_only === 'true' || unassigned_only === true || unassigned_only === undefined;
    const mentorId = target_mentor_id ? Number(target_mentor_id) : null;

    // Fetch dynamic departments and semesters directly from database
    const deptsRes = await pool.query(`
      SELECT DISTINCT department 
      FROM public.mentees 
      WHERE department IS NOT NULL AND department != '' 
      ORDER BY department ASC
    `);
    const semsRes = await pool.query(`
      SELECT DISTINCT semester 
      FROM public.mentees 
      WHERE semester IS NOT NULL 
      ORDER BY semester ASC
    `);

    let filterQuery = 'WHERE 1=1';
    let filterParams = [];

    if (department && department.trim()) {
      filterParams.push(department.trim());
      filterQuery += ` AND s.department = $${filterParams.length}`;
    }

    if (semester && semester !== '') {
      filterParams.push(Number(semester));
      filterQuery += ` AND s.semester = $${filterParams.length}`;
    }

    // 1. Cohort Statistics directly from database
    const countSql = `
      SELECT 
        COUNT(*)::int AS total_matched,
        COUNT(CASE WHEN s.mentor_id IS NOT NULL THEN 1 END)::int AS assigned_count,
        COUNT(CASE WHEN s.mentor_id IS NULL THEN 1 END)::int AS unassigned_count
      FROM public.mentees s
      ${filterQuery}
    `;
    const countRes = await pool.query(countSql, filterParams);
    const cohortCounts = countRes.rows[0] || { total_matched: 0, assigned_count: 0, unassigned_count: 0 };

    // 2. Target Mentor details & Workload Capacity
    let targetMentor = null;
    let currentMenteesCount = 0;
    let mentorCapacity = 30;

    if (mentorId) {
      const mentorRes = await pool.query(`
        SELECT id, full_name, email, department, designation, employee_id, 
               COALESCE(status, 'active') as status,
               COALESCE(max_capacity, 30)::int AS max_capacity
        FROM public.mentors
        WHERE id = $1 AND (role != 'admin' OR role IS NULL)
      `, [mentorId]);

      if (mentorRes.rows.length > 0) {
        targetMentor = mentorRes.rows[0];
        mentorCapacity = capacity_limit ? Number(capacity_limit) : targetMentor.max_capacity;

        const menteeCountRes = await pool.query(
          'SELECT COUNT(*)::int AS count FROM public.mentees WHERE mentor_id = $1',
          [mentorId]
        );
        currentMenteesCount = menteeCountRes.rows[0]?.count || 0;
      }
    }

    // 3. Candidate Students Preview List
    const studentsSql = `
      SELECT 
        s.id,
        s.full_name,
        s.roll_number,
        s.admission_number,
        s.department,
        s.semester,
        s.batch,
        s.mentor_id,
        m.full_name AS current_mentor_name,
        m.department AS current_mentor_department
      FROM public.mentees s
      LEFT JOIN public.mentors m ON m.id = s.mentor_id
      ${filterQuery}
      ORDER BY 
        CASE WHEN s.mentor_id IS NULL THEN 0 ELSE 1 END,
        s.full_name ASC
      LIMIT 200
    `;
    const studentsRes = await pool.query(studentsSql, filterParams);

    let willAllocateCount = 0;
    let willSkipCount = 0;
    let reassignmentsCount = 0;

    const previewStudents = studentsRes.rows.map((s) => {
      let willAllocate = false;
      let status = 'unassigned';
      let actionLabel = '';

      if (mentorId && s.mentor_id === mentorId) {
        status = 'already_assigned';
        willAllocate = false;
        actionLabel = 'Already assigned to this mentor (will skip)';
        willSkipCount++;
      } else if (s.mentor_id === null) {
        status = 'unassigned';
        willAllocate = true;
        actionLabel = mentorId ? `Assign to ${targetMentor?.full_name || 'selected mentor'}` : 'Will allocate';
        willAllocateCount++;
      } else {
        status = 'assigned_to_other';
        if (isUnassignedOnly) {
          willAllocate = false;
          actionLabel = `Preserve under ${s.current_mentor_name || 'current mentor'}`;
          willSkipCount++;
        } else {
          willAllocate = true;
          actionLabel = `Reassign from ${s.current_mentor_name || 'current mentor'} to ${targetMentor?.full_name || 'selected mentor'}`;
          willAllocateCount++;
          reassignmentsCount++;
        }
      }

      return {
        id: s.id,
        full_name: s.full_name,
        roll_number: s.roll_number || s.admission_number || '—',
        department: s.department,
        semester: s.semester,
        mentor_id: s.mentor_id,
        current_mentor_name: s.current_mentor_name,
        status,
        will_allocate: willAllocate,
        action_label: actionLabel,
      };
    });

    const projectedMentees = currentMenteesCount + willAllocateCount;
    const exceedsCapacity = mentorId ? projectedMentees > mentorCapacity : false;
    const capacityOverflow = exceedsCapacity ? projectedMentees - mentorCapacity : 0;

    res.json({
      available_departments: deptsRes.rows.map((r) => r.department),
      available_semesters: semsRes.rows.map((r) => r.semester),
      cohort: {
        department: department || 'All Departments',
        semester: semester || 'All Semesters',
        total_matched: cohortCounts.total_matched,
        assigned_count: cohortCounts.assigned_count,
        unassigned_count: cohortCounts.unassigned_count,
      },
      target_mentor: targetMentor ? {
        id: targetMentor.id,
        full_name: targetMentor.full_name,
        department: targetMentor.department,
        designation: targetMentor.designation,
        status: targetMentor.status || 'active',
        is_inactive: targetMentor.status === 'inactive',
        current_mentees_count: currentMenteesCount,
        max_capacity: mentorCapacity,
      } : null,
      calculation: {
        to_allocate: willAllocateCount,
        to_skip: willSkipCount,
        reassignments_count: reassignmentsCount,
        current_mentees: currentMenteesCount,
        projected_mentees: projectedMentees,
        max_capacity: mentorCapacity,
        exceeds_capacity: exceedsCapacity,
        capacity_overflow: capacityOverflow,
      },
      preview_students: previewStudents,
    });
  } catch (err) {
    console.error('Bulk allocate preview error:', err.message);
    res.status(500).json({ error: 'Failed to generate allocation preview' });
  }
});

// POST /api/admin/bulk-allocate - Cohort Bulk Allotment with Validation, Capacity Check & History Logging
app.post('/api/admin/bulk-allocate', requireAdmin, async (req, res) => {
  try {
    const {
      department,
      semester,
      target_mentor_id,
      unassigned_only = true,
      capacity_limit,
      override_capacity = false,
      confirm_reassign = false,
      student_ids,
    } = req.body;

    if (!target_mentor_id) {
      return res.status(400).json({ error: 'Target faculty mentor is required for bulk allotment.' });
    }

    const mentorId = Number(target_mentor_id);

    // 1. Verify target mentor (must exist, not be admin, and not be inactive)
    const mentorRes = await pool.query(`
      SELECT id, full_name, email, department, designation, employee_id, 
             COALESCE(status, 'active') as status,
             COALESCE(max_capacity, 30)::int AS max_capacity
      FROM public.mentors
      WHERE id = $1 AND (role != 'admin' OR role IS NULL)
    `, [mentorId]);

    if (mentorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Selected faculty mentor was not found or is invalid.' });
    }

    const targetMentor = mentorRes.rows[0];

    if (targetMentor.status === 'inactive') {
      return res.status(400).json({
        error: `Selected faculty mentor (${targetMentor.full_name}) is inactive and cannot accept mentee assignments.`,
        is_inactive: true,
      });
    }

    const effectiveCapacity = capacity_limit ? Number(capacity_limit) : targetMentor.max_capacity;

    // 2. Fetch mentor's current mentee count
    const curMenteeRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM public.mentees WHERE mentor_id = $1',
      [mentorId]
    );
    const currentMenteesCount = curMenteeRes.rows[0]?.count || 0;

    // 3. Find matching students (by specific student_ids OR department/semester filters)
    let filterQuery = 'WHERE 1=1';
    let filterParams = [];

    if (Array.isArray(student_ids) && student_ids.length > 0) {
      const validIds = student_ids.map(Number).filter((n) => !isNaN(n));
      filterParams.push(validIds);
      filterQuery += ` AND s.id = ANY($${filterParams.length}::bigint[])`;
    } else {
      if (department && department.trim()) {
        filterParams.push(department.trim());
        filterQuery += ` AND s.department = $${filterParams.length}`;
      }

      if (semester && semester !== '') {
        filterParams.push(Number(semester));
        filterQuery += ` AND s.semester = $${filterParams.length}`;
      }
    }

    const studentsRes = await pool.query(`
      SELECT 
        s.id,
        s.full_name,
        s.roll_number,
        s.admission_number,
        s.department,
        s.semester,
        s.mentor_id,
        m.full_name AS previous_mentor_name
      FROM public.mentees s
      LEFT JOIN public.mentors m ON m.id = s.mentor_id
      ${filterQuery}
    `, filterParams);

    const allMatched = studentsRes.rows;

    if (allMatched.length === 0) {
      return res.status(400).json({
        error: 'No students found matching the selected criteria to assign.',
      });
    }

    // 4. Partition students into to_allocate vs skipped
    const toAllocate = [];
    const skipped = [];
    const reassigningFromOthers = [];

    const isSpecificSelection = Array.isArray(student_ids) && student_ids.length > 0;

    for (const student of allMatched) {
      if (student.mentor_id === mentorId) {
        // Prevent duplicate active student-mentor assignment!
        skipped.push({
          id: student.id,
          full_name: student.full_name,
          roll_number: student.roll_number || student.admission_number || '—',
          reason: 'Already assigned to this mentor',
        });
      } else if (student.mentor_id === null) {
        toAllocate.push(student);
      } else {
        // Student already has another mentor
        if (!isSpecificSelection && unassigned_only) {
          skipped.push({
            id: student.id,
            full_name: student.full_name,
            roll_number: student.roll_number || student.admission_number || '—',
            reason: `Preserved under existing mentor (${student.previous_mentor_name || 'Faculty'})`,
          });
        } else {
          // Explicitly targeted or unassigned_only is false
          if (!confirm_reassign) {
            reassigningFromOthers.push(student);
          } else {
            toAllocate.push(student);
            reassigningFromOthers.push(student);
          }
        }
      }
    }

    // 5. Backend Reassignment Confirmation Check
    if (reassigningFromOthers.length > 0 && !confirm_reassign) {
      return res.status(400).json({
        error: `Confirmation required: This operation will reassign ${reassigningFromOthers.length} student(s) currently under other faculty members.`,
        requires_confirmation: true,
        reassign_count: reassigningFromOthers.length,
        reassign_students: reassigningFromOthers.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          roll_number: s.roll_number || s.admission_number || '—',
          current_mentor_name: s.previous_mentor_name || 'Current Mentor',
        })),
      });
    }

    // 6. Backend Capacity Check
    const projectedTotal = currentMenteesCount + toAllocate.length;
    if (projectedTotal > effectiveCapacity && !override_capacity) {
      return res.status(400).json({
        error: `Workload capacity warning: Allocating ${toAllocate.length} student(s) will result in ${projectedTotal} mentees, exceeding ${targetMentor.full_name}'s limit of ${effectiveCapacity}.`,
        exceeds_capacity: true,
        current_mentees: currentMenteesCount,
        to_allocate: toAllocate.length,
        projected_total: projectedTotal,
        capacity_limit: effectiveCapacity,
        overflow: projectedTotal - effectiveCapacity,
      });
    }

    // 7. Execute Allocation inside DB
    let successfulCount = 0;
    let failedCount = 0;
    let affectedList = [];

    if (toAllocate.length > 0) {
      const studentIdsToUpdate = toAllocate.map((s) => s.id);
      const updateResult = await pool.query(`
        UPDATE public.mentees 
        SET mentor_id = $1, updated_at = NOW()
        WHERE id = ANY($2::bigint[])
        RETURNING id, full_name, roll_number
      `, [mentorId, studentIdsToUpdate]);

      successfulCount = updateResult.rowCount;
      affectedList = toAllocate.map((s) => ({
        id: s.id,
        full_name: s.full_name,
        roll_number: s.roll_number || s.admission_number || '—',
        previous_mentor_id: s.mentor_id,
        previous_mentor_name: s.previous_mentor_name || 'Unassigned',
      }));
    }

    // 8. Log Allocation History
    const adminUser = req.admin || req.user || {};
    try {
      await pool.query(`
        INSERT INTO public.allocation_history (
          admin_id, admin_name, target_mentor_id, target_mentor_name,
          department, semester, unassigned_only, action_type,
          total_matched, successful_count, skipped_count, failed_count,
          affected_students, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'bulk_cohort', $8, $9, $10, $11, $12, $13)
      `, [
        adminUser.id ? Number(adminUser.id) : null,
        adminUser.full_name || adminUser.email || 'Administrator',
        mentorId,
        targetMentor.full_name,
        department || 'All Departments',
        semester ? Number(semester) : null,
        Boolean(unassigned_only),
        allMatched.length,
        successfulCount,
        skipped.length,
        failedCount,
        JSON.stringify(affectedList),
        `Bulk mentor assignment for ${department || 'All'} Sem ${semester || 'All'} to ${targetMentor.full_name}`,
      ]);
    } catch (histErr) {
      console.warn('Failed to insert allocation history:', histErr.message);
    }

    // 9. Send Notification to Target Mentor
    try {
      await pool.query(`
        INSERT INTO public.notifications (mentor_id, title, message, type)
        VALUES ($1, $2, $3, 'system')
      `, [
        mentorId,
        'New Mentee Assignment',
        `Institutional administration has assigned ${successfulCount} student(s) to your mentee portfolio. Your active mentee count is now ${currentMenteesCount + successfulCount}.`,
      ]);
    } catch (e) {
      console.warn('Failed to insert mentor notification:', e.message);
    }

    res.json({
      success: true,
      message: `Bulk mentor assignment completed successfully: ${successfulCount} student(s) assigned, ${skipped.length} skipped.`,
      successful_count: successfulCount,
      skipped_count: skipped.length,
      failed_count: failedCount,
      total_matched: allMatched.length,
      affected_students: affectedList,
      skipped_students: skipped,
      failed_students: [],
      mentor: {
        id: targetMentor.id,
        full_name: targetMentor.full_name,
        department: targetMentor.department,
        previous_mentees: currentMenteesCount,
        new_total_mentees: currentMenteesCount + successfulCount,
        max_capacity: effectiveCapacity,
      },
    });
  } catch (err) {
    console.error('Bulk allocate error:', err.message);
    res.status(500).json({ error: 'Failed to perform bulk mentor assignment' });
  }
});

// GET /api/admin/allocation-history - Audit Log of Past Allocations
app.get('/api/admin/allocation-history', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        admin_id,
        admin_name,
        target_mentor_id,
        target_mentor_name,
        department,
        semester,
        unassigned_only,
        action_type,
        total_matched,
        successful_count,
        skipped_count,
        failed_count,
        affected_students,
        notes,
        created_at
      FROM public.allocation_history
      ORDER BY created_at DESC
      LIMIT 30
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Allocation history error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve allocation history' });
  }
});

// ─────────────────────────────────────────────────────────────
// 12. CLASS COORDINATOR & INSTITUTIONAL COHORT GOVERNANCE
// ─────────────────────────────────────────────────────────────

// ── A. Class Coordinator Protected Routes (requireCoordinator) ──

// GET /api/coordinator/classes - Retrieve all active classes assigned to logged-in coordinator
app.get('/api/coordinator/classes', authenticateToken, async (req, res) => {
  try {
    if (req.role !== 'mentor' && req.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Mentor or Administrator role required.' });
    }

    let query = '';
    let params = [];

    if (req.role === 'admin') {
      query = `
        SELECT 
          cc.id, cc.department, cc.course, cc.academic_year, cc.semester, cc.section, 
          cc.status, cc.assigned_at, cc.notes,
          COUNT(s.id)::int AS total_students,
          COUNT(DISTINCT s.mentor_id)::int AS total_mentors
        FROM public.class_coordinators cc
        LEFT JOIN public.mentees s 
          ON s.department = cc.department AND s.semester = cc.semester AND s.section = cc.section
        WHERE cc.status = 'active'
        GROUP BY cc.id, cc.department, cc.course, cc.academic_year, cc.semester, cc.section, cc.status, cc.assigned_at, cc.notes
        ORDER BY cc.semester ASC, cc.section ASC;
      `;
    } else {
      const mentorId = req.mentor?.id;
      if (!mentorId) {
        return res.json([]);
      }
      query = `
        SELECT 
          cc.id, cc.department, cc.course, cc.academic_year, cc.semester, cc.section, 
          cc.status, cc.assigned_at, cc.notes,
          COUNT(s.id)::int AS total_students,
          COUNT(DISTINCT s.mentor_id)::int AS total_mentors
        FROM public.class_coordinators cc
        LEFT JOIN public.mentees s 
          ON s.department = cc.department AND s.semester = cc.semester AND s.section = cc.section
        WHERE cc.mentor_id = $1 AND cc.status = 'active'
        GROUP BY cc.id, cc.department, cc.course, cc.academic_year, cc.semester, cc.section, cc.status, cc.assigned_at, cc.notes
        ORDER BY cc.semester ASC, cc.section ASC;
      `;
      params = [mentorId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch coordinator classes error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve coordinated classes' });
  }
});

// GET /api/coordinator/overview - Real-time metrics for coordinated class
app.get('/api/coordinator/overview', requireCoordinator, async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    const matchClass = req.coordinatedClasses.find(c =>
      c.department === department &&
      Number(c.semester) === Number(semester) &&
      c.section === section
    );

    if (!matchClass && req.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied: You are not the active Class Coordinator for this class/section.'
      });
    }

    const semNum = Number(semester);

    // Run all 8 metrics queries concurrently for optimal performance
    const [
      metricsRes,
      issuesRes,
      mentorsDistRes,
      unassignedRes,
      attDistRes,
      cgpaDistRes,
      announcementsRes,
      attentionListRes,
    ] = await Promise.all([
      // 1. Core Class Metrics
      pool.query(`
        SELECT 
          COUNT(s.id)::int AS total_students,
          COUNT(CASE WHEN s.profile_status = 'Complete' THEN 1 END)::int AS active_students,
          COUNT(DISTINCT s.mentor_id)::int AS total_mentors,
          COALESCE(ROUND(AVG(COALESCE(mp.attendance_percentage, 85))::numeric, 1), 0) AS overall_attendance,
          COALESCE(ROUND(AVG(COALESCE(mp.current_cgpa, 7.5))::numeric, 2), 0) AS average_cgpa,
          COUNT(CASE WHEN COALESCE(mp.total_backlogs, 0) > 0 THEN 1 END)::int AS students_with_backlogs,
          COUNT(CASE WHEN COALESCE(mp.attendance_percentage, 85) < 75 OR COALESCE(mp.current_cgpa, 7.5) < 6.0 OR COALESCE(mp.total_backlogs, 0) > 0 THEN 1 END)::int AS attention_needed
        FROM public.mentees s
        LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
        WHERE s.department = $1 AND s.semester = $2 AND s.section = $3;
      `, [department, semNum, section]),

      // 2. Pending Issues in this class
      pool.query(`
        SELECT COUNT(*)::int AS pending_issues
        FROM public.issues i
        JOIN public.mentees s ON i.mentee_id = s.id
        WHERE s.department = $1 AND s.semester = $2 AND s.section = $3 AND i.status != 'Resolved';
      `, [department, semNum, section]),

      // 3. Mentors distribution in this class
      pool.query(`
        SELECT 
          m.id AS mentor_id,
          m.full_name AS mentor_name,
          m.employee_id,
          m.email,
          m.phone,
          m.avatar_url,
          COUNT(s.id)::int AS student_count,
          json_agg(json_build_object(
            'id', s.id, 
            'full_name', s.full_name, 
            'roll_number', s.roll_number,
            'cgpa', COALESCE(mp.current_cgpa, 0),
            'attendance', COALESCE(mp.attendance_percentage, 0)
          ) ORDER BY s.roll_number) AS mentees_list
        FROM public.mentees s
        JOIN public.mentors m ON s.mentor_id = m.id
        LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
        WHERE s.department = $1 AND s.semester = $2 AND s.section = $3
        GROUP BY m.id, m.full_name, m.employee_id, m.email, m.phone, m.avatar_url
        ORDER BY student_count DESC;
      `, [department, semNum, section]),

      // 4. Unassigned Students in this class
      pool.query(`
        SELECT COUNT(*)::int AS unassigned_count
        FROM public.mentees
        WHERE department = $1 AND semester = $2 AND section = $3 AND mentor_id IS NULL;
      `, [department, semNum, section]),

      // 5. Attendance Distribution Brackets
      pool.query(`
        SELECT 
          COUNT(CASE WHEN COALESCE(mp.attendance_percentage, 85) < 75 THEN 1 END)::int AS low,
          COUNT(CASE WHEN COALESCE(mp.attendance_percentage, 85) >= 75 AND COALESCE(mp.attendance_percentage, 85) < 85 THEN 1 END)::int AS medium,
          COUNT(CASE WHEN COALESCE(mp.attendance_percentage, 85) >= 85 THEN 1 END)::int AS high
        FROM public.mentees s
        LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
        WHERE s.department = $1 AND s.semester = $2 AND s.section = $3;
      `, [department, semNum, section]),

      // 6. CGPA Distribution Brackets
      pool.query(`
        SELECT 
          COUNT(CASE WHEN COALESCE(mp.current_cgpa, 7.5) < 6.0 THEN 1 END)::int AS below6,
          COUNT(CASE WHEN COALESCE(mp.current_cgpa, 7.5) >= 6.0 AND COALESCE(mp.current_cgpa, 7.5) < 7.5 THEN 1 END)::int AS range6_75,
          COUNT(CASE WHEN COALESCE(mp.current_cgpa, 7.5) >= 7.5 AND COALESCE(mp.current_cgpa, 7.5) < 9.0 THEN 1 END)::int AS range75_9,
          COUNT(CASE WHEN COALESCE(mp.current_cgpa, 7.5) >= 9.0 THEN 1 END)::int AS above9
        FROM public.mentees s
        LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
        WHERE s.department = $1 AND s.semester = $2 AND s.section = $3;
      `, [department, semNum, section]),

      // 7. Recent Announcements for this class
      pool.query(`
        SELECT ca.*, m.full_name AS author_name 
        FROM public.class_announcements ca
        LEFT JOIN public.mentors m ON ca.mentor_id = m.id
        WHERE ca.department = $1 AND ca.semester = $2 AND ca.section = $3
        ORDER BY ca.created_at DESC
        LIMIT 5;
      `, [department, semNum, section]),

      // 8. Students Requiring Priority Attention
      pool.query(`
        SELECT 
          s.id, s.full_name, s.roll_number, s.mentor_id,
          m.full_name AS mentor_name,
          COALESCE(mp.current_cgpa, 0) AS current_cgpa,
          COALESCE(mp.attendance_percentage, 0) AS attendance_percentage,
          COALESCE(mp.total_backlogs, 0) AS total_backlogs
        FROM public.mentees s
        LEFT JOIN public.mentors m ON s.mentor_id = m.id
        LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
        WHERE s.department = $1 AND s.semester = $2 AND s.section = $3
          AND (COALESCE(mp.attendance_percentage, 85) < 75 OR COALESCE(mp.current_cgpa, 7.5) < 6.0 OR COALESCE(mp.total_backlogs, 0) > 0)
        ORDER BY mp.attendance_percentage ASC, mp.total_backlogs DESC
        LIMIT 5;
      `, [department, semNum, section]),
    ]);

    res.json({
      class: {
        department,
        semester: semNum,
        section,
        course: matchClass?.course || 'B.Tech',
        academic_year: matchClass?.academic_year || '2026-27',
      },
      metrics: {
        ...metricsRes.rows[0],
        pending_issues: issuesRes.rows[0]?.pending_issues || 0,
        unassigned_students: unassignedRes.rows[0]?.unassigned_count || 0,
      },
      attendance_distribution: attDistRes.rows[0],
      cgpa_distribution: cgpaDistRes.rows[0],
      mentors: mentorsDistRes.rows,
      announcements: announcementsRes.rows,
      attention_students: attentionListRes.rows,
    });
  } catch (err) {
    console.error('Coordinator overview error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve class overview' });
  }
});

// GET /api/coordinator/students - All students in coordinated class
app.get('/api/coordinator/students', requireCoordinator, async (req, res) => {
  try {
    const { department, semester, section, search, mentor_id, filter_status } = req.query;

    const matchClass = req.coordinatedClasses.find(c =>
      c.department === department &&
      Number(c.semester) === Number(semester) &&
      c.section === section
    );

    if (!matchClass && req.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied: You do not have coordinator access to this class/section.'
      });
    }

    const semNum = Number(semester);
    let query = `
      SELECT 
        s.id, s.full_name, s.roll_number, s.admission_number, s.department, s.course, s.semester, s.section,
        s.phone, s.email, s.profile_status, s.mentor_id,
        m.full_name AS mentor_name, m.employee_id AS mentor_employee_id, m.email AS mentor_email,
        COALESCE(mp.current_cgpa, 0) AS current_cgpa,
        COALESCE(mp.current_sgpa, 0) AS current_sgpa,
        COALESCE(mp.attendance_percentage, 0) AS attendance_percentage,
        COALESCE(mp.total_backlogs, 0) AS total_backlogs,
        mp.student_photo_url,
        (s.mentor_id = $4)::boolean AS is_own_mentee
      FROM public.mentees s
      LEFT JOIN public.mentors m ON s.mentor_id = m.id
      LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
      WHERE s.department = $1 AND s.semester = $2 AND s.section = $3
    `;

    const params = [department, semNum, section, req.mentor.id];
    let pIdx = 5;

    if (mentor_id) {
      query += ` AND s.mentor_id = $${pIdx++}`;
      params.push(Number(mentor_id));
    }

    if (search && search.trim()) {
      query += ` AND (LOWER(s.full_name) LIKE $${pIdx} OR LOWER(s.roll_number) LIKE $${pIdx} OR LOWER(s.admission_number) LIKE $${pIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    if (filter_status === 'attention') {
      query += ` AND (COALESCE(mp.attendance_percentage, 85) < 75 OR COALESCE(mp.current_cgpa, 7.5) < 6.0 OR COALESCE(mp.total_backlogs, 0) > 0)`;
    } else if (filter_status === 'low_attendance') {
      query += ` AND COALESCE(mp.attendance_percentage, 85) < 75`;
    } else if (filter_status === 'backlogs') {
      query += ` AND COALESCE(mp.total_backlogs, 0) > 0`;
    } else if (filter_status === 'own_mentees') {
      query += ` AND s.mentor_id = $4`;
    }

    query += ` ORDER BY s.roll_number ASC, s.full_name ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Coordinator students error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve class students' });
  }
});

// GET /api/coordinator/students/:id - Read-only student profile lookup for coordinator
app.get('/api/coordinator/students/:id', requireCoordinator, async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    const [menteeRes, profileRes, resultsRes, issuesRes] = await Promise.all([
      pool.query(`
        SELECT s.*, m.full_name AS mentor_name, m.email AS mentor_email, m.phone AS mentor_phone, m.designation AS mentor_designation
        FROM public.mentees s
        LEFT JOIN public.mentors m ON s.mentor_id = m.id
        WHERE s.id = $1
      `, [studentId]),
      pool.query('SELECT * FROM public.mentee_profiles WHERE mentee_id = $1', [studentId]),
      pool.query('SELECT * FROM public.academic_results WHERE mentee_id = $1 ORDER BY semester ASC, id ASC', [studentId]),
      pool.query('SELECT * FROM public.issues WHERE mentee_id = $1 ORDER BY created_at DESC', [studentId]),
    ]);

    if (menteeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const mentee = menteeRes.rows[0];

    // Verify coordinator has access to this student's class
    const matchClass = req.coordinatedClasses.find(c =>
      c.department === mentee.department &&
      Number(c.semester) === Number(mentee.semester) &&
      c.section === mentee.section
    );

    if (!matchClass && req.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied: You are not authorized to view student records outside your coordinated class.'
      });
    }

    const isOwnMentee = Number(mentee.mentor_id) === Number(req.mentor.id);

    res.json({
      mentee,
      profile: profileRes.rows[0] || null,
      results: resultsRes.rows,
      issues: issuesRes.rows,
      isOwnMentee,
    });
  } catch (err) {
    console.error('Coordinator student detail error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve student dossier' });
  }
});

// GET /api/coordinator/mentors - Detailed Mentor Allocation for the class
app.get('/api/coordinator/mentors', requireCoordinator, async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    const matchClass = req.coordinatedClasses.find(c =>
      c.department === department &&
      Number(c.semester) === Number(semester) &&
      c.section === section
    );

    if (!matchClass && req.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this class.' });
    }

    const semNum = Number(semester);

    const mentorsRes = await pool.query(`
      SELECT 
        m.id, m.full_name, m.email, m.phone, m.designation, m.department, m.cabin_number, m.employee_id,
        COUNT(s.id)::int AS assigned_count,
        json_agg(json_build_object(
          'id', s.id, 
          'full_name', s.full_name, 
          'roll_number', s.roll_number,
          'email', s.email,
          'phone', s.phone,
          'profile_status', s.profile_status,
          'current_cgpa', COALESCE(mp.current_cgpa, 0),
          'attendance_percentage', COALESCE(mp.attendance_percentage, 0),
          'total_backlogs', COALESCE(mp.total_backlogs, 0)
        ) ORDER BY s.roll_number) AS students
      FROM public.mentees s
      JOIN public.mentors m ON s.mentor_id = m.id
      LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
      WHERE s.department = $1 AND s.semester = $2 AND s.section = $3
      GROUP BY m.id, m.full_name, m.email, m.phone, m.designation, m.department, m.cabin_number, m.employee_id
      ORDER BY assigned_count DESC;
    `, [department, semNum, section]);

    const unassignedRes = await pool.query(`
      SELECT s.id, s.full_name, s.roll_number, s.email, s.phone, s.profile_status
      FROM public.mentees s
      WHERE s.department = $1 AND s.semester = $2 AND s.section = $3 AND s.mentor_id IS NULL
      ORDER BY s.roll_number;
    `, [department, semNum, section]);

    res.json({
      mentors: mentorsRes.rows,
      unassigned_students: unassignedRes.rows,
    });
  } catch (err) {
    console.error('Coordinator mentors error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve mentor allocation overview' });
  }
});

// GET /api/coordinator/announcements - Fetch class announcements
app.get('/api/coordinator/announcements', requireCoordinator, async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    const result = await pool.query(`
      SELECT ca.*, m.full_name AS coordinator_name, m.employee_id
      FROM public.class_announcements ca
      JOIN public.mentors m ON ca.mentor_id = m.id
      WHERE ca.department = $1 AND ca.semester = $2 AND ca.section = $3
      ORDER BY ca.created_at DESC;
    `, [department, Number(semester), section]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get announcements error:', err.message);
    res.status(500).json({ error: 'Failed to load announcements' });
  }
});

// POST /api/coordinator/announcements - Publish a new class announcement
app.post('/api/coordinator/announcements', requireCoordinator, async (req, res) => {
  try {
    const { title, content, priority, department, semester, section, course, academic_year } = req.body;

    if (!title || !content || !department || !semester || !section) {
      return res.status(400).json({ error: 'Title, content, department, semester, and section are required.' });
    }

    const matchClass = req.coordinatedClasses.find(c =>
      c.department === department &&
      Number(c.semester) === Number(semester) &&
      c.section === section
    );

    if (!matchClass && req.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You cannot publish announcements for this class.' });
    }

    const coordId = matchClass?.id || null;

    const result = await pool.query(`
      INSERT INTO public.class_announcements 
        (coordinator_id, mentor_id, department, course, academic_year, semester, section, title, content, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `, [
      coordId,
      req.mentor.id,
      department,
      course || matchClass?.course || 'B.Tech Computer Science',
      academic_year || matchClass?.academic_year || '2026-27',
      Number(semester),
      section,
      title.trim(),
      content.trim(),
      priority || 'Normal',
    ]);

    res.status(201).json({
      message: 'Announcement published to your class successfully!',
      announcement: result.rows[0],
    });
  } catch (err) {
    console.error('Publish announcement error:', err.message);
    res.status(500).json({ error: 'Failed to publish announcement' });
  }
});

// DELETE /api/coordinator/announcements/:id - Delete an announcement
app.delete('/api/coordinator/announcements/:id', requireCoordinator, async (req, res) => {
  try {
    const announcementId = Number(req.params.id);

    const deleteRes = await pool.query(
      'DELETE FROM public.class_announcements WHERE id = $1 AND (mentor_id = $2 OR $3 = true) RETURNING id',
      [announcementId, req.mentor.id, req.role === 'admin']
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found or unauthorized.' });
    }

    res.json({ message: 'Announcement deleted successfully.' });
  } catch (err) {
    console.error('Delete announcement error:', err.message);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// GET /api/coordinator/reports - Class-wide report datasets & CSV readiness
app.get('/api/coordinator/reports', requireCoordinator, async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    const matchClass = req.coordinatedClasses.find(c =>
      c.department === department &&
      Number(c.semester) === Number(semester) &&
      c.section === section
    );

    if (!matchClass && req.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this class.' });
    }

    const semNum = Number(semester);

    const studentsRes = await pool.query(`
      SELECT 
        s.id, s.full_name, s.roll_number, s.admission_number, s.department, s.course, s.semester, s.section,
        s.email, s.phone, s.profile_status, s.mentor_id,
        m.full_name AS mentor_name, m.employee_id AS mentor_employee_id,
        COALESCE(mp.attendance_percentage, 0) AS attendance_percentage,
        COALESCE(mp.current_cgpa, 0) AS current_cgpa,
        COALESCE(mp.current_sgpa, 0) AS current_sgpa,
        COALESCE(mp.total_backlogs, 0) AS total_backlogs
      FROM public.mentees s
      LEFT JOIN public.mentors m ON s.mentor_id = m.id
      LEFT JOIN public.mentee_profiles mp ON s.id = mp.mentee_id
      WHERE s.department = $1 AND s.semester = $2 AND s.section = $3
      ORDER BY s.roll_number ASC;
    `, [department, semNum, section]);

    const students = studentsRes.rows.map(s => ({
      ...s,
      cgpa: Number(s.current_cgpa || 0) > 0 ? Number(s.current_cgpa).toFixed(2) : null,
      backlogs_count: Number(s.total_backlogs || 0),
      is_own_mentee: String(s.mentor_id) === String(req.mentor?.id),
    }));

    const totalStudents = students.length;
    const attList = students.map(s => Number(s.attendance_percentage || 0)).filter(v => v > 0);
    const overallAttendance = attList.length > 0
      ? (attList.reduce((a, b) => a + b, 0) / attList.length).toFixed(1)
      : '0.0';

    const cgpaList = students.map(s => Number(s.current_cgpa || 0)).filter(v => v > 0);
    const averageCgpa = cgpaList.length > 0
      ? (cgpaList.reduce((a, b) => a + b, 0) / cgpaList.length).toFixed(2)
      : '0.00';

    const backlogsCount = students.filter(s => Number(s.total_backlogs || 0) > 0).length;

    res.json({
      class: {
        department,
        semester: semNum,
        section,
        course: matchClass?.course || 'B.Tech Computer Science',
      },
      metrics: {
        total_students: totalStudents,
        overall_attendance: overallAttendance,
        average_cgpa: averageCgpa,
        students_with_backlogs: backlogsCount,
      },
      students,
    });
  } catch (err) {
    console.error('Coordinator reports error:', err.message);
    res.status(500).json({ error: 'Failed to generate class reports' });
  }
});

// ── B. Admin Class Coordinator Management Endpoints (requireAdmin) ──

// GET /api/admin/coordinators - List all active & historical coordinator assignments
app.get('/api/admin/coordinators', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cc.id, cc.mentor_id, cc.department, cc.course, cc.academic_year, cc.semester, cc.section,
        cc.status, cc.assigned_by_admin_name, cc.assigned_at, cc.revoked_at, cc.notes,
        m.full_name AS mentor_name, m.email AS mentor_email, m.employee_id AS mentor_employee_id,
        m.department AS mentor_department,
        (
          SELECT COUNT(s.id)::int FROM public.mentees s 
          WHERE s.department = cc.department AND s.semester = cc.semester AND s.section = cc.section
        ) AS total_students_in_class,
        (
          SELECT COUNT(DISTINCT s.mentor_id)::int FROM public.mentees s 
          WHERE s.department = cc.department AND s.semester = cc.semester AND s.section = cc.section AND s.mentor_id IS NOT NULL
        ) AS total_mentors_in_class
      FROM public.class_coordinators cc
      JOIN public.mentors m ON cc.mentor_id = m.id
      ORDER BY cc.status ASC, cc.department ASC, cc.semester ASC, cc.section ASC, cc.assigned_at DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Admin get coordinators error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve class coordinators' });
  }
});

// GET /api/admin/coordinators/classes - Discovery of all class cohorts in DB with active coordinator
app.get('/api/admin/coordinators/classes', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.department, 
        COALESCE(s.course, 'B.Tech Computer Science') AS course, 
        COALESCE(s.academic_year, '2026-27') AS academic_year, 
        s.semester, 
        s.section,
        COUNT(s.id)::int AS total_students,
        COUNT(DISTINCT s.mentor_id)::int AS total_mentors,
        cc.id AS coordinator_id,
        cc.mentor_id AS coordinator_mentor_id,
        m.full_name AS coordinator_name,
        m.email AS coordinator_email,
        m.employee_id AS coordinator_employee_id,
        cc.status AS coordinator_status,
        cc.assigned_at AS coordinator_assigned_at
      FROM public.mentees s
      LEFT JOIN public.class_coordinators cc 
        ON s.department = cc.department AND s.semester = cc.semester AND s.section = cc.section AND cc.status = 'active'
      LEFT JOIN public.mentors m ON cc.mentor_id = m.id
      GROUP BY s.department, s.course, s.academic_year, s.semester, s.section, cc.id, cc.mentor_id, m.full_name, m.email, m.employee_id, cc.status, cc.assigned_at
      ORDER BY s.department, s.semester, s.section;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Admin get classes error:', err.message);
    res.status(500).json({ error: 'Failed to discover academic classes' });
  }
});

// POST /api/admin/coordinators - Designate or Change Class Coordinator
app.post('/api/admin/coordinators', requireAdmin, async (req, res) => {
  try {
    const { mentor_id, department, course, academic_year, semester, section, notes } = req.body;

    if (!mentor_id || !department || !semester || !section) {
      return res.status(400).json({ error: 'Mentor, Department, Semester, and Section are required.' });
    }

    const mentorIdNum = Number(mentor_id);
    const semNum = Number(semester);
    const effCourse = course || 'B.Tech Computer Science';
    const effYear = academic_year || '2026-27';

    // Verify mentor exists
    const mentorCheck = await pool.query('SELECT id, full_name, email FROM public.mentors WHERE id = $1', [mentorIdNum]);
    if (mentorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Selected faculty mentor does not exist.' });
    }
    const designatedMentor = mentorCheck.rows[0];

    // Deactivate previous active coordinator for this class/section
    await pool.query(`
      UPDATE public.class_coordinators
      SET status = 'inactive', revoked_at = NOW(), notes = COALESCE(notes, '') || ' [Reassigned by admin]'
      WHERE department = $1 AND semester = $2 AND section = $3 AND status = 'active';
    `, [department, semNum, section]);

    // Insert new active coordinator
    const insertRes = await pool.query(`
      INSERT INTO public.class_coordinators 
        (mentor_id, department, course, academic_year, semester, section, status, assigned_by_admin_id, assigned_by_admin_name, notes)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9)
      RETURNING *;
    `, [
      mentorIdNum,
      department,
      effCourse,
      effYear,
      semNum,
      section,
      req.admin?.id ? String(req.admin.id) : null,
      req.admin?.full_name || req.admin?.email || 'College Administrator',
      notes || `Designated as Class Coordinator for ${department} Sem ${semNum} Sec ${section}`,
    ]);

    // Send notification to the designated mentor
    try {
      await pool.query(`
        INSERT INTO public.notifications (mentor_id, title, message, type)
        VALUES ($1, $2, $3, 'system')
      `, [
        mentorIdNum,
        'Class Coordinator Designation',
        `Congratulations! You have been designated as the Class Coordinator for ${department} Semester ${semNum} (Section ${section}). You now have access to complete class coordination features in your Mentor Portal.`,
      ]);
    } catch (e) {}

    res.status(201).json({
      message: `Successfully designated ${designatedMentor.full_name} as Class Coordinator for ${department} Sem ${semNum} Sec ${section}.`,
      coordinator: insertRes.rows[0],
    });
  } catch (err) {
    console.error('Assign coordinator error:', err.message);
    res.status(500).json({ error: 'Failed to assign class coordinator: ' + err.message });
  }
});

// PUT /api/admin/coordinators/:id/revoke - Revoke Class Coordinator Designation
app.put('/api/admin/coordinators/:id/revoke', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const updateRes = await pool.query(`
      UPDATE public.class_coordinators
      SET status = 'inactive', revoked_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Coordinator assignment record not found.' });
    }

    res.json({
      message: 'Class coordinator assignment revoked successfully.',
      coordinator: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Revoke coordinator error:', err.message);
    res.status(500).json({ error: 'Failed to revoke class coordinator assignment' });
  }
});

// ─────────────────────────────────────────────────
// 11. LEGACY & HEALTH ROUTES (Preserved for compatibility)
// ─────────────────────────────────────────────────

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', message: 'Backend and Supabase connected successfully' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed' });
  }
});

// Legacy Get Mentors
app.get('/api/mentors', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, department, designation, college FROM public.mentors ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch mentors' });
  }
});

// Standalone API info route
const apiInfoHandler = (req, res) => {
  res.json({
    status: 'OK',
    service: 'Mentor-Mentee Management System Backend API',
    version: '1.0.0',
    documentation: 'All API routes are prefixed with /api',
    health: '/api/health',
  });
};

app.get('/', apiInfoHandler);
app.get('/api', apiInfoHandler);
app.get('/api/index', apiInfoHandler);

// ─────────────────────────────────────────────────
// Serve Frontend in Production (if client/dist exists)
// ─────────────────────────────────────────────────
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// ─────────────────────────────────────────────────
// Start Server / Export Handler
// ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Mentora Enterprise Backend Running`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Uploads: ${uploadsDir}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
