const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { diffDays, range } = require('../utils/dates');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const { publicLine } = require('../services/pricingService');
const { quoteSingle, createHold, sweepBookings } = require('../services/bookingService');
const { remainingCapacity } = require('../services/availabilityService');
const {
  previewCancellation: previewCancellationFor,
  cancelBooking: cancelBookingFor
} = require('../services/cancellationService');

const quoteResponse = (quote) => ({
  items: quote.lines.map(publicLine),
  pricing: quote.pricing,
  couponError: quote.couponError,
  loyaltyPointsToEarn: quote.loyaltyPointsToEarn,
  remaining: quote.lines.map((l) => l._remaining)
});

// @route POST /api/bookings/quote
// Live price and availability check; nothing is reserved.
exports.quote = asyncHandler(async (req, res) => {
  const quote = await quoteSingle(req.user, req.body);
  res.status(200).json({ success: true, data: quoteResponse(quote) });
});

// @route POST /api/bookings
// Places a payment hold. The booking is confirmed only after payment succeeds.
exports.createBooking = asyncHandler(async (req, res) => {
  const quote = await quoteSingle(req.user, req.body);
  const booking = await createHold(req.user, quote, {
    bookingType: req.body.itemType,
    travelers: req.body.travelers,
    contact: req.body.contact,
    specialRequests: req.body.specialRequests,
    couponCode: req.body.couponCode
  });
  res.status(201).json({ success: true, data: booking });
});

// @route GET /api/bookings/my?status=upcoming|past|cancelled
exports.getMyBookings = asyncHandler(async (req, res) => {
  await sweepBookings();
  const filter = { user: req.user._id };
  const view = req.query.status;
  if (view === 'upcoming') filter.status = { $in: ['Confirmed', 'PendingPayment'] };
  if (view === 'past') filter.status = 'Completed';
  if (view === 'cancelled') filter.status = { $in: ['Cancelled', 'Expired'] };

  const { page, limit, skip } = parsePagination(req.query);
  const [data, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});

// Travellers see their own bookings, agencies see bookings containing their items, admins see all.
const loadAccessibleBooking = async (req) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'username fullName email phone')
    .populate('destination', 'name slug coordinates');
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = req.userRole === 'user' && String(booking.user._id) === String(req.user._id);
  const isAgency = req.userRole === 'agency' && booking.items.some((i) => String(i.agency) === String(req.user._id));
  if (!isOwner && !isAgency && req.userRole !== 'admin') throw ApiError.notFound('Booking not found');
  return { booking, isOwner, isAgency };
};

// @route GET /api/bookings/:id
exports.getBooking = asyncHandler(async (req, res) => {
  const { booking, isAgency } = await loadAccessibleBooking(req);
  const data = booking.toJSON();
  // Partners only see their own lines of a multi-partner trip.
  if (isAgency) data.items = data.items.filter((i) => String(i.agency) === String(req.user._id));
  res.status(200).json({ success: true, data });
});

// @route GET /api/hotels/:id/availability?checkIn=&checkOut=
exports.getHotelAvailability = asyncHandler(async (req, res) => {
  const { checkIn, checkOut } = req.validatedQuery;
  const nights = diffDays(checkIn, checkOut);
  if (nights < 1 || nights > 30) throw ApiError.badRequest('Choose between 1 and 30 nights');

  const hotel = await Hotel.findById(req.params.id);
  if (!hotel || !hotel.isActive) throw ApiError.notFound('Hotel not found');

  const days = range(checkIn, checkOut);
  const rooms = await Promise.all(
    hotel.rooms.map(async (room) => {
      const { remaining } = await remainingCapacity(hotel._id, days, room.totalRooms, { variantId: room._id });
      return { roomId: room._id, name: room.name, available: remaining, pricePerNight: room.pricePerNight, total: room.pricePerNight * nights };
    })
  );
  res.status(200).json({ success: true, data: { checkIn, checkOut, nights, rooms } });
});

// A partner may cancel only bookings made up entirely of its own listings.
const cancellerRole = (req, booking, { isOwner, isAgency }) => {
  if (isOwner) return 'user';
  if (req.userRole === 'admin') return 'admin';
  if (isAgency && booking.items.every((i) => String(i.agency) === String(req.user._id))) return 'agency';
  throw ApiError.forbidden('This trip includes other partners. Ask Roamly support to cancel it.');
};

// @route GET /api/bookings/:id/cancellation
exports.previewCancellation = asyncHandler(async (req, res) => {
  const access = await loadAccessibleBooking(req);
  const role = cancellerRole(req, access.booking, access);
  const preview = await previewCancellationFor(access.booking, role);
  res.status(200).json({ success: true, data: preview });
});

// @route PUT /api/bookings/:id/cancel
exports.cancelBooking = asyncHandler(async (req, res) => {
  const access = await loadAccessibleBooking(req);
  const role = cancellerRole(req, access.booking, access);
  const booking = await cancelBookingFor(access.booking, { cancelledBy: role, reason: req.body.reason });
  res.status(200).json({ success: true, data: booking });
});

exports.loadAccessibleBooking = loadAccessibleBooking;
