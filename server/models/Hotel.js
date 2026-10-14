const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  pricePerNight: { type: Number, required: true, min: 0 },
  maxGuests: { type: Number, default: 2, min: 1, max: 12 },
  totalRooms: { type: Number, default: 5, min: 0 },
  bedType: { type: String, default: 'King Bed' },
  acType: { type: String, enum: ['AC', 'Non-AC'], default: 'AC' },
  amenities: [{ type: String }]
});

const HotelSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
  destinationName: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  starRating: { type: Number, default: 3, min: 1, max: 5 },
  description: { type: String, required: true },
  rooms: {
    type: [RoomSchema],
    validate: [(rooms) => rooms.length > 0, 'A hotel needs at least one room type']
  },
  startingPrice: { type: Number, default: 0 },
  amenities: [{ type: String }],
  diningOptions: [{ type: String }],
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'
  },
  gallery: [{ type: String }],
  petFriendly: { type: Boolean, default: false },
  checkInTime: { type: String, default: '14:00' },
  checkOutTime: { type: String, default: '11:00' },
  cancellationPolicy: { type: String, enum: ['Flexible', 'Moderate', 'Strict'], default: 'Moderate' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

HotelSchema.index({ name: 'text', description: 'text', amenities: 'text' });

HotelSchema.pre('save', function computeStartingPrice(next) {
  if (this.rooms && this.rooms.length) {
    this.startingPrice = Math.min(...this.rooms.map((r) => r.pricePerNight));
  }
  next();
});

module.exports = mongoose.model('Hotel', HotelSchema);
