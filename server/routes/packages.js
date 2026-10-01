const express = require('express');
const router = express.Router();
const { getPackages, getPackage, createPackage, updatePackage, deletePackage } = require('../controllers/packagesController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getPackages)
  .post(protect, authorize('admin', 'agency'), createPackage);

router.route('/:id')
  .get(getPackage)
  .put(protect, authorize('admin', 'agency'), updatePackage)
  .delete(protect, authorize('admin', 'agency'), deletePackage);

module.exports = router;
