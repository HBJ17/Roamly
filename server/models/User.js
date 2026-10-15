const mongoose = require('mongoose');
const passwordPlugin = require('./plugins/password');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  fullName: { type: String, default: '', trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  homeCity: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  preferences: {
    preferredTravelMode: { type: String, default: 'Train' },
    dietaryPreference: { type: String, default: 'Vegetarian' },
    budgetRange: { type: String, default: 'Moderate' },
    preferredCategories: [{ type: String }],
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' }
  },
  walletBalance: { type: Number, default: 0, min: 0 },
  loyaltyPoints: { type: Number, default: 0, min: 0 },
  emailVerified: { type: Boolean, default: false },
  verifyEmailToken: { type: String, select: false },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.plugin(passwordPlugin);

module.exports = mongoose.model('User', UserSchema);
