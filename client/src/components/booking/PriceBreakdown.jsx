import React from 'react';
import { useApp } from '../../context/AppContext';

export default function PriceBreakdown({ items = [], pricing, showItems = true }) {
  const { formatCurrency } = useApp();
  if (!pricing) return null;
  return (
    <div className="line-items">
      {showItems && items.map((i) => (
        <div key={`${i.item}-${i.startDate}-${i.variantId || ''}`} className="row-between">
          <span>{i.title}<br /><span className="small muted">{i.description}</span></span>
          <span>{formatCurrency(i.lineTotal)}</span>
        </div>
      ))}
      <div className="row-between"><span>Subtotal</span><span>{formatCurrency(pricing.subtotal)}</span></div>
      {pricing.discount > 0 && <div className="row-between"><span>Promo {pricing.couponCode}</span><span>− {formatCurrency(pricing.discount)}</span></div>}
      {pricing.loyaltyDiscount > 0 && <div className="row-between"><span>Loyalty points</span><span>− {formatCurrency(pricing.loyaltyDiscount)}</span></div>}
      <div className="row-between"><span>GST ({pricing.taxPercent}%)</span><span>{formatCurrency(pricing.tax)}</span></div>
      <div className="row-between total"><span><b>Total</b></span><span>{formatCurrency(pricing.total)}</span></div>
    </div>
  );
}
