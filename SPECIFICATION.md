# AI Credit & Banking News Platform - Technical Specification

## Project Overview

A news aggregation and publishing platform that collects, filters, and organizes articles about AI applications in credit scoring and banking. The platform uses AI to assess article relevance and provides an educational, journalism-style interface for users.

## Core Objectives

1. Automatically discover and collect articles from multiple sources
2. Use AI to filter for relevance (AI + credit/banking intersection)
3. Categorize and organize content for easy discovery
4. Present content in a clean, newspaper-style website
5. Make complex AI/finance topics accessible to various skill levels

---

## Technical Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite3
- **Scraping**: Cheerio + Axios (or Puppeteer if needed for JavaScript-heavy sites)
- **AI**: Anthropic Claude API (for relevance filtering and summarization)
- **Task Scheduling**: node-cron (for automated scraping)

### Frontend
- HTML5 with semantic markup
- CSS3 with responsive design (mobile-first)
- Vanilla JavaScript (no framework - keep it simple)
- Optional: Simple templating with EJS or Handlebars

### Deployment
- **Development**: Local with nodemon
- **Production**: Railway, Render, or Vercel (whichever is simplest)

---

## Database Schema

### Articles Table

```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  author TEXT,
  published_date DATE,
  scraped_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  content TEXT,
  summary TEXT,
  relevance_score FLOAT,
  difficulty_level TEXT, -- beginner, intermediate, advanced
  category_id INTEGER,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Categories Table

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT
);
```

### Tags Table

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);
```

### Article_Tags Junction Table

```sql
CREATE TABLE article_tags (
  article_id INTEGER,
  tag_id INTEGER,
  FOREIGN KEY (article_id) REFERENCES articles(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id),
  PRIMARY KEY (article_id, tag_id)
);
```

### Sources Table

```sql
CREATE TABLE sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT,
  rss_feed TEXT,
  scrape_selector TEXT, -- CSS selector for scraping
  active BOOLEAN DEFAULT 1,
  last_scraped DATETIME
);
```

---

## Content Categories

1. **AI in Credit Scoring** - Machine learning models for creditworthiness
2. **Banking Automation** - AI-powered banking operations
3. **Fraud Detection** - AI for detecting financial fraud
4. **Regulatory & Compliance** - AI governance, fairness, regulations
5. **Risk Management** - AI for financial risk assessment
6. **Customer Experience** - Chatbots, personalization, AI interfaces
7. **Research & Innovation** - Academic papers, new techniques
8. **Case Studies** - Real-world implementations
9. **Industry News** - Company announcements, partnerships
10. **Ethics & Bias** - Fair lending, algorithmic bias, responsible AI

---

## News Sources to Scrape

### AI/Tech Publications
- TechCrunch (AI section)
- VentureBeat (AI section)
- MIT Technology Review
- The Verge (AI section)
- AI News (specific sites like AI Business)

### Finance/Banking Publications
- American Banker
- The Financial Brand
- Fintech News
- Banking Dive
- Payments Dive

### Academic/Research
- arXiv.org (cs.AI + related to finance)
- Google Scholar alerts
- ACM Digital Library

### General News
- Reuters (technology + finance)
- Bloomberg (technology section)
- Wall Street Journal (tech section)

**Note**: Respect robots.txt and terms of service. Consider using RSS feeds where available.

---

## AI Processing Workflow

### 1. Relevance Filtering

For each scraped article, send to Claude API:

**Prompt Template**:
```
Analyze this article and determine its relevance to AI applications in
credit scoring and banking.

Title: {title}
Content: {content_excerpt}

Return JSON with:
- relevance_score (0-10)
- is_relevant (boolean)
- primary_category (from our category list)
- suggested_tags (array)
- reasoning (brief explanation)
```

### 2. Summarization

For relevant articles (score > 6):

**Prompt Template**:
```
Summarize this article in 2-3 sentences for a news aggregation site
focused on AI in credit and banking. Make it accessible to both
technical and non-technical readers.

Title: {title}
Content: {full_content}
```

### 3. Difficulty Assessment

**Prompt Template**:
```
Rate the technical difficulty of this article:
- beginner (general audience, minimal jargon)
- intermediate (some technical knowledge required)
- advanced (deep technical or domain expertise required)

Article: {title and excerpt}
```

---

## Backend API Endpoints

### Articles
- `GET /api/articles` - List articles (with pagination, filters)
  - Query params: `?category=slug&tag=name&difficulty=level&page=1&limit=20`
- `GET /api/articles/:id` - Get single article
- `GET /api/articles/latest` - Get most recent articles (homepage)
- `GET /api/articles/search?q=query` - Search articles

### Categories
- `GET /api/categories` - List all categories with article counts
- `GET /api/categories/:slug` - Get category with articles

### Tags
- `GET /api/tags` - List all tags
- `GET /api/tags/:name/articles` - Articles by tag

### Admin (optional for MVP)
- `POST /api/scrape/run` - Manually trigger scraping
- `GET /api/scrape/status` - Get scraping status

---

## Frontend Pages

### 1. Homepage (`/`)
- Hero section with tagline
- Featured/latest articles (cards layout)
- Category grid/navigation
- Search bar

### 2. Category Page (`/category/:slug`)
- Category header with description
- Filtered article list
- Sidebar with related categories
- Filter by difficulty, date

### 3. Article Detail (`/article/:id`)
- Full article content (or link to source)
- Metadata (date, source, author, difficulty)
- Tags
- Related articles section
- "Read original" button

### 4. Search Results (`/search?q=...`)
- Search results with highlighting
- Filters (category, date, difficulty)

### 5. About Page (`/about`)
- Explain the purpose
- How articles are selected
- Contact/feedback

---

## Scraping Strategy

### Approach
1. **RSS Feeds First** - Easier and respectful
2. **HTML Scraping** - For sites without RSS (use selectors carefully)
3. **Rate Limiting** - Max 1 request per second per source
4. **Error Handling** - Log failures, retry with exponential backoff

### Scraper Workflow
```
1. Fetch article list from source (RSS or HTML)
2. For each article:
   a. Check if URL already in database (skip if exists)
   b. Fetch full article content
   c. Extract: title, content, author, date, source
   d. Send to AI for relevance check
   e. If relevant (score > 6):
      - Generate summary
      - Determine difficulty
      - Assign category and tags
      - Save to database
   f. Rate limit pause
3. Update source's last_scraped timestamp
```

### Scheduling
- Run scraper every 6 hours
- Configurable via environment variable

---

## UI/UX Design Guidelines

### Visual Style
- **Clean, newspaper-inspired** layout
- **Typography**: Serif headings (e.g., Merriweather), sans-serif body (e.g., Inter)
- **Color scheme**:
  - Primary: Deep blue (#1e3a8a)
  - Accent: Teal (#0d9488)
  - Background: Light gray (#f9fafb)
  - Text: Dark gray (#1f2937)
- **Cards**: Subtle shadows, rounded corners
- **Responsive**: Mobile-first grid (CSS Grid or Flexbox)

### Article Card Components
- Thumbnail/icon (category-based if no image)
- Headline (linked)
- Summary (2-3 lines)
- Metadata: Source, date, difficulty badge
- Tags (as small pills)

### Navigation
- Top navbar: Logo, Categories dropdown, Search
- Footer: About, Contact, RSS feed, Social links

---

## Environment Variables

Create `.env` file:
```
PORT=3000
DATABASE_PATH=./database/news.db
ANTHROPIC_API_KEY=your_api_key_here
SCRAPE_INTERVAL_HOURS=6
NODE_ENV=development
```

---

## Development Phases

### Phase 1: Core Infrastructure (Week 1)
- Set up project structure
- Initialize database with schema
- Create Express server with basic routes
- Build simple scraper for 1-2 RSS feeds
- Test data flow: scrape → store → retrieve

### Phase 2: AI Integration (Week 1-2)
- Integrate Claude API for relevance filtering
- Add summarization
- Add difficulty assessment
- Test and tune prompts

### Phase 3: Frontend (Week 2)
- Build homepage with article cards
- Create category pages
- Build article detail view
- Add basic search functionality
- Make responsive

### Phase 4: Polish & Deploy (Week 2-3)
- Error handling and logging
- Add more sources
- Optimize performance
- Deploy to hosting platform
- Set up automated scraping schedule

### Future Enhancements (Optional)
- User accounts and saved articles
- Email newsletter
- Advanced search with filters
- Bookmark/favorite functionality
- Comments section
- RSS feed output
- Dark mode

---

## Testing Checklist

- [ ] Scraper successfully fetches from all sources
- [ ] Duplicate articles are not added
- [ ] AI filtering works and categorizes correctly
- [ ] Database queries are efficient
- [ ] API returns correct data
- [ ] Frontend displays articles properly
- [ ] Search works
- [ ] Mobile responsive
- [ ] Links work correctly
- [ ] Error states handled gracefully

---

## Success Metrics

- Scrapes at least 20-50 new relevant articles per week
- 90%+ relevance accuracy (minimal false positives)
- Page load time < 2 seconds
- Mobile usable
- Clean, professional appearance

---

## Initial Data

Seed the categories table with the 10 categories listed above. Add 5-10 initial sources to get started.

---

**End of Specification**
