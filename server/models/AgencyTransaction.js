const mongoose = require('mongoose');

// Partner earnings ledger: what each confirmed booking line earned, reversals and payouts.
const AgencyTransactionSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  type: { type: String, enum: ['earning', 'reversal', 'payout', 'payout_reversal'], required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookingReference: { type: String, default: '' },
  payout: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
  description: { type: String, default: '' },
  gross: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  // Signed amount applied to the partner's available balance.
  net: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AgencyTransaction', AgencyTransactionSchema);
