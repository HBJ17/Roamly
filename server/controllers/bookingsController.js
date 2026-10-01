const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new booking (Package, Hotel, or Transport)
// @route   POST /api/bookings
// @access  Private (User)
exports.createBooking = async (req, res) => {
  try {
    const {
      bookingType,
      itemId,
      travelDate,
      checkOutDate,
      numTravelers = 1,
      roomType = 'Standard',
      pickupLocation = '',
      specialRequests = '',
      couponCode = '',
      paymentMethod = 'Card'
    } = req.body;

    let subtotal = 0;
    let packageId = null;
    let hotelId = null;
    let transportId = null;

    if (bookingType === 'package') {
      const pkg = await Package.findById(itemId);
      if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
      packageId = pkg._id;
      subtotal = pkg.price * Number(numTravelers);
    } else if (bookingType === 'hotel') {
      const hotel = await Hotel.findById(itemId);
      if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
      hotelId = hotel._id;
      
      let nights = 1;
      if (travelDate && checkOutDate) {
        const d1 = new Date(travelDate);
        const d2 = new Date(checkOutDate);
        const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        if (diff > 0) nights = diff;
      }
      subtotal = hotel.pricePerNight * nights * Number(numTravelers);
    } else if (bookingType === 'transport') {
      const trans = await Transport.findById(itemId);
      if (!trans) return res.status(404).json({ success: false, message: 'Transport not found' });
      transportId = trans._id;
      subtotal = trans.price * Number(numTravelers);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid booking type' });
    }

    // Taxes (18% GST standard in current app)
    const taxAmount = Math.round(subtotal * 0.18);
    let discountAmount = 0;
    let appliedCoupon = '';

    // Apply Coupon
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date(coupon.validUntil) >= new Date()) {
        if (subtotal >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percent') {
            discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
            if (discountAmount > coupon.maxDiscountAmount) discountAmount = coupon.maxDiscountAmount;
          } else {
            discountAmount = coupon.discountValue;
          }
          appliedCoupon = coupon.code;
          coupon.timesUsed += 1;
          await coupon.save();
        }
      }
    }

    const totalPrice = Math.max(0, subtotal + taxAmount - discountAmount);

    // Create Booking
    const booking = await Booking.create({
      user: req.user._id,
      bookingType,
      package: packageId,
      hotel: hotelId,
      transport: transportId,
      travelDate,
      checkOutDate,
      numTravelers,
      roomType,
      pickupLocation,
      specialRequests,
      subtotalAmount: subtotal,
      taxAmount,
      discountAmount,
      discountCode: appliedCoupon,
      totalPrice,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      tripStatus: 'Upcoming'
    });

    // Generate Transaction & Payment
    const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      transactionId: txnId,
      paymentMethod,
      amount: totalPrice,
      currency: 'INR',
      status: 'Success'
    });

    // Generate Invoice
    const invoiceNum = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const invoice = await Invoice.create({
      invoiceNumber: invoiceNum,
      booking: booking._id,
      user: req.user._id,
      subtotal,
      taxAmount,
      discount: discountAmount,
      totalAmount: totalPrice,
      status: 'Paid'
    });

    // Award Loyalty Points
    const pointsEarned = Math.floor(totalPrice / 100) * 5;
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { loyaltyPoints: pointsEarned }
    });

    // Create Notification
    await Notification.create({
      user: req.user._id,
      title: 'Booking Confirmed!',
      message: `Your booking #${booking._id.toString().slice(-6)} has been confirmed! +${pointsEarned} loyalty points earned.`,
      notificationType: 'booking',
      linkUrl: `/dashboard/bookings`
    });

    res.status(201).json({
      success: true,
      data: booking,
      payment,
      invoice
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my
// @access  Private (User)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('package')
      .populate('hotel')
      .populate('transport')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'username email fullName phone')
      .populate('package')
      .populate('hotel')
      .populate('transport');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Authorization check
    if (req.userRole === 'user' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const payment = await Payment.findOne({ booking: booking._id });
    const invoice = await Invoice.findOne({ booking: booking._id });

    res.status(200).json({ success: true, data: booking, payment, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (req.userRole === 'user' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = 'Cancelled';
    booking.tripStatus = 'Cancelled';
    booking.paymentStatus = 'Refunded';
    await booking.save();

    await Notification.create({
      user: booking.user,
      title: 'Booking Cancelled',
      message: `Booking #${booking._id.toString().slice(-6)} has been successfully cancelled and refund initiated.`,
      notificationType: 'booking'
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
