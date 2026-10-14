const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const router = express.Router();
const mine = (req) => ({ recipientType: req.userRole, recipient: req.user._id });

router.use(protect);

// @route GET /api/notifications?unread=true
router.get('/', asyncHandler(async (req, res) => {
  const filter = mine(req);
  if (req.query.unread === 'true') filter.isRead = false;
  const [data, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ ...mine(req), isRead: false })
  ]);
  res.status(200).json({ success: true, count: data.length, unread, data });
}));

router.put('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ ...mine(req), isRead: false }, { isRead: true });
  res.status(200).json({ success: true });
}));

router.put('/:id/read', asyncHandler(async (req, res) => {
  const doc = await Notification.findOneAndUpdate({ _id: req.params.id, ...mine(req) }, { isRead: true }, { new: true });
  if (!doc) throw ApiError.notFound('Notification not found');
  res.status(200).json({ success: true, data: doc });
}));

module.exports = router;
