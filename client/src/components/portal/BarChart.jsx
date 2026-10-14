import React from 'react';

/** Minimal bar chart: data = [{ label, value }], format = value -> string */
export default function BarChart({ data = [], format = (v) => v, emptyText = 'No data yet' }) {
  if (!data.length) return <p className="muted small">{emptyText}</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div className="bar-chart" role="img" aria-label={data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')}>
        {data.map((d) => (
          <div key={d.label} className="bar">
            <span>{format(d.value)}</span>
            <div style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="bar-labels">{data.map((d) => <span key={d.label}>{d.label}</span>)}</div>
    </div>
  );
}

export const monthLabel = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' });
