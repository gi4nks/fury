# Fury

Fury is a lightweight bookmark organizer that imports Chrome-exported HTML bookmarks, auto-categorizes them locally, and lets you search or browse by category without leaving the browser.

## Features

- 📥 **Import Chrome Bookmarks**: Parse and import HTML bookmark exports from Chrome
- 🤖 **AI-Powered Categorization**: Automatically categorize bookmarks using OpenAI
- 🔍 **Smart Search**: Search bookmarks by title, URL, description, or metadata
- 📊 **Analytics Dashboard**: Visualize bookmark categories and metadata coverage
- 🌐 **Metadata Enrichment**: Scrape Open Graph and meta tags from bookmark URLs
- 📱 **Responsive Design**: Modern UI built with Tailwind CSS and DaisyUI
- 🔒 **Privacy-First**: All data stored locally in SQLite database
- 📤 **Export Functionality**: Export bookmarks in multiple formats (Chrome, Firefox, Safari)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, DaisyUI
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI API for categorization and summarization
- **Build**: Turbopack, ESLint, TypeScript
- **Deployment**: Ready for Vercel, Netlify, or any Node.js hosting

## Project Structure

```
fury/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── bookmarks/      # Bookmarks page
│   │   ├── categories/     # Categories page
│   │   ├── import/         # Import page
│   │   └── metadata/       # Analytics page
│   ├── components/         # React components
│   │   ├── BookmarkList.tsx
│   │   ├── ExportButton.tsx
│   │   └── AnalyticsCharts.tsx
│   └── lib/                # Core utilities
│       ├── aiAnalyzer.ts   # AI categorization
│       ├── bookmarkParser.ts # HTML parsing
│       ├── categorization.ts # Category management
│       ├── db.ts           # Database client
│       └── metadataScraper.ts # Web scraping
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── scripts/                # Build scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Quick Setup

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd fury
   make setup
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start development**:
   ```bash
   make dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Manual Setup

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Development

### Available Make Targets

Run `make help` to see all available targets:

- `make setup` - Complete project setup
- `make dev` - Start development server
- `make build` - Build for production
- `make check` - Run linting and type checking
- `make db-studio` - Open Prisma Studio
- `make clean` - Clean build artifacts
- `make env-check` - Check environment variables

### Environment Variables

Create a `.env` file with:

```env
# Required for AI features
OPENAI_API_KEY=your_openai_api_key

# Optional: Chrome extension sync
FURY_CHROME_SYNC_TOKEN=your_sync_token
```

## Usage

### Import Bookmarks

1. In Chrome: `chrome://bookmarks/` → Export bookmarks
2. Save the HTML file
3. In Fury: Visit `/import` → Upload the file
4. Wait for AI categorization and metadata scraping

### Browse & Search

- **Bookmarks page**: Search and filter bookmarks
- **Categories page**: Browse by category
- **Analytics page**: View metadata coverage and trends

### Export Bookmarks

Use the export functionality to download bookmarks in various formats compatible with different browsers.

## API Reference

### Endpoints

- `GET/POST /api/bookmarks` - Bookmark CRUD operations
- `GET/POST /api/categories` - Category management
- `POST /api/import` - Import bookmarks from HTML
- `GET /api/export` - Export bookmarks in various formats
- `POST /api/init-db` - Initialize database

### Data Models

```typescript
interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  categoryId?: string;
  // Enhanced metadata
  metaTitle?: string;
  ogImage?: string;
  keywords?: string;
  summary?: string;
  aiCategory?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
```

## Development Guidelines

See [`.copilot-instructions.md`](.copilot-instructions.md) for detailed coding standards, architecture patterns, and development best practices.

## CI/CD

This project uses GitHub Actions for continuous integration:

- **Triggers**: Push and pull requests to `main` and `develop` branches
- **Node.js versions**: Tests against Node.js 20.x and 22.x
- **Checks**: ESLint, TypeScript type checking, and production build
- **Database**: Automated setup and migration testing

## Versioning

This project follows [Semantic Versioning](https://semver.org/) and uses Git tags for releases.

### Current Version
**v0.1.0** - Initial release

### Release Process

1. **Update version**: Use Makefile commands
   ```bash
   make version-patch  # 0.1.0 → 0.1.1
   make version-minor  # 0.1.0 → 0.2.0
   make version-major  # 0.1.0 → 1.0.0
   ```

2. **Create release**: Use the automated release command
   ```bash
   make release
   ```

3. **Publish**: Push commits and tags
   ```bash
   git push && git push --tags
   ```

### Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and changes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `make check` to ensure code quality
5. Submit a pull request

The CI pipeline will automatically validate your changes.

## License

MIT License - see LICENSE file for details.
