#!/usr/bin/env node

/**
 * Platform Replication Tool
 *
 * Creates a new AI-powered news platform from the ai-credit-news template.
 * Generates all industry-specific configuration from a simple config object.
 *
 * Usage:
 *   node docs/replicate.js                  # Interactive mode
 *   node docs/replicate.js --config my.json # From config file
 *
 * This tool updates the following files:
 *   - src/database/seed.js         (categories + RSS sources)
 *   - src/services/ai.js           (AI relevance prompts)
 *   - src/services/articleGenerator.js (category research focus)
 *   - src/services/email.js        (email branding)
 *   - public/css/styles.css        (color scheme)
 *   - public/js/i18n.js            (translations)
 *   - public/site.webmanifest      (PWA manifest)
 *   - public/favicon.svg           (favicon)
 *   - public/images/logo.svg       (logo)
 *   - public/images/logo-white.svg (logo dark variant)
 *   - views/partials/header.ejs    (meta tags, title)
 *   - views/about.ejs              (about page content)
 *   - views/admin/brand-guide.ejs  (brand guide)
 *   - BRAND-GUIDE.md               (brand documentation)
 *   - .env                         (environment template)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');

// ============================================
// CONFIGURATION SCHEMA
// ============================================

/**
 * @typedef {Object} PlatformConfig
 * @property {string} name - Platform name (e.g., "AI Health Digest")
 * @property {string} shortName - Short name for badges (e.g., "AHD")
 * @property {string} tagline - One-line description
 * @property {string} description - Full meta description
 * @property {string} domain - Production domain
 * @property {string} industry - Industry focus (e.g., "healthcare", "real estate")
 * @property {string} industryDescription - What this industry covers
 * @property {Object} colors - Brand color scheme
 * @property {string} colors.primary - Primary brand color hex
 * @property {string} colors.accent - Accent color hex
 * @property {string} colors.primaryDark - Darker primary hex
 * @property {Category[]} categories - Content categories (3-8)
 * @property {Source[]} sources - RSS feed sources
 * @property {string} aiRelevanceCriteria - What makes an article relevant
 * @property {string} aiFilterQuestion - Phase 1 filter question
 * @property {Object} locale - Localization
 * @property {string} locale.primary - Primary language code
 * @property {string} locale.secondary - Secondary language code (optional)
 * @property {string} adminEmail - Admin notification email
 */

/**
 * @typedef {Object} Category
 * @property {string} name - Display name
 * @property {string} slug - URL slug
 * @property {string} description - Category description
 * @property {string[]} topics - Key topics for AI generation
 * @property {string[]} keywords - Search/filter keywords
 * @property {string[]} players - Major industry players
 */

/**
 * @typedef {Object} Source
 * @property {string} name - Source display name
 * @property {string} url - RSS feed URL
 * @property {string} language - Language code (en, es, etc.)
 */

// ============================================
// EXAMPLE CONFIGURATIONS
// ============================================

const EXAMPLES = {
  'ai-healthcare': {
    name: 'AI Health Digest',
    shortName: 'AHD',
    tagline: 'AI-powered insights for healthcare & medical innovation',
    description: 'Curated news on AI in healthcare, medical imaging, drug discovery, clinical trials, and health tech.',
    domain: 'aihealthdigest.com',
    industry: 'healthcare',
    industryDescription: 'AI applications in healthcare, medical technology, drug discovery, clinical operations, and health data analytics',
    colors: {
      primary: '#0e7490',
      accent: '#059669',
      primaryDark: '#0c4a5e'
    },
    categories: [
      {
        name: 'Medical Imaging',
        slug: 'medical-imaging',
        description: 'AI in radiology, pathology, and diagnostic imaging',
        topics: ['Computer vision in radiology', 'AI-assisted diagnosis', 'Medical image segmentation'],
        keywords: ['radiology', 'CT scan', 'MRI', 'pathology', 'diagnostic AI'],
        players: ['Aidoc', 'Viz.ai', 'Paige AI', 'Tempus']
      },
      {
        name: 'Drug Discovery',
        slug: 'drug-discovery',
        description: 'AI-driven pharmaceutical research and development',
        topics: ['Molecule design', 'Clinical trial optimization', 'Target identification'],
        keywords: ['pharma', 'drug development', 'clinical trials', 'molecule'],
        players: ['Insilico Medicine', 'Recursion', 'Atomwise', 'BenevolentAI']
      },
      {
        name: 'Clinical Operations',
        slug: 'clinical-operations',
        description: 'AI in hospital management, workflow, and patient care',
        topics: ['Hospital workflow automation', 'Patient scheduling', 'EHR optimization'],
        keywords: ['EHR', 'hospital', 'clinical workflow', 'patient care'],
        players: ['Epic Systems', 'Cerner', 'Olive AI', 'Notable Health']
      },
      {
        name: 'Health Data & Analytics',
        slug: 'health-data',
        description: 'Healthcare data analysis, population health, and predictive analytics',
        topics: ['Population health management', 'Predictive analytics', 'Health data interoperability'],
        keywords: ['health data', 'FHIR', 'interoperability', 'predictive'],
        players: ['Flatiron Health', 'Datavant', 'Health Catalyst', 'Innovaccer']
      },
      {
        name: 'Digital Health',
        slug: 'digital-health',
        description: 'Telemedicine, wearables, and consumer health technology',
        topics: ['Remote patient monitoring', 'Wearable health tech', 'Mental health apps'],
        keywords: ['telehealth', 'wearables', 'digital therapeutics', 'mental health'],
        players: ['Teladoc', 'Amwell', 'Livongo', 'Headspace']
      },
      {
        name: 'Regulatory & Ethics',
        slug: 'regulatory-ethics',
        description: 'Healthcare AI regulation, compliance, and ethical considerations',
        topics: ['FDA AI/ML regulations', 'Healthcare data privacy', 'AI bias in medicine'],
        keywords: ['FDA', 'HIPAA', 'regulation', 'ethics', 'bias'],
        players: ['FDA', 'WHO', 'AMA', 'NICE']
      }
    ],
    sources: [
      { name: 'STAT News', url: 'https://www.statnews.com/feed/', language: 'en' },
      { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/feed', language: 'en' },
      { name: 'Fierce Healthcare', url: 'https://www.fiercehealthcare.com/rss/xml', language: 'en' },
      { name: 'MedCity News', url: 'https://medcitynews.com/feed/', language: 'en' },
      { name: 'Healthcare Dive', url: 'https://www.healthcaredive.com/feeds/news/', language: 'en' },
      { name: 'Mobihealthnews', url: 'https://www.mobihealthnews.com/feed', language: 'en' }
    ],
    aiRelevanceCriteria: 'AI, machine learning, or data science applications in healthcare, medicine, pharma, clinical operations, health tech, medical devices, or health data analytics',
    aiFilterQuestion: 'Is this article likely about AI/ML applications in healthcare, medicine, or health technology?',
    locale: { primary: 'en', secondary: 'es' },
    adminEmail: 'admin@aihealthdigest.com'
  },

  'ai-realestate': {
    name: 'AI Property Intel',
    shortName: 'API',
    tagline: 'AI-powered insights for real estate & property technology',
    description: 'Curated news on AI in real estate, property valuation, smart buildings, and proptech.',
    domain: 'aipropertyintel.com',
    industry: 'real estate',
    industryDescription: 'AI applications in real estate, property technology, smart buildings, valuation, and real estate finance',
    colors: {
      primary: '#1e40af',
      accent: '#b45309',
      primaryDark: '#1e3a5f'
    },
    categories: [
      {
        name: 'Property Valuation',
        slug: 'property-valuation',
        description: 'AI-powered appraisal and property valuation',
        topics: ['Automated valuation models', 'Comparable analysis', 'Market prediction'],
        keywords: ['AVM', 'appraisal', 'property value', 'pricing'],
        players: ['Zillow', 'HouseCanary', 'CoreLogic', 'ATTOM']
      },
      {
        name: 'Smart Buildings',
        slug: 'smart-buildings',
        description: 'AI in building management, energy, and occupant experience',
        topics: ['Building automation', 'Energy optimization', 'Occupancy analytics'],
        keywords: ['IoT', 'building management', 'energy', 'smart home'],
        players: ['Honeywell', 'Johnson Controls', 'Siemens', 'Schneider Electric']
      },
      {
        name: 'PropTech',
        slug: 'proptech',
        description: 'Property technology startups and innovation',
        topics: ['Real estate platforms', 'Virtual tours', 'Transaction automation'],
        keywords: ['proptech', 'startup', 'innovation', 'platform'],
        players: ['Opendoor', 'Matterport', 'Compass', 'Redfin']
      },
      {
        name: 'Investment & Finance',
        slug: 'investment-finance',
        description: 'AI in real estate investing, mortgage, and finance',
        topics: ['Investment analytics', 'Mortgage automation', 'Risk assessment'],
        keywords: ['REIT', 'mortgage', 'investment', 'underwriting'],
        players: ['Fundrise', 'Blend', 'Roofstock', 'Better.com']
      },
      {
        name: 'Market Analytics',
        slug: 'market-analytics',
        description: 'AI-driven real estate market analysis and forecasting',
        topics: ['Market trends', 'Demand forecasting', 'Location intelligence'],
        keywords: ['market analysis', 'forecast', 'trends', 'data'],
        players: ['Reonomy', 'Cherre', 'Placer.ai', 'SiteSeer']
      }
    ],
    sources: [
      { name: 'Inman', url: 'https://www.inman.com/feed/', language: 'en' },
      { name: 'GlobeSt', url: 'https://www.globest.com/feed/', language: 'en' },
      { name: 'Propmodo', url: 'https://www.propmodo.com/feed/', language: 'en' },
      { name: 'The Real Deal', url: 'https://therealdeal.com/feed/', language: 'en' }
    ],
    aiRelevanceCriteria: 'AI, machine learning, or data science applications in real estate, property technology, smart buildings, valuation, investment, or market analytics',
    aiFilterQuestion: 'Is this article likely about AI/ML applications in real estate or property technology?',
    locale: { primary: 'en' },
    adminEmail: 'admin@aipropertyintel.com'
  }
};

// ============================================
// FILE GENERATORS
// ============================================

function generateSeedFile(config) {
  const categoriesInsert = config.categories.map((cat, i) =>
    `    db.run(\`INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES (${i + 1}, '${cat.name.replace(/'/g, "''")}', '${cat.slug}', '${cat.description.replace(/'/g, "''")}')\`);`
  ).join('\n');

  const sourcesInsert = config.sources.map(src =>
    `    db.run(\`INSERT OR IGNORE INTO sources (name, url, language, active) VALUES ('${src.name.replace(/'/g, "''")}', '${src.url}', '${src.language}', 1)\`);`
  ).join('\n');

  return `// Auto-generated by replicate.js for: ${config.name}
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../database/news.db');

function seed() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.serialize(() => {
      // Categories
${categoriesInsert}

      // Sources
${sourcesInsert}
    });

    db.close(err => {
      if (err) reject(err);
      else {
        console.log('[SEED] Database seeded for ${config.name}');
        resolve();
      }
    });
  });
}

module.exports = { seed };
`;
}

function generateCategoryResearchFocus(config) {
  const entries = config.categories.map(cat => {
    return `  '${cat.slug}': {
    name: '${cat.name.replace(/'/g, "\\'")}',
    topics: ${JSON.stringify(cat.topics)},
    keywords: ${JSON.stringify(cat.keywords)},
    players: ${JSON.stringify(cat.players)}
  }`;
  });

  return `const CATEGORY_RESEARCH_FOCUS = {\n${entries.join(',\n')}\n};`;
}

function generateAiPrompts(config) {
  return {
    filterQuestion: config.aiFilterQuestion,
    relevanceCriteria: config.aiRelevanceCriteria,
    industryContext: `${config.industry} industry, specifically ${config.industryDescription}`
  };
}

function generateFaviconSvg(config) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#000"/>
  <text x="16" y="22" font-family="Inter, -apple-system, sans-serif" font-size="14" font-weight="700" fill="white" text-anchor="middle">${config.shortName}</text>
  <circle cx="26" cy="6" r="3" fill="${config.colors.accent}"/>
</svg>`;
}

function generateLogoSvg(config, variant = 'light') {
  const nameParts = config.name.split(' ');
  const line1 = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ');
  const line2 = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ');

  const bgColor = variant === 'light' ? config.colors.primary : 'white';
  const textColor = variant === 'light' ? config.colors.primary : 'white';
  const badgeTextColor = variant === 'light' ? 'white' : config.colors.primary;
  const accentColor = variant === 'light' ? config.colors.accent : '#14b8a6';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 48" fill="none">
  <rect x="0" y="4" width="40" height="40" rx="8" fill="${bgColor}"/>
  <text x="20" y="30" font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="700" fill="${badgeTextColor}" text-anchor="middle">${config.shortName}</text>
  <text x="52" y="22" font-family="Inter, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${textColor}">${line1}</text>
  <text x="52" y="42" font-family="Inter, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${textColor}">${line2}</text>
  <rect x="200" y="12" width="3" height="28" rx="1.5" fill="${accentColor}"/>
</svg>`;
}

function generateWebManifest(config) {
  return JSON.stringify({
    name: config.name,
    short_name: config.shortName,
    description: config.tagline,
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    theme_color: config.colors.primary,
    background_color: '#f9fafb',
    display: 'standalone',
    start_url: '/'
  }, null, 2);
}

function generateEnvTemplate(config) {
  return `# ${config.name} - Environment Configuration
# Generated by replicate.js

PORT=3000
DATABASE_PATH=./database/news.db
NODE_ENV=development

# AI (Required - get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Email (Required - get from https://resend.com/)
RESEND_API_KEY=re_your-key-here

# Admin
ADMIN_EMAIL=${config.adminEmail}
ADMIN_PASSWORD=change-this-password

# Session
SESSION_SECRET=change-this-to-random-string

# Production URL
SITE_URL=https://${config.domain}
`;
}

// ============================================
// APPLY CONFIGURATION
// ============================================

function applyConfig(config) {
  console.log(`\n  Replicating platform: ${config.name}`);
  console.log(`  Industry: ${config.industry}`);
  console.log(`  Categories: ${config.categories.length}`);
  console.log(`  Sources: ${config.sources.length}`);
  console.log('');

  const changes = [];

  // 1. Favicon
  const faviconPath = path.join(ROOT, 'public/favicon.svg');
  fs.writeFileSync(faviconPath, generateFaviconSvg(config));
  changes.push('public/favicon.svg');

  // 2. Logos
  const logoPath = path.join(ROOT, 'public/images/logo.svg');
  fs.writeFileSync(logoPath, generateLogoSvg(config, 'light'));
  changes.push('public/images/logo.svg');

  const logoWhitePath = path.join(ROOT, 'public/images/logo-white.svg');
  fs.writeFileSync(logoWhitePath, generateLogoSvg(config, 'dark'));
  changes.push('public/images/logo-white.svg');

  // 3. Web Manifest
  const manifestPath = path.join(ROOT, 'public/site.webmanifest');
  fs.writeFileSync(manifestPath, generateWebManifest(config));
  changes.push('public/site.webmanifest');

  // 4. CSS color scheme
  const cssPath = path.join(ROOT, 'public/css/styles.css');
  let css = fs.readFileSync(cssPath, 'utf-8');
  css = css.replace(/--accent:\s*#[0-9a-fA-F]+;/, `--accent: ${config.colors.primary};`);
  css = css.replace(/--accent-dark:\s*#[0-9a-fA-F]+;/, `--accent-dark: ${config.colors.primaryDark};`);
  fs.writeFileSync(cssPath, css);
  changes.push('public/css/styles.css');

  // 5. Header meta tags
  const headerPath = path.join(ROOT, 'views/partials/header.ejs');
  let header = fs.readFileSync(headerPath, 'utf-8');
  header = header.replace(/AI Credit News/g, config.name);
  header = header.replace(
    /AI-powered insights for credit & financial services[^"]*/,
    config.tagline
  );
  fs.writeFileSync(headerPath, header);
  changes.push('views/partials/header.ejs');

  // 6. Admin header
  const adminHeaderPath = path.join(ROOT, 'views/admin/partials/header.ejs');
  let adminHeader = fs.readFileSync(adminHeaderPath, 'utf-8');
  adminHeader = adminHeader.replace(/AI Credit News Admin/g, `${config.name} Admin`);
  fs.writeFileSync(adminHeaderPath, adminHeader);
  changes.push('views/admin/partials/header.ejs');

  // 7. Footer
  const footerPath = path.join(ROOT, 'views/partials/footer.ejs');
  let footer = fs.readFileSync(footerPath, 'utf-8');
  footer = footer.replace(/AI Credit News/g, config.name);
  fs.writeFileSync(footerPath, footer);
  changes.push('views/partials/footer.ejs');

  // 8. AI relevance prompts (ai.js)
  const aiPath = path.join(ROOT, 'src/services/ai.js');
  if (fs.existsSync(aiPath)) {
    let ai = fs.readFileSync(aiPath, 'utf-8');
    const prompts = generateAiPrompts(config);

    // Replace the phase 1 filter question
    ai = ai.replace(
      /Is this article likely about AI\/ML in credit.*?\?/,
      prompts.filterQuestion
    );
    // Replace the relevance criteria description
    ai = ai.replace(
      /AI\/ML.*?(?:credit|banking|financial services|lending)[^"']*/gi,
      prompts.relevanceCriteria
    );
    fs.writeFileSync(aiPath, ai);
    changes.push('src/services/ai.js');
  }

  // 9. Category research focus (articleGenerator.js)
  const genPath = path.join(ROOT, 'src/services/articleGenerator.js');
  if (fs.existsSync(genPath)) {
    let gen = fs.readFileSync(genPath, 'utf-8');
    const newFocus = generateCategoryResearchFocus(config);
    gen = gen.replace(
      /const CATEGORY_RESEARCH_FOCUS\s*=\s*\{[\s\S]*?\n\};/,
      newFocus
    );
    fs.writeFileSync(genPath, gen);
    changes.push('src/services/articleGenerator.js');
  }

  // 10. .env template
  const envPath = path.join(ROOT, '.env.example');
  fs.writeFileSync(envPath, generateEnvTemplate(config));
  changes.push('.env.example');

  // 11. Server startup log
  const serverPath = path.join(ROOT, 'src/server.js');
  if (fs.existsSync(serverPath)) {
    let server = fs.readFileSync(serverPath, 'utf-8');
    server = server.replace(
      /AI Credit & Banking News Platform/,
      config.name
    );
    fs.writeFileSync(serverPath, server);
    changes.push('src/server.js');
  }

  // 12. Save the config for future reference
  const configPath = path.join(ROOT, 'docs/platform-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  changes.push('docs/platform-config.json');

  console.log(`  Updated ${changes.length} files:`);
  changes.forEach(f => console.log(`    - ${f}`));
  console.log(`\n  Platform config saved to: docs/platform-config.json`);
  console.log(`\n  Next steps:`);
  console.log(`    1. Review the changes: git diff`);
  console.log(`    2. Update RSS sources in src/database/seed.js`);
  console.log(`    3. Set up .env from .env.example`);
  console.log(`    4. Run: npm start`);
  console.log(`    5. Visit: http://localhost:3000/admin`);
  console.log('');
}

// ============================================
// INTERACTIVE MODE
// ============================================

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log('\n  Platform Replication Tool');
  console.log('  ========================\n');
  console.log('  Available templates:');
  Object.entries(EXAMPLES).forEach(([key, val]) => {
    console.log(`    ${key}: ${val.name} (${val.industry})`);
  });
  console.log('');

  const choice = await ask('  Use a template? Enter name (or "custom"): ');

  if (EXAMPLES[choice]) {
    applyConfig(EXAMPLES[choice]);
  } else {
    console.log('\n  Custom configuration:');
    const name = await ask('  Platform name: ');
    const shortName = await ask('  Short name (2-4 chars for badge): ');
    const tagline = await ask('  Tagline: ');
    const industry = await ask('  Industry: ');
    const primary = await ask('  Primary color (hex, e.g., #1e3a8a): ');
    const accent = await ask('  Accent color (hex, e.g., #0d9488): ');

    console.log('\n  For categories and sources, edit docs/platform-config.json after generation.\n');

    const config = {
      name,
      shortName: shortName || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3),
      tagline,
      description: tagline,
      domain: name.toLowerCase().replace(/\s+/g, '-') + '.com',
      industry,
      industryDescription: `AI applications in ${industry}`,
      colors: {
        primary: primary || '#1e3a8a',
        accent: accent || '#0d9488',
        primaryDark: primary ? darkenHex(primary, 20) : '#162d6e'
      },
      categories: [
        { name: 'General', slug: 'general', description: `General ${industry} news`, topics: [], keywords: [], players: [] }
      ],
      sources: [],
      aiRelevanceCriteria: `AI, machine learning, or data science applications in ${industry}`,
      aiFilterQuestion: `Is this article likely about AI/ML applications in ${industry}?`,
      locale: { primary: 'en' },
      adminEmail: `admin@${name.toLowerCase().replace(/\s+/g, '-')}.com`
    };

    applyConfig(config);
  }

  rl.close();
}

function darkenHex(hex, percent) {
  hex = hex.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - percent);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - percent);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - percent);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

// ============================================
// MAIN
// ============================================

const args = process.argv.slice(2);

if (args[0] === '--config' && args[1]) {
  const configPath = path.resolve(args[1]);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  applyConfig(config);
} else if (args[0] === '--example') {
  const name = args[1] || 'ai-healthcare';
  if (EXAMPLES[name]) {
    applyConfig(EXAMPLES[name]);
  } else {
    console.error(`Unknown example: ${name}. Available: ${Object.keys(EXAMPLES).join(', ')}`);
    process.exit(1);
  }
} else if (args[0] === '--list') {
  console.log('\nAvailable templates:\n');
  Object.entries(EXAMPLES).forEach(([key, val]) => {
    console.log(`  ${key}`);
    console.log(`    Name: ${val.name}`);
    console.log(`    Industry: ${val.industry}`);
    console.log(`    Categories: ${val.categories.map(c => c.name).join(', ')}`);
    console.log(`    Sources: ${val.sources.length}`);
    console.log('');
  });
} else {
  interactiveMode();
}
