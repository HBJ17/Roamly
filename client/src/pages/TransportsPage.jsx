import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import BookingModal from '../components/booking/BookingModal';
import { Car, Clock, Navigation, CheckCircle2, Shield } from 'lucide-react';

export default function TransportsPage() {
  const { formatCurrency } = useApp();

  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState('all');

  const [selectedTransport, setSelectedTransport] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchTransports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source) params.append('source', source);
      if (destination) params.append('destination', destination);
      if (mode !== 'all') params.append('mode', mode);

      const res = await api.get(`/transports?${params.toString()}`);
      if (res.data.success) {
        setTransports(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching transports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, [source, destination, mode]);

  const handleBook = (t) => {
    setSelectedTransport(t);
    setIsBookingOpen(true);
  };

  return (
    <div className="main-container">
      {/* Header */}
      <div className="travel-hero" style={{ padding: '24px 30px', marginBottom: '24px' }}>
        <span className="badge badge-peach" style={{ marginBottom: '6px' }}>TRANSIT FLEETS</span>
        <h2 style={{ fontSize: '28px' }}>INTERCITY & CHAUFFEUR TAXI FLEETS</h2>
        <p>Book private hill-station cabs, coastal rental sedans, and verified intercity travel.</p>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '28px',
          background: 'var(--pastel-peach-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <div>
          <label className="form-label">Pickup City</label>
          <input
            type="text"
            placeholder="From (e.g. Bangalore)..."
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="form-control"
            style={{ padding: '7px 10px', fontSize: '13px' }}
          />
        </div>

        <div>
          <label className="form-label">Drop Destination</label>
          <input
            type="text"
            placeholder="To (e.g. Kodaikanal)..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="form-control"
            style={{ padding: '7px 10px', fontSize: '13px' }}
          />
        </div>

        <div>
          <label className="form-label">Vehicle Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="form-control" style={{ padding: '7px 10px', fontSize: '13px' }}>
            <option value="all">All Fleets</option>
            <option value="Taxi">Private Taxis & SUVs</option>
            <option value="Rental">Self-Drive / Coastal Sedans</option>
            <option value="Bus">Luxury Buses</option>
          </select>
        </div>
      </div>

      {/* Transports Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="badge badge-yellow">Loading Fleets...</div>
        </div>
      ) : transports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <h3>No transit fleets found matching route</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {transports.map((t) => (
            <div key={t._id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-peach">{t.serviceType || t.transportType}</span>
                <span className="badge badge-mint">{t.acType}</span>
              </div>

              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{t.title}</h3>

              {/* Waypoint visual route connector */}
              <div className="route-waypoint-container">
                <div className="waypoint-city">
                  <span className="waypoint-tag">FROM</span>
                  <span className="waypoint-name">{t.sourceCity}</span>
                </div>

                <div className="waypoint-connector">
                  <span style={{ fontSize: '11px', fontWeight: '800', marginBottom: '2px' }}>
                    ⏱️ {t.durationHours} hrs
                  </span>
                  <div className="waypoint-line"></div>
                </div>

                <div className="waypoint-city" style={{ textAlign: 'right' }}>
                  <span className="waypoint-tag">TO</span>
                  <span className="waypoint-name">{t.destinationCity}</span>
                </div>
              </div>

              {/* Features List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0 16px' }}>
                {t.features?.map((f, i) => (
                  <span key={i} className="badge badge-neutral" style={{ fontSize: '11px' }}>
                    ✓ {f}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1.5px solid #eee', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL FARE</div>
                  <div className="package-price">{formatCurrency(t.price)}</div>
                </div>

                <button onClick={() => handleBook(t)} className="btn btn-sm btn-primary">
                  Book Transit →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedTransport && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          item={selectedTransport}
          type="transport"
        />
      )}
    </div>
  );
}
