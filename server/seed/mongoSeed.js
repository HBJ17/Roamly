/**
 * Standalone MongoDB Seeder for Roamly Expedition Co.
 * Generates all sample data: Admin, Users, Agencies, Packages, Hotels, Transports, Coupons & Reviews
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Admin = require('../models/Admin');
const Agency = require('../models/Agency');
const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roamly_db';

async function seedData() {
  try {
    console.log(`[Roamly Seeder] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[Connected to MongoDB]');

    // Clear existing collections
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Admin.deleteMany({}),
      Agency.deleteMany({}),
      Package.deleteMany({}),
      Hotel.deleteMany({}),
      Transport.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Invoice.deleteMany({}),
      Notification.deleteMany({})
    ]);

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const userHashedPassword = await bcrypt.hash('user123', 10);
    const agencyHashedPassword = await bcrypt.hash('agency123', 10);

    // 1. Seed Admin
    console.log('Seeding Admins...');
    const admin = await Admin.create({
      username: 'admin',
      email: 'admin@roamly.com',
      password: hashedPassword,
      fullName: 'Roamly Super Administrator',
      role: 'admin'
    });

    // 2. Seed Agencies
    console.log('Seeding Partner Agencies...');
    const agencyDocs = await Agency.create([
      {
        username: 'bangalore_stays',
        password: agencyHashedPassword,
        name: 'Bengaluru Garden City Hospitality & Suites',
        agencyType: 'Hotel Partner',
        email: 'stays@bangalorehospitality.in',
        phone: '+91 80 41234567',
        address: 'MG Road & Indiranagar, Bengaluru, Karnataka',
        status: 'Active',
        wallet: { balance: 45000, totalEarnings: 120000, pendingPayouts: 0 }
      },
      {
        username: 'bangalore_cabs',
        password: agencyHashedPassword,
        name: 'Namma Bengaluru Cabs & ZoomFleet',
        agencyType: 'Transport Provider',
        email: 'cabs@bangalorefleet.in',
        phone: '+91 80 49876543',
        address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka',
        status: 'Active',
        wallet: { balance: 32000, totalEarnings: 95000, pendingPayouts: 0 }
      },
      {
        username: 'chennai_hotels',
        password: agencyHashedPassword,
        name: 'Marina Bay Stays & Heritage Resorts',
        agencyType: 'Hotel Partner',
        email: 'reservations@marinastays.in',
        phone: '+91 44 28114455',
        address: 'Mylapore & ECR, Chennai, Tamil Nadu',
        status: 'Active',
        wallet: { balance: 58000, totalEarnings: 180000, pendingPayouts: 0 }
      },
      {
        username: 'madurai_travels',
        password: agencyHashedPassword,
        name: 'Meenakshi Heritage Tours & Caravans',
        agencyType: 'Tour Agency',
        email: 'tours@maduraiheritage.in',
        phone: '+91 452 2334455',
        address: 'West Masi Street, Madurai, Tamil Nadu',
        status: 'Active',
        wallet: { balance: 85000, totalEarnings: 240000, pendingPayouts: 0 }
      },
      {
        username: 'kodai_escapes',
        password: agencyHashedPassword,
        name: 'Kodaikanal Mist & Pine Expeditions',
        agencyType: 'Tour Agency',
        email: 'explore@kodaimist.in',
        phone: '+91 4542 245678',
        address: 'Coaker Walk Road, Kodaikanal, Tamil Nadu',
        status: 'Active',
        wallet: { balance: 64000, totalEarnings: 210000, pendingPayouts: 0 }
      }
    ]);

    // 3. Seed Users
    console.log('Seeding Sample Users...');
    const userDocs = await User.create([
      {
        username: 'traveler',
        email: 'traveler@roamly.com',
        password: userHashedPassword,
        fullName: 'Ramesh Kumar',
        phone: '+91 9840112233',
        address: '45 Mount Road, Chennai, Tamil Nadu',
        bio: 'Avid explorer and photographer passionate about hill stations and coastal heritage.',
        preferences: {
          preferredTravelMode: 'Train',
          dietaryPreference: 'Vegetarian',
          budgetRange: 'Moderate',
          preferredCategories: ['Hill Station', 'Heritage', 'Beach']
        },
        walletBalance: 3500,
        loyaltyPoints: 340
      },
      {
        username: 'priya_travels',
        email: 'priya@roamly.com',
        password: userHashedPassword,
        fullName: 'Priya Sundaram',
        phone: '+91 9840223344',
        address: '12 Race Course Road, Coimbatore, Tamil Nadu',
        bio: 'Heritage enthusiast, food blogger, and road-tripper seeking authentic cultural trails.',
        preferences: {
          preferredTravelMode: 'Private Car',
          dietaryPreference: 'Non-Vegetarian',
          budgetRange: 'Luxury',
          preferredCategories: ['Heritage', 'Culture', 'Wildlife']
        },
        walletBalance: 5000,
        loyaltyPoints: 520
      }
    ]);

    // 4. Seed Packages
    console.log('Seeding Packages...');
    const packageDocs = await Package.create([
      {
        title: 'Kodaikanal Misty Peaks & Pine Forest Caravan',
        destination: 'Kodaikanal',
        category: 'Hill Station',
        price: 8499,
        durationDays: 3,
        durationNights: 2,
        description: 'Escape to the Princess of Hill Stations. Walk through fragrant pine forests, boat on Kodai Lake, and enjoy misty sunset viewpoints.',
        highlights: ['Kodai Lake Shikara Ride', 'Pine Forest Trek', "Coaker's Walk Panoramic Sunset", 'Silver Cascade Waterfalls'],
        includedAmenities: ['3-Star Resort Stay', 'Daily Gourmet Breakfast', 'Private Cab Sightseeing', 'Guided Nature Trail'],
        foodHighlights: ['Authentic Hilltop Thali', 'Wood-fired Oven Bakery Treats', 'Fresh Homemade Kodai Chocolates'],
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
        agency: agencyDocs[4]._id,
        pros: ['Scenic weather all year', 'Ideal for couples & families', 'Peaceful retreat from city noise'],
        cons: ['Narrow mountain roads during peak hours', 'Evenings can be chilly'],
        idealFor: 'Couples & Nature Enthusiasts'
      },
      {
        title: 'Madurai Meenakshi Temple & Cultural Odyssey',
        destination: 'Madurai',
        category: 'Heritage',
        price: 6999,
        durationDays: 2,
        durationNights: 1,
        description: 'Immerse yourself in 2,500 years of living history. Witness the breathtaking thousand-pillar hall of Meenakshi Temple and night food walks.',
        highlights: ['Meenakshi Amman Temple VIP Darshan', 'Thirumalai Nayakkar Palace Light & Sound', 'Famous Jigarthanda Tasting', 'Gandhi Memorial Museum'],
        includedAmenities: ['Heritage Hotel Stay', 'Temple Guide', 'Traditional South Indian Breakfast', 'AC Cab Transfer'],
        foodHighlights: ['Famous Madurai Kari Dosa', 'Original Famous Jigarthanda', 'Bun Parotta Feast'],
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
        agency: agencyDocs[3]._id,
        pros: ['Rich cultural immersion', 'Unbeatable culinary scene', 'Easy rail & air connectivity'],
        cons: ['Afternoon heat in summer months'],
        idealFor: 'History Buffs, Families & Foodies'
      },
      {
        title: 'Chennai Heritage & East Coast Highway Cruise',
        destination: 'Chennai',
        category: 'Beach',
        price: 7499,
        durationDays: 3,
        durationNights: 2,
        description: 'Experience the cultural capital with scenic coastal drives along ECR to Mahabalipuram shore temples and golden beaches.',
        highlights: ['Marina Beach Sunset Stroll', 'Mahabalipuram UNESCO Shore Temples', 'Kapaleeshwarar Temple Trail', 'DakshinaChitra Living Museum'],
        includedAmenities: ['ECR Beachfront Resort', 'Daily Breakfast Buffet', 'Private AC Sedan', 'Monument Entry Passes'],
        foodHighlights: ['Authentic Mylapore Filter Coffee', 'ECR Coastal Seafood Curry', 'Traditional Chettinad Feast'],
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&q=80',
        agency: agencyDocs[2]._id,
        pros: ['UNESCO Heritage sites', 'Beautiful ocean sunrise & sunsets', 'Vibrant nightlife'],
        cons: ['Humid afternoon weather'],
        idealFor: 'Beach Lovers & Cultural Explorers'
      },
      {
        title: 'Bengaluru Royal Palaces & Cyber Green Expedition',
        destination: 'Bangalore',
        category: 'Cultural',
        price: 9299,
        durationDays: 3,
        durationNights: 2,
        description: 'Tour the Silicon Valley of India with its lush botanical gardens, Tudor-style palaces, craft breweries, and tech parks.',
        highlights: ['Bangalore Palace Guided Tour', 'Lalbagh Botanical Garden & Glasshouse', 'Cubbon Park Walk', 'Indiranagar Craft Microbrewery Trail'],
        includedAmenities: ['4-Star Central Hotel', 'Full Buffet Breakfast', 'Private Airport/City Cab', 'Entry Tickets'],
        foodHighlights: ['Iconic CTR Benne Dosa', 'Filter Kaapi & Kesari Bath', 'Microbrewery Gourmet Pizza'],
        rating: 4.6,
        imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80',
        agency: agencyDocs[0]._id,
        pros: ['Pleasant climate', 'Modern urban vibe + historical parks', 'World-class dining'],
        cons: ['City traffic during peak commute'],
        idealFor: 'Urban Nomads & Weekend Escapists'
      }
    ]);

    // 5. Seed Hotels
    console.log('Seeding Hotels...');
    await Hotel.create([
      {
        agency: agencyDocs[4]._id,
        name: 'The Tamara Kodai Retreat & Spa',
        city: 'Kodaikanal',
        address: 'St Marys Road, Kodaikanal, Tamil Nadu',
        starRating: 4.9,
        pricePerNight: 5500,
        roomTypes: ['Luxury Suite', 'Valley View Villa', 'Pine Chalet'],
        amenities: ['Heated Pool', 'Free High-Speed Wi-Fi', 'Forest View Balcony', 'Ayurvedic Spa', 'Fireplace in Room'],
        description: 'Nestled on picturesque hills, offering French colonial architecture, lush greenery, and luxury amenities.',
        diningOptions: ['Bistro 1845', 'Deck Lounge', 'Private Bonfire Dining'],
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        acType: 'Both',
        petFriendly: true,
        bedType: 'King Bed',
        maxCapacity: 4
      },
      {
        agency: agencyDocs[3]._id,
        name: 'Heritage Madurai Palace Resort',
        city: 'Madurai',
        address: '11 Melakkal Main Road, Kochadai, Madurai, Tamil Nadu',
        starRating: 4.8,
        pricePerNight: 4200,
        roomTypes: ['Plunge Pool Villa', 'Heritage Deluxe', 'Club Suite'],
        amenities: ['Olympic Size Temple Pool', 'Lush 17-Acre Gardens', 'Free Wi-Fi', 'Spa Wellness', 'Valet Parking'],
        description: 'Designed by legendary architect Geoffrey Bawa, blending heritage architecture with modern comfort.',
        diningOptions: ['The Banyan Restaurant', 'Swig & Dine Bar', 'Poolside Grills'],
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
        acType: 'AC',
        petFriendly: false,
        bedType: 'King Bed',
        maxCapacity: 3
      },
      {
        agency: agencyDocs[2]._id,
        name: 'Taj Fisherman’s Cove Resort & Spa',
        city: 'Chennai',
        address: 'Covelong Beach, East Coast Road, Chennai, Tamil Nadu',
        starRating: 4.9,
        pricePerNight: 7800,
        roomTypes: ['Sea View Villa', 'Cottage by the Shore', 'Luxury Room'],
        amenities: ['Private Beach Access', 'Infinity Pool', 'Jiva Spa', 'Tennis Court', 'Water Sports'],
        description: 'Built on the ramparts of an old Dutch Fort, delivering luxury and soothing ocean breezes.',
        diningOptions: ['Bay View Seafood', 'Seagull Multi-Cuisine', 'Upper Deck Romantic Dining'],
        imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
        acType: 'AC',
        petFriendly: true,
        bedType: 'King Bed',
        maxCapacity: 4
      }
    ]);

    // 6. Seed Transports
    console.log('Seeding Transports...');
    await Transport.create([
      {
        agency: agencyDocs[1]._id,
        title: 'Toyota Innova Crysta Premium Taxi',
        transportType: 'Taxi',
        sourceCity: 'Bangalore',
        destinationCity: 'Kodaikanal',
        price: 4999,
        durationHours: 8.5,
        features: ['Leather Captain Seats', 'Chilled AC', 'USB Fast Charging', 'Bottled Water & Snacks', 'Experienced Hill Driver'],
        departureTime: 'Flexible (24/7 on demand)',
        mealService: 'Complimentary Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
        serviceType: 'Taxi',
        acType: 'AC',
        seatingCapacity: 6,
        dailyRate: 3500
      },
      {
        agency: agencyDocs[1]._id,
        title: 'Mercedes-Benz ECR Coastal Luxury Sedan',
        transportType: 'Taxi',
        sourceCity: 'Chennai',
        destinationCity: 'Mahabalipuram',
        price: 2499,
        durationHours: 1.5,
        features: ['Sunroof', 'High-End Surround Audio', 'Chilled Mineral Water', 'Highway Tolls Included'],
        departureTime: 'Instant / Hourly',
        mealService: 'Beverage Box',
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        serviceType: 'Rental',
        acType: 'AC',
        seatingCapacity: 4,
        dailyRate: 5000
      }
    ]);

    // 7. Seed Coupons
    console.log('Seeding Coupons...');
    await Coupon.create([
      {
        code: 'ROAMLY10',
        discountType: 'percent',
        discountValue: 10,
        minOrderAmount: 3000,
        maxDiscountAmount: 1500,
        validUntil: new Date(Date.now() + 90 * 86400000),
        usageLimit: 500,
        timesUsed: 14,
        isActive: true
      },
      {
        code: 'WANDERLUST',
        discountType: 'fixed',
        discountValue: 1000,
        minOrderAmount: 5000,
        maxDiscountAmount: 1000,
        validUntil: new Date(Date.now() + 60 * 86400000),
        usageLimit: 200,
        timesUsed: 28,
        isActive: true
      },
      {
        code: 'EXPLORE2026',
        discountType: 'percent',
        discountValue: 15,
        minOrderAmount: 7000,
        maxDiscountAmount: 2500,
        validUntil: new Date(Date.now() + 120 * 86400000),
        usageLimit: 300,
        timesUsed: 5,
        isActive: true
      }
    ]);

    // 8. Seed Initial Reviews
    console.log('Seeding Reviews...');
    await Review.create([
      {
        user: userDocs[0]._id,
        itemType: 'package',
        itemId: packageDocs[0]._id,
        itemModel: 'Package',
        rating: 5,
        ratings: { cleanliness: 5, service: 5, location: 5, value: 5 },
        title: 'Unforgettable misty pine walk and boat ride!',
        comment: 'The itinerary was seamlessly executed. The resort booked in Kodai had breathtaking valley views and the cab driver was polite and skilled on the mountain roads.',
        travelType: 'Family',
        helpfulCount: 12
      },
      {
        user: userDocs[1]._id,
        itemType: 'package',
        itemId: packageDocs[1]._id,
        itemModel: 'Package',
        rating: 5,
        ratings: { cleanliness: 5, service: 5, location: 5, value: 4 },
        title: 'Spectacular temple architecture and food walk',
        comment: 'VIP darshan saved us hours. The guide was deeply knowledgeable about the temple history and the night food walk was culinary heaven!',
        travelType: 'Couple',
        helpfulCount: 8
      }
    ]);

    console.log('====================================================');
    console.log(' Roamly MongoDB Seeding Completed Successfully! ');
    console.log(' Default Logins:');
    console.log('   Admin:  admin / admin123');
    console.log('   User:   traveler / user123');
    console.log('   Agency: bangalore_stays / agency123');
    console.log('====================================================');
  } catch (err) {
    console.error('Seeding Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedData();
