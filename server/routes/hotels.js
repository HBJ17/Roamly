const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize, optionalAuth, requireActiveAgency } = require('../middleware/auth');
const ctrl = require('../controllers/hotelsController');
const schemas = require('../validators/hotel');
const { availabilityQuerySchema } = require('../validators/booking');
const { getHotelAvailability } = require('../controllers/bookingsController');

const router = express.Router();
const manage = [protect, authorize('admin', 'agency'), requireActiveAgency];

router.get('/', validate(schemas.hotelQuerySchema, 'query'), ctrl.getHotels);
router.get('/mine', protect, authorize('agency'), ctrl.getMyHotels);
router.get('/:id', optionalAuth, ctrl.getHotel);
router.get('/:id/availability', validate(availabilityQuerySchema, 'query'), getHotelAvailability);
router.post('/', ...manage, validate(schemas.createHotelSchema), ctrl.createHotel);
router.put('/:id', ...manage, validate(schemas.updateHotelSchema), ctrl.updateHotel);
router.delete('/:id', ...manage, ctrl.deleteHotel);

module.exports = router;
