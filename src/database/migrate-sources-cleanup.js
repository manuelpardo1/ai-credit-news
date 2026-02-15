const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, all, close } = require('./db');

// The definitive list of active sources for AI Credit News.
// These are the RSS feeds that consistently produce articles about
// AI + credit risk, lending, fraud detection, and financial services.
const activeSources = [
  // Tier 1 — Core: high relevance to AI + credit/lending
  { name: 'Bank Automation News', rss_feed: 'https://bankautomationnews.com/feed/', language: 'en' },
  { name: 'Finextra', rss_feed: 'https://www.finextra.com/rss/headlines.aspx', language: 'en' },
  { name: 'American Banker', rss_feed: 'https://www.americanbanker.com/feed', language: 'en' },
  { name: 'Banking Dive', rss_feed: 'https://www.bankingdive.com/feeds/news/', language: 'en' },
  { name: 'PYMNTS', rss_feed: 'https://www.pymnts.com/feed/', language: 'en' },
  { name: 'Experian Insights', rss_feed: 'https://www.experian.com/blogs/insights/feed/', language: 'en' },
  { name: 'FICO Blog', rss_feed: 'https://www.fico.com/blogs/feed/', language: 'en' },
  { name: 'Equifax Insights', rss_feed: 'https://www.equifax.com/insights/feed/', language: 'en' },
  { name: 'TransUnion Blog', rss_feed: 'https://www.transunion.com/blog/rss', language: 'en' },
  { name: 'Finovate', rss_feed: 'https://finovate.com/feed/', language: 'en' },
  { name: 'Risk.net', rss_feed: 'https://www.risk.net/rss/risk-management', language: 'en' },
  { name: 'Plaid Blog', rss_feed: 'https://plaid.com/blog/feed/', language: 'en' },
  { name: 'ABA Banking Journal', rss_feed: 'https://bankingjournal.aba.com/feed/', language: 'en' },
  { name: 'PaymentsJournal', rss_feed: 'https://paymentsjournal.com/feed/', language: 'en' },
  { name: 'Fintech Futures', rss_feed: 'https://www.fintechfutures.com/feed/', language: 'en' },
  { name: 'FinAi News', rss_feed: 'https://finainews.com/feed/', language: 'en' },

  // Tier 2 — Broader fintech/AI with moderate hit rate
  { name: 'The Financial Brand', rss_feed: 'https://thefinancialbrand.com/feed/', language: 'en' },
  { name: 'The Fintech Times', rss_feed: 'https://thefintechtimes.com/feed/', language: 'en' },
  { name: 'CB Insights', rss_feed: 'https://www.cbinsights.com/research/feed/', language: 'en' },
  { name: 'TechCrunch Fintech', rss_feed: 'https://techcrunch.com/category/fintech/feed/', language: 'en' },
  { name: 'McKinsey Financial Services', rss_feed: 'https://www.mckinsey.com/industries/financial-services/our-insights/rss.xml', language: 'en' },
  { name: 'Payments Dive', rss_feed: 'https://www.paymentsdive.com/feeds/news/', language: 'en' },
  { name: 'FF News (Fintech Finance)', rss_feed: 'https://ffnews.com/feed/', language: 'en' },
];

async function cleanupSources() {
  console.log('=== Source Cleanup Migration ===\n');

  try {
    // Step 1: Count current state
    const totalBefore = await all('SELECT COUNT(*) as count FROM sources');
    const activeBefore = await all('SELECT COUNT(*) as count FROM sources WHERE active = 1');
    console.log(`Before: ${totalBefore[0].count} total sources, ${activeBefore[0].count} active`);

    // Step 2: Deduplicate — keep lowest ID per unique rss_feed
    const duplicates = await all(`
      SELECT id, name, rss_feed FROM sources
      WHERE rss_feed IS NOT NULL
        AND id NOT IN (
          SELECT MIN(id) FROM sources WHERE rss_feed IS NOT NULL GROUP BY rss_feed
        )
    `);

    if (duplicates.length > 0) {
      console.log(`\nRemoving ${duplicates.length} duplicate sources...`);
      for (const dup of duplicates) {
        await run('DELETE FROM sources WHERE id = ?', [dup.id]);
      }
      console.log('  Duplicates removed.');
    } else {
      console.log('\nNo duplicates found.');
    }

    // Step 3: Deactivate ALL sources first
    await run('UPDATE sources SET active = 0');
    console.log('\nDeactivated all sources.');

    // Step 4: Activate only the curated list (match by rss_feed URL)
    let activated = 0;
    let notFound = [];
    for (const source of activeSources) {
      const result = await all('SELECT id FROM sources WHERE rss_feed = ?', [source.rss_feed]);
      if (result.length > 0) {
        await run('UPDATE sources SET active = 1 WHERE id = ?', [result[0].id]);
        activated++;
      } else {
        // Source not in DB yet — insert it
        await run(
          'INSERT INTO sources (name, url, rss_feed, active, language) VALUES (?, ?, ?, 1, ?)',
          [source.name, '', source.rss_feed, source.language]
        );
        activated++;
        notFound.push(source.name);
      }
    }

    if (notFound.length > 0) {
      console.log(`\nInserted ${notFound.length} new sources: ${notFound.join(', ')}`);
    }

    // Step 5: Report final state
    const totalAfter = await all('SELECT COUNT(*) as count FROM sources');
    const activeAfter = await all('SELECT COUNT(*) as count FROM sources WHERE active = 1');
    const inactiveAfter = await all('SELECT COUNT(*) as count FROM sources WHERE active = 0');

    console.log(`\n=== Results ===`);
    console.log(`Total sources: ${totalAfter[0].count}`);
    console.log(`Active: ${activeAfter[0].count}`);
    console.log(`Inactive: ${inactiveAfter[0].count}`);
    console.log(`Duplicates removed: ${duplicates.length}`);

    // List active sources
    const finalActive = await all('SELECT name, rss_feed FROM sources WHERE active = 1 ORDER BY name');
    console.log('\nActive sources:');
    finalActive.forEach(s => console.log(`  - ${s.name}`));

    console.log('\nSource cleanup complete.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await close();
  }
}

cleanupSources();
