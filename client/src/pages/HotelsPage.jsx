import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import BookingModal from '../components/booking/BookingModal';
import { Hotel, Star, MapPin, Wind, Heart, Users, Bed } from 'lucide-react';

export default function HotelsPage() {
  const [searchParams] = useSearchParams();
  const { formatCurrency } = useApp();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [acType, setAcType] = useState('all');
  const [petFriendly, setPetFriendly] = useState('');
  const [bedType, setBedType] = useState('all');
  const [capacity, setCapacity] = useState('0');
  const [sortBy, setSortBy] = useState('default');

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (acType !== 'all') params.append('ac_type', acType);
      if (petFriendly !== '') params.append('pet_friendly', petFriendly);
      if (bedType !== 'all') params.append('bed_type', bedType);
      if (Number(capacity) > 0) params.append('capacity', capacity);
      if (sortBy !== 'default') params.append('sort_by', sortBy);

      const res = await api.get(`/hotels?${params.toString()}`);
      if (res.data.success) {
        setHotels(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching hotels', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [city, acType, petFriendly, bedType, capacity, sortBy]);

  const handleBook = (hotel) => {
    setSelectedHotel(hotel);
    setIsBookingOpen(true);
  };

  return (
    <div className="main-container">
      {/* Header Banner */}
      <div className="travel-hero" style={{ padding: '24px 30px', marginBottom: '24px' }}>
        <span className="badge badge-mint" style={{ marginBottom: '6px' }}>VERIFIED LODGINGS</span>
        <h2 style={{ fontSize: '28px' }}>BOUTIQUE RETREATS & RESORTS</h2>
        <p>Curated colonial bungalows, palace retreats, and beachside suites with authentic dining.</p>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '28px',
          background: 'var(--pastel-mint-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <div>
          <label className="form-label">City / Destination</label>
          <input
            type="text"
            placeholder="Search city (e.g. Kodaikanal)..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="form-control"
            style={{ padding: '7px 10px', fontSize: '13px' }}
          />
        </div>

        <div>
          <label className="form-label">Climate / AC</label>
          <select value={acType} onChange={(e) => setAcType(e.target.value)} className="form-control" style={{ padding: '7px 10px', fontSize: '13px' }}>
            <option value="all">All Types</option>
            <option value="AC">AC Rooms</option>
            <option value="Non-AC">Non-AC Hilltop</option>
            <option value="Both">Both Available</option>
          </select>
        </div>

        <div>
          <label className="form-label">Pet Friendly</label>
          <select value={petFriendly} onChange={(e) => setPetFriendly(e.target.value)} className="form-control" style={{ padding: '7px 10px', fontSize: '13px' }}>
            <option value="">Any Policy</option>
            <option value="1">🐾 Pets Welcome</option>
            <option value="0">No Pets</option>
          </select>
        </div>

        <div>
          <label className="form-label">Min Guests</label>
          <select value={capacity} onChange={(e) => setCapacity(e.target.value)} className="form-control" style={{ padding: '7px 10px', fontSize: '13px' }}>
            <option value="0">Any Capacity</option>
            <option value="2">2+ Guests</option>
            <option value="4">4+ Guests</option>
            <option value="6">6+ Family Suite</option>
          </select>
        </div>

        <div>
          <label className="form-label">Sort Order</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-control" style={{ padding: '7px 10px', fontSize: '13px' }}>
            <option value="default">Star Rating (High to Low)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Hotels Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="badge badge-yellow">Loading Lodgings...</div>
        </div>
      ) : hotels.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <h3>No retreats match your current filters</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {hotels.map((h) => (
            <div key={h._id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '220px', position: 'relative', borderBottom: '2px solid #000' }}>
                <img src={h.imageUrl} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                  <span className="badge badge-yellow">📍 {h.city}</span>
                  {h.petFriendly && <span className="badge badge-mint">🐾 Pet Friendly</span>}
                </div>
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className="rating-badge">
                    <Star size={13} fill="#000" /> {h.starRating} Stars
                  </span>
                </div>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>{h.name}</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {h.address}
                </p>

                {/* Amenities Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {h.amenities?.slice(0, 4).map((a, i) => (
                    <span key={i} className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                      ✓ {a}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1.5px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>PER NIGHT</div>
                    <div className="package-price">{formatCurrency(h.pricePerNight)}</div>
                  </div>

                  <button onClick={() => handleBook(h)} className="btn btn-sm btn-primary">
                    Reserve Room →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Checkout Modal */}
      {selectedHotel && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          item={selectedHotel}
          type="hotel"
        />
      )}
    </div>
  );
}
