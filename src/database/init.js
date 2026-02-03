const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../', process.env.DATABASE_PATH || './database/news.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('Initializing database at:', dbPath);

const db = new sqlite3.Database(dbPath);

const schema = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT
);

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT,
  rss_feed TEXT,
  scrape_selector TEXT,
  active BOOLEAN DEFAULT 1,
  last_scraped DATETIME
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  author TEXT,
  published_date DATE,
  scraped_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  content TEXT,
  summary TEXT,
  relevance_score FLOAT,
  difficulty_level TEXT,
  category_id INTEGER,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Article_Tags junction table
CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER,
  tag_id INTEGER,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date);
CREATE INDEX IF NOT EXISTS idx_articles_relevance ON articles(relevance_score);
CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(active);
`;

db.serialize(() => {
  const statements = schema.split(';').filter(s => s.trim());

  statements.forEach((statement) => {
    if (statement.trim()) {
      db.run(statement + ';', (err) => {
        if (err) {
          console.error('Error executing:', statement.substring(0, 50) + '...');
          console.error(err.message);
        }
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database initialized successfully!');
  }
});
