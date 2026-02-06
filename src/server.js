require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Models for frontend routes
const Article = require('./models/Article');
const Category = require('./models/Category');
const Editorial = require('./models/Editorial');

// Auth middleware
const { addAuthStatus } = require('./middleware/auth');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET || 'default-secret-key'));
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Add auth status to all views
app.use(addAuthStatus);

// API Routes
const articlesRouter = require('./routes/articles');
const categoriesRouter = require('./routes/categories');
const tagsRouter = require('./routes/tags');
const sourcesRouter = require('./routes/sources');
const scrapeRouter = require('./routes/scrape');
const adminRouter = require('./routes/admin');
const subscribeRouter = require('./routes/subscribe');

app.use('/api/articles', articlesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/admin', adminRouter);
app.use('/subscribe', subscribeRouter);
app.use('/', subscribeRouter); // For /unsubscribe/:token

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
    const latestEditorial = await Editorial.findLatestPublished();
    res.render('home', { articles, categories, editorial: latestEditorial });
  } catch (err) {
    console.error('Error loading homepage:', err);
    res.status(500).render('error', { message: 'Failed to load homepage' });
  }
});

// All Articles page
app.get('/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const articles = await Article.getLatest(limit, offset);
    const categories = await Category.getWithArticleCount();
    const total = await Article.count({ status: 'approved' });

    res.render('all', {
      articles,
      categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error loading all articles:', err);
    res.status(500).render('error', { message: 'Failed to load articles' });
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
    const categories = await Category.getWithArticleCount();
    const total = await Article.count({ category: req.params.slug, status: 'approved' });

    res.render('category', {
      categories,
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

    const categories = await Category.getWithArticleCount();
    res.render('article', { article, relatedArticles, categories });
  } catch (err) {
    console.error('Error loading article:', err);
    res.status(500).render('error', { message: 'Failed to load article' });
  }
});

// Editorial page
app.get('/editorial/:id', async (req, res) => {
  try {
    const editorial = await Editorial.findById(req.params.id);
    if (!editorial || editorial.status !== 'published') {
      return res.status(404).render('error', { message: 'Editorial not found' });
    }
    const categories = await Category.getWithArticleCount();
    res.render('editorial', { editorial, categories });
  } catch (err) {
    console.error('Error loading editorial:', err);
    res.status(500).render('error', { message: 'Failed to load editorial' });
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

    const categories = await Category.getWithArticleCount();
    res.render('search', { query, articles, categories });
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).render('error', { message: 'Search failed' });
  }
});

// About page
app.get('/about', async (req, res) => {
  try {
    const categories = await Category.getWithArticleCount();
    res.render('about', { categories });
  } catch (err) {
    console.error('Error loading about page:', err);
    res.status(500).render('error', { message: 'Failed to load page' });
  }
});

// ============================================
// Cron Jobs
// ============================================

// Import services for cron jobs
const { generateWeeklyEditorial } = require('./services/editorial');
const { sendWeeklyNewsletter } = require('./services/newsletter');

// Generate editorial every Sunday at 6 PM
cron.schedule('0 18 * * 0', async () => {
  console.log('[CRON] Generating weekly editorial...');
  try {
    await generateWeeklyEditorial();
    console.log('[CRON] Editorial generation complete');
  } catch (err) {
    console.error('[CRON] Editorial generation failed:', err.message);
  }
});

// Send newsletter every Monday at 8 AM
cron.schedule('0 8 * * 1', async () => {
  console.log('[CRON] Sending weekly newsletter...');
  try {
    await sendWeeklyNewsletter();
    console.log('[CRON] Newsletter send complete');
  } catch (err) {
    console.error('[CRON] Newsletter send failed:', err.message);
  }
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
