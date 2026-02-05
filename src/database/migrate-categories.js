const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { run, all, close } = require('./db');

const newCategories = [
  {
    name: 'AI in Credit Scoring',
    slug: 'ai-credit-scoring',
    description: 'Machine learning models for creditworthiness assessment and scoring',
    icon: 'credit-card'
  },
  {
    name: 'AI in Fraud Detection',
    slug: 'ai-fraud-detection',
    description: 'AI systems for detecting and preventing financial fraud',
    icon: 'shield'
  },
  {
    name: 'AI in Credit Risk',
    slug: 'ai-credit-risk',
    description: 'AI for credit risk assessment, modeling, and management',
    icon: 'chart-line'
  },
  {
    name: 'Income & Employment Verification',
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
  'fraud-detection': 'ai-fraud-detection',
  'risk-management': 'ai-credit-risk',
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
    // Get current categories
    const oldCategories = await all('SELECT * FROM categories');
    console.log('Current categories:', oldCategories.map(c => c.slug));

    // Update articles with mapped categories
    for (const [oldSlug, newSlug] of Object.entries(categoryMapping)) {
      if (newSlug) {
        // Get the new category ID (will be created shortly)
        const oldCat = oldCategories.find(c => c.slug === oldSlug);
        if (oldCat) {
          console.log(`Will map articles from "${oldSlug}" to "${newSlug}"`);
        }
      }
    }

    // Delete all old categories
    console.log('\nDeleting old categories...');
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

    // Update article categories based on mapping
    for (const [oldSlug, newSlug] of Object.entries(categoryMapping)) {
      if (newSlug) {
        const newCat = updatedCategories.find(c => c.slug === newSlug);
        const oldCat = oldCategories.find(c => c.slug === oldSlug);
        if (newCat && oldCat) {
          const result = await run(
            'UPDATE articles SET category_id = ? WHERE category_id = ?',
            [newCat.id, oldCat.id]
          );
          console.log(`Remapped ${result.changes} articles from "${oldSlug}" to "${newSlug}"`);
        }
      }
    }

    // Set articles with deleted categories to the first category (AI in Credit Scoring)
    const defaultCat = updatedCategories.find(c => c.slug === 'ai-credit-scoring');
    if (defaultCat) {
      const result = await run(
        'UPDATE articles SET category_id = ? WHERE category_id NOT IN (SELECT id FROM categories)',
        [defaultCat.id]
      );
      if (result.changes > 0) {
        console.log(`Reassigned ${result.changes} orphaned articles to "AI in Credit Scoring"`);
      }
    }

    console.log('\nCategory migration complete!');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await close();
  }
}

migrateCategories();
