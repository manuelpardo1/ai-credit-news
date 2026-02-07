# AI Credit News - Platform Case Study

## What We Built

A fully autonomous AI-powered news platform that curates, scores, generates, and publishes industry-specific content with zero daily human intervention required.

**Live:** [AI Credit News](https://web-production-d608b.up.railway.app)
**Stack:** Node.js, Express, SQLite, EJS, Claude AI, Railway
**Build time:** ~2 weeks from concept to production

---

## The Problem

Credit and banking professionals need to stay current on how AI is transforming their industry. But:
- Industry news is scattered across 55+ sources
- Most content is too general or too technical
- No single destination aggregates AI + credit/finance news
- Manual curation doesn't scale

## The Solution

An intelligent content platform that:
1. **Scrapes** 55+ RSS feeds twice daily (English + Spanish sources)
2. **Filters** articles through a two-phase AI relevance system
3. **Queues** approved content for admin review or auto-publication
4. **Generates** original AI articles to fill content gaps
5. **Publishes** a weekly AI-written editorial
6. **Sends** automated newsletters to subscribers
7. **Tracks** analytics, engagement, and content freshness

All running on autopilot with an admin dashboard for oversight.

---

## Architecture Overview

```
                                    CONTENT PIPELINE

RSS Sources (55+)                   AI Article Generator
     |                                    |
     v                                    v
  Scraper -----> Pending -----> AI Processor -----> Queue
  (axios,         (raw)         (Claude AI)      (scored,
   rss-parser)                  Two-phase:       categorized)
                                1. Title filter       |
                                2. Full analysis      v
                                              Admin Review
                                              (or auto-promote
                                               next cron cycle)
                                                    |
                                                    v
                                              Approved -----> Public Site
                                                    |
                                                    v
                                              Weekly Editorial (AI)
                                                    |
                                                    v
                                              Newsletter (Resend)
```

---

## Key Systems

### 1. Content Acquisition Engine

**55+ RSS Sources** organized by type:
- Tech/AI: TechCrunch, VentureBeat, MIT Tech Review
- Finance: Finextra, American Banker, Banking Dive, PYMNTS
- Credit Bureaus: Experian, FICO, TransUnion, Equifax blogs
- Consulting: McKinsey, Deloitte, Oliver Wyman
- Premium: Forbes, Bloomberg, WSJ, Reuters
- Spanish: BBVA, El Economista, iupana LATAM

**How it works:**
- RSS-first approach with HTML fallback via Cheerio
- Configurable age filters (default 24h for cron, 3mo for initial population)
- Duplicate detection by URL
- Rate-limited: 2s between sources, 1s between article fetches
- All scraped articles land in `pending` status

### 2. AI Processing Pipeline

**Two-phase AI filter (Claude API):**

| Phase | Model | Purpose | Cost |
|-------|-------|---------|------|
| Phase 1 | Haiku (fast) | Title relevance check: "Is this about AI in credit/banking?" YES/NO | Low |
| Phase 2 | Sonnet (quality) | Full analysis: relevance score (0-10), category, tags, summary, difficulty | Medium |

Articles scoring 6+ move to `queued` status. Below 6 get rejected.

**AI Article Generation (Sonnet):**
- Two-step: Research phase + Writing phase
- Per-category topic configuration with industry players, keywords, focus areas
- 5 article types: trend analysis, product launch, market insight, regulatory update, future outlook
- Balance rule: AI articles never exceed scraped articles count

### 3. Queue & Review System

```
pending --> (AI filter) --> queued --> (admin review OR auto-promote) --> approved
                              |
                              +--> admin bulk approve/reject from /admin/queue
```

- Admin gets a bulk review page with relevance scores and checkbox selection
- Unreviewed articles auto-promote at the start of the next cron cycle
- Queued articles count toward daily limits, preventing unnecessary AI generation

### 4. Admin Dashboard

Full operational control with:
- **Analytics:** Views, subscribers, content freshness, source/category performance
- **Queue:** Bulk approve/reject scored articles with relevance badges
- **Settings:** Configurable daily limits, AI caps, scrape parameters
- **Operations:** Manual scrape, AI supplement, process all, full refresh
- **Progress Dashboard:** Real-time operation progress with pause/resume/cancel
- **Editorials:** AI editorial generation, publishing, newsletter controls
- **Brand Guide:** Visual reference for brand identity

### 5. Newsletter System

**Provider:** Resend (transactional email)

| Email Type | Trigger | Content |
|-----------|---------|---------|
| Welcome | On subscribe | Greeting + latest editorial + 5 recent articles |
| Weekly | Monday 8am (cron) | Published editorial + top 10 articles by relevance |
| Extraordinary | Admin manual | Up to 15 articles, uses draft editorial as fallback |
| Admin Alert | On editorial generation | Preview + review link |

### 6. Public-Facing Site

- **Homepage:** Split hero (featured article + editorial), trending sidebar, article list with helpfulness voting, subscribe widget
- **Article Pages:** Full content, tags, comments, related articles, share buttons, save/bookmark
- **Category Pages:** Filtered browsing with pagination
- **Search:** Full-text search across title, content, and summary
- **Analytics:** Public dashboard with Chart.js visualizations
- **i18n:** English/Spanish toggle with 140+ translation keys
- **Responsive:** Mobile-first with slide-out sidebar navigation

### 7. Scheduling Engine

| Schedule | Task |
|----------|------|
| 12am & 12pm daily | Full content cycle: promote queue -> scrape -> process -> AI supplement |
| Every 6 hours | Auto-publish AI articles stuck in review >48h |
| Sunday 1pm | Generate weekly editorial from week's articles |
| Monday 8am | Send newsletter to all active subscribers |
| On startup | Seed editorial if none exists, ensure 5+ articles per category |

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 20+ | Server-side JavaScript |
| Framework | Express 4 | HTTP server, routing, middleware |
| Database | SQLite3 | Embedded relational database |
| Templates | EJS | Server-side HTML rendering |
| AI | Anthropic Claude API | Content filtering, generation, editorials |
| Scraping | rss-parser + axios + cheerio | RSS feeds and HTML content extraction |
| Email | Resend | Transactional email delivery |
| Scheduling | node-cron | Automated task execution |
| Auth | PBKDF2 + signed cookies | Admin password auth + user accounts |
| OAuth | Google + Apple Sign-In | Social authentication |
| Deployment | Railway | PaaS hosting with persistent volume |
| CSS | Custom properties + responsive | Single 2700-line stylesheet |

### Database Schema

**11 tables:**
- `articles` - Core content with status lifecycle, AI scoring, category assignment
- `categories` - 6 credit/banking categories with slugs and descriptions
- `sources` - 55+ RSS feed URLs with active/inactive toggle
- `tags` / `article_tags` - Many-to-many article tagging
- `editorials` - Weekly AI editorials with draft/published status
- `subscribers` - Newsletter subscribers with unsubscribe tokens
- `newsletter_logs` - Send history tracking
- `article_views` - Per-view analytics with session/UA/referrer
- `users` - User accounts with OAuth support
- `comments` - Article comments by authenticated users
- `settings` - Key-value configuration store
- `article_feedback` - Helpful/not helpful votes

---

## What Makes This Replicable

Every industry-specific component is isolated and configurable:

| Component | What to Change | Where |
|-----------|---------------|-------|
| Categories | Replace 6 credit categories | `src/database/seed.js` |
| RSS Sources | Replace 55+ feeds | `src/database/seed.js` |
| AI Relevance Filter | Update industry criteria in prompts | `src/services/ai.js` |
| AI Article Topics | Update research focus per category | `src/services/articleGenerator.js` |
| Brand & Design | Colors, logo, typography | `public/css/styles.css`, `public/images/` |
| Copy & i18n | Site text and translations | `public/js/i18n.js`, view templates |
| Email Templates | Branding in HTML emails | `src/services/email.js` |

The core pipeline (scrape -> filter -> queue -> publish -> newsletter) is completely industry-agnostic.

---

## Metrics & Performance

- **Content Volume:** 5-10 articles published daily (configurable)
- **Source Coverage:** 55+ RSS feeds scraped in ~3 minutes
- **AI Processing:** ~15 seconds per article (two API calls)
- **AI Generation:** ~30 seconds per original article (research + writing)
- **Deployment:** Single Railway dyno, ~$5-20/month hosting
- **AI Costs:** ~$0.50-2.00/day depending on volume (Claude API)
- **Zero daily maintenance** after initial setup and source configuration

---

## Deployment

Single command deployment:
```bash
npm start  # Runs: init -> seed -> migrate -> server
```

Railway auto-deploys from GitHub push. SQLite persists on Railway volume mount.

**Environment variables needed:**
- `ANTHROPIC_API_KEY` - Claude AI API access
- `RESEND_API_KEY` - Email delivery
- `ADMIN_PASSWORD` - Admin dashboard access
- `SESSION_SECRET` - Cookie signing
- `SITE_URL` - Public URL for email links

---

## What the Client Gets

1. A fully operational news site publishing relevant content daily
2. Admin dashboard with complete editorial control
3. Automated newsletter growing their subscriber base
4. Analytics on content performance and audience engagement
5. AI that learns their industry focus through configured prompts
6. Zero ongoing development costs - runs autonomously
7. Source code ownership - no vendor lock-in (except AI API)
