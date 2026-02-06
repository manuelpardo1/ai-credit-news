const express = require('express');
const router = express.Router();
const scraper = require('../services/scraper');
const processor = require('../services/processor');

let scrapeStatus = {
  running: false,
  lastRun: null,
  lastResult: null
};

let processStatus = {
  running: false,
  lastRun: null,
  lastResult: null
};

// POST /api/scrape/run - Manually trigger scraping
router.post('/run', async (req, res) => {
  if (scrapeStatus.running) {
    return res.status(409).json({
      error: 'Scrape already in progress',
      status: scrapeStatus
    });
  }

  scrapeStatus.running = true;
  res.json({ message: 'Scrape started', status: scrapeStatus });

  try {
    const result = await scraper.runScrape();
    scrapeStatus.lastResult = result;
    scrapeStatus.lastRun = new Date().toISOString();
  } catch (err) {
    scrapeStatus.lastResult = { error: err.message };
  } finally {
    scrapeStatus.running = false;
  }
});

// GET /api/scrape/status - Get scraping status
router.get('/status', (req, res) => {
  res.json({ status: scrapeStatus });
});

// POST /api/process/run - Process pending articles through AI
router.post('/process', async (req, res) => {
  if (processStatus.running) {
    return res.status(409).json({
      error: 'Processing already in progress',
      status: processStatus
    });
  }

  const limit = parseInt(req.query.limit) || 10;

  processStatus.running = true;
  res.json({ message: 'AI processing started', limit, status: processStatus });

  try {
    const result = await processor.processPendingArticles({ limit });
    processStatus.lastResult = result;
    processStatus.lastRun = new Date().toISOString();
  } catch (err) {
    processStatus.lastResult = { error: err.message };
  } finally {
    processStatus.running = false;
  }
});

// GET /api/process/status - Get processing status
router.get('/process/status', (req, res) => {
  res.json({ status: processStatus });
});

// GET /api/scrape/categories - List all categories with IDs
router.get('/categories', async (req, res) => {
  try {
    const { all } = require('../database/db');
    const categories = await all('SELECT * FROM categories');
    res.json({ categories });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET /api/scrape/test-ai - Test AI API connection
router.get('/test-ai', async (req, res) => {
  const model = req.query.model || 'claude-3-haiku-20240307';
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "API working" and nothing else.' }]
    });

    res.json({
      success: true,
      response: response.content[0].text,
      model: model
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      errorType: err.constructor.name,
      model: model,
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    });
  }
});

// GET /api/scrape/test-process - Test article processing with full update
router.get('/test-process', async (req, res) => {
  try {
    const Article = require('../models/Article');
    const Tag = require('../models/Tag');
    const { processArticle } = require('../services/ai');

    // Get one pending article
    const articles = await Article.findAll({ status: 'pending', limit: 1 });
    if (articles.length === 0) {
      return res.json({ success: false, error: 'No pending articles found' });
    }

    const article = articles[0];
    const result = await processArticle(article);

    // Try the full update like the processor does
    await Article.update(article.id, {
      relevance_score: result.relevance_score,
      category_id: result.category_id,
      summary: result.summary,
      difficulty_level: result.difficulty_level,
      status: result.status
    });

    // Add tags if relevant
    if (result.status === 'approved' && result.tags && result.tags.length > 0) {
      const tagIds = [];
      for (const tagName of result.tags) {
        const tag = await Tag.findOrCreate(tagName.toLowerCase());
        tagIds.push(tag.id);
      }
      await Article.addTags(article.id, tagIds);
    }

    res.json({
      success: true,
      article: { id: article.id, title: article.title },
      result: result,
      updated: true
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;
