const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// GET /api/articles - List articles with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, difficulty, status } = req.query;
    const articles = await Article.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      difficulty,
      status
    });
    const total = await Article.count({ category, status });

    res.json({
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/articles/latest - Get most recent articles
router.get('/latest', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const articles = await Article.getLatest(parseInt(limit));
    res.json({ articles });
  } catch (err) {
    console.error('Error fetching latest articles:', err);
    res.status(500).json({ error: 'Failed to fetch latest articles' });
  }
});

// GET /api/articles/search - Search articles
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const articles = await Article.search(q, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.json({ articles, query: q });
  } catch (err) {
    console.error('Error searching articles:', err);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

// GET /api/articles/:id - Get single article
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Get tags for the article
    const tags = await Article.getTags(article.id);
    article.tags = tags;

    res.json({ article });
  } catch (err) {
    console.error('Error fetching article:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

module.exports = router;
