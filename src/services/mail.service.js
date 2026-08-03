/**
 * Mail Service Module
 * Handles background sync with Gmail IMAP and holds transient RAM state.
 */

const { ImapFlow } = require('imapflow');
const { getImapConfig } = require('../config/imap');

class MailService {
  constructor() {
    /**
     * @private
     */
    this.state = {
      latestSubject: 'Waiting for sync...',
      latestFrom: '',
      latestDate: null,
      unreadCount: 0,
      lastChecked: null,
      status: 'booting',
      lastError: null,
    };

    /**
     * Guard to prevent concurrent IMAP sync operations
     * @private
     */
    this.isFetching = false;
  }

  /**
   * Cleans text headers by removing unprintable line breaks and excessive whitespace.
   * @param {string} text Raw header text
   * @returns {string} Cleaned single-line string
   */
  sanitizeHeader(text) {
    if (!text) return '';
    return text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Formats sender envelope object into readable string e.g. "John Doe <john@example.com>"
   * @param {Array<{name?: string, address?: string}>} fromList Array of address objects
   * @returns {string} Formatted sender
   */
  formatFromHeader(fromList) {
    if (!Array.isArray(fromList) || fromList.length === 0) {
      return '';
    }
    const sender = fromList[0];
    if (sender.name && sender.address) {
      return `${this.sanitizeHeader(sender.name)} <${sender.address}>`;
    }
    return sender.name ? this.sanitizeHeader(sender.name) : sender.address || '';
  }

  /**
   * Fetches latest unread emails via IMAP and updates state cache.
   * Ensures single-execution at a time using an internal flag.
   */
  async fetchLatestUnread() {
    if (this.isFetching) {
      console.log(`[${new Date().toLocaleTimeString()}] Fetch skipped - sync already in progress.`);
      return;
    }

    this.isFetching = true;
    console.log(`[${new Date().toLocaleTimeString()}] Connecting to Gmail IMAP...`);

    const client = new ImapFlow(getImapConfig());

    try {
      await client.connect();

      const lock = await client.getMailboxLock('INBOX');
      try {
        const uids = await client.search({ seen: false });
        this.state.unreadCount = uids.length;

        if (uids.length === 0) {
          this.state.latestSubject = 'Inbox all clear! :)';
          this.state.latestFrom = '';
          this.state.latestDate = null;
          this.state.status = 'ok';
          this.state.lastError = null;
        } else {
          const latestUid = uids[uids.length - 1];
          const message = await client.fetchOne(latestUid, { envelope: true });

          if (message && message.envelope) {
            const rawSubject = message.envelope.subject || '(No Subject)';
            this.state.latestSubject = this.sanitizeHeader(rawSubject);
            this.state.latestFrom = this.formatFromHeader(message.envelope.from);
            this.state.latestDate = message.envelope.date ? new Date(message.envelope.date).toISOString() : null;
            this.state.status = 'ok';
            this.state.lastError = null;
          }
        }

        this.state.lastChecked = new Date().toISOString();
        console.log(`[Success] Synced. Unread count: ${this.state.unreadCount}`);
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error('[IMAP Error]:', err.message);
      this.state.status = 'error';
      this.state.lastError = err.message;
    } finally {
      this.isFetching = false;
      try {
        await client.logout();
      } catch {
        // Ignore logout errors on closed sockets
      }
    }
  }

  /**
   * Retrieves the current server state, optionally truncating strings for small micro-controller screens.
   * @param {Object} [options]
   * @param {number} [options.maxLength] Optional max string length for subject and sender (useful for OLED/LCD screens)
   * @returns {Object} State payload
   */
  getState(options = {}) {
    const { maxLength } = options;
    let subject = this.state.latestSubject;
    let from = this.state.latestFrom;

    if (maxLength && typeof maxLength === 'number' && maxLength > 0) {
      if (subject.length > maxLength) {
        subject = subject.substring(0, maxLength - 3) + '...';
      }
      if (from.length > maxLength) {
        from = from.substring(0, maxLength - 3) + '...';
      }
    }

    return {
      subject,
      from,
      date: this.state.latestDate,
      count: this.state.unreadCount,
      status: this.state.status,
      lastChecked: this.state.lastChecked,
      error: this.state.lastError,
    };
  }
}

// Export a singleton instance
module.exports = new MailService();
