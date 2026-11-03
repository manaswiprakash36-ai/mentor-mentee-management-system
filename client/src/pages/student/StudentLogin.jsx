import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SplitLoginLayout from '../../components/auth/SplitLoginLayout';
import { StudentIllustration } from '../../components/auth/LoginIllustrations';
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Users,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

export default function StudentLogin() {
  const { loginStudent } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await loginStudent(identifier, password);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Student authentication failed. Check your student ID/roll number and password.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemoFill(roll) {
    setIdentifier(roll);
    setPassword('student123');
  }

  return (
    <SplitLoginLayout
      portal="student"
      badgeText="Academic Mentoring & Learning Portal"
      title="Your Academic Journey, Guided Every Step"
      subtitle="Track attendance compliance, review marksheet dossiers, and collaborate directly with your assigned faculty mentor."
      quote="Knowledge is power, but mentorship unlocks your true potential — stay connected and take charge of your future."
      features={[
        'Comprehensive Digital Student Mentee Dossier',
        'Live Attendance & Semester Results Tracking',
        'Direct & Confidential Mentor Communications',
      ]}
      illustration={<StudentIllustration />}
      footerTag="Enrolled Mentee Portal · Academic Session 2026–2027"
    >
      {/* Brand Header */}
      <div className="split-form-header">
        <div className="split-brand-row">
          <div className="split-brand-bubble student">
            <GraduationCap size={24} />
          </div>
          <div>
            <span
              className="sem-module-badge"
              style={{ background: '#E6F4EA', color: '#137333', borderColor: '#CEEAD6', fontSize: '11px', padding: '2px 8px' }}
            >
              ENROLLED MENTEE ACCESS
            </span>
          </div>
        </div>
        <h1>Student / Mentee Portal</h1>
        <p>Sign in with your enrollment number, student ID, or registered college email.</p>
      </div>

      {error && (
        <div className="login-error-alert" role="alert">
          <AlertTriangle size={17} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="split-login-form">
        <div className="split-login-field">
          <label htmlFor="student-roll">Student ID or Roll Number</label>
          <div className="split-input-wrap">
            <User size={18} className="login-icon" />
            <input
              id="student-roll"
              type="text"
              required
              placeholder="e.g. 2024CS1088 or A60205224158"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="split-login-field">
          <label htmlFor="student-password">Student Password</label>
          <div className="split-input-wrap">
            <Lock size={18} className="login-icon" />
            <input
              id="student-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Enter password (default: student123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="split-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="split-submit-btn student"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <RefreshCw size={17} className="spin" />
              <span>Opening Academic Dossier…</span>
            </>
          ) : (
            <>
              <span>Sign In to Student Portal</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Demo Fast Fill */}
      <div className="split-demo-box">
        <div className="split-demo-title" style={{ color: '#137333' }}>
          <KeyRound size={14} />
          <span>Verified Student Accounts</span>
        </div>
        <p>Click below to pre-fill verified student credentials:</p>
        <div className="split-demo-actions">
          <button
            type="button"
            className="split-demo-pill"
            style={{ flex: 1 }}
            onClick={() => handleDemoFill('2024CS1088')}
          >
            <GraduationCap size={13} style={{ color: '#137333' }} />
            <span>Aarav S. (2024CS1088)</span>
          </button>
          <button
            type="button"
            className="split-demo-pill"
            style={{ flex: 1 }}
            onClick={() => handleDemoFill('A60205224158')}
          >
            <GraduationCap size={13} style={{ color: '#137333' }} />
            <span>Mahi S. (A60205224158)</span>
          </button>
        </div>
      </div>

      {/* Role Portal Switchers */}
      <div className="split-portal-switcher">
        <span className="split-switcher-label">Switch to other institutional portals:</span>
        <div className="split-switcher-links">
          <Link to="/login" className="split-switch-pill">
            <Users size={14} />
            <span>Faculty Mentor Portal</span>
          </Link>
          <Link to="/admin/login" className="split-switch-pill">
            <Shield size={14} />
            <span>College Admin Portal</span>
          </Link>
        </div>
      </div>
    </SplitLoginLayout>
  );
}
