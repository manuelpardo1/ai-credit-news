const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  override: true
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model tiers - ordered by preference (newest/best first)
const MODEL_TIERS = {
  // Fast tier: cheap, quick filtering tasks (title relevance check)
  fast: [
    'claude-3-5-haiku-20241022',
    'claude-3-haiku-20240307'
  ],
  // Quality tier: full article analysis (relevance, summary, categorization)
  quality: [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-haiku-20240307'  // fallback
  ],
  // Premium tier: editorial generation (highest quality writing)
  premium: [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-haiku-20240307'  // fallback
  ]
};

// Cache for available models (detected at runtime)
let availableModels = null;
let modelDetectionPromise = null;

/**
 * Detect which models are available with current API key
 * Runs once at startup and caches result
 */
async function detectAvailableModels() {
  if (availableModels) return availableModels;
  if (modelDetectionPromise) return modelDetectionPromise;

  modelDetectionPromise = (async () => {
    const allModels = new Set([
      ...MODEL_TIERS.fast,
      ...MODEL_TIERS.quality,
      ...MODEL_TIERS.premium
    ]);

    const available = new Set();
    console.log('Detecting available Claude models...');

    for (const model of allModels) {
      try {
        await anthropic.messages.create({
          model: model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }]
        });
        available.add(model);
        console.log(`  ✓ ${model}`);
      } catch (err) {
        if (err.status === 404) {
          console.log(`  ✗ ${model} (not available)`);
        } else {
          // Other errors (rate limit, etc) - assume model exists
          available.add(model);
          console.log(`  ? ${model} (error: ${err.status || err.message}, assuming available)`);
        }
      }
    }

    availableModels = available;
    return available;
  })();

  return modelDetectionPromise;
}

/**
 * Get the best available model for a given tier
 */
async function getModelForTier(tier) {
  const available = await detectAvailableModels();
  const candidates = MODEL_TIERS[tier] || MODEL_TIERS.quality;

  for (const model of candidates) {
    if (available.has(model)) {
      return model;
    }
  }

  // Ultimate fallback - return first available model
  return available.values().next().value || 'claude-3-haiku-20240307';
}

// Active model configuration (populated after detection)
const MODELS = {
  fast: null,
  full: null,
  editorial: null
};

/**
 * Initialize models - call this before processing
 */
async function initializeModels() {
  if (MODELS.fast && MODELS.full && MODELS.editorial) return MODELS;

  // Allow env var overrides
  MODELS.fast = process.env.AI_MODEL_FAST || await getModelForTier('fast');
  MODELS.full = process.env.AI_MODEL_FULL || await getModelForTier('quality');
  MODELS.editorial = process.env.AI_MODEL_EDITORIAL || await getModelForTier('premium');

  console.log('\nModel configuration:');
  console.log(`  Fast (title filter): ${MODELS.fast}`);
  console.log(`  Full (analysis):     ${MODELS.full}`);
  console.log(`  Editorial:           ${MODELS.editorial}\n`);

  return MODELS;
}

// Category cache - loaded dynamically from database
let categoryCache = null;
let categoryListCache = null;

async function getCategories() {
  if (categoryCache) return categoryCache;

  const Category = require('../models/Category');
  const categories = await Category.findAll();

  categoryCache = {};
  for (const cat of categories) {
    categoryCache[cat.slug] = cat.id;
  }

  console.log('Loaded category mapping:', categoryCache);
  return categoryCache;
}

/**
 * Get category ID with robust fallback handling
 * Handles slug changes, missing categories, and creates if needed
 */
async function getCategoryId(slug) {
  const Category = require('../models/Category');

  // Try to find category with fuzzy matching
  const category = await Category.findBySlugFuzzy(slug);
  if (category) return category.id;

  // Get default category as fallback
  const defaultCat = await Category.getDefault();
  if (defaultCat) {
    console.log(`  ⚠ Category "${slug}" not found, using default: ${defaultCat.slug}`);
    return defaultCat.id;
  }

  // Should never happen, but just in case
  console.error(`  ✗ No categories found in database!`);
  return null;
}

/**
 * Get dynamic category list for AI prompts
 * Regenerates based on current database state
 */
async function getCategoryListForPrompt() {
  if (categoryListCache) return categoryListCache;

  const Category = require('../models/Category');
  const categories = await Category.findAll();

  categoryListCache = categories.map((cat, i) =>
    `${i + 1}. ${cat.slug} - ${cat.description || cat.name}`
  ).join('\n');

  return categoryListCache;
}

/**
 * Reset category caches (call when categories change)
 */
function resetCategoryCache() {
  categoryCache = null;
  categoryListCache = null;
}

// CATEGORY_LIST is now generated dynamically via getCategoryListForPrompt()

/**
 * Quick title filter using Haiku (cheap, fast)
 * Returns true if the article title suggests relevance to AI in finance
 */
async function filterByTitle(title, source) {
  await initializeModels();

  const prompt = `Is this article likely about AI/ML in credit, banking, or financial services?
Title: "${title}"
Source: ${source}

Answer only YES or NO.`;

  try {
    const response = await anthropic.messages.create({
      model: MODELS.fast,
      max_tokens: 10,
      messages: [{ role: 'user', content: prompt }]
    });

    const answer = response.content[0].text.trim().toUpperCase();
    return answer.includes('YES');
  } catch (err) {
    console.error('Error in title filter:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    // On error, pass through to full processing
    return true;
  }
}

/**
 * Combined article processing - single API call for relevance, summary, difficulty
 * Cost optimization: replaces 3 separate calls with 1
 */
async function processArticleFull(article) {
  const contentExcerpt = (article.content || article.summary || '').substring(0, 2000);

  // Get dynamic category list from database
  const categoryList = await getCategoryListForPrompt();

  const prompt = `Analyze this article for an AI in credit/banking news aggregation site.

Title: ${article.title}
Source: ${article.source}
Content: ${contentExcerpt}

TASK: Evaluate relevance, categorize, summarize, and assess difficulty in ONE response.

RELEVANCE CRITERIA:
- Articles must be about the INTERSECTION of AI/ML AND credit/banking/finance
- Score 7-10: Directly about AI in credit scoring, banking automation, fintech AI
- Score 4-6: Related but tangential (general fintech, banking trends mentioning AI)
- Score 0-3: Not relevant (general AI without finance, or finance without AI)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "relevance_score": <0-10>,
  "is_relevant": <true if score >= 6>,
  "primary_category": "<category-slug>",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "reasoning": "<1-2 sentences>",
  "summary": "<2-3 sentence summary for approved articles, or null if not relevant>",
  "difficulty_level": "<beginner|intermediate|advanced, or null if not relevant>"
}

Categories:
${categoryList}

DIFFICULTY LEVELS:
- beginner: General audience, minimal jargon
- intermediate: Some technical knowledge required
- advanced: Deep expertise required

If not relevant, set summary and difficulty_level to null.`;

  try {
    await initializeModels();

    const response = await anthropic.messages.create({
      model: MODELS.full,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
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

    const result = JSON.parse(text);

    // Get category ID with robust fallback handling
    const categoryId = await getCategoryId(result.primary_category);

    return {
      relevance_score: Math.min(10, Math.max(0, result.relevance_score)),
      is_relevant: result.is_relevant && result.relevance_score >= 6,
      category_slug: result.primary_category,
      category_id: categoryId,
      tags: result.suggested_tags || [],
      reasoning: result.reasoning,
      summary: result.summary,
      difficulty_level: result.difficulty_level,
      status: (result.is_relevant && result.relevance_score >= 6) ? 'approved' : 'rejected'
    };
  } catch (err) {
    console.error('Error in full processing:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    throw err;
  }
}

/**
 * Main article processing pipeline (optimized)
 * Uses Haiku for quick filtering, then Sonnet for full processing
 */
async function processArticle(article) {
  console.log(`\nProcessing: ${article.title.substring(0, 50)}...`);

  // Step 1: Quick title filter with Haiku (cheap)
  console.log('  → Quick title filter (Haiku)...');
  const passesFilter = await filterByTitle(article.title, article.source);

  if (!passesFilter) {
    console.log('    ✗ Filtered out by title - not relevant');
    // Get default category for rejected articles
    const defaultCategoryId = await getCategoryId('credit-scoring');
    return {
      relevance_score: 2,
      category_id: defaultCategoryId,
      tags: [],
      summary: article.summary,
      difficulty_level: null,
      status: 'rejected'
    };
  }
  console.log('    ✓ Title passes filter');

  // Step 2: Full processing with Sonnet (combined call)
  console.log('  → Full analysis (Sonnet)...');
  const result = await processArticleFull(article);

  console.log(`    Score: ${result.relevance_score}/10, Status: ${result.status}`);
  console.log(`    Category: ${result.category_slug}`);
  console.log(`    Reasoning: ${result.reasoning}`);
  if (result.difficulty_level) {
    console.log(`    Difficulty: ${result.difficulty_level}`);
  }

  return result;
}

/**
 * Generate weekly editorial analyzing trends
 */
async function generateEditorial(articles) {
  const articleSummaries = articles.map((a, i) =>
    `${i + 1}. "${a.title}" - ${a.summary || 'No summary'}`
  ).join('\n');

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const prompt = `You are the editor of AI Credit News, a publication covering AI applications in credit scoring, risk management, and banking.

Write a weekly editorial (500-700 words) analyzing the key trends and developments from this week's articles.

ARTICLES FROM THIS WEEK:
${articleSummaries}

YOUR EDITORIAL SHOULD:
1. Open with a compelling hook about the week's biggest theme
2. Analyze 2-3 major trends or developments
3. Discuss implications for:
   - Risk management and credit scoring professionals
   - Banks and financial institutions
   - Fintech companies and innovators
4. Provide actionable insights or recommendations
5. Close with what to watch for next week

TONE: Professional but accessible, authoritative but not dry. Write for busy executives who want insights, not just news summaries.

FORMAT: Return a JSON object:
{
  "title": "<compelling editorial title>",
  "content": "<full editorial text with paragraphs separated by \\n\\n>"
}`;

  try {
    await initializeModels();

    const response = await anthropic.messages.create({
      model: MODELS.editorial,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
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

    const result = JSON.parse(text);

    // Calculate proper Monday-Sunday week
    const getMonday = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      return new Date(date.setDate(diff));
    };

    const monday = getMonday(today);
    monday.setDate(monday.getDate() - 7); // Previous week's Monday
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6); // That week's Sunday

    return {
      title: result.title,
      content: result.content,
      week_start: monday.toISOString().split('T')[0],
      week_end: sunday.toISOString().split('T')[0]
    };
  } catch (err) {
    console.error('Error generating editorial:', err.message);
    throw err;
  }
}

/**
 * Force re-detection of available models
 * Call this if models change or to refresh the cache
 */
function resetModelCache() {
  availableModels = null;
  modelDetectionPromise = null;
  MODELS.fast = null;
  MODELS.full = null;
  MODELS.editorial = null;
}

// Legacy functions for backwards compatibility
async function analyzeRelevance(article) {
  const result = await processArticleFull(article);
  return {
    relevance_score: result.relevance_score,
    is_relevant: result.is_relevant,
    category_slug: result.category_slug,
    category_id: result.category_id,
    tags: result.tags,
    reasoning: result.reasoning
  };
}

async function summarizeArticle(article) {
  const result = await processArticleFull(article);
  return result.summary || article.summary;
}

async function assessDifficulty(article) {
  const result = await processArticleFull(article);
  return result.difficulty_level || 'intermediate';
}

module.exports = {
  filterByTitle,
  processArticleFull,
  processArticle,
  generateEditorial,
  analyzeRelevance,
  summarizeArticle,
  assessDifficulty,
  getCategories,
  getCategoryId,
  getCategoryListForPrompt,
  resetCategoryCache,
  initializeModels,
  detectAvailableModels,
  resetModelCache
};
