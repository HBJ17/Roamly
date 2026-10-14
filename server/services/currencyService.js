/**
 * Display-currency rates (prices are always charged in INR).
 * Fetched from EXCHANGE_RATE_API at most every 6 hours, falling back to built-in rates.
 */
const env = require('../config/env');
const { SUPPORTED_CURRENCIES } = require('../config/constants');

const TTL_MS = 6 * 60 * 60 * 1000;
let cache = { currencies: SUPPORTED_CURRENCIES, updatedAt: null, source: 'fallback' };
let fetchedAt = 0;

const getCurrencies = async () => {
  if (env.isTest || Date.now() - fetchedAt < TTL_MS) return cache;
  fetchedAt = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(env.EXCHANGE_RATE_API, { signal: controller.signal });
    clearTimeout(timer);
    const body = await res.json();
    if (!res.ok || !body.rates) throw new Error('Bad response');
    const currencies = Object.fromEntries(
      Object.entries(SUPPORTED_CURRENCIES).map(([code, meta]) => [code, { ...meta, rate: body.rates[code] ?? meta.rate }])
    );
    cache = { currencies, updatedAt: new Date().toISOString(), source: 'live' };
  } catch (err) {
    console.warn(`[currency] using fallback rates: ${err.message}`);
  }
  return cache;
};

module.exports = { getCurrencies };
