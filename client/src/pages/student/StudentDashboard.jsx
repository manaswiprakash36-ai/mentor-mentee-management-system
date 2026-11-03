import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Building,
  AlertCircle,
  FileCheck2,
  Calendar,
  School,
  IdCard,
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await apiRequest('/student/dashboard');
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load student dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="panel-card p-5 text-center">
        <div className="portal-spinner inline-spinner mb-3" />
        <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700 }}>Loading Academic Dossier…</h4>
        <p style={{ color: 'var(--slate-blue)' }}>Retrieving your academic records and assigned mentor details.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert-box error m-4">
        <AlertTriangle size={20} />
        <div>
          <strong>Error Loading Dashboard</strong>
          <p>{error || 'Could not retrieve student records'}</p>
        </div>
      </div>
    );
  }

  const {
    student,
    assigned_mentor,
    class_coordinator,
    results_count,
    open_issues_count,
  } = data;
  const isComplete = student.submitted_at != null;

  // Determine if mentor and coordinator are the same faculty member
  const isDualRole = Boolean(
    assigned_mentor &&
    class_coordinator &&
    (
      String(assigned_mentor.id) === String(class_coordinator.mentor_id || class_coordinator.id) ||
      (assigned_mentor.email && class_coordinator.email && assigned_mentor.email.trim().toLowerCase() === class_coordinator.email.trim().toLowerCase()) ||
      (assigned_mentor.full_name && class_coordinator.full_name && assigned_mentor.full_name.trim().toLowerCase() === class_coordinator.full_name.trim().toLowerCase())
    )
  );

  return (
    <div className="student-dashboard-page">
      {/* ── Welcome Student Hero Banner ── */}
      <div className="student-hero-banner">
        <div className="student-hero-left">
          {student.photo_url && !photoError ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="student-hero-avatar"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div className="student-hero-avatar-placeholder">
              {(student.full_name || 'S').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="sem-module-badge student-badge">
              <GraduationCap size={14} />
              <span>ENROLLED MENTEE DOSSIER</span>
            </div>
            <h2>Welcome, {student.full_name}</h2>
            <div className="student-hero-tags">
              <span>Roll: <strong>{student.roll_number}</strong></span>
              <span>•</span>
              <span>{student.department}</span>
              <span>•</span>
              <span className="sem-pill-tag">Sem {student.semester}</span>
              <span>•</span>
              <span>{student.batch || 'Batch 2026–2027'}</span>
            </div>
          </div>
        </div>

        <div className="student-hero-status">
          <span className={`status-pill ${isComplete ? 'complete' : 'pending'}`}>
            {isComplete ? '✓ Dossier Verified' : '⏳ Incomplete Dossier'}
          </span>
          {student.submission_reference && (
            <span className="text-muted-tiny" style={{ display: 'block', marginTop: 4 }}>
              Ref: {student.submission_reference}
            </span>
          )}
        </div>
      </div>

      {/* ── Academic Standing KPI Cards (4 Equal Columns - Full 100% Width) ── */}
      <div className="student-kpi-grid">
        {/* Cumulative GPA */}
        <div className="student-kpi-card">
          <div className="admin-kpi-icon-wrap violet">
            <Award size={22} />
          </div>
          <div className="student-kpi-info">
            <span className="kpi-label">Cumulative GPA</span>
            {student.current_cgpa ? (
              <strong className="kpi-val">{Number(student.current_cgpa).toFixed(2)}</strong>
            ) : (
              <div className="kpi-val-pending">
                <span className="pending-badge">Pending</span>
              </div>
            )}
            <span className="kpi-sub">
              {student.current_cgpa ? 'Academic Standing' : 'Semester In Progress'}
            </span>
          </div>
        </div>

        {/* Overall Attendance */}
        <div className="student-kpi-card">
          <div className="admin-kpi-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="student-kpi-info">
            <span className="kpi-label">Overall Attendance</span>
            {student.attendance_percentage != null ? (
              <>
                <strong className="kpi-val">
                  {Number(student.attendance_percentage).toFixed(1)}%
                </strong>
                <div className="admin-kpi-progress">
                  <div
                    className={`admin-kpi-fill ${student.attendance_percentage >= 75 ? 'green' : 'amber'}`}
                    style={{ width: `${Math.min(100, student.attendance_percentage)}%` }}
                  />
                </div>
                <span className="kpi-sub">
                  {student.attendance_percentage >= 75 ? 'Satisfactory Attendance' : 'Attendance Shortage'}
                </span>
              </>
            ) : (
              <>
                <div className="kpi-val-pending">
                  <span className="pending-badge green-badge">Enrolled</span>
                </div>
                <span className="kpi-sub">Attendance Records Active</span>
              </>
            )}
          </div>
        </div>

        {/* Active Backlogs */}
        <div className="student-kpi-card">
          <div className="admin-kpi-icon-wrap amber">
            <AlertCircle size={22} />
          </div>
          <div className="student-kpi-info">
            <span className="kpi-label">Active Backlogs</span>
            <strong className="kpi-val" style={{ color: (student.total_backlogs || 0) > 0 ? '#dc2626' : '#166534' }}>
              {student.total_backlogs ?? 0}
            </strong>
            <span className="kpi-sub">
              {(student.total_backlogs || 0) > 0 ? 'Requires Clearance' : 'Clear Academic Record'}
            </span>
          </div>
        </div>

        {/* Uploaded Semester Marksheets */}
        <div className="student-kpi-card">
          <div className="admin-kpi-icon-wrap blue">
            <BookOpen size={22} />
          </div>
          <div className="student-kpi-info">
            <span className="kpi-label">Semester Records</span>
            <strong className="kpi-val">{results_count ?? 0}</strong>
            <span className="kpi-sub">Uploaded Marksheets</span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Balanced Core Dashboard Grid ── */}
      <div className="student-dashboard-main-grid">
        {/* ══ LEFT CARD: Faculty Guide & Leadership ══ */}
        <div className="student-faculty-card">
          <div className="faculty-header-meta">
            <div className="sem-module-badge">
              <Users size={14} />
              <span>
                {isDualRole
                  ? 'FACULTY MENTOR & CLASS COORDINATOR'
                  : assigned_mentor
                  ? 'ASSIGNED FACULTY MENTOR'
                  : 'FACULTY ACADEMIC GUIDE'}
              </span>
            </div>
            {isDualRole && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="role-pill-badge mentor">★ Mentor</span>
                <span className="role-pill-badge coord">★ Coordinator</span>
              </div>
            )}
          </div>

          {assigned_mentor ? (
            <div>
              <div className="faculty-spotlight-hero">
                <div className={`faculty-spotlight-avatar ${isDualRole ? '' : 'mentor-only'}`}>
                  {(assigned_mentor.full_name || 'MP')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="faculty-title-box">
                  <div className="faculty-name-row">
                    <h3 className="faculty-name">{assigned_mentor.full_name}</h3>
                  </div>
                  <span className="faculty-desig-text">
                    {assigned_mentor.designation || 'Assistant Professor'} · {assigned_mentor.department}
                  </span>
                  <div className="faculty-cohort-text">
                    Section {student.section || 'A'} · Sem {student.semester} ({student.batch || 'Batch 2026-2027'})
                  </div>
                </div>
              </div>

              {/* Faculty Contact Details */}
              <div className="faculty-contact-grid">
                <div className="faculty-contact-chip" title={assigned_mentor.email}>
                  <Mail size={15} />
                  <span>{assigned_mentor.email}</span>
                </div>
                {assigned_mentor.phone && (
                  <div className="faculty-contact-chip" title={assigned_mentor.phone}>
                    <Phone size={15} />
                    <span>{assigned_mentor.phone}</span>
                  </div>
                )}
                {assigned_mentor.cabin_number && (
                  <div className="faculty-contact-chip" title={assigned_mentor.cabin_number}>
                    <MapPin size={15} />
                    <span>{assigned_mentor.cabin_number}</span>
                  </div>
                )}
                {assigned_mentor.college && (
                  <div className="faculty-contact-chip" title={assigned_mentor.college}>
                    <Building size={15} />
                    <span>{assigned_mentor.college}</span>
                  </div>
                )}
              </div>

              {/* Direct Action: Message / Raise Concern */}
              <button
                type="button"
                className="student-mentor-action-btn"
                onClick={() => navigate('/student/issues')}
              >
                <AlertCircle size={17} />
                <span>Raise Concern or Message Mentor</span>
              </button>
            </div>
          ) : (
            <div className="text-center p-4">
              <AlertTriangle size={32} style={{ color: '#d97706', margin: '0 auto 10px' }} />
              <h4 style={{ color: 'var(--deep-violet-ink)' }}>No Mentor Assigned Yet</h4>
              <p style={{ color: 'var(--slate-blue)', fontSize: '14.5px' }}>
                Your department administrator is currently finalizing faculty allocations. Your assigned mentor will appear here once allocated.
              </p>
            </div>
          )}

          {/* If Class Coordinator is a DIFFERENT faculty member */}
          {!isDualRole && class_coordinator && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #ECE7F5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="sem-module-badge" style={{ background: '#F3E8FF', color: '#7C3AED', borderColor: '#DDD6FE' }}>
                  <Award size={13} />
                  <span>DESIGNATED CLASS COORDINATOR</span>
                </div>
                <span className="role-pill-badge coord">★ Coordinator</span>
              </div>
              <div className="faculty-spotlight-hero" style={{ marginBottom: 10 }}>
                <div className="faculty-spotlight-avatar" style={{ width: 46, height: 46, fontSize: 18 }}>
                  {(class_coordinator.full_name || 'CC')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="faculty-title-box">
                  <h4 className="faculty-name" style={{ fontSize: 17 }}>{class_coordinator.full_name}</h4>
                  <span className="faculty-desig-text" style={{ fontSize: 13.5 }}>
                    {class_coordinator.designation || 'Faculty Coordinator'} · {class_coordinator.department}
                  </span>
                </div>
              </div>
              <div className="faculty-contact-grid" style={{ marginBottom: 0 }}>
                <div className="faculty-contact-chip" title={class_coordinator.email}>
                  <Mail size={14} />
                  <span>{class_coordinator.email}</span>
                </div>
                {class_coordinator.phone && (
                  <div className="faculty-contact-chip" title={class_coordinator.phone}>
                    <Phone size={14} />
                    <span>{class_coordinator.phone}</span>
                  </div>
                )}
                {class_coordinator.cabin_number && (
                  <div className="faculty-contact-chip" title={class_coordinator.cabin_number}>
                    <MapPin size={14} />
                    <span>{class_coordinator.cabin_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT CARD: Academic Profile & Mentorship Summary ══ */}
        <div className="student-faculty-card">
          <div className="faculty-header-meta">
            <div className="sem-module-badge">
              <IdCard size={14} />
              <span>ACADEMIC DOSSIER & ENROLLMENT SUMMARY</span>
            </div>
            <span className="badge-tag" style={{ background: '#E6F7ED', color: '#166534', fontSize: '12px' }}>
              ✓ Active Student
            </span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--deep-violet-ink)', margin: '0 0 6px' }}>
              {student.course || `${student.department} Degree Program`}
            </h3>
            <span style={{ fontSize: '14.5px', color: 'var(--slate-blue)' }}>
              {student.college_name || 'School of Engineering & Technology'}
            </span>
          </div>

          {/* Academic Profile Details Grid */}
          <div className="faculty-contact-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 18 }}>
            <div className="faculty-contact-chip" title="Enrollment Number">
              <IdCard size={15} />
              <span>Roll: <strong>{student.roll_number}</strong></span>
            </div>
            {student.university_roll_number && (
              <div className="faculty-contact-chip" title="University Roll Number">
                <School size={15} />
                <span>Univ Roll: <strong>{student.university_roll_number}</strong></span>
              </div>
            )}
            <div className="faculty-contact-chip" title="Academic Cohort">
              <Calendar size={15} />
              <span>{student.academic_year || '2026–2027'} · Sem {student.semester}</span>
            </div>
            <div className="faculty-contact-chip" title="Assigned Section">
              <Users size={15} />
              <span>Section: <strong>{student.section || 'A'}</strong></span>
            </div>
          </div>

          {/* Mentoring Status Notice Box */}
          <div
            style={{
              background: '#FDFBFF',
              border: '1.5px solid #EAE4F2',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong style={{ fontSize: '14px', color: 'var(--deep-violet-ink)' }}>
                Mentoring Engagement
              </strong>
              <span
                className="badge-tag"
                style={{
                  background: open_issues_count > 0 ? '#FEF3C7' : '#E6F7ED',
                  color: open_issues_count > 0 ? '#92400E' : '#166534',
                  fontSize: '12px',
                }}
              >
                {open_issues_count > 0 ? `${open_issues_count} Active Issue(s)` : 'Zero Open Concerns'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--slate-blue)', lineHeight: 1.5 }}>
              Regular mentorship check-ins are conducted throughout the semester. For official section advisories and exam announcements, visit <strong>Circulars & Notices</strong> in the sidebar.
            </p>
          </div>

          {/* Secondary Action: View Full Dossier */}
          <button
            type="button"
            className="secondary-btn w-100"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/student/profile')}
          >
            <FileCheck2 size={17} />
            <span>Inspect Complete Student Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
