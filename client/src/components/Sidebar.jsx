import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  FileBarChart2,
  Bell,
  User,
  Settings,
  LogOut,
  X,
  Sparkles,
  Shield,
  LayoutGrid,
  GraduationCap,
  Network,
  Megaphone,
  FileSpreadsheet,
  Award,
} from 'lucide-react';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { mentor, logout } = useAuth();

  const workspaceItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/mentees', label: 'My Mentees', icon: Users },
    { to: '/issues', label: 'Issues & Concerns', icon: AlertCircle },
    { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  ];

  const coordinatorItems = [
    { to: '/class/overview', label: 'Class Overview', icon: LayoutGrid },
    { to: '/class/students', label: 'All Class Students', icon: GraduationCap },
    { to: '/class/mentors', label: 'Mentor Allocation', icon: Network },
    { to: '/class/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/class/reports', label: 'Class Reports', icon: FileSpreadsheet },
  ];

  const accountItems = [
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`portal-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <span>M</span>
          </div>
          <div className="sidebar-brand-text">
            <h2>MENTOR</h2>
            <span>MENTORING SYSTEM</span>
          </div>
          {mobileOpen && (
            <button className="sidebar-close-btn" onClick={onCloseMobile}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Coordinator Role Indicator Ribbon */}
        {mentor?.isCoordinator && (
          <div className="coordinator-role-ribbon">
            <Award size={14} className="coordinator-ribbon-icon" />
            <div className="coordinator-ribbon-text">
              <strong>Class Coordinator</strong>
              <span>Dual Responsibility</span>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="sidebar-nav-wrap">
          <div className="sidebar-label">MENTOR WORKSPACE</div>
          <nav className="sidebar-nav">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onCloseMobile}
                >
                  <Icon size={19} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Dynamic Coordinator Section (Only for Coordinator Mentors) */}
          {mentor?.isCoordinator && (
            <>
              <div className="sidebar-label sidebar-label-sec coordinator-section-label">
                <span className="coordinator-label-tag">CLASS COORDINATION</span>
              </div>
              <nav className="sidebar-nav">
                {coordinatorItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `sidebar-link coordinator-link ${isActive ? 'active' : ''}`
                      }
                      onClick={onCloseMobile}
                    >
                      <Icon size={19} className="nav-icon" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </>
          )}

          <div className="sidebar-label sidebar-label-sec">ACCOUNT & SUPPORT</div>
          <nav className="sidebar-nav">
            {accountItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onCloseMobile}
                >
                  <Icon size={19} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <button className="sidebar-link logout-btn" onClick={logout}>
              <LogOut size={19} className="nav-icon" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Mentor Profile Footer (Interactive Profile Card) */}
        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `sidebar-mentor-card ${isActive ? 'active-profile' : ''}`
            }
            title="View & Edit Faculty Profile"
            onClick={onCloseMobile}
          >
            <div className="sidebar-avatar">
              {mentor?.avatar_url ? (
                <img src={mentor.avatar_url} alt={mentor.full_name} className="sidebar-avatar-img" />
              ) : (
                (mentor?.full_name || 'MP')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
              )}
            </div>
            <div className="sidebar-mentor-info">
              <strong>{mentor?.full_name || 'Manaswi Prakash'}</strong>
              <span>
                {mentor?.isCoordinator ? 'Mentor & Class Coordinator' : (mentor?.designation || 'Academic Mentor')}
              </span>
            </div>
            <div className="sidebar-profile-action-badge" title="Profile Details">
              <Sparkles size={14} />
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

