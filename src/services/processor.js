const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Article = require('../models/Article');
const Tag = require('../models/Tag');
const { processArticle } = require('./ai');
const { close } = require('../database/db');

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process all pending articles through AI pipeline
 * @param {Object} options
 * @param {number} options.limit - Max articles to process
 * @param {boolean} options.dryRun - If true, don't save changes
 * @param {Object} options.progressCallback - Progress tracker object
 */
async function processPendingArticles({ limit = 10, dryRun = false, progressCallback } = {}) {
  const progress = progressCallback;

  console.log('\n========================================');
  console.log('AI Article Processing Pipeline');
  console.log('========================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Limit: ${limit} articles\n`);

  // Get pending articles
  const articles = await Article.findAll({
    status: 'pending',
    limit: limit,
    page: 1
  });

  console.log(`Found ${articles.length} pending articles to process\n`);

  // Update progress
  if (progress) {
    progress.updateProcessing({ articlesToProcess: articles.length, articlesProcessed: 0 });
    progress.log(`Found ${articles.length} pending articles to process`);
  }

  if (articles.length === 0) {
    console.log('No pending articles to process.');
    if (progress) progress.log('No pending articles to process');
    return { processed: 0, approved: 0, rejected: 0 };
  }

  let approved = 0;
  let rejected = 0;
  let errors = 0;
  let processed = 0;

  for (const article of articles) {
    // Update progress with current article
    if (progress) {
      progress.updateProcessing({ currentArticle: article.title?.substring(0, 50) });
    }

    try {
      // Process through AI
      const result = await processArticle(article);

      if (!dryRun) {
        // Update article in database
        await Article.update(article.id, {
          relevance_score: result.relevance_score,
          category_id: result.category_id,
          summary: result.summary,
          difficulty_level: result.difficulty_level,
          status: result.status
        });

        // Add tags if relevant
        if (result.status === 'approved' && result.tags.length > 0) {
          const tagIds = [];
          for (const tagName of result.tags) {
            const tag = await Tag.findOrCreate(tagName.toLowerCase());
            tagIds.push(tag.id);
          }
          await Article.addTags(article.id, tagIds);
        }

        console.log(`  ✓ Updated article #${article.id} → ${result.status}`);
      } else {
        console.log(`  [DRY RUN] Would update article #${article.id} → ${result.status}`);
      }

      if (result.status === 'approved') {
        approved++;
        if (progress) progress.log(`Approved: ${article.title?.substring(0, 40)}...`);
      } else {
        rejected++;
        if (progress) progress.log(`Rejected: ${article.title?.substring(0, 40)}...`);
      }

      // Rate limit to avoid API throttling
      await delay(1000);

    } catch (err) {
      console.error(`  ✗ Error processing article #${article.id}:`, err.message);
      errors++;
      if (progress) progress.log(`Error: ${article.title?.substring(0, 40)}...`);
    }

    processed++;

    // Update progress
    if (progress) {
      progress.updateProcessing({
        articlesProcessed: processed,
        articlesApproved: approved,
        articlesRejected: rejected
      });
    }
  }

  const summary = {
    processed: articles.length,
    approved,
    rejected,
    errors
  };

  console.log('\n========================================');
  console.log('Processing Complete!');
  console.log('========================================');
  console.log(`Processed: ${summary.processed}`);
  console.log(`Approved:  ${summary.approved}`);
  console.log(`Rejected:  ${summary.rejected}`);
  console.log(`Errors:    ${summary.errors}`);

  if (progress) {
    progress.log(`Processing complete: ${approved} approved, ${rejected} rejected`);
  }

  return summary;
}

/**
 * Reprocess a specific article
 */
async function reprocessArticle(articleId) {
  const article = await Article.findById(articleId);
  if (!article) {
    throw new Error(`Article #${articleId} not found`);
  }

  const result = await processArticle(article);

  await Article.update(article.id, {
    relevance_score: result.relevance_score,
    category_id: result.category_id,
    summary: result.summary,
    difficulty_level: result.difficulty_level,
    status: result.status
  });

  return result;
}

module.exports = {
  processPendingArticles,
  reprocessArticle
};

// Run directly if called from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 10;
  const dryRun = args.includes('--dry-run');

  processPendingArticles({ limit, dryRun })
    .then(() => close())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Processing failed:', err);
      process.exit(1);
    });
}
