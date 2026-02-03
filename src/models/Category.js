const { run, get, all } = require('../database/db');

class Category {
  static async findAll() {
    return all('SELECT * FROM categories ORDER BY name');
  }

  static async findById(id) {
    return get('SELECT * FROM categories WHERE id = ?', [id]);
  }

  static async findBySlug(slug) {
    return get('SELECT * FROM categories WHERE slug = ?', [slug]);
  }

  static async getWithArticleCount() {
    const sql = `
      SELECT c.*, COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'approved'
      GROUP BY c.id
      ORDER BY c.name
    `;
    return all(sql);
  }

  static async create(category) {
    const sql = 'INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)';
    const result = await run(sql, [category.name, category.slug, category.description, category.icon]);
    return result.lastID;
  }
}

module.exports = Category;
