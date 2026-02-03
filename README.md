# AI Credit & Banking News Platform

A news aggregation platform that collects, filters, and organizes articles about AI applications in credit scoring and banking.

## Quick Start

### 1. Install Dependencies

```bash
cd ai-credit-news
npm install
```

### 2. Initialize Database

```bash
npm run db:init
npm run db:seed
```

### 3. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at http://localhost:3000

### 4. Test the API

```bash
# Check health
curl http://localhost:3000/api/health

# Get categories
curl http://localhost:3000/api/categories

# Get sources
curl http://localhost:3000/api/sources

# Get articles
curl http://localhost:3000/api/articles
```

### 5. Run the Scraper

Manual scrape from command line:
```bash
npm run scrape
```

Or via API:
```bash
curl -X POST http://localhost:3000/api/scrape/run
```

Check scrape status:
```bash
curl http://localhost:3000/api/scrape/status
```

## API Endpoints

### Articles
- `GET /api/articles` - List articles (paginated)
- `GET /api/articles/latest` - Get latest articles
- `GET /api/articles/search?q=query` - Search articles
- `GET /api/articles/:id` - Get single article

### Categories
- `GET /api/categories` - List categories with article counts
- `GET /api/categories/:slug` - Get category with articles

### Tags
- `GET /api/tags` - List all tags
- `GET /api/tags/:name/articles` - Get articles by tag

### Sources
- `GET /api/sources` - List all news sources

### Admin
- `POST /api/scrape/run` - Trigger manual scrape
- `GET /api/scrape/status` - Get scrape status

## Project Structure

```
ai-credit-news/
├── src/
│   ├── server.js          # Express server entry point
│   ├── database/
│   │   ├── db.js          # Database connection & helpers
│   │   ├── init.js        # Schema initialization
│   │   └── seed.js        # Seed data
│   ├── models/
│   │   ├── Article.js     # Article model
│   │   ├── Category.js    # Category model
│   │   ├── Source.js      # Source model
│   │   └── Tag.js         # Tag model
│   ├── routes/
│   │   ├── articles.js    # Article routes
│   │   ├── categories.js  # Category routes
│   │   ├── tags.js        # Tag routes
│   │   ├── sources.js     # Source routes
│   │   └── scrape.js      # Scraper routes
│   └── services/
│       └── scraper.js     # RSS scraper service
├── database/              # SQLite database files
├── public/                # Static files (CSS, JS)
├── views/                 # EJS templates (Phase 3)
├── .env                   # Environment variables
├── .env.example           # Example environment file
├── package.json
└── SPECIFICATION.md
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
PORT=3000
DATABASE_PATH=./database/news.db
ANTHROPIC_API_KEY=your_api_key_here  # For Phase 2
SCRAPE_INTERVAL_HOURS=6
NODE_ENV=development
```

## Development Phases

- [x] **Phase 1**: Core infrastructure (database, API, scraper)
- [ ] **Phase 2**: AI integration (relevance filtering, summarization)
- [ ] **Phase 3**: Frontend (newspaper-style UI)
- [ ] **Phase 4**: Polish & deployment

## License

MIT
