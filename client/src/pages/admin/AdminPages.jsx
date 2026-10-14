import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, Users, Building2, Landmark, Hotel, Car, Package, Plus, Pencil, Trash2, Check, Ban, Eye, EyeOff } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api, { errorMessage, fieldErrors } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import BarChart, { monthLabel } from '../../components/portal/BarChart';
import { Spinner, EmptyState, StatusBadge, Pagination, Modal, Field, Stars, Tabs, formatDate, formatDateTime } from '../../components/ui';

const useAction = (reload) => {
  const toast = useToast();
  return async (fn, success) => {
    try {
      await fn();
      if (success) toast.success(success);
      reload?.();
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  };
};

export function AdminDashboard() {
  const { data, loading } = useApi('/admin/dashboard');
  const { formatCurrency } = useApp();
  if (loading) return <Spinner />;
  const c = data.counts;
  return (
    <div className="stack">
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-card-label"><IndianRupee size={13} /> Gross bookings (GMV)</div><div className="stat-card-val">{formatCurrency(data.gmv)}</div><span className="small muted">{data.paidBookings} paid bookings</span></div>
        <div className="stat-card"><div className="stat-card-label">Commission earned</div><div className="stat-card-val">{formatCurrency(data.commissionEarned)}</div><span className="small muted">GST collected {formatCurrency(data.gstCollected)}</span></div>
        <div className="stat-card"><div className="stat-card-label"><Users size={13} /> Travellers</div><div className="stat-card-val">{c.users}</div></div>
        <div className="stat-card"><div className="stat-card-label"><Building2 size={13} /> Partners</div><div className="stat-card-val">{c.activeAgencies}</div>{c.pendingAgencies > 0 && <Link className="link small" to="/admin/agencies?status=Pending">{c.pendingAgencies} awaiting approval</Link>}</div>
        <div className="stat-card"><div className="stat-card-label"><Landmark size={13} /> Payouts to process</div><div className="stat-card-val">{c.pendingPayouts}</div><Link className="link small" to="/admin/payouts">Review</Link></div>
        <div className="stat-card"><div className="stat-card-label">Live inventory</div><div className="small" style={{ marginTop: 6 }}><Hotel size={12} /> {c.hotels} hotels · <Car size={12} /> {c.transports} transports · <Package size={12} /> {c.packages} packages</div></div>
      </div>
      <div className="card">
        <h2 className="section-title">GMV by month</h2>
        <BarChart data={data.monthly.map((m) => ({ label: monthLabel(m.month), value: m.gmv }))} format={(v) => formatCurrency(v)} />
      </div>
      <div className="grid-2">
        <div className="card">
          <h2 className="section-title">Top destinations</h2>
          {data.byDestination.map((d) => (
            <div key={d.destination} className="row-between small" style={{ padding: '6px 0', borderBottom: '1px dashed #ccc' }}>
              <b>{d.destination}</b><span>{d.bookings} bookings · {formatCurrency(d.gmv)}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="section-title">Bookings by status</h2>
          {Object.entries(data.byStatus).map(([s, n]) => <div key={s} className="row-between small" style={{ padding: '6px 0' }}><StatusBadge status={s} /><b>{n}</b></div>)}
        </div>
      </div>
      <div className="card">
        <div className="row-between"><h2 className="section-title">Latest bookings</h2><Link className="link small" to="/admin/bookings">All bookings</Link></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Traveller</th><th>City</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{data.recent.map((b) => <tr key={b._id}><td>{b.reference}</td><td>{b.user?.fullName}</td><td>{b.destinationName}</td><td>{formatCurrency(b.pricing.total)}</td><td><StatusBadge status={b.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminAgencies() {
  const initial = new URLSearchParams(window.location.search).get('status') || '';
  const [filters, setFilters] = useState({ status: initial, type: '', q: '' });
  const [page, setPage] = useState(1);
  const { body, loading, reload } = useApi('/admin/agencies', { params: { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page } });
  const act = useAction(reload);
  const [editing, setEditing] = useState(null);

  const setStatus = (a, status) => {
    const reason = status === 'Suspended' ? window.prompt('Reason shown to the partner:') : '';
    if (reason === null) return;
    act(() => api.put(`/admin/agencies/${a._id}`, { status, rejectionReason: reason || '' }), `${a.name} is now ${status}`);
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <select className="form-control" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}><option value="">All statuses</option><option>Pending</option><option>Active</option><option>Suspended</option></select>
        <select className="form-control" value={filters.type} onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}><option value="">All types</option>{['Hotel Partner', 'Cab Operator', 'Intercity Transit', 'Tour Operator'].map((t) => <option key={t}>{t}</option>)}</select>
        <input className="form-control" placeholder="Search name, username, email" value={filters.q} onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1); }} />
      </div>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Partner</th><th>Type</th><th>City</th><th>Commission</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {body.data.map((a) => (
                <tr key={a._id}>
                  <td><b>{a.name}</b><div className="small muted">{a.username} · {a.email} · {a.phone}</div></td>
                  <td>{a.agencyType}</td>
                  <td>{a.cityName || 'Intercity'}</td>
                  <td>{a.commissionPercent ?? 'Default'}{a.commissionPercent !== undefined && a.commissionPercent !== null ? '%' : ''}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      {a.status !== 'Active' && <button type="button" className="btn btn-sm btn-mint" onClick={() => setStatus(a, 'Active')}><Check size={12} /> Approve</button>}
                      {a.status === 'Active' && <button type="button" className="btn btn-sm btn-danger" onClick={() => setStatus(a, 'Suspended')}><Ban size={12} /> Suspend</button>}
                      <button type="button" className="icon-btn" onClick={() => setEditing(a)} aria-label="Commission"><Pencil size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
      <Modal open={Boolean(editing)} title={`Commission for ${editing?.name || ''}`} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={async (e) => { e.preventDefault(); const v = e.target.commission.value; if (await act(() => api.put(`/admin/agencies/${editing._id}`, { commissionPercent: Number(v) }), 'Commission updated')) setEditing(null); }}>
            <Field label="Commission %" hint="Overrides the platform default for this partner"><input name="commission" type="number" min={0} max={50} step="0.5" className="form-control" defaultValue={editing.commissionPercent ?? 10} /></Field>
            <button type="submit" className="btn btn-primary">Save</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function AdminUsers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { body, loading, reload } = useApi('/admin/users', { params: { q: q || undefined, page } });
  const act = useAction(reload);
  const { formatCurrency } = useApp();
  const [adjusting, setAdjusting] = useState(null);

  return (
    <div className="stack">
      <div className="toolbar"><input className="form-control" placeholder="Search travellers" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Traveller</th><th>Joined</th><th>Wallet</th><th>Points</th><th>Status</th><th /></tr></thead>
            <tbody>
              {body.data.map((u) => (
                <tr key={u._id}>
                  <td><b>{u.fullName}</b><div className="small muted">{u.username} · {u.email}</div></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{formatCurrency(u.walletBalance)}</td>
                  <td>{u.loyaltyPoints}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => setAdjusting(u)}>Wallet</button>
                      <button type="button" className={`btn btn-sm ${u.status === 'Active' ? 'btn-danger' : 'btn-mint'}`} onClick={() => act(() => api.put(`/admin/users/${u._id}`, { status: u.status === 'Active' ? 'Suspended' : 'Active' }), 'User updated')}>
                        {u.status === 'Active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
      <Modal open={Boolean(adjusting)} title={`Adjust wallet: ${adjusting?.fullName || ''}`} onClose={() => setAdjusting(null)}>
        {adjusting && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            if (await act(() => api.post(`/admin/users/${adjusting._id}/wallet`, { type: fd.get('type'), amount: Number(fd.get('amount')), reason: fd.get('reason') }), 'Wallet adjusted')) setAdjusting(null);
          }}>
            <div className="form-grid">
              <Field label="Type"><select name="type" className="form-control"><option value="credit">Credit</option><option value="debit">Debit</option></select></Field>
              <Field label="Amount (₹)"><input name="amount" type="number" min={1} required className="form-control" /></Field>
            </div>
            <Field label="Reason (shown to the traveller)"><input name="reason" required minLength={3} className="form-control" /></Field>
            <button type="submit" className="btn btn-primary">Apply</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function AdminListings() {
  const { destinations } = useTrip();
  const [type, setType] = useState('hotel');
  const [filters, setFilters] = useState({ destination: '', active: '', q: '' });
  const [page, setPage] = useState(1);
  const { body, loading, reload } = useApi('/admin/listings', { params: { type, page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) } });
  const act = useAction(reload);
  const { formatCurrency } = useApp();
  const link = { hotel: 'hotels', transport: 'transports', package: 'packages' }[type];

  const toggle = (x) => {
    const reason = x.isActive ? window.prompt('Reason for taking this listing offline (sent to the partner):') : '';
    if (reason === null) return;
    act(() => api.put(`/admin/listings/${type}/${x._id}`, { isActive: !x.isActive, reason }), x.isActive ? 'Listing disabled' : 'Listing restored');
  };

  return (
    <div className="stack">
      <Tabs tabs={[{ id: 'hotel', label: 'Hotels', icon: Hotel }, { id: 'transport', label: 'Transport', icon: Car }, { id: 'package', label: 'Packages', icon: Package }]} active={type} onChange={(t) => { setType(t); setPage(1); }} />
      <div className="toolbar">
        <select className="form-control" value={filters.destination} onChange={(e) => setFilters({ ...filters, destination: e.target.value })}><option value="">All cities</option>{destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select>
        <select className="form-control" value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })}><option value="">Live & hidden</option><option value="true">Live</option><option value="false">Hidden</option></select>
        <input className="form-control" placeholder="Search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
      </div>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Listing</th><th>City</th><th>Partner</th><th>Price</th><th>Rating</th><th>Status</th><th /></tr></thead>
            <tbody>
              {body.data.map((x) => (
                <tr key={x._id}>
                  <td><Link className="link" to={`/${link}/${x._id}`}>{x.name || x.title}</Link>{x.scope === 'intercity' && <div className="small muted">{x.originName} → {x.destinationName}</div>}</td>
                  <td>{x.destinationName}</td>
                  <td>{x.agency?.name}</td>
                  <td>{formatCurrency(x.startingPrice || x.price || x.dailyRate || x.fare)}</td>
                  <td><Stars value={x.rating} count={x.reviewCount} /></td>
                  <td><StatusBadge status={x.isActive ? 'Active' : 'Hidden'} /></td>
                  <td><button type="button" className="icon-btn" onClick={() => toggle(x)} aria-label={x.isActive ? 'Disable' : 'Restore'}>{x.isActive ? <EyeOff size={14} /> : <Eye size={14} />}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
    </div>
  );
}

export function AdminBookings() {
  const { destinations } = useTrip();
  const { formatCurrency } = useApp();
  const [filters, setFilters] = useState({ status: '', type: '', destination: '', q: '' });
  const [page, setPage] = useState(1);
  const { body, loading, reload } = useApi('/admin/bookings', { params: { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) } });
  const act = useAction(reload);
  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };

  const cancel = (b) => {
    const reason = window.prompt(`Cancel ${b.reference} with a full refund? Reason:`);
    if (reason !== null) act(() => api.put(`/bookings/${b._id}/cancel`, { reason }), 'Booking cancelled');
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <select className="form-control" value={filters.status} onChange={set('status')}><option value="">All statuses</option>{['PendingPayment', 'Confirmed', 'Completed', 'Cancelled', 'Expired'].map((s) => <option key={s}>{s}</option>)}</select>
        <select className="form-control" value={filters.type} onChange={set('type')}><option value="">All types</option>{['hotel', 'transport', 'package', 'trip'].map((s) => <option key={s}>{s}</option>)}</select>
        <select className="form-control" value={filters.destination} onChange={set('destination')}><option value="">All cities</option>{destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select>
        <input className="form-control" placeholder="Reference" value={filters.q} onChange={set('q')} />
      </div>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Traveller</th><th>City · type</th><th>Dates</th><th>Total</th><th>Status</th><th /></tr></thead>
            <tbody>
              {body.data.map((b) => (
                <tr key={b._id}>
                  <td>{b.reference}<div className="small muted">{formatDateTime(b.createdAt)}</div></td>
                  <td>{b.user?.fullName}<div className="small muted">{b.user?.email}</div></td>
                  <td>{b.destinationName} · {b.bookingType}<div className="small muted">{b.items.length} item(s)</div></td>
                  <td>{formatDate(b.startDate)}</td>
                  <td>{formatCurrency(b.pricing.total)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>{b.status === 'Confirmed' && <button type="button" className="btn btn-sm btn-danger" onClick={() => cancel(b)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
    </div>
  );
}

const ATTRACTION_CATEGORIES = ['Temple', 'Heritage', 'Nature', 'Viewpoint', 'Lake', 'Beach', 'Museum', 'Market', 'Wildlife', 'Adventure', 'Food', 'Park', 'Waterfall', 'Activity'];

function DestinationForm({ existing, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(() => ({
    name: existing?.name || '',
    state: existing?.state || 'Tamil Nadu',
    tagline: existing?.tagline || '',
    description: existing?.description || '',
    categories: (existing?.categories || []).join(', '),
    bestTimeToVisit: existing?.bestTimeToVisit || 'October to March',
    idealDays: existing?.idealDays || 3,
    nearestAirport: existing?.nearestAirport || '',
    nearestRailway: existing?.nearestRailway || '',
    imageUrl: existing?.imageUrl || '',
    lat: existing?.coordinates?.lat ?? '',
    lng: existing?.coordinates?.lng ?? '',
    isActive: existing?.isActive ?? true,
    attractions: (existing?.attractions || []).map(({ name, category, description, durationHours, entryFee, bestTimeOfDay, coordinates }) => ({ name, category, description, durationHours, entryFee, bestTimeOfDay, coordinates }))
  }));
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setA = (i, k, v) => setF({ ...f, attractions: f.attractions.map((a, j) => (j === i ? { ...a, [k]: v } : a)) });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...f,
      categories: f.categories.split(',').map((c) => c.trim()).filter(Boolean),
      idealDays: Number(f.idealDays),
      imageUrl: f.imageUrl || '',
      coordinates: { lat: Number(f.lat), lng: Number(f.lng) },
      attractions: f.attractions.map((a) => ({ ...a, durationHours: Number(a.durationHours), entryFee: Number(a.entryFee), coordinates: a.coordinates?.lat ? a.coordinates : undefined }))
    };
    delete payload.lat;
    delete payload.lng;
    try {
      if (existing) await api.put(`/destinations/${existing._id}`, payload);
      else await api.post('/destinations', payload);
      toast.success('Destination saved');
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <Field label="Name" error={errors.name}><input className="form-control" required value={f.name} onChange={set('name')} /></Field>
        <Field label="State"><input className="form-control" required value={f.state} onChange={set('state')} /></Field>
        <Field label="Latitude" error={errors['coordinates.lat']}><input type="number" step="any" className="form-control" required value={f.lat} onChange={set('lat')} /></Field>
        <Field label="Longitude" error={errors['coordinates.lng']}><input type="number" step="any" className="form-control" required value={f.lng} onChange={set('lng')} /></Field>
        <Field label="Best time"><input className="form-control" value={f.bestTimeToVisit} onChange={set('bestTimeToVisit')} /></Field>
        <Field label="Ideal days"><input type="number" min={1} className="form-control" value={f.idealDays} onChange={set('idealDays')} /></Field>
        <Field label="Nearest airport"><input className="form-control" value={f.nearestAirport} onChange={set('nearestAirport')} /></Field>
        <Field label="Nearest railway"><input className="form-control" value={f.nearestRailway} onChange={set('nearestRailway')} /></Field>
      </div>
      <Field label="Tagline"><input className="form-control" value={f.tagline} onChange={set('tagline')} /></Field>
      <Field label="Description" error={errors.description}><textarea className="form-control" rows={3} required minLength={20} value={f.description} onChange={set('description')} /></Field>
      <div className="form-grid">
        <Field label="Categories" hint="Comma separated"><input className="form-control" value={f.categories} onChange={set('categories')} /></Field>
        <Field label="Hero image URL"><input className="form-control" value={f.imageUrl} onChange={set('imageUrl')} /></Field>
      </div>
      <label className="checkbox" style={{ marginBottom: 12 }}><input type="checkbox" checked={f.isActive} onChange={set('isActive')} /> Visible to travellers</label>
      <h3 className="section-title" style={{ fontSize: 15 }}>Attractions</h3>
      {f.attractions.map((a, i) => (
        <div key={i} className="card" style={{ padding: 10, marginBottom: 8 }}>
          <div className="form-grid">
            <Field label="Name"><input className="form-control" required value={a.name} onChange={(e) => setA(i, 'name', e.target.value)} /></Field>
            <Field label="Category"><select className="form-control" value={a.category} onChange={(e) => setA(i, 'category', e.target.value)}>{ATTRACTION_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Hours"><input type="number" step="0.5" min={0.5} className="form-control" value={a.durationHours} onChange={(e) => setA(i, 'durationHours', e.target.value)} /></Field>
            <Field label="Entry ₹"><input type="number" min={0} className="form-control" value={a.entryFee} onChange={(e) => setA(i, 'entryFee', e.target.value)} /></Field>
            <Field label="Best time"><select className="form-control" value={a.bestTimeOfDay} onChange={(e) => setA(i, 'bestTimeOfDay', e.target.value)}>{['Morning', 'Afternoon', 'Evening', 'Any'].map((c) => <option key={c}>{c}</option>)}</select></Field>
          </div>
          <div className="row-between">
            <input className="form-control" style={{ flex: 1 }} placeholder="Short description" value={a.description} onChange={(e) => setA(i, 'description', e.target.value)} />
            <button type="button" className="icon-btn" onClick={() => setF({ ...f, attractions: f.attractions.filter((_, j) => j !== i) })} aria-label="Remove"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-outline" onClick={() => setF({ ...f, attractions: [...f.attractions, { name: '', category: 'Heritage', description: '', durationHours: 2, entryFee: 0, bestTimeOfDay: 'Any' }] })}><Plus size={12} /> Add attraction</button>
      <hr className="divider" />
      <button type="submit" className="btn btn-primary">Save destination</button>
    </form>
  );
}

export function AdminDestinations() {
  const { data, loading, reload } = useApi('/destinations');
  const [editing, setEditing] = useState(null);
  const [full, setFull] = useState(null);

  const open = async (d) => {
    const res = await api.get(`/destinations/${d.slug}`);
    setFull(res.data.data);
    setEditing(d);
  };

  return (
    <div className="stack">
      <div className="row-between"><h2 className="section-title" style={{ marginBottom: 0 }}>Destinations</h2><button type="button" className="btn btn-primary" onClick={() => { setFull(null); setEditing('new'); }}><Plus size={14} /> Add destination</button></div>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>City</th><th>Sights</th><th>Hotels</th><th>Cabs</th><th>Packages</th><th /></tr></thead>
            <tbody>{data.map((d) => (
              <tr key={d._id}>
                <td><Link className="link" to={`/destinations/${d.slug}`}>{d.name}</Link><div className="small muted">{d.state}</div></td>
                <td>{d.attractionCount}</td><td>{d.stats.hotels}</td><td>{d.stats.cabs}</td><td>{d.stats.packages}</td>
                <td><button type="button" className="icon-btn" onClick={() => open(d)} aria-label="Edit"><Pencil size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Modal open={Boolean(editing)} title={editing === 'new' ? 'New destination' : `Edit ${editing?.name}`} onClose={() => setEditing(null)} width={860}>
        {editing && (editing === 'new' || full) && <DestinationForm existing={editing === 'new' ? null : full} onSaved={() => { setEditing(null); reload(); }} />}
      </Modal>
    </div>
  );
}

export function AdminCoupons() {
  const { data, loading, reload } = useApi('/admin/coupons');
  const act = useAction(reload);
  const { formatCurrency } = useApp();
  const [editing, setEditing] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const payload = {
      ...fd,
      discountValue: Number(fd.discountValue),
      minOrderAmount: Number(fd.minOrderAmount),
      maxDiscountAmount: Number(fd.maxDiscountAmount),
      usageLimit: Number(fd.usageLimit),
      perUserLimit: Number(fd.perUserLimit),
      isActive: fd.isActive === 'on'
    };
    const ok = await act(() => (editing === 'new' ? api.post('/admin/coupons', payload) : api.put(`/admin/coupons/${editing._id}`, payload)), 'Coupon saved');
    if (ok) setEditing(null);
  };

  const c = editing && editing !== 'new' ? editing : {};
  return (
    <div className="stack">
      <div className="row-between"><h2 className="section-title" style={{ marginBottom: 0 }}>Promo codes</h2><button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={14} /> New code</button></div>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Applies to</th><th>Used</th><th>Valid until</th><th>Status</th><th /></tr></thead>
            <tbody>{data.map((x) => (
              <tr key={x._id}>
                <td><b>{x.code}</b><div className="small muted">{x.description}</div></td>
                <td>{x.discountType === 'percent' ? `${x.discountValue}% (max ${formatCurrency(x.maxDiscountAmount)})` : formatCurrency(x.discountValue)}<div className="small muted">min {formatCurrency(x.minOrderAmount)}</div></td>
                <td>{x.applicableTo}</td>
                <td>{x.timesUsed} / {x.usageLimit}</td>
                <td>{formatDate(x.validUntil)}</td>
                <td><StatusBadge status={x.isActive ? 'Active' : 'Hidden'} /></td>
                <td><div className="row" style={{ flexWrap: 'nowrap' }}>
                  <button type="button" className="icon-btn" onClick={() => setEditing(x)} aria-label="Edit"><Pencil size={14} /></button>
                  <button type="button" className="icon-btn" onClick={() => window.confirm(`Remove ${x.code}?`) && act(() => api.delete(`/admin/coupons/${x._id}`), 'Coupon removed')} aria-label="Delete"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Modal open={Boolean(editing)} title={editing === 'new' ? 'New promo code' : `Edit ${c.code}`} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={save}>
            <div className="form-grid">
              <Field label="Code"><input name="code" className="form-control" required defaultValue={c.code} pattern="[A-Za-z0-9]{3,20}" /></Field>
              <Field label="Type"><select name="discountType" className="form-control" defaultValue={c.discountType || 'percent'}><option value="percent">Percent</option><option value="fixed">Fixed ₹</option></select></Field>
              <Field label="Value"><input name="discountValue" type="number" min={1} className="form-control" required defaultValue={c.discountValue || 10} /></Field>
              <Field label="Max discount ₹"><input name="maxDiscountAmount" type="number" min={0} className="form-control" defaultValue={c.maxDiscountAmount ?? 2000} /></Field>
              <Field label="Min order ₹"><input name="minOrderAmount" type="number" min={0} className="form-control" defaultValue={c.minOrderAmount ?? 0} /></Field>
              <Field label="Applies to"><select name="applicableTo" className="form-control" defaultValue={c.applicableTo || 'all'}>{['all', 'package', 'hotel', 'transport', 'trip'].map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="Total uses"><input name="usageLimit" type="number" min={1} className="form-control" defaultValue={c.usageLimit ?? 100} /></Field>
              <Field label="Uses per traveller"><input name="perUserLimit" type="number" min={1} className="form-control" defaultValue={c.perUserLimit ?? 1} /></Field>
              <Field label="Valid until"><input name="validUntil" type="date" className="form-control" required defaultValue={c.validUntil ? c.validUntil.slice(0, 10) : ''} /></Field>
            </div>
            <Field label="Description"><input name="description" className="form-control" defaultValue={c.description} /></Field>
            <label className="checkbox" style={{ marginBottom: 12 }}><input name="isActive" type="checkbox" defaultChecked={c.isActive ?? true} /> Active</label>
            <button type="submit" className="btn btn-primary">Save</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function AdminPayouts() {
  const [status, setStatus] = useState('Pending');
  const { data, loading, reload } = useApi('/admin/payouts', { params: { status: status || undefined } });
  const act = useAction(reload);
  const { formatCurrency } = useApp();

  const process = (p, next) => {
    const ref = next === 'Paid' ? window.prompt('Bank transfer reference (UTR):') : window.prompt('Reason for rejecting:');
    if (!ref) return;
    act(() => api.put(`/admin/payouts/${p._id}`, next === 'Paid' ? { status: 'Paid', transferReference: ref } : { status: 'Rejected', adminNote: ref }), `Payout ${next.toLowerCase()}`);
  };

  return (
    <div className="stack">
      <Tabs tabs={[{ id: 'Pending', label: 'Pending' }, { id: 'Paid', label: 'Paid' }, { id: 'Rejected', label: 'Rejected' }, { id: '', label: 'All' }]} active={status} onChange={setStatus} />
      {loading ? <Spinner /> : data.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Partner</th><th>Amount</th><th>Bank</th><th>Requested</th><th>Status</th><th /></tr></thead>
            <tbody>{data.map((p) => (
              <tr key={p._id}>
                <td><b>{p.agency?.name}</b><div className="small muted">{p.agency?.agencyType} · {p.agency?.cityName || 'intercity'}</div></td>
                <td>{formatCurrency(p.amount)}</td>
                <td className="small">{p.bankDetails?.accountName}<br />{p.bankDetails?.bankName} · {p.bankDetails?.ifsc}<br />A/c {p.bankDetails?.accountNumber}</td>
                <td>{formatDateTime(p.createdAt)}</td>
                <td><StatusBadge status={p.status} />{p.transferReference && <div className="small muted">{p.transferReference}</div>}</td>
                <td>{p.status === 'Pending' && (
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <button type="button" className="btn btn-sm btn-mint" onClick={() => process(p, 'Paid')}>Mark paid</button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => process(p, 'Rejected')}>Reject</button>
                  </div>
                )}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <EmptyState icon={Landmark} title="Nothing to show" />}
    </div>
  );
}

export function AdminReviews() {
  const [filters, setFilters] = useState({ status: '', maxRating: '' });
  const [page, setPage] = useState(1);
  const { body, loading, reload } = useApi('/admin/reviews', { params: { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) } });
  const act = useAction(reload);
  return (
    <div className="stack">
      <div className="toolbar">
        <select className="form-control" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All</option><option>Published</option><option>Hidden</option></select>
        <select className="form-control" value={filters.maxRating} onChange={(e) => setFilters({ ...filters, maxRating: e.target.value })}><option value="">Any rating</option><option value="2">2★ and below</option><option value="3">3★ and below</option></select>
      </div>
      {loading ? <Spinner /> : body.data.map((r) => (
        <div key={r._id} className="card" style={{ padding: 14 }}>
          <div className="row-between"><b>{r.title}</b><div className="row"><Stars value={r.rating} /><StatusBadge status={r.status} /></div></div>
          <p className="small muted">{r.itemTitle} · {r.user?.fullName} · {formatDate(r.createdAt)}</p>
          <p className="small" style={{ margin: '6px 0' }}>{r.comment}</p>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => {
            const note = r.status === 'Published' ? window.prompt('Moderation note:') : '';
            if (note !== null) act(() => api.put(`/admin/reviews/${r._id}`, { status: r.status === 'Published' ? 'Hidden' : 'Published', note }), 'Review updated');
          }}>{r.status === 'Published' ? 'Hide' : 'Publish'}</button>
        </div>
      ))}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
    </div>
  );
}

export function AdminSettings() {
  const { data, loading, reload } = useApi('/admin/settings');
  const act = useAction(reload);
  if (loading) return <Spinner />;

  const save = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const tiers = {};
    ['Flexible', 'Moderate', 'Strict'].forEach((p) => {
      tiers[p] = String(fd[`tiers_${p}`]).split(',').map((pair) => {
        const [daysBefore, refundPercent] = pair.split(':').map((x) => Number(x.trim()));
        return { daysBefore, refundPercent };
      }).filter((t) => Number.isFinite(t.daysBefore) && Number.isFinite(t.refundPercent));
    });
    act(() => api.put('/admin/settings', {
      commissionPercent: Number(fd.commissionPercent),
      gstPercent: Number(fd.gstPercent),
      loyaltyPointsPer100: Number(fd.loyaltyPointsPer100),
      maxLoyaltyRedeemPercent: Number(fd.maxLoyaltyRedeemPercent),
      minPayoutAmount: Number(fd.minPayoutAmount),
      cancellationTiers: tiers
    }), 'Settings saved');
  };

  const tierText = (p) => data.cancellationTiers[p].map((t) => `${t.daysBefore}:${t.refundPercent}`).join(', ');
  return (
    <form className="card" onSubmit={save}>
      <h2 className="section-title">Platform settings</h2>
      <div className="form-grid">
        <Field label="Default commission %"><input name="commissionPercent" type="number" step="0.5" min={0} max={50} className="form-control" defaultValue={data.commissionPercent} /></Field>
        <Field label="GST %"><input name="gstPercent" type="number" min={0} max={28} className="form-control" defaultValue={data.gstPercent} /></Field>
        <Field label="Loyalty points per ₹100"><input name="loyaltyPointsPer100" type="number" min={0} className="form-control" defaultValue={data.loyaltyPointsPer100} /></Field>
        <Field label="Max % payable with points"><input name="maxLoyaltyRedeemPercent" type="number" min={0} max={100} className="form-control" defaultValue={data.maxLoyaltyRedeemPercent} /></Field>
        <Field label="Minimum payout ₹"><input name="minPayoutAmount" type="number" min={0} className="form-control" defaultValue={data.minPayoutAmount} /></Field>
      </div>
      <h3 className="section-title" style={{ fontSize: 15 }}>Cancellation refunds</h3>
      <p className="small muted" style={{ marginBottom: 10 }}>Format: daysBefore:refund%, highest first. E.g. “7:100, 2:50, 0:0”.</p>
      {['Flexible', 'Moderate', 'Strict'].map((p) => (
        <Field key={p} label={p}><input name={`tiers_${p}`} className="form-control" defaultValue={tierText(p)} /></Field>
      ))}
      <button type="submit" className="btn btn-primary">Save settings</button>
    </form>
  );
}

export function AdminAudit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const { body, loading } = useApi('/admin/audit-logs', { params: { page, action: action || undefined } });
  return (
    <div className="stack">
      <div className="toolbar"><input className="form-control" placeholder="Filter by action (e.g. PAYOUT)" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} /></div>
      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>When</th><th>Action</th><th>By</th><th>Target</th><th>Details</th></tr></thead>
            <tbody>{body.data.map((l) => (
              <tr key={l._id}>
                <td>{formatDateTime(l.createdAt)}</td>
                <td><b>{l.action}</b></td>
                <td>{l.actorName} <span className="small muted">({l.actorType})</span></td>
                <td>{l.targetEntity} <span className="small muted">{l.targetId.slice(-6)}</span></td>
                <td className="small" style={{ maxWidth: 320, wordBreak: 'break-word' }}>{JSON.stringify(l.details)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Pagination page={body?.page || 1} pages={body?.pages || 1} onChange={setPage} />
    </div>
  );
}


