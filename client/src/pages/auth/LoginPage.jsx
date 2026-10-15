import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, User, Briefcase, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../api/client';
import { Field, Tabs } from '../../components/ui';

const TYPES = [
  { id: 'user', label: 'Traveller', icon: User },
  { id: 'agency', label: 'Partner', icon: Briefcase },
  { id: 'admin', label: 'Admin', icon: Shield }
];
const HOMES = { user: '/account', agency: '/agency', admin: '/admin' };

export default function LoginPage() {
  const [params] = useSearchParams();
  const [loginType, setLoginType] = useState(TYPES.some((t) => t.id === params.get('type')) ? params.get('type') : 'user');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.username.trim(), form.password, loginType);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const next = params.get('next');
      navigate(next && next.startsWith('/') ? next : HOMES[loginType], { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="main-container" style={{ maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>Sign in</h2>
        <p className="muted small" style={{ marginBottom: 16 }}>Pick the account you are signing in to.</p>
        <Tabs tabs={TYPES} active={loginType} onChange={setLoginType} />
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <Field label="Username or email" htmlFor="username">
            <input id="username" className="form-control" autoComplete="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <Field label="Password" htmlFor="password">
            <input id="password" type="password" className="form-control" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <Link className="link small" to={`/forgot-password?type=${loginType}`}>Forgot password?</Link>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            <LogIn size={15} /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <hr className="divider" />
        {loginType === 'agency' ? (
          <p className="small">New partner? <Link className="link" to="/partner/register">Register your business</Link></p>
        ) : (
          <p className="small">New to Roamly? <Link className="link" to="/register">Create an account</Link> and get ₹1,000 travel credit.</p>
        )}
      </div>
    </div>
  );
}
