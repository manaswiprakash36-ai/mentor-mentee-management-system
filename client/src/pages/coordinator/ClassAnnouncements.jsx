import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import {
  Megaphone,
  Award,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  X,
  Bell,
  RefreshCw,
} from 'lucide-react';

export default function ClassAnnouncements() {
  const { mentor } = useAuth();

  const initialClasses = mentor?.coordinatedClasses || [];
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState(initialClasses.length > 0 ? initialClasses[0] : null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(initialClasses.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync if mentor's coordinatedClasses load from session
  useEffect(() => {
    if (mentor?.coordinatedClasses?.length > 0 && classes.length === 0) {
      setClasses(mentor.coordinatedClasses);
      if (!selectedClass) {
        setSelectedClass(mentor.coordinatedClasses[0]);
      }
      setLoading(false);
    }
  }, [mentor]);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal'); // 'normal' | 'high' | 'urgent'
  const [showFormModal, setShowFormModal] = useState(false);

  // 1. Fetch classes
  useEffect(() => {
    async function init() {
      try {
        const res = await apiRequest('/coordinator/classes');
        const list = Array.isArray(res) ? res : (res.classes || []);
        if (list.length > 0) {
          setClasses(list);
          setSelectedClass((prev) => {
            if (!prev) return list[0];
            const match = list.find(
              (c) => c.department === prev.department && String(c.semester) === String(prev.semester) && c.section === prev.section
            );
            return match || list[0];
          });
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
        if (classes.length === 0) setError(err.message || 'Failed to load classes.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Fetch announcements for selected class
  async function loadAnnouncements() {
    if (!selectedClass) return;
    try {
      setError('');
      const params = new URLSearchParams({
        department: selectedClass.department,
        semester: selectedClass.semester,
        section: selectedClass.section,
      });
      if (selectedClass.course) params.append('course', selectedClass.course);
      if (selectedClass.academic_year) params.append('academic_year', selectedClass.academic_year);

      const res = await apiRequest(`/coordinator/announcements?${params.toString()}`);
      setAnnouncements(Array.isArray(res) ? res : res.announcements || []);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, [selectedClass]);

  // Handle Create Announcement
  async function handleCreateAnnouncement(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill out both the announcement title and description.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/coordinator/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          priority,
          department: selectedClass.department,
          course: selectedClass.course || 'B.Tech Computer Science',
          academic_year: selectedClass.academic_year || '2026-27',
          semester: Number(selectedClass.semester),
          section: selectedClass.section,
        }),
      });

      setSuccess(res.message || 'Announcement published to class successfully!');
      setTitle('');
      setContent('');
      setPriority('normal');
      setShowFormModal(false);
      await loadAnnouncements();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Delete Announcement
  async function handleDeleteAnnouncement(id) {
    if (!window.confirm('Are you sure you want to delete this announcement? It will be removed from all student dashboards.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await apiRequest(`/coordinator/announcements/${id}`, {
        method: 'DELETE',
      });
      setSuccess(res.message || 'Announcement deleted.');
      await loadAnnouncements();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to delete announcement.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="portal-content-wrap coordinator-page">
      {/* ── Page Header ── */}
      <div className="page-header-row coordinator-header-card">
        <div>
          <div className="coordinator-role-pill">
            <Award size={15} />
            <span>CLASS COMMUNICATION · CIRCULARS</span>
          </div>
          <h1 className="coordinator-title">Class Announcements & Notices</h1>
          <p className="coordinator-sub">
            Broadcast official circulars, exam schedules, and academic instructions to all students and faculty mentors in this section.
          </p>
        </div>

        {/* Controls */}
        <div className="coordinator-class-controls">
          <select
            className="coordinator-select"
            value={selectedClass ? `${selectedClass.department}|${selectedClass.semester}|${selectedClass.section}` : ''}
            onChange={(e) => {
              const [dept, sem, sec] = e.target.value.split('|');
              const matched = classes.find(
                (c) => c.department === dept && String(c.semester) === sem && c.section === sec
              );
              if (matched) setSelectedClass(matched);
            }}
          >
            {classes.map((c) => (
              <option
                key={`${c.department}-${c.semester}-${c.section}`}
                value={`${c.department}|${c.semester}|${c.section}`}
              >
                {c.department} · Sem {c.semester} · Sec {c.section}
              </option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={() => setShowFormModal(true)}
          >
            <Plus size={16} />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="alert-box success mb-4">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-box error mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Announcements Feed ── */}
      <div className="panel-card p-4">
        <div className="card-header-clean mb-4">
          <div>
            <h3 className="section-title">
              Active Class Circulars ({announcements.length})
            </h3>
            <p className="section-sub">
              Targeted to: {selectedClass?.department} · Semester {selectedClass?.semester} · Section {selectedClass?.section}
            </p>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="p-5 text-center" style={{ background: '#FAF9FD', borderRadius: '12px' }}>
            <Megaphone size={38} style={{ color: 'var(--muted-text)', margin: '0 auto 10px' }} />
            <h4 style={{ color: 'var(--deep-violet-ink)', margin: 0, fontSize: '18px' }}>
              No Class Announcements Yet
            </h4>
            <p style={{ color: 'var(--slate-blue)', fontSize: '15px', margin: '6px 0 16px' }}>
              Keep your entire section updated on academic deadlines, attendance advisories, or department notices.
            </p>
            <button className="btn-primary" onClick={() => setShowFormModal(true)}>
              <Plus size={16} />
              <span>Create First Announcement</span>
            </button>
          </div>
        ) : (
          <div className="announcements-cards-feed">
            {announcements.map((ann) => (
              <div key={ann.id} className="announcement-large-card mb-3">
                <div className="announcement-large-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className={`priority-pill ${ann.priority || 'normal'}`}>
                      {ann.priority?.toUpperCase() || 'NORMAL'}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '19px', color: 'var(--deep-violet-ink)' }}>
                      {ann.title}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="announcement-date">
                      <Clock size={14} style={{ marginRight: 4 }} />
                      {new Date(ann.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <button
                      className="btn-danger-outline btn-sm btn-icon-only"
                      title="Delete Announcement"
                      disabled={deletingId === ann.id}
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="announcement-large-body">
                  <p style={{ margin: '10px 0', fontSize: '15.5px', lineHeight: 1.6, color: 'var(--deep-violet-ink)', whiteSpace: 'pre-wrap' }}>
                    {ann.content}
                  </p>
                </div>

                <div className="announcement-large-footer">
                  <span>
                    Author: <strong>{ann.mentor_name || mentor?.full_name}</strong> (Class Coordinator)
                  </span>
                  <span>
                    Audience: All Students & Mentors in {ann.department} Sem {ann.semester} Sec {ann.section}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Publish New Announcement ── */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'grid', placeItems: 'center' }}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--deep-violet-ink)', fontWeight: 700 }}>
                    Publish Class Announcement
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--muted-text)' }}>
                    {selectedClass?.department} · Semester {selectedClass?.semester} · Section {selectedClass?.section}
                  </span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowFormModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="modal-body p-4">
              <div className="form-group mb-3">
                <label>Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Review Meeting / Attendance Warning"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group mb-3">
                <label>Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="normal">Normal Priority (Regular Notice)</option>
                  <option value="high">High Priority (Important Deadline)</option>
                  <option value="urgent">Urgent Priority (Immediate Action Required)</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label>Announcement Details / Instructions *</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Enter detailed notice, instructions, room number, or submission requirements for the students…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="alert-box info mb-3">
                <Bell size={18} />
                <span style={{ fontSize: '13.5px' }}>
                  This notice will instantly appear on the dashboard of every student enrolled in {selectedClass?.department} Sem {selectedClass?.semester} Sec {selectedClass?.section}.
                </span>
              </div>

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  <Send size={16} />
                  <span>{submitting ? 'Publishing…' : 'Publish Circular'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
