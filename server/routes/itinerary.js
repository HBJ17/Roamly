const express = require('express');
const router = express.Router();
const { getMyItineraries, getItinerary, createItinerary, updateItinerary, deleteItinerary } = require('../controllers/itineraryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMyItineraries)
  .post(createItinerary);

router.route('/:id')
  .get(getItinerary)
  .put(updateItinerary)
  .delete(deleteItinerary);

module.exports = router;
