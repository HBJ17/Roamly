const Hotel = require('../models/Hotel');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const { findDestination } = require('../services/destinationService');
const { resolveListingOwner, assertCanManage } = require('../services/listingAccess');

const SORTS = {
  recommended: { rating: -1, starRating: -1 },
  price_asc: { startingPrice: 1 },
  price_desc: { startingPrice: -1 },
  rating: { rating: -1, reviewCount: -1 },
  stars: { starRating: -1 }
};

// @route GET /api/hotels?destination=chennai&...
// Results are always confined to one city when a destination is given.
exports.getHotels = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const filter = { isActive: true };

  let destination = null;
  if (q.destination) {
    destination = await findDestination(q.destination);
    if (!destination) {
      return paginatedResponse(res, { data: [], total: 0, page: 1, limit: 12, extra: { destination: null } });
    }
    filter.destination = destination._id;
  }
  if (q.q) filter.name = { $regex: escapeRegex(q.q), $options: 'i' };
  if (q.stars) filter.starRating = { $gte: q.stars };
  if (q.petFriendly) filter.petFriendly = q.petFriendly === 'true';

  const roomMatch = {};
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    roomMatch.pricePerNight = {};
    if (q.minPrice !== undefined) roomMatch.pricePerNight.$gte = q.minPrice;
    if (q.maxPrice !== undefined) roomMatch.pricePerNight.$lte = q.maxPrice;
  }
  if (q.ac) roomMatch.acType = q.ac;
  if (q.guests) {
    // Enough guests must fit in the requested number of rooms of a single type.
    roomMatch.maxGuests = { $gte: Math.ceil(q.guests / (q.rooms || 1)) };
  }
  if (Object.keys(roomMatch).length) filter.rooms = { $elemMatch: roomMatch };

  const { page, limit, skip } = parsePagination(q);
  const [data, total] = await Promise.all([
    Hotel.find(filter).sort(SORTS[q.sort]).skip(skip).limit(limit).lean(),
    Hotel.countDocuments(filter)
  ]);

  paginatedResponse(res, {
    data,
    total,
    page,
    limit,
    extra: { destination: destination ? { _id: destination._id, name: destination.name, slug: destination.slug } : null }
  });
});

// @route GET /api/hotels/mine  (agency)
exports.getMyHotels = asyncHandler(async (req, res) => {
  const data = await Hotel.find({ agency: req.user._id }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, count: data.length, data });
});

// @route GET /api/hotels/:id
exports.getHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id)
    .populate('agency', 'name phone email cityName')
    .populate('destination', 'name slug state coordinates');
  if (!hotel || (!hotel.isActive && req.userRole !== 'admin')) throw ApiError.notFound('Hotel not found');

  const [reviews, similar] = await Promise.all([
    Review.find({ itemType: 'hotel', itemId: hotel._id, status: 'Published' })
      .populate('user', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(20),
    // "Similar" stays in the same city.
    Hotel.find({ destination: hotel.destination._id, _id: { $ne: hotel._id }, isActive: true })
      .sort({ rating: -1 })
      .limit(3)
      .lean()
  ]);

  res.status(200).json({ success: true, data: hotel, reviews, similar });
});

// @route POST /api/hotels  (Hotel Partner or admin)
exports.createHotel = asyncHandler(async (req, res) => {
  const { agency, destination } = await resolveListingOwner(req, 'hotel', req.body.destination);
  const hotel = await Hotel.create({
    ...req.body,
    agency: agency._id,
    destination: destination._id,
    destinationName: destination.name,
    coordinates: req.body.coordinates || destination.coordinates
  });
  res.status(201).json({ success: true, data: hotel });
});

// @route PUT /api/hotels/:id
exports.updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  assertCanManage(req, hotel);
  hotel.set(req.body);
  await hotel.save();
  res.status(200).json({ success: true, data: hotel });
});

// @route DELETE /api/hotels/:id
// Listings with booking history are archived rather than removed.
exports.deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  assertCanManage(req, hotel);
  hotel.isActive = false;
  await hotel.save();
  res.status(200).json({ success: true, message: 'Hotel archived' });
});
