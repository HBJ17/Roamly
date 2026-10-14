import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';

export default function Footer() {
  const { t } = useApp();
  const { destinations } = useTrip();
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <span className="brand-title-badge" style={{ fontSize: 18 }}>ROAMLY</span>
          <p className="small" style={{ marginTop: 10, maxWidth: 320 }}>{t('footer_tagline')}</p>
        </div>
        <div className="footer-links">
          <b className="font-grotesk">Destinations</b>
          {destinations.slice(0, 6).map((d) => <Link key={d.slug} to={`/destinations/${d.slug}`}>{d.name}</Link>)}
        </div>
        <div className="footer-links">
          <b className="font-grotesk">Travel</b>
          <Link to="/plan">Plan a trip</Link>
          <Link to="/packages">Holiday packages</Link>
          <Link to="/transports?scope=intercity">Buses, trains & flights</Link>
          <Link to="/offers">Offers</Link>
        </div>
        <div className="footer-links">
          <b className="font-grotesk">Partners</b>
          <Link to="/partner/register">List your hotel or cabs</Link>
          <Link to="/login?type=agency">Partner sign in</Link>
        </div>
      </div>
      <p className="small muted" style={{ textAlign: 'center', marginTop: 18 }}>© {new Date().getFullYear()} Roamly Travel. Prices in INR include GST at checkout.</p>
    </footer>
  );
}
