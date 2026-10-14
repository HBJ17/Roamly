const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agency = require('../models/Agency');
const Admin = require('../models/Admin');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const MODELS = { user: User, agency: Agency, admin: Admin };
const COOKIE_NAME = 'roamly_token';

const readToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
};

// Resolves the account behind a token, or null if the token is unusable.
const resolveAccount = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
  const Model = MODELS[decoded.role];
  if (!Model) return null;
  const account = await Model.findById(decoded.id);
  if (!account) return null;
  if (account.changedPasswordAfter && account.changedPasswordAfter(decoded.iat)) return null;
  if (account.status === 'Suspended') return null;
  return { account, role: decoded.role };
};

exports.protect = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) return next(ApiError.unauthorized('Please sign in to continue'));
    const resolved = await resolveAccount(token);
    if (!resolved) return next(ApiError.unauthorized('Your session has expired. Please sign in again.'));
    req.user = resolved.account;
    req.userRole = resolved.role;
    return next();
  } catch (err) {
    return next(err);
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (token) {
      const resolved = await resolveAccount(token);
      if (resolved) {
        req.user = resolved.account;
        req.userRole = resolved.role;
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return next(ApiError.forbidden(`This action is not available for ${req.userRole || 'guest'} accounts`));
  }
  return next();
};

// Agencies must be approved before they can manage listings.
exports.requireActiveAgency = (req, res, next) => {
  if (req.userRole === 'agency' && req.user.status !== 'Active') {
    return next(ApiError.forbidden('Your agency is awaiting approval by the Roamly team'));
  }
  return next();
};

exports.serializeAccount = (account, role) => ({
  id: account._id,
  username: account.username,
  email: account.email,
  name: account.fullName || account.name || account.username,
  role,
  phone: account.phone || '',
  agencyType: account.agencyType || null,
  agencyStatus: role === 'agency' ? account.status : undefined,
  city: account.city || undefined,
  walletBalance: role === 'user' ? account.walletBalance : undefined,
  loyaltyPoints: role === 'user' ? account.loyaltyPoints : undefined,
  emailVerified: role === 'user' ? account.emailVerified : true,
  preferences: account.preferences || undefined,
  homeCity: account.homeCity || undefined,
  bio: account.bio || undefined,
  address: account.address || undefined
});

exports.sendTokenResponse = (account, role, statusCode, res) => {
  const token = jwt.sign({ id: account._id, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE });

  res
    .status(statusCode)
    .cookie(COOKIE_NAME, token, {
      maxAge: env.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProd
    })
    .json({ success: true, user: exports.serializeAccount(account, role) });
};

exports.clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: env.isProd });
};

exports.COOKIE_NAME = COOKIE_NAME;
exports.resolveAccount = resolveAccount;
