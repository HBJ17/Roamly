const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize, optionalAuth, requireActiveAgency } = require('../middleware/auth');
const ctrl = require('../controllers/packagesController');
const schemas = require('../validators/package');

const router = express.Router();
const manage = [protect, authorize('admin', 'agency'), requireActiveAgency];

router.get('/', validate(schemas.packageQuerySchema, 'query'), ctrl.getPackages);
router.get('/mine', protect, authorize('agency'), ctrl.getMyPackages);
router.get('/:id', optionalAuth, ctrl.getPackage);
router.post('/', ...manage, validate(schemas.createPackageSchema), ctrl.createPackage);
router.put('/:id', ...manage, validate(schemas.updatePackageSchema), ctrl.updatePackage);
router.delete('/:id', ...manage, ctrl.deletePackage);

module.exports = router;
