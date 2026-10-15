/**
 * Booking documents: a signed QR voucher partners can scan at check-in, and a PDF tax invoice.
 */
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const env = require('../config/env');

const sign = (reference, bookingId) =>
  crypto.createHmac('sha256', env.JWT_SECRET).update(`${reference}|${bookingId}`).digest('hex').slice(0, 16);

// Voucher code format: ROAMLY|<reference>|<bookingId>|<signature>
const voucherCode = (booking) => `ROAMLY|${booking.reference}|${booking._id}|${sign(booking.reference, booking._id)}`;

const parseVoucherCode = (code = '') => {
  const [brand, reference, bookingId, signature] = String(code).trim().split('|');
  if (brand !== 'ROAMLY' || !reference || !bookingId || !signature) return null;
  const expected = sign(reference, bookingId);
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  return { reference, bookingId };
};

const voucherQrDataUrl = (booking) => QRCode.toDataURL(voucherCode(booking), { margin: 1, width: 260 });

const inr = (n) => `INR ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** Streams a PDF invoice for a confirmed booking into `stream`. */
const writeInvoicePdf = async (stream, { booking, invoice, user }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(stream);

  doc.rect(0, 0, doc.page.width, 70).fill('#fef08a');
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(24).text('ROAMLY', 48, 24);
  doc.font('Helvetica').fontSize(10).text('Tax Invoice', 0, 32, { align: 'right', width: doc.page.width - 48 });

  doc.moveDown(3).fontSize(10);
  const top = 100;
  doc.font('Helvetica-Bold').text('Billed to', 48, top);
  doc.font('Helvetica').text(booking.contact?.name || user.fullName || user.username, 48, top + 14)
    .text(booking.contact?.email || user.email)
    .text(booking.contact?.phone || '');

  doc.font('Helvetica-Bold').text('Invoice', 330, top);
  doc.font('Helvetica')
    .text(`Number: ${invoice.invoiceNumber}`, 330, top + 14)
    .text(`Date: ${invoice.createdAt.toISOString().slice(0, 10)}`)
    .text(`Booking: ${booking.reference}`)
    .text(`Trip: ${booking.destinationName}, ${booking.startDate} to ${booking.endDate}`);

  let y = 200;
  doc.moveTo(48, y).lineTo(547, y).stroke();
  doc.font('Helvetica-Bold').text('Description', 48, y + 8).text('Qty', 340, y + 8).text('Rate', 390, y + 8).text('Amount', 470, y + 8);
  y += 28;
  doc.font('Helvetica');
  invoice.lines.forEach((line) => {
    const h = doc.heightOfString(line.description, { width: 280 });
    doc.text(line.description, 48, y, { width: 280 })
      .text(`${line.quantity} x ${line.units}`, 340, y)
      .text(inr(line.unitPrice), 390, y)
      .text(inr(line.amount), 470, y);
    y += Math.max(h, 14) + 8;
  });

  doc.moveTo(48, y).lineTo(547, y).stroke();
  y += 10;
  const row = (label, value, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').text(label, 340, y).text(value, 470, y);
    y += 16;
  };
  row('Subtotal', inr(invoice.subtotal));
  if (invoice.discount) row('Discounts', `- ${inr(invoice.discount)}`);
  row(`GST (${invoice.taxPercent}%)`, inr(invoice.taxAmount));
  row('Total paid', inr(invoice.totalAmount), true);
  if (invoice.refundedAmount) row('Refunded', `- ${inr(invoice.refundedAmount)}`);

  const qr = await QRCode.toBuffer(voucherCode(booking), { margin: 1, width: 140 });
  doc.image(qr, 48, y + 20, { width: 110 });
  doc.fontSize(9).fillColor('#475569')
    .text('Show this code to your hotel, driver or tour host at check-in.', 170, y + 40, { width: 300 })
    .text('Roamly Travel - South India, curated.', 170, y + 58);

  doc.end();
};

module.exports = { voucherCode, parseVoucherCode, voucherQrDataUrl, writeInvoicePdf };
