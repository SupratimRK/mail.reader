/**
 * API Key Authentication Middleware
 */

const env = require('../config/env');

/**
 * Express middleware to validate incoming requests against the configured API_KEY.
 * Accepts API key via:
 * 1. `x-api-key` HTTP Header
 * 2. `Authorization: Bearer <KEY>` HTTP Header
 * 3. `apiKey` query parameter (convenient for microcontroller HTTP pings)
 *
 * @param {import('express').Request} req Express request
 * @param {import('express').Response} res Express response
 * @param {import('express').NextFunction} next Express next function
 */
function requireApiKey(req, res, next) {
  const configuredKey = env.apiKey;

  // If no API_KEY is set in environment, allow requests with a warning (or enforce if desired)
  if (!configuredKey) {
    return next();
  }

  // Extract key from header or query param
  const headerKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  const bearerKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const queryKey = req.query.apiKey;

  const providedKey = headerKey || bearerKey || queryKey;

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key.',
    });
  }

  return next();
}

module.exports = {
  requireApiKey,
};
