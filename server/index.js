const env = require('./config/env');
const connectDB = require('./config/db');
const http = require('http');
const app = require('./app');
const realtime = require('./services/realtime');
const { sweepBookings } = require('./services/bookingService');

const SWEEP_INTERVAL_MS = 60 * 1000;

const start = async () => {
  await connectDB();
  // Expire unpaid holds and complete finished trips.
  setInterval(() => sweepBookings().catch((err) => console.error('[sweep]', err.message)), SWEEP_INTERVAL_MS).unref();
  const server = http.createServer(app);
  realtime.init(server);
  server.listen(env.PORT, () => {
    console.log(`[Roamly Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});

start();
