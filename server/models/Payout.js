const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['Pending', 'Paid', 'Rejected'], default: 'Pending', index: true },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifsc: String,
    bankName: String
  },
  note: { type: String, default: '' },
  adminNote: { type: String, default: '' },
  transferReference: { type: String, default: '' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payout', PayoutSchema);
