/**
 * Online payment gateway.
 *  - Razorpay (test or live) when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are configured.
 *  - Otherwise a local sandbox that behaves like Razorpay (order -> signed payment -> verify),
 *    available outside production only, so the full checkout can be exercised without keys.
 */
const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const hmac = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');
const safeEqual = (a = '', b = '') => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const razorpayEnabled = () => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
const sandboxEnabled = () => !razorpayEnabled() && !env.isProd;
const providerName = () => (razorpayEnabled() ? 'razorpay' : 'sandbox');

const createOrder = async ({ amount, receipt, notes = {} }) => {
  const amountPaise = Math.round(amount * 100);

  if (razorpayEnabled()) {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes })
    });
    const body = await res.json();
    if (!res.ok) throw new ApiError(502, body?.error?.description || 'Payment gateway error');
    return { provider: 'razorpay', orderId: body.id, amount: amountPaise, currency: 'INR', keyId: env.RAZORPAY_KEY_ID };
  }

  if (!sandboxEnabled()) throw new ApiError(503, 'Online payments are not configured');
  return {
    provider: 'sandbox',
    orderId: `order_sbx_${crypto.randomBytes(8).toString('hex')}`,
    amount: amountPaise,
    currency: 'INR',
    keyId: 'sandbox'
  };
};

// Razorpay checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
const verifySignature = ({ orderId, paymentId, signature }) => {
  const secret = razorpayEnabled() ? env.RAZORPAY_KEY_SECRET : env.JWT_SECRET;
  return safeEqual(hmac(secret, `${orderId}|${paymentId}`), signature);
};

// Sandbox only: produces the payment id + signature a real checkout would return.
const sandboxAuthorize = (orderId) => {
  if (!sandboxEnabled()) throw ApiError.forbidden('Sandbox payments are disabled');
  const paymentId = `pay_sbx_${crypto.randomBytes(8).toString('hex')}`;
  return { orderId, paymentId, signature: hmac(env.JWT_SECRET, `${orderId}|${paymentId}`) };
};

const verifyWebhook = (rawBody, signature) =>
  Boolean(env.RAZORPAY_WEBHOOK_SECRET) && safeEqual(hmac(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);

module.exports = { createOrder, verifySignature, sandboxAuthorize, verifyWebhook, providerName, razorpayEnabled, sandboxEnabled };
