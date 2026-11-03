import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  Bell,
  CheckCircle2,
  Clock,
  User,
  Award,
  AlertCircle,
  Check,
} from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await apiRequest('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkRead(id, linkUrl) {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (linkUrl) {
        navigate(linkUrl);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      alert('Could not mark all as read');
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notifications-page">
      <div className="page-header-row">
        <div>
          <h2>System Notifications & Alerts</h2>
          <p>Real-time log of student registrations, achievement uploads, and reported concerns.</p>
        </div>

        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={handleMarkAllRead}>
            <Check size={16} />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      <div className="panel-card mt-4">
        {loading ? (
          <div className="p-5 text-center">
            <div className="portal-spinner inline-spinner" />
            <p>Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-table-state p-5">
            <div className="empty-icon-wrap">🔔</div>
            <strong>No notifications yet</strong>
            <p>You are all caught up! New student submissions or alerts will appear here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item-row ${n.is_read ? 'read' : 'unread'}`}
                onClick={() => handleMarkRead(n.id, n.link_url)}
              >
                <div className="notif-icon-col">
                  {n.type === 'submission' ? (
                    <div className="notif-avatar teal"><User size={18} /></div>
                  ) : n.type === 'achievement' ? (
                    <div className="notif-avatar purple"><Award size={18} /></div>
                  ) : n.type === 'issue' ? (
                    <div className="notif-avatar red"><AlertCircle size={18} /></div>
                  ) : (
                    <div className="notif-avatar blue"><Bell size={18} /></div>
                  )}
                </div>

                <div className="notif-content-col">
                  <div className="notif-row-top">
                    <strong>{n.title}</strong>
                    <span className="notif-timestamp">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p>{n.message}</p>
                </div>

                {!n.is_read && (
                  <div className="unread-dot-indicator" title="Unread alert" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

