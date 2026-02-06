/**
 * Initial Content Population Service
 *
 * Ensures each category has at least 5 articles:
 * - 2 from the last month (recent)
 * - 3 most relevant from the last 3 months
 */

const { all, get } = require('../database/db');
const { runScrape } = require('./scraper');
const { processPendingArticles } = require('./processor');

const ARTICLES_PER_CATEGORY = 5;
const RECENT_ARTICLES = 2;  // From last month
const RELEVANT_ARTICLES = 3; // Most relevant from last 3 months

/**
 * Check which categories need more articles
 */
async function getCategoryDeficits() {
  const categories = await all('SELECT id, name, slug FROM categories');
  const deficits = [];

  for (const category of categories) {
    const count = await get(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ? AND status = ?',
      [category.id, 'approved']
    );

    const deficit = ARTICLES_PER_CATEGORY - (count?.count || 0);
    if (deficit > 0) {
      deficits.push({
        ...category,
        currentCount: count?.count || 0,
        needed: deficit
      });
    }
  }

  return deficits;
}

/**
 * Process pending articles prioritizing by category needs
 * Prioritizes: recent articles (last month) first, then by relevance
 */
async function processForCategories(deficits, maxTotal = 30) {
  // Get all pending articles
  const pending = await all(`
    SELECT id, title, published_date, category_id
    FROM articles
    WHERE status = 'pending'
    ORDER BY published_date DESC
  `);

  if (pending.length === 0) {
    console.log('[INIT] No pending articles to process');
    return 0;
  }

  console.log(`[INIT] Found ${pending.length} pending articles`);

  // Track how many we need per category
  const categoryNeeds = {};
  deficits.forEach(d => {
    categoryNeeds[d.id] = { needed: d.needed, recent: RECENT_ARTICLES, relevant: RELEVANT_ARTICLES };
  });

  // Process up to maxTotal articles, prioritizing categories that need content
  let processed = 0;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Process articles - the AI will assign categories, then we check if they fill gaps
  const result = await processPendingArticles({ limit: maxTotal });

  return result.approved || 0;
}

/**
 * Main function: ensure minimum content per category
 */
async function ensureMinimumContent() {
  console.log('\n========================================');
  console.log('Initial Content Population');
  console.log('========================================');
  console.log(`Target: ${ARTICLES_PER_CATEGORY} articles per category`);
  console.log(`  - ${RECENT_ARTICLES} from last month`);
  console.log(`  - ${RELEVANT_ARTICLES} most relevant from last 3 months\n`);

  // Check current state
  const deficits = await getCategoryDeficits();

  if (deficits.length === 0) {
    console.log('[INIT] All categories have sufficient content!');
    return;
  }

  console.log('[INIT] Categories needing content:');
  deficits.forEach(d => {
    console.log(`  - ${d.name}: has ${d.currentCount}, needs ${d.needed} more`);
  });

  // Calculate total articles needed
  const totalNeeded = deficits.reduce((sum, d) => sum + d.needed, 0);
  console.log(`\n[INIT] Total articles needed: ${totalNeeded}`);

  // Run scrape to get fresh content
  console.log('\n[INIT] Running scrape to fetch articles...');
  await runScrape();

  // Process articles (will be categorized by AI)
  console.log('\n[INIT] Processing articles through AI...');
  const processed = await processForCategories(deficits, totalNeeded + 10); // +10 buffer for rejections

  console.log(`\n[INIT] Processed ${processed} articles`);

  // Check final state
  const finalDeficits = await getCategoryDeficits();
  if (finalDeficits.length === 0) {
    console.log('[INIT] All categories now have sufficient content!');
  } else {
    console.log('[INIT] Some categories still need content:');
    finalDeficits.forEach(d => {
      console.log(`  - ${d.name}: has ${d.currentCount}, needs ${d.needed} more`);
    });
    console.log('[INIT] More articles will be added in scheduled scrapes.');
  }

  console.log('\n========================================\n');
}

module.exports = {
  ensureMinimumContent,
  getCategoryDeficits,
  ARTICLES_PER_CATEGORY
};
