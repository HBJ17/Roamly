const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemType: {
    type: String,
    enum: ['package', 'hotel', 'transport'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel'
  },
  itemModel: {
    type: String,
    enum: ['Package', 'Hotel', 'Transport']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  ratings: {
    cleanliness: { type: Number, default: 5 },
    service: { type: Number, default: 5 },
    location: { type: Number, default: 5 },
    value: { type: Number, default: 5 }
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    required: true
  },
  travelType: {
    type: String,
    enum: ['Solo', 'Couple', 'Family', 'Friends', 'Business'],
    default: 'Solo'
  },
  verifiedBooking: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
