const { run, get, all } = require('../database/db');

class NewsletterLog {
  /**
   * Create a new newsletter log entry
   */
  static async create({ editorial_id = null, recipient_count, type = 'weekly' }) {
    const result = await run(
      `INSERT INTO newsletter_logs (editorial_id, recipient_count, type)
       VALUES (?, ?, ?)`,
      [editorial_id, recipient_count, type]
    );

    return {
      id: result.lastID,
      editorial_id,
      recipient_count,
      type
    };
  }

  /**
   * Find recent newsletter logs
   */
  static async findRecent(limit = 10) {
    return all(
      `SELECT nl.*, e.title as editorial_title
       FROM newsletter_logs nl
       LEFT JOIN editorials e ON nl.editorial_id = e.id
       ORDER BY nl.sent_at DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Find newsletter log by ID
   */
  static async findById(id) {
    return get(
      `SELECT nl.*, e.title as editorial_title
       FROM newsletter_logs nl
       LEFT JOIN editorials e ON nl.editorial_id = e.id
       WHERE nl.id = ?`,
      [id]
    );
  }

  /**
   * Get total emails sent
   */
  static async getTotalSent() {
    const result = await get(
      'SELECT SUM(recipient_count) as total FROM newsletter_logs'
    );
    return result.total || 0;
  }

  /**
   * Get newsletter count by type
   */
  static async countByType(type) {
    const result = await get(
      'SELECT COUNT(*) as count FROM newsletter_logs WHERE type = ?',
      [type]
    );
    return result.count;
  }

  /**
   * Find last newsletter sent
   */
  static async findLast() {
    return get(
      `SELECT nl.*, e.title as editorial_title
       FROM newsletter_logs nl
       LEFT JOIN editorials e ON nl.editorial_id = e.id
       ORDER BY nl.sent_at DESC
       LIMIT 1`
    );
  }
}

module.exports = NewsletterLog;
