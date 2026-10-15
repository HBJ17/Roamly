const Review = require('../models/Review');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const { refreshItemRating, MODELS } = require('../services/reviewService');
const { notifyAgency, notifyUser } = require('../services/notificationService');

// @route GET /api/reviews/:itemType/:itemId
exports.getItemReviews = asyncHandler(async (req, res) => {
  const { itemType, itemId } = req.params;
  if (!MODELS[itemType]) throw ApiError.badRequest('Unknown item type');
  const filter = { itemType, itemId, status: 'Published' };
  const { page, limit, skip } = parsePagination(req.query);

  const [data, total, breakdown] = await Promise.all([
    Review.find(filter).populate('user', 'username fullName').sort({ helpfulCount: -1, createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { ...filter, itemId: require('mongoose').Types.ObjectId.createFromHexString(itemId) } },
      { $group: { _id: '$rating', n: { $sum: 1 } } }
    ])
  ]);
  paginatedResponse(res, {
    data,
    total,
    page,
    limit,
    extra: { breakdown: Object.fromEntries(breakdown.map((b) => [b._id, b.n])) }
  });
});

// @route GET /api/reviews/pending
// Completed bookings whose items the traveller has not reviewed yet.
exports.getReviewable = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id, status: 'Completed' }).sort({ endDate: -1 }).limit(30).lean();
  const reviewed = await Review.find({ user: req.user._id }).select('booking itemId').lean();
  const done = new Set(reviewed.map((r) => `${r.booking}:${r.itemId}`));

  const data = [];
  for (const b of bookings) {
    for (const line of b.items) {
      if (!done.has(`${b._id}:${line.item}`)) {
        data.push({ bookingId: b._id, reference: b.reference, itemType: line.itemType, itemId: line.item, title: line.title, endDate: b.endDate });
      }
    }
  }
  res.status(200).json({ success: true, count: data.length, data });
});

// @route POST /api/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { bookingId, itemId } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'Completed') throw ApiError.badRequest('You can review a trip once it is completed');

  const line = booking.items.find((i) => String(i.item) === String(itemId));
  if (!line) throw ApiError.badRequest('That item is not part of this booking');

  const review = await Review.create({
    ...req.body,
    user: req.user._id,
    booking: booking._id,
    agency: line.agency,
    itemType: line.itemType,
    itemId: line.item,
    itemModel: line.itemModel,
    itemTitle: line.title
  });

  await Booking.updateOne({ _id: booking._id }, { reviewed: true });
  await refreshItemRating(line.itemType, line.item);
  await notifyAgency(line.agency, {
    title: `New ${review.rating}-star review`,
    message: `${req.user.fullName || req.user.username} reviewed ${line.title}: "${review.title}"`,
    type: 'review',
    linkUrl: '/agency/reviews'
  });

  res.status(201).json({ success: true, data: review });
});

// @route PUT /api/reviews/:id   (author edits)
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');
  ['rating', 'ratings', 'title', 'comment', 'travelType'].forEach((k) => {
    if (req.body[k] !== undefined) review[k] = req.body[k];
  });
  await review.save();
  await refreshItemRating(review.itemType, review.itemId);
  res.status(200).json({ success: true, data: review });
});

// @route DELETE /api/reviews/:id   (author)
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');
  await review.deleteOne();
  await refreshItemRating(review.itemType, review.itemId);
  res.status(200).json({ success: true });
});

// @route POST /api/reviews/:id/helpful   (toggle)
exports.toggleHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review || review.status !== 'Published') throw ApiError.notFound('Review not found');
  if (String(review.user) === String(req.user._id)) throw ApiError.badRequest('You cannot vote on your own review');
  const has = review.helpfulBy.some((u) => String(u) === String(req.user._id));
  review.helpfulBy = has ? review.helpfulBy.filter((u) => String(u) !== String(req.user._id)) : [...review.helpfulBy, req.user._id];
  review.helpfulCount = review.helpfulBy.length;
  await review.save();
  res.status(200).json({ success: true, data: { helpfulCount: review.helpfulCount, voted: !has } });
});

// @route GET /api/reviews/agency   (partner's reviews)
exports.getAgencyReviews = asyncHandler(async (req, res) => {
  const filter = { agency: req.user._id };
  if (req.query.unanswered === 'true') filter['agencyReply.message'] = '';
  const { page, limit, skip } = parsePagination(req.query);
  const [data, total] = await Promise.all([
    Review.find(filter).populate('user', 'username fullName').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});

// @route PUT /api/reviews/:id/reply   (owning partner)
exports.replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, agency: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');
  review.agencyReply = { message: req.body.message, repliedAt: new Date() };
  await review.save();
  await notifyUser(review.user, {
    title: 'The partner replied to your review',
    message: `${req.user.name} responded to your review of ${review.itemTitle}.`,
    type: 'review',
    linkUrl: `/${review.itemType === 'transport' ? 'transports' : `${review.itemType}s`}/${review.itemId}`
  });
  res.status(200).json({ success: true, data: review });
});
