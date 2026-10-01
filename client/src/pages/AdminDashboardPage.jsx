import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Shield, Users, Building, DollarSign, Activity, FileText, CheckCircle, Ban } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { formatCurrency } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'agencies', 'bookings', 'logs'
  const [agenciesList, setAgenciesList] = useState([]);
  const [globalBookings, setGlobalBookings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, agRes, bRes, lRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/agencies'),
        api.get('/admin/bookings'),
        api.get('/admin/audit-logs')
      ]);

      if (dashRes.data.success) setData(dashRes.data);
      if (agRes.data.success) setAgenciesList(agRes.data.data);
      if (bRes.data.success) setGlobalBookings(bRes.data.data);
      if (lRes.data.success) setAuditLogs(lRes.data.data);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleAgencyStatus = async (agencyId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await api.put(`/admin/agencies/${agencyId}/status`, { status: newStatus });
      if (res.data.success) {
        setAgenciesList(agenciesList.map((a) => (a._id === agencyId ? res.data.data : a)));
        alert(`Agency status updated to ${newStatus}`);
      }
    } catch (err) {
      alert('Failed to update agency status');
    }
  };

  if (loading) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="badge badge-peach">Loading Central Control Console...</div>
      </div>
    );
  }

  const { stats } = data || {};

  return (
    <div className="main-container">
      {/* Admin Header */}
      <div className="travel-hero" style={{ background: 'var(--pastel-peach-light)', marginBottom: '24px' }}>
        <span className="badge badge-peach" style={{ marginBottom: '6px' }}>
          <Shield size={13} /> CENTRAL CONTROL CONSOLE
        </span>
        <h2 style={{ fontSize: '26px' }}>Platform Governance & Global Financial Ledger</h2>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Logged in as Super Admin: <strong>{user?.username}</strong>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="overview-grid">
        <div className="stat-card" style={{ background: 'var(--pastel-peach-light)' }}>
          <div className="stat-card-label">PLATFORM 10% COMMISSIONS</div>
          <div className="stat-card-val">{formatCurrency(stats?.platformCommission || 0)}</div>
          <div className="stat-card-change">Net Roamly Revenue</div>
        </div>

        <div className="stat-card" style={{ background: 'var(--pastel-mint-light)' }}>
          <div className="stat-card-label">TOTAL PLATFORM GMV</div>
          <div className="stat-card-val">{formatCurrency(stats?.totalPlatformGMV || 0)}</div>
          <div className="stat-card-change">From {stats?.bookingCount || 0} total bookings</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">REGISTERED AGENCIES</div>
          <div className="stat-card-val">{stats?.agencyCount || 0}</div>
          <div className="stat-card-change">Tour, Hotel & Cab partners</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">EXPLORER TRAVELERS</div>
          <div className="stat-card-val">{stats?.userCount || 0}</div>
          <div className="stat-card-change">Registered user accounts</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`btn ${activeTab === 'overview' ? 'btn-peach' : 'btn-outline'}`}
        >
          📊 Dashboard Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agencies')}
          className={`btn ${activeTab === 'agencies' ? 'btn-peach' : 'btn-outline'}`}
        >
          🏢 Agencies Management ({agenciesList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`btn ${activeTab === 'bookings' ? 'btn-peach' : 'btn-outline'}`}
        >
          📒 Global Bookings Ledger ({globalBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`btn ${activeTab === 'logs' ? 'btn-peach' : 'btn-outline'}`}
        >
          🛡️ System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Recent Global Bookings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {globalBookings.slice(0, 6).map((b) => (
                <div key={b._id} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>
                      {b.user?.fullName || b.user?.username} → {b.package?.title || 'Custom Tour'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Date: {b.travelDate} • {b.paymentStatus}
                    </div>
                  </div>
                  <strong style={{ fontSize: '15px' }}>{formatCurrency(b.totalPrice)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Partner Agencies Directory</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agenciesList.slice(0, 6).map((a) => (
                <div key={a._id} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{a.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {a.agencyType} • {a.email}
                    </div>
                  </div>
                  <span className={`badge ${a.status === 'Active' ? 'badge-mint' : 'badge-pink'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agencies' && (
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <table className="table-executive">
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Wallet Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agenciesList.map((a) => (
                <tr key={a._id}>
                  <td><strong>{a.name}</strong></td>
                  <td><span className="badge badge-yellow">{a.agencyType}</span></td>
                  <td>
                    <div>{a.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.phone}</div>
                  </td>
                  <td>
                    <span className={`badge ${a.status === 'Active' ? 'badge-mint' : 'badge-pink'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: '800' }}>{formatCurrency(a.wallet?.balance || 0)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleAgencyStatus(a._id, a.status)}
                      className={`btn btn-sm ${a.status === 'Active' ? 'btn-outline' : 'btn-mint'}`}
                    >
                      {a.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <table className="table-executive">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Customer</th>
                <th>Type / Tour</th>
                <th>Travel Date</th>
                <th>Status</th>
                <th>Total Paid</th>
                <th>Platform 10%</th>
              </tr>
            </thead>
            <tbody>
              {globalBookings.map((b) => (
                <tr key={b._id}>
                  <td><code>#{b._id.slice(-6)}</code></td>
                  <td>
                    <div><strong>{b.user?.fullName || b.user?.username}</strong></div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                  </td>
                  <td>{b.package?.title || b.hotel?.name || b.transport?.title || 'Custom Tour'}</td>
                  <td>{b.travelDate}</td>
                  <td>
                    <span className={`badge ${b.status === 'Confirmed' ? 'badge-mint' : 'badge-pink'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: '800' }}>{formatCurrency(b.totalPrice)}</td>
                  <td style={{ fontWeight: '800', color: '#059669' }}>
                    +{formatCurrency(Math.round(b.totalPrice * 0.10))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <table className="table-executive">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((l) => (
                <tr key={l._id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      {l.action}
                    </span>
                  </td>
                  <td><strong>{l.actorName}</strong> ({l.actorType})</td>
                  <td>{l.targetEntity} {l.targetId && `#${l.targetId.slice(-6)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
