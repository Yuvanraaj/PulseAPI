const logger = require('../utils/logger');

/**
 * Central error handling middleware.
 */
function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path });

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
