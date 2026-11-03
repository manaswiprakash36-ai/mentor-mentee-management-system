import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  User,
  Award,
  AlertCircle,
  LogOut,
  X,
  BookOpen,
  Settings,
  Megaphone,
} from 'lucide-react';

export default function StudentSidebar({ mobileOpen, onCloseMobile }) {
  const { student, logout } = useAuth();
  const navigate = useNavigate();

  const studentNavItems = [
    { to: '/student/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'My Profile & Dossier', icon: User },
    { to: '/student/results', label: 'Academic Results', icon: Award },
    { to: '/student/issues', label: 'Mentoring & Concerns', icon: AlertCircle },
    { to: '/student/announcements', label: 'Circulars & Notices', icon: Megaphone },
  ];

  function handleLogout() {
    logout('student');
    navigate('/student/login', { replace: true });
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`portal-sidebar student-sidebar-theme ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon student-brand-bubble">
            <GraduationCap size={22} />
          </div>
          <div className="sidebar-brand-text">
            <h2>STUDENT</h2>
            <span>MENTEE PORTAL</span>
          </div>
          {mobileOpen && (
            <button className="sidebar-close-btn" onClick={onCloseMobile}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-wrap">
          <div className="sidebar-label">MY ACADEMICS</div>
          <nav className="sidebar-nav">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link student-nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={onCloseMobile}
                >
                  <Icon size={19} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="sidebar-label sidebar-label-sec">ACCOUNT</div>
          <nav className="sidebar-nav">
            <NavLink
              to="/student/settings"
              className={({ isActive }) =>
                `sidebar-link student-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onCloseMobile}
            >
              <Settings size={19} className="nav-icon" />
              <span>Account Settings</span>
            </NavLink>

            <button className="sidebar-link logout-btn" onClick={handleLogout}>
              <LogOut size={19} className="nav-icon" />
              <span>Student Logout</span>
            </button>
          </nav>
        </div>

        {/* Student Profile Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-mentor-card student-footer-card">
            <div className="sidebar-avatar student-avatar-badge">
              {(student?.full_name || 'ST')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="sidebar-mentor-info">
              <strong>{student?.full_name || 'Enrolled Mentee'}</strong>
              <span>Roll: {student?.roll_number || 'DEMO001'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

