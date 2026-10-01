import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Globe, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ marginTop: 'auto', borderTop: '2.5px solid #000', background: '#fdfdfb', padding: '40px 20px 30px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* Brand & Manifesto */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className="brand-title-badge" style={{ fontSize: '18px' }}>ROAMLY</span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            The Inked Doodle Expedition Co. Handcrafted travel packages, verified stays, and reliable road caravans across India.
          </p>
          <div style={{ marginTop: '14px', display: 'inline-block' }}>
            <span className="postal-stamp-box" style={{ fontSize: '11px', display: 'inline-block' }}>
              ✓ 100% VERIFIED OPERATORS
            </span>
          </div>
        </div>

        {/* Quick Destinations */}
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', letterSpacing: '0.05em' }}>DESTINATIONS</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <li><Link to="/packages?destination=Kodaikanal" style={{ color: '#000', textDecoration: 'none' }}>⛰️ Kodaikanal Pine Trails</Link></li>
            <li><Link to="/packages?destination=Madurai" style={{ color: '#000', textDecoration: 'none' }}>🛕 Madurai Temple Odyssey</Link></li>
            <li><Link to="/packages?destination=Chennai" style={{ color: '#000', textDecoration: 'none' }}>🌊 Chennai Coastal Drive</Link></li>
            <li><Link to="/packages?destination=Bangalore" style={{ color: '#000', textDecoration: 'none' }}>🌆 Bengaluru Cyber Green</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', letterSpacing: '0.05em' }}>SERVICES</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <li><Link to="/packages" style={{ color: '#000', textDecoration: 'none' }}>Curated Tour Packages</Link></li>
            <li><Link to="/hotels" style={{ color: '#000', textDecoration: 'none' }}>Resorts & Lodging</Link></li>
            <li><Link to="/transports" style={{ color: '#000', textDecoration: 'none' }}>Taxi & Cabs Rental Fleet</Link></li>
            <li><Link to="/itinerary" style={{ color: '#000', textDecoration: 'none' }}>Custom Day Planner</Link></li>
          </ul>
        </div>

        {/* Portals & Login */}
        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', letterSpacing: '0.05em' }}>PARTNERS & ROLES</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <li><Link to="/login" style={{ color: '#000', textDecoration: 'none' }}>Explorer Sign In</Link></li>
            <li><Link to="/login" style={{ color: '#000', textDecoration: 'none' }}>Agency Partner Desk</Link></li>
            <li><Link to="/login" style={{ color: '#000', textDecoration: 'none' }}>Central Admin Console</Link></li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1.5px solid #000', paddingTop: '20px', maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <div>© 2026 ROAMLY EXPEDITION CO. (MERN Stack Architecture)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          Crafted with <Heart size={13} color="#e11d48" fill="#e11d48" /> for curious wanderers worldwide.
        </div>
      </div>
    </footer>
  );
}
