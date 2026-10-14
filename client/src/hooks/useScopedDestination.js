import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTrip } from '../context/TripContext';

/**
 * Keeps ?destination= in the URL and the shared trip destination in sync,
 * so links are shareable and the navbar switcher drives the listing.
 *  - URL changes (arriving via a link) update the trip.
 *  - Trip changes (navbar switcher, filters) update the URL.
 * Each side only reacts to its own changes, so they never bounce back and forth.
 */
export default function useScopedDestination() {
  const [params, setParams] = useSearchParams();
  const { trip, updateTrip, findDestination, destinations } = useTrip();
  const fromUrl = params.get('destination') || '';
  const previousTrip = useRef(trip.destination);

  useEffect(() => {
    if (fromUrl && fromUrl !== trip.destination) updateTrip({ destination: fromUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);

  useEffect(() => {
    if (trip.destination === previousTrip.current) return;
    previousTrip.current = trip.destination;
    if (trip.destination === fromUrl) return;
    const next = new URLSearchParams(params);
    if (trip.destination) next.set('destination', trip.destination);
    else next.delete('destination');
    next.delete('page');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.destination]);

  const slug = fromUrl || trip.destination;
  return { slug, destination: findDestination(slug), ready: destinations.length > 0, params, setParams };
}
