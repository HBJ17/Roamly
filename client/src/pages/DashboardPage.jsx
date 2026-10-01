import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { User, Wallet, Coins, Calendar, MapPin, XCircle, Map, CheckCircle2, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const { formatCurrency } = useApp();

  const [bookings, setBookings] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'itineraries', 'profile'

  // Profile preferences
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [travelMode, setTravelMode] = useState(user?.preferences?.preferredTravelMode || 'Train');
  const [dietary, setDietary] = useState(user?.preferences?.dietaryPreference || 'Vegetarian');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [bRes, iRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/itinerary')
      ]);
      if (bRes.data.success) setBookings(bRes.data.data);
      if (iRes.data.success) setItineraries(iRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.put(`/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        setBookings(bookings.map((b) => (b._id === bookingId ? res.data.data : b)));
        alert('Booking cancelled and refund initiated.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/updatedetails', {
        fullName,
        phone,
        address,
        preferences: {
          preferredTravelMode: travelMode,
          dietaryPreference: dietary
        }
      });
      if (res.data.success) {
        updateUser(res.data.user);
        alert('Profile and preferences updated!');
      }
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="main-container">
      {/* Explorer User Header Card */}
      <div className="dashboard-user-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge badge-yellow" style={{ marginBottom: '6px' }}>EXPLORER DESK</span>
            <h2 style={{ fontSize: '26px' }}>Welcome back, {user?.fullName || user?.username}!</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()} • {user?.email}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="card" style={{ padding: '10px 18px', background: 'var(--pastel-yellow-light)' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>LOYALTY COINS</div>
              <div style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Coins size={18} color="#d97706" /> {user?.loyaltyPoints || 0} PTS
              </div>
            </div>

            <div className="card" style={{ padding: '10px 18px', background: 'var(--pastel-mint-light)' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>WALLET CREDITS</div>
              <div style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wallet size={18} color="#059669" /> {formatCurrency(user?.walletBalance || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`btn ${activeTab === 'bookings' ? 'btn-yellow' : 'btn-outline'}`}
        >
          📅 My Bookings ({bookings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('itineraries')}
          className={`btn ${activeTab === 'itineraries' ? 'btn-yellow' : 'btn-outline'}`}
        >
          🗺️ Custom Itineraries ({itineraries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`btn ${activeTab === 'profile' ? 'btn-yellow' : 'btn-outline'}`}
        >
          ⚙️ Profile & Preferences
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="badge badge-yellow">Loading Dashboard Data...</div>
        </div>
      ) : activeTab === 'bookings' ? (
        <div>
          {bookings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <h3>No Expedition Bookings Yet</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 18px' }}>
                Explore hand-crafted holiday packages and confirmed stays.
              </p>
              <Link to="/packages" className="btn btn-primary">
                Explore Packages →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookings.map((b) => {
                const item = b.package || b.hotel || b.transport;
                return (
                  <div key={b._id} className="boarding-card">
                    <div className="boarding-card-header">
                      <div>
                        <span className="badge badge-yellow" style={{ marginRight: '8px' }}>
                          {b.bookingType.toUpperCase()} TICKET
                        </span>
                        <strong>#{b._id.slice(-6)}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`badge ${b.status === 'Confirmed' ? 'badge-mint' : 'badge-pink'}`}>
                          {b.status}
                        </span>
                        <span className="badge badge-neutral">Paid: {formatCurrency(b.totalPrice)}</span>
                      </div>
                    </div>

                    <div className="boarding-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>
                          {item?.title || item?.name || 'Custom Caravan'}
                        </h3>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          📅 Travel Date: <strong>{b.travelDate}</strong> {b.checkOutDate && `to ${b.checkOutDate}`} • 👥 {b.numTravelers} Travelers
                        </div>
                        {b.discountCode && (
                          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                            ✓ Promo Code Applied: {b.discountCode} (-{formatCurrency(b.discountAmount)})
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {b.status === 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b._id)}
                            className="btn btn-sm btn-outline"
                            style={{ color: '#dc2626' }}
                          >
                            Cancel Ticket
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => alert(`Invoice #${b._id.slice(-6)}: Total ${formatCurrency(b.totalPrice)} paid via Card/UPI.`)}
                          className="btn btn-sm btn-yellow"
                        >
                          Invoice Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'itineraries' ? (
        <div>
          {itineraries.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <h3>No Custom Itineraries Saved</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 18px' }}>
                Use our Day-by-Day planner to architect your personalized trip.
              </p>
              <Link to="/itinerary" className="btn btn-primary">
                Launch Trip Builder →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {itineraries.map((it) => (
                <div key={it._id} className="card" style={{ background: 'var(--pastel-yellow-light)' }}>
                  <span className="badge badge-mint" style={{ marginBottom: '8px' }}>
                    {it.daysCount} DAYS TRIP
                  </span>
                  <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>{it.title}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    📍 {it.destination} • 📅 {it.startDate}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>
                    Est. Cost: {formatCurrency(it.totalEstimatedCost)}
                  </div>
                  <Link to="/itinerary" className="btn btn-sm btn-primary">
                    Edit & Build →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ maxWidth: '640px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Explorer Profile & Travel Preferences</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-control"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Preferred Travel Mode</label>
                <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)} className="form-control">
                  <option value="Train">Train</option>
                  <option value="Private Car">Private Car / SUV</option>
                  <option value="Flight">Flight</option>
                  <option value="Bus">Luxury Bus</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Dietary Preference</label>
                <select value={dietary} onChange={(e) => setDietary(e.target.value)} className="form-control">
                  <option value="Vegetarian">Pure Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ marginTop: '10px' }}>
              {savingProfile ? 'Saving...' : 'Update Preferences'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
