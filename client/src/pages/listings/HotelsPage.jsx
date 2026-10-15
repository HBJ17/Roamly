import React, { useState } from 'react';
import { Hotel } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useScopedDestination from '../../hooks/useScopedDestination';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';
import { HotelCard } from '../../components/listing/Cards';
import ChooseDestination from '../../components/listing/ChooseDestination';
import TripSearch from '../../components/listing/TripSearch';
import { PageHeader, Skeleton, EmptyState, ErrorState, Pagination } from '../../components/ui';

export default function HotelsPage() {
  const { slug, destination, ready } = useScopedDestination();
  const { trip, travellers } = useTrip();
  const { t } = useApp();
  const [filters, setFilters] = useState({ sort: 'recommended', stars: '', ac: '', petFriendly: '', maxPrice: '' });
  const [page, setPage] = useState(1);
  const set = (k) => (e) => {
    setFilters({ ...filters, [k]: e.target.value });
    setPage(1);
  };

  const params = Object.fromEntries(Object.entries({ ...filters, destination: slug, guests: travellers, page }).filter(([, v]) => v !== ''));
  const { body, loading, error, reload } = useApi(slug ? '/hotels' : null, { params });
  const city = destination?.name || slug;

  return (
    <div className="main-container">
      <PageHeader badge="Verified stays" tone="mint" title={slug ? t('stays_in', { city }) : t('hotels')} subtitle={slug ? `Only properties located in ${city}, run by ${city}-based partners.` : 'Pick a city to see its hotels, resorts and homestays.'} />
      {ready && !slug && <ChooseDestination what="hotels" />}

      {slug && (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <TripSearch fields={['destination', 'dates', 'travellers']} />
            <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
              <select className="form-control" value={filters.sort} onChange={set('sort')} aria-label="Sort">
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="rating">Guest rating</option>
                <option value="stars">Star category</option>
              </select>
              <select className="form-control" value={filters.stars} onChange={set('stars')} aria-label="Stars">
                <option value="">Any stars</option>
                <option value="3">3★ and up</option>
                <option value="4">4★ and up</option>
                <option value="5">5★</option>
              </select>
              <select className="form-control" value={filters.ac} onChange={set('ac')} aria-label="AC">
                <option value="">AC or non-AC</option>
                <option value="AC">AC rooms</option>
                <option value="Non-AC">Non-AC rooms</option>
              </select>
              <select className="form-control" value={filters.petFriendly} onChange={set('petFriendly')} aria-label="Pets">
                <option value="">Any pet policy</option>
                <option value="true">Pets welcome</option>
              </select>
              <input className="form-control" type="number" min={0} step={500} placeholder="Max ₹ / night" value={filters.maxPrice} onChange={set('maxPrice')} aria-label="Maximum price" />
            </div>
          </div>

          {error && <ErrorState message={error} onRetry={reload} />}
          {loading ? <Skeleton height={330} /> : body?.data?.length ? (
            <>
              <p className="small muted" style={{ marginBottom: 12 }}>{body.total} stays in {city} with rooms for {travellers} guest{travellers > 1 ? 's' : ''}</p>
              <div className="grid-auto">
                {body.data.map((h) => <HotelCard key={h._id} hotel={h} search={`?checkIn=${trip.startDate}&checkOut=${trip.endDate}`} />)}
              </div>
              <Pagination page={body.page} pages={body.pages} onChange={setPage} />
            </>
          ) : !error && (
            <EmptyState icon={Hotel} title={`No stays in ${city} match`}>{t('no_results')} Try fewer filters or a smaller group per room.</EmptyState>
          )}
        </>
      )}
    </div>
  );
}
