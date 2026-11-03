import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import Topbar from '../Topbar';

export default function AdminLayout() {
  const { admin, isAdminAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-spinner" />
        <p>Verifying Administrator Authorization…</p>
      </div>
    );
  }

  if (!isAdminAuthenticated && !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="portal-layout admin-portal-wrapper">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="portal-main-wrapper">
        <Topbar
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          pageTitle="Institutional Administration"
        />
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

