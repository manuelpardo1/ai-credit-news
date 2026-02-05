const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, all, close } = require('./db');

const newCategories = [
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

// Map old category slugs to new ones
const categoryMapping = {
  'ai-credit-scoring': 'credit-scoring',
  'fraud-detection': 'fraud-detection',
  'risk-management': 'credit-risk',
  'banking-automation': 'lending-automation',
  // These will be deleted (articles reassigned or removed)
  'customer-experience': null,
  'research-innovation': null,
  'case-studies': null,
  'industry-news': null,
  'ethics-bias': null
};

async function migrateCategories() {
  console.log('Migrating categories...');

  try {
    // Check if migration already completed (new categories exist)
    const existingCategories = await all('SELECT slug FROM categories');
    const existingSlugs = existingCategories.map(c => c.slug);
    const newSlugs = newCategories.map(c => c.slug);

    // If all new categories already exist, skip migration
    const allNewExist = newSlugs.every(slug => existingSlugs.includes(slug));
    const hasOldCategories = existingSlugs.some(slug =>
      ['customer-experience', 'research-innovation', 'case-studies', 'industry-news', 'ethics-bias', 'banking-automation', 'ai-credit-scoring'].includes(slug)
    );

    if (allNewExist && !hasOldCategories) {
      console.log('Migration already completed. Skipping...');
      return;
    }

    // Get current categories
    const oldCategories = await all('SELECT * FROM categories');
    console.log('Current categories:', oldCategories.map(c => c.slug));

    // Disable foreign key checks temporarily
    await run('PRAGMA foreign_keys = OFF');

    // Delete all articles (we'll re-scrape them with correct categories)
    console.log('\nDeleting all articles to allow category cleanup...');
    await run('DELETE FROM articles');

    // Delete all old categories
    console.log('Deleting old categories...');
    await run('DELETE FROM categories');

    // Insert new categories
    console.log('Inserting new categories...');
    for (const cat of newCategories) {
      await run(
        'INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)',
        [cat.name, cat.slug, cat.description, cat.icon]
      );
      console.log(`  Added: ${cat.name}`);
    }

    // Get new category IDs
    const updatedCategories = await all('SELECT * FROM categories');
    console.log('\nNew categories:', updatedCategories.map(c => `${c.name} (${c.id})`));

    // Re-enable foreign key checks
    await run('PRAGMA foreign_keys = ON');

    console.log('\nCategory migration complete!');
    console.log('Note: All articles were deleted. Run scraper to re-populate.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await close();
  }
}

migrateCategories();
