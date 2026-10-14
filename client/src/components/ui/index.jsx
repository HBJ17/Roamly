import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, X, ChevronLeft, ChevronRight, AlertTriangle, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Spinner = ({ label = 'Loading' }) => (
  <div className="spinner-wrap" role="status">
    <span className="spinner" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);

export const PageLoader = () => (
  <div className="main-container">
    <Spinner />
  </div>
);

export const Skeleton = ({ height = 180, count = 3 }) => (
  <div className="grid-auto">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="skeleton" style={{ height }} />
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon = Compass, title, children, action }) => (
  <div className="empty-state card">
    <Icon size={36} strokeWidth={1.6} />
    <h3>{title}</h3>
    {children && <p>{children}</p>}
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="alert alert-danger" role="alert">
    <AlertTriangle size={16} /> <span>{message}</span>
    {onRetry && (
      <button type="button" className="btn btn-sm btn-outline" onClick={onRetry} style={{ marginLeft: 'auto' }}>
        Retry
      </button>
    )}
  </div>
);

export const PageHeader = ({ badge, title, subtitle, children, tone = 'yellow' }) => (
  <div className={`travel-hero page-header tone-${tone}`}>
    <div>
      {badge && <span className="badge badge-mint">{badge}</span>}
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {children && <div className="page-header-actions">{children}</div>}
  </div>
);

export const Stars = ({ value = 0, count, size = 13 }) => (
  <span className="rating-badge" title={`${value} out of 5`}>
    <Star size={size} fill="currentColor" /> {value ? Number(value).toFixed(1) : 'New'}
    {count !== undefined && count > 0 && <span className="muted"> ({count})</span>}
  </span>
);

export const StarInput = ({ value, onChange, label }) => (
  <div className="star-input" role="radiogroup" aria-label={label}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        className={n <= value ? 'on' : ''}
        onClick={() => onChange(n)}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
      >
        <Star size={20} fill={n <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

export const Price = ({ value, suffix, className = '' }) => {
  const { formatCurrency } = useApp();
  return (
    <span className={`price ${className}`}>
      {formatCurrency(value)}
      {suffix && <small> {suffix}</small>}
    </span>
  );
};

const STATUS_TONES = {
  Confirmed: 'mint',
  Completed: 'blue',
  PendingPayment: 'yellow',
  Pending: 'yellow',
  Cancelled: 'pink',
  Expired: 'neutral',
  Active: 'mint',
  Suspended: 'pink',
  Paid: 'mint',
  Rejected: 'pink',
  Published: 'mint',
  Hidden: 'neutral',
  Draft: 'yellow',
  Booked: 'mint'
};
const STATUS_LABELS = { PendingPayment: 'Awaiting payment' };

export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${STATUS_TONES[status] || 'neutral'}`}>{STATUS_LABELS[status] || status}</span>
);

export const Field = ({ label, error, hint, children, htmlFor }) => (
  <div className="form-group">
    {label && <label className="form-label" htmlFor={htmlFor}>{label}</label>}
    {children}
    {hint && !error && <small className="field-hint">{hint}</small>}
    {error && <small className="field-error">{error}</small>}
  </div>
);

export const Modal = ({ open, title, onClose, children, width = 520 }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal card" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-head">
          <h3>{title}</h3>
          {onClose && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export const Pagination = ({ page, pages, onChange }) => {
  if (!pages || pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} /> Prev
      </button>
      <span className="font-grotesk">Page {page} of {pages}</span>
      <button type="button" className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={14} />
      </button>
    </nav>
  );
};

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={active === tab.id}
        className={`tab ${active === tab.id ? 'active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.icon && <tab.icon size={14} />} {tab.label}
        {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
      </button>
    ))}
  </div>
);

// Counts down to `until` and calls onExpire once.
export const Countdown = ({ until, onExpire }) => {
  const [left, setLeft] = useState(() => new Date(until) - Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      const ms = new Date(until) - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [until, onExpire]);
  const s = Math.max(0, Math.floor(left / 1000));
  return <span className="font-grotesk">{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</span>;
};

export const Breadcrumbs = ({ items }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    {items.map((item, i) => (
      <React.Fragment key={item.label}>
        {i > 0 && <span aria-hidden="true">/</span>}
        {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
      </React.Fragment>
    ))}
  </nav>
);

export const formatDate = (day, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  day ? new Date(`${String(day).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', opts) : '';

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export const todayPlus = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
