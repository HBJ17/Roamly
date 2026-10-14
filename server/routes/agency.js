const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize, requireActiveAgency } = require('../middleware/auth');
const { z } = require('../validators/common');
const ctrl = require('../controllers/agencyController');

const router = express.Router();

router.use(protect, authorize('agency'));

// Pending partners can still see their profile and complete it while they wait for approval.
router.get('/profile', ctrl.getProfile);
router.put('/profile', validate(z.object({
  name: z.string().trim().min(3).max(120).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  gstin: z.string().trim().max(20).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  bankDetails: z.object({
    accountName: z.string().trim().max(120),
    accountNumber: z.string().trim().regex(/^\d{9,18}$/, 'Enter a valid account number'),
    ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code'),
    bankName: z.string().trim().max(80)
  }).partial().optional()
}).strict()), ctrl.updateProfile);

router.use(requireActiveAgency);
router.get('/dashboard', ctrl.getDashboard);
router.get('/bookings', ctrl.getBookings);
router.get('/earnings', ctrl.getEarnings);
router.get('/payouts', ctrl.getPayouts);
router.post('/payouts', validate(z.object({
  amount: z.coerce.number().int().min(1),
  note: z.string().trim().max(300).optional().default('')
})), ctrl.requestPayout);

module.exports = router;
