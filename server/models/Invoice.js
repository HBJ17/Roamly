const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lines: [{
    description: String,
    quantity: Number,
    units: Number,
    unitPrice: Number,
    amount: Number
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  taxAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  refundedAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Refunded', 'PartiallyRefunded'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
