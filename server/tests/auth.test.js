const crypto = require('crypto');
const { startDb, stopDb, api, loginAs } = require('./helpers');
const User = require('../models/User');
const { verifyPassword } = require('../utils/passwords');

beforeAll(startDb);
afterAll(stopDb);

describe('authentication', () => {
  it('registers a traveller with welcome credit and sets an httpOnly cookie', async () => {
    const res = await api().post('/api/auth/register').send({
      username: 'meera', email: 'meera@example.com', password: 'travel-more-2026', fullName: 'Meera Iyer'
    });
    expect(res.status).toBe(201);
    expect(res.body.user.walletBalance).toBe(1000);
    expect(res.body.token).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/roamly_token=.*HttpOnly/);
  });

  it('rejects duplicate usernames and short passwords', async () => {
    const dup = await api().post('/api/auth/register').send({ username: 'meera', email: 'other@example.com', password: 'longenough1', fullName: 'Dup' });
    expect(dup.status).toBe(409);
    const short = await api().post('/api/auth/register').send({ username: 'shorty', email: 's@example.com', password: 'abc', fullName: 'Short' });
    expect(short.status).toBe(400);
  });

  it('rejects a wrong password', async () => {
    const res = await api().post('/api/auth/login').send({ username: 'traveler', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('accepts login by email and returns the profile on /me', async () => {
    const agent = await loginAs('traveler@roamly.travel', 'user123');
    const me = await agent.get('/api/auth/me');
    expect(me.body.user.username).toBe('traveler');
  });

  it('verifies legacy Flask pbkdf2 hashes and upgrades them to bcrypt', async () => {
    const salt = 'abc123';
    const hash = crypto.pbkdf2Sync('old-password', salt, 1000, 32, 'sha256').toString('hex');
    const legacy = `pbkdf2:sha256:1000$${salt}$${hash}`;
    await User.collection.insertOne({ username: 'legacy', email: 'legacy@example.com', password: legacy, walletBalance: 0, loyaltyPoints: 0, status: 'Active' });

    expect(await verifyPassword('wrong', legacy)).toBe(false);
    const res = await api().post('/api/auth/login').send({ username: 'legacy', password: 'old-password' });
    expect(res.status).toBe(200);
    const stored = await User.findOne({ username: 'legacy' }).select('+password');
    expect(stored.password.startsWith('$2')).toBe(true);
  });

  it('blocks suspended accounts', async () => {
    await User.updateOne({ username: 'priya' }, { status: 'Suspended' });
    const res = await api().post('/api/auth/login').send({ username: 'priya', password: 'user123' });
    expect(res.status).toBe(403);
    await User.updateOne({ username: 'priya' }, { status: 'Active' });
  });
});
