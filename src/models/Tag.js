const { run, get, all } = require('../database/db');

class Tag {
  static async findAll() {
    return all('SELECT * FROM tags ORDER BY name');
  }

  static async findById(id) {
    return get('SELECT * FROM tags WHERE id = ?', [id]);
  }

  static async findByName(name) {
    return get('SELECT * FROM tags WHERE name = ?', [name]);
  }

  static async findOrCreate(name) {
    let tag = await this.findByName(name);
    if (!tag) {
      const result = await run('INSERT INTO tags (name) VALUES (?)', [name]);
      tag = { id: result.lastID, name };
    }
    return tag;
  }

  static async getWithArticleCount() {
    const sql = `
      SELECT t.*, COUNT(at.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      LEFT JOIN articles a ON at.article_id = a.id AND a.status = 'approved'
      GROUP BY t.id
      ORDER BY article_count DESC, t.name
    `;
    return all(sql);
  }

  static async getArticlesByTag(tagName, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      JOIN article_tags at ON a.id = at.article_id
      JOIN tags t ON at.tag_id = t.id
      WHERE t.name = ? AND a.status = 'approved'
      ORDER BY a.published_date DESC
      LIMIT ? OFFSET ?
    `;
    return all(sql, [tagName, limit, offset]);
  }
}

module.exports = Tag;
