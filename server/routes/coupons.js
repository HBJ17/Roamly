const express = require('express');
const Coupon = require('../models/Coupon');
const validate = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');
const { z } = require('../validators/common');
const asyncHandler = require('../utils/asyncHandler');
const { evaluateCoupon } = require('../services/couponService');
const { findDestination } = require('../services/destinationService');

const router = express.Router();

// @route GET /api/coupons   active public offers
router.get('/', asyncHandler(async (req, res) => {
  const now = new Date();
  const data = await Coupon.find({ isActive: true, validFrom: { $lte: now }, validUntil: { $gte: now }, $expr: { $lt: ['$timesUsed', '$usageLimit'] } })
    .select('code description discountType discountValue minOrderAmount maxDiscountAmount applicableTo validUntil')
    .sort({ discountValue: -1 })
    .lean();
  res.status(200).json({ success: true, count: data.length, data });
}));

// @route POST /api/coupons/validate   { code, subtotal, bookingType, destination }
router.post('/validate', optionalAuth, validate(z.object({
  code: z.string().trim().min(2).max(30),
  subtotal: z.coerce.number().min(0),
  bookingType: z.enum(['package', 'hotel', 'transport', 'trip']).optional(),
  destination: z.string().optional()
})), asyncHandler(async (req, res) => {
  const destination = req.body.destination ? await findDestination(req.body.destination) : null;
  const { coupon, discount } = await evaluateCoupon({
    code: req.body.code,
    userId: req.user?._id,
    subtotal: req.body.subtotal,
    bookingType: req.body.bookingType,
    destinationId: destination?._id
  });
  res.status(200).json({ success: true, data: { code: coupon.code, description: coupon.description, discount } });
}));

module.exports = router;
