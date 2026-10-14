const env = require('../config/env');

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message || 'Validation failed';
  } else if (err.message && err.message.startsWith('Origin ')) {
    statusCode = 403;
  }

  if (statusCode >= 500) {
    console.error(err);
    if (env.isProd) message = 'Internal server error';
  }

  res.status(statusCode).json({ success: false, message, ...(details ? { details } : {}) });
};

module.exports = { notFound, errorHandler };
