const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Itinerary = require('../models/Itinerary');
const ApiError = require('../utils/ApiError');
const gateway = require('./paymentGateway');
const wallet = require('./walletService');
const { recordRedemption } = require('./couponService');
const { settleBooking } = require('./settlementService');
const { notifyUser, notifyAgency } = require('./notificationService');
const { getSettings } = require('./settingsService');
const { emitSafe } = require('./events');

const MIN_TOPUP = 100;
const MAX_TOPUP = 100000;

const invoiceNumber = () => {
  const year = new Date().getFullYear();
  return `INV-${year}-${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
};

const loadPayableBooking = async (user, bookingId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: user._id });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status === 'Confirmed') throw ApiError.conflict('This booking is already paid');
  if (booking.status !== 'PendingPayment' || booking.holdExpiresAt <= new Date()) {
    throw ApiError.conflict('This booking hold has expired. Please book again.');
  }
  return booking;
};

/**
 * Marks a held booking as paid and confirmed (idempotent), then settles partners,
 * awards loyalty points, issues the invoice and notifies everyone involved.
 */
const confirmBooking = async (bookingId, payment) => {
  const settings = await getSettings();
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: 'PendingPayment' },
    { $set: { status: 'Confirmed', paymentStatus: 'Paid', confirmedAt: new Date(), holdExpiresAt: null } },
    { new: true }
  );

  if (!booking) {
    // The hold lapsed (or was cancelled) while the traveller was paying: give the money back.
    const existing = await Booking.findById(bookingId);
    if (existing?.status === 'Confirmed') return existing;
    await wallet.credit(payment.user, payment.amount, {
      reason: 'refund',
      description: `Refund: booking ${existing?.reference || ''} expired before payment completed`,
      booking: bookingId,
      payment: payment._id
    });
    await Payment.updateOne({ _id: payment._id }, { status: 'Refunded', refundedAmount: payment.amount });
    throw ApiError.conflict('Your booking hold expired before payment completed. The amount was refunded to your Roamly wallet.');
  }

  const points = Math.floor(booking.pricing.total / 100) * settings.loyaltyPointsPer100;
  booking.loyaltyPointsEarned = points;
  await booking.save();
  await User.updateOne({ _id: booking.user }, { $inc: { loyaltyPoints: points } });

  if (booking.pricing.couponCode) await recordRedemption(booking.pricing.couponCode);
  if (booking.itinerary) await Itinerary.updateOne({ _id: booking.itinerary }, { status: 'Booked', booking: booking._id });
  await settleBooking(booking);

  await Invoice.create({
    invoiceNumber: invoiceNumber(),
    booking: booking._id,
    user: booking.user,
    lines: booking.items.map((i) => ({
      description: `${i.title} - ${i.description}`,
      quantity: i.quantity,
      units: i.units,
      unitPrice: i.unitPrice,
      amount: i.lineTotal
    })),
    subtotal: booking.pricing.subtotal,
    discount: booking.pricing.discount + booking.pricing.loyaltyDiscount,
    taxPercent: booking.pricing.taxPercent,
    taxAmount: booking.pricing.tax,
    totalAmount: booking.pricing.total
  });

  await notifyUser(booking.user, {
    title: 'Booking confirmed',
    message: `${booking.reference} for ${booking.destinationName} is confirmed. You earned ${points} loyalty points.`,
    type: 'booking',
    linkUrl: `/account/bookings/${booking._id}`
  });
  const agencies = [...new Set(booking.items.map((i) => String(i.agency)))];
  await Promise.all(agencies.map((agencyId) => notifyAgency(agencyId, {
    title: 'New booking',
    message: `${booking.reference}: ${booking.items.filter((i) => String(i.agency) === agencyId).map((i) => i.title).join(', ')} from ${booking.startDate}`,
    type: 'booking',
    linkUrl: `/agency/bookings/${booking._id}`
  })));

  emitSafe('booking:confirmed', { bookingId: booking._id });
  return booking;
};

/** Starts paying for a held booking. Wallet payments complete immediately. */
const startBookingPayment = async (user, bookingId, method) => {
  const booking = await loadPayableBooking(user, bookingId);
  const amount = booking.pricing.total;

  if (method === 'wallet') {
    const payment = await Payment.create({
      user: user._id, purpose: 'booking', booking: booking._id, provider: 'wallet', method: 'wallet', amount
    });
    try {
      await wallet.debit(user._id, amount, {
        reason: 'booking',
        description: `Payment for ${booking.reference}`,
        booking: booking._id,
        payment: payment._id
      });
    } catch (err) {
      await Payment.updateOne({ _id: payment._id }, { status: 'Failed', failureReason: err.message });
      throw err;
    }
    payment.status = 'Success';
    payment.paidAt = new Date();
    await payment.save();
    const confirmed = await confirmBooking(booking._id, payment);
    return { completed: true, payment, booking: confirmed };
  }

  const order = await gateway.createOrder({ amount, receipt: booking.reference, notes: { bookingId: String(booking._id) } });
  const payment = await Payment.create({
    user: user._id, purpose: 'booking', booking: booking._id, provider: order.provider, providerOrderId: order.orderId, amount
  });
  return { completed: false, payment, order, booking };
};

const startTopup = async (user, amount) => {
  if (amount < MIN_TOPUP || amount > MAX_TOPUP) {
    throw ApiError.badRequest(`Top-ups must be between ₹${MIN_TOPUP} and ₹${MAX_TOPUP.toLocaleString('en-IN')}`);
  }
  const order = await gateway.createOrder({ amount, receipt: `topup-${user._id}-${Date.now()}`, notes: { purpose: 'wallet_topup' } });
  const payment = await Payment.create({
    user: user._id, purpose: 'wallet_topup', provider: order.provider, providerOrderId: order.orderId, amount
  });
  return { payment, order };
};

/** Applies a gateway-confirmed payment exactly once (checkout callback and webhook may both arrive). */
const completeOnlinePayment = async (payment, { providerPaymentId, method = '' }) => {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'Created' },
    { $set: { status: 'Success', providerPaymentId, method, paidAt: new Date() } },
    { new: true }
  );
  if (!claimed) return Payment.findById(payment._id);

  if (claimed.purpose === 'wallet_topup') {
    await wallet.credit(claimed.user, claimed.amount, {
      reason: 'topup', description: 'Wallet top-up', payment: claimed._id
    });
    await notifyUser(claimed.user, {
      title: 'Wallet topped up',
      message: `₹${claimed.amount.toLocaleString('en-IN')} was added to your Roamly wallet.`,
      type: 'payment',
      linkUrl: '/account/wallet'
    });
  } else {
    await confirmBooking(claimed.booking, claimed);
  }
  return claimed;
};

const failOnlinePayment = (payment, reason) =>
  Payment.updateOne({ _id: payment._id, status: 'Created' }, { status: 'Failed', failureReason: reason });

module.exports = { startBookingPayment, startTopup, completeOnlinePayment, failOnlinePayment, confirmBooking };
