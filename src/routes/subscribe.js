const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

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
      return res.render('subscribe-result', {
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.'
      });
    }

    // Create new subscriber
    await Subscriber.create(email, name || null);

    res.render('subscribe-result', {
      success: true,
      message: 'Successfully subscribed! You\'ll receive our weekly newsletter every Monday.'
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
      return res.json({
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.'
      });
    }

    await Subscriber.create(email, name || null);

    res.json({
      success: true,
      message: 'Successfully subscribed!'
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
