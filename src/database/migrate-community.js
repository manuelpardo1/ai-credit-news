const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, get, all } = require('./db');

async function migrateCommunity() {
  console.log('Adding community features tables...');

  try {
    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        email_verified BOOLEAN DEFAULT 0,
        verification_token TEXT,
        reset_token TEXT,
        reset_token_expires DATETIME
      )
    `);
    console.log('  ✓ Created users table');

    // Saved articles (bookmarks)
    await run(`
      CREATE TABLE IF NOT EXISTS saved_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        article_id INTEGER NOT NULL,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        UNIQUE(user_id, article_id)
      )
    `);
    console.log('  ✓ Created saved_articles table');

    // Article feedback (helpful/not helpful)
    await run(`
      CREATE TABLE IF NOT EXISTS article_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        user_id INTEGER,
        session_id TEXT,
        is_helpful BOOLEAN NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ Created article_feedback table');

    // Comments
    await run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        is_deleted BOOLEAN DEFAULT 0,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✓ Created comments table');

    // Add feedback counts to articles
    const articleColumns = await all("PRAGMA table_info(articles)");
    const hasHelpfulCount = articleColumns.some(col => col.name === 'helpful_count');

    if (!hasHelpfulCount) {
      await run('ALTER TABLE articles ADD COLUMN helpful_count INTEGER DEFAULT 0');
      await run('ALTER TABLE articles ADD COLUMN not_helpful_count INTEGER DEFAULT 0');
      console.log('  ✓ Added feedback counts to articles table');
    } else {
      console.log('  - Feedback counts already exist');
    }

    // Create indexes
    await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await run('CREATE INDEX IF NOT EXISTS idx_saved_articles_user ON saved_articles(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_article_feedback_article ON article_feedback(article_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id)');
    console.log('  ✓ Created indexes');

    console.log('\nCommunity migration complete!');

  } catch (err) {
    console.error('Migration error:', err.message);
  }

  process.exit(0);
}

migrateCommunity();
