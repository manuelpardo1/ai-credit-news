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

  /**
   * Find category by slug with fuzzy matching
   * Handles partial matches, similar slugs, and common variations
   */
  static async findBySlugFuzzy(slug) {
    if (!slug) return null;

    // First try exact match
    const exact = await this.findBySlug(slug);
    if (exact) return exact;

    // Normalize the slug
    const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Try normalized match
    const normalizedMatch = await get('SELECT * FROM categories WHERE slug = ?', [normalized]);
    if (normalizedMatch) return normalizedMatch;

    // Get all categories for fuzzy matching
    const categories = await this.findAll();

    // Try partial matching (contains)
    for (const cat of categories) {
      const catSlugNorm = cat.slug.toLowerCase();
      const searchNorm = normalized.toLowerCase();

      // Check if one contains the other
      if (catSlugNorm.includes(searchNorm) || searchNorm.includes(catSlugNorm)) {
        return cat;
      }

      // Check word overlap
      const catWords = catSlugNorm.split('-');
      const searchWords = searchNorm.split('-');
      const overlap = catWords.filter(w => searchWords.includes(w));
      if (overlap.length > 0) {
        return cat;
      }
    }

    return null;
  }

  /**
   * Get the default category (first one in the list)
   */
  static async getDefault() {
    return get('SELECT * FROM categories ORDER BY id LIMIT 1');
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

  /**
   * Get or create category by slug
   * Creates with a generic name if not found
   */
  static async findOrCreate(slug, defaultName = null) {
    let category = await this.findBySlugFuzzy(slug);
    if (category) return category;

    // Create new category with the slug
    const name = defaultName || slug.split('-').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');

    const id = await this.create({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: `Articles about ${name}`,
      icon: '📰'
    });

    return this.findById(id);
  }
}

module.exports = Category;
