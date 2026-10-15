const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getWallet } = require('../controllers/paymentsController');

const router = express.Router();

router.get('/', protect, authorize('user'), getWallet);

module.exports = router;
