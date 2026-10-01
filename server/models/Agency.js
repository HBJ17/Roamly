const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

AgencySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AgencySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Agency', AgencySchema);
