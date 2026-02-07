const { run, get, all } = require('../database/db');

class Article {
  static async create(article) {
    const sql = `
      INSERT INTO articles (title, url, source, author, published_date, content, summary, relevance_score, difficulty_level, category_id, status, language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await run(sql, [
      article.title,
      article.url,
      article.source,
      article.author || null,
      article.published_date || null,
      article.content || null,
      article.summary || null,
      article.relevance_score || null,
      article.difficulty_level || null,
      article.category_id || null,
      article.status || 'pending',
      article.language || 'en'
    ]);
    return result.lastID;
  }

  static async findById(id) {
    const sql = `
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `;
    return get(sql, [id]);
  }

  static async findByUrl(url) {
    return get('SELECT * FROM articles WHERE url = ?', [url]);
  }

  static async findAll({ page = 1, limit = 20, category, difficulty, status = 'approved', language } = {}) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }

    if (difficulty) {
      sql += ' AND a.difficulty_level = ?';
      params.push(difficulty);
    }

    if (language) {
      sql += ' AND a.language = ?';
      params.push(language);
    }

    sql += ' ORDER BY a.published_date DESC, a.scraped_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return all(sql, params);
  }

  static async getLatest(limit = 10, offset = 0) {
    const sql = `
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'approved'
      ORDER BY a.published_date DESC, a.scraped_date DESC
      LIMIT ? OFFSET ?
    `;
    return all(sql, [limit, offset]);
  }

  static async search(query, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;
    const sql = `
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE (a.title LIKE ? OR a.content LIKE ? OR a.summary LIKE ?)
      AND a.status = 'approved'
      ORDER BY a.published_date DESC
      LIMIT ? OFFSET ?
    `;
    return all(sql, [searchTerm, searchTerm, searchTerm, limit, offset]);
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    values.push(id);
    const sql = `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`;
    return run(sql, values);
  }

  static async count({ category, status = 'approved' } = {}) {
    let sql = 'SELECT COUNT(*) as count FROM articles a';
    const params = [];

    if (category) {
      sql += ' LEFT JOIN categories c ON a.category_id = c.id WHERE c.slug = ?';
      params.push(category);
      if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
      }
    } else if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    const result = await get(sql, params);
    return result.count;
  }

  static async addTags(articleId, tagIds) {
    for (const tagId of tagIds) {
      await run(
        'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
        [articleId, tagId]
      );
    }
  }

  static async getTags(articleId) {
    return all(`
      SELECT t.* FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ?
    `, [articleId]);
  }

  static async delete(id) {
    // Delete associated tags first
    await run('DELETE FROM article_tags WHERE article_id = ?', [id]);
    // Delete the article
    return run('DELETE FROM articles WHERE id = ?', [id]);
  }

  /**
   * Count articles by a specific status
   * @param {string} status - Article status to count
   * @returns {Promise<number>}
   */
  static async countByStatus(status) {
    const result = await get(
      'SELECT COUNT(*) as count FROM articles WHERE status = ?',
      [status]
    );
    return result.count;
  }

  /**
   * Update status for multiple articles at once
   * @param {number[]} ids - Array of article IDs
   * @param {string} newStatus - Target status
   * @returns {Promise<number>} Number of updated articles
   */
  static async bulkUpdateStatus(ids, newStatus) {
    if (!ids || ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const result = await run(
      `UPDATE articles SET status = ? WHERE id IN (${placeholders})`,
      [newStatus, ...ids]
    );
    return result.changes;
  }

  /**
   * Get all queued articles with category info, sorted by relevance
   * @returns {Promise<Array>}
   */
  static async findAllQueued() {
    return all(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'queued'
      ORDER BY a.relevance_score DESC, a.scraped_date DESC
    `);
  }
}

module.exports = Article;
