const mongoose = require('mongoose');

const ItinerarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  daysCount: {
    type: Number,
    default: 1
  },
  budget: {
    type: Number,
    default: 0
  },
  totalEstimatedCost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Completed'],
    default: 'Draft'
  },
  days: [{
    dayNumber: { type: Number, required: true },
    title: { type: String, default: '' },
    activities: [{
      time: { type: String },
      title: { type: String, required: true },
      activityType: { type: String, enum: ['Sightseeing', 'Hotel', 'Transport', 'Meal', 'Activity', 'Custom'], default: 'Sightseeing' },
      cost: { type: Number, default: 0 },
      location: { type: String, default: '' },
      notes: { type: String, default: '' },
      itemId: { type: mongoose.Schema.Types.ObjectId }
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);
