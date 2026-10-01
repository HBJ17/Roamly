const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a package title'],
    trim: true
  },
  destination: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Hill Station', 'Beach', 'Heritage', 'Wildlife', 'Pilgrimage', 'Adventure', 'Cultural']
  },
  price: {
    type: Number,
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  durationNights: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  highlights: [{ type: String }],
  includedAmenities: [{ type: String }],
  foodHighlights: [{ type: String }],
  rating: {
    type: Number,
    default: 4.5
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency'
  },
  pros: [{ type: String }],
  cons: [{ type: String }],
  idealFor: {
    type: String,
    default: 'All Travelers'
  },
  coordinates: {
    lat: { type: Number, default: 20.5937 },
    lng: { type: Number, default: 78.9629 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Package', PackageSchema);
