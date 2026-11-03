import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { Menu, Bell, User } from 'lucide-react';

export default function Topbar({ onToggleMobile, pageTitle = 'Dashboard' }) {
  const { mentor, admin, student } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only fetch mentor notifications if mentor is logged in
    if (!mentor) return;
    async function loadNotifications() {
      try {
        const notifs = await apiRequest('/notifications');
        const unread = notifs.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch {
        // silent fail
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [mentor]);

  // Derive role-specific display info based on current route and auth context
  let portalCategory = 'Faculty Portal';
  let displayName = 'Mentor';
  let displaySub = 'Faculty';
  let avatarUrl = null;
  let onProfileClick = () => navigate('/profile');

  const path = typeof window !== 'undefined' ? window.location.pathname : '';

  if (path.startsWith('/student') && student) {
    portalCategory = 'Student Portal';
    displayName = student.full_name?.split(' ')[0] || 'Student';
    displaySub = student.roll_number || 'Mentee';
    avatarUrl = student.photo_url || student.avatar_url;
    onProfileClick = () => navigate('/student/profile');
  } else if (path.startsWith('/admin') && admin) {
    portalCategory = 'College Admin';
    displayName = admin.full_name?.split(' ')[0] || 'Administrator';
    displaySub = admin.designation || 'Academic Affairs';
    avatarUrl = admin.avatar_url;
    onProfileClick = () => navigate('/admin/dashboard');
  } else if (admin) {
    portalCategory = 'College Admin';
    displayName = admin.full_name?.split(' ')[0] || 'Administrator';
    displaySub = admin.designation || 'Academic Affairs';
    avatarUrl = admin.avatar_url;
    onProfileClick = () => navigate('/admin/dashboard');
  } else if (student) {
    portalCategory = 'Student Portal';
    displayName = student.full_name?.split(' ')[0] || 'Student';
    displaySub = student.roll_number || 'Mentee';
    avatarUrl = student.photo_url || student.avatar_url;
    onProfileClick = () => navigate('/student/profile');
  } else if (mentor) {
    portalCategory = mentor.isCoordinator ? 'Faculty & Coordinator Portal' : 'Faculty Portal';
    displayName = mentor.full_name?.split(' ')[0] || 'Mentor';
    displaySub = mentor.isCoordinator ? 'Mentor & Coordinator' : (mentor.employee_id || 'Faculty');
    avatarUrl = mentor.avatar_url;
    onProfileClick = () => navigate('/profile');
  }

  return (
    <header className="portal-topbar">
      <div className="topbar-left">
        <button
          className="topbar-mobile-toggle"
          onClick={onToggleMobile}
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-breadcrumb">
          <span>{portalCategory}</span>
          <span className="breadcrumb-slash">/</span>
          <strong>{pageTitle}</strong>
        </div>
      </div>

      <div className="topbar-right">
        {mentor?.isCoordinator && (
          <div className="topbar-coordinator-tag" title="Designated Class Coordinator">
            <span>Class Coordinator</span>
          </div>
        )}

        <div className="topbar-badge">
          Academic Year <strong>2026–27</strong>
        </div>

        {mentor && (
          <button
            className="topbar-icon-btn"
            onClick={() => navigate('/notifications')}
            title="Notifications"
            aria-label="View Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        )}

        <div
          className="topbar-user-pill"
          onClick={onProfileClick}
          title="View Profile"
        >
          <div className="topbar-user-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="topbar-avatar-img" />
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="topbar-user-text">
            <strong>{displayName}</strong>
            <span>{displaySub}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

