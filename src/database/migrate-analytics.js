const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, get, all } = require('./db');

async function migrateAnalytics() {
  console.log('Adding analytics tables...');

  try {
    // Article views table - tracks individual page views
    await run(`
      CREATE TABLE IF NOT EXISTS article_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_id TEXT,
        user_agent TEXT,
        referrer TEXT,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✓ Created article_views table');

    // Daily stats table - aggregated daily statistics
    await run(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        total_views INTEGER DEFAULT 0,
        unique_sessions INTEGER DEFAULT 0,
        articles_scraped INTEGER DEFAULT 0,
        articles_approved INTEGER DEFAULT 0,
        articles_rejected INTEGER DEFAULT 0,
        new_subscribers INTEGER DEFAULT 0,
        unsubscribes INTEGER DEFAULT 0
      )
    `);
    console.log('  ✓ Created daily_stats table');

    // Add view_count column to articles if not exists
    const articleColumns = await all("PRAGMA table_info(articles)");
    const hasViewCount = articleColumns.some(col => col.name === 'view_count');

    if (!hasViewCount) {
      await run('ALTER TABLE articles ADD COLUMN view_count INTEGER DEFAULT 0');
      console.log('  ✓ Added view_count to articles table');
    } else {
      console.log('  - view_count already exists');
    }

    // Create indexes for performance
    await run('CREATE INDEX IF NOT EXISTS idx_article_views_article ON article_views(article_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_article_views_date ON article_views(viewed_at)');
    await run('CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date)');
    console.log('  ✓ Created indexes');

    console.log('\nAnalytics migration complete!');

  } catch (err) {
    console.error('Migration error:', err.message);
  }

  process.exit(0);
}

migrateAnalytics();
