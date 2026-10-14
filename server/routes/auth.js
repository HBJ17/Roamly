const express = require('express');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const auth = require('../controllers/authController');
const schemas = require('../validators/auth');

const router = express.Router();

router.post('/register', authLimiter, validate(schemas.registerSchema), auth.register);
router.post('/agency/register', authLimiter, validate(schemas.registerAgencySchema), auth.registerAgency);
router.post('/login', authLimiter, validate(schemas.loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.getMe);
router.put('/profile', protect, validate(schemas.updateProfileSchema), auth.updateProfile);
router.put('/password', protect, validate(schemas.changePasswordSchema), auth.changePassword);

module.exports = router;
