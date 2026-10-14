const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Package = require('../models/Package');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { emitTo } = require('../services/realtime');
const { notifyAgency, notifyUser } = require('../services/notificationService');

const LISTINGS = { hotel: Hotel, transport: Transport, package: Package };

const participantFilter = (req) => (req.userRole === 'agency' ? { agency: req.user._id } : { user: req.user._id });

const loadConversation = async (req) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, ...participantFilter(req) })
    .populate('user', 'username fullName')
    .populate('agency', 'name agencyType cityName');
  if (!conversation) throw ApiError.notFound('Conversation not found');
  return conversation;
};

// @route GET /api/conversations
exports.getConversations = asyncHandler(async (req, res) => {
  const data = await Conversation.find(participantFilter(req))
    .populate('user', 'username fullName')
    .populate('agency', 'name agencyType cityName')
    .sort({ lastMessageAt: -1 })
    .limit(100);
  const unreadField = req.userRole === 'agency' ? 'unreadForAgency' : 'unreadForUser';
  const unread = data.reduce((sum, c) => sum + c[unreadField], 0);
  res.status(200).json({ success: true, count: data.length, unread, data });
});

const postMessage = async (req, conversation, body) => {
  const isAgency = req.userRole === 'agency';
  const message = await Message.create({
    conversation: conversation._id,
    senderType: isAgency ? 'agency' : 'user',
    sender: req.user._id,
    senderName: isAgency ? req.user.name : req.user.fullName || req.user.username,
    body
  });

  conversation.lastMessage = body.slice(0, 140);
  conversation.lastMessageAt = message.createdAt;
  if (isAgency) conversation.unreadForUser += 1;
  else conversation.unreadForAgency += 1;
  await conversation.save();

  const userId = conversation.user._id || conversation.user;
  const agencyId = conversation.agency._id || conversation.agency;
  emitTo('user', userId, 'message', { conversationId: conversation._id, message });
  emitTo('agency', agencyId, 'message', { conversationId: conversation._id, message });

  if (isAgency) {
    await notifyUser(userId, { title: `Message from ${req.user.name}`, message: body.slice(0, 120), type: 'message', linkUrl: `/account/messages/${conversation._id}` });
  } else {
    await notifyAgency(agencyId, { title: `Message from ${message.senderName}`, message: body.slice(0, 120), type: 'message', linkUrl: `/agency/messages/${conversation._id}` });
  }
  return message;
};

/**
 * @route POST /api/conversations   (traveller)
 * { bookingId } or { itemType, itemId }, plus subject and message.
 * The partner is always derived from the booking or listing, never chosen freely.
 */
exports.startConversation = asyncHandler(async (req, res) => {
  const { bookingId, itemType, itemId, subject, message } = req.body;
  const filter = { user: req.user._id };
  const data = { user: req.user._id, subject };

  if (bookingId) {
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) throw ApiError.notFound('Booking not found');
    const line = (itemId && booking.items.find((i) => String(i.item) === String(itemId))) || booking.items[0];
    Object.assign(filter, { agency: line.agency, booking: booking._id });
    Object.assign(data, {
      agency: line.agency,
      booking: booking._id,
      bookingReference: booking.reference,
      related: { itemType: line.itemType, itemId: line.item, title: line.title },
      subject: subject || `About booking ${booking.reference}`
    });
  } else if (itemType && itemId) {
    const listing = await LISTINGS[itemType].findById(itemId);
    if (!listing || !listing.isActive) throw ApiError.notFound('Listing not found');
    const title = listing.name || listing.title;
    Object.assign(filter, { agency: listing.agency, 'related.itemId': listing._id, booking: { $exists: false } });
    Object.assign(data, { agency: listing.agency, related: { itemType, itemId: listing._id, title }, subject: subject || `Question about ${title}` });
  } else {
    throw ApiError.badRequest('Start a conversation from a booking or a listing');
  }

  let conversation = await Conversation.findOne(filter);
  if (!conversation) conversation = await Conversation.create(data);
  await postMessage(req, conversation, message);
  res.status(201).json({ success: true, data: conversation });
});

// @route GET /api/conversations/:id/messages  (marks the thread read for the viewer)
exports.getMessages = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req);
  const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 }).limit(500);
  if (req.userRole === 'agency') conversation.unreadForAgency = 0;
  else conversation.unreadForUser = 0;
  await conversation.save();
  res.status(200).json({ success: true, data: { conversation, messages } });
});

// @route POST /api/conversations/:id/messages
exports.sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req);
  const message = await postMessage(req, conversation, req.body.body);
  res.status(201).json({ success: true, data: message });
});
