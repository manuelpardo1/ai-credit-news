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
 * @param {string} options.targetStatus - Status for AI-approved articles ('approved' or 'queued')
 */
async function processPendingArticles({ limit = 10, dryRun = false, progressCallback, targetStatus = 'approved' } = {}) {
  const progress = progressCallback;

  console.log('\n========================================');
  console.log('AI Article Processing Pipeline');
  console.log('========================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Limit: ${limit} articles`);
  console.log(`Target status: ${targetStatus}\n`);

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
    // Check for cancel/pause
    if (progress) {
      if (progress.isCancelRequested()) {
        progress.log('Processing cancelled by user');
        break;
      }
      await progress.checkPause();
    }

    // Update progress with current article
    if (progress) {
      progress.updateProcessing({ currentArticle: article.title?.substring(0, 50) });
    }

    try {
      // Process through AI
      const result = await processArticle(article);

      // Determine final status: use targetStatus for approved articles, keep rejected as-is
      const finalStatus = (result.status === 'approved' && targetStatus === 'queued')
        ? 'queued'
        : result.status;

      if (!dryRun) {
        // Update article in database
        await Article.update(article.id, {
          relevance_score: result.relevance_score,
          category_id: result.category_id,
          summary: result.summary,
          difficulty_level: result.difficulty_level,
          status: finalStatus
        });

        // Add tags if relevant (approved or queued)
        if (result.status === 'approved' && result.tags.length > 0) {
          const tagIds = [];
          for (const tagName of result.tags) {
            const tag = await Tag.findOrCreate(tagName.toLowerCase());
            tagIds.push(tag.id);
          }
          await Article.addTags(article.id, tagIds);
        }

        console.log(`  ✓ Updated article #${article.id} → ${finalStatus}`);
      } else {
        console.log(`  [DRY RUN] Would update article #${article.id} → ${finalStatus}`);
      }

      if (result.status === 'approved') {
        approved++;
        const statusLabel = targetStatus === 'queued' ? 'Queued' : 'Approved';
        if (progress) progress.log(`${statusLabel}: ${article.title?.substring(0, 40)}...`);
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
 * Process ALL pending articles through AI, sending approved ones to 'queued' status
 * Used for bulk processing / clearing the backlog
 * @param {Object} options
 * @param {Object} options.progressCallback - Progress tracker object
 */
async function processAllPending({ progressCallback } = {}) {
  // Count total pending first
  const pendingCount = await Article.countByStatus('pending');

  console.log(`[BULK PROCESS] Found ${pendingCount} pending articles to process`);

  if (pendingCount === 0) {
    if (progressCallback) progressCallback.log('No pending articles to process');
    return { processed: 0, queued: 0, rejected: 0, errors: 0 };
  }

  // Process all with no limit, targeting 'queued' status
  const result = await processPendingArticles({
    limit: pendingCount,
    targetStatus: 'queued',
    progressCallback
  });

  return {
    processed: result.processed,
    queued: result.approved,   // 'approved' count maps to 'queued' count
    rejected: result.rejected,
    errors: result.errors
  };
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
  processAllPending,
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
