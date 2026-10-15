const { z } = require('./common');
const Destination = require('../models/Destination');

const attraction = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(Destination.ATTRACTION_CATEGORIES).default('Heritage'),
  description: z.string().max(1000).default(''),
  durationHours: z.coerce.number().min(0.5).max(12).default(2),
  entryFee: z.coerce.number().min(0).default(0),
  bestTimeOfDay: z.enum(Destination.TIME_SLOTS).default('Any'),
  imageUrl: z.string().url().or(z.literal('')).default(''),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional()
});

const base = {
  name: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(60),
  tagline: z.string().max(160).default(''),
  description: z.string().min(20).max(4000),
  categories: z.array(z.string().max(40)).max(8).default([]),
  bestTimeToVisit: z.string().max(80).optional(),
  idealDays: z.coerce.number().int().min(1).max(30).optional(),
  climate: z.string().max(120).optional(),
  nearestAirport: z.string().max(120).optional(),
  nearestRailway: z.string().max(120).optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  gallery: z.array(z.string().url()).max(12).optional(),
  coordinates: z.object({ lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180) }),
  attractions: z.array(attraction).max(60).optional(),
  isActive: z.boolean().optional()
};

exports.createDestinationSchema = z.object(base);
exports.updateDestinationSchema = z.object(base).partial();
exports.attractionSchema = attraction;
