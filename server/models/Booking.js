const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['package', 'hotel', 'transport', 'custom_itinerary'],
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  },
  transport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transport'
  },
  travelDate: {
    type: String,
    required: true
  },
  checkOutDate: {
    type: String
  },
  numTravelers: {
    type: Number,
    default: 1
  },
  roomType: {
    type: String,
    default: 'Standard'
  },
  pickupLocation: {
    type: String,
    default: ''
  },
  specialRequests: {
    type: String,
    default: ''
  },
  subtotalAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountCode: {
    type: String,
    default: ''
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
    default: 'Confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Refunded', 'Failed'],
    default: 'Paid'
  },
  tripStatus: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
