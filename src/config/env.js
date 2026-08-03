/**
 * Environment configuration module.
 * Loads environment variables using Node's native loadEnvFile and provides validated options.
 */

const { loadEnvFile } = require('node:process');

// Attempt to load .env file using native Node.js process capability
try {
  loadEnvFile();
} catch {
  // If .env file is missing or loaded via CLI argument --env-file, silently continue
}

/**
 * Validates essential environment variables required for IMAP connection.
 */
function validateEnv() {
  const missing = [];
  if (!process.env.IMAP_USER) missing.push('IMAP_USER');
  if (!process.env.IMAP_PASS) missing.push('IMAP_PASS');

  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  imapHost: process.env.IMAP_HOST || 'imap.gmail.com',
  imapPort: parseInt(process.env.IMAP_PORT || '993', 10),
  imapSecure: process.env.IMAP_SECURE !== 'false',
  imapUser: process.env.IMAP_USER || '',
  imapPass: process.env.IMAP_PASS || '',
  syncIntervalMs: parseInt(process.env.SYNC_INTERVAL_MS || '30000', 10),
};

module.exports = config;
