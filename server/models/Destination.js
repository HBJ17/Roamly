const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const ATTRACTION_CATEGORIES = ['Temple', 'Heritage', 'Nature', 'Viewpoint', 'Lake', 'Beach', 'Museum', 'Market', 'Wildlife', 'Adventure', 'Food', 'Park', 'Waterfall'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Any'];

const AttractionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ATTRACTION_CATEGORIES, default: 'Heritage' },
  description: { type: String, default: '' },
  durationHours: { type: Number, default: 2, min: 0.5, max: 12 },
  entryFee: { type: Number, default: 0, min: 0 },
  bestTimeOfDay: { type: String, enum: TIME_SLOTS, default: 'Any' },
  imageUrl: { type: String, default: '' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
});

const DestinationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true, index: true },
  state: { type: String, required: true },
  tagline: { type: String, default: '' },
  description: { type: String, required: true },
  categories: [{ type: String }],
  bestTimeToVisit: { type: String, default: 'October to March' },
  idealDays: { type: Number, default: 3, min: 1 },
  climate: { type: String, default: '' },
  nearestAirport: { type: String, default: '' },
  nearestRailway: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  gallery: [{ type: String }],
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  attractions: [AttractionSchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

DestinationSchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) this.slug = slugify(this.name);
  next();
});

DestinationSchema.statics.ATTRACTION_CATEGORIES = ATTRACTION_CATEGORIES;
DestinationSchema.statics.TIME_SLOTS = TIME_SLOTS;

module.exports = mongoose.model('Destination', DestinationSchema);
