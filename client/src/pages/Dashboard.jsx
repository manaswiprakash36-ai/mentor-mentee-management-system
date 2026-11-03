import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
  Users,
  AlertCircle,
  Link2,
  Camera,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Send,
  X,
  ShieldCheck,
  RefreshCw,
  Building2,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Clock,
  Edit3,
  BadgeCheck,
  CheckCircle2,
  DoorClosed,
  ArrowRight,
} from 'lucide-react';

function getGreetingDetails() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) {
    return {
      salutation: 'Good Morning',
      icon: '☀️',
      tagline: 'Ready to guide, mentor, and inspire your students today.',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      salutation: 'Good Afternoon',
      icon: '🌤️',
      tagline: 'Track student academic progress and review recent submissions.',
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      salutation: 'Good Evening',
      icon: '🌆',
      tagline: 'Review updates, address student issues, and verify achievements.',
    };
  } else {
    return {
      salutation: 'Good Night',
      icon: '🌙',
      tagline: 'Review your mentoring dashboard and wrap up observations for the day.',
    };
  }
}

export default function Dashboard() {
  const { mentor, updateMentorState } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Link Pop-up Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkDepartment, setLinkDepartment] = useState(mentor?.department || 'Computer Science & Engineering');
  const [linkBatch, setLinkBatch] = useState(mentor?.batch || '2024-2028');
  const [linkAcademicYear, setLinkAcademicYear] = useState('2026-27');
  const [linkPurpose, setLinkPurpose] = useState('Mentee Profile, Academic Status & Needs Registration');
  const [linkExpiryDays, setLinkExpiryDays] = useState('30');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [linkError, setLinkError] = useState('');

  const greeting = getGreetingDetails();

  function handleOpenGenerateModal() {
    if (mentor) {
      if (mentor.department) setLinkDepartment(mentor.department);
      if (mentor.batch) setLinkBatch(mentor.batch);
    }
    setLinkError('');
    setShowLinkModal(true);
  }

  async function handleGenerateSubmit(e) {
    if (e) e.preventDefault();
    setGeneratingLink(true);
    setLinkError('');

    try {
      const res = await apiRequest('/form-links', {
        method: 'POST',
        body: JSON.stringify({
          department: linkDepartment,
          batch: linkBatch,
          academic_year: linkAcademicYear,
          purpose: linkPurpose,
          expires_in_days: linkExpiryDays,
        }),
      });

      const fullUrl = `${window.location.origin}/mentee-form/${res.link.token}`;
      setGeneratedLink({
        ...res.link,
        fullUrl,
      });
    } catch (err) {
      setLinkError(err.message || 'Could not generate link');
    } finally {
      setGeneratingLink(false);
    }
  }

  function handleCopyLink(url) {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function handleWhatsAppShare(url) {
    const text = `Dear students,\n\nPlease fill out your official Mentee Profile & Academic Details form using this link:\n${url}\n\nAssigned Mentor: ${mentor?.full_name || 'Manaswi Prakash'}\nThank you!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await apiRequest('/mentor/avatar', {
        method: 'POST',
        body: formData,
      });

      if (res.mentor) {
        updateMentorState(res.mentor);
      }
    } catch (err) {
      alert(err.message || 'Could not upload photo');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await apiRequest('/mentor/dashboard');
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load dashboard information');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = data?.stats || {};

  return (
    <div className="dashboard-page">
      {/* ── 1. Executive Mentor Hero Card (Profile Lockup on Left, Actions on Right) ── */}
      <section className="mentor-welcome-card executive-hero">
        <div className="welcome-left-profile-lockup">
          {/* Avatar with Camera Badge */}
          <div className="mentor-photo-wrapper">
            <div
              className={`mentor-photo-frame ${uploadingAvatar ? 'uploading' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile photo"
            >
              {mentor?.avatar_url ? (
                <img
                  src={mentor.avatar_url}
                  alt={mentor?.full_name || 'Mentor'}
                  className="mentor-photo-img"
                />
              ) : (
                <div className="mentor-photo-fallback">
                  <span className="fallback-initials">
                    {(mentor?.full_name || 'Manaswi Prakash')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                </div>
              )}

              <div className="photo-camera-badge" title="Change Photo">
                <Camera size={13} />
              </div>

              {uploadingAvatar && (
                <div className="photo-upload-overlay">
                  <div className="spinner-small" />
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Unified Greeting, Name & Context Info */}
          <div className="mentor-welcome-text-block">
            <div className="welcome-tag">
              <span className="live-dot" />
              <span className="greeting-pill-text">{greeting.icon} {greeting.salutation}, Mentor!</span>
            </div>

            <h1 className="mentor-welcome-heading">
              Welcome, {mentor?.full_name || 'Manaswi Prakash'}
            </h1>

            <p className="mentor-welcome-sub">
              {mentor?.designation || 'Associate Professor & Mentor Coordinator'} · {mentor?.department || 'Department of Computer Science & Engineering'}
            </p>

            <div className="mentor-meta-pills">
              <span>🚪 <strong>{mentor?.cabin_number || 'Cabin 304, Block-B, 3rd Floor'}</strong></span>
              <span>🎓 <strong>{mentor?.batch || 'Batch 2024–28'}</strong></span>
              <span>🆔 <strong>{mentor?.employee_id || 'CSE-FAC-014'}</strong></span>
            </div>
          </div>
        </div>

        {/* Far Right: Primary Call-to-Action Buttons */}
        <div className="mentor-welcome-actions">
          <button
            className="action-btn-primary"
            onClick={handleOpenGenerateModal}
          >
            <Link2 size={17} />
            <span>Generate Form Link</span>
          </button>
          <button
            className="action-btn-secondary"
            onClick={() => navigate('/mentees')}
          >
            <Users size={17} />
            <span>View Mentees</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="dashboard-alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. The 2 Key Summary Stat Cards: Mentees & Issues ── */}
      <section className="stats-cards-grid two-cards">
        {/* Total Assigned Mentees */}
        <div className="stat-card stat-card-prominent" onClick={() => navigate('/mentees')}>
          <div className="stat-card-inner">
            <div className="stat-icon-wrap teal large">
              <Users size={28} />
            </div>
            <div className="stat-data-col">
              <div className="stat-badge-row">
                <span className="stat-micro-badge">ASSIGNED MENTEE DIRECTORY</span>
              </div>
              <div className="stat-number-row">
                <span className="stat-number">{loading ? '…' : (stats.totalMentees || 0)}</span>
                <span className="stat-number-unit">Students</span>
              </div>
              <p className="stat-card-hint">Total registered mentees under your supervision</p>
            </div>
          </div>
          <div className="stat-footer-bar">
            <span>Browse Full Mentee Directory</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Open Student Issues */}
        <div className="stat-card stat-card-prominent" onClick={() => navigate('/issues')}>
          <div className="stat-card-inner">
            <div className="stat-icon-wrap red large">
              <AlertCircle size={28} />
            </div>
            <div className="stat-data-col">
              <div className="stat-badge-row">
                <span className="stat-micro-badge badge-danger">PENDING ACTION</span>
              </div>
              <div className="stat-number-row">
                <span className="stat-number text-danger">{loading ? '…' : (stats.openIssues || 0)}</span>
                <span className="stat-number-unit text-danger">Open Issues</span>
              </div>
              <p className="stat-card-hint">Academic, course or personal issues needing resolution</p>
            </div>
          </div>
          <div className="stat-footer-bar">
            <span>Inspect & Resolve Issues</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </section>

      {/* ── 3. Structured Faculty Mentor & Office Dossier (Balanced 2-Panel Layout) ── */}
      <section className="panel-card faculty-dossier-card">
        <div className="panel-card-header">
          <div>
            <h3>Faculty Mentor & Office Information</h3>
            <p>Official faculty credentials, cabin location, department affiliation, and communication channels</p>
          </div>
          <button
            className="text-link-btn"
            onClick={() => navigate('/profile')}
          >
            <Edit3 size={15} />
            <span>Edit Profile Details</span>
          </button>
        </div>

        <div className="dossier-two-column-layout">
          {/* Left Column: Office Location, Cabin Showcase & Hours */}
          <div className="dossier-column-left">
            {/* Prominent Cabin Showcase Box */}
            <div className="cabin-showcase-box">
              <div className="showcase-header">
                <div className="showcase-icon-badge">
                  <DoorClosed size={22} />
                </div>
                <div>
                  <span className="showcase-tag">OFFICIAL FACULTY CABIN</span>
                  <h4 className="showcase-cabin-name">{mentor?.cabin_number || 'Cabin 304, Block-B, 3rd Floor'}</h4>
                </div>
              </div>
              <p className="showcase-cabin-sub">
                Official office room for one-on-one student mentoring, confidential academic discussions, and dossier sign-offs.
              </p>
            </div>

            {/* Campus Address Card */}
            <div className="dossier-sub-card">
              <div className="sub-card-icon">
                <MapPin size={18} />
              </div>
              <div className="sub-card-body">
                <span className="sub-card-label">CAMPUS & OFFICE ADDRESS</span>
                <strong className="sub-card-value">
                  {mentor?.address || 'Faculty Block B, Department of Computer Science & Engineering, Academic Campus, Delhi-NCR'}
                </strong>
              </div>
            </div>

            {/* Consultation Hours Card */}
            <div className="dossier-sub-card">
              <div className="sub-card-icon">
                <Clock size={18} />
              </div>
              <div className="sub-card-body">
                <span className="sub-card-label">STUDENT CONSULTATION HOURS</span>
                <strong className="sub-card-value">
                  {mentor?.settings?.consultation_hours || 'Monday – Friday: 02:00 PM – 04:00 PM (Walk-in / By Prior Slot)'}
                </strong>
              </div>
            </div>

            {/* Department & Institution Card */}
            <div className="dossier-sub-card">
              <div className="sub-card-icon">
                <Building2 size={18} />
              </div>
              <div className="sub-card-body">
                <span className="sub-card-label">DEPARTMENT & INSTITUTION</span>
                <strong className="sub-card-value">
                  {mentor?.department || 'Department of Computer Science & Engineering'} · {mentor?.college || 'School of Engineering & Technology'}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Column: Faculty Identity & Contact Channel Specs */}
          <div className="dossier-column-right">
            <div className="specs-list-card">
              <div className="specs-list-header">
                <BadgeCheck size={18} className="text-iris" />
                <span>FACULTY CREDENTIALS & CONTACT CHANNELS</span>
              </div>

              <div className="specs-row">
                <span className="spec-label">Faculty Name</span>
                <strong className="spec-value">{mentor?.full_name || 'Manaswi Prakash'}</strong>
              </div>

              <div className="specs-row">
                <span className="spec-label">Designation</span>
                <strong className="spec-value">{mentor?.designation || 'Associate Professor & Mentor Coordinator'}</strong>
              </div>

              <div className="specs-row">
                <span className="spec-label">Faculty / Employee ID</span>
                <strong className="spec-value spec-badge">{mentor?.employee_id || 'CSE-FAC-014'}</strong>
              </div>

              <div className="specs-row">
                <span className="spec-label">Assigned Batch</span>
                <strong className="spec-value">{mentor?.batch || 'Batch 2024–28'}</strong>
              </div>

              <div className="specs-row">
                <span className="spec-label">Official Email</span>
                <strong className="spec-value text-link-style">{mentor?.email || 'manaswi.prakash@college.edu'}</strong>
              </div>

              <div className="specs-row">
                <span className="spec-label">Contact Phone</span>
                <strong className="spec-value">{mentor?.phone || '+91 98765 43210'}</strong>
              </div>

              <div className="specs-row">
                <span className="spec-label">Mentoring Status</span>
                <div className="status-pill complete">
                  <span>✓ Active & Accepting Submissions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Generate Link Pop-up Modal ────────────────────────────── */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-card modal-card-link-popup" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <div className="modal-icon-badge">
                  <Link2 size={20} />
                </div>
                <div>
                  <h3>Generate Mentee Registration Link</h3>
                  <p className="modal-sub-text">Share a secure link for students to submit their profile & details</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowLinkModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {linkError && (
                <div className="alert-box error mb-3">
                  <AlertCircle size={18} />
                  <span>{linkError}</span>
                </div>
              )}

              {generatedLink ? (
                /* Generated Link View with Copy & WhatsApp */
                <div className="link-success-view">
                  <div className="link-success-banner">
                    <CheckCircle2 size={22} className="text-success" />
                    <div>
                      <strong>Secure Registration Link Ready!</strong>
                      <p>When students submit this form, they will automatically be assigned to your account.</p>
                    </div>
                  </div>

                  <div className="link-display-field-group">
                    <label>Registration Link URL</label>
                    <div className="link-copy-input-wrap">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink.fullUrl}
                        className="link-input-field"
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        type="button"
                        className={`link-copy-btn ${copiedLink ? 'copied' : ''}`}
                        onClick={() => handleCopyLink(generatedLink.fullUrl)}
                      >
                        {copiedLink ? (
                          <>
                            <Check size={16} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Share & Action Buttons */}
                  <div className="modal-share-actions">
                    <button
                      type="button"
                      className="btn-whatsapp-share"
                      onClick={() => handleWhatsAppShare(generatedLink.fullUrl)}
                    >
                      <Send size={16} />
                      <span>Share on WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      className="btn-preview-form"
                      onClick={() => window.open(generatedLink.fullUrl, '_blank')}
                    >
                      <ExternalLink size={16} />
                      <span>Preview Form</span>
                    </button>
                  </div>

                  <div className="link-meta-box">
                    <div className="link-meta-item">
                      <span className="meta-label">Assigned Mentor:</span>
                      <strong>{mentor?.full_name || 'Manaswi Prakash'}</strong>
                    </div>
                    <div className="link-meta-item">
                      <span className="meta-label">Batch:</span>
                      <strong>{generatedLink.batch || linkBatch || 'All Batches'}</strong>
                    </div>
                    <div className="link-meta-item">
                      <span className="meta-label">Department:</span>
                      <strong>{generatedLink.department || linkDepartment || 'Computer Science'}</strong>
                    </div>
                    <div className="link-meta-item">
                      <span className="meta-label">Validity:</span>
                      <span className="validity-badge">Active (30 Days)</span>
                    </div>
                  </div>

                  <div className="modal-actions-row mt-4">
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => setGeneratedLink(null)}
                    >
                      <RefreshCw size={14} />
                      <span>Generate Another Link</span>
                    </button>
                    <button
                      type="button"
                      className="action-btn-primary"
                      onClick={() => setShowLinkModal(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Link Configuration Form */
                <form onSubmit={handleGenerateSubmit} className="link-config-form">
                  <div className="form-grid-2">
                    <div className="form-field-group">
                      <label>Target Department *</label>
                      <input
                        type="text"
                        value={linkDepartment}
                        onChange={(e) => setLinkDepartment(e.target.value)}
                        placeholder="e.g. Computer Science & Engineering"
                        required
                      />
                    </div>

                    <div className="form-field-group">
                      <label>Academic Batch *</label>
                      <input
                        type="text"
                        value={linkBatch}
                        onChange={(e) => setLinkBatch(e.target.value)}
                        placeholder="e.g. 2024-2028 or 2023-27"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2 mt-3">
                    <div className="form-field-group">
                      <label>Academic Year</label>
                      <input
                        type="text"
                        value={linkAcademicYear}
                        onChange={(e) => setLinkAcademicYear(e.target.value)}
                        placeholder="e.g. 2026-27"
                        required
                      />
                    </div>

                    <div className="form-field-group">
                      <label>Link Expiration</label>
                      <select
                        value={linkExpiryDays}
                        onChange={(e) => setLinkExpiryDays(e.target.value)}
                      >
                        <option value="7">7 Days</option>
                        <option value="15">15 Days</option>
                        <option value="30">30 Days (Recommended)</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field-group mt-3">
                    <label>Form Purpose / Title</label>
                    <input
                      type="text"
                      value={linkPurpose}
                      onChange={(e) => setLinkPurpose(e.target.value)}
                      placeholder="e.g. Mentee Profile & Academic Details Submission"
                      required
                    />
                  </div>

                  <div className="modal-security-notice mt-3">
                    <ShieldCheck size={18} className="text-teal" />
                    <span>Every student submission through this link is cryptographically verified and registered directly under your mentoring account.</span>
                  </div>

                  <div className="modal-actions-row mt-4">
                    <button
                      type="button"
                      className="action-btn-secondary text-dark"
                      onClick={() => setShowLinkModal(false)}
                      disabled={generatingLink}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="action-btn-primary"
                      disabled={generatingLink}
                    >
                      <Link2 size={16} />
                      <span>{generatingLink ? 'Generating Link…' : 'Generate Registration Link'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

