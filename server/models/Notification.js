const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientType: { type: String, enum: ['user', 'agency', 'admin'], required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  notificationType: {
    type: String,
    enum: ['booking', 'payment', 'promo', 'system', 'message', 'review', 'payout', 'alert'],
    default: 'system'
  },
  linkUrl: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ recipientType: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
