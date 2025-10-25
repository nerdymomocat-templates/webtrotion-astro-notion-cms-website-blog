# Migration from JSON to JSON5 for constants-config

## Overview
Migrate `constants-config.json` to JSON5 format to enable inline comments for better documentation, making it easier for users who fork the repository to understand what each configuration option does.

**⚠️ BREAKING CHANGE:** This will be released as a new version. Users must rename their `constants-config.json` to `constants-config.json5` when upgrading.

## Package Selection
**Recommended package: `json5` (https://www.npmjs.com/package/json5)**
- Official JSON5 parser
- Most popular (20M+ downloads/week)
- Zero dependencies
- Simple API: `JSON5.parse()`
- Lightweight (~15KB)
- Well-maintained and stable

## Changes Required

### 1. Install json5 package
```bash
npm install json5
```

### 2. Rename config file
- Rename: `constants-config.json` → `constants-config.json5`
- Add a single comment line at the top promoting the benefits of JSON5 comments

### 3. Update imports in source files
Three files need to be updated to use JSON5 parser instead of direct JSON import:

**File: `src/constants.ts:1`**
- Change from: `import config from "../constants-config.json"`
- To: Read file with fs and parse with JSON5.parse()

**File: `src/integrations/theme-constants-to-css.ts:3`**
- Change from: `import config from "../../constants-config.json"`
- To: Read file with fs and parse with JSON5.parse()

**File: `astro.config.ts:37`**
- Change from: `import config from "./constants-config.json"`
- To: Read file with fs and parse with JSON5.parse()

### 4. Update GitHub workflows
Update workflow files to reference the new `.json5` filename:

**Files:**
- `.github/workflows/astro.yml` (lines 86-91, 93-99, 198-203, 236-241)
  - Change all references from `constants-config.json` to `constants-config.json5`
- `.github/workflows/astro_no_cache.yml` (if present)
- `.github/workflows/recover-cache.yml` (if present)

### 5. Update package.json version
- Bump version to indicate breaking change (follow semver)

### 6. Update .gitignore (if needed)
Ensure the new `.json5` file is NOT ignored and will be committed

## Benefits
- Users can add inline comments directly in the config file
- Reduces need to reference external documentation
- Makes forking and customization easier
- Cleaner approach - one file format moving forward

---

# Phase 2: Update All References to Reorganized Structure

## Overview
The constants-config.json5 file has been reorganized with nested structures. All code that references these values needs to be updated to use the new paths.

## Key Changes Mapping

### Old → New Structure:
1. `database-id` → `notion.database-id`
2. `data-source-id` → `notion.data-source-id`
3. `author` → `site-info.author`
4. `custom-domain` → `site-info.custom-domain`
5. `base-path` → `site-info.base-path`
6. `redirects` → `redirects` (moved to top-level)
7. `giscus` → `comments.giscus`
8. `bluesky-comments` → `comments.bluesky-comments`
9. `webmention` → `comments.webmention`
10. `google-search-console-html-tag` → `tracking.google-search-console-html-tag`
11. `recent-posts-on-home-page` → `collections-and-listings.recent-posts-on-home-page`
12. `number-of-posts-per-page` → `collections-and-listings.number-of-posts-per-page`
13. `menu-pages-collection` → `collections-and-listings.menu-pages-collection`
14. `full-preview-collections` → `collections-and-listings.full-preview-collections`
15. `hide-underscore-slugs-in-lists` → `collections-and-listings.hide-underscore-slugs-in-lists`
16. `home-page-slug` → `collections-and-listings.home-page-slug`
17. `enable-lightbox` → `block-rendering.enable-lightbox`
18. `full-width-social-embeds` → `block-rendering.full-width-social-embeds`
19. `heading-blocks` → `block-rendering.heading-blocks`
20. `optimize-images` → `block-rendering.optimize-images`

### Unchanged (still at root level):
- `tracking`
- `socials`
- `theme`
- `references`
- `shortcodes`
- `footnotes`
- `og-setup`
- `redirects` (moved from website.redirects to root level)

## Files to Update

### 1. **src/constants.ts** (PRIMARY FILE - 20+ references)
Update all `key_value_from_json["..."]` references to use new nested paths:

**Lines to change:**
- Line 36: `key_value_from_json["database-id"]` → `key_value_from_json?.notion?.["database-id"]`
- Line 38: `key_value_from_json["data-source-id"]` → `key_value_from_json?.notion?.["data-source-id"]`
- Line 39: `key_value_from_json["author"]` → `key_value_from_json?.["site-info"]?.author`
- Line 44: `key_value_from_json["webmention"]["webmention-api-key"]` → `key_value_from_json?.comments?.webmention?.["webmention-api-key"]`
- Line 46: `key_value_from_json["webmention"]["webmention-link"]` → `key_value_from_json?.comments?.webmention?.["webmention-link"]`
- Line 49: `key_value_from_json["custom-domain"]` → `key_value_from_json?.["site-info"]?.["custom-domain"]`
- Line 51: `key_value_from_json["base-path"]` → `key_value_from_json?.["site-info"]?.["base-path"]`
- Line 53: `key_value_from_json["number-of-posts-per-page"]` → `key_value_from_json?.["collections-and-listings"]?.["number-of-posts-per-page"]`
- Line 55: `key_value_from_json["enable-lightbox"]` → `key_value_from_json?.["block-rendering"]?.["enable-lightbox"]`
- Line 60: `key_value_from_json["menu-pages-collection"]` → `key_value_from_json?.["collections-and-listings"]?.["menu-pages-collection"]`
- Line 62: `key_value_from_json["heading-blocks"]` → `key_value_from_json?.["block-rendering"]?.["heading-blocks"]`
- Line 68: `key_value_from_json["full-preview-collections"]` → `key_value_from_json?.["collections-and-listings"]?.["full-preview-collections"]`
- Line 71: `key_value_from_json["hide-underscore-slugs-in-lists"]` → `key_value_from_json?.["collections-and-listings"]?.["hide-underscore-slugs-in-lists"]`
- Line 73: `key_value_from_json["home-page-slug"]` → `key_value_from_json?.["collections-and-listings"]?.["home-page-slug"]`
- Line 95: `key_value_from_json["optimize-images"]` → `key_value_from_json?.["block-rendering"]?.["optimize-images"]`
- Line 122: `key_value_from_json["recent-posts-on-home-page"]` → `key_value_from_json?.["collections-and-listings"]?.["recent-posts-on-home-page"]`
- Line 126: `key_value_from_json["giscus"]` → `key_value_from_json?.comments?.giscus`
- Line 128: `key_value_from_json["bluesky-comments"]` → `key_value_from_json?.comments?.["bluesky-comments"]`
- Line 133: `key_value_from_json["google-search-console-html-tag"]` → `key_value_from_json?.tracking?.["google-search-console-html-tag"]`
- Line 135: `key_value_from_json["full-width-social-embeds"]` → `key_value_from_json?.["block-rendering"]?.["full-width-social-embeds"]`

### 2. **astro.config.ts**
- Line 77: `key_value_from_json["redirects"]` → `key_value_from_json?.redirects` (now at root level)

### 3. **src/integrations/theme-constants-to-css.ts**
- Verify `key_value_from_json["theme"]` reference (should still work as theme is at root level)

### 4. **All 46 files that import from constants.ts**
- Review to ensure exported constants are used correctly
- No changes likely needed if they only import from constants.ts (constants.ts handles the mapping)

## Implementation Steps

1. Update `src/constants.ts` with all new nested paths (add optional chaining for safety)
2. Update `astro.config.ts` redirects reference
3. Verify `src/integrations/theme-constants-to-css.ts` (likely no changes needed)
4. Test build to catch any missed references
5. Review any files that directly read constants-config.json5 (instead of importing from constants.ts)
6. Update this documentation with completion status
