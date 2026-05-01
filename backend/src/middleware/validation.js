const { validationResult } = require('express-validator');

/**
 * Middleware: run after express-validator chains.
 * Returns 422 with field errors if validation fails.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = { validate };
