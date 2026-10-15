const { z, objectId } = require('./common');

const LOCAL_VEHICLES = ['Hatchback', 'Sedan', 'SUV', 'Tempo Traveller', 'Self-Drive Car', 'Bike'];
const INTERCITY_MODES = ['Bus', 'Train', 'Flight'];
const time = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM time');

const common = {
  agency: objectId.optional(),
  title: z.string().trim().min(3).max(120),
  acType: z.enum(['AC', 'Non-AC']).default('AC'),
  features: z.array(z.string().max(80)).max(20).default([]),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  seatingCapacity: z.coerce.number().int().min(1).max(80).default(4),
  cancellationPolicy: z.enum(['Flexible', 'Moderate', 'Strict']).optional(),
  isActive: z.boolean().optional()
};

const local = z.object({
  ...common,
  scope: z.literal('local'),
  vehicleType: z.enum(LOCAL_VEHICLES),
  serviceType: z.enum(['Chauffeur', 'Self-Drive']).default('Chauffeur'),
  coverage: z.string().max(120).default(''),
  dailyRate: z.coerce.number().min(300).max(100000),
  includedKmPerDay: z.coerce.number().int().min(0).max(1000).default(250),
  extraKmRate: z.coerce.number().min(0).max(200).default(14),
  fleetSize: z.coerce.number().int().min(0).max(500).default(3)
});

const intercity = z.object({
  ...common,
  scope: z.literal('intercity'),
  vehicleType: z.enum(INTERCITY_MODES),
  origin: z.string().min(1, 'Choose the departure city'),
  destination: z.string().min(1, 'Choose the arrival city'),
  classType: z.string().max(40).default(''),
  fare: z.coerce.number().min(50).max(100000),
  departureTime: time,
  arrivalTime: time,
  durationHours: z.coerce.number().min(0.25).max(72),
  seatsPerDeparture: z.coerce.number().int().min(1).max(500).default(40),
  operatingDays: z.array(z.number().int().min(0).max(6)).min(1).default([0, 1, 2, 3, 4, 5, 6]),
  mealService: z.string().max(80).default('None')
});

exports.createTransportSchema = z.discriminatedUnion('scope', [local, intercity]);

// Scope, route and owner are fixed once the listing exists.
exports.updateTransportSchema = z.object({
  title: common.title,
  acType: z.enum(['AC', 'Non-AC']),
  features: z.array(z.string().max(80)).max(20),
  imageUrl: common.imageUrl,
  seatingCapacity: z.coerce.number().int().min(1).max(80),
  cancellationPolicy: common.cancellationPolicy,
  isActive: common.isActive,
  vehicleType: z.enum([...LOCAL_VEHICLES, ...INTERCITY_MODES]),
  serviceType: z.enum(['Chauffeur', 'Self-Drive']),
  coverage: z.string().max(120),
  dailyRate: z.coerce.number().min(300).max(100000),
  includedKmPerDay: z.coerce.number().int().min(0).max(1000),
  extraKmRate: z.coerce.number().min(0).max(200),
  fleetSize: z.coerce.number().int().min(0).max(500),
  classType: z.string().max(40),
  fare: z.coerce.number().min(50).max(100000),
  departureTime: time,
  arrivalTime: time,
  durationHours: z.coerce.number().min(0.25).max(72),
  seatsPerDeparture: z.coerce.number().int().min(1).max(500),
  operatingDays: z.array(z.number().int().min(0).max(6)).min(1),
  mealService: z.string().max(80)
}).partial();

exports.transportQuerySchema = z.object({
  scope: z.enum(['local', 'intercity']).default('local'),
  destination: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vehicleType: z.string().optional(),
  serviceType: z.enum(['Chauffeur', 'Self-Drive']).optional(),
  ac: z.enum(['AC', 'Non-AC']).optional(),
  seats: z.coerce.number().int().min(1).max(80).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'departure', 'duration']).default('recommended'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional()
});
