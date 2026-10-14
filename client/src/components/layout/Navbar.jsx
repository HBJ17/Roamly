import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Hotel, Car, Map, MapPin, Package, User, LogOut, Menu, ChevronDown, Shield, Briefcase, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';
import NotificationBell from './NotificationBell';

const TRAVELLER_LINKS = [
  { to: '/destinations', key: 'destinations', icon: Compass },
  { to: '/hotels', key: 'hotels', icon: Hotel },
  { to: '/transports', key: 'transports', icon: Car },
  { to: '/packages', key: 'packages', icon: Package },
  { to: '/plan', key: 'trip_builder', icon: Map }
];

function DestinationSwitcher() {
  const { destinations, destination, updateTrip } = useTrip();
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (slug) => {
    updateTrip({ destination: slug });
    setOpen(false);
    // Listing pages follow the new city; elsewhere, go to the city's page.
    if (!/^\/(hotels|transports|packages)/.test(location.pathname)) navigate(`/destinations/${slug}`);
  };

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="dest-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <MapPin size={13} /> {destination ? `${t('exploring')}: ${destination.name}` : t('choose_destination')} <ChevronDown size={13} />
      </button>
      {open && (
        <div className="dropdown-panel">
          {destinations.map((d) => (
            <button key={d.slug} type="button" className="menu-item" onClick={() => choose(d.slug)}>
              <MapPin size={14} /> <b>{d.name}</b> <span className="muted small">{d.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const { currency, setCurrency, currencies, lang, setLang, languages, compareList, t } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const portalLink = role === 'admin' ? '/admin' : role === 'agency' ? '/agency' : '/account';
  const portalLabel = role === 'admin' ? t('central_control') : role === 'agency' ? t('partner_desk') : t('my_account');

  return (
    <header>
      <div className="header-inner">
        <div className="header-brand">
          <Link to="/" className="logo-link" aria-label="Roamly home">
            <img src="/roamly_logo.png" alt="" className="brand-logo-img" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
            <span className="brand-title-badge">ROAMLY</span>
          </Link>
          {role === 'admin' && <span className="badge badge-peach"><Shield size={12} /> Admin</span>}
          {role === 'agency' && <span className="badge badge-blue"><Briefcase size={12} /> Partner</span>}
          {(!role || role === 'user') && <DestinationSwitcher />}
          <button type="button" className="btn btn-sm btn-outline menu-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            <Menu size={16} />
          </button>
        </div>

        <nav className={`nav-menu ${menuOpen ? '' : 'collapsed'}`}>
          {(!role || role === 'user') && TRAVELLER_LINKS.map(({ to, key, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={14} /> {t(key)}
            </NavLink>
          ))}
          {(!role || role === 'user') && compareList.length > 0 && (
            <NavLink to="/compare" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Scale size={14} /> {t('compare')} ({compareList.length})
            </NavLink>
          )}

          <div className="nav-tools">
            <select className="nav-select" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
              {Object.keys(currencies).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="nav-select" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              {Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>

            {user ? (
              <>
                <NotificationBell />
                <div className="dropdown">
                  <button type="button" className="nav-link" onClick={() => setAccountOpen((o) => !o)} aria-expanded={accountOpen}>
                    <User size={14} /> {user.name?.split(' ')[0] || user.username} <ChevronDown size={12} />
                  </button>
                  {accountOpen && (
                    <div className="dropdown-panel">
                      <Link to={portalLink}><User size={14} /> {portalLabel}</Link>
                      {role === 'user' && <Link to="/account/bookings">{t('bookings')}</Link>}
                      {role === 'user' && <Link to="/account/trips">{t('trips')}</Link>}
                      {role === 'user' && <Link to="/account/wallet">{t('wallet')}</Link>}
                      <button type="button" className="menu-item" onClick={handleLogout}><LogOut size={14} /> {t('logout')}</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">{t('login')}</Link>
                <Link to="/register" className="btn btn-sm btn-primary">{t('signup')}</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
