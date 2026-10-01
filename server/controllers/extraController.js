const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const SavedItem = require('../models/SavedItem');

// REVIEWS
exports.createReview = async (req, res) => {
  try {
    const { itemType, itemId, rating, ratings, title, comment, travelType } = req.body;
    let itemModel = 'Package';
    if (itemType === 'hotel') itemModel = 'Hotel';
    if (itemType === 'transport') itemModel = 'Transport';

    const review = await Review.create({
      user: req.user._id,
      itemType,
      itemId,
      itemModel,
      rating,
      ratings: ratings || { cleanliness: 5, service: 5, location: 5, value: 5 },
      title,
      comment,
      travelType: travelType || 'Solo'
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReviewsForItem = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const reviews = await Review.find({ itemType, itemId }).populate('user', 'username fullName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// COUPONS
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid promo code' });

    if (new Date(coupon.validUntil) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    if (Number(amount) < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum booking amount of ₹${coupon.minOrderAmount} required` });
    }

    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = Math.round((Number(amount) * coupon.discountValue) / 100);
      if (discount > coupon.maxDiscountAmount) discount = coupon.maxDiscountAmount;
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({ success: true, coupon, discount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// NOTIFICATIONS
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SAVED ITEMS / WISHLIST
exports.getWishlist = async (req, res) => {
  try {
    const items = await SavedItem.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    const existing = await SavedItem.findOne({ user: req.user._id, itemType, itemId });
    if (existing) {
      await SavedItem.findByIdAndDelete(existing._id);
      return res.status(200).json({ success: true, action: 'removed' });
    }
    const created = await SavedItem.create({ user: req.user._id, itemType, itemId });
    res.status(201).json({ success: true, action: 'added', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
