const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const ApiError = require('../utils/ApiError');
const { addDays, diffDays, range, weekday } = require('../utils/dates');
const { requireDestination } = require('./destinationService');
const { remainingCapacity } = require('./availabilityService');
const { getSettings } = require('./settingsService');
const { assertBookableDate } = require('./pricingService');

const MAX_TRIP_NIGHTS = 14;
const SLOT_HOURS = { Morning: 4, Afternoon: 4, Evening: 3 };
const SLOTS = ['Morning', 'Afternoon', 'Evening'];

const travellerCount = (t = {}) => (t.adults || 1) + (t.children || 0);

const validateTripDates = (startDate, endDate) => {
  assertBookableDate(startDate, 'Start date');
  const nights = diffDays(startDate, endDate);
  if (nights < 0) throw ApiError.badRequest('The trip must end on or after it starts');
  if (nights > MAX_TRIP_NIGHTS) throw ApiError.badRequest(`Trips can be up to ${MAX_TRIP_NIGHTS} nights`);
  return nights;
};

/**
 * Spreads a destination's attractions over the trip days by their best time of day.
 * Arrival day starts in the afternoon and the last day keeps only the morning free.
 */
const suggestDayPlan = (destination, startDate, endDate, preferredIds = []) => {
  const dayCount = diffDays(startDate, endDate) + 1;
  const preferred = new Set(preferredIds.map(String));
  const pool = [...destination.attractions].sort((a, b) => {
    const pa = preferred.has(String(a._id)) ? 0 : 1;
    const pb = preferred.has(String(b._id)) ? 0 : 1;
    return pa - pb;
  });

  const days = Array.from({ length: dayCount }, (_, i) => ({
    dayNumber: i + 1,
    date: addDays(startDate, i),
    items: [],
    notes: i === 0 ? 'Arrival and check-in' : i === dayCount - 1 && dayCount > 1 ? 'Check-out and departure' : ''
  }));

  const openSlots = (i) => {
    if (dayCount === 1) return ['Morning', 'Afternoon', 'Evening'];
    if (i === 0) return ['Afternoon', 'Evening'];
    if (i === dayCount - 1) return ['Morning'];
    return SLOTS;
  };

  for (const attraction of pool) {
    const wanted = attraction.bestTimeOfDay === 'Any' ? SLOTS : [attraction.bestTimeOfDay];
    let placed = false;
    for (let i = 0; i < days.length && !placed; i += 1) {
      for (const slot of wanted) {
        if (!openSlots(i).includes(slot)) continue;
        const used = days[i].items.filter((x) => x.timeSlot === slot).reduce((s, x) => s + x.durationHours, 0);
        if (used + attraction.durationHours <= SLOT_HOURS[slot] || (used === 0 && attraction.durationHours > SLOT_HOURS[slot])) {
          days[i].items.push({
            attractionId: attraction._id,
            name: attraction.name,
            category: attraction.category,
            timeSlot: slot,
            durationHours: attraction.durationHours,
            entryFee: attraction.entryFee
          });
          placed = true;
          break;
        }
      }
    }
  }
  return days;
};

/**
 * Everything the planner can offer for a trip, already filtered to the destination:
 * its hotels and local cabs (with availability for the dates), its attractions,
 * and intercity services that actually run origin -> destination and back on those days.
 */
const getPlannerOptions = async ({ destination: destRef, origin: originRef, startDate, endDate, adults = 1, children = 0 }) => {
  const destination = await requireDestination(destRef);
  const origin = originRef ? await requireDestination(originRef, 'Starting city') : null;
  if (origin && String(origin._id) === String(destination._id)) {
    throw ApiError.badRequest('Starting city and destination must be different');
  }
  const nights = validateTripDates(startDate, endDate);
  const people = adults + children;
  const nightDays = range(startDate, endDate);
  const tripDays = range(startDate, addDays(endDate, 1));

  const [hotels, cabs, outbound, inbound] = await Promise.all([
    Hotel.find({ destination: destination._id, isActive: true }).sort({ rating: -1, starRating: -1 }),
    Transport.find({ destination: destination._id, scope: 'local', isActive: true }).sort({ rating: -1 }),
    origin
      ? Transport.find({ scope: 'intercity', isActive: true, origin: origin._id, destination: destination._id, operatingDays: weekday(startDate) }).sort({ departureTime: 1 })
      : [],
    origin
      ? Transport.find({ scope: 'intercity', isActive: true, origin: destination._id, destination: origin._id, operatingDays: weekday(endDate) }).sort({ departureTime: 1 })
      : []
  ]);

  const hotelOptions = await Promise.all(hotels.map(async (hotel) => {
    const rooms = await Promise.all(hotel.rooms.map(async (room) => {
      const available = nights > 0
        ? (await remainingCapacity(hotel._id, nightDays, room.totalRooms, { variantId: room._id })).remaining
        : room.totalRooms;
      const roomsNeeded = Math.ceil(people / room.maxGuests);
      return {
        roomId: room._id,
        name: room.name,
        pricePerNight: room.pricePerNight,
        maxGuests: room.maxGuests,
        bedType: room.bedType,
        acType: room.acType,
        available,
        roomsNeeded,
        fits: available >= roomsNeeded,
        stayTotal: room.pricePerNight * roomsNeeded * nights
      };
    }));
    return { ...hotel.toObject(), roomOptions: rooms };
  }));

  const cabOptions = await Promise.all(cabs.map(async (cab) => {
    const { remaining } = await remainingCapacity(cab._id, tripDays, cab.fleetSize);
    const vehiclesNeeded = Math.ceil(people / cab.seatingCapacity);
    return { ...cab.toObject(), available: remaining, vehiclesNeeded, fits: remaining >= vehiclesNeeded };
  }));

  const legOptions = (list, day) => Promise.all(list.map(async (t) => {
    const { remaining } = await remainingCapacity(t._id, [day], t.seatsPerDeparture);
    return { ...t.toObject(), available: remaining, fits: remaining >= people, legTotal: t.fare * people };
  }));

  return {
    destination,
    origin,
    startDate,
    endDate,
    nights,
    travelers: { adults, children },
    hotels: hotelOptions,
    cabs: cabOptions,
    outbound: await legOptions(outbound, startDate),
    inbound: await legOptions(inbound, endDate),
    suggestedDays: suggestDayPlan(destination, startDate, endDate)
  };
};

/**
 * Validates a saved plan against its destination and returns a normalised document + cost estimate.
 * Throws if any component belongs to another city.
 */
const normalisePlan = async (input) => {
  const destination = await requireDestination(input.destination);
  const origin = input.origin ? await requireDestination(input.origin, 'Starting city') : null;
  const nights = validateTripDates(input.startDate, input.endDate);
  const people = travellerCount(input.travelers);
  const settings = await getSettings();

  const plan = {
    title: input.title || `${destination.name} trip`,
    destination: destination._id,
    destinationName: destination.name,
    origin: origin?._id,
    originName: origin?.name || '',
    startDate: input.startDate,
    endDate: input.endDate,
    nights,
    travelers: input.travelers,
    notes: input.notes || '',
    outbound: {},
    inbound: {},
    stay: {},
    localCab: {}
  };
  const estimate = { transport: 0, stay: 0, localCab: 0, activities: 0 };

  if (input.stay?.hotel) {
    if (nights < 1) throw ApiError.badRequest('A day trip does not need a hotel');
    const hotel = await Hotel.findOne({ _id: input.stay.hotel, isActive: true });
    if (!hotel) throw ApiError.badRequest('Selected hotel was not found');
    if (String(hotel.destination) !== String(destination._id)) {
      throw ApiError.badRequest(`${hotel.name} is in ${hotel.destinationName}, not ${destination.name}`);
    }
    const room = input.stay.roomId ? hotel.rooms.id(input.stay.roomId) : hotel.rooms[0];
    if (!room) throw ApiError.badRequest('Choose a valid room type');
    const rooms = Math.max(input.stay.rooms || 1, Math.ceil(people / room.maxGuests));
    plan.stay = { hotel: hotel._id, roomId: room._id, roomName: room.name, rooms };
    estimate.stay = room.pricePerNight * rooms * nights;
  }

  if (input.localCab?.transport) {
    const cab = await Transport.findOne({ _id: input.localCab.transport, isActive: true });
    if (!cab || cab.scope !== 'local') throw ApiError.badRequest('Selected cab was not found');
    if (String(cab.destination) !== String(destination._id)) {
      throw ApiError.badRequest(`${cab.title} operates in ${cab.destinationName}, not ${destination.name}`);
    }
    const startDate = input.localCab.startDate || input.startDate;
    const days = input.localCab.days || nights + 1;
    if (startDate < input.startDate || addDays(startDate, days - 1) > input.endDate) {
      throw ApiError.badRequest('Cab days must fall within your trip dates');
    }
    const vehicles = Math.max(input.localCab.vehicles || 1, Math.ceil(people / cab.seatingCapacity));
    plan.localCab = { transport: cab._id, startDate, days, vehicles };
    estimate.localCab = cab.dailyRate * days * vehicles;
  }

  const checkLeg = async (leg, from, to, date, label) => {
    if (!leg?.transport) return {};
    if (!from) throw ApiError.badRequest('Choose your starting city to add intercity travel');
    const t = await Transport.findOne({ _id: leg.transport, isActive: true });
    if (!t || t.scope !== 'intercity') throw ApiError.badRequest(`${label} service was not found`);
    if (String(t.origin) !== String(from._id) || String(t.destination) !== String(to._id)) {
      throw ApiError.badRequest(`${label} must run from ${from.name} to ${to.name}`);
    }
    if (!t.operatingDays.includes(weekday(date))) throw ApiError.badRequest(`${t.title} does not run on ${date}`);
    estimate.transport += t.fare * people;
    return { transport: t._id, date };
  };
  plan.outbound = await checkLeg(input.outbound, origin, destination, input.startDate, 'Onward travel');
  plan.inbound = await checkLeg(input.inbound, destination, origin, input.endDate, 'Return travel');

  // Activities must be this destination's attractions on days inside the trip.
  const attractions = new Map(destination.attractions.map((a) => [String(a._id), a]));
  const days = input.days && input.days.length ? input.days : suggestDayPlan(destination, input.startDate, input.endDate);
  plan.days = days.map((day, i) => {
    const date = addDays(input.startDate, i);
    if (date > input.endDate) throw ApiError.badRequest('The plan has more days than the trip');
    return {
      dayNumber: i + 1,
      date,
      notes: day.notes || '',
      items: (day.items || []).map((item) => {
        const a = attractions.get(String(item.attractionId));
        if (!a) throw ApiError.badRequest(`"${item.name || 'That attraction'}" is not in ${destination.name}`);
        estimate.activities += a.entryFee * people;
        return {
          attractionId: a._id,
          name: a.name,
          category: a.category,
          timeSlot: item.timeSlot || (a.bestTimeOfDay === 'Any' ? 'Morning' : a.bestTimeOfDay),
          durationHours: a.durationHours,
          entryFee: a.entryFee
        };
      })
    };
  });

  // Entry fees are paid at the venue; only travel, stay and cabs are booked through Roamly.
  const bookable = estimate.transport + estimate.stay + estimate.localCab;
  const tax = Math.round((bookable * settings.gstPercent) / 100);
  plan.estimate = { ...estimate, bookable, taxPercent: settings.gstPercent, tax, total: bookable + tax + estimate.activities };
  return plan;
};

module.exports = { getPlannerOptions, normalisePlan, suggestDayPlan, travellerCount };
