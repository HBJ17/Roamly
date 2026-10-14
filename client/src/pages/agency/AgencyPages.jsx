import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Wallet, CalendarCheck, Star, MessageCircle, Plus, Pencil, Archive, RotateCcw, QrCode, CheckCircle2, XCircle, Landmark, Hourglass } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api, { errorMessage, fieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import BarChart, { monthLabel } from '../../components/portal/BarChart';
import { HotelForm, TransportForm, PackageForm } from './ListingForms';
import { Spinner, EmptyState, StatusBadge, Pagination, Modal, Field, Stars, Tabs, formatDate, formatDateTime } from '../../components/ui';

const LISTING_KIND = {
  'Hotel Partner': { endpoint: '/hotels', label: 'Hotels', type: 'hotel' },
  'Cab Operator': { endpoint: '/transports', label: 'Cabs', type: 'local' },
  'Intercity Transit': { endpoint: '/transports', label: 'Routes', type: 'intercity' },
  'Tour Operator': { endpoint: '/packages', label: 'Packages', type: 'package' }
};

export const useAgencyCity = () => {
  const { user } = useAuth();
  const { findDestination } = useTrip();
  const slug = user.cityName ? user.cityName.toLowerCase() : '';
  return { city: user.cityName, slug: findDestination(slug)?.slug || slug };
};

export function PendingBanner() {
  const { user } = useAuth();
  if (user.agencyStatus === 'Active') return null;
  return (
    <div className="alert alert-warning">
      <Hourglass size={15} />
      {user.agencyStatus === 'Pending'
        ? 'Your application is being reviewed. Complete your profile and bank details meanwhile — listings unlock once approved.'
        : 'Your partner account is suspended. Contact partners@roamly.travel.'}
    </div>
  );
}

export function AgencyDashboard() {
  const { user } = useAuth();
  const { formatCurrency } = useApp();
  const { data, loading, error } = useApi(user.agencyStatus === 'Active' ? '/agency/dashboard' : null);
  if (user.agencyStatus !== 'Active') return <PendingBanner />;
  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="stack">
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-card-label"><Wallet size={13} /> Available balance</div><div className="stat-card-val">{formatCurrency(data.wallet.balance)}</div><Link className="link small" to="/agency/payouts">Request payout</Link></div>
        <div className="stat-card"><div className="stat-card-label">Lifetime earnings</div><div className="stat-card-val">{formatCurrency(data.wallet.totalEarnings)}</div><span className="small muted">{formatCurrency(data.pendingPayout)} payout pending</span></div>
        <div className="stat-card"><div className="stat-card-label"><CalendarCheck size={13} /> Upcoming bookings</div><div className="stat-card-val">{data.bookings.confirmed}</div><span className="small muted">{data.bookings.completed} completed</span></div>
        <div className="stat-card"><div className="stat-card-label"><Star size={13} /> Rating</div><div className="stat-card-val">{data.rating.average || '–'}</div><span className="small muted">{data.rating.count} reviews · {data.rating.unanswered} to answer</span></div>
        <div className="stat-card"><div className="stat-card-label"><MessageCircle size={13} /> Unread messages</div><div className="stat-card-val">{data.unreadMessages}</div><Link className="link small" to="/agency/messages">Open inbox</Link></div>
      </div>
      <div className="card">
        <h2 className="section-title">Net earnings, last 6 months</h2>
        <BarChart data={data.monthlyEarnings.map((m) => ({ label: monthLabel(m.month), value: m.net }))} format={(v) => formatCurrency(v)} />
      </div>
      <div className="card">
        <div className="row-between"><h2 className="section-title">Arriving in the next 14 days</h2><Link className="link small" to="/agency/check-in">Check a guest in</Link></div>
        {data.upcoming.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Guest</th><th>Booked</th><th>Ref</th></tr></thead>
              <tbody>
                {data.upcoming.map((b) => (
                  <tr key={b._id}>
                    <td>{formatDate(b.startDate)}</td>
                    <td>{b.user?.fullName}<div className="small muted">{b.user?.phone}</div></td>
                    <td>{b.items.map((i) => i.description).join('; ')}</td>
                    <td>{b.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No arrivals in the next two weeks.</p>}
      </div>
    </div>
  );
}

export function AgencyListings() {
  const { user } = useAuth();
  const { city, slug } = useAgencyCity();
  const kind = LISTING_KIND[user.agencyType];
  const { data, loading, reload } = useApi(`${kind.endpoint}/mine`);
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const { formatCurrency } = useApp();
  if (user.agencyStatus !== 'Active') return <PendingBanner />;

  const toggle = async (item) => {
    try {
      if (item.isActive) await api.delete(`${kind.endpoint}/${item._id}`);
      else await api.put(`${kind.endpoint}/${item._id}`, { isActive: true });
      toast.success(item.isActive ? 'Listing archived' : 'Listing restored');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onSaved = () => {
    setEditing(null);
    reload();
  };

  const formFor = (existing) => {
    if (kind.type === 'hotel') return <HotelForm existing={existing} city={city} onSaved={onSaved} />;
    if (kind.type === 'package') return <PackageForm existing={existing} city={city} citySlug={slug} onSaved={onSaved} />;
    return <TransportForm existing={existing} city={city} intercity={kind.type === 'intercity'} onSaved={onSaved} />;
  };

  const price = (x) => (kind.type === 'hotel' ? `${formatCurrency(x.startingPrice)}+ / night` : kind.type === 'package' ? `${formatCurrency(x.price)} / person` : kind.type === 'local' ? `${formatCurrency(x.dailyRate)} / day` : `${formatCurrency(x.fare)} / seat`);

  return (
    <div className="stack">
      <div className="row-between">
        <h2 className="section-title" style={{ marginBottom: 0 }}>{kind.label}{city ? ` in ${city}` : ''}</h2>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={14} /> Add {kind.label.slice(0, -1).toLowerCase()}</button>
      </div>
      {loading ? <Spinner /> : data?.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Listing</th><th>Price</th><th>Rating</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.map((x) => (
                <tr key={x._id}>
                  <td><b>{x.name || x.title}</b><div className="small muted">{x.scope === 'intercity' ? `${x.originName} → ${x.destinationName} · ${x.departureTime}` : x.destinationName}</div></td>
                  <td>{price(x)}</td>
                  <td><Stars value={x.rating} count={x.reviewCount} /></td>
                  <td><StatusBadge status={x.isActive ? 'Active' : 'Hidden'} /></td>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <button type="button" className="icon-btn" onClick={() => setEditing(x)} aria-label="Edit"><Pencil size={14} /></button>
                      <button type="button" className="icon-btn" onClick={() => toggle(x)} aria-label={x.isActive ? 'Archive' : 'Restore'}>{x.isActive ? <Archive size={14} /> : <RotateCcw size={14} />}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No listings yet" action={<button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>Create your first listing</button>} />}
      <Modal open={Boolean(editing)} title={editing === 'new' ? `New ${kind.label.slice(0, -1).toLowerCase()}` : `Edit ${editing?.name || editing?.title || ''}`} onClose={() => setEditing(null)} width={820}>
        {editing && formFor(editing === 'new' ? null : editing)}
      </Modal>
    </div>
  );
}

export function AgencyBookings() {
  const { user } = useAuth();
  const { formatCurrency } = useApp();
  const toast = useToast();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(params.get('q') ? '' : 'Confirmed');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(params.get('q') || '');
  const { body, loading, reload } = useApi(user.agencyStatus === 'Active' ? '/agency/bookings' : null, { params: { status: status || undefined, page, q: q || undefined } });
  if (user.agencyStatus !== 'Active') return <PendingBanner />;

  const cancel = async (b) => {
    const reason = window.prompt(`Cancel ${b.reference}? The traveller gets a full refund. Reason:`);
    if (reason === null) return;
    try {
      await api.put(`/bookings/${b._id}/cancel`, { reason });
      toast.success('Booking cancelled and refunded');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="stack">
      <Tabs tabs={[{ id: 'Confirmed', label: 'Upcoming' }, { id: 'Completed', label: 'Completed' }, { id: 'Cancelled', label: 'Cancelled' }, { id: '', label: 'All' }]} active={status} onChange={(s) => { setStatus(s); setPage(1); }} />
      <div className="toolbar"><input className="form-control" placeholder="Search by reference (RML-…)" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
      {loading ? <Spinner /> : body?.data?.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Dates</th><th>Guest</th><th>Your items</th><th>Your share</th><th>Status</th><th /></tr></thead>
            <tbody>
              {body.data.map((b) => (
                <tr key={b._id}>
                  <td>{b.reference}</td>
                  <td>{formatDate(b.startDate)}</td>
                  <td>{b.contact?.name || b.user?.fullName}<div className="small muted">{b.contact?.phone}</div></td>
                  <td className="small">{b.items.map((i) => <div key={i._id}>{i.title}: {i.description}</div>)}</td>
                  <td>{formatCurrency(b.partnerTotal)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>{b.status === 'Confirmed' && <button type="button" className="btn btn-sm btn-danger" onClick={() => cancel(b)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon={CalendarCheck} title="No bookings here yet" />}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
    </div>
  );
}

export function AgencyCheckIn() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const res = await api.post('/agency/vouchers/verify', { code });
      setResult(res.data.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <form className="card" onSubmit={verify}>
        <h2 className="section-title"><QrCode size={18} /> Verify a voucher</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>Scan the traveller's QR with any scanner app and paste the text here, or type it in.</p>
        <Field label="Voucher code"><input className="form-control" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="ROAMLY|RML-…" /></Field>
        <button type="submit" className="btn btn-primary">Verify</button>
      </form>
      {error && <div className="alert alert-danger"><XCircle size={15} /> {error}</div>}
      {result && (
        <div className={`card`} style={{ background: result.valid ? 'var(--pastel-mint-light)' : 'var(--pastel-pink-light)' }}>
          <h3>{result.valid ? <><CheckCircle2 size={18} /> Valid booking</> : <><XCircle size={18} /> Booking is {result.status}</>}</h3>
          <p style={{ margin: '8px 0' }}><b>{result.traveller}</b> · {result.phone} · {result.travelers.adults} adults{result.travelers.children ? `, ${result.travelers.children} children` : ''}</p>
          {result.items.map((i) => <p key={i._id} className="small">{i.title}: {i.description} ({formatDate(i.startDate)})</p>)}
          <p className="small muted">Ref {result.reference}</p>
        </div>
      )}
    </div>
  );
}

export function AgencyReviews() {
  const [unanswered, setUnanswered] = useState(false);
  const { data, loading, reload } = useApi('/reviews/agency', { params: { unanswered: unanswered || undefined } });
  const [replying, setReplying] = useState(null);
  const [message, setMessage] = useState('');
  const toast = useToast();

  const reply = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reviews/${replying._id}/reply`, { message });
      setReplying(null);
      setMessage('');
      toast.success('Reply posted');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="stack">
      <label className="checkbox"><input type="checkbox" checked={unanswered} onChange={(e) => setUnanswered(e.target.checked)} /> Only show reviews without a reply</label>
      {loading ? <Spinner /> : data?.length ? data.map((r) => (
        <div key={r._id} className="card" style={{ padding: 16 }}>
          <div className="row-between"><b>{r.title}</b><Stars value={r.rating} /></div>
          <p className="small muted">{r.itemTitle} · {r.user?.fullName} · {formatDate(r.createdAt)}</p>
          <p style={{ margin: '6px 0' }}>{r.comment}</p>
          {r.agencyReply?.message ? <div className="review-reply"><b>Your reply:</b> {r.agencyReply.message}</div> : (
            <button type="button" className="btn btn-sm btn-yellow" onClick={() => { setReplying(r); setMessage(''); }}>Reply publicly</button>
          )}
        </div>
      )) : <EmptyState icon={Star} title="No reviews yet" />}
      <Modal open={Boolean(replying)} title="Reply to review" onClose={() => setReplying(null)}>
        <form onSubmit={reply}>
          <p className="small muted" style={{ marginBottom: 8 }}>“{replying?.comment}”</p>
          <Field label="Your public reply"><textarea className="form-control" rows={4} required minLength={2} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
          <button type="submit" className="btn btn-primary">Post reply</button>
        </form>
      </Modal>
    </div>
  );
}

export function AgencyPayouts() {
  const { formatCurrency } = useApp();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const earnings = useApi('/agency/earnings', { params: { page } });
  const payouts = useApi('/agency/payouts');
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

  const request = async (e) => {
    e.preventDefault();
    try {
      await api.post('/agency/payouts', { amount: Number(amount) });
      toast.success('Payout requested');
      setAmount('');
      earnings.reload();
      payouts.reload();
    } catch (err) {
      toast.error(errorMessage(err));
      if (/bank/i.test(errorMessage(err))) navigate('/agency/profile');
    }
  };

  const e = earnings.body;
  return (
    <div className="stack">
      {e && (
        <div className="grid-2">
          <div className="stat-card">
            <div className="stat-card-label"><Wallet size={13} /> Available to withdraw</div>
            <div className="stat-card-val">{formatCurrency(e.wallet.balance)}</div>
            <span className="small muted">Roamly commission: {e.commissionPercent}% · {formatCurrency(e.wallet.pendingPayouts)} pending</span>
          </div>
          <form className="card" style={{ padding: 16 }} onSubmit={request}>
            <Field label="Request a payout" hint={`Minimum ${formatCurrency(e.minPayoutAmount)}`}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input type="number" className="form-control" min={e.minPayoutAmount} max={Math.floor(e.wallet.balance)} required value={amount} onChange={(ev) => setAmount(ev.target.value)} />
                <button type="submit" className="btn btn-primary"><Landmark size={14} /> Request</button>
              </div>
            </Field>
          </form>
        </div>
      )}
      <h2 className="section-title">Payout requests</h2>
      {payouts.data?.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Requested</th><th>Amount</th><th>Status</th><th>Reference / note</th></tr></thead>
            <tbody>{payouts.data.map((p) => (
              <tr key={p._id}><td>{formatDateTime(p.createdAt)}</td><td>{formatCurrency(p.amount)}</td><td><StatusBadge status={p.status} /></td><td className="small">{p.transferReference || p.adminNote || '—'}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="muted">No payout requests yet.</p>}
      <h2 className="section-title">Earnings ledger</h2>
      {earnings.loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Entry</th><th>Gross</th><th>Commission</th><th>Net</th></tr></thead>
            <tbody>{e?.data.map((t) => (
              <tr key={t._id}>
                <td>{formatDateTime(t.createdAt)}</td>
                <td>{t.description}</td>
                <td>{t.gross ? formatCurrency(t.gross) : '—'}</td>
                <td>{t.commission ? formatCurrency(t.commission) : '—'}</td>
                <td style={{ fontWeight: 700, color: t.net >= 0 ? 'var(--status-confirmed)' : 'var(--status-cancelled)' }}>{formatCurrency(t.net)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Pagination page={e?.page || 1} pages={e?.pages || 1} onChange={setPage} />
    </div>
  );
}

export function AgencyProfile() {
  const { refresh } = useAuth();
  const toast = useToast();
  const { data, loading } = useApi('/agency/profile');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  if (loading) return <Spinner />;
  const f = form || { name: data.name, phone: data.phone, address: data.address || '', description: data.description || '', gstin: data.gstin || '', bankDetails: { ...data.bankDetails } };
  const set = (k) => (e) => setForm({ ...f, [k]: e.target.value });
  const setBank = (k) => (e) => setForm({ ...f, bankDetails: { ...f.bankDetails, [k]: e.target.value } });

  const save = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const bank = Object.fromEntries(Object.entries(f.bankDetails).filter(([, v]) => v));
      await api.put('/agency/profile', { ...f, bankDetails: Object.keys(bank).length ? bank : undefined });
      toast.success('Profile saved');
      refresh();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    }
  };

  return (
    <form className="card" onSubmit={save}>
      <PendingBanner />
      <h2 className="section-title">Business profile</h2>
      <p className="small muted" style={{ marginBottom: 12 }}>{data.agencyType}{data.cityName ? ` in ${data.cityName}` : ''} · username {data.username}</p>
      <div className="form-grid">
        <Field label="Business name" error={errors.name}><input className="form-control" value={f.name} onChange={set('name')} /></Field>
        <Field label="Phone" error={errors.phone}><input className="form-control" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="GSTIN"><input className="form-control" value={f.gstin} onChange={set('gstin')} /></Field>
      </div>
      <Field label="Address"><input className="form-control" value={f.address} onChange={set('address')} /></Field>
      <Field label="About your business"><textarea className="form-control" rows={3} value={f.description} onChange={set('description')} /></Field>
      <h3 className="section-title" style={{ fontSize: 15 }}>Bank account for payouts</h3>
      <div className="form-grid">
        <Field label="Account holder"><input className="form-control" value={f.bankDetails.accountName || ''} onChange={setBank('accountName')} /></Field>
        <Field label="Account number" error={errors['bankDetails.accountNumber']}><input className="form-control" value={f.bankDetails.accountNumber || ''} onChange={setBank('accountNumber')} /></Field>
        <Field label="IFSC" error={errors['bankDetails.ifsc']}><input className="form-control" value={f.bankDetails.ifsc || ''} onChange={setBank('ifsc')} /></Field>
        <Field label="Bank"><input className="form-control" value={f.bankDetails.bankName || ''} onChange={setBank('bankName')} /></Field>
      </div>
      <button type="submit" className="btn btn-primary">Save</button>
    </form>
  );
}

export function AgencyBookingRedirect() {
  const { id } = useParams();
  const { data } = useApi(`/bookings/${id}`);
  const navigate = useNavigate();
  React.useEffect(() => {
    if (data) navigate(`/agency/bookings?q=${data.reference}`, { replace: true });
  }, [data, navigate]);
  return <Spinner />;
}
