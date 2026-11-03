import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import {
  Network,
  Users,
  Award,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Building,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Send,
  Eye,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function ClassMentors() {
  const { mentor } = useAuth();
  const navigate = useNavigate();

  const initialClasses = mentor?.coordinatedClasses || [];
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState(initialClasses.length > 0 ? initialClasses[0] : null);
  const [mentorsData, setMentorsData] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [expandedMentorId, setExpandedMentorId] = useState(null);
  const [loading, setLoading] = useState(initialClasses.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Sync if mentor's coordinatedClasses load from session
  useEffect(() => {
    if (mentor?.coordinatedClasses?.length > 0 && classes.length === 0) {
      setClasses(mentor.coordinatedClasses);
      if (!selectedClass) {
        setSelectedClass(mentor.coordinatedClasses[0]);
      }
      setLoading(false);
    }
  }, [mentor]);

  // 1. Fetch classes
  useEffect(() => {
    async function init() {
      try {
        const res = await apiRequest('/coordinator/classes');
        const list = Array.isArray(res) ? res : (res.classes || []);
        if (list.length > 0) {
          setClasses(list);
          setSelectedClass((prev) => {
            if (!prev) return list[0];
            const match = list.find(
              (c) => c.department === prev.department && String(c.semester) === String(prev.semester) && c.section === prev.section
            );
            return match || list[0];
          });
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
        if (classes.length === 0) setError(err.message || 'Failed to load classes.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Fetch mentor distribution whenever selectedClass changes
  useEffect(() => {
    if (!selectedClass) return;

    async function loadMentors() {
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

        const data = await apiRequest(`/coordinator/mentors?${params.toString()}`);
        setMentorsData(data.mentors || []);
        setUnassignedStudents(data.unassigned_students || []);

        // Auto-expand current mentor or first mentor
        if (data.mentors && data.mentors.length > 0) {
          const current = data.mentors.find((m) => String(m.id) === String(mentor?.id));
          setExpandedMentorId(current ? current.id : data.mentors[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load mentor allocation.');
      } finally {
        setRefreshing(false);
      }
    }

    loadMentors();
  }, [selectedClass]);

  const totalClassStudents =
    mentorsData.reduce((acc, m) => acc + Number(m.assigned_count || 0), 0) +
    unassignedStudents.length;

  return (
    <div className="dashboard-page coordinator-mentors-page">
      {/* ── 1. Open, Elegant Hero Header ── */}
      <section className="coord-hero-banner">
        <div className="coord-hero-main">
          <div className="coord-hero-top-row">
            <div className="coord-role-badge">
              <Award size={15} />
              <span>FACULTY MENTOR & CLASS COORDINATOR</span>
            </div>
            <span className="coord-status-badge">
              <span className="live-dot" />
              <span>Section {selectedClass?.section} Allocation</span>
            </span>
          </div>

          <h1 className="coord-hero-heading">Mentor Distribution & Supervision</h1>
          <p className="coord-hero-meta">
            <span>{selectedClass?.department}</span>
            <span className="separator">·</span>
            <span>{selectedClass?.course || 'B.Tech Computer Science'}</span>
            <span className="separator">·</span>
            <span>Semester {selectedClass?.semester} - Section {selectedClass?.section}</span>
            <span className="separator">·</span>
            <span>AY {selectedClass?.academic_year || '2026-27'}</span>
          </p>
        </div>

        {/* Controls */}
        <div className="coord-hero-actions">
          <div className="coord-select-pill-box">
            <label>Class / Sec:</label>
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
                  {c.department} - Sem {c.semester} - Sec {c.section}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-icon-refresh"
            title="Refresh Mentor Allocation"
            disabled={refreshing}
            onClick={() => {
              const current = selectedClass;
              setSelectedClass(null);
              setTimeout(() => setSelectedClass(current), 50);
            }}
          >
            <RefreshCw size={17} className={refreshing ? 'rotating' : ''} />
          </button>
        </div>
      </section>

      {error && (
        <div className="alert-box error mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. The 4 Key High-Impact Metrics (Spacious & Clean) ── */}
      <div className="coord-primary-kpi-grid mb-4">
        {/* Card 1: Active Mentors */}
        <div className="coord-big-kpi-card">
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Active Mentors</span>
            <div className="coord-kpi-icon-bubble indigo">
              <Network size={24} />
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span className="coord-kpi-main-number">{mentorsData.length}</span>
              <span className="coord-kpi-unit-label">Faculty</span>
            </div>
            <p className="coord-kpi-sub-hint">
              Assigned to Section {selectedClass?.section}
            </p>
          </div>
        </div>

        {/* Card 2: Allocated Students */}
        <div className="coord-big-kpi-card">
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Allocated Students</span>
            <div className="coord-kpi-icon-bubble violet">
              <Users size={24} />
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span className="coord-kpi-main-number">
                {mentorsData.reduce((acc, m) => acc + Number(m.assigned_count || 0), 0)}
              </span>
              <span className="coord-kpi-unit-label">/ {totalClassStudents} Total</span>
            </div>
            <p className="coord-kpi-sub-hint">
              Active Mentees Distributed
            </p>
          </div>
        </div>

        {/* Card 3: Unassigned Students */}
        <div className="coord-big-kpi-card">
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Unassigned Students</span>
            <div className={`coord-kpi-icon-bubble ${unassignedStudents.length > 0 ? 'rose' : 'green'}`}>
              {unassignedStudents.length > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span
                className="coord-kpi-main-number"
                style={{ color: unassignedStudents.length > 0 ? '#e11d48' : '#15803d' }}
              >
                {unassignedStudents.length}
              </span>
              <span className={`coord-kpi-status-chip ${unassignedStudents.length > 0 ? 'warning' : 'healthy'}`}>
                {unassignedStudents.length > 0 ? 'Action Needed' : 'Fully Covered'}
              </span>
            </div>
            <p className="coord-kpi-sub-hint">
              {unassignedStudents.length > 0 ? 'Pending Mentor Allocation' : 'All Students Assigned to Mentors'}
            </p>
          </div>
        </div>

        {/* Card 4: Average Mentee Ratio */}
        <div className="coord-big-kpi-card">
          <div className="coord-kpi-top">
            <span className="coord-kpi-title-text">Average Mentee Ratio</span>
            <div className="coord-kpi-icon-bubble green">
              <Award size={24} />
            </div>
          </div>
          <div>
            <div className="coord-kpi-value-block">
              <span className="coord-kpi-main-number">
                {mentorsData.length > 0
                  ? (
                      mentorsData.reduce((acc, m) => acc + Number(m.assigned_count || 0), 0) /
                      mentorsData.length
                    ).toFixed(1)
                  : '0'}
              </span>
              <span className="coord-kpi-unit-label">Mentees / Mentor</span>
            </div>
            <p className="coord-kpi-sub-hint">
              Faculty Workload Balance
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Unassigned Students Alert (If Any) ── */}
      {unassignedStudents.length > 0 && (
        <div className="coord-status-callout warning mb-4">
          <div className="coord-callout-left">
            <div className="coord-callout-icon">
              <ShieldAlert size={22} />
            </div>
            <div className="coord-callout-text">
              <h4>Action Required: {unassignedStudents.length} Unallocated Student(s)</h4>
              <p>
                The following students in {selectedClass?.department} Semester {selectedClass?.semester} Section {selectedClass?.section} do not have an assigned faculty mentor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Mentors Workload Cards & Mentees Lists ── */}
      <div className="mentors-cards-stack">
        <div className="coord-panel-header" style={{ borderBottom: 'none', marginBottom: '16px', paddingBottom: 0 }}>
          <div>
            <h2 className="coord-panel-title" style={{ fontSize: '22px' }}>Faculty Mentors & Assigned Mentees</h2>
            <p className="coord-panel-desc">Click any faculty mentor card to expand and review their assigned mentee roster.</p>
          </div>
        </div>

        {mentorsData.length === 0 ? (
          <div className="panel-card p-5 text-center">
            <Users size={36} style={{ color: 'var(--muted-text)', margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--muted-text)', fontSize: '16px' }}>
              No faculty mentors currently assigned to this class section.
            </p>
          </div>
        ) : (
          mentorsData.map((m) => {
            const isExpanded = expandedMentorId === m.id;
            const isSelf = String(m.id) === String(mentor?.id);

            return (
              <div key={m.id} className={`mentor-allocation-card ${isSelf ? 'self-card' : ''}`}>
                {/* Mentor Header Card */}
                <div
                  className="mentor-allocation-header"
                  onClick={() => setExpandedMentorId(isExpanded ? null : m.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mentor-avatar-badge">
                    {m.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>

                  <div className="mentor-header-info">
                    <div className="mentor-header-title-row">
                      <h4>{m.full_name}</h4>
                      {isSelf && (
                        <span className="coordinator-badge-pill">
                          Coordinator (You)
                        </span>
                      )}
                      <span className="badge-tag">
                        {m.designation || 'Assistant Professor'}
                      </span>
                    </div>

                    <div className="mentor-meta-row">
                      <span className="mentor-meta-item">
                        <FileText size={14} style={{ color: 'var(--iris-bloom)' }} />
                        <span>{m.employee_id || 'FAC'}</span>
                      </span>
                      <span className="mentor-meta-item">
                        <Mail size={14} style={{ color: 'var(--iris-bloom)' }} />
                        <span>{m.email}</span>
                      </span>
                      {m.phone && (
                        <span className="mentor-meta-item">
                          <Phone size={14} style={{ color: 'var(--iris-bloom)' }} />
                          <span>{m.phone}</span>
                        </span>
                      )}
                      {m.cabin_number && (
                        <span className="mentor-meta-item">
                          <Building size={14} style={{ color: 'var(--iris-bloom)' }} />
                          <span>{m.cabin_number?.toLowerCase().startsWith('cabin') ? m.cabin_number : `Cabin ${m.cabin_number}`}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mentor-header-stat">
                    <div className="stat-pill">
                      <strong>{m.assigned_count || 0}</strong>
                      <span>Mentees in this Class</span>
                    </div>
                    <div className="expand-chevron-btn" aria-label="Toggle Mentees List">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Mentees Roster */}
                {isExpanded && (
                  <div className="mentor-mentees-expanded">
                    <div className="d-flex justify-between align-center mb-3">
                      <h5 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>
                        Assigned Students ({m.students?.length || 0})
                      </h5>
                      {isSelf && (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => navigate('/mentees')}
                        >
                          <span>Manage Mentees in Mentor Portal</span>
                          <ExternalLink size={15} />
                        </button>
                      )}
                    </div>

                    {!m.students || m.students.length === 0 ? (
                      <p style={{ color: 'var(--muted-text)', fontStyle: 'italic', margin: 0, fontSize: '15px' }}>
                        No students currently allocated to this mentor in this section.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th style={{ width: '15%' }}>Roll No</th>
                              <th style={{ width: '22%' }}>Student Name</th>
                              <th style={{ width: '23%' }}>Email</th>
                              <th style={{ width: '12%' }}>Attendance</th>
                              <th style={{ width: '10%' }}>CGPA</th>
                              <th style={{ width: '10%' }}>Backlogs</th>
                              <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.students.map((st) => (
                              <tr key={st.id}>
                                <td><code>{st.roll_number}</code></td>
                                <td>
                                  <strong style={{ fontSize: '15.5px' }}>{st.full_name}</strong>
                                </td>
                                <td style={{ color: 'var(--slate-blue)', fontSize: '14.5px' }}>{st.email || '—'}</td>
                                <td>
                                  <strong style={{ fontSize: '15px', color: Number(st.attendance_percentage || 0) < 75 ? '#dc2626' : '#16a34a' }}>
                                    {st.attendance_percentage != null ? `${Number(st.attendance_percentage).toFixed(1)}%` : '—'}
                                  </strong>
                                </td>
                                <td style={{ fontSize: '15px', fontWeight: 600 }}>
                                  {st.cgpa != null ? Number(st.cgpa).toFixed(2) : '—'}
                                </td>
                                <td>
                                  {Number(st.backlogs_count || 0) > 0 ? (
                                    <span className="badge-tag danger">{st.backlogs_count} Backlog(s)</span>
                                  ) : (
                                    <span className="badge-tag success">Clear</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  {isSelf ? (
                                    <button
                                      className="btn-primary btn-sm"
                                      onClick={() => navigate(`/mentees/${st.id}`)}
                                    >
                                      <span>Manage</span>
                                    </button>
                                  ) : (
                                    <button
                                      className="btn-secondary btn-sm"
                                      onClick={() => navigate(`/class/students?search=${encodeURIComponent(st.roll_number)}`)}
                                    >
                                      <Eye size={14} />
                                      <span>View</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
