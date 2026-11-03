import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  AlertCircle,
  FileCheck2,
  Clock,
  Printer,
  Check,
  X,
  ExternalLink,
  Plus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Building,
  Sparkles,
  Users,
  Camera,
  BookOpen,
  Eye,
  School,
  FileCheck,
  CheckCircle2,
  Percent,
  Bookmark,
  Layers,
} from 'lucide-react';

export default function MenteeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('sec-personal');

  // Mentoring Note State
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState('General');
  const [savingNote, setSavingNote] = useState(false);

  // Lightbox preview for photos
  const [lightbox, setLightbox] = useState(null); // { url, caption }
  const [deletingMentee, setDeletingMentee] = useState(false);

  async function loadMentee() {
    try {
      setLoading(true);
      const res = await apiRequest(`/mentees/${id}`);
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load student profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMentee();
  }, [id]);

  // Scrollspy to highlight active jump pill
  useEffect(() => {
    function handleScroll() {
      const sections = [
        'sec-personal',
        'sec-address',
        'sec-family',
        'sec-school',
        'sec-college',
        'sec-attendance',
        'sec-results',
        'sec-notes',
      ];

      const scrollPos = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToSection(sectionId) {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setSavingNote(true);
    try {
      const res = await apiRequest(`/mentees/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          title: newNoteTitle || 'Mentoring Observation',
          content: newNoteContent.trim(),
          note_type: newNoteType,
        }),
      });

      setData((prev) => ({
        ...prev,
        mentor_notes: [res.note, ...(prev.mentor_notes || [])],
      }));
      setNewNoteTitle('');
      setNewNoteContent('');
    } catch (err) {
      alert(err.message || 'Could not save note');
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId) {
    if (!window.confirm('Delete this mentoring observation?')) return;
    try {
      await apiRequest(`/mentees/${id}/notes/${noteId}`, { method: 'DELETE' });
      setData((prev) => ({
        ...prev,
        mentor_notes: prev.mentor_notes.filter((n) => n.id !== noteId),
      }));
    } catch (err) {
      alert(err.message || 'Could not delete note');
    }
  }

  async function handleDeleteMentee() {
    if (!mentee) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove ${mentee.full_name} (${mentee.roll_number}) from your mentoring roster?\n\nThis will permanently delete this student and their submitted profile dossier.`
    );
    if (!confirmed) return;

    setDeletingMentee(true);
    try {
      await apiRequest(`/mentees/${id}`, { method: 'DELETE' });
      alert(`Mentee ${mentee.full_name} was removed successfully.`);
      navigate('/mentees');
    } catch (err) {
      alert(err.message || 'Could not remove mentee record.');
      setDeletingMentee(false);
    }
  }

  if (loading) {
    return (
      <div className="panel-card p-5 text-center" style={{ padding: '80px 20px' }}>
        <div className="spinner-border mb-3" />
        <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700 }}>Loading Student Dossier…</h4>
        <p style={{ color: 'var(--slate-blue)', fontSize: '17.5px' }}>
          Retrieving verified personal, academic, attendance, and mentoring records.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert-box error m-5">
        <AlertTriangle size={20} />
        <div>
          <strong>Error Loading Student</strong>
          <p>{error || 'Student record not found.'}</p>
          <button className="btn-secondary mt-2" onClick={() => navigate('/mentees')}>
            Back to Mentees Directory
          </button>
        </div>
      </div>
    );
  }

  const {
    mentee,
    profile,
    achievements = [],
    academic_results = [],
    issues = [],
    mentor_notes = [],
    university_suggestions = null,
  } = data;

  // Parse previous SGPAs if JSON array
  let parsedPreviousSgpas = [];
  try {
    if (profile?.previous_sgpas) {
      parsedPreviousSgpas = typeof profile.previous_sgpas === 'string'
        ? JSON.parse(profile.previous_sgpas)
        : profile.previous_sgpas;
    }
  } catch (e) {
    parsedPreviousSgpas = [];
  }

  const attendancePct = profile?.attendance_percentage != null
    ? Number(profile.attendance_percentage)
    : null;

  const studentSemester = mentee?.semester || profile?.attendance_semester;
  const semLabel = studentSemester ? (
    Number(studentSemester) === 1 ? '1st Semester' :
    Number(studentSemester) === 2 ? '2nd Semester' :
    Number(studentSemester) === 3 ? '3rd Semester' :
    `${studentSemester}th Semester`
  ) : 'Semester';
  const backSemesterUrl = studentSemester ? `/mentees?semester=${studentSemester}` : '/mentees';

  return (
    <div className="mentee-detail-page">
      {/* ── Top Navigation & Breadcrumbs Bar ── */}
      <div className="detail-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button className="btn-back" onClick={() => navigate(backSemesterUrl)}>
            <ArrowLeft size={16} />
            <span>Back to {semLabel}</span>
          </button>

          <div className="mentee-breadcrumbs" style={{ margin: 0, padding: 0 }}>
            <span className="breadcrumb-item link" onClick={() => navigate('/mentees')}>
              My Mentees
            </span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item link" onClick={() => navigate(backSemesterUrl)}>
              {semLabel}
            </span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item current">{mentee.full_name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {profile?.submission_reference && (
            <span className="submission-ref-pill">
              <FileCheck size={14} />
              Ref: {profile.submission_reference}
            </span>
          )}
          <button className="btn-print" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Print Student Dossier</span>
          </button>
          <button
            className="btn-danger"
            onClick={handleDeleteMentee}
            disabled={deletingMentee}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              background: '#dc2626',
              color: '#FFFFFF',
              border: '1px solid #b91c1c',
              cursor: 'pointer',
            }}
            title="Remove mentee from your roster"
          >
            <Trash2 size={15} />
            <span>{deletingMentee ? 'Removing…' : 'Remove Mentee'}</span>
          </button>
        </div>
      </div>

      {/* ── Hero Dossier Card ── */}
      <div className="mentee-hero-card">
        <div className="hero-left">
          {profile?.student_photo_url ? (
            <img
              src={profile.student_photo_url}
              alt={mentee.full_name}
              className="hero-avatar-img"
              title="Click to view full photograph"
              onClick={() =>
                setLightbox({
                  url: profile.student_photo_url,
                  caption: `${mentee.full_name} — Student Photograph`,
                })
              }
            />
          ) : (
            <div className="hero-avatar">
              {(mentee.full_name || 'M').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="hero-info">
            <div className="hero-badges-row">
              <span className="hero-roll-badge">Roll: {mentee.roll_number}</span>
              {mentee.university_roll_number && (
                <span className="hero-roll-badge">Univ: {mentee.university_roll_number}</span>
              )}
              <span
                className={`status-pill ${
                  mentee.profile_status === 'Complete' ? 'complete' : 'pending'
                }`}
              >
                {mentee.profile_status === 'Complete'
                  ? '✓ Profile Submitted'
                  : '⏳ Incomplete Profile'}
              </span>
              {Boolean(profile?.has_backlogs || Number(profile?.total_backlogs) > 0) && (
                <span className="status-pill danger">
                  ⚠️ {profile.total_backlogs || 'Active'} Backlog
                </span>
              )}
            </div>

            <h2>{mentee.full_name}</h2>

            <div className="hero-meta-row">
              <span>📚 {mentee.course ? `${mentee.course} (${mentee.department})` : mentee.department}</span>
              <span>🎓 Semester {mentee.semester || '—'} {mentee.section ? `(Sec ${mentee.section})` : ''}</span>
              <span>🏫 {mentee.college_name || 'Academic Campus'}</span>
              <span>✉️ {mentee.email}</span>
              {mentee.phone && <span>📞 {mentee.phone}</span>}
            </div>
          </div>
        </div>

        {/* Quick Academic KPI chips */}
        <div className="hero-kpis">
          <div className="kpi-box">
            <span className="kpi-label">CUMULATIVE CGPA</span>
            <strong
              className={`kpi-val ${
                profile?.current_cgpa && profile?.current_cgpa < 6.0 ? 'text-danger' : ''
              }`}
            >
              {profile?.current_cgpa ? Number(profile.current_cgpa).toFixed(2) : '—'}
            </strong>
          </div>

          <div className="kpi-box">
            <span className="kpi-label">CURRENT SGPA</span>
            <strong className="kpi-val">
              {profile?.current_sgpa ? Number(profile.current_sgpa).toFixed(2) : '—'}
            </strong>
          </div>

          <div className="kpi-box">
            <span className="kpi-label">ATTENDANCE</span>
            <strong
              className={`kpi-val ${
                attendancePct != null && attendancePct < 75
                  ? attendancePct < 65
                    ? 'text-danger'
                    : 'text-warning'
                  : 'text-success'
              }`}
            >
              {attendancePct != null ? `${attendancePct}%` : '—'}
            </strong>
          </div>

          <div className="kpi-box">
            <span className="kpi-label">BACKLOGS</span>
            <strong
              className={`kpi-val ${
                profile?.has_backlogs || Number(profile?.total_backlogs) > 0
                  ? 'text-danger'
                  : 'text-success'
              }`}
            >
              {profile?.has_backlogs ? profile.total_backlogs || 1 : 0}
            </strong>
          </div>
        </div>
      </div>

      {/* ── Sticky Quick-Jump Section Navigation Bar ── */}
      <div className="section-jump-bar">
        <span className="jump-bar-label">
          <Layers size={15} />
          <span>Jump to:</span>
        </span>
        <div className="jump-pills-wrap">
          <button
            className={`jump-pill ${activeSection === 'sec-personal' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-personal')}
          >
            Personal
          </button>
          <button
            className={`jump-pill ${activeSection === 'sec-address' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-address')}
          >
            Address
          </button>
          <button
            className={`jump-pill ${activeSection === 'sec-family' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-family')}
          >
            Family
          </button>
          <button
            className={`jump-pill ${activeSection === 'sec-school' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-school')}
          >
            School (10th/12th)
          </button>
          <button
            className={`jump-pill ${activeSection === 'sec-college' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-college')}
          >
            College
          </button>
          <button
            className={`jump-pill ${activeSection === 'sec-attendance' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-attendance')}
          >
            Attendance
          </button>
          <button
            className={`jump-pill ${activeSection === 'sec-results' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-results')}
          >
            Results ({academic_results.length})
          </button>
          <button
            className={`jump-pill ${activeSection === 'sec-notes' ? 'active' : ''}`}
            onClick={() => scrollToSection('sec-notes')}
          >
            Mentor Notes ({mentor_notes.length})
          </button>
        </div>
      </div>

      {/* ── Continuous Vertical Section Stack ── */}
      <div className="dossier-vertical-stack">
        {/* ═════════════════════════════════════════════════════════════
            SECTION 1: Personal & Identification Details
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-personal" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <User size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 1 — Personal & Identification Details</h3>
                <p>Basic identity, enrollment numbers, institutional affiliation, and contact coordinates</p>
              </div>
            </div>
            <span className="badge-chip">Core Identity</span>
          </div>

          {/* Student Photograph Showcase directly above Student Details */}
          <div className="student-photo-banner">
            <div className="student-photo-frame">
              {profile?.student_photo_url ? (
                <div
                  className="student-photo-thumb-wrap"
                  onClick={() =>
                    setLightbox({
                      url: profile.student_photo_url,
                      caption: `${mentee.full_name} — Student Official Photograph`,
                    })
                  }
                  title="Click to view full-size photograph"
                >
                  <img src={profile.student_photo_url} alt={mentee.full_name} />
                  <div className="photo-zoom-badge">
                    <Eye size={12} />
                    <span>View</span>
                  </div>
                </div>
              ) : (
                <div className="student-photo-placeholder">
                  <Camera size={26} />
                  <span>Photo Not Uploaded</span>
                </div>
              )}
            </div>
            <div className="student-photo-meta">
              <div className="student-photo-tag">STUDENT PHOTOGRAPH & IDENTITY</div>
              <h4 className="student-photo-name">{mentee.full_name}</h4>
              <p className="student-photo-sub">
                <span>Roll No: <strong>{mentee.roll_number}</strong></span>
                {mentee.department && <span> • Dept: <strong>{mentee.department}</strong></span>}
                {mentee.semester && <span> • Semester: <strong>{mentee.semester}</strong></span>}
              </p>
              <span className="photo-hint-pill">
                <Camera size={13} />
                {profile?.student_photo_url ? 'Click photo thumbnail to view enlarged' : 'Awaiting student photograph upload'}
              </span>
            </div>
          </div>

          <div className="dossier-info-grid">
            <div className="dossier-field">
              <span className="dossier-label">Full Student Name:</span>
              <span className="dossier-value">{mentee.full_name}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Enrollment / Roll Number:</span>
              <span className="dossier-value" style={{ fontFamily: 'monospace' }}>
                {mentee.roll_number}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">University Roll Number:</span>
              <span className="dossier-value" style={{ fontFamily: 'monospace' }}>
                {mentee.university_roll_number || mentee.roll_number}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Admission / Register Number:</span>
              <span className="dossier-value" style={{ fontFamily: 'monospace' }}>
                {mentee.admission_number || profile?.enrollment_number || '—'}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Registered Student Email:</span>
              <span className="dossier-value">{mentee.email}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Primary Mobile Phone:</span>
              <span className="dossier-value">{profile?.phone || mentee.phone || '—'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Alternate Contact Phone:</span>
              <span className="dossier-value">{profile?.alt_phone || '—'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Date of Birth:</span>
              <span className="dossier-value">
                {profile?.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString()
                  : '—'}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Gender:</span>
              <span className="dossier-value">{mentee.gender || '—'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Blood Group:</span>
              <span className="dossier-value">{profile?.blood_group || '—'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Department / Branch:</span>
              <span className="dossier-value">{mentee.department}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Course Degree & Section:</span>
              <span className="dossier-value">
                {mentee.course ? `${mentee.course} ` : ''}
                {mentee.section ? `(Section ${mentee.section})` : ''}
              </span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 2: Residential & Permanent Address
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-address" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <MapPin size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 2 — Residential & Permanent Address</h3>
                <p>Present communication address, hometown district, state, and permanent residence records</p>
              </div>
            </div>
            <span className="badge-chip">Address Records</span>
          </div>

          <div className="dossier-info-grid">
            <div className="dossier-field col-span-2">
              <span className="dossier-label">Present Communication Address:</span>
              <span className="dossier-value">
                {[profile?.house_no, profile?.street, profile?.locality, profile?.address]
                  .filter(Boolean)
                  .join(', ') || 'Not specified'}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">City / Town:</span>
              <span className="dossier-value">{profile?.city || '—'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">District:</span>
              <span className="dossier-value">{profile?.district || '—'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">State / Province:</span>
              <span className="dossier-value">{profile?.state || '—'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Postal PIN Code:</span>
              <span className="dossier-value" style={{ fontFamily: 'monospace' }}>
                {profile?.pincode || '—'}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Country:</span>
              <span className="dossier-value">{profile?.country || 'India'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Permanent Residence Status:</span>
              <span className="dossier-value">
                {profile?.is_permanent_same !== false
                  ? '✓ Same as Present Communication Address'
                  : profile?.permanent_address || 'Different Address on file'}
              </span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 3: Family Information & Guardian Contacts
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-family" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <Users size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 3 — Family Information & Emergency Contacts</h3>
                <p>Parents' occupations, verified contact numbers, and local guardian details</p>
              </div>
            </div>
            <span className="badge-chip">Guardian Coordination</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Father Card */}
            <div className="dossier-sub-card parent-profile-card">
              <div className="dossier-sub-card-title">
                <User size={16} />
                <span>Father's Credentials</span>
              </div>

              {/* Father Photograph directly above Father details */}
              <div className="parent-photo-container">
                {profile?.father_photo_url ? (
                  <div
                    className="parent-photo-thumb-wrap"
                    onClick={() =>
                      setLightbox({
                        url: profile.father_photo_url,
                        caption: `Father — ${profile?.father_name || profile?.parent_name || 'Father'}`,
                      })
                    }
                    title="Click to view full-size photograph"
                  >
                    <img src={profile.father_photo_url} alt="Father" />
                    <div className="photo-zoom-badge">
                      <Eye size={12} />
                      <span>View</span>
                    </div>
                  </div>
                ) : (
                  <div className="parent-photo-placeholder">
                    <Camera size={22} />
                    <span>Photo Not Uploaded</span>
                  </div>
                )}
                <div className="parent-photo-label-col">
                  <span className="parent-photo-chip">FATHER'S PHOTOGRAPH</span>
                  <strong>{profile?.father_name || profile?.parent_name || 'Name Not Provided'}</strong>
                  <small>{profile?.father_occupation || 'Occupation Not Specified'}</small>
                </div>
              </div>

              <div className="dossier-field">
                <span className="dossier-label">Father's Full Name:</span>
                <span className="dossier-value">{profile?.father_name || profile?.parent_name || '—'}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Occupation / Profession:</span>
                <span className="dossier-value">{profile?.father_occupation || '—'}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Mobile Phone Number:</span>
                <span className="dossier-value">{profile?.father_phone || profile?.parent_phone || '—'}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Email Address:</span>
                <span className="dossier-value">{profile?.father_email || '—'}</span>
              </div>
            </div>

            {/* Mother Card */}
            <div className="dossier-sub-card parent-profile-card">
              <div className="dossier-sub-card-title">
                <User size={16} />
                <span>Mother's Credentials</span>
              </div>

              {/* Mother Photograph directly above Mother details */}
              <div className="parent-photo-container">
                {profile?.mother_photo_url ? (
                  <div
                    className="parent-photo-thumb-wrap"
                    onClick={() =>
                      setLightbox({
                        url: profile.mother_photo_url,
                        caption: `Mother — ${profile?.mother_name || 'Mother'}`,
                      })
                    }
                    title="Click to view full-size photograph"
                  >
                    <img src={profile.mother_photo_url} alt="Mother" />
                    <div className="photo-zoom-badge">
                      <Eye size={12} />
                      <span>View</span>
                    </div>
                  </div>
                ) : (
                  <div className="parent-photo-placeholder">
                    <Camera size={22} />
                    <span>Photo Not Uploaded</span>
                  </div>
                )}
                <div className="parent-photo-label-col">
                  <span className="parent-photo-chip">MOTHER'S PHOTOGRAPH</span>
                  <strong>{profile?.mother_name || 'Name Not Provided'}</strong>
                  <small>{profile?.mother_occupation || 'Occupation Not Specified'}</small>
                </div>
              </div>

              <div className="dossier-field">
                <span className="dossier-label">Mother's Full Name:</span>
                <span className="dossier-value">{profile?.mother_name || '—'}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Occupation / Profession:</span>
                <span className="dossier-value">{profile?.mother_occupation || '—'}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Mobile Phone Number:</span>
                <span className="dossier-value">{profile?.mother_phone || '—'}</span>
              </div>
              <div className="dossier-field">
                <span className="dossier-label">Email Address:</span>
                <span className="dossier-value">{profile?.mother_email || '—'}</span>
              </div>
            </div>

            {/* Guardian Card (if provided) */}
            {profile?.guardian_name && (
              <div className="dossier-sub-card">
                <div className="dossier-sub-card-title">
                  <User size={16} />
                  <span>Local Guardian Details</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Guardian Name:</span>
                  <span className="dossier-value">{profile.guardian_name}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Relationship:</span>
                  <span className="dossier-value">{profile.guardian_relationship || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Contact Phone:</span>
                  <span className="dossier-value">{profile.guardian_phone || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Occupation:</span>
                  <span className="dossier-value">{profile.guardian_occupation || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 4: School Academic History (Class 10th & 12th)
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-school" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <School size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 4 — School Academic History (Class 10th & 12th)</h3>
                <p>Secondary and senior secondary board qualifications, percentages, and marksheet documents</p>
              </div>
            </div>
            <span className="badge-chip">Prior Academic Records</span>
          </div>

          <div className="acad-qual-grid">
            {/* Class 10th Record */}
            <div className="acad-qual-card">
              <div className="acad-qual-header">
                <h5>
                  <BookOpen size={18} color="var(--iris-bloom)" />
                  <span>Class 10th (Secondary School)</span>
                </h5>
                {profile?.tenth_percentage && (
                  <span className="acad-badge-score">{profile.tenth_percentage}%</span>
                )}
              </div>

              <div className="dossier-info-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Board Name:</span>
                  <span className="dossier-value">{profile?.tenth_board_name || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Board Type:</span>
                  <span className="dossier-value">{profile?.tenth_board_type || '—'}</span>
                </div>
                <div className="dossier-field col-span-2">
                  <span className="dossier-label">School / Institution:</span>
                  <span className="dossier-value">{profile?.tenth_school_name || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Year of Passing:</span>
                  <span className="dossier-value">{profile?.tenth_year_of_passing || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Marks Scored / Max:</span>
                  <span className="dossier-value">
                    {profile?.tenth_marks_obtained != null
                      ? `${profile.tenth_marks_obtained} / ${profile.tenth_max_marks || 500}`
                      : '—'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">CGPA / Grade:</span>
                  <span className="dossier-value">{profile?.tenth_cgpa_grade || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Official Marksheet:</span>
                  {profile?.tenth_marksheet_url ? (
                    <a
                      href={profile.tenth_marksheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-proof-view"
                    >
                      <ExternalLink size={14} />
                      <span>View Marksheet</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: '17px', color: 'var(--muted-text)' }}>Not attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* Class 12th Record */}
            <div className="acad-qual-card">
              <div className="acad-qual-header">
                <h5>
                  <GraduationCap size={18} color="var(--cornflower-blue)" />
                  <span>Class 12th / Senior Secondary</span>
                </h5>
                {profile?.twelfth_percentage && (
                  <span className="acad-badge-score">{profile.twelfth_percentage}%</span>
                )}
              </div>

              <div className="dossier-info-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Board Name:</span>
                  <span className="dossier-value">{profile?.twelfth_board_name || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Board Type:</span>
                  <span className="dossier-value">{profile?.twelfth_board_type || '—'}</span>
                </div>
                <div className="dossier-field col-span-2">
                  <span className="dossier-label">School / Junior College:</span>
                  <span className="dossier-value">{profile?.twelfth_school_name || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Stream / Specialization:</span>
                  <span className="dossier-value">{profile?.twelfth_stream || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Year of Passing:</span>
                  <span className="dossier-value">{profile?.twelfth_year_of_passing || '—'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">Marks Scored / Max:</span>
                  <span className="dossier-value">
                    {profile?.twelfth_marks_obtained != null
                      ? `${profile.twelfth_marks_obtained} / ${profile.twelfth_max_marks || 500}`
                      : '—'}
                  </span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-label">CGPA / Grade:</span>
                  <span className="dossier-value">{profile?.twelfth_cgpa_grade || '—'}</span>
                </div>
                <div className="dossier-field col-span-2">
                  <span className="dossier-label">Official Marksheet:</span>
                  {profile?.twelfth_marksheet_url ? (
                    <a
                      href={profile.twelfth_marksheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-proof-view"
                    >
                      <ExternalLink size={14} />
                      <span>View Marksheet</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: '17px', color: 'var(--muted-text)' }}>Not attached</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 6: Current College Academic Standing
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-college" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <GraduationCap size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 5 — College Academic Standing & Targets</h3>
                <p>Degree progress, semester-wise SGPAs, backlog audits, and student self-assessment</p>
              </div>
            </div>
            <span className="badge-chip">Grading Scale: 10.0</span>
          </div>

          <div className="dossier-info-grid">
            <div className="dossier-field">
              <span className="dossier-label">Enrolled Institution:</span>
              <span className="dossier-value">{mentee.college_name || 'Academic Campus'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Degree Course:</span>
              <span className="dossier-value">{mentee.course || 'Bachelor of Technology'}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Department / Branch:</span>
              <span className="dossier-value">{mentee.department}</span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Semester & Section:</span>
              <span className="dossier-value">
                Semester {mentee.semester || '—'} {mentee.section ? `(Section ${mentee.section})` : ''}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Cumulative CGPA:</span>
              <span className="dossier-value" style={{ fontSize: '22px', color: 'var(--iris-bloom)' }}>
                {profile?.current_cgpa ? Number(profile.current_cgpa).toFixed(2) : '—'}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Latest Semester SGPA:</span>
              <span className="dossier-value" style={{ fontSize: '22px', color: 'var(--deep-violet-ink)' }}>
                {profile?.current_sgpa ? Number(profile.current_sgpa).toFixed(2) : '—'}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Active Backlogs Status:</span>
              <span
                className="dossier-value"
                style={{
                  color: profile?.has_backlogs || Number(profile?.total_backlogs) > 0 ? '#BE123C' : '#166534',
                }}
              >
                {profile?.has_backlogs ? `⚠️ Yes (${profile.total_backlogs || 1} Active Backlogs)` : '✓ All Clear (Zero Backlogs)'}
              </span>
            </div>

            <div className="dossier-field">
              <span className="dossier-label">Academic Year Cohort:</span>
              <span className="dossier-value">{mentee.academic_year || '2026-27'}</span>
            </div>
          </div>

          {/* Historical SGPA Grid */}
          {parsedPreviousSgpas.length > 0 && (
            <div className="dossier-sub-card mt-2">
              <div className="dossier-sub-card-title">
                <Bookmark size={16} />
                <span>Semester-wise Historical SGPA Progression</span>
              </div>
              <div className="sgpa-history-grid">
                {parsedPreviousSgpas.map((item, idx) => (
                  <div key={idx} className="sgpa-chip">
                    <span className="sgpa-chip-label">Semester {item.semester}</span>
                    <span className="sgpa-chip-val">{item.sgpa || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Self-Reflection */}
          <div className="dossier-sub-card mt-2">
            <div className="dossier-sub-card-title">
              <Sparkles size={16} />
              <span>Student Self-Assessment & Support Needs</span>
            </div>
            <div className="dossier-info-grid">
              <div className="dossier-field col-span-2">
                <span className="dossier-label">Academic Strengths:</span>
                <span className="dossier-value">{profile?.academic_strengths || 'Not specified'}</span>
              </div>
              <div className="dossier-field col-span-2">
                <span className="dossier-label">Subjects Requiring Focused Faculty Guidance:</span>
                <span className="dossier-value">
                  {profile?.subjects_requiring_improvement || profile?.support_needed || 'No urgent subjects flagged.'}
                </span>
              </div>
              <div className="dossier-field col-span-2">
                <span className="dossier-label">Career Targets & Goals:</span>
                <span className="dossier-value">{profile?.academic_goals || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 7: Attendance Analytics & Campus Engagement
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-attendance" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <Percent size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 6 — Attendance Analytics & Compliance</h3>
                <p>Overall classroom presence benchmarked against institutional 75% threshold</p>
              </div>
            </div>
            <span className="badge-chip">Attendance Audit</span>
          </div>

          <div className="attendance-stats-row">
            <div
              className={`attendance-gauge ${
                attendancePct != null && attendancePct < 75
                  ? attendancePct < 65
                    ? 'danger'
                    : 'warning'
                  : ''
              }`}
            >
              <span className="attendance-gauge-num">
                {attendancePct != null ? `${attendancePct}%` : '—'}
              </span>
              <span className="attendance-gauge-lbl">Attendance</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="dossier-info-grid">
                <div className="dossier-field">
                  <span className="dossier-label">Audited Semester:</span>
                  <span className="dossier-value">
                    Semester {profile?.attendance_semester || mentee.semester || 'Current'}
                  </span>
                </div>

                <div className="dossier-field">
                  <span className="dossier-label">Compliance Status:</span>
                  <span
                    className="dossier-value"
                    style={{
                      color:
                        attendancePct != null && attendancePct < 75 ? '#BE123C' : '#166534',
                    }}
                  >
                    {attendancePct != null
                      ? attendancePct >= 75
                        ? '✓ Satisfies University 75% Examination Requirement'
                        : '⚠️ Under 75% Mandatory Threshold (Requires Counseling)'
                      : 'Pending Submission'}
                  </span>
                </div>

                {profile?.total_classes_conducted && (
                  <div className="dossier-field">
                    <span className="dossier-label">Classes Attended:</span>
                    <span className="dossier-value">
                      {profile.classes_attended || 0} / {profile.total_classes_conducted} conducted
                    </span>
                  </div>
                )}

                {profile?.subject_wise_attendance && (
                  <div className="dossier-field col-span-2">
                    <span className="dossier-label">Subject-Wise Breakdown:</span>
                    <span className="dossier-value">{profile.subject_wise_attendance}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 8: Official Examination Results & Marksheets
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-results" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <FileText size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 7 — Official Semester Results & Marksheets ({academic_results.length})</h3>
                <p>End-semester examination transcripts, SGPA reports, and verifiable marksheets</p>
              </div>
            </div>
            <span className="badge-chip">Academic Proofs</span>
          </div>

          {academic_results.length === 0 ? (
            <div className="dossier-empty-state">
              <FileText size={32} color="var(--slate-blue)" />
              <strong>No Examination Results Uploaded Yet</strong>
              <p>The student has not yet attached official semester marksheets or results.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>EXAMINATION</th>
                    <th>SEMESTER</th>
                    <th>ACADEMIC YEAR</th>
                    <th>MARKS OBTAINED</th>
                    <th>PERCENTAGE</th>
                    <th>SGPA / CGPA</th>
                    <th>RESULT STATUS</th>
                    <th>MARKSHEET</th>
                  </tr>
                </thead>
                <tbody>
                  {academic_results.map((res) => (
                    <tr key={res.id}>
                      <td>
                        <strong>{res.examination_name}</strong>
                        {res.exam_type && (
                          <span className="text-muted-tiny block">Type: {res.exam_type}</span>
                        )}
                      </td>
                      <td>Semester {res.semester || '—'}</td>
                      <td>{res.academic_year || '—'}</td>
                      <td>
                        {res.marks_obtained != null
                          ? `${res.marks_obtained} / ${res.max_marks || 100}`
                          : '—'}
                      </td>
                      <td>{res.percentage != null ? `${res.percentage}%` : '—'}</td>
                      <td>
                        <strong>{res.sgpa || res.cgpa || '—'}</strong>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            res.result_status === 'Pass' ? 'complete' : 'danger'
                          }`}
                        >
                          {res.result_status}
                        </span>
                      </td>
                      <td>
                        {res.document_url ? (
                          <a
                            href={res.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-proof-view"
                          >
                            <ExternalLink size={14} />
                            <span>View Marksheet</span>
                          </a>
                        ) : (
                          <span className="text-muted-tiny">Not attached</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 12: Confidential Faculty Mentoring Notes
            ═════════════════════════════════════════════════════════════ */}
        <section id="sec-notes" className="dossier-section-card">
          <div className="dossier-section-header">
            <div className="dossier-header-left">
              <div className="dossier-icon-bubble">
                <FileCheck2 size={20} />
              </div>
              <div className="dossier-header-title">
                <h3>Section 8 — Confidential Faculty Mentoring Observations ({mentor_notes.length})</h3>
                <p>Private observations, action items, and meeting notes visible only to you</p>
              </div>
            </div>
            <span className="badge-chip" style={{ background: '#FEF3C7', color: '#92400E' }}>
              🔒 Private to Mentor
            </span>
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="add-note-card">
            <h4>Add New Mentoring Note or 1-on-1 Observation</h4>
            <div className="form-grid-2">
              <div className="form-group mb-2">
                <label>Observation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm 1-on-1 Academic Counseling"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
              </div>
              <div className="form-group mb-2">
                <label>Note Category</label>
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value)}
                >
                  <option value="General">General Observation</option>
                  <option value="Academic Review">Academic Standing Review</option>
                  <option value="Behavioral">Behavioral / Attendance</option>
                  <option value="Action Item">Action Item / Follow-up</option>
                  <option value="Career Guidance">Career / Placement Guidance</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Confidential Notes & Follow-up Actions *</label>
              <textarea
                required
                rows={3}
                placeholder="Record discussions, student strengths, weaknesses, follow-up actions agreed upon…"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={savingNote}
            >
              <Plus size={16} />
              <span>{savingNote ? 'Saving Observation…' : 'Save Confidential Note'}</span>
            </button>
          </form>

          {/* Notes Timeline */}
          <div className="notes-timeline">
            {mentor_notes.length === 0 ? (
              <p className="text-muted text-center py-4">
                No mentoring observations recorded yet for this student. Add your first note above.
              </p>
            ) : (
              mentor_notes.map((n) => (
                <div key={n.id} className="note-timeline-item">
                  <div className="note-item-header">
                    <div>
                      <span className="note-type-pill">{n.note_type}</span>
                      <strong>{n.title}</strong>
                    </div>
                    <div className="note-actions">
                      <span className="note-date">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      <button
                        className="btn-icon-sub text-danger"
                        title="Delete note"
                        onClick={() => handleDeleteNote(n.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="note-content">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </section>

              </div>

      {/* ── Lightbox Modal for Photo Enlarge ── */}
      {lightbox && (
        <div className="lightbox-backdrop" onClick={() => setLightbox(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setLightbox(null)}>
              <X size={20} />
            </button>
            <img src={lightbox.url} alt={lightbox.caption} />
            <div className="lightbox-caption">{lightbox.caption}</div>
          </div>
        </div>
      )}
    </div>
  );
}
