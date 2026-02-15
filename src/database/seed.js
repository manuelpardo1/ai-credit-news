const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, all, close } = require('./db');

const categories = [
  {
    name: 'Credit Scoring',
    slug: 'credit-scoring',
    description: 'Machine learning models for creditworthiness assessment, risk scoring, and credit decisions',
    icon: 'credit-card'
  },
  {
    name: 'Fraud Detection',
    slug: 'fraud-detection',
    description: 'AI systems for detecting and preventing financial fraud',
    icon: 'shield'
  },
  {
    name: 'Income & Employment',
    slug: 'income-employment',
    description: 'AI for income verification, cash flow analysis, affordability, and capacity to pay',
    icon: 'briefcase'
  },
  {
    name: 'Regulatory & Compliance',
    slug: 'regulatory-compliance',
    description: 'AI governance, fair lending requirements, explainability, and regulatory compliance',
    icon: 'scale'
  },
  {
    name: 'Lending Automation',
    slug: 'lending-automation',
    description: 'AI-powered lending decisions, underwriting, and loan processing',
    icon: 'robot'
  }
];

// Curated sources — only feeds that consistently produce articles about
// AI + credit risk, lending, fraud detection, and financial services.
// The migrate-sources-cleanup.js migration enforces this list on production.
const sources = [
  // Tier 1 — Core: high relevance to AI + credit/lending
  { name: 'Bank Automation News', url: 'https://bankautomationnews.com/', rss_feed: 'https://bankautomationnews.com/feed/', active: 1 },
  { name: 'Finextra', url: 'https://www.finextra.com/', rss_feed: 'https://www.finextra.com/rss/headlines.aspx', active: 1 },
  { name: 'American Banker', url: 'https://www.americanbanker.com/', rss_feed: 'https://www.americanbanker.com/feed', active: 1 },
  { name: 'Banking Dive', url: 'https://www.bankingdive.com/', rss_feed: 'https://www.bankingdive.com/feeds/news/', active: 1 },
  { name: 'PYMNTS', url: 'https://www.pymnts.com/', rss_feed: 'https://www.pymnts.com/feed/', active: 1 },
  { name: 'Experian Insights', url: 'https://www.experian.com/blogs/insights/', rss_feed: 'https://www.experian.com/blogs/insights/feed/', active: 1 },
  { name: 'FICO Blog', url: 'https://www.fico.com/blogs/', rss_feed: 'https://www.fico.com/blogs/feed/', active: 1 },
  { name: 'Equifax Insights', url: 'https://www.equifax.com/insights/', rss_feed: 'https://www.equifax.com/insights/feed/', active: 1 },
  { name: 'TransUnion Blog', url: 'https://www.transunion.com/blog', rss_feed: 'https://www.transunion.com/blog/rss', active: 1 },
  { name: 'Finovate', url: 'https://finovate.com/', rss_feed: 'https://finovate.com/feed/', active: 1 },
  { name: 'Risk.net', url: 'https://www.risk.net/', rss_feed: 'https://www.risk.net/rss/risk-management', active: 1 },
  { name: 'Plaid Blog', url: 'https://plaid.com/blog/', rss_feed: 'https://plaid.com/blog/feed/', active: 1 },
  { name: 'ABA Banking Journal', url: 'https://bankingjournal.aba.com/', rss_feed: 'https://bankingjournal.aba.com/feed/', active: 1 },
  { name: 'PaymentsJournal', url: 'https://paymentsjournal.com/', rss_feed: 'https://paymentsjournal.com/feed/', active: 1 },
  { name: 'Fintech Futures', url: 'https://www.fintechfutures.com/', rss_feed: 'https://www.fintechfutures.com/feed/', active: 1 },

  // Tier 2 — Broader fintech/AI with moderate hit rate
  { name: 'The Financial Brand', url: 'https://thefinancialbrand.com/', rss_feed: 'https://thefinancialbrand.com/feed/', active: 1 },
  { name: 'The Fintech Times', url: 'https://thefintechtimes.com/', rss_feed: 'https://thefintechtimes.com/feed/', active: 1 },
  { name: 'CB Insights', url: 'https://www.cbinsights.com/research/', rss_feed: 'https://www.cbinsights.com/research/feed/', active: 1 },
  { name: 'TechCrunch Fintech', url: 'https://techcrunch.com/category/fintech/', rss_feed: 'https://techcrunch.com/category/fintech/feed/', active: 1 },
  { name: 'McKinsey Financial Services', url: 'https://www.mckinsey.com/industries/financial-services', rss_feed: 'https://www.mckinsey.com/industries/financial-services/our-insights/rss.xml', active: 1 },
  { name: 'Payments Dive', url: 'https://www.paymentsdive.com/', rss_feed: 'https://www.paymentsdive.com/feeds/news/', active: 1 },
  { name: 'FF News (Fintech Finance)', url: 'https://ffnews.com/', rss_feed: 'https://ffnews.com/feed/', active: 1 },
];

async function seed() {
  console.log('Seeding database...');

  try {
    // Seed categories
    console.log('Adding categories...');
    for (const cat of categories) {
      try {
        await run(
          'INSERT OR IGNORE INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)',
          [cat.name, cat.slug, cat.description, cat.icon]
        );
      } catch (err) {
        console.log(`Category "${cat.name}" already exists or error:`, err.message);
      }
    }

    // Seed sources
    console.log('Adding sources...');
    for (const source of sources) {
      try {
        await run(
          'INSERT OR IGNORE INTO sources (name, url, rss_feed, active, language) VALUES (?, ?, ?, ?, ?)',
          [source.name, source.url, source.rss_feed, source.active, source.language || 'en']
        );
      } catch (err) {
        console.log(`Source "${source.name}" already exists or error:`, err.message);
      }
    }

    // Verify seeding
    const catCount = await all('SELECT COUNT(*) as count FROM categories');
    const sourceCount = await all('SELECT COUNT(*) as count FROM sources');

    console.log(`\nSeeding complete!`);
    console.log(`Categories: ${catCount[0].count}`);
    console.log(`Sources: ${sourceCount[0].count}`);

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await close();
  }
}

seed();
