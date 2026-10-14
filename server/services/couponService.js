const Coupon = require('../models/Coupon');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');

/**
 * Validates a coupon for a user and order, returning { coupon, discount }.
 * Throws a 400 with a traveller-friendly reason when it cannot be applied.
 */
const evaluateCoupon = async ({ code, userId, subtotal, bookingType, destinationId }) => {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  const now = new Date();

  if (!coupon || !coupon.isActive) throw ApiError.badRequest('This promo code is not valid');
  if (coupon.validFrom && coupon.validFrom > now) throw ApiError.badRequest('This promo code is not active yet');
  if (coupon.validUntil < now) throw ApiError.badRequest('This promo code has expired');
  if (coupon.timesUsed >= coupon.usageLimit) throw ApiError.badRequest('This promo code has been fully redeemed');
  if (coupon.applicableTo !== 'all' && bookingType && coupon.applicableTo !== bookingType) {
    throw ApiError.badRequest(`This promo code only applies to ${coupon.applicableTo} bookings`);
  }
  if (coupon.destinations.length && destinationId && !coupon.destinations.some((d) => String(d) === String(destinationId))) {
    throw ApiError.badRequest('This promo code is not valid for this destination');
  }
  if (subtotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(`Add ₹${(coupon.minOrderAmount - subtotal).toLocaleString('en-IN')} more to use this code`);
  }

  if (userId) {
    const used = await Booking.countDocuments({
      user: userId,
      'pricing.couponCode': coupon.code,
      status: { $in: ['Confirmed', 'Completed'] }
    });
    if (used >= coupon.perUserLimit) throw ApiError.badRequest('You have already used this promo code');
  }

  let discount = coupon.discountType === 'percent'
    ? Math.round((subtotal * coupon.discountValue) / 100)
    : coupon.discountValue;
  discount = Math.min(discount, coupon.maxDiscountAmount, subtotal);

  return { coupon, discount };
};

// Counted only once a booking is paid, so abandoned holds do not burn the coupon.
const recordRedemption = (code) =>
  Coupon.updateOne({ code, $expr: { $lt: ['$timesUsed', '$usageLimit'] } }, { $inc: { timesUsed: 1 } });

const releaseRedemption = (code) => Coupon.updateOne({ code, timesUsed: { $gt: 0 } }, { $inc: { timesUsed: -1 } });

module.exports = { evaluateCoupon, recordRedemption, releaseRedemption };
