/**
 * Server Entrypoint
 */

const env = require('./config/env');
const app = require('./app');
const mailService = require('./services/mail.service');

// Run initial fetch immediately on startup
mailService.fetchLatestUnread();

// Schedule background polling at configured interval
const intervalId = setInterval(() => {
  mailService.fetchLatestUnread();
}, env.syncIntervalMs);

// Bind to 0.0.0.0 so server is accessible across the local network (ESP32 micro-controller pings)
const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`🚀 Beast Mode API running on http://0.0.0.0:${env.port}`);
  console.log(`👉 ESP32 endpoint: http://<YOUR_SERVER_IP>:${env.port}/api/unread`);
  console.log(`👉 Health check:   http://<YOUR_SERVER_IP>:${env.port}/api/health`);
});

/**
 * Handles graceful shutdown on SIGINT/SIGTERM.
 * @param {string} signal Triggering signal name
 */
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Received shutdown signal. Closing background timers and HTTP server...`);
  clearInterval(intervalId);

  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit if server hasn't closed within 5s
  setTimeout(() => {
    console.error('Forced shutdown timeout reached.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
