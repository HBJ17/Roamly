const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { z } = require('../validators/common');
const ctrl = require('../controllers/adminController');

const router = express.Router();

const tiers = z.array(z.object({
  daysBefore: z.coerce.number().int().min(0).max(365),
  refundPercent: z.coerce.number().min(0).max(100)
})).min(1).max(6);

const couponFields = {
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, 'Codes are 3-20 letters or digits'),
  description: z.string().max(200).default(''),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.coerce.number().min(1),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscountAmount: z.coerce.number().min(0).default(10000),
  applicableTo: z.enum(['all', 'package', 'hotel', 'transport', 'trip']).default('all'),
  destinations: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date(),
  usageLimit: z.coerce.number().int().min(1).default(100),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true)
};
const couponSchema = z.object(couponFields).refine(
  (c) => c.discountType !== 'percent' || c.discountValue <= 90,
  { message: 'Percentage discounts cannot exceed 90%', path: ['discountValue'] }
);

router.use(protect, authorize('admin'));

router.get('/dashboard', ctrl.getDashboard);

router.get('/agencies', ctrl.getAgencies);
router.put('/agencies/:id', validate(z.object({
  status: z.enum(['Active', 'Pending', 'Suspended']).optional(),
  rejectionReason: z.string().max(300).optional(),
  commissionPercent: z.coerce.number().min(0).max(50).optional()
})), ctrl.updateAgency);

router.get('/users', ctrl.getUsers);
router.put('/users/:id', validate(z.object({ status: z.enum(['Active', 'Suspended']) })), ctrl.updateUser);
router.post('/users/:id/wallet', validate(z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.coerce.number().min(1).max(100000),
  reason: z.string().trim().min(3).max(200)
})), ctrl.adjustWallet);

router.get('/listings', ctrl.getListings);
router.put('/listings/:type/:id', validate(z.object({ isActive: z.boolean(), reason: z.string().max(300).optional() })), ctrl.setListingActive);

router.get('/bookings', ctrl.getBookings);

router.get('/coupons', ctrl.getCoupons);
router.post('/coupons', validate(couponSchema), ctrl.createCoupon);
router.put('/coupons/:id', validate(z.object(couponFields).partial()), ctrl.updateCoupon);
router.delete('/coupons/:id', ctrl.deleteCoupon);

router.get('/payouts', ctrl.getPayouts);
router.put('/payouts/:id', validate(z.object({
  status: z.enum(['Paid', 'Rejected']),
  transferReference: z.string().max(60).optional(),
  adminNote: z.string().max(300).optional()
}).refine((p) => p.status !== 'Paid' || p.transferReference, { message: 'Enter the bank transfer reference', path: ['transferReference'] })), ctrl.processPayout);

router.get('/reviews', ctrl.getReviews);
router.put('/reviews/:id', validate(z.object({ status: z.enum(['Published', 'Hidden']), note: z.string().max(300).optional() })), ctrl.moderateReview);

router.get('/settings', ctrl.getSettings);
router.put('/settings', validate(z.object({
  commissionPercent: z.coerce.number().min(0).max(50),
  gstPercent: z.coerce.number().min(0).max(28),
  loyaltyPointsPer100: z.coerce.number().min(0).max(50),
  maxLoyaltyRedeemPercent: z.coerce.number().min(0).max(100),
  minPayoutAmount: z.coerce.number().min(0),
  cancellationTiers: z.object({ Flexible: tiers, Moderate: tiers, Strict: tiers }).partial()
}).partial()), ctrl.updateSettings);

router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
