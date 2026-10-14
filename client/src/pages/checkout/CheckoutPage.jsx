import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Wallet, CreditCard, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import PriceBreakdown from '../../components/booking/PriceBreakdown';
import SandboxPayModal from '../../components/booking/SandboxPayModal';
import usePayment from '../../components/booking/usePayment';
import { PageLoader, ErrorState, Countdown, EmptyState, formatDate } from '../../components/ui';

export default function CheckoutPage() {
  const { id } = useParams();
  const { user, refresh } = useAuth();
  const { formatCurrency } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const { pay, sandbox } = usePayment();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('online');
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      const b = res.data.data;
      if (b.status !== 'PendingPayment') return navigate(`/account/bookings/${id}`, { replace: true });
      setBooking(b);
      setExpired(new Date(b.holdExpiresAt) <= new Date());
      if (user.walletBalance >= b.pricing.total) setMethod('wallet');
    } catch (err) {
      setError(errorMessage(err));
    }
    return undefined;
  }, [id, navigate, user.walletBalance]);

  useEffect(() => {
    load();
  }, [load]);

  const done = async () => {
    await refresh();
    toast.success('Payment received. Your booking is confirmed!');
    navigate(`/account/bookings/${id}?confirmed=1`, { replace: true });
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/payments/bookings/${id}`, { method });
      if (res.data.data.completed) return await done();
      await pay(res.data.data, { description: `Booking ${booking.reference}`, prefill: res.data.data.prefill });
      await done();
    } catch (err) {
      toast.error(errorMessage(err, err.message));
      load();
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const cancelHold = async () => {
    await api.put(`/bookings/${id}/cancel`, { reason: 'Abandoned at checkout' }).catch(() => {});
    navigate(-1);
  };

  if (error) return <div className="main-container"><ErrorState message={error} /></div>;
  if (!booking) return <PageLoader />;
  if (expired) {
    return (
      <div className="main-container">
        <EmptyState icon={Clock} title="Your hold has expired" action={<Link to="/" className="btn btn-primary">Search again</Link>}>
          Rooms and seats are held for 15 minutes. They have been released so others can book them.
        </EmptyState>
      </div>
    );
  }

  const walletShort = user.walletBalance < booking.pricing.total;

  return (
    <div className="main-container" style={{ maxWidth: 1000 }}>
      <div className="alert alert-warning"><Clock size={15} /> We're holding this for you for <b><Countdown until={booking.holdExpiresAt} onExpire={() => setExpired(true)} /></b> minutes.</div>
      <div className="detail-layout">
        <div className="stack">
          <div className="card">
            <h2 style={{ fontSize: 20 }}>Review your booking</h2>
            <p className="small muted" style={{ margin: '4px 0 14px' }}>{booking.reference} · {booking.destinationName} · {formatDate(booking.startDate)} – {formatDate(booking.endDate)} · {booking.travelers.adults + booking.travelers.children} travellers</p>
            {booking.items.map((i) => (
              <div key={i._id} className="room-row" style={{ cursor: 'default' }}>
                <div><b>{i.title}</b><div className="small muted">{i.description}</div><div className="small muted">{formatDate(i.startDate)}{i.endDate !== i.startDate ? ` → ${formatDate(i.endDate)}` : ''}</div></div>
                <b className="font-grotesk">{formatCurrency(i.lineTotal)}</b>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Pay with</h2>
            <button type="button" className={`option-card ${method === 'wallet' ? 'selected' : ''} ${walletShort ? 'unavailable' : ''}`} disabled={walletShort} onClick={() => setMethod('wallet')} style={{ width: '100%', marginBottom: 10 }}>
              <Wallet size={22} />
              <span style={{ textAlign: 'left' }}>
                <b>Roamly wallet</b><br />
                <span className="small muted">Balance {formatCurrency(user.walletBalance)}{walletShort ? ' — not enough for this booking' : ' — instant confirmation'}</span>
              </span>
            </button>
            {walletShort && <p className="small" style={{ marginBottom: 10 }}><Link className="link" to="/account/wallet">Top up your wallet</Link> or pay online.</p>}
            <button type="button" className={`option-card ${method === 'online' ? 'selected' : ''}`} onClick={() => setMethod('online')} style={{ width: '100%' }}>
              <CreditCard size={22} />
              <span style={{ textAlign: 'left' }}><b>UPI, card or net banking</b><br /><span className="small muted">Secured by Razorpay</span></span>
            </button>
          </div>
        </div>

        <aside className="sticky-panel stack">
          <div className="card">
            <PriceBreakdown pricing={booking.pricing} showItems={false} />
            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy} onClick={submit}>
              {busy ? 'Processing…' : `Pay ${formatCurrency(booking.pricing.total)}`}
            </button>
            <p className="small muted" style={{ marginTop: 8 }}><ShieldCheck size={12} /> {booking.cancellationPolicy} cancellation policy. Refunds go to your Roamly wallet.</p>
            <button type="button" className="btn btn-sm btn-outline" style={{ marginTop: 8 }} onClick={cancelHold}>Release hold</button>
          </div>
          {booking.pricing.loyaltyPointsUsed > 0 && <p className="small muted"><AlertTriangle size={12} /> {booking.pricing.loyaltyPointsUsed} loyalty points are reserved for this booking.</p>}
        </aside>
      </div>
      <SandboxPayModal sandbox={sandbox} />
    </div>
  );
}
