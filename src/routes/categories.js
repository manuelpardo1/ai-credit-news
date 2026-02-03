const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Article = require('../models/Article');

// GET /api/categories - List all categories with article counts
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getWithArticleCount();
    res.json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:slug - Get category with its articles
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { page = 1, limit = 20, difficulty } = req.query;
    const articles = await Article.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      category: req.params.slug,
      difficulty
    });
    const total = await Article.count({ category: req.params.slug });

    res.json({
      category,
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

module.exports = router;
