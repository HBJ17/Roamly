const Agency = require('../models/Agency');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Package = require('../models/Package');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Payout = require('../models/Payout');
const AgencyTransaction = require('../models/AgencyTransaction');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const { audit } = require('../services/auditService');
const wallet = require('../services/walletService');
const { getSettings, updateSettings } = require('../services/settingsService');
const { refreshItemRating } = require('../services/reviewService');
const { notifyAgency, notifyUser } = require('../services/notificationService');
const { findDestination } = require('../services/destinationService');
const { emitSafe } = require('../services/events');

const LISTINGS = { hotel: Hotel, transport: Transport, package: Package };
const PAID = ['Confirmed', 'Completed'];

// @route GET /api/admin/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const [totals, byStatus, monthly, byDestination, counts, commission, recent] = await Promise.all([
    Booking.aggregate([{ $match: { status: { $in: PAID } } }, { $group: { _id: null, gmv: { $sum: '$pricing.total' }, tax: { $sum: '$pricing.tax' }, n: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { status: { $in: PAID }, createdAt: { $gte: since } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, gmv: { $sum: '$pricing.total' }, n: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]),
    Booking.aggregate([
      { $match: { status: { $in: PAID } } },
      { $group: { _id: '$destinationName', gmv: { $sum: '$pricing.total' }, n: { $sum: 1 } } },
      { $sort: { gmv: -1 } },
      { $limit: 8 }
    ]),
    Promise.all([
      User.countDocuments(),
      Agency.countDocuments({ status: 'Active' }),
      Agency.countDocuments({ status: 'Pending' }),
      Payout.countDocuments({ status: 'Pending' }),
      Hotel.countDocuments({ isActive: true }),
      Transport.countDocuments({ isActive: true }),
      Package.countDocuments({ isActive: true })
    ]),
    AgencyTransaction.aggregate([{ $match: { type: { $in: ['earning', 'reversal'] } } }, { $group: { _id: null, c: { $sum: '$commission' } } }]),
    Booking.find({ status: { $ne: 'Expired' } }).sort({ createdAt: -1 }).limit(8).populate('user', 'fullName username').lean()
  ]);

  const [users, activeAgencies, pendingAgencies, pendingPayouts, hotels, transports, packages] = counts;
  res.status(200).json({
    success: true,
    data: {
      gmv: Math.round(totals[0]?.gmv || 0),
      paidBookings: totals[0]?.n || 0,
      gstCollected: Math.round(totals[0]?.tax || 0),
      commissionEarned: Math.round(commission[0]?.c || 0),
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.n])),
      monthly: monthly.map((m) => ({ month: `${m._id.y}-${String(m._id.m).padStart(2, '0')}`, gmv: Math.round(m.gmv), bookings: m.n })),
      byDestination: byDestination.map((d) => ({ destination: d._id, gmv: Math.round(d.gmv), bookings: d.n })),
      counts: { users, activeAgencies, pendingAgencies, pendingPayouts, hotels, transports, packages },
      recent
    }
  });
});

// ---------------- Agencies ----------------

// @route GET /api/admin/agencies?status=&type=&city=&q=
exports.getAgencies = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.agencyType = req.query.type;
  if (req.query.city) {
    const city = await findDestination(req.query.city);
    filter.city = city?._id || null;
  }
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    filter.$or = [{ name: rx }, { username: rx }, { email: rx }];
  }
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 25 });
  const [data, total] = await Promise.all([
    Agency.find(filter).sort({ status: 1, createdAt: -1 }).skip(skip).limit(limit),
    Agency.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});

// @route PUT /api/admin/agencies/:id   { status, rejectionReason, commissionPercent }
exports.updateAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id);
  if (!agency) throw ApiError.notFound('Agency not found');
  const before = { status: agency.status, commissionPercent: agency.commissionPercent };

  if (req.body.status && req.body.status !== agency.status) {
    agency.status = req.body.status;
    agency.rejectionReason = req.body.rejectionReason || '';
    if (req.body.status === 'Active' && !agency.approvedAt) agency.approvedAt = new Date();
    await notifyAgency(agency._id, {
      title: req.body.status === 'Active' ? 'Your agency is approved' : `Agency ${req.body.status.toLowerCase()}`,
      message: req.body.status === 'Active'
        ? 'You can now publish listings and receive bookings on Roamly.'
        : req.body.rejectionReason || 'Please contact partners@roamly.travel for details.',
      type: 'system',
      linkUrl: '/agency'
    });
    emitSafe('agency:status', { agencyId: agency._id, status: agency.status });
  }
  if (req.body.commissionPercent !== undefined) agency.commissionPercent = req.body.commissionPercent;
  await agency.save();

  await audit(req, 'AGENCY_UPDATED', 'Agency', agency._id, { before, after: req.body, name: agency.name });
  res.status(200).json({ success: true, data: agency });
});

// ---------------- Users ----------------

exports.getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    filter.$or = [{ fullName: rx }, { username: rx }, { email: rx }];
  }
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 25 });
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});

// @route PUT /api/admin/users/:id   { status }
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  await audit(req, `USER_${req.body.status.toUpperCase()}`, 'User', user._id, { username: user.username });
  res.status(200).json({ success: true, data: user });
});

// @route POST /api/admin/users/:id/wallet   { type: credit|debit, amount, reason }
exports.adjustWallet = asyncHandler(async (req, res) => {
  const { type, amount, reason } = req.body;
  const fn = type === 'credit' ? wallet.credit : wallet.debit;
  const tx = await fn(req.params.id, amount, { reason: 'adjustment', description: reason });
  await audit(req, 'WALLET_ADJUSTED', 'User', req.params.id, { type, amount, reason });
  await notifyUser(req.params.id, {
    title: 'Wallet updated',
    message: `₹${amount.toLocaleString('en-IN')} was ${type === 'credit' ? 'added to' : 'deducted from'} your wallet: ${reason}`,
    type: 'payment',
    linkUrl: '/account/wallet'
  });
  res.status(200).json({ success: true, data: tx });
});

// ---------------- Listings ----------------

// @route GET /api/admin/listings?type=hotel&destination=&active=&q=
exports.getListings = asyncHandler(async (req, res) => {
  const Model = LISTINGS[req.query.type || 'hotel'];
  if (!Model) throw ApiError.badRequest('Unknown listing type');
  const filter = {};
  if (req.query.active) filter.isActive = req.query.active === 'true';
  if (req.query.destination) {
    const d = await findDestination(req.query.destination);
    filter.destination = d?._id || null;
  }
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    filter.$or = [{ name: rx }, { title: rx }];
  }
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 25 });
  const [data, total] = await Promise.all([
    Model.find(filter).populate('agency', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Model.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});

// @route PUT /api/admin/listings/:type/:id   { isActive }
exports.setListingActive = asyncHandler(async (req, res) => {
  const Model = LISTINGS[req.params.type];
  if (!Model) throw ApiError.badRequest('Unknown listing type');
  const doc = await Model.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!doc) throw ApiError.notFound('Listing not found');
  await audit(req, req.body.isActive ? 'LISTING_RESTORED' : 'LISTING_DISABLED', req.params.type, doc._id, { title: doc.name || doc.title });
  if (!req.body.isActive) {
    await notifyAgency(doc.agency, {
      title: 'Listing disabled by Roamly',
      message: `${doc.name || doc.title} was taken offline. ${req.body.reason || ''}`.trim(),
      type: 'alert'
    });
  }
  res.status(200).json({ success: true, data: doc });
});

// ---------------- Bookings ----------------

exports.getBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.bookingType = req.query.type;
  if (req.query.destination) {
    const d = await findDestination(req.query.destination);
    filter.destination = d?._id || null;
  }
  if (req.query.q) filter.reference = { $regex: `^${escapeRegex(req.query.q)}`, $options: 'i' };
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 25 });
  const [data, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'fullName username email'),
    Booking.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});

// ---------------- Coupons ----------------

exports.getCoupons = asyncHandler(async (req, res) => {
  const data = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: data.length, data });
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  await audit(req, 'COUPON_CREATED', 'Coupon', coupon._id, { code: coupon.code });
  res.status(201).json({ success: true, data: coupon });
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  await audit(req, 'COUPON_UPDATED', 'Coupon', coupon._id, { code: coupon.code, fields: Object.keys(req.body) });
  res.status(200).json({ success: true, data: coupon });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  // Used coupons stay on record for invoices; they are only deactivated.
  if (coupon.timesUsed > 0) {
    coupon.isActive = false;
    await coupon.save();
  } else {
    await coupon.deleteOne();
  }
  await audit(req, 'COUPON_REMOVED', 'Coupon', coupon._id, { code: coupon.code });
  res.status(200).json({ success: true });
});

// ---------------- Payouts ----------------

exports.getPayouts = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const data = await Payout.find(filter).populate('agency', 'name agencyType cityName wallet').sort({ status: 1, createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, count: data.length, data });
});

// @route PUT /api/admin/payouts/:id   { status: Paid|Rejected, transferReference, adminNote }
exports.processPayout = asyncHandler(async (req, res) => {
  const payout = await Payout.findOneAndUpdate(
    { _id: req.params.id, status: 'Pending' },
    {
      status: req.body.status,
      transferReference: req.body.transferReference || '',
      adminNote: req.body.adminNote || '',
      processedBy: req.user._id,
      processedAt: new Date()
    },
    { new: true }
  );
  if (!payout) throw ApiError.conflict('This payout has already been processed');

  if (req.body.status === 'Paid') {
    await Agency.updateOne({ _id: payout.agency }, { $inc: { 'wallet.pendingPayouts': -payout.amount } });
  } else {
    await Agency.updateOne({ _id: payout.agency }, { $inc: { 'wallet.pendingPayouts': -payout.amount, 'wallet.balance': payout.amount } });
    await AgencyTransaction.create({ agency: payout.agency, type: 'payout_reversal', payout: payout._id, description: 'Payout rejected', net: payout.amount });
  }

  await notifyAgency(payout.agency, {
    title: req.body.status === 'Paid' ? 'Payout sent' : 'Payout rejected',
    message: req.body.status === 'Paid'
      ? `₹${payout.amount.toLocaleString('en-IN')} was transferred. Reference ${payout.transferReference || '-'}.`
      : `Your payout of ₹${payout.amount.toLocaleString('en-IN')} was rejected and returned to your balance. ${payout.adminNote}`,
    type: 'payout',
    linkUrl: '/agency/payouts'
  });
  await audit(req, `PAYOUT_${req.body.status.toUpperCase()}`, 'Payout', payout._id, { amount: payout.amount });
  res.status(200).json({ success: true, data: payout });
});

// ---------------- Reviews ----------------

exports.getReviews = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  if (req.query.maxRating) filter.rating = { $lte: Number(req.query.maxRating) };
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 25 });
  const [data, total] = await Promise.all([
    Review.find(filter).populate('user', 'username fullName').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});

exports.moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status, moderationNote: req.body.note || '' }, { new: true });
  if (!review) throw ApiError.notFound('Review not found');
  await refreshItemRating(review.itemType, review.itemId);
  await audit(req, `REVIEW_${req.body.status.toUpperCase()}`, 'Review', review._id, { note: req.body.note });
  res.status(200).json({ success: true, data: review });
});

// ---------------- Settings & audit ----------------

exports.getSettings = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await getSettings() });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const before = await getSettings();
  const data = await updateSettings(req.body);
  await audit(req, 'SETTINGS_UPDATED', 'Setting', 'platform', {
    changes: Object.fromEntries(Object.keys(req.body).map((k) => [k, { from: before[k], to: data[k] }]))
  });
  res.status(200).json({ success: true, data });
});

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.action) filter.action = { $regex: escapeRegex(req.query.action), $options: 'i' };
  if (req.query.actorType) filter.actorType = req.query.actorType;
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 50 });
  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter)
  ]);
  paginatedResponse(res, { data, total, page, limit });
});
