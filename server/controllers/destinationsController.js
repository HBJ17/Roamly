const Destination = require('../models/Destination');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Package = require('../models/Package');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { findDestination } = require('../services/destinationService');

const countBy = async (Model, match, field) => {
  const rows = await Model.aggregate([{ $match: match }, { $group: { _id: `$${field}`, n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
};

// @route GET /api/destinations
exports.listDestinations = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.categories = req.query.category;

  const destinations = await Destination.find(filter).select('-attractions.description').sort({ name: 1 }).lean();

  const [hotels, cabs, packages] = await Promise.all([
    countBy(Hotel, { isActive: true }, 'destination'),
    countBy(Transport, { isActive: true, scope: 'local' }, 'destination'),
    countBy(Package, { isActive: true }, 'destination')
  ]);

  const data = destinations.map((d) => ({
    ...d,
    attractionCount: d.attractions.length,
    attractions: undefined,
    stats: {
      hotels: hotels[String(d._id)] || 0,
      cabs: cabs[String(d._id)] || 0,
      packages: packages[String(d._id)] || 0
    }
  }));

  res.status(200).json({ success: true, count: data.length, data });
});

// @route GET /api/destinations/:ref   (id, slug or name)
exports.getDestination = asyncHandler(async (req, res) => {
  const destination = await findDestination(req.params.ref);
  if (!destination) throw ApiError.notFound('Destination not found');
  res.status(200).json({ success: true, data: destination });
});

// @route POST /api/destinations  (admin)
exports.createDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.create(req.body);
  await AuditLog.create({
    action: 'DESTINATION_CREATED',
    actorId: req.user._id,
    actorName: req.user.username,
    targetEntity: 'Destination',
    targetId: destination._id.toString(),
    details: { name: destination.name }
  });
  res.status(201).json({ success: true, data: destination });
});

// @route PUT /api/destinations/:id  (admin)
exports.updateDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) throw ApiError.notFound('Destination not found');
  destination.set(req.body);
  await destination.save();
  await AuditLog.create({
    action: 'DESTINATION_UPDATED',
    actorId: req.user._id,
    actorName: req.user.username,
    targetEntity: 'Destination',
    targetId: destination._id.toString(),
    details: { fields: Object.keys(req.body) }
  });
  res.status(200).json({ success: true, data: destination });
});
