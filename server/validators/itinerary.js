const { z, objectId, isoDate } = require('./common');

const travelers = z.object({
  adults: z.coerce.number().int().min(1).max(20).default(1),
  children: z.coerce.number().int().min(0).max(20).default(0)
}).default({ adults: 1, children: 0 });

const leg = z.object({ transport: objectId }).partial().optional();

const plan = {
  title: z.string().trim().min(2).max(100).optional(),
  destination: z.string().min(1, 'Choose a destination'),
  origin: z.string().nullable().optional(),
  startDate: isoDate,
  endDate: isoDate,
  travelers,
  notes: z.string().max(2000).optional(),
  outbound: leg,
  inbound: leg,
  stay: z.object({
    hotel: objectId.optional(),
    roomId: objectId.optional(),
    rooms: z.coerce.number().int().min(1).max(10).optional()
  }).optional(),
  localCab: z.object({
    transport: objectId.optional(),
    startDate: isoDate.optional(),
    days: z.coerce.number().int().min(1).max(15).optional(),
    vehicles: z.coerce.number().int().min(1).max(10).optional()
  }).optional(),
  days: z.array(z.object({
    notes: z.string().max(500).optional(),
    items: z.array(z.object({
      attractionId: objectId,
      name: z.string().optional(),
      timeSlot: z.enum(['Morning', 'Afternoon', 'Evening']).optional()
    })).max(10).default([])
  })).max(15).optional()
};

exports.createItinerarySchema = z.object(plan);
exports.updateItinerarySchema = z.object(plan).partial();

exports.optionsQuerySchema = z.object({
  destination: z.string().min(1),
  origin: z.string().optional(),
  startDate: isoDate,
  endDate: isoDate,
  adults: z.coerce.number().int().min(1).max(20).default(1),
  children: z.coerce.number().int().min(0).max(20).default(0)
});

exports.bookItinerarySchema = z.object({
  couponCode: z.string().trim().max(30).optional(),
  loyaltyPoints: z.coerce.number().int().min(0).optional(),
  contact: z.object({
    name: z.string().trim().max(80),
    email: z.string().trim().email(),
    phone: z.string().trim().max(20)
  }).partial().optional(),
  specialRequests: z.string().trim().max(500).optional()
});
