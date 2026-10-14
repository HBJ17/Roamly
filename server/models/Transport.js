const mongoose = require('mongoose');

const LOCAL_VEHICLES = ['Hatchback', 'Sedan', 'SUV', 'Tempo Traveller', 'Self-Drive Car', 'Bike'];
const INTERCITY_MODES = ['Bus', 'Train', 'Flight'];

/**
 * Two kinds of transport:
 *  - local:     cabs / rentals that operate inside one destination (destination = that city).
 *  - intercity: scheduled routes from an origin city to a destination city.
 */
const TransportSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  scope: { type: String, enum: ['local', 'intercity'], required: true, index: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
  destinationName: { type: String, required: true },
  origin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    index: true,
    required() { return this.scope === 'intercity'; }
  },
  originName: { type: String, default: '' },
  title: { type: String, required: true, trim: true },
  vehicleType: { type: String, required: true, enum: [...LOCAL_VEHICLES, ...INTERCITY_MODES] },
  acType: { type: String, enum: ['AC', 'Non-AC'], default: 'AC' },
  features: [{ type: String }],
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80'
  },
  seatingCapacity: { type: Number, default: 4, min: 1 },

  // Local cabs
  serviceType: { type: String, enum: ['Chauffeur', 'Self-Drive'], default: 'Chauffeur' },
  coverage: { type: String, default: '' },
  dailyRate: { type: Number, min: 0, required() { return this.scope === 'local'; } },
  includedKmPerDay: { type: Number, default: 250 },
  extraKmRate: { type: Number, default: 14 },
  fleetSize: { type: Number, default: 3, min: 0 },

  // Intercity routes
  classType: { type: String, default: '' },
  fare: { type: Number, min: 0, required() { return this.scope === 'intercity'; } },
  departureTime: { type: String, default: '' },
  arrivalTime: { type: String, default: '' },
  durationHours: { type: Number, default: 0 },
  seatsPerDeparture: { type: Number, default: 40, min: 0 },
  operatingDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
  mealService: { type: String, default: 'None' },

  cancellationPolicy: { type: String, enum: ['Flexible', 'Moderate', 'Strict'], default: 'Moderate' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

TransportSchema.virtual('displayPrice').get(function displayPrice() {
  return this.scope === 'local' ? this.dailyRate : this.fare;
});

TransportSchema.pre('validate', function checkRoute(next) {
  if (this.scope === 'intercity' && this.origin && String(this.origin) === String(this.destination)) {
    return next(new Error('An intercity route needs different origin and destination cities'));
  }
  if (this.scope === 'local' && !LOCAL_VEHICLES.includes(this.vehicleType)) {
    return next(new Error(`Local transport must be one of: ${LOCAL_VEHICLES.join(', ')}`));
  }
  if (this.scope === 'intercity' && !INTERCITY_MODES.includes(this.vehicleType)) {
    return next(new Error(`Intercity transport must be one of: ${INTERCITY_MODES.join(', ')}`));
  }
  return next();
});

TransportSchema.set('toJSON', { virtuals: true });
TransportSchema.set('toObject', { virtuals: true });
TransportSchema.statics.LOCAL_VEHICLES = LOCAL_VEHICLES;
TransportSchema.statics.INTERCITY_MODES = INTERCITY_MODES;

module.exports = mongoose.model('Transport', TransportSchema);
