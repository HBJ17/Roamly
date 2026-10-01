const Admin = require('../models/Admin');
const Agency = require('../models/Agency');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const AuditLog = require('../models/AuditLog');
const Coupon = require('../models/Coupon');

// @desc    Get central admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const agencyCount = await Agency.countDocuments();
    const packageCount = await Package.countDocuments();
    const bookingCount = await Booking.countDocuments();

    const bookings = await Booking.find().sort({ createdAt: -1 });
    const totalPlatformGMV = bookings.reduce((sum, b) => (b.paymentStatus === 'Paid' ? sum + b.totalPrice : sum), 0);
    const platformCommission = Math.round(totalPlatformGMV * 0.10); // 10%

    const recentBookings = await Booking.find()
      .populate('user', 'username email fullName')
      .populate('package', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    const agencies = await Agency.find().sort({ createdAt: -1 }).limit(10);
    const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(15);

    res.status(200).json({
      success: true,
      stats: {
        userCount,
        agencyCount,
        packageCount,
        bookingCount,
        totalPlatformGMV,
        platformCommission
      },
      recentBookings,
      agencies,
      auditLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all agencies with status
// @route   GET /api/admin/agencies
// @access  Private (Admin)
exports.getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: agencies.length, data: agencies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update agency status (Active / Suspended)
// @route   PUT /api/admin/agencies/:id/status
// @access  Private (Admin)
exports.updateAgencyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const agency = await Agency.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });

    await AuditLog.create({
      action: `AGENCY_STATUS_UPDATED_${status.toUpperCase()}`,
      actorType: 'admin',
      actorId: req.user._id,
      actorName: req.user.username,
      targetEntity: 'Agency',
      targetId: agency._id.toString(),
      details: { newStatus: status }
    });

    res.status(200).json({ success: true, data: agency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get global bookings ledger
// @route   GET /api/admin/bookings
// @access  Private (Admin)
exports.getGlobalBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email fullName phone')
      .populate('package')
      .populate('hotel')
      .populate('transport')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
