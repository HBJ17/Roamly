import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const PATHS = { user: '/account/notifications', agency: '/agency/notifications', admin: '/admin' };

export default function NotificationBell() {
  const { role } = useAuth();
  const { unread } = useNotifications();
  return (
    <Link to={PATHS[role] || '/'} className="nav-link bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
      <Bell size={14} />
      {unread > 0 && <span className="bell-dot">{unread > 9 ? '9+' : unread}</span>}
    </Link>
  );
}
