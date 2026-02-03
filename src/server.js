require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Models for frontend routes
const Article = require('./models/Article');
const Category = require('./models/Category');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// API Routes
const articlesRouter = require('./routes/articles');
const categoriesRouter = require('./routes/categories');
const tagsRouter = require('./routes/tags');
const sourcesRouter = require('./routes/sources');
const scrapeRouter = require('./routes/scrape');

app.use('/api/articles', articlesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/scrape', scrapeRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Frontend Routes
// ============================================

// Homepage
app.get('/', async (req, res) => {
  try {
    const articles = await Article.getLatest(12);
    const categories = await Category.getWithArticleCount();
    res.render('home', { articles, categories });
  } catch (err) {
    console.error('Error loading homepage:', err);
    res.status(500).render('error', { message: 'Failed to load homepage' });
  }
});

// Categories list
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getWithArticleCount();
    res.render('categories', { categories });
  } catch (err) {
    console.error('Error loading categories:', err);
    res.status(500).render('error', { message: 'Failed to load categories' });
  }
});

// Single category page
app.get('/category/:slug', async (req, res) => {
  try {
    const category = await Category.findBySlug(req.params.slug);
    if (!category) {
      return res.status(404).render('error', { message: 'Category not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const articles = await Article.findAll({
      category: req.params.slug,
      page,
      limit,
      status: 'approved'
    });
    const total = await Article.count({ category: req.params.slug, status: 'approved' });

    res.render('category', {
      category,
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error loading category:', err);
    res.status(500).render('error', { message: 'Failed to load category' });
  }
});

// Article detail page
app.get('/article/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).render('error', { message: 'Article not found' });
    }

    // Get tags for the article
    article.tags = await Article.getTags(article.id);

    // Get related articles (same category)
    let relatedArticles = [];
    if (article.category_id) {
      const allRelated = await Article.findAll({
        category: article.category_slug,
        limit: 4,
        status: 'approved'
      });
      relatedArticles = allRelated.filter(a => a.id !== article.id).slice(0, 3);
    }

    res.render('article', { article, relatedArticles });
  } catch (err) {
    console.error('Error loading article:', err);
    res.status(500).render('error', { message: 'Failed to load article' });
  }
});

// Search page
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    let articles = [];

    if (query.trim()) {
      articles = await Article.search(query, { limit: 20 });
    }

    res.render('search', { query, articles });
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).render('error', { message: 'Search failed' });
  }
});

// About page
app.get('/about', (req, res) => {
  res.render('about');
});

// ============================================
// Error Handling
// ============================================

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: 'Something went wrong!' });
  } else {
    res.status(500).render('error', { message: 'Something went wrong!' });
  }
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' });
  } else {
    res.status(404).render('error', { message: 'Page not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     AI Credit & Banking News Platform                      ║
║     Server running on http://localhost:${PORT}                ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
