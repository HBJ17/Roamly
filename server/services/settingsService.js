const Setting = require('../models/Setting');
const env = require('../config/env');

let cache = null;
let cachedAt = 0;
const TTL_MS = 30000;

const getSettings = async () => {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;
  let doc = await Setting.findOne({ key: 'platform' });
  if (!doc) doc = await Setting.create({ key: 'platform', gstPercent: env.GST_PERCENT });
  cache = doc.toObject();
  cachedAt = Date.now();
  return cache;
};

const updateSettings = async (updates) => {
  const doc = await Setting.findOneAndUpdate(
    { key: 'platform' },
    { $set: { ...updates, updatedAt: new Date() } },
    { new: true, upsert: true, runValidators: true }
  );
  cache = doc.toObject();
  cachedAt = Date.now();
  return cache;
};

const clearSettingsCache = () => {
  cache = null;
};

module.exports = { getSettings, updateSettings, clearSettingsCache };
