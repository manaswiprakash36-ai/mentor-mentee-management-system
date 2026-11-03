import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { uploadFile } from '../utils/api';
import {
  User,
  Users,
  Camera,
  BookOpen,
  GraduationCap,
  Award,
  AlertTriangle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Shield,
  FileCheck,
  Printer,
  Sparkles,
  Calendar,
  Building,
  Check,
  HelpCircle,
} from 'lucide-react';

const SECTIONS = [
  { id: 1, title: 'Personal Info', icon: User, desc: 'Basic identification & address' },
  { id: 2, title: 'Family Info', icon: Users, desc: 'Parents & guardian details' },
  { id: 3, title: 'Photographs', icon: Camera, desc: 'Student and parents photos' },
  { id: 4, title: 'Class 10th', icon: BookOpen, desc: 'Secondary school records' },
  { id: 5, title: 'Class 12th', icon: GraduationCap, desc: 'Higher secondary / diploma' },
  { id: 6, title: 'College Academics', icon: Building, desc: 'Current college performance' },
  { id: 7, title: 'Attendance', icon: Calendar, desc: 'Semester attendance records' },
  { id: 8, title: 'Result Upload', icon: FileText, desc: 'Semester-wise marksheets & submit' },
];

export default function PublicMenteeForm() {
  const { token } = useParams();

  // Verification state of link token
  const [tokenInfo, setTokenInfo] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState('');

  // Active Section Step (1 to 8)
  const [currentStep, setCurrentStep] = useState(1);

  // Field validation errors
  const [errors, setErrors] = useState({});

  // Main Form State across all 8 sections
  const [form, setForm] = useState({
    // Section 1: Personal Details
    full_name: '',
    roll_number: '',
    university_roll_number: '',
    admission_number: '',
    branch_department: '',
    course_degree: 'B.Tech in Computer Science & Engineering',
    semester: '5',
    academic_year: '2026-27',
    section: 'A',
    college_name: 'School of Engineering & Technology',
    email: '',
    phone: '',
    alt_phone: '',
    date_of_birth: '',
    blood_group: 'B+',
    gender: 'Male',
    // Address Details
    house_no: '',
    street: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    country: 'India',
    is_permanent_same: true,
    permanent_address: '',

    // Section 2: Family Information
    father_name: '',
    father_phone: '',
    father_email: '',
    father_occupation: '',
    mother_name: '',
    mother_phone: '',
    mother_email: '',
    mother_occupation: '',
    has_different_guardian: false,
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_occupation: '',

    // Section 3: Photographs
    student_photo_url: '',
    student_photo_filename: '',
    father_photo_url: '',
    father_photo_filename: '',
    mother_photo_url: '',
    mother_photo_filename: '',

    // Section 4: Class 10th
    tenth_board_name: 'CBSE',
    tenth_board_type: 'CBSE',
    tenth_other_board: '',
    tenth_school_name: '',
    tenth_year_of_passing: '2022',
    tenth_max_marks: '500',
    tenth_marks_obtained: '',
    tenth_percentage: '',
    tenth_cgpa_grade: '',
    tenth_marksheet_url: '',
    tenth_marksheet_filename: '',

    // Section 5: Class 12th
    twelfth_board_name: 'CBSE',
    twelfth_board_type: 'CBSE',
    twelfth_other_board: '',
    twelfth_school_name: '',
    twelfth_stream: 'Science',
    twelfth_year_of_passing: '2024',
    twelfth_max_marks: '500',
    twelfth_marks_obtained: '',
    twelfth_percentage: '',
    twelfth_cgpa_grade: '',
    twelfth_marksheet_url: '',
    twelfth_marksheet_filename: '',

    // Section 6: College Performance
    current_cgpa: '',
    current_sgpa: '',
    has_backlogs: false,
    total_backlogs: '0',
    academic_strengths: '',
    subjects_requiring_improvement: '',
    academic_goals: '',

    // Section 7: Attendance
    attendance_semester: '5',
    attendance_percentage: '',

    // Section 9 & 10 Flags
    has_no_achievements: false,
    has_no_issues: false,

    // Section 11: 5 University Suggestions
    suggestions: {
      teaching_learning_suggestions: '',
      lab_facilities_changes: '',
      internship_placement_guidance: '',
      infrastructure_improvements: '',
      other_suggestions: '',
    },

    // Section 12: Declaration
    declaration_accepted: false,
  });

  // Section 6: Previous Semester SGPA Entries
  const [previousSgpas, setPreviousSgpas] = useState([
    { semester: '1', academic_year: '2024-25', sgpa: '' },
    { semester: '2', academic_year: '2024-25', sgpa: '' },
    { semester: '3', academic_year: '2025-26', sgpa: '' },
    { semester: '4', academic_year: '2025-26', sgpa: '' },
  ]);

  // Section 8: Academic Results List
  const [results, setResults] = useState([]);
  const [newRes, setNewRes] = useState({
    semester: '4',
    academic_year: '2025-26',
    examination_name: 'Semester 4 University Regular Examinations',
    exam_type: 'Regular',
    result_date: '',
    sgpa: '',
    cgpa: '',
    result_status: 'Pass',
    remarks: '',
    document_url: '',
    document_filename: '',
  });

  // Section 9: Achievements List
  const [achievements, setAchievements] = useState([]);
  const [newAch, setNewAch] = useState({
    title: '',
    category: 'Hackathon',
    competition_name: '',
    organization: '',
    description: '',
    achievement_date: '',
    level: 'College',
    position: '1st Place / Winner',
    is_team_achievement: false,
    team_name: '',
    role_in_team: '',
    certificate_url: '',
    certificate_filename: '',
  });

  // Section 10: Issues List
  const [issues, setIssues] = useState([]);
  const [newIssue, setNewIssue] = useState({
    category: 'Academic Difficulty',
    priority: 'Medium',
    title: '',
    description: '',
  });

  // Loading & Upload states
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Validate Link Token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenLoading(false);
        setTokenError('No registration token was provided in the URL.');
        return;
      }

      try {
        const res = await fetch(`/api/public/forms/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setTokenError(data.error || 'This registration link is invalid or expired.');
        } else {
          setTokenInfo(data.link);
          setForm((prev) => ({
            ...prev,
            branch_department: data.link.department || prev.branch_department,
            academic_year: data.link.academic_year || prev.academic_year,
            college_name: data.link.mentor_college || prev.college_name,
          }));
        }
      } catch (err) {
        setTokenError('Failed to communicate with mentor portal server. Please check your internet connection.');
      } finally {
        setTokenLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // Handle simple input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear validation error on type
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle suggestion questions change
  const handleSuggestionChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      suggestions: {
        ...prev.suggestions,
        [field]: value,
      },
    }));
  };


  // Generic File Upload Handler
  const handleFileUpload = async (e, targetKey, filenameKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert('Selected file is too large. Maximum allowed size is 8MB.');
      return;
    }

    setUploadingTarget(targetKey);
    try {
      const uploaded = await uploadFile(file);
      if (targetKey.startsWith('newRes.')) {
        setNewRes((prev) => ({
          ...prev,
          document_url: uploaded.url,
          document_filename: uploaded.originalname,
        }));
      } else if (targetKey.startsWith('newAch.')) {
        setNewAch((prev) => ({
          ...prev,
          certificate_url: uploaded.url,
          certificate_filename: uploaded.originalname,
        }));
      } else if (targetKey.startsWith('newIssue.')) {
        setNewIssue((prev) => ({
          ...prev,
          document_url: uploaded.url,
          document_filename: uploaded.originalname,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          [targetKey]: uploaded.url,
          [filenameKey]: uploaded.originalname,
        }));
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  // Step Validation before Proceeding
  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!form.full_name.trim()) newErrors.full_name = 'Full name is required.';
      if (!form.roll_number.trim()) newErrors.roll_number = 'Enrollment number is required.';
      if (!form.branch_department.trim()) newErrors.branch_department = 'Branch/Department is required.';
      if (!form.email.trim()) {
        newErrors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = 'Please enter a valid email address.';
      }
      if (!form.phone.trim()) {
        newErrors.phone = 'Mobile number is required.';
      } else if (!/^\+?[0-9]{10,14}$/.test(form.phone.replace(/[\s-]/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit mobile number.';
      }
    }

    if (currentStep === 2) {
      if (!form.father_name.trim()) newErrors.father_name = "Father's name is required.";
      if (!form.mother_name.trim()) newErrors.mother_name = "Mother's name is required.";
    }

    if (currentStep === 4) {
      if (!form.tenth_board_name.trim()) newErrors.tenth_board_name = 'Board name is required.';
      if (!form.tenth_year_of_passing) newErrors.tenth_year_of_passing = 'Year of passing is required.';
    }

    if (currentStep === 5) {
      if (!form.twelfth_board_name.trim()) newErrors.twelfth_board_name = 'Board name is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, SECTIONS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add Item Handlers
  const handleAddResult = () => {
    if (!newRes.semester || !newRes.examination_name.trim()) {
      alert('Please provide semester and examination name.');
      return;
    }
    setResults((prev) => [...prev, { ...newRes, id: Date.now() }]);
    setNewRes({
      semester: String(Number(newRes.semester) + 1),
      academic_year: '2026-27',
      examination_name: '',
      exam_type: 'Regular',
      result_date: '',
      sgpa: '',
      cgpa: '',
      result_status: 'Pass',
      remarks: '',
      document_url: '',
      document_filename: '',
    });
  };

  const handleRemoveResult = (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddAchievement = () => {
    if (!newAch.title.trim()) {
      alert('Please enter an achievement title.');
      return;
    }
    setAchievements((prev) => [...prev, { ...newAch, id: Date.now() }]);
    setNewAch({
      title: '',
      category: 'Hackathon',
      competition_name: '',
      organization: '',
      description: '',
      achievement_date: '',
      level: 'College',
      position: '',
      is_team_achievement: false,
      team_name: '',
      role_in_team: '',
      certificate_url: '',
      certificate_filename: '',
    });
  };

  const handleRemoveAchievement = (id) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddIssue = () => {
    if (!newIssue.title.trim() || !newIssue.description.trim()) {
      alert('Please provide an issue title and description.');
      return;
    }
    setIssues((prev) => [...prev, { ...newIssue, id: Date.now() }]);
    setNewIssue({
      category: 'Academic Difficulty',
      priority: 'Medium',
      title: '',
      description: '',
    });
  };

  const handleRemoveIssue = (id) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  // Final Form Submission Handler
  const handleSubmitFinal = async () => {
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        // Section 1
        full_name: form.full_name,
        roll_number: form.roll_number,
        university_roll_number: form.university_roll_number,
        admission_number: form.admission_number,
        department: form.branch_department,
        course: form.course_degree,
        semester: form.semester,
        academic_year: form.academic_year,
        batch: form.academic_year ? `Batch ${form.academic_year}` : '2024-2028',
        section: form.section,
        college_name: form.college_name,
        email: form.email,
        phone: form.phone,
        alt_phone: form.alt_phone,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        blood_group: form.blood_group,
        house_no: form.house_no,
        street: form.street,
        locality: form.locality,
        city: form.city,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        country: form.country,
        is_permanent_same: form.is_permanent_same,
        permanent_address: form.is_permanent_same ? '' : form.permanent_address,

        // Section 2
        father_name: form.father_name,
        father_phone: form.father_phone,
        father_email: form.father_email,
        father_occupation: form.father_occupation,
        mother_name: form.mother_name,
        mother_phone: form.mother_phone,
        mother_email: form.mother_email,
        mother_occupation: form.mother_occupation,
        guardian_name: form.has_different_guardian ? form.guardian_name : '',
        guardian_relationship: form.has_different_guardian ? form.guardian_relationship : '',
        guardian_phone: form.has_different_guardian ? form.guardian_phone : '',
        guardian_occupation: form.has_different_guardian ? form.guardian_occupation : '',

        // Section 3
        student_photo_url: form.student_photo_url,
        student_photo_filename: form.student_photo_filename,
        father_photo_url: form.father_photo_url,
        father_photo_filename: form.father_photo_filename,
        mother_photo_url: form.mother_photo_url,
        mother_photo_filename: form.mother_photo_filename,

        // Section 4
        tenth_board_name: form.tenth_board_type === 'Other' ? form.tenth_other_board : form.tenth_board_name,
        tenth_board_type: form.tenth_board_type,
        tenth_school_name: form.tenth_school_name,
        tenth_year_of_passing: form.tenth_year_of_passing,
        tenth_max_marks: form.tenth_max_marks,
        tenth_marks_obtained: form.tenth_marks_obtained,
        tenth_percentage: form.tenth_percentage,
        tenth_cgpa_grade: form.tenth_cgpa_grade,
        tenth_marksheet_url: form.tenth_marksheet_url,
        tenth_marksheet_filename: form.tenth_marksheet_filename,

        // Section 5
        twelfth_board_name: form.twelfth_board_type === 'Other' ? form.twelfth_other_board : form.twelfth_board_name,
        twelfth_board_type: form.twelfth_board_type,
        twelfth_school_name: form.twelfth_school_name,
        twelfth_stream: form.twelfth_stream,
        twelfth_year_of_passing: form.twelfth_year_of_passing,
        twelfth_max_marks: form.twelfth_max_marks,
        twelfth_marks_obtained: form.twelfth_marks_obtained,
        twelfth_percentage: form.twelfth_percentage,
        twelfth_cgpa_grade: form.twelfth_cgpa_grade,
        twelfth_marksheet_url: form.twelfth_marksheet_url,
        twelfth_marksheet_filename: form.twelfth_marksheet_filename,

        // Section 6
        current_cgpa: form.current_cgpa,
        current_sgpa: form.current_sgpa,
        previous_sgpas: previousSgpas.filter((s) => s.sgpa),
        has_backlogs: form.has_backlogs,
        total_backlogs: form.has_backlogs ? form.total_backlogs : 0,
        academic_strengths: form.academic_strengths,
        subjects_requiring_improvement: form.subjects_requiring_improvement,
        academic_goals: form.academic_goals,

        // Section 7
        attendance_semester: form.attendance_semester,
        attendance_percentage: form.attendance_percentage,

        // Section 8
        academic_results: results,

        // Preserved optional defaults for backend compatibility
        has_no_achievements: true,
        achievements: [],
        has_no_issues: true,
        issues: [],
        suggestions: {},
        declaration_accepted: true,
      };

      const res = await fetch(`/api/public/forms/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit mentee registration form.');
      }

      setSubmissionSuccess({
        referenceNumber: data.reference_number || `MEN-${new Date().getFullYear()}-00042`,
        studentName: form.full_name,
        rollNumber: form.roll_number,
        department: form.branch_department,
        mentorName: tokenInfo?.mentor_name || 'Assigned Faculty Mentor',
        submittedAt: new Date().toLocaleString(),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render Token Error View ────────────────────────────────
  if (tokenError) {
    return (
      <div className="public-mentee-form-wrapper">
        <div className="public-form-container" style={{ maxWidth: '580px', margin: 'auto', textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', display: 'grid', placeItems: 'center', margin: '0 auto 20px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ color: 'var(--deep-violet-ink)', fontSize: '26px', marginBottom: '10px' }}>Invalid or Expired Link</h2>
          <p style={{ color: 'var(--muted-text)', fontSize: '18.5px', lineHeight: 1.6, marginBottom: '24px' }}>
            {tokenError}
          </p>
          <p style={{ color: '#64748b', fontSize: '17px' }}>
            Please contact your faculty mentor to generate an active registration link.
          </p>
        </div>
      </div>
    );
  }

  // ── Render Loading View ────────────────────────────────────
  if (tokenLoading) {
    return (
      <div className="public-mentee-form-wrapper" style={{ display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--iris-bloom)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px', width: 44, height: 44, border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '19px', color: 'var(--slate-blue)' }}>Validating registration access token...</p>
        </div>
      </div>
    );
  }

  // ── Render Success View ────────────────────────────────────
  if (submissionSuccess) {
    return (
      <div className="public-form-success-page">
        <div className="form-success-card">
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', display: 'grid', placeItems: 'center', margin: '0 auto 20px', border: '1.5px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={40} />
          </div>

          <h2 style={{ fontSize: '30px', color: 'var(--deep-violet-ink)', fontWeight: 800, marginBottom: '8px' }}>
            Registration Form Submitted!
          </h2>
          <p style={{ color: 'var(--muted-text)', fontSize: '18.5px', marginBottom: '24px' }}>
            Your student profile, academic records, and photographs have been securely recorded and assigned to your faculty mentor.
          </p>

          <div className="reference-badge-box">
            <span>Official Submission Reference Number</span>
            <strong>{submissionSuccess.referenceNumber}</strong>
          </div>

          <div className="success-next-steps" style={{ marginBottom: '28px' }}>
            <h4 style={{ color: 'var(--deep-violet-ink)' }}>Submission Summary & Next Steps:</h4>
            <ul>
              <li><strong>Student Name:</strong> {submissionSuccess.studentName}</li>
              <li><strong>Enrollment / Roll No:</strong> {submissionSuccess.rollNumber}</li>
              <li><strong>Department:</strong> {submissionSuccess.department}</li>
              <li><strong>Assigned Faculty Mentor:</strong> {submissionSuccess.mentorName}</li>
              <li><strong>Submitted At:</strong> {submissionSuccess.submittedAt}</li>
              <li style={{ marginTop: '8px', color: 'var(--iris-bloom)' }}>
                ✓ Your mentor will review your submitted profile and schedule your mentoring orientation meeting.
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ padding: '12px 24px', fontSize: '18px' }}
            >
              <Printer size={16} /> Print Confirmation
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '18px' }}
            >
              <Check size={16} /> Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active section metadata
  const currentSection = SECTIONS[currentStep - 1];
  const progressPct = Math.round(((currentStep - 1) / (SECTIONS.length - 1)) * 100);

  return (
    <div className="public-mentee-form-wrapper">
      <div className="public-form-container">
        {/* Form Header */}
        <div className="public-form-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="brand-pill">Mentora Academic Portal</span>
              <h1>Mentee Registration Form</h1>
              <p>Comprehensive Student Dossier, Academic History & Verified Records</p>
            </div>
            {tokenInfo && (
              <div style={{ background: 'var(--pale-lavender)', border: '1px solid var(--lavender-shimmer)', padding: '10px 16px', borderRadius: '12px', textAlign: 'right' }}>
                <span style={{ fontSize: '15px', color: 'var(--iris-bloom)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.6px', display: 'block' }}>
                  Assigned Faculty Mentor
                </span>
                <strong style={{ color: 'var(--deep-violet-ink)', fontSize: '18.5px' }}>{tokenInfo.mentor_name}</strong>
                <span style={{ display: 'block', fontSize: '16px', color: 'var(--muted-text)' }}>{tokenInfo.mentor_department}</span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div style={{ background: 'var(--pale-lavender)', borderBottom: '1px solid var(--light-border)', padding: '12px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '16.5px', color: 'var(--muted-text)', fontWeight: 600 }}>
              Section {currentStep} of {SECTIONS.length}: <strong style={{ color: 'var(--deep-violet-ink)' }}>{currentSection.title}</strong>
            </span>
            <span style={{ fontSize: '16.5px', color: 'var(--iris-bloom)', fontWeight: 700 }}>
              {progressPct}% Completed
            </span>
          </div>

          {/* Linear Progress Bar */}
          <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(progressPct, 8)}%`,
                background: 'var(--gradient-cornflower)',
                boxShadow: '0 2px 8px rgba(140, 164, 206, 0.4)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Section Pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {SECTIONS.map((sec) => {
              const IconComp = sec.icon;
              const isCurrent = sec.id === currentStep;
              const isPast = sec.id < currentStep;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    if (sec.id < currentStep || validateCurrentStep()) {
                      setCurrentStep(sec.id);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    border: isCurrent
                      ? '1px solid #a855f7'
                      : isPast
                      ? '1px solid rgba(168, 85, 247, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isCurrent
                      ? 'rgba(168, 85, 247, 0.22)'
                      : isPast
                      ? 'rgba(168, 85, 247, 0.08)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: isCurrent ? '#ffffff' : isPast ? '#d8b4fe' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: isCurrent ? '#a855f7' : isPast ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--deep-violet-ink)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '14.5px',
                      fontWeight: 800,
                    }}
                  >
                    {isPast ? '✓' : sec.id}
                  </span>
                  {sec.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body Container */}
        <div className="public-form-body">
          {/* Section Title Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--light-border)' }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: 'var(--gradient-cornflower)',
                color: 'var(--iris-bloom)',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid var(--cornflower-blue)',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)',
              }}
            >
              <currentSection.icon size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '24px', color: 'var(--deep-violet-ink)', fontWeight: 800, margin: 0 }}>
                {currentSection.title}
              </h3>
              <p style={{ fontSize: '17.5px', color: 'var(--muted-text)', margin: '3px 0 0' }}>
                {currentSection.desc}
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 1: PERSONAL INFORMATION
             ══════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="form-grid-1">
              <h4 style={{ color: 'var(--iris-bloom)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, margin: '6px 0 12px' }}>
                1.1 Basic Student Identification
              </h4>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Student Name <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Manaswi Prakash"
                  />
                  {errors.full_name && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label>Enrollment / College Roll Number <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="text"
                    name="roll_number"
                    value={form.roll_number}
                    onChange={handleChange}
                    placeholder="e.g. 24BCSE102"
                  />
                  {errors.roll_number && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.roll_number}</span>}
                </div>

                <div className="form-group">
                  <label>University Roll Number (if different)</label>
                  <input
                    type="text"
                    name="university_roll_number"
                    value={form.university_roll_number}
                    onChange={handleChange}
                    placeholder="e.g. 2400102045"
                  />
                </div>

                <div className="form-group">
                  <label>Branch / Department <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="text"
                    name="branch_department"
                    value={form.branch_department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science & Engineering"
                  />
                  {errors.branch_department && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.branch_department}</span>}
                </div>

                <div className="form-group">
                  <label>Course / Degree <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="text"
                    name="course_degree"
                    value={form.course_degree}
                    onChange={handleChange}
                    placeholder="e.g. B.Tech in CSE / BCA / MCA"
                  />
                </div>

                <div className="form-group">
                  <label>Current Semester <span style={{ color: '#f43f5e' }}>*</span></label>
                  <select name="semester" value={form.semester} onChange={handleChange}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Current Academic Year</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={form.academic_year}
                    onChange={handleChange}
                    placeholder="2026-27"
                  />
                </div>

                <div className="form-group">
                  <label>Section / Batch Group</label>
                  <input
                    type="text"
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                    placeholder="e.g. Section A / Batch 2024-28"
                  />
                </div>

                <div className="form-group full-width">
                  <label>College / University Name</label>
                  <input
                    type="text"
                    name="college_name"
                    value={form.college_name}
                    onChange={handleChange}
                    placeholder="e.g. School of Engineering & Technology"
                  />
                </div>
              </div>

              <h4 style={{ color: 'var(--iris-bloom)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, margin: '20px 0 12px' }}>
                1.2 Contact & Personal Information
              </h4>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Student Email Address <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="student@college.edu"
                  />
                  {errors.email && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Primary Mobile Number <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Alternate Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    name="alt_phone"
                    value={form.alt_phone}
                    onChange={handleChange}
                    placeholder="+91 91234 56789"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Blood Group</label>
                  <select name="blood_group" value={form.blood_group} onChange={handleChange}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <h4 style={{ color: 'var(--iris-bloom)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, margin: '20px 0 12px' }}>
                1.3 Residential Address Details
              </h4>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>House / Flat / Room Number</label>
                  <input
                    type="text"
                    name="house_no"
                    value={form.house_no}
                    onChange={handleChange}
                    placeholder="e.g. Flat 402, Block B"
                  />
                </div>

                <div className="form-group">
                  <label>Street / Locality / Landmark</label>
                  <input
                    type="text"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="e.g. University Road, Near Tech Park"
                  />
                </div>

                <div className="form-group">
                  <label>Village / Town / City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Jaipur"
                  />
                </div>

                <div className="form-group">
                  <label>District</label>
                  <input
                    type="text"
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    placeholder="e.g. Jaipur"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="e.g. Rajasthan"
                  />
                </div>

                <div className="form-group">
                  <label>PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 302001"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="declaration-checkbox-label" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="is_permanent_same"
                      checked={form.is_permanent_same}
                      onChange={handleChange}
                    />
                    <span>Permanent address is the same as current residential address</span>
                  </label>
                </div>

                {!form.is_permanent_same && (
                  <div className="form-group full-width">
                    <label>Permanent Residential Address</label>
                    <textarea
                      rows={3}
                      name="permanent_address"
                      value={form.permanent_address}
                      onChange={handleChange}
                      placeholder="Enter full permanent address with City, State, and PIN Code"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 2: FAMILY INFORMATION
             ══════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="form-grid-1">
              <h4 style={{ color: 'var(--iris-bloom)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, margin: '6px 0 12px' }}>
                2.1 Father's Details
              </h4>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Father's Full Name <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="text"
                    name="father_name"
                    value={form.father_name}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Prakash"
                  />
                  {errors.father_name && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.father_name}</span>}
                </div>

                <div className="form-group">
                  <label>Father's Contact Number</label>
                  <input
                    type="tel"
                    name="father_phone"
                    value={form.father_phone}
                    onChange={handleChange}
                    placeholder="+91 98765 00000"
                  />
                </div>

                <div className="form-group">
                  <label>Father's Email Address (Optional)</label>
                  <input
                    type="email"
                    name="father_email"
                    value={form.father_email}
                    onChange={handleChange}
                    placeholder="father@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Father's Occupation / Profession</label>
                  <input
                    type="text"
                    name="father_occupation"
                    value={form.father_occupation}
                    onChange={handleChange}
                    placeholder="e.g. Civil Engineer / Government Service / Business"
                  />
                </div>
              </div>

              <h4 style={{ color: 'var(--iris-bloom)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, margin: '20px 0 12px' }}>
                2.2 Mother's Details
              </h4>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Mother's Full Name <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="text"
                    name="mother_name"
                    value={form.mother_name}
                    onChange={handleChange}
                    placeholder="e.g. Sunita Prakash"
                  />
                  {errors.mother_name && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.mother_name}</span>}
                </div>

                <div className="form-group">
                  <label>Mother's Contact Number</label>
                  <input
                    type="tel"
                    name="mother_phone"
                    value={form.mother_phone}
                    onChange={handleChange}
                    placeholder="+91 98765 11111"
                  />
                </div>

                <div className="form-group">
                  <label>Mother's Email Address (Optional)</label>
                  <input
                    type="email"
                    name="mother_email"
                    value={form.mother_email}
                    onChange={handleChange}
                    placeholder="mother@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Mother's Occupation / Profession</label>
                  <input
                    type="text"
                    name="mother_occupation"
                    value={form.mother_occupation}
                    onChange={handleChange}
                    placeholder="e.g. Teacher / Healthcare / Homemaker"
                  />
                </div>
              </div>

              <h4 style={{ color: 'var(--iris-bloom)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, margin: '20px 0 12px' }}>
                2.3 Guardian Details (Optional)
              </h4>

              <div className="form-group full-width">
                <label className="declaration-checkbox-label" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="has_different_guardian"
                    checked={form.has_different_guardian}
                    onChange={handleChange}
                  />
                  <span>My primary local guardian is someone other than my parents</span>
                </label>
              </div>

              {form.has_different_guardian && (
                <div className="form-grid-2" style={{ background: 'var(--soft-off-white)', padding: 18, borderRadius: 12, border: '1px solid var(--light-border)' }}>
                  <div className="form-group">
                    <label>Guardian Name</label>
                    <input
                      type="text"
                      name="guardian_name"
                      value={form.guardian_name}
                      onChange={handleChange}
                      placeholder="e.g. Uncle / Relative Name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Relationship with Student</label>
                    <input
                      type="text"
                      name="guardian_relationship"
                      value={form.guardian_relationship}
                      onChange={handleChange}
                      placeholder="e.g. Maternal Uncle / Local Guardian"
                    />
                  </div>

                  <div className="form-group">
                    <label>Guardian Contact Number</label>
                    <input
                      type="tel"
                      name="guardian_phone"
                      value={form.guardian_phone}
                      onChange={handleChange}
                      placeholder="+91 98765 22222"
                    />
                  </div>

                  <div className="form-group">
                    <label>Guardian Occupation</label>
                    <input
                      type="text"
                      name="guardian_occupation"
                      value={form.guardian_occupation}
                      onChange={handleChange}
                      placeholder="e.g. Architect"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 3: PHOTOGRAPHS
             ══════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="form-grid-1">
              <p style={{ color: 'var(--muted-text)', fontSize: '18px', marginBottom: 20 }}>
                Please upload clear, passport-size photographs (JPG, JPEG, or PNG, max 5MB). Files are kept private and accessible exclusively to your authorized academic mentor.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {/* 3.1 Student Photo */}
                <div style={{ background: 'var(--soft-off-white)', border: '1px solid var(--lavender-shimmer)', borderRadius: 16, padding: 22, textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }}>
                  <span style={{ fontSize: '15px', color: 'var(--iris-bloom)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>
                    Student Photo (Required)
                  </span>

                  <div style={{ width: 130, height: 155, margin: '0 auto 16px', borderRadius: 12, overflow: 'hidden', border: '2px dashed var(--cornflower-blue)', background: 'var(--pale-lavender)', display: 'grid', placeItems: 'center', position: 'relative' }}>
                    {form.student_photo_url ? (
                      <img src={form.student_photo_url} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ color: '#64748b', textAlign: 'center', padding: 8 }}>
                        <Camera size={32} style={{ margin: '0 auto 6px', color: 'var(--cornflower-blue)' }} />
                        <span style={{ fontSize: '15px', display: 'block' }}>Passport Photo</span>
                      </div>
                    )}
                  </div>

                  <label className="btn-sm-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '9px 18px' }}>
                    <Upload size={14} />
                    {uploadingTarget === 'student_photo_url' ? 'Uploading...' : form.student_photo_url ? 'Replace Photo' : 'Upload Student Photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'student_photo_url', 'student_photo_filename')}
                      disabled={uploadingTarget === 'student_photo_url'}
                    />
                  </label>

                  {form.student_photo_url && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, student_photo_url: '', student_photo_filename: '' }))}
                      style={{ display: 'block', margin: '10px auto 0', background: 'transparent', border: 'none', color: '#fda4af', fontSize: '16px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* 3.2 Father Photo */}
                <div style={{ background: 'var(--soft-off-white)', border: '1px solid var(--light-border)', borderRadius: 16, padding: 22, textAlign: 'center' }}>
                  <span style={{ fontSize: '15px', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>
                    Father's Photo (Optional)
                  </span>

                  <div style={{ width: 130, height: 155, margin: '0 auto 16px', borderRadius: 12, overflow: 'hidden', border: '2px dashed rgba(255, 255, 255, 0.15)', background: 'var(--pale-lavender)', display: 'grid', placeItems: 'center' }}>
                    {form.father_photo_url ? (
                      <img src={form.father_photo_url} alt="Father" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ color: '#64748b', textAlign: 'center', padding: 8 }}>
                        <User size={32} style={{ margin: '0 auto 6px', color: 'var(--muted-text)' }} />
                        <span style={{ fontSize: '15px', display: 'block' }}>Father Photo</span>
                      </div>
                    )}
                  </div>

                  <label className="btn-sm-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '9px 18px' }}>
                    <Upload size={14} />
                    {uploadingTarget === 'father_photo_url' ? 'Uploading...' : form.father_photo_url ? 'Replace Photo' : 'Upload Father Photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'father_photo_url', 'father_photo_filename')}
                      disabled={uploadingTarget === 'father_photo_url'}
                    />
                  </label>

                  {form.father_photo_url && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, father_photo_url: '', father_photo_filename: '' }))}
                      style={{ display: 'block', margin: '10px auto 0', background: 'transparent', border: 'none', color: '#fda4af', fontSize: '16px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* 3.3 Mother Photo */}
                <div style={{ background: 'var(--soft-off-white)', border: '1px solid var(--light-border)', borderRadius: 16, padding: 22, textAlign: 'center' }}>
                  <span style={{ fontSize: '15px', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>
                    Mother's Photo (Optional)
                  </span>

                  <div style={{ width: 130, height: 155, margin: '0 auto 16px', borderRadius: 12, overflow: 'hidden', border: '2px dashed rgba(255, 255, 255, 0.15)', background: 'var(--pale-lavender)', display: 'grid', placeItems: 'center' }}>
                    {form.mother_photo_url ? (
                      <img src={form.mother_photo_url} alt="Mother" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ color: '#64748b', textAlign: 'center', padding: 8 }}>
                        <User size={32} style={{ margin: '0 auto 6px', color: 'var(--muted-text)' }} />
                        <span style={{ fontSize: '15px', display: 'block' }}>Mother Photo</span>
                      </div>
                    )}
                  </div>

                  <label className="btn-sm-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '9px 18px' }}>
                    <Upload size={14} />
                    {uploadingTarget === 'mother_photo_url' ? 'Uploading...' : form.mother_photo_url ? 'Replace Photo' : 'Upload Mother Photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'mother_photo_url', 'mother_photo_filename')}
                      disabled={uploadingTarget === 'mother_photo_url'}
                    />
                  </label>

                  {form.mother_photo_url && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, mother_photo_url: '', mother_photo_filename: '' }))}
                      style={{ display: 'block', margin: '10px auto 0', background: 'transparent', border: 'none', color: '#fda4af', fontSize: '16px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 4: CLASS 10TH ACADEMIC DETAILS
             ══════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="form-grid-1">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Board Type <span style={{ color: '#f43f5e' }}>*</span></label>
                  <select name="tenth_board_type" value={form.tenth_board_type} onChange={handleChange}>
                    <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                    <option value="ICSE">ICSE / CISCE</option>
                    <option value="State Board">State Board</option>
                    <option value="Other">Other Board</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Board Name <span style={{ color: '#f43f5e' }}>*</span></label>
                  {form.tenth_board_type === 'Other' ? (
                    <input
                      type="text"
                      name="tenth_other_board"
                      value={form.tenth_other_board}
                      onChange={handleChange}
                      placeholder="Specify Board Name"
                    />
                  ) : (
                    <input
                      type="text"
                      name="tenth_board_name"
                      value={form.tenth_board_name}
                      onChange={handleChange}
                      placeholder="e.g. CBSE / State Board"
                    />
                  )}
                  {errors.tenth_board_name && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.tenth_board_name}</span>}
                </div>

                <div className="form-group full-width">
                  <label>School Name & City</label>
                  <input
                    type="text"
                    name="tenth_school_name"
                    value={form.tenth_school_name}
                    onChange={handleChange}
                    placeholder="e.g. St. Xavier's Senior Secondary School, Jaipur"
                  />
                </div>

                <div className="form-group">
                  <label>Year of Passing <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input
                    type="number"
                    name="tenth_year_of_passing"
                    value={form.tenth_year_of_passing}
                    onChange={handleChange}
                    placeholder="2022"
                    min="2010"
                    max="2030"
                  />
                  {errors.tenth_year_of_passing && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.tenth_year_of_passing}</span>}
                </div>

                <div className="form-group">
                  <label>Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="tenth_percentage"
                    value={form.tenth_percentage}
                    onChange={handleChange}
                    placeholder="e.g. 88.5"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Marks Obtained / Max Marks</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      name="tenth_marks_obtained"
                      value={form.tenth_marks_obtained}
                      onChange={handleChange}
                      placeholder="Obtained (442)"
                    />
                    <input
                      type="number"
                      name="tenth_max_marks"
                      value={form.tenth_max_marks}
                      onChange={handleChange}
                      placeholder="Max (500)"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>CGPA / Grade (if applicable)</label>
                  <input
                    type="text"
                    name="tenth_cgpa_grade"
                    value={form.tenth_cgpa_grade}
                    onChange={handleChange}
                    placeholder="e.g. 9.2 CGPA or A1"
                  />
                </div>

                {/* Marksheet Upload */}
                <div className="form-group full-width" style={{ background: 'var(--soft-off-white)', padding: 18, borderRadius: 12, border: '1px solid var(--light-border)' }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>
                    Class 10th Marksheet Document (PDF / JPG / PNG)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <label className="btn-sm-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <Upload size={14} />
                      {uploadingTarget === 'tenth_marksheet_url' ? 'Uploading...' : form.tenth_marksheet_url ? 'Replace Marksheet' : 'Upload Marksheet'}
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'tenth_marksheet_url', 'tenth_marksheet_filename')}
                        disabled={uploadingTarget === 'tenth_marksheet_url'}
                      />
                    </label>
                    {form.tenth_marksheet_url && (
                      <span style={{ color: '#34d399', fontSize: '17px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        ✓ {form.tenth_marksheet_filename || 'Marksheet uploaded'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 5: CLASS 12TH ACADEMIC DETAILS
             ══════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <div className="form-grid-1">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Board Type <span style={{ color: '#f43f5e' }}>*</span></label>
                  <select name="twelfth_board_type" value={form.twelfth_board_type} onChange={handleChange}>
                    <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                    <option value="ICSE">ISC / CISCE</option>
                    <option value="State Board">State Board</option>
                    <option value="Other">Other Board / Equivalent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Board Name <span style={{ color: '#f43f5e' }}>*</span></label>
                  {form.twelfth_board_type === 'Other' ? (
                    <input
                      type="text"
                      name="twelfth_other_board"
                      value={form.twelfth_other_board}
                      onChange={handleChange}
                      placeholder="Specify Board / Council"
                    />
                  ) : (
                    <input
                      type="text"
                      name="twelfth_board_name"
                      value={form.twelfth_board_name}
                      onChange={handleChange}
                      placeholder="e.g. CBSE / State Board"
                    />
                  )}
                  {errors.twelfth_board_name && <span style={{ color: '#f43f5e', fontSize: '16px' }}>{errors.twelfth_board_name}</span>}
                </div>

                <div className="form-group">
                  <label>Stream / Pathway</label>
                  <select name="twelfth_stream" value={form.twelfth_stream} onChange={handleChange}>
                    <option value="Science">Science (PCM / PCB)</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts/Humanities">Arts / Humanities</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Diploma/Equivalent">Diploma / Polytechnic Equivalent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Year of Passing</label>
                  <input
                    type="number"
                    name="twelfth_year_of_passing"
                    value={form.twelfth_year_of_passing}
                    onChange={handleChange}
                    placeholder="2024"
                    min="2010"
                    max="2030"
                  />
                </div>

                <div className="form-group full-width">
                  <label>School / Junior College Name</label>
                  <input
                    type="text"
                    name="twelfth_school_name"
                    value={form.twelfth_school_name}
                    onChange={handleChange}
                    placeholder="e.g. Delhi Public School, Jaipur"
                  />
                </div>

                <div className="form-group">
                  <label>Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="twelfth_percentage"
                    value={form.twelfth_percentage}
                    onChange={handleChange}
                    placeholder="e.g. 85.4"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Marks Obtained / Max Marks</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      name="twelfth_marks_obtained"
                      value={form.twelfth_marks_obtained}
                      onChange={handleChange}
                      placeholder="Obtained (427)"
                    />
                    <input
                      type="number"
                      name="twelfth_max_marks"
                      value={form.twelfth_max_marks}
                      onChange={handleChange}
                      placeholder="Max (500)"
                    />
                  </div>
                </div>

                <div className="form-group full-width" style={{ background: 'var(--soft-off-white)', padding: 18, borderRadius: 12, border: '1px solid var(--light-border)' }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>
                    Class 12th / Diploma Marksheet Document (PDF / JPG / PNG)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <label className="btn-sm-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <Upload size={14} />
                      {uploadingTarget === 'twelfth_marksheet_url' ? 'Uploading...' : form.twelfth_marksheet_url ? 'Replace Marksheet' : 'Upload Marksheet'}
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'twelfth_marksheet_url', 'twelfth_marksheet_filename')}
                        disabled={uploadingTarget === 'twelfth_marksheet_url'}
                      />
                    </label>
                    {form.twelfth_marksheet_url && (
                      <span style={{ color: '#34d399', fontSize: '17px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        ✓ {form.twelfth_marksheet_filename || 'Marksheet uploaded'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 6: COLLEGE ACADEMIC DETAILS
             ══════════════════════════════════════════════════════ */}
          {currentStep === 6 && (
            <div className="form-grid-1">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Current Cumulative CGPA (on 10-point scale)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="current_cgpa"
                    value={form.current_cgpa}
                    onChange={handleChange}
                    placeholder="e.g. 8.45"
                    min="0"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label>Current Semester SGPA (if result declared)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="current_sgpa"
                    value={form.current_sgpa}
                    onChange={handleChange}
                    placeholder="e.g. 8.60"
                    min="0"
                    max="10"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Previous Semesters SGPA Record</label>
                  <div className="table-responsive" style={{ background: 'var(--soft-off-white)', borderRadius: 12, padding: 14, border: '1px solid var(--light-border)' }}>
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Semester</th>
                          <th>Academic Year</th>
                          <th>SGPA Secured</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previousSgpas.map((item, idx) => (
                          <tr key={item.semester}>
                            <td style={{ fontWeight: 700 }}>Semester {item.semester}</td>
                            <td>
                              <input
                                type="text"
                                value={item.academic_year}
                                onChange={(e) => {
                                  const updated = [...previousSgpas];
                                  updated[idx].academic_year = e.target.value;
                                  setPreviousSgpas(updated);
                                }}
                                style={{ padding: '6px 10px', fontSize: '17px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'var(--pale-lavender)', color: 'var(--deep-violet-ink)' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 8.2"
                                value={item.sgpa}
                                onChange={(e) => {
                                  const updated = [...previousSgpas];
                                  updated[idx].sgpa = e.target.value;
                                  setPreviousSgpas(updated);
                                }}
                                style={{ padding: '6px 10px', fontSize: '17px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'var(--pale-lavender)', color: 'var(--deep-violet-ink)', width: '120px' }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="declaration-checkbox-label" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="has_backlogs"
                      checked={form.has_backlogs}
                      onChange={handleChange}
                    />
                    <span>I have pending / active backlogs in one or more subjects</span>
                  </label>
                </div>

                {form.has_backlogs && (
                  <div className="form-group">
                    <label>Total Number of Active Backlogs</label>
                    <input
                      type="number"
                      name="total_backlogs"
                      value={form.total_backlogs}
                      onChange={handleChange}
                      placeholder="e.g. 1"
                      min="1"
                    />
                  </div>
                )}

                <div className="form-group full-width">
                  <label>Academic Strengths (Subjects or skills where you perform best)</label>
                  <textarea
                    rows={2}
                    name="academic_strengths"
                    value={form.academic_strengths}
                    onChange={handleChange}
                    placeholder="e.g. Data Structures, Algorithms, Web Development, Object-Oriented Programming"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Subjects Requiring Improvement or Mentor Guidance</label>
                  <textarea
                    rows={2}
                    name="subjects_requiring_improvement"
                    value={form.subjects_requiring_improvement}
                    onChange={handleChange}
                    placeholder="e.g. Theory of Computation, Discrete Mathematics, Computer Networks"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Academic Goals for Current Semester & Year</label>
                  <textarea
                    rows={2}
                    name="academic_goals"
                    value={form.academic_goals}
                    onChange={handleChange}
                    placeholder="e.g. Maintain 8.5+ CGPA, publish research paper, complete cloud certification"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 7: ATTENDANCE INFORMATION
             ══════════════════════════════════════════════════════ */}
          {currentStep === 7 && (
            <div className="form-grid-1">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Current Semester</label>
                  <select
                    name="attendance_semester"
                    value={form.attendance_semester}
                    onChange={handleChange}
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8'].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Overall Attendance Percentage (%) <span style={{ color: '#f43f5e' }}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      step="0.1"
                      name="attendance_percentage"
                      value={form.attendance_percentage}
                      onChange={handleChange}
                      placeholder="e.g. 85.0"
                      min="0"
                      max="100"
                    />
                    {Number(form.attendance_percentage) < 75 && form.attendance_percentage !== '' && (
                      <span className="priority-tag high" style={{ whiteSpace: 'nowrap' }}>
                        Under 75%
                      </span>
                    )}
                    {Number(form.attendance_percentage) >= 75 && form.attendance_percentage !== '' && (
                      <span className="priority-tag low" style={{ whiteSpace: 'nowrap' }}>
                        Eligible (≥ 75%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 8: ACADEMIC RESULT UPLOAD
             ══════════════════════════════════════════════════════ */}
          {currentStep === 8 && (
            <div className="form-grid-1">
              <p style={{ color: 'var(--muted-text)', fontSize: '18px', marginBottom: 16 }}>
                Upload your semester-wise examination marksheets and results. Multiple semester records can be added below.
              </p>

              {/* Existing Added Results List */}
              {results.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ color: 'var(--deep-violet-ink)', fontSize: '19px', fontWeight: 700, marginBottom: 12 }}>
                    Added Semester Results ({results.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {results.map((resItem) => (
                      <div
                        key={resItem.id}
                        style={{
                          background: 'var(--soft-off-white)',
                          border: '1px solid var(--light-border)',
                          borderRadius: 12,
                          padding: '14px 18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 12,
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--deep-violet-ink)', fontSize: '19px' }}>
                            Semester {resItem.semester} ?" {resItem.examination_name}
                          </strong>
                          <div style={{ fontSize: '16.5px', color: 'var(--muted-text)', marginTop: 3 }}>
                            Academic Year: {resItem.academic_year} | SGPA: {resItem.sgpa || 'N/A'} | Status: {resItem.result_status}
                          </div>
                          {resItem.document_url && (
                            <a
                              href={resItem.document_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--iris-bloom)', fontSize: '16px', marginTop: 4, display: 'inline-block' }}
                            >
                              📄 View Marksheet: {resItem.document_filename || 'document.pdf'}
                            </a>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveResult(resItem.id)}
                          style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 6 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Result Form Box */}
              <div style={{ background: '#FFFFFF', border: '1.5px dashed var(--lavender-shimmer)', borderRadius: 14, padding: 22 }}>
                <h4 style={{ color: 'var(--iris-bloom)', fontSize: '19px', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Add Examination Result Record
                </h4>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={newRes.semester}
                      onChange={(e) => setNewRes({ ...newRes, semester: e.target.value })}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Academic Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2025-26"
                      value={newRes.academic_year}
                      onChange={(e) => setNewRes({ ...newRes, academic_year: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Examination Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Semester 4 University Main Examinations"
                      value={newRes.examination_name}
                      onChange={(e) => setNewRes({ ...newRes, examination_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Examination Type</label>
                    <select
                      value={newRes.exam_type}
                      onChange={(e) => setNewRes({ ...newRes, exam_type: e.target.value })}
                    >
                      <option value="Regular">Regular Examination</option>
                      <option value="Supplementary">Supplementary / Re-appear</option>
                      <option value="Re-evaluation">Re-evaluation</option>
                      <option value="Mid-Term">Mid-Term / Sessional</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>SGPA Obtained</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.4"
                      value={newRes.sgpa}
                      onChange={(e) => setNewRes({ ...newRes, sgpa: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>CGPA Up to This Semester</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.25"
                      value={newRes.cgpa}
                      onChange={(e) => setNewRes({ ...newRes, cgpa: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Result Status</label>
                    <select
                      value={newRes.result_status}
                      onChange={(e) => setNewRes({ ...newRes, result_status: e.target.value })}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Declared">Declared</option>
                      <option value="Awaited">Awaited / Pending</option>
                      <option value="Backlog">Has Backlog</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Upload Marksheet Document (PDF / JPG / PNG)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <label className="btn-sm-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <Upload size={14} />
                        {uploadingTarget === 'newRes.document_url' ? 'Uploading...' : newRes.document_url ? 'Replace Document' : 'Upload Marksheet'}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, 'newRes.document_url', 'newRes.document_filename')}
                          disabled={uploadingTarget === 'newRes.document_url'}
                        />
                      </label>
                      {newRes.document_url && (
                        <span style={{ color: '#34d399', fontSize: '17px' }}>
                          ✓ {newRes.document_filename || 'Document ready'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Remarks / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Secured distinction in Advanced Database Systems"
                      value={newRes.remarks}
                      onChange={(e) => setNewRes({ ...newRes, remarks: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddResult}
                  className="btn-secondary"
                  style={{ marginTop: 14 }}
                >
                  <Plus size={16} /> Save & Add Result to Record
                </button>
              </div>
            </div>
          )}

          {/* Submit Error Message */}
          {submitError && (
            <div className="alert-box error" style={{ margin: '16px 0' }}>
              <AlertCircle size={18} />
              <span>{submitError}</span>
            </div>
          )}

          {/* Form Navigation Controls */}
          <div className="form-step-navigation">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-nav-prev"
                disabled={submitting}
              >
                <ChevronLeft size={16} /> Previous Section
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 10 }}>
              {currentStep < SECTIONS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-nav-next"
                >
                  Next Section <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  className="btn-submit-final"
                  disabled={submitting}
                  style={{ width: 'auto', minWidth: '220px' }}
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Submitting Record...
                    </>
                  ) : (
                    <>
                      <FileCheck size={18} /> Submit Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
