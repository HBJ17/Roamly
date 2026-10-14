const mongoose = require('mongoose');
const passwordPlugin = require('./plugins/password');

const AgencySchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  name: {
    type: String,
    required: true
  },
  agencyType: {
    type: String,
    required: true,
    enum: ['Tour Agency', 'Hotel Partner', 'Transport Provider', 'Full Service']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Pending', 'Suspended']
  },
  wallet: {
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    pendingPayouts: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

AgencySchema.plugin(passwordPlugin);

module.exports = mongoose.model('Agency', AgencySchema);
