const Package = require('../models/Package');
const Review = require('../models/Review');

// @desc    Get all packages with filtering & sorting
// @route   GET /api/packages
// @access  Public
exports.getPackages = async (req, res) => {
  try {
    const { destination, category, min_price, max_price, duration, sort_by } = req.query;
    let query = {};

    if (destination) {
      query.$or = [
        { destination: { $regex: destination, $options: 'i' } },
        { title: { $regex: destination, $options: 'i' } },
        { description: { $regex: destination, $options: 'i' } }
      ];
    }

    if (category && category !== 'all' && category !== 'All Categories') {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }

    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = Number(min_price);
      if (max_price) query.price.$lte = Number(max_price);
    }

    if (duration) {
      if (duration === '1-3') query.durationDays = { $gte: 1, $lte: 3 };
      else if (duration === '4-7') query.durationDays = { $gte: 4, $lte: 7 };
      else if (duration === '8+') query.durationDays = { $gte: 8 };
    }

    let sortObj = { createdAt: -1 };
    if (sort_by === 'price_asc') sortObj = { price: 1 };
    else if (sort_by === 'price_desc') sortObj = { price: -1 };
    else if (sort_by === 'rating_desc') sortObj = { rating: -1 };
    else if (sort_by === 'duration_desc') sortObj = { durationDays: -1 };

    const packages = await Package.find(query).populate('agency', 'name email phone').sort(sortObj);
    res.status(200).json({ success: true, count: packages.length, data: packages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single package
// @route   GET /api/packages/:id
// @access  Public
exports.getPackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id).populate('agency', 'name email phone address');
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const reviews = await Review.find({ itemType: 'package', itemId: pkg._id }).populate('user', 'username fullName');
    const similar = await Package.find({ category: pkg.category, _id: { $ne: pkg._id } }).limit(3);

    res.status(200).json({ success: true, data: pkg, reviews, similar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create package (Agency/Admin)
// @route   POST /api/packages
// @access  Private (Agency/Admin)
exports.createPackage = async (req, res) => {
  try {
    if (req.userRole === 'agency') {
      req.body.agency = req.user._id;
    }
    const pkg = await Package.create(req.body);
    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private (Agency/Admin)
exports.updatePackage = async (req, res) => {
  try {
    let pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    if (req.userRole === 'agency' && pkg.agency && pkg.agency.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this package' });
    }

    pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: pkg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private (Agency/Admin)
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    if (req.userRole === 'agency' && pkg.agency && pkg.agency.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this package' });
    }

    await Package.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Package removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
