import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { Compass, Search, Star, ShieldCheck, MapPin, Sparkles, ArrowRight, Hotel, Car, Check } from 'lucide-react';

export default function HomePage() {
  const { formatCurrency, toggleCompare, compareList } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get('/packages');
        if (res.data.success) {
          setFeaturedPackages(res.data.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Error fetching featured packages', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/packages?destination=${encodeURIComponent(searchTerm)}&category=${category}`);
  };

  return (
    <div className="main-container">
      {/* Hero Section */}
      <section className="travel-hero" style={{ background: 'var(--pastel-yellow-light)', textAlign: 'center', padding: '48px 24px 40px' }}>
        <div style={{ display: 'inline-block', marginBottom: '14px' }}>
          <span className="stamp-tag badge-mint" style={{ transform: 'rotate(-2deg)' }}>
            ★ HANDCRAFTED ITINERARIES & FLEETS
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', lineHeight: '1.15', marginBottom: '14px' }}>
          HAND-DRAWN TRAILS. <br />
          <span className="font-marker" style={{ color: '#000', textDecoration: 'underline wavy var(--pastel-peach)' }}>
            TIMELESS ADVENTURES.
          </span>
        </h1>
        <p style={{ margin: '0 auto 28px', maxWidth: '640px', fontSize: '16px' }}>
          Explore misty hill station trails, thousand-pillar heritage temples, and luxury coastal caravans curated by verified regional expedition partners.
        </p>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            background: '#fff',
            border: '3px solid #000',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '6px 6px 0 #000',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Where to wander? (e.g. Kodaikanal, Madurai...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', boxShadow: 'none', padding: '6px 0', fontSize: '15px' }}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              flex: '0 1 180px',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '8px 10px',
              fontWeight: '700',
              fontSize: '13px',
              boxShadow: '2px 2px 0 #000'
            }}
          >
            <option value="all">All Categories</option>
            <option value="Hill Station">Hill Stations ⛰️</option>
            <option value="Heritage">Heritage & Temples 🛕</option>
            <option value="Beach">Coastal & Beach 🌊</option>
            <option value="Cultural">Cultural & Urban 🌆</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
            <Search size={16} /> Explore
          </button>
        </form>
      </section>

      {/* Quick Category Badges */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '40px' }}>
        <Link to="/packages?category=Hill Station" className="badge badge-mint" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
          ⛰️ Hill Stations
        </Link>
        <Link to="/packages?category=Heritage" className="badge badge-peach" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
          🛕 Heritage & Temples
        </Link>
        <Link to="/packages?category=Beach" className="badge badge-blue" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
          🌊 Coastal Highway
        </Link>
        <Link to="/hotels" className="badge badge-yellow" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
          🏨 Boutique Hotels
        </Link>
        <Link to="/transports" className="badge badge-neutral" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
          🚗 Taxi & Cab Fleets
        </Link>
        <Link to="/itinerary" className="badge badge-pink" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
          🗺️ Custom Trip Builder
        </Link>
      </div>

      {/* Featured Packages Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <span className="badge badge-yellow" style={{ marginBottom: '6px' }}>CURATED EXPEDITIONS</span>
          <h2 style={{ fontSize: '26px' }}>FEATURED HOLIDAY CARAVANS</h2>
        </div>
        <Link to="/packages" className="btn btn-sm btn-outline" style={{ textDecoration: 'none' }}>
          View All Packages <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="badge badge-yellow">Loading Roamly Expeditions...</div>
        </div>
      ) : (
        <div className="packages-grid">
          {featuredPackages.map((pkg) => {
            const isCompared = compareList.some((p) => p._id === pkg._id);
            return (
              <div key={pkg._id} className="package-card">
                <div className="package-card-img-wrap">
                  <img src={pkg.imageUrl} alt={pkg.title} className="package-card-img" />
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span className="badge badge-yellow">{pkg.category}</span>
                  </div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className="rating-badge">
                      <Star size={13} fill="#000" color="#000" /> {pkg.rating}
                    </span>
                  </div>
                </div>

                <div className="package-card-body">
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                    📍 {pkg.destination} • {pkg.durationDays}D / {pkg.durationNights}N
                  </div>
                  <h3 className="package-card-title">{pkg.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flexGrow: 1, marginBottom: '14px', lineHeight: '1.5' }}>
                    {pkg.description.slice(0, 110)}...
                  </p>

                  <div style={{ borderTop: '1.5px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>PER TRAVELER</div>
                      <div className="package-price">{formatCurrency(pkg.price)}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => toggleCompare(pkg)}
                        className={`btn btn-sm ${isCompared ? 'btn-yellow' : 'btn-outline'}`}
                        title="Compare Package"
                      >
                        {isCompared ? '✓ Compare' : '+ Compare'}
                      </button>
                      <Link to={`/packages/${pkg._id}`} className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Why Roamly Feature Callout */}
      <section style={{ marginTop: '60px', background: 'var(--surface)', border: '3px solid #000', borderRadius: '14px', padding: '36px', boxShadow: '6px 6px 0 #000' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '28px' }}>THE ROAMLY DOODLE PROMISE</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div style={{ border: '2px solid #000', borderRadius: '10px', padding: '20px', background: 'var(--pastel-mint-light)', boxShadow: '3px 3px 0 #000' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>🛡️ 100% Verified Partners</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              All hotel resorts, chauffeurs, and tour agencies undergo rigorous verification before joining our caravan network.
            </p>
          </div>
          <div style={{ border: '2px solid #000', borderRadius: '10px', padding: '20px', background: 'var(--pastel-yellow-light)', boxShadow: '3px 3px 0 #000' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>🗺️ Custom Day-by-Day Planner</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Tailor every single day of your journey with sightseeing stops, private taxi transfers, and boutique hotel bookings.
            </p>
          </div>
          <div style={{ border: '2px solid #000', borderRadius: '10px', padding: '20px', background: 'var(--pastel-blue-light)', boxShadow: '3px 3px 0 #000' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>🎁 Loyalty Points & Coins</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Earn automatic loyalty points on every journey booked and redeem them seamlessly towards your next mountain or coastal getaway.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
