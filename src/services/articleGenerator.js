/**
 * AI Article Generator Service
 *
 * Generates original journalism-style articles for AI Credit News.
 * These articles are clearly marked as AI-generated and go through admin review.
 *
 * Process:
 * 1. Research: Web search for current news, products, regulations, stock behavior
 * 2. Analysis: Synthesize information into original insights
 * 3. Writing: Generate professional journalism-style article
 * 4. Review: Admin reviews and publishes via dashboard
 */

const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

// Ensure env is loaded with proper path and override
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  override: true
});

const Article = require('../models/Article');
const { get, run, all } = require('../database/db');

// Initialize Anthropic client (will use ANTHROPIC_API_KEY from env)
let anthropic;
function getAnthropicClient() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// Categories and their research focus areas
const CATEGORY_RESEARCH_FOCUS = {
  'credit-scoring': {
    name: 'Credit Scoring',
    topics: [
      'AI/ML credit scoring models',
      'alternative data for credit decisions',
      'credit bureau innovations',
      'FICO score alternatives',
      'credit decisioning automation',
      'real-time credit assessments'
    ],
    competitors: ['Experian', 'Equifax', 'TransUnion', 'FICO', 'VantageScore'],
    keywords: ['credit score', 'creditworthiness', 'credit bureau', 'credit risk model', 'scoring algorithm']
  },
  'fraud-detection': {
    name: 'Fraud Detection',
    topics: [
      'AI fraud detection systems',
      'real-time transaction monitoring',
      'identity verification AI',
      'synthetic identity fraud',
      'payment fraud prevention',
      'behavioral biometrics'
    ],
    competitors: ['Featurespace', 'Feedzai', 'NICE Actimize', 'SAS'],
    keywords: ['fraud detection', 'anti-money laundering', 'KYC', 'identity verification', 'financial crime']
  },
  'income-employment': {
    name: 'Income & Employment',
    topics: [
      'AI income verification',
      'employment verification automation',
      'cash flow analysis AI',
      'capacity to pay assessment',
      'open banking for affordability',
      'payroll data aggregation'
    ],
    competitors: ['Argyle', 'Pinwheel', 'Truework', 'Plaid', 'Yodlee'],
    keywords: ['income verification', 'employment verification', 'cash flow', 'affordability', 'capacity to pay']
  },
  'regulatory-compliance': {
    name: 'Regulatory & Compliance',
    topics: [
      'AI governance in finance',
      'fair lending compliance',
      'model explainability requirements',
      'CFPB AI regulations',
      'algorithmic bias audits',
      'AI transparency requirements'
    ],
    competitors: ['Compliance.ai', 'Behavox', 'Corlytics'],
    keywords: ['AI regulation', 'fair lending', 'explainability', 'model governance', 'compliance automation']
  },
  'lending-automation': {
    name: 'Lending Automation',
    topics: [
      'AI underwriting systems',
      'automated loan decisioning',
      'digital lending platforms',
      'loan origination automation',
      'mortgage AI innovations',
      'small business lending AI'
    ],
    competitors: ['Blend', 'Upstart', 'nCino', 'Zest AI'],
    keywords: ['automated underwriting', 'loan origination', 'digital lending', 'AI underwriter', 'loan automation']
  }
};

// Article types with templates
const ARTICLE_TYPES = {
  trend_analysis: {
    name: 'Trend Analysis',
    description: 'Deep dive into emerging trends in the category',
    wordCount: { min: 800, max: 1200 }
  },
  product_launch: {
    name: 'Product/Service Launch',
    description: 'Coverage of new products or services in the market',
    wordCount: { min: 600, max: 900 }
  },
  market_insight: {
    name: 'Market Insight',
    description: 'Analysis of market dynamics, investments, or competitive landscape',
    wordCount: { min: 700, max: 1000 }
  },
  regulatory_update: {
    name: 'Regulatory Update',
    description: 'Coverage of regulatory changes and their implications',
    wordCount: { min: 600, max: 900 }
  },
  future_outlook: {
    name: 'Future Outlook',
    description: 'Forward-looking analysis and predictions',
    wordCount: { min: 800, max: 1100 }
  }
};

/**
 * Research current news and trends for a category using web search simulation
 * In production, this would use actual web search APIs
 */
async function researchTopic(categorySlug, articleType) {
  const category = CATEGORY_RESEARCH_FOCUS[categorySlug];
  if (!category) {
    throw new Error(`Unknown category: ${categorySlug}`);
  }

  // Select a random topic focus from the category
  const topicIndex = Math.floor(Math.random() * category.topics.length);
  const primaryTopic = category.topics[topicIndex];

  // Build research prompt
  const researchPrompt = `You are a financial journalism research assistant. Research and gather information for an article about "${primaryTopic}" in the context of ${category.name}.

RESEARCH FOCUS:
- Category: ${category.name}
- Primary Topic: ${primaryTopic}
- Article Type: ${ARTICLE_TYPES[articleType].name}
- Related Keywords: ${category.keywords.join(', ')}
- Industry Players: ${category.competitors.join(', ')}

YOUR TASK:
Provide comprehensive research notes that include:

1. CURRENT LANDSCAPE (3-4 bullet points)
   - Recent developments in this space (cite realistic but hypothetical current events)
   - Key players and their recent moves
   - Market trends and dynamics

2. KEY INSIGHTS (3-4 bullet points)
   - Why this matters now
   - Technical innovations driving change
   - Challenges and opportunities

3. DATA POINTS (2-3 realistic statistics or market data)
   - Market size, growth rates, adoption metrics
   - Make these realistic and cite hypothetical industry reports

4. EXPERT PERSPECTIVES (2-3 viewpoints)
   - What industry experts might say about this trend
   - Different perspectives (banks, fintechs, regulators)

5. FUTURE IMPLICATIONS (2-3 points)
   - Where this is heading
   - Impact on financial services industry
   - Opportunities for innovation

FORMAT: Return structured research notes in a clear format that a journalist can use to write an article.

IMPORTANT:
- Be specific and detailed but acknowledge these are research notes, not published facts
- Focus on the intersection of AI/ML and ${category.name.toLowerCase()}
- Keep a neutral, journalistic perspective
- Do not favor or unfairly criticize any specific company`;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: researchPrompt }]
  });

  return {
    category,
    primaryTopic,
    articleType,
    researchNotes: response.content[0].text
  };
}

/**
 * Generate an original article from research
 */
async function generateArticle(research) {
  const { category, primaryTopic, articleType, researchNotes } = research;
  const typeConfig = ARTICLE_TYPES[articleType];

  const writingPrompt = `You are a senior financial technology journalist writing for AI Credit News, a respected publication covering AI applications in credit scoring, banking, and financial services.

RESEARCH NOTES:
${researchNotes}

ARTICLE REQUIREMENTS:
- Type: ${typeConfig.name}
- Category: ${category.name}
- Primary Topic: ${primaryTopic}
- Word Count: ${typeConfig.wordCount.min}-${typeConfig.wordCount.max} words

WRITING GUIDELINES:

1. HEADLINE
   - Compelling, specific, and newsworthy
   - Should clearly indicate the topic
   - Avoid clickbait; be professional

2. LEAD PARAGRAPH
   - Answer Who, What, When, Where, Why
   - Hook the reader immediately
   - Establish significance

3. BODY
   - Use inverted pyramid structure (most important first)
   - Include specific details and data points
   - Present multiple perspectives fairly
   - Maintain journalistic objectivity
   - Break into clear sections with subheadings if appropriate

4. ANALYSIS
   - Provide expert-level insights
   - Explain implications for:
     * Financial institutions
     * Fintech companies
     * Consumers/borrowers
     * Regulators

5. CONCLUSION
   - Summarize key takeaways
   - Look ahead to future developments

TONE & STYLE:
- Professional but accessible
- Authoritative but not academic
- Neutral and balanced
- Data-driven where possible
- Avoid jargon without explanation

FORMAT: Return a JSON object (no markdown code blocks):
{
  "title": "<compelling headline>",
  "summary": "<2-3 sentence summary for preview>",
  "content": "<full article content with paragraphs separated by \\n\\n>",
  "difficulty_level": "<beginner|intermediate|advanced>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

IMPORTANT:
- Write original content, not a summary of the research notes
- Maintain journalistic ethics and neutrality
- Do not make unfounded claims
- Attribute information appropriately using phrases like "industry analysts suggest" or "according to market research"`;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: writingPrompt }]
  });

  let text = response.content[0].text.trim();

  // Remove markdown code blocks if present
  if (text.startsWith('```json')) {
    text = text.slice(7);
  } else if (text.startsWith('```')) {
    text = text.slice(3);
  }
  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }
  text = text.trim();

  const article = JSON.parse(text);

  return {
    ...article,
    category_slug: Object.keys(CATEGORY_RESEARCH_FOCUS).find(
      k => CATEGORY_RESEARCH_FOCUS[k].name === category.name
    ),
    article_type: articleType,
    is_ai_generated: true
  };
}

/**
 * Save generated article to database for review
 */
async function saveGeneratedArticle(articleData) {
  // Get category ID
  const category = await get(
    'SELECT id FROM categories WHERE slug = ?',
    [articleData.category_slug]
  );

  if (!category) {
    throw new Error(`Category not found: ${articleData.category_slug}`);
  }

  // Insert article with 'review' status (needs admin approval)
  const result = await run(`
    INSERT INTO articles (
      title,
      url,
      source,
      author,
      content,
      summary,
      category_id,
      status,
      difficulty_level,
      published_date,
      is_ai_generated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    articleData.title,
    `ai-generated-${Date.now()}`, // Unique placeholder URL
    'AI Credit News',
    'AI Credit News Editorial Team',
    articleData.content,
    articleData.summary,
    category.id,
    'review', // Requires admin review before publishing
    articleData.difficulty_level || 'intermediate',
    new Date().toISOString().split('T')[0],
    1 // is_ai_generated = true
  ]);

  // Add tags
  if (articleData.tags && articleData.tags.length > 0) {
    const Tag = require('../models/Tag');
    const tagIds = [];
    for (const tagName of articleData.tags) {
      const tag = await Tag.findOrCreate(tagName.toLowerCase());
      tagIds.push(tag.id);
    }
    await Article.addTags(result.lastID, tagIds);
  }

  return {
    id: result.lastID,
    ...articleData
  };
}

/**
 * Generate a single article for a category
 */
async function generateArticleForCategory(categorySlug, articleType = null) {
  console.log(`\n--- Generating article for: ${categorySlug} ---`);

  // Select random article type if not specified
  if (!articleType) {
    const types = Object.keys(ARTICLE_TYPES);
    articleType = types[Math.floor(Math.random() * types.length)];
  }

  console.log(`Article type: ${ARTICLE_TYPES[articleType].name}`);

  // Step 1: Research
  console.log('Researching topic...');
  const research = await researchTopic(categorySlug, articleType);
  console.log(`Topic: ${research.primaryTopic}`);

  // Step 2: Generate article
  console.log('Generating article...');
  const article = await generateArticle(research);
  console.log(`Title: ${article.title}`);

  // Step 3: Save to database
  console.log('Saving to database...');
  const saved = await saveGeneratedArticle(article);
  console.log(`Saved article ID: ${saved.id}`);

  return saved;
}

/**
 * Generate articles for all categories
 */
async function generateArticlesForAllCategories(countPerCategory = 1) {
  console.log('\n========================================');
  console.log('AI Article Generation');
  console.log('========================================');
  console.log(`Generating ${countPerCategory} article(s) per category\n`);

  const results = {
    generated: [],
    errors: []
  };

  const categories = Object.keys(CATEGORY_RESEARCH_FOCUS);

  for (const categorySlug of categories) {
    for (let i = 0; i < countPerCategory; i++) {
      try {
        const article = await generateArticleForCategory(categorySlug);
        results.generated.push({
          id: article.id,
          title: article.title,
          category: categorySlug
        });

        // Rate limit between articles
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Error generating article for ${categorySlug}:`, err.message);
        results.errors.push({
          category: categorySlug,
          error: err.message
        });
      }
    }
  }

  console.log('\n========================================');
  console.log('Generation Complete!');
  console.log('========================================');
  console.log(`Generated: ${results.generated.length} articles`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.generated.length > 0) {
    console.log('\nGenerated articles (awaiting review):');
    results.generated.forEach(a => console.log(`  - [${a.category}] ${a.title}`));
  }

  return results;
}

/**
 * Get articles pending review
 */
async function getArticlesPendingReview() {
  return all(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'review'
    ORDER BY a.scraped_date DESC
  `);
}

/**
 * Auto-publish AI articles that have been in review for more than X hours
 * @param {number} hoursThreshold - Hours to wait before auto-publishing (default: 48)
 * @returns {number} Number of articles auto-published
 */
async function autoPublishOldReviewArticles(hoursThreshold = 48) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursThreshold);
  const cutoffStr = cutoffDate.toISOString();

  // Find AI-generated articles in 'review' status older than threshold
  const articlesToPublish = await all(`
    SELECT id, title
    FROM articles
    WHERE status = 'review'
      AND is_ai_generated = 1
      AND scraped_date < ?
  `, [cutoffStr]);

  if (articlesToPublish.length === 0) {
    return 0;
  }

  // Auto-approve each article
  for (const article of articlesToPublish) {
    await run('UPDATE articles SET status = ? WHERE id = ?', ['approved', article.id]);
    console.log(`[AUTO-PUBLISH] Published: ${article.title}`);
  }

  return articlesToPublish.length;
}

/**
 * Get today's article counts by source type
 * Returns counts of scraped vs AI-generated articles approved today
 */
async function getTodaysArticleCounts() {
  const today = new Date().toISOString().split('T')[0];

  // Count scraped articles approved today
  const scrapedResult = await get(`
    SELECT COUNT(*) as count
    FROM articles
    WHERE status = 'approved'
      AND (is_ai_generated = 0 OR is_ai_generated IS NULL)
      AND DATE(scraped_date) = ?
  `, [today]);

  // Count AI articles created today (any status - to track generation limit)
  const aiResult = await get(`
    SELECT COUNT(*) as count
    FROM articles
    WHERE is_ai_generated = 1
      AND DATE(scraped_date) = ?
  `, [today]);

  return {
    scraped: scrapedResult?.count || 0,
    aiGenerated: aiResult?.count || 0
  };
}

/**
 * Get categories sorted by which needs content most
 * Returns categories with fewest recent articles first
 */
async function getCategoriesNeedingContent() {
  // Get article count per category from the last 7 days
  const categories = await all(`
    SELECT
      c.slug,
      c.name,
      COUNT(a.id) as recent_count
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id
      AND a.status = 'approved'
      AND a.scraped_date >= datetime('now', '-7 days')
    GROUP BY c.id
    ORDER BY recent_count ASC
  `);

  return categories;
}

/**
 * Generate AI articles to supplement daily content
 *
 * Rules:
 * 1. AI articles ≤ scraped articles (AI never majority)
 * 2. Max 3 AI articles per day (hard cap from settings)
 * 3. Min 5 articles/day, max 10 articles/day (from settings)
 * 4. Prioritizes categories with least recent content
 *
 * @param {Object} options - Override settings (or load from DB)
 * @returns {Object} Results of generation
 */
async function supplementDailyContent(options = {}) {
  const progress = options.progressCallback;

  // Load settings from database if not provided
  let settings;
  try {
    const Settings = require('../models/Settings');
    settings = await Settings.getContentSettings();
  } catch {
    // Fallback defaults if Settings not available
    settings = {
      dailyMinArticles: 5,
      dailyMaxArticles: 10,
      dailyMaxAiArticles: 3,
      weeklyMinPerCategory: 5
    };
  }

  // Allow options to override settings
  const dailyMin = options.dailyMin ?? settings.dailyMinArticles;
  const dailyMax = options.dailyMax ?? settings.dailyMaxArticles;
  const maxAiPerDay = options.maxAiPerDay ?? settings.dailyMaxAiArticles;

  console.log('\n========================================');
  console.log('[AI SUPPLEMENT] Checking daily content needs');
  console.log(`[AI SUPPLEMENT] Settings: min=${dailyMin}, max=${dailyMax}, maxAI=${maxAiPerDay}`);
  console.log('========================================');

  // Get today's counts
  const counts = await getTodaysArticleCounts();
  console.log(`Today's articles: ${counts.scraped} scraped, ${counts.aiGenerated} AI-generated`);

  const totalToday = counts.scraped + counts.aiGenerated;

  // Check if max already reached
  if (totalToday >= dailyMax) {
    console.log(`[AI SUPPLEMENT] Daily max (${dailyMax}) already reached. Skipping.`);
    if (progress) {
      progress.log(`Daily max (${dailyMax}) already reached`);
      progress.updateAI({ aiArticlesToGenerate: 0, aiArticlesGenerated: 0 });
    }
    return { generated: [], reason: 'daily_max_reached' };
  }

  // Check if we've hit AI hard cap
  if (counts.aiGenerated >= maxAiPerDay) {
    console.log(`[AI SUPPLEMENT] AI hard cap (${maxAiPerDay}) reached. Skipping.`);
    if (progress) {
      progress.log(`AI hard cap (${maxAiPerDay}) already reached`);
      progress.updateAI({ aiArticlesToGenerate: 0, aiArticlesGenerated: 0 });
    }
    return { generated: [], reason: 'ai_hard_cap_reached' };
  }

  // RULE: AI articles ≤ scraped articles
  // This ensures AI is never the majority
  const maxAiAllowedByBalance = counts.scraped;
  const aiSlotsFromBalance = Math.max(0, maxAiAllowedByBalance - counts.aiGenerated);

  if (aiSlotsFromBalance === 0) {
    console.log(`[AI SUPPLEMENT] Balance rule: AI (${counts.aiGenerated}) cannot exceed scraped (${counts.scraped}). Skipping.`);
    if (progress) {
      progress.log(`AI balance rule: AI (${counts.aiGenerated}) cannot exceed scraped (${counts.scraped})`);
      progress.updateAI({ aiArticlesToGenerate: 0, aiArticlesGenerated: 0 });
    }
    return { generated: [], reason: 'ai_balance_limit', scraped: counts.scraped, aiGenerated: counts.aiGenerated };
  }

  // Calculate how many we need to reach minimum
  const neededForMin = Math.max(0, dailyMin - totalToday);
  // Calculate how many we could add before hitting max
  const roomToMax = dailyMax - totalToday;

  // Calculate remaining AI slots (hard cap)
  const remainingAiSlots = maxAiPerDay - counts.aiGenerated;

  // Determine how many articles to generate:
  // - At least enough to reach minimum (if possible)
  // - But respect AI limits (hard cap and balance rule)
  // - And don't exceed daily max
  const toGenerate = Math.min(
    Math.max(neededForMin, 1), // At least try for 1, or enough to reach min
    remainingAiSlots,          // Respect AI hard cap
    aiSlotsFromBalance,        // Respect balance rule
    roomToMax                  // Don't exceed daily max
  );

  if (toGenerate <= 0) {
    console.log('[AI SUPPLEMENT] No AI articles to generate (limits reached). Skipping.');
    if (progress) {
      progress.log('No AI articles needed (limits reached)');
      progress.updateAI({ aiArticlesToGenerate: 0, aiArticlesGenerated: 0 });
    }
    return { generated: [], reason: 'limits_reached' };
  }

  console.log(`[AI SUPPLEMENT] Will generate: ${toGenerate} AI article(s)`);
  console.log(`  - Needed for min (${dailyMin}): ${neededForMin}`);
  console.log(`  - Room to max (${dailyMax}): ${roomToMax}`);
  console.log(`  - AI hard cap remaining: ${remainingAiSlots}`);
  console.log(`  - AI balance slots (scraped=${counts.scraped}): ${aiSlotsFromBalance}`);

  // Update progress
  if (progress) {
    progress.updateAI({ aiArticlesToGenerate: toGenerate, aiArticlesGenerated: 0 });
    progress.log(`Will generate ${toGenerate} AI article(s)`);
  }

  // Get categories needing content most
  const categoriesNeedingContent = await getCategoriesNeedingContent();
  console.log('Categories by content need:', categoriesNeedingContent.map(c => `${c.slug}(${c.recent_count})`).join(', '));

  const results = {
    generated: [],
    errors: []
  };

  // Generate articles for categories that need content most
  for (let i = 0; i < toGenerate && i < categoriesNeedingContent.length; i++) {
    const category = categoriesNeedingContent[i];

    // Update progress
    if (progress) {
      progress.updateAI({ aiCurrentCategory: category.name });
      progress.log(`Generating article for: ${category.name}`);
    }

    try {
      console.log(`\n[AI SUPPLEMENT] Generating for: ${category.name} (${category.recent_count} recent articles)`);
      const article = await generateArticleForCategory(category.slug);
      results.generated.push({
        id: article.id,
        title: article.title,
        category: category.slug
      });

      // Update progress
      if (progress) {
        progress.updateAI({ aiArticlesGenerated: results.generated.length });
        progress.log(`Generated: ${article.title.substring(0, 40)}...`);
      }

      // Rate limit between articles
      if (i < toGenerate - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error(`Error generating article for ${category.slug}:`, err.message);
      results.errors.push({
        category: category.slug,
        error: err.message
      });
      if (progress) {
        progress.log(`Error generating for ${category.name}: ${err.message}`);
      }
    }
  }

  console.log('\n========================================');
  console.log('[AI SUPPLEMENT] Complete');
  console.log(`Generated: ${results.generated.length}, Errors: ${results.errors.length}`);
  console.log('========================================\n');

  return results;
}

module.exports = {
  generateArticleForCategory,
  generateArticlesForAllCategories,
  getArticlesPendingReview,
  autoPublishOldReviewArticles,
  supplementDailyContent,
  getTodaysArticleCounts,
  getCategoriesNeedingContent,
  CATEGORY_RESEARCH_FOCUS,
  ARTICLE_TYPES
};
