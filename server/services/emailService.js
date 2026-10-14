/**
 * Transactional email. Uses SMTP when configured, otherwise prints the message to the console
 * so links (password reset, verification) can still be followed during development.
 */
const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
const smtpEnabled = () => Boolean(env.SMTP_HOST);

const getTransporter = () => {
  if (!transporter && smtpEnabled()) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
    });
  }
  return transporter;
};

const escape = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const layout = (title, bodyHtml, cta) => `
<div style="font-family:Arial,sans-serif;background:#faf7ee;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid #000;border-radius:12px;box-shadow:5px 5px 0 #000">
    <div style="background:#fef08a;border-bottom:2px solid #000;padding:16px 22px;font-weight:800;font-size:20px;letter-spacing:1px">ROAMLY</div>
    <div style="padding:22px">
      <h2 style="margin:0 0 12px;font-size:20px">${escape(title)}</h2>
      ${bodyHtml}
      ${cta ? `<p style="margin:22px 0"><a href="${cta.url}" style="background:#000;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">${escape(cta.label)}</a></p>` : ''}
    </div>
    <div style="border-top:1px solid #eee;padding:12px 22px;color:#64748b;font-size:12px">Roamly Travel &middot; South India, curated.</div>
  </div>
</div>`;

const sendMail = async ({ to, subject, title, html, text, cta, attachments }) => {
  const message = {
    from: env.MAIL_FROM,
    to,
    subject,
    html: layout(title || subject, html, cta),
    text: text || `${title || subject}\n\n${cta ? `${cta.label}: ${cta.url}` : ''}`,
    attachments
  };

  if (!smtpEnabled()) {
    if (!env.isTest) console.log(`[email] To: ${to} | ${subject}${cta ? ` | ${cta.label}: ${cta.url}` : ''}`);
    return { logged: true };
  }
  return getTransporter().sendMail(message);
};

module.exports = { sendMail, escape, smtpEnabled };
