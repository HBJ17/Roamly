const Transport = require('../models/Transport');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const { findDestination, requireDestination } = require('../services/destinationService');
const { resolveListingOwner, assertCanManage } = require('../services/listingAccess');

const LOCAL_SORTS = {
  recommended: { rating: -1, dailyRate: 1 },
  price_asc: { dailyRate: 1 },
  price_desc: { dailyRate: -1 },
  rating: { rating: -1 }
};
const INTERCITY_SORTS = {
  recommended: { departureTime: 1 },
  departure: { departureTime: 1 },
  price_asc: { fare: 1 },
  price_desc: { fare: -1 },
  duration: { durationHours: 1 },
  rating: { rating: -1 }
};

const summary = (d) => (d ? { _id: d._id, name: d.name, slug: d.slug } : null);

/**
 * @route GET /api/transports
 *   ?scope=local&destination=chennai            -> cabs that operate inside Chennai only
 *   ?scope=intercity&from=bangalore&to=chennai  -> routes between the two cities
 */
exports.getTransports = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const filter = { isActive: true, scope: q.scope };
  const { page, limit, skip } = parsePagination(q);
  const empty = (extra) => paginatedResponse(res, { data: [], total: 0, page, limit, extra });

  let extra = {};
  if (q.scope === 'local') {
    if (q.destination) {
      const destination = await findDestination(q.destination);
      if (!destination) return empty({ destination: null });
      filter.destination = destination._id;
      extra = { destination: summary(destination) };
    }
    if (q.serviceType) filter.serviceType = q.serviceType;
    if (q.maxPrice !== undefined) filter.dailyRate = { $lte: q.maxPrice };
  } else {
    const [from, to] = await Promise.all([findDestination(q.from), findDestination(q.to || q.destination)]);
    if ((q.from && !from) || ((q.to || q.destination) && !to)) return empty({ from: null, to: null });
    if (from) filter.origin = from._id;
    if (to) filter.destination = to._id;
    if (q.date) filter.operatingDays = new Date(`${q.date}T00:00:00Z`).getUTCDay();
    if (q.maxPrice !== undefined) filter.fare = { $lte: q.maxPrice };
    extra = { from: summary(from), to: summary(to) };
  }
  if (q.vehicleType) filter.vehicleType = q.vehicleType;
  if (q.ac) filter.acType = q.ac;
  if (q.seats) filter.seatingCapacity = { $gte: q.seats };

  const sort = (q.scope === 'local' ? LOCAL_SORTS : INTERCITY_SORTS)[q.sort] || { rating: -1 };
  const [data, total] = await Promise.all([
    Transport.find(filter).populate('agency', 'name').sort(sort).skip(skip).limit(limit),
    Transport.countDocuments(filter)
  ]);

  return paginatedResponse(res, { data, total, page, limit, extra });
});

// @route GET /api/transports/routes
// Every city pair with at least one active intercity service, used by the trip planner.
exports.getRoutes = asyncHandler(async (req, res) => {
  const routes = await Transport.aggregate([
    { $match: { scope: 'intercity', isActive: true } },
    {
      $group: {
        _id: { origin: '$origin', destination: '$destination' },
        originName: { $first: '$originName' },
        destinationName: { $first: '$destinationName' },
        modes: { $addToSet: '$vehicleType' },
        services: { $sum: 1 },
        lowestFare: { $min: '$fare' },
        fastestHours: { $min: '$durationHours' }
      }
    },
    { $sort: { originName: 1, destinationName: 1 } }
  ]);
  const data = routes.map((r) => ({ ...r, origin: r._id.origin, destination: r._id.destination, _id: undefined }));
  res.status(200).json({ success: true, count: data.length, data });
});

// @route GET /api/transports/mine  (agency)
exports.getMyTransports = asyncHandler(async (req, res) => {
  const data = await Transport.find({ agency: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: data.length, data });
});

// @route GET /api/transports/:id
exports.getTransport = asyncHandler(async (req, res) => {
  const transport = await Transport.findById(req.params.id)
    .populate('agency', 'name phone email cityName')
    .populate('destination', 'name slug coordinates')
    .populate('origin', 'name slug coordinates');
  if (!transport || (!transport.isActive && req.userRole !== 'admin')) throw ApiError.notFound('Transport not found');

  const alternativesFilter = transport.scope === 'local'
    ? { scope: 'local', destination: transport.destination._id }
    : { scope: 'intercity', origin: transport.origin._id, destination: transport.destination._id };

  const [reviews, alternatives] = await Promise.all([
    Review.find({ itemType: 'transport', itemId: transport._id, status: 'Published' })
      .populate('user', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(20),
    Transport.find({ ...alternativesFilter, isActive: true, _id: { $ne: transport._id } }).limit(4)
  ]);

  res.status(200).json({ success: true, data: transport, reviews, alternatives });
});

// @route POST /api/transports  (Cab Operator / Intercity Transit / admin)
exports.createTransport = asyncHandler(async (req, res) => {
  const capability = req.body.scope === 'local' ? 'local-transport' : 'intercity-transport';
  const { agency, destination } = await resolveListingOwner(req, capability, req.body.destination);

  const data = { ...req.body, agency: agency._id, destination: destination._id, destinationName: destination.name };
  if (req.body.scope === 'intercity') {
    const origin = await requireDestination(req.body.origin, 'Departure city');
    data.origin = origin._id;
    data.originName = origin.name;
  } else {
    delete data.origin;
  }

  const transport = await Transport.create(data);
  res.status(201).json({ success: true, data: transport });
});

// @route PUT /api/transports/:id
exports.updateTransport = asyncHandler(async (req, res) => {
  const transport = await Transport.findById(req.params.id);
  if (!transport) throw ApiError.notFound('Transport not found');
  assertCanManage(req, transport);
  transport.set(req.body);
  await transport.save();
  res.status(200).json({ success: true, data: transport });
});

// @route DELETE /api/transports/:id  (archives)
exports.deleteTransport = asyncHandler(async (req, res) => {
  const transport = await Transport.findById(req.params.id);
  if (!transport) throw ApiError.notFound('Transport not found');
  assertCanManage(req, transport);
  transport.isActive = false;
  await transport.save();
  res.status(200).json({ success: true, message: 'Transport archived' });
});
