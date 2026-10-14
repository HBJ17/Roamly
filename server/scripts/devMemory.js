/**
 * Zero-setup local run: starts an in-memory MongoDB, loads the demo data and serves the API.
 * Usage: npm run dev:memory   (data is discarded when the process exits)
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const start = async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('roamly_db');

  const env = require('../config/env');
  const { seedDatabase } = require('../seed/seedDatabase');
  const app = require('../app');

  await mongoose.connect(process.env.MONGO_URI);
  const result = await seedDatabase();
  console.log(`[dev:memory] Seeded ${result.destinations.length} destinations, ${result.hotels.length} hotels, ${result.transports.length} transports, ${result.packages.length} packages`);

  const { sweepBookings } = require('../services/bookingService');
  setInterval(() => sweepBookings().catch(() => {}), 60000).unref();
  app.listen(env.PORT, () => console.log(`[dev:memory] API on http://localhost:${env.PORT}`));

  const stop = async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
