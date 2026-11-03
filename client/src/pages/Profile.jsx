import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
  User,
  Mail,
  Phone,
  Building,
  Building2,
  Briefcase,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertTriangle,
  Camera,
  BadgeCheck,
  DoorClosed,
  MapPin,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

export default function Profile() {
  const { mentor, updateMentorState } = useAuth();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(mentor?.full_name || '');
  const [phone, setPhone] = useState(mentor?.phone || '');
  const [department, setDepartment] = useState(mentor?.department || '');
  const [designation, setDesignation] = useState(mentor?.designation || '');
  const [college, setCollege] = useState(mentor?.college || '');
  const [employeeId, setEmployeeId] = useState(mentor?.employee_id || '');
  const [batch, setBatch] = useState(mentor?.batch || '');
  const [cabinNumber, setCabinNumber] = useState(mentor?.cabin_number || 'Cabin 304, Block-B, 3rd Floor');
  const [address, setAddress] = useState(mentor?.address || 'Faculty Block B, Department of Computer Science & Engineering, Academic Campus, Delhi-NCR');

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Sync state if mentor context updates
  useEffect(() => {
    if (mentor) {
      if (mentor.full_name) setFullName(mentor.full_name);
      if (mentor.phone) setPhone(mentor.phone);
      if (mentor.department) setDepartment(mentor.department);
      if (mentor.designation) setDesignation(mentor.designation);
      if (mentor.college) setCollege(mentor.college);
      if (mentor.employee_id) setEmployeeId(mentor.employee_id);
      if (mentor.batch) setBatch(mentor.batch);
      if (mentor.cabin_number) setCabinNumber(mentor.cabin_number);
      if (mentor.address) setAddress(mentor.address);
    }
  }, [mentor]);

  function handleReset() {
    setFullName(mentor?.full_name || '');
    setPhone(mentor?.phone || '');
    setDepartment(mentor?.department || '');
    setDesignation(mentor?.designation || '');
    setCollege(mentor?.college || '');
    setEmployeeId(mentor?.employee_id || '');
    setBatch(mentor?.batch || '');
    setCabinNumber(mentor?.cabin_number || 'Cabin 304, Block-B, 3rd Floor');
    setAddress(mentor?.address || 'Faculty Block B, Department of Computer Science & Engineering, Academic Campus, Delhi-NCR');
    setNotice('');
    setError('');
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setNotice('');
      setError('');
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await apiRequest('/mentor/avatar', {
        method: 'POST',
        body: formData,
      });

      if (res.mentor) {
        updateMentorState(res.mentor);
        setNotice('Profile photo updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      const res = await apiRequest('/mentor/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          phone,
          department,
          designation,
          college,
          employee_id: employeeId,
          batch,
          cabin_number: cabinNumber,
          address,
        }),
      });

      updateMentorState(res.mentor);
      setNotice('Profile details updated successfully');
    } catch (err) {
      setError(err.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="page-header-row">
        <div>
          <h2>My Mentor Profile</h2>
          <p>Manage your faculty credentials, contact details, and institutional affiliation.</p>
        </div>
      </div>

      {notice && (
        <div className="alert-box success mb-4">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="alert-box error mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="profile-main-card">
        <div className="profile-avatar-row">
          <div
            className="mentor-avatar-large profile-avatar-box"
            onClick={() => fileInputRef.current?.click()}
            title="Click to change photo"
          >
            {mentor?.avatar_url ? (
              <img src={mentor.avatar_url} alt={fullName} className="profile-photo-img" />
            ) : (
              (fullName || 'MP').slice(0, 2).toUpperCase()
            )}
            <div className="avatar-edit-tag">
              <Camera size={13} />
            </div>
          </div>
          <div className="profile-avatar-meta">
            <h3>{fullName || 'Faculty Mentor'}</h3>
            <p>{designation || 'Faculty Member'} · {department || 'Department'}</p>
            <div className="badge-chip">Mentor ID: <strong>{employeeId || 'CSE-FAC-014'}</strong></div>
            <button
              type="button"
              className="photo-action-text-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              <Camera size={14} />
              <span>{uploadingPhoto ? 'Uploading Photo…' : (mentor?.avatar_url ? 'Change Photo' : 'Upload Photo')}</span>
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="profile-form-grid">
          {/* Section 1: Faculty Identity & Contact */}
          <div className="profile-form-section-title">
            <User size={15} />
            <span>Faculty Identity & Contact</span>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <div className="input-with-icon">
              <User size={16} />
              <input
                type="text"
                required
                placeholder="Dr. Manaswi Prakash"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Employee ID / Faculty Code</label>
            <div className="input-with-icon">
              <BadgeCheck size={16} />
              <input
                type="text"
                placeholder="CSE-FAC-014"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Registered Email (Institutional)</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input type="email" readOnly disabled value={mentor?.email || ''} />
            </div>
          </div>

          <div className="form-group">
            <label>Contact Phone Number</label>
            <div className="input-with-icon">
              <Phone size={16} />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Academic Designation & Scope */}
          <div className="profile-form-section-title">
            <Briefcase size={15} />
            <span>Academic Designation & Mentoring Scope</span>
          </div>

          <div className="form-group">
            <label>Designation</label>
            <div className="input-with-icon">
              <Briefcase size={16} />
              <input
                type="text"
                placeholder="e.g. Associate Professor"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Department</label>
            <div className="input-with-icon">
              <Building2 size={16} />
              <input
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Assigned Mentoring Batch</label>
            <div className="input-with-icon">
              <GraduationCap size={16} />
              <input
                type="text"
                placeholder="e.g. Batch 2024–28"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Cabin / Office Room Number</label>
            <div className="input-with-icon">
              <DoorClosed size={16} />
              <input
                type="text"
                placeholder="e.g. Cabin 304, Block-B, 3rd Floor"
                value={cabinNumber}
                onChange={(e) => setCabinNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>College / School / Faculty Name</label>
            <div className="input-with-icon">
              <Building size={16} />
              <input
                type="text"
                placeholder="e.g. School of Computer Science & Engineering"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Campus & Office Location */}
          <div className="profile-form-section-title">
            <MapPin size={15} />
            <span>Campus & Office Location</span>
          </div>

          <div className="form-group full-width">
            <label>Office / Campus Address</label>
            <div className="input-with-icon align-top">
              <MapPin size={16} />
              <textarea
                rows={2}
                placeholder="e.g. Faculty Block B, Department of Computer Science & Engineering, Academic Campus, Delhi-NCR"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Save Profile Changes Action Bar */}
          <div className="profile-save-bar">
            <div className="save-bar-info">
              <ShieldCheck size={18} />
              <span>Updates immediately reflect on your faculty card, dashboard, and mentee dossier views.</span>
            </div>
            <div className="save-bar-actions">
              <button
                type="button"
                className="profile-reset-btn"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                className="profile-save-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

