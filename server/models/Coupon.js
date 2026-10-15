const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscountAmount: { type: Number, default: 10000, min: 0 },
  applicableTo: { type: String, enum: ['all', 'package', 'hotel', 'transport', 'trip'], default: 'all' },
  // Empty means valid in every destination.
  destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number, default: 100, min: 0 },
  perUserLimit: { type: Number, default: 1, min: 1 },
  timesUsed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);
