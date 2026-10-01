const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    index: true
  },
  address: {
    type: String,
    required: true
  },
  starRating: {
    type: Number,
    default: 4.0
  },
  pricePerNight: {
    type: Number,
    required: true
  },
  roomTypes: [{ type: String }],
  amenities: [{ type: String }],
  description: {
    type: String,
    required: true
  },
  diningOptions: [{ type: String }],
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'
  },
  acType: {
    type: String,
    enum: ['AC', 'Non-AC', 'Both'],
    default: 'AC'
  },
  petFriendly: {
    type: Boolean,
    default: false
  },
  bedType: {
    type: String,
    default: 'King Bed'
  },
  maxCapacity: {
    type: Number,
    default: 2
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

module.exports = mongoose.model('Hotel', HotelSchema);
