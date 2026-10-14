const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`[Roamly Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});

start();
