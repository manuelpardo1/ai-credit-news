const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

// Session cookie name
const SESSION_COOKIE = 'user_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Set user session cookie
 */
function setUserSession(res, user) {
  const sessionData = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name
  });
  res.cookie(SESSION_COOKIE, sessionData, {
    httpOnly: true,
    signed: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax'
  });
}

/**
 * Clear user session
 */
function clearUserSession(res) {
  res.clearCookie(SESSION_COOKIE);
}

/**
 * Get current user from session
 */
function getCurrentUser(req) {
  try {
    const sessionData = req.signedCookies[SESSION_COOKIE];
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (e) {}
  return null;
}

/**
 * Middleware to add user to request
 */
function addUserToRequest(req, res, next) {
  req.user = getCurrentUser(req);
  res.locals.user = req.user;
  next();
}

/**
 * Middleware to require authentication
 */
function requireUser(req, res, next) {
  if (!req.user) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

// ============================================
// Traditional Auth Routes
// ============================================

const Category = require('../models/Category');

// GET /auth/login - Login page
router.get('/login', async (req, res) => {
  if (getCurrentUser(req)) {
    return res.redirect(req.query.redirect || '/');
  }
  const categories = await Category.getWithArticleCount();
  res.render('auth/login', {
    error: null,
    redirect: req.query.redirect || '/',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    appleClientId: process.env.APPLE_CLIENT_ID,
    categories
  });
});

// GET /auth/register - Register page
router.get('/register', async (req, res) => {
  if (getCurrentUser(req)) {
    return res.redirect('/');
  }
  const categories = await Category.getWithArticleCount();
  res.render('auth/register', {
    error: null,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    appleClientId: process.env.APPLE_CLIENT_ID,
    categories
  });
});

// POST /auth/login - Process login
router.post('/login', async (req, res) => {
  const { email, password, redirect } = req.body;
  const categories = await Category.getWithArticleCount();

  try {
    const user = await User.authenticate(email, password);
    if (user) {
      setUserSession(res, user);
      return res.redirect(redirect || '/');
    }
    res.render('auth/login', {
      error: 'Invalid email or password',
      redirect: redirect || '/',
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      appleClientId: process.env.APPLE_CLIENT_ID,
      categories
    });
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', {
      error: 'An error occurred. Please try again.',
      redirect: redirect || '/',
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      appleClientId: process.env.APPLE_CLIENT_ID,
      categories
    });
  }
});

// POST /auth/register - Process registration
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const categories = await Category.getWithArticleCount();

  try {
    // Check if user exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.render('auth/register', {
        error: 'An account with this email already exists',
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        appleClientId: process.env.APPLE_CLIENT_ID,
        categories
      });
    }

    // Create user
    const user = await User.create({ email, password, name });
    setUserSession(res, user);

    // TODO: Send verification email

    res.redirect('/');
  } catch (err) {
    console.error('Registration error:', err);
    res.render('auth/register', {
      error: 'An error occurred. Please try again.',
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      appleClientId: process.env.APPLE_CLIENT_ID,
      categories
    });
  }
});

// GET /auth/logout - Logout
router.get('/logout', (req, res) => {
  clearUserSession(res);
  res.redirect('/');
});

// ============================================
// Google OAuth
// ============================================

// POST /auth/google - Handle Google OAuth callback
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'No credential provided' });
  }

  try {
    // Decode the JWT (Google ID Token)
    // In production, verify with Google's public keys
    const parts = credential.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    const { email, name, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ error: 'Email not verified' });
    }

    // Find or create user
    let user = await User.findByEmail(email);

    if (!user) {
      // Create new user (no password for OAuth users)
      const result = await require('../database/db').run(
        `INSERT INTO users (email, password_hash, name, email_verified) VALUES (?, ?, ?, 1)`,
        [email.toLowerCase(), `google:${googleId}`, name]
      );
      user = { id: result.lastID, email, name };
    }

    setUserSession(res, user);
    res.json({ success: true, redirect: '/' });

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============================================
// Apple OAuth
// ============================================

// POST /auth/apple - Handle Apple OAuth callback
router.post('/apple', async (req, res) => {
  const { id_token, user: appleUser } = req.body;

  if (!id_token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    // Decode the JWT (Apple ID Token)
    // In production, verify with Apple's public keys
    const parts = id_token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    const { email, sub: appleId } = payload;

    // Apple only sends user info on first auth
    let name = 'Apple User';
    if (appleUser) {
      try {
        const userData = JSON.parse(appleUser);
        name = `${userData.name?.firstName || ''} ${userData.name?.lastName || ''}`.trim() || 'Apple User';
      } catch (e) {}
    }

    // Find or create user
    let user = await User.findByEmail(email);

    if (!user) {
      const result = await require('../database/db').run(
        `INSERT INTO users (email, password_hash, name, email_verified) VALUES (?, ?, ?, 1)`,
        [email.toLowerCase(), `apple:${appleId}`, name]
      );
      user = { id: result.lastID, email, name };
    }

    setUserSession(res, user);
    res.json({ success: true, redirect: '/' });

  } catch (err) {
    console.error('Apple auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============================================
// Profile Routes
// ============================================

// GET /auth/profile - User profile page
router.get('/profile', requireUser, async (req, res) => {
  const user = await User.findById(req.user.id);
  const savedArticles = await User.getSavedArticles(req.user.id);
  const Category = require('../models/Category');
  const categories = await Category.getWithArticleCount();

  res.render('auth/profile', { user, savedArticles, categories });
});

// POST /auth/profile - Update profile
router.post('/profile', requireUser, async (req, res) => {
  const { name } = req.body;

  try {
    const user = await User.update(req.user.id, { name });
    setUserSession(res, user);
    res.redirect('/auth/profile?success=1');
  } catch (err) {
    console.error('Profile update error:', err);
    res.redirect('/auth/profile?error=1');
  }
});

module.exports = {
  router,
  addUserToRequest,
  requireUser,
  getCurrentUser
};
