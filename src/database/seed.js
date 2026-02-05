const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, all, close } = require('./db');

const categories = [
  {
    name: 'Credit Scoring',
    slug: 'credit-scoring',
    description: 'Machine learning models for creditworthiness assessment and scoring',
    icon: 'credit-card'
  },
  {
    name: 'Fraud Detection',
    slug: 'fraud-detection',
    description: 'AI systems for detecting and preventing financial fraud',
    icon: 'shield'
  },
  {
    name: 'Credit Risk',
    slug: 'credit-risk',
    description: 'AI for credit risk assessment, modeling, and management',
    icon: 'chart-line'
  },
  {
    name: 'Income & Employment',
    slug: 'income-employment',
    description: 'AI for income verification, employment data, and affordability analysis',
    icon: 'briefcase'
  },
  {
    name: 'Regulatory & Compliance',
    slug: 'regulatory-compliance',
    description: 'AI governance, fair lending requirements, and regulatory compliance',
    icon: 'scale'
  },
  {
    name: 'Lending Automation',
    slug: 'lending-automation',
    description: 'AI-powered lending decisions, underwriting, and loan processing',
    icon: 'robot'
  }
];

const sources = [
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
    rss_feed: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    active: 1
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/',
    rss_feed: 'https://venturebeat.com/category/ai/feed/',
    active: 1
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/',
    rss_feed: 'https://www.technologyreview.com/feed/',
    active: 1
  },
  {
    name: 'Finextra',
    url: 'https://www.finextra.com/',
    rss_feed: 'https://www.finextra.com/rss/headlines.aspx',
    active: 1
  },
  {
    name: 'American Banker',
    url: 'https://www.americanbanker.com/',
    rss_feed: 'https://www.americanbanker.com/feed',
    active: 1
  },
  {
    name: 'Banking Dive',
    url: 'https://www.bankingdive.com/',
    rss_feed: 'https://www.bankingdive.com/feeds/news/',
    active: 1
  },
  {
    name: 'Payments Dive',
    url: 'https://www.paymentsdive.com/',
    rss_feed: 'https://www.paymentsdive.com/feeds/news/',
    active: 1
  },
  {
    name: 'The Financial Brand',
    url: 'https://thefinancialbrand.com/',
    rss_feed: 'https://thefinancialbrand.com/feed/',
    active: 1
  },
  // New sources added for broader coverage
  {
    name: 'Risk.net',
    url: 'https://www.risk.net/',
    rss_feed: 'https://www.risk.net/rss/risk-management',
    active: 1
  },
  {
    name: 'Finovate',
    url: 'https://finovate.com/',
    rss_feed: 'https://finovate.com/feed/',
    active: 1
  },
  {
    name: 'Bank Automation News',
    url: 'https://bankautomationnews.com/',
    rss_feed: 'https://bankautomationnews.com/feed/',
    active: 1
  },
  {
    name: 'PaymentsJournal',
    url: 'https://paymentsjournal.com/',
    rss_feed: 'https://paymentsjournal.com/feed/',
    active: 1
  },
  {
    name: 'The Fintech Times',
    url: 'https://thefintechtimes.com/',
    rss_feed: 'https://thefintechtimes.com/feed/',
    active: 1
  },
  {
    name: 'Experian Insights',
    url: 'https://www.experian.com/blogs/insights/',
    rss_feed: 'https://www.experian.com/blogs/insights/feed/',
    active: 1
  },
  {
    name: 'FICO Blog',
    url: 'https://www.fico.com/blogs/',
    rss_feed: 'https://www.fico.com/blogs/feed/',
    active: 1
  },
  {
    name: 'Accenture Banking Blog',
    url: 'https://bankingblog.accenture.com/',
    rss_feed: 'https://bankingblog.accenture.com/feed/',
    active: 1
  }
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
          'INSERT OR IGNORE INTO sources (name, url, rss_feed, active) VALUES (?, ?, ?, ?)',
          [source.name, source.url, source.rss_feed, source.active]
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
