import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Clock, PawPrint, Utensils, Check, Users, BedDouble, Wind } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import useApi from '../../hooks/useApi';
import { useTrip } from '../../context/TripContext';
import BookingWidget from '../../components/booking/BookingWidget';
import ReviewsSection from '../../components/listing/ReviewsSection';
import ContactPartner from '../../components/listing/ContactPartner';
import SaveButton from '../../components/listing/SaveButton';
import MapView from '../../components/listing/MapView';
import { HotelCard } from '../../components/listing/Cards';
import { PageLoader, ErrorState, Stars, Price, Breadcrumbs, Field, todayPlus } from '../../components/ui';

export default function HotelDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { trip } = useTrip();
  const { data, body, loading, error, reload } = useApi(`/hotels/${id}`);
  usePageTitle(data?.name);
  const [dates, setDates] = useState({
    checkIn: params.get('checkIn') || trip.startDate,
    checkOut: params.get('checkOut') || (trip.endDate > trip.startDate ? trip.endDate : todayPlus(15))
  });
  const availability = useApi(dates.checkOut > dates.checkIn ? `/hotels/${id}/availability` : null, { params: dates });
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    if (data && !roomId) setRoomId(data.rooms[0]._id);
  }, [data, roomId]);

  if (loading) return <PageLoader />;
  if (error) return <div className="main-container"><ErrorState message={error} onRetry={reload} /></div>;

  const hotel = data;
  const avail = Object.fromEntries((availability.data?.rooms || []).map((r) => [r.roomId, r]));

  return (
    <div className="main-container">
      <Breadcrumbs items={[{ label: hotel.destination.name, to: `/destinations/${hotel.destination.slug}` }, { label: 'Hotels', to: `/hotels?destination=${hotel.destination.slug}` }, { label: hotel.name }]} />
      <div className="detail-layout">
        <div>
          <div className="detail-gallery"><img src={hotel.imageUrl} alt={hotel.name} /></div>
          <div className="row-between">
            <div>
              <span className="badge badge-yellow">{'★'.repeat(hotel.starRating)} hotel</span>
              <h1 style={{ fontSize: 28, margin: '8px 0 4px', textTransform: 'none' }}>{hotel.name}</h1>
              <p className="muted small"><MapPin size={12} /> {hotel.address}</p>
            </div>
            <div className="row"><Stars value={hotel.rating} count={hotel.reviewCount} /><SaveButton itemType="hotel" itemId={hotel._id} /></div>
          </div>
          <p style={{ margin: '14px 0' }}>{hotel.description}</p>
          <div className="kv">
            <div><b>Check-in / out</b><Clock size={12} /> {hotel.checkInTime} / {hotel.checkOutTime}</div>
            <div><b>Pets</b><PawPrint size={12} /> {hotel.petFriendly ? 'Welcome' : 'Not allowed'}</div>
            <div><b>Cancellation</b>{hotel.cancellationPolicy}</div>
            <div><b>Hosted by</b>{hotel.agency?.name}</div>
          </div>

          <section className="section">
            <h2 className="section-title">Choose your room</h2>
            <div className="form-grid" style={{ maxWidth: 440 }}>
              <Field label="Check-in"><input type="date" className="form-control" min={todayPlus(1)} value={dates.checkIn} onChange={(e) => setDates({ ...dates, checkIn: e.target.value })} /></Field>
              <Field label="Check-out"><input type="date" className="form-control" min={dates.checkIn} value={dates.checkOut} onChange={(e) => setDates({ ...dates, checkOut: e.target.value })} /></Field>
            </div>
            {hotel.rooms.map((room) => {
              const a = avail[room._id];
              const soldOut = a && a.available === 0;
              return (
                <div
                  key={room._id}
                  role="button"
                  tabIndex={0}
                  className={`room-row ${roomId === room._id ? 'selected' : ''} ${soldOut ? 'disabled' : ''}`}
                  onClick={() => !soldOut && setRoomId(room._id)}
                  onKeyDown={(e) => e.key === 'Enter' && !soldOut && setRoomId(room._id)}
                >
                  <div>
                    <b>{room.name}</b>
                    <div className="chips" style={{ marginTop: 4 }}>
                      <span className="chip"><Users size={11} /> sleeps {room.maxGuests}</span>
                      <span className="chip"><BedDouble size={11} /> {room.bedType}</span>
                      <span className="chip"><Wind size={11} /> {room.acType}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Price value={room.pricePerNight} suffix="/ night" />
                    <div className="small" style={{ color: soldOut ? 'var(--status-cancelled)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {a ? (soldOut ? 'Sold out for these dates' : `${a.available} left`) : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="section">
            <h2 className="section-title">Amenities & dining</h2>
            <div className="chips">{hotel.amenities.map((a) => <span key={a} className="chip"><Check size={11} /> {a}</span>)}</div>
            {hotel.diningOptions.length > 0 && <p className="small" style={{ marginTop: 10 }}><Utensils size={12} /> {hotel.diningOptions.join(' · ')}</p>}
          </section>

          <section className="section">
            <h2 className="section-title">Location</h2>
            <MapView center={hotel.coordinates?.lat ? hotel.coordinates : hotel.destination.coordinates} markers={[{ ...hotel.coordinates, title: hotel.name, kind: 'hotel', label: 'H' }]} zoom={13} />
          </section>

          <ReviewsSection itemType="hotel" itemId={hotel._id} rating={hotel.rating} count={hotel.reviewCount} />

          {body.similar?.length > 0 && (
            <section className="section">
              <h2 className="section-title">Other stays in {hotel.destination.name}</h2>
              <div className="grid-auto">{body.similar.map((h) => <HotelCard key={h._id} hotel={h} />)}</div>
            </section>
          )}
        </div>

        <aside className="sticky-panel stack">
          {roomId && <BookingWidget key={`${roomId}-${dates.checkIn}-${dates.checkOut}`} itemType="hotel" item={hotel} roomId={roomId} initialDate={dates.checkIn} initialEndDate={dates.checkOut} />}
          <div className="row">
            <ContactPartner itemType="hotel" itemId={hotel._id} partnerName={hotel.agency?.name} />
            <Link className="btn btn-sm btn-outline" to={`/transports?destination=${hotel.destination.slug}`}>Cabs in {hotel.destination.name}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
