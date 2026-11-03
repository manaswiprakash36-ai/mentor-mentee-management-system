import { Shield, Users, GraduationCap, Sparkles, CheckCircle2, Lock } from 'lucide-react';

export default function SplitLoginLayout({
  portal = 'mentor',
  badgeText,
  title,
  subtitle,
  quote,
  features = [],
  illustration,
  footerTag = 'Mentora Enterprise · Academic Session 2026–2027',
  children,
}) {
  return (
    <div className={`login-split-page portal-${portal}`}>
      {/* ── Ambient Background Glow Blobs ── */}
      <div className="login-ambient-blob blob-1" />
      <div className="login-ambient-blob blob-2" />
      <div className="login-ambient-blob blob-3" />

      {/* ── Main Split Container ── */}
      <div className="login-split-card">
        {/* ══ LEFT: Visual Brand Showcase ══ */}
        <div className={`login-visual-panel visual-${portal}`}>
          {/* Subtle Background Pattern Grid */}
          <div className="visual-grid-overlay" />

          {/* Top Brand Identity */}
          <div className="visual-top-bar">
            <div className="visual-brand-tag">
              {portal === 'admin' && <Shield size={16} />}
              {portal === 'mentor' && <Users size={16} />}
              {portal === 'student' && <GraduationCap size={16} />}
              <span>{badgeText || 'MENTORA ACADEMIC SYSTEM'}</span>
            </div>
            <span className="visual-edition-pill">v2.6 Enterprise</span>
          </div>

          {/* Core Illustration & Typography */}
          <div className="visual-content-body">
            <h2 className="visual-headline">{title}</h2>
            <p className="visual-subtext">{subtitle}</p>

            {/* Custom Portal Illustration */}
            <div className="visual-art-wrapper">
              {illustration}
            </div>

            {/* Feature Highlights Grid */}
            {features.length > 0 && (
              <div className="visual-features-grid">
                {features.map((feat, idx) => (
                  <div key={idx} className="visual-feature-item">
                    <div className="feature-check-icon">
                      <CheckCircle2 size={14} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quote / Mission Statement */}
            {quote && (
              <div className="visual-quote-box">
                <p>"{quote}"</p>
              </div>
            )}
          </div>

          {/* Bottom Footnote */}
          <div className="visual-footer">
            <div className="visual-footer-left">
              <span className="footer-dot" />
              <span>{footerTag}</span>
            </div>
            <span className="visual-footer-shield">
              <Lock size={12} /> TLS 256-Bit
            </span>
          </div>
        </div>

        {/* ══ RIGHT: Clean Modern Login Form Panel ══ */}
        <div className="login-form-panel">
          <div className="form-inner-wrapper">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

