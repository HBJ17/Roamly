import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Scale, Trash2, Star, Check, ArrowRight } from 'lucide-react';

export default function ComparePage() {
  const { compareList, removeCompare, formatCurrency } = useApp();

  if (compareList.length === 0) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Scale size={64} style={{ margin: '0 auto 16px' }} />
        <h2>Your Compare Deck is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '20px' }}>
          Select up to 4 tour packages across the catalog to compare duration, inclusions, food, and pricing side-by-side.
        </p>
        <Link to="/packages" className="btn btn-primary">
          Explore Packages →
        </Link>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Header */}
      <div className="travel-hero" style={{ padding: '24px 30px', marginBottom: '24px' }}>
        <span className="badge badge-yellow" style={{ marginBottom: '6px' }}>COMPARISON MATRIX</span>
        <h2 style={{ fontSize: '28px' }}>SIDE-BY-SIDE EXPEDITION BENCHMARK</h2>
        <p>Comparing {compareList.length} holiday caravan packages.</p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="table-executive" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Package Feature</th>
              {compareList.map((pkg) => (
                <th key={pkg._id} style={{ minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px' }}>{pkg.title}</span>
                    <button
                      onClick={() => removeCompare(pkg._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Destination</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id}>📍 {pkg.destination}</td>
              ))}
            </tr>
            <tr>
              <td><strong>Category</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id}>
                  <span className="badge badge-yellow">{pkg.category}</span>
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Price / Person</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id} style={{ fontSize: '18px', fontWeight: '800' }}>
                  {formatCurrency(pkg.price)}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Duration</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id}>
                  ⏱️ {pkg.durationDays} Days / {pkg.durationNights} Nights
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Rating</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id}>
                  <span className="rating-badge">
                    <Star size={12} fill="#000" /> {pkg.rating} Stars
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Highlights</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id}>
                  <ul style={{ listStyle: 'none', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {pkg.highlights?.slice(0, 3).map((h, i) => (
                      <li key={i}>✓ {h}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Inclusions</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id}>
                  <ul style={{ listStyle: 'none', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {pkg.includedAmenities?.slice(0, 3).map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Actions</strong></td>
              {compareList.map((pkg) => (
                <td key={pkg._id}>
                  <Link to={`/packages/${pkg._id}`} className="btn btn-sm btn-primary">
                    View & Book →
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
