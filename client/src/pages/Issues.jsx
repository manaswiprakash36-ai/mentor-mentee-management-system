import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Send,
  X,
  User,
  Phone,
  Mail,
  ShieldAlert,
} from 'lucide-react';

export default function Issues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIssueIdFromQuery = searchParams.get('id');

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');

  // Selected Issue Detail Drawer/Modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueNotes, setIssueNotes] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form states inside modal
  const [newStatus, setNewStatus] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [newNote, setNewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  async function loadIssues() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (priority) params.append('priority', priority);

      const data = await apiRequest(`/issues?${params.toString()}`);
      setIssues(data);

      if (selectedIssueIdFromQuery) {
        const found = data.find((i) => i.id === Number(selectedIssueIdFromQuery));
        if (found) openIssueDetail(found.id);
      }
    } catch (err) {
      setError(err.message || 'Could not fetch issues');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, [status, category, priority]);

  async function openIssueDetail(issueId) {
    try {
      setLoadingDetail(true);
      const res = await apiRequest(`/issues/${issueId}`);
      setSelectedIssue(res.issue);
      setIssueNotes(res.notes || []);
      setNewStatus(res.issue.status);
      setResolutionSummary(res.issue.resolution_summary || '');
    } catch (err) {
      alert(err.message || 'Could not load issue details');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleUpdateStatus(e) {
    e.preventDefault();
    if (!selectedIssue) return;

    setUpdatingStatus(true);
    try {
      const res = await apiRequest(`/issues/${selectedIssue.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          resolution_summary: resolutionSummary,
          note: `Status updated to ${newStatus}`,
        }),
      });

      setSelectedIssue(res.issue);
      // Reload issue notes
      const detail = await apiRequest(`/issues/${selectedIssue.id}`);
      setIssueNotes(detail.notes || []);

      // Update in issues list
      setIssues((prev) =>
        prev.map((i) => (i.id === selectedIssue.id ? { ...i, status: newStatus } : i))
      );
      alert('Issue status updated successfully');
    } catch (err) {
      alert(err.message || 'Could not update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim() || !selectedIssue) return;

    setAddingNote(true);
    try {
      const res = await apiRequest(`/issues/${selectedIssue.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim() }),
      });

      setIssueNotes((prev) => [...prev, res.note]);
      setNewNote('');
    } catch (err) {
      alert(err.message || 'Could not add note');
    } finally {
      setAddingNote(false);
    }
  }

  const filteredIssues = issues.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.title?.toLowerCase().includes(q) ||
      i.mentee_name?.toLowerCase().includes(q) ||
      i.roll_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="issues-page">
      <div className="page-header-row">
        <div>
          <h2>Issues & Concerns Management</h2>
          <p>Review, track, and resolve academic, personal, or administrative concerns flagged by mentees.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="directory-filter-bar">
        <div className="search-input-field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by issue title, student name, or roll number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns">
          <div className="filter-select-wrap">
            <Filter size={15} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="academic">Academic Difficulties</option>
              <option value="attendance">Attendance Concerns</option>
              <option value="career">Career Guidance</option>
              <option value="infrastructure">Campus Infrastructure</option>
              <option value="administrative">Administrative</option>
              <option value="personal">Personal / Wellbeing</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="panel-card">
        <div className="table-responsive">
          <table className="portal-table">
            <thead>
              <tr>
                <th>ISSUE TITLE & CATEGORY</th>
                <th>STUDENT</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>DATE REPORTED</th>
                <th>NOTES</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="portal-spinner inline-spinner" />
                    <span>Loading issues…</span>
                  </td>
                </tr>
              ) : filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    <div className="empty-icon-wrap">🛡️</div>
                    <strong>No issues found</strong>
                    <p>There are no reported student concerns matching your filter selection.</p>
                  </td>
                </tr>
              ) : (
                filteredIssues.map((iss) => (
                  <tr key={iss.id}>
                    <td>
                      <strong className="student-name-link" onClick={() => openIssueDetail(iss.id)}>
                        {iss.title}
                      </strong>
                      <div className="text-muted-tiny">{iss.category}</div>
                    </td>
                    <td>
                      <strong>{iss.mentee_name}</strong>
                      <div className="text-muted-tiny">{iss.roll_number} · {iss.department}</div>
                    </td>
                    <td>
                      <span className={`priority-tag ${iss.priority?.toLowerCase()}`}>
                        {iss.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`issue-status-badge ${iss.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {iss.status}
                      </span>
                    </td>
                    <td>{new Date(iss.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="notes-count-badge">
                        <MessageSquare size={13} />
                        <span>{iss.notes_count || 0}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-action-view"
                        onClick={() => openIssueDetail(iss.id)}
                      >
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Issue Management Modal */}
      {selectedIssue && (
        <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="modal-card modal-card-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className={`priority-tag ${selectedIssue.priority?.toLowerCase()}`}>
                  {selectedIssue.priority} Priority
                </span>
                <div>
                  <h3>{selectedIssue.title}</h3>
                  <p>Category: {selectedIssue.category} · Filed on {new Date(selectedIssue.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedIssue(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body p-4">
              {/* Student Info Bar */}
              <div className="issue-student-info-bar">
                <div className="info-chip">
                  <User size={15} />
                  <span><strong>{selectedIssue.mentee_name}</strong> ({selectedIssue.roll_number})</span>
                </div>
                <div className="info-chip">
                  <Mail size={15} />
                  <span>{selectedIssue.email}</span>
                </div>
                {selectedIssue.phone && (
                  <div className="info-chip">
                    <Phone size={15} />
                    <span>{selectedIssue.phone}</span>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="issue-full-desc-card mt-3">
                <h4>Description of Concern</h4>
                <p>{selectedIssue.description}</p>
                {selectedIssue.document_url && (
                  <div className="attachment-box mt-2">
                    <a href={selectedIssue.document_url} target="_blank" rel="noopener noreferrer" className="btn-proof-view">
                      <ExternalLink size={15} />
                      <span>View Attached Supporting Document</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Update Status Form */}
              <form onSubmit={handleUpdateStatus} className="status-update-card mt-3">
                <h4>Update Status & Resolution Summary</h4>
                <div className="form-grid-2">
                  <div className="form-group mb-2">
                    <label>Issue Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="New">New</option>
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Resolution Summary / Action Plan</label>
                  <textarea
                    rows={2}
                    placeholder="Describe how the concern was addressed or what action steps were taken with the student…"
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating…' : 'Update Status & Resolution'}
                </button>
              </form>

              {/* Internal Discussion Thread */}
              <div className="discussion-thread-box mt-4">
                <h4>🔒 Internal Mentor Notes & Activity Thread</h4>
                <div className="thread-messages">
                  {issueNotes.length === 0 ? (
                    <p className="text-muted-tiny">No internal discussion notes recorded yet.</p>
                  ) : (
                    issueNotes.map((n) => (
                      <div key={n.id} className="thread-msg-item">
                        <div className="thread-msg-header">
                          <strong>{n.mentor_name || 'Mentor'}</strong>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p>{n.note}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="thread-reply-row mt-3">
                  <input
                    type="text"
                    placeholder="Add an internal follow-up note (private to mentors)…"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-primary btn-sm"
                    disabled={addingNote || !newNote.trim()}
                  >
                    <Send size={15} />
                    <span>Post Note</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

