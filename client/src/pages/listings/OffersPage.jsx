import React from 'react';
import { Tag, Copy } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Skeleton, EmptyState, formatDate } from '../../components/ui';

export default function OffersPage() {
  const { data, loading } = useApi('/coupons');
  const { formatCurrency } = useApp();
  const toast = useToast();

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${code} copied`);
    } catch {
      toast.info(`Use code ${code} at checkout`);
    }
  };

  return (
    <div className="main-container">
      <PageHeader badge="Save on your trip" tone="peach" title="Offers & promo codes" subtitle="Apply a code in the booking panel before you reserve. One code per booking." />
      {loading ? <Skeleton height={150} /> : data?.length ? (
        <div className="grid-auto">
          {data.map((c) => (
            <div key={c.code} className="card" style={{ background: 'var(--pastel-peach-light)' }}>
              <div className="row-between">
                <span className="postal-stamp-box"><b>{c.code}</b></span>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => copy(c.code)}><Copy size={12} /> Copy</button>
              </div>
              <h3 style={{ fontSize: 20, margin: '14px 0 4px' }}>
                {c.discountType === 'percent' ? `${c.discountValue}% off` : `${formatCurrency(c.discountValue)} off`}
              </h3>
              <p className="small">{c.description}</p>
              <p className="small muted" style={{ marginTop: 8 }}>
                {c.applicableTo === 'all' ? 'All bookings' : `${c.applicableTo[0].toUpperCase()}${c.applicableTo.slice(1)} bookings`}
                {c.minOrderAmount ? ` · min ${formatCurrency(c.minOrderAmount)}` : ''}
                {c.discountType === 'percent' ? ` · up to ${formatCurrency(c.maxDiscountAmount)}` : ''}
                {` · valid till ${formatDate(c.validUntil)}`}
              </p>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={Tag} title="No offers running right now" />}
    </div>
  );
}
