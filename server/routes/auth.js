const express = require('express');
const router = express.Router();
const { register, login, registerAgency, getMe, updateDetails, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/agency/register', registerAgency);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.post('/logout', protect, logout);

module.exports = router;
