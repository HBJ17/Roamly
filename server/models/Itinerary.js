const mongoose = require('mongoose');

const ref = (model) => ({ type: mongoose.Schema.Types.ObjectId, ref: model });

const PlanItemSchema = new mongoose.Schema({
  attractionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  category: { type: String, default: '' },
  timeSlot: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], default: 'Morning' },
  durationHours: { type: Number, default: 2 },
  entryFee: { type: Number, default: 0 }
}, { _id: false });

/**
 * A traveller's own trip plan. Everything inside it is scoped to one destination:
 * the stay and local cab must be in that city, attractions come from that city,
 * and intercity legs must connect the origin and the destination.
 */
const ItinerarySchema = new mongoose.Schema({
  user: { ...ref('User'), required: true, index: true },
  title: { type: String, required: true, trim: true },
  origin: ref('Destination'),
  originName: { type: String, default: '' },
  destination: { ...ref('Destination'), required: true },
  destinationName: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  nights: { type: Number, default: 1, min: 0 },
  travelers: {
    adults: { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 }
  },
  outbound: { transport: ref('Transport'), date: String },
  inbound: { transport: ref('Transport'), date: String },
  stay: {
    hotel: ref('Hotel'),
    roomId: { type: mongoose.Schema.Types.ObjectId },
    roomName: { type: String, default: '' },
    rooms: { type: Number, default: 1, min: 1 }
  },
  localCab: {
    transport: ref('Transport'),
    startDate: String,
    days: { type: Number, default: 0, min: 0 },
    vehicles: { type: Number, default: 1, min: 1 }
  },
  days: [{
    dayNumber: { type: Number, required: true },
    date: { type: String, required: true },
    items: [PlanItemSchema],
    notes: { type: String, default: '' }
  }],
  estimate: {
    transport: { type: Number, default: 0 },
    stay: { type: Number, default: 0 },
    localCab: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    bookable: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Booked'], default: 'Draft' },
  booking: ref('Booking'),
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ItinerarySchema.pre('save', function touch(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);
