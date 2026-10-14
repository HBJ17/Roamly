const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const required = ['JWT_SECRET', 'MONGO_URI'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length && isProd) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
if (missing.length && !isTest) {
  console.warn(`[env] ${missing.join(', ')} not set; using development defaults. Never do this in production.`);
}

const env = {
  NODE_ENV,
  isProd,
  isTest,
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roamly_db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  COOKIE_MAX_AGE_DAYS: Number(process.env.COOKIE_MAX_AGE_DAYS) || 7,
  CLIENT_URLS: (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean),
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || 'http://localhost:5173',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'Roamly <no-reply@roamly.local>',

  EXCHANGE_RATE_API: process.env.EXCHANGE_RATE_API || 'https://open.er-api.com/v6/latest/INR',
  BOOKING_HOLD_MINUTES: Number(process.env.BOOKING_HOLD_MINUTES) || 15,
  GST_PERCENT: Number(process.env.GST_PERCENT) || 18
};

module.exports = env;
