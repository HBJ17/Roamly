const { z, objectId, isoDate } = require('./common');

const travelers = z.object({
  adults: z.coerce.number().int().min(1).max(20).default(1),
  children: z.coerce.number().int().min(0).max(20).default(0)
}).default({ adults: 1, children: 0 });

exports.bookingRequestSchema = z.object({
  itemType: z.enum(['package', 'hotel', 'transport']),
  itemId: objectId,
  roomId: objectId.optional(),
  startDate: isoDate,
  endDate: isoDate.optional(),
  days: z.coerce.number().int().min(1).max(30).optional(),
  rooms: z.coerce.number().int().min(1).max(10).optional(),
  vehicles: z.coerce.number().int().min(1).max(10).optional(),
  travelers,
  pickupLocation: z.string().trim().max(200).optional(),
  couponCode: z.string().trim().max(30).optional(),
  loyaltyPoints: z.coerce.number().int().min(0).max(100000).optional(),
  contact: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    phone: z.string().trim().min(8).max(20)
  }).partial().optional(),
  specialRequests: z.string().trim().max(500).optional()
});

exports.availabilityQuerySchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate
});

exports.cancelSchema = z.object({
  reason: z.string().trim().max(300).optional().default('')
});
