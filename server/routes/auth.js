const express = require('express');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const auth = require('../controllers/authController');
const schemas = require('../validators/auth');
const recovery = require('../controllers/accountRecoveryController');
const { z, password } = require('../validators/common');

const loginType = z.enum(['user', 'agency', 'admin']).default('user');

const router = express.Router();

router.post('/register', authLimiter, validate(schemas.registerSchema), auth.register);
router.post('/agency/register', authLimiter, validate(schemas.registerAgencySchema), auth.registerAgency);
router.post('/login', authLimiter, validate(schemas.loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.getMe);
router.put('/profile', protect, validate(schemas.updateProfileSchema), auth.updateProfile);
router.put('/password', protect, validate(schemas.changePasswordSchema), auth.changePassword);

router.post('/forgot-password', authLimiter, validate(z.object({ email: z.string().trim().toLowerCase().email(), loginType })), recovery.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(z.object({ password, loginType })), recovery.resetPassword);
router.post('/verify-email/send', protect, recovery.resendVerification);
router.post('/verify-email/:token', recovery.verifyEmail);

module.exports = router;
