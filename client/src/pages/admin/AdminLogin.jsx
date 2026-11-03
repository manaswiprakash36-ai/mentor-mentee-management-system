import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SplitLoginLayout from '../../components/auth/SplitLoginLayout';
import { AdminIllustration } from '../../components/auth/LoginIllustrations';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Users,
  GraduationCap,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await loginAdmin(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Administrator authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemoFill() {
    setEmail('admin@institution.edu');
    setPassword('admin123');
  }

  return (
    <SplitLoginLayout
      portal="admin"
      badgeText="Office of Academic Affairs"
      title="Institutional Governance & Academic Leadership"
      subtitle="Centralized cohort allocation, faculty workload balance, and compliance supervision across all departments."
      quote="Fostering institutional integrity through transparent faculty-mentee alignment and academic excellence."
      features={[
        'Centralized Bulk Cohort Allocation Engine',
        'Real-Time NAAC & Accreditation Compliance',
        'Role-Isolated Governance & Master Roster Control',
      ]}
      illustration={<AdminIllustration />}
      footerTag="College Administration Console · Session 2026–2027"
    >
      {/* Brand Header */}
      <div className="split-form-header">
        <div className="split-brand-row">
          <div className="split-brand-bubble admin">
            <Shield size={24} />
          </div>
          <div>
            <span className="sem-module-badge admin-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
              OFFICE OF ACADEMIC AFFAIRS
            </span>
          </div>
        </div>
        <h1>College Admin Portal</h1>
        <p>Sign in with institutional credentials to manage governance and faculty allocations.</p>
      </div>

      {error && (
        <div className="login-error-alert" role="alert">
          <AlertTriangle size={17} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="split-login-form">
        <div className="split-login-field">
          <label htmlFor="admin-email">Institutional Admin Email</label>
          <div className="split-input-wrap">
            <Mail size={18} className="login-icon" />
            <input
              id="admin-email"
              type="text"
              required
              placeholder="admin@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="split-login-field">
          <label htmlFor="admin-password">Administrative Master Password</label>
          <div className="split-input-wrap">
            <Lock size={18} className="login-icon" />
            <input
              id="admin-password"
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

        <button
          type="submit"
          className="split-submit-btn admin"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <RefreshCw size={17} className="spin" />
              <span>Verifying Authorization…</span>
            </>
          ) : (
            <>
              <span>Sign In to Admin Console</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Demo Fast Fill */}
      <div className="split-demo-box">
        <div className="split-demo-title">
          <KeyRound size={14} />
          <span>Verified Admin Access</span>
        </div>
        <p>Pre-fill verified college administrator credentials:</p>
        <div className="split-demo-actions">
          <button
            type="button"
            className="split-demo-pill"
            onClick={handleDemoFill}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Shield size={14} style={{ color: 'var(--iris-bloom)' }} />
            <span>Chief Administrator (admin@institution.edu)</span>
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
          <Link to="/student/login" className="split-switch-pill">
            <GraduationCap size={14} />
            <span>Student / Mentee Portal</span>
          </Link>
        </div>
      </div>
    </SplitLoginLayout>
  );
}
