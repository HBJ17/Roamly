import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/booking/BookingModal';
import { Star, Check, X, Shield, MapPin, Calendar, Clock, Utensils, ThumbsUp, Send } from 'lucide-react';

export default function PackageDetailPage() {
  const { id } = useParams();
  const { formatCurrency, toggleCompare, compareList } = useApp();
  const { user } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [travelType, setTravelType] = useState('Solo');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/packages/${id}`);
      if (res.data.success) {
        setPkg(res.data.data);
        setReviews(res.data.reviews || []);
        setSimilar(res.data.similar || []);
      }
    } catch (err) {
      console.error('Error fetching package details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to write a review');

    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        itemType: 'package',
        itemId: pkg._id,
        rating: Number(newRating),
        title: reviewTitle,
        comment: reviewComment,
        travelType
      });
      if (res.data.success) {
        setReviews([res.data.data, ...reviews]);
        setReviewTitle('');
        setReviewComment('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="badge badge-yellow">Loading Expedition Details...</div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '60px' }}>
        <h2>Expedition Not Found</h2>
        <Link to="/packages" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Packages
        </Link>
      </div>
    );
  }

  const isCompared = compareList.some((p) => p._id === pkg._id);

  return (
    <div className="main-container">
      {/* Breadcrumb Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <Link to="/packages" className="btn-breadcrumb">
          ← All Packages
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => toggleCompare(pkg)} className={`btn btn-sm ${isCompared ? 'btn-yellow' : 'btn-outline'}`}>
            {isCompared ? '✓ In Compare' : '+ Compare'}
          </button>
          <span className="badge badge-mint">✓ Verified Operator</span>
        </div>
      </div>

      {/* Main Detail Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Column: Media & Highlights */}
        <div>
          {/* Main Hero Card */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ position: 'relative', height: '380px', borderBottom: '2.5px solid #000' }}>
              <img src={pkg.imageUrl} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-yellow">{pkg.category}</span>
                <span className="badge badge-mint">{pkg.durationDays} Days / {pkg.durationNights} Nights</span>
              </div>
              <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                <span className="rating-badge" style={{ fontSize: '15px', padding: '6px 12px' }}>
                  <Star size={16} fill="#000" color="#000" /> {pkg.rating} ({reviews.length} reviews)
                </span>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <h1 style={{ fontSize: '26px', marginBottom: '10px' }}>{pkg.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span>📍 {pkg.destination}</span>
                <span>⏱️ {pkg.durationDays} Days Duration</span>
                <span>👥 Ideal for: <strong>{pkg.idealFor}</strong></span>
              </div>
              <p style={{ fontSize: '14.5px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                {pkg.description}
              </p>
            </div>
          </div>

          {/* Highlights & Inclusions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="card" style={{ background: 'var(--pastel-yellow-light)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✨ Expedition Highlights
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                {pkg.highlights?.map((h, i) => (
                  <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#059669', fontWeight: '800' }}>✓</span> {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ background: 'var(--pastel-mint-light)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏨 Included Amenities & Stays
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                {pkg.includedAmenities?.map((a, i) => (
                  <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#000', fontWeight: '800' }}>•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Food Highlights */}
          {pkg.foodHighlights?.length > 0 && (
            <div className="card" style={{ marginBottom: '24px', background: 'var(--pastel-peach-light)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Utensils size={16} /> Regional Culinary Treats
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {pkg.foodHighlights.map((f, i) => (
                  <span key={i} className="badge badge-neutral" style={{ fontSize: '12px' }}>
                    🍲 {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pros & Considerations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div className="card">
              <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#059669' }}>👍 Advantages & Pros</h4>
              <ul style={{ listStyle: 'none', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pkg.pros?.map((p, i) => (
                  <li key={i}>+ {p}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#dc2626' }}>⚠️ Considerations</h4>
              <ul style={{ listStyle: 'none', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pkg.cons?.map((c, i) => (
                  <li key={i}>- {c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Traveler Reviews Section */}
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>TRAVELER REVIEWS ({reviews.length})</h3>

            {/* Write Review Form */}
            {user && (
              <form
                onSubmit={handleReviewSubmit}
                style={{
                  background: 'var(--surface-low)',
                  border: '2px solid #000',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px'
                }}
              >
                <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Write a Verified Review</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label className="form-label">Rating</label>
                    <select value={newRating} onChange={(e) => setNewRating(e.target.value)} className="form-control">
                      <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value="4">⭐⭐⭐⭐ (4/5)</option>
                      <option value="3">⭐⭐⭐ (3/5)</option>
                      <option value="2">⭐⭐ (2/5)</option>
                      <option value="1">⭐ (1/5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Magnificent experience!"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Experience</label>
                  <textarea
                    rows="3"
                    placeholder="Tell other travelers about your stay, food, and route..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    className="form-control"
                  ></textarea>
                </div>
                <button type="submit" disabled={submittingReview} className="btn btn-sm btn-primary">
                  <Send size={13} /> {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Be the first explorer to review this caravan!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reviews.map((r, i) => (
                  <div key={i} style={{ borderBottom: '1.5px solid #eee', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong>{r.title}</strong>
                      <span className="rating-badge">
                        <Star size={12} fill="#000" /> {r.rating}/5
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{r.comment}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By {r.user?.fullName || r.user?.username || 'Verified Traveler'} • {r.travelType} Traveler
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Booking Box */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="card" style={{ background: 'var(--pastel-yellow-light)', border: '3px solid #000' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>STARTING FROM</div>
            <div style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0 12px' }}>
              {formatCurrency(pkg.price)}
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}> / person</span>
            </div>

            <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '8px', padding: '12px', marginBottom: '18px', fontSize: '12.5px' }}>
              <div style={{ marginBottom: '6px' }}>✓ <strong>Instant Confirmation</strong></div>
              <div style={{ marginBottom: '6px' }}>✓ Free cancellation up to 48 hours prior</div>
              <div>✓ +{Math.floor(pkg.price / 100) * 5} Roamly Loyalty Coins</div>
            </div>

            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              Book This Caravan →
            </button>

            {/* Operator Details */}
            {pkg.agency && (
              <div style={{ marginTop: '20px', borderTop: '2px dashed #000', paddingTop: '14px', fontSize: '12.5px' }}>
                <div style={{ fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                  OPERATED BY
                </div>
                <div style={{ fontWeight: '800' }}>{pkg.agency.name}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{pkg.agency.email}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Checkout Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        item={pkg}
        type="package"
      />
    </div>
  );
}
