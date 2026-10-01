import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, Shield, KeyRound, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('traveler');
  const [password, setPassword] = useState('user123');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (r) => {
    setRole(r);
    if (r === 'user') {
      setUsername('traveler');
      setPassword('user123');
    } else if (r === 'agency') {
      setUsername('bangalore_stays');
      setPassword('agency123');
    } else if (r === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password, role);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'agency') {
        navigate('/agency');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '32px 28px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="brand-title-badge" style={{ fontSize: '20px', marginBottom: '8px' }}>ROAMLY SIGN IN</span>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Access your Explorer, Agency Partner, or Central Admin Console.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => handleRoleSelect('user')}
            style={{
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '6px',
              border: '2px solid #000',
              boxShadow: role === 'user' ? '3px 3px 0 #000' : '1px 1px 0 #000',
              background: role === 'user' ? 'var(--pastel-yellow)' : '#fff',
              cursor: 'pointer'
            }}
          >
            🧭 EXPLORER
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('agency')}
            style={{
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '6px',
              border: '2px solid #000',
              boxShadow: role === 'agency' ? '3px 3px 0 #000' : '1px 1px 0 #000',
              background: role === 'agency' ? 'var(--pastel-blue)' : '#fff',
              cursor: 'pointer'
            }}
          >
            🏢 PARTNER
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            style={{
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '6px',
              border: '2px solid #000',
              boxShadow: role === 'admin' ? '3px 3px 0 #000' : '1px 1px 0 #000',
              background: role === 'admin' ? 'var(--pastel-peach)' : '#fff',
              cursor: 'pointer'
            }}
          >
            🛡️ ADMIN
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--pastel-pink-light)',
              border: '2px solid #dc2626',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#dc2626',
              fontWeight: '700'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            <LogIn size={16} /> {loading ? 'Authenticating...' : `Sign In as ${role.toUpperCase()}`}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#000', fontWeight: '800', textDecoration: 'underline' }}>
            Join the Caravan →
          </Link>
        </div>
      </div>
    </div>
  );
}
