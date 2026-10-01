const Transport = require('../models/Transport');
const Review = require('../models/Review');

// @desc    Get transports with filtering
// @route   GET /api/transports
// @access  Public
exports.getTransports = async (req, res) => {
  try {
    const { source, destination, mode, service_type, ac_type, min_price, max_price, sort_by } = req.query;
    let query = {};

    if (source) {
      query.sourceCity = { $regex: source, $options: 'i' };
    }
    if (destination) {
      query.destinationCity = { $regex: destination, $options: 'i' };
    }
    if (mode && mode !== 'all') {
      if (mode === 'cabs') query.transportType = 'Taxi';
      else if (mode === 'intercity') query.serviceType = 'Intercity';
      else query.transportType = { $regex: mode, $options: 'i' };
    }
    if (service_type && service_type !== 'all') {
      query.serviceType = service_type;
    }
    if (ac_type && ac_type !== 'all') {
      query.acType = ac_type;
    }
    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = Number(min_price);
      if (max_price) query.price.$lte = Number(max_price);
    }

    let sortObj = { price: 1 };
    if (sort_by === 'price_desc') sortObj = { price: -1 };
    else if (sort_by === 'duration_asc') sortObj = { durationHours: 1 };

    const transports = await Transport.find(query).populate('agency', 'name email phone').sort(sortObj);
    res.status(200).json({ success: true, count: transports.length, data: transports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single transport
// @route   GET /api/transports/:id
// @access  Public
exports.getTransport = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id).populate('agency', 'name email phone address');
    if (!transport) return res.status(404).json({ success: false, message: 'Transport not found' });

    const reviews = await Review.find({ itemType: 'transport', itemId: transport._id }).populate('user', 'username fullName');
    res.status(200).json({ success: true, data: transport, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create transport
// @route   POST /api/transports
// @access  Private (Agency/Admin)
exports.createTransport = async (req, res) => {
  try {
    if (req.userRole === 'agency') req.body.agency = req.user._id;
    const transport = await Transport.create(req.body);
    res.status(201).json({ success: true, data: transport });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update transport
// @route   PUT /api/transports/:id
// @access  Private (Agency/Admin)
exports.updateTransport = async (req, res) => {
  try {
    let transport = await Transport.findById(req.params.id);
    if (!transport) return res.status(404).json({ success: false, message: 'Transport not found' });

    if (req.userRole === 'agency' && transport.agency && transport.agency.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this transport' });
    }

    transport = await Transport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: transport });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete transport
// @route   DELETE /api/transports/:id
// @access  Private (Agency/Admin)
exports.deleteTransport = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id);
    if (!transport) return res.status(404).json({ success: false, message: 'Transport not found' });

    if (req.userRole === 'agency' && transport.agency && transport.agency.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this transport' });
    }

    await Transport.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Transport removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
