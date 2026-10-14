const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    // Same-origin and non-browser requests send no Origin header.
    if (!origin || env.CLIENT_URLS.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed`));
  },
  credentials: true
}));
// Razorpay webhooks are verified against the exact raw body, so they skip JSON parsing.
app.post('/api/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }), require('./controllers/paymentsController').webhook);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/transports', require('./routes/transports'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/agency', require('./routes/agency'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/itineraries', require('./routes/itinerary'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/saved', require('./routes/saved'));
app.use('/api/coupons', require('./routes/coupons'));
app.get('/api/config', (req, res) => {
  const { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } = require('./config/constants');
  res.status(200).json({ success: true, currencies: SUPPORTED_CURRENCIES, languages: SUPPORTED_LANGUAGES });
});

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
