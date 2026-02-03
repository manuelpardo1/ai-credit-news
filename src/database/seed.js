const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, all, close } = require('./db');

const categories = [
  {
    name: 'AI in Credit Scoring',
    slug: 'ai-credit-scoring',
    description: 'Machine learning models for creditworthiness assessment',
    icon: 'credit-card'
  },
  {
    name: 'Banking Automation',
    slug: 'banking-automation',
    description: 'AI-powered banking operations and processes',
    icon: 'robot'
  },
  {
    name: 'Fraud Detection',
    slug: 'fraud-detection',
    description: 'AI systems for detecting and preventing financial fraud',
    icon: 'shield'
  },
  {
    name: 'Regulatory & Compliance',
    slug: 'regulatory-compliance',
    description: 'AI governance, fairness requirements, and regulations',
    icon: 'scale'
  },
  {
    name: 'Risk Management',
    slug: 'risk-management',
    description: 'AI for financial risk assessment and mitigation',
    icon: 'chart-line'
  },
  {
    name: 'Customer Experience',
    slug: 'customer-experience',
    description: 'Chatbots, personalization, and AI-powered interfaces',
    icon: 'users'
  },
  {
    name: 'Research & Innovation',
    slug: 'research-innovation',
    description: 'Academic papers and new techniques in AI finance',
    icon: 'lightbulb'
  },
  {
    name: 'Case Studies',
    slug: 'case-studies',
    description: 'Real-world implementations and success stories',
    icon: 'book'
  },
  {
    name: 'Industry News',
    slug: 'industry-news',
    description: 'Company announcements, partnerships, and market updates',
    icon: 'newspaper'
  },
  {
    name: 'Ethics & Bias',
    slug: 'ethics-bias',
    description: 'Fair lending, algorithmic bias, and responsible AI',
    icon: 'balance-scale'
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
