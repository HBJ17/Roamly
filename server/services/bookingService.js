const Booking = require('../models/Booking');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { today } = require('../utils/dates');
const { buildLineItem, publicLine, strictestPolicy } = require('./pricingService');
const { evaluateCoupon } = require('./couponService');
const { getSettings } = require('./settingsService');
const { usageByDay } = require('./availabilityService');

const round = (n) => Math.round(n);

// Turns the client's single-item request into pricing-builder parameters.
const toBuilderParams = (req) => {
  const travelers = (req.travelers?.adults || 1) + (req.travelers?.children || 0);
  return {
    itemId: req.itemId,
    roomId: req.roomId,
    startDate: req.startDate,
    endDate: req.endDate,
    rooms: req.rooms || 1,
    guests: travelers,
    days: req.days || 1,
    vehicles: req.vehicles || 1,
    passengers: travelers,
    seats: travelers,
    travelers,
    pickupLocation: req.pickupLocation || ''
  };
};

/**
 * Prices a set of line items: coupon, loyalty points, then GST on the discounted amount.
 * Errors from an invalid coupon are reported back instead of failing the quote.
 */
const computeTotals = async (lines, { user, couponCode, loyaltyPoints = 0, bookingType, destinationId }) => {
  const settings = await getSettings();
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  let discount = 0;
  let appliedCode = '';
  let couponError = null;
  if (couponCode) {
    try {
      const result = await evaluateCoupon({ code: couponCode, userId: user?._id, subtotal, bookingType, destinationId });
      discount = result.discount;
      appliedCode = result.coupon.code;
    } catch (err) {
      couponError = err.message;
    }
  }

  let loyaltyPointsUsed = 0;
  if (loyaltyPoints > 0 && user) {
    const cap = Math.floor(((subtotal - discount) * settings.maxLoyaltyRedeemPercent) / 100);
    loyaltyPointsUsed = Math.max(0, Math.min(loyaltyPoints, user.loyaltyPoints || 0, cap));
  }

  const taxable = Math.max(0, subtotal - discount - loyaltyPointsUsed);
  const tax = round((taxable * settings.gstPercent) / 100);

  return {
    pricing: {
      subtotal,
      discount,
      couponCode: appliedCode,
      loyaltyPointsUsed,
      loyaltyDiscount: loyaltyPointsUsed,
      taxPercent: settings.gstPercent,
      tax,
      total: taxable + tax
    },
    couponError,
    commissionPercent: settings.commissionPercent,
    loyaltyPointsToEarn: Math.floor((taxable + tax) / 100) * settings.loyaltyPointsPer100
  };
};

const quoteSingle = async (user, request) => {
  const line = await buildLineItem(request.itemType, toBuilderParams(request));
  const totals = await computeTotals([line], {
    user,
    couponCode: request.couponCode,
    loyaltyPoints: request.loyaltyPoints,
    bookingType: request.itemType,
    destinationId: line._destination
  });
  return { lines: [line], ...totals };
};

/**
 * Creates a PendingPayment booking that holds inventory for BOOKING_HOLD_MINUTES.
 * After saving, capacity is re-checked so two travellers racing for the last room cannot both win.
 */
const createHold = async (user, { lines, pricing, commissionPercent, couponError }, extra) => {
  if (couponError && extra.couponCode) throw ApiError.badRequest(couponError);

  // Reserve loyalty points up front so they cannot be spent twice.
  if (pricing.loyaltyPointsUsed > 0) {
    const res = await User.updateOne(
      { _id: user._id, loyaltyPoints: { $gte: pricing.loyaltyPointsUsed } },
      { $inc: { loyaltyPoints: -pricing.loyaltyPointsUsed } }
    );
    if (!res.modifiedCount) throw ApiError.badRequest('Not enough loyalty points');
  }

  const startDate = lines.map((l) => l.startDate).sort()[0];
  const endDate = lines.map((l) => l.endDate).sort().slice(-1)[0];

  const booking = await Booking.create({
    user: user._id,
    bookingType: extra.bookingType,
    destination: extra.destination?._id || lines[0]._destination,
    destinationName: extra.destination?.name || lines[0].destinationName,
    itinerary: extra.itinerary,
    items: lines.map(publicLine),
    startDate,
    endDate,
    travelers: extra.travelers,
    contact: {
      name: extra.contact?.name || user.fullName || user.username,
      email: extra.contact?.email || user.email,
      phone: extra.contact?.phone || user.phone || ''
    },
    specialRequests: extra.specialRequests || '',
    pricing,
    commissionPercent,
    status: 'PendingPayment',
    holdExpiresAt: new Date(Date.now() + env.BOOKING_HOLD_MINUTES * 60000),
    cancellation: { reason: '', cancelledBy: '', refundPercent: 0, refundAmount: 0 },
    cancellationPolicy: strictestPolicy(lines)
  });

  try {
    await assertNotOversold(booking);
  } catch (err) {
    await releaseHold(booking, 'Expired');
    throw err;
  }
  return booking;
};

const capacityOf = async (line) => {
  const Model = require(`../models/${line.itemModel}`);
  const doc = await Model.findById(line.item);
  if (line.itemType === 'hotel') return doc.rooms.id(line.variantId)?.totalRooms || 0;
  if (line.itemType === 'package') return doc.maxGroupSize;
  return doc.scope === 'local' ? doc.fleetSize : doc.seatsPerDeparture;
};

// Usage now includes the new hold, so any day above capacity means someone else got there first.
const assertNotOversold = async (booking) => {
  for (const line of booking.items) {
    const capacity = await capacityOf(line);
    const usage = await usageByDay(line.item, line.dates, { variantId: line.variantId });
    if (Object.values(usage).some((taken) => taken > capacity)) {
      throw ApiError.conflict(`${line.title} just sold out for your dates. Please pick another option.`);
    }
  }
};

// Ends an unpaid hold and gives back any loyalty points it reserved.
const releaseHold = async (booking, status = 'Expired') => {
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'PendingPayment' },
    { $set: { status, cancelledAt: new Date() } },
    { new: true }
  );
  if (updated && updated.pricing.loyaltyPointsUsed > 0) {
    await User.updateOne({ _id: updated.user }, { $inc: { loyaltyPoints: updated.pricing.loyaltyPointsUsed } });
  }
  return updated;
};

/** Housekeeping: expire stale holds and mark finished trips as completed. */
const sweepBookings = async () => {
  const stale = await Booking.find({ status: 'PendingPayment', holdExpiresAt: { $lte: new Date() } }).select('_id');
  for (const b of stale) await releaseHold(b, 'Expired');
  const completed = await Booking.updateMany(
    { status: 'Confirmed', endDate: { $lt: today() } },
    { $set: { status: 'Completed', completedAt: new Date() } }
  );
  return { expired: stale.length, completed: completed.modifiedCount };
};

module.exports = { quoteSingle, computeTotals, createHold, releaseHold, sweepBookings, toBuilderParams };
