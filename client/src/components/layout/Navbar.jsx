import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Compass, Hotel, Car, Map, Scale, User, Shield, Briefcase, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const { currency, setCurrency, currencies, lang, setLang, languages, compareList, t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header>
      <div className="header-inner">
        {/* Brand Logo & Badges */}
        <div className="header-brand">
          <Link to="/" className="logo-link">
            <img src="/roamly_logo.png" alt="Roamly Logo" className="brand-logo-img" onError={(e) => { e.target.src = '/logo.png'; }} />
            <span className="brand-title-badge">ROAMLY</span>
          </Link>

          {role === 'admin' && (
            <span className="badge badge-peach" style={{ fontSize: '11px' }}>
              <Shield size={12} /> {t('central_control')}
            </span>
          )}
          {role === 'agency' && (
            <span className="badge badge-blue" style={{ fontSize: '11px' }}>
              <Briefcase size={12} /> {t('partner_desk')}
            </span>
          )}
          {(!role || role === 'user') && (
            <span className="brand-est-badge">EST. 2026</span>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className="nav-menu">
          {role === 'admin' ? (
            <>
              <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/admin/agencies" className={`nav-link ${isActive('/admin/agencies') ? 'active' : ''}`}>
                Agencies
              </Link>
              <Link to="/admin/bookings" className={`nav-link ${isActive('/admin/bookings') ? 'active' : ''}`}>
                Bookings Ledger
              </Link>
              <Link to="/admin/logs" className={`nav-link ${isActive('/admin/logs') ? 'active' : ''}`}>
                Audit Trail
              </Link>
            </>
          ) : role === 'agency' ? (
            <>
              <Link to="/agency" className={`nav-link ${isActive('/agency') ? 'active' : ''}`}>
                Workspace
              </Link>
              <Link to="/agency/inventory" className={`nav-link ${isActive('/agency/inventory') ? 'active' : ''}`}>
                Inventory
              </Link>
              <Link to="/agency/bookings" className={`nav-link ${isActive('/agency/bookings') ? 'active' : ''}`}>
                Bookings
              </Link>
            </>
          ) : (
            <>
              <Link to="/packages" className={`nav-link ${isActive('/packages') ? 'active' : ''}`}>
                <Compass size={14} /> {t('packages')}
              </Link>
              <Link to="/hotels" className={`nav-link ${isActive('/hotels') ? 'active' : ''}`}>
                <Hotel size={14} /> {t('hotels')}
              </Link>
              <Link to="/transports" className={`nav-link ${isActive('/transports') ? 'active' : ''}`}>
                <Car size={14} /> {t('transports')}
              </Link>
              <Link to="/itinerary" className={`nav-link ${isActive('/itinerary') ? 'active' : ''}`}>
                <Map size={14} /> {t('trip_builder')}
              </Link>
              <Link to="/compare" className={`nav-link ${isActive('/compare') ? 'active' : ''}`}>
                <Scale size={14} /> {t('compare')}
                {compareList.length > 0 && (
                  <span className="badge badge-yellow" style={{ padding: '1px 5px', fontSize: '10px' }}>
                    {compareList.length}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              padding: '4px 8px',
              fontWeight: '700',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1.5px solid #000',
              boxShadow: '2px 2px 0px #000',
              cursor: 'pointer',
              background: '#fff'
            }}
          >
            {Object.entries(currencies).map(([code, info]) => (
              <option key={code} value={code}>
                {info.symbol} {code}
              </option>
            ))}
          </select>

          {/* Language Switcher */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              padding: '4px 8px',
              fontWeight: '700',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1.5px solid #000',
              boxShadow: '2px 2px 0px #000',
              cursor: 'pointer',
              background: '#fff'
            }}
          >
            {Object.entries(languages).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          {/* User Account / Auth Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to={role === 'admin' ? '/admin' : role === 'agency' ? '/agency' : '/dashboard'}
                className="btn btn-sm btn-yellow"
                style={{ textDecoration: 'none' }}
              >
                <User size={13} /> {user.name || user.username}
              </Link>
              <button onClick={handleLogout} className="btn btn-sm btn-outline" title="Logout">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link to="/login" className="btn btn-sm btn-outline">
                {t('login')}
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                {t('signup')}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
