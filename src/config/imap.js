/**
 * IMAP Client Configuration Module
 */

const env = require('./env');

/**
 * Returns ImapFlow connection configuration options.
 * @returns {import('imapflow').ImapFlowOptions} Configuration object for ImapFlow client
 */
function getImapConfig() {
  return {
    host: env.imapHost,
    port: env.imapPort,
    secure: env.imapSecure,
    auth: {
      user: env.imapUser,
      pass: env.imapPass,
    },
    logger: false,
    emitLogs: false,
  };
}

module.exports = {
  getImapConfig,
};
