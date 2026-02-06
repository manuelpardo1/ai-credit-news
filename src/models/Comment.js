const { run, get, all } = require('../database/db');

class Comment {
  /**
   * Create a new comment
   */
  static async create({ articleId, userId, content, parentId = null }) {
    const result = await run(
      `INSERT INTO comments (article_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)`,
      [articleId, userId, parentId, content]
    );

    return this.findById(result.lastID);
  }

  /**
   * Find comment by ID
   */
  static async findById(id) {
    return get(`
      SELECT c.*, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ? AND c.is_deleted = 0
    `, [id]);
  }

  /**
   * Get comments for an article
   */
  static async getByArticle(articleId, { limit = 50, offset = 0 } = {}) {
    // Get top-level comments with reply counts
    const comments = await all(`
      SELECT
        c.*,
        u.name as user_name,
        (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id AND r.is_deleted = 0) as reply_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ? AND c.parent_id IS NULL AND c.is_deleted = 0
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [articleId, limit, offset]);

    return comments;
  }

  /**
   * Get replies to a comment
   */
  static async getReplies(parentId) {
    return all(`
      SELECT c.*, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = ? AND c.is_deleted = 0
      ORDER BY c.created_at ASC
    `, [parentId]);
  }

  /**
   * Update a comment
   */
  static async update(id, userId, content) {
    // Only allow update by the comment author
    const comment = await get('SELECT user_id FROM comments WHERE id = ?', [id]);
    if (!comment || comment.user_id !== userId) return null;

    await run(
      'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, id]
    );

    return this.findById(id);
  }

  /**
   * Soft delete a comment
   */
  static async delete(id, userId) {
    // Only allow delete by the comment author
    const comment = await get('SELECT user_id FROM comments WHERE id = ?', [id]);
    if (!comment || comment.user_id !== userId) return false;

    await run('UPDATE comments SET is_deleted = 1 WHERE id = ?', [id]);
    return true;
  }

  /**
   * Get comment count for an article
   */
  static async countByArticle(articleId) {
    const result = await get(
      'SELECT COUNT(*) as count FROM comments WHERE article_id = ? AND is_deleted = 0',
      [articleId]
    );
    return result.count;
  }

  /**
   * Get recent comments (for admin/moderation)
   */
  static async getRecent(limit = 20) {
    return all(`
      SELECT c.*, u.name as user_name, a.title as article_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN articles a ON c.article_id = a.id
      WHERE c.is_deleted = 0
      ORDER BY c.created_at DESC
      LIMIT ?
    `, [limit]);
  }

  /**
   * Get comments by user
   */
  static async getByUser(userId, limit = 20) {
    return all(`
      SELECT c.*, a.title as article_title
      FROM comments c
      JOIN articles a ON c.article_id = a.id
      WHERE c.user_id = ? AND c.is_deleted = 0
      ORDER BY c.created_at DESC
      LIMIT ?
    `, [userId, limit]);
  }
}

module.exports = Comment;
