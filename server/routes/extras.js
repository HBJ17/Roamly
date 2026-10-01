const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviewsForItem,
  getCoupons,
  createCoupon,
  validateCoupon,
  getMyNotifications,
  markNotificationRead,
  getWishlist,
  toggleWishlist
} = require('../controllers/extraController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } = require('../config/constants');

// Config / Meta endpoints
router.get('/config', (req, res) => {
  res.status(200).json({
    success: true,
    currencies: SUPPORTED_CURRENCIES,
    languages: SUPPORTED_LANGUAGES
  });
});

// Reviews
router.post('/reviews', protect, createReview);
router.get('/reviews/:itemType/:itemId', getReviewsForItem);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', protect, authorize('admin'), createCoupon);
router.post('/coupons/validate', validateCoupon);

// Notifications
router.get('/notifications', protect, getMyNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

// Wishlist
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/toggle', protect, toggleWishlist);

module.exports = router;
