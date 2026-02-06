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
  },
  // Spanish language sources
  {
    name: 'BBVA Noticias',
    url: 'https://www.bbva.com/es/',
    rss_feed: 'https://www.bbva.com/es/feed/',
    active: 1,
    language: 'es'
  },
  {
    name: 'El Economista - Fintech',
    url: 'https://www.eleconomista.es/fintech/',
    rss_feed: 'https://www.eleconomista.es/rss/rss-fintech.php',
    active: 1,
    language: 'es'
  },
  {
    name: 'Finanzas.com',
    url: 'https://www.finanzas.com/',
    rss_feed: 'https://www.finanzas.com/rss/',
    active: 1,
    language: 'es'
  },
  {
    name: 'iupana - Fintech LATAM',
    url: 'https://iupana.com/',
    rss_feed: 'https://iupana.com/feed/',
    active: 1,
    language: 'es'
  },
  {
    name: 'Fintech News Mexico',
    url: 'https://fintechnews.mx/',
    rss_feed: 'https://fintechnews.mx/feed/',
    active: 1,
    language: 'es'
  },
  {
    name: 'Dinero - Colombia',
    url: 'https://www.dinero.com/',
    rss_feed: 'https://www.dinero.com/rss/finanzas.xml',
    active: 1,
    language: 'es'
  },
  {
    name: 'Forbes Mexico - Tecnología',
    url: 'https://www.forbes.com.mx/tecnologia/',
    rss_feed: 'https://www.forbes.com.mx/tecnologia/feed/',
    active: 1,
    language: 'es'
  },
  {
    name: 'América Economía - Finanzas',
    url: 'https://www.americaeconomia.com/negocios-industrias/finanzas',
    rss_feed: 'https://www.americaeconomia.com/rss/finanzas.xml',
    active: 1,
    language: 'es'
  },
  // Additional sources - Consulting & Research
  {
    name: 'McKinsey Financial Services',
    url: 'https://www.mckinsey.com/industries/financial-services',
    rss_feed: 'https://www.mckinsey.com/industries/financial-services/our-insights/rss.xml',
    active: 1
  },
  {
    name: 'Deloitte Financial Services',
    url: 'https://www2.deloitte.com/insights/us/en/industry/financial-services.html',
    rss_feed: 'https://www2.deloitte.com/content/dam/insights/us/rss/financial-services.xml',
    active: 1
  },
  {
    name: 'Oliver Wyman Insights',
    url: 'https://www.oliverwyman.com/our-expertise/insights.html',
    rss_feed: 'https://www.oliverwyman.com/our-expertise/insights.rss.xml',
    active: 1
  },
  {
    name: 'CB Insights',
    url: 'https://www.cbinsights.com/research/',
    rss_feed: 'https://www.cbinsights.com/research/feed/',
    active: 1
  },
  // Additional Fintech sources
  {
    name: 'Fintech Futures',
    url: 'https://www.fintechfutures.com/',
    rss_feed: 'https://www.fintechfutures.com/feed/',
    active: 1
  },
  {
    name: 'PYMNTS',
    url: 'https://www.pymnts.com/',
    rss_feed: 'https://www.pymnts.com/feed/',
    active: 1
  },
  {
    name: 'The Paypers',
    url: 'https://thepaypers.com/',
    rss_feed: 'https://thepaypers.com/rss',
    active: 1
  },
  {
    name: 'TechCrunch Fintech',
    url: 'https://techcrunch.com/category/fintech/',
    rss_feed: 'https://techcrunch.com/category/fintech/feed/',
    active: 1
  },
  {
    name: 'Crowdfund Insider',
    url: 'https://www.crowdfundinsider.com/',
    rss_feed: 'https://www.crowdfundinsider.com/feed/',
    active: 1
  },
  {
    name: 'Fintech Magazine',
    url: 'https://fintechmagazine.com/',
    rss_feed: 'https://fintechmagazine.com/rss/feed',
    active: 1
  },
  {
    name: 'This Week in Fintech',
    url: 'https://www.thisweekinfintech.com/',
    rss_feed: 'https://www.thisweekinfintech.com/feed/',
    active: 1
  },
  {
    name: 'FF News (Fintech Finance)',
    url: 'https://ffnews.com/',
    rss_feed: 'https://ffnews.com/feed/',
    active: 1
  },
  {
    name: 'Tech.eu',
    url: 'https://tech.eu/',
    rss_feed: 'https://tech.eu/feed/',
    active: 1
  },
  {
    name: 'Bank Innovation',
    url: 'https://bankinnovation.net/',
    rss_feed: 'https://bankinnovation.net/feed/',
    active: 1
  },
  {
    name: 'Financial News London',
    url: 'https://www.fnlondon.com/',
    rss_feed: 'https://www.fnlondon.com/rss',
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
