const { startDb, stopDb, api, loginAs, day } = require('./helpers');

beforeAll(startDb);
afterAll(stopDb);

describe('destination scoping', () => {
  it('returns only Chennai hotels, cabs and packages for Chennai', async () => {
    const [hotels, cabs, packages] = await Promise.all([
      api().get('/api/hotels?destination=chennai'),
      api().get('/api/transports?scope=local&destination=Chennai'),
      api().get('/api/packages?destination=chennai')
    ]);
    expect(hotels.body.total).toBeGreaterThan(0);
    expect(cabs.body.total).toBeGreaterThan(0);
    expect(packages.body.total).toBeGreaterThan(0);
    for (const list of [hotels, cabs, packages]) {
      expect(new Set(list.body.data.map((x) => x.destinationName))).toEqual(new Set(['Chennai']));
    }
  });

  it('returns nothing for an unknown destination instead of everything', async () => {
    const res = await api().get('/api/hotels?destination=atlantis');
    expect(res.body.total).toBe(0);
  });

  it('returns intercity routes only for the requested city pair', async () => {
    const res = await api().get('/api/transports?scope=intercity&from=bangalore&to=chennai');
    expect(res.body.total).toBeGreaterThan(0);
    res.body.data.forEach((t) => {
      expect(t.originName).toBe('Bangalore');
      expect(t.destinationName).toBe('Chennai');
    });
  });

  it('does not let a Chennai hotel partner list a hotel in Madurai', async () => {
    const agent = await loginAs('chennai_hotels', 'agency123', 'agency');
    const hotel = { name: 'Out of Town Inn', address: 'Somewhere', description: 'A hotel that should not be allowed here', rooms: [{ name: 'Std', pricePerNight: 2000 }] };
    const blocked = await agent.post('/api/hotels').send({ ...hotel, destination: 'madurai' });
    expect(blocked.status).toBe(403);
    const ok = await agent.post('/api/hotels').send(hotel);
    expect(ok.status).toBe(201);
    expect(ok.body.data.destinationName).toBe('Chennai');
  });

  it('does not let a hotel partner list cabs', async () => {
    const agent = await loginAs('chennai_hotels', 'agency123', 'agency');
    const res = await agent.post('/api/transports').send({ scope: 'local', title: 'Cab', vehicleType: 'Sedan', dailyRate: 2000 });
    expect(res.status).toBe(403);
  });

  it('only offers the destination’s options in the trip planner and rejects mixed-city plans', async () => {
    const options = await api().get(`/api/itineraries/options?destination=chennai&origin=bangalore&startDate=${day(20)}&endDate=${day(22)}&adults=2`);
    expect(options.status).toBe(200);
    const o = options.body.data;
    expect(new Set(o.hotels.map((h) => h.destinationName))).toEqual(new Set(['Chennai']));
    expect(new Set(o.cabs.map((c) => c.destinationName))).toEqual(new Set(['Chennai']));
    o.outbound.forEach((t) => expect(`${t.originName}>${t.destinationName}`).toBe('Bangalore>Chennai'));

    const agent = await loginAs('traveler', 'user123');
    const madurai = await api().get('/api/hotels?destination=madurai');
    const res = await agent.post('/api/itineraries').send({
      destination: 'chennai', origin: 'bangalore', startDate: day(20), endDate: day(22), travelers: { adults: 2 },
      stay: { hotel: madurai.body.data[0]._id }
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/is in Madurai, not Chennai/);
  });
});
