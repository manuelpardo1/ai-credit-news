const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Analytics = require('../models/Analytics');
const Comment = require('../models/Comment');
const User = require('../models/User');

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

// POST /api/articles/:id/feedback - Submit article feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const { helpful } = req.body;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({ error: 'helpful (boolean) is required' });
    }

    // Get session ID for anonymous feedback tracking
    const sessionId = req.signedCookies?.sessionId || req.ip;
    const userId = req.user?.id || null;

    await Analytics.recordFeedback(articleId, helpful, userId, sessionId);
    const feedback = await Analytics.getArticleFeedback(articleId);

    res.json(feedback);
  } catch (err) {
    console.error('Error recording feedback:', err);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// POST /api/articles/:id/save - Save/bookmark an article
router.post('/:id/save', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const articleId = parseInt(req.params.id);
    await User.saveArticle(req.user.id, articleId);

    res.json({ saved: true });
  } catch (err) {
    console.error('Error saving article:', err);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// POST /api/articles/:id/unsave - Remove article from saved
router.post('/:id/unsave', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const articleId = parseInt(req.params.id);
    await User.unsaveArticle(req.user.id, articleId);

    res.json({ saved: false });
  } catch (err) {
    console.error('Error unsaving article:', err);
    res.status(500).json({ error: 'Failed to unsave article' });
  }
});

// GET /api/articles/:id/comments - Get comments for an article
router.get('/:id/comments', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const comments = await Comment.getByArticle(articleId);
    res.json({ comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/articles/:id/comments - Add a comment
router.post('/:id/comments', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const articleId = parseInt(req.params.id);
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Comment too long (max 2000 characters)' });
    }

    const comment = await Comment.create({
      articleId,
      userId: req.user.id,
      content: content.trim(),
      parentId: parentId || null
    });

    res.json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// DELETE /api/articles/:id/comments/:commentId - Delete a comment
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const commentId = parseInt(req.params.commentId);
    const success = await Comment.delete(commentId, req.user.id);

    if (!success) {
      return res.status(403).json({ error: 'Cannot delete this comment' });
    }

    res.json({ deleted: true });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
