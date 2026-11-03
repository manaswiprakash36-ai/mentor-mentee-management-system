import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  Shield,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  Filter,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  UserCheck,
  UserX,
  ExternalLink,
  RefreshCw,
  X,
  ChevronRight,
  Building,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Sliders,
  CheckSquare,
  Square,
  Award,
  History,
  Eye,
  Info,
  KeyRound,
  RotateCcw,
  Lock,
  Copy,
  Check,
  Download,
} from 'lucide-react';

export default function AdminDashboard({ defaultTab = 'overview' }) {
  const navigate = useNavigate();

  // Active Tab: 'overview' | 'mentors' | 'students' | 'allocation'
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // 1. Overview Data
  const [overview, setOverview] = useState(null);

  // 2. Mentors Data
  const [mentors, setMentors] = useState([]);
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorDeptFilter, setMentorDeptFilter] = useState('');

  // 3. Students Data
  const [students, setStudents] = useState([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('');
  const [studentSemFilter, setStudentSemFilter] = useState('');
  const [studentMentorFilter, setStudentMentorFilter] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');
  const [studentAccountStatusFilter, setStudentAccountStatusFilter] = useState('');
  const [studentSort, setStudentSort] = useState('newest');
  const [studentPage, setStudentPage] = useState(1);
  const studentLimit = 20;

  // Student Account Activation / Password Modal
  const [activationModal, setActivationModal] = useState(null);

  // Bulk Student Account Activation / Password Modal
  const [bulkActivationModal, setBulkActivationModal] = useState(null);

  // Mentor Deep Details Modal
  const [mentorDetailsModal, setMentorDetailsModal] = useState(null);
  const [mentorDetailsSearch, setMentorDetailsSearch] = useState('');

  // Selected students for bulk allocation
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkTargetMentorId, setBulkTargetMentorId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // 4. Bulk Mentor Assignment Form, Selection & Live Analysis
  const [engineDept, setEngineDept] = useState('');
  const [engineSem, setEngineSem] = useState('');
  const [engineMentorId, setEngineMentorId] = useState('');
  const [engineIncludeAssigned, setEngineIncludeAssigned] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [engineExecuting, setEngineExecuting] = useState(false);
  const [enginePreview, setEnginePreview] = useState(null);
  const [enginePreviewLoading, setEnginePreviewLoading] = useState(false);
  const [engineCapacityLimit, setEngineCapacityLimit] = useState(30);
  const [engineOverrideCapacity, setEngineOverrideCapacity] = useState(false);
  const [engineConfirmDialog, setEngineConfirmDialog] = useState(null);
  const [engineResult, setEngineResult] = useState(null);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [historyTab, setHistoryTab] = useState('students'); // 'students' | 'batches'
  const [historySearch, setHistorySearch] = useState('');

  // 5. Class Coordinators Hub
  const [coordinators, setCoordinators] = useState([]);
  const [coordClasses, setCoordClasses] = useState([]);
  const [coordLoading, setCoordLoading] = useState(false);
  const [coordSearch, setCoordSearch] = useState('');
  const [coordDeptFilter, setCoordDeptFilter] = useState('');
  const [coordStatusFilter, setCoordStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Coordinator Designation Form
  const [designateDept, setDesignateDept] = useState('Computer Science');
  const [designateCourse, setDesignateCourse] = useState('B.Tech Computer Science');
  const [designateAcademicYear, setDesignateAcademicYear] = useState('2026-27');
  const [designateSem, setDesignateSem] = useState('4');
  const [designateSection, setDesignateSection] = useState('A');
  const [designateMentorId, setDesignateMentorId] = useState('');
  const [designateNotes, setDesignateNotes] = useState('');
  const [designateSubmitting, setDesignateSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [showDesignateModal, setShowDesignateModal] = useState(false);

  // Modals
  const [mentorModal, setMentorModal] = useState(null); // null | { isNew: bool, data: obj }
  const [mentorSaving, setMentorSaving] = useState(false);

  const [studentModal, setStudentModal] = useState(null); // null | { isNew: bool, data: obj }
  const [studentSaving, setStudentSaving] = useState(false);

  const [deleteMentorModal, setDeleteMentorModal] = useState(null); // null | mentor obj
  const [deleteMentorReassignTo, setDeleteMentorReassignTo] = useState('');
  const [deletingMentor, setDeletingMentor] = useState(false);

  const [deleteStudentModal, setDeleteStudentModal] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Fetch Overview Metrics
  async function loadOverview() {
    try {
      const res = await apiRequest('/admin/overview');
      setOverview(res);
    } catch (err) {
      console.error('Error loading admin overview:', err);
      setError(err.message || 'Could not load institutional overview.');
    }
  }

  // Fetch Mentors
  async function loadMentors() {
    try {
      const res = await apiRequest('/admin/mentors');
      setMentors(res || []);
    } catch (err) {
      console.error('Error loading mentors:', err);
    }
  }

  // Fetch Students with Filters
  async function loadStudents() {
    try {
      const params = new URLSearchParams({
        page: studentPage,
        limit: studentLimit,
        sort: studentSort,
      });

      if (studentSearch.trim()) params.append('search', studentSearch.trim());
      if (studentDeptFilter) params.append('department', studentDeptFilter);
      if (studentSemFilter) params.append('semester', studentSemFilter);
      if (studentMentorFilter) params.append('mentor_id', studentMentorFilter);
      if (studentStatusFilter) params.append('status', studentStatusFilter);
      if (studentAccountStatusFilter) params.append('account_status', studentAccountStatusFilter);

      const res = await apiRequest(`/admin/students?${params.toString()}`);
      setStudents(res.students || []);
      setStudentsTotal(res.total || 0);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  }

  // Fetch Past Allocation Logs
  async function loadAllocationHistory() {
    try {
      setHistoryLoading(true);
      const res = await apiRequest('/admin/allocation-history');
      setAllocationHistory(res || []);
    } catch (err) {
      console.error('Error loading allocation history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Fetch Live Cohort & Allocation Preview
  async function fetchAllocationPreview() {
    try {
      setEnginePreviewLoading(true);
      const params = new URLSearchParams();
      if (engineDept) params.append('department', engineDept);
      if (engineSem) params.append('semester', engineSem);
      if (engineMentorId) params.append('target_mentor_id', engineMentorId);
      params.append('unassigned_only', engineIncludeAssigned ? 'false' : 'true');
      if (engineCapacityLimit) params.append('capacity_limit', engineCapacityLimit);

      const res = await apiRequest(`/admin/bulk-allocate/preview?${params.toString()}`);
      setEnginePreview(res);

      if (res.target_mentor && (!engineCapacityLimit || engineCapacityLimit === 30)) {
        setEngineCapacityLimit(res.target_mentor.max_capacity || 30);
      }

      // By default, select only unassigned students (Requirement 6)
      if (res?.preview_students) {
        const defaultSelected = res.preview_students
          .filter((s) => s.mentor_id === null)
          .map((s) => s.id);
        setSelectedCandidateIds(defaultSelected);
      }
    } catch (err) {
      console.error('Error loading allocation preview:', err);
    } finally {
      setEnginePreviewLoading(false);
    }
  }

  // Load Class Coordinators and Cohorts
  async function loadCoordinators() {
    try {
      setCoordLoading(true);
      const [allCoords, classList] = await Promise.all([
        apiRequest('/admin/coordinators'),
        apiRequest('/admin/coordinators/classes'),
      ]);
      setCoordinators(Array.isArray(allCoords) ? allCoords : (allCoords.coordinators || []));
      setCoordClasses(Array.isArray(classList) ? classList : (classList.classes || []));
    } catch (err) {
      console.error('Error loading coordinators:', err);
    } finally {
      setCoordLoading(false);
    }
  }

  // Designate or Change Class Coordinator
  async function handleDesignateCoordinator(e) {
    if (e) e.preventDefault();
    if (!designateMentorId) {
      alert('Please select a faculty mentor to designate as Class Coordinator.');
      return;
    }
    setDesignateSubmitting(true);
    try {
      const res = await apiRequest('/admin/coordinators', {
        method: 'POST',
        body: JSON.stringify({
          mentor_id: designateMentorId,
          department: designateDept,
          course: designateCourse,
          academic_year: designateAcademicYear,
          semester: Number(designateSem),
          section: designateSection,
          notes: designateNotes,
        }),
      });

      showNotice(res.message || 'Class Coordinator designated successfully!');
      setShowDesignateModal(false);
      setDesignateNotes('');
      await Promise.all([loadCoordinators(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to designate Class Coordinator.');
    } finally {
      setDesignateSubmitting(false);
    }
  }

  // Revoke Class Coordinator Designation
  async function handleRevokeCoordinator(coord) {
    if (
      !window.confirm(
        `Are you sure you want to revoke Class Coordinator designation for ${coord.mentor_name} (${coord.department} Sem ${coord.semester} Sec ${coord.section})?`
      )
    ) {
      return;
    }

    setRevokingId(coord.id);
    try {
      const res = await apiRequest(`/admin/coordinators/${coord.id}/revoke`, {
        method: 'PUT',
      });
      showNotice(res.message || 'Class Coordinator designation revoked.');
      await Promise.all([loadCoordinators(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to revoke Class Coordinator.');
    } finally {
      setRevokingId(null);
    }
  }

  // Initial Load
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        loadOverview(),
        loadMentors(),
        loadStudents(),
        loadAllocationHistory(),
        loadCoordinators(),
      ]);
      setLoading(false);
    }
    init();
  }, []);

  // Reload coordinators when activeTab switches to 'coordinators'
  useEffect(() => {
    if (activeTab === 'coordinators') {
      loadCoordinators();
    }
  }, [activeTab]);

  // Live Allocation Preview on parameter changes
  useEffect(() => {
    if (activeTab === 'allocation') {
      fetchAllocationPreview();
      loadAllocationHistory();
    }
  }, [activeTab, engineDept, engineSem, engineMentorId, engineIncludeAssigned, engineCapacityLimit]);

  // Reload students on filter changes
  useEffect(() => {
    loadStudents();
  }, [studentPage, studentDeptFilter, studentSemFilter, studentMentorFilter, studentStatusFilter, studentAccountStatusFilter, studentSort]);

  // Debounced search for students
  useEffect(() => {
    const handler = setTimeout(() => {
      setStudentPage(1);
      loadStudents();
    }, 350);
    return () => clearTimeout(handler);
  }, [studentSearch]);

  function showNotice(msg) {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(''), 3500);
  }

  // ── Open Mentor Details Modal ──
  async function handleOpenMentorDetails(mentorId) {
    const cachedMentor = mentors.find((m) => m.id === mentorId);
    setMentorDetailsModal({
      mentor: cachedMentor || { id: mentorId },
      coordinator_classes: [],
      assigned_students: [],
      loading: true,
    });
    setMentorDetailsSearch('');

    try {
      const res = await apiRequest(`/admin/mentors/${mentorId}`);
      setMentorDetailsModal({
        mentor: res.mentor || cachedMentor,
        coordinator_classes: res.coordinator_classes || [],
        assigned_students: res.assigned_students || [],
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching mentor details:', err);
      showNotice(err.message || 'Failed to fetch mentor details');
      setMentorDetailsModal((prev) => (prev ? { ...prev, loading: false } : null));
    }
  }

  // ── Mentor Management Handlers ──
  async function handleSaveMentor(e) {
    e.preventDefault();
    setMentorSaving(true);
    const { isNew, data } = mentorModal;

    try {
      if (isNew) {
        await apiRequest('/admin/mentors', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        showNotice(`Faculty mentor ${data.full_name} enrolled successfully!`);
      } else {
        await apiRequest(`/admin/mentors/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        showNotice(`Mentor profile updated successfully!`);
      }
      setMentorModal(null);
      await Promise.all([loadMentors(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to save mentor record.');
    } finally {
      setMentorSaving(false);
    }
  }

  async function handleConfirmDeleteMentor() {
    if (!deleteMentorModal) return;
    setDeletingMentor(true);
    try {
      const url = deleteMentorReassignTo
        ? `/admin/mentors/${deleteMentorModal.id}?reassign_to=${deleteMentorReassignTo}`
        : `/admin/mentors/${deleteMentorModal.id}`;

      const res = await apiRequest(url, { method: 'DELETE' });
      showNotice(res.message || 'Mentor deleted successfully');
      setDeleteMentorModal(null);
      setDeleteMentorReassignTo('');
      await Promise.all([loadMentors(), loadStudents(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to delete mentor.');
    } finally {
      setDeletingMentor(false);
    }
  }

  // ── Student Management Handlers ──
  async function handleSaveStudent(e) {
    e.preventDefault();
    setStudentSaving(true);
    const { isNew, data } = studentModal;

    try {
      if (isNew) {
        await apiRequest('/admin/students', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        showNotice(`Student ${data.full_name} enrolled successfully!`);
      } else {
        await apiRequest(`/admin/students/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        showNotice(`Student details updated successfully!`);
      }
      setStudentModal(null);
      await Promise.all([loadStudents(), loadMentors(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to save student record.');
    } finally {
      setStudentSaving(false);
    }
  }

  async function handleConfirmDeleteStudent() {
    if (!deleteStudentModal) return;
    setDeletingStudent(true);
    try {
      const res = await apiRequest(`/admin/students/${deleteStudentModal.id}`, { method: 'DELETE' });
      showNotice(res.message || 'Student removed successfully');
      setDeleteStudentModal(null);
      await Promise.all([loadStudents(), loadMentors(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setDeletingStudent(false);
    }
  }

  // ── Student Account Activation & Password Setup Handlers ──
  function openActivationModal(student, mode = 'activate') {
    setActivationModal({
      student,
      mode,
      passwordType: 'generate',
      customPassword: '',
      showCustom: false,
      submitting: false,
      result: null,
      copied: false,
      copiedAll: false,
      error: '',
    });
  }

  async function handleExecuteActivation(e) {
    if (e) e.preventDefault();
    if (!activationModal || !activationModal.student) return;

    const { student, mode, passwordType, customPassword } = activationModal;

    if (passwordType === 'custom') {
      if (!customPassword || customPassword.length < 6) {
        setActivationModal((prev) => ({
          ...prev,
          error: 'Custom password must be at least 6 characters long.',
        }));
        return;
      }
    }

    setActivationModal((prev) => ({ ...prev, submitting: true, error: '' }));

    try {
      const endpoint = mode === 'activate'
        ? `/admin/students/${student.id}/activate`
        : `/admin/students/${student.id}/reset-password`;

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          custom_password: passwordType === 'custom' ? customPassword.trim() : null,
        }),
      });

      setActivationModal((prev) => ({
        ...prev,
        submitting: false,
        result: {
          temp_password: res.temp_password,
          student: res.student || student,
        },
      }));

      showNotice(res.message || (mode === 'activate' ? 'Student account activated successfully!' : 'Password reset successfully!'));
      await Promise.all([loadStudents(), loadOverview()]);
    } catch (err) {
      setActivationModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || 'Operation failed. Please try again.',
      }));
    }
  }

  function handleCopyPassword(password) {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setActivationModal((prev) => ({ ...prev, copied: true }));
    setTimeout(() => {
      setActivationModal((prev) => (prev ? { ...prev, copied: false } : null));
    }, 2000);
  }

  function handleCopyAllCredentials(rollNumber, password, name) {
    const loginUrl = `${window.location.origin}/student/login`;
    const text = `Mentora Student Portal Credentials\n` +
      `Student Name: ${name}\n` +
      `Student ID / Roll: ${rollNumber}\n` +
      `Temporary Password: ${password}\n` +
      `Login URL: ${loginUrl}\n\n` +
      `Note: Please log in using your Student ID and temporary password, then set your permanent password.`;

    navigator.clipboard.writeText(text);
    setActivationModal((prev) => ({ ...prev, copiedAll: true }));
    setTimeout(() => {
      setActivationModal((prev) => (prev ? { ...prev, copiedAll: false } : null));
    }, 2000);
  }

  // ── Bulk Student Activation Handlers ──
  function openBulkActivationModal(initialTargetType = 'unactivated') {
    setBulkActivationModal({
      targetType: selectedStudentIds.length > 0 ? 'selected' : initialTargetType,
      deptFilter: studentDeptFilter || '',
      semFilter: studentSemFilter || '',
      passwordType: 'unique',
      commonPassword: '',
      showCommon: false,
      submitting: false,
      result: null,
      copiedAll: false,
      copiedId: null,
      error: '',
      searchQuery: '',
    });
  }

  async function handleExecuteBulkActivation(e) {
    if (e) e.preventDefault();
    if (!bulkActivationModal) return;

    const { targetType, deptFilter, semFilter, passwordType, commonPassword } = bulkActivationModal;

    if (passwordType === 'common') {
      if (!commonPassword || commonPassword.trim().length < 6) {
        setBulkActivationModal((prev) => ({
          ...prev,
          error: 'Common password must be at least 6 characters long.',
        }));
        return;
      }
    }

    setBulkActivationModal((prev) => ({ ...prev, submitting: true, error: '' }));

    try {
      const res = await apiRequest('/admin/students/bulk-activate', {
        method: 'POST',
        body: JSON.stringify({
          target_type: targetType,
          student_ids: targetType === 'selected' ? selectedStudentIds : [],
          department: deptFilter || null,
          semester: semFilter ? Number(semFilter) : null,
          password_type: passwordType,
          common_password: passwordType === 'common' ? commonPassword.trim() : null,
        }),
      });

      setBulkActivationModal((prev) => ({
        ...prev,
        submitting: false,
        result: res,
      }));

      showNotice(res.message || 'Bulk student passwords generated successfully!');
      await Promise.all([loadStudents(), loadOverview()]);
    } catch (err) {
      setBulkActivationModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || 'Bulk activation failed. Please try again.',
      }));
    }
  }

  function downloadCredentialsCSV(credentials = []) {
    if (!credentials || credentials.length === 0) return;

    const loginUrl = `${window.location.origin}/student/login`;
    const headers = ['Student Name', 'Roll Number / Student ID', 'Email', 'Department', 'Semester', 'Section', 'Temporary Password', 'Login Portal URL'];

    const rows = credentials.map((st) => [
      `"${(st.full_name || '').replace(/"/g, '""')}"`,
      `"${st.roll_number || ''}"`,
      `"${st.email || ''}"`,
      `"${st.department || ''}"`,
      `"${st.semester || ''}"`,
      `"${st.section || ''}"`,
      `"${st.temp_password || ''}"`,
      `"${loginUrl}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `student_login_credentials_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function copyAllBulkCredentialsText(credentials = []) {
    if (!credentials || credentials.length === 0) return;

    const loginUrl = `${window.location.origin}/student/login`;
    let text = `MENTORA STUDENT PORTAL - TEMPORARY LOGIN CREDENTIALS\n`;
    text += `Generated on: ${new Date().toLocaleString()}\n`;
    text += `Login Portal URL: ${loginUrl}\n`;
    text += `====================================================\n\n`;

    credentials.forEach((st, idx) => {
      text += `${idx + 1}. ${st.full_name}\n`;
      text += `   Student ID / Roll: ${st.roll_number}\n`;
      text += `   Email: ${st.email || '—'}\n`;
      text += `   Dept / Sem: ${st.department} Sem ${st.semester} Sec ${st.section || 'A'}\n`;
      text += `   Temporary Password: ${st.temp_password}\n\n`;
    });

    text += `Note: Students must change their temporary password upon first login.\n`;

    navigator.clipboard.writeText(text);
    setBulkActivationModal((prev) => ({ ...prev, copiedAll: true }));
    setTimeout(() => {
      setBulkActivationModal((prev) => (prev ? { ...prev, copiedAll: false } : null));
    }, 2500);
  }

  // Quick In-Row Reassignment
  async function handleQuickReassign(studentId, targetMentorId) {
    try {
      await apiRequest('/admin/allocate', {
        method: 'POST',
        body: JSON.stringify({
          student_ids: [studentId],
          target_mentor_id: targetMentorId || null,
        }),
      });
      showNotice('Mentor allotment updated!');
      await Promise.all([loadStudents(), loadMentors(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to reassign student');
    }
  }

  // Multi-Student Batch Allocation
  async function handleApplyBulkAllocation() {
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student to reassign.');
      return;
    }
    setBulkAssigning(true);
    try {
      const res = await apiRequest('/admin/allocate', {
        method: 'POST',
        body: JSON.stringify({
          student_ids: selectedStudentIds,
          target_mentor_id: bulkTargetMentorId || null,
        }),
      });
      showNotice(res.message || 'Batch allotment completed successfully!');
      setSelectedStudentIds([]);
      setBulkTargetMentorId('');
      await Promise.all([loadStudents(), loadMentors(), loadOverview()]);
    } catch (err) {
      alert(err.message || 'Failed to reallocate selected students.');
    } finally {
      setBulkAssigning(false);
    }
  }

  // Prepare & open confirmation dialog for Bulk Mentor Assignment
  function handleOpenAssignmentConfirmation(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!engineMentorId) {
      alert('Please select a designated faculty mentor.');
      return;
    }

    const selectedMentor = mentors.find((m) => String(m.id) === String(engineMentorId));
    if (selectedMentor?.status === 'inactive') {
      alert(`Cannot assign students: ${selectedMentor.full_name} is marked as inactive.`);
      return;
    }

    if (!selectedCandidateIds || selectedCandidateIds.length === 0) {
      alert('Please select at least one student from the preview table to assign.');
      return;
    }

    const candidateList = enginePreview?.preview_students || [];
    const chosenStudents = candidateList.filter((s) => selectedCandidateIds.includes(s.id));
    const reassignments = chosenStudents.filter((s) => s.mentor_id !== null && s.mentor_id !== Number(engineMentorId));
    const unassignedCount = chosenStudents.filter((s) => s.mentor_id === null).length;

    // Capacity limit check
    const currentMentees = selectedMentor?.allocated_students || 0;
    const projectedMentees = currentMentees + chosenStudents.length;
    const cap = engineCapacityLimit || selectedMentor?.max_capacity || 30;
    const exceedsCapacity = projectedMentees > cap;

    setEngineConfirmDialog({
      mentor: selectedMentor,
      totalCount: chosenStudents.length,
      unassignedCount,
      reassignments,
      exceedsCapacity,
      projectedMentees,
      capacityLimit: cap,
      confirmedReassignCheck: reassignments.length === 0, // auto-checked if no reassignments
    });
  }

  // Execute Bulk Mentor Assignment with Validation & Capacity Enforcement
  async function handleConfirmAndExecuteAssignment() {
    if (!engineConfirmDialog) return;
    const { reassignments, confirmedReassignCheck } = engineConfirmDialog;

    if (reassignments.length > 0 && !confirmedReassignCheck) {
      alert('Please check the confirmation box to authorize reassigning students who already have active faculty mentors.');
      return;
    }

    setEngineExecuting(true);
    try {
      const res = await apiRequest('/admin/bulk-allocate', {
        method: 'POST',
        body: JSON.stringify({
          department: engineDept || null,
          semester: engineSem ? Number(engineSem) : null,
          target_mentor_id: engineMentorId,
          student_ids: selectedCandidateIds,
          unassigned_only: !engineIncludeAssigned,
          capacity_limit: engineCapacityLimit,
          override_capacity: engineOverrideCapacity,
          confirm_reassign: reassignments.length > 0,
        }),
      });

      setEngineResult(res);
      setEngineConfirmDialog(null);
      showNotice(res.message || 'Bulk mentor assignment completed successfully!');
      await Promise.all([
        loadStudents(),
        loadMentors(),
        loadOverview(),
        loadAllocationHistory(),
        fetchAllocationPreview(),
      ]);
    } catch (err) {
      alert(err.message || 'Failed to execute mentor assignment.');
    } finally {
      setEngineExecuting(false);
    }
  }

  // Toggle single candidate selection
  function toggleCandidateSelection(studentId) {
    setSelectedCandidateIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  }

  // Toggle select all candidate students
  function toggleSelectAllCandidates(selectableList) {
    if (!selectableList || selectableList.length === 0) return;
    const selectableIds = selectableList.map((s) => s.id);
    const allSelected = selectableIds.every((id) => selectedCandidateIds.includes(id));
    if (allSelected) {
      setSelectedCandidateIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  }

  // Toggle single student selection
  function toggleStudentSelection(id) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Toggle all students on current page
  function toggleSelectAllOnPage() {
    const pageIds = students.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }

  // Filtered mentors list for Mentors Tab
  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      !mentorSearch.trim() ||
      m.full_name?.toLowerCase().includes(mentorSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(mentorSearch.toLowerCase()) ||
      m.employee_id?.toLowerCase().includes(mentorSearch.toLowerCase());
    const matchesDept = !mentorDeptFilter || m.department === mentorDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Filtered coordinators for Class Coordinators Tab
  const filteredCoordinators = coordinators.filter((c) => {
    const q = coordSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.mentor_name?.toLowerCase().includes(q) ||
      c.mentor_email?.toLowerCase().includes(q) ||
      c.mentor_employee_id?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      String(c.semester).includes(q) ||
      c.section?.toLowerCase().includes(q);

    const matchesDept = !coordDeptFilter || c.department === coordDeptFilter;
    const matchesStatus =
      coordStatusFilter === 'all'
        ? true
        : coordStatusFilter === 'active'
        ? c.status === 'active'
        : c.status !== 'active';

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="admin-page">
      {/* ── Top Header Bar ── */}
      <div className="page-header-row admin-header-row">
        <div>
          <div className="sem-module-badge admin-badge">
            <Shield size={14} />
            <span>INSTITUTIONAL ADMINISTRATION</span>
          </div>
          <h2>Admin Control Center</h2>
          <p>
            Enterprise governance across faculty mentors, global student cohorts, and workload allocation.
          </p>
        </div>

        {/* Global Action Shortcuts */}
        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setMentorModal({
                isNew: true,
                data: {
                  full_name: '',
                  email: '',
                  password: 'password123',
                  department: 'Computer Science',
                  designation: 'Assistant Professor',
                  employee_id: '',
                  phone: '',
                  college: 'School of Engineering & Technology',
                  cabin_number: '',
                },
              })
            }
          >
            <Plus size={16} />
            <span>Add Mentor</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setStudentModal({
                isNew: true,
                data: {
                  full_name: '',
                  email: '',
                  roll_number: '',
                  admission_number: '',
                  department: 'Computer Science',
                  semester: 1,
                  batch: '2024-2028',
                  academic_year: '2026-27',
                  section: 'A',
                  phone: '',
                  mentor_id: mentors[0]?.id || '',
                },
              })
            }
          >
            <Plus size={16} />
            <span>Enroll Student</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setActiveTab('allocation')}
          >
            <UserCheck size={16} />
            <span>Bulk Mentor Assignment</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="alert-box success mb-4">
          <CheckCircle2 size={18} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert-box error mb-4">
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>
            <strong>Administration Alert</strong>
            <p>{error}</p>
          </div>
          <button className="btn-secondary" onClick={loadOverview}>
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ── Executive Institutional Metrics (5 KPI Cards) ── */}
      {overview && (
        <div className="admin-kpi-grid">
          {/* 1. Total Mentors */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap violet">
              <Users size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="kpi-label">Faculty Mentors</span>
              <strong className="kpi-val">{overview.summary.total_mentors}</strong>
              <span className="kpi-sub">Across All Departments</span>
            </div>
          </div>

          {/* 2. Total Students */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap blue">
              <GraduationCap size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="kpi-label">Total Students</span>
              <strong className="kpi-val">{overview.summary.total_students}</strong>
              <span className="kpi-sub">Active Student Body</span>
            </div>
          </div>

          {/* 3. Allotment Coverage */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap green">
              <UserCheck size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="kpi-label">Allocation Coverage</span>
              <strong className="kpi-val">{overview.summary.allocation_coverage}%</strong>
              <div className="admin-kpi-progress">
                <div
                  className="admin-kpi-fill green"
                  style={{ width: `${overview.summary.allocation_coverage}%` }}
                />
              </div>
              <span className="kpi-sub">
                {overview.summary.assigned_students} Assigned ·{' '}
                <strong style={{ color: overview.summary.unassigned_students > 0 ? '#b91c1c' : '#166534' }}>
                  {overview.summary.unassigned_students} Unassigned
                </strong>
              </span>
            </div>
          </div>

          {/* 4. Dossier Completion */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap amber">
              <BookOpen size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="kpi-label">Dossiers Submitted</span>
              <strong className="kpi-val">{overview.summary.completion_rate}%</strong>
              <div className="admin-kpi-progress">
                <div
                  className="admin-kpi-fill amber"
                  style={{ width: `${overview.summary.completion_rate}%` }}
                />
              </div>
              <span className="kpi-sub">
                {overview.summary.completed_profiles} Done · {overview.summary.pending_profiles} Pending
              </span>
            </div>
          </div>

          {/* 5. Institutional Academic Averages */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon-wrap purple">
              <Award size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="kpi-label">Academic Health</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <strong className="kpi-val">{overview.summary.avg_cgpa ? Number(overview.summary.avg_cgpa).toFixed(2) : '—'}</strong>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--slate-blue)' }}>CGPA</span>
              </div>
              <span className="kpi-sub">
                Avg Attendance: <strong>{overview.summary.avg_attendance ? `${overview.summary.avg_attendance}%` : '—'}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Navigation Tabs ── */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Building size={17} />
          <span>Institutional Overview</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'mentors' ? 'active' : ''}`}
          onClick={() => setActiveTab('mentors')}
        >
          <Users size={17} />
          <span>Mentors Hub ({mentors.length})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <GraduationCap size={17} />
          <span>All Students & Allotments ({studentsTotal})</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'allocation' ? 'active' : ''}`}
          onClick={() => setActiveTab('allocation')}
        >
          <UserCheck size={17} />
          <span>Bulk Mentor Assignment</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'coordinators' ? 'active' : ''}`}
          onClick={() => setActiveTab('coordinators')}
        >
          <Award size={17} />
          <span>Class Coordinators ({coordinators.filter((c) => c.status === 'active').length})</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 1: INSTITUTIONAL OVERVIEW
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && overview && (
        <div className="admin-tab-content">
          <div className="admin-grid-2">
            {/* Department Breakdown */}
            <div className="panel-card p-4">
              <div className="card-header-clean mb-3">
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--deep-violet-ink)' }}>
                    Departmental Capacity & Coverage
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '15.5px', color: 'var(--slate-blue)' }}>
                    Monitor faculty-to-student ratios and unassigned students per engineering discipline.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="portal-table admin-student-table">
                  <thead>
                    <tr>
                      <th>DEPARTMENT</th>
                      <th>FACULTY MENTORS</th>
                      <th>TOTAL STUDENTS</th>
                      <th>ASSIGNED</th>
                      <th>UNASSIGNED</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.departments.map((dept, idx) => {
                      const cov = dept.total_students > 0 ? Math.round((dept.assigned_students / dept.total_students) * 100) : 0;
                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{dept.department}</strong>
                          </td>
                          <td>
                            <span className="badge-bubble">{dept.active_mentors} Mentors</span>
                          </td>
                          <td>{dept.total_students}</td>
                          <td>
                            <span style={{ color: '#166534', fontWeight: 700 }}>{dept.assigned_students}</span>
                          </td>
                          <td>
                            <span style={{ color: dept.unassigned_students > 0 ? '#dc2626' : 'var(--muted-text)', fontWeight: 700 }}>
                              {dept.unassigned_students}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${cov === 100 ? 'complete' : cov > 50 ? 'warning' : 'danger'}`}>
                              {cov}% Covered
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Semester Cohorts Distribution */}
            <div className="panel-card p-4">
              <div className="card-header-clean mb-3">
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--deep-violet-ink)' }}>
                    Semester Cohort Distribution
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '15.5px', color: 'var(--slate-blue)' }}>
                    Student volume and dossier compliance across active semesters.
                  </p>
                </div>
              </div>

              <div className="admin-sem-list">
                {overview.semesters.map((sem) => {
                  const sNum = sem.semester;
                  const sLabel = sNum === 1 ? '1st Semester' : sNum === 2 ? '2nd Semester' : sNum === 3 ? '3rd Semester' : `${sNum}th Semester`;
                  const sPct = sem.total_students > 0 ? Math.round((sem.completed_students / sem.total_students) * 100) : 0;

                  return (
                    <div key={sNum} className="admin-sem-item">
                      <div className="admin-sem-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="sem-pill-tag">{sLabel}</span>
                          <strong style={{ fontSize: '16.5px', color: 'var(--deep-violet-ink)' }}>
                            {sem.total_students} Students
                          </strong>
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--iris-bloom)' }}>
                          {sem.completed_students} of {sem.total_students} Dossiers ({sPct}%)
                        </span>
                      </div>
                      <div className="sem-progress-track mt-2">
                        <div className="sem-progress-fill" style={{ width: `${sPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Banner */}
              <div className="admin-action-banner mt-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sliders size={20} style={{ color: 'var(--cornflower-blue)' }} />
                  <div>
                    <strong style={{ color: 'var(--deep-violet-ink)' }}>Need to balance faculty workloads?</strong>
                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--slate-blue)' }}>
                      Use the bulk allocation engine to redistribute student cohorts in a few clicks.
                    </p>
                  </div>
                </div>
                <button className="btn-sm-primary" onClick={() => setActiveTab('allocation')}>
                  Open Allocator →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 2: FACULTY MENTORS DIRECTORY
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'mentors' && (
        <div className="admin-tab-content">
          {/* Mentors Filter Bar */}
          <div className="directory-filter-bar mb-4">
            <div className="search-input-field">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search mentor by name, employee ID, or email…"
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
              />
              {mentorSearch && (
                <button className="clear-search-btn" onClick={() => setMentorSearch('')}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="filter-dropdowns">
              <div className="filter-select-wrap">
                <Filter size={15} />
                <select
                  value={mentorDeptFilter}
                  onChange={(e) => setMentorDeptFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setMentorModal({
                    isNew: true,
                    data: {
                      full_name: '',
                      email: '',
                      password: 'password123',
                      department: 'Computer Science',
                      designation: 'Assistant Professor',
                      employee_id: '',
                      phone: '',
                      college: 'School of Engineering & Technology',
                      cabin_number: '',
                    },
                  })
                }
              >
                <Plus size={16} />
                <span>Add Mentor</span>
              </button>
            </div>
          </div>

          {/* Mentors Grid Cards */}
          <div className="admin-mentors-grid">
            {filteredMentors.length === 0 ? (
              <div className="panel-card text-center p-5" style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--slate-blue)' }}>No faculty mentors found matching your criteria.</p>
              </div>
            ) : (
              filteredMentors.map((m) => {
                const initials = (m.full_name || 'MP')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const semList = Array.isArray(m.active_semesters) ? m.active_semesters.filter(Boolean) : [];

                return (
                  <div key={m.id} className="admin-mentor-card">
                    {/* Header - Clickable to open full mentor profile details */}
                    <div
                      className="admin-mcard-top clickable-header"
                      onClick={() => handleOpenMentorDetails(m.id)}
                      title="Click to view full mentor profile & assigned students"
                    >
                      <div className="admin-mcard-avatar">{initials}</div>
                      <div className="admin-mcard-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong className="admin-mcard-name clickable-name">
                            {m.full_name}
                          </strong>
                          <span className="mcard-view-badge">
                            <Eye size={11} /> Details
                          </span>
                        </div>
                        <span className="admin-mcard-desig">{m.designation || 'Faculty Mentor'}</span>
                        <span className="admin-mcard-dept">{m.department}</span>
                      </div>
                    </div>

                    {/* Metadata Items */}
                    <div className="admin-mcard-meta">
                      <div className="mcard-meta-row">
                        <Mail size={14} />
                        <span>{m.email}</span>
                      </div>
                      {m.phone && (
                        <div className="mcard-meta-row">
                          <Phone size={14} />
                          <span>{m.phone}</span>
                        </div>
                      )}
                      {m.employee_id && (
                        <div className="mcard-meta-row">
                          <Briefcase size={14} />
                          <span>Emp ID: {m.employee_id}</span>
                        </div>
                      )}
                      {m.cabin_number && (
                        <div className="mcard-meta-row">
                          <MapPin size={14} />
                          <span>{m.cabin_number}</span>
                        </div>
                      )}
                    </div>

                    {/* Workload Metric Chips */}
                    <div className="admin-mcard-workload">
                      <div className="workload-item">
                        <span className="workload-label">Allocated Students</span>
                        <strong className="workload-val" style={{ color: 'var(--iris-bloom)' }}>
                          {m.allocated_students || 0}
                        </strong>
                      </div>
                      <div className="workload-item">
                        <span className="workload-label">Dossiers (Done/Pending)</span>
                        <strong className="workload-val" style={{ color: '#166534' }}>
                          {m.completed_profiles || 0} / {m.pending_profiles || 0}
                        </strong>
                      </div>
                      <div className="workload-item">
                        <span className="workload-label">Avg Attendance</span>
                        <strong className="workload-val">
                          {m.cohort_avg_attendance ? `${m.cohort_avg_attendance}%` : '—'}
                        </strong>
                      </div>
                    </div>

                    {/* Active Semesters Tags */}
                    {semList.length > 0 && (
                      <div className="admin-mcard-sems">
                        <span className="sem-label-micro">Cohorts:</span>
                        {semList.map((s) => (
                          <span key={s} className="sem-pill-tag">
                            Sem {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="admin-mcard-actions">
                      <button
                        type="button"
                        className="btn-action-view"
                        onClick={() => handleOpenMentorDetails(m.id)}
                        title="View full mentor profile and assigned students"
                        style={{ marginRight: 'auto', background: '#F5F3FF', color: '#6D28D9', borderColor: '#DDD6FE' }}
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>

                      <button
                        type="button"
                        className="btn-action-view"
                        onClick={() => {
                          setStudentMentorFilter(String(m.id));
                          setActiveTab('students');
                        }}
                        title="View only this mentor's students"
                      >
                        <span>Students</span>
                        <ChevronRight size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn-icon-sub"
                        onClick={() => setMentorModal({ isNew: false, data: { ...m } })}
                        title="Edit mentor profile"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-icon-sub text-danger"
                        onClick={() => {
                          setDeleteMentorModal(m);
                          setDeleteMentorReassignTo('');
                        }}
                        title="Delete faculty mentor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 3: GLOBAL STUDENTS DIRECTORY & ALLOTMENT MATRIX
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <div className="admin-tab-content">
          {/* Multi-Select Bulk Allocation Bar (Conditionally Displayed) */}
          {selectedStudentIds.length > 0 && (
            <div className="admin-bulk-action-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckSquare size={18} style={{ color: 'var(--iris-bloom)' }} />
                <strong>{selectedStudentIds.length} Students Selected</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  value={bulkTargetMentorId}
                  onChange={(e) => setBulkTargetMentorId(e.target.value)}
                  className="bulk-mentor-select"
                >
                  <option value="">Choose Designated Mentor…</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.department})
                    </option>
                  ))}
                  <option value="unassigned">⚠️ Move to Unassigned Pool</option>
                </select>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleApplyBulkAllocation}
                  disabled={bulkAssigning || !bulkTargetMentorId}
                >
                  {bulkAssigning ? 'Applying…' : 'Apply Reassignment'}
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onClick={() => openBulkActivationModal('selected')}
                >
                  <KeyRound size={15} />
                  <span>Generate Passwords for Selected ({selectedStudentIds.length})</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedStudentIds([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Top Actions & Quick Bulk Operations */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontSize: '14.5px', color: 'var(--deep-violet-ink)', fontWeight: 600 }}>
                Student Directory & Account Access Controls
              </span>
              <div style={{ fontSize: '12.5px', color: 'var(--slate-blue)' }}>
                Showing {students.length} of {studentsTotal} students in institutional registry
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: '7px',
                  boxShadow: '0 2px 6px rgba(109,40,217,0.25)',
                }}
                onClick={() => openBulkActivationModal('unactivated')}
                title="Bulk generate temporary login passwords for all students"
              >
                <KeyRound size={15} />
                <span>⚡ Bulk Activate Students / Generate Passwords</span>
              </button>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="directory-filter-bar mb-3">
            <div className="search-input-field">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by student name, roll number, enrollment, email…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              {studentSearch && (
                <button className="clear-search-btn" onClick={() => setStudentSearch('')}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="filter-dropdowns">
              {/* Mentor Filter */}
              <div className="filter-select-wrap">
                <Users size={15} />
                <select
                  value={studentMentorFilter}
                  onChange={(e) => {
                    setStudentMentorFilter(e.target.value);
                    setStudentPage(1);
                  }}
                >
                  <option value="">All Mentors</option>
                  <option value="unassigned">⚠️ Unassigned Students Only</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="filter-select-wrap">
                <Filter size={15} />
                <select
                  value={studentDeptFilter}
                  onChange={(e) => {
                    setStudentDeptFilter(e.target.value);
                    setStudentPage(1);
                  }}
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div className="filter-select-wrap">
                <select
                  value={studentSemFilter}
                  onChange={(e) => {
                    setStudentSemFilter(e.target.value);
                    setStudentPage(1);
                  }}
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="filter-select-wrap">
                <select
                  value={studentStatusFilter}
                  onChange={(e) => {
                    setStudentStatusFilter(e.target.value);
                    setStudentPage(1);
                  }}
                >
                  <option value="">All Dossier Statuses</option>
                  <option value="Complete">Completed Dossiers</option>
                  <option value="Incomplete">Pending Dossiers</option>
                </select>
              </div>

              {/* Account Status Filter */}
              <div className="filter-select-wrap">
                <KeyRound size={14} />
                <select
                  value={studentAccountStatusFilter}
                  onChange={(e) => {
                    setStudentAccountStatusFilter(e.target.value);
                    setStudentPage(1);
                  }}
                >
                  <option value="">All Account Statuses</option>
                  <option value="not_activated">⏳ Not Activated</option>
                  <option value="active">✓ Active Accounts</option>
                  <option value="password_reset_required">🔑 Reset Required</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="filter-select-wrap">
                <ArrowUpDown size={15} />
                <select
                  value={studentSort}
                  onChange={(e) => setStudentSort(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="name_asc">Name (A–Z)</option>
                  <option value="roll_asc">Roll Number</option>
                  <option value="cgpa_desc">Highest CGPA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="panel-card">
            <div className="table-responsive">
              <table className="portal-table admin-student-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id))}
                        onChange={toggleSelectAllOnPage}
                      />
                    </th>
                    <th>STUDENT PROFILE</th>
                    <th>ROLL / ENROLLMENT</th>
                    <th>DEPT & BATCH</th>
                    <th>SEMESTER</th>
                    <th>CGPA & ATTENDANCE</th>
                    <th>DOSSIER STATUS</th>
                    <th>ACCOUNT STATUS</th>
                    <th>ASSIGNED MENTOR</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-table-state">
                        <div className="empty-icon-wrap">🔍</div>
                        <strong>No students match the selected filter criteria</strong>
                        <p>Try clearing mentor or department filters.</p>
                        <button
                          className="btn-sm-primary mt-2"
                          onClick={() => {
                            setStudentSearch('');
                            setStudentDeptFilter('');
                            setStudentSemFilter('');
                            setStudentMentorFilter('');
                            setStudentStatusFilter('');
                            setStudentAccountStatusFilter('');
                          }}
                        >
                          Clear All Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      const isComplete = s.profile_status === 'Complete';

                      return (
                        <tr key={s.id} className={isSelected ? 'row-selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudentSelection(s.id)}
                            />
                          </td>

                          {/* Student Profile */}
                          <td>
                            <div className="student-cell-wrap">
                              {s.student_photo_url ? (
                                <img
                                  src={s.student_photo_url}
                                  alt={s.full_name}
                                  className="student-table-photo"
                                  onClick={() => navigate(`/mentees/${s.id}`)}
                                />
                              ) : (
                                <div
                                  className={`avatar-chip ${isComplete ? 'complete' : ''}`}
                                  onClick={() => navigate(`/mentees/${s.id}`)}
                                >
                                  {(s.full_name || 'S').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <strong
                                  className="student-name-link"
                                  onClick={() => navigate(`/mentees/${s.id}`)}
                                  title="View complete student dossier"
                                >
                                  {s.full_name}
                                </strong>
                                <div className="student-sub-email">{s.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Roll No */}
                          <td>
                            <span className="roll-badge">{s.roll_number}</span>
                            {s.admission_number && (
                              <div className="text-muted-tiny">Adm: {s.admission_number}</div>
                            )}
                          </td>

                          {/* Dept & Batch */}
                          <td>
                            <span style={{ fontWeight: 600 }}>{s.department || '—'}</span>
                            <div className="text-muted-tiny">{s.batch || 'Batch 2024–28'}</div>
                          </td>

                          {/* Semester */}
                          <td>
                            <span className="sem-pill-tag">Sem {s.semester}</span>
                          </td>

                          {/* CGPA & Attendance */}
                          <td>
                            <strong style={{ display: 'block', fontSize: '16.5px' }}>
                              {s.current_cgpa ? Number(s.current_cgpa).toFixed(2) : '—'} CGPA
                            </strong>
                            <span className="text-muted-tiny">
                              {s.attendance_percentage != null ? `${Number(s.attendance_percentage).toFixed(1)}% Att.` : 'No Att.'}
                            </span>
                          </td>

                          {/* Dossier Status */}
                          <td>
                            <span className={`status-pill ${isComplete ? 'complete' : 'pending'}`}>
                              {isComplete ? '✓ Complete' : '⏳ Incomplete'}
                            </span>
                          </td>

                          {/* Account Status */}
                          <td>
                            {s.account_status === 'not_activated' || !s.has_password ? (
                              <span
                                className="status-pill pending"
                                style={{
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  borderColor: '#FDE68A',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="Login account is not activated. Generate temporary password to activate."
                              >
                                <Clock size={11} />
                                <span>Not Activated</span>
                              </span>
                            ) : s.account_status === 'password_reset_required' || s.must_change_password ? (
                              <span
                                className="status-pill"
                                style={{
                                  background: '#EDE9FE',
                                  color: '#6D28D9',
                                  borderColor: '#DDD6FE',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="Temporary password active. Password reset required upon login."
                              >
                                <KeyRound size={11} />
                                <span>Reset Required</span>
                              </span>
                            ) : (
                              <span
                                className="status-pill complete"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="Student account active and login enabled"
                              >
                                <CheckCircle2 size={11} />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          {/* Assigned Mentor & Quick Reassign */}
                          <td>
                            <div className="admin-mentor-cell">
                              {s.mentor_id ? (
                                <span className="assigned-mentor-pill" title={`Mentor: ${s.mentor_name}`}>
                                  <UserCheck size={13} />
                                  <span>{s.mentor_name}</span>
                                </span>
                              ) : (
                                <span className="unassigned-mentor-pill">
                                  <UserX size={13} />
                                  <span>Unassigned</span>
                                </span>
                              )}

                              <select
                                className="quick-reassign-select"
                                value={s.mentor_id || ''}
                                onChange={(e) => handleQuickReassign(s.id, e.target.value)}
                                title="Quickly reassign mentor"
                              >
                                <option value="" disabled>Change Mentor…</option>
                                <option value="">⚠️ Set Unassigned</option>
                                {mentors.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    Assign to {m.full_name} ({m.department})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-row-actions" style={{ justifyContent: 'flex-end', gap: 6 }}>
                              {/* Activate Account / Set Password or Reset Password */}
                              {s.account_status === 'not_activated' || !s.has_password ? (
                                <button
                                  type="button"
                                  className="btn-action-activate"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '5px 10px',
                                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '11.5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(109,40,217,0.25)',
                                    whiteSpace: 'nowrap',
                                  }}
                                  onClick={() => openActivationModal(s, 'activate')}
                                  title="Activate Account / Set Password"
                                >
                                  <KeyRound size={12} />
                                  <span>Activate / Set Password</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-icon-sub"
                                  style={{
                                    color: '#6D28D9',
                                    borderColor: '#DDD6FE',
                                    background: '#F5F3FF',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                  }}
                                  onClick={() => openActivationModal(s, 'reset')}
                                  title="Reset student login password"
                                >
                                  <RotateCcw size={12} />
                                  <span>Reset Pwd</span>
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn-action-view"
                                onClick={() => navigate(`/mentees/${s.id}`)}
                                title="Open full student dossier"
                              >
                                <span>Dossier</span>
                                <ChevronRight size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn-icon-sub"
                                onClick={() => setStudentModal({ isNew: false, data: { ...s } })}
                                title="Edit student record"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn-icon-sub text-danger"
                                onClick={() => setDeleteStudentModal(s)}
                                title="Delete student record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {studentsTotal > studentLimit && (
              <div className="pagination-bar">
                <span>
                  Showing {(studentPage - 1) * studentLimit + 1} to{' '}
                  {Math.min(studentPage * studentLimit, studentsTotal)} of {studentsTotal} students
                </span>
                <div className="pagination-controls">
                  <button
                    disabled={studentPage === 1}
                    onClick={() => setStudentPage(studentPage - 1)}
                    className="btn-page"
                  >
                    Previous
                  </button>
                  <span className="page-current">Page {studentPage}</span>
                  <button
                    disabled={studentPage * studentLimit >= studentsTotal}
                    onClick={() => setStudentPage(studentPage + 1)}
                    className="btn-page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 4: BULK MENTOR ASSIGNMENT
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'allocation' && (
        <div className="admin-tab-content">
          <div className="panel-card p-5" style={{ maxWidth: 1040, margin: '0 auto' }}>
            {/* Header: Non-overlapping, clean vertical column layout */}
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div className="admin-kpi-icon-wrap purple" style={{ margin: '0 auto 12px' }}>
                <UserCheck size={26} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--deep-violet-ink)', margin: 0 }}>
                Bulk Mentor Assignment
              </h3>
              <p style={{ color: 'var(--slate-blue)', fontSize: '15.5px', maxWidth: 620, margin: '8px auto 0', lineHeight: 1.5 }}>
                Assign multiple students to a faculty mentor at once.
              </p>
            </div>

            {/* Execution Receipt Display */}
            {engineResult && (
              <div className="execution-receipt-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={24} style={{ color: '#166534' }} />
                    <div>
                      <strong style={{ fontSize: '18px', color: '#166534', display: 'block' }}>
                        Mentor Assignment Completed Successfully!
                      </strong>
                      <span style={{ fontSize: '14px', color: '#15803D' }}>
                        Database updated · Target mentor notified · Audit trail logged
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEngineResult(null)}
                      style={{ padding: '6px 14px', fontSize: '14px' }}
                    >
                      Assign More Students
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setActiveTab('students')}
                      style={{ padding: '6px 14px', fontSize: '14px' }}
                    >
                      View Students Directory
                    </button>
                  </div>
                </div>

                <div className="receipt-stats-grid" style={{ marginTop: '16px' }}>
                  <div className="receipt-stat-pill success">
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Successfully Assigned</span>
                    <strong style={{ fontSize: '22px' }}>{engineResult.successful_count} Students</strong>
                    <span style={{ fontSize: '13px' }}>Assigned to {engineResult.mentor?.full_name}</span>
                  </div>

                  <div className="receipt-stat-pill skipped">
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Skipped</span>
                    <strong style={{ fontSize: '22px' }}>{engineResult.skipped_count} Students</strong>
                    <span style={{ fontSize: '13px' }}>
                      {engineResult.skipped_students && engineResult.skipped_students.length > 0
                        ? engineResult.skipped_students[0].reason
                        : 'Already assigned or preserved'}
                    </span>
                  </div>

                  <div className="receipt-stat-pill failed">
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Failed</span>
                    <strong style={{ fontSize: '22px' }}>{engineResult.failed_count || 0} Students</strong>
                    <span style={{ fontSize: '13px' }}>Zero database errors</span>
                  </div>

                  <div className="receipt-stat-pill" style={{ background: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Mentor Portfolio</span>
                    <strong style={{ fontSize: '22px' }}>
                      {engineResult.mentor?.new_total_mentees} / {engineResult.mentor?.max_capacity || 30}
                    </strong>
                    <span style={{ fontSize: '13px' }}>Active Mentees</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleOpenAssignmentConfirmation} className="modal-body">
              {/* Section 1: Dynamic Department & Semester Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '20px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--deep-violet-ink)', display: 'block', marginBottom: 6 }}>
                    1. Department Filter
                  </label>
                  <select
                    value={engineDept}
                    onChange={(e) => setEngineDept(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px' }}
                  >
                    <option value="">All Departments</option>
                    {(enginePreview?.available_departments || ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering']).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--deep-violet-ink)', display: 'block', marginBottom: 6 }}>
                    2. Academic Semester Filter
                  </label>
                  <select
                    value={engineSem}
                    onChange={(e) => setEngineSem(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px' }}
                  >
                    <option value="">All Semesters</option>
                    {(enginePreview?.available_semesters && enginePreview.available_semesters.length > 0
                      ? enginePreview.available_semesters
                      : [1, 2, 3, 4, 5, 6, 7, 8]
                    ).map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2: Student Summary Cards (3 Clear Cards from Database) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: '22px' }}>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      background: '#EEF2FF',
                      color: '#4F46E5',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Total Students
                    </span>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', lineHeight: 1.15 }}>
                      {enginePreviewLoading ? '…' : (enginePreview?.cohort?.total_matched ?? 0)}
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>In selected cohort</span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      background: '#DCFCE7',
                      color: '#15803D',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Already Assigned
                    </span>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803D', lineHeight: 1.15 }}>
                      {enginePreviewLoading ? '…' : (enginePreview?.cohort?.assigned_count ?? 0)}
                    </div>
                    <span style={{ fontSize: '12px', color: '#166534' }}>Under faculty mentors</span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1.5px solid #FDE68A',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      background: '#FEF3C7',
                      color: '#B45309',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UserX size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Unassigned Students
                    </span>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#B45309', lineHeight: 1.15 }}>
                      {enginePreviewLoading ? '…' : (enginePreview?.cohort?.unassigned_count ?? 0)}
                    </div>
                    <span style={{ fontSize: '12px', color: '#92400E' }}>Awaiting mentor assignment</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Mentor Selection (Active mentors only, with Capacity & Mentee counts) */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--deep-violet-ink)', display: 'block', marginBottom: 6 }}>
                  3. Select Faculty Mentor
                </label>
                <select
                  required
                  value={engineMentorId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setEngineMentorId(id);
                    setEngineOverrideCapacity(false);
                    const selected = mentors.find((m) => String(m.id) === String(id));
                    if (selected && selected.max_capacity) {
                      setEngineCapacityLimit(selected.max_capacity);
                    }
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px' }}
                >
                  <option value="">Choose an active faculty mentor…</option>
                  {mentors
                    .filter((m) => m.status !== 'inactive') // Requirement 4: Do not display inactive mentors!
                    .map((m) => {
                      const count = m.allocated_students || 0;
                      const cap = m.max_capacity || 30;
                      const available = Math.max(0, cap - count);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.full_name} — {m.department} ({count} / {cap} Mentees · {available} Available)
                        </option>
                      );
                    })}
                </select>

                {/* Selected Mentor Workload Capacity Details Card */}
                {enginePreview?.target_mentor && (
                  <div className="mentor-capacity-card" style={{ marginTop: '12px' }}>
                    <div className="mentor-capacity-header">
                      <div>
                        <strong style={{ fontSize: '15.5px', color: 'var(--deep-violet-ink)' }}>
                          {enginePreview.target_mentor.full_name}
                        </strong>
                        <span style={{ fontSize: '13.5px', color: 'var(--slate-blue)', marginLeft: 8 }}>
                          {enginePreview.target_mentor.department} · {enginePreview.target_mentor.designation}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--slate-blue)' }}>
                          Configured Capacity Limit:
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="150"
                          value={engineCapacityLimit}
                          onChange={(e) => {
                            setEngineCapacityLimit(Math.max(1, Number(e.target.value)));
                            setEngineOverrideCapacity(false);
                          }}
                          style={{
                            width: 65,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1.5px solid var(--light-border)',
                            fontSize: '14px',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                          title="Configure mentor maximum mentee workload capacity"
                        />
                      </div>
                    </div>

                    {/* Progress Bar & Workload Stats */}
                    {(() => {
                      const current = enginePreview.calculation?.current_mentees || 0;
                      const toAdd = selectedCandidateIds.length;
                      const projected = current + toAdd;
                      const cap = engineCapacityLimit || 30;
                      const pct = Math.min(100, Math.round((projected / cap) * 100));
                      const isOver = projected > cap;

                      return (
                        <>
                          <div className="capacity-progress-bar">
                            <div
                              className={`capacity-progress-fill ${isOver ? 'danger' : pct > 80 ? 'warning' : 'normal'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: 'var(--slate-blue)' }}>
                            <span>
                              Current Mentees: <strong>{current}</strong>
                            </span>
                            <span>
                              Assigning Selected:{' '}
                              <strong style={{ color: 'var(--iris-bloom)' }}>+{toAdd}</strong>
                            </span>
                            <span>
                              Projected Total:{' '}
                              <strong style={{ color: isOver ? '#DC2626' : 'var(--deep-violet-ink)' }}>
                                {projected} / {cap}
                              </strong>{' '}
                              ({pct}%)
                            </span>
                          </div>

                          {/* Capacity Warning Alert */}
                          {isOver && (
                            <div className="alert-box error mt-3" style={{ padding: '10px 14px', borderRadius: '10px', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
                                <strong style={{ color: '#991B1B', fontSize: '13.5px' }}>
                                  Workload Capacity Warning: Exceeds Limit by {projected - cap} Students
                                </strong>
                              </div>
                              <p style={{ margin: 0, fontSize: '13px', color: '#991B1B', lineHeight: 1.45 }}>
                                Assigning {toAdd} selected student(s) will bring {enginePreview.target_mentor.full_name}&apos;s mentee roster to {projected}, exceeding their configured limit of {cap}.
                              </p>
                              <label className="login-checkbox-label mt-1" style={{ fontWeight: 700, color: '#991B1B', fontSize: '13px' }}>
                                <input
                                  type="checkbox"
                                  checked={engineOverrideCapacity}
                                  onChange={(e) => setEngineOverrideCapacity(e.target.checked)}
                                />
                                <span>Authorize capacity limit override for this assignment</span>
                              </label>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Section 4: Candidate Students Preview Table with Checkbox Selection */}
              <div className="allocation-preview-card" style={{ marginTop: '22px' }}>
                {/* Preview Toolbar */}
                <div className="allocation-preview-header" style={{ padding: '14px 18px', background: '#FAFAFD', borderBottom: '1px solid #E2E8F0' }}>
                  <div>
                    <strong style={{ fontSize: '15.5px', color: '#1E1B4B' }}>
                      Student Preview ({enginePreview?.preview_students?.length || 0} Total in Cohort)
                    </strong>
                    <span style={{ fontSize: '13.5px', color: '#64748B', marginLeft: 8 }}>
                      • <strong>{selectedCandidateIds.length}</strong> selected to assign
                    </span>
                  </div>

                  {/* Allocation Rules & Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Requirement 6: Option to include already assigned students for reassignment */}
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: engineIncludeAssigned ? '#B45309' : '#475569',
                        background: engineIncludeAssigned ? '#FEF3C7' : '#F1F5F9',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={engineIncludeAssigned}
                        onChange={(e) => {
                          setEngineIncludeAssigned(e.target.checked);
                        }}
                      />
                      <span>Include already assigned students for reassignment</span>
                    </label>

                    {/* Quick Selection Buttons */}
                    {(() => {
                      const candidateList = enginePreview?.preview_students || [];
                      const selectableList = candidateList.filter((s) => {
                        if (engineMentorId && s.mentor_id === Number(engineMentorId)) return false;
                        if (!engineIncludeAssigned && s.mentor_id !== null) return false;
                        return true;
                      });

                      const unassignedList = candidateList.filter((s) => s.mentor_id === null);

                      return (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setSelectedCandidateIds(unassignedList.map((s) => s.id))}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            title="Select only unassigned students"
                          >
                            Unassigned Only ({unassignedList.length})
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => toggleSelectAllCandidates(selectableList)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            {selectableList.every((s) => selectedCandidateIds.includes(s.id)) && selectableList.length > 0
                              ? 'Deselect All'
                              : `Select All (${selectableList.length})`}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Table: Clean, readable without clipping or nested scroll issues */}
                <div className="table-responsive" style={{ maxHeight: 420, overflowY: 'auto' }}>
                  <table className="portal-table" style={{ width: '100%', minWidth: 880, fontSize: '13.5px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 3, background: '#F8FAFC' }}>
                      <tr>
                        <th style={{ width: 44, textAlign: 'center' }}>
                          {(() => {
                            const candidateList = enginePreview?.preview_students || [];
                            const selectableList = candidateList.filter((s) => {
                              if (engineMentorId && s.mentor_id === Number(engineMentorId)) return false;
                              if (!engineIncludeAssigned && s.mentor_id !== null) return false;
                              return true;
                            });
                            const allChecked = selectableList.length > 0 && selectableList.every((s) => selectedCandidateIds.includes(s.id));
                            return (
                              <input
                                type="checkbox"
                                checked={allChecked}
                                disabled={selectableList.length === 0}
                                onChange={() => toggleSelectAllCandidates(selectableList)}
                                title={allChecked ? 'Deselect All' : 'Select All'}
                              />
                            );
                          })()}
                        </th>
                        <th>STUDENT NAME</th>
                        <th>STUDENT ID / ROLL</th>
                        <th>DEPARTMENT</th>
                        <th>SEMESTER</th>
                        <th>CURRENT ASSIGNED MENTOR</th>
                        <th>PLANNED ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!enginePreview?.preview_students || enginePreview.preview_students.length === 0) ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                            {enginePreviewLoading ? 'Loading cohort candidate preview…' : 'No students found matching the selected Department & Semester filters.'}
                          </td>
                        </tr>
                      ) : (
                        enginePreview.preview_students.map((s) => {
                          const isAssignedToThisMentor = engineMentorId && s.mentor_id === Number(engineMentorId);
                          const isAssignedToOther = s.mentor_id !== null && !isAssignedToThisMentor;
                          const isSelectable = !isAssignedToThisMentor && (!isAssignedToOther || engineIncludeAssigned);
                          const isChecked = selectedCandidateIds.includes(s.id);

                          return (
                            <tr
                              key={s.id}
                              style={{
                                background: isChecked ? '#FAF5FF' : undefined,
                                transition: 'background 0.1s ease',
                              }}
                            >
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!isSelectable}
                                  onChange={() => toggleCandidateSelection(s.id)}
                                  title={
                                    isAssignedToThisMentor
                                      ? 'Already assigned to this mentor'
                                      : !isSelectable
                                      ? 'Check "Include already assigned students" to reassign'
                                      : 'Select student'
                                  }
                                />
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                                      color: '#fff',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      display: 'grid',
                                      placeItems: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {(s.full_name || 'S').slice(0, 2).toUpperCase()}
                                  </div>
                                  <strong style={{ color: '#0F172A' }}>{s.full_name}</strong>
                                </div>
                              </td>
                              <td>
                                <code
                                  style={{
                                    background: '#EEF2FF',
                                    color: '#4338CA',
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    fontWeight: 600,
                                    fontSize: '12.5px',
                                  }}
                                >
                                  {s.roll_number}
                                </code>
                              </td>
                              <td>{s.department}</td>
                              <td>Sem {s.semester || '—'}</td>
                              <td>
                                {s.current_mentor_name ? (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      background: isAssignedToThisMentor ? '#EDE9FE' : '#F1F5F9',
                                      color: isAssignedToThisMentor ? '#6D28D9' : '#475569',
                                      border: isAssignedToThisMentor ? '1px solid #DDD6FE' : '1px solid #E2E8F0',
                                    }}
                                  >
                                    {s.current_mentor_name}
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      background: '#FEF3C7',
                                      color: '#92400E',
                                      border: '1px solid #FDE68A',
                                    }}
                                  >
                                    ⏳ Unassigned
                                  </span>
                                )}
                              </td>
                              <td>
                                {isAssignedToThisMentor ? (
                                  <span style={{ color: '#64748B', fontSize: '12.5px' }}>
                                    ⏭ Already assigned to this mentor
                                  </span>
                                ) : isChecked ? (
                                  isAssignedToOther ? (
                                    <span style={{ color: '#B45309', fontWeight: 600, fontSize: '12.5px' }}>
                                      ⚠️ Will reassign from {s.current_mentor_name}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#15803D', fontWeight: 700, fontSize: '12.5px' }}>
                                      ✓ Will assign to {enginePreview?.target_mentor?.full_name || 'selected mentor'}
                                    </span>
                                  )
                                ) : (
                                  <span style={{ color: '#94A3B8', fontSize: '12.5px' }}>
                                    — Not selected
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEngineDept('');
                    setEngineSem('');
                    setEngineMentorId('');
                    setEngineIncludeAssigned(false);
                    setEngineOverrideCapacity(false);
                    setEngineResult(null);
                  }}
                  style={{ padding: '10px 18px', fontSize: '13.5px' }}
                >
                  Reset Form & Filters
                </button>

                {(() => {
                  const count = selectedCandidateIds.length;
                  const selectedMentor = mentors.find((m) => String(m.id) === String(engineMentorId));
                  const isBlockedByInactive = selectedMentor?.status === 'inactive';
                  const isDisabled = engineExecuting || !engineMentorId || count === 0 || isBlockedByInactive;

                  return (
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isDisabled}
                      style={{
                        minWidth: 240,
                        padding: '11px 24px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                      title={
                        !engineMentorId
                          ? 'Please select a designated faculty mentor'
                          : isBlockedByInactive
                          ? 'Selected mentor is marked as inactive'
                          : count === 0
                          ? 'Please select at least one student from preview table'
                          : `Assign ${count} student(s)`
                      }
                    >
                      <UserCheck size={17} />
                      <span>
                        {count === 0
                          ? 'Select Students to Assign'
                          : `Assign ${count} Selected Student${count === 1 ? '' : 's'}`}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>

          {/* Requirement 8: Mentor Assignment History & Audit Trail Section */}
          <div className="panel-card p-4" style={{ maxWidth: 1040, margin: '24px auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} style={{ color: 'var(--iris-bloom)' }} />
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--deep-violet-ink)' }}>
                    Mentor Assignment History & Audit Trail
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '13.5px', color: 'var(--slate-blue)' }}>
                    Authoritative institutional log of mentor assignments and student transfers.
                  </p>
                </div>
              </div>

              {/* View Switcher Tabs & Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setHistoryTab('students')}
                    style={{
                      border: 'none',
                      background: historyTab === 'students' ? '#FFFFFF' : 'transparent',
                      color: historyTab === 'students' ? '#6D28D9' : '#64748B',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: historyTab === 'students' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Individual Student Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTab('batches')}
                    style={{
                      border: 'none',
                      background: historyTab === 'batches' ? '#FFFFFF' : 'transparent',
                      color: historyTab === 'batches' ? '#6D28D9' : '#64748B',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: historyTab === 'batches' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Batch Transactions
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={loadAllocationHistory}
                  disabled={historyLoading}
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  <RefreshCw size={13} className={historyLoading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Sub-view 1: Individual Student Log (Satisfies Requirement 8 explicitly) */}
            {historyTab === 'students' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <input
                    type="text"
                    placeholder="Search by student name or roll…"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    style={{ fontSize: '13px', padding: '6px 12px', width: 260, borderRadius: '6px', border: '1.5px solid #CBD5E1' }}
                  />
                </div>

                <div className="table-responsive">
                  <table className="portal-table" style={{ fontSize: '13.5px' }}>
                    <thead>
                      <tr>
                        <th>STUDENT NAME & ID</th>
                        <th>PREVIOUS MENTOR</th>
                        <th>NEW MENTOR</th>
                        <th>ASSIGNED BY</th>
                        <th>ASSIGNMENT DATE & TIME</th>
                        <th style={{ textAlign: 'center' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Flatten affected_students across all allocation history batches
                        const flattenedRecords = [];
                        for (const batch of allocationHistory) {
                          const affected = Array.isArray(batch.affected_students) ? batch.affected_students : [];
                          for (const st of affected) {
                            flattenedRecords.push({
                              id: `${batch.id}-${st.id}`,
                              student_name: st.full_name,
                              roll_number: st.roll_number,
                              previous_mentor: st.previous_mentor_name || 'Unassigned',
                              new_mentor: batch.target_mentor_name,
                              assigned_by: batch.admin_name || 'Administrator',
                              created_at: batch.created_at,
                            });
                          }
                        }

                        const filtered = flattenedRecords.filter((r) => {
                          if (!historySearch.trim()) return true;
                          const q = historySearch.toLowerCase();
                          return (
                            r.student_name.toLowerCase().includes(q) ||
                            r.roll_number.toLowerCase().includes(q) ||
                            r.new_mentor.toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#64748B' }}>
                                No individual student mentor assignment records found.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.slice(0, 30).map((r) => (
                          <tr key={r.id}>
                            <td>
                              <div>
                                <strong style={{ color: '#0F172A', display: 'block' }}>{r.student_name}</strong>
                                <code style={{ fontSize: '12px', background: '#EEF2FF', color: '#4338CA', padding: '1px 6px', borderRadius: '4px' }}>
                                  {r.roll_number}
                                </code>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: r.previous_mentor === 'Unassigned' ? '#92400E' : '#475569', fontWeight: 500 }}>
                                {r.previous_mentor}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  background: '#FAF5FF',
                                  color: '#6D28D9',
                                  border: '1px solid #E9D5FF',
                                }}
                              >
                                {r.new_mentor}
                              </span>
                            </td>
                            <td>
                              <strong>{r.assigned_by}</strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '13px', color: '#64748B', whiteSpace: 'nowrap' }}>
                                {new Date(r.created_at).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  color: '#059669',
                                  background: '#ECFDF5',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                }}
                              >
                                ✓ Assigned
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Sub-view 2: Batch Transactions */}
            {historyTab === 'batches' && (
              <div className="table-responsive">
                <table className="portal-table" style={{ fontSize: '13.5px' }}>
                  <thead>
                    <tr>
                      <th>DATE & TIME</th>
                      <th>ADMINISTRATOR</th>
                      <th>TARGET FACULTY MENTOR</th>
                      <th>COHORT FILTER</th>
                      <th>SCOPE</th>
                      <th>RESULTS</th>
                      <th style={{ textAlign: 'right' }}>DETAILS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted-text)' }}>
                          No cohort allocation operations logged yet.
                        </td>
                      </tr>
                    ) : (
                      allocationHistory.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span style={{ fontSize: '13px', color: 'var(--slate-blue)', whiteSpace: 'nowrap' }}>
                              {new Date(item.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td>
                            <strong>{item.admin_name || 'Administrator'}</strong>
                          </td>
                          <td>
                            <span className="badge-bubble">{item.target_mentor_name}</span>
                          </td>
                          <td>
                            {item.department || 'All'}{item.semester ? ` (Sem ${item.semester})` : ''}
                          </td>
                          <td>
                            <span style={{ fontSize: '13px' }}>
                              {item.unassigned_only ? 'Unassigned Only' : 'Reassignment Included'}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: '#166534', fontWeight: 700 }}>
                              {item.successful_count} Allocated
                            </span>
                            {item.skipped_count > 0 && (
                              <span style={{ color: 'var(--muted-text)', fontSize: '13px', marginLeft: 6 }}>
                                ({item.skipped_count} skipped)
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setShowHistoryModal(item)}
                              style={{ padding: '4px 10px', fontSize: '12.5px', gap: 4 }}
                            >
                              <Eye size={13} />
                              <span>Inspect ({item.affected_students?.length || 0})</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal before Executing Assignment (Requirements 6 & 7) */}
      {engineConfirmDialog && (
        <div className="modal-overlay" onClick={() => !engineExecuting && setEngineConfirmDialog(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 580,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px 16px',
                borderBottom: '1px solid #F1F5F9',
                background: '#FAFAFD',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    background: engineConfirmDialog.reassignments.length > 0 ? '#FEF3C7' : '#EDE9FE',
                    color: engineConfirmDialog.reassignments.length > 0 ? '#B45309' : '#7C3AED',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {engineConfirmDialog.reassignments.length > 0 ? <AlertTriangle size={22} /> : <UserCheck size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#1E1B4B', fontWeight: 700 }}>
                    Confirm Mentor Assignment
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: 2 }}>
                    Please review student allocation details before proceeding
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                disabled={engineExecuting}
                onClick={() => setEngineConfirmDialog(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  display: 'grid',
                  placeItems: 'center',
                  border: 'none',
                  background: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px' }}>
              {/* Target Mentor Card */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Target Faculty Mentor
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {engineConfirmDialog.mentor.full_name}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                    {engineConfirmDialog.mentor.department} · {engineConfirmDialog.mentor.designation || 'Faculty Mentor'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Projected Load</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: engineConfirmDialog.exceedsCapacity ? '#DC2626' : '#15803D' }}>
                    {engineConfirmDialog.projectedMentees} / {engineConfirmDialog.capacityLimit}
                  </div>
                </div>
              </div>

              {/* Assignment Numbers Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: '18px' }}>
                <div style={{ background: '#F1F5F9', padding: '10px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#475569', display: 'block' }}>Total Selected</span>
                  <strong style={{ fontSize: '18px', color: '#0F172A' }}>{engineConfirmDialog.totalCount}</strong>
                </div>
                <div style={{ background: '#ECFDF5', padding: '10px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#059669', display: 'block' }}>Unassigned</span>
                  <strong style={{ fontSize: '18px', color: '#15803D' }}>{engineConfirmDialog.unassignedCount}</strong>
                </div>
                <div style={{ background: engineConfirmDialog.reassignments.length > 0 ? '#FEF3C7' : '#F1F5F9', padding: '10px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: engineConfirmDialog.reassignments.length > 0 ? '#92400E' : '#475569', display: 'block' }}>Reassignments</span>
                  <strong style={{ fontSize: '18px', color: engineConfirmDialog.reassignments.length > 0 ? '#B45309' : '#0F172A' }}>
                    {engineConfirmDialog.reassignments.length}
                  </strong>
                </div>
              </div>

              {/* Reassignment Warning Table & Required Confirmation */}
              {engineConfirmDialog.reassignments.length > 0 && (
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1.5px solid #FDE68A',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={17} style={{ color: '#D97706' }} />
                    <strong style={{ color: '#92400E', fontSize: '14px' }}>
                      Reassignment Notice ({engineConfirmDialog.reassignments.length} Student{engineConfirmDialog.reassignments.length === 1 ? '' : 's'})
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#92400E', lineHeight: 1.45, marginBottom: 10 }}>
                    The following students currently have active faculty mentors. Confirming will transfer them to {engineConfirmDialog.mentor.full_name}:
                  </p>
                  <div style={{ maxHeight: 130, overflowY: 'auto', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #FDE68A', padding: '6px 10px', fontSize: '12.5px' }}>
                    {engineConfirmDialog.reassignments.map((s) => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #FEF3C7' }}>
                        <span>
                          <strong>{s.full_name}</strong> ({s.roll_number})
                        </span>
                        <span style={{ color: '#B45309' }}>
                          From: {s.current_mentor_name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 12,
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#92400E',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={engineConfirmDialog.confirmedReassignCheck}
                      onChange={(e) =>
                        setEngineConfirmDialog((prev) => ({
                          ...prev,
                          confirmedReassignCheck: e.target.checked,
                        }))
                      }
                    />
                    <span>I confirm reassigning these students from their current faculty mentors</span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: '20px' }}>
                <button
                  type="button"
                  disabled={engineExecuting}
                  onClick={() => setEngineConfirmDialog(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    engineExecuting ||
                    (engineConfirmDialog.reassignments.length > 0 && !engineConfirmDialog.confirmedReassignCheck)
                  }
                  onClick={handleConfirmAndExecuteAssignment}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    color: '#fff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    opacity:
                      engineConfirmDialog.reassignments.length > 0 && !engineConfirmDialog.confirmedReassignCheck
                        ? 0.55
                        : 1,
                  }}
                >
                  {engineExecuting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Assigning Students…</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      <span>Confirm & Assign Students</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Details Inspection Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Allocation Operation Audit Details</h3>
                <span style={{ fontSize: '14.5px', color: 'var(--slate-blue)' }}>
                  Executed on {new Date(showHistoryModal.created_at).toLocaleString()} by {showHistoryModal.admin_name}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body p-4">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="cohort-stat-box">
                  <span className="cohort-stat-label">Target Mentor</span>
                  <strong style={{ fontSize: '17px', color: 'var(--deep-violet-ink)' }}>{showHistoryModal.target_mentor_name}</strong>
                </div>
                <div className="cohort-stat-box highlight-assigned">
                  <span className="cohort-stat-label">Allocated</span>
                  <strong style={{ fontSize: '20px', color: '#166534' }}>{showHistoryModal.successful_count} Students</strong>
                </div>
                <div className="cohort-stat-box">
                  <span className="cohort-stat-label">Cohort Scope</span>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{showHistoryModal.department} {showHistoryModal.semester ? `(Sem ${showHistoryModal.semester})` : ''}</span>
                </div>
              </div>

              <h4 style={{ fontSize: '16.5px', fontWeight: 700, margin: '0 0 8px', color: 'var(--deep-violet-ink)' }}>
                Transferred Students ({showHistoryModal.affected_students?.length || 0}):
              </h4>

              <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--light-border)', borderRadius: 10 }}>
                {showHistoryModal.affected_students?.length === 0 ? (
                  <p style={{ padding: 16, margin: 0, textAlign: 'center', color: 'var(--muted-text)' }}>No individual student records logged.</p>
                ) : (
                  <table className="portal-table" style={{ fontSize: '15px' }}>
                    <thead>
                      <tr>
                        <th>STUDENT NAME</th>
                        <th>ROLL NUMBER</th>
                        <th>PREVIOUS MENTOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showHistoryModal.affected_students.map((st, i) => (
                        <tr key={i}>
                          <td><strong>{st.full_name || st.name}</strong></td>
                          <td><span style={{ fontFamily: 'monospace' }}>{st.roll_number}</span></td>
                          <td>
                            <span style={{ color: st.previous_mentor_name === 'Unassigned' ? '#B45309' : 'var(--deep-violet-ink)' }}>
                              {st.previous_mentor_name || 'Unassigned'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-actions-row mt-4">
                <button type="button" className="btn-secondary" onClick={() => setShowHistoryModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 5: CLASS COORDINATORS MANAGEMENT
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'coordinators' && (
        <div className="admin-tab-content">
          {/* Top Banner & KPI Summary */}
          <div className="admin-grid-4 mb-4">
            <div className="panel-card p-3">
              <span className="kpi-label">Class Cohorts</span>
              <strong className="kpi-val">{coordClasses.length}</strong>
              <span className="kpi-sub">Total Discovered Cohorts</span>
            </div>

            <div className="panel-card p-3">
              <span className="kpi-label">Coordinators Assigned</span>
              <strong className="kpi-val" style={{ color: '#16a34a' }}>
                {coordClasses.filter((c) => c.active_coordinator).length}
              </strong>
              <span className="kpi-sub">Active Section Supervision</span>
            </div>

            <div className="panel-card p-3">
              <span className="kpi-label">Unassigned Classes</span>
              <strong className="kpi-val" style={{ color: coordClasses.some((c) => !c.active_coordinator) ? '#dc2626' : '#16a34a' }}>
                {coordClasses.filter((c) => !c.active_coordinator).length}
              </strong>
              <span className="kpi-sub">Need Designated Coordinator</span>
            </div>

            <div className="panel-card p-3">
              <span className="kpi-label">Faculty Coordinators</span>
              <strong className="kpi-val" style={{ color: '#7c3aed' }}>
                {new Set(coordinators.filter((c) => c.status === 'active').map((c) => c.mentor_id)).size}
              </strong>
              <span className="kpi-sub">Holding Dual Responsibilities</span>
            </div>
          </div>

          {/* Action Row & Filter Toolbar */}
          <div className="filter-toolbar-card mb-4">
            <div className="filter-search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search coordinators by name, employee ID, department, section…"
                value={coordSearch}
                onChange={(e) => setCoordSearch(e.target.value)}
              />
              {coordSearch && (
                <button className="clear-search-btn" onClick={() => setCoordSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="filter-dropdowns-row">
              <div className="filter-dropdown">
                <span className="filter-label">Department:</span>
                <select
                  value={coordDeptFilter}
                  onChange={(e) => setCoordDeptFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="Civil Engineering">Civil</option>
                </select>
              </div>

              <div className="filter-dropdown">
                <span className="filter-label">Status:</span>
                <select
                  value={coordStatusFilter}
                  onChange={(e) => setCoordStatusFilter(e.target.value)}
                >
                  <option value="all">All Assignments ({coordinators.length})</option>
                  <option value="active">Active Only ({coordinators.filter((c) => c.status === 'active').length})</option>
                  <option value="inactive">Archived History ({coordinators.filter((c) => c.status !== 'active').length})</option>
                </select>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  setDesignateMentorId(mentors[0]?.id || '');
                  setShowDesignateModal(true);
                }}
              >
                <Plus size={16} />
                <span>Designate Class Coordinator</span>
              </button>
            </div>
          </div>

          {/* Class Coordinators Master Table */}
          <div className="panel-card">
            <div className="card-header-clean p-4 border-b">
              <div>
                <h3 className="section-title">Class Coordinator Registry & History</h3>
                <p className="section-sub">
                  Dual-responsibility faculty designations overseeing entire class cohorts and student welfare
                </p>
              </div>
              <button
                className="btn-secondary btn-sm"
                onClick={loadCoordinators}
                disabled={coordLoading}
              >
                <RefreshCw size={14} className={coordLoading ? 'rotating' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Class / Cohort</th>
                    <th>Designated Class Coordinator</th>
                    <th>Class Strength</th>
                    <th>Mentors in Class</th>
                    <th>Assignment Status</th>
                    <th>Designated On / By</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoordinators.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <Award size={36} style={{ color: 'var(--muted-text)', margin: '0 auto 8px' }} />
                        <p style={{ color: 'var(--muted-text)', fontSize: '16px', margin: 0 }}>
                          No coordinator assignments found. Click "Designate Class Coordinator" to assign a mentor.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCoordinators.map((c) => {
                      const isActive = c.status === 'active';
                      return (
                        <tr key={c.id} className={!isActive ? 'revoked-row' : ''}>
                          <td>
                            <div>
                              <strong>
                                {c.department} · Sem {c.semester}
                              </strong>
                              <span className="badge-tag ml-1">Sec {c.section}</span>
                              <div style={{ fontSize: '13px', color: 'var(--muted-text)', marginTop: 2 }}>
                                {c.course || 'B.Tech'} ({c.academic_year || '2026-27'})
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar-sub">
                                {c.mentor_name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <strong>{c.mentor_name}</strong>
                                <span className="student-sub">
                                  🆔 {c.mentor_employee_id || 'FAC'} · {c.mentor_email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{c.total_students || 0}</strong> Students
                          </td>
                          <td>
                            <strong>{c.total_mentors || 1}</strong> Mentors
                          </td>
                          <td>
                            {isActive ? (
                              <span className="badge-tag success" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                                Active Coordinator
                              </span>
                            ) : (
                              <span className="badge-tag danger">
                                Revoked / Replaced
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '13.5px' }}>
                              <span>{new Date(c.assigned_at).toLocaleDateString()}</span>
                              <div style={{ color: 'var(--muted-text)', fontSize: '12px' }}>
                                By: {c.assigned_by_admin_name || 'Admin'}
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                className="btn-secondary btn-sm"
                                title="Change or reassign coordinator for this class"
                                onClick={() => {
                                  setDesignateDept(c.department);
                                  setDesignateCourse(c.course || 'B.Tech Computer Science');
                                  setDesignateAcademicYear(c.academic_year || '2026-27');
                                  setDesignateSem(String(c.semester));
                                  setDesignateSection(c.section);
                                  setDesignateMentorId(c.mentor_id);
                                  setShowDesignateModal(true);
                                }}
                              >
                                <span>Reassign</span>
                              </button>

                              {isActive && (
                                <button
                                  className="btn-danger-outline btn-sm"
                                  title="Revoke Coordinator Designation"
                                  disabled={revokingId === c.id}
                                  onClick={() => handleRevokeCoordinator(c)}
                                >
                                  <span>Revoke</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Modal 1: Add / Edit Mentor */}
      {mentorModal && (
        <div className="modal-overlay" onClick={() => setMentorModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>{mentorModal.isNew ? 'Enroll New Faculty Mentor' : 'Edit Faculty Mentor'}</h3>
              <button className="modal-close-btn" onClick={() => setMentorModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMentor} className="modal-body p-4">
              <div className="form-group mb-3">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={mentorModal.data.full_name || ''}
                  onChange={(e) =>
                    setMentorModal({
                      ...mentorModal,
                      data: { ...mentorModal.data, full_name: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="mentor@institution.edu"
                    value={mentorModal.data.email || ''}
                    onChange={(e) =>
                      setMentorModal({
                        ...mentorModal,
                        data: { ...mentorModal.data, email: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. FAC-CSE-042"
                    value={mentorModal.data.employee_id || ''}
                    onChange={(e) =>
                      setMentorModal({
                        ...mentorModal,
                        data: { ...mentorModal.data, employee_id: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {mentorModal.isNew && (
                <div className="form-group mb-3">
                  <label>Initial Temporary Password</label>
                  <input
                    type="password"
                    placeholder="Default: password123"
                    value={mentorModal.data.password || ''}
                    onChange={(e) =>
                      setMentorModal({
                        ...mentorModal,
                        data: { ...mentorModal.data, password: e.target.value },
                      })
                    }
                  />
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Department</label>
                  <select
                    value={mentorModal.data.department || ''}
                    onChange={(e) =>
                      setMentorModal({
                        ...mentorModal,
                        data: { ...mentorModal.data, department: e.target.value },
                      })
                    }
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label>Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Associate Professor"
                    value={mentorModal.data.designation || ''}
                    onChange={(e) =>
                      setMentorModal({
                        ...mentorModal,
                        data: { ...mentorModal.data, designation: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765..."
                    value={mentorModal.data.phone || ''}
                    onChange={(e) =>
                      setMentorModal({
                        ...mentorModal,
                        data: { ...mentorModal.data, phone: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Cabin / Office Location</label>
                  <input
                    type="text"
                    placeholder="Cabin 304, Block-B"
                    value={mentorModal.data.cabin_number || ''}
                    onChange={(e) =>
                      setMentorModal({
                        ...mentorModal,
                        data: { ...mentorModal.data, cabin_number: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMentorModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={mentorSaving}
                >
                  {mentorSaving ? 'Saving…' : mentorModal.isNew ? 'Enroll Mentor' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Student */}
      {studentModal && (
        <div className="modal-overlay" onClick={() => setStudentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>{studentModal.isNew ? 'Enroll Student' : 'Edit Student'}</h3>
              <button className="modal-close-btn" onClick={() => setStudentModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="modal-body p-4">
              <div className="form-group mb-3">
                <label>Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Gupta"
                  value={studentModal.data.full_name || ''}
                  onChange={(e) =>
                    setStudentModal({
                      ...studentModal,
                      data: { ...studentModal.data, full_name: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024CS1095"
                    value={studentModal.data.roll_number || ''}
                    onChange={(e) =>
                      setStudentModal({
                        ...studentModal,
                        data: { ...studentModal.data, roll_number: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Student Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.edu"
                    value={studentModal.data.email || ''}
                    onChange={(e) =>
                      setStudentModal({
                        ...studentModal,
                        data: { ...studentModal.data, email: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Department</label>
                  <select
                    value={studentModal.data.department || ''}
                    onChange={(e) =>
                      setStudentModal({
                        ...studentModal,
                        data: { ...studentModal.data, department: e.target.value },
                      })
                    }
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label>Semester</label>
                  <select
                    value={studentModal.data.semester || ''}
                    onChange={(e) =>
                      setStudentModal({
                        ...studentModal,
                        data: { ...studentModal.data, semester: Number(e.target.value) },
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Assigned Faculty Mentor</label>
                <select
                  value={studentModal.data.mentor_id || ''}
                  onChange={(e) =>
                    setStudentModal({
                      ...studentModal,
                      data: { ...studentModal.data, mentor_id: e.target.value || null },
                    })
                  }
                >
                  <option value="">⚠️ Leave Unassigned</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} — {m.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStudentModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={studentSaving}
                >
                  {studentSaving ? 'Saving…' : studentModal.isNew ? 'Enroll Student' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Safe Delete Mentor */}
      {deleteMentorModal && (
        <div className="modal-overlay" onClick={() => !deletingMentor && setDeleteMentorModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
                  <Trash2 size={19} />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--deep-violet-ink)', fontWeight: 700 }}>
                  Remove Faculty Mentor
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteMentorModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body p-4">
              <p style={{ color: 'var(--slate-blue)', fontSize: '17px', lineHeight: 1.6, margin: '8px 0 14px' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--deep-violet-ink)' }}>{deleteMentorModal.full_name}</strong>?
              </p>

              {Number(deleteMentorModal.allocated_students) > 0 && (
                <div className="alert-box warning mb-3">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>{deleteMentorModal.allocated_students} Students Assigned!</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '15px' }}>
                      Choose what to do with their active student assignments:
                    </p>
                  </div>
                </div>
              )}

              {Number(deleteMentorModal.allocated_students) > 0 && (
                <div className="form-group mb-3">
                  <label style={{ fontWeight: 700, fontSize: '15.5px' }}>Reassign Mentees To:</label>
                  <select
                    value={deleteMentorReassignTo}
                    onChange={(e) => setDeleteMentorReassignTo(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                  >
                    <option value="">Move to Unassigned Pool</option>
                    {mentors
                      .filter((m) => m.id !== deleteMentorModal.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          Reassign to {m.full_name} ({m.department})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={deletingMentor}
                  onClick={() => setDeleteMentorModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={deletingMentor}
                  onClick={handleConfirmDeleteMentor}
                >
                  {deletingMentor ? 'Removing…' : 'Yes, Remove Mentor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3B: Comprehensive Faculty Mentor Profile & Details Modal */}
      {mentorDetailsModal && mentorDetailsModal.mentor && (
        <div className="modal-overlay" onClick={() => setMentorDetailsModal(null)}>
          <div
            className="mentor-profile-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Header Banner */}
            <div className="mentor-profile-header-banner">
              <div className="mentor-profile-header-left">
                <div className="mentor-profile-avatar-large">
                  {(mentorDetailsModal.mentor.full_name || 'MP')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="mentor-profile-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 className="mentor-profile-name" style={{ margin: 0 }}>
                      {mentorDetailsModal.mentor.full_name}
                    </h2>
                    <span className="mentor-tag-pill active">
                      <CheckCircle2 size={13} /> Active Mentor
                    </span>
                    {mentorDetailsModal.coordinator_classes?.length > 0 && (
                      <span className="mentor-tag-pill coordinator">
                        <Award size={13} /> Class Coordinator
                      </span>
                    )}
                  </div>
                  <div className="mentor-profile-badges">
                    <span className="mentor-tag-pill dept">
                      {mentorDetailsModal.mentor.department}
                    </span>
                    <span className="mentor-tag-pill">
                      {mentorDetailsModal.mentor.designation || 'Faculty Mentor'}
                    </span>
                    {mentorDetailsModal.mentor.employee_id && (
                      <span className="mentor-tag-pill">
                        Emp ID: {mentorDetailsModal.mentor.employee_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMentorDetailsModal(null)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <div className="mentor-profile-scroll-body">
              {mentorDetailsModal.loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-blue)' }}>
                  <RefreshCw size={26} className="spin-icon" style={{ marginBottom: 12, color: 'var(--iris-bloom)' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Loading mentor details and assigned students…</p>
                </div>
              ) : (
                <>
                  {/* Institutional & Contact Info Grid */}
                  <div className="mentor-info-grid">
                    <div className="mentor-info-cell">
                      <div className="mentor-info-icon"><Mail size={16} /></div>
                      <div className="mentor-info-text">
                        <span className="mentor-info-label">Official Email</span>
                        <span className="mentor-info-val">{mentorDetailsModal.mentor.email || '—'}</span>
                      </div>
                    </div>

                    <div className="mentor-info-cell">
                      <div className="mentor-info-icon"><Phone size={16} /></div>
                      <div className="mentor-info-text">
                        <span className="mentor-info-label">Phone / Mobile</span>
                        <span className="mentor-info-val">{mentorDetailsModal.mentor.phone || '—'}</span>
                      </div>
                    </div>

                    <div className="mentor-info-cell">
                      <div className="mentor-info-icon"><MapPin size={16} /></div>
                      <div className="mentor-info-text">
                        <span className="mentor-info-label">Office / Cabin</span>
                        <span className="mentor-info-val">{mentorDetailsModal.mentor.cabin_number || '—'}</span>
                      </div>
                    </div>

                    <div className="mentor-info-cell">
                      <div className="mentor-info-icon"><Building size={16} /></div>
                      <div className="mentor-info-text">
                        <span className="mentor-info-label">College / School</span>
                        <span className="mentor-info-val">{mentorDetailsModal.mentor.college || 'School of Engineering & Technology'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Workload & Performance Metric Cards */}
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--deep-violet-ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Mentoring Workload & Cohort Overview
                    </h4>
                    <div className="mentor-metrics-row">
                      {/* Metric 1: Capacity & Allocation */}
                      <div className="mentor-metric-card">
                        <span className="metric-title">Allocated Mentees</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span className="metric-number" style={{ color: 'var(--iris-bloom)' }}>
                            {mentorDetailsModal.mentor.allocated_students || 0}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--muted-text)', fontWeight: 600 }}>
                            / {mentorDetailsModal.mentor.max_capacity || 30} max
                          </span>
                        </div>
                        <div className="capacity-progress-bar-wrap">
                          <div
                            className="capacity-progress-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.round(((mentorDetailsModal.mentor.allocated_students || 0) / (mentorDetailsModal.mentor.max_capacity || 30)) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="metric-subtext">
                          {Math.max(0, (mentorDetailsModal.mentor.max_capacity || 30) - (mentorDetailsModal.mentor.allocated_students || 0))} seats available
                        </span>
                      </div>

                      {/* Metric 2: Dossier Status */}
                      <div className="mentor-metric-card">
                        <span className="metric-title">Dossier Completion</span>
                        <div className="metric-number" style={{ color: '#166534' }}>
                          {mentorDetailsModal.mentor.completed_profiles || 0}
                          <span style={{ fontSize: '14px', color: 'var(--muted-text)', fontWeight: 600, marginLeft: 4 }}>
                            / {mentorDetailsModal.mentor.allocated_students || 0}
                          </span>
                        </div>
                        <span className="metric-subtext" style={{ color: (mentorDetailsModal.mentor.pending_profiles || 0) > 0 ? '#b45309' : '#166534' }}>
                          {(mentorDetailsModal.mentor.pending_profiles || 0) > 0
                            ? `⚠️ ${mentorDetailsModal.mentor.pending_profiles} pending review`
                            : '✓ 100% Completed'}
                        </span>
                      </div>

                      {/* Metric 3: Cohort Attendance */}
                      <div className="mentor-metric-card">
                        <span className="metric-title">Avg Attendance</span>
                        <div className="metric-number">
                          {mentorDetailsModal.mentor.cohort_avg_attendance
                            ? `${mentorDetailsModal.mentor.cohort_avg_attendance}%`
                            : '—'}
                        </div>
                        <span className="metric-subtext">
                          {Number(mentorDetailsModal.mentor.cohort_avg_attendance || 0) >= 75
                            ? '✓ Healthy Attendance'
                            : '⚠️ Below 75% benchmark'}
                        </span>
                      </div>

                      {/* Metric 4: Cohort CGPA */}
                      <div className="mentor-metric-card">
                        <span className="metric-title">Cohort Avg CGPA</span>
                        <div className="metric-number" style={{ color: '#7c3aed' }}>
                          {mentorDetailsModal.mentor.cohort_avg_cgpa || '—'}
                        </div>
                        <span className="metric-subtext">
                          Scale: 10.00
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Class Coordinator Spotlight (if active) */}
                  {mentorDetailsModal.coordinator_classes?.length > 0 && (
                    <div className="coordinator-spotlight-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Award size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: '15px', color: 'var(--deep-violet-ink)' }}>
                              Class Coordinator Assignment
                            </strong>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#EDE9FE', color: '#6D28D9' }}>
                              Dual Responsibility
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--slate-blue)', marginTop: 2 }}>
                            {mentorDetailsModal.coordinator_classes.map((cc) => (
                              <span key={cc.id} style={{ marginRight: 14 }}>
                                🎓 <strong>{cc.course || cc.department}</strong> • Semester {cc.semester} - Section {cc.section} (AY {cc.academic_year || '2026-27'})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setMentorDetailsModal(null);
                          setActiveTab('coordinators');
                        }}
                      >
                        Manage in Coordinators
                      </button>
                    </div>
                  )}

                  {/* Assigned Mentees Table */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>
                          Assigned Students ({mentorDetailsModal.assigned_students?.length || 0})
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                          Direct mentees assigned to this faculty member
                        </span>
                      </div>

                      {mentorDetailsModal.assigned_students?.length > 0 && (
                        <div className="search-input-field" style={{ maxWidth: 260, padding: '4px 10px' }}>
                          <Search size={14} />
                          <input
                            type="text"
                            placeholder="Filter mentees…"
                            value={mentorDetailsSearch}
                            onChange={(e) => setMentorDetailsSearch(e.target.value)}
                            style={{ fontSize: '13px' }}
                          />
                          {mentorDetailsSearch && (
                            <button className="clear-search-btn" onClick={() => setMentorDetailsSearch('')}>
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {(!mentorDetailsModal.assigned_students || mentorDetailsModal.assigned_students.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '36px 20px', background: '#FAF9FD', borderRadius: '12px', border: '1.5px dashed var(--light-border)' }}>
                        <Users size={32} style={{ color: 'var(--muted-text)', opacity: 0.6, marginBottom: 8 }} />
                        <h5 style={{ margin: '0 0 6px', fontSize: '15px', color: 'var(--deep-violet-ink)' }}>
                          No students currently assigned
                        </h5>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--slate-blue)' }}>
                          Use Bulk Mentor Assignment to allocate a cohort of students to this mentor.
                        </p>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            const mentorIdForEngine = String(mentorDetailsModal.mentor.id);
                            setMentorDetailsModal(null);
                            setEngineMentorId(mentorIdForEngine);
                            setActiveTab('engine');
                          }}
                        >
                          <Plus size={15} />
                          <span>Assign Students to {mentorDetailsModal.mentor.full_name}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="mentor-students-table-wrap">
                        <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: '#F8F7FC', borderBottom: '1px solid var(--light-border)', textAlign: 'left' }}>
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>Student</th>
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>Roll Number</th>
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>Cohort</th>
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>Dossier</th>
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>Attendance</th>
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>CGPA</th>
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>Login Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mentorDetailsModal.assigned_students
                              .filter((s) => {
                                if (!mentorDetailsSearch.trim()) return true;
                                const q = mentorDetailsSearch.toLowerCase();
                                return (
                                  s.full_name?.toLowerCase().includes(q) ||
                                  s.roll_number?.toLowerCase().includes(q) ||
                                  s.email?.toLowerCase().includes(q)
                                );
                              })
                              .map((s) => {
                                const sInitials = (s.full_name || 'ST')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase();

                                return (
                                  <tr key={s.id} style={{ borderBottom: '1px solid #F0ECF8' }}>
                                    <td style={{ padding: '10px 14px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EAE4F2', color: 'var(--iris-bloom)', fontWeight: 700, fontSize: '11px', display: 'grid', placeItems: 'center' }}>
                                          {sInitials}
                                        </div>
                                        <div>
                                          <strong style={{ display: 'block', color: 'var(--deep-violet-ink)' }}>{s.full_name}</strong>
                                          <span style={{ fontSize: '11.5px', color: 'var(--muted-text)' }}>{s.email}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <code style={{ background: '#FAF9FD', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ECE7F5', fontWeight: 700, fontSize: '12px' }}>
                                        {s.roll_number}
                                      </code>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: 'var(--slate-blue)', fontWeight: 600 }}>
                                      Sem {s.semester} - Sec {s.section || 'A'}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      {s.dossier_status === 'Complete' ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '12px', background: '#ECFDF5', color: '#065F46', fontSize: '11px', fontWeight: 700 }}>
                                          <CheckCircle2 size={12} /> Complete
                                        </span>
                                      ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '12px', background: '#FFFBEB', color: '#92400E', fontSize: '11px', fontWeight: 700 }}>
                                          <Clock size={12} /> Pending
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 700, color: Number(s.attendance_percentage || 0) >= 75 ? '#047857' : '#B91C1C' }}>
                                      {Number(s.attendance_percentage || 0) > 0 ? `${s.attendance_percentage}%` : '—'}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--deep-violet-ink)' }}>
                                      {Number(s.current_cgpa || 0) > 0 ? s.current_cgpa : '—'}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      {s.account_status === 'active' ? (
                                        <span style={{ color: '#065F46', fontSize: '11.5px', fontWeight: 700 }}>✓ Active</span>
                                      ) : (
                                        <span style={{ color: 'var(--muted-text)', fontSize: '11.5px', fontWeight: 600 }}>Not Activated</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 3. Modal Footer */}
            <div className="mentor-modal-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const mentorToEdit = mentorDetailsModal.mentor;
                    setMentorDetailsModal(null);
                    setMentorModal({ isNew: false, data: { ...mentorToEdit } });
                  }}
                  title="Edit faculty mentor profile"
                >
                  <Edit2 size={15} />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const mentorIdToFilter = String(mentorDetailsModal.mentor.id);
                    setMentorDetailsModal(null);
                    setStudentMentorFilter(mentorIdToFilter);
                    setActiveTab('students');
                  }}
                  title="View this mentor's students in Students Directory"
                >
                  <Users size={15} />
                  <span>View in Students Tab</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const mentorIdForEngine = String(mentorDetailsModal.mentor.id);
                    setMentorDetailsModal(null);
                    setEngineMentorId(mentorIdForEngine);
                    setActiveTab('engine');
                  }}
                  title="Assign more students to this mentor"
                >
                  <Plus size={15} />
                  <span>Assign More Students</span>
                </button>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setMentorDetailsModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Student */}
      {deleteStudentModal && (
        <div className="modal-overlay" onClick={() => !deletingStudent && setDeleteStudentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
                  <Trash2 size={19} />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--deep-violet-ink)', fontWeight: 700 }}>
                  Remove Student Record
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteStudentModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body p-4">
              <p style={{ color: 'var(--slate-blue)', fontSize: '17px', lineHeight: 1.6, margin: '8px 0 14px' }}>
                Are you sure you want to permanently delete student{' '}
                <strong style={{ color: 'var(--deep-violet-ink)' }}>{deleteStudentModal.full_name}</strong>{' '}
                (Roll: <code>{deleteStudentModal.roll_number}</code>)?
              </p>
              <p style={{ color: 'var(--muted-text)', fontSize: '15px', margin: 0 }}>
                ⚠️ This will permanently remove their academic results, uploaded marksheets, and submitted dossier.
              </p>

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={deletingStudent}
                  onClick={() => setDeleteStudentModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={deletingStudent}
                  onClick={handleConfirmDeleteStudent}
                >
                  {deletingStudent ? 'Deleting…' : 'Yes, Delete Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Designate Class Coordinator */}
      {showDesignateModal && (
        <div className="modal-overlay" onClick={() => setShowDesignateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'grid', placeItems: 'center' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--deep-violet-ink)', fontWeight: 700 }}>
                    Designate Class Coordinator
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--muted-text)' }}>
                    Assign faculty mentor dual responsibility for an entire class section
                  </span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDesignateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDesignateCoordinator} className="modal-body p-4">
              <div className="form-grid-2">
                <div className="form-group mb-3">
                  <label>Department *</label>
                  <select
                    value={designateDept}
                    onChange={(e) => setDesignateDept(e.target.value)}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label>Course / Program *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech Computer Science"
                    value={designateCourse}
                    onChange={(e) => setDesignateCourse(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group mb-3">
                  <label>Academic Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="2026-27"
                    value={designateAcademicYear}
                    onChange={(e) => setDesignateAcademicYear(e.target.value)}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Semester *</label>
                  <select
                    value={designateSem}
                    onChange={(e) => setDesignateSem(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label>Section *</label>
                  <select
                    value={designateSection}
                    onChange={(e) => setDesignateSection(e.target.value)}
                  >
                    {['A', 'B', 'C', 'D'].map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Select Faculty Mentor *</label>
                <select
                  required
                  value={designateMentorId}
                  onChange={(e) => setDesignateMentorId(e.target.value)}
                >
                  <option value="">-- Choose Existing Mentor --</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.employee_id || 'FAC'}) · {m.department} · ({m.mentee_count || 0} Current Mentees)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label>Designation Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Official appointment order, department resolution, or notes…"
                  value={designateNotes}
                  onChange={(e) => setDesignateNotes(e.target.value)}
                />
              </div>

              <div className="alert-box info mb-3">
                <Info size={18} />
                <span style={{ fontSize: '13.5px' }}>
                  <strong>Single Active Coordinator Rule:</strong> Exactly one active coordinator can oversee a class/section at any given time. If an active coordinator is already assigned to this class, they will be archived and seamlessly superseded.
                </span>
              </div>

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDesignateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={designateSubmitting}
                >
                  {designateSubmitting ? 'Designating…' : 'Confirm Coordinator Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Student Account Activation & Password Setup */}
      {activationModal && (
        <div className="modal-overlay" onClick={() => !activationModal.submitting && setActivationModal(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 580,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '22px 26px 18px',
                borderBottom: '1px solid #F1F5F9',
                background: '#FAFAFD',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: activationModal.result
                      ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                      : 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
                    color: activationModal.result ? '#059669' : '#7C3AED',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: activationModal.result
                      ? '0 2px 6px rgba(16, 185, 129, 0.15)'
                      : '0 2px 6px rgba(124, 58, 237, 0.15)',
                  }}
                >
                  {activationModal.result ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#1E1B4B', fontWeight: 700, letterSpacing: '-0.3px' }}>
                    {activationModal.result
                      ? (activationModal.mode === 'activate' ? 'Account Activated Successfully' : 'Password Reset Successfully')
                      : (activationModal.mode === 'activate' ? 'Activate Student Account' : 'Reset Student Password')}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: 2 }}>
                    Manage login credentials and portal access
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                disabled={activationModal.submitting}
                onClick={() => setActivationModal(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  display: 'grid',
                  placeItems: 'center',
                  border: 'none',
                  background: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            {!activationModal.result ? (
              /* State 1: Configuration Form */
              <form onSubmit={handleExecuteActivation} style={{ padding: '24px 26px' }}>
                {activationModal.error && (
                  <div className="alert-box error mb-4" style={{ padding: '10px 14px', fontSize: '13.5px', borderRadius: '10px' }}>
                    <AlertTriangle size={16} />
                    <span>{activationModal.error}</span>
                  </div>
                )}

                {/* Elegant Student Profile Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    marginBottom: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                      color: '#fff',
                      fontSize: '17px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    {(activationModal.student.full_name || 'S').slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: 700 }}>
                        {activationModal.student.full_name}
                      </strong>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: '20px',
                          background: activationModal.student.account_status === 'not_activated' ? '#FEF3C7' : '#DCFCE7',
                          color: activationModal.student.account_status === 'not_activated' ? '#92400E' : '#15803D',
                          border: activationModal.student.account_status === 'not_activated' ? '1px solid #FDE68A' : '1px solid #BBF7D0',
                        }}
                      >
                        {activationModal.student.account_status === 'not_activated' ? '⏳ Not Activated' : '✓ Active'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap', fontSize: '12.5px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#4338CA',
                          background: '#EEF2FF',
                          padding: '2px 7px',
                          borderRadius: '5px',
                        }}
                      >
                        {activationModal.student.roll_number}
                      </span>
                      <span style={{ color: '#64748B' }}>
                        {activationModal.student.department || 'Computer Science'} • Sem {activationModal.student.semester || 1}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Mail size={12} style={{ color: '#94A3B8' }} />
                      <span>{activationModal.student.email}</span>
                    </div>
                  </div>
                </div>

                {/* Password Setup Strategy Selection */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px', display: 'block', marginBottom: '10px' }}>
                    Choose Password Setup Method
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Option 1: Auto-generate */}
                    <div
                      onClick={() => setActivationModal((prev) => ({ ...prev, passwordType: 'generate', error: '' }))}
                      style={{
                        padding: '16px',
                        border: activationModal.passwordType === 'generate' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                        borderRadius: '12px',
                        background: activationModal.passwordType === 'generate' ? '#FAF5FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: activationModal.passwordType === 'generate' ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: activationModal.passwordType === 'generate' ? '6px solid #7C3AED' : '2px solid #CBD5E1',
                          background: '#fff',
                          marginTop: 2,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <strong style={{ fontSize: '14px', color: activationModal.passwordType === 'generate' ? '#6D28D9' : '#1E293B' }}>
                            Auto-Generate Secure Temporary Password
                          </strong>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#059669',
                              background: '#ECFDF5',
                              padding: '1px 7px',
                              borderRadius: '10px',
                            }}
                          >
                            Recommended
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', lineHeight: 1.45 }}>
                          Generates a one-time encrypted temporary password (e.g. <code>Temp#k9W4mX!</code>). The student will be required to change it upon their first login.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Custom password */}
                    <div
                      onClick={() => setActivationModal((prev) => ({ ...prev, passwordType: 'custom', error: '' }))}
                      style={{
                        padding: '16px',
                        border: activationModal.passwordType === 'custom' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                        borderRadius: '12px',
                        background: activationModal.passwordType === 'custom' ? '#FAF5FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: activationModal.passwordType === 'custom' ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: activationModal.passwordType === 'custom' ? '6px solid #7C3AED' : '2px solid #CBD5E1',
                          background: '#fff',
                          marginTop: 2,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '14px', color: activationModal.passwordType === 'custom' ? '#6D28D9' : '#1E293B', marginBottom: 3 }}>
                          Set Custom Initial Password
                        </strong>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', lineHeight: 1.45 }}>
                          Specify a custom password. The student will still be asked to set their permanent password upon logging in.
                        </p>

                        {activationModal.passwordType === 'custom' && (
                          <div style={{ marginTop: '12px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type={activationModal.showCustom ? 'text' : 'password'}
                              placeholder="Enter initial password (min 6 characters)"
                              value={activationModal.customPassword}
                              onChange={(e) =>
                                setActivationModal((prev) => ({ ...prev, customPassword: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '10px 40px 10px 12px',
                                fontSize: '13.5px',
                                borderRadius: '8px',
                                border: '1.5px solid #CBD5E1',
                                outline: 'none',
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setActivationModal((prev) => ({ ...prev, showCustom: !prev.showCustom }))
                              }
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#64748B',
                                cursor: 'pointer',
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              {activationModal.showCustom ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle Security Advisory */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#475569',
                    fontSize: '12.5px',
                    marginBottom: '24px',
                  }}
                >
                  <Info size={16} style={{ color: '#6366F1', flexShrink: 0 }} />
                  <span>
                    The temporary password will be presented clearly once after submission for secure delivery to the student.
                  </span>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    disabled={activationModal.submitting}
                    onClick={() => setActivationModal(null)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={activationModal.submitting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      color: '#fff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    {activationModal.submitting ? (
                      <>
                        <RefreshCw size={15} className="spin" />
                        <span>Processing…</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} />
                        <span>
                          {activationModal.mode === 'activate'
                            ? 'Activate & Generate Password'
                            : 'Reset Password & Update'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* State 2: One-Time Temporary Password Display Screen */
              <div style={{ padding: '26px' }}>
                {/* Temporary Password Highlight Box */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)',
                    border: '1.5px dashed #A78BFA',
                    borderRadius: '14px',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <span style={{ fontSize: '11.5px', color: '#6D28D9', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    One-Time Temporary Password
                  </span>
                  <div
                    style={{
                      fontSize: '26px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#4C1D95',
                      letterSpacing: '2.5px',
                      margin: '12px 0 14px',
                      userSelect: 'all',
                    }}
                  >
                    {activationModal.result.temp_password}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(activationModal.result.temp_password)}
                    style={{
                      background: activationModal.copied ? '#059669' : '#7C3AED',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(124, 58, 237, 0.2)',
                    }}
                  >
                    {activationModal.copied ? (
                      <>
                        <Check size={15} />
                        <span>Copied Password!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Complete Credentials Card */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    marginBottom: '20px',
                    fontSize: '13px',
                  }}
                >
                  <strong style={{ color: '#0F172A', display: 'block', marginBottom: '10px', fontSize: '13.5px', fontWeight: 700 }}>
                    📋 Login Credentials Package
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', color: '#475569', fontSize: '13px' }}>
                    <span>Student Name:</span>
                    <strong style={{ color: '#0F172A' }}>{activationModal.result.student.full_name}</strong>
                    <span>Student ID / Roll:</span>
                    <code style={{ background: '#EEF2FF', color: '#4338CA', padding: '2px 7px', borderRadius: '5px', fontWeight: 600, width: 'fit-content' }}>
                      {activationModal.result.student.roll_number}
                    </code>
                    <span>Temporary Password:</span>
                    <code style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: '5px', fontWeight: 600, width: 'fit-content' }}>
                      {activationModal.result.temp_password}
                    </code>
                    <span>Login URL:</span>
                    <a
                      href={`${window.location.origin}/student/login`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#7C3AED', textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {`${window.location.origin}/student/login`}
                    </a>
                  </div>

                  <div style={{ marginTop: '14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyAllCredentials(
                          activationModal.result.student.roll_number,
                          activationModal.result.temp_password,
                          activationModal.result.student.full_name
                        )
                      }
                      style={{
                        fontSize: '12.5px',
                        padding: '7px 14px',
                        borderRadius: '7px',
                        border: '1px solid #CBD5E1',
                        background: '#fff',
                        color: '#334155',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {activationModal.copiedAll ? (
                        <>
                          <Check size={14} color="#059669" />
                          <span style={{ color: '#059669' }}>Credentials Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Full Credentials Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Important Security Notice */}
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: '#92400E',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
                  <div>
                    <strong>One-Time Display Security Notice:</strong>
                    <div>
                      This temporary password will NOT be shown again once you close this window. Please copy or share it with the student now. Upon their first login, the student will be required to change it.
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    }}
                    onClick={() => {
                      setActivationModal(null);
                      loadStudents();
                    }}
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 7: Bulk Student Account Activation & Password Setup */}
      {bulkActivationModal && (
        <div className="modal-overlay" onClick={() => !bulkActivationModal.submitting && setBulkActivationModal(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 720,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '22px 26px 18px',
                borderBottom: '1px solid #F1F5F9',
                background: '#FAFAFD',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: bulkActivationModal.result
                      ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                      : 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
                    color: bulkActivationModal.result ? '#059669' : '#7C3AED',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: bulkActivationModal.result
                      ? '0 2px 6px rgba(16, 185, 129, 0.15)'
                      : '0 2px 6px rgba(124, 58, 237, 0.15)',
                  }}
                >
                  {bulkActivationModal.result ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#1E1B4B', fontWeight: 700, letterSpacing: '-0.3px' }}>
                    {bulkActivationModal.result
                      ? `Credentials Generated for ${bulkActivationModal.result.count} Students!`
                      : 'Bulk Student Activation & Password Setup'}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: 2 }}>
                    {bulkActivationModal.result
                      ? 'Download the CSV credentials spreadsheet or copy credentials below'
                      : 'Batch-generate secure login credentials for multiple students at once'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                disabled={bulkActivationModal.submitting}
                onClick={() => setBulkActivationModal(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  display: 'grid',
                  placeItems: 'center',
                  border: 'none',
                  background: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            {!bulkActivationModal.result ? (
              /* State 1: Configuration Form */
              <form onSubmit={handleExecuteBulkActivation} style={{ padding: '24px 26px' }}>
                {bulkActivationModal.error && (
                  <div className="alert-box error mb-3" style={{ padding: '10px 14px', fontSize: '13.5px', borderRadius: '10px' }}>
                    <AlertTriangle size={16} />
                    <span>{bulkActivationModal.error}</span>
                  </div>
                )}

                {/* Scope Selection */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px', display: 'block', marginBottom: '10px' }}>
                    1. Choose Target Student Scope
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: selectedStudentIds.length > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 12 }}>
                    <div
                      onClick={() => setBulkActivationModal((prev) => ({ ...prev, targetType: 'unactivated', error: '' }))}
                      style={{
                        padding: '14px 16px',
                        border: bulkActivationModal.targetType === 'unactivated' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                        borderRadius: '12px',
                        background: bulkActivationModal.targetType === 'unactivated' ? '#FAF5FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: bulkActivationModal.targetType === 'unactivated' ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: bulkActivationModal.targetType === 'unactivated' ? '5px solid #7C3AED' : '2px solid #CBD5E1',
                          background: '#fff',
                          marginTop: 2,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: bulkActivationModal.targetType === 'unactivated' ? '#6D28D9' : '#1E293B' }}>
                          ⏳ Unactivated Only
                        </strong>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: 2 }}>
                          Only students whose accounts are not yet active
                        </div>
                      </div>
                    </div>

                    {selectedStudentIds.length > 0 && (
                      <div
                        onClick={() => setBulkActivationModal((prev) => ({ ...prev, targetType: 'selected', error: '' }))}
                        style={{
                          padding: '14px 16px',
                          border: bulkActivationModal.targetType === 'selected' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                          borderRadius: '12px',
                          background: bulkActivationModal.targetType === 'selected' ? '#FAF5FF' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: bulkActivationModal.targetType === 'selected' ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: bulkActivationModal.targetType === 'selected' ? '5px solid #7C3AED' : '2px solid #CBD5E1',
                            background: '#fff',
                            marginTop: 2,
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                          }}
                        />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13.5px', color: bulkActivationModal.targetType === 'selected' ? '#6D28D9' : '#1E293B' }}>
                            ☑️ Selected ({selectedStudentIds.length})
                          </strong>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: 2 }}>
                            Only the students you checked in table
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => setBulkActivationModal((prev) => ({ ...prev, targetType: 'all', error: '' }))}
                      style={{
                        padding: '14px 16px',
                        border: bulkActivationModal.targetType === 'all' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                        borderRadius: '12px',
                        background: bulkActivationModal.targetType === 'all' ? '#FAF5FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: bulkActivationModal.targetType === 'all' ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: bulkActivationModal.targetType === 'all' ? '5px solid #7C3AED' : '2px solid #CBD5E1',
                          background: '#fff',
                          marginTop: 2,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: bulkActivationModal.targetType === 'all' ? '#6D28D9' : '#1E293B' }}>
                          👥 All Students
                        </strong>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: 2 }}>
                          Regenerate passwords for all cohort students
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope Filters (Optional refinement) */}
                {bulkActivationModal.targetType !== 'selected' && (
                  <div className="form-grid-2" style={{ marginBottom: '22px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Filter by Department (Optional)
                      </label>
                      <select
                        value={bulkActivationModal.deptFilter}
                        onChange={(e) => setBulkActivationModal((prev) => ({ ...prev, deptFilter: e.target.value }))}
                        style={{ borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '9px 12px', fontSize: '13px' }}
                      >
                        <option value="">All Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Filter by Semester (Optional)
                      </label>
                      <select
                        value={bulkActivationModal.semFilter}
                        onChange={(e) => setBulkActivationModal((prev) => ({ ...prev, semFilter: e.target.value }))}
                        style={{ borderRadius: '8px', border: '1.5px solid #E2E8F0', padding: '9px 12px', fontSize: '13px' }}
                      >
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Password Generation Strategy */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px', display: 'block', marginBottom: '10px' }}>
                    2. Choose Password Generation Strategy
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                      onClick={() => setBulkActivationModal((prev) => ({ ...prev, passwordType: 'unique', error: '' }))}
                      style={{
                        padding: '15px 16px',
                        border: bulkActivationModal.passwordType === 'unique' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                        borderRadius: '12px',
                        background: bulkActivationModal.passwordType === 'unique' ? '#FAF5FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: bulkActivationModal.passwordType === 'unique' ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: bulkActivationModal.passwordType === 'unique' ? '5px solid #7C3AED' : '2px solid #CBD5E1',
                          background: '#fff',
                          marginTop: 2,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <strong style={{ fontSize: '13.5px', color: bulkActivationModal.passwordType === 'unique' ? '#6D28D9' : '#1E293B' }}>
                            ⚡ Unique Secure Password for Each Student
                          </strong>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#059669',
                              background: '#ECFDF5',
                              padding: '1px 7px',
                              borderRadius: '10px',
                            }}
                          >
                            Recommended
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.45 }}>
                          Every student receives their own individual encrypted temporary password (e.g. <code>Temp#k9W4mX!</code>). You can download the complete list as a CSV spreadsheet.
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setBulkActivationModal((prev) => ({ ...prev, passwordType: 'common', error: '' }))}
                      style={{
                        padding: '15px 16px',
                        border: bulkActivationModal.passwordType === 'common' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                        borderRadius: '12px',
                        background: bulkActivationModal.passwordType === 'common' ? '#FAF5FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: bulkActivationModal.passwordType === 'common' ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: bulkActivationModal.passwordType === 'common' ? '5px solid #7C3AED' : '2px solid #CBD5E1',
                          background: '#fff',
                          marginTop: 2,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '13.5px', color: bulkActivationModal.passwordType === 'common' ? '#6D28D9' : '#1E293B', marginBottom: 2 }}>
                          ✍️ Set Same Temporary Password for All Students
                        </strong>
                        <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.45 }}>
                          All selected students share this initial temporary password and will be forced to change it on their first login.
                        </div>

                        {bulkActivationModal.passwordType === 'common' && (
                          <div style={{ marginTop: '12px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type={bulkActivationModal.showCommon ? 'text' : 'password'}
                              placeholder="Enter common temporary password (min 6 characters)"
                              value={bulkActivationModal.commonPassword}
                              onChange={(e) => setBulkActivationModal((prev) => ({ ...prev, commonPassword: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '10px 40px 10px 12px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: '1.5px solid #CBD5E1',
                                outline: 'none',
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setBulkActivationModal((prev) => ({ ...prev, showCommon: !prev.showCommon }))}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#64748B',
                                cursor: 'pointer',
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              {bulkActivationModal.showCommon ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle Advisory */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#475569',
                    fontSize: '12.5px',
                    marginBottom: '24px',
                  }}
                >
                  <Info size={16} style={{ color: '#6366F1', flexShrink: 0 }} />
                  <span>
                    <strong>Instant Export Ready:</strong> After generating, you will be able to download a complete CSV spreadsheet with Student Name, Roll Number, and Temporary Password with one click.
                  </span>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    disabled={bulkActivationModal.submitting}
                    onClick={() => setBulkActivationModal(null)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bulkActivationModal.submitting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      color: '#fff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    {bulkActivationModal.submitting ? (
                      <>
                        <RefreshCw size={15} className="spin" />
                        <span>Generating Passwords…</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={15} />
                        <span>Generate Passwords for All Students</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* State 2: Results, CSV Export, and Credentials Preview */
              <div className="modal-body p-4">
                {/* Major Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => downloadCredentialsCSV(bulkActivationModal.result.credentials)}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={18} />
                    <span>📥 Download Credentials CSV</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => copyAllBulkCredentialsText(bulkActivationModal.result.credentials)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {bulkActivationModal.copiedAll ? (
                      <>
                        <Check size={18} color="#059669" />
                        <span style={{ color: '#059669' }}>✓ All Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>📋 Copy All as Formatted Text</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Filter / Search Preview */}
                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--deep-violet-ink)' }}>
                    Generated Passwords List ({bulkActivationModal.result.credentials.length} Students)
                  </strong>
                  <input
                    type="text"
                    placeholder="Search in generated list…"
                    value={bulkActivationModal.searchQuery}
                    onChange={(e) => setBulkActivationModal((prev) => ({ ...prev, searchQuery: e.target.value }))}
                    style={{ fontSize: '12.5px', padding: '4px 10px', width: 220, borderRadius: 6 }}
                  />
                </div>

                {/* Scrollable Preview Table */}
                <div
                  style={{
                    maxHeight: 260,
                    overflowY: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Student Name</th>
                        <th style={{ padding: '8px 12px' }}>Roll / Student ID</th>
                        <th style={{ padding: '8px 12px' }}>Dept & Sem</th>
                        <th style={{ padding: '8px 12px' }}>Temporary Password</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkActivationModal.result.credentials
                        .filter((st) => {
                          const q = (bulkActivationModal.searchQuery || '').toLowerCase();
                          return !q || st.full_name?.toLowerCase().includes(q) || st.roll_number?.toLowerCase().includes(q);
                        })
                        .map((st) => (
                          <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{st.full_name}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <code style={{ background: '#EDE9FE', color: '#6D28D9', padding: '1px 5px', borderRadius: 4 }}>
                                {st.roll_number}
                              </code>
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--slate-blue)' }}>
                              {st.department} • Sem {st.semester}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <code style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace' }}>
                                {st.temp_password}
                              </code>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(st.temp_password);
                                  setBulkActivationModal((prev) => ({ ...prev, copiedId: st.id }));
                                  setTimeout(() => setBulkActivationModal((prev) => ({ ...prev, copiedId: null })), 1500);
                                }}
                                style={{
                                  background: bulkActivationModal.copiedId === st.id ? '#10B981' : '#F5F3FF',
                                  color: bulkActivationModal.copiedId === st.id ? '#fff' : '#6D28D9',
                                  border: '1px solid #DDD6FE',
                                  borderRadius: 4,
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                {bulkActivationModal.copiedId === st.id ? '✓ Copied' : 'Copy'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Important Security Notice */}
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: '#92400E',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                  }}
                >
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
                  <div>
                    <strong>Mandatory First-Time Password Reset:</strong>
                    <div>
                      All students will be required to change these temporary passwords upon logging into the Student Portal. Make sure to download the CSV before closing this dialog.
                    </div>
                  </div>
                </div>

                <div className="modal-actions-row mt-4">
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setBulkActivationModal(null);
                      setSelectedStudentIds([]);
                      loadStudents();
                    }}
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

