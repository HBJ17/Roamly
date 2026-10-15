const mongoose = require('mongoose');
const Agency = require('../models/Agency');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Package = require('../models/Package');
const Review = require('../models/Review');
const Conversation = require('../models/Conversation');
const AgencyTransaction = require('../models/AgencyTransaction');
const Payout = require('../models/Payout');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { today, addDays } = require('../utils/dates');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const { getSettings } = require('../services/settingsService');
const { serializeAccount } = require('../middleware/auth');

const LISTING_MODELS = {
  'Hotel Partner': [Hotel],
  'Cab Operator': [Transport],
  'Intercity Transit': [Transport],
  'Tour Operator': [Package]
};

// Only the lines of a booking that belong to this partner.
const ownLines = (booking, agencyId) => booking.items.filter((i) => String(i.agency) === String(agencyId));

// @route GET /api/agency/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const agencyId = req.user._id;
  const oid = new mongoose.Types.ObjectId(String(agencyId));
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [listingCounts, upcoming, statusCounts, monthly, ratingStats, unread, pendingPayout] = await Promise.all([
    Promise.all((LISTING_MODELS[req.user.agencyType] || []).map((M) => M.countDocuments({ agency: agencyId, isActive: true }))),
    Booking.find({ 'items.agency': agencyId, status: 'Confirmed', startDate: { $gte: today(), $lte: addDays(today(), 14) } })
      .sort({ startDate: 1 })
      .limit(8)
      .populate('user', 'fullName username phone')
      .lean(),
    Booking.aggregate([{ $match: { 'items.agency': oid } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    AgencyTransaction.aggregate([
      { $match: { agency: oid, type: { $in: ['earning', 'reversal'] }, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, net: { $sum: '$net' }, gross: { $sum: '$gross' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]),
    Review.aggregate([{ $match: { agency: oid, status: 'Published' } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 }, unanswered: { $sum: { $cond: [{ $eq: ['$agencyReply.message', ''] }, 1, 0] } } } }]),
    Conversation.aggregate([{ $match: { agency: oid } }, { $group: { _id: null, n: { $sum: '$unreadForAgency' } } }]),
    Payout.aggregate([{ $match: { agency: oid, status: 'Pending' } }, { $group: { _id: null, n: { $sum: '$amount' } } }])
  ]);

  const statuses = Object.fromEntries(statusCounts.map((s) => [s._id, s.n]));
  res.status(200).json({
    success: true,
    data: {
      agency: serializeAccount(req.user, 'agency'),
      wallet: req.user.wallet,
      pendingPayout: pendingPayout[0]?.n || 0,
      listings: listingCounts.reduce((a, b) => a + b, 0),
      bookings: {
        confirmed: statuses.Confirmed || 0,
        completed: statuses.Completed || 0,
        cancelled: statuses.Cancelled || 0
      },
      rating: ratingStats[0] ? { average: Math.round(ratingStats[0].avg * 10) / 10, count: ratingStats[0].n, unanswered: ratingStats[0].unanswered } : { average: 0, count: 0, unanswered: 0 },
      unreadMessages: unread[0]?.n || 0,
      monthlyEarnings: monthly.map((m) => ({ month: `${m._id.y}-${String(m._id.m).padStart(2, '0')}`, net: Math.round(m.net), gross: Math.round(m.gross) })),
      upcoming: upcoming.map((b) => ({ ...b, items: ownLines(b, agencyId) }))
    }
  });
});

// @route GET /api/agency/bookings?status=&from=&to=&q=
exports.getBookings = asyncHandler(async (req, res) => {
  const filter = { 'items.agency': req.user._id, status: { $ne: 'Expired' } };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.startDate = {};
    if (req.query.from) filter.startDate.$gte = req.query.from;
    if (req.query.to) filter.startDate.$lte = req.query.to;
  }
  if (req.query.q) filter.reference = { $regex: `^${String(req.query.q).replace(/[^A-Za-z0-9-]/g, '')}`, $options: 'i' };

  const { page, limit, skip } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    Booking.find(filter).sort({ startDate: req.query.status === 'Confirmed' ? 1 : -1 }).skip(skip).limit(limit)
      .populate('user', 'fullName username email phone').lean(),
    Booking.countDocuments(filter)
  ]);
  const data = rows.map((b) => {
    const items = ownLines(b, req.user._id);
    return { ...b, items, partnerTotal: items.reduce((s, i) => s + i.lineTotal, 0), pricing: undefined };
  });
  paginatedResponse(res, { data, total, page, limit });
});

// @route GET /api/agency/earnings
exports.getEarnings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 25 });
  const filter = { agency: req.user._id };
  const [data, total] = await Promise.all([
    AgencyTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AgencyTransaction.countDocuments(filter)
  ]);
  const settings = await getSettings();
  paginatedResponse(res, {
    data,
    total,
    page,
    limit,
    extra: {
      wallet: req.user.wallet,
      commissionPercent: req.user.commissionPercent ?? settings.commissionPercent,
      minPayoutAmount: settings.minPayoutAmount
    }
  });
});

// @route GET /api/agency/payouts
exports.getPayouts = asyncHandler(async (req, res) => {
  const data = await Payout.find({ agency: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.status(200).json({ success: true, count: data.length, data });
});

// @route POST /api/agency/payouts   { amount, note }
// The amount leaves the available balance immediately and returns if the request is rejected.
exports.requestPayout = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const { amount, note } = req.body;
  const bank = req.user.bankDetails || {};
  if (!bank.accountNumber || !bank.ifsc) throw ApiError.badRequest('Add your bank account details before requesting a payout');
  if (amount < settings.minPayoutAmount) throw ApiError.badRequest(`The minimum payout is ₹${settings.minPayoutAmount.toLocaleString('en-IN')}`);

  const agency = await Agency.findOneAndUpdate(
    { _id: req.user._id, 'wallet.balance': { $gte: amount } },
    { $inc: { 'wallet.balance': -amount, 'wallet.pendingPayouts': amount } },
    { new: true }
  );
  if (!agency) throw ApiError.badRequest('The amount is more than your available balance');

  const payout = await Payout.create({ agency: agency._id, amount, note, bankDetails: bank });
  await AgencyTransaction.create({ agency: agency._id, type: 'payout', payout: payout._id, description: 'Payout requested', net: -amount });
  res.status(201).json({ success: true, data: payout, wallet: agency.wallet });
});

// @route PUT /api/agency/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  ['name', 'phone', 'address', 'description', 'gstin', 'logoUrl'].forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  if (req.body.bankDetails) {
    Object.entries(req.body.bankDetails).forEach(([k, v]) => {
      updates[`bankDetails.${k}`] = v;
    });
  }
  const agency = await Agency.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: { ...serializeAccount(agency, 'agency'), bankDetails: agency.bankDetails, description: agency.description, gstin: agency.gstin } });
});

// @route GET /api/agency/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const a = req.user;
  res.status(200).json({
    success: true,
    data: { ...serializeAccount(a, 'agency'), bankDetails: a.bankDetails, description: a.description, gstin: a.gstin, wallet: a.wallet, commissionPercent: a.commissionPercent }
  });
});
