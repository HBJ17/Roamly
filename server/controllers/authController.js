const User = require('../models/User');
const Agency = require('../models/Agency');
const Admin = require('../models/Admin');
const { sendTokenResponse } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, address } = req.body;

    // Check existing
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or Email already registered' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName: fullName || username,
      phone: phone || '',
      address: address || '',
      walletBalance: 1000 // Welcome credits
    });

    await AuditLog.create({
      action: 'USER_REGISTERED',
      actorType: 'user',
      actorId: user._id,
      actorName: user.username,
      targetEntity: 'User',
      targetId: user._id.toString()
    });

    sendTokenResponse(user, 'user', 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login (User, Agency, or Admin)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password, loginType } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    let account = null;
    let role = loginType || 'user';

    if (role === 'admin') {
      account = await Admin.findOne({ username }).select('+password');
    } else if (role === 'agency') {
      account = await Agency.findOne({ username }).select('+password');
    } else {
      // Check user first, then fallback search across types
      account = await User.findOne({ username }).select('+password');
      if (!account) {
        account = await Agency.findOne({ username }).select('+password');
        if (account) role = 'agency';
      }
      if (!account) {
        account = await Admin.findOne({ username }).select('+password');
        if (account) role = 'admin';
      }
    }

    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await account.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check status for agencies
    if (role === 'agency' && account.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Agency account is pending approval or suspended.' });
    }

    sendTokenResponse(account, role, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Register Agency
// @route   POST /api/auth/agency/register
// @access  Public
exports.registerAgency = async (req, res) => {
  try {
    const { username, password, name, agencyType, email, phone, address } = req.body;

    const existing = await Agency.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Agency username or email already registered' });
    }

    const agency = await Agency.create({
      username,
      password,
      name,
      agencyType,
      email,
      phone,
      address,
      status: 'Active'
    });

    sendTokenResponse(agency, 'agency', 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
      role: req.userRole
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const { fullName, name, phone, address, bio, preferences } = req.body;
    const fieldsToUpdate = {};
    if (fullName) fieldsToUpdate.fullName = fullName;
    if (name) fieldsToUpdate.name = name;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (preferences) fieldsToUpdate.preferences = preferences;

    let updated;
    if (req.userRole === 'admin') {
      updated = await Admin.findByIdAndUpdate(req.user.id, fieldsToUpdate, { new: true });
    } else if (req.userRole === 'agency') {
      updated = await Agency.findByIdAndUpdate(req.user.id, fieldsToUpdate, { new: true });
    } else {
      updated = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, { new: true });
    }

    res.status(200).json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Logout / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
