/**
 * Socket.IO layer: each signed-in browser joins a private room ("user:<id>", "agency:<id>", "admin:<id>")
 * and receives notifications and chat messages as they happen.
 */
const { Server } = require('socket.io');
const cookie = require('cookie');
const env = require('../config/env');
const { COOKIE_NAME } = require('../middleware/auth');
const { onNotification } = require('./notificationService');

let io = null;

const roomFor = (role, id) => `${role}:${id}`;

const init = (httpServer) => {
  // Resolved lazily to avoid a require cycle with the auth middleware.
  const { resolveAccount } = require('../middleware/auth');

  io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: env.CLIENT_URLS, credentials: true }
  });

  io.use(async (socket, next) => {
    try {
      const token = cookie.parse(socket.handshake.headers.cookie || '')[COOKIE_NAME];
      const resolved = token && (await resolveAccount(token));
      if (!resolved) return next(new Error('unauthorized'));
      socket.data.role = resolved.role;
      socket.data.id = String(resolved.account._id);
      return next();
    } catch (err) {
      return next(err);
    }
  });

  io.on('connection', (socket) => {
    socket.join(roomFor(socket.data.role, socket.data.id));
  });

  onNotification((doc) => emitTo(doc.recipientType, doc.recipient, 'notification', doc));
  return io;
};

const emitTo = (role, id, event, payload) => {
  if (io) io.to(roomFor(role, String(id))).emit(event, payload);
};

module.exports = { init, emitTo };
