const express = require('express');
const router = express.Router();
const { getTransports, getTransport, createTransport, updateTransport, deleteTransport } = require('../controllers/transportsController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getTransports)
  .post(protect, authorize('admin', 'agency'), createTransport);

router.route('/:id')
  .get(getTransport)
  .put(protect, authorize('admin', 'agency'), updateTransport)
  .delete(protect, authorize('admin', 'agency'), deleteTransport);

module.exports = router;
