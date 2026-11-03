import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  FileBarChart2,
  Download,
  Printer,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  RotateCcw,
  Calendar,
  GraduationCap,
  ChevronDown,
  ExternalLink,
  Clock,
  Sparkles,
  AlertTriangle,
  Layers,
  ListChecks,
  Percent,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [academicYear, setAcademicYear] = useState('all');
  const [semester, setSemester] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);

  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  // Close export menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Analytics Data
  async function loadAnalytics() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (academicYear !== 'all') params.append('academic_year', academicYear);
      if (semester !== 'all') params.append('semester', semester);
      if (search.trim()) params.append('search', search.trim());

      const url = `/reports/analytics?${params.toString()}`;
      const res = await apiRequest(url);
      setData(res);
    } catch (err) {
      console.error('Failed to load reports analytics:', err);
      setError(err.message || 'Could not load reports data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [academicYear, semester]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAnalytics();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  function handleResetFilters() {
    setAcademicYear('all');
    setSemester('all');
    setSearch('');
  }

  // ── CSV Export Generators ──
  function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  }

  function handleExportMenteesCSV() {
    if (!data?.academic?.mentees || data.academic.mentees.length === 0) {
      alert('No mentee records found to export.');
      return;
    }

    const headers = [
      'Roll Number',
      'Full Name',
      'Department',
      'Semester',
      'Academic Year',
      'Current CGPA',
      'Current SGPA',
      'Attendance Percentage',
      'Backlogs',
      '10th %',
      '12th %',
      'Profile Status',
      'Performance Trend',
    ];

    const rows = data.academic.mentees.map((m) => [
      `"${m.roll_number || ''}"`,
      `"${(m.full_name || '').replace(/"/g, '""')}"`,
      `"${m.department || ''}"`,
      `"${m.semester || ''}"`,
      `"${m.academic_year || ''}"`,
      `"${m.current_cgpa || 'N/A'}"`,
      `"${m.current_sgpa || 'N/A'}"`,
      `"${m.attendance_percentage ? `${m.attendance_percentage}%` : 'N/A'}"`,
      `"${m.total_backlogs || 0}"`,
      `"${m.tenth_percentage || 'N/A'}"`,
      `"${m.twelfth_percentage || 'N/A'}"`,
      `"${m.profile_status || ''}"`,
      `"${m.trendLabel || ''}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csv, `mentor-academic-report-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleExportSummaryCSV() {
    if (!data?.summary) return;
    const s = data.summary;

    const summaryRows = [
      ['Metric', 'Value', 'Context'],
      ['Total Assigned Mentees', s.total_mentees, 'Active Mentoring Cohort'],
      ['Completed Registration Profiles', `${s.completed_profiles} (${s.completion_rate}%)`, 'Profiles Submitted & Verified'],
      ['Average Cohort CGPA', s.avg_cgpa ?? 'N/A', 'Across Graded Students'],
      ['Average Attendance', s.avg_attendance ? `${s.avg_attendance}%` : 'N/A', 'Reported Attendance'],
      ['Total Student Achievements', s.total_achievements, `${s.verified_achievements} Verified, ${s.pending_achievements} Pending`],
      ['Total Student Issues', s.total_issues, `${s.pending_issues} Open/In Progress, ${s.resolved_issues} Resolved`],
      ['Average Issue Resolution Days', s.avg_resolution_days ?? 'N/A', 'For Resolved Student Concerns'],
      ['Students with Attendance < 75%', s.below_attendance_threshold_count, 'Requires Attendance Follow-up'],
      ['Students with Improving Performance', s.improving_count, 'SGPA Higher than CGPA Baseline'],
    ];

    const csv = summaryRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadCSV(csv, `mentor-kpi-summary-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleExportIssuesCSV() {
    if (!data?.issues?.list || data.issues.list.length === 0) {
      alert('No student issues found to export.');
      return;
    }

    const headers = ['Issue ID', 'Student Name', 'Roll Number', 'Category', 'Title', 'Priority', 'Status', 'Date Submitted'];
    const rows = data.issues.list.map((i) => [
      `"${i.id}"`,
      `"${(i.mentee_name || '').replace(/"/g, '""')}"`,
      `"${i.roll_number || ''}"`,
      `"${i.category || ''}"`,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${i.priority || 'Medium'}"`,
      `"${i.status || 'New'}"`,
      `"${i.created_at ? new Date(i.created_at).toLocaleDateString() : ''}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csv, `mentor-student-issues-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handlePrintReport() {
    setShowExportMenu(false);
    window.print();
  }

  const summary = data?.summary || {};
  const mentees = data?.academic?.mentees || [];
  const achievements = data?.achievements?.list || [];
  const issues = data?.issues?.list || [];
  const attentionList = data?.requiring_attention || [];
  const filterOptions = data?.filter_options || { academic_years: [], semesters: [] };

  const hasActiveFilters = academicYear !== 'all' || semester !== 'all' || search.trim() !== '';

  return (
    <div className="reports-page">
      {/* ── Page Header ── */}
      <div className="page-header-row">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Monitor mentee progress, academic performance, achievements, and mentoring outcomes.</p>
        </div>

        <div className="header-actions">
          <div className="export-dropdown-wrapper" ref={exportRef}>
            <button
              className="btn-primary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={loading}
            >
              <Download size={16} />
              <span>Export Report</span>
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="export-menu-popup">
                <button className="export-menu-item" onClick={handleExportMenteesCSV}>
                  <FileSpreadsheet size={15} color="var(--cornflower-blue)" />
                  <span>Export Filtered Table (CSV)</span>
                </button>
                <button className="export-menu-item" onClick={handleExportSummaryCSV}>
                  <Download size={15} color="var(--iris-bloom)" />
                  <span>Export KPI Summary (CSV)</span>
                </button>
                <button className="export-menu-item" onClick={handleExportIssuesCSV}>
                  <AlertCircle size={15} color="#B45309" />
                  <span>Export Issues Queue (CSV)</span>
                </button>
                <button className="export-menu-item" onClick={handlePrintReport}>
                  <Printer size={15} color="var(--deep-violet-ink)" />
                  <span>Print / Save PDF Report</span>
                </button>
              </div>
            )}
          </div>

          <button className="btn-secondary" onClick={handlePrintReport} title="Print or save as PDF">
            <Printer size={16} />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="reports-filter-panel">
        <div className="reports-filter-row">
          <div className="filter-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by student name, roll number, or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          >
            <option value="all">All Academic Years</option>
            {filterOptions.academic_years.map((y) => (
              <option key={y} value={y}>
                Academic Year {y}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {filterOptions.semesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button className="filter-reset-btn" onClick={handleResetFilters}>
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="active-filters-strip">
            <span>Active Filters:</span>
            {academicYear !== 'all' && (
              <span className="active-filter-pill">
                Year: {academicYear}
                <button onClick={() => setAcademicYear('all')}>×</button>
              </span>
            )}
            {semester !== 'all' && (
              <span className="active-filter-pill">
                Semester: {semester}
                <button onClick={() => setSemester('all')}>×</button>
              </span>
            )}
            {search.trim() !== '' && (
              <span className="active-filter-pill">
                Search: "{search}"
                <button onClick={() => setSearch('')}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 6 KPI Summary Cards ── */}
      <div className="reports-kpi-grid">
        <div className="report-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title">Total Mentees</span>
            <div className="kpi-icon-bubble blue">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-metric-val">{loading ? '…' : summary.total_mentees ?? 0}</div>
          <span className="kpi-metric-subtext">Assigned faculty cohort</span>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title">Completed Profiles</span>
            <div className="kpi-icon-bubble green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-metric-val">
            {loading ? '…' : `${summary.completed_profiles ?? 0}/${summary.total_mentees ?? 0}`}
          </div>
          <span className="kpi-metric-subtext">{summary.completion_rate ?? 0}% overall completion rate</span>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title">Average Attendance</span>
            <div className="kpi-icon-bubble purple">
              <Percent size={18} />
            </div>
          </div>
          <div className="kpi-metric-val">
            {loading ? '…' : summary.avg_attendance ? `${summary.avg_attendance}%` : 'N/A'}
          </div>
          <span className="kpi-metric-subtext">Across reported student records</span>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title">Average CGPA</span>
            <div className="kpi-icon-bubble amber">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="kpi-metric-val">{loading ? '…' : summary.avg_cgpa ?? 'N/A'}</div>
          <span className="kpi-metric-subtext">Across graded student profiles</span>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title">Total Achievements</span>
            <div className="kpi-icon-bubble blue">
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-metric-val">{loading ? '…' : summary.total_achievements ?? 0}</div>
          <span className="kpi-metric-subtext">
            {summary.verified_achievements ?? 0} verified · {summary.pending_achievements ?? 0} pending
          </span>
        </div>

        <div className="report-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title">Pending Issues</span>
            <div className="kpi-icon-bubble rose">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="kpi-metric-val" style={{ color: summary.pending_issues > 0 ? '#BE123C' : 'var(--deep-violet-ink)' }}>
            {loading ? '…' : summary.pending_issues ?? 0}
          </div>
          <span className="kpi-metric-subtext">Concerns requiring follow-up</span>
        </div>
      </div>

      {/* ── Section Navigation Tabs ── */}
      <div className="reports-tab-bar">
        <button
          className={`reports-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Layers size={16} />
          <span>Overview & Priority Attention</span>
          {attentionList.length > 0 && (
            <span className="reports-tab-badge" style={{ background: '#FFE4E6', color: '#BE123C' }}>
              {attentionList.length}
            </span>
          )}
        </button>

        <button
          className={`reports-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
          onClick={() => setActiveTab('academic')}
        >
          <GraduationCap size={16} />
          <span>Academic Performance</span>
        </button>

        <button
          className={`reports-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Percent size={16} />
          <span>Attendance Analytics</span>
        </button>

        <button
          className={`reports-tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <Award size={16} />
          <span>Achievements & Results</span>
          <span className="reports-tab-badge">{summary.total_achievements ?? 0}</span>
        </button>

        <button
          className={`reports-tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          <AlertCircle size={16} />
          <span>Issues & Mentoring</span>
          <span className="reports-tab-badge">{summary.total_issues ?? 0}</span>
        </button>

        <button
          className={`reports-tab-btn ${activeTab === 'completion' ? 'active' : ''}`}
          onClick={() => setActiveTab('completion')}
        >
          <ListChecks size={16} />
          <span>Profile Completion</span>
        </button>
      </div>

      {/* ── Loading & Error States ── */}
      {loading && (
        <div className="panel-card p-5 text-center" style={{ padding: '60px 20px' }}>
          <div className="spinner-border mb-3" />
          <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700 }}>Calculating Mentorship Analytics…</h4>
          <p style={{ color: 'var(--slate-blue)', fontSize: '17.5px' }}>
            Aggregating student attendance, CGPA distribution, verified awards, and academic progress records.
          </p>
        </div>
      )}

      {error && (
        <div className="alert-box error">
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>
            <strong>Analytics Error:</strong> {error}
          </div>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '16px' }} onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ═════════════════════════════════════════════════════════════
              TAB 1: Overview & Students Requiring Attention
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Students Requiring Attention Section */}
              <div className="attention-section-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="kpi-icon-bubble amber">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '21px', fontWeight: 800, color: 'var(--deep-violet-ink)', margin: 0 }}>
                        Students Requiring Attention ({attentionList.length})
                      </h3>
                      <p style={{ fontSize: '17px', color: 'var(--slate-blue)', margin: '2px 0 0' }}>
                        Data-supported alerts for low attendance (&lt;75%), active backlogs, open student concerns, or incomplete dossiers.
                      </p>
                    </div>
                  </div>
                  {attentionList.length > 0 && (
                    <span className="badge-chip">Action Recommended</span>
                  )}
                </div>

                {attentionList.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', marginTop: '16px', border: '1.5px dashed var(--light-border)' }}>
                    <CheckCircle2 size={32} color="#166534" style={{ marginBottom: '8px' }} />
                    <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700, margin: 0 }}>All Mentees in Good Standing</h4>
                    <p style={{ color: 'var(--slate-blue)', fontSize: '17px', marginTop: '4px' }}>
                      No active alerts. All assigned students maintain satisfactory attendance (&ge; 75%) and have completed their profiles without unresolved issues.
                    </p>
                  </div>
                ) : (
                  <div className="attention-grid">
                    {attentionList.map((item) => (
                      <div key={item.id} className={`attention-item-card severity-${item.severity}`}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ fontSize: '18.5px', color: 'var(--deep-violet-ink)' }}>{item.fullName}</strong>
                            <span className={`attention-badge-pill ${item.severity}`}>{item.metric}</span>
                          </div>
                          <span style={{ fontSize: '16px', color: 'var(--slate-blue)' }}>
                            Roll: {item.rollNumber} · {item.reason}
                          </span>
                          <p style={{ fontSize: '16.5px', color: 'var(--deep-violet-ink)', margin: '6px 0 0', lineHeight: 1.4 }}>
                            {item.details}
                          </p>
                          <div style={{ marginTop: '10px' }}>
                            <Link to={`/mentees/${item.menteeId}`} className="view-profile-link">
                              <span>Open Student Profile</span>
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Two Visual Breakdowns Side-by-Side */}
              <div className="reports-visual-grid">
                {/* CGPA Distribution Bar Chart */}
                <div className="report-chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h3>CGPA Distribution</h3>
                      <span>Cohort academic grade spread</span>
                    </div>
                    <span className="badge-chip">Academic Standing</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                    {[
                      { label: 'Excellent (≥ 9.0)', count: data?.academic?.cgpa_distribution?.excellent || 0, color: 'var(--iris-bloom)' },
                      { label: 'Very Good (8.0 – 8.99)', count: data?.academic?.cgpa_distribution?.veryGood || 0, color: 'var(--cornflower-blue)' },
                      { label: 'Good (7.0 – 7.99)', count: data?.academic?.cgpa_distribution?.good || 0, color: 'var(--violet-tulip)' },
                      { label: 'Average (6.0 – 6.99)', count: data?.academic?.cgpa_distribution?.average || 0, color: '#B45309' },
                      { label: 'Support Needed (< 6.0)', count: data?.academic?.cgpa_distribution?.supportNeeded || 0, color: '#BE123C' },
                    ].map((row) => {
                      const max = Math.max(1, mentees.length);
                      const pct = Math.round((row.count / max) * 100);
                      return (
                        <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16.5px', color: 'var(--deep-violet-ink)', fontWeight: 600 }}>
                            <span>{row.label}</span>
                            <span>{row.count} students ({pct}%)</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--pale-lavender)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: row.color, borderRadius: '6px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attendance Distribution Card */}
                <div className="report-chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h3>Attendance Compliance</h3>
                      <span>Threshold: {attendanceThreshold}% required</span>
                    </div>
                    <span className="badge-chip">{summary.avg_attendance ? `${summary.avg_attendance}% Average` : 'Attendance'}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                    {[
                      { label: 'Distinction (≥ 85%)', count: data?.attendance?.distribution?.distinction || 0, color: '#166534' },
                      { label: 'Satisfactory (75% – 84%)', count: data?.attendance?.distribution?.satisfactory || 0, color: 'var(--cornflower-blue)' },
                      { label: 'Moderate Warning (65% – 74%)', count: data?.attendance?.distribution?.warning || 0, color: '#D97706' },
                      { label: 'Critical (< 65%)', count: data?.attendance?.distribution?.critical || 0, color: '#BE123C' },
                    ].map((row) => {
                      const max = Math.max(1, mentees.length);
                      const pct = Math.round((row.count / max) * 100);
                      return (
                        <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16.5px', color: 'var(--deep-violet-ink)', fontWeight: 600 }}>
                            <span>{row.label}</span>
                            <span>{row.count} students ({pct}%)</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--pale-lavender)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: row.color, borderRadius: '6px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 2: Academic Performance Report
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'academic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Semester Trends Chart & Performance Indicators */}
              <div className="report-chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3>Semester-wise Performance Progression</h3>
                    <span>Chronological SGPA & CGPA averages across semesters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="trend-badge improving">
                      <TrendingUp size={13} />
                      <span>{summary.improving_count ?? 0} Improving</span>
                    </span>
                    <span className="trend-badge steady">
                      <Minus size={13} />
                      <span>{summary.steady_count ?? 0} Steady</span>
                    </span>
                    {summary.declining_count > 0 && (
                      <span className="trend-badge declining">
                        <TrendingDown size={13} />
                        <span>{summary.declining_count} Declining</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* SVG Semester Line Chart */}
                {data?.academic?.semester_trends && data.academic.semester_trends.length > 0 ? (
                  <div className="svg-chart-container" style={{ height: '220px', padding: '10px 0' }}>
                    <svg viewBox="0 0 600 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8CA4CE" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#C5B9D7" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines (6.0, 7.0, 8.0, 9.0, 10.0) */}
                      {[6, 7, 8, 9, 10].map((grade) => {
                        const y = 160 - ((grade - 5) / 5) * 140;
                        return (
                          <g key={grade}>
                            <line x1="40" y1={y} x2="580" y2={y} stroke="#E4DFEF" strokeDasharray="3 3" />
                            <text x="15" y={y + 4} fill="#77758D" fontSize="11" fontWeight="600">
                              {grade}.0
                            </text>
                          </g>
                        );
                      })}

                      {/* Plot Area */}
                      {(() => {
                        const trends = data.academic.semester_trends;
                        const points = trends.map((t, idx) => {
                          const x = 50 + (idx / Math.max(1, trends.length - 1)) * 500;
                          const y = 160 - ((Math.min(10, Math.max(5, t.avgSgpa)) - 5) / 5) * 140;
                          return { x, y, ...t };
                        });

                        const pathD = points.reduce((acc, curr, idx) => {
                          return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
                        }, '');

                        const areaD = `${pathD} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`;

                        return (
                          <>
                            <path d={areaD} fill="url(#chartGradient)" />
                            <path d={pathD} fill="none" stroke="#6669A5" strokeWidth="3" strokeLinecap="round" />
                            {points.map((pt) => (
                              <g key={pt.semester}>
                                <circle cx={pt.x} cy={pt.y} r="5" fill="#FFFFFF" stroke="#6669A5" strokeWidth="2.5" />
                                <text x={pt.x} y={pt.y - 10} fill="#39385F" fontSize="11" fontWeight="700" textAnchor="middle">
                                  {pt.avgSgpa}
                                </text>
                                <text x={pt.x} y="176" fill="#77758D" fontSize="11" fontWeight="600" textAnchor="middle">
                                  {pt.semester}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted-text)', fontSize: '17px' }}>
                    Historical semester trend data will plot here as semester examination results are recorded.
                  </div>
                )}
              </div>

              {/* Student Academic Standing Table */}
              <div className="reports-table-card">
                <div className="card-header">
                  <h3>Academic Standing & Results Roster ({mentees.length})</h3>
                  <span className="badge-chip">Grading Scale: 10.0 CGPA</span>
                </div>

                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Enrollment / Roll</th>
                        <th>Department</th>
                        <th>Current Sem</th>
                        <th>Latest SGPA</th>
                        <th>Current CGPA</th>
                        <th>Performance Trend</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mentees.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted-text)' }}>
                            No student academic records found for the selected filters.
                          </td>
                        </tr>
                      ) : (
                        mentees.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="sidebar-avatar" style={{ width: '30px', height: '30px', fontSize: '15px' }}>
                                  {m.full_name ? m.full_name.slice(0, 2).toUpperCase() : 'ST'}
                                </div>
                                <strong style={{ color: 'var(--deep-violet-ink)' }}>{m.full_name}</strong>
                              </div>
                            </td>
                            <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.roll_number}</span></td>
                            <td>{m.department || 'CSE'}</td>
                            <td>{m.semester ? `Semester ${m.semester}` : 'Semester 3'}</td>
                            <td><strong>{m.current_sgpa ?? '—'}</strong></td>
                            <td>
                              <strong style={{ color: parseFloat(m.current_cgpa) >= 8.5 ? '#166534' : 'var(--deep-violet-ink)' }}>
                                {m.current_cgpa ?? '—'}
                              </strong>
                            </td>
                            <td>
                              <span className={`trend-badge ${m.trend}`}>
                                {m.trend === 'improving' && <TrendingUp size={13} />}
                                {m.trend === 'declining' && <TrendingDown size={13} />}
                                {m.trend === 'steady' && <Minus size={13} />}
                                <span>{m.trendLabel}</span>
                              </span>
                            </td>
                            <td>
                              <Link to={`/mentees/${m.id}`} className="view-profile-link">
                                <span>View Profile</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 3: Attendance Analytics Report
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="report-chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3>Attendance Policy & Threshold Analysis</h3>
                    <span>Institutional attendance requirement benchmarked against student records</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--deep-violet-ink)' }}>
                      Policy Threshold:
                    </span>
                    <select
                      className="filter-select"
                      style={{ height: '32px', minWidth: '90px' }}
                      value={attendanceThreshold}
                      onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                    >
                      <option value="75">75% (Mandatory)</option>
                      <option value="80">80% (Strict)</option>
                      <option value="85">85% (High Bar)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '6px' }}>
                  <div style={{ padding: '14px 16px', background: '#F8F7FC', borderRadius: '10px', border: '1px solid var(--light-border)' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--slate-blue)', textTransform: 'uppercase' }}>Average Attendance</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--deep-violet-ink)', marginTop: '4px' }}>
                      {summary.avg_attendance ? `${summary.avg_attendance}%` : 'N/A'}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#E6F7ED', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Eligible for Exams (≥ {attendanceThreshold}%)</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                      {mentees.filter((m) => parseFloat(m.attendance_percentage) >= attendanceThreshold).length}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#FEE2E2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Below Threshold (&lt; {attendanceThreshold}%)</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#991B1B', marginTop: '4px' }}>
                      {mentees.filter((m) => parseFloat(m.attendance_percentage) < attendanceThreshold && parseFloat(m.attendance_percentage) >= 0).length}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#F8F7FC', borderRadius: '10px', border: '1px solid var(--light-border)' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--slate-blue)', textTransform: 'uppercase' }}>Pending Submissions</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--deep-violet-ink)', marginTop: '4px' }}>
                      {mentees.filter((m) => !m.attendance_percentage).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Roster Table */}
              <div className="reports-table-card">
                <div className="card-header">
                  <h3>Student Attendance Records</h3>
                  <span className="badge-chip">Verified & Self-Reported</span>
                </div>

                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Enrollment / Roll</th>
                        <th>Semester</th>
                        <th>Attendance Percentage</th>
                        <th>Compliance Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mentees.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted-text)' }}>
                            No student attendance records found.
                          </td>
                        </tr>
                      ) : (
                        mentees.map((m) => {
                          const att = parseFloat(m.attendance_percentage);
                          const isSatisfactory = !isNaN(att) && att >= attendanceThreshold;
                          return (
                            <tr key={m.id}>
                              <td><strong>{m.full_name}</strong></td>
                              <td><span style={{ fontFamily: 'monospace' }}>{m.roll_number}</span></td>
                              <td>{m.semester ? `Semester ${m.semester}` : 'Semester 3'}</td>
                              <td>
                                {!isNaN(att) ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '80px', height: '6px', background: 'var(--pale-lavender)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ width: `${Math.min(100, att)}%`, height: '100%', background: isSatisfactory ? '#166534' : '#BE123C' }} />
                                    </div>
                                    <strong>{att}%</strong>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--muted-text)' }}>Pending Verification</span>
                                )}
                              </td>
                              <td>
                                {!isNaN(att) ? (
                                  <span className={`trend-badge ${isSatisfactory ? 'improving' : 'declining'}`}>
                                    {isSatisfactory ? <Check size={12} /> : <AlertCircle size={12} />}
                                    <span>{isSatisfactory ? `Satisfactory (≥ ${attendanceThreshold}%)` : `Critical (< ${attendanceThreshold}%)`}</span>
                                  </span>
                                ) : (
                                  <span className="trend-badge steady">Awaiting Data</span>
                                )}
                              </td>
                              <td>
                                <Link to={`/mentees/${m.id}`} className="view-profile-link">
                                  <span>View Profile</span>
                                  <ExternalLink size={12} />
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 4: Achievements & Results Report
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'achievements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Category Breakdown & Overview */}
              <div className="report-chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3>Student Achievements & Extracurricular Recognition</h3>
                    <span>Total Submissions: {achievements.length}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge-chip">{summary.verified_achievements ?? 0} Verified</span>
                    <span className="badge-chip">{summary.pending_achievements ?? 0} Awaiting Verification</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}>
                  {Object.entries(data?.achievements?.category_distribution || {}).map(([cat, count]) => (
                    <div key={cat} style={{ padding: '12px 14px', background: '#F8F7FC', borderRadius: '10px', border: '1px solid var(--light-border)' }}>
                      <span style={{ fontSize: '16px', color: 'var(--slate-blue)', fontWeight: 600 }}>{cat}</span>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--deep-violet-ink)', marginTop: '2px' }}>
                        {count} {count === 1 ? 'Entry' : 'Entries'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements Table */}
              <div className="reports-table-card">
                <div className="card-header">
                  <h3>Achievements Verification Queue</h3>
                </div>

                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Achievement Title</th>
                        <th>Category</th>
                        <th>Level</th>
                        <th>Submission Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achievements.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted-text)' }}>
                            No achievements submitted yet by assigned mentees.
                          </td>
                        </tr>
                      ) : (
                        achievements.map((a) => (
                          <tr key={a.id}>
                            <td><strong>{a.mentee_name}</strong></td>
                            <td>{a.title}</td>
                            <td><span className="badge-chip">{a.category || 'General'}</span></td>
                            <td>{a.level || 'Institutional'}</td>
                            <td>{a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent'}</td>
                            <td>
                              <span className={`trend-badge ${a.verification_status === 'Verified' ? 'improving' : 'declining'}`}>
                                {a.verification_status || 'Pending Verification'}
                              </span>
                            </td>
                            <td>
                              <Link to={`/mentees/${a.mentee_id}`} className="view-profile-link">
                                <span>Verify in Dossier</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 5: Issues & Mentoring Concerns Report
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'issues' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="report-chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3>Student Concerns & Grievance Resolution Summary</h3>
                    <span>Total Issues Tracked: {issues.length}</span>
                  </div>
                  <span className="badge-chip" style={{ background: summary.pending_issues > 0 ? '#FFE4E6' : undefined, color: summary.pending_issues > 0 ? '#BE123C' : undefined }}>
                    {summary.pending_issues ?? 0} Pending Resolution
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '10px' }}>
                  <div style={{ padding: '14px 16px', background: '#F8F7FC', borderRadius: '10px', border: '1px solid var(--light-border)' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--slate-blue)', textTransform: 'uppercase' }}>New / Unassigned</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--deep-violet-ink)', marginTop: '4px' }}>
                      {data?.issues?.status_distribution?.New || 0}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#FEF3C7', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Under Review / In Progress</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>
                      {(data?.issues?.status_distribution?.['Under Review'] || 0) + (data?.issues?.status_distribution?.['In Progress'] || 0)}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#E6F7ED', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Resolved</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                      {data?.issues?.status_distribution?.Resolved || 0}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', background: '#F8F7FC', borderRadius: '10px', border: '1px solid var(--light-border)' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--slate-blue)', textTransform: 'uppercase' }}>Avg Resolution Time</span>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--deep-violet-ink)', marginTop: '4px' }}>
                      {summary.avg_resolution_days !== null ? `${summary.avg_resolution_days} Days` : 'N/A (Pending)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues Queue Table */}
              <div className="reports-table-card">
                <div className="card-header">
                  <h3>Mentoring Issue Queue</h3>
                </div>

                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Issue ID</th>
                        <th>Student Name</th>
                        <th>Category</th>
                        <th>Title / Subject</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Submission Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted-text)' }}>
                            No student issues reported.
                          </td>
                        </tr>
                      ) : (
                        issues.map((i) => (
                          <tr key={i.id}>
                            <td><span style={{ fontFamily: 'monospace' }}>#{i.id}</span></td>
                            <td><strong>{i.mentee_name}</strong></td>
                            <td><span className="badge-chip">{i.category}</span></td>
                            <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {i.title}
                            </td>
                            <td>
                              <span className={`attention-badge-pill ${i.priority === 'High' ? 'high' : 'medium'}`}>
                                {i.priority || 'Medium'}
                              </span>
                            </td>
                            <td>
                              <span className={`trend-badge ${i.status === 'Resolved' ? 'improving' : 'declining'}`}>
                                {i.status}
                              </span>
                            </td>
                            <td>{i.created_at ? new Date(i.created_at).toLocaleDateString() : ''}</td>
                            <td>
                              <Link to={`/mentees/${i.mentee_id}`} className="view-profile-link">
                                <span>Follow up</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 6: Student Profile Completion Report
              ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'completion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="reports-table-card">
                <div className="card-header">
                  <h3>12-Section Dossier Completion Breakdown</h3>
                  <span className="badge-chip">{summary.completion_rate}% Overall Cohort Rate</span>
                </div>

                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th>Submission Status</th>
                        <th>Completion Progress</th>
                        <th>Missing Sections</th>
                        <th>Last Updated</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mentees.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted-text)' }}>
                            No student profile records found.
                          </td>
                        </tr>
                      ) : (
                        mentees.map((m) => (
                          <tr key={m.id}>
                            <td><strong>{m.full_name}</strong></td>
                            <td><span style={{ fontFamily: 'monospace' }}>{m.roll_number}</span></td>
                            <td>
                              <span className={`trend-badge ${m.submitted_at ? 'improving' : 'declining'}`}>
                                {m.submitted_at ? 'Submitted & Complete' : 'Incomplete / Pending'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '80px', height: '6px', background: 'var(--pale-lavender)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${m.completionPct}%`, height: '100%', background: m.completionPct === 100 ? '#166534' : 'var(--cornflower-blue)' }} />
                                </div>
                                <strong style={{ fontSize: '16.5px' }}>{m.completionPct}%</strong>
                              </div>
                            </td>
                            <td>
                              {m.missingSections && m.missingSections.length > 0 ? (
                                <span style={{ color: '#BE123C', fontSize: '16px' }}>
                                  {m.missingSections.join(', ')}
                                </span>
                              ) : (
                                <span style={{ color: '#166534', fontSize: '16px', fontWeight: 600 }}>All Core Sections Filled</span>
                              )}
                            </td>
                            <td>{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}</td>
                            <td>
                              <Link to={`/mentees/${m.id}`} className="view-profile-link">
                                <span>View Dossier</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
