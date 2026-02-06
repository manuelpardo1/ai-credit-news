/**
 * Migration: Consolidate categories
 * - Removes "Credit Risk" category (id: 3)
 * - Moves any articles from Credit Risk to Credit Scoring (id: 1)
 *
 * Safe to run multiple times - checks if migration is needed first.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, get, close } = require('./db');

async function migrate() {
  console.log('[MIGRATE] Checking category consolidation...');

  try {
    // Check if Credit Risk category exists
    const creditRisk = await get("SELECT id FROM categories WHERE slug = 'credit-risk'");

    if (!creditRisk) {
      console.log('[MIGRATE] Credit Risk category already removed. Skipping.');
      return;
    }

    console.log('[MIGRATE] Found Credit Risk category (id: ' + creditRisk.id + '). Consolidating...');

    // Move any articles from Credit Risk to Credit Scoring
    const result = await run(
      'UPDATE articles SET category_id = 1 WHERE category_id = ?',
      [creditRisk.id]
    );
    console.log(`[MIGRATE] Moved ${result.changes || 0} articles to Credit Scoring`);

    // Delete the Credit Risk category
    await run('DELETE FROM categories WHERE id = ?', [creditRisk.id]);
    console.log('[MIGRATE] Deleted Credit Risk category');

    console.log('[MIGRATE] Category consolidation complete!');

  } catch (err) {
    console.error('[MIGRATE] Error during category consolidation:', err.message);
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
