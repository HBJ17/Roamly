import React from 'react';
import { useTrip } from '../../context/TripContext';
import { useApp } from '../../context/AppContext';
import { Field, todayPlus } from '../ui';

/**
 * Where / when / who controls bound to the shared trip.
 * `fields` picks which inputs to show so pages can reuse it (e.g. no origin on hotel search).
 */
export default function TripSearch({ fields = ['destination', 'dates', 'travellers'], dateLabels, children }) {
  const { trip, updateTrip, destinations } = useTrip();
  const { t } = useApp();
  const [startLabel, endLabel] = dateLabels || [t('check_in'), t('check_out')];

  return (
    <div className="search-panel">
      {fields.includes('origin') && (
        <Field label={t('from_city')}>
          <select className="form-control" value={trip.origin} onChange={(e) => updateTrip({ origin: e.target.value })}>
            <option value="">I'll get there myself</option>
            {destinations.filter((d) => d.slug !== trip.destination).map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
        </Field>
      )}
      {fields.includes('destination') && (
        <Field label={t('where_to')}>
          <select className="form-control" value={trip.destination} onChange={(e) => updateTrip({ destination: e.target.value })}>
            <option value="">{t('choose_destination')}…</option>
            {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}, {d.state}</option>)}
          </select>
        </Field>
      )}
      {fields.includes('dates') && (
        <>
          <Field label={startLabel}>
            <input type="date" className="form-control" min={todayPlus(1)} value={trip.startDate} onChange={(e) => updateTrip({ startDate: e.target.value })} />
          </Field>
          <Field label={endLabel}>
            <input type="date" className="form-control" min={trip.startDate} value={trip.endDate} onChange={(e) => updateTrip({ endDate: e.target.value })} />
          </Field>
        </>
      )}
      {fields.includes('travellers') && (
        <>
          <Field label={t('adults')}>
            <input type="number" className="form-control" min={1} max={20} value={trip.adults} onChange={(e) => updateTrip({ adults: Math.max(1, Number(e.target.value) || 1) })} />
          </Field>
          <Field label={t('children')}>
            <input type="number" className="form-control" min={0} max={20} value={trip.children} onChange={(e) => updateTrip({ children: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
        </>
      )}
      {children}
    </div>
  );
}
