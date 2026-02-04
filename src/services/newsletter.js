const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Article = require('../models/Article');
const Editorial = require('../models/Editorial');
const Subscriber = require('../models/Subscriber');
const NewsletterLog = require('../models/NewsletterLog');
const { sendNewsletterToSubscriber } = require('./email');

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get top articles from the past week
 */
async function getWeeklyTopArticles(limit = 10) {
  const articles = await Article.findAll({
    status: 'approved',
    limit: 50,
    page: 1
  });

  // Filter to past week and sort by relevance
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentArticles = articles
    .filter(a => {
      const pubDate = new Date(a.published_date || a.scraped_date);
      return pubDate >= weekAgo;
    })
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    .slice(0, limit);

  return recentArticles;
}

/**
 * Send weekly newsletter to all active subscribers
 */
async function sendWeeklyNewsletter() {
  console.log('\n========================================');
  console.log('Sending Weekly Newsletter');
  console.log('========================================\n');

  try {
    // Get active subscribers
    const subscribers = await Subscriber.findActive();
    console.log(`Found ${subscribers.length} active subscribers`);

    if (subscribers.length === 0) {
      console.log('No subscribers to send newsletter to');
      return { sent: 0, failed: 0 };
    }

    // Get latest published editorial
    const editorial = await Editorial.findLatestPublished();
    if (!editorial) {
      console.log('Warning: No published editorial found');
    } else {
      console.log(`Using editorial: "${editorial.title}"`);
    }

    // Get top articles
    const articles = await getWeeklyTopArticles(10);
    console.log(`Including ${articles.length} top articles`);

    if (articles.length === 0 && !editorial) {
      console.log('No content to send - skipping newsletter');
      return { sent: 0, failed: 0 };
    }

    // Send to each subscriber
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      console.log(`Sending to ${subscriber.email}...`);

      try {
        const result = await sendNewsletterToSubscriber(subscriber, editorial, articles);

        if (result.success) {
          sent++;
          console.log(`  ✓ Sent to ${subscriber.email}`);
        } else {
          failed++;
          console.log(`  ✗ Failed: ${result.error}`);
        }

        // Rate limit to avoid hitting Resend limits
        await delay(500);

      } catch (err) {
        failed++;
        console.log(`  ✗ Error: ${err.message}`);
      }
    }

    // Log newsletter send
    await NewsletterLog.create({
      editorial_id: editorial?.id || null,
      recipient_count: sent,
      type: 'weekly'
    });

    console.log('\n========================================');
    console.log('Newsletter Send Complete!');
    console.log(`Sent: ${sent}, Failed: ${failed}`);
    console.log('========================================\n');

    return { sent, failed };

  } catch (err) {
    console.error('Error sending newsletter:', err.message);
    throw err;
  }
}

/**
 * Send extraordinary newsletter (for special occasions or first send)
 */
async function sendExtraordinaryNewsletter() {
  console.log('\n========================================');
  console.log('Sending Extraordinary Newsletter');
  console.log('========================================\n');

  try {
    // Get active subscribers
    const subscribers = await Subscriber.findActive();
    console.log(`Found ${subscribers.length} active subscribers`);

    if (subscribers.length === 0) {
      console.log('No subscribers to send newsletter to');
      return { sent: 0, failed: 0 };
    }

    // Get latest published editorial (or any editorial)
    let editorial = await Editorial.findLatestPublished();

    if (!editorial) {
      // Check for any draft editorial
      const drafts = await Editorial.findAll({ status: 'draft', limit: 1 });
      if (drafts.length > 0) {
        console.log('Warning: Using draft editorial (not published)');
        editorial = drafts[0];
      }
    }

    if (editorial) {
      console.log(`Using editorial: "${editorial.title}"`);
    }

    // Get top articles (more for extraordinary)
    const articles = await getWeeklyTopArticles(15);
    console.log(`Including ${articles.length} top articles`);

    // Send to each subscriber
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      console.log(`Sending to ${subscriber.email}...`);

      try {
        const result = await sendNewsletterToSubscriber(subscriber, editorial, articles);

        if (result.success) {
          sent++;
          console.log(`  ✓ Sent to ${subscriber.email}`);
        } else {
          failed++;
          console.log(`  ✗ Failed: ${result.error}`);
        }

        await delay(500);

      } catch (err) {
        failed++;
        console.log(`  ✗ Error: ${err.message}`);
      }
    }

    // Log newsletter send
    await NewsletterLog.create({
      editorial_id: editorial?.id || null,
      recipient_count: sent,
      type: 'extraordinary'
    });

    console.log('\n========================================');
    console.log('Extraordinary Newsletter Complete!');
    console.log(`Sent: ${sent}, Failed: ${failed}`);
    console.log('========================================\n');

    return { sent, failed };

  } catch (err) {
    console.error('Error sending extraordinary newsletter:', err.message);
    throw err;
  }
}

module.exports = {
  getWeeklyTopArticles,
  sendWeeklyNewsletter,
  sendExtraordinaryNewsletter
};
