import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Ticket, Map, Heart, Star, CalendarDays, Plus, Trash2, Award, MailWarning } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api, { errorMessage, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import usePayment from '../../components/booking/usePayment';
import SandboxPayModal from '../../components/booking/SandboxPayModal';
import ReviewForm from '../../components/booking/ReviewForm';
import { HotelCard, CabCard, PackageCard } from '../../components/listing/Cards';
import { Spinner, EmptyState, StatusBadge, Tabs, Pagination, Modal, Field, formatDate, formatDateTime } from '../../components/ui';

const BookingRow = ({ b }) => {
  const { formatCurrency } = useApp();
  return (
    <Link to={b.status === 'PendingPayment' ? `/checkout/${b._id}` : `/account/bookings/${b._id}`} className="card plain row-between" style={{ padding: 14 }}>
      <div>
        <b>{b.bookingType === 'trip' ? `${b.destinationName} trip · ${b.items.length} items` : `${b.destinationName} · ${b.items[0].title}`}</b>
        <div className="small muted">{b.reference} · {formatDate(b.startDate)} – {formatDate(b.endDate)} · {b.bookingType}</div>
      </div>
      <div className="row">
        <b className="font-grotesk">{formatCurrency(b.pricing.total)}</b>
        <StatusBadge status={b.status} />
      </div>
    </Link>
  );
};

export function AccountOverview() {
  const { user } = useAuth();
  const { formatCurrency } = useApp();
  const toast = useToast();
  const upcoming = useApi('/bookings/my', { params: { status: 'upcoming', limit: 3 } });
  const pending = useApi('/reviews/pending');

  const resend = async () => {
    try {
      await api.post('/auth/verify-email/send');
      toast.success('Verification email sent');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="stack">
      {!user.emailVerified && (
        <div className="alert alert-warning"><MailWarning size={15} /> Confirm your email to receive vouchers. <button type="button" className="btn btn-sm btn-outline" onClick={resend}>Resend link</button></div>
      )}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-card-label"><Wallet size={13} /> Wallet</div><div className="stat-card-val">{formatCurrency(user.walletBalance)}</div><Link className="link small" to="/account/wallet">Top up</Link></div>
        <div className="stat-card"><div className="stat-card-label"><Award size={13} /> Loyalty points</div><div className="stat-card-val">{user.loyaltyPoints}</div><span className="small muted">Worth {formatCurrency(user.loyaltyPoints)}</span></div>
        <div className="stat-card"><div className="stat-card-label"><Ticket size={13} /> Upcoming trips</div><div className="stat-card-val">{upcoming.body?.total ?? '–'}</div></div>
        <div className="stat-card"><div className="stat-card-label"><Star size={13} /> Reviews to write</div><div className="stat-card-val">{pending.data?.length ?? '–'}</div></div>
      </div>
      <div className="row-between"><h2 className="section-title" style={{ marginBottom: 0 }}>Coming up</h2><Link className="link small" to="/account/bookings">All bookings</Link></div>
      {upcoming.loading ? <Spinner /> : upcoming.data?.length ? upcoming.data.map((b) => <BookingRow key={b._id} b={b} />) : (
        <EmptyState icon={CalendarDays} title="No trips booked yet" action={<Link className="btn btn-primary" to="/plan">Plan a trip</Link>} />
      )}
      {pending.data?.length > 0 && (
        <>
          <h2 className="section-title">How was your trip?</h2>
          <PendingReviews items={pending.data} onDone={pending.reload} />
        </>
      )}
    </div>
  );
}

export function MyBookings() {
  const [status, setStatus] = useState('upcoming');
  const [page, setPage] = useState(1);
  const { body, loading } = useApi('/bookings/my', { params: { status, page, limit: 10 } });
  return (
    <div className="stack">
      <Tabs
        tabs={[{ id: 'upcoming', label: 'Upcoming' }, { id: 'past', label: 'Completed' }, { id: 'cancelled', label: 'Cancelled' }, { id: '', label: 'All' }]}
        active={status}
        onChange={(s) => { setStatus(s); setPage(1); }}
      />
      {loading ? <Spinner /> : body?.data?.length ? body.data.map((b) => <BookingRow key={b._id} b={b} />) : <EmptyState icon={Ticket} title="No bookings here" />}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
    </div>
  );
}

export function MyTrips() {
  const { data, loading, reload } = useApi('/itineraries');
  const { formatCurrency } = useApp();
  const toast = useToast();

  const remove = async (id) => {
    if (!window.confirm('Delete this trip plan?')) return;
    try {
      await api.delete(`/itineraries/${id}`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <Spinner />;
  return (
    <div className="stack">
      <div className="row-between"><h2 className="section-title" style={{ marginBottom: 0 }}>Trip plans</h2><Link className="btn btn-sm btn-primary" to="/plan"><Plus size={13} /> New plan</Link></div>
      {data?.length ? data.map((it) => (
        <div key={it._id} className="card row-between" style={{ padding: 14 }}>
          <div>
            <b>{it.title}</b>
            <div className="small muted">{it.destinationName}{it.originName ? ` from ${it.originName}` : ''} · {formatDate(it.startDate)} – {formatDate(it.endDate)} · est. {formatCurrency(it.estimate.total)}</div>
          </div>
          <div className="row">
            <StatusBadge status={it.status} />
            <Link className="btn btn-sm btn-yellow" to={it.status === 'Booked' && it.booking ? `/account/bookings/${it.booking._id}` : `/plan/${it._id}`}>{it.status === 'Booked' ? 'View booking' : 'Open'}</Link>
            {it.status !== 'Booked' && <button type="button" className="icon-btn" onClick={() => remove(it._id)} aria-label="Delete"><Trash2 size={14} /></button>}
          </div>
        </div>
      )) : <EmptyState icon={Map} title="No trip plans yet" action={<Link className="btn btn-primary" to="/plan">Plan your first trip</Link>} />}
    </div>
  );
}

export function WalletPage() {
  const { user, refresh } = useAuth();
  const { formatCurrency } = useApp();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { body, loading, reload } = useApi('/wallet', { params: { page } });
  const [amount, setAmount] = useState(2000);
  const [busy, setBusy] = useState(false);
  const { pay, sandbox } = usePayment();

  const topup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post('/payments/topup', { amount: Number(amount) });
      await pay(res.data.data, { description: 'Roamly wallet top-up' });
      toast.success(`${formatCurrency(amount)} added to your wallet`);
      await refresh();
      reload();
    } catch (err) {
      toast.error(errorMessage(err, err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="grid-2">
        <div className="stat-card"><div className="stat-card-label"><Wallet size={13} /> Balance</div><div className="stat-card-val">{formatCurrency(user.walletBalance)}</div><span className="small muted">Refunds from cancellations land here instantly.</span></div>
        <form className="card" style={{ padding: 16 }} onSubmit={topup}>
          <Field label="Add money" hint="₹100 to ₹1,00,000">
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input type="number" className="form-control" min={100} max={100000} step={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? '…' : 'Top up'}</button>
            </div>
          </Field>
          <div className="row">{[1000, 2000, 5000].map((v) => <button key={v} type="button" className="btn btn-sm btn-outline" onClick={() => setAmount(v)}>{formatCurrency(v)}</button>)}</div>
        </form>
      </div>
      <h2 className="section-title">Statement</h2>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Details</th><th>Amount</th><th>Balance</th></tr></thead>
            <tbody>
              {body?.data.map((t) => (
                <tr key={t._id}>
                  <td>{formatDateTime(t.createdAt)}</td>
                  <td>{t.description}{t.booking ? <> · <Link className="link" to={`/account/bookings/${t.booking._id}`}>{t.booking.reference}</Link></> : ''}</td>
                  <td style={{ color: t.type === 'credit' ? 'var(--status-confirmed)' : 'var(--status-cancelled)', fontWeight: 700 }}>{t.type === 'credit' ? '+' : '−'}{formatCurrency(t.amount)}</td>
                  <td>{formatCurrency(t.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
      <SandboxPayModal sandbox={sandbox} />
    </div>
  );
}

export function SavedPage() {
  const { data, loading } = useApi('/saved');
  if (loading) return <Spinner />;
  if (!data?.length) return <EmptyState icon={Heart} title="Nothing saved yet">Tap the heart on any stay, cab or package to keep it here.</EmptyState>;
  const byCity = data.reduce((acc, s) => {
    (acc[s.item.destinationName] = acc[s.item.destinationName] || []).push(s);
    return acc;
  }, {});
  return (
    <div className="stack">
      {Object.entries(byCity).map(([city, items]) => (
        <section key={city}>
          <h2 className="section-title">{city}</h2>
          <div className="grid-auto">
            {items.map((s) => (s.itemType === 'hotel' ? <HotelCard key={s.savedId} hotel={s.item} /> : s.itemType === 'package' ? <PackageCard key={s.savedId} pkg={s.item} /> : <CabCard key={s.savedId} cab={s.item} />))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PendingReviews({ items, onDone }) {
  const [active, setActive] = useState(null);
  const toast = useToast();
  return (
    <div className="stack">
      {items.map((p) => (
        <div key={`${p.bookingId}-${p.itemId}`} className="card row-between" style={{ padding: 14 }}>
          <div><b>{p.title}</b><div className="small muted">{p.reference} · ended {formatDate(p.endDate)}</div></div>
          <button type="button" className="btn btn-sm btn-yellow" onClick={() => setActive(p)}><Star size={12} /> Review</button>
        </div>
      ))}
      <Modal open={Boolean(active)} title={`Review ${active?.title || ''}`} onClose={() => setActive(null)}>
        {active && <ReviewForm bookingId={active.bookingId} itemId={active.itemId} onDone={() => { setActive(null); toast.success('Thanks for your review!'); onDone(); }} />}
      </Modal>
    </div>
  );
}

export function ReviewsPage() {
  const { data, loading, reload } = useApi('/reviews/pending');
  if (loading) return <Spinner />;
  return data?.length ? <PendingReviews items={data} onDone={reload} /> : <EmptyState icon={Star} title="No reviews waiting">After a trip is completed you can review each hotel, cab and package from it.</EmptyState>;
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { destinations } = useTrip();
  const { currencies, setCurrency, languages, setLang } = useApp();
  const toast = useToast();
  const [form, setForm] = useState({
    fullName: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    homeCity: user.homeCity || '',
    bio: user.bio || '',
    preferences: { ...user.preferences }
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});

  const save = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', form);
      setUser(res.data.user);
      if (form.preferences.currency) setCurrency(form.preferences.currency);
      if (form.preferences.language) setLang(form.preferences.language);
      toast.success('Profile updated');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const setPref = (k) => (e) => setForm({ ...form, preferences: { ...form.preferences, [k]: e.target.value } });

  return (
    <div className="stack">
      <form className="card" onSubmit={save}>
        <h2 className="section-title">Profile</h2>
        <div className="form-grid">
          <Field label="Full name" error={errors.fullName}><input className="form-control" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email"><input className="form-control" value={user.email} disabled /></Field>
          <Field label="Phone"><input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Home city" hint="Default starting point in the planner">
            <select className="form-control" value={form.homeCity} onChange={(e) => setForm({ ...form, homeCity: e.target.value })}>
              <option value="">—</option>
              {destinations.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>
        <Field label="Address"><input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="About you"><textarea className="form-control" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
        <h3 className="section-title" style={{ fontSize: 15 }}>Preferences</h3>
        <div className="form-grid">
          <Field label="Travel mode"><select className="form-control" value={form.preferences.preferredTravelMode || ''} onChange={setPref('preferredTravelMode')}>{['Train', 'Bus', 'Flight', 'Private Car'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Food"><select className="form-control" value={form.preferences.dietaryPreference || ''} onChange={setPref('dietaryPreference')}>{['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Budget"><select className="form-control" value={form.preferences.budgetRange || ''} onChange={setPref('budgetRange')}>{['Budget', 'Moderate', 'Luxury'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Currency"><select className="form-control" value={form.preferences.currency || 'INR'} onChange={setPref('currency')}>{Object.keys(currencies).map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Language"><select className="form-control" value={form.preferences.language || 'en'} onChange={setPref('language')}>{Object.entries(languages).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        <button type="submit" className="btn btn-primary">Save profile</button>
      </form>

      <form className="card" onSubmit={changePassword}>
        <h2 className="section-title">Password</h2>
        <div className="form-grid">
          <Field label="Current password"><input type="password" className="form-control" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="New password" hint="At least 8 characters"><input type="password" className="form-control" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field>
        </div>
        <button type="submit" className="btn btn-outline">Change password</button>
        <p className="small muted" style={{ marginTop: 8 }}>Changing your password signs out your other devices.</p>
      </form>
    </div>
  );
}
