const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: { type: String, enum: ['booking', 'wallet_topup'], required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
  provider: { type: String, enum: ['wallet', 'razorpay', 'sandbox'], required: true },
  providerOrderId: { type: String, index: true },
  providerPaymentId: { type: String },
  method: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['Created', 'Success', 'Failed', 'Refunded'], default: 'Created' },
  failureReason: { type: String, default: '' },
  refundedAmount: { type: Number, default: 0 },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);
