const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/bookingsController');
const schemas = require('../validators/booking');

const router = express.Router();

router.use(protect);

router.post('/quote', authorize('user'), validate(schemas.bookingRequestSchema), ctrl.quote);
router.post('/', authorize('user'), validate(schemas.bookingRequestSchema), ctrl.createBooking);
router.get('/my', authorize('user'), ctrl.getMyBookings);
router.get('/:id', ctrl.getBooking);

module.exports = router;
