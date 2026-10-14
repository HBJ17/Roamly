const { EventEmitter } = require('events');

// Domain events ('booking:confirmed', 'booking:cancelled', 'agency:approved', ...) for side effects like email.
const events = new EventEmitter();
events.setMaxListeners(50);

const emitSafe = (name, payload) => {
  // Listeners run after the request finishes; their failures must never break it.
  setImmediate(() => {
    for (const listener of events.listeners(name)) {
      Promise.resolve()
        .then(() => listener(payload))
        .catch((err) => console.error(`[event ${name}]`, err.message));
    }
  });
};

module.exports = { events, emitSafe };
