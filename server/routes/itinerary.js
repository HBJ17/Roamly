const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/itineraryController');
const schemas = require('../validators/itinerary');

const router = express.Router();

// Browsing planner options is public so travellers can explore before signing up.
router.get('/options', validate(schemas.optionsQuerySchema, 'query'), ctrl.getOptions);

router.use(protect, authorize('user'));

router.route('/')
  .get(ctrl.getMyItineraries)
  .post(validate(schemas.createItinerarySchema), ctrl.createItinerary);

router.route('/:id')
  .get(ctrl.getItinerary)
  .put(validate(schemas.updateItinerarySchema), ctrl.updateItinerary)
  .delete(ctrl.deleteItinerary);

router.post('/:id/quote', validate(schemas.bookItinerarySchema), ctrl.quoteItinerary);
router.post('/:id/book', validate(schemas.bookItinerarySchema), ctrl.bookItinerary);

module.exports = router;
