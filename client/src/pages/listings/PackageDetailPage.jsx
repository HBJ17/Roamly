import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Check, X, Utensils, Users, Hotel, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import useApi from '../../hooks/useApi';
import BookingWidget from '../../components/booking/BookingWidget';
import ReviewsSection from '../../components/listing/ReviewsSection';
import ContactPartner from '../../components/listing/ContactPartner';
import SaveButton from '../../components/listing/SaveButton';
import MapView from '../../components/listing/MapView';
import { PackageCard, CabCard } from '../../components/listing/Cards';
import { PageLoader, ErrorState, Stars, Breadcrumbs } from '../../components/ui';

export default function PackageDetailPage() {
  const { id } = useParams();
  const { data: pkg, body, loading, error, reload } = useApi(`/packages/${id}`);

  if (loading) return <PageLoader />;
  if (error) return <div className="main-container"><ErrorState message={error} onRetry={reload} /></div>;
  const city = pkg.destination;
  const sights = new Map(city.attractions.map((a) => [a.name, a]));
  const planSights = pkg.dayPlan.flatMap((d) => d.attractions).map((n) => sights.get(n)).filter(Boolean);

  return (
    <div className="main-container">
      <Breadcrumbs items={[{ label: city.name, to: `/destinations/${city.slug}` }, { label: 'Packages', to: `/packages?destination=${city.slug}` }, { label: pkg.title }]} />
      <div className="detail-layout">
        <div>
          <div className="detail-gallery"><img src={pkg.imageUrl} alt={pkg.title} /></div>
          <div className="row-between">
            <div>
              <div className="row"><span className="badge badge-mint">{pkg.category}</span><span className="badge badge-yellow"><CalendarDays size={11} /> {pkg.durationDays} days / {pkg.durationNights} nights</span></div>
              <h1 style={{ fontSize: 26, margin: '8px 0 4px', textTransform: 'none' }}>{pkg.title}</h1>
              <p className="muted small"><MapPin size={12} /> {city.name} · by {pkg.agency?.name} · ideal for {pkg.idealFor}</p>
            </div>
            <div className="row"><Stars value={pkg.rating} count={pkg.reviewCount} /><SaveButton itemType="package" itemId={pkg._id} /></div>
          </div>
          <p style={{ margin: '14px 0' }}>{pkg.description}</p>

          {pkg.hotel && (
            <Link to={`/hotels/${pkg.hotel._id}`} className="option-card plain" style={{ marginBottom: 16 }}>
              <img src={pkg.hotel.imageUrl} alt="" />
              <span><span className="small muted"><Hotel size={12} /> Your stay in {city.name}</span><br /><b>{pkg.hotel.name}</b> · {'★'.repeat(pkg.hotel.starRating)}</span>
            </Link>
          )}

          <section className="section">
            <h2 className="section-title">Day by day</h2>
            <div className="timeline">
              {pkg.dayPlan.map((d) => (
                <div key={d.day} className="timeline-item">
                  <div className="timeline-dot">{d.day}</div>
                  <div className="timeline-content">
                    <b>{d.title}</b>
                    {d.description && <p className="small">{d.description}</p>}
                    {d.attractions.length > 0 && <div className="chips" style={{ marginTop: 6 }}>{d.attractions.map((a) => <span key={a} className="chip">{a}</span>)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section grid-2">
            <div>
              <h3 className="section-title" style={{ fontSize: 16 }}>Included</h3>
              {pkg.inclusions.map((i) => <p key={i} className="small"><Check size={12} /> {i}</p>)}
            </div>
            <div>
              <h3 className="section-title" style={{ fontSize: 16 }}>Not included</h3>
              {pkg.exclusions.map((i) => <p key={i} className="small"><X size={12} /> {i}</p>)}
            </div>
          </section>

          {(pkg.pros.length > 0 || pkg.cons.length > 0) && (
            <section className="section grid-2">
              <div>{pkg.pros.map((p) => <p key={p} className="small"><ThumbsUp size={12} /> {p}</p>)}</div>
              <div>{pkg.cons.map((c) => <p key={c} className="small"><ThumbsDown size={12} /> {c}</p>)}</div>
            </section>
          )}

          {pkg.foodHighlights.length > 0 && (
            <section className="section">
              <h3 className="section-title" style={{ fontSize: 16 }}><Utensils size={16} /> Food to try</h3>
              <div className="chips">{pkg.foodHighlights.map((f) => <span key={f} className="chip">{f}</span>)}</div>
            </section>
          )}

          {planSights.length > 0 && (
            <section className="section">
              <h2 className="section-title">Where you'll go</h2>
              <MapView center={city.coordinates} markers={planSights.map((a) => ({ ...a.coordinates, title: a.name, subtitle: a.category, kind: 'attraction' }))} />
            </section>
          )}

          <ReviewsSection itemType="package" itemId={pkg._id} rating={pkg.rating} count={pkg.reviewCount} />

          {body.localCabs?.length > 0 && (
            <section className="section">
              <h2 className="section-title">Need extra cab days in {city.name}?</h2>
              <div className="grid-auto">{body.localCabs.map((c) => <CabCard key={c._id} cab={c} />)}</div>
            </section>
          )}
          {body.similar?.length > 0 && (
            <section className="section">
              <h2 className="section-title">More packages in {city.name}</h2>
              <div className="grid-auto">{body.similar.map((p) => <PackageCard key={p._id} pkg={p} />)}</div>
            </section>
          )}
        </div>
        <aside className="sticky-panel stack">
          <BookingWidget itemType="package" item={pkg} />
          <p className="small muted"><Users size={12} /> Max {pkg.maxGroupSize} travellers per departure.</p>
          <ContactPartner itemType="package" itemId={pkg._id} partnerName={pkg.agency?.name} />
        </aside>
      </div>
    </div>
  );
}
