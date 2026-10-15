const mongoose = require('mongoose');

// Single platform-wide settings document, editable by admins.
const SettingSchema = new mongoose.Schema({
  key: { type: String, default: 'platform', unique: true },
  commissionPercent: { type: Number, default: 10, min: 0, max: 50 },
  gstPercent: { type: Number, default: 18, min: 0, max: 28 },
  loyaltyPointsPer100: { type: Number, default: 5, min: 0 },
  maxLoyaltyRedeemPercent: { type: Number, default: 20, min: 0, max: 100 },
  // Refund percentage by days before the trip starts, per policy (first matching tier wins).
  cancellationTiers: {
    Flexible: { type: [{ daysBefore: Number, refundPercent: Number }], default: [{ daysBefore: 1, refundPercent: 100 }, { daysBefore: 0, refundPercent: 50 }] },
    Moderate: { type: [{ daysBefore: Number, refundPercent: Number }], default: [{ daysBefore: 7, refundPercent: 100 }, { daysBefore: 2, refundPercent: 50 }, { daysBefore: 0, refundPercent: 0 }] },
    Strict: { type: [{ daysBefore: Number, refundPercent: Number }], default: [{ daysBefore: 14, refundPercent: 75 }, { daysBefore: 7, refundPercent: 25 }, { daysBefore: 0, refundPercent: 0 }] }
  },
  minPayoutAmount: { type: Number, default: 1000, min: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', SettingSchema);
