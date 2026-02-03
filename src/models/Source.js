const { run, get, all } = require('../database/db');

class Source {
  static async findAll() {
    return all('SELECT * FROM sources ORDER BY name');
  }

  static async findActive() {
    return all('SELECT * FROM sources WHERE active = 1 ORDER BY name');
  }

  static async findById(id) {
    return get('SELECT * FROM sources WHERE id = ?', [id]);
  }

  static async create(source) {
    const sql = 'INSERT INTO sources (name, url, rss_feed, scrape_selector, active) VALUES (?, ?, ?, ?, ?)';
    const result = await run(sql, [
      source.name,
      source.url,
      source.rss_feed,
      source.scrape_selector || null,
      source.active !== undefined ? source.active : 1
    ]);
    return result.lastID;
  }

  static async updateLastScraped(id) {
    return run('UPDATE sources SET last_scraped = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  static async setActive(id, active) {
    return run('UPDATE sources SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  }
}

module.exports = Source;
