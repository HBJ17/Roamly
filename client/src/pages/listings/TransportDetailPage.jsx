import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Users, Wind, Check, Clock, Utensils, Gauge, ArrowRight } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import useApi from '../../hooks/useApi';
import BookingWidget from '../../components/booking/BookingWidget';
import ReviewsSection from '../../components/listing/ReviewsSection';
import ContactPartner from '../../components/listing/ContactPartner';
import SaveButton from '../../components/listing/SaveButton';
import { CabCard, RouteCard } from '../../components/listing/Cards';
import { PageLoader, ErrorState, Stars, Price, Breadcrumbs } from '../../components/ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TransportDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data: t, body, loading, error, reload } = useApi(`/transports/${id}`);
  usePageTitle(t?.title);

  if (loading) return <PageLoader />;
  if (error) return <div className="main-container"><ErrorState message={error} onRetry={reload} /></div>;
  const local = t.scope === 'local';
  const city = t.destination;

  return (
    <div className="main-container">
      <Breadcrumbs items={[
        { label: city.name, to: `/destinations/${city.slug}` },
        { label: local ? 'Cabs' : 'Intercity', to: `/transports?destination=${city.slug}&scope=${t.scope}` },
        { label: t.title }
      ]} />
      <div className="detail-layout">
        <div>
          <div className="detail-gallery"><img src={t.imageUrl} alt={t.title} /></div>
          <div className="row-between">
            <div>
              <span className="badge badge-blue">{local ? `${t.serviceType} · ${t.vehicleType}` : `${t.vehicleType} · ${t.classType}`}</span>
              <h1 style={{ fontSize: 26, margin: '8px 0 4px', textTransform: 'none' }}>{t.title}</h1>
              <p className="muted small">
                {local ? <><MapPin size={12} /> Operates in {city.name}: {t.coverage}</> : <>{t.origin.name} <ArrowRight size={12} /> {city.name}</>}
              </p>
            </div>
            <div className="row"><Stars value={t.rating} count={t.reviewCount} /><SaveButton itemType="transport" itemId={t._id} /></div>
          </div>

          <div className="kv" style={{ marginTop: 16 }}>
            <div><b>Seats</b><Users size={12} /> {t.seatingCapacity}</div>
            <div><b>Climate</b><Wind size={12} /> {t.acType}</div>
            {local ? (
              <>
                <div><b>Daily rate</b><Price value={t.dailyRate} /></div>
                {t.serviceType === 'Chauffeur' && <div><b>Included</b><Gauge size={12} /> {t.includedKmPerDay} km/day, then ₹{t.extraKmRate}/km</div>}
              </>
            ) : (
              <>
                <div><b>Departs</b><Clock size={12} /> {t.departureTime} from {t.origin.name}</div>
                <div><b>Arrives</b>{t.arrivalTime} in {city.name} ({t.durationHours}h)</div>
                <div><b>Runs on</b>{t.operatingDays.length === 7 ? 'Every day' : t.operatingDays.map((d) => DAYS[d]).join(', ')}</div>
                <div><b>Meals</b><Utensils size={12} /> {t.mealService}</div>
              </>
            )}
            <div><b>Cancellation</b>{t.cancellationPolicy}</div>
            <div><b>Operator</b>{t.agency?.name}</div>
          </div>

          <section className="section">
            <h2 className="section-title">What's included</h2>
            <div className="chips">{t.features.map((f) => <span key={f} className="chip"><Check size={11} /> {f}</span>)}</div>
            {local && <p className="small muted" style={{ marginTop: 10 }}>This operator is based in {city.name}. For travel to another city, see <Link className="link" to={`/transports?destination=${city.slug}&scope=intercity`}>intercity services</Link>.</p>}
          </section>

          <ReviewsSection itemType="transport" itemId={t._id} rating={t.rating} count={t.reviewCount} />

          {body.alternatives?.length > 0 && (
            <section className="section">
              <h2 className="section-title">{local ? `Other cabs in ${city.name}` : `Other ${t.origin.name} → ${city.name} services`}</h2>
              <div className="grid-auto">
                {body.alternatives.map((a) => (local ? <CabCard key={a._id} cab={a} /> : <RouteCard key={a._id} route={a} />))}
              </div>
            </section>
          )}
        </div>
        <aside className="sticky-panel stack">
          <BookingWidget itemType="transport" item={t} initialDate={params.get('date') || undefined} />
          <ContactPartner itemType="transport" itemId={t._id} partnerName={t.agency?.name} />
        </aside>
      </div>
    </div>
  );
}
