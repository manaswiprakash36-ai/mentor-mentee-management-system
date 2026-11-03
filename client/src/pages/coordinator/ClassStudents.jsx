import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Award,
  Eye,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Building,
} from 'lucide-react';

export default function ClassStudents() {
  const { mentor } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialClasses = mentor?.coordinatedClasses || [];
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState(initialClasses.length > 0 ? initialClasses[0] : null);
  const [students, setStudents] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
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

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [mentorFilter, setMentorFilter] = useState(''); // '' (all) | 'own' | mentorId
  const [attendanceFilter, setAttendanceFilter] = useState(searchParams.get('filter') === 'attention' ? 'below75' : 'all');
  const [backlogsFilter, setBacklogsFilter] = useState('all'); // 'all' | 'backlogs' | 'clear'

  // Read-Only Student Dossier Modal (for other mentors' students)
  const [viewingStudent, setViewingStudent] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  // 1. Fetch coordinated classes
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

  // 2. Fetch class students and mentors whenever selectedClass changes
  useEffect(() => {
    if (!selectedClass) return;

    async function loadData() {
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

        const [studentsData, mentorsData] = await Promise.all([
          apiRequest(`/coordinator/students?${params.toString()}`),
          apiRequest(`/coordinator/mentors?${params.toString()}`),
        ]);

        setStudents(Array.isArray(studentsData) ? studentsData : (studentsData.students || []));
        setMentorsList(mentorsData.mentors || []);
      } catch (err) {
        setError(err.message || 'Failed to load students roster.');
      } finally {
        setRefreshing(false);
      }
    }

    loadData();
  }, [selectedClass]);

  // Open Read-Only Modal for another mentor's student
  async function handleViewStudent(student) {
    setViewingStudent(student);
    setStudentDetails(null);
    setStudentDetailsLoading(true);
    try {
      const data = await apiRequest(`/coordinator/students/${student.id}`);
      setStudentDetails(data);
    } catch (err) {
      console.error('Error fetching student details:', err);
    } finally {
      setStudentDetailsLoading(false);
    }
  }

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);

    let matchesMentor = true;
    if (mentorFilter === 'own') {
      matchesMentor = s.is_own_mentee;
    } else if (mentorFilter) {
      matchesMentor = String(s.mentor_id) === String(mentorFilter);
    }

    let matchesAttendance = true;
    if (attendanceFilter === 'below75') {
      matchesAttendance = Number(s.attendance_percentage || 0) < 75;
    } else if (attendanceFilter === 'above85') {
      matchesAttendance = Number(s.attendance_percentage || 0) >= 85;
    }

    let matchesBacklogs = true;
    if (backlogsFilter === 'backlogs') {
      matchesBacklogs = Number(s.backlogs_count || 0) > 0;
    } else if (backlogsFilter === 'clear') {
      matchesBacklogs = Number(s.backlogs_count || 0) === 0;
    }

    return matchesSearch && matchesMentor && matchesAttendance && matchesBacklogs;
  });

  // Export class roster to CSV
  function exportCSV() {
    if (!students || students.length === 0) return;
    const headers = [
      'Roll Number',
      'Admission Number',
      'Full Name',
      'Department',
      'Semester',
      'Section',
      'Assigned Mentor',
      'Is Own Mentee',
      'CGPA',
      'Attendance %',
      'Backlogs Count',
      'Profile Status',
      'Email',
      'Phone',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.roll_number || ''}"`,
      `"${s.admission_number || ''}"`,
      `"${s.full_name || ''}"`,
      `"${s.department || ''}"`,
      s.semester || '',
      `"${s.section || ''}"`,
      `"${s.mentor_name || 'Unassigned'}"`,
      s.is_own_mentee ? 'YES' : 'NO',
      s.cgpa || '',
      s.attendance_percentage || '',
      s.backlogs_count || 0,
      `"${s.profile_status || 'Pending'}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Class_Roster_${selectedClass?.department}_Sem${selectedClass?.semester}_Sec${selectedClass?.section}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="portal-content-wrap coordinator-page">
      {/* ── Page Header ── */}
      <div className="page-header-row coordinator-header-card">
        <div>
          <div className="coordinator-role-pill">
            <Award size={15} />
            <span>CLASS ROSTER · ALL STUDENTS</span>
          </div>
          <h1 className="coordinator-title">Complete Class Directory</h1>
          <p className="coordinator-sub">
            Holistic register of all students enrolled in this section. View assignments across mentors, academic standing, and attendance metrics.
          </p>
        </div>

        {/* Controls */}
        <div className="coordinator-class-controls">
          <select
            className="coordinator-select"
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

          <button
            className="btn-secondary"
            onClick={exportCSV}
            title="Export Class Roster to CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-box error mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Summary Counters Row ── */}
      <div className="admin-mini-stats mb-4">
        <div className="mini-stat-item">
          <span>Total Class Students:</span>
          <strong>{students.length}</strong>
        </div>
        <div className="mini-stat-item">
          <span>Your Direct Mentees:</span>
          <strong style={{ color: '#7c3aed' }}>
            {students.filter((s) => s.is_own_mentee).length}
          </strong>
        </div>
        <div className="mini-stat-item">
          <span>Other Mentors' Students:</span>
          <strong>{students.filter((s) => !s.is_own_mentee).length}</strong>
        </div>
        <div className="mini-stat-item">
          <span>Filtered Count:</span>
          <strong>{filteredStudents.length}</strong>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="filter-toolbar-card mb-4">
        <div className="filter-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filter-dropdowns-row">
          {/* Mentor Filter */}
          <div className="filter-dropdown">
            <span className="filter-label">Mentor:</span>
            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
            >
              <option value="">All Mentors</option>
              <option value="own">My Mentees Only ({students.filter((s) => s.is_own_mentee).length})</option>
              {mentorsList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.assigned_count || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Filter */}
          <div className="filter-dropdown">
            <span className="filter-label">Attendance:</span>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
            >
              <option value="all">All Attendance</option>
              <option value="below75">Critical (&lt;75%)</option>
              <option value="above85">Healthy (&gt;85%)</option>
            </select>
          </div>

          {/* Backlogs Filter */}
          <div className="filter-dropdown">
            <span className="filter-label">Backlogs:</span>
            <select
              value={backlogsFilter}
              onChange={(e) => setBacklogsFilter(e.target.value)}
            >
              <option value="all">All Academic Standings</option>
              <option value="backlogs">Has Backlogs</option>
              <option value="clear">Zero Backlogs</option>
            </select>
          </div>

          {(searchQuery || mentorFilter || attendanceFilter !== 'all' || backlogsFilter !== 'all') && (
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setMentorFilter('');
                setAttendanceFilter('all');
                setBacklogsFilter('all');
              }}
            >
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Students Table ── */}
      <div className="panel-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Admission No</th>
                <th>Assigned Mentor</th>
                <th>Relationship</th>
                <th>Attendance</th>
                <th>CGPA</th>
                <th>Backlogs</th>
                <th>Dossier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    <Users size={36} style={{ color: 'var(--muted-text)', margin: '0 auto 8px' }} />
                    <p style={{ color: 'var(--muted-text)', fontSize: '16px', margin: 0 }}>
                      No students found matching your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className={s.is_own_mentee ? 'own-mentee-row' : ''}>
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
                    <td><code>{s.admission_number || '—'}</code></td>
                    <td>
                      <strong>{s.mentor_name || 'Unassigned'}</strong>
                    </td>
                    <td>
                      {s.is_own_mentee ? (
                        <span className="badge-tag coordinator-tag" title="Assigned directly to you as Mentor">
                          ⭐ Your Mentee
                        </span>
                      ) : (
                        <span className="badge-tag" style={{ background: '#F1F5F9', color: '#475569' }}>
                          Mentee of {s.mentor_name?.split(' ')[0] || 'Peer'}
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: Number(s.attendance_percentage || 0) < 75 ? '#dc2626' : '#16a34a' }}>
                        {s.attendance_percentage != null ? `${s.attendance_percentage}%` : '—'}
                      </strong>
                    </td>
                    <td>
                      <strong>{s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—'}</strong>
                    </td>
                    <td>
                      {Number(s.backlogs_count || 0) > 0 ? (
                        <span className="badge-tag danger">{s.backlogs_count} Backlog(s)</span>
                      ) : (
                        <span className="badge-tag success">Clear</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${s.profile_status === 'Complete' ? 'complete' : 'pending'}`}>
                        {s.profile_status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {s.is_own_mentee ? (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => navigate(`/mentees/${s.id}`)}
                          title="Full Mentor Management (Observations, Dossier, Marks)"
                        >
                          <Eye size={14} />
                          <span>Mentor Actions</span>
                        </button>
                      ) : (
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleViewStudent(s)}
                          title="View Read-Only Academic Record & Dossier"
                        >
                          <Eye size={14} />
                          <span>Class Dossier</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Read-Only Student Dossier Modal (For Other Mentors' Students) ── */}
      {viewingStudent && (
        <div className="modal-overlay" onClick={() => setViewingStudent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'grid', placeItems: 'center' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--deep-violet-ink)', fontWeight: 700 }}>
                    Class Student Academic Dossier
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--muted-text)' }}>
                    Coordinator Read-Only Inspection · Assigned to {viewingStudent.mentor_name}
                  </span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewingStudent(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body p-4">
              {studentDetailsLoading ? (
                <div className="p-5 text-center">
                  <div className="portal-spinner" />
                  <p>Loading student dossier from database…</p>
                </div>
              ) : (
                <>
                  {/* Basic Profile Card */}
                  <div className="student-dossier-header-box mb-4">
                    <div className="dossier-avatar-large">
                      {viewingStudent.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '20px', color: 'var(--deep-violet-ink)' }}>
                        {viewingStudent.full_name}
                      </h4>
                      <p style={{ margin: '4px 0 8px', color: 'var(--slate-blue)', fontSize: '15px' }}>
                        Roll No: <strong>{viewingStudent.roll_number}</strong> · Admission: <strong>{viewingStudent.admission_number || '—'}</strong>
                      </p>
                      <div className="mentor-meta-pills">
                        <span>🏛️ {viewingStudent.department}</span>
                        <span>📚 Sem {viewingStudent.semester} (Sec {viewingStudent.section})</span>
                        <span>👤 Mentor: <strong>{viewingStudent.mentor_name}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Highlights Grid */}
                  <div className="admin-grid-3 mb-4">
                    <div className="panel-card p-3 text-center">
                      <span style={{ fontSize: '13px', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Attendance</span>
                      <h3 style={{ margin: '6px 0 0', color: Number(viewingStudent.attendance_percentage || 0) < 75 ? '#dc2626' : '#16a34a' }}>
                        {viewingStudent.attendance_percentage != null ? `${viewingStudent.attendance_percentage}%` : '—'}
                      </h3>
                    </div>
                    <div className="panel-card p-3 text-center">
                      <span style={{ fontSize: '13px', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Current CGPA</span>
                      <h3 style={{ margin: '6px 0 0', color: 'var(--deep-violet-ink)' }}>
                        {viewingStudent.cgpa != null ? Number(viewingStudent.cgpa).toFixed(2) : '—'}
                      </h3>
                    </div>
                    <div className="panel-card p-3 text-center">
                      <span style={{ fontSize: '13px', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Backlogs</span>
                      <h3 style={{ margin: '6px 0 0', color: Number(viewingStudent.backlogs_count || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                        {viewingStudent.backlogs_count || 0}
                      </h3>
                    </div>
                  </div>

                  {/* Contact & Primary Mentor Card */}
                  <div className="panel-card p-3 mb-4">
                    <h5 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--deep-violet-ink)' }}>
                      Assigned Faculty Mentor Information
                    </h5>
                    <div className="form-grid-2">
                      <div>
                        <span style={{ fontSize: '13px', color: 'var(--muted-text)' }}>Mentor Name:</span>
                        <p style={{ margin: '2px 0 0', fontWeight: 600, color: 'var(--deep-violet-ink)' }}>
                          {viewingStudent.mentor_name || 'Unassigned'}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: '13px', color: 'var(--muted-text)' }}>Mentor Email:</span>
                        <p style={{ margin: '2px 0 0', fontWeight: 600, color: 'var(--deep-violet-ink)' }}>
                          {studentDetails?.mentor?.email || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Results History */}
                  <h5 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--deep-violet-ink)' }}>
                    Semester Academic Performance History
                  </h5>
                  {studentDetails?.results?.length === 0 ? (
                    <p style={{ color: 'var(--muted-text)', fontStyle: 'italic', fontSize: '14px' }}>
                      No semester exam results entered for this student yet.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Semester</th>
                            <th>SGPA</th>
                            <th>CGPA</th>
                            <th>Backlogs</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentDetails?.results?.map((res, i) => (
                            <tr key={i}>
                              <td>Semester {res.semester}</td>
                              <td>{res.sgpa ? Number(res.sgpa).toFixed(2) : '—'}</td>
                              <td>{res.cgpa ? Number(res.cgpa).toFixed(2) : '—'}</td>
                              <td>{res.backlogs || 0}</td>
                              <td>
                                <span className={`badge-tag ${Number(res.backlogs || 0) > 0 ? 'danger' : 'success'}`}>
                                  {Number(res.backlogs || 0) > 0 ? 'Backlog' : 'Passed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="alert-box info mt-4">
                    <Award size={18} />
                    <span style={{ fontSize: '14px' }}>
                      As Class Coordinator, you have read-only visibility into this student's academic standing. Private mentoring notes and observations remain restricted to their designated primary mentor ({viewingStudent.mentor_name}).
                    </span>
                  </div>
                </>
              )}

              <div className="modal-actions-row mt-4">
                <button type="button" className="btn-secondary" onClick={() => setViewingStudent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
