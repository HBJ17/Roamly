const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD dates');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const phone = z.string().trim().max(20).regex(/^[+\d\s-]*$/, 'Invalid phone number').optional().default('');

module.exports = { z, objectId, isoDate, password, phone };
