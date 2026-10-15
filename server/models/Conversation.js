const mongoose = require('mongoose');

// A thread between one traveller and one partner, usually about a listing or a booking.
const ConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  subject: { type: String, required: true, trim: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookingReference: { type: String, default: '' },
  related: {
    itemType: { type: String, enum: ['package', 'hotel', 'transport', ''], default: '' },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, default: '' }
  },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadForUser: { type: Number, default: 0 },
  unreadForAgency: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

ConversationSchema.index({ user: 1, agency: 1, booking: 1, 'related.itemId': 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
