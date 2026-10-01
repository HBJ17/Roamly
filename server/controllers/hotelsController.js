const Hotel = require('../models/Hotel');
const Review = require('../models/Review');

// @desc    Get all hotels with search & filters
// @route   GET /api/hotels
// @access  Public
exports.getHotels = async (req, res) => {
  try {
    const { city, search, min_price, max_price, star_rating, ac_type, pet_friendly, bed_type, capacity, sort_by } = req.query;
    let query = {};

    if (city || search) {
      const term = city || search;
      query.$or = [
        { city: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { address: { $regex: term, $options: 'i' } }
      ];
    }

    if (min_price || max_price) {
      query.pricePerNight = {};
      if (min_price) query.pricePerNight.$gte = Number(min_price);
      if (max_price) query.pricePerNight.$lte = Number(max_price);
    }

    if (star_rating) {
      query.starRating = { $gte: Number(star_rating) };
    }

    if (ac_type && ac_type !== 'all' && ac_type !== '') {
      query.acType = ac_type;
    }

    if (pet_friendly !== undefined && pet_friendly !== '') {
      query.petFriendly = pet_friendly === '1' || pet_friendly === 'true' || pet_friendly === true;
    }

    if (bed_type && bed_type !== 'all' && bed_type !== '') {
      query.bedType = { $regex: bed_type, $options: 'i' };
    }

    if (capacity && Number(capacity) > 0) {
      query.maxCapacity = { $gte: Number(capacity) };
    }

    let sortObj = { starRating: -1 };
    if (sort_by === 'price_asc') sortObj = { pricePerNight: 1 };
    else if (sort_by === 'price_desc') sortObj = { pricePerNight: -1 };
    else if (sort_by === 'rating_desc') sortObj = { starRating: -1 };

    const hotels = await Hotel.find(query).populate('agency', 'name email phone').sort(sortObj);
    res.status(200).json({ success: true, count: hotels.length, data: hotels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('agency', 'name email phone address');
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const reviews = await Review.find({ itemType: 'hotel', itemId: hotel._id }).populate('user', 'username fullName');
    const nearby = await Hotel.find({ city: hotel.city, _id: { $ne: hotel._id } }).limit(3);

    res.status(200).json({ success: true, data: hotel, reviews, nearby });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create Hotel
// @route   POST /api/hotels
// @access  Private (Agency/Admin)
exports.createHotel = async (req, res) => {
  try {
    if (req.userRole === 'agency') req.body.agency = req.user._id;
    const hotel = await Hotel.create(req.body);
    res.status(201).json({ success: true, data: hotel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update Hotel
// @route   PUT /api/hotels/:id
// @access  Private (Agency/Admin)
exports.updateHotel = async (req, res) => {
  try {
    let hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (req.userRole === 'agency' && hotel.agency && hotel.agency.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this hotel' });
    }

    hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete Hotel
// @route   DELETE /api/hotels/:id
// @access  Private (Agency/Admin)
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (req.userRole === 'agency' && hotel.agency && hotel.agency.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this hotel' });
    }

    await Hotel.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Hotel removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
