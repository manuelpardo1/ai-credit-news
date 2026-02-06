const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  override: true
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Category mapping for AI responses (matches database IDs)
const CATEGORIES = {
  'credit-scoring': 11,
  'fraud-detection': 12,
  'credit-risk': 13,
  'income-employment': 14,
  'regulatory-compliance': 15,
  'lending-automation': 16
};

const CATEGORY_LIST = `
1. credit-scoring - ML models for credit scores and creditworthiness assessment
2. fraud-detection - AI for detecting financial fraud and anomalies
3. credit-risk - AI for credit risk assessment and management
4. income-employment - AI for income verification and employment analysis
5. regulatory-compliance - AI governance, fair lending regulations, compliance
6. lending-automation - AI-powered lending decisions and loan processing
`;

/**
 * Quick title filter using Haiku (cheap, fast)
 * Returns true if the article title suggests relevance to AI in finance
 */
async function filterByTitle(title, source) {
  const prompt = `Is this article likely about AI/ML in credit, banking, or financial services?
Title: "${title}"
Source: ${source}

Answer only YES or NO.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
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
  const contentExcerpt = (article.content || article.summary || '').substring(0, 4000);

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
${CATEGORY_LIST}

DIFFICULTY LEVELS:
- beginner: General audience, minimal jargon
- intermediate: Some technical knowledge required
- advanced: Deep expertise required

If not relevant, set summary and difficulty_level to null.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text.trim();
    const result = JSON.parse(text);

    return {
      relevance_score: Math.min(10, Math.max(0, result.relevance_score)),
      is_relevant: result.is_relevant && result.relevance_score >= 6,
      category_slug: result.primary_category,
      category_id: CATEGORIES[result.primary_category] || 11, // default to credit-scoring
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
    return {
      relevance_score: 2,
      category_id: 11, // default to credit-scoring
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
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text.trim();
    const result = JSON.parse(text);

    return {
      title: result.title,
      content: result.content,
      week_start: weekAgo.toISOString().split('T')[0],
      week_end: today.toISOString().split('T')[0]
    };
  } catch (err) {
    console.error('Error generating editorial:', err.message);
    throw err;
  }
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
  CATEGORIES
};
