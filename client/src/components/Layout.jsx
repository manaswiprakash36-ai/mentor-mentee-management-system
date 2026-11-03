import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-spinner" />
        <p>Loading Mentora Portal…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Derive friendly page title from path
  const titles = {
    '/dashboard': 'Dashboard Overview',
    '/mentees': 'My Mentees Directory',
    '/generate-link': 'Generate Form Link',
    '/achievements-results': 'Achievements & Results',
    '/issues': 'Issues & Concerns',
    '/reports': 'Reports & Analytics',
    '/notifications': 'Notifications',
    '/profile': 'Mentor Profile',
    '/settings': 'System Settings',
  };

  const currentPath = location.pathname;
  let pageTitle = titles[currentPath];
  if (!pageTitle && currentPath.startsWith('/mentees/')) {
    pageTitle = 'Mentee Profile Details';
  } else if (!pageTitle) {
    pageTitle = 'Mentoring Portal';
  }

  return (
    <div className="portal-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="portal-main-wrapper">
        <Topbar
          pageTitle={pageTitle}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

