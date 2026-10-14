const User = require('../models/User');
const Agency = require('../models/Agency');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { CITY_BOUND_AGENCY_TYPES } = require('../config/constants');
const { requireDestination } = require('../services/destinationService');
const { sendTokenResponse, serializeAccount, clearTokenCookie } = require('../middleware/auth');

const MODELS = { user: User, agency: Agency, admin: Admin };
const WELCOME_CREDIT = 1000;

const findAccount = (Model, identifier) =>
  Model.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+password');

// @route POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  const exists = await User.exists({ $or: [{ email }, { username }] });
  if (exists) throw ApiError.conflict('That username or email is already registered');

  const user = await User.create({ ...req.body, walletBalance: WELCOME_CREDIT });

  await AuditLog.create({
    action: 'USER_REGISTERED',
    actorType: 'user',
    actorId: user._id,
    actorName: user.username,
    targetEntity: 'User',
    targetId: user._id.toString(),
    ipAddress: req.ip
  });

  sendTokenResponse(user, 'user', 201, res);
});

// @route POST /api/auth/agency/register
// New partners start as Pending and can sign in, but cannot list inventory until approved.
exports.registerAgency = asyncHandler(async (req, res) => {
  const { username, email, agencyType } = req.body;
  const exists = await Agency.exists({ $or: [{ email }, { username }] });
  if (exists) throw ApiError.conflict('That username or email is already registered');

  const data = { ...req.body, status: 'Pending' };
  if (CITY_BOUND_AGENCY_TYPES.includes(agencyType)) {
    if (!req.body.city) throw ApiError.badRequest(`${agencyType}s must choose the city they operate in`);
    const city = await requireDestination(req.body.city, 'City');
    data.city = city._id;
    data.cityName = city.name;
  } else {
    delete data.city;
  }

  const agency = await Agency.create(data);
  await AuditLog.create({
    action: 'AGENCY_REGISTERED',
    actorType: 'agency',
    actorId: agency._id,
    actorName: agency.username,
    targetEntity: 'Agency',
    targetId: agency._id.toString(),
    details: { agencyType, city: data.cityName || null },
    ipAddress: req.ip
  });

  sendTokenResponse(agency, 'agency', 201, res);
});

// @route POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { username, password, loginType } = req.body;
  const account = await findAccount(MODELS[loginType], username);

  if (!account || !(await account.matchPassword(password))) {
    throw ApiError.unauthorized('Invalid username or password');
  }
  if (account.status === 'Suspended') {
    throw ApiError.forbidden('This account has been suspended. Contact support@roamly.travel.');
  }

  // Transparently upgrade legacy Flask hashes to bcrypt on successful login.
  if (account.needsRehash()) {
    account.password = password;
  }
  if (loginType === 'user') account.lastLoginAt = new Date();
  await account.save({ validateBeforeSave: false });

  sendTokenResponse(account, loginType, 200, res);
});

// @route GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: serializeAccount(req.user, req.userRole) });
});

// @route PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.userRole !== 'agency') delete updates.name;
  if (req.userRole === 'agency') {
    delete updates.fullName;
    delete updates.preferences;
    delete updates.homeCity;
  }
  if (updates.preferences) {
    for (const [key, value] of Object.entries(updates.preferences)) {
      updates[`preferences.${key}`] = value;
    }
    delete updates.preferences;
  }

  const Model = MODELS[req.userRole];
  const updated = await Model.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.status(200).json({ success: true, user: serializeAccount(updated, req.userRole) });
});

// @route PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const Model = MODELS[req.userRole];
  const account = await Model.findById(req.user._id).select('+password');
  if (!(await account.matchPassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Your current password is incorrect');
  }
  account.password = req.body.newPassword;
  await account.save();
  sendTokenResponse(account, req.userRole, 200, res);
});

// @route POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: 'Signed out' });
});
