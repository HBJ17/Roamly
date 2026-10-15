// Sends emails in response to domain events, outside the request that caused them.
const Booking = require('../models/Booking');
const Agency = require('../models/Agency');
const env = require('../config/env');
const { events } = require('./events');
const { sendMail, escape } = require('./emailService');

const itemsHtml = (booking) =>
  `<ul>${booking.items.map((i) => `<li><b>${escape(i.title)}</b><br><span style="color:#475569">${escape(i.description)} &middot; ${i.startDate}</span></li>`).join('')}</ul>`;

const register = () => {
  events.on('booking:confirmed', async ({ bookingId }) => {
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) return;
    await sendMail({
      to: booking.contact.email,
      subject: `Booking confirmed - ${booking.reference}`,
      title: `You're going to ${booking.destinationName}!`,
      html: `<p>Hi ${escape(booking.contact.name)}, your booking <b>${booking.reference}</b> is confirmed.</p>
        ${itemsHtml(booking)}
        <p>Total paid: <b>₹${booking.pricing.total.toLocaleString('en-IN')}</b></p>`,
      cta: { label: 'View voucher & invoice', url: `${env.PUBLIC_APP_URL}/account/bookings/${booking._id}` }
    });
  });

  events.on('booking:cancelled', async ({ bookingId }) => {
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) return;
    const refund = booking.cancellation?.refundAmount || 0;
    await sendMail({
      to: booking.contact.email,
      subject: `Booking cancelled - ${booking.reference}`,
      title: 'Your booking was cancelled',
      html: `<p>Booking <b>${booking.reference}</b> for ${escape(booking.destinationName)} has been cancelled.</p>
        <p>${refund > 0 ? `₹${refund.toLocaleString('en-IN')} has been refunded to your Roamly wallet.` : 'No refund applies under the cancellation policy.'}</p>`,
      cta: { label: 'View booking', url: `${env.PUBLIC_APP_URL}/account/bookings/${booking._id}` }
    });
  });

  events.on('agency:status', async ({ agencyId, status }) => {
    const agency = await Agency.findById(agencyId).lean();
    if (!agency) return;
    const approved = status === 'Active';
    await sendMail({
      to: agency.email,
      subject: approved ? 'Welcome to Roamly - your agency is approved' : `Your Roamly partner account is ${status.toLowerCase()}`,
      title: approved ? 'You are live on Roamly' : `Account ${status.toLowerCase()}`,
      html: approved
        ? `<p>${escape(agency.name)} can now publish listings${agency.cityName ? ` in ${escape(agency.cityName)}` : ''} and receive bookings.</p>`
        : `<p>${escape(agency.rejectionReason || 'Please contact partners@roamly.travel for details.')}</p>`,
      cta: { label: 'Open partner portal', url: `${env.PUBLIC_APP_URL}/agency` }
    });
  });
};

module.exports = { register };
