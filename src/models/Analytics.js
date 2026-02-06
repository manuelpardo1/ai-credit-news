const { run, get, all } = require('../database/db');

class Analytics {
  /**
   * Record an article view
   */
  static async recordView(articleId, sessionId = null, userAgent = null, referrer = null) {
    // Insert view record
    await run(
      `INSERT INTO article_views (article_id, session_id, user_agent, referrer) VALUES (?, ?, ?, ?)`,
      [articleId, sessionId, userAgent, referrer]
    );

    // Increment article view count
    await run(
      `UPDATE articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`,
      [articleId]
    );
  }

  /**
   * Get dashboard statistics for admin
   */
  static async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Total counts
    const totals = await get(`
      SELECT
        (SELECT COUNT(*) FROM articles WHERE status = 'approved') as total_articles,
        (SELECT COUNT(*) FROM articles WHERE status = 'pending') as pending_articles,
        (SELECT COUNT(*) FROM articles WHERE status = 'rejected') as rejected_articles,
        (SELECT COUNT(*) FROM sources WHERE active = 1) as active_sources,
        (SELECT COUNT(*) FROM subscribers WHERE active = 1) as active_subscribers,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COALESCE(SUM(view_count), 0) FROM articles) as total_views
    `);

    // Today's stats
    const todayStats = await get(`
      SELECT
        (SELECT COUNT(*) FROM article_views WHERE DATE(viewed_at) = ?) as views_today,
        (SELECT COUNT(DISTINCT session_id) FROM article_views WHERE DATE(viewed_at) = ? AND session_id IS NOT NULL) as unique_visitors_today,
        (SELECT COUNT(*) FROM articles WHERE DATE(scraped_date) = ?) as scraped_today,
        (SELECT COUNT(*) FROM articles WHERE DATE(scraped_date) = ? AND status = 'approved') as approved_today
    `, [today, today, today, today]);

    // This week's stats
    const weekStats = await get(`
      SELECT
        (SELECT COUNT(*) FROM article_views WHERE DATE(viewed_at) >= ?) as views_week,
        (SELECT COUNT(DISTINCT session_id) FROM article_views WHERE DATE(viewed_at) >= ? AND session_id IS NOT NULL) as unique_visitors_week,
        (SELECT COUNT(*) FROM articles WHERE DATE(scraped_date) >= ? AND status = 'approved') as approved_week,
        (SELECT COUNT(*) FROM subscribers WHERE DATE(subscribed_at) >= ?) as new_subscribers_week
    `, [weekAgo, weekAgo, weekAgo, weekAgo]);

    // This month's stats
    const monthStats = await get(`
      SELECT
        (SELECT COUNT(*) FROM article_views WHERE DATE(viewed_at) >= ?) as views_month,
        (SELECT COUNT(*) FROM articles WHERE DATE(scraped_date) >= ? AND status = 'approved') as approved_month
    `, [monthAgo, monthAgo]);

    return {
      totals,
      today: todayStats,
      week: weekStats,
      month: monthStats
    };
  }

  /**
   * Get most viewed articles
   */
  static async getTopArticles(limit = 10, period = 'all') {
    let dateFilter = '';
    const params = [limit];

    if (period === 'week') {
      dateFilter = `AND av.viewed_at >= DATE('now', '-7 days')`;
    } else if (period === 'month') {
      dateFilter = `AND av.viewed_at >= DATE('now', '-30 days')`;
    } else if (period === 'today') {
      dateFilter = `AND DATE(av.viewed_at) = DATE('now')`;
    }

    if (period === 'all') {
      // Use the cached view_count for all-time
      return all(`
        SELECT a.id, a.title, a.source, a.published_date, a.view_count as views,
               c.name as category_name, c.slug as category_slug
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'approved' AND a.view_count > 0
        ORDER BY a.view_count DESC
        LIMIT ?
      `, params);
    }

    // For time-based queries, count from article_views
    return all(`
      SELECT a.id, a.title, a.source, a.published_date, COUNT(av.id) as views,
             c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN article_views av ON a.id = av.article_id ${dateFilter}
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'approved'
      GROUP BY a.id
      HAVING views > 0
      ORDER BY views DESC
      LIMIT ?
    `, params);
  }

  /**
   * Get views over time (for charts)
   */
  static async getViewsOverTime(days = 30) {
    return all(`
      SELECT DATE(viewed_at) as date, COUNT(*) as views
      FROM article_views
      WHERE viewed_at >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(viewed_at)
      ORDER BY date ASC
    `, [days]);
  }

  /**
   * Get category performance
   */
  static async getCategoryStats() {
    return all(`
      SELECT
        c.id, c.name, c.slug,
        COUNT(DISTINCT a.id) as article_count,
        COALESCE(SUM(a.view_count), 0) as total_views,
        ROUND(AVG(a.relevance_score), 1) as avg_relevance
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'approved'
      GROUP BY c.id
      ORDER BY total_views DESC
    `);
  }

  /**
   * Get source performance
   */
  static async getSourceStats() {
    return all(`
      SELECT
        source,
        COUNT(*) as total_scraped,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND(100.0 * SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) / COUNT(*), 1) as approval_rate,
        COALESCE(SUM(view_count), 0) as total_views
      FROM articles
      WHERE source IS NOT NULL
      GROUP BY source
      ORDER BY approved DESC
    `);
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit = 20) {
    return all(`
      SELECT
        'view' as type,
        a.title as description,
        av.viewed_at as timestamp,
        a.id as article_id
      FROM article_views av
      JOIN articles a ON av.article_id = a.id
      UNION ALL
      SELECT
        'subscribe' as type,
        email as description,
        subscribed_at as timestamp,
        NULL as article_id
      FROM subscribers
      WHERE active = 1
      UNION ALL
      SELECT
        'article' as type,
        title as description,
        scraped_date as timestamp,
        id as article_id
      FROM articles
      WHERE status = 'approved'
      ORDER BY timestamp DESC
      LIMIT ?
    `, [limit]);
  }

  /**
   * Get content freshness stats
   */
  static async getContentFreshness() {
    return get(`
      SELECT
        (SELECT COUNT(*) FROM articles WHERE status = 'approved' AND DATE(published_date) = DATE('now')) as today,
        (SELECT COUNT(*) FROM articles WHERE status = 'approved' AND DATE(published_date) >= DATE('now', '-7 days')) as this_week,
        (SELECT COUNT(*) FROM articles WHERE status = 'approved' AND DATE(published_date) >= DATE('now', '-30 days')) as this_month,
        (SELECT COUNT(*) FROM articles WHERE status = 'approved' AND DATE(published_date) < DATE('now', '-30 days')) as older,
        (SELECT MAX(scraped_date) FROM articles) as last_scrape,
        (SELECT MAX(published_date) FROM articles WHERE status = 'approved') as newest_article
    `);
  }

  /**
   * Update daily stats (run via cron)
   */
  static async updateDailyStats() {
    const today = new Date().toISOString().split('T')[0];

    const stats = await get(`
      SELECT
        (SELECT COUNT(*) FROM article_views WHERE DATE(viewed_at) = ?) as total_views,
        (SELECT COUNT(DISTINCT session_id) FROM article_views WHERE DATE(viewed_at) = ? AND session_id IS NOT NULL) as unique_sessions,
        (SELECT COUNT(*) FROM articles WHERE DATE(scraped_date) = ?) as articles_scraped,
        (SELECT COUNT(*) FROM articles WHERE DATE(scraped_date) = ? AND status = 'approved') as articles_approved,
        (SELECT COUNT(*) FROM articles WHERE DATE(scraped_date) = ? AND status = 'rejected') as articles_rejected,
        (SELECT COUNT(*) FROM subscribers WHERE DATE(subscribed_at) = ?) as new_subscribers
    `, [today, today, today, today, today, today]);

    await run(`
      INSERT OR REPLACE INTO daily_stats (date, total_views, unique_sessions, articles_scraped, articles_approved, articles_rejected, new_subscribers)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [today, stats.total_views, stats.unique_sessions, stats.articles_scraped, stats.articles_approved, stats.articles_rejected, stats.new_subscribers]);
  }

  /**
   * Record article feedback (helpful/not helpful)
   */
  static async recordFeedback(articleId, isHelpful, userId = null, sessionId = null) {
    // Check if user/session already gave feedback
    const existing = await get(
      `SELECT id, is_helpful FROM article_feedback
       WHERE article_id = ? AND (user_id = ? OR session_id = ?)`,
      [articleId, userId, sessionId]
    );

    if (existing) {
      // Update existing feedback if changed
      if (existing.is_helpful !== isHelpful) {
        await run('UPDATE article_feedback SET is_helpful = ? WHERE id = ?', [isHelpful, existing.id]);

        // Update counts
        if (isHelpful) {
          await run('UPDATE articles SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = ?', [articleId]);
        } else {
          await run('UPDATE articles SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = ?', [articleId]);
        }
      }
      return { updated: true };
    }

    // Insert new feedback
    await run(
      `INSERT INTO article_feedback (article_id, user_id, session_id, is_helpful) VALUES (?, ?, ?, ?)`,
      [articleId, userId, sessionId, isHelpful]
    );

    // Update article counts
    if (isHelpful) {
      await run('UPDATE articles SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = ?', [articleId]);
    } else {
      await run('UPDATE articles SET not_helpful_count = COALESCE(not_helpful_count, 0) + 1 WHERE id = ?', [articleId]);
    }

    return { created: true };
  }

  /**
   * Get feedback for an article
   */
  static async getArticleFeedback(articleId) {
    return get(`
      SELECT
        COALESCE(helpful_count, 0) as helpful,
        COALESCE(not_helpful_count, 0) as not_helpful
      FROM articles WHERE id = ?
    `, [articleId]);
  }

  /**
   * Check if user/session already gave feedback
   */
  static async hasGivenFeedback(articleId, userId = null, sessionId = null) {
    const result = await get(
      `SELECT is_helpful FROM article_feedback
       WHERE article_id = ? AND (user_id = ? OR session_id = ?)`,
      [articleId, userId, sessionId]
    );
    return result ? { given: true, isHelpful: result.is_helpful } : { given: false };
  }

  /**
   * Get public stats for homepage
   */
  static async getPublicStats() {
    return get(`
      SELECT
        (SELECT COUNT(*) FROM articles WHERE status = 'approved') as total_articles,
        (SELECT COUNT(*) FROM articles WHERE status = 'approved' AND DATE(published_date) >= DATE('now', '-7 days')) as articles_this_week,
        (SELECT COUNT(*) FROM sources WHERE active = 1) as source_count,
        (SELECT COUNT(*) FROM categories) as category_count,
        (SELECT COALESCE(SUM(view_count), 0) FROM articles) as total_reads,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as community_members
    `);
  }

  /**
   * Get trending articles (most views in last 7 days)
   */
  static async getTrendingArticles(limit = 5) {
    return all(`
      SELECT a.id, a.title, a.source, a.published_date, a.view_count,
             c.name as category_name, c.slug as category_slug,
             COUNT(av.id) as recent_views
      FROM articles a
      LEFT JOIN article_views av ON a.id = av.article_id AND av.viewed_at >= DATE('now', '-7 days')
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'approved'
      GROUP BY a.id
      ORDER BY recent_views DESC, a.view_count DESC
      LIMIT ?
    `, [limit]);
  }
}

module.exports = Analytics;
