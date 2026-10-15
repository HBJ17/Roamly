const { z, objectId } = require('./common');

const CATEGORIES = ['Hill Station', 'Beach', 'Heritage', 'Wildlife', 'Pilgrimage', 'Adventure', 'Cultural'];
const list = (max = 20) => z.array(z.string().trim().min(1).max(200)).max(max);

const fields = {
  agency: objectId.optional(),
  hotel: objectId.nullable().optional(),
  title: z.string().trim().min(5).max(140),
  category: z.enum(CATEGORIES),
  price: z.coerce.number().min(500, 'Package price looks too low').max(1000000),
  durationDays: z.coerce.number().int().min(1).max(30),
  durationNights: z.coerce.number().int().min(0).max(30),
  description: z.string().trim().min(30).max(5000),
  highlights: list().default([]),
  inclusions: list().default([]),
  exclusions: list().default([]),
  foodHighlights: list().default([]),
  dayPlan: z.array(z.object({
    day: z.coerce.number().int().min(1),
    title: z.string().trim().min(2).max(120),
    description: z.string().max(1000).default(''),
    attractions: z.array(z.string().max(120)).max(10).default([])
  })).max(30).default([]),
  pros: list(10).default([]),
  cons: list(10).default([]),
  idealFor: z.string().max(120).optional(),
  minTravelers: z.coerce.number().int().min(1).max(50).default(1),
  maxGroupSize: z.coerce.number().int().min(1).max(200).default(20),
  cancellationPolicy: z.enum(['Flexible', 'Moderate', 'Strict']).optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  gallery: z.array(z.string().url()).max(12).optional(),
  isActive: z.boolean().optional()
};

exports.createPackageSchema = z.object({ ...fields, destination: z.string().optional() });
exports.updatePackageSchema = z.object(fields).omit({ agency: true }).partial();

exports.packageQuerySchema = z.object({
  destination: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
  q: z.string().max(80).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minDays: z.coerce.number().int().min(1).optional(),
  maxDays: z.coerce.number().int().min(1).optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'duration', 'newest']).default('recommended'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional()
});
