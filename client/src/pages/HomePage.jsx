import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Map, Hotel, Car, ShieldCheck, Wallet, MapPin, Tag } from 'lucide-react';
import useApi from '../hooks/useApi';
import { useTrip } from '../context/TripContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import TripSearch from '../components/listing/TripSearch';
import { DestinationTile, PackageCard } from '../components/listing/Cards';
import { Skeleton } from '../components/ui';

const STEPS = [
  { icon: MapPin, title: 'Pick a city', text: 'Everything you see after that — stays, cabs, tours — is from that city only.' },
  { icon: Map, title: 'Plan or pick a package', text: 'Build a day-by-day trip with travel, hotel and cab, or choose a ready-made package.' },
  { icon: Wallet, title: 'Hold & pay securely', text: 'Inventory is held while you pay by wallet, UPI or card. Instant voucher with QR.' },
  { icon: ShieldCheck, title: 'Travel with local partners', text: 'Verified hotels and drivers in each city, with reviews only from real guests.' }
];

export default function HomePage() {
  const { trip, destinations } = useTrip();
  const { t, formatCurrency } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const packages = useApi('/packages', { params: { sort: 'rating', limit: 6 } });
  const offers = useApi('/coupons');

  const go = (e) => {
    e.preventDefault();
    if (!trip.destination) return toast.info('Choose where you want to go first');
    return navigate(`/destinations/${trip.destination}`);
  };

  return (
    <div className="main-container">
      <section className="travel-hero" style={{ background: 'var(--pastel-yellow-light)' }}>
        <span className="badge badge-mint">South India, curated</span>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', margin: '10px 0 6px' }}>Where are you headed?</h1>
        <p className="muted" style={{ maxWidth: 620, marginBottom: 18 }}>
          Choose a city and Roamly shows only the hotels, cabs, tours and routes that actually serve it — then lets you book them together.
        </p>
        <form onSubmit={go}>
          <TripSearch fields={['origin', 'destination', 'dates', 'travellers']} dateLabels={['Going on', 'Coming back']}>
            <button type="submit" className="btn btn-primary" style={{ height: 42 }}><Search size={15} /> {t('explore')}</button>
          </TripSearch>
        </form>
        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btn btn-sm btn-yellow" to="/plan"><Map size={13} /> Build a custom trip</Link>
          <Link className="btn btn-sm btn-outline" to="/hotels"><Hotel size={13} /> Just a hotel</Link>
          <Link className="btn btn-sm btn-outline" to="/transports"><Car size={13} /> Just a cab</Link>
        </div>
      </section>

      <section className="section">
        <div className="row-between"><h2 className="section-title"><MapPin size={20} /> {t('destinations')}</h2><Link className="link small" to="/destinations">See all</Link></div>
        {destinations.length ? (
          <div className="grid-auto">{destinations.map((d) => <DestinationTile key={d.slug} destination={d} />)}</div>
        ) : <Skeleton height={220} />}
      </section>

      {offers.data?.length > 0 && (
        <section className="section">
          <h2 className="section-title"><Tag size={20} /> Offers right now</h2>
          <div className="grid-auto-sm">
            {offers.data.slice(0, 4).map((c) => (
              <div key={c.code} className="card" style={{ padding: 16, background: 'var(--pastel-peach-light)' }}>
                <span className="postal-stamp-box" style={{ display: 'inline-block' }}><b>{c.code}</b></span>
                <p style={{ margin: '10px 0 4px', fontWeight: 700 }}>{c.discountType === 'percent' ? `${c.discountValue}% off` : `${formatCurrency(c.discountValue)} off`}{c.applicableTo !== 'all' ? ` ${c.applicableTo}s` : ''}</p>
                <p className="small muted">{c.description}{c.minOrderAmount ? ` · min ${formatCurrency(c.minOrderAmount)}` : ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="row-between"><h2 className="section-title">Top-rated packages</h2><Link className="link small" to="/packages">{t('explore_packages')}</Link></div>
        {packages.loading ? <Skeleton height={320} /> : (
          <div className="grid-auto">{(packages.data || []).map((p) => <PackageCard key={p._id} pkg={p} />)}</div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">How Roamly works</h2>
        <div className="grid-auto-sm">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card" style={{ padding: 18 }}>
              <Icon size={24} />
              <h3 style={{ fontSize: 15, margin: '8px 0 4px' }}>{title}</h3>
              <p className="small muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
