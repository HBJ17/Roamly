const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize, optionalAuth, requireActiveAgency } = require('../middleware/auth');
const ctrl = require('../controllers/transportsController');
const schemas = require('../validators/transport');

const router = express.Router();
const manage = [protect, authorize('admin', 'agency'), requireActiveAgency];

router.get('/', validate(schemas.transportQuerySchema, 'query'), ctrl.getTransports);
router.get('/routes', ctrl.getRoutes);
router.get('/mine', protect, authorize('agency'), ctrl.getMyTransports);
router.get('/:id', optionalAuth, ctrl.getTransport);
router.post('/', ...manage, validate(schemas.createTransportSchema), ctrl.createTransport);
router.put('/:id', ...manage, validate(schemas.updateTransportSchema), ctrl.updateTransport);
router.delete('/:id', ...manage, ctrl.deleteTransport);

module.exports = router;
