const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  override: true
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Category mapping for AI responses
const CATEGORIES = {
  'ai-credit-scoring': 1,
  'banking-automation': 2,
  'fraud-detection': 3,
  'regulatory-compliance': 4,
  'risk-management': 5,
  'customer-experience': 6,
  'research-innovation': 7,
  'case-studies': 8,
  'industry-news': 9,
  'ethics-bias': 10
};

const CATEGORY_LIST = `
1. ai-credit-scoring - Machine learning models for creditworthiness
2. banking-automation - AI-powered banking operations
3. fraud-detection - AI for detecting financial fraud
4. regulatory-compliance - AI governance, fairness, regulations
5. risk-management - AI for financial risk assessment
6. customer-experience - Chatbots, personalization, AI interfaces
7. research-innovation - Academic papers, new techniques
8. case-studies - Real-world implementations
9. industry-news - Company announcements, partnerships
10. ethics-bias - Fair lending, algorithmic bias, responsible AI
`;

/**
 * Analyze article relevance to AI in credit/banking
 */
async function analyzeRelevance(article) {
  const contentExcerpt = (article.content || article.summary || '').substring(0, 3000);

  const prompt = `Analyze this article and determine its relevance to AI applications in credit scoring and banking.

Title: ${article.title}
Source: ${article.source}
Content: ${contentExcerpt}

IMPORTANT: We are looking for articles specifically about the INTERSECTION of:
- Artificial Intelligence / Machine Learning AND
- Credit scoring, lending, banking, financial services, fintech

Articles that are ONLY about general AI (without finance focus) should score low.
Articles that are ONLY about banking (without AI focus) should score low.
Articles about AI IN banking/credit/finance should score high.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "relevance_score": <number 0-10>,
  "is_relevant": <boolean>,
  "primary_category": "<category-slug from list>",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "reasoning": "<brief 1-2 sentence explanation>"
}

Categories to choose from:
${CATEGORY_LIST}

If the article is not relevant to AI in credit/banking, use "industry-news" as the category and set is_relevant to false.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text.trim();

    // Parse JSON response
    const result = JSON.parse(text);

    return {
      relevance_score: Math.min(10, Math.max(0, result.relevance_score)),
      is_relevant: result.is_relevant && result.relevance_score >= 6,
      category_slug: result.primary_category,
      category_id: CATEGORIES[result.primary_category] || 9,
      tags: result.suggested_tags || [],
      reasoning: result.reasoning
    };
  } catch (err) {
    console.error('Error analyzing relevance:', err.message);
    throw err;
  }
}

/**
 * Generate a concise summary of the article
 */
async function summarizeArticle(article) {
  const content = (article.content || '').substring(0, 4000);

  const prompt = `Summarize this article in 2-3 sentences for a news aggregation site focused on AI in credit and banking. Make it accessible to both technical and non-technical readers.

Title: ${article.title}
Content: ${content}

Return ONLY the summary text, no quotes or labels.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text.trim();
  } catch (err) {
    console.error('Error summarizing article:', err.message);
    throw err;
  }
}

/**
 * Assess the technical difficulty level
 */
async function assessDifficulty(article) {
  const excerpt = (article.content || article.summary || '').substring(0, 2000);

  const prompt = `Rate the technical difficulty of this article for readers interested in AI and banking:

Title: ${article.title}
Content: ${excerpt}

Choose ONE level:
- beginner: General audience, minimal jargon, introductory concepts
- intermediate: Some technical knowledge required, industry terminology
- advanced: Deep technical or domain expertise required, research-level

Return ONLY one word: beginner, intermediate, or advanced`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 20,
      messages: [{ role: 'user', content: prompt }]
    });

    const level = response.content[0].text.trim().toLowerCase();

    if (['beginner', 'intermediate', 'advanced'].includes(level)) {
      return level;
    }
    return 'intermediate'; // default
  } catch (err) {
    console.error('Error assessing difficulty:', err.message);
    return 'intermediate';
  }
}

/**
 * Full article processing pipeline
 */
async function processArticle(article) {
  console.log(`\nProcessing: ${article.title.substring(0, 50)}...`);

  // Step 1: Analyze relevance
  console.log('  → Analyzing relevance...');
  const relevance = await analyzeRelevance(article);
  console.log(`    Score: ${relevance.relevance_score}/10, Relevant: ${relevance.is_relevant}`);
  console.log(`    Category: ${relevance.category_slug}`);
  console.log(`    Reasoning: ${relevance.reasoning}`);

  const result = {
    relevance_score: relevance.relevance_score,
    category_id: relevance.category_id,
    tags: relevance.tags,
    status: relevance.is_relevant ? 'approved' : 'rejected'
  };

  // Step 2: If relevant, generate summary and assess difficulty
  if (relevance.is_relevant) {
    console.log('  → Generating summary...');
    result.summary = await summarizeArticle(article);

    console.log('  → Assessing difficulty...');
    result.difficulty_level = await assessDifficulty(article);
    console.log(`    Difficulty: ${result.difficulty_level}`);
  } else {
    result.summary = article.summary; // Keep original
    result.difficulty_level = null;
  }

  return result;
}

module.exports = {
  analyzeRelevance,
  summarizeArticle,
  assessDifficulty,
  processArticle,
  CATEGORIES
};
