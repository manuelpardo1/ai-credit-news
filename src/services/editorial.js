const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Article = require('../models/Article');
const Editorial = require('../models/Editorial');
const { generateEditorial } = require('./ai');
const { sendAdminNotification } = require('./email');

/**
 * Generate a weekly editorial based on this week's articles
 */
async function generateWeeklyEditorial() {
  console.log('\n========================================');
  console.log('Generating Weekly Editorial');
  console.log('========================================\n');

  try {
    // Get approved articles from the past 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const articles = await Article.findAll({
      status: 'approved',
      limit: 50,
      page: 1
    });

    // Filter to only recent articles
    const recentArticles = articles.filter(a => {
      const pubDate = new Date(a.published_date || a.scraped_date);
      return pubDate >= weekAgo;
    });

    console.log(`Found ${recentArticles.length} articles from the past week`);

    if (recentArticles.length < 3) {
      console.log('Not enough articles to generate editorial (minimum 3 required)');
      return null;
    }

    // Check if editorial already exists for this week (Monday-Sunday)
    const today = new Date();
    const getMonday = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    };
    const weekStart = getMonday(today);
    weekStart.setDate(weekStart.getDate() - 7); // Previous week's Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const existingEditorial = await Editorial.findByWeek(weekStartStr);
    if (existingEditorial) {
      console.log(`Editorial already exists for week of ${weekStartStr}`);
      return existingEditorial;
    }

    // Generate editorial using AI
    console.log('Generating editorial with AI...');
    const editorialData = await generateEditorial(recentArticles);

    // Save to database
    console.log('Saving editorial to database...');
    const editorial = await Editorial.create({
      title: editorialData.title,
      content: editorialData.content,
      week_start: editorialData.week_start,
      week_end: editorialData.week_end
    });

    console.log(`Editorial created: "${editorial.title}" (ID: ${editorial.id})`);

    // Send admin notification
    console.log('Sending admin notification...');
    const notificationResult = await sendAdminNotification(editorial);
    if (notificationResult.success) {
      console.log('Admin notification sent successfully');
    } else {
      console.log('Failed to send admin notification:', notificationResult.error);
    }

    console.log('\n========================================');
    console.log('Editorial Generation Complete!');
    console.log('========================================\n');

    return editorial;

  } catch (err) {
    console.error('Error generating editorial:', err.message);
    throw err;
  }
}

/**
 * Create a manual/welcome editorial (for first newsletter)
 */
async function createWelcomeEditorial() {
  const today = new Date();

  // Calculate proper Monday-Sunday week
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  const monday = getMonday(today);
  monday.setDate(monday.getDate() - 7); // Previous week's Monday
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6); // That week's Sunday

  const content = `Welcome to AI Credit News, your weekly source for the latest developments at the intersection of artificial intelligence and financial services.

In an era where AI is rapidly transforming every aspect of banking and credit, staying informed isn't just an advantage—it's a necessity. From machine learning models revolutionizing credit scoring to AI-powered fraud detection systems protecting millions of transactions daily, the landscape is evolving at an unprecedented pace.

This newsletter brings you curated insights on:

• AI applications in credit risk assessment and scoring
• Banking automation and operational efficiency
• Fraud detection and prevention technologies
• Regulatory developments and compliance considerations
• Customer experience innovations
• Research breakthroughs and industry case studies

Each week, we analyze the trends that matter most to risk management professionals, banking executives, and fintech innovators. Our goal is to cut through the noise and deliver actionable intelligence that helps you stay ahead of the curve.

As AI capabilities continue to advance, the financial services industry faces both tremendous opportunities and significant challenges. Responsible AI adoption, algorithmic fairness, and regulatory compliance remain critical considerations that we'll explore in depth.

We're excited to have you join our community of forward-thinking professionals navigating this transformative era. Stay tuned for weekly editorials, top article roundups, and exclusive insights.

Welcome aboard.`;

  const editorial = await Editorial.create({
    title: 'Welcome to AI Credit News: Your Guide to AI in Financial Services',
    content,
    week_start: monday.toISOString().split('T')[0],
    week_end: sunday.toISOString().split('T')[0]
  });

  return editorial;
}

module.exports = {
  generateWeeklyEditorial,
  createWelcomeEditorial
};
