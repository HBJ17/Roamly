import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

/**
 * The traveller's current search: where they are going (and from), when, and with how many people.
 * Every listing page reads the destination from here, so choosing Chennai once keeps
 * hotels, cabs and packages scoped to Chennai across the site.
 */
const TripContext = createContext(null);
const STORAGE_KEY = 'roamly_trip';

const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const defaults = () => ({
  destination: '',
  origin: '',
  startDate: addDays(14),
  endDate: addDays(16),
  adults: 2,
  children: 0
});

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return defaults();
    const merged = { ...defaults(), ...saved };
    // Drop stale dates from an old visit.
    if (merged.startDate < addDays(1)) Object.assign(merged, { startDate: addDays(14), endDate: addDays(16) });
    return merged;
  } catch {
    return defaults();
  }
};

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(load);
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    api.get('/destinations').then((res) => setDestinations(res.data.data)).catch(() => setDestinations([]));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
    } catch {
      /* storage unavailable; the trip simply is not remembered */
    }
  }, [trip]);

  const updateTrip = (patch) =>
    setTrip((prev) => {
      const next = { ...prev, ...patch };
      if (next.endDate < next.startDate) next.endDate = next.startDate;
      if (next.origin && next.origin === next.destination) next.origin = '';
      return next;
    });

  const value = useMemo(() => {
    const bySlug = Object.fromEntries(destinations.map((d) => [d.slug, d]));
    const nights = Math.max(0, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000));
    return {
      trip,
      updateTrip,
      destinations,
      destination: bySlug[trip.destination] || null,
      origin: bySlug[trip.origin] || null,
      findDestination: (slug) => bySlug[slug] || null,
      nights,
      travellers: trip.adults + trip.children
    };
  }, [trip, destinations]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export const useTrip = () => useContext(TripContext);
