const express = require('express');
const router = express.Router();
const { all, get } = require('../database/db');

/**
 * GET /api/qa/report
 * Returns a comprehensive health/QA report for the platform.
 * Used by FigSamurai Studio's QA Testing step to verify deployment.
 */
router.get('/report', async (req, res) => {
  try {
    const report = {
      platform: 'AI Credit News',
      domain: 'aicreditnews.com',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. Content health
    try {
      const totalArticles = await get('SELECT COUNT(*) as count FROM articles WHERE status = ?', ['approved']);
      const recentArticles = await get(
        "SELECT COUNT(*) as count FROM articles WHERE status = ? AND published_date >= date('now', '-7 days')",
        ['approved']
      );
      const oldestApproved = await get(
        'SELECT published_date FROM articles WHERE status = ? ORDER BY published_date ASC LIMIT 1',
        ['approved']
      );
      const newestApproved = await get(
        'SELECT published_date FROM articles WHERE status = ? ORDER BY published_date DESC LIMIT 1',
        ['approved']
      );

      report.checks.content = {
        status: totalArticles.count > 0 ? 'pass' : 'fail',
        totalArticles: totalArticles.count,
        articlesLastWeek: recentArticles.count,
        oldestArticle: oldestApproved ? oldestApproved.published_date : null,
        newestArticle: newestApproved ? newestApproved.published_date : null
      };
    } catch (e) {
      report.checks.content = { status: 'fail', error: e.message };
    }

    // 2. Categories health
    try {
      const categories = await all('SELECT id, name, slug FROM categories');
      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const count = await get(
            'SELECT COUNT(*) as count FROM articles WHERE category_id = ? AND status = ?',
            [cat.id, 'approved']
          );
          return { name: cat.name, slug: cat.slug, articleCount: count.count };
        })
      );

      const emptyCategories = categoriesWithCounts.filter(c => c.articleCount === 0);
      report.checks.categories = {
        status: emptyCategories.length === 0 ? 'pass' : 'warn',
        total: categories.length,
        empty: emptyCategories.length,
        details: categoriesWithCounts
      };
    } catch (e) {
      report.checks.categories = { status: 'fail', error: e.message };
    }

    // 3. Sources health
    try {
      const sources = await all('SELECT COUNT(*) as count FROM sources WHERE active = 1');
      const totalSources = await all('SELECT COUNT(*) as count FROM sources');
      report.checks.sources = {
        status: sources[0].count > 0 ? 'pass' : 'warn',
        active: sources[0].count,
        total: totalSources[0].count
      };
    } catch (e) {
      report.checks.sources = { status: 'fail', error: e.message };
    }

    // 4. Scraper health
    try {
      const lastScrape = await get(
        "SELECT scraped_date FROM articles WHERE scraped_date IS NOT NULL ORDER BY scraped_date DESC LIMIT 1"
      );
      const hoursSinceLastScrape = lastScrape
        ? (Date.now() - new Date(lastScrape.scraped_date).getTime()) / (1000 * 60 * 60)
        : null;

      report.checks.scraper = {
        status: hoursSinceLastScrape !== null && hoursSinceLastScrape < 48 ? 'pass' : 'warn',
        lastScrape: lastScrape ? lastScrape.scraped_date : null,
        hoursSinceLastScrape: hoursSinceLastScrape ? Math.round(hoursSinceLastScrape) : null
      };
    } catch (e) {
      report.checks.scraper = { status: 'fail', error: e.message };
    }

    // 5. Subscribers
    try {
      const subscribers = await get('SELECT COUNT(*) as count FROM subscribers WHERE active = 1');
      report.checks.subscribers = {
        status: 'pass',
        active: subscribers.count
      };
    } catch (e) {
      report.checks.subscribers = { status: 'skipped', message: 'Subscribers table not available' };
    }

    // 6. AI pipeline
    try {
      const aiArticles = await get('SELECT COUNT(*) as count FROM articles WHERE is_ai_generated = 1');
      const pendingReview = await get("SELECT COUNT(*) as count FROM articles WHERE status = 'review'");
      report.checks.aiPipeline = {
        status: 'pass',
        totalAiArticles: aiArticles.count,
        pendingReview: pendingReview.count,
        apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY
      };
    } catch (e) {
      report.checks.aiPipeline = { status: 'fail', error: e.message };
    }

    // Overall score
    const checks = Object.values(report.checks);
    const passed = checks.filter(c => c.status === 'pass').length;
    const warned = checks.filter(c => c.status === 'warn').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const total = checks.length;

    report.summary = {
      passed,
      warned,
      failed,
      total,
      score: Math.round(((passed + warned * 0.5) / total) * 100)
    };

    res.json({ report });
  } catch (err) {
    console.error('QA report error:', err);
    res.status(500).json({ error: 'Failed to generate QA report' });
  }
});

module.exports = router;
