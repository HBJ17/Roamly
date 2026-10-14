import React from 'react';
import { LayoutDashboard, Ticket, Map, Wallet, Heart, MessageCircle, Bell, Star, User } from 'lucide-react';
import PortalLayout from '../../components/portal/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';

export default function AccountLayout() {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const { t } = useApp();
  const items = [
    { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/account/bookings', label: t('bookings'), icon: Ticket },
    { to: '/account/trips', label: t('trips'), icon: Map },
    { to: '/account/wallet', label: t('wallet'), icon: Wallet },
    { to: '/account/saved', label: t('saved'), icon: Heart },
    { to: '/account/messages', label: t('messages'), icon: MessageCircle },
    { to: '/account/notifications', label: t('notifications'), icon: Bell, count: unread },
    { to: '/account/reviews', label: t('reviews'), icon: Star },
    { to: '/account/profile', label: t('profile'), icon: User }
  ];
  return (
    <PortalLayout
      title="My account"
      items={items}
      header={<h1 style={{ fontSize: 26, marginBottom: 18 }}>Hi, {user.name.split(' ')[0]}</h1>}
    />
  );
}
