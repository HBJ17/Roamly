import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Briefcase, Plus, DollarSign, Package, Hotel, Car, CheckCircle2, ArrowDownRight } from 'lucide-react';

export default function AgencyPortalPage() {
  const { user } = useAuth();
  const { formatCurrency } = useApp();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');

  // New package modal state
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [newPkg, setNewPkg] = useState({
    title: '',
    destination: '',
    category: 'Hill Station',
    price: 6000,
    durationDays: 3,
    durationNights: 2,
    description: '',
    highlights: '',
    includedAmenities: ''
  });

  const fetchAgencyData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agency/dashboard');
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error fetching agency data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencyData();
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return;

    setRequestingPayout(true);
    try {
      const res = await api.post('/agency/payout', { amount: Number(payoutAmount) });
      if (res.data.success) {
        setPayoutMessage(`✓ ${res.data.message}`);
        setPayoutAmount('');
        fetchAgencyData();
      }
    } catch (err) {
      setPayoutMessage(err.response?.data?.message || 'Payout request failed');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newPkg,
        price: Number(newPkg.price),
        durationDays: Number(newPkg.durationDays),
        durationNights: Number(newPkg.durationNights),
        highlights: newPkg.highlights.split(',').map((s) => s.trim()),
        includedAmenities: newPkg.includedAmenities.split(',').map((s) => s.trim())
      };

      const res = await api.post('/packages', payload);
      if (res.data.success) {
        alert('Package published successfully!');
        setShowAddPackage(false);
        fetchAgencyData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create package');
    }
  };

  if (loading) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="badge badge-yellow">Loading Partner Workspace...</div>
      </div>
    );
  }

  const { stats, agency, packages = [], recentBookings = [] } = dashboardData || {};

  return (
    <div className="main-container">
      {/* Header Card */}
      <div className="travel-hero" style={{ background: 'var(--pastel-blue-light)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '6px' }}>
              PARTNER DESK • {agency?.agencyType || 'Verified Partner'}
            </span>
            <h2 style={{ fontSize: '26px' }}>{agency?.name || user?.username}</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Status: <span className="badge badge-mint">{agency?.status || 'Active'}</span> • {agency?.email}
            </div>
          </div>

          <button onClick={() => setShowAddPackage(true)} className="btn btn-primary">
            <Plus size={15} /> + Add New Caravan Tour
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="overview-grid">
        <div className="stat-card" style={{ background: 'var(--pastel-yellow-light)' }}>
          <div className="stat-card-label">WALLET BALANCE</div>
          <div className="stat-card-val">{formatCurrency(agency?.wallet?.balance || 0)}</div>
          <div className="stat-card-change">Available for instant payout</div>
        </div>

        <div className="stat-card" style={{ background: 'var(--pastel-mint-light)' }}>
          <div className="stat-card-label">TOTAL GROSS REVENUE</div>
          <div className="stat-card-val">{formatCurrency(stats?.totalRevenue || 0)}</div>
          <div className="stat-card-change">From {stats?.bookingCount || 0} customer bookings</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">ACTIVE TOURS</div>
          <div className="stat-card-val">{stats?.packageCount || 0}</div>
          <div className="stat-card-change">Published on Roamly</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">BOOKINGS RECEIVED</div>
          <div className="stat-card-val">{stats?.bookingCount || 0}</div>
          <div className="stat-card-change">Lifetime orders</div>
        </div>
      </div>

      {/* Payout & Inventory Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', marginBottom: '30px' }}>
        
        {/* Left: Inventory List */}
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Your Published Inventory ({packages.length})</h3>
          {packages.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No tours added yet. Click "+ Add New Caravan Tour" above.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {packages.map((p) => (
                <div key={p._id} style={{ border: '1.5px solid #000', borderRadius: '8px', padding: '14px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{p.title}</h4>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      📍 {p.destination} • {p.durationDays}D/{p.durationNights}N • Rating: ⭐ {p.rating}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800' }}>{formatCurrency(p.price)}</div>
                    <span className="badge badge-mint" style={{ fontSize: '10px' }}>Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Request Payout */}
        <div className="card" style={{ background: 'var(--pastel-yellow-light)' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowDownRight size={18} /> Request Wallet Payout
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Transfers funds directly to your verified bank account.
          </p>

          {payoutMessage && (
            <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: payoutMessage.startsWith('✓') ? '#059669' : '#dc2626' }}>
              {payoutMessage}
            </div>
          )}

          <form onSubmit={handleRequestPayout}>
            <div className="form-group">
              <label className="form-label">Payout Amount (INR)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                max={agency?.wallet?.balance || 0}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                required
                className="form-control"
              />
            </div>
            <button
              type="submit"
              disabled={requestingPayout || (agency?.wallet?.balance || 0) <= 0}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {requestingPayout ? 'Submitting...' : 'Submit Payout Request'}
            </button>
          </form>
        </div>
      </div>

      {/* Add Package Modal */}
      {showAddPackage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Publish New Caravan Tour</h3>
            <form onSubmit={handleCreatePackage}>
              <div className="form-group">
                <label className="form-label">Tour Title</label>
                <input
                  type="text"
                  value={newPkg.title}
                  onChange={(e) => setNewPkg({ ...newPkg, title: e.target.value })}
                  required
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Destination</label>
                  <input
                    type="text"
                    value={newPkg.destination}
                    onChange={(e) => setNewPkg({ ...newPkg, destination: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={newPkg.category}
                    onChange={(e) => setNewPkg({ ...newPkg, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="Hill Station">Hill Station</option>
                    <option value="Heritage">Heritage</option>
                    <option value="Beach">Beach</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Price (INR)</label>
                  <input
                    type="number"
                    value={newPkg.price}
                    onChange={(e) => setNewPkg({ ...newPkg, price: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Days</label>
                  <input
                    type="number"
                    value={newPkg.durationDays}
                    onChange={(e) => setNewPkg({ ...newPkg, durationDays: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nights</label>
                  <input
                    type="number"
                    value={newPkg.durationNights}
                    onChange={(e) => setNewPkg({ ...newPkg, durationNights: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Highlights (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Shikara Ride, Pine Forest Trek, Sunset Point"
                  value={newPkg.highlights}
                  onChange={(e) => setNewPkg({ ...newPkg, highlights: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Included Amenities (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 3-Star Resort, Breakfast Buffet, Private Cab"
                  value={newPkg.includedAmenities}
                  onChange={(e) => setNewPkg({ ...newPkg, includedAmenities: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="3"
                  value={newPkg.description}
                  onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })}
                  required
                  className="form-control"
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddPackage(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Caravan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
