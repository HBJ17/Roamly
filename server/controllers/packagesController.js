const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const { findDestination } = require('../services/destinationService');
const { resolveListingOwner, assertCanManage } = require('../services/listingAccess');

const SORTS = {
  recommended: { rating: -1, reviewCount: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1 },
  duration: { durationDays: 1 },
  newest: { createdAt: -1 }
};

// A package can only bundle a hotel from its own destination.
const assertHotelInDestination = async (hotelId, destinationId) => {
  if (!hotelId) return;
  const hotel = await Hotel.findById(hotelId).select('destination destinationName isActive');
  if (!hotel || !hotel.isActive) throw ApiError.badRequest('Selected hotel was not found');
  if (String(hotel.destination) !== String(destinationId)) {
    throw ApiError.badRequest(`The package hotel must be in the same city (it is in ${hotel.destinationName})`);
  }
};

// @route GET /api/packages
exports.getPackages = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const filter = { isActive: true };
  const { page, limit, skip } = parsePagination(q);

  let destination = null;
  if (q.destination) {
    destination = await findDestination(q.destination);
    if (!destination) return paginatedResponse(res, { data: [], total: 0, page, limit, extra: { destination: null } });
    filter.destination = destination._id;
  }
  if (q.category) filter.category = q.category;
  if (q.q) {
    const rx = { $regex: escapeRegex(q.q), $options: 'i' };
    filter.$or = [{ title: rx }, { destinationName: rx }, { highlights: rx }];
  }
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.price = {};
    if (q.minPrice !== undefined) filter.price.$gte = q.minPrice;
    if (q.maxPrice !== undefined) filter.price.$lte = q.maxPrice;
  }
  if (q.minDays || q.maxDays) {
    filter.durationDays = {};
    if (q.minDays) filter.durationDays.$gte = q.minDays;
    if (q.maxDays) filter.durationDays.$lte = q.maxDays;
  }

  const [data, total] = await Promise.all([
    Package.find(filter).populate('agency', 'name').sort(SORTS[q.sort]).skip(skip).limit(limit).lean(),
    Package.countDocuments(filter)
  ]);

  return paginatedResponse(res, {
    data,
    total,
    page,
    limit,
    extra: { destination: destination ? { _id: destination._id, name: destination.name, slug: destination.slug } : null }
  });
});

// @route GET /api/packages/mine  (agency)
exports.getMyPackages = asyncHandler(async (req, res) => {
  const data = await Package.find({ agency: req.user._id }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, count: data.length, data });
});

// @route GET /api/packages/:id
// Includes what a traveller needs next in the same city: local cabs and other packages.
exports.getPackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id)
    .populate('agency', 'name phone email cityName')
    .populate('hotel', 'name starRating imageUrl address rating')
    .populate('destination', 'name slug state coordinates attractions bestTimeToVisit');
  if (!pkg || (!pkg.isActive && req.userRole !== 'admin')) throw ApiError.notFound('Package not found');

  const [reviews, similar, localCabs] = await Promise.all([
    Review.find({ itemType: 'package', itemId: pkg._id, status: 'Published' })
      .populate('user', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(20),
    Package.find({ destination: pkg.destination._id, _id: { $ne: pkg._id }, isActive: true }).limit(3).lean(),
    Transport.find({ scope: 'local', destination: pkg.destination._id, isActive: true }).sort({ rating: -1 }).limit(3)
  ]);

  res.status(200).json({ success: true, data: pkg, reviews, similar, localCabs });
});

// @route POST /api/packages  (Tour Operator or admin)
exports.createPackage = asyncHandler(async (req, res) => {
  const { agency, destination } = await resolveListingOwner(req, 'package', req.body.destination);
  await assertHotelInDestination(req.body.hotel, destination._id);

  const pkg = await Package.create({
    ...req.body,
    agency: agency._id,
    destination: destination._id,
    destinationName: destination.name,
    coordinates: destination.coordinates
  });
  res.status(201).json({ success: true, data: pkg });
});

// @route PUT /api/packages/:id
exports.updatePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) throw ApiError.notFound('Package not found');
  assertCanManage(req, pkg);
  if (req.body.hotel) await assertHotelInDestination(req.body.hotel, pkg.destination);
  pkg.set(req.body);
  await pkg.save();
  res.status(200).json({ success: true, data: pkg });
});

// @route DELETE /api/packages/:id  (archives)
exports.deletePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) throw ApiError.notFound('Package not found');
  assertCanManage(req, pkg);
  pkg.isActive = false;
  await pkg.save();
  res.status(200).json({ success: true, message: 'Package archived' });
});
