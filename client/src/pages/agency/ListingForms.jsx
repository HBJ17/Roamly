import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api, { errorMessage, fieldErrors } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useTrip } from '../../context/TripContext';
import { useToast } from '../../context/ToastContext';
import { Field } from '../../components/ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const list = (v) => (Array.isArray(v) ? v.join(', ') : v || '');
const toList = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

function useSubmit({ endpoint, existing, onSaved }) {
  const toast = useToast();
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (payload) => {
    setBusy(true);
    setErrors({});
    try {
      const res = existing ? await api.put(`${endpoint}/${existing._id}`, payload) : await api.post(endpoint, payload);
      toast.success(existing ? 'Listing updated' : 'Listing published');
      onSaved(res.data.data);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return { submit, errors, busy };
}

export function HotelForm({ existing, city, onSaved }) {
  const [f, setF] = useState(() => ({
    name: existing?.name || '',
    address: existing?.address || '',
    starRating: existing?.starRating || 3,
    description: existing?.description || '',
    imageUrl: existing?.imageUrl || '',
    amenities: list(existing?.amenities),
    diningOptions: list(existing?.diningOptions),
    petFriendly: existing?.petFriendly || false,
    checkInTime: existing?.checkInTime || '14:00',
    checkOutTime: existing?.checkOutTime || '11:00',
    cancellationPolicy: existing?.cancellationPolicy || 'Moderate',
    rooms: existing?.rooms?.map(({ _id, name, pricePerNight, maxGuests, totalRooms, bedType, acType }) => ({ _id, name, pricePerNight, maxGuests, totalRooms, bedType, acType }))
      || [{ name: 'Standard Room', pricePerNight: 2500, maxGuests: 2, totalRooms: 5, bedType: 'Queen Bed', acType: 'AC' }]
  }));
  const { submit, errors, busy } = useSubmit({ endpoint: '/hotels', existing, onSaved });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setRoom = (i, k, v) => setF({ ...f, rooms: f.rooms.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit({ ...f, imageUrl: f.imageUrl || undefined, starRating: Number(f.starRating), amenities: toList(f.amenities), diningOptions: toList(f.diningOptions) }); }}>
      <p className="alert alert-info small">This hotel will be listed in <b>{city}</b>, your registered city.</p>
      <div className="form-grid">
        <Field label="Hotel name" error={errors.name}><input className="form-control" required value={f.name} onChange={set('name')} /></Field>
        <Field label="Star category"><select className="form-control" value={f.starRating} onChange={set('starRating')}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star</option>)}</select></Field>
        <Field label="Check-in"><input type="time" className="form-control" value={f.checkInTime} onChange={set('checkInTime')} /></Field>
        <Field label="Check-out"><input type="time" className="form-control" value={f.checkOutTime} onChange={set('checkOutTime')} /></Field>
        <Field label="Cancellation policy"><select className="form-control" value={f.cancellationPolicy} onChange={set('cancellationPolicy')}>{['Flexible', 'Moderate', 'Strict'].map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Photo URL" error={errors.imageUrl}><input className="form-control" value={f.imageUrl} onChange={set('imageUrl')} placeholder="https://" /></Field>
      </div>
      <Field label={`Address in ${city}`} error={errors.address}><input className="form-control" required value={f.address} onChange={set('address')} /></Field>
      <Field label="Description" error={errors.description}><textarea className="form-control" rows={3} required minLength={20} value={f.description} onChange={set('description')} /></Field>
      <Field label="Amenities" hint="Comma separated"><input className="form-control" value={f.amenities} onChange={set('amenities')} /></Field>
      <Field label="Dining" hint="Comma separated"><input className="form-control" value={f.diningOptions} onChange={set('diningOptions')} /></Field>
      <label className="checkbox" style={{ marginBottom: 14 }}><input type="checkbox" checked={f.petFriendly} onChange={set('petFriendly')} /> Pets welcome</label>

      <h3 className="section-title" style={{ fontSize: 15 }}>Room types</h3>
      {f.rooms.map((r, i) => (
        <div key={r._id || i} className="card" style={{ padding: 12, marginBottom: 10 }}>
          <div className="form-grid">
            <Field label="Name"><input className="form-control" required value={r.name} onChange={(e) => setRoom(i, 'name', e.target.value)} /></Field>
            <Field label="₹ per night"><input type="number" className="form-control" required min={100} value={r.pricePerNight} onChange={(e) => setRoom(i, 'pricePerNight', Number(e.target.value))} /></Field>
            <Field label="Sleeps"><input type="number" className="form-control" min={1} max={12} value={r.maxGuests} onChange={(e) => setRoom(i, 'maxGuests', Number(e.target.value))} /></Field>
            <Field label="Rooms of this type"><input type="number" className="form-control" min={0} value={r.totalRooms} onChange={(e) => setRoom(i, 'totalRooms', Number(e.target.value))} /></Field>
            <Field label="Bed"><input className="form-control" value={r.bedType} onChange={(e) => setRoom(i, 'bedType', e.target.value)} /></Field>
            <Field label="AC"><select className="form-control" value={r.acType} onChange={(e) => setRoom(i, 'acType', e.target.value)}><option>AC</option><option>Non-AC</option></select></Field>
          </div>
          {f.rooms.length > 1 && <button type="button" className="btn btn-sm btn-danger" onClick={() => setF({ ...f, rooms: f.rooms.filter((_, j) => j !== i) })}><Trash2 size={12} /> Remove room type</button>}
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-outline" onClick={() => setF({ ...f, rooms: [...f.rooms, { name: '', pricePerNight: 3000, maxGuests: 2, totalRooms: 3, bedType: 'King Bed', acType: 'AC' }] })}><Plus size={12} /> Add room type</button>
      <hr className="divider" />
      <button type="submit" className="btn btn-primary" disabled={busy}>{existing ? 'Save changes' : 'Publish hotel'}</button>
    </form>
  );
}

export function TransportForm({ existing, city, intercity, onSaved }) {
  const { destinations } = useTrip();
  const [f, setF] = useState(() => ({
    scope: intercity ? 'intercity' : 'local',
    title: existing?.title || '',
    vehicleType: existing?.vehicleType || (intercity ? 'Bus' : 'Sedan'),
    serviceType: existing?.serviceType || 'Chauffeur',
    acType: existing?.acType || 'AC',
    seatingCapacity: existing?.seatingCapacity || (intercity ? 40 : 4),
    coverage: existing?.coverage || '',
    dailyRate: existing?.dailyRate || 2500,
    includedKmPerDay: existing?.includedKmPerDay ?? 250,
    extraKmRate: existing?.extraKmRate ?? 14,
    fleetSize: existing?.fleetSize ?? 3,
    origin: existing?.origin?.slug || existing?.originName?.toLowerCase() || '',
    destination: existing?.destinationName?.toLowerCase() || '',
    classType: existing?.classType || '',
    fare: existing?.fare || 800,
    departureTime: existing?.departureTime || '21:00',
    arrivalTime: existing?.arrivalTime || '05:00',
    durationHours: existing?.durationHours || 8,
    seatsPerDeparture: existing?.seatsPerDeparture || 40,
    operatingDays: existing?.operatingDays || [0, 1, 2, 3, 4, 5, 6],
    mealService: existing?.mealService || 'None',
    features: list(existing?.features),
    imageUrl: existing?.imageUrl || '',
    cancellationPolicy: existing?.cancellationPolicy || 'Moderate'
  }));
  const { submit, errors, busy } = useSubmit({ endpoint: '/transports', existing, onSaved });
  const set = (k, num) => (e) => setF({ ...f, [k]: num ? Number(e.target.value) : e.target.value });
  const toggleDay = (d) => setF({ ...f, operatingDays: f.operatingDays.includes(d) ? f.operatingDays.filter((x) => x !== d) : [...f.operatingDays, d].sort() });

  const onSubmit = (e) => {
    e.preventDefault();
    const common = { title: f.title, vehicleType: f.vehicleType, acType: f.acType, seatingCapacity: f.seatingCapacity, features: toList(f.features), imageUrl: f.imageUrl || undefined, cancellationPolicy: f.cancellationPolicy };
    const local = { serviceType: f.serviceType, coverage: f.coverage, dailyRate: f.dailyRate, includedKmPerDay: f.includedKmPerDay, extraKmRate: f.extraKmRate, fleetSize: f.fleetSize };
    const route = { classType: f.classType, fare: f.fare, departureTime: f.departureTime, arrivalTime: f.arrivalTime, durationHours: f.durationHours, seatsPerDeparture: f.seatsPerDeparture, operatingDays: f.operatingDays, mealService: f.mealService };
    if (existing) return submit({ ...common, ...(intercity ? route : local) });
    return submit(intercity ? { scope: 'intercity', ...common, ...route, origin: f.origin, destination: f.destination } : { scope: 'local', ...common, ...local });
  };

  return (
    <form onSubmit={onSubmit}>
      {!intercity && <p className="alert alert-info small">This vehicle will operate in <b>{city}</b>, your registered city.</p>}
      <div className="form-grid">
        <Field label="Title" error={errors.title}><input className="form-control" required value={f.title} onChange={set('title')} /></Field>
        <Field label="Vehicle / mode">
          <select className="form-control" value={f.vehicleType} onChange={set('vehicleType')}>
            {(intercity ? ['Bus', 'Train', 'Flight'] : ['Hatchback', 'Sedan', 'SUV', 'Tempo Traveller', 'Self-Drive Car', 'Bike']).map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="AC"><select className="form-control" value={f.acType} onChange={set('acType')}><option>AC</option><option>Non-AC</option></select></Field>
        <Field label="Seats"><input type="number" className="form-control" min={1} value={f.seatingCapacity} onChange={set('seatingCapacity', true)} /></Field>
        <Field label="Cancellation"><select className="form-control" value={f.cancellationPolicy} onChange={set('cancellationPolicy')}>{['Flexible', 'Moderate', 'Strict'].map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Photo URL"><input className="form-control" value={f.imageUrl} onChange={set('imageUrl')} placeholder="https://" /></Field>
      </div>

      {intercity ? (
        <>
          {!existing && (
            <div className="form-grid">
              <Field label="From city" error={errors.origin}><select className="form-control" required value={f.origin} onChange={set('origin')}><option value="">Select…</option>{destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></Field>
              <Field label="To city" error={errors.destination}><select className="form-control" required value={f.destination} onChange={set('destination')}><option value="">Select…</option>{destinations.filter((d) => d.slug !== f.origin).map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></Field>
            </div>
          )}
          <div className="form-grid">
            <Field label="Class"><input className="form-control" value={f.classType} onChange={set('classType')} placeholder="Sleeper, AC Chair Car, Economy…" /></Field>
            <Field label="Fare per seat (₹)"><input type="number" className="form-control" min={50} value={f.fare} onChange={set('fare', true)} /></Field>
            <Field label="Departs"><input type="time" className="form-control" value={f.departureTime} onChange={set('departureTime')} /></Field>
            <Field label="Arrives"><input type="time" className="form-control" value={f.arrivalTime} onChange={set('arrivalTime')} /></Field>
            <Field label="Duration (hours)"><input type="number" step="0.25" className="form-control" min={0.25} value={f.durationHours} onChange={set('durationHours', true)} /></Field>
            <Field label="Seats per departure"><input type="number" className="form-control" min={1} value={f.seatsPerDeparture} onChange={set('seatsPerDeparture', true)} /></Field>
            <Field label="Meals"><input className="form-control" value={f.mealService} onChange={set('mealService')} /></Field>
          </div>
          <Field label="Runs on">
            <div className="row">{DAYS.map((d, i) => <label key={d} className="checkbox"><input type="checkbox" checked={f.operatingDays.includes(i)} onChange={() => toggleDay(i)} /> {d}</label>)}</div>
          </Field>
        </>
      ) : (
        <div className="form-grid">
          <Field label="Service"><select className="form-control" value={f.serviceType} onChange={set('serviceType')}><option>Chauffeur</option><option>Self-Drive</option></select></Field>
          <Field label="Daily rate (₹)"><input type="number" className="form-control" min={300} value={f.dailyRate} onChange={set('dailyRate', true)} /></Field>
          <Field label="Km included / day"><input type="number" className="form-control" min={0} value={f.includedKmPerDay} onChange={set('includedKmPerDay', true)} /></Field>
          <Field label="Extra ₹ / km"><input type="number" className="form-control" min={0} value={f.extraKmRate} onChange={set('extraKmRate', true)} /></Field>
          <Field label="Vehicles in fleet" hint="How many can be booked on the same day"><input type="number" className="form-control" min={0} value={f.fleetSize} onChange={set('fleetSize', true)} /></Field>
          <Field label={`Coverage in ${city}`}><input className="form-control" value={f.coverage} onChange={set('coverage')} placeholder={`${city} city & surroundings`} /></Field>
        </div>
      )}
      <Field label="Features" hint="Comma separated"><input className="form-control" value={f.features} onChange={set('features')} /></Field>
      <button type="submit" className="btn btn-primary" disabled={busy}>{existing ? 'Save changes' : 'Publish'}</button>
    </form>
  );
}

export function PackageForm({ existing, city, citySlug, onSaved }) {
  const hotels = useApi('/hotels', { params: { destination: citySlug, limit: 60 } });
  const dest = useApi(`/destinations/${citySlug}`);
  const [f, setF] = useState(() => ({
    title: existing?.title || '',
    category: existing?.category || 'Heritage',
    price: existing?.price || 6000,
    durationDays: existing?.durationDays || 3,
    durationNights: existing?.durationNights ?? 2,
    description: existing?.description || '',
    highlights: list(existing?.highlights),
    inclusions: list(existing?.inclusions),
    exclusions: list(existing?.exclusions),
    foodHighlights: list(existing?.foodHighlights),
    idealFor: existing?.idealFor || '',
    maxGroupSize: existing?.maxGroupSize || 20,
    minTravelers: existing?.minTravelers || 1,
    hotel: existing?.hotel?._id || existing?.hotel || '',
    imageUrl: existing?.imageUrl || '',
    cancellationPolicy: existing?.cancellationPolicy || 'Moderate',
    dayPlan: existing?.dayPlan || []
  }));
  const { submit, errors, busy } = useSubmit({ endpoint: '/packages', existing, onSaved });
  const set = (k, num) => (e) => setF({ ...f, [k]: num ? Number(e.target.value) : e.target.value });
  const attractions = dest.data?.attractions || [];

  const days = Array.from({ length: f.durationDays }, (_, i) => f.dayPlan[i] || { day: i + 1, title: '', description: '', attractions: [] });
  const setDay = (i, patch) => setF({ ...f, dayPlan: days.map((d, j) => (j === i ? { ...d, ...patch, day: j + 1 } : { ...d, day: j + 1 })) });

  const onSubmit = (e) => {
    e.preventDefault();
    submit({
      ...f,
      hotel: f.hotel || null,
      imageUrl: f.imageUrl || undefined,
      highlights: toList(f.highlights),
      inclusions: toList(f.inclusions),
      exclusions: toList(f.exclusions),
      foodHighlights: toList(f.foodHighlights),
      dayPlan: days.map((d, i) => ({ ...d, day: i + 1, title: d.title || `Day ${i + 1}` }))
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <p className="alert alert-info small">This package runs in <b>{city}</b>; only {city} hotels and sights can be included.</p>
      <div className="form-grid">
        <Field label="Title" error={errors.title}><input className="form-control" required minLength={5} value={f.title} onChange={set('title')} /></Field>
        <Field label="Category"><select className="form-control" value={f.category} onChange={set('category')}>{['Hill Station', 'Beach', 'Heritage', 'Wildlife', 'Pilgrimage', 'Adventure', 'Cultural'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Price per person (₹)" error={errors.price}><input type="number" className="form-control" min={500} value={f.price} onChange={set('price', true)} /></Field>
        <Field label="Days"><input type="number" className="form-control" min={1} max={30} value={f.durationDays} onChange={(e) => setF({ ...f, durationDays: Number(e.target.value), durationNights: Math.max(0, Number(e.target.value) - 1) })} /></Field>
        <Field label="Nights" error={errors.durationNights}><input type="number" className="form-control" min={0} value={f.durationNights} onChange={set('durationNights', true)} /></Field>
        <Field label="Max group per departure"><input type="number" className="form-control" min={1} value={f.maxGroupSize} onChange={set('maxGroupSize', true)} /></Field>
        <Field label={`Stay (a ${city} hotel)`}>
          <select className="form-control" value={f.hotel} onChange={set('hotel')}>
            <option value="">Not included</option>
            {(hotels.data || []).map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </Field>
        <Field label="Cancellation"><select className="form-control" value={f.cancellationPolicy} onChange={set('cancellationPolicy')}>{['Flexible', 'Moderate', 'Strict'].map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Photo URL"><input className="form-control" value={f.imageUrl} onChange={set('imageUrl')} placeholder="https://" /></Field>
      </div>
      <Field label="Description" error={errors.description}><textarea className="form-control" rows={3} required minLength={30} value={f.description} onChange={set('description')} /></Field>
      <Field label="Highlights" hint="Comma separated"><input className="form-control" value={f.highlights} onChange={set('highlights')} /></Field>
      <div className="form-grid">
        <Field label="Included" hint="Comma separated"><input className="form-control" value={f.inclusions} onChange={set('inclusions')} /></Field>
        <Field label="Not included" hint="Comma separated"><input className="form-control" value={f.exclusions} onChange={set('exclusions')} /></Field>
        <Field label="Food highlights"><input className="form-control" value={f.foodHighlights} onChange={set('foodHighlights')} /></Field>
        <Field label="Ideal for"><input className="form-control" value={f.idealFor} onChange={set('idealFor')} /></Field>
      </div>
      <h3 className="section-title" style={{ fontSize: 15 }}>Day plan</h3>
      {days.map((d, i) => (
        <div key={i} className="day-card" style={{ marginBottom: 10 }}>
          <div className="form-grid">
            <Field label={`Day ${i + 1} title`}><input className="form-control" value={d.title} onChange={(e) => setDay(i, { title: e.target.value })} /></Field>
            <Field label="Sights">
              <select multiple className="form-control" style={{ height: 90 }} value={d.attractions} onChange={(e) => setDay(i, { attractions: [...e.target.selectedOptions].map((o) => o.value) })}>
                {attractions.map((a) => <option key={a._id} value={a.name}>{a.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><input className="form-control" value={d.description} onChange={(e) => setDay(i, { description: e.target.value })} /></Field>
        </div>
      ))}
      <button type="submit" className="btn btn-primary" disabled={busy}>{existing ? 'Save changes' : 'Publish package'}</button>
    </form>
  );
}
