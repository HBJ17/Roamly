const mongoose = require('mongoose');

// Immutable ledger of every change to a traveller's wallet balance.
const WalletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number, required: true },
  reason: { type: String, enum: ['welcome', 'topup', 'booking', 'refund', 'adjustment'], required: true },
  description: { type: String, default: '' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
