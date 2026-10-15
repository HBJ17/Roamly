const crypto = require('crypto');
const User = require('../models/User');
const Agency = require('../models/Agency');
const Admin = require('../models/Admin');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendMail } = require('../services/emailService');
const { sendTokenResponse } = require('../middleware/auth');

const MODELS = { user: User, agency: Agency, admin: Admin };
const RESET_MINUTES = 30;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const newToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hashed: hashToken(raw) };
};

// @route POST /api/auth/forgot-password   { email, loginType }
// Always responds the same way so it cannot be used to discover registered emails.
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email, loginType } = req.body;
  const account = await MODELS[loginType].findOne({ email });
  if (account) {
    const { raw, hashed } = newToken();
    account.resetPasswordToken = hashed;
    account.resetPasswordExpire = new Date(Date.now() + RESET_MINUTES * 60000);
    await account.save({ validateBeforeSave: false });
    await sendMail({
      to: account.email,
      subject: 'Reset your Roamly password',
      title: 'Reset your password',
      html: `<p>We received a request to reset your password. This link works for ${RESET_MINUTES} minutes.</p><p>If you did not ask for this, you can ignore this email.</p>`,
      cta: { label: 'Choose a new password', url: `${env.PUBLIC_APP_URL}/reset-password/${raw}?type=${loginType}` }
    });
  }
  res.status(200).json({ success: true, message: 'If that email is registered, a reset link is on its way.' });
});

// @route POST /api/auth/reset-password/:token   { password, loginType }
exports.resetPassword = asyncHandler(async (req, res) => {
  const Model = MODELS[req.body.loginType];
  const account = await Model.findOne({
    resetPasswordToken: hashToken(req.params.token),
    resetPasswordExpire: { $gt: new Date() }
  }).select('+password +resetPasswordToken +resetPasswordExpire');
  if (!account) throw ApiError.badRequest('This reset link is invalid or has expired');

  account.password = req.body.password;
  account.resetPasswordToken = undefined;
  account.resetPasswordExpire = undefined;
  await account.save();
  sendTokenResponse(account, req.body.loginType, 200, res);
});

const sendVerification = async (user) => {
  const { raw, hashed } = newToken();
  user.verifyEmailToken = hashed;
  await user.save({ validateBeforeSave: false });
  await sendMail({
    to: user.email,
    subject: 'Confirm your email for Roamly',
    title: `Welcome aboard, ${user.fullName || user.username}!`,
    html: '<p>Confirm your email address so we can send booking confirmations and vouchers.</p>',
    cta: { label: 'Confirm email', url: `${env.PUBLIC_APP_URL}/verify-email/${raw}` }
  });
};

// @route POST /api/auth/verify-email/send
exports.resendVerification = asyncHandler(async (req, res) => {
  if (req.user.emailVerified) throw ApiError.badRequest('Your email is already confirmed');
  await sendVerification(req.user);
  res.status(200).json({ success: true, message: 'Verification email sent' });
});

// @route POST /api/auth/verify-email/:token
exports.verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { verifyEmailToken: hashToken(req.params.token) },
    { $set: { emailVerified: true }, $unset: { verifyEmailToken: 1 } },
    { new: true }
  );
  if (!user) throw ApiError.badRequest('This verification link is invalid or was already used');
  res.status(200).json({ success: true, message: 'Email confirmed' });
});

exports.sendVerification = sendVerification;
