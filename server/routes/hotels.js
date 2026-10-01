const express = require('express');
const router = express.Router();
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotelsController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getHotels)
  .post(protect, authorize('admin', 'agency'), createHotel);

router.route('/:id')
  .get(getHotel)
  .put(protect, authorize('admin', 'agency'), updateHotel)
  .delete(protect, authorize('admin', 'agency'), deleteHotel);

module.exports = router;
