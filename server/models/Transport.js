const mongoose = require('mongoose');

const TransportSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  transportType: {
    type: String,
    required: true,
    enum: ['Flight', 'Train', 'Bus', 'Taxi', 'Cruise']
  },
  sourceCity: {
    type: String,
    required: true,
    index: true
  },
  destinationCity: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  durationHours: {
    type: Number,
    required: true
  },
  features: [{ type: String }],
  departureTime: {
    type: String,
    required: true
  },
  mealService: {
    type: String,
    default: 'None'
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80'
  },
  serviceType: {
    type: String,
    enum: ['Taxi', 'Bus', 'Train', 'Intercity', 'Rental'],
    default: 'Taxi'
  },
  acType: {
    type: String,
    enum: ['AC', 'Non-AC'],
    default: 'AC'
  },
  seatingCapacity: {
    type: Number,
    default: 4
  },
  dailyRate: {
    type: Number,
    default: 0.0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transport', TransportSchema);
