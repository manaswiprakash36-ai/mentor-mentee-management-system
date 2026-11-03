import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
  Link2,
  Copy,
  ExternalLink,
  Check,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Power,
  Calendar,
} from 'lucide-react';

export default function GenerateLink() {
  const { mentor } = useAuth();

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [department, setDepartment] = useState(mentor?.department || 'Computer Science');
  const [batch, setBatch] = useState(mentor?.batch || '2024-2028');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [purpose, setPurpose] = useState('Comprehensive Mentee Profile, Academic Status & Needs Collection');
  const [expiryDays, setExpiryDays] = useState('30');
  const [latestGenerated, setLatestGenerated] = useState(null);

  async function loadLinks() {
    try {
      setLoading(true);
      const data = await apiRequest('/form-links');
      setLinks(data);
    } catch (err) {
      setError(err.message || 'Could not load form links');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    setNotice('');
    setError('');

    try {
      const res = await apiRequest('/form-links', {
        method: 'POST',
        body: JSON.stringify({
          department,
          batch,
          academic_year: academicYear,
          purpose,
          expires_in_days: expiryDays,
        }),
      });

      const fullUrl = `${window.location.origin}/mentee-form/${res.link.token}`;
      setLatestGenerated({
        ...res.link,
        fullUrl,
      });

      setNotice('New secure form link generated successfully!');
      await loadLinks();
    } catch (err) {
      setError(err.message || 'Could not generate form link');
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleStatus(linkId, currentStatus) {
    try {
      await apiRequest(`/form-links/${linkId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, is_active: !currentStatus } : l))
      );
    } catch (err) {
      setError(err.message || 'Could not toggle link status');
    }
  }

  function handleCopy(url, id) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  function handleWhatsAppShare(url) {
    const message = `Dear students,\n\nPlease fill out your official Mentee Information Form (Personal, Academic Records, CGPA, Backlogs & Support Needs) using this link:\n${url}\n\nAssigned Mentor: ${mentor?.full_name}\nThank you!`;
    const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(wa, '_blank');
  }

  return (
    <div className="generate-link-page">
      <div className="page-header-row">
        <div>
          <h2>Generate Mentee Form Link</h2>
          <p>Create secure, cryptographically generated registration links associated with your mentor account.</p>
        </div>
      </div>

      {notice && (
        <div className="alert-box success">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="alert-box error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Card */}
      <div className="link-generator-card">
        <div className="generator-card-header">
          <div className="icon-badge">
            <Link2 size={22} />
          </div>
          <div>
            <h3>Create New Form Link</h3>
            <p>Students registering through this link will be automatically linked to your account.</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="generator-form-grid">
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
            />
          </div>

          <div className="form-group">
            <label>Batch</label>
            <input
              type="text"
              required
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="e.g. 2024-2028 or Batch A"
            />
          </div>

          <div className="form-group">
            <label>Academic Year</label>
            <input
              type="text"
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026-27"
            />
          </div>

          <div className="form-group">
            <label>Link Expiration</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days (Recommended)</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>Form Purpose / Cohort Title</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Semester 5 Mentee Academic & Wellness Review"
            />
          </div>

          <div className="generator-submit-bar full-width">
            <button
              type="submit"
              className="btn-primary-generate"
              disabled={generating}
            >
              <Plus size={18} />
              <span>{generating ? 'Generating Unique Token…' : 'Generate Secure Link'}</span>
            </button>
          </div>
        </form>

        {/* Latest Generated Link Showcase */}
        {latestGenerated && (
          <div className="latest-link-showcase">
            <div className="showcase-header">
              <span className="live-dot" />
              <strong>Freshly Generated Link Ready to Share:</strong>
            </div>

            <div className="link-copy-row">
              <input
                type="text"
                readOnly
                value={latestGenerated.fullUrl}
                className="link-display-input"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className="btn-copy-action"
                onClick={() => handleCopy(latestGenerated.fullUrl, 'latest')}
              >
                {copiedId === 'latest' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedId === 'latest' ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                className="btn-preview-action"
                onClick={() => window.open(latestGenerated.fullUrl, '_blank')}
                title="Open in new window"
              >
                <ExternalLink size={16} />
                <span>Preview Form</span>
              </button>
              <button
                type="button"
                className="btn-whatsapp-action"
                onClick={() => handleWhatsAppShare(latestGenerated.fullUrl)}
                title="Send via WhatsApp"
              >
                <Send size={16} />
                <span>Share WhatsApp</span>
              </button>
            </div>
            <div className="showcase-meta">
              <span>Token: <code>{latestGenerated.token}</code></span>
              <span>Expires: {new Date(latestGenerated.expires_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Historical Links Table */}
      <div className="panel-card mt-5">
        <div className="panel-card-header">
          <div>
            <h3>All Generated Form Links</h3>
            <p>Active and past registration links for your mentoring groups</p>
          </div>
          <span className="count-pill">{links.length} Total Links</span>
        </div>

        <div className="table-responsive">
          <table className="portal-table">
            <thead>
              <tr>
                <th>PURPOSE & COHORT</th>
                <th>DEPARTMENT & BATCH</th>
                <th>CREATED</th>
                <th>EXPIRES</th>
                <th>SUBMISSIONS</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Loading links…</td>
                </tr>
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    <p>No form links created yet. Click above to generate your first link.</p>
                  </td>
                </tr>
              ) : (
                links.map((lnk) => {
                  const fullUrl = `${window.location.origin}/mentee-form/${lnk.token}`;
                  const isExpired = new Date(lnk.expires_at) < new Date();
                  const isActive = lnk.is_active && !isExpired;

                  return (
                    <tr key={lnk.id}>
                      <td>
                        <strong>{lnk.purpose}</strong>
                        <div className="link-token-sub">
                          <span>Token: <code>{lnk.token.slice(0, 8)}…{lnk.token.slice(-4)}</code></span>
                        </div>
                      </td>
                      <td>
                        <span>{lnk.department || '—'}</span>
                        <div className="text-muted">{lnk.batch} ({lnk.academic_year})</div>
                      </td>
                      <td>{new Date(lnk.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={isExpired ? 'text-danger' : ''}>
                          {new Date(lnk.expires_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <strong className="submission-counter">{lnk.submissions_count || 0}</strong> students
                      </td>
                      <td>
                        <span className={`status-pill ${isActive ? 'complete' : isExpired ? 'danger' : 'inactive'}`}>
                          {isActive ? 'Active' : isExpired ? 'Expired' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-row-actions">
                          <button
                            className="btn-icon-sub"
                            title="Copy Form URL"
                            onClick={() => handleCopy(fullUrl, lnk.id)}
                          >
                            {copiedId === lnk.id ? <Check size={15} /> : <Copy size={15} />}
                          </button>
                          <button
                            className="btn-icon-sub"
                            title="Preview Student Form"
                            onClick={() => window.open(fullUrl, '_blank')}
                          >
                            <ExternalLink size={15} />
                          </button>
                          <button
                            className="btn-icon-sub text-whatsapp"
                            title="Share on WhatsApp"
                            onClick={() => handleWhatsAppShare(fullUrl)}
                          >
                            <Send size={15} />
                          </button>
                          <button
                            className={`btn-icon-sub ${lnk.is_active ? 'text-danger' : 'text-success'}`}
                            title={lnk.is_active ? 'Deactivate Link' : 'Reactivate Link'}
                            onClick={() => handleToggleStatus(lnk.id, lnk.is_active)}
                          >
                            <Power size={15} />
                          </button>
                        </div>
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
  );
}

