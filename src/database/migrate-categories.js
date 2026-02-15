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
  'risk-management': 'credit-scoring',
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

    // Insert any missing new categories (safe — never deletes articles)
    console.log('Ensuring all required categories exist...');
    for (const cat of newCategories) {
      await run(
        'INSERT OR IGNORE INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)',
        [cat.name, cat.slug, cat.description, cat.icon]
      );
    }

    // Remove obsolete old categories (reassign their articles to credit-scoring first)
    const creditScoring = await all("SELECT id FROM categories WHERE slug = 'credit-scoring'");
    if (creditScoring.length > 0) {
      const defaultCategoryId = creditScoring[0].id;
      const obsoleteSlugs = ['customer-experience', 'research-innovation', 'case-studies', 'industry-news', 'ethics-bias', 'ai-credit-scoring', 'banking-automation'];
      for (const slug of obsoleteSlugs) {
        const old = await all('SELECT id FROM categories WHERE slug = ?', [slug]);
        if (old.length > 0) {
          await run('UPDATE articles SET category_id = ? WHERE category_id = ?', [defaultCategoryId, old[0].id]);
          await run('DELETE FROM categories WHERE id = ?', [old[0].id]);
          console.log(`  Removed obsolete category: ${slug}`);
        }
      }
    }

    const updatedCategories = await all('SELECT * FROM categories');
    console.log('Categories:', updatedCategories.map(c => `${c.name} (${c.id})`));
    console.log('Category migration complete (articles preserved).');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await close();
  }
}

migrateCategories();
