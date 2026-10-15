import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { DestinationTile } from '../components/listing/Cards';
import { PageHeader, Skeleton, Tabs } from '../components/ui';

const CATEGORIES = ['All', 'Hill Station', 'Beach', 'Heritage', 'Pilgrimage', 'Cultural'];

export default function DestinationsPage() {
  const { destinations } = useTrip();
  const [category, setCategory] = useState('All');
  const list = category === 'All' ? destinations : destinations.filter((d) => d.categories.includes(category));

  return (
    <div className="main-container">
      <PageHeader badge="Choose a city" title="Destinations" subtitle="Each city has its own local hotels, cab operators and tour guides. Pick one to see only what serves it." />
      <Tabs tabs={CATEGORIES.map((c) => ({ id: c, label: c }))} active={category} onChange={setCategory} />
      {destinations.length ? (
        <div className="grid-auto">{list.map((d) => <DestinationTile key={d.slug} destination={d} />)}</div>
      ) : <Skeleton height={220} count={6} />}
    </div>
  );
}
