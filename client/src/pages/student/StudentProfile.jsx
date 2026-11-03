import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  Award,
  AlertTriangle,
  Building,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function StudentProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await apiRequest('/student/profile');
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="panel-card p-5 text-center">
        <div className="portal-spinner inline-spinner mb-3" />
        <h4 style={{ color: 'var(--deep-violet-ink)' }}>Loading Student Dossier…</h4>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert-box error m-4">
        <AlertTriangle size={20} />
        <span>{error || 'Profile could not be loaded.'}</span>
      </div>
    );
  }

  const { mentee, profile } = data;

  return (
    <div className="student-profile-page">
      <div className="page-header-row mb-4">
        <div>
          <div className="sem-module-badge student-badge">
            <User size={14} />
            <span>CONFIDENTIAL STUDENT DOSSIER</span>
          </div>
          <h2>My Official Student Profile</h2>
          <p>Verified institutional and academic record on file with the college mentoring office.</p>
        </div>
      </div>

      {/* ── Section 1: Personal Dossier & Photos ── */}
      <div className="panel-card p-4 mb-4">
        <h3 className="section-title-clean">1. Personal & Identity Details</h3>

        <div className="student-profile-grid">
          {/* Photos column */}
          <div className="student-photos-col">
            <div className="photo-box">
              {profile?.student_photo_url ? (
                <img src={profile.student_photo_url} alt={mentee.full_name} className="photo-img" />
              ) : (
                <div className="photo-placeholder">
                  <User size={36} />
                  <span>Student Photo</span>
                </div>
              )}
              <span className="photo-label">Student Photograph</span>
            </div>

            {profile?.father_photo_url && (
              <div className="photo-box mt-3">
                <img src={profile.father_photo_url} alt="Father" className="photo-img" />
                <span className="photo-label">Father's Photo</span>
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="student-details-col">
            <div className="info-fields-grid">
              <div className="info-field">
                <span className="info-label">Full Name</span>
                <strong className="info-val">{mentee.full_name}</strong>
              </div>
              <div className="info-field">
                <span className="info-label">Roll Number</span>
                <strong className="info-val">{mentee.roll_number}</strong>
              </div>
              <div className="info-field">
                <span className="info-label">Admission Number</span>
                <strong className="info-val">{mentee.admission_number || '—'}</strong>
              </div>
              <div className="info-field">
                <span className="info-label">Student Email</span>
                <strong className="info-val">{mentee.email}</strong>
              </div>
              <div className="info-field">
                <span className="info-label">Contact Phone</span>
                <strong className="info-val">{mentee.phone || profile?.mobile_no || '—'}</strong>
              </div>
              <div className="info-field">
                <span className="info-label">Gender / DOB</span>
                <strong className="info-val">
                  {profile?.gender || mentee.gender || '—'} {profile?.dob ? `· ${profile.dob}` : ''}
                </strong>
              </div>
              <div className="info-field">
                <span className="info-label">Blood Group</span>
                <strong className="info-val">{profile?.blood_group || '—'}</strong>
              </div>
              <div className="info-field">
                <span className="info-label">Aadhar Number</span>
                <strong className="info-val">{profile?.aadhar_number || '—'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: College Academic Placement ── */}
      <div className="panel-card p-4 mb-4">
        <h3 className="section-title-clean">2. College Academic Details</h3>
        <div className="info-fields-grid">
          <div className="info-field">
            <span className="info-label">Department</span>
            <strong className="info-val">{mentee.department}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Active Semester</span>
            <strong className="info-val">Semester {mentee.semester}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Enrolled Batch</span>
            <strong className="info-val">{mentee.batch || 'Batch 2024–28'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Academic Year</span>
            <strong className="info-val">{mentee.academic_year || '2026–27'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Section</span>
            <strong className="info-val">{mentee.section || 'A'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Attendance Recorded</span>
            <strong className="info-val">
              {profile?.attendance_percentage ? `${profile.attendance_percentage}%` : '—'}
            </strong>
          </div>
        </div>
      </div>

      {/* ── Section 3: Family Information ── */}
      <div className="panel-card p-4 mb-4">
        <h3 className="section-title-clean">3. Family & Guardian Details</h3>
        <div className="info-fields-grid">
          <div className="info-field">
            <span className="info-label">Father's Name</span>
            <strong className="info-val">{profile?.father_name || '—'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Father's Phone</span>
            <strong className="info-val">{profile?.father_mobile || profile?.father_phone || '—'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Father's Occupation</span>
            <strong className="info-val">{profile?.father_occupation || '—'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Mother's Name</span>
            <strong className="info-val">{profile?.mother_name || '—'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Mother's Phone</span>
            <strong className="info-val">{profile?.mother_mobile || '—'}</strong>
          </div>
          <div className="info-field">
            <span className="info-label">Permanent Address</span>
            <strong className="info-val">{profile?.permanent_address || '—'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

