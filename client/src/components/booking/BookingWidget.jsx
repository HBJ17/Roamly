import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Tag } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTrip } from '../../context/TripContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Field, todayPlus } from '../ui';
import PriceBreakdown from './PriceBreakdown';

const nextDay = (day) => new Date(new Date(`${day}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);

export const Stepper =({ value, min = 0, max = 20, onChange, label }) => (
  <div className="stepper" aria-label={label}>
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label}`}>−</button>
    <span>{value}</span>
    <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label}`}>+</button>
  </div>
);

/**
 * Collects dates/quantities for one listing, shows a live server quote,
 * and on Reserve creates a payment hold and moves to checkout.
 *  itemType: 'hotel' | 'transport' | 'package'
 *  roomId: selected hotel room (hotel only)
 */
export default function BookingWidget({ itemType, item, roomId, initialDate, initialEndDate }) {
  const { user, role } = useAuth();
  const { trip, updateTrip } = useTrip();
  const { t } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isLocal = itemType === 'transport' && item.scope === 'local';
  const isIntercity = itemType === 'transport' && item.scope === 'intercity';

  const [form, setForm] = useState({
    startDate: initialDate || trip.startDate,
    endDate: initialEndDate || (trip.endDate > trip.startDate ? trip.endDate : todayPlus(15)),
    days: Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1),
    rooms: 1,
    vehicles: 1,
    adults: trip.adults,
    children: trip.children,
    pickupLocation: '',
    couponCode: '',
    loyaltyPoints: 0
  });
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const request = useMemo(() => ({
    itemType,
    itemId: item._id,
    roomId: itemType === 'hotel' ? roomId : undefined,
    startDate: form.startDate,
    endDate: itemType === 'hotel' ? form.endDate : undefined,
    days: isLocal ? form.days : undefined,
    rooms: itemType === 'hotel' ? form.rooms : undefined,
    vehicles: isLocal ? form.vehicles : undefined,
    travelers: { adults: form.adults, children: form.children },
    pickupLocation: isLocal ? form.pickupLocation : undefined,
    couponCode: appliedCoupon || undefined,
    loyaltyPoints: form.loyaltyPoints || undefined
  }), [itemType, item._id, roomId, form, isLocal, appliedCoupon]);

  // Quotes need a signed-in traveller (coupon and loyalty rules are per user).
  useEffect(() => {
    if (role !== 'user') return undefined;
    const timer = setTimeout(async () => {
      setQuoting(true);
      try {
        const res = await api.post('/bookings/quote', request);
        setQuote(res.data.data);
        setQuoteError('');
      } catch (err) {
        setQuote(null);
        setQuoteError(errorMessage(err));
      } finally {
        setQuoting(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [request, role]);

  const reserve = async () => {
    if (!user) return navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    setBusy(true);
    try {
      updateTrip({ adults: form.adults, children: form.children });
      const res = await api.post('/bookings', request);
      navigate(`/checkout/${res.data.data._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  if (role && role !== 'user') {
    return <div className="card"><p className="small muted">Bookings are made from traveller accounts.</p></div>;
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>{t('reserve')}</h3>

      <div className="form-grid">
        <Field label={itemType === 'hotel' ? t('check_in') : isIntercity ? 'Travel date' : 'Start date'}>
          <input type="date" className="form-control" min={todayPlus(1)} value={form.startDate} onChange={(e) => set({ startDate: e.target.value, endDate: e.target.value >= form.endDate ? nextDay(e.target.value) : form.endDate })} />
        </Field>
        {itemType === 'hotel' && (
          <Field label={t('check_out')}>
            <input type="date" className="form-control" min={form.startDate} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
          </Field>
        )}
        {isLocal && <Field label="Days"><Stepper label="days" value={form.days} min={1} max={30} onChange={(days) => set({ days })} /></Field>}
      </div>

      <div className="row" style={{ gap: 18, marginBottom: 12 }}>
        <Field label={t('adults')}><Stepper label="adults" value={form.adults} min={1} onChange={(adults) => set({ adults })} /></Field>
        <Field label={t('children')}><Stepper label="children" value={form.children} onChange={(children) => set({ children })} /></Field>
        {itemType === 'hotel' && <Field label="Rooms"><Stepper label="rooms" value={form.rooms} min={1} max={10} onChange={(rooms) => set({ rooms })} /></Field>}
        {isLocal && <Field label="Vehicles"><Stepper label="vehicles" value={form.vehicles} min={1} max={10} onChange={(vehicles) => set({ vehicles })} /></Field>}
      </div>

      {isLocal && (
        <Field label="Pickup location" hint={`Anywhere in ${item.destinationName}`}>
          <input className="form-control" value={form.pickupLocation} onChange={(e) => set({ pickupLocation: e.target.value })} placeholder="Hotel, station or address" />
        </Field>
      )}

      {role === 'user' && (
        <Field label="Promo code">
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input className="form-control" value={form.couponCode} onChange={(e) => set({ couponCode: e.target.value.toUpperCase() })} placeholder="e.g. ROAMFIRST" />
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setAppliedCoupon(form.couponCode.trim())}><Tag size={12} /> Apply</button>
          </div>
        </Field>
      )}
      {role === 'user' && user.loyaltyPoints > 0 && (
        <label className="checkbox" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={form.loyaltyPoints > 0} onChange={(e) => set({ loyaltyPoints: e.target.checked ? user.loyaltyPoints : 0 })} />
          Use my {user.loyaltyPoints} loyalty points (1 point = ₹1, up to 20%)
        </label>
      )}

      {quoteError && <div className="alert alert-warning">{quoteError}</div>}
      {quote?.couponError && <div className="alert alert-warning">{quote.couponError}</div>}
      {quote && <PriceBreakdown items={quote.items} pricing={quote.pricing} />}
      {quote?.remaining?.[0] !== undefined && quote.remaining[0] <= 3 && <p className="small" style={{ color: 'var(--status-pending)', fontWeight: 700, marginTop: 6 }}>Only {quote.remaining[0]} left for these dates</p>}
      {!user && <p className="small muted" style={{ marginBottom: 10 }}>Sign in to see your exact price with offers and reserve.</p>}

      <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy || (role === 'user' && (!quote || quoting))} onClick={reserve}>
        {busy ? 'Holding…' : user ? `${t('reserve')} & pay` : t('login')}
      </button>
      <p className="small muted" style={{ marginTop: 8 }}><ShieldCheck size={12} /> Held for 15 minutes while you pay. Free cancellation depends on the {item.cancellationPolicy?.toLowerCase()} policy.</p>
    </div>
  );
}
