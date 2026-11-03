import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import {
  FileSpreadsheet,
  Award,
  Download,
  BarChart3,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Printer,
  Calendar,
} from 'lucide-react';

export default function ClassReports() {
  const { mentor } = useAuth();

  const initialClasses = mentor?.coordinatedClasses || [];
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState(initialClasses.length > 0 ? initialClasses[0] : null);
  const [reportData, setReportData] = useState(null);
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

  // 2. Fetch class reports data
  useEffect(() => {
    if (!selectedClass) return;

    async function loadReports() {
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

        const data = await apiRequest(`/coordinator/reports?${params.toString()}`);
        setReportData(data);
      } catch (err) {
        setError(err.message || 'Failed to generate class reports.');
      } finally {
        setRefreshing(false);
      }
    }

    loadReports();
  }, [selectedClass]);

  const students = reportData?.students || [];

  // Compute metrics with live calculation fallback
  const totalStudents = students.length;
  const attList = students
    .map((s) => Number(s.attendance_percentage || 0))
    .filter((v) => v > 0);
  const calculatedAttendance = attList.length > 0
    ? (attList.reduce((a, b) => a + b, 0) / attList.length).toFixed(1)
    : '0.0';

  const cgpaList = students
    .map((s) => Number(s.cgpa || s.current_cgpa || 0))
    .filter((v) => v > 0);
  const calculatedCgpa = cgpaList.length > 0
    ? (cgpaList.reduce((a, b) => a + b, 0) / cgpaList.length).toFixed(2)
    : '0.00';

  const calculatedBacklogs = students.filter(
    (s) => Number(s.backlogs_count || s.total_backlogs || 0) > 0
  ).length;

  const metrics = {
    total_students: reportData?.metrics?.total_students != null ? reportData.metrics.total_students : totalStudents,
    overall_attendance: reportData?.metrics?.overall_attendance && Number(reportData?.metrics?.overall_attendance) > 0
      ? reportData.metrics.overall_attendance
      : calculatedAttendance,
    average_cgpa: reportData?.metrics?.average_cgpa && Number(reportData?.metrics?.average_cgpa) > 0
      ? reportData.metrics.average_cgpa
      : calculatedCgpa,
    students_with_backlogs: reportData?.metrics?.students_with_backlogs != null ? reportData.metrics.students_with_backlogs : calculatedBacklogs,
  };

  // CSV Exporter
  function handleExportCSV() {
    if (!students || students.length === 0) return;

    const headers = [
      'Roll Number',
      'Admission Number',
      'Student Name',
      'Department',
      'Course',
      'Semester',
      'Section',
      'Assigned Mentor',
      'Is Own Mentee',
      'Attendance %',
      'CGPA',
      'Backlogs Count',
      'Profile Status',
      'Email',
      'Phone',
    ];

    const rows = students.map((s) => [
      `"${s.roll_number || ''}"`,
      `"${s.admission_number || ''}"`,
      `"${s.full_name || ''}"`,
      `"${s.department || ''}"`,
      `"${s.course || ''}"`,
      s.semester || '',
      `"${s.section || ''}"`,
      `"${s.mentor_name || 'Unassigned'}"`,
      s.is_own_mentee ? 'YES' : 'NO',
      s.attendance_percentage != null ? s.attendance_percentage : '',
      s.cgpa != null ? s.cgpa : '',
      s.backlogs_count || 0,
      `"${s.profile_status || 'Pending'}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `"Institutional Class Report - ${selectedClass?.department} Sem ${selectedClass?.semester} Sec ${selectedClass?.section} (${selectedClass?.academic_year || '2026-27'})"`,
        `"Generated By: ${mentor?.full_name} (Class Coordinator)"`,
        `"Generated Date: ${new Date().toLocaleString()}"`,
        '',
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Class_Report_${selectedClass?.department}_Sem${selectedClass?.semester}_Sec${selectedClass?.section}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Browser print report
  function handlePrint() {
    window.print();
  }

  return (
    <div className="portal-content-wrap coordinator-page">
      {/* ── Page Header ── */}
      <div className="page-header-row coordinator-header-card">
        <div>
          <div className="coordinator-role-pill">
            <Award size={15} />
            <span>INSTITUTIONAL DOCUMENTATION · AUDIT READY</span>
          </div>
          <h1 className="coordinator-title">Class Comprehensive Performance Report</h1>
          <p className="coordinator-sub">
            Academic analytics, attendance compliance, and mentor allocation documentation for department reviews and NAAC/NBA criteria.
          </p>
        </div>

        {/* Controls - Aligned to Top Right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
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
            style={{ minWidth: '280px' }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrint}
              title="Print or Save as PDF"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 42, padding: '0 16px', borderRadius: 10 }}
            >
              <Printer size={16} />
              <span>Print Report</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleExportCSV}
              title="Export full report as CSV"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 42, padding: '0 18px', borderRadius: 10 }}
            >
              <Download size={16} />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              className="btn-icon-refresh"
              title="Refresh Class Report"
              disabled={refreshing}
              onClick={() => {
                const current = selectedClass;
                setSelectedClass(null);
                setTimeout(() => setSelectedClass(current), 50);
              }}
              style={{ height: 42, width: 42, borderRadius: 10 }}
            >
              <RefreshCw size={17} className={refreshing ? 'rotating' : ''} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-box error mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. Official Class Audit Report Executive Summary Banner ── */}
      <div className="panel-card p-4 mb-4 report-banner-card">
        <div className="report-banner-header">
          <div>
            <span className="report-sub-tag">OFFICIAL CLASS AUDIT REPORT</span>
            <h2 style={{ margin: '4px 0 6px', color: 'var(--deep-violet-ink)', fontSize: '24px', fontWeight: 800 }}>
              {selectedClass?.department} · Semester {selectedClass?.semester} · Section {selectedClass?.section}
            </h2>
            <p style={{ margin: 0, color: 'var(--slate-blue)', fontSize: '15px' }}>
              Academic Session: <strong>{selectedClass?.academic_year || '2026-27'}</strong> · Course: <strong>{selectedClass?.course || 'B.Tech Computer Science'}</strong> · Designated Coordinator: <strong>{mentor?.full_name}</strong>
            </p>
          </div>
          <div className="report-stamp-box">
            <span>OFFICIAL REPORT</span>
            <strong>VERIFIED</strong>
          </div>
        </div>

        {/* Key Benchmark Badges Grid - Perfectly Aligned 4-Column Cards */}
        <div className="coordinator-kpi-grid">
          {/* Card 1: Class Strength */}
          <div className="coord-kpi-card">
            <div className="coord-kpi-icon violet">
              <Users size={24} />
            </div>
            <div className="coord-kpi-content">
              <span className="coord-kpi-label">Class Strength</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <strong className="coord-kpi-val">{metrics.total_students}</strong>
                <span style={{ fontSize: '13px', color: 'var(--muted-text)', fontWeight: 600 }}>Enrolled</span>
              </div>
              <span className="coord-kpi-sub">Active Students in Section</span>
            </div>
          </div>

          {/* Card 2: Aggregate Attendance */}
          <div className="coord-kpi-card">
            <div className="coord-kpi-icon blue">
              <BarChart3 size={24} />
            </div>
            <div className="coord-kpi-content">
              <span className="coord-kpi-label">Aggregate Attendance</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <strong className="coord-kpi-val">{metrics.overall_attendance}%</strong>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: Number(metrics.overall_attendance) >= 75 ? '#DCFCE7' : '#FEE2E2',
                    color: Number(metrics.overall_attendance) >= 75 ? '#15803D' : '#B91C1C',
                  }}
                >
                  {Number(metrics.overall_attendance) >= 75 ? 'Healthy' : 'Low'}
                </span>
              </div>
              <span className="coord-kpi-sub">Overall Class Average</span>
            </div>
          </div>

          {/* Card 3: Cumulative GPA */}
          <div className="coord-kpi-card">
            <div className="coord-kpi-icon green">
              <GraduationCap size={24} />
            </div>
            <div className="coord-kpi-content">
              <span className="coord-kpi-label">Cumulative GPA</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <strong className="coord-kpi-val">{metrics.average_cgpa}</strong>
                <span style={{ fontSize: '13px', color: 'var(--muted-text)', fontWeight: 600 }}>/ 10.00</span>
              </div>
              <span className="coord-kpi-sub">Class Mean CGPA</span>
            </div>
          </div>

          {/* Card 4: Backlogs Total */}
          <div className="coord-kpi-card">
            <div className={`coord-kpi-icon ${Number(metrics.students_with_backlogs) > 0 ? 'red' : 'green'}`}>
              {Number(metrics.students_with_backlogs) > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div className="coord-kpi-content">
              <span className="coord-kpi-label">Academic Backlogs</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <strong
                  className="coord-kpi-val"
                  style={{ color: Number(metrics.students_with_backlogs) > 0 ? '#DC2626' : '#15803D' }}
                >
                  {metrics.students_with_backlogs}
                </strong>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: Number(metrics.students_with_backlogs) > 0 ? '#FEE2E2' : '#DCFCE7',
                    color: Number(metrics.students_with_backlogs) > 0 ? '#B91C1C' : '#15803D',
                  }}
                >
                  {Number(metrics.students_with_backlogs) > 0 ? 'Action Needed' : 'All Clear'}
                </span>
              </div>
              <span className="coord-kpi-sub">Students with Backlogs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Report Tables / Roster ── */}
      <div className="panel-card p-4">
        <div className="card-header-clean mb-3">
          <div>
            <h3 className="section-title">Complete Student Performance Ledger</h3>
            <p className="section-sub">Individual student attendance, cumulative marks, and mentor associations</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                <th style={{ width: '130px' }}>Roll No</th>
                <th style={{ width: '130px' }}>Admission No</th>
                <th>Student Full Name</th>
                <th>Assigned Mentor</th>
                <th style={{ width: '130px' }}>Attendance %</th>
                <th style={{ width: '90px' }}>CGPA</th>
                <th style={{ width: '100px' }}>Backlogs</th>
                <th style={{ width: '150px' }}>Academic Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    No students found in this section report.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td><code>{s.roll_number}</code></td>
                    <td><code>{s.admission_number || '—'}</code></td>
                    <td>
                      <strong style={{ color: 'var(--deep-violet-ink)' }}>{s.full_name}</strong>
                    </td>
                    <td>
                      {s.mentor_name || 'Unassigned'}
                      {s.is_own_mentee && (
                        <span style={{ marginLeft: 6, fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#F5F3FF', color: '#6D28D9' }}>
                          ⭐ Your Mentee
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: Number(s.attendance_percentage || 0) < 75 ? '#dc2626' : '#16a34a' }}>
                        {s.attendance_percentage != null ? `${s.attendance_percentage}%` : '—'}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--deep-violet-ink)' }}>
                        {s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—'}
                      </strong>
                    </td>
                    <td>
                      {Number(s.backlogs_count || 0) > 0 ? (
                        <span className="badge-tag danger">{s.backlogs_count} Backlog(s)</span>
                      ) : (
                        <span className="badge-tag success">Clear</span>
                      )}
                    </td>
                    <td>
                      {Number(s.attendance_percentage || 0) < 75 || Number(s.backlogs_count || 0) > 0 ? (
                        <span className="status-pill attention">Attention Required</span>
                      ) : (
                        <span className="status-pill complete">Good Standing</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
