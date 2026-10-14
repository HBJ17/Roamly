import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Hotel, Car, Package, Map, Landmark, Route as RouteIcon, Clock, Ticket, Sun, Plane, Train } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import useApi from '../hooks/useApi';
import { useTrip } from '../context/TripContext';
import { useApp } from '../context/AppContext';
import { HotelCard, CabCard, PackageCard } from '../components/listing/Cards';
import MapView from '../components/listing/MapView';
import { PageLoader, ErrorState, EmptyState, Tabs, Price, Breadcrumbs } from '../components/ui';

export default function DestinationPage() {
  const { slug } = useParams();
  const { trip, updateTrip } = useTrip();
  const { t } = useApp();
  const { data, loading, error, reload } = useApi(`/destinations/${slug}/explore`);
  usePageTitle(data?.destination?.name);
  const [tab, setTab] = useState('stays');

  // Visiting a city page makes it the active destination everywhere.
  useEffect(() => {
    if (data?.destination && trip.destination !== slug) updateTrip({ destination: slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, slug]);

  const markers = useMemo(() => {
    if (!data) return [];
    return [
      ...data.destination.attractions.map((a) => ({ ...a.coordinates, title: a.name, subtitle: a.category, kind: 'attraction' })),
      ...data.hotels.map((h) => ({ ...h.coordinates, title: h.name, subtitle: 'Hotel', kind: 'hotel', label: 'H' }))
    ];
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <div className="main-container"><ErrorState message={error} onRetry={reload} /></div>;
  const { destination, hotels, cabs, packages, arrivals, stats } = data;
  const city = destination.name;

  const tabs = [
    { id: 'stays', label: 'Stays', icon: Hotel, count: stats.hotels },
    { id: 'cabs', label: 'Local cabs', icon: Car, count: stats.cabs },
    { id: 'packages', label: 'Packages', icon: Package, count: stats.packages },
    { id: 'sights', label: 'Things to do', icon: Landmark, count: stats.attractions },
    { id: 'getting', label: 'Getting here', icon: RouteIcon, count: arrivals.length }
  ];

  return (
    <div className="main-container">
      <Breadcrumbs items={[{ label: 'Destinations', to: '/destinations' }, { label: city }]} />
      <div className="hero-image" style={{ backgroundImage: `url(${destination.imageUrl})` }}>
        <div className="hero-body">
          <span className="badge badge-yellow">{destination.state}</span>
          <h1>{city}</h1>
          <p style={{ maxWidth: 640 }}>{destination.tagline}</p>
          <div className="row" style={{ marginTop: 12 }}>
            <Link to={`/plan?destination=${slug}`} className="btn btn-yellow"><Map size={15} /> Plan a {city} trip</Link>
            <Link to={`/packages?destination=${slug}`} className="btn btn-outline">Browse packages</Link>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div>
          <p style={{ marginBottom: 16 }}>{destination.description}</p>
          <div className="kv" style={{ marginBottom: 24 }}>
            <div><b>Best time</b><Sun size={12} /> {destination.bestTimeToVisit}</div>
            <div><b>Ideal stay</b>{destination.idealDays} days</div>
            <div><b>Nearest airport</b><Plane size={12} /> {destination.nearestAirport}</div>
            <div><b>Nearest railway</b><Train size={12} /> {destination.nearestRailway}</div>
          </div>

          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'stays' && (
            <>
              <div className="grid-auto">{hotels.map((h) => <HotelCard key={h._id} hotel={h} />)}</div>
              {stats.hotels > hotels.length && <Link className="btn btn-outline" style={{ marginTop: 16 }} to={`/hotels?destination=${slug}`}>All {stats.hotels} stays in {city}</Link>}
              {!hotels.length && <EmptyState title={`No stays listed in ${city} yet`} />}
            </>
          )}
          {tab === 'cabs' && (
            <>
              <p className="small muted" style={{ marginBottom: 12 }}>These operators are based in {city} and only run trips around it.</p>
              <div className="grid-auto">{cabs.map((c) => <CabCard key={c._id} cab={c} />)}</div>
              {!cabs.length && <EmptyState title={`No cabs listed in ${city} yet`} />}
            </>
          )}
          {tab === 'packages' && (
            <>
              <div className="grid-auto">{packages.map((p) => <PackageCard key={p._id} pkg={p} />)}</div>
              {!packages.length && <EmptyState title={`No packages in ${city} yet`} action={<Link className="btn btn-primary" to={`/plan?destination=${slug}`}>Build your own trip</Link>} />}
            </>
          )}
          {tab === 'sights' && (
            <div className="grid-auto-sm">
              {destination.attractions.map((a) => (
                <div key={a._id} className="card" style={{ padding: 16 }}>
                  <span className="badge badge-blue">{a.category}</span>
                  <h3 style={{ fontSize: 15, margin: '8px 0 4px', textTransform: 'none' }}>{a.name}</h3>
                  <p className="small muted">{a.description}</p>
                  <div className="chips" style={{ marginTop: 8 }}>
                    <span className="chip"><Clock size={11} /> {a.durationHours}h</span>
                    <span className="chip"><Sun size={11} /> {a.bestTimeOfDay}</span>
                    <span className="chip"><Ticket size={11} /> {a.entryFee ? <Price value={a.entryFee} /> : 'Free'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'getting' && (
            <div className="stack">
              {arrivals.map((a) => (
                <div key={a.origin} className="card row-between" style={{ padding: 14 }}>
                  <div><b>From {a.originName}</b><div className="small muted">{a.modes.join(' · ')} · {a.services} services · fastest {a.fastestHours}h</div></div>
                  <div className="row">
                    <span className="small muted">from</span> <Price value={a.lowestFare} />
                    <Link className="btn btn-sm btn-yellow" to={`/transports?scope=intercity&from=${a.originName.toLowerCase()}&to=${slug}`}>See times</Link>
                  </div>
                </div>
              ))}
              {!arrivals.length && <EmptyState title={`No direct services into ${city} listed yet`} />}
            </div>
          )}
        </div>

        <aside className="sticky-panel stack">
          <MapView center={destination.coordinates} markers={markers} zoom={12} height={320} />
          <div className="card" style={{ padding: 16, background: 'var(--pastel-mint-light)' }}>
            <h3 style={{ fontSize: 15 }}>{t('things_to_do', { city })}</h3>
            <p className="small muted" style={{ margin: '6px 0 10px' }}>Our planner spreads these across your days and matches them to your hotel and cab.</p>
            <Link to={`/plan?destination=${slug}`} className="btn btn-primary btn-block"><Map size={14} /> Start planning</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
