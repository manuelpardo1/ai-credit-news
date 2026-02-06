const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

// Load env if run directly
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Article = require('../models/Article');
const Source = require('../models/Source');

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AI-Credit-News-Bot/1.0 (Educational News Aggregator)'
  }
});

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch and parse RSS feed from a source
 */
async function fetchRssFeed(source) {
  try {
    console.log(`Fetching RSS feed: ${source.name}`);
    const feed = await parser.parseURL(source.rss_feed);
    return feed.items || [];
  } catch (err) {
    console.error(`Error fetching RSS from ${source.name}:`, err.message);
    return [];
  }
}

/**
 * Extract article content from URL (basic implementation)
 */
async function fetchArticleContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'AI-Credit-News-Bot/1.0 (Educational News Aggregator)'
      }
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ads, .advertisement').remove();

    // Try common content selectors
    let content = '';
    const selectors = [
      'article',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 200) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body if nothing found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    // Limit content length
    if (content.length > 10000) {
      content = content.substring(0, 10000) + '...';
    }

    return content;
  } catch (err) {
    console.error(`Error fetching content from ${url}:`, err.message);
    return null;
  }
}

/**
 * Process a single RSS item and save if new
 * @param {Object} item - RSS item
 * @param {string} sourceName - Name of the source
 * @param {string} sourceLanguage - Language code
 * @param {Object} options - Processing options
 * @param {number} options.maxAgeHours - Maximum age of articles in hours (null = no limit)
 * @param {number} options.maxAgeMonths - Maximum age of articles in months (null = no limit)
 */
async function processItem(item, sourceName, sourceLanguage = 'en', options = {}) {
  const url = item.link || item.guid;
  if (!url) return null;

  // Check if article already exists
  const existing = await Article.findByUrl(url);
  if (existing) {
    console.log(`  Skipping (exists): ${item.title?.substring(0, 50)}...`);
    return null;
  }

  // Parse published date
  let publishedDate = null;
  let parsedDate = null;
  if (item.pubDate || item.isoDate) {
    try {
      parsedDate = new Date(item.pubDate || item.isoDate);
      publishedDate = parsedDate.toISOString().split('T')[0];
    } catch (e) {
      // Use current date as fallback
      publishedDate = new Date().toISOString().split('T')[0];
      parsedDate = new Date();
    }
  } else {
    parsedDate = new Date();
    publishedDate = parsedDate.toISOString().split('T')[0];
  }

  // Check age constraints
  const now = new Date();
  if (options.maxAgeHours && parsedDate) {
    const hoursAgo = (now - parsedDate) / (1000 * 60 * 60);
    if (hoursAgo > options.maxAgeHours) {
      console.log(`  Skipping (too old - ${Math.round(hoursAgo)}h): ${item.title?.substring(0, 50)}...`);
      return null;
    }
  }
  if (options.maxAgeMonths && parsedDate) {
    const monthsAgo = (now - parsedDate) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo > options.maxAgeMonths) {
      console.log(`  Skipping (too old - ${Math.round(monthsAgo)}mo): ${item.title?.substring(0, 50)}...`);
      return null;
    }
  }

  // Get content - use RSS content or fetch from URL
  let content = item.content || item['content:encoded'] || item.contentSnippet || '';

  // If content is too short, try to fetch from URL
  if (content.length < 200) {
    console.log(`  Fetching full content for: ${item.title?.substring(0, 40)}...`);
    const fetchedContent = await fetchArticleContent(url);
    if (fetchedContent && fetchedContent.length > content.length) {
      content = fetchedContent;
    }
    // Rate limit
    await delay(1000);
  }

  // Create article object
  const article = {
    title: item.title || 'Untitled',
    url: url,
    source: sourceName,
    author: item.creator || item.author || null,
    published_date: publishedDate,
    content: content,
    summary: item.contentSnippet || content.substring(0, 300),
    status: 'pending',
    language: sourceLanguage
  };

  try {
    const articleId = await Article.create(article);
    console.log(`  Added: ${article.title.substring(0, 50)}...`);
    return articleId;
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      console.log(`  Skipping (duplicate URL): ${article.title.substring(0, 50)}...`);
    } else {
      console.error(`  Error saving article:`, err.message);
    }
    return null;
  }
}

/**
 * Scrape a single source
 * @param {Object} source - Source object from database
 * @param {Object} options - Scraping options
 * @param {number} options.maxAgeHours - Maximum age of articles in hours
 * @param {number} options.maxAgeMonths - Maximum age of articles in months
 */
async function scrapeSource(source, options = {}) {
  console.log(`\n--- Scraping: ${source.name} ---`);
  const items = await fetchRssFeed(source);
  console.log(`Found ${items.length} items`);

  let added = 0;
  let skipped = 0;

  for (const item of items.slice(0, 20)) { // Limit to 20 items per source
    const result = await processItem(item, source.name, source.language || 'en', options);
    if (result) {
      added++;
    } else {
      skipped++;
    }
  }

  // Update last scraped timestamp
  await Source.updateLastScraped(source.id);

  return { source: source.name, added, skipped, total: items.length };
}

/**
 * Run scrape on all active sources
 * @param {Object} options - Scraping options
 * @param {number} options.maxAgeHours - Maximum age of articles in hours (default: no limit)
 * @param {number} options.maxAgeMonths - Maximum age of articles in months (default: no limit)
 * @param {Object} options.progressCallback - Progress tracker object
 */
async function runScrape(options = {}) {
  const progress = options.progressCallback;

  console.log('\n========================================');
  console.log('Starting scrape at:', new Date().toISOString());
  if (options.maxAgeHours) console.log(`Max article age: ${options.maxAgeHours} hours`);
  if (options.maxAgeMonths) console.log(`Max article age: ${options.maxAgeMonths} months`);
  console.log('========================================\n');

  const sources = await Source.findActive();
  console.log(`Found ${sources.length} active sources`);

  // Update progress with total sources
  if (progress) {
    progress.updateScraping({ totalSources: sources.length, sourcesProcessed: 0 });
    progress.log(`Found ${sources.length} active RSS sources`);
  }

  const results = [];
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let sourcesProcessed = 0;

  for (const source of sources) {
    if (!source.rss_feed) {
      console.log(`Skipping ${source.name} - no RSS feed configured`);
      continue;
    }

    // Update progress with current source
    if (progress) {
      progress.updateScraping({ currentSource: source.name });
      progress.log(`Scraping: ${source.name}`);
    }

    try {
      const result = await scrapeSource(source, options);
      results.push(result);
      totalAdded += result.added || 0;
      totalSkipped += result.skipped || 0;
    } catch (err) {
      console.error(`Error scraping ${source.name}:`, err.message);
      results.push({ source: source.name, error: err.message });
      totalErrors++;
      if (progress) {
        progress.log(`Error: ${source.name} - ${err.message}`);
      }
    }

    sourcesProcessed++;

    // Update progress
    if (progress) {
      progress.updateScraping({
        sourcesProcessed,
        articlesFound: totalAdded + totalSkipped,
        articlesAdded: totalAdded,
        articlesSkipped: totalSkipped,
        sourceErrors: totalErrors
      });
    }

    // Rate limit between sources
    await delay(2000);
  }

  console.log('\n========================================');
  console.log('Scrape complete!');
  console.log('========================================');
  console.log('Results:', JSON.stringify(results, null, 2));

  if (progress) {
    progress.log(`Scrape complete: ${totalAdded} added, ${totalSkipped} skipped, ${totalErrors} errors`);
  }

  return {
    timestamp: new Date().toISOString(),
    sourcesProcessed: results.length,
    articlesAdded: totalAdded,
    articlesSkipped: totalSkipped,
    errors: totalErrors,
    results
  };
}

// Export for use as module
module.exports = {
  runScrape,
  scrapeSource,
  fetchRssFeed,
  fetchArticleContent
};

// Run directly if called from command line
if (require.main === module) {
  runScrape()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Scrape failed:', err);
      process.exit(1);
    });
}
