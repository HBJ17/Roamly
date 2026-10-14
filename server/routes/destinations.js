const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/destinationsController');
const schemas = require('../validators/destination');

const router = express.Router();

router.get('/', ctrl.listDestinations);
router.get('/:ref', ctrl.getDestination);
router.get('/:ref/explore', ctrl.exploreDestination);
router.post('/', protect, authorize('admin'), validate(schemas.createDestinationSchema), ctrl.createDestination);
router.put('/:id', protect, authorize('admin'), validate(schemas.updateDestinationSchema), ctrl.updateDestination);

module.exports = router;
