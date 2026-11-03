import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
  User,
  Clock,
  Bell,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Building,
  GraduationCap,
  Calendar,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function Settings() {
  const { mentor, updateMentorState } = useAuth();

  // ── 1. Profile Preferences State ──
  const [displayName, setDisplayName] = useState(mentor?.full_name || '');
  const [defaultView, setDefaultView] = useState('table');
  const [savingProfile, setSavingProfile] = useState(false);

  // ── 2. Mentoring Availability State ──
  const [consultationHours, setConsultationHours] = useState('Monday – Friday: 02:00 PM – 04:00 PM (Walk-in / By Prior Slot)');
  const [consultationMode, setConsultationMode] = useState('cabin');
  const [officeStatus, setOfficeStatus] = useState('open');
  const [availabilityNotice, setAvailabilityNotice] = useState('Students are welcome to drop by during walk-in hours for academic guidance or project reviews.');
  const [savingAvailability, setSavingAvailability] = useState(false);

  // ── 3. Notification Preferences State ──
  const [notifNewMentee, setNotifNewMentee] = useState(true);
  const [notifIssues, setNotifIssues] = useState(true);
  const [notifAchievements, setNotifAchievements] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // ── 4. Account Security State ──
  const [email, setEmail] = useState(mentor?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // ── Feedback Notices ──
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Hydrate settings from mentor context
  useEffect(() => {
    if (mentor) {
      if (mentor.full_name) setDisplayName(mentor.full_name);
      if (mentor.email) setEmail(mentor.email);

      const s = mentor.settings || {};
      if (s.default_view) setDefaultView(s.default_view);
      if (s.consultation_hours) setConsultationHours(s.consultation_hours);
      if (s.consultation_mode) setConsultationMode(s.consultation_mode);
      if (s.office_status) setOfficeStatus(s.office_status);
      if (s.availability_notice) setAvailabilityNotice(s.availability_notice);

      if (s.notif_new_mentee !== undefined) setNotifNewMentee(s.notif_new_mentee);
      if (s.notif_issues !== undefined) setNotifIssues(s.notif_issues);
      if (s.notif_achievements !== undefined) setNotifAchievements(s.notif_achievements);
    }
  }, [mentor]);

  // ── Save Profile Preferences ──
  async function handleProfileSave(e) {
    e.preventDefault();
    setToast('');
    setError('');

    try {
      setSavingProfile(true);
      const updatedSettings = {
        ...(mentor?.settings || {}),
        default_view: defaultView,
      };

      const res = await apiRequest('/mentor/settings', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: displayName,
          settings: updatedSettings,
        }),
      });

      if (res.mentor) {
        updateMentorState(res.mentor);
      }
      setToast('Profile display preferences updated successfully!');
    } catch (err) {
      setError(err.message || 'Could not update profile preferences');
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Save Mentoring Availability ──
  async function handleAvailabilitySave(e) {
    e.preventDefault();
    setToast('');
    setError('');

    try {
      setSavingAvailability(true);
      const updatedSettings = {
        ...(mentor?.settings || {}),
        consultation_hours: consultationHours,
        consultation_mode: consultationMode,
        office_status: officeStatus,
        availability_notice: availabilityNotice,
      };

      const res = await apiRequest('/mentor/settings', {
        method: 'PUT',
        body: JSON.stringify({
          settings: updatedSettings,
        }),
      });

      if (res.mentor) {
        updateMentorState(res.mentor);
      }
      setToast('Mentoring consultation availability updated and synced with dashboard!');
    } catch (err) {
      setError(err.message || 'Could not update availability settings');
    } finally {
      setSavingAvailability(false);
    }
  }

  // ── Save Notification Preferences ──
  async function handleNotificationSave(e) {
    e.preventDefault();
    setToast('');
    setError('');

    try {
      setSavingNotifs(true);
      const updatedSettings = {
        ...(mentor?.settings || {}),
        notif_new_mentee: notifNewMentee,
        notif_issues: notifIssues,
        notif_achievements: notifAchievements,
      };

      const res = await apiRequest('/mentor/settings', {
        method: 'PUT',
        body: JSON.stringify({
          settings: updatedSettings,
        }),
      });

      if (res.mentor) {
        updateMentorState(res.mentor);
      }
      setToast('Notification preferences saved successfully!');
    } catch (err) {
      setError(err.message || 'Could not update notification preferences');
    } finally {
      setSavingNotifs(false);
    }
  }

  // ── Update Account Email ──
  async function handleEmailSave(e) {
    e.preventDefault();
    setToast('');
    setError('');

    try {
      setSavingEmail(true);
      const res = await apiRequest('/mentor/settings', {
        method: 'PUT',
        body: JSON.stringify({
          email,
        }),
      });

      if (res.mentor) {
        updateMentorState(res.mentor);
      }
      setToast('Account login email updated successfully!');
    } catch (err) {
      setError(err.message || 'Could not update account email');
    } finally {
      setSavingEmail(false);
    }
  }

  // ── Update Password ──
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setToast('');
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await apiRequest('/mentor/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      setToast(res.message || 'Password updated successfully! Use your new password on subsequent logins.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  }

  function handleResetPasswordFields() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  return (
    <div className="settings-page">
      <div className="page-header-row">
        <div>
          <h2>Mentor Settings</h2>
          <p>Manage your portal profile preferences, student consultation hours, in-app notification alerts, and account security.</p>
        </div>
      </div>

      {toast && (
        <div className="alert-box success">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="alert-box error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: Profile Preferences
          ───────────────────────────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <User size={20} />
            </div>
            <div>
              <h3>Profile Preferences</h3>
              <p>Customize how your faculty name appears to students and configure your default workspace views.</p>
            </div>
          </div>
          <span className="badge-chip">Display & Workspace</span>
        </div>

        <form onSubmit={handleProfileSave} className="settings-form-grid">
          <div className="form-group">
            <label>Preferred Display Name / Salutation *</label>
            <div className="input-with-icon">
              <User size={16} />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Manaswi Prakash"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Default Mentees Directory View</label>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid var(--light-border)',
                background: '#FFFFFF',
                color: 'var(--deep-violet-ink)',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              <option value="table">Compact Summary Table (Quick scanning & sorting)</option>
              <option value="cards">Grid Cards (Dossier overview with avatars)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assigned Department & Batch</label>
            <div className="settings-readonly-box">
              <span>{mentor?.department || 'Computer Science & Engineering'} · {mentor?.batch || 'Batch 2024–28'}</span>
              <span className="settings-readonly-tag">Assigned Cohort</span>
            </div>
          </div>

          <div className="form-group">
            <label>Active Academic Session Year</label>
            <div className="settings-readonly-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="var(--cornflower-blue)" />
                <span>Academic Session 2024–2025</span>
              </div>
              <span className="settings-readonly-tag">Centrally Configured</span>
            </div>
          </div>

          <div className="form-group full-width">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--soft-off-white)', borderRadius: '12px', border: '1px solid var(--light-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={18} color="var(--iris-bloom)" />
                <span style={{ fontSize: '17px', color: 'var(--slate-blue)' }}>
                  Looking to update your official cabin room, phone number, or employee code?
                </span>
              </div>
              <Link to="/profile" className="settings-link-pill">
                <span>Manage Faculty Profile</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          <div className="settings-save-bar">
            <div className="save-bar-info">
              <ShieldCheck size={18} />
              <span>Display preference updates synchronize across your dashboard and student-facing headers.</span>
            </div>
            <div className="save-bar-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving Preferences…</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Profile Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: Mentoring Availability
          ───────────────────────────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Clock size={20} />
            </div>
            <div>
              <h3>Mentoring Availability & Office Hours</h3>
              <p>Set your consultation time slots, preferred meeting mode, and guidance instructions for mentees.</p>
            </div>
          </div>
          <span className="badge-chip">Student Consultation</span>
        </div>

        <form onSubmit={handleAvailabilitySave} className="settings-form-grid">
          <div className="form-group full-width">
            <label>Mentoring Consultation Time Window *</label>
            <div className="input-with-icon">
              <Clock size={16} />
              <input
                type="text"
                required
                value={consultationHours}
                onChange={(e) => setConsultationHours(e.target.value)}
                placeholder="e.g. Monday – Friday: 02:00 PM – 04:00 PM (Walk-in / By Prior Slot)"
              />
            </div>
            <span style={{ fontSize: '16px', color: 'var(--muted-text)', marginTop: '4px' }}>
              Displayed live on your mentor dashboard and communicated to assigned students.
            </span>
          </div>

          <div className="form-group">
            <label>Preferred Consultation Mode</label>
            <select
              value={consultationMode}
              onChange={(e) => setConsultationMode(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid var(--light-border)',
                background: '#FFFFFF',
                color: 'var(--deep-violet-ink)',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              <option value="cabin">In-Person (Faculty Cabin: {mentor?.cabin_number || 'Cabin 304, Block-B'})</option>
              <option value="virtual">Virtual / Online (Institutional Video Platform)</option>
              <option value="hybrid">Hybrid (Cabin Walk-in + Online Appointment)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Office Availability Status</label>
            <select
              value={officeStatus}
              onChange={(e) => setOfficeStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid var(--light-border)',
                background: '#FFFFFF',
                color: 'var(--deep-violet-ink)',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              <option value="open">Available for Drop-in Consultations (Active)</option>
              <option value="appointment">By Prior Appointment Only</option>
              <option value="exam">Exam & Evaluation Week (Restricted Hours)</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>Notice / Instructions for Mentees</label>
            <textarea
              rows={2}
              value={availabilityNotice}
              onChange={(e) => setAvailabilityNotice(e.target.value)}
              placeholder="e.g. Students are welcome to drop by during walk-in consultation hours for academic doubts, project reviews, or personal mentoring."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid var(--light-border)',
                fontFamily: 'inherit',
                fontSize: '17.5px',
                color: 'var(--deep-violet-ink)',
                resize: 'vertical',
              }}
            />
          </div>

          <div className="settings-save-bar">
            <div className="save-bar-info">
              <ShieldCheck size={18} />
              <span>Availability details immediately update the student consultation card on your Dashboard.</span>
            </div>
            <div className="save-bar-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={savingAvailability}
              >
                {savingAvailability ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving Availability…</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Availability Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: Notification Preferences
          ───────────────────────────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Bell size={20} />
            </div>
            <div>
              <h3>Notification Preferences</h3>
              <p>Control the in-app notifications generated when mentees submit registration profiles, grievances, or achievements.</p>
            </div>
          </div>
          <span className="badge-chip">Alerts & Submissions</span>
        </div>

        <form onSubmit={handleNotificationSave} className="settings-form-grid">
          <div className="settings-checkbox-list">
            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={notifNewMentee}
                onChange={(e) => setNotifNewMentee(e.target.checked)}
              />
              <div className="settings-checkbox-text">
                <strong>New Mentee Registration Dossier Alerts</strong>
                <span>Receive instant in-app notification when an assigned student finishes submitting their 12-section registration form.</span>
              </div>
            </label>

            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={notifIssues}
                onChange={(e) => setNotifIssues(e.target.checked)}
              />
              <div className="settings-checkbox-text">
                <strong>Student Grievance & Issue Reports</strong>
                <span>Receive priority in-app notification whenever a mentee flags an academic, personal, or attendance challenge.</span>
              </div>
            </label>

            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={notifAchievements}
                onChange={(e) => setNotifAchievements(e.target.checked)}
              />
              <div className="settings-checkbox-text">
                <strong>Student Achievement Verification Requests</strong>
                <span>Receive notification when a mentee submits an award, paper publication, or competition certificate for verification.</span>
              </div>
            </label>
          </div>

          <div className="form-group full-width" style={{ marginTop: '8px' }}>
            <div style={{ padding: '12px 14px', background: 'var(--soft-off-white)', borderRadius: '10px', border: '1px solid var(--light-border)', fontSize: '16.5px', color: 'var(--slate-blue)', lineHeight: 1.5 }}>
              <strong>Direct System Connection:</strong> Notifications are delivered in real time to your topbar bell icon and the Notifications panel. Email digest delivery is managed via the institutional mail server configuration.
            </div>
          </div>

          <div className="settings-save-bar">
            <div className="save-bar-info">
              <ShieldCheck size={18} />
              <span>Notification filters are linked directly to database event triggers.</span>
            </div>
            <div className="save-bar-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={savingNotifs}
              >
                {savingNotifs ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving Preferences…</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Notification Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: Account Security
          ───────────────────────────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon">
              <Lock size={20} />
            </div>
            <div>
              <h3>Account Security & Password Management</h3>
              <p>Update your registered institutional email and change your faculty login password securely.</p>
            </div>
          </div>
          <span className="badge-chip">Authentication</span>
        </div>

        {/* Subsection A: Registered Email */}
        <form onSubmit={handleEmailSave} className="settings-form-grid" style={{ paddingBottom: '20px', borderBottom: '1.5px solid var(--light-border)' }}>
          <div className="form-group">
            <label>Registered Institutional Login Email *</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty.mentor@university.edu.in"
              />
            </div>
            <span style={{ fontSize: '16px', color: 'var(--muted-text)', marginTop: '4px' }}>
              Used to sign in to your mentoring portal. Checked for uniqueness across the faculty database.
            </span>
          </div>

          <div className="form-group" style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <div style={{ marginTop: 'auto' }}>
              <button
                type="submit"
                className="profile-save-btn"
                disabled={savingEmail || email === mentor?.email}
                style={{ width: '100%' }}
              >
                {savingEmail ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Updating Email…</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Update Account Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Subsection B: Change Password */}
        <form onSubmit={handlePasswordSubmit} className="settings-form-grid">
          <div className="form-group full-width">
            <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--deep-violet-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={15} color="var(--cornflower-blue)" />
              <span>Change Faculty Password</span>
            </span>
          </div>

          <div className="form-group">
            <label>Current Password *</label>
            <div className="input-with-icon has-action">
              <Lock size={16} />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                placeholder="Enter current password"
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
          </div>

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
          </div>

          <div className="form-group">
            <label>Confirm New Password *</label>
            <div className="input-with-icon has-action">
              <CheckCircle2 size={16} />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Re-type new password"
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
          </div>

          <div className="form-group">
            <label>Password Security Policy</label>
            <div
              style={{
                fontSize: '16.5px',
                color: 'var(--slate-blue)',
                padding: '10px 14px',
                background: 'var(--soft-off-white)',
                border: '1.5px solid var(--light-border)',
                borderRadius: '10px',
                lineHeight: 1.45,
              }}
            >
              <div>• Minimum 6 characters (Letters, numbers, symbols)</div>
              <div>• Encrypted on database using 10-round salted bcrypt</div>
            </div>
          </div>

          <div className="settings-save-bar">
            <div className="save-bar-info">
              <ShieldCheck size={18} />
              <span>Active session token automatically persists for 7 days of inactivity.</span>
            </div>
            <div className="save-bar-actions">
              <button
                type="button"
                className="profile-reset-btn"
                onClick={handleResetPasswordFields}
                disabled={updatingPassword}
              >
                <RotateCcw size={15} />
                <span>Clear</span>
              </button>
              <button
                type="submit"
                className="profile-save-btn"
                disabled={updatingPassword}
              >
                {updatingPassword ? (
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
    </div>
  );
}
