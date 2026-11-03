import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Megaphone,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react';

export default function StudentAnnouncements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const res = await apiRequest('/student/dashboard');
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load circulars');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  function formatNoticeDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="panel-card p-5 text-center">
        <div className="portal-spinner inline-spinner mb-3" />
        <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700 }}>Loading Official Circulars…</h4>
        <p style={{ color: 'var(--slate-blue)' }}>Retrieving class notices and announcements for your cohort.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert-box error m-4">
        <AlertTriangle size={20} />
        <div>
          <strong>Error Loading Circulars</strong>
          <p>{error || 'Could not retrieve circulars & notices'}</p>
        </div>
      </div>
    );
  }

  const { student, class_announcements = [] } = data;

  // Filter circulars
  const filtered = class_announcements.filter((ann) => {
    const matchesSearch =
      !search ||
      ann.title?.toLowerCase().includes(search.toLowerCase()) ||
      ann.content?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority =
      priorityFilter === 'ALL' ||
      ann.priority?.toUpperCase() === priorityFilter.toUpperCase();
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="student-announcements-page">
      {/* ── Top Header Banner ── */}
      <div className="card-header-clean mb-4" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="sem-module-badge student-badge mb-2">
            <Megaphone size={14} />
            <span>OFFICIAL SECTION BULLETIN</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--deep-violet-ink)', margin: '0 0 6px' }}>
            Class Circulars & Notices
          </h2>
          <p style={{ margin: 0, color: 'var(--slate-blue)', fontSize: '15px' }}>
            Official announcements, examination notifications, and academic advisories for your class section.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge-tag coordinator-tag" style={{ fontSize: '13px', padding: '6px 14px' }}>
            {student.department} · Sem {student.semester} · Section {student.section || 'A'}
          </span>
          <span className="badge-bubble" style={{ fontSize: '13px', padding: '6px 12px' }}>
            {class_announcements.length} Total Circulars
          </span>
        </div>
      </div>

      {/* ── Filters & Search Row ── */}
      <div
        className="panel-card p-3 mb-4"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-text)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search circulars by keyword or topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40, width: '100%', marginBottom: 0 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Filter size={16} style={{ color: 'var(--muted-text)' }} />
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--slate-blue)' }}>Priority:</span>
          {['ALL', 'URGENT', 'HIGH', 'NORMAL'].map((p) => (
            <button
              key={p}
              type="button"
              className={`pill-btn ${priorityFilter === p ? 'active' : ''}`}
              onClick={() => setPriorityFilter(p)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: priorityFilter === p ? '1.5px solid var(--cornflower-blue)' : '1px solid var(--light-border)',
                background: priorityFilter === p ? '#EEF4FF' : '#FFFFFF',
                color: priorityFilter === p ? 'var(--deep-violet-ink)' : 'var(--slate-blue)',
                fontWeight: priorityFilter === p ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notices Stream ── */}
      {filtered.length === 0 ? (
        <div className="panel-card p-5 text-center">
          <Megaphone size={40} style={{ color: 'var(--muted-text)', margin: '0 auto 12px' }} />
          <h4 style={{ color: 'var(--deep-violet-ink)', fontWeight: 700 }}>No Circulars Match Your Criteria</h4>
          <p style={{ color: 'var(--slate-blue)', fontSize: '14.5px', margin: 0 }}>
            {search || priorityFilter !== 'ALL'
              ? 'Try clearing your search query or priority filters.'
              : 'There are currently no active circulars or notices published for your section.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((ann) => (
            <div
              key={ann.id}
              className="student-notice-card"
              style={{ padding: '20px 24px', background: '#FFFFFF', boxShadow: '0 4px 18px rgba(57, 56, 95, 0.05)' }}
            >
              <div className="notice-card-top" style={{ marginBottom: 12 }}>
                <div className="notice-title-box">
                  <span className={`priority-pill ${ann.priority || 'normal'}`}>
                    {ann.priority?.toUpperCase() || 'NORMAL'}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--deep-violet-ink)', margin: 0 }}>
                    {ann.title}
                  </h3>
                </div>
                <span className="notice-date-badge" style={{ fontSize: '13px' }}>
                  <Clock size={13} />
                  {formatNoticeDate(ann.created_at)}
                </span>
              </div>

              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--slate-blue)', margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>
                {ann.content}
              </p>

              <div className="notice-card-footer" style={{ fontSize: '13px', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} style={{ color: 'var(--iris-bloom)' }} />
                  <span>
                    Issued by:{' '}
                    <strong style={{ color: 'var(--deep-violet-ink)' }}>
                      {ann.coordinator_name || ann.mentor_name || 'Class Coordinator'}
                    </strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge-tag" style={{ background: '#F8F7FC', color: 'var(--slate-blue)', fontSize: '12px' }}>
                    Section {student.section || 'A'} · Sem {student.semester}
                  </span>
                  <span className="badge-tag" style={{ background: '#E6F7ED', color: '#166534', fontSize: '12px' }}>
                    ✓ Official Notice
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

