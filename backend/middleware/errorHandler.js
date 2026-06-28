/**
 * errorHandler.js — Centralised Express error handling middleware.
 */

const { NODE_ENV } = require('../config/config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);
  if (NODE_ENV === 'development') console.error(err.stack);

  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred.',
      ...(NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
