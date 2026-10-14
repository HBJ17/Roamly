const Agency = require('../models/Agency');
const AgencyTransaction = require('../models/AgencyTransaction');

const round = (n) => Math.round(n * 100) / 100;

// Groups line totals by owning agency.
const grossByAgency = (booking) =>
  booking.items.reduce((acc, line) => {
    const key = String(line.agency);
    acc[key] = (acc[key] || 0) + line.lineTotal;
    return acc;
  }, {});

const commissionFor = async (agencyId, booking) => {
  const agency = await Agency.findById(agencyId).select('commissionPercent');
  return agency?.commissionPercent ?? booking.commissionPercent;
};

/**
 * Credits each partner with its share of a confirmed booking, minus platform commission.
 * Coupon and loyalty discounts are funded by Roamly, so partners are paid on list price.
 */
const settleBooking = async (booking) => {
  for (const [agencyId, gross] of Object.entries(grossByAgency(booking))) {
    const percent = await commissionFor(agencyId, booking);
    const commission = round((gross * percent) / 100);
    const net = round(gross - commission);
    await AgencyTransaction.create({
      agency: agencyId,
      type: 'earning',
      booking: booking._id,
      bookingReference: booking.reference,
      description: `Booking ${booking.reference}`,
      gross,
      commission,
      net
    });
    await Agency.updateOne({ _id: agencyId }, { $inc: { 'wallet.balance': net, 'wallet.totalEarnings': net } });
  }
};

/** Claws back the refunded share of earlier earnings when a booking is cancelled. */
const reverseBooking = async (booking, refundPercent) => {
  if (refundPercent <= 0) return;
  const earnings = await AgencyTransaction.find({ booking: booking._id, type: 'earning' });
  for (const earning of earnings) {
    const net = round((earning.net * refundPercent) / 100);
    await AgencyTransaction.create({
      agency: earning.agency,
      type: 'reversal',
      booking: booking._id,
      bookingReference: booking.reference,
      description: `Cancellation of ${booking.reference} (${refundPercent}% refunded)`,
      gross: -round((earning.gross * refundPercent) / 100),
      commission: -round((earning.commission * refundPercent) / 100),
      net: -net
    });
    await Agency.updateOne({ _id: earning.agency }, { $inc: { 'wallet.balance': -net, 'wallet.totalEarnings': -net } });
  }
};

module.exports = { settleBooking, reverseBooking };
