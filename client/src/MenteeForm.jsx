import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './MenteeForm.css';

const API = '/api';

export default function MenteeForm() {
  const { token } = useParams();
  const isUniversal = !token;

  const [status, setStatus] = useState(isUniversal ? 'ready' : 'loading'); // loading | ready | submitting | success | error | expired | submitted
  const [errorMsg, setErrorMsg] = useState('');
  const [mentee, setMentee] = useState(null);
  const [mentors, setMentors] = useState([]);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    roll_number: '',
    department: '',
    semester: '',
    mentor_id: '',
    phone: '',
    date_of_birth: '',
    blood_group: '',
    current_address: '',
    parent_name: '',
    parent_phone: '',
    tenth_percentage: '',
    twelfth_percentage: '',
    entrance_exam_score: '',
    current_cgpa: '',
    active_backlogs: '',
    attendance_percentage: '',
    current_year: '',
  });

  // Fetch mentors for universal form dropdown
  useEffect(() => {
    fetch(`${API}/mentors`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMentors(data))
      .catch(() => {});
  }, []);

  // Validate token if provided
  useEffect(() => {
    if (!token) return;

    async function validate() {
      try {
        const res = await fetch(`${API}/form/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 410 || data.error?.toLowerCase().includes('expired')) {
            setStatus('expired');
            setErrorMsg(data.error || 'This link has expired. Please ask your mentor for a fresh link.');
          } else if (res.status === 409 || data.error?.toLowerCase().includes('already submitted')) {
            setStatus('submitted');
            setErrorMsg(data.error || 'You have already submitted this form.');
          } else {
            setStatus('error');
            setErrorMsg(data.error || 'Invalid or unknown link.');
          }
          return;
        }

        const menteeData = data.mentee || data;
        setMentee(menteeData);
        setForm((prev) => ({
          ...prev,
          full_name: menteeData.full_name || '',
          email: menteeData.email || '',
          roll_number: menteeData.roll_number || '',
          department: menteeData.department || '',
          semester: menteeData.semester ? String(menteeData.semester) : '',
        }));

        if (data.existing_profile) {
          const p = data.existing_profile;
          setForm((prev) => ({
            ...prev,
            phone: p.phone || prev.phone,
            date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : prev.date_of_birth,
            blood_group: p.blood_group || prev.blood_group,
            current_address: p.address || p.current_address || prev.current_address,
            parent_name: p.parent_name || prev.parent_name,
            parent_phone: p.parent_phone || prev.parent_phone,
            tenth_percentage: p.tenth_percentage ?? prev.tenth_percentage,
            twelfth_percentage: p.twelfth_percentage ?? prev.twelfth_percentage,
            entrance_exam_score: p.entrance_exam_score || prev.entrance_exam_score,
            current_cgpa: p.current_cgpa ?? prev.current_cgpa,
            active_backlogs: p.total_backlogs ?? p.active_backlogs ?? prev.active_backlogs,
            attendance_percentage: p.attendance_percentage ?? prev.attendance_percentage,
            current_year: p.current_year ? String(p.current_year) : prev.current_year,
          }));
        }

        setStatus('ready');
      } catch {
        setStatus('error');
        setErrorMsg('Server se connect nahi ho paya. Please internet check karein.');
      }
    }

    validate();
  }, [token]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const endpoint = token ? `${API}/form/${token}` : `${API}/form/submit`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          address: form.current_address,
          total_backlogs: form.active_backlogs,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed. Please check required fields.');
      }

      setStatus('success');
    } catch (err) {
      setStatus('ready');
      setErrorMsg(err.message || 'Error occurred while saving profile.');
    }
  }

  /* ── Loading Screen ── */
  if (status === 'loading') {
    return (
      <div className="mentee-form-page">
        <div className="form-status-screen">
          <div className="spinner" />
          <h2>Loading form…</h2>
          <p>Please wait while we prepare your form.</p>
        </div>
      </div>
    );
  }

  /* ── Error Screen ── */
  if (status === 'error') {
    return (
      <div className="mentee-form-page">
        <div className="form-status-screen">
          <div className="status-icon">❌</div>
          <h2>Invalid Link</h2>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  /* ── Expired Screen ── */
  if (status === 'expired') {
    return (
      <div className="mentee-form-page">
        <div className="form-status-screen">
          <div className="status-icon">⏰</div>
          <h2>Link Expired</h2>
          <p>{errorMsg || 'This link has expired. Ask your mentor for a new link.'}</p>
        </div>
      </div>
    );
  }

  /* ── Already Submitted Screen ── */
  if (status === 'submitted') {
    return (
      <div className="mentee-form-page">
        <div className="form-status-screen">
          <div className="status-icon">📝</div>
          <h2>Already Submitted</h2>
          <p>{errorMsg || 'You have already submitted your details. Contact your mentor for updates.'}</p>
        </div>
      </div>
    );
  }

  /* ── Success Screen ── */
  if (status === 'success') {
    return (
      <div className="mentee-form-page">
        <div className="form-status-screen success-screen">
          <div className="success-checkmark">
            <svg viewBox="0 0 24 24">
              <polyline className="check-path" points="6 12 10 16 18 8" />
            </svg>
          </div>
          <h2>Thank You!</h2>
          <p>
            Your student profile and academic details have been submitted successfully.
            Your mentor can now view your records on their portal.
          </p>
        </div>
      </div>
    );
  }

  const isSubmitting = status === 'submitting';

  return (
    <div className="mentee-form-page">
      <div className="mentee-form-card">
        <div className="form-header">
          <div className="form-brand-badge">🎓 Mentora Portal</div>
          <h1>Mentee Information Form</h1>
          <p>Please enter your personal details, academic history, and current status below.</p>
        </div>

        {/* If using token with pre-filled student info */}
        {mentee && (
          <div className="mentee-info-bar">
            <div className="mentee-info-item">
              <span className="info-label">STUDENT NAME</span>
              <span className="info-value">{mentee.full_name || '—'}</span>
            </div>
            <div className="mentee-info-item">
              <span className="info-label">EMAIL ADDRESS</span>
              <span className="info-value">{mentee.email || '—'}</span>
            </div>
            <div className="mentee-info-item">
              <span className="info-label">ROLL NUMBER</span>
              <span className="info-value">{mentee.roll_number || '—'}</span>
            </div>
          </div>
        )}

        <form className="form-body" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="form-error-alert">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* ── Section 0: Student Basic Identity (only if universal form or not pre-filled) ── */}
          {(!mentee || isUniversal) && (
            <div className="form-section">
              <h3 className="form-section-title">📌 Student Information</h3>
              <div className="form-section-divider" />
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    id="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="roll_number">Roll Number *</label>
                  <input
                    id="roll_number"
                    type="text"
                    placeholder="e.g. 21CS045"
                    value={form.roll_number}
                    onChange={(e) => updateField('roll_number', e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="department">Department</label>
                  <input
                    id="department"
                    type="text"
                    placeholder="e.g. Computer Science & Engg"
                    value={form.department}
                    onChange={(e) => updateField('department', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="semester">Current Semester</label>
                  <select
                    id="semester"
                    value={form.semester}
                    onChange={(e) => updateField('semester', e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="mentor_id">Assigned Mentor</label>
                  <select
                    id="mentor_id"
                    value={form.mentor_id}
                    onChange={(e) => updateField('mentor_id', e.target.value)}
                  >
                    <option value="">Select Mentor</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} {m.department ? `(${m.department})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Section 1: Personal & Contact Details ── */}
          <div className="form-section">
            <h3 className="form-section-title">📞 Personal & Contact Details</h3>
            <div className="form-section-divider" />
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="phone">Mobile Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="dob">Date of Birth *</label>
                <input
                  id="dob"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="blood_group">Blood Group *</label>
                <select
                  id="blood_group"
                  value={form.blood_group}
                  onChange={(e) => updateField('blood_group', e.target.value)}
                  required
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="parent_name">Parent / Guardian Name *</label>
                <input
                  id="parent_name"
                  type="text"
                  placeholder="Parent or Guardian name"
                  value={form.parent_name}
                  onChange={(e) => updateField('parent_name', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="parent_phone">Parent / Guardian Phone *</label>
                <input
                  id="parent_phone"
                  type="tel"
                  placeholder="Parent mobile number"
                  value={form.parent_phone}
                  onChange={(e) => updateField('parent_phone', e.target.value)}
                  required
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="address">Current Address *</label>
                <textarea
                  id="address"
                  placeholder="Enter full address / hostel room details"
                  value={form.current_address}
                  onChange={(e) => updateField('current_address', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Academic History ── */}
          <div className="form-section">
            <h3 className="form-section-title">🎓 Academic Background</h3>
            <div className="form-section-divider" />
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="tenth">10th Percentage (%)</label>
                <input
                  id="tenth"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 88.50"
                  value={form.tenth_percentage}
                  onChange={(e) => updateField('tenth_percentage', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="twelfth">12th Percentage (%)</label>
                <input
                  id="twelfth"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 82.40"
                  value={form.twelfth_percentage}
                  onChange={(e) => updateField('twelfth_percentage', e.target.value)}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="entrance">Entrance Exam Score / Rank</label>
                <input
                  id="entrance"
                  type="text"
                  placeholder="e.g. JEE Main 95.2 Percentile / Rank 4500"
                  value={form.entrance_exam_score}
                  onChange={(e) => updateField('entrance_exam_score', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Current Academic Status ── */}
          <div className="form-section">
            <h3 className="form-section-title">📊 Current Academic Status</h3>
            <div className="form-section-divider" />
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="cgpa">Current Cumulative CGPA (0 - 10) *</label>
                <input
                  id="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.45"
                  value={form.current_cgpa}
                  onChange={(e) => updateField('current_cgpa', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="backlogs">Active Backlogs Count *</label>
                <input
                  id="backlogs"
                  type="number"
                  min="0"
                  placeholder="0 if none"
                  value={form.active_backlogs}
                  onChange={(e) => updateField('active_backlogs', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="attendance">Attendance Percentage (%)</label>
                <input
                  id="attendance"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 85.0"
                  value={form.attendance_percentage}
                  onChange={(e) => updateField('attendance_percentage', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="year">Current Year</label>
                <select
                  id="year"
                  value={form.current_year}
                  onChange={(e) => updateField('current_year', e.target.value)}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
          </div>

          <button className="form-submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting Details…' : '✓ Submit Details to Mentor'}
          </button>
        </form>
      </div>
    </div>
  );
}
