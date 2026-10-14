const mongoose = require('mongoose');
const crypto = require('crypto');

const ITEM_MODELS = { package: 'Package', hotel: 'Hotel', transport: 'Transport' };

/**
 * One bookable component. `dates` lists every calendar day the item consumes inventory
 * (hotel nights, cab days, the departure day of a seat or package) and drives availability.
 */
const LineItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: Object.keys(ITEM_MODELS), required: true },
  item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'items.itemModel' },
  itemModel: { type: String, enum: Object.values(ITEM_MODELS), required: true },
  // Sub-unit of the item, e.g. the hotel room type.
  variantId: { type: mongoose.Schema.Types.ObjectId },
  variantName: { type: String, default: '' },
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  title: { type: String, required: true },
  destinationName: { type: String, default: '' },
  description: { type: String, default: '' },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  dates: [{ type: String }],
  quantity: { type: Number, required: true, min: 1 },
  units: { type: Number, default: 1, min: 1 },
  unitLabel: { type: String, default: '' },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const BookingSchema = new mongoose.Schema({
  reference: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookingType: { type: String, enum: ['package', 'hotel', 'transport', 'trip'], required: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', index: true },
  destinationName: { type: String, default: '' },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' },
  items: {
    type: [LineItemSchema],
    validate: [(items) => items.length > 0, 'A booking needs at least one item']
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  travelers: {
    adults: { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 }
  },
  contact: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  specialRequests: { type: String, default: '' },
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    loyaltyPointsUsed: { type: Number, default: 0 },
    loyaltyDiscount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['PendingPayment', 'Confirmed', 'Cancelled', 'Completed', 'Expired'],
    default: 'PendingPayment',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Refunded', 'PartiallyRefunded'],
    default: 'Unpaid'
  },
  holdExpiresAt: { type: Date },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancellation: {
    reason: { type: String, default: '' },
    cancelledBy: { type: String, enum: ['user', 'agency', 'admin', 'system', ''], default: '' },
    refundPercent: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 }
  },
  cancellationPolicy: { type: String, enum: ['Flexible', 'Moderate', 'Strict'], default: 'Moderate' },
  commissionPercent: { type: Number, default: 10 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  reviewed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

BookingSchema.index({ 'items.item': 1, 'items.dates': 1, status: 1 });
BookingSchema.index({ 'items.agency': 1, createdAt: -1 });

BookingSchema.pre('validate', function setReference(next) {
  if (!this.reference) {
    this.reference = `RML-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
  next();
});

BookingSchema.virtual('numTravelers').get(function numTravelers() {
  return (this.travelers?.adults || 0) + (this.travelers?.children || 0);
});

BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.statics.ITEM_MODELS = ITEM_MODELS;

module.exports = mongoose.model('Booking', BookingSchema);
