/**
 * CLI seeder: `npm run seed` (wipes the configured database and loads demo data).
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { seedDatabase } = require('./seedDatabase');

const run = async () => {
  if (env.isProd && process.argv[2] !== '--force') {
    console.error('Refusing to wipe a production database. Re-run with --force if you really mean it.');
    process.exit(1);
  }

  console.log(`[Roamly Seeder] Connecting to ${env.MONGO_URI.replace(/\/\/[^@]*@/, '//***@')}`);
  await mongoose.connect(env.MONGO_URI);

  const result = await seedDatabase({ log: (msg) => console.log(`  - ${msg}`) });

  console.log('==============================================================');
  console.log(' Roamly demo data loaded');
  console.log(`  ${result.destinations.length} destinations, ${result.hotels.length} hotels, ${result.transports.length} transports, ${result.packages.length} packages`);
  console.log(' Logins:');
  console.log('   Admin    admin / admin123            (sign in as Admin)');
  console.log('   Traveler traveler / user123');
  console.log('   Partner  chennai_hotels, chennai_cabs, chennai_tours, redbus_express ... / agency123');
  console.log('==============================================================');
};

run()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
