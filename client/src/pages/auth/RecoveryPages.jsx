import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Field, Spinner } from '../../components/ui';

const HOMES = { user: '/account', agency: '/agency', admin: '/admin' };

export function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loginType = params.get('type') || 'user';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email, loginType });
      setSent(res.data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="main-container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h2 style={{ fontSize: 22 }}><KeyRound size={18} /> Reset your password</h2>
        {sent ? (
          <div className="alert alert-success" style={{ marginTop: 14 }}>{sent}</div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 14 }}>
            {error && <div className="alert alert-danger">{error}</div>}
            <Field label="Account email"><input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending…' : 'Email me a reset link'}</button>
          </form>
        )}
        <p className="small" style={{ marginTop: 14 }}><Link className="link" to={`/login?type=${loginType}`}>Back to sign in</Link></p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const loginType = params.get('type') || 'user';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password, loginType });
      setUser(res.data.user);
      toast.success('Password updated. You are signed in.');
      navigate(HOMES[loginType], { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="main-container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h2 style={{ fontSize: 22 }}>Choose a new password</h2>
        <form onSubmit={submit} style={{ marginTop: 14 }}>
          {error && <div className="alert alert-danger">{error}</div>}
          <Field label="New password" hint="At least 8 characters"><input type="password" className="form-control" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
          <Field label="Confirm password"><input type="password" className="form-control" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  const { token } = useParams();
  const { refresh } = useAuth();
  const [state, setState] = useState({ loading: true, message: '', ok: false });

  useEffect(() => {
    api.post(`/auth/verify-email/${token}`)
      .then((res) => {
        setState({ loading: false, ok: true, message: res.data.message });
        refresh();
      })
      .catch((err) => setState({ loading: false, ok: false, message: errorMessage(err) }));
  }, [token, refresh]);

  return (
    <div className="main-container" style={{ maxWidth: 460 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        {state.loading ? <Spinner /> : (
          <>
            <MailCheck size={36} />
            <h2 style={{ fontSize: 22, margin: '10px 0' }}>{state.ok ? 'Email confirmed' : 'Link not valid'}</h2>
            <p className="muted">{state.message}</p>
            <Link to="/account" className="btn btn-primary" style={{ marginTop: 16 }}>Go to my account</Link>
          </>
        )}
      </div>
    </div>
  );
}
