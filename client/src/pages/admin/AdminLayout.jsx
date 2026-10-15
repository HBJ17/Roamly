import React from 'react';
import { LayoutDashboard, Building2, Users, List, Ticket, MapPin, Tag, Landmark, Star, Settings, ScrollText } from 'lucide-react';
import PortalLayout from '../../components/portal/PortalLayout';

const ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/agencies', label: 'Partners', icon: Building2 },
  { to: '/admin/users', label: 'Travellers', icon: Users },
  { to: '/admin/listings', label: 'Listings', icon: List },
  { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { to: '/admin/destinations', label: 'Destinations', icon: MapPin },
  { to: '/admin/coupons', label: 'Promo codes', icon: Tag },
  { to: '/admin/payouts', label: 'Payouts', icon: Landmark },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/audit', label: 'Audit trail', icon: ScrollText }
];

export default function AdminLayout() {
  return <PortalLayout title="Admin console" items={ITEMS} header={<h1 style={{ fontSize: 24, marginBottom: 18 }}>Roamly admin console</h1>} />;
}
