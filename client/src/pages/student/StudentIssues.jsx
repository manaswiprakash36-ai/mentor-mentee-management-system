import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  X,
} from 'lucide-react';

export default function StudentIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Academic',
    severity: 'Normal',
  });

  async function loadIssues() {
    try {
      setLoading(true);
      const res = await apiRequest('/student/issues');
      setIssues(res || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load concerns');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/student/issues', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setNotice('Your concern has been submitted directly to your assigned faculty mentor.');
      setShowModal(false);
      setForm({ title: '', description: '', category: 'Academic', severity: 'Normal' });
      await loadIssues();
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to submit concern');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="student-issues-page">
      <div className="page-header-row mb-4">
        <div>
          <div className="sem-module-badge student-badge">
            <AlertCircle size={14} />
            <span>CONFIDENTIAL MENTORING SUPPORT</span>
          </div>
          <h2>Mentoring & Student Concerns</h2>
          <p>Raise questions, academic challenges, or personal concerns directly with your faculty mentor.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          <span>Raise New Concern</span>
        </button>
      </div>

      {notice && (
        <div className="alert-box success mb-4">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="panel-card p-5 text-center">
          <div className="portal-spinner inline-spinner mb-3" />
          <p>Loading your mentoring interactions…</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="panel-card p-5 text-center">
          <MessageSquare size={36} style={{ color: 'var(--muted-text)', margin: '0 auto 12px' }} />
          <h4 style={{ color: 'var(--deep-violet-ink)' }}>No Concerns or Grievances Logged</h4>
          <p style={{ color: 'var(--slate-blue)', fontSize: '16.5px', maxWidth: 460, margin: '0 auto 18px' }}>
            If you need guidance regarding your attendance, course registration, subject difficulties, or personal matters, you can reach out here.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} />
            <span>Submit a Question to Mentor</span>
          </button>
        </div>
      ) : (
        <div className="admin-sem-list">
          {issues.map((issue) => {
            const isResolved = issue.status === 'Resolved';
            return (
              <div key={issue.id} className="panel-card p-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`status-pill ${isResolved ? 'complete' : 'warning'}`}>
                        {isResolved ? '✓ Resolved' : '⏳ In Progress'}
                      </span>
                      <span className="badge-bubble">{issue.category || 'Academic'}</span>
                      {issue.severity === 'Urgent' && (
                        <span className="status-pill danger">🚨 Urgent</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--deep-violet-ink)', margin: 0 }}>
                      {issue.title}
                    </h3>
                  </div>
                  <span className="text-muted-tiny">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ color: 'var(--slate-blue)', fontSize: '16.5px', margin: '10px 0 0', lineHeight: 1.55 }}>
                  {issue.description}
                </p>

                {issue.mentor_notes && (
                  <div className="mt-3 p-3" style={{ background: '#F8F7FC', borderRadius: '10px', border: '1px solid #ECE7F5' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--iris-bloom)', display: 'block', marginBottom: 4 }}>
                      Mentor Observation / Resolution Note:
                    </strong>
                    <span style={{ fontSize: '16px', color: 'var(--deep-violet-ink)' }}>{issue.mentor_notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Concern Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>Submit Concern to Mentor</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body p-4">
              <div className="form-group mb-3">
                <label>Concern Subject / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Difficulty with Data Structures course / Low attendance concern"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Academic">Academic / Subjects</option>
                    <option value="Attendance">Attendance Issue</option>
                    <option value="Examination">Examination / Backlog</option>
                    <option value="Hostel / Facility">Hostel / Facility</option>
                    <option value="Personal / Career">Personal / Career Guidance</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label>Urgency Level</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <label>Describe your question or concern in detail *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain what assistance or clarification you need from your faculty mentor…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--light-border)' }}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit Concern to Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

