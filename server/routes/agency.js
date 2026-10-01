const express = require('express');
const router = express.Router();
const { getAgencyDashboard, getAgencyBookings, requestPayout } = require('../controllers/agencyController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('agency', 'admin'), getAgencyDashboard);
router.get('/bookings', protect, authorize('agency', 'admin'), getAgencyBookings);
router.post('/payout', protect, authorize('agency'), requestPayout);

module.exports = router;
