const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agency = require('../models/Agency');
const Admin = require('../models/Admin');
const env = require('../config/env');

// Protect routes with JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (decoded.role === 'admin') {
      req.user = await Admin.findById(decoded.id);
      req.userRole = 'admin';
    } else if (decoded.role === 'agency') {
      req.user = await Agency.findById(decoded.id);
      req.userRole = 'agency';
    } else {
      req.user = await User.findById(decoded.id);
      req.userRole = 'user';
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Account no longer exists' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

// Optional auth - populates req.user if token is present
exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id);
        req.userRole = 'admin';
      } else if (decoded.role === 'agency') {
        req.user = await Agency.findById(decoded.id);
        req.userRole = 'agency';
      } else {
        req.user = await User.findById(decoded.id);
        req.userRole = 'user';
      }
    } catch (e) {
      // Ignore invalid optional token
    }
  }
  next();
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.userRole} is not authorized to access this resource`
      });
    }
    next();
  };
};

// Helper: send JWT in response with cookie
exports.sendTokenResponse = (user, role, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role, username: user.username },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE }
  );

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.fullName || user.name || user.username,
        role: role,
        agencyType: user.agencyType || null,
        walletBalance: user.walletBalance || (user.wallet ? user.wallet.balance : 0),
        loyaltyPoints: user.loyaltyPoints || 0
      }
    });
};
