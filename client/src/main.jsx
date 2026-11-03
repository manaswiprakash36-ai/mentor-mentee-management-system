import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';

// ── 1. Mentor Portal Imports (Existing) ──
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mentees from './pages/Mentees';
import MenteeDetail from './pages/MenteeDetail';
import GenerateLink from './pages/GenerateLink';
import AchievementsResults from './pages/AchievementsResults';
import Issues from './pages/Issues';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// ── 2. Admin Portal Imports ──
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// ── 2b. Class Coordinator Imports (Inside Mentor Portal) ──
import ClassOverview from './pages/coordinator/ClassOverview';
import ClassStudents from './pages/coordinator/ClassStudents';
import ClassMentors from './pages/coordinator/ClassMentors';
import ClassAnnouncements from './pages/coordinator/ClassAnnouncements';
import ClassReports from './pages/coordinator/ClassReports';

// ── 3. Student Portal Imports ──
import StudentLayout from './components/student/StudentLayout';
import StudentLogin from './pages/student/StudentLogin';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentResults from './pages/student/StudentResults';
import StudentIssues from './pages/student/StudentIssues';
import StudentAnnouncements from './pages/student/StudentAnnouncements';
import StudentSettings from './pages/student/StudentSettings';

// ── 4. Public Mentee Form Route ──
import PublicMenteeForm from './pages/PublicMenteeForm';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ══════════════════════════════════════════════════
              PUBLIC REGISTRATION FORM ROUTES
              ══════════════════════════════════════════════════ */}
          <Route path="/mentee-form/:token" element={<PublicMenteeForm />} />
          <Route path="/form/:token" element={<PublicMenteeForm />} />
          <Route path="/form" element={<PublicMenteeForm />} />

          {/* ══════════════════════════════════════════════════
              PORTAL 1: COLLEGE ADMIN PORTAL (Separate Login & Layout)
              ══════════════════════════════════════════════════ */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard defaultTab="overview" />} />
            <Route path="/admin/mentors" element={<AdminDashboard defaultTab="mentors" />} />
            <Route path="/admin/students" element={<AdminDashboard defaultTab="students" />} />
            <Route path="/admin/allocation" element={<AdminDashboard defaultTab="allocation" />} />
            <Route path="/admin/coordinators" element={<AdminDashboard defaultTab="coordinators" />} />
          </Route>

          {/* ══════════════════════════════════════════════════
              PORTAL 2: FACULTY MENTOR PORTAL (Existing Portal)
              ══════════════════════════════════════════════════ */}
          <Route path="/login" element={<Login />} />
          <Route path="/mentor/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mentees" element={<Mentees />} />
            <Route path="/mentees/:id" element={<MenteeDetail />} />
            <Route path="/generate-link" element={<GenerateLink />} />
            <Route path="/achievements-results" element={<AchievementsResults />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Class Coordinator Extended Routes (For Mentors with Coordinator Designation) */}
            <Route path="/class/overview" element={<ClassOverview />} />
            <Route path="/class/students" element={<ClassStudents />} />
            <Route path="/class/mentors" element={<ClassMentors />} />
            <Route path="/class/announcements" element={<ClassAnnouncements />} />
            <Route path="/class/reports" element={<ClassReports />} />
          </Route>

          {/* ══════════════════════════════════════════════════
              PORTAL 3: STUDENT / MENTEE PORTAL (Separate Login & Layout)
              ══════════════════════════════════════════════════ */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route element={<StudentLayout />}>
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/student/issues" element={<StudentIssues />} />
            <Route path="/student/announcements" element={<StudentAnnouncements />} />
            <Route path="/student/settings" element={<StudentSettings />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
