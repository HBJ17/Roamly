const SavedItem = require('../models/SavedItem');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Package = require('../models/Package');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const MODELS = { hotel: Hotel, transport: Transport, package: Package };

// @route GET /api/saved   -> saved listings grouped by destination
exports.getSaved = asyncHandler(async (req, res) => {
  const saved = await SavedItem.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  const items = await Promise.all(saved.map(async (s) => {
    const doc = await MODELS[s.itemType].findById(s.itemId).lean();
    return doc && doc.isActive ? { savedId: s._id, itemType: s.itemType, savedAt: s.createdAt, item: doc } : null;
  }));
  const data = items.filter(Boolean);
  res.status(200).json({ success: true, count: data.length, data });
});

// @route GET /api/saved/ids   -> lightweight lookup for heart icons
exports.getSavedIds = asyncHandler(async (req, res) => {
  const saved = await SavedItem.find({ user: req.user._id }).select('itemId').lean();
  res.status(200).json({ success: true, data: saved.map((s) => String(s.itemId)) });
});

// @route POST /api/saved/toggle   { itemType, itemId }
exports.toggleSaved = asyncHandler(async (req, res) => {
  const { itemType, itemId } = req.body;
  const exists = await MODELS[itemType].exists({ _id: itemId, isActive: true });
  if (!exists) throw ApiError.notFound('Listing not found');

  const removed = await SavedItem.findOneAndDelete({ user: req.user._id, itemType, itemId });
  if (removed) return res.status(200).json({ success: true, saved: false });
  await SavedItem.create({ user: req.user._id, itemType, itemId });
  return res.status(201).json({ success: true, saved: true });
});
