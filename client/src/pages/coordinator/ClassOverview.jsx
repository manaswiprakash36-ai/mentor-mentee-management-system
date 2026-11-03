import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import {
  Award,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Network,
  FileText,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Eye,
  BookOpen,
  Building,
} from 'lucide-react';

export default function ClassOverview() {
  const { mentor } = useAuth();
  const navigate = useNavigate();

  const initialClasses = mentor?.coordinatedClasses || [];
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState(initialClasses.length > 0 ? initialClasses[0] : null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(initialClasses.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Sync if mentor's coordinatedClasses load from /auth/me
  useEffect(() => {
    if (mentor?.coordinatedClasses?.length > 0 && classes.length === 0) {
      setClasses(mentor.coordinatedClasses);
      if (!selectedClass) {
        setSelectedClass(mentor.coordinatedClasses[0]);
      }
      setLoading(false);
    }
  }, [mentor]);

  // 1. Fetch available coordinated classes for this mentor from API
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await apiRequest('/coordinator/classes');
        const list = Array.isArray(res) ? res : (res.classes || []);
        if (list.length > 0) {
          setClasses(list);
          setSelectedClass((prev) => {
            if (!prev) return list[0];
            const stillExists = list.find(
              (c) => c.department === prev.department && String(c.semester) === String(prev.semester) && c.section === prev.section
            );
            return stillExists || list[0];
          });
        }
      } catch (err) {
        console.error('Failed to load coordinated classes:', err);
        if (classes.length === 0) {
          setError(err.message || 'Failed to load coordinated classes.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  // 2. Fetch class overview metrics whenever selectedClass changes
  const loadClassData = async () => {
    if (!selectedClass) return;
    try {
      setRefreshing(true);
      setError('');
      const params = new URLSearchParams({
        department: selectedClass.department,
        semester: selectedClass.semester,
        section: selectedClass.section,
      });
      if (selectedClass.course) params.append('course', selectedClass.course);
      if (selectedClass.academic_year) params.append('academic_year', selectedClass.academic_year);

      const data = await apiRequest(`/coordinator/overview?${params.toString()}`);
      setOverview(data);
    } catch (err) {
      console.error('Failed to load class overview metrics:', err);
      setError(err.message || 'Failed to load class overview metrics.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadClassData();
    }
  }, [selectedClass]);

  if ((loading && classes.length === 0) || (classes.length > 0 && !overview && !error)) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-spinner" />
        <p>Loading Class Coordinator Overview…</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="portal-content-wrap">
        <div className="panel-card p-5 text-center" style={{ maxWidth: 640, margin: '40px auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ color: 'var(--deep-violet-ink)', marginBottom: 8 }}>Unable to Load Class Overview</h2>
          <p style={{ color: 'var(--slate-blue)', fontSize: '16px', lineHeight: 1.6 }}>
            {error}
          </p>
          <div className="mt-4" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={loadClassData}>
              Retry
            </button>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
              Go to Mentor Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && classes.length === 0) {
    return (
      <div className="portal-content-wrap">
        <div className="panel-card p-5 text-center" style={{ maxWidth: 640, margin: '40px auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Award size={32} />
          </div>
          <h2 style={{ color: 'var(--deep-violet-ink)', marginBottom: 8 }}>No Active Coordinator Assignments</h2>
          <p style={{ color: 'var(--slate-blue)', fontSize: '16px', lineHeight: 1.6 }}>
            You are currently logged in as a Faculty Mentor. Your account has not yet been designated as a Class Coordinator for any active department or section.
          </p>
          <div className="mt-4">
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Mentor Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = overview?.metrics || {
    total_students: 0,
    active_students: 0,
    total_mentors: 0,
    overall_attendance: '0.0',
    average_cgpa: '0.00',
    students_with_backlogs: 0,
    attention_needed: 0,
    pending_issues: 0,
  };

  const totalStudents = Number(metrics.total_students) || 1;

  // Process Attendance Distribution into an Array of tiers safely
  const rawAtt = overview?.attendance_distribution;
  const attendanceDist = Array.isArray(rawAtt)
    ? rawAtt
    : [
        {
          tier: 'Above 85% (Excellent)',
          count: rawAtt?.high ?? rawAtt?.above85 ?? 0,
          percentage: totalStudents > 0 ? Math.round(((rawAtt?.high ?? rawAtt?.above85 ?? 0) / totalStudents) * 100) : 0,
          color: '#16a34a',
        },
        {
          tier: '75% – 85% (Satisfactory)',
          count: rawAtt?.medium ?? rawAtt?.range75_85 ?? 0,
          percentage: totalStudents > 0 ? Math.round(((rawAtt?.medium ?? rawAtt?.range75_85 ?? 0) / totalStudents) * 100) : 0,
          color: '#3b82f6',
        },
        {
          tier: 'Below 75% (Critical Warning)',
          count: rawAtt?.low ?? rawAtt?.below75 ?? 0,
          percentage: totalStudents > 0 ? Math.round(((rawAtt?.low ?? rawAtt?.below75 ?? 0) / totalStudents) * 100) : 0,
          color: '#ef4444',
        },
      ];

  // Process CGPA Distribution into an Array of grades safely
  const rawCgpa = overview?.cgpa_distribution;
  const cgpaDist = Array.isArray(rawCgpa)
    ? rawCgpa
    : [
        {
          grade: '9.00 – 10.00 (Outstanding)',
          count: rawCgpa?.above9 ?? 0,
          percentage: totalStudents > 0 ? Math.round(((rawCgpa?.above9 ?? 0) / totalStudents) * 100) : 0,
          color: '#7c3aed',
        },
        {
          grade: '7.50 – 8.99 (Very Good)',
          count: rawCgpa?.range75_9 ?? 0,
          percentage: totalStudents > 0 ? Math.round(((rawCgpa?.range75_9 ?? 0) / totalStudents) * 100) : 0,
          color: '#6366f1',
        },
        {
          grade: '6.00 – 7.49 (Good)',
          count: rawCgpa?.range6_75 ?? 0,
          percentage: totalStudents > 0 ? Math.round(((rawCgpa?.range6_75 ?? 0) / totalStudents) * 100) : 0,
          color: '#f59e0b',
        },
        {
          grade: 'Below 6.00 (Remedial Action)',
          count: rawCgpa?.below6 ?? 0,
          percentage: totalStudents > 0 ? Math.round(((rawCgpa?.below6 ?? 0) / totalStudents) * 100) : 0,
          color: '#f43f5e',
        },
      ];

  const mentorDist = overview?.mentors || overview?.mentor_distribution || [];
  const attentionStudents = overview?.attention_students || [];

  return (
    <div className="dashboard-page coordinator-overview-page">
      {/* ── 1. Open, Elegant Hero Header ── */}
      <section className="coord-hero-banner">
        <div className="coord-hero-main">
          <div className="coord-hero-top-row">
            <div className="coord-role-badge">
              <Award size={14} />
              <span>FACULTY MENTOR & CLASS COORDINATOR</span>
            </div>
            <span className="coord-status-badge">
              <span className="live-dot" />
              <span>Section {selectedClass?.section} Governance</span>
            </span>
          </div>

          <h1 className="coord-hero-heading">
            Class Oversight & Academic Governance
          </h1>

          <div className="coord-hero-meta">
            <span><strong>{selectedClass?.department || 'Computer Science'}</strong></span>
            <span className="separator">·</span>
            <span>{selectedClass?.course || 'B.Tech Computer Science'}</span>
            <span className="separator">·</span>
            <span><strong>Semester {selectedClass?.semester} · Section {selectedClass?.section}</strong></span>
            <span className="separator">·</span>
            <span>AY {selectedClass?.academic_year || '2026-27'}</span>
          </div>
        </div>

        {/* Far Right: Clean Selector Pill & Refresh */}
        <div className="coord-hero-actions">
          <div className="coord-select-pill-box">
            <label>CLASS / SEC:</label>
            <select
              className="coord-select-input"
              value={selectedClass ? `${selectedClass.department}|${selectedClass.semester}|${selectedClass.section}` : ''}
              onChange={(e) => {
                const [dept, sem, sec] = e.target.value.split('|');
                const matched = classes.find(
                  (c) => c.department === dept && String(c.semester) === sem && c.section === sec
                );
                if (matched) setSelectedClass(matched);
              }}
            >
              {classes.map((c) => (
                <option
                  key={`${c.department}-${c.semester}-${c.section}`}
                  value={`${c.department}|${c.semester}|${c.section}`}
                >
                  {c.department} · Sem {c.semester} · Sec {c.section}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-icon-refresh"
            title="Refresh Class Metrics"
            disabled={refreshing}
            onClick={loadClassData}
          >
            <RefreshCw size={17} className={refreshing ? 'rotating' : ''} />
          </button>
        </div>
      </section>

      {error && (
        <div className="alert-box error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. The 4 Key High-Impact Metrics (Spacious & Clean) ── */}
      <div className="coord-primary-kpi-grid">
        {/* Card 1: Total Enrolled Students */}
        <div className="coord-big-kpi-card" onClick={() => navigate('/class/students')}>
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Total Enrolled Students</span>
            <div className="coord-kpi-icon-bubble violet">
              <Users size={24} />
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span className="coord-kpi-main-number">{metrics.total_students}</span>
              <span className="coord-kpi-unit-label">Students</span>
            </div>
            <p className="coord-kpi-sub-hint">
              {metrics.active_students} Active Roster · {metrics.total_mentors} Faculty Mentors
            </p>
          </div>
        </div>

        {/* Card 2: Overall Class Attendance */}
        <div className="coord-big-kpi-card">
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Class Attendance</span>
            <div className="coord-kpi-icon-bubble green">
              <TrendingUp size={24} />
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span className="coord-kpi-main-number">{metrics.overall_attendance}%</span>
              <span className={`coord-kpi-status-chip ${Number(metrics.overall_attendance) >= 75 ? 'healthy' : 'warning'}`}>
                {Number(metrics.overall_attendance) >= 75 ? 'Healthy' : 'Warning'}
              </span>
            </div>
            <p className="coord-kpi-sub-hint">
              Mandatory Minimum Benchmark: 75.0%
            </p>
          </div>
        </div>

        {/* Card 3: Average Class CGPA */}
        <div className="coord-big-kpi-card">
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Average Class CGPA</span>
            <div className="coord-kpi-icon-bubble indigo">
              <GraduationCap size={24} />
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span className="coord-kpi-main-number">{metrics.average_cgpa}</span>
              <span className="coord-kpi-unit-label">/ 10.00</span>
            </div>
            <p className="coord-kpi-sub-hint">
              Cohort Academic Standing: Very Good
            </p>
          </div>
        </div>

        {/* Card 4: Academic Standing & Attention */}
        <div className="coord-big-kpi-card" onClick={() => navigate('/class/students?filter=attention')}>
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Require Attention</span>
            <div className={`coord-kpi-icon-bubble ${Number(metrics.attention_needed) > 0 ? 'rose' : 'green'}`}>
              {Number(metrics.attention_needed) > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span className="coord-kpi-main-number" style={{ color: Number(metrics.attention_needed) > 0 ? '#e11d48' : '#15803d' }}>
                {metrics.attention_needed}
              </span>
              <span className={`coord-kpi-status-chip ${Number(metrics.attention_needed) > 0 ? 'warning' : 'healthy'}`}>
                {Number(metrics.attention_needed) > 0 ? 'Intervention' : 'All Clear'}
              </span>
            </div>
            <p className="coord-kpi-sub-hint">
              {metrics.students_with_backlogs} Backlogs · {metrics.pending_issues} Pending Inquiries
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Spacious 2-Column Mid Section: Academic Distributions (Left) & Faculty Mentors (Right) ── */}
      <div className="coord-spacious-grid">
        {/* Left Column: Academic & Attendance Health */}
        <div className="coord-panel-card">
          <div className="coord-panel-header">
            <div>
              <h3 className="coord-panel-title">Academic & Attendance Health</h3>
              <p className="coord-panel-desc">Attendance tiers and CGPA clustering for Section {selectedClass?.section}</p>
            </div>
          </div>

          {/* Sub-Section 1: Attendance Distribution */}
          <div className="distribution-sub-section">
            <h4 className="dist-sub-title">
              <BarChart3 size={16} style={{ color: '#2563eb' }} />
              <span>Attendance Distribution Breakdown</span>
            </h4>
            {attendanceDist.map((tier) => (
              <div key={tier.tier} className="dist-bar-item">
                <div className="dist-bar-header">
                  <span className="dist-bar-label">{tier.tier}</span>
                  <strong className="dist-bar-count">
                    {tier.count} Students ({tier.percentage}%)
                  </strong>
                </div>
                <div className="dist-progress-track">
                  <div
                    className="dist-progress-fill"
                    style={{
                      width: `${tier.percentage}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="dist-sub-divider" />

          {/* Sub-Section 2: CGPA Distribution */}
          <div className="distribution-sub-section">
            <h4 className="dist-sub-title">
              <GraduationCap size={16} style={{ color: '#7c3aed' }} />
              <span>CGPA Performance Clustering</span>
            </h4>
            {cgpaDist.map((tier) => (
              <div key={tier.grade} className="dist-bar-item">
                <div className="dist-bar-header">
                  <span className="dist-bar-label">{tier.grade}</span>
                  <strong className="dist-bar-count">
                    {tier.count} Students ({tier.percentage}%)
                  </strong>
                </div>
                <div className="dist-progress-track">
                  <div
                    className="dist-progress-fill"
                    style={{
                      width: `${tier.percentage}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="coord-panel-footer-note">
            <span>Class Benchmarks: 75% Attendance & 7.50+ CGPA Target</span>
            <span style={{ color: '#7c3aed', fontWeight: 700 }}>
              Class Avg: {metrics.overall_attendance}% Att · {metrics.average_cgpa} CGPA
            </span>
          </div>
        </div>

        {/* Right Column: Faculty Mentors & Workload Split */}
        <div className="coord-panel-card">
          <div className="coord-panel-header">
            <div>
              <h3 className="coord-panel-title">Assigned Faculty Mentors</h3>
              <p className="coord-panel-desc">Mentorship workload split across Section {selectedClass?.section}</p>
            </div>
            <button
              className="btn-secondary btn-sm"
              onClick={() => navigate('/class/mentors')}
            >
              <span>View Mentors</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="coord-mentors-container">
            {mentorDist.length === 0 ? (
              <p style={{ color: 'var(--muted-text)', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
                No mentors assigned yet.
              </p>
            ) : (
              mentorDist.map((m) => {
                const mId = String(m.id || m.mentor_id);
                const mName = m.full_name || m.mentor_name;
                const mCount = m.student_count ?? m.mentee_count ?? 0;
                const isSelf = mId === String(mentor?.id);

                return (
                  <div key={mId} className="coord-mentor-entry">
                    <div className="coord-mentor-avatar">
                      {mName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="coord-mentor-details">
                      <div className="coord-mentor-name-row">
                        <strong>{mName}</strong>
                        {isSelf && (
                          <span className="coordinator-badge-pill">Coordinator (You)</span>
                        )}
                      </div>
                      <span className="coord-mentor-sub">
                        {m.designation || 'Faculty Mentor'} · {m.employee_id || 'CSE'}
                      </span>
                    </div>
                    <div className="coord-mentor-stat-pill">
                      <strong>{mCount}</strong>
                      <span>Mentees</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="coord-panel-footer-note">
            <span>Faculty Mentors: <strong>{mentorDist.length} Assigned</strong></span>
            <span style={{ color: '#166534', fontWeight: 700 }}>100% Students Covered</span>
          </div>
        </div>
      </div>

      {/* ── 4. Reassuring Attention Status Bar ── */}
      {attentionStudents.length === 0 ? (
        <div className="coord-status-callout good">
          <div className="coord-callout-left">
            <div className="coord-callout-icon">
              <CheckCircle2 size={22} />
            </div>
            <div className="coord-callout-text">
              <h4>All Students in Good Academic Standing</h4>
              <p>
                Every student in {selectedClass?.department} Semester {selectedClass?.semester} Section {selectedClass?.section} meets the 75% attendance threshold with zero registered backlogs.
              </p>
            </div>
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => navigate('/class/students')}
          >
            <span>Class Roster</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="panel-card p-4">
          <div className="coord-panel-header">
            <div>
              <h3 className="coord-panel-title" style={{ color: '#e11d48' }}>
                Students Requiring Immediate Attention ({attentionStudents.length})
              </h3>
              <p className="coord-panel-desc">
                Students falling below the 75% attendance benchmark or having documented course backlogs.
              </p>
            </div>
            <button
              className="btn-secondary btn-sm"
              onClick={() => navigate('/class/students?filter=attention')}
            >
              <span>View Attention Filter</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Assigned Mentor</th>
                  <th>Attendance %</th>
                  <th>Current CGPA</th>
                  <th>Backlogs</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attentionStudents.map((s) => {
                  const att = s.attendance_percentage ?? s.attendance;
                  const cgpa = s.current_cgpa ?? s.cgpa;
                  const backlogs = s.total_backlogs ?? s.backlogs_count ?? 0;
                  const isOwn = s.is_own_mentee ?? (String(s.mentor_id) === String(mentor?.id));

                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar-sub">
                            {s.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <strong>{s.full_name}</strong>
                            <span className="student-sub">{s.email || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td><code>{s.roll_number}</code></td>
                      <td>
                        <span className="badge-tag">
                          {s.mentor_name || 'Unassigned'}
                          {isOwn && ' (Your Mentee)'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: Number(att) < 75 ? '#dc2626' : '#16a34a' }}>
                          {att != null ? `${Number(att).toFixed(1)}%` : '—'}
                        </strong>
                      </td>
                      <td>{cgpa != null ? Number(cgpa).toFixed(2) : '—'}</td>
                      <td>
                        {Number(backlogs) > 0 ? (
                          <span className="badge-tag danger">{backlogs} Backlog(s)</span>
                        ) : (
                          <span className="badge-tag success">Clear</span>
                        )}
                      </td>
                      <td>
                        {isOwn ? (
                          <button
                            className="btn-outline btn-sm"
                            onClick={() => navigate(`/mentees/${s.id}`)}
                          >
                            <span>Full Profile</span>
                          </button>
                        ) : (
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => navigate(`/class/students?search=${encodeURIComponent(s.roll_number)}`)}
                          >
                            <span>Class Record</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
