const Itinerary = require('../models/Itinerary');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getPlannerOptions, normalisePlan, travellerCount } = require('../services/plannerService');
const { buildLineItem, publicLine } = require('../services/pricingService');
const { computeTotals, createHold } = require('../services/bookingService');
const { requireDestination } = require('../services/destinationService');

const POPULATE = [
  { path: 'outbound.transport', select: 'title vehicleType classType departureTime arrivalTime durationHours fare originName destinationName' },
  { path: 'inbound.transport', select: 'title vehicleType classType departureTime arrivalTime durationHours fare originName destinationName' },
  { path: 'stay.hotel', select: 'name starRating imageUrl address rooms checkInTime checkOutTime destinationName' },
  { path: 'localCab.transport', select: 'title vehicleType serviceType dailyRate seatingCapacity imageUrl destinationName' },
  { path: 'destination', select: 'name slug coordinates imageUrl state' },
  { path: 'booking', select: 'reference status pricing.total' }
];

const loadOwn = async (req) => {
  const itinerary = await Itinerary.findOne({ _id: req.params.id, user: req.user._id });
  if (!itinerary) throw ApiError.notFound('Trip plan not found');
  return itinerary;
};

// @route GET /api/itineraries/options?destination=&origin=&startDate=&endDate=&adults=&children=
exports.getOptions = asyncHandler(async (req, res) => {
  const data = await getPlannerOptions(req.validatedQuery);
  res.status(200).json({ success: true, data });
});

// @route GET /api/itineraries
exports.getMyItineraries = asyncHandler(async (req, res) => {
  const data = await Itinerary.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('destination', 'name slug imageUrl')
    .populate('booking', 'reference status')
    .lean();
  res.status(200).json({ success: true, count: data.length, data });
});

// @route GET /api/itineraries/:id
exports.getItinerary = asyncHandler(async (req, res) => {
  const itinerary = await Itinerary.findOne({ _id: req.params.id, user: req.user._id }).populate(POPULATE);
  if (!itinerary) throw ApiError.notFound('Trip plan not found');
  res.status(200).json({ success: true, data: itinerary });
});

// @route POST /api/itineraries
exports.createItinerary = asyncHandler(async (req, res) => {
  const plan = await normalisePlan(req.body);
  const itinerary = await Itinerary.create({ ...plan, user: req.user._id });
  await itinerary.populate(POPULATE);
  res.status(201).json({ success: true, data: itinerary });
});

// @route PUT /api/itineraries/:id
exports.updateItinerary = asyncHandler(async (req, res) => {
  const itinerary = await loadOwn(req);
  if (itinerary.status === 'Booked') throw ApiError.conflict('This trip is already booked. Cancel the booking to change it.');
  const current = itinerary.toObject();
  const merged = {
    ...current,
    ...req.body,
    destination: req.body.destination || current.destination,
    origin: req.body.origin !== undefined ? req.body.origin : current.origin
  };
  // Changing city invalidates everything chosen for the old one.
  if (req.body.destination) {
    const next = await requireDestination(req.body.destination);
    if (String(next._id) !== String(current.destination)) {
      Object.assign(merged, {
        stay: req.body.stay || {},
        localCab: req.body.localCab || {},
        days: req.body.days || [],
        outbound: req.body.outbound || {},
        inbound: req.body.inbound || {}
      });
    }
  }
  if (req.body.startDate || req.body.endDate) merged.days = req.body.days || [];

  const plan = await normalisePlan(merged);
  itinerary.set(plan);
  await itinerary.save();
  await itinerary.populate(POPULATE);
  res.status(200).json({ success: true, data: itinerary });
});

// @route DELETE /api/itineraries/:id
exports.deleteItinerary = asyncHandler(async (req, res) => {
  const itinerary = await loadOwn(req);
  if (itinerary.status === 'Booked') throw ApiError.conflict('Booked trips cannot be deleted');
  await itinerary.deleteOne();
  res.status(200).json({ success: true, message: 'Trip plan deleted' });
});

// Turns a saved plan into priced, availability-checked booking lines.
const buildTripLines = async (itinerary) => {
  const people = travellerCount(itinerary.travelers);
  const lines = [];
  if (itinerary.outbound?.transport) {
    lines.push(await buildLineItem('transport', { itemId: itinerary.outbound.transport, startDate: itinerary.outbound.date, seats: people }));
  }
  if (itinerary.stay?.hotel) {
    lines.push(await buildLineItem('hotel', {
      itemId: itinerary.stay.hotel,
      roomId: itinerary.stay.roomId,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      rooms: itinerary.stay.rooms,
      guests: people
    }));
  }
  if (itinerary.localCab?.transport) {
    lines.push(await buildLineItem('transport', {
      itemId: itinerary.localCab.transport,
      startDate: itinerary.localCab.startDate,
      days: itinerary.localCab.days,
      vehicles: itinerary.localCab.vehicles,
      passengers: people
    }));
  }
  if (itinerary.inbound?.transport) {
    lines.push(await buildLineItem('transport', { itemId: itinerary.inbound.transport, startDate: itinerary.inbound.date, seats: people }));
  }
  if (!lines.length) throw ApiError.badRequest('Add a hotel, cab or travel leg before booking this trip');
  return lines;
};

const priceTrip = async (req, itinerary) => {
  const lines = await buildTripLines(itinerary);
  const totals = await computeTotals(lines, {
    user: req.user,
    couponCode: req.body.couponCode,
    loyaltyPoints: req.body.loyaltyPoints,
    bookingType: 'trip',
    destinationId: itinerary.destination
  });
  return { lines, ...totals };
};

// @route POST /api/itineraries/:id/quote
exports.quoteItinerary = asyncHandler(async (req, res) => {
  const itinerary = await loadOwn(req);
  const quote = await priceTrip(req, itinerary);
  res.status(200).json({
    success: true,
    data: {
      items: quote.lines.map(publicLine),
      pricing: quote.pricing,
      couponError: quote.couponError,
      loyaltyPointsToEarn: quote.loyaltyPointsToEarn,
      payAtVenue: itinerary.estimate.activities
    }
  });
});

// @route POST /api/itineraries/:id/book
// Holds every component of the trip in a single booking.
exports.bookItinerary = asyncHandler(async (req, res) => {
  const itinerary = await loadOwn(req);
  if (itinerary.status === 'Booked') throw ApiError.conflict('This trip is already booked');

  const quote = await priceTrip(req, itinerary);
  const booking = await createHold(req.user, quote, {
    bookingType: 'trip',
    destination: { _id: itinerary.destination, name: itinerary.destinationName },
    itinerary: itinerary._id,
    travelers: itinerary.travelers,
    contact: req.body.contact,
    specialRequests: req.body.specialRequests,
    couponCode: req.body.couponCode
  });
  itinerary.booking = booking._id;
  await itinerary.save();
  res.status(201).json({ success: true, data: booking });
});
