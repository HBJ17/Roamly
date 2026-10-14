const Agency = require('../models/Agency');
const ApiError = require('../utils/ApiError');
const { AGENCY_CAPABILITIES } = require('../config/constants');
const { requireDestination } = require('./destinationService');

/**
 * Works out who owns a new listing and which city it belongs to.
 * - Agencies can only list the kind of inventory their type allows, and city-bound
 *   agencies can only list in their own home city (a Chennai hotel partner cannot add a Madurai hotel).
 * - Admins must name both the owning agency and the destination.
 */
const resolveListingOwner = async (req, capability, destinationRef) => {
  if (req.userRole === 'agency') {
    const allowed = AGENCY_CAPABILITIES[req.user.agencyType] || [];
    if (!allowed.includes(capability)) {
      throw ApiError.forbidden(`${req.user.agencyType}s cannot list ${capability.replace('-', ' ')} inventory`);
    }
    if (capability === 'intercity-transport') {
      return { agency: req.user, destination: await requireDestination(destinationRef) };
    }
    const destination = await requireDestination(req.user.city, 'Your home city');
    if (destinationRef) {
      const requested = await requireDestination(destinationRef);
      if (String(requested._id) !== String(destination._id)) {
        throw ApiError.forbidden(`Your agency operates in ${destination.name}, so you can only list inventory there`);
      }
    }
    return { agency: req.user, destination };
  }

  if (!req.body.agency) throw ApiError.badRequest('Choose the partner agency that owns this listing');
  const agency = await Agency.findById(req.body.agency);
  if (!agency) throw ApiError.badRequest('Partner agency not found');
  const allowed = AGENCY_CAPABILITIES[agency.agencyType] || [];
  if (!allowed.includes(capability)) {
    throw ApiError.badRequest(`${agency.name} is a ${agency.agencyType} and cannot own this listing`);
  }
  const destination = await requireDestination(destinationRef || agency.city);
  if (agency.city && capability !== 'intercity-transport' && String(agency.city) !== String(destination._id)) {
    throw ApiError.badRequest(`${agency.name} operates in ${agency.cityName}, not ${destination.name}`);
  }
  return { agency, destination };
};

// Throws unless the current account may edit or delete this listing.
const assertCanManage = (req, listing) => {
  if (req.userRole === 'admin') return;
  if (req.userRole === 'agency' && String(listing.agency) === String(req.user._id)) return;
  throw ApiError.forbidden('You can only manage your own listings');
};

module.exports = { resolveListingOwner, assertCanManage };
