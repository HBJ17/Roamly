const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBooking, cancelBooking } = require('../controllers/bookingsController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
