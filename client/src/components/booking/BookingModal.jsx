import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import api from '../../api/client';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, Ticket, CreditCard, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BookingModal({ isOpen, onClose, item, type = 'package' }) {
  const { user } = useAuth();
  const { formatCurrency } = useApp();
  const navigate = useNavigate();

  const [travelDate, setTravelDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
  const [numTravelers, setNumTravelers] = useState(1);
  const [roomType, setRoomType] = useState('Standard');
  const [pickupLocation, setPickupLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);

  if (!isOpen || !item) return null;

  const basePrice = Number(type === 'hotel' ? item.pricePerNight : item.price || 0);
  let nights = 1;
  if (type === 'hotel' && travelDate && checkOutDate) {
    const diff = Math.ceil((new Date(checkOutDate) - new Date(travelDate)) / (1000 * 60 * 60 * 24));
    if (diff > 0) nights = diff;
  }

  const subtotal = type === 'hotel' ? basePrice * nights * numTravelers : basePrice * numTravelers;
  const taxAmount = Math.round(subtotal * 0.18);
  const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, amount: subtotal });
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setDiscountAmount(res.data.discount);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        bookingType: type,
        itemId: item._id,
        travelDate,
        checkOutDate: type === 'hotel' ? checkOutDate : undefined,
        numTravelers: Number(numTravelers),
        roomType,
        pickupLocation,
        specialRequests,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        paymentMethod
      };

      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        setSuccessBooking(res.data.data);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--pastel-pink)',
            border: '2px solid #000',
            borderRadius: '6px',
            boxShadow: '2px 2px 0 #000',
            padding: '4px',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {successBooking ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={64} color="#059669" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>EXPEDITION CONFIRMED!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Your booking ticket <strong>#{successBooking._id.slice(-6)}</strong> has been booked and paid for.
            </p>
            <div
              style={{
                background: 'var(--pastel-mint-light)',
                border: '2px solid #000',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                boxShadow: '3px 3px 0 #000',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '15px' }}>{item.title || item.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Travel Date: {travelDate}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '6px' }}>
                Paid Total: {formatCurrency(totalAmount)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard');
                }}
                className="btn btn-yellow"
              >
                View in Explorer Desk
              </button>
              <button onClick={onClose} className="btn btn-outline">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking}>
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
              <span className="badge badge-yellow" style={{ marginBottom: '6px' }}>
                {type.toUpperCase()} BOOKING
              </span>
              <h3 style={{ fontSize: '20px', marginTop: '4px' }}>{item.title || item.name}</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {item.destination || item.city || (item.sourceCity ? `${item.sourceCity} → ${item.destinationCity}` : '')}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Date of Travel</label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                  className="form-control"
                />
              </div>

              {type === 'hotel' ? (
                <div className="form-group">
                  <label className="form-label">Check-out Date</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Travelers</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numTravelers}
                    onChange={(e) => setNumTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                    className="form-control"
                  />
                </div>
              )}
            </div>

            {/* Coupon Code Section */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Promo / Coupon Code</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. ROAMLY10, WANDERLUST"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                  className="form-control"
                />
                <button type="button" onClick={handleApplyCoupon} className="btn btn-mint btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  <Ticket size={14} /> Apply
                </button>
              </div>
              {appliedCoupon && (
                <div style={{ color: '#059669', fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>
                  ✓ {appliedCoupon.code} applied (-{formatCurrency(discountAmount)})
                </div>
              )}
              {couponError && (
                <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>
                  {couponError}
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Payment Gateway</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['Card', 'UPI', 'NetBanking', 'Wallet'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: '8px 4px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: '2px solid #000',
                      boxShadow: paymentMethod === m ? '3px 3px 0 #000' : '1px 1px 0 #000',
                      background: paymentMethod === m ? 'var(--pastel-yellow)' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Ledger Breakdown */}
            <div
              style={{
                background: 'var(--surface-low)',
                border: '2px solid #000',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '18px',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal ({numTravelers} {numTravelers > 1 ? 'Travelers' : 'Traveler'})</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Taxes & GST (18%)</span>
                <span>+{formatCurrency(taxAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#059669' }}>
                  <span>Promo Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div
                style={{
                  borderTop: '2px dashed #000',
                  paddingTop: '8px',
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '16px',
                  fontWeight: '800'
                }}
              >
                <span>Total Payable</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              {loading ? 'Processing Caravan Ticket...' : `Pay & Confirm ${formatCurrency(totalAmount)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
