/**
 * Roamly SQL -> MongoDB Data Migration Pipeline
 * Imports exported JSON tables or seed definitions into MongoDB collections.
 */
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/User');
const Admin = require('../server/models/Admin');
const Agency = require('../server/models/Agency');
const Package = require('../server/models/Package');
const Hotel = require('../server/models/Hotel');
const Transport = require('../server/models/Transport');
const Booking = require('../server/models/Booking');
const Coupon = require('../server/models/Coupon');

const exportDir = path.join(__dirname, 'export');
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roamly_db';

function readJsonTable(name) {
  const filePath = path.join(exportDir, `${name}.json`);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
}

async function runMigration() {
  console.log('--- Starting Roamly SQL to MongoDB Data Importer ---');
  console.log(`[Target MongoDB]: ${mongoUri}`);

  await mongoose.connect(mongoUri);
  console.log('[Connected to MongoDB]');

  const userMap = new Map();
  const agencyMap = new Map();
  const adminMap = new Map();

  try {
    // 1. Admins
    const admins = readJsonTable('admins');
    for (const a of admins) {
      let doc = await Admin.findOne({ username: a.username });
      if (!doc) {
        doc = await Admin.create({
          username: a.username,
          password: a.password,
          email: a.email,
          fullName: a.full_name || 'Administrator',
          role: a.role || 'admin',
          createdAt: a.created_at ? new Date(a.created_at) : new Date()
        });
      }
      adminMap.set(a.id, doc._id);
    }
    console.log(`✓ Imported ${admins.length} Admins`);

    // 2. Agencies
    const agencies = readJsonTable('agencies');
    for (const ag of agencies) {
      let doc = await Agency.findOne({ username: ag.username });
      if (!doc) {
        doc = await Agency.create({
          username: ag.username,
          password: ag.password,
          name: ag.name,
          agencyType: ag.agency_type || 'Tour Agency',
          email: ag.email,
          phone: ag.phone || '',
          address: ag.address || '',
          status: ag.status || 'Active',
          wallet: { balance: 50000, totalEarnings: 150000, pendingPayouts: 0 },
          createdAt: ag.created_at ? new Date(ag.created_at) : new Date()
        });
      }
      agencyMap.set(ag.id, doc._id);
    }
    console.log(`✓ Imported ${agencies.length} Agencies`);

    // 3. Users
    const users = readJsonTable('users');
    const prefs = readJsonTable('user_preferences');
    for (const u of users) {
      const p = prefs.find(pr => pr.user_id === u.id);
      let userPrefs = {};
      if (p) {
        userPrefs = {
          preferredTravelMode: p.preferred_travel_mode,
          dietaryPreference: p.dietary_preference,
          budgetRange: p.budget_range,
          preferredCategories: p.preferred_categories ? p.preferred_categories.split(',').map(s => s.trim()) : []
        };
      }

      let doc = await User.findOne({ username: u.username });
      if (!doc) {
        doc = await User.create({
          username: u.username,
          email: u.email,
          password: u.password,
          fullName: u.full_name || u.username,
          phone: u.phone || '',
          address: u.address || '',
          bio: u.bio || '',
          preferences: userPrefs,
          walletBalance: 2500,
          loyaltyPoints: 120,
          createdAt: u.created_at ? new Date(u.created_at) : new Date()
        });
      }
      userMap.set(u.id, doc._id);
    }
    console.log(`✓ Imported ${users.length} Users`);

    // 4. Packages
    const packages = readJsonTable('packages');
    const splitArr = str => (str ? str.split(/[,;\n|]/).map(s => s.trim()).filter(Boolean) : []);
    for (const p of packages) {
      let doc = await Package.findOne({ title: p.title });
      if (!doc) {
        doc = await Package.create({
          title: p.title,
          destination: p.destination,
          category: p.category,
          price: Number(p.price),
          durationDays: p.duration_days,
          durationNights: p.duration_nights,
          description: p.description,
          highlights: splitArr(p.highlights),
          includedAmenities: splitArr(p.included_amenities),
          foodHighlights: splitArr(p.food_highlights),
          rating: Number(p.rating || 4.5),
          imageUrl: p.image_url,
          agency: agencyMap.get(p.agency_id) || null,
          pros: splitArr(p.pros),
          cons: splitArr(p.cons),
          idealFor: p.ideal_for || 'All Travelers',
          createdAt: p.created_at ? new Date(p.created_at) : new Date()
        });
      }
    }
    console.log(`✓ Imported ${packages.length} Packages`);

    // 5. Hotels
    const hotels = readJsonTable('hotels');
    for (const h of hotels) {
      let doc = await Hotel.findOne({ name: h.name, city: h.city });
      if (!doc) {
        doc = await Hotel.create({
          agency: agencyMap.get(h.agency_id) || null,
          name: h.name,
          city: h.city,
          address: h.address,
          starRating: Number(h.star_rating || 4.0),
          pricePerNight: Number(h.price_per_night),
          roomTypes: splitArr(h.room_types),
          amenities: splitArr(h.amenities),
          description: h.description,
          diningOptions: splitArr(h.dining_options),
          imageUrl: h.image_url,
          acType: h.ac_type || 'AC',
          petFriendly: Boolean(h.pet_friendly),
          bedType: h.bed_type || 'King Bed',
          maxCapacity: Number(h.max_capacity || 2),
          createdAt: h.created_at ? new Date(h.created_at) : new Date()
        });
      }
    }
    console.log(`✓ Imported ${hotels.length} Hotels`);

    // 6. Transports
    const transports = readJsonTable('transports');
    for (const t of transports) {
      let doc = await Transport.findOne({ title: t.title, sourceCity: t.source_city, destinationCity: t.destination_city });
      if (!doc) {
        doc = await Transport.create({
          agency: agencyMap.get(t.agency_id) || null,
          title: t.title,
          transportType: t.transport_type,
          sourceCity: t.source_city,
          destinationCity: t.destination_city,
          price: Number(t.price),
          durationHours: Number(t.duration_hours),
          features: splitArr(t.features),
          departureTime: t.departure_time,
          mealService: t.meal_service || 'None',
          imageUrl: t.image_url,
          serviceType: t.service_type || 'Taxi',
          acType: t.ac_type || 'AC',
          seatingCapacity: Number(t.seating_capacity || 4),
          dailyRate: Number(t.daily_rate || 0),
          createdAt: t.created_at ? new Date(t.created_at) : new Date()
        });
      }
    }
    console.log(`✓ Imported ${transports.length} Transports`);

    console.log('==================================================');
    console.log(' Migration Completed Successfully! ');
    console.log('==================================================');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runMigration();
