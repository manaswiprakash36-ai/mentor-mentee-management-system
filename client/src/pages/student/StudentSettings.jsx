import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Check,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export default function StudentSettings() {
  const { updateStudentState } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── Password Change State ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState({ type: '', message: '' });

  // ── Contact Settings State ──
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactToast, setContactToast] = useState({ type: '', message: '' });

  // Fetch initial student data & settings
  async function loadSettings() {
    try {
      setLoading(true);
      const res = await apiRequest('/student/settings');
      if (res && res.student) {
        setStudentData(res.student);
        setEmail(res.student.email || '');
        setPhone(res.student.phone || '');
        setLoadError('');
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load student settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle Password Change Submission
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordToast({ type: '', message: '' });

    if (!currentPassword || !newPassword) {
      setPasswordToast({ type: 'error', message: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordToast({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordToast({ type: 'error', message: 'New password and confirmation password do not match.' });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordToast({ type: 'error', message: 'New password cannot be the same as your current password.' });
      return;
    }

    try {
      setChangingPassword(true);
      const res = await apiRequest('/student/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (updateStudentState) {
        updateStudentState({ must_change_password: false, account_status: 'active' });
      }

      setPasswordToast({
        type: 'success',
        message: res.message || 'Password changed successfully! Keep your new password secure.',
      });

      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordToast({
        type: 'error',
        message: err.message || 'Failed to update password. Please check your current password.',
      });
    } finally {
      setChangingPassword(false);
    }
  }

  function handleResetPasswordFields() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordToast({ type: '', message: '' });
  }

  // Handle Contact Preferences Submission
  async function handleContactSubmit(e) {
    e.preventDefault();
    setContactToast({ type: '', message: '' });

    try {
      setSavingContact(true);
      const res = await apiRequest('/student/settings', {
        method: 'PUT',
        body: JSON.stringify({ email, phone }),
      });

      setContactToast({
        type: 'success',
        message: res.message || 'Contact details updated successfully.',
      });

      if (res.student) {
        setStudentData((prev) => ({
          ...prev,
          ...res.student,
        }));
      }
    } catch (err) {
      setContactToast({
        type: 'error',
        message: err.message || 'Failed to update contact details.',
      });
    } finally {
      setSavingContact(false);
    }
  }

  // Password matching helpers
  const passwordsMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const passwordHasMinLength = newPassword.length >= 6;

  if (loading) {
    return (
      <div className="panel-card p-5 text-center" style={{ maxWidth: 980, margin: '40px auto' }}>
        <div className="portal-spinner inline-spinner mb-3" />
        <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700 }}>Loading Account Settings…</h4>
        <p style={{ color: 'var(--slate-blue)' }}>Retrieving your security configuration and student profile.</p>
      </div>
    );
  }

  if (loadError && !studentData) {
    return (
      <div className="alert-box error" style={{ maxWidth: 980, margin: '40px auto' }}>
        <AlertTriangle size={20} />
        <span>{loadError}</span>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* ── Page Header ── */}
      <div className="page-header-row">
        <div>
          <div className="sem-module-badge student-badge">
            <ShieldCheck size={14} />
            <span>STUDENT SECURITY & PREFERENCES</span>
          </div>
          <h2>Account Settings</h2>
          <p>Manage your student portal login password, contact information, and security preferences.</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: Change Password & Security
          ───────────────────────────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Lock size={20} />
            </div>
            <div>
              <h3>Change Portal Password</h3>
              <p>Update your login credentials to protect your confidential academic dossier.</p>
            </div>
          </div>
          <span className="badge-chip">Authentication Security</span>
        </div>

        {/* Password Feedback Alert */}
        {passwordToast.message && (
          <div
            className={`alert-box ${passwordToast.type === 'success' ? 'success' : 'error'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}
          >
            {passwordToast.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '16px', fontWeight: 600 }}>{passwordToast.message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="settings-form-grid">
          {/* Current Password */}
          <div className="form-group full-width">
            <label>Current Password *</label>
            <div className="input-with-icon has-action">
              <Lock size={16} />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                placeholder="Enter current password (default: student123)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                title={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '15px', color: 'var(--slate-blue)', marginTop: 4 }}>
              Initial default password assigned by the college administration is <code>student123</code>.
            </span>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label>New Password * (Min 6 Characters)</label>
            <div className="input-with-icon has-action">
              <KeyRound size={16} />
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Enter new secure password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNew(!showNew)}
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    fontSize: '14.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: passwordHasMinLength ? '#16A34A' : '#DC2626',
                    fontWeight: 600,
                  }}
                >
                  {passwordHasMinLength ? <Check size={14} /> : <X size={14} />} At least 6 characters
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="form-group">
            <label>Confirm New Password *</label>
            <div className="input-with-icon has-action">
              <CheckCircle2 size={16} />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Re-type your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && (
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    fontSize: '14.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: passwordsMatch ? '#16A34A' : '#DC2626',
                    fontWeight: 600,
                  }}
                >
                  {passwordsMatch ? <Check size={14} /> : <X size={14} />} Passwords match
                </span>
              </div>
            )}
          </div>

          {/* Save Bar */}
          <div className="settings-save-bar">
            <div className="save-bar-info">
              <ShieldCheck size={18} />
              <span>Passwords are securely hashed using salted bcrypt encryption.</span>
            </div>
            <div className="save-bar-actions">
              <button
                type="button"
                className="profile-reset-btn"
                onClick={handleResetPasswordFields}
                disabled={changingPassword || (!currentPassword && !newPassword && !confirmPassword)}
              >
                <RotateCcw size={15} />
                <span>Clear</span>
              </button>

              <button
                type="submit"
                className="profile-save-btn"
                disabled={changingPassword || (newPassword && !passwordsMatch)}
              >
                {changingPassword ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: Contact Details
          ───────────────────────────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Mail size={20} />
            </div>
            <div>
              <h3>Contact & Communication Details</h3>
              <p>Keep your contact information updated so your faculty mentor and college administration can reach you.</p>
            </div>
          </div>
          <span className="badge-chip">Communication</span>
        </div>

        {/* Contact Feedback Alert */}
        {contactToast.message && (
          <div
            className={`alert-box ${contactToast.type === 'success' ? 'success' : 'error'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}
          >
            {contactToast.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '16px', fontWeight: 600 }}>{contactToast.message}</span>
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="settings-form-grid">
          <div className="form-group">
            <label>Student Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@institution.edu"
              />
            </div>
            <span style={{ fontSize: '15px', color: 'var(--muted-text)', marginTop: 4 }}>
              Used for institutional correspondence and academic notifications.
            </span>
          </div>

          <div className="form-group">
            <label>Contact Phone Number</label>
            <div className="input-with-icon">
              <Phone size={16} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <span style={{ fontSize: '15px', color: 'var(--muted-text)', marginTop: 4 }}>
              Used by your assigned mentor for urgent consultation reach-outs.
            </span>
          </div>

          <div className="settings-save-bar">
            <div className="save-bar-info">
              <ShieldCheck size={18} />
              <span>Contact changes immediately reflect in the mentor portal roster.</span>
            </div>
            <div className="save-bar-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={savingContact || (email === (studentData?.email || '') && phone === (studentData?.phone || ''))}
              >
                {savingContact ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving Contact…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Save Contact Information</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: Verified Student Dossier & Mentor Overview
          ───────────────────────────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <GraduationCap size={20} />
            </div>
            <div>
              <h3>Institutional Academic Identity & Faculty Mentor</h3>
              <p>Your official enrolled student dossier on record with the Dean of Academic Affairs.</p>
            </div>
          </div>
          <span className="badge-chip">Institutional Record</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Subcard A: Enrolled Student Details */}
          <div
            style={{
              background: '#FAF9FD',
              border: '1.5px solid var(--light-border)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #F0ECF8', paddingBottom: 10 }}>
              <strong style={{ fontSize: '17px', color: 'var(--deep-violet-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="var(--royal-violet)" />
                <span>Verified Student Record</span>
              </strong>
              <span
                className="role-badge"
                style={{
                  backgroundColor: studentData?.profile_status === 'Complete' ? '#DCFCE7' : '#FEF3C7',
                  color: studentData?.profile_status === 'Complete' ? '#166534' : '#92400E',
                  fontSize: '14px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {studentData?.profile_status || 'Incomplete'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px', fontSize: '15.5px' }}>
              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Full Name</span>
                <strong style={{ color: 'var(--deep-violet-ink)' }}>{studentData?.full_name || '—'}</strong>
              </div>

              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Roll Number</span>
                <strong style={{ color: 'var(--deep-violet-ink)' }}>{studentData?.roll_number || '—'}</strong>
              </div>

              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Admission / Enrollment</span>
                <strong style={{ color: 'var(--deep-violet-ink)' }}>
                  {studentData?.admission_number || studentData?.university_roll_number || '—'}
                </strong>
              </div>

              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Department</span>
                <strong style={{ color: 'var(--deep-violet-ink)' }}>{studentData?.department || '—'}</strong>
              </div>

              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Current Semester</span>
                <strong style={{ color: 'var(--royal-violet)' }}>
                  Semester {studentData?.semester || '1'}
                </strong>
              </div>

              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Batch & Section</span>
                <strong style={{ color: 'var(--deep-violet-ink)' }}>
                  {studentData?.batch || '2024–2028'} {studentData?.section ? `· Sec ${studentData.section}` : ''}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 10 }}>
              <Link
                to="/student/profile"
                className="profile-reset-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  textDecoration: 'none',
                  fontSize: '15.5px',
                  fontWeight: 700,
                }}
              >
                <User size={15} />
                <span>View My Full Dossier</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* Subcard B: Assigned Faculty Mentor */}
          <div
            style={{
              background: '#FAF9FD',
              border: '1.5px solid var(--light-border)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #F0ECF8', paddingBottom: 10 }}>
              <strong style={{ fontSize: '17px', color: 'var(--deep-violet-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building size={16} color="var(--royal-violet)" />
                <span>Assigned Faculty Mentor</span>
              </strong>
            </div>

            {studentData?.mentor_name ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'var(--royal-violet)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '19px',
                      flexShrink: 0,
                    }}
                  >
                    {studentData.mentor_name[0]}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '17.5px', fontWeight: 800, color: 'var(--deep-violet-ink)' }}>
                      {studentData.mentor_name}
                    </h4>
                    <span style={{ fontSize: '14.5px', color: 'var(--slate-blue)' }}>
                      {studentData.mentor_designation || 'Faculty Mentor'} · {studentData.mentor_department || studentData.department}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '15px', color: 'var(--deep-violet-ink)', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {studentData.mentor_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={14} style={{ color: 'var(--slate-blue)', flexShrink: 0 }} />
                      <span>{studentData.mentor_email}</span>
                    </div>
                  )}
                  {studentData.mentor_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={14} style={{ color: 'var(--slate-blue)', flexShrink: 0 }} />
                      <span>{studentData.mentor_phone}</span>
                    </div>
                  )}
                  {studentData.mentor_cabin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building size={14} style={{ color: 'var(--slate-blue)', flexShrink: 0 }} />
                      <span>Cabin: {studentData.mentor_cabin}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <Link
                    to="/student/issues"
                    className="profile-reset-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      textDecoration: 'none',
                      fontSize: '15.5px',
                      fontWeight: 700,
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Message / Raise Concern to Mentor</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--slate-blue)', fontSize: '15.5px', padding: '16px 0' }}>
                No faculty mentor currently assigned. The College Administration office will assign a mentor shortly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
