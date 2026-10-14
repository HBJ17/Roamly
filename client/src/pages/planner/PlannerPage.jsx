import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { MapPin, Bus, Hotel, Car, CalendarDays, ClipboardCheck, Plus, Trash2, Check, Users } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTrip } from '../../context/TripContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import TripSearch from '../../components/listing/TripSearch';
import { RouteCard } from '../../components/listing/Cards';
import MapView from '../../components/listing/MapView';
import PriceBreakdown from '../../components/booking/PriceBreakdown';
import { Stepper } from '../../components/booking/BookingWidget';
import { PageHeader, Spinner, ErrorState, EmptyState, Price, Stars, Field, formatDate } from '../../components/ui';

const STEPS = [
  { id: 'basics', label: 'Where & when', icon: MapPin },
  { id: 'travel', label: 'Getting there', icon: Bus },
  { id: 'stay', label: 'Stay', icon: Hotel },
  { id: 'cab', label: 'Local cab', icon: Car },
  { id: 'days', label: 'Day plan', icon: CalendarDays },
  { id: 'review', label: 'Review & book', icon: ClipboardCheck }
];
const SLOTS = ['Morning', 'Afternoon', 'Evening'];
const DRAFT_KEY = 'roamly_plan_draft';
const SCOPE_FIELDS = ['destination', 'origin', 'startDate', 'endDate'];
const scopeChanges = (a, b) => SCOPE_FIELDS.some((k) => (a[k] || '') !== (b[k] || ''));

const emptySelection = () => ({ outbound: null, inbound: null, hotel: null, roomId: null, cab: null, cabDays: 1, days: null, title: '' });

const saveDraft = (draft) => {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
};
const readDraft = () => {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
};

export default function PlannerPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { trip, updateTrip, findDestination } = useTrip();
  const { formatCurrency } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('basics');
  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [sel, setSel] = useState(emptySelection);
  const [savedId, setSavedId] = useState(id || null);
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  // Set while we load a draft or saved plan, so the scope change it causes does not wipe the selections.
  const restoring = useRef(false);

  // Arriving from a city page (?destination=) or restoring a draft after sign-in.
  useEffect(() => {
    if (id) return;
    const dest = params.get('destination');
    const draft = readDraft();
    if (draft && (!dest || draft.trip.destination === dest)) {
      restoring.current = scopeChanges(draft.trip, trip);
      updateTrip(draft.trip);
      setSel(draft.sel);
      setStep(draft.step || 'basics');
    } else if (dest) {
      updateTrip({ destination: dest });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Editing a saved plan.
  useEffect(() => {
    if (!id) return;
    api.get(`/itineraries/${id}`).then((res) => {
      const it = res.data.data;
      if (it.status === 'Booked') {
        toast.info('This trip is booked. Showing it read-only.');
      }
      const next = {
        destination: it.destination.slug,
        origin: it.originName ? it.originName.toLowerCase() : '',
        startDate: it.startDate,
        endDate: it.endDate,
        adults: it.travelers.adults,
        children: it.travelers.children
      };
      restoring.current = scopeChanges(next, trip);
      updateTrip(next);
      setSel({
        outbound: it.outbound?.transport?._id || null,
        inbound: it.inbound?.transport?._id || null,
        hotel: it.stay?.hotel?._id || null,
        roomId: it.stay?.roomId || null,
        cab: it.localCab?.transport?._id || null,
        cabDays: it.localCab?.days || 1,
        days: it.days,
        title: it.title
      });
      setStep('review');
    }).catch((err) => toast.error(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const destination = findDestination(trip.destination);
  const nights = Math.max(0, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000));
  const people = trip.adults + trip.children;

  // Everything offered below comes from this one call, already limited to the chosen city.
  useEffect(() => {
    if (!trip.destination || trip.endDate < trip.startDate) return undefined;
    const timer = setTimeout(async () => {
      setLoadingOptions(true);
      setOptionsError('');
      try {
        const res = await api.get('/itineraries/options', {
          params: { destination: trip.destination, origin: trip.origin || undefined, startDate: trip.startDate, endDate: trip.endDate, adults: trip.adults, children: trip.children }
        });
        setOptions(res.data.data);
      } catch (err) {
        setOptions(null);
        setOptionsError(errorMessage(err));
      } finally {
        setLoadingOptions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [trip.destination, trip.origin, trip.startDate, trip.endDate, trip.adults, trip.children]);

  // A new city or new dates invalidate earlier choices.
  const [scopeKey, setScopeKey] = useState(null);
  useEffect(() => {
    const key = `${trip.destination}|${trip.origin}|${trip.startDate}|${trip.endDate}`;
    if (scopeKey && scopeKey !== key) {
      if (restoring.current) restoring.current = false;
      else setSel((s) => ({ ...emptySelection(), title: s.title }));
    }
    setScopeKey(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.destination, trip.origin, trip.startDate, trip.endDate]);

  useEffect(() => {
    if (options && !sel.days) setSel((s) => ({ ...s, days: options.suggestedDays }));
    if (options) setSel((s) => ({ ...s, cabDays: Math.min(Math.max(1, s.cabDays), nights + 1) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  useEffect(() => {
    if (!id) saveDraft({ trip, sel, step });
  }, [trip, sel, step, id]);

  const hotel = options?.hotels.find((h) => h._id === sel.hotel);
  const room = hotel?.roomOptions.find((r) => r.roomId === sel.roomId);
  const cab = options?.cabs.find((c) => c._id === sel.cab);
  const out = options?.outbound.find((t) => t._id === sel.outbound);
  const back = options?.inbound.find((t) => t._id === sel.inbound);

  const estimate = useMemo(() => {
    const travel = (out ? out.fare * people : 0) + (back ? back.fare * people : 0);
    const stay = room ? room.pricePerNight * Math.max(room.roomsNeeded, 1) * nights : 0;
    const cabs = cab ? cab.dailyRate * Math.max(cab.vehiclesNeeded, 1) * sel.cabDays : 0;
    const entry = (sel.days || []).flatMap((d) => d.items).reduce((s, i) => s + (i.entryFee || 0) * people, 0);
    return { travel, stay, cabs, entry, total: travel + stay + cabs };
  }, [out, back, room, cab, sel.cabDays, sel.days, nights, people]);

  const usedAttractions = new Set((sel.days || []).flatMap((d) => d.items.map((i) => String(i.attractionId))));
  const attractions = options?.destination.attractions || [];

  const payload = () => ({
    title: sel.title || `${destination?.name} trip`,
    destination: trip.destination,
    origin: trip.origin || null,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: { adults: trip.adults, children: trip.children },
    outbound: sel.outbound ? { transport: sel.outbound } : {},
    inbound: sel.inbound ? { transport: sel.inbound } : {},
    stay: sel.hotel ? { hotel: sel.hotel, roomId: sel.roomId } : {},
    localCab: sel.cab ? { transport: sel.cab, days: sel.cabDays, startDate: trip.startDate } : {},
    days: (sel.days || []).map((d) => ({ notes: d.notes, items: d.items.map((i) => ({ attractionId: i.attractionId, name: i.name, timeSlot: i.timeSlot })) }))
  });

  const requireLogin = () => {
    if (user) return false;
    toast.info('Sign in to save and book your trip. Your plan is kept.');
    navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
    return true;
  };

  const save = async () => {
    if (requireLogin()) return null;
    setBusy(true);
    try {
      const res = savedId ? await api.put(`/itineraries/${savedId}`, payload()) : await api.post('/itineraries', payload());
      setSavedId(res.data.data._id);
      sessionStorage.removeItem(DRAFT_KEY);
      toast.success('Trip saved');
      const q = await api.post(`/itineraries/${res.data.data._id}/quote`, {});
      setQuote(q.data.data);
      if (!savedId) navigate(`/plan/${res.data.data._id}`, { replace: true });
      return res.data.data._id;
    } catch (err) {
      toast.error(errorMessage(err));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const book = async () => {
    const planId = await save();
    if (!planId) return;
    setBusy(true);
    try {
      const res = await api.post(`/itineraries/${planId}/book`, {});
      navigate(`/checkout/${res.data.data._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeItem = (dayIdx, itemIdx) =>
    setSel((s) => ({ ...s, days: s.days.map((d, i) => (i === dayIdx ? { ...d, items: d.items.filter((_, j) => j !== itemIdx) } : d)) }));

  const addItem = (attraction) => {
    const { dayIdx, slot } = addTarget;
    setSel((s) => ({
      ...s,
      days: s.days.map((d, i) => (i === dayIdx ? {
        ...d,
        items: [...d.items, { attractionId: attraction._id, name: attraction.name, category: attraction.category, timeSlot: slot, durationHours: attraction.durationHours, entryFee: attraction.entryFee }]
      } : d))
    }));
    setAddTarget(null);
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const canLeaveBasics = Boolean(options);
  const go = (delta) => setStep(STEPS[Math.min(STEPS.length - 1, Math.max(0, stepIndex + delta))].id);

  const sidebar = (
    <aside className="sticky-panel stack">
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 16 }}>{destination ? `${destination.name} trip` : 'Your trip'}</h3>
        <p className="small muted">{formatDate(trip.startDate)} – {formatDate(trip.endDate)} · {nights} night{nights === 1 ? '' : 's'} · <Users size={11} /> {people}</p>
        <hr className="divider" />
        <div className="line-items">
          <div className="row-between"><span>Travel {out || back ? '' : '(not added)'}</span><span>{formatCurrency(estimate.travel)}</span></div>
          <div className="row-between"><span>Stay {hotel ? `· ${hotel.name}` : '(not added)'}</span><span>{formatCurrency(estimate.stay)}</span></div>
          <div className="row-between"><span>Cab {cab ? `· ${sel.cabDays}d` : '(not added)'}</span><span>{formatCurrency(estimate.cabs)}</span></div>
          <div className="row-between total"><span>Bookable total</span><span>{formatCurrency(estimate.total)}</span></div>
          <div className="row-between small muted"><span>Entry fees (pay at venue)</span><span>{formatCurrency(estimate.entry)}</span></div>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>GST is added at checkout.</p>
      </div>
      {destination && options && (
        <MapView
          center={options.destination.coordinates}
          height={220}
          markers={[
            ...(sel.days || []).flatMap((d) => d.items).map((i) => {
              const a = attractions.find((x) => String(x._id) === String(i.attractionId));
              return a ? { ...a.coordinates, title: a.name, kind: 'attraction' } : null;
            }).filter(Boolean),
            ...(hotel?.coordinates ? [{ ...hotel.coordinates, title: hotel.name, kind: 'hotel', label: 'H' }] : [])
          ]}
        />
      )}
    </aside>
  );

  return (
    <div className="main-container">
      <PageHeader badge="Custom trip" tone="yellow" title={destination ? `Plan your ${destination.name} trip` : 'Plan a trip'} subtitle="Pick a city first: every hotel, cab and sight offered after that belongs to that city, and travel options run between your city and it." />

      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`wizard-step ${step === s.id ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
            disabled={i > 0 && !canLeaveBasics}
            onClick={() => setStep(s.id)}
          >
            <s.icon size={12} /> {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="detail-layout">
        <div className="stack">
          {step === 'basics' && (
            <div className="card">
              <TripSearch fields={['origin', 'destination', 'dates', 'travellers']} dateLabels={['Arrive on', 'Leave on']} />
              <Field label="Trip name (optional)">
                <input className="form-control" value={sel.title} onChange={(e) => setSel({ ...sel, title: e.target.value })} placeholder={destination ? `${destination.name} with family` : ''} />
              </Field>
              {!trip.destination && <p className="small muted">Choose a destination to continue.</p>}
              {loadingOptions && <Spinner />}
              {optionsError && <ErrorState message={optionsError} />}
              {options && (
                <div className="alert alert-success">
                  <Check size={14} /> {options.hotels.length} stays, {options.cabs.length} cabs and {options.destination.attractions.length} sights in {options.destination.name}
                  {trip.origin ? `, ${options.outbound.length} ways there and ${options.inbound.length} back` : ''}.
                </div>
              )}
            </div>
          )}

          {step === 'travel' && options && (
            <div className="stack">
              {!trip.origin ? (
                <EmptyState icon={Bus} title="Add a starting city to include travel">
                  Go back to step 1 and choose where you're travelling from, or skip this if you're making your own way.
                </EmptyState>
              ) : (
                <>
                  <h3 className="section-title" style={{ fontSize: 16 }}>{options.origin.name} → {options.destination.name} on {formatDate(trip.startDate)}</h3>
                  {options.outbound.length ? options.outbound.map((t) => (
                    <RouteCard key={t._id} route={t} action={
                      <button type="button" className={`btn btn-sm ${sel.outbound === t._id ? 'btn-mint' : 'btn-yellow'}`} disabled={!t.fits} onClick={() => setSel({ ...sel, outbound: sel.outbound === t._id ? null : t._id })}>
                        {sel.outbound === t._id ? 'Selected' : t.fits ? 'Choose' : 'Full'}
                      </button>
                    } />
                  )) : <p className="muted">No services run this way on that day.</p>}
                  <h3 className="section-title" style={{ fontSize: 16, marginTop: 12 }}>{options.destination.name} → {options.origin.name} on {formatDate(trip.endDate)}</h3>
                  {options.inbound.length ? options.inbound.map((t) => (
                    <RouteCard key={t._id} route={t} action={
                      <button type="button" className={`btn btn-sm ${sel.inbound === t._id ? 'btn-mint' : 'btn-yellow'}`} disabled={!t.fits} onClick={() => setSel({ ...sel, inbound: sel.inbound === t._id ? null : t._id })}>
                        {sel.inbound === t._id ? 'Selected' : t.fits ? 'Choose' : 'Full'}
                      </button>
                    } />
                  )) : <p className="muted">No return services on that day.</p>}
                </>
              )}
            </div>
          )}

          {step === 'stay' && options && (
            <div className="stack">
              {nights === 0 ? <EmptyState icon={Hotel} title="Day trip — no hotel needed" /> : options.hotels.map((h) => (
                <div key={h._id} className={`card ${sel.hotel === h._id ? '' : ''}`} style={{ padding: 16, background: sel.hotel === h._id ? 'var(--pastel-yellow-light)' : undefined }}>
                  <div className="row-between">
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <img src={h.imageUrl} alt="" style={{ width: 90, height: 64, objectFit: 'cover', border: '1.5px solid #000', borderRadius: 6 }} />
                      <div><b>{h.name}</b><div className="small muted">{'★'.repeat(h.starRating)} · {h.address}</div></div>
                    </div>
                    <Stars value={h.rating} count={h.reviewCount} />
                  </div>
                  <div className="stack" style={{ gap: 6, marginTop: 10 }}>
                    {h.roomOptions.map((r) => (
                      <button
                        key={r.roomId}
                        type="button"
                        className={`option-card ${sel.roomId === r.roomId ? 'selected' : ''} ${r.fits ? '' : 'unavailable'}`}
                        disabled={!r.fits}
                        onClick={() => setSel({ ...sel, hotel: h._id, roomId: r.roomId })}
                        style={{ padding: 10, justifyContent: 'space-between' }}
                      >
                        <span style={{ textAlign: 'left' }}><b>{r.name}</b> <span className="small muted">· sleeps {r.maxGuests} · {r.roomsNeeded} room{r.roomsNeeded > 1 ? 's' : ''} for {people}</span></span>
                        <span>{r.fits ? <Price value={r.stayTotal} suffix={`for ${nights} nights`} /> : <span className="small">Not enough rooms</span>}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {sel.hotel && <button type="button" className="btn btn-sm btn-outline" onClick={() => setSel({ ...sel, hotel: null, roomId: null })}>Remove hotel</button>}
            </div>
          )}

          {step === 'cab' && options && (
            <div className="stack">
              <p className="small muted">These operators are based in {options.destination.name}. Pick one for getting around during your stay.</p>
              {options.cabs.map((c) => (
                <button key={c._id} type="button" className={`option-card ${sel.cab === c._id ? 'selected' : ''} ${c.available < c.vehiclesNeeded ? 'unavailable' : ''}`} disabled={c.available < c.vehiclesNeeded} onClick={() => setSel({ ...sel, cab: sel.cab === c._id ? null : c._id, cabDays: sel.cab ? sel.cabDays : nights + 1 })}>
                  <img src={c.imageUrl} alt="" />
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    <b>{c.title}</b><br />
                    <span className="small muted">{c.serviceType} · {c.vehicleType} · {c.seatingCapacity} seats · {c.vehiclesNeeded} vehicle{c.vehiclesNeeded > 1 ? 's' : ''} for {people}</span>
                  </span>
                  <Price value={c.dailyRate} suffix="/ day" />
                </button>
              ))}
              {sel.cab && (
                <Field label="How many days do you need the cab?">
                  <Stepper label="days" value={sel.cabDays} min={1} max={nights + 1} onChange={(cabDays) => setSel({ ...sel, cabDays })} />
                </Field>
              )}
            </div>
          )}

          {step === 'days' && sel.days && (
            <div className="stack">
              {sel.days.map((day, dayIdx) => (
                <div key={day.dayNumber} className="day-card">
                  <div className="row-between"><b className="font-grotesk">Day {day.dayNumber} · {formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}</b><span className="small muted">{day.notes}</span></div>
                  {SLOTS.map((slot) => (
                    <div key={slot} className="slot">
                      <div className="row-between">
                        <span className="slot-title">{slot}</span>
                        <button type="button" className="icon-btn" onClick={() => setAddTarget({ dayIdx, slot })} aria-label={`Add to ${slot}`}><Plus size={14} /></button>
                      </div>
                      {day.items.map((item, itemIdx) => item.timeSlot === slot && (
                        <div key={`${item.attractionId}-${itemIdx}`} className="activity">
                          <span><b>{item.name}</b> <span className="muted small">· {item.durationHours}h{item.entryFee ? ` · ₹${item.entryFee}` : ''}</span></span>
                          <button type="button" className="icon-btn" onClick={() => removeItem(dayIdx, itemIdx)} aria-label={`Remove ${item.name}`}><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setSel({ ...sel, days: options.suggestedDays })}>Reset to suggested plan</button>
            </div>
          )}

          {step === 'review' && (
            <div className="card">
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>{sel.title || `${destination?.name || ''} trip`}</h3>
              <ul className="stack small" style={{ listStyle: 'none', gap: 6 }}>
                <li><Bus size={13} /> {out ? `${out.title}, ${out.departureTime}` : 'No onward travel'}{back ? ` · back: ${back.title}, ${back.departureTime}` : ''}</li>
                <li><Hotel size={13} /> {hotel ? `${hotel.name} — ${room?.name}` : 'No hotel'}</li>
                <li><Car size={13} /> {cab ? `${cab.title} for ${sel.cabDays} day(s)` : 'No local cab'}</li>
                <li><CalendarDays size={13} /> {(sel.days || []).reduce((n, d) => n + d.items.length, 0)} activities over {(sel.days || []).length} days</li>
              </ul>
              {quote && (
                <>
                  <hr className="divider" />
                  <PriceBreakdown items={quote.items} pricing={quote.pricing} />
                </>
              )}
              <div className="row" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-outline" disabled={busy} onClick={save}>{savedId ? 'Save changes' : 'Save trip'}</button>
                <button type="button" className="btn btn-primary" disabled={busy || (!out && !back && !hotel && !cab)} onClick={book}>{busy ? 'Working…' : 'Book this trip'}</button>
              </div>
              {!out && !back && !hotel && !cab && <p className="small muted" style={{ marginTop: 8 }}>Add travel, a hotel or a cab to book. Sights can be planned without booking.</p>}
              {savedId && <p className="small" style={{ marginTop: 10 }}><Link className="link" to="/account/trips">All my trip plans</Link></p>}
            </div>
          )}

          <div className="row-between">
            <button type="button" className="btn btn-outline" disabled={stepIndex === 0} onClick={() => go(-1)}>Back</button>
            {step !== 'review' && <button type="button" className="btn btn-yellow" disabled={!canLeaveBasics} onClick={() => go(1)}>Next</button>}
          </div>
        </div>
        {sidebar}
      </div>

      {addTarget && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setAddTarget(null)}>
          <div className="modal card" style={{ maxWidth: 520 }}>
            <div className="modal-head"><h3>Add to day {addTarget.dayIdx + 1}, {addTarget.slot.toLowerCase()}</h3><button type="button" className="icon-btn" onClick={() => setAddTarget(null)}>×</button></div>
            <div className="stack" style={{ gap: 6 }}>
              {attractions.filter((a) => !usedAttractions.has(String(a._id))).map((a) => (
                <button key={a._id} type="button" className="option-card" style={{ padding: 10 }} onClick={() => addItem(a)}>
                  <span style={{ textAlign: 'left' }}><b>{a.name}</b><br /><span className="small muted">{a.category} · {a.durationHours}h · best {a.bestTimeOfDay.toLowerCase()}{a.entryFee ? ` · ₹${a.entryFee}` : ''}</span></span>
                </button>
              ))}
              {attractions.every((a) => usedAttractions.has(String(a._id))) && <p className="muted">Every sight in this city is already in your plan.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
