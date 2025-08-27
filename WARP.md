# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Webtrotion** is an Astro-based static site generator that uses Notion as a headless CMS. It's designed to create both websites and blogs from Notion databases with extensive caching, optimization features, and GitHub Pages deployment.

Key Technologies:

- **Astro v5** - Static site framework
- **Notion API** - Content management
- **Tailwind CSS v4** - Styling (no separate config file, CSS-native)
- **TypeScript** - Type safety
- **Node.js 21** - Runtime environment

## Common Development Commands

### Development

```bash
# Clean development start (removes caches)
npm run dev

# Standard development
npm start
# or
astro dev
```

### Building

```bash
# Production build (GitHub Actions)
npm run build

# Local build with cache cleanup
npm run build-local

# Build with existing cache
npm run build:cached
```

### Code Quality

```bash
# Format code with Prettier
npm run format

# Type checking
npm run check
# or
astro check

# Run ESLint
npx eslint .
```

### Testing Individual Features

```bash
# Test single page build
astro build --config ./astro.config.ts

# Preview built site
npm run preview
# or
astro preview

# Test specific Astro pages
astro dev --port 4321
```

## Architecture Overview

### Content Flow

1. **Notion Database** → Notion API → **Client Layer** (`src/lib/notion/client.ts`)
2. **Integrations** (`src/integrations/`) → **Build-time Processing** → **Static Output**
3. **Caching System** (`tmp/` directories) → **Performance Optimization**

### Key Architectural Components

#### 1. Notion Integration Layer

- `src/lib/notion/client.ts` - Core Notion API client with caching
- `src/lib/notion/responses.ts` - Type definitions for Notion responses
- `src/lib/interfaces.ts` - Internal data structures
- `src/constants.ts` - Configuration management from `constants-config.json`

#### 2. Custom Astro Integrations

The project uses several custom Astro integrations that run during build:

- **`entry-cache-er`** - Caches Notion entries and processes references between pages
- **`block-html-cache-er`** - Pre-renders Notion blocks to HTML for performance
- **`public-notion-copier`** - Downloads and optimizes Notion assets
- **`custom-icon-downloader`** - Handles favicon generation from Notion icons
- **`theme-constants-to-css`** - Converts theme config to CSS variables
- **`rss-content-enhancer`** - Generates RSS feeds with full content

#### 3. Multi-layered Caching Strategy

```
buildcache/          - Persistent build cache (Notion API responses)
tmp/blocks-json-cache/    - Processed block data
tmp/blocks-html-cache/    - Pre-rendered HTML
tmp/og-images/            - Generated open graph images
tmp/rss-cache/            - RSS feed cache
public/notion/            - Downloaded Notion assets
```

#### 4. Content Processing Pipeline

1. **Fetch** - Get content from Notion API with retry logic
2. **Transform** - Convert Notion blocks to internal format
3. **Cache** - Store processed data for subsequent builds
4. **Render** - Generate Astro components from cached data
5. **Optimize** - Image optimization, asset copying, SEO generation

### Component Architecture

#### Page Types

- **Static Pages** - From Notion pages in "main" collection
- **Blog Posts** - Individual post pages with comments, TOC, references
- **Collection Pages** - Grouped content (e.g., by tag, category)
- **Pagination** - Automatic pagination for large collections

#### Notable Components

- `NotionBlocks.astro` - Universal Notion block renderer
- `src/components/notion-blocks/` - Individual block type components
- `TOC.astro` - Floating table of contents
- `PostComments.astro` - Giscus and Bluesky comment integration
- `Search.astro` - Pagefind-powered search

#### Reference System

Advanced cross-linking system that tracks:

- Links between pages
- External references
- Media usage
- Auto-generated "backlinks" and "related content"

## Configuration Management

### Primary Configuration

- `constants-config.json` - Main configuration file (theme, integrations, features)
- `src/site.config.ts` - Site metadata and Astro configuration
- `astro.config.ts` - Astro and build configuration

### Environment Variables

Required for development:

```bash
NOTION_API_SECRET=<your_notion_integration_token>
DATABASE_ID=<your_notion_database_id>  # Can also be set in constants-config.json
```

### Key Configuration Areas

- **Theme customization** - Colors, fonts via `constants-config.json`
- **Notion integration** - Database ID, API settings
- **Social features** - Giscus comments, Bluesky integration, webmentions
- **Performance** - Caching versions, optimization settings
- **Deployment** - Custom domain, base path, redirects

## Development Workflow

### Setting Up New Features

1. **Notion-related changes** - Modify `src/lib/notion/client.ts` or interfaces
2. **New block types** - Add to `src/components/notion-blocks/`
3. **Theme changes** - Update `constants-config.json` theme section
4. **Build integrations** - Add to `src/integrations/` and register in `astro.config.ts`

### Cache Management

```bash
# Clear all caches (dev)
npm run predev

# Clear specific cache versions
# Edit package.json cacheVersion object to invalidate specific cache layers
```

### Performance Considerations

- The project heavily uses build-time caching for Notion API calls
- Image optimization is configurable via `optimize-images` setting
- GitHub Actions includes sophisticated cache management
- Build times are optimized through incremental caching strategies

### Deployment

- **GitHub Pages** - Primary deployment target with automated workflows
- **Vercel/Netlify** - Supported via environment detection
- **Custom domains** - Configure via `CUSTOM_DOMAIN` env var or config

## Notion Database Requirements

The Notion database should have these properties:

- **Published** (Checkbox) - Controls visibility
- **Publish Date** (Formula/Date) - Publishing schedule
- **Slug** (Formula/Text) - URL generation
- **Collection** (Select) - Content categorization
- **Tags** (Multi-select) - Tagging system
- **Featured Image** - Hero images
- **Pinned** (Checkbox) - Highlight important content

## Troubleshooting Development

### Common Issues

- **API Rate Limits** - Notion API has rate limits; the client includes retry logic
- **Cache Corruption** - Delete `tmp/` and `buildcache/` directories
- **Missing Assets** - Check `public/notion/` directory and asset download logs
- **Build Failures** - Often related to Notion API connectivity or malformed content

### Performance Debugging

- Check cache hit rates in build logs
- Monitor build times vs cache versions in `package.json`
- Use `npm run build-local` to test without GitHub Actions optimizations

### Content Issues

- Verify Notion database schema matches expected properties
- Check Published status and Publish Date filters
- Ensure Slug formulas generate valid URLs
- Validate block content doesn't contain unsupported elements
