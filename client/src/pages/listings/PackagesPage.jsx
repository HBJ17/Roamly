import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Map } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useScopedDestination from '../../hooks/useScopedDestination';
import { useApp } from '../../context/AppContext';
import { useTrip } from '../../context/TripContext';
import { PackageCard } from '../../components/listing/Cards';
import { PageHeader, Skeleton, EmptyState, ErrorState, Pagination, Tabs } from '../../components/ui';

const CATEGORIES = ['', 'Hill Station', 'Beach', 'Heritage', 'Pilgrimage', 'Cultural', 'Wildlife', 'Adventure'];

// Packages can be browsed across all cities (choosing a city narrows them), unlike hotels and cabs.
export default function PackagesPage() {
  const { slug, destination } = useScopedDestination();
  const { updateTrip, destinations } = useTrip();
  const { t } = useApp();
  const [filters, setFilters] = useState({ category: '', sort: 'recommended', maxDays: '', maxPrice: '', q: '' });
  const [page, setPage] = useState(1);
  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };

  const params = Object.fromEntries(Object.entries({ ...filters, destination: slug, page }).filter(([, v]) => v !== '' && v !== undefined));
  const { body, loading, error, reload } = useApi('/packages', { params });
  const city = destination?.name;

  return (
    <div className="main-container">
      <PageHeader badge="Ready-made holidays" tone="peach" title={city ? t('packages_in', { city }) : t('packages')} subtitle="Run by tour operators based in each city, with stays in that same city.">
        <Link to={`/plan${slug ? `?destination=${slug}` : ''}`} className="btn btn-yellow"><Map size={14} /> Build your own instead</Link>
      </PageHeader>

      <div className="toolbar">
        <select className="form-control" value={slug || ''} onChange={(e) => updateTrip({ destination: e.target.value })} aria-label="City">
          <option value="">All cities</option>
          {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
        <input className="form-control" placeholder="Search packages" value={filters.q} onChange={set('q')} aria-label="Search" />
        <select className="form-control" value={filters.maxDays} onChange={set('maxDays')} aria-label="Duration">
          <option value="">Any length</option>
          <option value="3">Up to 3 days</option>
          <option value="5">Up to 5 days</option>
          <option value="7">Up to 7 days</option>
        </select>
        <input className="form-control" type="number" min={0} step={1000} placeholder="Max ₹ / person" value={filters.maxPrice} onChange={set('maxPrice')} aria-label="Maximum price" />
        <select className="form-control" value={filters.sort} onChange={set('sort')} aria-label="Sort">
          <option value="recommended">Recommended</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="duration">Shortest first</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <Tabs tabs={CATEGORIES.map((c) => ({ id: c, label: c || 'All types' }))} active={filters.category} onChange={(c) => { setFilters({ ...filters, category: c }); setPage(1); }} />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading ? <Skeleton height={340} /> : body?.data?.length ? (
        <>
          <div className="grid-auto">{body.data.map((p) => <PackageCard key={p._id} pkg={p} />)}</div>
          <Pagination page={body.page} pages={body.pages} onChange={setPage} />
        </>
      ) : !error && <EmptyState icon={Package} title={city ? `No matching packages in ${city}` : 'No matching packages'}>{t('no_results')}</EmptyState>}
    </div>
  );
}
