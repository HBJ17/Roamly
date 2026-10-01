const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ['user', 'agency', 'admin'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['user', 'agency', 'admin'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  subject: {
    type: String,
    default: 'General Inquiry'
  },
  message: {
    type: String,
    required: true
  },
  relatedItemType: {
    type: String,
    enum: ['package', 'hotel', 'transport', 'booking', 'none'],
    default: 'none'
  },
  relatedItemId: {
    type: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);
