const mongoose = require('mongoose');
const Review = require('../models/Review');

const MODELS = { package: 'Package', hotel: 'Hotel', transport: 'Transport' };

// Keeps the listing's average rating and review count in sync with published reviews.
const refreshItemRating = async (itemType, itemId) => {
  const [stats] = await Review.aggregate([
    { $match: { itemType, itemId: new mongoose.Types.ObjectId(String(itemId)), status: 'Published' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const Model = mongoose.model(MODELS[itemType]);
  await Model.updateOne(
    { _id: itemId },
    { rating: stats ? Math.round(stats.avg * 10) / 10 : 0, reviewCount: stats ? stats.count : 0 }
  );
};

module.exports = { refreshItemRating, MODELS };
