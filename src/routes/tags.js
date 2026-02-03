const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

// GET /api/tags - List all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.getWithArticleCount();
    res.json({ tags });
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/:name/articles - Get articles by tag
router.get('/:name/articles', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const articles = await Tag.getArticlesByTag(req.params.name, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.json({ tag: req.params.name, articles });
  } catch (err) {
    console.error('Error fetching articles by tag:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

module.exports = router;
