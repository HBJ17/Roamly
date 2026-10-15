const { z, password, phone } = require('./common');

const username = z.string().trim().toLowerCase().min(3).max(30)
  .regex(/^[a-z0-9_.]+$/, 'Username can only contain letters, numbers, dots and underscores');

exports.registerSchema = z.object({
  username,
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password,
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  phone,
  homeCity: z.string().trim().max(60).optional().default('')
});

exports.loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Enter your password'),
  loginType: z.enum(['user', 'agency', 'admin']).default('user')
});

exports.updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(200).optional(),
  homeCity: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(500).optional(),
  preferences: z.object({
    preferredTravelMode: z.string().max(40).optional(),
    dietaryPreference: z.string().max(40).optional(),
    budgetRange: z.string().max(40).optional(),
    preferredCategories: z.array(z.string().max(40)).max(10).optional(),
    language: z.string().max(5).optional(),
    currency: z.string().max(3).optional()
  }).optional()
}).strict();

exports.changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password
});

exports.registerAgencySchema = z.object({
  username,
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password,
  name: z.string().trim().min(3, 'Enter your business name').max(120),
  agencyType: z.enum(['Hotel Partner', 'Cab Operator', 'Intercity Transit', 'Tour Operator']),
  city: z.string().trim().optional(),
  phone: z.string().trim().min(8, 'Enter a contact number').max(20),
  address: z.string().trim().min(5, 'Enter your business address').max(200),
  gstin: z.string().trim().max(20).optional().default(''),
  description: z.string().trim().max(1000).optional().default('')
});
