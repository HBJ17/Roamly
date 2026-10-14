import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

/**
 * Side-nav layout for the traveller account, partner portal and admin console.
 * items: [{ to, label, icon, end, count }]
 */
export default function PortalLayout({ title, items, header }) {
  return (
    <div className="main-container">
      {header}
      <div className="portal">
        <nav className="portal-nav card" aria-label={title}>
          {items.map(({ to, label, icon: Icon, end, count }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {Icon && <Icon size={15} />} {label}
              {count > 0 && <span className="nav-count">{count}</span>}
            </NavLink>
          ))}
        </nav>
        <section style={{ minWidth: 0 }}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
