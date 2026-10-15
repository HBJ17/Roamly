const mongoose = require('mongoose');

const CATEGORIES = ['Hill Station', 'Beach', 'Heritage', 'Wildlife', 'Pilgrimage', 'Adventure', 'Cultural'];

const DayPlanSchema = new mongoose.Schema({
  day: { type: Number, required: true, min: 1 },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  attractions: [{ type: String }]
}, { _id: false });

const PackageSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
  destinationName: { type: String, required: true },
  // Optional stay included in the package; must be a hotel in the same destination.
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  title: { type: String, required: [true, 'Please provide a package title'], trim: true },
  category: { type: String, required: true, enum: CATEGORIES },
  price: { type: Number, required: true, min: 0 },
  durationDays: { type: Number, required: true, min: 1 },
  durationNights: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  highlights: [{ type: String }],
  inclusions: [{ type: String }],
  exclusions: [{ type: String }],
  foodHighlights: [{ type: String }],
  dayPlan: [DayPlanSchema],
  pros: [{ type: String }],
  cons: [{ type: String }],
  idealFor: { type: String, default: 'All Travellers' },
  minTravelers: { type: Number, default: 1, min: 1 },
  maxGroupSize: { type: Number, default: 20, min: 1 },
  cancellationPolicy: { type: String, enum: ['Flexible', 'Moderate', 'Strict'], default: 'Moderate' },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  },
  gallery: [{ type: String }],
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

PackageSchema.index({ title: 'text', description: 'text', highlights: 'text' });

PackageSchema.pre('validate', function checkDuration(next) {
  if (this.durationNights > this.durationDays || this.durationNights < this.durationDays - 1) {
    return next(new Error('Nights must equal days or days minus one'));
  }
  return next();
});

PackageSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Package', PackageSchema);
