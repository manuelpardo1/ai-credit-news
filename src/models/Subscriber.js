const crypto = require('crypto');
const { run, get, all } = require('../database/db');

class Subscriber {
  /**
   * Create a new subscriber
   */
  static async create(email, name = null) {
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    const result = await run(
      `INSERT INTO subscribers (email, name, unsubscribe_token)
       VALUES (?, ?, ?)`,
      [email.toLowerCase(), name, unsubscribeToken]
    );

    return {
      id: result.lastID,
      email: email.toLowerCase(),
      name,
      unsubscribe_token: unsubscribeToken,
      active: true
    };
  }

  /**
   * Find subscriber by email
   */
  static async findByEmail(email) {
    return get('SELECT * FROM subscribers WHERE email = ?', [email.toLowerCase()]);
  }

  /**
   * Find subscriber by unsubscribe token
   */
  static async findByToken(token) {
    return get('SELECT * FROM subscribers WHERE unsubscribe_token = ?', [token]);
  }

  /**
   * Find all active subscribers
   */
  static async findActive() {
    return all('SELECT * FROM subscribers WHERE active = 1 ORDER BY subscribed_at DESC');
  }

  /**
   * Find all subscribers
   */
  static async findAll({ active = null, limit = 100 } = {}) {
    let sql = 'SELECT * FROM subscribers';
    const params = [];

    if (active !== null) {
      sql += ' WHERE active = ?';
      params.push(active ? 1 : 0);
    }

    sql += ' ORDER BY subscribed_at DESC LIMIT ?';
    params.push(limit);

    return all(sql, params);
  }

  /**
   * Unsubscribe by token
   */
  static async unsubscribe(token) {
    const result = await run(
      'UPDATE subscribers SET active = 0 WHERE unsubscribe_token = ?',
      [token]
    );
    return result.changes > 0;
  }

  /**
   * Resubscribe by email
   */
  static async resubscribe(email) {
    const result = await run(
      'UPDATE subscribers SET active = 1 WHERE email = ?',
      [email.toLowerCase()]
    );
    return result.changes > 0;
  }

  /**
   * Count subscribers
   */
  static async count(active = null) {
    let sql = 'SELECT COUNT(*) as count FROM subscribers';
    const params = [];

    if (active !== null) {
      sql += ' WHERE active = ?';
      params.push(active ? 1 : 0);
    }

    const result = await get(sql, params);
    return result.count;
  }

  /**
   * Delete subscriber by email
   */
  static async delete(email) {
    return run('DELETE FROM subscribers WHERE email = ?', [email.toLowerCase()]);
  }
}

module.exports = Subscriber;
