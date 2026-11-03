import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from './StudentSidebar';
import Topbar from '../Topbar';

export default function StudentLayout() {
  const { student, isStudentAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  let pageTitle = 'My Dashboard';
  if (location.pathname.includes('/student/profile')) pageTitle = 'My Profile & Dossier';
  else if (location.pathname.includes('/student/results')) pageTitle = 'Academic Results';
  else if (location.pathname.includes('/student/issues')) pageTitle = 'Mentoring & Concerns';
  else if (location.pathname.includes('/student/announcements')) pageTitle = 'Class Circulars & Notices';
  else if (location.pathname.includes('/student/settings')) pageTitle = 'Account Settings';

  if (loading) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-spinner" />
        <p>Loading Student Mentee Portal…</p>
      </div>
    );
  }

  if (!isStudentAuthenticated && !student) {
    return <Navigate to="/student/login" replace />;
  }

  return (
    <div className="portal-layout student-portal-wrapper">
      <StudentSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="portal-main-wrapper">
        <Topbar
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          pageTitle={pageTitle}
        />
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
