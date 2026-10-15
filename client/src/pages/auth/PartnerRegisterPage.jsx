import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Hotel, Car, Bus, Map } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage, fieldErrors } from '../../api/client';
import { Field } from '../../components/ui';

const TYPES = [
  { id: 'Hotel Partner', icon: Hotel, text: 'Hotels, resorts and homestays in one city' },
  { id: 'Cab Operator', icon: Car, text: 'Taxis, SUVs and self-drive cars inside one city' },
  { id: 'Tour Operator', icon: Map, text: 'Guided holiday packages in one city' },
  { id: 'Intercity Transit', icon: Bus, text: 'Buses, trains or flights between cities' }
];

export default function PartnerRegisterPage() {
  const { registerAgency } = useAuth();
  const { destinations } = useTrip();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ agencyType: 'Hotel Partner', city: '', name: '', username: '', email: '', phone: '', address: '', gstin: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const cityBound = form.agencyType !== 'Intercity Transit';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      await registerAgency({ ...form, city: cityBound ? form.city : undefined });
      toast.success('Application received. You can finish your profile while we review it.');
      navigate('/agency/profile', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="main-container" style={{ maxWidth: 760 }}>
      <div className="card">
        <h2 style={{ fontSize: 24 }}><Briefcase size={20} /> Become a Roamly partner</h2>
        <p className="muted small" style={{ margin: '6px 0 18px' }}>
          Local partners list inventory in their own city only, so travellers searching for that city always see you. Applications are reviewed within 2 working days.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <label className="form-label">What do you offer?</label>
          <div className="grid-auto-sm" style={{ marginBottom: 18 }}>
            {TYPES.map(({ id, icon: Icon, text }) => (
              <button type="button" key={id} className={`option-card ${form.agencyType === id ? 'selected' : ''}`} onClick={() => setForm({ ...form, agencyType: id })}>
                <Icon size={22} />
                <span style={{ textAlign: 'left' }}><b>{id}</b><br /><span className="small muted">{text}</span></span>
              </button>
            ))}
          </div>
          <div className="form-grid">
            {cityBound && (
              <Field label="City you operate in" error={errors.city}>
                <select className="form-control" required value={form.city} onChange={set('city')}>
                  <option value="">Select city…</option>
                  {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}, {d.state}</option>)}
                </select>
              </Field>
            )}
            <Field label="Business name" error={errors.name}><input className="form-control" required value={form.name} onChange={set('name')} /></Field>
            <Field label="Username" error={errors.username}><input className="form-control" required value={form.username} onChange={set('username')} autoComplete="username" /></Field>
            <Field label="Business email" error={errors.email}><input type="email" className="form-control" required value={form.email} onChange={set('email')} /></Field>
            <Field label="Phone" error={errors.phone}><input type="tel" className="form-control" required value={form.phone} onChange={set('phone')} /></Field>
            <Field label="GSTIN (optional)" error={errors.gstin}><input className="form-control" value={form.gstin} onChange={set('gstin')} /></Field>
            <Field label="Password" error={errors.password} hint="At least 8 characters"><input type="password" className="form-control" required minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
          </div>
          <Field label="Business address" error={errors.address}><textarea className="form-control" rows={2} required value={form.address} onChange={set('address')} /></Field>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
        </form>
        <hr className="divider" />
        <p className="small">Already a partner? <Link className="link" to="/login?type=agency">Sign in</Link></p>
      </div>
    </div>
  );
}
