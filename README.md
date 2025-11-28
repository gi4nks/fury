# Fury

Fury is a lightweight bookmark organizer that imports Chrome-exported HTML bookmarks, auto-categorizes them locally, and lets you search or browse by category without leaving the browser.

## Features

- 📥 **Import Chrome Bookmarks**: Parse and import HTML bookmark exports from Chrome
- 🤖 **AI-Powered Categorization**: Automatically categorize bookmarks using Gemini AI or OpenAI with semantic text processing
- 🧠 **Custom Category Discovery**: AI analyzes your bookmarks and suggests personalized hierarchical categories (powered by Gemini 2.5 Flash)
- 🌳 **Hierarchical Categories**: Support for up to 4 levels of category depth with 6-10 intelligent root categories
- ✏️ **Interactive Category Editor**: Edit, add, delete, and reorganize categories with drag-and-drop hierarchy editor
- 🏷️ **Keyword Management**: AI-generated keywords for each category with manual editing support
- 🔍 **Smart Search**: Search bookmarks by title, URL, description, or metadata
- 📊 **Analytics Dashboard**: Visualize bookmark categories and metadata coverage
- 🌐 **Metadata Enrichment**: Scrape Open Graph and meta tags from bookmark URLs
- 📱 **Responsive Design**: Modern UI built with Tailwind CSS and DaisyUI
- 🔒 **Privacy-First**: All data stored locally in SQLite database
- 📤 **Export Functionality**: Export bookmarks in multiple formats (Chrome, Firefox, Safari)
- 📈 **Real-time Import Progress**: Live progress tracking with Server-Sent Events (SSE)
- ⚡ **AI Batch Assignment**: Fast batch categorization of bookmarks using AI
- 🧹 **Semantic Text Processing**: 714 stop words, bigram extraction, and keyword analysis
- 🔗 **Smart URL Validation**: Robust validation with HEAD/GET fallback and domain analysis
- 🚫 **Duplicate Prevention**: Automatic deduplication during import with URL normalization

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, DaisyUI
- **Database**: SQLite with Prisma ORM
- **AI**: Google Gemini 2.5 Flash (primary), OpenAI API (fallback) for categorization and discovery
- **Build**: Turbopack, ESLint, TypeScript
- **Deployment**: Ready for Vercel, Netlify, or any Node.js hosting

## Project Structure

```
fury/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── bookmarks/  # Bookmark CRUD
│   │   │   ├── categories/ # Category management (incl. bulk, merge)
│   │   │   ├── import/     # Import endpoints (standard, stream, analyze)
│   │   │   └── export/     # Export functionality
│   │   ├── bookmarks/      # Bookmarks page
│   │   ├── categories/     # Categories page
│   │   ├── import/         # Import page with category discovery
│   │   └── metadata/       # Analytics page
│   ├── components/         # React components
│   │   ├── BookmarkList.tsx
│   │   ├── ExportButton.tsx
│   │   ├── AnalyticsCharts.tsx
│   │   ├── CategoryModeSelector.tsx  # Default vs Custom mode selection
│   │   ├── DiscoveryProgress.tsx     # AI discovery progress indicator
│   │   ├── HierarchyEditor.tsx       # Interactive category tree editor
│   │   └── KeywordEditor.tsx         # Category keyword management
│   └── lib/                # Core utilities
│       ├── aiAnalyzer.ts   # AI categorization
│       ├── bookmarkParser.ts # HTML parsing
│       ├── categorization.ts # Category management with exclusion patterns
│       ├── categoryDiscovery.ts # AI-powered category discovery
│       ├── geminiClient.ts # Gemini AI API wrapper
│       ├── hierarchyBuilder.ts # Category hierarchy utilities
│       ├── keywordGenerator.ts # TF-IDF keyword extraction
│       ├── db.ts           # Database client
│       ├── metadataScraper.ts # Web scraping with robust URL validation
│       └── textProcessor.ts # Semantic text processing (714 stop words)
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── scripts/                # Test scripts for categorization
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
# Primary AI (Gemini) - Required for custom category discovery
GEMINI_API_KEY=your_gemini_api_key

# Fallback AI (OpenAI) - Optional
OPENAI_API_KEY=your_openai_api_key

# Database (auto-configured for SQLite)
DATABASE_URL="file:./dev.db"
```

## Usage

### Import Bookmarks

1. In Chrome: `chrome://bookmarks/` → Export bookmarks
2. Save the HTML file
3. In Fury: Visit `/import` → Upload the file
4. Choose category mode:
   - **Default Categories**: Use 23 predefined categories for fast import
   - **Custom Discovery**: Let AI analyze your bookmarks and suggest personalized categories
5. If using Custom Discovery:
   - AI analyzes bookmark titles, URLs, and folder structure
   - Review and edit the suggested category hierarchy
   - Customize keywords for each category
   - Apply changes and import
6. Watch real-time progress with live counters for:
   - AI category assignment progress
   - Total bookmarks detected
   - New bookmarks added
   - Updated existing bookmarks
   - Skipped duplicates
7. AI batch assignment runs automatically for fast categorization

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
- `POST /api/categories/bulk` - Bulk create/update categories with hierarchy
- `POST /api/categories/merge` - Merge two categories together
- `POST /api/import` - Import bookmarks from HTML (standard)
- `POST /api/import/stream` - Import with real-time progress via SSE and custom categories
- `POST /api/import/analyze` - Analyze bookmarks and discover category hierarchy
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

### CI Workflows

- **CI** (`.github/workflows/ci.yml`): Runs on all pushes and PRs to `main`/`develop`
- **Main Branch CI** (`.github/workflows/main-ci.yml`): Additional production checks on pushes to `main`
  - Security audit with `npm audit`
  - Bundle size analysis
  - Production environment validation
- **Release** (`.github/workflows/release.yml`): Automated releases on version tags

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
