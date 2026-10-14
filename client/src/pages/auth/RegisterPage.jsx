import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage, fieldErrors } from '../../api/client';
import { Field } from '../../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const { destinations } = useTrip();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', homeCity: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setErrors({ confirm: 'Passwords do not match' });
    setBusy(true);
    setErrors({});
    setError('');
    try {
      const { confirm, ...data } = form;
      await register(data);
      toast.success('Welcome to Roamly! ₹1,000 travel credit is in your wallet.');
      navigate('/account', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="main-container" style={{ maxWidth: 620 }}>
      <div className="card">
        <h2 style={{ fontSize: 24 }}>Create your Roamly account</h2>
        <p className="muted small" style={{ margin: '6px 0 16px' }}>Book stays, cabs and tours across South India. New accounts get ₹1,000 wallet credit.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field label="Full name" error={errors.fullName}><input className="form-control" required value={form.fullName} onChange={set('fullName')} autoComplete="name" /></Field>
            <Field label="Username" error={errors.username} hint="Letters, numbers, dots and underscores"><input className="form-control" required value={form.username} onChange={set('username')} autoComplete="username" /></Field>
            <Field label="Email" error={errors.email}><input type="email" className="form-control" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
            <Field label="Phone" error={errors.phone}><input type="tel" className="form-control" value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
            <Field label="Home city" hint="Used as your default starting point when planning trips">
              <select className="form-control" value={form.homeCity} onChange={set('homeCity')}>
                <option value="">Select…</option>
                {destinations.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
                <option value="Other">Other</option>
              </select>
            </Field>
            <div />
            <Field label="Password" error={errors.password} hint="At least 8 characters"><input type="password" className="form-control" required minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
            <Field label="Confirm password" error={errors.confirm}><input type="password" className="form-control" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}><UserPlus size={15} /> {busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <hr className="divider" />
        <p className="small">Already have an account? <Link className="link" to="/login">Sign in</Link>. Run a hotel or cab service? <Link className="link" to="/partner/register">Become a partner</Link>.</p>
      </div>
    </div>
  );
}
