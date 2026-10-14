/**
 * Builds the Roamly demo dataset. Every hotel, cab and package is attached to a destination
 * and owned by an agency from that city, so destination-scoped searches return real results.
 */
const mongoose = require('mongoose');
const { hashPassword } = require('../utils/passwords');

const Destination = require('../models/Destination');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Agency = require('../models/Agency');
const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const Coupon = require('../models/Coupon');

const data = {
  destinations: require('./data/destinations.json'),
  agencies: require('./data/agencies.json'),
  hotels: require('./data/hotels.json'),
  transports: require('./data/transports.json'),
  packages: require('./data/packages.json'),
  coupons: require('./data/coupons.json')
};

const DAY = 86400000;

const clearDatabase = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

const seedDatabase = async ({ log = () => {} } = {}) => {
  await clearDatabase();

  const [adminHash, userHash, agencyHash] = await Promise.all([
    hashPassword('admin123'),
    hashPassword('user123'),
    hashPassword('agency123')
  ]);

  log('Destinations...');
  const destinations = await Destination.create(data.destinations);
  const city = Object.fromEntries(destinations.map((d) => [d.name, d]));

  log('Accounts...');
  const admin = await Admin.create({
    username: 'admin',
    email: 'admin@roamly.travel',
    password: adminHash,
    fullName: 'Roamly Super Administrator'
  });

  const users = await User.create([
    {
      username: 'traveler',
      email: 'traveler@roamly.travel',
      password: userHash,
      fullName: 'Ramesh Kumar',
      phone: '+91 98401 12233',
      address: '45 Mount Road, Chennai, Tamil Nadu',
      homeCity: 'Chennai',
      bio: 'Avid explorer and photographer passionate about hill stations and coastal heritage.',
      preferences: { preferredTravelMode: 'Train', dietaryPreference: 'Vegetarian', budgetRange: 'Moderate', preferredCategories: ['Hill Station', 'Heritage', 'Beach'] },
      walletBalance: 5000,
      loyaltyPoints: 340,
      emailVerified: true
    },
    {
      username: 'priya',
      email: 'priya@roamly.travel',
      password: userHash,
      fullName: 'Priya Sundaram',
      phone: '+91 98402 23344',
      address: '12 Race Course Road, Coimbatore, Tamil Nadu',
      homeCity: 'Bangalore',
      bio: 'Heritage enthusiast, food blogger and road-tripper.',
      preferences: { preferredTravelMode: 'Private Car', dietaryPreference: 'Non-Vegetarian', budgetRange: 'Luxury', preferredCategories: ['Heritage', 'Cultural'] },
      walletBalance: 5000,
      loyaltyPoints: 520,
      emailVerified: true
    }
  ]);

  const agencies = await Agency.create(
    data.agencies.map((a) => ({
      ...a,
      password: agencyHash,
      city: a.city ? city[a.city]._id : undefined,
      cityName: a.city || '',
      status: 'Active',
      approvedAt: new Date(),
      bankDetails: {
        accountName: a.name,
        accountNumber: String(50100000000 + Math.floor(Math.random() * 899999999)),
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank'
      }
    }))
  );
  const agency = Object.fromEntries(agencies.map((a) => [a.username, a]));

  log('Hotels...');
  const hotels = await Hotel.create(
    data.hotels.map((h) => {
      const dest = city[h.city];
      const jitter = () => (Math.random() - 0.5) * 0.04;
      return {
        ...h,
        agency: agency[h.agency]._id,
        destination: dest._id,
        destinationName: dest.name,
        coordinates: { lat: dest.coordinates.lat + jitter(), lng: dest.coordinates.lng + jitter() }
      };
    })
  );

  log('Transports...');
  const transports = await Transport.create(
    data.transports.map((t) => {
      if (t.scope === 'local') {
        const dest = city[t.city];
        return { ...t, agency: agency[t.agency]._id, destination: dest._id, destinationName: dest.name };
      }
      const from = city[t.from];
      const to = city[t.to];
      return {
        ...t,
        agency: agency[t.agency]._id,
        origin: from._id,
        originName: from.name,
        destination: to._id,
        destinationName: to.name
      };
    })
  );

  log('Packages...');
  const hotelsByCity = hotels.reduce((acc, h) => {
    (acc[h.destinationName] = acc[h.destinationName] || []).push(h);
    return acc;
  }, {});
  const packages = await Package.create(
    data.packages.map((p) => {
      const dest = city[p.city];
      const cityHotels = (hotelsByCity[p.city] || []).sort((a, b) => a.startingPrice - b.startingPrice);
      // Longer packages bundle a better hotel from the same city.
      const hotel = cityHotels[Math.min(cityHotels.length - 1, p.durationDays >= 5 ? 1 : 0)];
      const attractions = dest.attractions.map((a) => a.name);
      const dayPlan = Array.from({ length: p.durationDays }, (_, i) => ({
        day: i + 1,
        title: i === 0 ? `Arrive in ${dest.name}` : i === p.durationDays - 1 ? 'Leisure morning & departure' : `${dest.name} discovery day ${i}`,
        description: i === 0 ? 'Pickup, hotel check-in and an easy evening walk.' : '',
        attractions: i === p.durationDays - 1 ? [] : attractions.slice((i * 2) % attractions.length, ((i * 2) % attractions.length) + 2)
      }));
      return {
        ...p,
        agency: agency[p.agency]._id,
        destination: dest._id,
        destinationName: dest.name,
        hotel: hotel ? hotel._id : undefined,
        dayPlan,
        exclusions: ['Airfare / train tickets to the destination', 'Personal expenses', 'Camera fees at monuments'],
        coordinates: dest.coordinates
      };
    })
  );

  log('Coupons...');
  const coupons = await Coupon.create(
    data.coupons.map((c) => ({ ...c, validUntil: new Date(Date.now() + 180 * DAY), usageLimit: 500 }))
  );

  return { admin, users, agencies, destinations, hotels, transports, packages, coupons };
};

module.exports = { seedDatabase, clearDatabase };
