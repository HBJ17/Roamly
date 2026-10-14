import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import { PageHeader, EmptyState, Spinner, Stars } from '../../components/ui';

const ROWS = [
  ['Destination', (p) => p.destinationName],
  ['Category', (p) => p.category],
  ['Duration', (p) => `${p.durationDays} days / ${p.durationNights} nights`],
  ['Rating', (p) => <Stars value={p.rating} count={p.reviewCount} />],
  ['Stay', (p) => p.hotel?.name || 'Not included'],
  ['Highlights', (p) => p.highlights.slice(0, 4).join(', ')],
  ['Included', (p) => p.inclusions.join(', ')],
  ['Ideal for', (p) => p.idealFor],
  ['Group size', (p) => `Up to ${p.maxGroupSize}`],
  ['Cancellation', (p) => p.cancellationPolicy]
];

export default function ComparePage() {
  const { compareList, removeCompare, clearCompare, formatCurrency } = useApp();
  const [packages, setPackages] = useState(null);

  useEffect(() => {
    Promise.all(compareList.map((p) => api.get(`/packages/${p._id}`).then((r) => r.data.data).catch(() => null)))
      .then((list) => setPackages(list.filter(Boolean)));
  }, [compareList]);

  if (!compareList.length) {
    return (
      <div className="main-container">
        <EmptyState icon={Scale} title="Nothing to compare yet" action={<Link className="btn btn-primary" to="/packages">Browse packages</Link>}>
          Tap “Compare” on up to four packages to see them side by side.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="main-container">
      <PageHeader badge="Side by side" title="Compare packages">
        <button type="button" className="btn btn-outline" onClick={clearCompare}>Clear all</button>
      </PageHeader>
      {!packages ? <Spinner /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                {packages.map((p) => (
                  <th key={p._id} style={{ minWidth: 220 }}>
                    <div className="row-between" style={{ flexWrap: 'nowrap' }}>
                      <Link className="link" to={`/packages/${p._id}`}>{p.title}</Link>
                      <button type="button" className="icon-btn" onClick={() => removeCompare(p._id)} aria-label="Remove"><X size={14} /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th>Price / person</th>{packages.map((p) => <td key={p._id}><b className="price">{formatCurrency(p.price)}</b></td>)}</tr>
              {ROWS.map(([label, fn]) => (
                <tr key={label}><th>{label}</th>{packages.map((p) => <td key={p._id}>{fn(p)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
