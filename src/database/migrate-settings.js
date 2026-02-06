/**
 * Migration: Create settings table
 */

const { run, get } = require('./db');

async function migrate() {
  console.log('Running settings migration...');

  // Create settings table
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Settings table created/verified');

  // Insert default values if not exist
  const defaults = {
    daily_min_articles: 5,
    daily_max_articles: 10,
    daily_max_ai_articles: 3,
    weekly_min_per_category: 5,
    scrape_max_age_hours: 24,
    articles_per_scrape: 5,
    auto_publish_hours: 48
  };

  for (const [key, value] of Object.entries(defaults)) {
    const existing = await get('SELECT key FROM settings WHERE key = ?', [key]);
    if (!existing) {
      await run(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
      console.log(`  Added default: ${key} = ${value}`);
    }
  }

  console.log('Settings migration complete');
}

migrate().catch(err => {
  console.error('Settings migration failed:', err);
  process.exit(1);
});
