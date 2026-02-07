const express = require('express');
const router = express.Router();
const Editorial = require('../models/Editorial');
const Article = require('../models/Article');
const Subscriber = require('../models/Subscriber');
const NewsletterLog = require('../models/NewsletterLog');
const Analytics = require('../models/Analytics');
const { requireAuth, validatePassword, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { generateWeeklyEditorial, createWelcomeEditorial } = require('../services/editorial');
const { sendWeeklyNewsletter, sendExtraordinaryNewsletter } = require('../services/newsletter');
const { generateArticleForCategory, generateArticlesForAllCategories, getArticlesPendingReview, getTodaysArticleCounts, getCategoriesNeedingContent, supplementDailyContent, promoteQueuedArticles, getQueuedCount, CATEGORY_RESEARCH_FOCUS } = require('../services/articleGenerator');
const Settings = require('../models/Settings');
const { runScrape } = require('../services/scraper');
const { processPendingArticles, processAllPending } = require('../services/processor');
const OperationProgress = require('../models/OperationProgress');

// GET /admin - Redirect to analytics dashboard
router.get('/', requireAuth, (req, res) => {
  res.redirect('/admin/analytics');
});

// GET /admin/login - Login page
router.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.signedCookies && req.signedCookies.admin === 'authenticated') {
    return res.redirect('/admin/analytics');
  }
  res.render('admin/login', { error: null });
});

// GET /admin/analytics - Analytics dashboard
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const stats = await Analytics.getDashboardStats();
    const topArticles = await Analytics.getTopArticles(10);
    const categoryStats = await Analytics.getCategoryStats();
    const sourceStats = await Analytics.getSourceStats();
    const freshness = await Analytics.getContentFreshness();

    res.render('admin/analytics', {
      stats,
      topArticles,
      categoryStats,
      sourceStats,
      freshness
    });
  } catch (err) {
    console.error('Error loading analytics:', err);
    res.status(500).send('Error loading analytics dashboard');
  }
});

// POST /admin/login - Process login
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (validatePassword(password)) {
    setAuthCookie(res);
    res.redirect('/admin/settings');
  } else {
    res.render('admin/login', { error: 'Invalid password' });
  }
});

// GET /admin/logout - Logout
router.get('/logout', (req, res) => {
  clearAuthCookie(res);
  res.redirect('/');
});

// GET /admin/editorials - List all editorials
router.get('/editorials', requireAuth, async (req, res) => {
  try {
    const editorials = await Editorial.findAll({});
    const subscriberCount = await Subscriber.count(true);
    const newsletterLogs = await NewsletterLog.findRecent(5);

    res.render('admin/editorials', {
      editorials,
      subscriberCount,
      newsletterLogs
    });
  } catch (err) {
    console.error('Error loading editorials:', err);
    res.status(500).send('Error loading editorials');
  }
});

// POST /admin/editorial/generate - Generate new editorial (MUST be before :id route)
router.post('/editorial/generate', requireAuth, async (req, res) => {
  try {
    const editorial = await generateWeeklyEditorial();
    if (editorial) {
      res.redirect(`/admin/editorial/${editorial.id}`);
    } else {
      res.redirect('/admin/editorials?message=Not enough articles to generate editorial');
    }
  } catch (err) {
    console.error('Error generating editorial:', err);
    res.redirect('/admin/editorials?message=Error generating editorial');
  }
});

// POST /admin/editorial/welcome - Create welcome editorial (MUST be before :id route)
router.post('/editorial/welcome', requireAuth, async (req, res) => {
  try {
    const editorial = await createWelcomeEditorial();
    res.redirect(`/admin/editorial/${editorial.id}`);
  } catch (err) {
    console.error('Error creating welcome editorial:', err);
    res.redirect('/admin/editorials?message=Error creating editorial');
  }
});

// GET /admin/editorial/:id - Edit editorial
router.get('/editorial/:id', requireAuth, async (req, res) => {
  try {
    const editorial = await Editorial.findById(req.params.id);
    if (!editorial) {
      return res.status(404).send('Editorial not found');
    }
    res.render('admin/editorial', { editorial, message: null });
  } catch (err) {
    console.error('Error loading editorial:', err);
    res.status(500).send('Error loading editorial');
  }
});

// POST /admin/editorial/:id - Save editorial changes
router.post('/editorial/:id', requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const editorial = await Editorial.update(req.params.id, { title, content });
    res.render('admin/editorial', { editorial, message: 'Editorial saved successfully!' });
  } catch (err) {
    console.error('Error saving editorial:', err);
    const editorial = await Editorial.findById(req.params.id);
    res.render('admin/editorial', { editorial, message: 'Error saving editorial' });
  }
});

// POST /admin/editorial/:id/publish - Publish editorial
router.post('/editorial/:id/publish', requireAuth, async (req, res) => {
  try {
    await Editorial.publish(req.params.id);
    res.redirect('/admin/editorials');
  } catch (err) {
    console.error('Error publishing editorial:', err);
    res.status(500).send('Error publishing editorial');
  }
});

// POST /admin/editorial/:id/delete - Delete editorial
router.post('/editorial/:id/delete', requireAuth, async (req, res) => {
  try {
    await Editorial.delete(req.params.id);
    res.redirect('/admin/editorials');
  } catch (err) {
    console.error('Error deleting editorial:', err);
    res.status(500).send('Error deleting editorial');
  }
});

// POST /admin/newsletter/send - Send newsletter manually
router.post('/newsletter/send', requireAuth, async (req, res) => {
  try {
    const result = await sendWeeklyNewsletter();
    res.redirect(`/admin/editorials?message=Newsletter sent to ${result.sent} subscribers`);
  } catch (err) {
    console.error('Error sending newsletter:', err);
    res.redirect('/admin/editorials?message=Error sending newsletter');
  }
});

// POST /admin/newsletter/extraordinary - Send extraordinary newsletter
router.post('/newsletter/extraordinary', requireAuth, async (req, res) => {
  try {
    const result = await sendExtraordinaryNewsletter();
    res.redirect(`/admin/editorials?message=Extraordinary newsletter sent to ${result.sent} subscribers`);
  } catch (err) {
    console.error('Error sending newsletter:', err);
    res.redirect('/admin/editorials?message=Error sending newsletter');
  }
});

// GET /admin/subscribers - List subscribers
router.get('/subscribers', requireAuth, async (req, res) => {
  try {
    const subscribers = await Subscriber.findAll({});
    const activeCount = await Subscriber.count(true);
    res.render('admin/subscribers', { subscribers, activeCount });
  } catch (err) {
    console.error('Error loading subscribers:', err);
    res.status(500).send('Error loading subscribers');
  }
});

// GET /admin/brand-guide - Brand guide page
router.get('/brand-guide', requireAuth, (req, res) => {
  res.render('admin/brand-guide');
});

// ============================================
// AI-Generated Articles Management
// ============================================

// GET /admin/articles - List articles pending review
router.get('/articles', requireAuth, async (req, res) => {
  try {
    const pendingReview = await getArticlesPendingReview();
    const categories = Object.entries(CATEGORY_RESEARCH_FOCUS).map(([slug, data]) => ({
      slug,
      name: data.name
    }));
    res.render('admin/articles', {
      pendingReview,
      categories,
      message: req.query.message || null
    });
  } catch (err) {
    console.error('Error loading articles:', err);
    res.status(500).send('Error loading articles');
  }
});

// POST /admin/article/generate - Generate a single AI article
router.post('/article/generate', requireAuth, async (req, res) => {
  try {
    const { category } = req.body;
    if (!category || !CATEGORY_RESEARCH_FOCUS[category]) {
      return res.redirect('/admin/articles?message=Invalid category');
    }

    const article = await generateArticleForCategory(category);
    res.redirect(`/admin/article/${article.id}?message=Article generated successfully`);
  } catch (err) {
    console.error('Error generating article:', err);
    res.redirect('/admin/articles?message=Error generating article: ' + err.message);
  }
});

// POST /admin/article/generate-all - Generate articles for all categories
router.post('/article/generate-all', requireAuth, async (req, res) => {
  try {
    const results = await generateArticlesForAllCategories(1);
    res.redirect(`/admin/articles?message=Generated ${results.generated.length} articles`);
  } catch (err) {
    console.error('Error generating articles:', err);
    res.redirect('/admin/articles?message=Error generating articles');
  }
});

// GET /admin/article/:id - Edit AI-generated article
router.get('/article/:id', requireAuth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).send('Article not found');
    }
    const categories = Object.entries(CATEGORY_RESEARCH_FOCUS).map(([slug, data]) => ({
      slug,
      name: data.name
    }));
    res.render('admin/article', {
      article,
      categories,
      message: req.query.message || null
    });
  } catch (err) {
    console.error('Error loading article:', err);
    res.status(500).send('Error loading article');
  }
});

// POST /admin/article/:id - Save article changes
router.post('/article/:id', requireAuth, async (req, res) => {
  try {
    const { title, summary, content, category_id, difficulty_level } = req.body;
    await Article.update(req.params.id, {
      title,
      summary,
      content,
      category_id: parseInt(category_id),
      difficulty_level
    });
    res.redirect(`/admin/article/${req.params.id}?message=Article saved successfully`);
  } catch (err) {
    console.error('Error saving article:', err);
    res.redirect(`/admin/article/${req.params.id}?message=Error saving article`);
  }
});

// POST /admin/article/:id/approve - Approve and publish article
router.post('/article/:id/approve', requireAuth, async (req, res) => {
  try {
    await Article.update(req.params.id, { status: 'approved' });
    res.redirect('/admin/articles?message=Article approved and published');
  } catch (err) {
    console.error('Error approving article:', err);
    res.redirect('/admin/articles?message=Error approving article');
  }
});

// POST /admin/article/:id/reject - Reject article
router.post('/article/:id/reject', requireAuth, async (req, res) => {
  try {
    await Article.update(req.params.id, { status: 'rejected' });
    res.redirect('/admin/articles?message=Article rejected');
  } catch (err) {
    console.error('Error rejecting article:', err);
    res.redirect('/admin/articles?message=Error rejecting article');
  }
});

// POST /admin/article/:id/delete - Delete article
router.post('/article/:id/delete', requireAuth, async (req, res) => {
  try {
    await Article.delete(req.params.id);
    res.redirect('/admin/articles?message=Article deleted');
  } catch (err) {
    console.error('Error deleting article:', err);
    res.redirect('/admin/articles?message=Error deleting article');
  }
});

// ============================================
// Article Queue (Extraordinary Approval)
// ============================================

// GET /admin/queue - Queue page for bulk review of AI-scored scraped articles
router.get('/queue', requireAuth, async (req, res) => {
  try {
    const queuedArticles = await Article.findAllQueued();
    const pendingCount = await Article.countByStatus('pending');

    res.render('admin/queue', {
      queuedArticles,
      pendingCount,
      message: req.query.message || null
    });
  } catch (err) {
    console.error('Error loading queue:', err);
    res.status(500).send('Error loading article queue');
  }
});

// POST /admin/queue/bulk-approve - Bulk approve queued articles
router.post('/queue/bulk-approve', requireAuth, async (req, res) => {
  try {
    let { articleIds } = req.body;
    let ids;

    if (articleIds === 'all') {
      const queued = await Article.findAllQueued();
      ids = queued.map(a => a.id);
    } else if (Array.isArray(articleIds)) {
      ids = articleIds.map(id => parseInt(id));
    } else if (articleIds) {
      ids = [parseInt(articleIds)];
    } else {
      return res.redirect('/admin/queue?message=No articles selected');
    }

    const count = await Article.bulkUpdateStatus(ids, 'approved');
    res.redirect(`/admin/queue?message=${count} articles approved`);
  } catch (err) {
    console.error('Error bulk approving:', err);
    res.redirect('/admin/queue?message=Error approving articles');
  }
});

// POST /admin/queue/bulk-reject - Bulk reject queued articles
router.post('/queue/bulk-reject', requireAuth, async (req, res) => {
  try {
    let { articleIds } = req.body;
    let ids;

    if (Array.isArray(articleIds)) {
      ids = articleIds.map(id => parseInt(id));
    } else if (articleIds) {
      ids = [parseInt(articleIds)];
    } else {
      return res.redirect('/admin/queue?message=No articles selected');
    }

    const count = await Article.bulkUpdateStatus(ids, 'rejected');
    res.redirect(`/admin/queue?message=${count} articles rejected`);
  } catch (err) {
    console.error('Error bulk rejecting:', err);
    res.redirect('/admin/queue?message=Error rejecting articles');
  }
});

// ============================================
// Content Settings
// ============================================

// GET /admin/settings - Content settings page
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const settings = await Settings.getAll();
    const stats = await getTodaysArticleCounts();
    const pendingReview = await getArticlesPendingReview();
    stats.pendingReview = pendingReview.length;

    // Add pending processing and queued counts
    stats.pendingProcessing = await Article.countByStatus('pending');

    // Get category stats for the balance display
    const categoryStats = await getCategoriesNeedingContent();

    res.render('admin/settings', {
      settings,
      stats,
      categoryStats,
      message: req.query.message || null
    });
  } catch (err) {
    console.error('Error loading settings:', err);
    res.status(500).send('Error loading settings');
  }
});

// POST /admin/settings - Save settings
router.post('/settings', requireAuth, async (req, res) => {
  try {
    const {
      daily_min_articles,
      daily_max_articles,
      daily_max_ai_articles,
      weekly_min_per_category,
      scrape_max_age_hours,
      articles_per_scrape,
      auto_publish_hours
    } = req.body;

    // Validate
    const minArticles = parseInt(daily_min_articles);
    const maxArticles = parseInt(daily_max_articles);
    const maxAi = parseInt(daily_max_ai_articles);

    if (minArticles > maxArticles) {
      return res.redirect('/admin/settings?message=Error: Minimum cannot exceed maximum');
    }

    if (maxAi > maxArticles) {
      return res.redirect('/admin/settings?message=Error: AI max cannot exceed daily max');
    }

    await Settings.updateMultiple({
      daily_min_articles: minArticles,
      daily_max_articles: maxArticles,
      daily_max_ai_articles: maxAi,
      weekly_min_per_category: parseInt(weekly_min_per_category),
      scrape_max_age_hours: parseInt(scrape_max_age_hours),
      articles_per_scrape: parseInt(articles_per_scrape),
      auto_publish_hours: parseInt(auto_publish_hours)
    });

    res.redirect('/admin/settings?message=Settings saved successfully');
  } catch (err) {
    console.error('Error saving settings:', err);
    res.redirect('/admin/settings?message=Error saving settings');
  }
});

// ============================================
// Manual Content Operations
// ============================================

// GET /admin/operation-progress - API endpoint for real-time progress
router.get('/operation-progress', requireAuth, (req, res) => {
  const progress = OperationProgress.get();
  if (!progress) {
    return res.json({ status: 'idle', operation: null });
  }

  res.json({
    status: progress.status,
    operation: progress.type,
    progress: Math.round(OperationProgress.getProgressPercent()),
    currentStep: progress.currentStep,
    totalSteps: progress.totalSteps,
    stepName: progress.stepName,
    stats: {
      // Scraping
      totalSources: progress.totalSources,
      sourcesProcessed: progress.sourcesProcessed,
      currentSource: progress.currentSource,
      articlesFound: progress.articlesFound,
      articlesAdded: progress.articlesAdded,
      articlesSkipped: progress.articlesSkipped,
      sourceErrors: progress.sourceErrors,
      // Processing
      articlesToProcess: progress.articlesToProcess,
      articlesProcessed: progress.articlesProcessed,
      articlesApproved: progress.articlesApproved,
      articlesRejected: progress.articlesRejected,
      currentArticle: progress.currentArticle,
      // AI
      aiArticlesToGenerate: progress.aiArticlesToGenerate,
      aiArticlesGenerated: progress.aiArticlesGenerated,
      aiCurrentCategory: progress.aiCurrentCategory
    },
    messages: progress.messages.slice(-10), // Last 10 messages
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    error: progress.error
  });
});

// POST /admin/scrape - Manually trigger scraping
router.post('/scrape', requireAuth, async (req, res) => {
  // Check if operation already running
  const current = OperationProgress.get();
  if (current && current.status === 'running') {
    return res.redirect('/admin/settings?message=An operation is already running');
  }

  // Start operation in background and redirect immediately
  OperationProgress.start('scrape');
  res.redirect('/admin/settings?operation=scrape');

  // Run operation in background
  try {
    console.log('[ADMIN] Manual scrape triggered...');
    await runScrape({ maxAgeMonths: 3, progressCallback: OperationProgress });

    OperationProgress.setStep(1, 'Processing Articles');
    console.log('[ADMIN] Scrape complete, processing articles...');
    await processPendingArticles({ limit: 30, progressCallback: OperationProgress });

    console.log('[ADMIN] Processing complete');
    OperationProgress.complete();
  } catch (err) {
    console.error('Error during manual scrape:', err);
    OperationProgress.complete(err.message);
  }
});

// POST /admin/supplement - Manually trigger AI supplementation
router.post('/supplement', requireAuth, async (req, res) => {
  // Check if operation already running
  const current = OperationProgress.get();
  if (current && current.status === 'running') {
    return res.redirect('/admin/settings?message=An operation is already running');
  }

  // Start operation and redirect immediately
  OperationProgress.start('supplement');
  res.redirect('/admin/settings?operation=supplement');

  // Run operation in background
  try {
    console.log('[ADMIN] Manual AI supplement triggered...');
    const result = await supplementDailyContent({ progressCallback: OperationProgress });
    const count = result.generated?.length || 0;
    OperationProgress.log(`Generated ${count} AI articles`);
    OperationProgress.complete();
  } catch (err) {
    console.error('Error during AI supplement:', err);
    OperationProgress.complete(err.message);
  }
});

// POST /admin/process-all - Process ALL pending articles into queue
router.post('/process-all', requireAuth, async (req, res) => {
  const current = OperationProgress.get();
  if (current && current.status === 'running') {
    return res.redirect('/admin/settings?message=An operation is already running');
  }

  OperationProgress.start('process-all');
  res.redirect('/admin/settings?operation=process-all');

  try {
    console.log('[ADMIN] Processing all pending articles into queue...');
    const result = await processAllPending({ progressCallback: OperationProgress });

    OperationProgress.log(`Done: ${result.queued} queued, ${result.rejected} rejected`);
    OperationProgress.complete();
  } catch (err) {
    console.error('Error during bulk processing:', err);
    OperationProgress.complete(err.message);
  }
});

// POST /admin/full-refresh - Run full content cycle
router.post('/full-refresh', requireAuth, async (req, res) => {
  // Check if operation already running
  const current = OperationProgress.get();
  if (current && current.status === 'running') {
    return res.redirect('/admin/settings?message=An operation is already running');
  }

  // Start operation and redirect immediately
  OperationProgress.start('full-refresh');
  res.redirect('/admin/settings?operation=full-refresh');

  // Run operation in background
  try {
    console.log('[ADMIN] Full content refresh triggered...');

    // Step 1: Scrape with extended lookback
    OperationProgress.setStep(1, 'Scraping RSS Feeds');
    console.log('[ADMIN] Step 1: Scraping...');
    await runScrape({ maxAgeMonths: 3, progressCallback: OperationProgress });

    // Step 2: Process articles
    OperationProgress.setStep(2, 'Processing Articles');
    console.log('[ADMIN] Step 2: Processing...');
    await processPendingArticles({ limit: 50, progressCallback: OperationProgress });

    // Step 3: AI supplementation
    OperationProgress.setStep(3, 'AI Supplementation');
    console.log('[ADMIN] Step 3: AI Supplement...');
    const result = await supplementDailyContent({ progressCallback: OperationProgress });

    console.log('[ADMIN] Full refresh complete');
    OperationProgress.log(`AI generated: ${result.generated?.length || 0} articles`);
    OperationProgress.complete();
  } catch (err) {
    console.error('Error during full refresh:', err);
    OperationProgress.complete(err.message);
  }
});

module.exports = router;
