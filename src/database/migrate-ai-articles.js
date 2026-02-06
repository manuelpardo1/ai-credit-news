/**
 * Migration: Add AI-generated articles support
 * - Adds is_ai_generated column to articles table
 * - Adds 'review' as valid status for articles pending admin review
 *
 * Safe to run multiple times - checks if migration is needed first.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, get, close } = require('./db');

async function migrate() {
  console.log('[MIGRATE] Checking AI articles support...');

  try {
    // Check if is_ai_generated column exists
    const tableInfo = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='articles'");

    if (!tableInfo) {
      console.log('[MIGRATE] Articles table not found. Skipping.');
      return;
    }

    if (tableInfo.sql.includes('is_ai_generated')) {
      console.log('[MIGRATE] is_ai_generated column already exists. Skipping.');
      return;
    }

    console.log('[MIGRATE] Adding is_ai_generated column...');

    // Add is_ai_generated column
    await run('ALTER TABLE articles ADD COLUMN is_ai_generated BOOLEAN DEFAULT 0');
    console.log('[MIGRATE] Added is_ai_generated column');

    console.log('[MIGRATE] AI articles migration complete!');

  } catch (err) {
    // Column might already exist - SQLite doesn't support IF NOT EXISTS for columns
    if (err.message.includes('duplicate column')) {
      console.log('[MIGRATE] is_ai_generated column already exists. Skipping.');
    } else {
      console.error('[MIGRATE] Error during AI articles migration:', err.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
    .then(() => close())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrate };
