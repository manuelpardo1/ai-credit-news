const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Check if user is authenticated as admin
 */
function requireAuth(req, res, next) {
  // Check for admin cookie
  if (req.signedCookies && req.signedCookies.admin === 'authenticated') {
    return next();
  }

  // Not authenticated - redirect to login
  res.redirect('/admin/login');
}

/**
 * Validate admin password
 */
function validatePassword(password) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured');
    return false;
  }
  return password === adminPassword;
}

/**
 * Set admin authentication cookie
 */
function setAuthCookie(res) {
  res.cookie('admin', 'authenticated', {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
}

/**
 * Clear admin authentication cookie
 */
function clearAuthCookie(res) {
  res.clearCookie('admin');
}

/**
 * Middleware to add isAdmin flag to all views
 */
function addAuthStatus(req, res, next) {
  res.locals.isAdmin = req.signedCookies && req.signedCookies.admin === 'authenticated';
  next();
}

module.exports = {
  requireAuth,
  validatePassword,
  setAuthCookie,
  clearAuthCookie,
  addAuthStatus
};
