import React, { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PartyPopper, FileText, XCircle, QrCode, Star, Map } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api, { errorMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PriceBreakdown from '../../components/booking/PriceBreakdown';
import ContactPartner from '../../components/listing/ContactPartner';
import ReviewForm from '../../components/booking/ReviewForm';
import { PageLoader, ErrorState, StatusBadge, Modal, Field, Breadcrumbs, formatDate, formatDateTime } from '../../components/ui';

const LINKS = { hotel: 'hotels', transport: 'transports', package: 'packages' };

export default function BookingDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { formatCurrency } = useApp();
  const { refresh } = useAuth();
  const toast = useToast();
  const { data: booking, loading, error, reload } = useApi(`/bookings/${id}`);
  const paid = booking && ['Confirmed', 'Completed'].includes(booking.status);
  const voucher = useApi(paid ? `/bookings/${id}/voucher` : null);
  const [cancel, setCancel] = useState(null);
  const [reason, setReason] = useState('');
  const [reviewing, setReviewing] = useState(null);

  const openCancel = async () => {
    try {
      const res = await api.get(`/bookings/${id}/cancellation`);
      setCancel(res.data.data);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const confirmCancel = async () => {
    try {
      await api.put(`/bookings/${id}/cancel`, { reason });
      setCancel(null);
      toast.success('Booking cancelled');
      refresh();
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <div className="main-container"><ErrorState message={error} onRetry={reload} /></div>;

  return (
    <div className="main-container">
      <Breadcrumbs items={[{ label: 'My bookings', to: '/account/bookings' }, { label: booking.reference }]} />
      {params.get('confirmed') && booking.status === 'Confirmed' && (
        <div className="alert alert-success"><PartyPopper size={16} /> You're all set! A confirmation email is on its way. You earned {booking.loyaltyPointsEarned} loyalty points.</div>
      )}

      <div className="detail-layout">
        <div className="stack">
          <div className="card">
            <div className="row-between">
              <div>
                <h1 style={{ fontSize: 24 }}>{booking.destinationName} · {booking.reference}</h1>
                <p className="small muted">{formatDate(booking.startDate)} – {formatDate(booking.endDate)} · {booking.travelers.adults} adults{booking.travelers.children ? `, ${booking.travelers.children} children` : ''} · booked {formatDateTime(booking.createdAt)}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            {booking.status === 'PendingPayment' && (
              <div className="alert alert-warning" style={{ marginTop: 12 }}>
                Payment pending. <Link className="link" to={`/checkout/${booking._id}`}>Complete payment</Link> before the hold expires.
              </div>
            )}
            {booking.status === 'Cancelled' && (
              <div className="alert alert-danger" style={{ marginTop: 12 }}>
                Cancelled by {booking.cancellation.cancelledBy} on {formatDateTime(booking.cancelledAt)}.
                {booking.cancellation.refundAmount > 0 ? ` ${formatCurrency(booking.cancellation.refundAmount)} (${booking.cancellation.refundPercent}%) refunded to your wallet.` : ' No refund applied.'}
              </div>
            )}
          </div>

          {booking.items.map((item) => (
            <div key={item._id} className="card" style={{ padding: 18 }}>
              <div className="row-between">
                <div>
                  <span className="badge badge-blue">{item.itemType}</span>
                  <h3 style={{ fontSize: 16, margin: '6px 0 2px', textTransform: 'none' }}>
                    <Link className="link" to={`/${LINKS[item.itemType]}/${item.item}`}>{item.title}</Link>
                  </h3>
                  <p className="small muted">{item.description}</p>
                  <p className="small">{formatDate(item.startDate)}{item.endDate !== item.startDate ? ` → ${formatDate(item.endDate)}` : ''}{item.meta?.pickupLocation ? ` · pickup: ${item.meta.pickupLocation}` : ''}</p>
                </div>
                <b className="font-grotesk">{formatCurrency(item.lineTotal)}</b>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                {paid && <ContactPartner bookingId={booking._id} itemId={item.item} label="Message partner" />}
                {booking.status === 'Completed' && (
                  <button type="button" className="btn btn-sm btn-yellow" onClick={() => setReviewing(item)}><Star size={12} /> Write a review</button>
                )}
              </div>
            </div>
          ))}
          {booking.itinerary && <Link className="btn btn-outline" to={`/plan/${booking.itinerary}`}><Map size={14} /> View day-by-day plan</Link>}
        </div>

        <aside className="sticky-panel stack">
          {paid && voucher.data && (
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 10 }}><QrCode size={16} /> Your voucher</h3>
              <div className="voucher">
                <img src={voucher.data.qr} alt={`QR voucher for ${booking.reference}`} />
                <p className="small muted">Show this at check-in or to your driver. Partners scan it to confirm your booking.</p>
              </div>
            </div>
          )}
          <div className="card">
            <PriceBreakdown pricing={booking.pricing} showItems={false} />
            {paid && (
              <a className="btn btn-outline btn-block" style={{ marginTop: 14 }} href={`/api/bookings/${booking._id}/invoice.pdf`} target="_blank" rel="noreferrer">
                <FileText size={14} /> Download invoice
              </a>
            )}
            {['Confirmed', 'PendingPayment'].includes(booking.status) && (
              <button type="button" className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={booking.status === 'PendingPayment' ? confirmCancel : openCancel}>
                <XCircle size={14} /> {booking.status === 'PendingPayment' ? 'Release hold' : 'Cancel booking'}
              </button>
            )}
          </div>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/account/bookings')}>All bookings</button>
        </aside>
      </div>

      <Modal open={Boolean(cancel)} title="Cancel this booking?" onClose={() => setCancel(null)}>
        {cancel && (
          <>
            <p>
              Under the <b>{cancel.policy}</b> policy, cancelling {cancel.daysBefore} day{cancel.daysBefore === 1 ? '' : 's'} before travel refunds{' '}
              <b>{cancel.refundPercent}% ({formatCurrency(cancel.refundAmount)})</b> to your Roamly wallet.
            </p>
            <ul className="small muted" style={{ margin: '10px 0 14px 18px' }}>
              {cancel.tiers?.map((t) => <li key={t.daysBefore}>{t.daysBefore}+ days before: {t.refundPercent}% refund</li>)}
            </ul>
            <Field label="Reason (optional)"><input className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="row">
              <button type="button" className="btn btn-danger" onClick={confirmCancel}>Yes, cancel</button>
              <button type="button" className="btn btn-outline" onClick={() => setCancel(null)}>Keep booking</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={Boolean(reviewing)} title={`Review ${reviewing?.title || ''}`} onClose={() => setReviewing(null)}>
        {reviewing && <ReviewForm bookingId={booking._id} itemId={reviewing.item} onDone={() => { setReviewing(null); toast.success('Thanks for your review!'); }} />}
      </Modal>
    </div>
  );
}
