const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const Editorial = require('../models/Editorial');
const Article = require('../models/Article');
const { sendWelcomeEmail } = require('../services/email');

/**
 * Helper: fetch content for welcome email (non-blocking)
 */
async function sendWelcomeInBackground(subscriber) {
  try {
    const editorial = await Editorial.findLatestPublished();
    const allArticles = await Article.findAll({ status: 'approved', limit: 10, page: 1 });

    // Filter to recent articles
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 14);
    const articles = allArticles
      .filter(a => {
        const d = new Date(a.published_date || a.scraped_date);
        return d >= weekAgo;
      })
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 5);

    const result = await sendWelcomeEmail(subscriber, editorial, articles);
    if (result.success) {
      console.log(`Welcome email sent to ${subscriber.email}`);
    } else {
      console.error(`Failed to send welcome email to ${subscriber.email}: ${result.error}`);
    }
  } catch (err) {
    console.error(`Error sending welcome email to ${subscriber.email}:`, err.message);
  }
}

// POST /subscribe - New subscription
router.post('/', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.render('subscribe-result', {
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    // Check if already subscribed
    const existing = await Subscriber.findByEmail(email);

    if (existing && existing.active) {
      return res.render('subscribe-result', {
        success: true,
        message: 'You are already subscribed! Watch your inbox for our weekly newsletter.'
      });
    }

    if (existing && !existing.active) {
      // Resubscribe
      await Subscriber.resubscribe(email);
      const resubscribed = await Subscriber.findByEmail(email);
      // Send welcome email in background (don't block the response)
      sendWelcomeInBackground(resubscribed);
      return res.render('subscribe-result', {
        success: true,
        message: 'Welcome back! Check your inbox for a welcome email.'
      });
    }

    // Create new subscriber
    const subscriber = await Subscriber.create(email, name || null);

    // Send welcome email in background (don't block the response)
    sendWelcomeInBackground(subscriber);

    res.render('subscribe-result', {
      success: true,
      message: 'Successfully subscribed! Check your inbox for a welcome email.'
    });

  } catch (err) {
    console.error('Subscription error:', err);

    // Handle unique constraint violation
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return res.render('subscribe-result', {
        success: true,
        message: 'You are already subscribed!'
      });
    }

    res.render('subscribe-result', {
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
});

// GET /unsubscribe/:token - Unsubscribe
router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const subscriber = await Subscriber.findByToken(token);

    if (!subscriber) {
      return res.render('unsubscribe', {
        success: false,
        message: 'Invalid unsubscribe link.'
      });
    }

    if (!subscriber.active) {
      return res.render('unsubscribe', {
        success: true,
        message: 'You have already been unsubscribed.'
      });
    }

    await Subscriber.unsubscribe(token);

    res.render('unsubscribe', {
      success: true,
      message: 'You have been successfully unsubscribed. We\'re sorry to see you go!'
    });

  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.render('unsubscribe', {
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
});

// API endpoint for AJAX subscription
router.post('/api', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    const existing = await Subscriber.findByEmail(email);

    if (existing && existing.active) {
      return res.json({
        success: true,
        message: 'You are already subscribed!'
      });
    }

    if (existing && !existing.active) {
      await Subscriber.resubscribe(email);
      const resubscribed = await Subscriber.findByEmail(email);
      sendWelcomeInBackground(resubscribed);
      return res.json({
        success: true,
        message: 'Welcome back! Check your inbox for a welcome email.'
      });
    }

    const subscriber = await Subscriber.create(email, name || null);
    sendWelcomeInBackground(subscriber);

    res.json({
      success: true,
      message: 'Successfully subscribed! Check your inbox for a welcome email.'
    });

  } catch (err) {
    console.error('API subscription error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
});

module.exports = router;
