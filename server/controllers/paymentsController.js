const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/paginate');
const gateway = require('../services/paymentGateway');
const checkout = require('../services/checkoutService');

const orderPayload = (payment, order, extra = {}) => ({
  paymentId: payment._id,
  provider: order.provider,
  keyId: order.keyId,
  orderId: order.orderId,
  amount: order.amount,
  currency: order.currency,
  ...extra
});

// @route GET /api/payments/config
exports.getConfig = (req, res) => {
  res.status(200).json({
    success: true,
    data: { provider: gateway.providerName(), keyId: gateway.razorpayEnabled() ? require('../config/env').RAZORPAY_KEY_ID : null, sandbox: gateway.sandboxEnabled() }
  });
};

// @route POST /api/payments/bookings/:id   { method: 'wallet' | 'online' }
exports.payForBooking = asyncHandler(async (req, res) => {
  const result = await checkout.startBookingPayment(req.user, req.params.id, req.body.method);
  if (result.completed) {
    return res.status(200).json({ success: true, data: { completed: true, booking: result.booking } });
  }
  return res.status(200).json({
    success: true,
    data: orderPayload(result.payment, result.order, {
      completed: false,
      bookingReference: result.booking.reference,
      prefill: { name: req.user.fullName, email: req.user.email, contact: req.user.phone }
    })
  });
});

// @route POST /api/payments/topup   { amount }
exports.topup = asyncHandler(async (req, res) => {
  const { payment, order } = await checkout.startTopup(req.user, req.body.amount);
  res.status(200).json({ success: true, data: orderPayload(payment, order, { completed: false }) });
});

const loadOwnPayment = async (req) => {
  const payment = await Payment.findOne({ _id: req.body.paymentId, user: req.user._id });
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
};

// @route POST /api/payments/verify   { paymentId, orderId, providerPaymentId, signature }
exports.verify = asyncHandler(async (req, res) => {
  const payment = await loadOwnPayment(req);
  const { orderId, providerPaymentId, signature } = req.body;

  if (payment.providerOrderId !== orderId || !gateway.verifySignature({ orderId, paymentId: providerPaymentId, signature })) {
    await checkout.failOnlinePayment(payment, 'Signature verification failed');
    throw ApiError.badRequest('Payment could not be verified');
  }

  const completed = await checkout.completeOnlinePayment(payment, { providerPaymentId, method: req.body.method || '' });
  res.status(200).json({ success: true, data: { status: completed.status, purpose: completed.purpose, booking: completed.booking } });
});

// @route POST /api/payments/fail   { paymentId, reason }
exports.markFailed = asyncHandler(async (req, res) => {
  const payment = await loadOwnPayment(req);
  await checkout.failOnlinePayment(payment, req.body.reason || 'Cancelled by traveller');
  res.status(200).json({ success: true });
});

// @route POST /api/payments/sandbox/authorize   { paymentId }
// Stands in for the Razorpay checkout widget during local development.
exports.sandboxAuthorize = asyncHandler(async (req, res) => {
  const payment = await loadOwnPayment(req);
  if (payment.provider !== 'sandbox') throw ApiError.badRequest('Not a sandbox payment');
  res.status(200).json({ success: true, data: gateway.sandboxAuthorize(payment.providerOrderId) });
});

// @route POST /api/payments/webhook   (Razorpay, raw body)
exports.webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!gateway.verifyWebhook(req.body, signature)) throw ApiError.badRequest('Invalid webhook signature');

  const event = JSON.parse(req.body.toString('utf8'));
  const entity = event?.payload?.payment?.entity;
  if (entity?.order_id) {
    const payment = await Payment.findOne({ providerOrderId: entity.order_id });
    if (payment && event.event === 'payment.captured') {
      await checkout.completeOnlinePayment(payment, { providerPaymentId: entity.id, method: entity.method });
    } else if (payment && event.event === 'payment.failed') {
      await checkout.failOnlinePayment(payment, entity.error_description || 'Payment failed');
    }
  }
  res.status(200).json({ success: true });
});

// @route GET /api/wallet
exports.getWallet = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 20 });
  const [data, total] = await Promise.all([
    WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('booking', 'reference'),
    WalletTransaction.countDocuments({ user: req.user._id })
  ]);
  paginatedResponse(res, {
    data,
    total,
    page,
    limit,
    extra: { balance: req.user.walletBalance, loyaltyPoints: req.user.loyaltyPoints }
  });
});
