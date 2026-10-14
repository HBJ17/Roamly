const mongoose = require('mongoose');
const passwordPlugin = require('./plugins/password');
const { AGENCY_TYPES, CITY_BOUND_AGENCY_TYPES } = require('../config/constants');

const AgencySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 8, select: false },
  name: { type: String, required: true, trim: true },
  agencyType: { type: String, required: true, enum: AGENCY_TYPES },
  // Home city. Hotel partners, cab operators and tour operators can only list inventory here.
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required() {
      return CITY_BOUND_AGENCY_TYPES.includes(this.agencyType);
    }
  },
  cityName: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  description: { type: String, default: '' },
  gstin: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  status: { type: String, default: 'Pending', enum: ['Active', 'Pending', 'Suspended'] },
  rejectionReason: { type: String, default: '' },
  commissionPercent: { type: Number, min: 0, max: 50 },
  bankDetails: {
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    bankName: { type: String, default: '' }
  },
  wallet: {
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    pendingPayouts: { type: Number, default: 0 }
  },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

AgencySchema.plugin(passwordPlugin);

module.exports = mongoose.model('Agency', AgencySchema);
