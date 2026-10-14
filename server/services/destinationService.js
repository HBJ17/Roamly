const mongoose = require('mongoose');
const Destination = require('../models/Destination');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');

// Accepts an ObjectId, slug or display name and returns the matching active destination (or null).
const findDestination = async (ref) => {
  if (!ref) return null;
  if (ref instanceof Destination) return ref;
  const value = String(ref).trim();
  if (mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value)) {
    return Destination.findOne({ _id: value, isActive: true });
  }
  return Destination.findOne({ slug: slugify(value), isActive: true });
};

const requireDestination = async (ref, label = 'Destination') => {
  const destination = await findDestination(ref);
  if (!destination) throw ApiError.badRequest(`${label} "${ref}" is not a Roamly destination`);
  return destination;
};

module.exports = { findDestination, requireDestination };
