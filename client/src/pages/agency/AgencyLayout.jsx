import React from 'react';
import { LayoutDashboard, List, CalendarCheck, QrCode, Star, MessageCircle, Wallet, Bell, Building2 } from 'lucide-react';
import PortalLayout from '../../components/portal/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/ui';

const LISTING_LABEL = { 'Hotel Partner': 'Hotels', 'Cab Operator': 'Cabs', 'Intercity Transit': 'Routes', 'Tour Operator': 'Packages' };

export default function AgencyLayout() {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const items = [
    { to: '/agency', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/agency/listings', label: LISTING_LABEL[user.agencyType] || 'Listings', icon: List },
    { to: '/agency/bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/agency/check-in', label: 'Check-in', icon: QrCode },
    { to: '/agency/reviews', label: 'Reviews', icon: Star },
    { to: '/agency/messages', label: 'Messages', icon: MessageCircle },
    { to: '/agency/payouts', label: 'Earnings & payouts', icon: Wallet },
    { to: '/agency/notifications', label: 'Notifications', icon: Bell, count: unread },
    { to: '/agency/profile', label: 'Business profile', icon: Building2 }
  ];
  return (
    <PortalLayout
      title="Partner portal"
      items={items}
      header={(
        <div className="row-between" style={{ marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 24 }}>{user.name}</h1>
            <p className="small muted">{user.agencyType}{user.cityName ? ` · ${user.cityName}` : ' · intercity'}</p>
          </div>
          <StatusBadge status={user.agencyStatus} />
        </div>
      )}
    />
  );
}
