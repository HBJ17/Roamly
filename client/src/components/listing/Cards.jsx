import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock, Wind, PawPrint, Car, Bus, Train, Plane, ArrowRight, CalendarDays, Scale } from 'lucide-react';
import { Stars, Price } from '../ui';
import { useApp } from '../../context/AppContext';
import SaveButton from './SaveButton';

const FALLBACK = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';
const img = (src) => src || FALLBACK;
const onImgError = (e) => {
  if (e.currentTarget.src !== FALLBACK) e.currentTarget.src = FALLBACK;
};

export function HotelCard({ hotel, search = '' }) {
  const { t } = useApp();
  const maxGuests = Math.max(...hotel.rooms.map((r) => r.maxGuests));
  return (
    <Link to={`/hotels/${hotel._id}${search}`} className="listing-card plain">
      <div className="listing-card-img">
        <img src={img(hotel.imageUrl)} alt="" loading="lazy" onError={onImgError} />
        <div className="corner"><span className="badge badge-yellow">{'★'.repeat(hotel.starRating)}</span></div>
        <div className="save-btn-wrap" style={{ position: 'absolute', top: 10, right: 10 }}><SaveButton itemType="hotel" itemId={hotel._id} /></div>
      </div>
      <div className="listing-card-body">
        <div className="row-between"><span className="small muted"><MapPin size={12} /> {hotel.destinationName}</span><Stars value={hotel.rating} count={hotel.reviewCount} /></div>
        <h3>{hotel.name}</h3>
        <div className="chips">
          <span className="chip"><Users size={11} /> up to {maxGuests} / room</span>
          {hotel.petFriendly && <span className="chip"><PawPrint size={11} /> Pets OK</span>}
          <span className="chip">{hotel.rooms.length} room types</span>
          <span className="chip">{hotel.cancellationPolicy} cancellation</span>
        </div>
        <div className="listing-card-foot">
          <span className="small muted">from</span>
          <Price value={hotel.startingPrice} suffix={t('per_night')} />
        </div>
      </div>
    </Link>
  );
}

export function CabCard({ cab, search = '' }) {
  const { t } = useApp();
  return (
    <Link to={`/transports/${cab._id}${search}`} className="listing-card plain">
      <div className="listing-card-img">
        <img src={img(cab.imageUrl)} alt="" loading="lazy" onError={onImgError} />
        <div className="corner"><span className="badge badge-blue">{cab.serviceType}</span><span className="badge badge-neutral">{cab.vehicleType}</span></div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}><SaveButton itemType="transport" itemId={cab._id} /></div>
      </div>
      <div className="listing-card-body">
        <div className="row-between"><span className="small muted"><MapPin size={12} /> {cab.destinationName}</span><Stars value={cab.rating} count={cab.reviewCount} /></div>
        <h3>{cab.title}</h3>
        <p className="small muted">{cab.coverage}</p>
        <div className="chips">
          <span className="chip"><Users size={11} /> {cab.seatingCapacity} seats</span>
          <span className="chip"><Wind size={11} /> {cab.acType}</span>
          {cab.serviceType === 'Chauffeur' && <span className="chip">{cab.includedKmPerDay} km/day incl.</span>}
        </div>
        <div className="listing-card-foot">
          <span className="small muted">{cab.agency?.name}</span>
          <Price value={cab.dailyRate} suffix={t('per_day')} />
        </div>
      </div>
    </Link>
  );
}

const MODE_ICONS = { Bus, Train, Flight: Plane };

export function RouteCard({ route, search = '', action }) {
  const { t } = useApp();
  const Icon = MODE_ICONS[route.vehicleType] || Car;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row-between">
        <span className="badge badge-peach"><Icon size={12} /> {route.vehicleType} · {route.classType || route.acType}</span>
        <Stars value={route.rating} count={route.reviewCount} />
      </div>
      <h3 style={{ fontSize: 15, margin: '10px 0', textTransform: 'none' }}>{route.title}</h3>
      <div className="route-waypoint-container" style={{ marginBottom: 10 }}>
        <div className="row-between">
          <div><b className="font-grotesk" style={{ fontSize: 20 }}>{route.departureTime}</b><div className="small muted">{route.originName}</div></div>
          <div className="small muted" style={{ textAlign: 'center' }}><Clock size={12} /> {route.durationHours}h<br /><ArrowRight size={14} /></div>
          <div style={{ textAlign: 'right' }}><b className="font-grotesk" style={{ fontSize: 20 }}>{route.arrivalTime}</b><div className="small muted">{route.destinationName}</div></div>
        </div>
      </div>
      <div className="row-between">
        <span className="small muted">{route.available !== undefined ? `${route.available} seats left` : route.agency?.name}</span>
        <div className="row">
          <Price value={route.fare} suffix={t('per_seat')} />
          {action || <Link to={`/transports/${route._id}${search}`} className="btn btn-sm btn-yellow">{t('view_details')}</Link>}
        </div>
      </div>
    </div>
  );
}

export function PackageCard({ pkg, search = '' }) {
  const { t, toggleCompare, isComparing, compareFull } = useApp();
  const comparing = isComparing(pkg._id);
  return (
    <Link to={`/packages/${pkg._id}${search}`} className="listing-card plain">
      <div className="listing-card-img">
        <img src={img(pkg.imageUrl)} alt="" loading="lazy" onError={onImgError} />
        <div className="corner"><span className="badge badge-mint">{pkg.category}</span><span className="badge badge-yellow"><CalendarDays size={11} /> {pkg.durationDays}D / {pkg.durationNights}N</span></div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}><SaveButton itemType="package" itemId={pkg._id} /></div>
      </div>
      <div className="listing-card-body">
        <div className="row-between"><span className="small muted"><MapPin size={12} /> {pkg.destinationName}</span><Stars value={pkg.rating} count={pkg.reviewCount} /></div>
        <h3>{pkg.title}</h3>
        <p className="small muted">{(pkg.highlights || []).slice(0, 3).join(' · ')}</p>
        <div className="listing-card-foot">
          <button
            type="button"
            className={`btn btn-sm ${comparing ? 'btn-mint' : 'btn-outline'}`}
            disabled={!comparing && compareFull}
            onClick={(e) => { e.preventDefault(); toggleCompare(pkg); }}
            title={compareFull && !comparing ? 'You can compare up to 4 packages' : ''}
          >
            <Scale size={12} /> {comparing ? 'Comparing' : t('compare')}
          </button>
          <Price value={pkg.price} suffix={t('per_person')} />
        </div>
      </div>
    </Link>
  );
}

export function DestinationTile({ destination }) {
  return (
    <Link to={`/destinations/${destination.slug}`} className="dest-tile" style={{ backgroundImage: `url(${img(destination.imageUrl)})` }}>
      <div className="dest-tile-body">
        <span className="small">{destination.state}</span>
        <h3>{destination.name}</h3>
        <p>{destination.tagline}</p>
        {destination.stats && (
          <div className="dest-stats">
            <span>{destination.stats.hotels} stays</span>
            <span>{destination.stats.cabs} cabs</span>
            <span>{destination.stats.packages} packages</span>
            {destination.attractionCount !== undefined && <span>{destination.attractionCount} sights</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
