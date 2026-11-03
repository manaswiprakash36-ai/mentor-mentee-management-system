import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Award,
  FileText,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Check,
  X,
  Search,
} from 'lucide-react';

export default function AchievementsResults() {
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' | 'results'

  const [achievements, setAchievements] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [category, setCategory] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [search, setSearch] = useState('');

  // Verification modal
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifying, setVerifying] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (verificationStatus) params.append('verification_status', verificationStatus);

      const [achData, resData] = await Promise.all([
        apiRequest(`/achievements?${params.toString()}`),
        apiRequest('/academic-results'),
      ]);

      setAchievements(achData);
      setResults(resData);
    } catch (err) {
      setError(err.message || 'Could not fetch records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [category, verificationStatus]);

  async function handleVerifySubmit() {
    if (!verifyModal) return;
    setVerifying(true);
    try {
      const res = await apiRequest(`/achievements/${verifyModal.id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: verifyModal.status,
          rejection_reason: verifyModal.reason,
        }),
      });

      setAchievements((prev) =>
        prev.map((a) => (a.id === verifyModal.id ? res.achievement : a))
      );
      setVerifyModal(null);
    } catch (err) {
      alert(err.message || 'Failed to update verification');
    } finally {
      setVerifying(false);
    }
  }

  const filteredAchievements = achievements.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.mentee_name?.toLowerCase().includes(q) ||
      a.roll_number?.toLowerCase().includes(q)
    );
  });

  const filteredResults = results.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.examination_name?.toLowerCase().includes(q) ||
      r.mentee_name?.toLowerCase().includes(q) ||
      r.roll_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="achievements-page">
      <div className="page-header-row">
        <div>
          <h2>Student Achievements & Academic Records</h2>
          <p>Review, verify certificates, and inspect semester transcripts uploaded by your mentees.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav-bar mb-4">
        <button
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <Award size={16} />
          <span>Student Achievements ({achievements.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <FileText size={16} />
          <span>Academic Results & Marksheets ({results.length})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="directory-filter-bar">
        <div className="search-input-field">
          <Search size={18} />
          <input
            type="text"
            placeholder={
              activeTab === 'achievements'
                ? 'Search achievements by title, student name, or roll number…'
                : 'Search examination results by title or student…'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeTab === 'achievements' && (
          <div className="filter-dropdowns">
            <div className="filter-select-wrap">
              <Filter size={15} />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="academic">Academic Honors</option>
                <option value="technical">Technical / Hackathons</option>
                <option value="sports">Sports & Athletics</option>
                <option value="cultural">Cultural & Arts</option>
                <option value="research">Research / Publications</option>
                <option value="extracurricular">Extracurricular</option>
              </select>
            </div>

            <div className="filter-select-wrap">
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
              >
                <option value="">All Verifications</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="panel-card">
          <div className="table-responsive">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>ACHIEVEMENT TITLE & CATEGORY</th>
                  <th>STUDENT</th>
                  <th>LEVEL & RANK</th>
                  <th>DATE</th>
                  <th>VERIFICATION STATUS</th>
                  <th>CERTIFICATE PROOF</th>
                  <th style={{ textAlign: 'right' }}>MENTOR VERIFICATION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="portal-spinner inline-spinner" />
                      <span>Loading achievements…</span>
                    </td>
                  </tr>
                ) : filteredAchievements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-state">
                      <div className="empty-icon-wrap">🏆</div>
                      <strong>No achievements found</strong>
                      <p>Mentees have not uploaded any achievement claims under these criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAchievements.map((ach) => (
                    <tr key={ach.id}>
                      <td>
                        <strong>{ach.title}</strong>
                        <div className="text-muted-tiny">{ach.category} {ach.organization ? `· ${ach.organization}` : ''}</div>
                      </td>
                      <td>
                        <strong>{ach.mentee_name}</strong>
                        <div className="text-muted-tiny">{ach.roll_number} · {ach.department}</div>
                      </td>
                      <td>
                        <span>{ach.level || 'College'}</span>
                        {ach.position && <div className="text-muted-tiny">Rank: {ach.position}</div>}
                      </td>
                      <td>{ach.achievement_date ? new Date(ach.achievement_date).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`status-pill ${
                          ach.verification_status === 'Verified' ? 'complete' :
                          ach.verification_status === 'Rejected' ? 'danger' : 'warning'
                        }`}>
                          {ach.verification_status}
                        </span>
                        {ach.rejection_reason && (
                          <div className="text-muted-tiny text-danger mt-1">Reason: {ach.rejection_reason}</div>
                        )}
                      </td>
                      <td>
                        {ach.proof_url ? (
                          <a
                            href={ach.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-table-proof"
                          >
                            <ExternalLink size={14} />
                            <span>Proof Doc</span>
                          </a>
                        ) : (
                          <span className="text-muted-tiny">None</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-row-actions">
                          <button
                            className="btn-verify-chip"
                            title="Mark Verified"
                            onClick={() => setVerifyModal({ id: ach.id, title: ach.title, status: 'Verified', reason: '' })}
                          >
                            <Check size={14} />
                            <span>Verify</span>
                          </button>
                          <button
                            className="btn-reject-chip"
                            title="Reject Claim"
                            onClick={() => setVerifyModal({ id: ach.id, title: ach.title, status: 'Rejected', reason: '' })}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC RESULTS */}
      {activeTab === 'results' && (
        <div className="panel-card">
          <div className="table-responsive">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>EXAMINATION NAME</th>
                  <th>STUDENT</th>
                  <th>SEMESTER & YEAR</th>
                  <th>MARKS</th>
                  <th>PERCENTAGE</th>
                  <th>CGPA/SGPA</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>MARKSHEET DOCUMENT</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div className="portal-spinner inline-spinner" />
                      <span>Loading academic records…</span>
                    </td>
                  </tr>
                ) : filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table-state">
                      <div className="empty-icon-wrap">📄</div>
                      <strong>No academic results uploaded yet</strong>
                      <p>Mentees have not uploaded any semester result marksheets.</p>
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.examination_name}</strong>
                        {r.remarks && <div className="text-muted-tiny">{r.remarks}</div>}
                      </td>
                      <td>
                        <strong>{r.mentee_name}</strong>
                        <div className="text-muted-tiny">{r.roll_number}</div>
                      </td>
                      <td>
                        <span>Semester {r.semester || '—'}</span>
                        <div className="text-muted-tiny">{r.academic_year}</div>
                      </td>
                      <td>{r.marks_obtained != null ? `${r.marks_obtained} / ${r.max_marks || 100}` : '—'}</td>
                      <td>{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                      <td><strong>{r.cgpa || r.sgpa || '—'}</strong></td>
                      <td>
                        <span className={`status-pill ${r.result_status === 'Pass' ? 'complete' : 'danger'}`}>
                          {r.result_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {r.document_url ? (
                          <a
                            href={r.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-table-proof"
                          >
                            <ExternalLink size={14} />
                            <span>View Marksheet</span>
                          </a>
                        ) : (
                          <span className="text-muted-tiny">Not uploaded</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Dialog */}
      {verifyModal && (
        <div className="modal-overlay" onClick={() => setVerifyModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{verifyModal.status} Achievement</h3>
              <button className="modal-close-btn" onClick={() => setVerifyModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body p-4">
              <p>
                Confirm marking <strong>"{verifyModal.title}"</strong> as{' '}
                <strong className={verifyModal.status === 'Verified' ? 'text-success' : 'text-danger'}>
                  {verifyModal.status}
                </strong>.
              </p>

              {verifyModal.status === 'Rejected' && (
                <div className="form-group mt-3">
                  <label>Reason for Rejection *</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific reason to student (e.g. proof document illegible, missing date or seal)…"
                    value={verifyModal.reason}
                    onChange={(e) => setVerifyModal({ ...verifyModal, reason: e.target.value })}
                  />
                </div>
              )}

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setVerifyModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={verifyModal.status === 'Verified' ? 'btn-primary' : 'btn-danger'}
                  disabled={verifying || (verifyModal.status === 'Rejected' && !verifyModal.reason.trim())}
                  onClick={handleVerifySubmit}
                >
                  {verifying ? 'Saving…' : `Confirm ${verifyModal.status}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

