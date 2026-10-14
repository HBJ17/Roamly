const Notification = require('../models/Notification');

// Listeners (e.g. the realtime socket layer) can subscribe to new notifications.
const listeners = new Set();
const onNotification = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notify = async (recipientType, recipient, { title, message, type = 'system', linkUrl = '' }) => {
  const doc = await Notification.create({ recipientType, recipient, title, message, notificationType: type, linkUrl });
  listeners.forEach((fn) => {
    try {
      fn(doc);
    } catch (err) {
      console.error('[notify listener]', err.message);
    }
  });
  return doc;
};

const notifyUser = (userId, payload) => notify('user', userId, payload);
const notifyAgency = (agencyId, payload) => notify('agency', agencyId, payload);

module.exports = { notify, notifyUser, notifyAgency, onNotification };
