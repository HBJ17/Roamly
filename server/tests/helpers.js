process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;
let app;

const startDb = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = require('../app');
  const { seedDatabase } = require('../seed/seedDatabase');
  require('../services/settingsService').clearSettingsCache();
  return seedDatabase();
};

const stopDb = async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

// Logs in and returns a supertest agent that keeps the session cookie.
const loginAs = async (username, password, loginType = 'user') => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ username, password, loginType });
  if (res.status !== 200) throw new Error(`login failed for ${username}: ${res.body.message}`);
  return agent;
};

const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

module.exports = { startDb, stopDb, loginAs, day, api: () => request(app) };
