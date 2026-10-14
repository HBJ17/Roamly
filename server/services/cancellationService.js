const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { today, diffDays } = require('../utils/dates');
const wallet = require('./walletService');
const { getSettings } = require('./settingsService');
const { releaseHold } = require('./bookingService');
const { reverseBooking } = require('./settlementService');
const { releaseRedemption } = require('./couponService');
const { notifyUser, notifyAgency } = require('./notificationService');
const { emitSafe } = require('./events');

/**
 * Refund owed if the booking were cancelled now.
 * Travellers follow the booking's cancellation policy; partner or admin cancellations refund in full.
 */
const previewCancellation = async (booking, cancelledBy = 'user') => {
  const daysBefore = diffDays(today(), booking.startDate);
  if (cancelledBy !== 'user') {
    return { daysBefore, refundPercent: 100, refundAmount: booking.pricing.total, policy: booking.cancellationPolicy };
  }
  if (daysBefore < 0) {
    return { daysBefore, refundPercent: 0, refundAmount: 0, policy: booking.cancellationPolicy };
  }
  const settings = await getSettings();
  const tiers = [...(settings.cancellationTiers[booking.cancellationPolicy] || [])].sort((a, b) => b.daysBefore - a.daysBefore);
  const tier = tiers.find((t) => daysBefore >= t.daysBefore);
  const refundPercent = tier ? tier.refundPercent : 0;
  return {
    daysBefore,
    refundPercent,
    refundAmount: Math.round((booking.pricing.total * refundPercent) / 100),
    policy: booking.cancellationPolicy,
    tiers
  };
};

const cancelBooking = async (booking, { cancelledBy, reason = '' }) => {
  if (booking.status === 'PendingPayment') {
    await releaseHold(booking, 'Cancelled');
    return Booking.findById(booking._id);
  }
  if (booking.status !== 'Confirmed') throw ApiError.conflict(`A ${booking.status.toLowerCase()} booking cannot be cancelled`);
  if (cancelledBy === 'user' && booking.startDate <= today()) {
    throw ApiError.badRequest('Trips that have already started cannot be cancelled online. Please contact support.');
  }

  const { refundPercent, refundAmount } = await previewCancellation(booking, cancelledBy);

  // Claim the booking first so a double click cannot refund twice.
  const claimed = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'Confirmed' },
    {
      $set: {
        status: 'Cancelled',
        cancelledAt: new Date(),
        paymentStatus: refundPercent === 100 ? 'Refunded' : refundPercent > 0 ? 'PartiallyRefunded' : 'Paid',
        cancellation: { reason, cancelledBy, refundPercent, refundAmount }
      }
    },
    { new: true }
  );
  if (!claimed) throw ApiError.conflict('This booking was already cancelled');

  if (refundAmount > 0) {
    await wallet.credit(claimed.user, refundAmount, {
      reason: 'refund',
      description: `Refund for ${claimed.reference} (${refundPercent}%)`,
      booking: claimed._id
    });
    await Payment.updateMany({ booking: claimed._id, status: 'Success' }, { $inc: { refundedAmount: refundAmount } });
    await Invoice.updateOne(
      { booking: claimed._id },
      { refundedAmount: refundAmount, status: refundPercent === 100 ? 'Refunded' : 'PartiallyRefunded' }
    );
  }

  // Points earned on a cancelled trip are taken back; points spent come back on a full refund.
  const pointsDelta = (refundPercent === 100 ? claimed.pricing.loyaltyPointsUsed : 0) - claimed.loyaltyPointsEarned;
  if (pointsDelta !== 0) {
    const user = await User.findById(claimed.user).select('loyaltyPoints');
    await User.updateOne({ _id: claimed.user }, { $set: { loyaltyPoints: Math.max(0, (user?.loyaltyPoints || 0) + pointsDelta) } });
  }

  await reverseBooking(claimed, refundPercent);
  if (claimed.pricing.couponCode && refundPercent === 100) await releaseRedemption(claimed.pricing.couponCode);

  await notifyUser(claimed.user, {
    title: 'Booking cancelled',
    message: refundAmount > 0
      ? `${claimed.reference} was cancelled. ₹${refundAmount.toLocaleString('en-IN')} has been refunded to your Roamly wallet.`
      : `${claimed.reference} was cancelled. No refund applies under the ${claimed.cancellationPolicy} policy.`,
    type: 'booking',
    linkUrl: `/account/bookings/${claimed._id}`
  });
  const agencies = [...new Set(claimed.items.map((i) => String(i.agency)))];
  await Promise.all(agencies.map((id) => notifyAgency(id, {
    title: 'Booking cancelled',
    message: `${claimed.reference} (${claimed.startDate}) was cancelled by the ${cancelledBy}.`,
    type: 'booking',
    linkUrl: `/agency/bookings/${claimed._id}`
  })));

  emitSafe('booking:cancelled', { bookingId: claimed._id });
  return claimed;
};

module.exports = { previewCancellation, cancelBooking };
