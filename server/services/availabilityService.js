const Booking = require('../models/Booking');

// Bookings that currently hold inventory: confirmed ones, plus unexpired payment holds.
const activeBookingFilter = () => ({
  $or: [
    { status: 'Confirmed' },
    { status: 'PendingPayment', holdExpiresAt: { $gt: new Date() } }
  ]
});

/**
 * Returns { 'YYYY-MM-DD': unitsTaken } for one item (and optional variant, e.g. room type)
 * across the given days.
 */
const usageByDay = async (itemId, days, { variantId, excludeBookingId } = {}) => {
  const elem = { item: itemId, dates: { $in: days } };
  if (variantId) elem.variantId = variantId;

  const filter = { ...activeBookingFilter(), items: { $elemMatch: elem } };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const bookings = await Booking.find(filter).select('items').lean();
  const usage = Object.fromEntries(days.map((d) => [d, 0]));

  for (const booking of bookings) {
    for (const line of booking.items) {
      if (String(line.item) !== String(itemId)) continue;
      if (variantId && String(line.variantId) !== String(variantId)) continue;
      for (const day of line.dates) {
        if (day in usage) usage[day] += line.quantity;
      }
    }
  }
  return usage;
};

// Lowest number of units still free on any of the days.
const remainingCapacity = async (itemId, days, capacity, options) => {
  const usage = await usageByDay(itemId, days, options);
  const perDay = days.map((d) => ({ date: d, taken: usage[d], remaining: Math.max(0, capacity - usage[d]) }));
  return { remaining: Math.min(...perDay.map((d) => d.remaining)), perDay };
};

module.exports = { activeBookingFilter, usageByDay, remainingCapacity };
