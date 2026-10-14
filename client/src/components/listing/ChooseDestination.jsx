import React from 'react';
import { MapPin } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

// Shown instead of a mixed, all-city list until the traveller picks where they are going.
export default function ChooseDestination({ what }) {
  const { destinations, updateTrip } = useTrip();
  return (
    <div className="card" style={{ textAlign: 'center', padding: 28 }}>
      <MapPin size={30} />
      <h3 style={{ margin: '8px 0 4px' }}>Which city are you visiting?</h3>
      <p className="muted small" style={{ marginBottom: 18 }}>We only show {what} that operate in the city you choose.</p>
      <div className="grid-auto-sm">
        {destinations.map((d) => (
          <button key={d.slug} type="button" className="option-card" onClick={() => updateTrip({ destination: d.slug })}>
            <MapPin size={18} />
            <span style={{ textAlign: 'left' }}><b>{d.name}</b><br /><span className="small muted">{d.state}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
