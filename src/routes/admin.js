const express = require('express');
const router = express.Router();
const Editorial = require('../models/Editorial');
const Subscriber = require('../models/Subscriber');
const NewsletterLog = require('../models/NewsletterLog');
const { requireAuth, validatePassword, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { generateWeeklyEditorial, createWelcomeEditorial } = require('../services/editorial');
const { sendWeeklyNewsletter, sendExtraordinaryNewsletter } = require('../services/newsletter');

// GET /admin/login - Login page
router.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.signedCookies && req.signedCookies.admin === 'authenticated') {
    return res.redirect('/admin/editorials');
  }
  res.render('admin/login', { error: null });
});

// POST /admin/login - Process login
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (validatePassword(password)) {
    setAuthCookie(res);
    res.redirect('/admin/editorials');
  } else {
    res.render('admin/login', { error: 'Invalid password' });
  }
});

// GET /admin/logout - Logout
router.get('/logout', (req, res) => {
  clearAuthCookie(res);
  res.redirect('/');
});

// GET /admin/editorials - List all editorials
router.get('/editorials', requireAuth, async (req, res) => {
  try {
    const editorials = await Editorial.findAll({});
    const subscriberCount = await Subscriber.count(true);
    const newsletterLogs = await NewsletterLog.findRecent(5);

    res.render('admin/editorials', {
      editorials,
      subscriberCount,
      newsletterLogs
    });
  } catch (err) {
    console.error('Error loading editorials:', err);
    res.status(500).send('Error loading editorials');
  }
});

// GET /admin/editorial/:id - Edit editorial
router.get('/editorial/:id', requireAuth, async (req, res) => {
  try {
    const editorial = await Editorial.findById(req.params.id);
    if (!editorial) {
      return res.status(404).send('Editorial not found');
    }
    res.render('admin/editorial', { editorial, message: null });
  } catch (err) {
    console.error('Error loading editorial:', err);
    res.status(500).send('Error loading editorial');
  }
});

// POST /admin/editorial/:id - Save editorial changes
router.post('/editorial/:id', requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const editorial = await Editorial.update(req.params.id, { title, content });
    res.render('admin/editorial', { editorial, message: 'Editorial saved successfully!' });
  } catch (err) {
    console.error('Error saving editorial:', err);
    const editorial = await Editorial.findById(req.params.id);
    res.render('admin/editorial', { editorial, message: 'Error saving editorial' });
  }
});

// POST /admin/editorial/:id/publish - Publish editorial
router.post('/editorial/:id/publish', requireAuth, async (req, res) => {
  try {
    await Editorial.publish(req.params.id);
    res.redirect('/admin/editorials');
  } catch (err) {
    console.error('Error publishing editorial:', err);
    res.status(500).send('Error publishing editorial');
  }
});

// POST /admin/editorial/:id/delete - Delete editorial
router.post('/editorial/:id/delete', requireAuth, async (req, res) => {
  try {
    await Editorial.delete(req.params.id);
    res.redirect('/admin/editorials');
  } catch (err) {
    console.error('Error deleting editorial:', err);
    res.status(500).send('Error deleting editorial');
  }
});

// POST /admin/editorial/generate - Generate new editorial
router.post('/editorial/generate', requireAuth, async (req, res) => {
  try {
    const editorial = await generateWeeklyEditorial();
    if (editorial) {
      res.redirect(`/admin/editorial/${editorial.id}`);
    } else {
      res.redirect('/admin/editorials?message=Not enough articles to generate editorial');
    }
  } catch (err) {
    console.error('Error generating editorial:', err);
    res.redirect('/admin/editorials?message=Error generating editorial');
  }
});

// POST /admin/editorial/welcome - Create welcome editorial
router.post('/editorial/welcome', requireAuth, async (req, res) => {
  try {
    const editorial = await createWelcomeEditorial();
    res.redirect(`/admin/editorial/${editorial.id}`);
  } catch (err) {
    console.error('Error creating welcome editorial:', err);
    res.redirect('/admin/editorials?message=Error creating editorial');
  }
});

// POST /admin/newsletter/send - Send newsletter manually
router.post('/newsletter/send', requireAuth, async (req, res) => {
  try {
    const result = await sendWeeklyNewsletter();
    res.redirect(`/admin/editorials?message=Newsletter sent to ${result.sent} subscribers`);
  } catch (err) {
    console.error('Error sending newsletter:', err);
    res.redirect('/admin/editorials?message=Error sending newsletter');
  }
});

// POST /admin/newsletter/extraordinary - Send extraordinary newsletter
router.post('/newsletter/extraordinary', requireAuth, async (req, res) => {
  try {
    const result = await sendExtraordinaryNewsletter();
    res.redirect(`/admin/editorials?message=Extraordinary newsletter sent to ${result.sent} subscribers`);
  } catch (err) {
    console.error('Error sending newsletter:', err);
    res.redirect('/admin/editorials?message=Error sending newsletter');
  }
});

// GET /admin/subscribers - List subscribers
router.get('/subscribers', requireAuth, async (req, res) => {
  try {
    const subscribers = await Subscriber.findAll({});
    const activeCount = await Subscriber.count(true);
    res.render('admin/subscribers', { subscribers, activeCount });
  } catch (err) {
    console.error('Error loading subscribers:', err);
    res.status(500).send('Error loading subscribers');
  }
});

module.exports = router;
