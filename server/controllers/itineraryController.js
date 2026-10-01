const Itinerary = require('../models/Itinerary');

// @desc    Get user itineraries
// @route   GET /api/itinerary
// @access  Private
exports.getMyItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: itineraries.length, data: itineraries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single itinerary
// @route   GET /api/itinerary/:id
// @access  Private
exports.getItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ success: false, message: 'Itinerary not found' });
    res.status(200).json({ success: true, data: itinerary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new custom itinerary
// @route   POST /api/itinerary
// @access  Private
exports.createItinerary = async (req, res) => {
  try {
    req.body.user = req.user._id;
    const itinerary = await Itinerary.create(req.body);
    res.status(201).json({ success: true, data: itinerary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update itinerary
// @route   PUT /api/itinerary/:id
// @access  Private
exports.updateItinerary = async (req, res) => {
  try {
    let itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ success: false, message: 'Itinerary not found' });

    if (itinerary.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    itinerary = await Itinerary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: itinerary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete itinerary
// @route   DELETE /api/itinerary/:id
// @access  Private
exports.deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ success: false, message: 'Itinerary not found' });

    if (itinerary.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Itinerary.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Itinerary deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
