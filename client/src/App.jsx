
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API = '/api';

const emptyForm = {
  full_name: '',
  email: '',
  roll_number: '',
  department: '',
  semester: '',
  mentor_id: '',
};

function App() {
  const [mentees, setMentees] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [linkModal, setLinkModal] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [linkLoadingId, setLinkLoadingId] = useState(null);

  async function loadDashboard() {
    try {
      const [menteesResponse, mentorsResponse] = await Promise.all([
        fetch(`${API}/mentees`),
        fetch(`${API}/mentors`),
      ]);

      if (!menteesResponse.ok || !mentorsResponse.ok) {
        throw new Error('Dashboard data load nahi ho paya.');
      }

      const menteesData = await menteesResponse.json();
      const mentorsData = await mentorsResponse.json();

      setMentees(menteesData);
      setMentors(mentorsData);
      setError('');
    } catch (err) {
      setError(err.message || 'Backend se connect nahi ho paya.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredMentees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return mentees;

    return mentees.filter((mentee) =>
      [
        mentee.full_name,
        mentee.email,
        mentee.roll_number,
        mentee.department,
      ].some((value) => value?.toLowerCase().includes(query))
    );
  }, [mentees, search]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      const response = await fetch(`${API}/mentees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...form,
          semester: form.semester || null,
          mentor_id: form.mentor_id || null,
        }),
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Unexpected server response:', {
          status: response.status,
          response: responseText.slice(0, 500),
        });

        throw new Error(
          `Server se unexpected response mila (HTTP ${response.status}). Browser Console aur backend terminal check karo.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'Mentee add nahi ho paya.');
      }

      setForm(emptyForm);
      setShowForm(false);
      setNotice('Mentee successfully add ho gaya!');

      await loadDashboard();
    } catch (err) {
      setError(
        err.message ||
          'Mentee add nahi ho paya. Backend connection check karo.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleOpenUniversalModal(specificMentee = null) {
    const universalLink = `${window.location.origin}/form`;
    setLinkModal({
      isUniversal: !specificMentee,
      mentee: specificMentee || { full_name: 'All Students / Mentees' },
      link: universalLink,
      copied: false,
    });
  }

  async function handleGenerateLink(mentee) {
    handleOpenUniversalModal(mentee);
  }

  async function handleViewProfile(mentee) {
    setProfileLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/mentees/${mentee.id}/profile`);
      if (res.status === 404) {
        setProfileModal({
          notSubmitted: true,
          mentee,
        });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile load nahi ho payi.');
      setProfileModal(data);
    } catch (err) {
      setError(err.message || 'Profile fetch nahi ho payi.');
    } finally {
      setProfileLoading(false);
    }
  }

  function handleCopyLink(text) {
    navigator.clipboard.writeText(text);
    if (linkModal) {
      setLinkModal((prev) => ({ ...prev, copied: true }));
      setTimeout(() => {
        setLinkModal((prev) => (prev ? { ...prev, copied: false } : null));
      }, 2500);
    }
  }

  function handleShareWhatsApp(mentee, link) {
    const isSingle = mentee?.full_name && mentee.full_name !== 'All Students / Mentees';
    const text = isSingle
      ? `Hello ${mentee.full_name},\n\nPlease fill out your student details and academic background using this link:\n${link}\n\nThank you!`
      : `Dear students,\n\nPlease fill out your Mentee Information Form (Personal & Academic details, CGPA & Backlogs) using this official link:\n${link}\n\nThank you!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }

  const stats = [
    {
      label: 'Total Mentees',
      value: mentees.length,
      change: 'From Supabase database',
      icon: '👥',
    },
    {
      label: 'Active Mentors',
      value: mentors.length,
      change: 'From Supabase database',
      icon: '🎓',
    },
    {
      label: 'Avg. Attendance',
      value: '—',
      change: 'Attendance tracking not connected',
      icon: '📊',
    },
    {
      label: 'At-Risk Students',
      value: '—',
      change: 'Academic records not connected',
      icon: '⚠️',
    },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">M</div>
          <div>
            <h2>Mentora</h2>
            <span>MENTORING PORTAL</span>
          </div>
        </div>

        <div className="menu-label">WORKSPACE</div>

        <nav className="nav-menu">
          <a className="nav-item active" href="#dashboard">
            <span>▦</span> Dashboard
          </a>
          <a className="nav-item" href="#mentees">
            <span>♙</span> My Mentees
          </a>
          <a className="nav-item" href="#attendance">
            <span>◷</span> Attendance
          </a>
          <a className="nav-item" href="#performance">
            <span>▥</span> Performance
          </a>
          <a className="nav-item" href="#sessions">
            <span>▤</span> Mentoring Sessions
          </a>
          <a className="nav-item" href="#wellness">
            <span>♡</span> Student Wellness
          </a>
        </nav>

        <div className="menu-label support-label">MANAGEMENT</div>

        <nav className="nav-menu">
          <a className="nav-item" href="#reports">
            <span>▧</span> Reports
          </a>
          <a className="nav-item" href="#settings">
            <span>⚙</span> Settings
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>Need assistance?</strong>
            <p>Get help managing your mentoring workspace.</p>
            <button
              onClick={() =>
                alert('Help centre will be available soon.')
              }
            >
              Visit Help Centre ↗
            </button>
          </div>

          <div className="profile">
            <div className="avatar">MP</div>
            <div className="profile-info">
              <strong>Mentor Profile</strong>
              <span>Administrator</span>
            </div>
            <span className="profile-dots">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>

          <div className="topbar-actions">
            <span className="today-label">Academic Year 2026–27</span>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => alert('You are all caught up!')}
            >
              ♧
            </button>
            <div className="avatar top-avatar">MP</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <div className="eyebrow">
              <span className="live-dot"></span> MENTORING OVERVIEW
            </div>
            <h1>
              Good morning, Mentor! <span>✦</span>
            </h1>
            <p>Here's what's happening with your mentees today.</p>
          </div>

          <div className="welcome-actions">
            <button
              className="share-group-link-btn"
              type="button"
              onClick={() => handleOpenUniversalModal()}
            >
              <span>📢</span> Share Form Link (WhatsApp)
            </button>

            <button
              className="primary-button"
              onClick={() => {
                setShowForm((previous) => !previous);
                setNotice('');
                setError('');
              }}
            >
              <span>{showForm ? '×' : '＋'}</span>
              {showForm ? 'Cancel' : 'Add New Mentee'}
            </button>
          </div>
        </section>

        {notice && (
          <div role="status" className="form-notice success-notice">
            ✓ {notice}
          </div>
        )}

        {error && (
          <div role="alert" className="form-notice error-notice">
            {error}
          </div>
        )}

        {showForm && (
          <section className="panel add-mentee-panel">
            <div className="panel-heading">
              <div>
                <h2>Add New Mentee</h2>
                <p>Enter student details below.</p>
              </div>
            </div>

            <form className="mentee-form" onSubmit={handleSubmit}>
              <label>
                Full Name *
                <input
                  required
                  maxLength={150}
                  value={form.full_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      full_name: event.target.value,
                    })
                  }
                  placeholder="Enter student name"
                />
              </label>

              <label>
                Email Address *
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  placeholder="student@example.com"
                />
              </label>

              <label>
                Roll Number *
                <input
                  required
                  maxLength={50}
                  value={form.roll_number}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      roll_number: event.target.value,
                    })
                  }
                  placeholder="e.g. CSE003"
                />
              </label>

              <label>
                Department
                <input
                  maxLength={100}
                  value={form.department}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      department: event.target.value,
                    })
                  }
                  placeholder="e.g. Computer Science"
                />
              </label>

              <label>
                Semester
                <select
                  value={form.semester}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      semester: event.target.value,
                    })
                  }
                >
                  <option value="">Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Assign Mentor
                <select
                  value={form.mentor_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      mentor_id: event.target.value,
                    })
                  }
                >
                  <option value="">No mentor assigned</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                    setError('');
                  }}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Mentee'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <div className="stat-top">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-icon">{stat.icon}</span>
              </div>
              <h2>{loading ? '…' : stat.value}</h2>
              <p className="stat-note">{stat.change}</p>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel students-panel" id="mentees">
            <div className="panel-heading">
              <div>
                <h2>Mentee Overview</h2>
                <p>Keep track of your students' progress.</p>
              </div>

              <button
                className="text-button"
                onClick={() => setSearch('')}
              >
                Clear search →
              </button>
            </div>

            <div className="table-toolbar">
              <div className="search-box">
                <span>⌕</span>
                <input
                  aria-label="Search mentees"
                  placeholder="Search by name, email or roll no..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>DEPARTMENT</th>
                    <th>ROLL NUMBER</th>
                    <th>SEMESTER</th>
                    <th style={{ textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5">Loading mentees…</td>
                    </tr>
                  ) : filteredMentees.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        {error
                          ? 'Could not load mentees.'
                          : 'No mentees found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMentees.map((mentee) => (
                      <tr key={mentee.id}>
                        <td>
                          <div className="student-cell">
                            <div className="student-avatar">
                              {(mentee.full_name || 'M')
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)}
                            </div>

                            <div>
                              <strong>{mentee.full_name}</strong>
                              <span>{mentee.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{mentee.department || '—'}</td>
                        <td>{mentee.roll_number || '—'}</td>
                        <td>{mentee.semester ?? '—'}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="action-btn link-action-btn"
                              title="Generate form link for this mentee"
                              disabled={linkLoadingId === mentee.id}
                              onClick={() => handleGenerateLink(mentee)}
                            >
                              {linkLoadingId === mentee.id ? '…' : '🔗 Link'}
                            </button>
                            <button
                              className="action-btn profile-action-btn"
                              title="View student submitted profile & CGPA"
                              disabled={profileLoading}
                              onClick={() => handleViewProfile(mentee)}
                            >
                              👤 Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <h2>Mentor Directory</h2>
                <p>Mentors registered in the system.</p>
              </div>
            </div>

            {loading ? (
              <p>Loading mentors…</p>
            ) : mentors.length === 0 ? (
              <p>No mentors registered yet.</p>
            ) : (
              mentors.map((mentor) => (
                <div className="session-item" key={mentor.id}>
                  <div className="date-box">
                    <span>MENTOR</span>
                    <strong>
                      {(mentor.full_name || 'M').slice(0, 1)}
                    </strong>
                  </div>

                  <div className="session-details">
                    <strong>{mentor.full_name}</strong>
                    <span>{mentor.email}</span>
                    <span className="session-type">
                      {mentor.department || 'Department not set'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </article>
        </section>

        <footer className="footer">
          <span>
            © 2026 Mentora · Mentor–Mentee Management System
          </span>
          <span>
            <span className="live-dot"></span>{' '}
            {error ? 'Connection issue' : 'Dashboard loaded from API'}
          </span>
        </footer>
      </main>

      {/* ── Link Share Modal ── */}
      {linkModal && (
        <div className="modal-overlay" onClick={() => setLinkModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🔗</span>
                <div>
                  <h3>Student Registration & Details Form Link</h3>
                  <p>Common Link for <strong>{linkModal.mentee?.full_name || 'All Students'}</strong></p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setLinkModal(null)}>×</button>
            </div>

            <div className="modal-body">
              <p className="modal-instruction">
                Ye same link aap apne sabhi students ko WhatsApp group ya individual message mein bhej sakte hain.
                Har student is link par apni personal details, academic background, current CGPA aur backlogs fill karke submit kar sakta hai.
              </p>

              <div className="link-input-group">
                <input
                  type="text"
                  readOnly
                  value={linkModal.link}
                  className="link-input"
                  onClick={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => handleCopyLink(linkModal.link)}
                >
                  {linkModal.copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </div>

              <div className="whatsapp-action-box">
                <button
                  type="button"
                  className="whatsapp-btn"
                  onClick={() => handleShareWhatsApp(linkModal.mentee, linkModal.link)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z" />
                  </svg>
                  Share on WhatsApp (Group / Mentee)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Profile Modal ── */}
      {profileModal && (
        <div className="modal-overlay" onClick={() => setProfileModal(null)}>
          <div className="modal-card modal-card-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">👤</span>
                <div>
                  <h3>
                    {profileModal.notSubmitted
                      ? `${profileModal.mentee.full_name} — Profile`
                      : `${profileModal.full_name} — Full Profile`}
                  </h3>
                  <p>
                    {profileModal.notSubmitted
                      ? 'Status: Form not submitted yet'
                      : `Submitted: ${profileModal.submitted_at ? new Date(profileModal.submitted_at).toLocaleDateString() : 'Yes'}`}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setProfileModal(null)}>×</button>
            </div>

            <div className="modal-body">
              {profileModal.notSubmitted ? (
                <div className="profile-empty-state">
                  <div className="empty-icon">⏳</div>
                  <h4>No Details Submitted Yet</h4>
                  <p>
                    This student hasn't submitted their profile form yet. Generate a form link and send it via WhatsApp.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ marginTop: 14 }}
                    onClick={() => {
                      const m = profileModal.mentee;
                      setProfileModal(null);
                      handleGenerateLink(m);
                    }}
                  >
                    🔗 Generate Link Now
                  </button>
                </div>
              ) : (
                <div className="profile-details-wrap">
                  {/* Quick Highlight Stats */}
                  <div className="profile-stats-row">
                    <div className="profile-stat-box">
                      <span className="stat-label-tiny">CURRENT CGPA</span>
                      <strong className="stat-val-big">{profileModal.current_cgpa ?? '—'}</strong>
                    </div>
                    <div className="profile-stat-box">
                      <span className="stat-label-tiny">BACKLOGS</span>
                      <strong className={`stat-val-big ${Number(profileModal.total_backlogs) > 0 ? 'text-warn' : 'text-good'}`}>
                        {profileModal.total_backlogs ?? 0}
                      </strong>
                    </div>
                    <div className="profile-stat-box">
                      <span className="stat-label-tiny">ATTENDANCE</span>
                      <strong className="stat-val-big">
                        {profileModal.attendance_percentage != null ? `${profileModal.attendance_percentage}%` : '—'}
                      </strong>
                    </div>
                    <div className="profile-stat-box">
                      <span className="stat-label-tiny">YEAR</span>
                      <strong className="stat-val-big">
                        {profileModal.current_year ? `Year ${profileModal.current_year}` : '—'}
                      </strong>
                    </div>
                  </div>

                  {/* Personal & Contact Details */}
                  <div className="profile-group">
                    <h4 className="profile-group-title">📞 Personal & Contact Details</h4>
                    <div className="profile-keyval-grid">
                      <div className="keyval-item"><span>Full Name:</span> <strong>{profileModal.full_name}</strong></div>
                      <div className="keyval-item"><span>Email:</span> <strong>{profileModal.email}</strong></div>
                      <div className="keyval-item"><span>Phone:</span> <strong>{profileModal.phone || '—'}</strong></div>
                      <div className="keyval-item"><span>Date of Birth:</span> <strong>{profileModal.date_of_birth ? profileModal.date_of_birth.split('T')[0] : '—'}</strong></div>
                      <div className="keyval-item"><span>Blood Group:</span> <strong>{profileModal.blood_group || '—'}</strong></div>
                      <div className="keyval-item"><span>Parent / Guardian:</span> <strong>{profileModal.parent_name || '—'}</strong></div>
                      <div className="keyval-item"><span>Parent Phone:</span> <strong>{profileModal.parent_phone || '—'}</strong></div>
                      <div className="keyval-item full-width-item"><span>Current Address:</span> <strong>{profileModal.address || '—'}</strong></div>
                    </div>
                  </div>

                  {/* Academic Background */}
                  <div className="profile-group">
                    <h4 className="profile-group-title">🎓 Academic Background</h4>
                    <div className="profile-keyval-grid">
                      <div className="keyval-item"><span>10th Percentage:</span> <strong>{profileModal.tenth_percentage != null ? `${profileModal.tenth_percentage}%` : '—'}</strong></div>
                      <div className="keyval-item"><span>12th Percentage:</span> <strong>{profileModal.twelfth_percentage != null ? `${profileModal.twelfth_percentage}%` : '—'}</strong></div>
                      <div className="keyval-item"><span>Entrance Score:</span> <strong>{profileModal.entrance_exam_score || '—'}</strong></div>
                      <div className="keyval-item"><span>Department:</span> <strong>{profileModal.department || '—'}</strong></div>
                      <div className="keyval-item"><span>Roll Number:</span> <strong>{profileModal.roll_number}</strong></div>
                      <div className="keyval-item"><span>Semester:</span> <strong>{profileModal.semester ?? '—'}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
