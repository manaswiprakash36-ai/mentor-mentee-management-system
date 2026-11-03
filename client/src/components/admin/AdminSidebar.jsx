import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  LogOut,
  X,
  Building,
  Award,
} from 'lucide-react';

export default function AdminSidebar({ mobileOpen, onCloseMobile }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Institutional Overview', icon: LayoutDashboard },
    { to: '/admin/mentors', label: 'Mentors Hub', icon: Users },
    { to: '/admin/students', label: 'All Students Roster', icon: GraduationCap },
    { to: '/admin/allocation', label: 'Bulk Mentor Assignment', icon: UserCheck },
    { to: '/admin/coordinators', label: 'Class Coordinators', icon: Award },
  ];

  function handleLogout() {
    logout('admin');
    navigate('/admin/login', { replace: true });
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`portal-sidebar admin-sidebar-theme ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon admin-brand-bubble">
            <Shield size={22} />
          </div>
          <div className="sidebar-brand-text">
            <h2>COLLEGE ADMIN</h2>
            <span>INSTITUTIONAL PORTAL</span>
          </div>
          {mobileOpen && (
            <button className="sidebar-close-btn" onClick={onCloseMobile}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-wrap">
          <div className="sidebar-label">GOVERNANCE & CONTROLS</div>
          <nav className="sidebar-nav">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link admin-nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={onCloseMobile}
                >
                  <Icon size={19} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="sidebar-label sidebar-label-sec">SESSION</div>
          <nav className="sidebar-nav">
            <button className="sidebar-link logout-btn" onClick={handleLogout}>
              <LogOut size={19} className="nav-icon" />
              <span>Admin Logout</span>
            </button>
          </nav>
        </div>

        {/* Admin Profile Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-mentor-card admin-footer-card">
            <div className="sidebar-avatar admin-avatar-badge">
              <Building size={18} />
            </div>
            <div className="sidebar-mentor-info">
              <strong>{admin?.full_name || 'College Administrator'}</strong>
              <span>{admin?.designation || 'Academic Affairs'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

