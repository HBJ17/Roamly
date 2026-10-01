import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Briefcase, User } from 'lucide-react';

export default function RegisterPage() {
  const { register, registerAgency } = useAuth();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState('user'); // 'user' or 'agency'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    name: '', // for agency
    agencyType: 'Tour Agency',
    phone: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (accountType === 'agency') {
        await registerAgency(formData);
        navigate('/agency');
      } else {
        await register(formData);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '32px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="brand-title-badge" style={{ fontSize: '20px', marginBottom: '8px' }}>JOIN THE CARAVAN</span>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Create an account to book tours, customize itineraries, and earn loyalty points.
          </p>
        </div>

        {/* User / Agency Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setAccountType('user')}
            style={{
              padding: '8px',
              fontSize: '12px',
              fontWeight: '800',
              borderRadius: '6px',
              border: '2px solid #000',
              boxShadow: accountType === 'user' ? '3px 3px 0 #000' : '1px 1px 0 #000',
              background: accountType === 'user' ? 'var(--pastel-yellow)' : '#fff',
              cursor: 'pointer'
            }}
          >
            🧭 Explorer Traveler
          </button>
          <button
            type="button"
            onClick={() => setAccountType('agency')}
            style={{
              padding: '8px',
              fontSize: '12px',
              fontWeight: '800',
              borderRadius: '6px',
              border: '2px solid #000',
              boxShadow: accountType === 'agency' ? '3px 3px 0 #000' : '1px 1px 0 #000',
              background: accountType === 'agency' ? 'var(--pastel-blue)' : '#fff',
              cursor: 'pointer'
            }}
          >
            🏢 Agency Partner
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{accountType === 'agency' ? 'Agency / Enterprise Name' : 'Full Name'}</label>
            <input
              type="text"
              name={accountType === 'agency' ? 'name' : 'fullName'}
              value={accountType === 'agency' ? formData.name : formData.fullName}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          {accountType === 'agency' && (
            <div className="form-group">
              <label className="form-label">Agency Type</label>
              <select name="agencyType" value={formData.agencyType} onChange={handleChange} className="form-control">
                <option value="Tour Agency">Tour Agency</option>
                <option value="Hotel Partner">Hotel Partner</option>
                <option value="Transport Provider">Transport Provider</option>
                <option value="Full Service">Full Service</option>
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Address / City</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            <UserPlus size={16} /> {loading ? 'Registering Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#000', fontWeight: '800', textDecoration: 'underline' }}>
            Sign In here →
          </Link>
        </div>
      </div>
    </div>
  );
}
