/**
 * Controller module for mail and system health endpoints.
 */

const mailService = require('../services/mail.service');

/**
 * Express handler for GET /api/unread
 * Serves cached unread mail information.
 * Supports optional `maxLength` query param for text truncation (e.g. ?maxLength=32).
 *
 * @param {import('express').Request} req Express request
 * @param {import('express').Response} res Express response
 */
function getUnreadStatus(req, res) {
  const maxLengthParam = req.query.maxLength ? parseInt(req.query.maxLength, 10) : undefined;
  const maxLength = !isNaN(maxLengthParam) && maxLengthParam > 0 ? maxLengthParam : undefined;

  const data = mailService.getState({ maxLength });
  res.json(data);
}

/**
 * Express handler for GET /api/health
 * Serves application health, uptime, and system status.
 *
 * @param {import('express').Request} req Express request
 * @param {import('express').Response} res Express response
 */
function getHealthStatus(req, res) {
  const currentState = mailService.getState();
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    status: currentState.status,
    unreadCount: currentState.count,
    lastChecked: currentState.lastChecked,
    memoryUsageMB: {
      rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getUnreadStatus,
  getHealthStatus,
};
