const { run, get, all } = require('../database/db');

class Editorial {
  /**
   * Create a new editorial
   */
  static async create({ title, content, week_start, week_end }) {
    const result = await run(
      `INSERT INTO editorials (title, content, week_start, week_end, status, ai_generated_at)
       VALUES (?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP)`,
      [title, content, week_start, week_end]
    );
    return { id: result.lastID, title, content, week_start, week_end, status: 'draft' };
  }

  /**
   * Find editorial by ID
   */
  static async findById(id) {
    return get('SELECT * FROM editorials WHERE id = ?', [id]);
  }

  /**
   * Find the latest published editorial
   */
  static async findLatestPublished() {
    return get(
      'SELECT * FROM editorials WHERE status = ? ORDER BY published_at DESC LIMIT 1',
      ['published']
    );
  }

  /**
   * Find all editorials with optional filters
   */
  static async findAll({ status, limit = 20 } = {}) {
    let sql = 'SELECT * FROM editorials';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return all(sql, params);
  }

  /**
   * Find editorial by week
   */
  static async findByWeek(weekStart) {
    return get('SELECT * FROM editorials WHERE week_start = ?', [weekStart]);
  }

  /**
   * Update editorial
   */
  static async update(id, { title, content }) {
    await run(
      'UPDATE editorials SET title = ?, content = ? WHERE id = ?',
      [title, content, id]
    );
    return this.findById(id);
  }

  /**
   * Publish editorial
   */
  static async publish(id) {
    await run(
      `UPDATE editorials SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  }

  /**
   * Delete editorial
   */
  static async delete(id) {
    return run('DELETE FROM editorials WHERE id = ?', [id]);
  }

  /**
   * Count editorials by status
   */
  static async count(status = null) {
    let sql = 'SELECT COUNT(*) as count FROM editorials';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    const result = await get(sql, params);
    return result.count;
  }
}

module.exports = Editorial;
