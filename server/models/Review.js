const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Only travellers with a completed booking for the item can review it.
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  itemType: { type: String, enum: ['package', 'hotel', 'transport'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemModel' },
  itemModel: { type: String, enum: ['Package', 'Hotel', 'Transport'], required: true },
  itemTitle: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  ratings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  },
  title: { type: String, required: true, trim: true },
  comment: { type: String, required: true },
  travelType: { type: String, enum: ['Solo', 'Couple', 'Family', 'Friends', 'Business'], default: 'Solo' },
  agencyReply: {
    message: { type: String, default: '' },
    repliedAt: { type: Date }
  },
  helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  helpfulCount: { type: Number, default: 0 },
  status: { type: String, enum: ['Published', 'Hidden'], default: 'Published' },
  moderationNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

ReviewSchema.index({ user: 1, booking: 1, itemId: 1 }, { unique: true });
ReviewSchema.index({ itemType: 1, itemId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);
