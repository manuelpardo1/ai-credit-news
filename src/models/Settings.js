/**
 * Settings Model
 *
 * Manages configurable system parameters stored in the database.
 */

const { get, run, all } = require('../database/db');

// Default settings values
const DEFAULTS = {
  // Daily article targets
  daily_min_articles: 5,
  daily_max_articles: 10,

  // AI article limits
  daily_max_ai_articles: 3,

  // Category balance
  weekly_min_per_category: 5,

  // Scrape settings
  scrape_max_age_hours: 24,
  articles_per_scrape: 5,

  // Auto-publish
  auto_publish_hours: 48
};

/**
 * Get a single setting value
 * @param {string} key - Setting key
 * @returns {Promise<any>} Setting value (parsed from JSON)
 */
async function getValue(key) {
  const row = await get('SELECT value FROM settings WHERE key = ?', [key]);
  if (row) {
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }
  return DEFAULTS[key] ?? null;
}

/**
 * Set a single setting value
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
async function setValue(key, value) {
  const jsonValue = JSON.stringify(value);
  await run(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `, [key, jsonValue, jsonValue]);
}

/**
 * Get all settings as an object
 * @returns {Promise<Object>} All settings with defaults applied
 */
async function getAll() {
  const rows = await all('SELECT key, value FROM settings');
  const settings = { ...DEFAULTS };

  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return settings;
}

/**
 * Update multiple settings at once
 * @param {Object} settings - Object with key-value pairs
 */
async function updateMultiple(settings) {
  for (const [key, value] of Object.entries(settings)) {
    if (key in DEFAULTS) {
      await setValue(key, value);
    }
  }
}

/**
 * Get content generation settings specifically
 * @returns {Promise<Object>} Content-related settings
 */
async function getContentSettings() {
  const all = await getAll();
  return {
    dailyMinArticles: all.daily_min_articles,
    dailyMaxArticles: all.daily_max_articles,
    dailyMaxAiArticles: all.daily_max_ai_articles,
    weeklyMinPerCategory: all.weekly_min_per_category,
    scrapeMaxAgeHours: all.scrape_max_age_hours,
    articlesPerScrape: all.articles_per_scrape,
    autoPublishHours: all.auto_publish_hours
  };
}

module.exports = {
  getValue,
  setValue,
  getAll,
  updateMultiple,
  getContentSettings,
  DEFAULTS
};
