const Agency = require('../models/Agency');
const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Booking = require('../models/Booking');
const Message = require('../models/Message');

// @desc    Get agency dashboard stats & inventory
// @route   GET /api/agency/dashboard
// @access  Private (Agency)
exports.getAgencyDashboard = async (req, res) => {
  try {
    const agencyId = req.user._id;
    const agency = await Agency.findById(agencyId);

    const packages = await Package.find({ agency: agencyId });
    const hotels = await Hotel.find({ agency: agencyId });
    const transports = await Transport.find({ agency: agencyId });

    const packageIds = packages.map(p => p._id);
    const hotelIds = hotels.map(h => h._id);
    const transportIds = transports.map(t => t._id);

    // Find bookings related to this agency's items
    const bookings = await Booking.find({
      $or: [
        { package: { $in: packageIds } },
        { hotel: { $in: hotelIds } },
        { transport: { $in: transportIds } }
      ]
    }).populate('user', 'username email fullName phone').sort({ createdAt: -1 });

    const totalRevenue = bookings.reduce((sum, b) => (b.paymentStatus === 'Paid' ? sum + b.totalPrice : sum), 0);

    res.status(200).json({
      success: true,
      agency,
      stats: {
        packageCount: packages.length,
        hotelCount: hotels.length,
        transportCount: transports.length,
        bookingCount: bookings.length,
        totalRevenue
      },
      packages,
      hotels,
      transports,
      recentBookings: bookings.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get agency bookings
// @route   GET /api/agency/bookings
// @access  Private (Agency)
exports.getAgencyBookings = async (req, res) => {
  try {
    const agencyId = req.user._id;
    const packages = await Package.find({ agency: agencyId }).select('_id');
    const hotels = await Hotel.find({ agency: agencyId }).select('_id');
    const transports = await Transport.find({ agency: agencyId }).select('_id');

    const bookings = await Booking.find({
      $or: [
        { package: { $in: packages.map(p => p._id) } },
        { hotel: { $in: hotels.map(h => h._id) } },
        { transport: { $in: transports.map(t => t._id) } }
      ]
    })
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

// @desc    Request wallet payout
// @route   POST /api/agency/payout
// @access  Private (Agency)
exports.requestPayout = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const agency = await Agency.findById(req.user._id);

    if (agency.wallet.balance < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    agency.wallet.balance -= Number(amount);
    agency.wallet.pendingPayouts += Number(amount);
    await agency.save();

    res.status(200).json({
      success: true,
      message: `Payout request of ₹${amount} submitted successfully`,
      wallet: agency.wallet
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
