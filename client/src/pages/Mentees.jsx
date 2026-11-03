import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  Award,
  Clock,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export default function Mentees() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active semester selected from URL param, e.g. ?semester=3
  const activeSemesterParam = searchParams.get('semester');

  // Semester Overview State
  const [semestersData, setSemestersData] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [totalAllMentees, setTotalAllMentees] = useState(0);

  // Student Roster State (when viewing a specific semester)
  const [mentees, setMentees] = useState([]);
  const [rosterTotal, setRosterTotal] = useState(0);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');

  // Filters & Search for Semester Roster
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sort, setSort] = useState('name_asc');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Edit Modal State
  const [editModalMentee, setEditModalMentee] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editNotice, setEditNotice] = useState('');

  // Delete Confirmation State
  const [deleteModalMentee, setDeleteModalMentee] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState('');

  // 1. Fetch Semester Summaries for Overview
  async function loadSemesterSummaries() {
    try {
      setOverviewLoading(true);
      setOverviewError('');
      const res = await apiRequest('/mentees/semesters');
      setSemestersData(res.semesters || []);
      setTotalAllMentees(res.total_assigned_mentees || 0);
    } catch (err) {
      setOverviewError(err.message || 'Could not load semester summaries.');
    } finally {
      setOverviewLoading(false);
    }
  }

  // 2. Fetch Mentees for the selected semester
  async function loadSemesterMentees() {
    if (!activeSemesterParam) return;
    try {
      setRosterLoading(true);
      setRosterError('');
      const params = new URLSearchParams({
        page,
        limit,
        sort,
        semester: activeSemesterParam,
      });

      if (search.trim()) params.append('search', search.trim());
      if (department) params.append('department', department);
      if (status) params.append('status', status);

      const res = await apiRequest(`/mentees?${params.toString()}`);
      setMentees(res.mentees || []);
      setRosterTotal(res.total || 0);
    } catch (err) {
      setRosterError(err.message || 'Could not load student list for this semester.');
    } finally {
      setRosterLoading(false);
    }
  }

  // Initial load of semester summaries
  useEffect(() => {
    loadSemesterSummaries();
  }, []);

  // Reload mentees when semester or filters change
  useEffect(() => {
    if (activeSemesterParam) {
      loadSemesterMentees();
    }
  }, [activeSemesterParam, page, sort, department, status]);

  // Debounced search on roster
  useEffect(() => {
    if (!activeSemesterParam) return;
    const handler = setTimeout(() => {
      setPage(1);
      loadSemesterMentees();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Handlers for navigation
  function handleSelectSemester(sem) {
    setSearchParams({ semester: sem });
    setSearch('');
    setDepartment('');
    setStatus('');
    setPage(1);
  }

  function handleBackToSemesters() {
    setSearchParams({});
    setSearch('');
    setDepartment('');
    setStatus('');
    loadSemesterSummaries();
  }

  // Save quick edit
  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditSaving(true);
    setEditNotice('');

    try {
      await apiRequest(`/mentees/${editModalMentee.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editModalMentee),
      });

      setEditNotice('Mentee updated successfully');
      setTimeout(() => {
        setEditModalMentee(null);
        setEditNotice('');
      }, 1000);

      if (activeSemesterParam) {
        await loadSemesterMentees();
      }
      await loadSemesterSummaries();
    } catch (err) {
      alert(err.message || 'Failed to update mentee');
    } finally {
      setEditSaving(false);
    }
  }

  // Delete mentee
  async function handleConfirmDelete() {
    if (!deleteModalMentee) return;
    setDeleting(true);
    setDeleteNotice('');
    try {
      const res = await apiRequest(`/mentees/${deleteModalMentee.id}`, { method: 'DELETE' });
      setDeleteNotice(res.message || 'Mentee removed successfully');
      setTimeout(() => {
        setDeleteModalMentee(null);
        setDeleteNotice('');
      }, 900);

      if (activeSemesterParam) {
        await loadSemesterMentees();
      }
      await loadSemesterSummaries();
    } catch (err) {
      alert(err.message || 'Failed to remove mentee');
    } finally {
      setDeleting(false);
    }
  }

  // Helper for Semester ordinal label
  function getSemesterLabel(sem) {
    const s = Number(sem);
    if (s === 1) return '1st Semester';
    if (s === 2) return '2nd Semester';
    if (s === 3) return '3rd Semester';
    return `${s}th Semester`;
  }

  // Current semester meta summary from `semestersData`
  const activeSemesterSummary = semestersData.find(
    (s) => String(s.semester) === String(activeSemesterParam)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW A: SEMESTER OVERVIEW (When no semester is selected)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!activeSemesterParam) {
    return (
      <div className="mentees-page">
        {/* Page Header */}
        <div className="page-header-row">
          <div>
            <div className="sem-module-badge">
              <GraduationCap size={15} />
              <span>ACADEMIC COHORTS DIRECTORY</span>
            </div>
            <h2>My Assigned Mentees</h2>
            <p>
              Select an academic semester cohort to inspect, supervise, and review assigned students.
            </p>
          </div>
          <div className="sem-header-stats-group">
            <div className="header-meta-count">
              <Layers size={17} />
              <span><strong>{semestersData.length}</strong> Active Semesters</span>
            </div>
            <div className="header-meta-count">
              <Users size={17} />
              <span><strong>{totalAllMentees}</strong> Total Mentees</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {overviewError && (
          <div className="alert-box error mb-4">
            <AlertTriangle size={18} />
            <div style={{ flex: 1 }}>
              <strong>Could not load semester records</strong>
              <p>{overviewError}</p>
            </div>
            <button className="btn-secondary" onClick={loadSemesterSummaries}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {overviewLoading ? (
          <div className="panel-card p-5 text-center" style={{ padding: '60px 20px' }}>
            <div className="portal-spinner inline-spinner mb-3" />
            <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700 }}>Loading Semester Cohorts…</h4>
            <p style={{ color: 'var(--slate-blue)', fontSize: '17px' }}>
              Fetching assigned student distribution across semesters from database.
            </p>
          </div>
        ) : semestersData.length === 0 ? (
          /* Empty State */
          <div className="panel-card text-center" style={{ padding: '70px 24px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--pale-lavender)',
                color: 'var(--iris-bloom)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <FolderOpen size={30} />
            </div>
            <h3 style={{ color: 'var(--deep-violet-ink)', fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
              No mentees assigned yet.
            </h3>
            <p style={{ color: 'var(--slate-blue)', fontSize: '17.5px', maxWidth: 480, margin: '0 auto 20px' }}>
              You currently do not have any students allocated to your mentoring portfolio. Once student allotments are completed by the administrator, your semester cohorts will appear here.
            </p>
            <button className="btn-primary" onClick={loadSemesterSummaries}>
              <RefreshCw size={15} />
              <span>Refresh Cohorts</span>
            </button>
          </div>
        ) : (
          /* Dynamic Semester Cards Grid */
          <div className="semester-cards-grid">
            {semestersData.map((item) => {
              const semNum = item.semester;
              const semLabel = item.semester_label || getSemesterLabel(semNum);
              const totalMentees = Number(item.total_mentees || 0);
              const completedCount = Number(item.completed_profiles || 0);
              const pendingCount = Number(item.pending_profiles || 0);
              const completionPercent = totalMentees > 0
                ? Math.round((completedCount / totalMentees) * 100)
                : 0;

              // Extract department and batch strings
              const deptStr = Array.isArray(item.departments)
                ? item.departments.filter(Boolean).join(', ')
                : (item.departments || 'Computer Science');
              const batchStr = Array.isArray(item.batches)
                ? item.batches.filter(Boolean).join(', ')
                : (item.batches || 'Batch 2024–28');

              return (
                <div
                  key={semNum}
                  className="semester-card"
                  onClick={() => handleSelectSemester(semNum)}
                >
                  {/* Card Header */}
                  <div className="sem-card-top">
                    <div className="sem-card-icon-wrap">
                      <GraduationCap size={24} />
                    </div>
                    <div className="sem-card-title-wrap">
                      <span className="sem-card-eyebrow">Academic Cohort</span>
                      <h3 className="sem-card-title">{semLabel}</h3>
                    </div>
                    <span className="sem-card-total-pill">
                      {totalMentees} {totalMentees === 1 ? 'Mentee' : 'Mentees'}
                    </span>
                  </div>

                  {/* Department & Batch Chips */}
                  <div className="sem-card-tags">
                    {deptStr && (
                      <span className="sem-tag dept" title={`Department: ${deptStr}`}>
                        <BookOpen size={12} />
                        <span>{deptStr}</span>
                      </span>
                    )}
                    {batchStr && (
                      <span className="sem-tag batch" title={`Batch: ${batchStr}`}>
                        <Calendar size={12} />
                        <span>{batchStr}</span>
                      </span>
                    )}
                  </div>

                  {/* Profile Completion Metrics */}
                  <div className="sem-metrics-box">
                    <div className="sem-metrics-header">
                      <span className="metrics-label">Profile Dossiers</span>
                      <span className="metrics-pct">{completionPercent}% Complete</span>
                    </div>

                    {/* Progress Track */}
                    <div className="sem-progress-track">
                      <div
                        className="sem-progress-fill"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>

                    <div className="sem-metrics-breakdown">
                      <div className="metric-chip completed">
                        <CheckCircle2 size={13} />
                        <span><strong>{completedCount}</strong> Completed</span>
                      </div>
                      <div className="metric-chip pending">
                        <Clock size={13} />
                        <span><strong>{pendingCount}</strong> Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Average Stats Row (if available) */}
                  {(item.avg_cgpa || item.avg_attendance) && (
                    <div className="sem-kpi-row">
                      {item.avg_cgpa && (
                        <div className="sem-kpi-item">
                          <span className="kpi-label">Cohort Avg CGPA</span>
                          <span className="kpi-val">{Number(item.avg_cgpa).toFixed(2)}</span>
                        </div>
                      )}
                      {item.avg_attendance && (
                        <div className="sem-kpi-item">
                          <span className="kpi-label">Cohort Attendance</span>
                          <span className="kpi-val">{item.avg_attendance}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Action */}
                  <div className="sem-card-action">
                    <button
                      type="button"
                      className="sem-btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSemester(semNum);
                      }}
                    >
                      <span>View Mentees</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW B: DEDICATED SEMESTER STUDENT ROSTER (When semester is selected)
  // ═══════════════════════════════════════════════════════════════════════════
  const semLabel = getSemesterLabel(activeSemesterParam);

  return (
    <div className="mentees-page">
      {/* ── Breadcrumb & Back Navigation ── */}
      <div className="mentee-breadcrumb-row">
        <button
          type="button"
          className="btn-back-semesters"
          onClick={handleBackToSemesters}
        >
          <ArrowLeft size={16} />
          <span>Back to Semesters</span>
        </button>

        <div className="mentee-breadcrumbs">
          <span className="breadcrumb-item link" onClick={handleBackToSemesters}>
            My Mentees
          </span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item current">{semLabel}</span>
        </div>
      </div>

      {/* ── Semester Roster Header ── */}
      <div className="page-header-row semester-roster-header">
        <div>
          <div className="sem-module-badge">
            <GraduationCap size={15} />
            <span>SEMESTER COHORT ROSTER</span>
          </div>
          <h2>{semLabel} Assigned Mentees</h2>
          <p>
            Supervise, review dossiers, monitor academic progress, and manage mentoring notes for {semLabel} students.
          </p>
        </div>

        {/* Cohort Stats Pills */}
        <div className="sem-header-stats-group">
          <div className="header-meta-count">
            <Users size={17} />
            <span><strong>{rosterTotal}</strong> Students Total</span>
          </div>
          {activeSemesterSummary && (
            <>
              <div className="header-meta-count complete">
                <CheckCircle2 size={16} />
                <span><strong>{activeSemesterSummary.completed_profiles || 0}</strong> Completed</span>
              </div>
              <div className="header-meta-count pending">
                <Clock size={16} />
                <span><strong>{activeSemesterSummary.pending_profiles || 0}</strong> Pending</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {rosterError && (
        <div className="alert-box error mb-4">
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>
            <strong>Could not load student records</strong>
            <p>{rosterError}</p>
          </div>
          <button className="btn-secondary" onClick={loadSemesterMentees}>
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="directory-filter-bar">
        <div className="search-input-field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by student name, enrollment, roll number, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="filter-dropdowns">
          <div className="filter-select-wrap">
            <Filter size={15} />
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Profile Statuses</option>
              <option value="Complete">Completed Profiles</option>
              <option value="Incomplete">Incomplete Profiles</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <ArrowUpDown size={15} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="roll_asc">Roll Number</option>
              <option value="cgpa_desc">Highest CGPA</option>
              <option value="updated_desc">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="panel-card">
        <div className="table-responsive">
          <table className="portal-table">
            <thead>
              <tr>
                <th>STUDENT PROFILE</th>
                <th>ENROLLMENT / ROLL</th>
                <th>DEPT & BATCH</th>
                <th>SEMESTER</th>
                <th>CGPA</th>
                <th>ATTENDANCE</th>
                <th>PROFILE STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rosterLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="portal-spinner inline-spinner" />
                    <span>Loading student records for {semLabel}…</span>
                  </td>
                </tr>
              ) : mentees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-state">
                    <div className="empty-icon-wrap">🔍</div>
                    <strong>No students found in {semLabel} matching criteria</strong>
                    <p>Try clearing search or filters to see all assigned mentees in this semester.</p>
                    <button
                      className="btn-sm-primary mt-2"
                      onClick={() => {
                        setSearch('');
                        setDepartment('');
                        setStatus('');
                      }}
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                mentees.map((m) => {
                  const isComplete = m.profile_status === 'Complete';
                  const hasBacklogs = Number(m.total_backlogs) > 0;
                  const studentInitials = (m.full_name || 'S').slice(0, 2).toUpperCase();

                  return (
                    <tr key={m.id}>
                      {/* Student Profile Photo & Name */}
                      <td>
                        <div className="student-cell-wrap">
                          {m.student_photo_url ? (
                            <img
                              src={m.student_photo_url}
                              alt={m.full_name}
                              className="student-table-photo"
                              onClick={() => navigate(`/mentees/${m.id}`)}
                            />
                          ) : (
                            <div
                              className={`avatar-chip ${isComplete ? 'complete' : ''}`}
                              onClick={() => navigate(`/mentees/${m.id}`)}
                            >
                              {studentInitials}
                            </div>
                          )}
                          <div>
                            <strong
                              className="student-name-link"
                              onClick={() => navigate(`/mentees/${m.id}`)}
                              title="Click to open complete student profile dossier"
                            >
                              {m.full_name}
                            </strong>
                            <div className="student-sub-email">{m.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Roll & Enrollment */}
                      <td>
                        <span className="roll-badge">{m.roll_number}</span>
                        {m.admission_number && (
                          <div className="text-muted-tiny">Adm: {m.admission_number}</div>
                        )}
                      </td>

                      {/* Department & Batch */}
                      <td>
                        <span style={{ fontWeight: 600 }}>{m.department || '—'}</span>
                        <div className="text-muted-tiny">{m.batch || 'Batch 2024–28'}</div>
                      </td>

                      {/* Semester */}
                      <td>
                        <span className="sem-pill-tag">
                          Sem {m.semester ?? activeSemesterParam}
                        </span>
                        {m.section && <span className="text-muted-tiny"> (Sec {m.section})</span>}
                      </td>

                      {/* CGPA */}
                      <td>
                        <strong className={m.current_cgpa < 6.0 && m.current_cgpa ? 'text-danger' : ''}>
                          {m.current_cgpa ? Number(m.current_cgpa).toFixed(2) : '—'}
                        </strong>
                      </td>

                      {/* Attendance */}
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {m.attendance_percentage != null ? `${Number(m.attendance_percentage).toFixed(1)}%` : '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill ${isComplete ? 'complete' : 'pending'}`}>
                          {isComplete ? '✓ Complete' : '⏳ Incomplete'}
                        </span>
                        {hasBacklogs && (
                          <span className="status-pill danger ml-1" title={`${m.total_backlogs} active backlogs`}>
                            ⚠️ {m.total_backlogs} Backlog
                          </span>
                        )}
                        {m.open_issues_count > 0 && (
                          <span className="status-pill warning ml-1" title="Open student issue reported">
                            🚨 {m.open_issues_count} Issue
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-row-actions">
                          <button
                            type="button"
                            className="btn-action-view"
                            onClick={() => navigate(`/mentees/${m.id}`)}
                            title="Open full student profile dossier"
                          >
                            <span>View Profile</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-sub"
                            onClick={() => setEditModalMentee({ ...m })}
                            title="Quick edit student information"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-sub text-danger"
                            onClick={() => setDeleteModalMentee(m)}
                            title="Remove student from your mentoring cohort"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {rosterTotal > limit && (
          <div className="pagination-bar">
            <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, rosterTotal)} of {rosterTotal} mentees</span>
            <div className="pagination-controls">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-page"
              >
                Previous
              </button>
              <span className="page-current">Page {page}</span>
              <button
                disabled={page * limit >= rosterTotal}
                onClick={() => setPage(page + 1)}
                className="btn-page"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Edit Modal */}
      {editModalMentee && (
        <div className="modal-overlay" onClick={() => setEditModalMentee(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Mentee Information</h3>
              <button className="modal-close-btn" onClick={() => setEditModalMentee(null)}>
                <X size={18} />
              </button>
            </div>

            {editNotice && (
              <div className="alert-box success m-3">
                <CheckCircle2 size={16} />
                <span>{editNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="modal-body p-4">
              <div className="form-group mb-3">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={editModalMentee.full_name}
                  onChange={(e) => setEditModalMentee({ ...editModalMentee, full_name: e.target.value })}
                />
              </div>

              <div className="form-group mb-3">
                <label>Roll Number</label>
                <input
                  type="text"
                  required
                  value={editModalMentee.roll_number}
                  onChange={(e) => setEditModalMentee({ ...editModalMentee, roll_number: e.target.value })}
                />
              </div>

              <div className="form-group mb-3">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={editModalMentee.email}
                  onChange={(e) => setEditModalMentee({ ...editModalMentee, email: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Department</label>
                  <input
                    type="text"
                    value={editModalMentee.department || ''}
                    onChange={(e) => setEditModalMentee({ ...editModalMentee, department: e.target.value })}
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Semester</label>
                  <select
                    value={editModalMentee.semester || ''}
                    onChange={(e) => setEditModalMentee({ ...editModalMentee, semester: e.target.value })}
                  >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditModalMentee(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editSaving}
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove / Delete Confirmation Modal */}
      {deleteModalMentee && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModalMentee(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
                  <Trash2 size={19} />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--deep-violet-ink)', fontWeight: 700 }}>
                  Remove Mentee
                </h3>
              </div>
              <button className="modal-close-btn" disabled={deleting} onClick={() => setDeleteModalMentee(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body p-4">
              {deleteNotice ? (
                <div className="alert-box success" style={{ margin: '10px 0' }}>
                  <CheckCircle2 size={18} />
                  <span>{deleteNotice}</span>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--slate-blue)', fontSize: '17px', lineHeight: 1.6, margin: '8px 0 14px' }}>
                    Are you sure you want to remove <strong style={{ color: 'var(--deep-violet-ink)' }}>{deleteModalMentee.full_name}</strong> (Roll: <code>{deleteModalMentee.roll_number}</code>) from your mentoring roster?
                  </p>
                  <p style={{ color: 'var(--muted-text)', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
                    ⚠️ This action will permanently remove this student and their submitted profile dossier from your active portfolio.
                  </p>
                </>
              )}

              <div className="modal-actions-row mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={deleting}
                  onClick={() => setDeleteModalMentee(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#dc2626', borderColor: '#b91c1c' }}
                >
                  <Trash2 size={16} />
                  <span>{deleting ? 'Removing…' : 'Yes, Remove Mentee'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
