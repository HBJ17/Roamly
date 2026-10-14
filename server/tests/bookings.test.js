const crypto = require('crypto');
const { startDb, stopDb, api, loginAs, day } = require('./helpers');
const User = require('../models/User');
const Agency = require('../models/Agency');

beforeAll(startDb);
afterAll(stopDb);

const cheapestSuite = async () => {
  const res = await api().get('/api/hotels?destination=chennai&sort=price_desc');
  const hotel = res.body.data[0];
  const room = [...hotel.rooms].sort((a, b) => a.totalRooms - b.totalRooms)[0];
  return { hotel, room };
};

describe('booking engine', () => {
  it('prices a stay with GST and refuses past dates and over-capacity rooms', async () => {
    const agent = await loginAs('traveler', 'user123');
    const { hotel, room } = await cheapestSuite();
    const quote = await agent.post('/api/bookings/quote').send({
      itemType: 'hotel', itemId: hotel._id, roomId: room._id, startDate: day(10), endDate: day(12), travelers: { adults: 1 }
    });
    expect(quote.status).toBe(200);
    const { subtotal, tax, total } = quote.body.data.pricing;
    expect(subtotal).toBe(room.pricePerNight * 2);
    expect(total).toBe(subtotal + tax);

    const past = await agent.post('/api/bookings/quote').send({ itemType: 'hotel', itemId: hotel._id, startDate: day(-1), endDate: day(1) });
    expect(past.status).toBe(400);

    const crowded = await agent.post('/api/bookings/quote').send({
      itemType: 'hotel', itemId: hotel._id, roomId: room._id, startDate: day(10), endDate: day(11), travelers: { adults: room.maxGuests + 1 }
    });
    expect(crowded.status).toBe(400);
  });

  it('stops selling a room type once every room is held for those nights', async () => {
    const agent = await loginAs('priya', 'user123');
    const { hotel, room } = await cheapestSuite();
    const req = { itemType: 'hotel', itemId: hotel._id, roomId: room._id, startDate: day(40), endDate: day(41), travelers: { adults: 1 } };
    for (let i = 0; i < room.totalRooms; i += 1) {
      expect((await agent.post('/api/bookings').send(req)).status).toBe(201);
    }
    const soldOut = await agent.post('/api/bookings').send(req);
    expect(soldOut.status).toBe(409);
    // A different night is unaffected.
    expect((await agent.post('/api/bookings').send({ ...req, startDate: day(42), endDate: day(43) })).status).toBe(201);
  });

  it('confirms on wallet payment, credits the partner, and refunds by policy on cancellation', async () => {
    const agent = await loginAs('traveler', 'user123');
    const cabs = await api().get('/api/transports?scope=local&destination=madurai&sort=price_asc');
    const cab = cabs.body.data[0];
    const hold = await agent.post('/api/bookings').send({ itemType: 'transport', itemId: cab._id, startDate: day(30), days: 1, travelers: { adults: 2 } });
    expect(hold.body.data.status).toBe('PendingPayment');

    const partnerBefore = await Agency.findById(cab.agency._id || cab.agency);
    const userBefore = await User.findOne({ username: 'traveler' });
    const paid = await agent.post(`/api/payments/bookings/${hold.body.data._id}`).send({ method: 'wallet' });
    expect(paid.status).toBe(200);
    expect(paid.body.data.booking.status).toBe('Confirmed');

    const userAfter = await User.findOne({ username: 'traveler' });
    expect(userAfter.walletBalance).toBe(userBefore.walletBalance - hold.body.data.pricing.total);
    const partnerAfter = await Agency.findById(partnerBefore._id);
    expect(partnerAfter.wallet.balance).toBeCloseTo(partnerBefore.wallet.balance + cab.dailyRate * 0.9, 2);

    const preview = await agent.get(`/api/bookings/${hold.body.data._id}/cancellation`);
    expect(preview.body.data.refundPercent).toBe(100);
    const cancel = await agent.put(`/api/bookings/${hold.body.data._id}/cancel`).send({ reason: 'test' });
    expect(cancel.body.data.status).toBe('Cancelled');
    expect((await User.findOne({ username: 'traveler' })).walletBalance).toBe(userBefore.walletBalance);
    expect((await Agency.findById(partnerBefore._id)).wallet.balance).toBeCloseTo(partnerBefore.wallet.balance, 2);

    const again = await agent.put(`/api/bookings/${hold.body.data._id}/cancel`).send({});
    expect(again.status).toBe(409);
  });

  it('hides a traveller’s booking from other travellers and unrelated partners', async () => {
    const owner = await loginAs('traveler', 'user123');
    const pk = await api().get('/api/packages?destination=thanjavur');
    const hold = await owner.post('/api/bookings').send({ itemType: 'package', itemId: pk.body.data[0]._id, startDate: day(25), travelers: { adults: 1 } });
    const other = await loginAs('priya', 'user123');
    expect((await other.get(`/api/bookings/${hold.body.data._id}`)).status).toBe(404);
    const wrongPartner = await loginAs('chennai_tours', 'agency123', 'agency');
    expect((await wrongPartner.get(`/api/bookings/${hold.body.data._id}`)).status).toBe(404);
  });
});

describe('online payments', () => {
  it('rejects forged signatures and confirms a correctly signed sandbox payment once', async () => {
    const agent = await loginAs('priya', 'user123');
    const pk = await api().get('/api/packages?destination=kodaikanal');
    const hold = await agent.post('/api/bookings').send({ itemType: 'package', itemId: pk.body.data[0]._id, startDate: day(35), travelers: { adults: 2 } });
    const order = await agent.post(`/api/payments/bookings/${hold.body.data._id}`).send({ method: 'online' });
    expect(order.body.data.provider).toBe('sandbox');

    const forged = await agent.post('/api/payments/verify').send({
      paymentId: order.body.data.paymentId, orderId: order.body.data.orderId, providerPaymentId: 'pay_fake', signature: 'deadbeef'
    });
    expect(forged.status).toBe(400);

    const order2 = await agent.post(`/api/payments/bookings/${hold.body.data._id}`).send({ method: 'online' });
    const paymentId = 'pay_test123';
    const signature = crypto.createHmac('sha256', 'test-secret').update(`${order2.body.data.orderId}|${paymentId}`).digest('hex');
    const body = { paymentId: order2.body.data.paymentId, orderId: order2.body.data.orderId, providerPaymentId: paymentId, signature };
    const ok = await agent.post('/api/payments/verify').send(body);
    expect(ok.status).toBe(200);
    const replay = await agent.post('/api/payments/verify').send(body);
    expect(replay.status).toBe(200);

    const booking = await agent.get(`/api/bookings/${hold.body.data._id}`);
    expect(booking.body.data.status).toBe('Confirmed');
    const voucher = await agent.get(`/api/bookings/${hold.body.data._id}/voucher`);
    expect(voucher.body.data.code).toMatch(/^ROAMLY\|RML-/);
  });

  it('rejects unsigned webhooks', async () => {
    const res = await api().post('/api/payments/webhook').set('Content-Type', 'application/json').send('{"event":"payment.captured"}');
    expect(res.status).toBe(400);
  });
});
