import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SplitLoginLayout from '../components/auth/SplitLoginLayout';
import { MentorIllustration } from '../components/auth/LoginIllustrations';
import {
  Users,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  GraduationCap,
  AlertTriangle,
  User,
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemoFill(demoEmail) {
    setEmail(demoEmail);
    setPassword('password123');
  }

  return (
    <SplitLoginLayout
      portal="mentor"
      badgeText="Faculty Mentorship & Guidance"
      title="Inspiring Student Success Through Mentorship"
      subtitle="Personalized academic advisories, holistic mentee dossier tracking, and seamless class section coordination."
      quote="Guiding students beyond the classroom — shaping academic resilience, character, and professional excellence."
      features={[
        '1-on-1 Confidential Mentoring Consultations',
        'Continuous Academic Standing & Marks Tracking',
        'Dual Responsibility: Class Section Supervision',
      ]}
      illustration={<MentorIllustration />}
      footerTag="Faculty Mentor Workspace · Higher Education Suite"
    >
      {/* Brand Header */}
      <div className="split-form-header">
        <div className="split-brand-row">
          <div className="split-brand-bubble mentor">
            <Users size={22} />
          </div>
          <div>
            <span className="sem-module-badge student-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
              FACULTY & COORDINATOR ACCESS
            </span>
          </div>
        </div>
        <h1>Faculty Mentor Portal</h1>
        <p>Sign in with your institutional mentor email or faculty employee ID.</p>
      </div>

      {error && (
        <div className="login-error-alert" role="alert">
          <AlertTriangle size={17} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="split-login-form">
        <div className="split-login-field">
          <label htmlFor="login-email">Mentor Email or Employee ID</label>
          <div className="split-input-wrap">
            <Mail size={18} className="login-icon" />
            <input
              id="login-email"
              type="text"
              required
              placeholder="mentor@example.com or CSE-FAC-014"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="split-login-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="login-password">Password</label>
            <button
              type="button"
              className="login-forgot-link"
              style={{ fontSize: '13px' }}
              onClick={() =>
                alert('Please contact the institution system administrator to reset your mentor credentials.')
              }
            >
              Forgot?
            </button>
          </div>
          <div className="split-input-wrap">
            <Lock size={18} className="login-icon" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Enter password"
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

        <div className="login-options-row" style={{ fontSize: '13.5px' }}>
          <label className="login-checkbox-label" style={{ fontSize: '13.5px' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember this session</span>
          </label>
        </div>

        <button
          type="submit"
          className="split-submit-btn mentor"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <RefreshCw size={17} className="spin" />
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>Sign In to Mentor Portal</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Access Bar */}
      <div className="split-demo-box">
        <div className="split-demo-title">
          <ShieldCheck size={14} />
          <span>Institution Demo Mentors</span>
        </div>
        <p>Pre-fill sample verified mentor credentials:</p>
        <div className="split-demo-actions">
          <button
            type="button"
            className="split-demo-pill"
            style={{ flex: 1 }}
            onClick={() => handleDemoFill('mentor.demo@example.com')}
          >
            <User size={13} style={{ color: 'var(--iris-bloom)' }} />
            <span>Manaswi P. (CSE)</span>
          </button>
          <button
            type="button"
            className="split-demo-pill"
            style={{ flex: 1 }}
            onClick={() => handleDemoFill('mentor.sharma@example.com')}
          >
            <User size={13} style={{ color: 'var(--iris-bloom)' }} />
            <span>Dr. Sharma (IT)</span>
          </button>
        </div>
      </div>

      {/* Role Portal Switchers */}
      <div className="split-portal-switcher">
        <span className="split-switcher-label">Switch to other institutional portals:</span>
        <div className="split-switcher-links">
          <Link to="/admin/login" className="split-switch-pill">
            <Shield size={14} />
            <span>College Admin Portal</span>
          </Link>
          <Link to="/student/login" className="split-switch-pill">
            <GraduationCap size={14} />
            <span>Student / Mentee Portal</span>
          </Link>
        </div>
      </div>
    </SplitLoginLayout>
  );
}
