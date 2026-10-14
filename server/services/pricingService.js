const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Package = require('../models/Package');
const ApiError = require('../utils/ApiError');
const { today, addDays, diffDays, range, weekday } = require('../utils/dates');
const { remainingCapacity } = require('./availabilityService');

const MAX_ADVANCE_DAYS = 365;
const MAX_STAY_NIGHTS = 30;

const assertBookableDate = (day, label = 'Travel date') => {
  if (day < today()) throw ApiError.badRequest(`${label} cannot be in the past`);
  if (diffDays(today(), day) > MAX_ADVANCE_DAYS) throw ApiError.badRequest(`${label} must be within the next 12 months`);
};

const capacityError = (what, perDay) => {
  const soldOut = perDay.filter((d) => d.remaining === 0).map((d) => d.date);
  const suffix = soldOut.length ? ` (sold out on ${soldOut.slice(0, 3).join(', ')})` : '';
  return ApiError.conflict(`Not enough ${what} available for your dates${suffix}`);
};

/** Hotel: rooms of one room type for each night between check-in and check-out. */
const hotelLine = async ({ itemId, roomId, startDate, endDate, rooms = 1, guests = 1 }, opts = {}) => {
  const hotel = await Hotel.findById(itemId);
  if (!hotel || !hotel.isActive) throw ApiError.notFound('Hotel not found');
  const room = roomId ? hotel.rooms.id(roomId) : hotel.rooms[0];
  if (!room) throw ApiError.badRequest('Choose a valid room type');

  if (!endDate) throw ApiError.badRequest('Choose a check-out date');
  assertBookableDate(startDate, 'Check-in date');
  const nights = diffDays(startDate, endDate);
  if (nights < 1) throw ApiError.badRequest('Check-out must be after check-in');
  if (nights > MAX_STAY_NIGHTS) throw ApiError.badRequest(`Stays are limited to ${MAX_STAY_NIGHTS} nights`);
  if (guests > rooms * room.maxGuests) {
    const needed = Math.ceil(guests / room.maxGuests);
    throw ApiError.badRequest(`${room.name} sleeps ${room.maxGuests}; book at least ${needed} rooms for ${guests} guests`);
  }

  const days = range(startDate, endDate);
  const { remaining, perDay } = await remainingCapacity(hotel._id, days, room.totalRooms, {
    variantId: room._id,
    excludeBookingId: opts.excludeBookingId
  });
  if (remaining < rooms) throw capacityError(`${room.name} rooms`, perDay);

  return {
    itemType: 'hotel',
    item: hotel._id,
    itemModel: 'Hotel',
    variantId: room._id,
    variantName: room.name,
    agency: hotel.agency,
    title: hotel.name,
    destinationName: hotel.destinationName,
    description: `${rooms} x ${room.name}, ${nights} night${nights > 1 ? 's' : ''}`,
    startDate,
    endDate,
    dates: days,
    quantity: rooms,
    units: nights,
    unitLabel: 'night',
    unitPrice: room.pricePerNight,
    lineTotal: room.pricePerNight * rooms * nights,
    meta: { guests, checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime, cancellationPolicy: hotel.cancellationPolicy },
    _destination: hotel.destination,
    _policy: hotel.cancellationPolicy,
    _remaining: remaining
  };
};

/** Local cab: vehicles for a number of consecutive days inside the destination. */
const localTransportLine = async (transport, { startDate, days = 1, vehicles = 1, passengers = 1, pickupLocation = '' }, opts) => {
  if (days < 1 || days > 30) throw ApiError.badRequest('Cab rentals are between 1 and 30 days');
  if (passengers > vehicles * transport.seatingCapacity) {
    const needed = Math.ceil(passengers / transport.seatingCapacity);
    throw ApiError.badRequest(`${transport.title} seats ${transport.seatingCapacity}; book ${needed} vehicles for ${passengers} people`);
  }
  const endDate = addDays(startDate, days);
  const dayList = range(startDate, endDate);
  const { remaining, perDay } = await remainingCapacity(transport._id, dayList, transport.fleetSize, opts);
  if (remaining < vehicles) throw capacityError('vehicles', perDay);

  return {
    itemType: 'transport',
    item: transport._id,
    itemModel: 'Transport',
    agency: transport.agency,
    title: transport.title,
    destinationName: transport.destinationName,
    description: `${vehicles} x ${transport.vehicleType} (${transport.serviceType}), ${days} day${days > 1 ? 's' : ''} in ${transport.destinationName}`,
    startDate,
    endDate: addDays(startDate, days - 1),
    dates: dayList,
    quantity: vehicles,
    units: days,
    unitLabel: 'day',
    unitPrice: transport.dailyRate,
    lineTotal: transport.dailyRate * vehicles * days,
    meta: { scope: 'local', pickupLocation, passengers, includedKmPerDay: transport.includedKmPerDay, extraKmRate: transport.extraKmRate },
    _destination: transport.destination,
    _policy: transport.cancellationPolicy,
    _remaining: remaining
  };
};

/** Intercity: seats on one departure date. */
const intercityLine = async (transport, { startDate, seats = 1 }, opts) => {
  if (!transport.operatingDays.includes(weekday(startDate))) {
    throw ApiError.badRequest(`${transport.title} does not run on the selected day`);
  }
  const { remaining, perDay } = await remainingCapacity(transport._id, [startDate], transport.seatsPerDeparture, opts);
  if (remaining < seats) throw capacityError('seats', perDay);

  const arrivalDate = transport.arrivalTime && transport.arrivalTime < transport.departureTime ? addDays(startDate, 1) : startDate;
  return {
    itemType: 'transport',
    item: transport._id,
    itemModel: 'Transport',
    agency: transport.agency,
    title: transport.title,
    destinationName: transport.destinationName,
    description: `${seats} seat${seats > 1 ? 's' : ''}, ${transport.originName} ${transport.departureTime} -> ${transport.destinationName} ${transport.arrivalTime}`,
    startDate,
    endDate: arrivalDate,
    dates: [startDate],
    quantity: seats,
    units: 1,
    unitLabel: 'seat',
    unitPrice: transport.fare,
    lineTotal: transport.fare * seats,
    meta: {
      scope: 'intercity',
      mode: transport.vehicleType,
      classType: transport.classType,
      origin: transport.originName,
      departureTime: transport.departureTime,
      arrivalTime: transport.arrivalTime
    },
    _destination: transport.destination,
    _origin: transport.origin,
    _policy: transport.cancellationPolicy,
    _remaining: remaining
  };
};

const transportLine = async (params, opts = {}) => {
  const transport = await Transport.findById(params.itemId);
  if (!transport || !transport.isActive) throw ApiError.notFound('Transport not found');
  assertBookableDate(params.startDate);
  return transport.scope === 'local'
    ? localTransportLine(transport, params, opts)
    : intercityLine(transport, params, opts);
};

/** Package: travellers on a departure date; each date has a group-size cap. */
const packageLine = async ({ itemId, startDate, travelers = 1 }, opts = {}) => {
  const pkg = await Package.findById(itemId);
  if (!pkg || !pkg.isActive) throw ApiError.notFound('Package not found');
  assertBookableDate(startDate);
  if (travelers < pkg.minTravelers) throw ApiError.badRequest(`This package needs at least ${pkg.minTravelers} travellers`);

  const { remaining, perDay } = await remainingCapacity(pkg._id, [startDate], pkg.maxGroupSize, opts);
  if (remaining < travelers) throw capacityError('places on this departure', perDay);

  return {
    itemType: 'package',
    item: pkg._id,
    itemModel: 'Package',
    agency: pkg.agency,
    title: pkg.title,
    destinationName: pkg.destinationName,
    description: `${pkg.durationDays} days / ${pkg.durationNights} nights for ${travelers} traveller${travelers > 1 ? 's' : ''}`,
    startDate,
    endDate: addDays(startDate, pkg.durationDays - 1),
    dates: [startDate],
    quantity: travelers,
    units: 1,
    unitLabel: 'traveller',
    unitPrice: pkg.price,
    lineTotal: pkg.price * travelers,
    meta: { durationDays: pkg.durationDays, durationNights: pkg.durationNights },
    _destination: pkg.destination,
    _policy: pkg.cancellationPolicy,
    _remaining: remaining
  };
};

const BUILDERS = { hotel: hotelLine, transport: transportLine, package: packageLine };

const buildLineItem = (itemType, params, opts) => {
  const builder = BUILDERS[itemType];
  if (!builder) throw ApiError.badRequest('Unsupported booking type');
  return builder(params, opts);
};

// Removes private helper fields before a line item is stored or returned.
const publicLine = (line) => Object.fromEntries(Object.entries(line).filter(([k]) => !k.startsWith('_')));

const STRICTNESS = { Flexible: 0, Moderate: 1, Strict: 2 };
// A multi-item booking follows the strictest policy among its items.
const strictestPolicy = (lines) =>
  lines.map((l) => l._policy || 'Moderate').sort((a, b) => STRICTNESS[b] - STRICTNESS[a])[0];

module.exports = { buildLineItem, publicLine, strictestPolicy, assertBookableDate };
