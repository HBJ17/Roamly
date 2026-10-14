import React, { useEffect, useState } from 'react';
import { Car, Bus } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useScopedDestination from '../../hooks/useScopedDestination';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';
import { CabCard, RouteCard } from '../../components/listing/Cards';
import ChooseDestination from '../../components/listing/ChooseDestination';
import { PageHeader, Skeleton, EmptyState, ErrorState, Pagination, Tabs, Field, todayPlus } from '../../components/ui';

function LocalCabs({ slug, city }) {
  const { travellers } = useTrip();
  const [filters, setFilters] = useState({ sort: 'recommended', serviceType: '', ac: '' });
  const [page, setPage] = useState(1);
  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };
  const params = Object.fromEntries(Object.entries({ ...filters, scope: 'local', destination: slug, page }).filter(([, v]) => v !== ''));
  const { body, loading, error, reload } = useApi('/transports', { params });

  return (
    <>
      <div className="toolbar">
        <select className="form-control" value={filters.serviceType} onChange={set('serviceType')} aria-label="Service">
          <option value="">Chauffeur or self-drive</option>
          <option value="Chauffeur">With driver</option>
          <option value="Self-Drive">Self-drive</option>
        </select>
        <select className="form-control" value={filters.ac} onChange={set('ac')} aria-label="AC">
          <option value="">AC or non-AC</option>
          <option value="AC">AC</option>
          <option value="Non-AC">Non-AC</option>
        </select>
        <select className="form-control" value={filters.sort} onChange={set('sort')} aria-label="Sort">
          <option value="recommended">Recommended</option>
          <option value="price_asc">Daily rate: low to high</option>
          <option value="price_desc">Daily rate: high to low</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading ? <Skeleton height={330} /> : body?.data?.length ? (
        <>
          <p className="small muted" style={{ marginBottom: 12 }}>{body.total} cab services based in {city}. Vehicles with fewer than {travellers} seats can still be booked as multiple vehicles.</p>
          <div className="grid-auto">{body.data.map((c) => <CabCard key={c._id} cab={c} />)}</div>
          <Pagination page={body.page} pages={body.pages} onChange={setPage} />
        </>
      ) : !error && <EmptyState icon={Car} title={`No cabs in ${city} match these filters`} />}
    </>
  );
}

function Intercity({ slug, city }) {
  const { trip, updateTrip, destinations } = useTrip();
  const [direction, setDirection] = useState('to');
  const [date, setDate] = useState(trip.startDate);
  const [sort, setSort] = useState('departure');
  const other = trip.origin && trip.origin !== slug ? trip.origin : '';
  const from = direction === 'to' ? other : slug;
  const to = direction === 'to' ? slug : other;

  const params = Object.fromEntries(Object.entries({ scope: 'intercity', from, to, date, sort, limit: 30 }).filter(([, v]) => v));
  const { body, loading, error, reload } = useApi('/transports', { params });

  return (
    <>
      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <div className="search-panel">
          <Field label="Direction">
            <select className="form-control" value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="to">Into {city}</option>
              <option value="from">Out of {city}</option>
            </select>
          </Field>
          <Field label={direction === 'to' ? 'From' : 'To'}>
            <select className="form-control" value={other} onChange={(e) => updateTrip({ origin: e.target.value })}>
              <option value="">Any city</option>
              {destinations.filter((d) => d.slug !== slug).map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Travel date">
            <input type="date" className="form-control" min={todayPlus(1)} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Sort">
            <select className="form-control" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="departure">Departure time</option>
              <option value="price_asc">Cheapest</option>
              <option value="duration">Fastest</option>
            </select>
          </Field>
        </div>
      </div>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading ? <Skeleton height={200} /> : body?.data?.length ? (
        <div className="grid-auto">{body.data.map((r) => <RouteCard key={r._id} route={r} search={`?date=${date}`} />)}</div>
      ) : !error && <EmptyState icon={Bus} title="No services on this route and day">Try another date or a nearby city.</EmptyState>}
    </>
  );
}

export default function TransportsPage() {
  const { slug, destination, ready, params, setParams } = useScopedDestination();
  const { t } = useApp();
  const [scope, setScope] = useState(params.get('scope') === 'intercity' ? 'intercity' : 'local');
  const city = destination?.name || slug;

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set('scope', scope);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  return (
    <div className="main-container">
      <PageHeader badge="Getting around" tone="blue" title={slug ? `${t('transports')}: ${city}` : t('transports')} subtitle="Local cabs work only inside their home city. Buses, trains and flights connect cities." />
      {ready && !slug && <ChooseDestination what="cabs and routes" />}
      {slug && (
        <>
          <Tabs
            tabs={[{ id: 'local', label: `Cabs in ${city}`, icon: Car }, { id: 'intercity', label: 'Buses, trains & flights', icon: Bus }]}
            active={scope}
            onChange={setScope}
          />
          {scope === 'local' ? <LocalCabs slug={slug} city={city} /> : <Intercity slug={slug} city={city} />}
        </>
      )}
    </div>
  );
}
