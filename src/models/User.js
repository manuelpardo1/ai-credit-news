const { run, get, all } = require('../database/db');
const crypto = require('crypto');

class User {
  /**
   * Hash a password using PBKDF2
   */
  static hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify a password against a hash
   */
  static verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Create a new user
   */
  static async create({ email, password, name }) {
    const passwordHash = this.hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await run(
      `INSERT INTO users (email, password_hash, name, verification_token) VALUES (?, ?, ?, ?)`,
      [email.toLowerCase(), passwordHash, name, verificationToken]
    );

    return {
      id: result.lastID,
      email: email.toLowerCase(),
      name,
      verificationToken
    };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    return get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    return get('SELECT id, email, name, created_at, last_login, is_active, email_verified FROM users WHERE id = ?', [id]);
  }

  /**
   * Authenticate user
   */
  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user || !user.is_active) return null;

    if (this.verifyPassword(password, user.password_hash)) {
      // Update last login
      await run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified
      };
    }

    return null;
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token) {
    const user = await get('SELECT id FROM users WHERE verification_token = ?', [token]);
    if (!user) return false;

    await run('UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?', [user.id]);
    return true;
  }

  /**
   * Generate password reset token
   */
  static async generateResetToken(email) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await run(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, expires, user.id]
    );

    return resetToken;
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPassword) {
    const user = await get(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > CURRENT_TIMESTAMP',
      [token]
    );

    if (!user) return false;

    const passwordHash = this.hashPassword(newPassword);
    await run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    return true;
  }

  /**
   * Update user profile
   */
  static async update(id, { name }) {
    await run('UPDATE users SET name = ? WHERE id = ?', [name, id]);
    return this.findById(id);
  }

  /**
   * Get user's saved articles
   */
  static async getSavedArticles(userId) {
    return all(`
      SELECT a.*, c.name as category_name, c.slug as category_slug, sa.saved_at
      FROM saved_articles sa
      JOIN articles a ON sa.article_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE sa.user_id = ?
      ORDER BY sa.saved_at DESC
    `, [userId]);
  }

  /**
   * Save an article
   */
  static async saveArticle(userId, articleId) {
    try {
      await run(
        'INSERT OR IGNORE INTO saved_articles (user_id, article_id) VALUES (?, ?)',
        [userId, articleId]
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Unsave an article
   */
  static async unsaveArticle(userId, articleId) {
    await run('DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?', [userId, articleId]);
    return true;
  }

  /**
   * Check if article is saved
   */
  static async isArticleSaved(userId, articleId) {
    const result = await get(
      'SELECT 1 FROM saved_articles WHERE user_id = ? AND article_id = ?',
      [userId, articleId]
    );
    return !!result;
  }

  /**
   * Get user count
   */
  static async count() {
    const result = await get('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    return result.count;
  }
}

module.exports = User;
