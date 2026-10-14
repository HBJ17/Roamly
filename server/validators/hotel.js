const { z, objectId } = require('./common');

const room = z.object({
  _id: objectId.optional(),
  name: z.string().trim().min(2).max(60),
  pricePerNight: z.coerce.number().min(100, 'Room price looks too low').max(500000),
  maxGuests: z.coerce.number().int().min(1).max(12).default(2),
  totalRooms: z.coerce.number().int().min(0).max(1000).default(5),
  bedType: z.string().max(40).default('King Bed'),
  acType: z.enum(['AC', 'Non-AC']).default('AC'),
  amenities: z.array(z.string().max(60)).max(20).default([])
});

const fields = {
  agency: objectId.optional(),
  name: z.string().trim().min(3).max(120),
  address: z.string().trim().min(5).max(250),
  starRating: z.coerce.number().min(1).max(5).default(3),
  description: z.string().trim().min(20).max(4000),
  rooms: z.array(room).min(1, 'Add at least one room type').max(20),
  amenities: z.array(z.string().max(60)).max(40).default([]),
  diningOptions: z.array(z.string().max(80)).max(20).default([]),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  gallery: z.array(z.string().url()).max(12).optional(),
  petFriendly: z.coerce.boolean().default(false),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cancellationPolicy: z.enum(['Flexible', 'Moderate', 'Strict']).optional(),
  coordinates: z.object({ lat: z.coerce.number(), lng: z.coerce.number() }).optional(),
  isActive: z.boolean().optional()
};

exports.createHotelSchema = z.object({ ...fields, destination: z.string().optional() });
// Destination and owner are fixed once a hotel exists.
exports.updateHotelSchema = z.object(fields).omit({ agency: true }).partial();

exports.hotelQuerySchema = z.object({
  destination: z.string().optional(),
  q: z.string().max(80).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  stars: z.coerce.number().min(1).max(5).optional(),
  guests: z.coerce.number().int().min(1).max(20).optional(),
  ac: z.enum(['AC', 'Non-AC']).optional(),
  petFriendly: z.enum(['true', 'false']).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rooms: z.coerce.number().int().min(1).max(10).optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'stars']).default('recommended'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional()
});
