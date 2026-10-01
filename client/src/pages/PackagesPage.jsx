import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { Search, Filter, Star, MapPin, SlidersHorizontal, Scale } from 'lucide-react';

export default function PackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatCurrency, toggleCompare, compareList } = useApp();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [duration, setDuration] = useState(searchParams.get('duration') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'default');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '30000');

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (destination) params.append('destination', destination);
      if (category && category !== 'all') params.append('category', category);
      if (duration && duration !== 'all') params.append('duration', duration);
      if (sortBy && sortBy !== 'default') params.append('sort_by', sortBy);
      if (maxPrice) params.append('max_price', maxPrice);

      const res = await api.get(`/packages?${params.toString()}`);
      if (res.data.success) {
        setPackages(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching packages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [destination, category, duration, sortBy, maxPrice]);

  return (
    <div className="main-container">
      {/* Header Banner */}
      <div className="travel-hero" style={{ padding: '24px 30px', marginBottom: '24px' }}>
        <span className="badge badge-yellow" style={{ marginBottom: '6px' }}>EXPEDITION CATALOG</span>
        <h2 style={{ fontSize: '28px' }}>CURATED TOUR PACKAGES & CARAVANS</h2>
        <p>Discover hand-crafted multi-day packages with curated hotels, private chauffeur transfers, and guided experiences.</p>
      </div>

      {/* Filter & Controls Bar */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          marginBottom: '28px',
          background: 'var(--pastel-yellow-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <div>
          <label className="form-label">Search Destination</label>
          <input
            type="text"
            placeholder="e.g. Kodaikanal..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="form-control"
            style={{ padding: '7px 10px', fontSize: '13px' }}
          />
        </div>

        <div>
          <label className="form-label">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-control"
            style={{ padding: '7px 10px', fontSize: '13px' }}
          >
            <option value="all">All Categories</option>
            <option value="Hill Station">Hill Station</option>
            <option value="Heritage">Heritage</option>
            <option value="Beach">Beach</option>
            <option value="Cultural">Cultural</option>
          </select>
        </div>

        <div>
          <label className="form-label">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="form-control"
            style={{ padding: '7px 10px', fontSize: '13px' }}
          >
            <option value="all">All Durations</option>
            <option value="1-3">Short (1 - 3 Days)</option>
            <option value="4-7">Medium (4 - 7 Days)</option>
            <option value="8+">Extended (8+ Days)</option>
          </select>
        </div>

        <div>
          <label className="form-label">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-control"
            style={{ padding: '7px 10px', fontSize: '13px' }}
          >
            <option value="default">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="duration_desc">Longest Duration</option>
          </select>
        </div>

        <div>
          <label className="form-label">Max Price: {formatCurrency(maxPrice)}</label>
          <input
            type="range"
            min="3000"
            max="40000"
            step="1000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ width: '100%', accentColor: '#000' }}
          />
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="badge badge-yellow">Loading Packages...</div>
        </div>
      ) : packages.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <h3>No expeditions matched your criteria</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Try adjusting your search destination, category or duration filter.
          </p>
        </div>
      ) : (
        <div className="packages-grid">
          {packages.map((pkg) => {
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
    </div>
  );
}
