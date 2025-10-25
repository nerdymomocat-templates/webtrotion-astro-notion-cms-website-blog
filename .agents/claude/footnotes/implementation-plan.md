# Footnotes Implementation Plan for Webtrotion

**Document Version**: 2.0
**Date**: 2025-10-24
**Complexity**: High
**Estimated Files**: 3 new, 4 modified (simplified structure)

---

## ⚠️ IMPORTANT: Development Environment Constraint

**NO INTERNET ACCESS**: This implementation is being developed in an environment WITHOUT internet access. This means:
- ❌ Cannot run `npm run build-local` or any build/test commands directly
- ❌ Cannot verify changes by executing code
- ❌ Cannot see runtime errors or console output
- ✅ User must run commands and provide output
- ✅ All testing and verification must be done by the user
- ✅ All error debugging requires user to provide error messages

**Impact on Development**:
- All code changes are theoretical until user runs build
- Errors discovered only when user provides build output
- Iterative debugging requires user feedback loop
- Cannot proactively test changes

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Understanding: RichText Omnipresence](#critical-understanding-richtext-omnipresence)
3. [Architecture](#architecture)
4. [Phase 1: Foundation & Type Definitions](#phase-1-foundation--type-definitions)
5. [Phase 2: Configuration & Validation](#phase-2-configuration--validation)
6. [Phase 3: Core Footnote Processing](#phase-3-core-footnote-processing)
7. [Phase 4: Integration with Notion Client](#phase-4-integration-with-notion-client)
8. [Phase 5: Component Development](#phase-5-component-development)
9. [Phase 6: Client-Side Interactions](#phase-6-client-side-interactions)
10. [Phase 7: Styling](#phase-7-styling)
11. [Phase 8: Page-Level Integration](#phase-8-page-level-integration)
12. [Phase 9: Configuration & Constants](#phase-9-configuration--constants)
13. [Phase 10: Testing & Edge Cases](#phase-10-testing--edge-cases)
14. [Phase 11: Build Process Integration](#phase-11-build-process-integration)
15. [Implementation Order](#implementation-order)
16. [Files Summary](#files-summary)
17. [Risk Assessment](#risk-assessment)

---

## Overview

This plan outlines the implementation of a comprehensive footnotes system for Webtrotion that supports:

- **Three source types**: end-of-block, start-of-child-blocks, block-comments
- **Two display modes**: always-popup, small-popup-large-margin
- **Universal marker detection**: Footnotes can appear in ANY RichText array (content, captions, table cells, etc.)
- **Global configuration**: Site-wide settings for automatic in-page footnotes (distinct from the legacy manual "_all-footnotes" page)
- **Optional footnotes section**: Collated footnotes at end of page

### Key Requirements

From `.agents/footnotes_implementation_desired.md`:

1. Footnote markers follow pattern `[^marker-prefix*]` (e.g., `[^ft_a]`)
2. Footnote content format: `[^marker]: content text here`
3. Support multiline and multi-block footnotes
4. Preserve rich text formatting throughout
5. Handle comments API with permission checking
6. Display as † symbol initially (sequential numbering can be added later)
7. No test sets required

### Important Naming Distinction

**Two Different Footnote Systems**:

1. **Legacy Manual System** (Already Works - KEEP IT WORKING!)
   - Config key: `"sitewide-footnotes-page-slug": "_all-footnotes"`
   - A special Notion page where users manually create "footnote-like" reference content
   - Users manually link to blocks on this page
   - `NBlocksPopover.astro` detects links to this page and shows popovers
   - **This is a workaround** - not real footnotes, just a dedicated page for reference content
   - ⚠️ **IMPORTANT**: This system must continue working alongside the new system
   - Users may have existing content relying on this feature

2. **New Automatic System** (This Implementation)
   - Config key: `"in-page-footnotes-settings": { ... }`
   - Real inline footnotes with markers like `[^ft_a]` embedded in content
   - Automatic extraction and rendering during build
   - Multiple source types (end-of-block, child-blocks, comments)
   - **This is the new feature** being implemented
   - Works independently from the legacy system

The name `"in-page-footnotes-settings"` clarifies that these are **in-page** (embedded in content) as opposed to the separate manual page approach.

**Both systems can coexist:**
- Legacy system: Manual links to `_all-footnotes` page → NBlocksPopover
- New system: Automatic `[^ft_a]` markers → FootnoteMarker component

---

---

## ⚠️ MAJOR UPDATE: Cache-Based Architecture (2025-10-25)

**IMPORTANT**: The implementation now uses a **cache-based architecture** instead of runtime collection. This change was made after the initial implementation to fix issues with `generate-footnotes-section` rendering and to align with the existing references caching pattern.

### Cache-Based vs Runtime Collection

**Original Plan (Obsolete)**:
- Footnotes collected at runtime during component rendering
- State stored in module-level variables in `blog-helpers.ts`
- FootnotesSection traverses blocks to collect footnotes
- Required invisible rendering for cached HTML pages

**Current Implementation (Cache-Based)**:
- Footnotes extracted during `getPostContentByPostId()` in `client.ts`
- Saved to JSON cache in `tmp/blocks-json-cache/footnotes-in-page/*.json`
- Loaded from cache in page components
- Passed to FootnotesSection as pre-collected array
- Works seamlessly with cached HTML

### Key Architectural Changes

1. **New Cache Path** (added to `src/constants.ts`):
   ```typescript
   footnotesInPage: path.join("./tmp", "blocks-json-cache", "footnotes-in-page")
   ```

2. **New Function** (`src/lib/footnotes.ts`):
   ```typescript
   export function extractFootnotesInPage(blocks: Block[]): Footnote[]
   ```
   - Recursively collects all footnotes from blocks
   - Assigns sequential indices (1, 2, 3...)
   - Removes duplicates, sorts by index
   - Returns ready-to-use footnotes array

3. **Updated Return Type** (`src/lib/notion/client.ts`):
   ```typescript
   export async function getPostContentByPostId(post: Post): Promise<{
     blocks: Block[];
     referencesInPage: ReferencesInPage[] | null;
     footnotesInPage: Footnote[] | null;  // NEW
   }>
   ```

4. **Page Components Load from Cache**:
   ```astro
   const { blocks, referencesInPage, footnotesInPage } = await getPostContentByPostId(post);

   {FOOTNOTES?.['in-page-footnotes-settings']?.['generate-footnotes-section'] && footnotesInPage && (
     <FootnotesSection footnotes={footnotesInPage} />
   )}
   ```

5. **FootnotesSection Simplified**:
   ```astro
   export interface Props {
     footnotes: Footnote[];  // Was: blocks: Block[]
   }
   // No traversal needed - just render the array
   ```

### Benefits

✅ Works with cached HTML (no invisible rendering hack needed)
✅ Consistent with references caching pattern
✅ No runtime state management needed
✅ Simpler component hierarchy
✅ Better performance (extract once, load from cache)
✅ Clearer separation of concerns

### Impact on This Plan

**Phases Still Relevant**:
- Phase 1-7: Foundation, types, extraction logic (unchanged)
- Phase 8: Page integration (UPDATED - see below)
- Phase 9-11: Configuration, testing, build (mostly unchanged)

**Phases Obsolete/Modified**:
- Any references to runtime collection in blog-helpers.ts
- Any mention of renderingContext prop threading
- Any discussion of invisible rendering for cached pages

**READ PHASE 8 CAREFULLY** - it now describes the cache-based approach.


## Critical Understanding: RichText Omnipresence

**IMPORTANT**: Footnote markers can appear in **ANY** location where RichText arrays exist. This is not just about paragraphs and headings.

### All RichText Locations in Notion Blocks

#### Block Content (Primary)
- `Paragraph.RichTexts`
- `Heading1.RichTexts`
- `Heading2.RichTexts`
- `Heading3.RichTexts`
- `BulletedListItem.RichTexts`
- `NumberedListItem.RichTexts`
- `ToDo.RichTexts`
- `Quote.RichTexts`
- `Callout.RichTexts`
- `Toggle.RichTexts`
- ~~`Code.RichTexts`~~ ❌ **EXCLUDED** - Code block content is special, footnotes should not be processed inside code
  - **However**, `Code.Caption` below IS processed ✅

#### Captions (Critical - Often Overlooked)
- `NImage.Caption` (array of RichText)
- `Video.Caption`
- `NAudio.Caption`
- `File.Caption`
- `Code.Caption` ✅ **INCLUDED** - Captions can have footnotes, even for code blocks
- `Embed.Caption`
- `Bookmark.Caption`
- `LinkPreview.Caption`

#### Tables (Multiple RichText Locations!)
- `Table.Rows[i].Cells[j].RichTexts` - **Every cell in every row**
  - Column header cells (`<th scope="col">`) when `HasColumnHeader = true` (first row)
  - Row header cells (`<th scope="row">`) when `HasRowHeader = true` (first cell of each row)
  - Regular data cells (`<td>`) - all other cells
  - **Important**: Tables can have hundreds of cells, each with footnote markers!

#### Comments (for block-comments source)
- Comment `rich_text` arrays from Notion Comments API

### Processing Strategy

We must create **helper functions** that can:

1. Extract all RichText arrays from any block type
2. Apply footnote marker detection to all locations
3. Split markers in all RichText arrays consistently
4. Preserve all annotation properties during splitting

This makes the implementation significantly more complex but also more robust.

---

## Architecture

### Simplified File Structure

**NO MODULE EXPLOSION**: Following existing codebase patterns:
- **One file** for all footnote logic: `src/lib/footnotes.ts`
- **One component**: `src/components/notion-blocks/FootnoteMarker.astro`
- **No CSS files**: All styling via Tailwind classes
- **Inline scripts**: Margin notes JavaScript goes in `Base.astro` (if needed)
- Types in existing `interfaces.ts`, config in existing `constants.ts`

### Core Principle: Build-Time Processing Only

**CRITICAL ARCHITECTURAL DECISION**: ALL footnote processing happens at BUILD-TIME in `client.ts`. Components have ZERO footnote logic - they only render pre-processed data.

```
┌─────────────────────────────────────────────────────────────┐
│                       BUILD-TIME                             │
│                    (client.ts only)                          │
├─────────────────────────────────────────────────────────────┤
│  Notion API → _buildBlock() → Footnote Processing           │
│                                                              │
│  Input: Raw Notion block with [^ft_a] markers in text       │
│  Output: Processed Block object with:                       │
│    - Footnotes[] array (ready to render)                    │
│    - RichTexts with markers split out                       │
│    - IsFootnoteMarker flags set                             │
│    - Children updated (if start-of-child-blocks)            │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    Cached as JSON
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              BUILD-TIME (Astro Component Rendering)          │
│                  (During `astro build`)                      │
├─────────────────────────────────────────────────────────────┤
│  Astro Components Render to Static HTML:                    │
│    - RichText.astro: if (IsFootnoteMarker) → FootnoteMarker │
│    - FootnoteMarker.astro: Render † with data attributes    │
│    - FootnotesSection.astro: Render collated footnotes      │
│    - Output: Static HTML with <template> elements           │
└─────────────────────────────────────────────────────────────┘
                           ↓
                Static HTML files in dist/
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                       RUN-TIME                               │
│                   (Browser Only - No Server)                 │
├─────────────────────────────────────────────────────────────┤
│  Browser JavaScript:                                         │
│    - Base.astro: Initialize existing popover system         │
│    - Find all [data-popover-target] elements                │
│    - Clone content from <template> elements                 │
│    - Use @floating-ui/dom for positioning                   │
│    - Show/hide popovers on click/hover                      │
│    - No processing, no parsing                              │
└─────────────────────────────────────────────────────────────┘
```

**Why This Matters**:
1. **Static Site Generation**: This is a pure SSG - no server exists at runtime
2. **Performance**: Processing once at build, not on every page load
3. **Build-Time Only**: Components render ONCE during `astro build` to static HTML
4. **Simplicity**: Components are pure presentational, no logic
5. **Reliability**: Processing errors caught during build, not in production
6. **Caching**: Processed blocks cached between builds in tmp/blocks-json-cache/
7. **Client-Side Only**: Runtime JavaScript only handles popover interactions via Base.astro

### Data Flow

```
Notion API Response
    ↓
client.ts: _buildBlock()  ← BUILD-TIME ONLY
    ↓
extractFootnotesFromBlock()
    ↓
├─ getAllRichTextLocations() → Extract from all block properties
├─ findAllFootnoteMarkers() → Detect [^marker] patterns
├─ extractFootnoteContent() → Get content based on source type
│   ├─ end-of-block: Parse after \n\n[^marker]:
│   ├─ start-of-child-blocks: Take first N children
│   └─ block-comments: Fetch from Comments API
└─ splitRichTextWithMarkers() → Create separate RichText for markers
    ↓
Block Object (fully processed):
{
  Id: "...",
  Type: "paragraph",
  Paragraph: {
    RichTexts: [
      { Text: { Content: "Some text " } },
      { Text: { Content: "[^ft_a]" }, IsFootnoteMarker: true, FootnoteRef: "ft_a" },
      { Text: { Content: " more text" } }
    ]
  },
  Footnotes: [
    { Marker: "ft_a", Content: { Type: "rich_text", RichTexts: [...] } }
  ]
}
    ↓
Cached to disk (tmp/blocks-json-cache/)
    ↓
Astro Components Render  ← BUILD-TIME (during `astro build`)
    ↓
├─ RichText.astro
│   if (richText.IsFootnoteMarker) → FootnoteMarker
│   else → Normal rendering
│
├─ FootnoteMarker.astro
│   <span data-popover-target="...">†</span>
│   <template><!-- Footnote content --></template>
│
└─ FootnotesSection.astro (optional)
    Collect all footnotes from blocks
    ↓
Static HTML files output to dist/
    ↓
Browser JavaScript  ← RUN-TIME (browser only, no server)
    ↓
Base.astro popover initialization script
(same pattern as NBlocksPopover.astro)

### Module Structure

```
src/lib/footnotes/
├── config.ts          - Configuration validation and normalization
├── permissions.ts     - Comments API permission checking
├── extractor.ts       - Main extraction logic
├── markers.ts         - Marker detection and RichText splitting
├── richtext-utils.ts  - Helper functions for RichText operations
└── types.ts           - Additional type definitions (optional)
```

---

## Edge Cases & Behavior

### Handled Cases (Silent Skip)

The implementation silently skips these edge cases without warnings:

1. **Empty Footnote Content**
   ```
   text [^ft_a]

   [^ft_a]:
   [^ft_b]: has content
   ```
   - `ft_a` is skipped (no content after colon)
   - Marker `[^ft_a]` in text is rendered as plain text (no popover)

2. **Orphaned Definition (No Marker)**
   ```
   text without markers

   [^ft_x]: This has content but no marker
   ```
   - Definition is removed from content but not added to footnotes
   - No footnote created

3. **Marker Without Content**
   ```
   text [^ft_a] more text

   [^ft_b]: only ft_b has content
   ```
   - `ft_a` marker is split out but has no corresponding footnote
   - FootnoteMarker component renders it as plain text or muted color
   - `ft_b` works normally

4. **Nested Footnote Markers**
   ```
   text [^ft_a]

   [^ft_a]: This mentions [^ft_b]
   [^ft_b]: Second footnote
   ```
   - `[^ft_b]` inside footnote content is NOT processed
   - Rendered as literal text with visual marker (†)
   - No recursive processing to avoid complexity/circular refs

### Unsupported Cases (Won't Be Detected)

These are rare edge cases that won't be detected by the regex:

1. **Marker Split Across RichText Elements**
   ```typescript
   [
     { PlainText: "text [^ft_" },
     { PlainText: "a] more" }
   ]
   ```
   - Requires user to apply formatting in the middle of a marker
   - Very unlikely to happen in practice
   - Regex won't match, marker not detected

### Performance Optimizations

- **Cached fullText**: Avoid repeated `joinPlainText()` calls
- **Early return**: Skip processing if no markers found
- **Comments API**: Only called if markers exist in block (95% reduction)

---

## Before/After Processing Examples

This section shows exactly what happens during the build-time processing in `client.ts: _buildBlock()` for each source type.

### Example 1: End-of-Block Source

**Configuration**:
```json
{
  "source": {
    "end-of-block": true
  },
  "marker-prefix": "ft_"
}
```

#### BEFORE (Raw Notion API Response)

```json
{
  "object": "block",
  "id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7",
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      {
        "type": "text",
        "text": { "content": "edited", "link": null },
        "annotations": { "bold": true, "italic": false, "code": false, "color": "default" },
        "plain_text": "edited"
      },
      {
        "type": "text",
        "text": { "content": " it [^ft_a] [^ft_b]. Some other content.\n\n[^ft_a]: This is a footnote\n\n[^ft_b]: Another footnote", "link": null },
        "annotations": { "bold": false, "italic": false, "code": false, "color": "default" },
        "plain_text": " it [^ft_a] [^ft_b]. Some other content.\n\n[^ft_a]: This is a footnote\n\n[^ft_b]: Another footnote"
      }
    ],
    "color": "default"
  }
}
```

#### AFTER (Processed Block Object)

```typescript
{
  Id: "1a8817d0-5c92-8027-91a5-f17fd0df45f7",
  Type: "paragraph",
  HasChildren: false,
  LastUpdatedTimeStamp: new Date("2025-09-12T05:51:00.000Z"),

  Paragraph: {
    RichTexts: [
      // SPLIT: First part (bold annotation preserved)
      {
        Text: { Content: "edited" },
        Annotation: { Bold: true, Italic: false, Code: false, Color: "default" },
        PlainText: "edited"
      },
      // SPLIT: Text before first marker
      {
        Text: { Content: " it " },
        Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
        PlainText: " it "
      },
      // SPLIT: First marker isolated
      {
        Text: { Content: "[^ft_a]" },
        Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
        PlainText: "[^ft_a]",
        IsFootnoteMarker: true,  // ← FLAG SET
        FootnoteRef: "ft_a"      // ← REFERENCE ADDED
      },
      // SPLIT: Text between markers
      {
        Text: { Content: " " },
        Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
        PlainText: " "
      },
      // SPLIT: Second marker isolated
      {
        Text: { Content: "[^ft_b]" },
        Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
        PlainText: "[^ft_b]",
        IsFootnoteMarker: true,  // ← FLAG SET
        FootnoteRef: "ft_b"      // ← REFERENCE ADDED
      },
      // SPLIT: Remaining text (footnote definitions removed)
      {
        Text: { Content: ". Some other content." },
        Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
        PlainText: ". Some other content."
      }
    ],
    Color: "default"
  },

  // NEW: Footnotes array added
  Footnotes: [
    {
      Marker: "ft_a",
      FullMarker: "[^ft_a]",
      Content: {
        Type: "rich_text",
        RichTexts: [
          {
            Text: { Content: "This is a footnote" },
            Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
            PlainText: "This is a footnote"
          }
        ]
      },
      SourceLocation: "content"
    },
    {
      Marker: "ft_b",
      FullMarker: "[^ft_b]",
      Content: {
        Type: "rich_text",
        RichTexts: [
          {
            Text: { Content: "Another footnote" },
            Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
            PlainText: "Another footnote"
          }
        ]
      },
      SourceLocation: "content"
    }
  ]
}
```

**Key Changes**:
1. ✅ Original RichText array with 2 elements → 6 elements (markers split out)
2. ✅ Footnote definitions (`\n\n[^ft_a]: ...`) removed from text
3. ✅ `IsFootnoteMarker: true` flag added to marker RichTexts
4. ✅ `FootnoteRef` property links marker to content
5. ✅ `Footnotes[]` array populated with extracted content
6. ✅ All annotations (bold, colors) preserved during splitting

---

### Example 2: Start-of-Child-Blocks Source

**Configuration**:
```json
{
  "source": {
    "start-of-child-blocks": true
  },
  "marker-prefix": "ft_"
}
```

#### BEFORE (Raw Notion API Response)

**Parent Block**:
```json
{
  "object": "block",
  "id": "parent-block-id",
  "type": "paragraph",
  "has_children": true,
  "paragraph": {
    "rich_text": [
      {
        "type": "text",
        "text": { "content": "This paragraph has [^ft_a] and [^ft_b] markers.", "link": null },
        "plain_text": "This paragraph has [^ft_a] and [^ft_b] markers."
      }
    ]
  }
}
```

**Children Blocks** (fetched via `client.blocks.children.list`):
```json
{
  "results": [
    // FIRST CHILD - Footnote content for ft_a
    {
      "id": "child-1-id",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": { "content": "[^ft_a]: This is footnote A content", "link": null },
            "plain_text": "[^ft_a]: This is footnote A content"
          }
        ]
      }
    },
    // SECOND CHILD - Footnote content for ft_b (with sub-children)
    {
      "id": "child-2-id",
      "type": "paragraph",
      "has_children": true,
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": { "content": "[^ft_b]: Footnote B has an image below", "link": null },
            "plain_text": "[^ft_b]: Footnote B has an image below"
          }
        ]
      }
      // This block has children (e.g., an image block) - all become part of footnote
    },
    // THIRD CHILD - Regular content (not a footnote)
    {
      "id": "child-3-id",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": { "content": "This is regular child content", "link": null },
            "plain_text": "This is regular child content"
          }
        ]
      }
    }
  ]
}
```

#### AFTER (Processed Block Object)

```typescript
{
  Id: "parent-block-id",
  Type: "paragraph",
  HasChildren: true,  // Still has children (third child remains)

  Paragraph: {
    RichTexts: [
      // SPLIT: Text before first marker
      {
        Text: { Content: "This paragraph has " },
        PlainText: "This paragraph has "
      },
      // SPLIT: First marker
      {
        Text: { Content: "[^ft_a]" },
        PlainText: "[^ft_a]",
        IsFootnoteMarker: true,
        FootnoteRef: "ft_a"
      },
      // SPLIT: Text between markers
      {
        Text: { Content: " and " },
        PlainText: " and "
      },
      // SPLIT: Second marker
      {
        Text: { Content: "[^ft_b]" },
        PlainText: "[^ft_b]",
        IsFootnoteMarker: true,
        FootnoteRef: "ft_b"
      },
      // SPLIT: Remaining text
      {
        Text: { Content: " markers." },
        PlainText: " markers."
      }
    ],

    // MODIFIED: Children array now only has 1 element (third child)
    Children: [
      {
        Id: "child-3-id",
        Type: "paragraph",
        Paragraph: {
          RichTexts: [
            {
              Text: { Content: "This is regular child content" },
              PlainText: "This is regular child content"
            }
          ]
        }
      }
    ]
  },

  // NEW: Footnotes extracted from first 2 children
  Footnotes: [
    {
      Marker: "ft_a",
      FullMarker: "[^ft_a]",
      Content: {
        Type: "blocks",  // ← Note: Type is "blocks" not "rich_text"
        Blocks: [
          {
            Id: "child-1-id",
            Type: "paragraph",
            Paragraph: {
              // [^ft_a]: prefix REMOVED from RichTexts
              RichTexts: [
                {
                  Text: { Content: "This is footnote A content" },
                  PlainText: "This is footnote A content"
                }
              ]
            }
          }
        ]
      },
      SourceLocation: "content"
    },
    {
      Marker: "ft_b",
      FullMarker: "[^ft_b]",
      Content: {
        Type: "blocks",
        Blocks: [
          {
            Id: "child-2-id",
            Type: "paragraph",
            HasChildren: true,
            Paragraph: {
              // [^ft_b]: prefix REMOVED
              RichTexts: [
                {
                  Text: { Content: "Footnote B has an image below" },
                  PlainText: "Footnote B has an image below"
                }
              ],
              // All sub-children preserved as part of the footnote
              Children: [
                // Image block, code block, whatever was nested
              ]
            }
          }
        ]
      },
      SourceLocation: "content"
    }
  ]
}
```

**Key Changes**:
1. ✅ Parent RichText split to isolate markers
2. ✅ First 2 children REMOVED from `Paragraph.Children` array
3. ✅ First 2 children moved to `Footnotes[]` array as `Type: "blocks"`
4. ✅ Marker prefixes (`[^ft_a]: `) removed from footnote block text
5. ✅ **All nested children of footnote blocks preserved** - this is why `renderChildren={true}` is critical
6. ✅ Third child remains in `Children` array (not a footnote)

**Important**: When rendering `Type: "blocks"` footnotes, the entire block tree must be rendered including all nested children. This means images, code blocks, lists, and any other nested content within a footnote block will be displayed in the popover.

---

### Example 3: Block-Comments Source

**Configuration**:
```json
{
  "source": {
    "block-comments": true
  },
  "marker-prefix": "ft_"
}
```

#### BEFORE (Raw Notion API Response)

**Block**:
```json
{
  "object": "block",
  "id": "block-with-comments",
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      {
        "type": "text",
        "text": { "content": "Text with [^ft_c] marker.", "link": null },
        "plain_text": "Text with [^ft_c] marker."
      }
    ]
  }
}
```

**Comments** (from `client.comments.list({ block_id: "block-with-comments" })`):
```json
{
  "results": [
    // NON-FOOTNOTE COMMENT (ignored)
    {
      "id": "comment-1",
      "rich_text": [
        {
          "type": "text",
          "text": { "content": "This is just a regular comment", "link": null },
          "plain_text": "This is just a regular comment"
        }
      ]
    },
    // FOOTNOTE COMMENT (starts with [^marker]:)
    {
      "id": "comment-2",
      "rich_text": [
        {
          "type": "text",
          "text": { "content": "[^ft_c]: Comment-based footnote with ", "link": null },
          "annotations": { "bold": false, "italic": false, "code": false },
          "plain_text": "[^ft_c]: Comment-based footnote with "
        },
        {
          "type": "text",
          "text": { "content": "formatting", "link": null },
          "annotations": { "bold": true, "italic": true, "code": false },
          "plain_text": "formatting"
        }
      ],
      "attachments": [
        {
          "category": "image",
          "file": {
            "url": "https://example.com/image.jpg",
            "expiry_time": "2025-09-12T07:33:44.578Z"
          }
        }
      ]
    }
  ]
}
```

#### AFTER (Processed Block Object)

```typescript
{
  Id: "block-with-comments",
  Type: "paragraph",
  HasChildren: false,

  Paragraph: {
    RichTexts: [
      // SPLIT: Text before marker
      {
        Text: { Content: "Text with " },
        PlainText: "Text with "
      },
      // SPLIT: Marker
      {
        Text: { Content: "[^ft_c]" },
        PlainText: "[^ft_c]",
        IsFootnoteMarker: true,
        FootnoteRef: "ft_c"
      },
      // SPLIT: Text after marker
      {
        Text: { Content: " marker." },
        PlainText: " marker."
      }
    ]
  },

  // NEW: Footnote extracted from comment
  Footnotes: [
    {
      Marker: "ft_c",
      FullMarker: "[^ft_c]",
      Content: {
        Type: "comment",  // ← Note: Type is "comment"
        RichTexts: [
          // [^ft_c]: prefix REMOVED
          {
            Text: { Content: "Comment-based footnote with " },
            Annotation: { Bold: false, Italic: false, Code: false, Color: "default" },
            PlainText: "Comment-based footnote with "
          },
          // Formatting preserved from comment
          {
            Text: { Content: "formatting" },
            Annotation: { Bold: true, Italic: true, Code: false, Color: "default" },
            PlainText: "formatting"
          }
        ],
        CommentAttachments: [
          {
            Category: "image",
            Url: "https://example.com/image.jpg",
            ExpiryTime: "2025-09-12T07:33:44.578Z"
          }
        ]
      },
      SourceLocation: "comment"
    }
  ]
}
```

**Key Changes**:
1. ✅ Block RichText split to isolate marker
2. ✅ Comments API called during build
3. ✅ Non-footnote comments (comment-1) ignored
4. ✅ Footnote comment (comment-2) extracted
5. ✅ Marker prefix (`[^ft_c]: `) removed from comment text
6. ✅ Comment rich text formatting (bold/italic) preserved
7. ✅ Comment attachments (images) stored in `CommentAttachments[]`
8. ✅ Comments never rendered in page (they're not in block structure anyway)

---

### Universal Pattern Across All Sources

Regardless of source type, the processing always produces:

```typescript
Block {
  // Original properties
  Id, Type, HasChildren, ...

  // Original content with THREE modifications:
  [BlockType]: {
    RichTexts: [...],  // ← SPLIT with IsFootnoteMarker flags
    Children: [...],   // ← REDUCED (if start-of-child-blocks)
  },

  // NEW property added:
  Footnotes: [
    {
      Marker: "...",
      FullMarker: "[^...]",
      Content: { Type, RichTexts/Blocks, CommentAttachments },
      SourceLocation: "content" | "caption" | "table" | "comment"
    }
  ]
}
```

**Components receive this fully processed structure** - no parsing, no extraction, just rendering.

---

## Phase 1: Foundation & Type Definitions

### 1.1 Update TypeScript Interfaces

**File**: `src/lib/interfaces.ts`

Add new interfaces at the end of the file:

```typescript
export interface Footnote {
  Marker: string;           // e.g., "ft_a" (without [^] wrapper)
  FullMarker: string;       // e.g., "[^ft_a]" (with wrapper for matching)
  Content: FootnoteContent;
  Index?: number;           // Sequential index for display (1, 2, 3...)
  SourceLocation: 'content' | 'caption' | 'table' | 'comment'; // Where it came from
}

export interface FootnoteContent {
  Type: 'rich_text' | 'blocks' | 'comment';
  RichTexts?: RichText[];   // For end-of-block and block-comments
  Blocks?: Block[];         // For start-of-child-blocks
  CommentAttachments?: CommentAttachment[]; // For images in comments
}

export interface CommentAttachment {
  Category: string;  // 'image'
  Url: string;
  ExpiryTime?: string;
}

export interface FootnoteMarkerInfo {
  Marker: string;           // e.g., "ft_a"
  FullMarker: string;       // e.g., "[^ft_a]"
  Location: {
    BlockProperty: string;  // e.g., 'Paragraph.RichTexts' or 'NImage.Caption'
    RichTextIndex: number;
    CharStart: number;
    CharEnd: number;
  };
}
```

Update Block interface to include footnote-related properties:

```typescript
export interface Block {
  Id: string;
  Type: BlockTypes;
  HasChildren: boolean;
  LastUpdatedTimeStamp: Date;

  // ... existing block type properties ...

  // NEW: Footnote support
  Footnotes?: Footnote[];              // All footnotes extracted from this block
  FootnoteMarkers?: FootnoteMarkerInfo[]; // Positions of markers found
}
```

Update RichText interface to include footnote marker flag:

```typescript
export interface RichText {
  Text?: Text;
  Annotation: Annotation;
  PlainText: string;
  Href?: string;
  Equation?: Equation;
  Mention?: Mention;
  InternalHref?: Reference;

  // NEW: Footnote marker support
  IsFootnoteMarker?: boolean;  // True if this RichText is a split-out marker
  FootnoteRef?: string;        // The marker string (e.g., "ft_a")
}
```

---

## Phase 2: Configuration & Validation

### ⚠️ IMPORTANT UPDATE (2025-10-25): No Normalization Approach

The original plan included config normalization (transforming kebab-case JSON to camelCase interface), but this was abandoned in favor of a simpler approach:

**Decision**: Match the TypeScript interface DIRECTLY to the JSON structure instead of normalizing.

**Reasoning**:
- Eliminates an entire class of bugs (structure mismatch)
- Removes unnecessary transformation code
- Simpler to understand and maintain
- Direct property access without translation layer

### 2.1 Configuration Interface

**File**: `src/lib/interfaces.ts` (added to existing file)

```typescript
export interface FootnotesConfig {
  "sitewide-footnotes-page-slug": string;
  "in-page-footnotes-settings": {
    enabled: boolean;
    source: {
      "end-of-block": boolean;
      "start-of-child-blocks": boolean;
      "block-comments": boolean;
      "block-inline-text-comments": boolean;
    };
    "marker-prefix": string;
    "generate-footnotes-section": boolean;
    "intext-display": {
      "always-popup": boolean;
      "small-popup-large-margin": boolean;
    };
  };
}
```

**Key Change**: Property names use kebab-case (e.g., `"in-page-footnotes-settings"`) to match the actual JSON structure in `constants-config.json`.

### 2.2 Global Adjusted Config

**File**: `src/lib/notion/client.ts`

The config is read from `constants-config.json`, checked for Comments API permissions, and adjusted if needed. The adjusted config is stored in a module-level variable:

```typescript
import { FOOTNOTES, IN_PAGE_FOOTNOTES_ENABLED } from "@/constants";

// Global adjusted config (set once during initialization)
export let adjustedFootnotesConfig: any = null;

// Comments API permission cache
let hasCommentsPermission: boolean | null = null;

/**
 * Initialize footnotes config once at build start
 * Checks Comments API permission and applies fallback if needed
 */
async function ensureFootnotesConfigInitialized(): Promise<void> {
  // If already initialized, return immediately
  if (adjustedFootnotesConfig !== null) {
    return;
  }

  // If footnotes not enabled, set to empty object
  if (!IN_PAGE_FOOTNOTES_ENABLED || !FOOTNOTES) {
    adjustedFootnotesConfig = {};
    return;
  }

  // Check if block-comments is configured
  const isBlockCommentsConfigured =
    FOOTNOTES?.["in-page-footnotes-settings"]?.source?.["block-comments"] === true;

  if (isBlockCommentsConfigured) {
    // Check permission once
    console.log('Footnotes: Checking Comments API permission...');

    try {
      await client.comments.list({ block_id: "00000000-0000-0000-0000-000000000000" });
      hasCommentsPermission = true;
      adjustedFootnotesConfig = FOOTNOTES;
      console.log('Footnotes: ✓ Permission confirmed - block-comments source available.');
    } catch (error: any) {
      if (error?.status === 403 || error?.code === 'restricted_resource') {
        hasCommentsPermission = false;
        console.log('Footnotes: ✗ Permission denied - falling back to end-of-block source.');

        // Create fallback config with end-of-block
        adjustedFootnotesConfig = {
          ...FOOTNOTES,
          "in-page-footnotes-settings": {
            ...FOOTNOTES["in-page-footnotes-settings"],
            source: {
              ...FOOTNOTES["in-page-footnotes-settings"].source,
              "block-comments": false,
              "end-of-block": true,
            }
          }
        };
      } else {
        hasCommentsPermission = true;
        adjustedFootnotesConfig = FOOTNOTES;
        console.log('Footnotes: ✓ Permission confirmed - block-comments source available.');
      }
    }
  } else {
    // No permission check needed
    adjustedFootnotesConfig = FOOTNOTES;
  }
}

// Call in getAllBlocksByBlockId before processing blocks
await ensureFootnotesConfigInitialized();
```

**Key Benefits**:
- Config checked and adjusted ONCE per build
- All code uses the same `adjustedFootnotesConfig` (single source of truth)
- Permission fallback automatically applied
- No repeated permission checks

### 2.3 Global `.enabled` Check

**Critical Performance Optimization**: The `.enabled` flag must be checked ONCE at the global level, not per-block.

**Anti-pattern (500+ checks per build)**:
```typescript
// WRONG: Inside extraction function
export async function extractFootnotesFromBlockAsync(...) {
  if (!config?.["in-page-footnotes-settings"]?.enabled) {
    return { footnotes: [], ... };
  }
  // extraction logic
}
```

**Best practice (1 check per build)**:
```typescript
// RIGHT: In client.ts before calling extraction
try {
  if (adjustedFootnotesConfig &&
      adjustedFootnotesConfig["in-page-footnotes-settings"]?.enabled) {
    const extractionResult = await extractFootnotesFromBlockAsync(
      block,
      adjustedFootnotesConfig,
      client
    );
    if (extractionResult.footnotes.length > 0) {
      block.Footnotes = extractionResult.footnotes;
    }
  }
} catch (error) {
  console.error(`Failed to extract footnotes from block ${block.Id}:`, error);
}
```

### 2.4 Consistent `.enabled` Guards

ALL footnote-related code must check `.enabled`:

| Location | What It Guards |
|----------|---------------|
| `client.ts` getAllBlocksByBlockId | Footnote extraction from blocks |
| `client.ts` getPostContentByPostId | Footnotes cache load/save/extraction |
| `posts/[slug].astro` | FootnotesSection rendering |
| `PostPreviewFull.astro` | FootnotesSection rendering |
| `BlogPost.astro` | TOC heading for footnotes |
| `Base.astro` | Margin notes script loading |

**Pattern**:
```astro
{adjustedFootnotesConfig?.['in-page-footnotes-settings']?.enabled && (
  {/* footnote-related code */}
)}
```

### 2.5 Utility Functions

**File**: `src/lib/footnotes.ts`

These helper functions work with the config structure directly:

```typescript
/**
 * Returns the active source type from config
 */
export function getActiveSource(config: any): string {
  const source = config?.["in-page-footnotes-settings"]?.source;
  if (!source) return "end-of-block";

  if (source["end-of-block"]) return "end-of-block";
  if (source["start-of-child-blocks"]) return "start-of-child-blocks";
  if (source["block-comments"]) return "block-comments";

  return "end-of-block"; // Default fallback
}

/**
 * Creates the marker pattern regex for detecting footnotes
 * Example: markerPrefix="ft_" creates pattern to match [^ft_a], [^ft_xyz], etc.
 */
export function createMarkerPattern(markerPrefix: string): RegExp {
  const escapedPrefix = markerPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Negative lookahead (?!:) ensures we don't match [^ft_a]: (content markers)
  // Only match [^ft_a] without a following colon (inline markers)
  return new RegExp(`\\[\\^${escapedPrefix}([a-zA-Z0-9_]+)\\](?!:)`, 'g');
}

/**
 * Creates the content pattern regex for extracting footnote definitions
 * Example: markerPrefix="ft_" creates pattern to match [^ft_a]: at start of content
 */
export function createContentPattern(markerPrefix: string): RegExp {
  const escapedPrefix = markerPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match [^prefix*]: at the start of content
  return new RegExp(`^\\[\\^${escapedPrefix}(\\w+)\\]:\\s*`, 'gm');
}
```

**Note**: The marker pattern includes negative lookahead `(?!:)` to prevent matching content markers like `[^ft_a]:` which appear in child blocks. Only inline markers like `[^ft_a]` (without colon) are matched.

---

---

## Phase 3: Core Footnote Processing

### 3.1 RichText Utilities Module

**New File**: `src/lib/footnotes/richtext-utils.ts`

This is a **critical** module that handles the complexity of extracting RichText from all possible locations.

```typescript
import type { Block, RichText } from "@/lib/interfaces";

/**
 * Represents a RichText array with its location in the block structure
 */
export interface RichTextLocation {
  property: string;      // e.g., 'Paragraph.RichTexts' or 'NImage.Caption'
  richTexts: RichText[];
  setter: (newRichTexts: RichText[]) => void; // Function to update the RichTexts
}

/**
 * Extracts ALL RichText arrays from a block, regardless of where they appear
 * This is the key function that enables universal footnote marker detection
 */
export function getAllRichTextLocations(block: Block): RichTextLocation[] {
  const locations: RichTextLocation[] = [];

  // Helper function to add a location
  const addLocation = (
    property: string,
    richTexts: RichText[] | undefined,
    setter: (newRichTexts: RichText[]) => void
  ) => {
    if (richTexts && richTexts.length > 0) {
      locations.push({ property, richTexts, setter });
    }
  };

  // Block content (primary)
  if (block.Paragraph) {
    addLocation(
      'Paragraph.RichTexts',
      block.Paragraph.RichTexts,
      (newRichTexts) => { block.Paragraph!.RichTexts = newRichTexts; }
    );
  }

  if (block.Heading1) {
    addLocation(
      'Heading1.RichTexts',
      block.Heading1.RichTexts,
      (newRichTexts) => { block.Heading1!.RichTexts = newRichTexts; }
    );
  }

  if (block.Heading2) {
    addLocation(
      'Heading2.RichTexts',
      block.Heading2.RichTexts,
      (newRichTexts) => { block.Heading2!.RichTexts = newRichTexts; }
    );
  }

  if (block.Heading3) {
    addLocation(
      'Heading3.RichTexts',
      block.Heading3.RichTexts,
      (newRichTexts) => { block.Heading3!.RichTexts = newRichTexts; }
    );
  }

  if (block.BulletedListItem) {
    addLocation(
      'BulletedListItem.RichTexts',
      block.BulletedListItem.RichTexts,
      (newRichTexts) => { block.BulletedListItem!.RichTexts = newRichTexts; }
    );
  }

  if (block.NumberedListItem) {
    addLocation(
      'NumberedListItem.RichTexts',
      block.NumberedListItem.RichTexts,
      (newRichTexts) => { block.NumberedListItem!.RichTexts = newRichTexts; }
    );
  }

  if (block.ToDo) {
    addLocation(
      'ToDo.RichTexts',
      block.ToDo.RichTexts,
      (newRichTexts) => { block.ToDo!.RichTexts = newRichTexts; }
    );
  }

  if (block.Quote) {
    addLocation(
      'Quote.RichTexts',
      block.Quote.RichTexts,
      (newRichTexts) => { block.Quote!.RichTexts = newRichTexts; }
    );
  }

  if (block.Callout) {
    addLocation(
      'Callout.RichTexts',
      block.Callout.RichTexts,
      (newRichTexts) => { block.Callout!.RichTexts = newRichTexts; }
    );
  }

  if (block.Toggle) {
    addLocation(
      'Toggle.RichTexts',
      block.Toggle.RichTexts,
      (newRichTexts) => { block.Toggle!.RichTexts = newRichTexts; }
    );
  }

  if (block.Code) {
    // NOTE: Code.RichTexts is EXCLUDED - we don't process footnotes inside code content
    // Code blocks are special, markers should be rendered literally, not as footnotes

    // However, Code.Caption IS processed (captions can have footnotes)
    addLocation(
      'Code.Caption',
      block.Code.Caption,
      (newRichTexts) => { block.Code!.Caption = newRichTexts; }
    );
  }

  // Captions (critical!)
  if (block.NImage) {
    addLocation(
      'NImage.Caption',
      block.NImage.Caption,
      (newRichTexts) => { block.NImage!.Caption = newRichTexts; }
    );
  }

  if (block.Video) {
    addLocation(
      'Video.Caption',
      block.Video.Caption,
      (newRichTexts) => { block.Video!.Caption = newRichTexts; }
    );
  }

  if (block.NAudio) {
    addLocation(
      'NAudio.Caption',
      block.NAudio.Caption,
      (newRichTexts) => { block.NAudio!.Caption = newRichTexts; }
    );
  }

  if (block.File) {
    addLocation(
      'File.Caption',
      block.File.Caption,
      (newRichTexts) => { block.File!.Caption = newRichTexts; }
    );
  }

  if (block.Embed) {
    addLocation(
      'Embed.Caption',
      block.Embed.Caption,
      (newRichTexts) => { block.Embed!.Caption = newRichTexts; }
    );
  }

  if (block.Bookmark) {
    addLocation(
      'Bookmark.Caption',
      block.Bookmark.Caption,
      (newRichTexts) => { block.Bookmark!.Caption = newRichTexts; }
    );
  }

  if (block.LinkPreview) {
    addLocation(
      'LinkPreview.Caption',
      block.LinkPreview.Caption,
      (newRichTexts) => { block.LinkPreview!.Caption = newRichTexts; }
    );
  }

  // Tables
  if (block.Table && block.Table.Rows) {
    block.Table.Rows.forEach((row, rowIndex) => {
      row.Cells.forEach((cell, cellIndex) => {
        addLocation(
          `Table.Rows[${rowIndex}].Cells[${cellIndex}].RichTexts`,
          cell.RichTexts,
          (newRichTexts) => {
            block.Table!.Rows[rowIndex].Cells[cellIndex].RichTexts = newRichTexts;
          }
        );
      });
    });
  }

  return locations;
}

/**
 * Joins all PlainText from RichText array
 */
export function joinPlainText(richTexts: RichText[]): string {
  return richTexts.map(rt => rt.PlainText).join('');
}

/**
 * Clones a RichText object with all properties
 */
export function cloneRichText(richText: RichText): RichText {
  return {
    Text: richText.Text ? { ...richText.Text } : undefined,
    Annotation: { ...richText.Annotation },
    PlainText: richText.PlainText,
    Href: richText.Href,
    Equation: richText.Equation ? { ...richText.Equation } : undefined,
    Mention: richText.Mention ? { ...richText.Mention } : undefined,
    InternalHref: richText.InternalHref ? { ...richText.InternalHref } : undefined,
  };
}
```

### 3.2 Marker Detection Module

**New File**: `src/lib/footnotes/markers.ts`

```typescript
import type { RichText, FootnoteMarkerInfo } from "@/lib/interfaces";
import type { RichTextLocation } from "./richtext-utils";
import { joinPlainText, cloneRichText } from "./richtext-utils";
import { createMarkerPattern } from "./config";

/**
 * Finds all footnote markers across all RichText locations in a block
 */
export function findAllFootnoteMarkers(
  locations: RichTextLocation[],
  markerPrefix: string
): FootnoteMarkerInfo[] {
  const markers: FootnoteMarkerInfo[] = [];
  const pattern = createMarkerPattern(markerPrefix);

  locations.forEach(location => {
    const text = joinPlainText(location.richTexts);
    let match;

    // Find all marker matches in the combined text
    while ((match = pattern.exec(text)) !== null) {
      const fullMarker = match[0]; // e.g., "[^ft_a]"
      const marker = fullMarker.slice(2, -1); // Remove [^ and ], e.g., "ft_a"
      const charStart = match.index;
      const charEnd = match.index + fullMarker.length;

      // Find which RichText element contains this marker
      const richTextIndex = findRichTextIndex(location.richTexts, charStart);

      if (richTextIndex !== -1) {
        markers.push({
          Marker: marker,
          FullMarker: fullMarker,
          Location: {
            BlockProperty: location.property,
            RichTextIndex: richTextIndex,
            CharStart: charStart,
            CharEnd: charEnd,
          },
        });
      }
    }
  });

  return markers;
}

/**
 * Finds which RichText element contains the character at the given position
 */
function findRichTextIndex(richTexts: RichText[], charPosition: number): number {
  let currentPos = 0;
  for (let i = 0; i < richTexts.length; i++) {
    const length = richTexts[i].PlainText.length;
    if (charPosition >= currentPos && charPosition < currentPos + length) {
      return i;
    }
    currentPos += length;
  }
  return -1;
}

/**
 * Splits RichText arrays to isolate footnote markers
 * This is complex: we need to split individual RichText elements that contain markers
 * while preserving all annotation properties
 */
export function splitRichTextWithMarkers(
  location: RichTextLocation,
  markers: FootnoteMarkerInfo[],
  markerPrefix: string
): RichText[] {
  // Filter markers that belong to this location
  const locationMarkers = markers.filter(m => m.Location.BlockProperty === location.property);

  if (locationMarkers.length === 0) {
    return location.richTexts; // No markers to split
  }

  const result: RichText[] = [];
  const pattern = createMarkerPattern(markerPrefix);

  location.richTexts.forEach((richText, index) => {
    // Check if this RichText contains any markers
    const hasMarker = locationMarkers.some(m => m.Location.RichTextIndex === index);

    if (!hasMarker) {
      // No marker in this RichText, add as-is
      result.push(richText);
    } else {
      // This RichText contains one or more markers, need to split it
      const parts = splitSingleRichText(richText, pattern);
      result.push(...parts);
    }
  });

  return result;
}

/**
 * Splits a single RichText element that contains markers
 */
function splitSingleRichText(richText: RichText, markerPattern: RegExp): RichText[] {
  if (!richText.Text || !richText.Text.Content) {
    return [richText]; // Can't split non-text RichText
  }

  const content = richText.Text.Content;
  const parts: RichText[] = [];
  let lastIndex = 0;

  // Find all markers in this content
  const matches = [...content.matchAll(markerPattern)];

  matches.forEach((match, i) => {
    const markerStart = match.index!;
    const markerEnd = markerStart + match[0].length;
    const marker = match[0].slice(2, -1); // Extract marker without [^ and ]

    // Add text before the marker (if any)
    if (markerStart > lastIndex) {
      const beforeText = content.substring(lastIndex, markerStart);
      const beforeRichText = cloneRichText(richText);
      beforeRichText.Text = {
        Content: beforeText,
        Link: richText.Text.Link,
      };
      beforeRichText.PlainText = beforeText;
      parts.push(beforeRichText);
    }

    // Add the marker itself as a separate RichText with special flag
    const markerRichText = cloneRichText(richText);
    markerRichText.Text = {
      Content: match[0],
      Link: richText.Text.Link,
    };
    markerRichText.PlainText = match[0];
    markerRichText.IsFootnoteMarker = true;
    markerRichText.FootnoteRef = marker;
    parts.push(markerRichText);

    lastIndex = markerEnd;
  });

  // Add remaining text after last marker (if any)
  if (lastIndex < content.length) {
    const afterText = content.substring(lastIndex);
    const afterRichText = cloneRichText(richText);
    afterRichText.Text = {
      Content: afterText,
      Link: richText.Text.Link,
    };
    afterRichText.PlainText = afterText;
    parts.push(afterRichText);
  }

  return parts;
}

/**
 * Counts footnote markers in text
 */
export function countMarkers(text: string, markerPrefix: string): number {
  const pattern = createMarkerPattern(markerPrefix);
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}
```

### 3.3 Footnote Extraction Module

**New File**: `src/lib/footnotes/extractor.ts`

```typescript
import { Client } from "@notionhq/client";
import type { Block, Footnote, RichText, FootnoteContent, CommentAttachment } from "@/lib/interfaces";
import type { FootnotesConfig } from "./config";
import { getActiveSource, createMarkerPattern, createContentPattern } from "./config";
import { getAllRichTextLocations, joinPlainText } from "./richtext-utils";
import { findAllFootnoteMarkers, splitRichTextWithMarkers, countMarkers } from "./markers";

export interface FootnoteExtractionResult {
  footnotes: Footnote[];
  hasProcessedRichTexts: boolean;
  hasProcessedChildren: boolean;
}

/**
 * Main entry point for extracting footnotes from a block
 * This handles all three source types
 */
export async function extractFootnotesFromBlock(
  block: Block,
  config: FootnotesConfig,
  notionClient?: Client
): Promise<FootnoteExtractionResult> {
  const source = getActiveSource(config);

  switch (source) {
    case 'end-of-block':
      return extractEndOfBlockFootnotes(block, config);
    case 'start-of-child-blocks':
      return extractStartOfChildBlocksFootnotes(block, config);
    case 'block-comments':
      if (!notionClient) {
        console.warn('Footnotes: Comments source selected but no client provided');
        return { footnotes: [], hasProcessedRichTexts: false, hasProcessedChildren: false };
      }
      return await extractBlockCommentsFootnotes(block, config, notionClient);
    default:
      return { footnotes: [], hasProcessedRichTexts: false, hasProcessedChildren: false };
  }
}

/**
 * Extracts footnotes from end-of-block format
 * Format: Text with [^marker] and after \n\n comes [^marker]: content
 *
 * IMPORTANT: Footnote definitions are NOT plain strings - they exist within the
 * RichText array and preserve all formatting (bold, italic, colors, etc.)
 */
function extractEndOfBlockFootnotes(
  block: Block,
  config: FootnotesConfig
): FootnoteExtractionResult {
  const locations = getAllRichTextLocations(block);
  const footnotes: Footnote[] = [];
  const markerPrefix = config.pageSettings.markerPrefix;

  // Find all markers across all RichText locations
  const markers = findAllFootnoteMarkers(locations, markerPrefix);

  if (markers.length === 0) {
    return { footnotes: [], hasProcessedRichTexts: false, hasProcessedChildren: false };
  }

  // For each location, check for footnote content
  locations.forEach(location => {
    // Extract footnote definitions as RichText arrays (not strings!)
    const { cleanedRichTexts, footnoteDefinitions } = extractFootnoteDefinitionsFromRichText(
      location.richTexts,
      markerPrefix
    );

    // Create Footnote objects from extracted definitions
    // Only include footnotes that have BOTH marker in text AND content definition
    footnoteDefinitions.forEach((contentRichTexts, marker) => {
      // Check if we have a corresponding marker in the text
      const hasMarker = markers.some(m => m.Marker === marker);

      if (hasMarker) {
        // Both marker and content exist - create footnote
        footnotes.push({
          Marker: marker,
          FullMarker: `[^${markerPrefix}${marker}]`,
          Content: {
            Type: 'rich_text',
            RichTexts: contentRichTexts,
          },
          SourceLocation: location.property.includes('Caption') ? 'caption' :
                          location.property.includes('Table') ? 'table' : 'content',
        });
      }
      // Else: orphaned definition (no marker in text) - silently skip
    });

    // Update location with cleaned RichTexts (definitions removed)
    location.setter(cleanedRichTexts);

    // Split markers in the cleaned RichTexts
    // Note: Markers without content will still be split out, but won't have
    // corresponding Footnote objects, so FootnoteMarker component will render
    // them as plain text or with a visual indicator
    const splitRichTexts = splitRichTextWithMarkers(
      { ...location, richTexts: cleanedRichTexts },
      markers,
      markerPrefix
    );
    location.setter(splitRichTexts);
  });

  return {
    footnotes,
    hasProcessedRichTexts: true,
    hasProcessedChildren: false,
  };
}

/**
 * Extracts footnote definitions from RichText array
 * Returns cleaned content (without definitions) and map of marker -> RichText[]
 *
 * This preserves ALL formatting from the original RichText elements
 *
 * PERFORMANCE: Caches fullText to avoid repeated joinPlainText() calls
 */
function extractFootnoteDefinitionsFromRichText(
  richTexts: RichText[],
  markerPrefix: string
): {
  cleanedRichTexts: RichText[];
  footnoteDefinitions: Map<string, RichText[]>;
} {
  // Cache the full text - we'll use it multiple times
  const fullText = joinPlainText(richTexts);

  // Find where footnote definitions start (first \n\n[^...]:)
  const firstDefMatch = fullText.match(/\n\n\[\^/);

  if (!firstDefMatch || firstDefMatch.index === undefined) {
    return {
      cleanedRichTexts: richTexts,
      footnoteDefinitions: new Map()
    };
  }

  const splitPoint = firstDefMatch.index;

  // Split RichTexts into main content and definitions section
  const { mainContent, definitionsSection } = splitRichTextsAtCharPosition(
    richTexts,
    splitPoint
  );

  // Parse the definitions section to extract individual footnotes
  // Pass fullText to avoid recalculating
  const footnoteDefinitions = parseFootnoteDefinitionsFromRichText(
    definitionsSection,
    markerPrefix,
    fullText.substring(splitPoint) // Pass relevant portion of cached text
  );

  return {
    cleanedRichTexts: mainContent,
    footnoteDefinitions
  };
}

/**
 * Splits RichText array at a specific character position
 * Returns everything before and after the split point
 */
function splitRichTextsAtCharPosition(
  richTexts: RichText[],
  splitPos: number
): {
  mainContent: RichText[];
  definitionsSection: RichText[];
} {
  const mainContent: RichText[] = [];
  const definitionsSection: RichText[] = [];
  let currentPos = 0;

  for (const richText of richTexts) {
    const length = richText.PlainText.length;
    const rtStart = currentPos;
    const rtEnd = currentPos + length;

    if (rtEnd <= splitPos) {
      // This RichText is entirely in main content
      mainContent.push(richText);
    } else if (rtStart >= splitPos) {
      // This RichText is entirely in definitions section
      definitionsSection.push(richText);
    } else {
      // This RichText spans the split - need to split it
      const splitIndex = splitPos - rtStart;

      // Main content part
      const mainPart = cloneRichText(richText);
      mainPart.PlainText = richText.PlainText.substring(0, splitIndex);
      if (mainPart.Text) {
        mainPart.Text.Content = mainPart.Text.Content.substring(0, splitIndex);
      }
      mainContent.push(mainPart);

      // Definitions section part
      const defPart = cloneRichText(richText);
      defPart.PlainText = richText.PlainText.substring(splitIndex);
      if (defPart.Text) {
        defPart.Text.Content = defPart.Text.Content.substring(splitIndex);
      }
      definitionsSection.push(defPart);
    }

    currentPos += length;
  }

  return { mainContent, definitionsSection };
}

/**
 * Parses footnote definitions from RichText array
 * Each definition: [^marker]: content (can be multiline)
 * Multiple definitions separated by \n\n[^marker]:
 *
 * Returns Map of marker -> RichText[] (preserving all formatting)
 *
 * PERFORMANCE: Uses cached fullText parameter to avoid recalculating
 *
 * BEHAVIOR - Skipped Cases (Silent):
 * - Empty content: [^ft_a]: \n\n[^ft_b]: → ft_a skipped
 * - No matching marker in text: Definition exists but no [^ft_a] in content → skipped
 */
function parseFootnoteDefinitionsFromRichText(
  richTexts: RichText[],
  markerPrefix: string,
  cachedFullText?: string
): Map<string, RichText[]> {
  const definitions = new Map<string, RichText[]>();
  const fullText = cachedFullText || joinPlainText(richTexts);
  const contentPattern = createContentPattern(markerPrefix);

  // Find all [^marker]: positions
  const markerMatches = [...fullText.matchAll(contentPattern)];

  if (markerMatches.length === 0) return definitions;

  // For each marker, extract RichText content between it and the next marker
  for (let i = 0; i < markerMatches.length; i++) {
    const currentMatch = markerMatches[i];
    const marker = currentMatch[1]; // Captured group (e.g., "ft_a" from "[^ft_a]:")
    const startPos = currentMatch.index! + currentMatch[0].length; // After "[^ft_a]: "
    const endPos = i < markerMatches.length - 1
      ? markerMatches[i + 1].index!  // Up to next marker
      : fullText.length;              // Or end of text

    // Extract RichText elements between startPos and endPos
    const footnoteRichTexts = extractRichTextRange(richTexts, startPos, endPos);

    // Skip if empty content (trim and check)
    const contentText = joinPlainText(footnoteRichTexts).trim();
    if (contentText.length === 0) {
      continue; // Silently skip empty footnotes
    }

    definitions.set(marker, footnoteRichTexts);
  }

  return definitions;
}

/**
 * Extracts a character range from RichText array, preserving all annotations
 * This is the KEY function that maintains formatting in footnote content
 */
function extractRichTextRange(
  richTexts: RichText[],
  startChar: number,
  endChar: number
): RichText[] {
  const result: RichText[] = [];
  let currentPos = 0;

  for (const richText of richTexts) {
    const length = richText.PlainText.length;
    const rtStart = currentPos;
    const rtEnd = currentPos + length;

    // Check if this RichText overlaps with our range [startChar, endChar)
    if (rtEnd > startChar && rtStart < endChar) {
      // Calculate the slice within this RichText
      const sliceStart = Math.max(0, startChar - rtStart);
      const sliceEnd = Math.min(length, endChar - rtStart);

      // Create new RichText with sliced content but SAME annotations
      const slicedText = richText.PlainText.substring(sliceStart, sliceEnd);

      if (slicedText.length > 0) {
        const slicedRichText = cloneRichText(richText);
        slicedRichText.PlainText = slicedText;
        if (slicedRichText.Text) {
          slicedRichText.Text.Content = slicedText;
        }
        result.push(slicedRichText);
      }
    }

    currentPos += length;
  }

  // Trim leading/trailing whitespace from first/last elements
  if (result.length > 0) {
    const first = result[0];
    first.PlainText = first.PlainText.trimStart();
    if (first.Text) first.Text.Content = first.Text.Content.trimStart();

    const last = result[result.length - 1];
    last.PlainText = last.PlainText.trimEnd();
    if (last.Text) last.Text.Content = last.Text.Content.trimEnd();
  }

  return result;
}

/**
 * Extracts footnotes from start-of-child-blocks format
 * Child blocks at the start are footnote content
 */
function extractStartOfChildBlocksFootnotes(
  block: Block,
  config: FootnotesConfig
): FootnoteExtractionResult {
  const locations = getAllRichTextLocations(block);
  const footnotes: Footnote[] = [];
  const markerPrefix = config.pageSettings.markerPrefix;

  // Find all markers
  const markers = findAllFootnoteMarkers(locations, markerPrefix);

  if (markers.length === 0) {
    return { footnotes: [], hasProcessedRichTexts: false, hasProcessedChildren: false };
  }

  // Count how many markers we found
  const markerCount = markers.length;

  // Get children blocks
  const children = getChildrenFromBlock(block);

  if (!children || children.length < markerCount) {
    console.warn(
      `Footnotes: Found ${markerCount} markers but only ${children?.length || 0} child blocks`
    );
    // Still split the markers even if we can't find content
    locations.forEach(location => {
      const splitRichTexts = splitRichTextWithMarkers(location, markers, markerPrefix);
      location.setter(splitRichTexts);
    });
    return { footnotes: [], hasProcessedRichTexts: true, hasProcessedChildren: false };
  }

  // Extract footnote blocks
  const footnoteBlocks = children.slice(0, markerCount);
  const remainingChildren = children.slice(markerCount);

  // Verify each footnote block starts with [^marker]: pattern
  const contentPattern = createContentPattern(markerPrefix);

  footnoteBlocks.forEach((footnoteBlock, index) => {
    const blockLocations = getAllRichTextLocations(footnoteBlock);

    if (blockLocations.length === 0) {
      console.warn(`Footnotes: Child block ${index} has no text content`);
      return;
    }

    const blockText = joinPlainText(blockLocations[0].richTexts);
    const match = contentPattern.exec(blockText);

    if (!match) {
      console.warn(
        `Footnotes: Child block ${index} doesn't start with footnote marker pattern`
      );
      return;
    }

    const marker = match[1];

    // Remove the [^marker]: prefix from the block
    const cleanedRichTexts = removeMarkerPrefix(blockLocations[0].richTexts, match[0].length);
    blockLocations[0].setter(cleanedRichTexts);

    // Create footnote with the entire block (and its descendants) as content
    footnotes.push({
      Marker: marker,
      FullMarker: `[${markerPrefix}${marker}]`,
      Content: {
        Type: 'blocks',
        Blocks: [footnoteBlock],
      },
      SourceLocation: 'content',
    });
  });

  // Update children to remove footnote blocks
  setChildrenInBlock(block, remainingChildren);

  // Split markers in RichTexts
  locations.forEach(location => {
    const splitRichTexts = splitRichTextWithMarkers(location, markers, markerPrefix);
    location.setter(splitRichTexts);
  });

  return {
    footnotes,
    hasProcessedRichTexts: true,
    hasProcessedChildren: true,
  };
}

/**
 * Gets children array from a block (various block types have children)
 */
function getChildrenFromBlock(block: Block): Block[] | null {
  if (block.Paragraph?.Children) return block.Paragraph.Children;
  if (block.Heading1?.Children) return block.Heading1.Children;
  if (block.Heading2?.Children) return block.Heading2.Children;
  if (block.Heading3?.Children) return block.Heading3.Children;
  if (block.Quote?.Children) return block.Quote.Children;
  if (block.Callout?.Children) return block.Callout.Children;
  if (block.Toggle?.Children) return block.Toggle.Children;
  if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
  if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
  if (block.ToDo?.Children) return block.ToDo.Children;
  if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
  return null;
}

/**
 * Sets children array in a block
 */
function setChildrenInBlock(block: Block, children: Block[]): void {
  if (block.Paragraph) block.Paragraph.Children = children;
  else if (block.Heading1) block.Heading1.Children = children;
  else if (block.Heading2) block.Heading2.Children = children;
  else if (block.Heading3) block.Heading3.Children = children;
  else if (block.Quote) block.Quote.Children = children;
  else if (block.Callout) block.Callout.Children = children;
  else if (block.Toggle) block.Toggle.Children = children;
  else if (block.BulletedListItem) block.BulletedListItem.Children = children;
  else if (block.NumberedListItem) block.NumberedListItem.Children = children;
  else if (block.ToDo) block.ToDo.Children = children;
  else if (block.SyncedBlock) block.SyncedBlock.Children = children;
}

/**
 * Removes marker prefix from start of RichText array
 */
function removeMarkerPrefix(richTexts: RichText[], prefixLength: number): RichText[] {
  if (richTexts.length === 0 || prefixLength === 0) {
    return richTexts;
  }

  const result = [...richTexts];
  let remaining = prefixLength;

  for (let i = 0; i < result.length && remaining > 0; i++) {
    const richText = result[i];
    const length = richText.PlainText.length;

    if (length <= remaining) {
      // Remove this entire RichText
      result.splice(i, 1);
      remaining -= length;
      i--; // Adjust index after splice
    } else {
      // Truncate this RichText
      const truncated = { ...richText };
      if (truncated.Text) {
        truncated.Text = {
          ...truncated.Text,
          Content: truncated.Text.Content.substring(remaining),
        };
      }
      truncated.PlainText = truncated.PlainText.substring(remaining);
      result[i] = truncated;
      remaining = 0;
    }
  }

  return result;
}

/**
 * Extracts footnotes from block comments
 *
 * PERFORMANCE OPTIMIZATION: Only calls Comments API if markers are found in block.
 * This avoids expensive API calls for blocks without footnote markers.
 */
async function extractBlockCommentsFootnotes(
  block: Block,
  config: FootnotesConfig,
  notionClient: Client
): Promise<FootnoteExtractionResult> {
  const locations = getAllRichTextLocations(block);
  const footnotes: Footnote[] = [];
  const markerPrefix = config.pageSettings.markerPrefix;

  // Find all markers in the block
  const markers = findAllFootnoteMarkers(locations, markerPrefix);

  // OPTIMIZATION: Skip API call if no markers found in this block
  if (markers.length === 0) {
    return { footnotes: [], hasProcessedRichTexts: false, hasProcessedChildren: false };
  }

  try {
    // Only fetch comments if we found footnote markers
    // This saves expensive API calls for blocks without footnotes
    const response: any = await notionClient.comments.list({
      block_id: block.Id,
    });

    const comments = response.results || [];
    const contentPattern = createContentPattern(markerPrefix);

    // Process each comment
    comments.forEach((comment: any) => {
      const richTextArray = comment.rich_text || [];

      if (richTextArray.length === 0) {
        return;
      }

      // Check if this comment is a footnote (starts with [^marker]:)
      const firstText = richTextArray[0]?.plain_text || '';
      const match = contentPattern.exec(firstText);

      if (!match) {
        return; // Not a footnote comment
      }

      const marker = match[1];

      // Convert Notion comment rich_text to our RichText format
      const contentRichTexts = convertNotionRichTextToOurFormat(richTextArray);

      // Remove the [^marker]: prefix from first RichText
      const cleanedRichTexts = removeMarkerPrefix(contentRichTexts, match[0].length);

      // Handle attachments (images)
      const attachments: CommentAttachment[] = [];
      if (comment.attachments && comment.attachments.length > 0) {
        comment.attachments.forEach((attachment: any) => {
          if (attachment.category === 'image' && attachment.file?.url) {
            attachments.push({
              Category: 'image',
              Url: attachment.file.url,
              ExpiryTime: attachment.file.expiry_time,
            });
          }
        });
      }

      footnotes.push({
        Marker: marker,
        FullMarker: `[${markerPrefix}${marker}]`,
        Content: {
          Type: 'comment',
          RichTexts: cleanedRichTexts,
          CommentAttachments: attachments.length > 0 ? attachments : undefined,
        },
        SourceLocation: 'comment',
      });
    });

    // Split markers in RichTexts
    locations.forEach(location => {
      const splitRichTexts = splitRichTextWithMarkers(location, markers, markerPrefix);
      location.setter(splitRichTexts);
    });

    return {
      footnotes,
      hasProcessedRichTexts: true,
      hasProcessedChildren: false,
    };
  } catch (error) {
    console.error(`Footnotes: Error fetching comments for block ${block.Id}:`, error);
    return { footnotes: [], hasProcessedRichTexts: false, hasProcessedChildren: false };
  }
}

/**
 * Converts Notion API rich_text format to our RichText interface
 */
function convertNotionRichTextToOurFormat(notionRichTexts: any[]): RichText[] {
  return notionRichTexts.map((nrt: any) => {
    const richText: RichText = {
      Annotation: {
        Bold: nrt.annotations?.bold || false,
        Italic: nrt.annotations?.italic || false,
        Strikethrough: nrt.annotations?.strikethrough || false,
        Underline: nrt.annotations?.underline || false,
        Code: nrt.annotations?.code || false,
        Color: nrt.annotations?.color || 'default',
      },
      PlainText: nrt.plain_text || '',
      Href: nrt.href,
    };

    if (nrt.type === 'text' && nrt.text) {
      richText.Text = {
        Content: nrt.text.content || '',
        Link: nrt.text.link ? { Url: nrt.text.link.url } : undefined,
      };
    }

    // Handle mentions, equations, etc. if needed
    // ... (similar to _buildRichText in client.ts)

    return richText;
  });
}
```

---

## Phase 4: Integration with Notion Client

### 4.1 Modify Block Building Process

**File**: `src/lib/notion/client.ts`

**Location**: After `_buildBlock` function completes building the basic block structure (around line 1176, before the return statement)

Add this code before `return block;`:

```typescript
// NEW: Process footnotes if enabled
if (FOOTNOTES && FOOTNOTES['in-page-footnotes-settings']?.enabled) {
  try {
    const footnoteConfig = validateAndNormalizeConfig(FOOTNOTES);

    if (footnoteConfig) {
      // Check permissions if using comments source
      const adjustedConfig = await adjustConfigForPermissions(footnoteConfig, client);

      // Extract footnotes from this block
      const result = await extractFootnotesFromBlock(block, adjustedConfig, client);

      // Store footnotes in the block
      if (result.footnotes.length > 0) {
        block.Footnotes = result.footnotes;
      }

      // Note: RichTexts are already updated by the extractor via setters
      // Children are also updated if using start-of-child-blocks source
    }
  } catch (error) {
    console.error(`Footnotes: Error processing block ${block.Id}:`, error);
  }
}
```

**Required imports** at the top of the file:

```typescript
import {
  extractFootnotesFromBlock
} from "@/lib/footnotes/extractor";
import {
  validateAndNormalizeConfig,
  adjustConfigForPermissions
} from "@/lib/footnotes/config";
import { FOOTNOTES } from "@/constants";
```

### 4.2 Important Considerations

1. **Performance**: This adds processing to every block. The extractor is designed to short-circuit quickly if no markers are found.

2. **Recursive Processing**: The footnote processing happens at each block level. Child blocks will also be processed when `getAllBlocksByBlockId` recursively calls `_buildBlock`.

3. **Caching**: The block caching system in `getPostContentByPostId` should handle caching of processed blocks with footnotes automatically.

4. **Error Handling**: Wrapped in try-catch to prevent footnote processing errors from breaking the entire build.

---

## Phase 5: Component Development

### Important Note: Footnotes vs NBlocksPopover

**CRITICAL DIFFERENCE**: The existing `NBlocksPopover.astro` component uses `renderChildren={false}` when calling `NotionBlocks` (see lines 63 and 74 in that file). This is intentional for link previews - they only show the block itself without nested content.

**For footnotes, we MUST use `renderChildren={true}`**. Footnotes often contain:
- Images (nested image blocks)
- Code blocks with syntax highlighting
- Lists with multiple items
- Nested paragraphs and formatting

All of this nested content must be visible in the footnote popover. This is a key requirement that distinguishes footnote popovers from regular link preview popovers.

### 5.1 Footnote Marker Component

**New File**: `src/components/notion-blocks/annotations/FootnoteMarker.astro`

```astro
---
import type { RichText, Footnote, Block } from "@/lib/interfaces";
import { FOOTNOTES } from "@/constants";
import RichText as RichTextComponent from "@/components/notion-blocks/RichText.astro";
import NotionBlocks from "@/components/NotionBlocks.astro";

export interface Props {
  richText: RichText;
  blockID: string;
  block?: Block;  // Need access to block to get footnote content
}

const { richText, blockID, block } = Astro.props;

// Get footnote content from block
let footnote: Footnote | undefined;
if (block?.Footnotes && richText.FootnoteRef) {
  footnote = block.Footnotes.find(f => f.Marker === richText.FootnoteRef);
}

if (!footnote) {
  // Marker found but no content - this happens when:
  // 1. User wrote [^ft_a] but no [^ft_a]: content
  // 2. Content was empty and skipped during extraction
  // Render as muted text to indicate broken reference
  ---
  <span class="footnote-marker-broken text-gray-400 dark:text-gray-600" title="Footnote content not found">
    {richText.PlainText}
  </span>
  ---
}

const config = FOOTNOTES?.['in-page-footnotes-settings'];
const displayMode = config?.['intext-display']?.['always-popup'] ? 'popup' : 'margin';

// Generate unique ID
const footnoteId = `footnote-${blockID}-${richText.FootnoteRef}`;
---

{displayMode === 'popup' ? (
  <sup class="footnote-marker">
    <span
      data-footnote-id={footnoteId}
      data-popover-target={`popover-${footnoteId}`}
      data-popover-placement="bottom-start"
      class="cursor-pointer text-link hover:text-link-hover transition-colors"
      aria-label={`Show footnote ${richText.FootnoteRef}`}
      role="button"
      tabindex="0"
    >
      †
    </span>
  </sup>
) : (
  <sup class="footnote-marker">
    <span
      data-footnote-id={footnoteId}
      data-margin-note={footnoteId}
      data-popover-target={`popover-${footnoteId}`}
      data-popover-placement="bottom-start"
      class="cursor-pointer text-link hover:text-link-hover transition-colors"
      aria-label={`Show footnote ${richText.FootnoteRef}`}
      role="button"
      tabindex="0"
    >
      †
    </span>
  </sup>
)}

<!-- Footnote content template -->
<template id={`template-${footnoteId}`}>
  <div class="footnote-content-wrapper">
    {footnote.Content.Type === 'rich_text' && footnote.Content.RichTexts && (
      <div class="footnote-richtext">
        {footnote.Content.RichTexts.map(rt => (
          <RichTextComponent richText={rt} blockID={blockID} />
        ))}
      </div>
    )}

    {footnote.Content.Type === 'blocks' && footnote.Content.Blocks && (
      <div class="footnote-blocks">
        {/* CRITICAL: renderChildren={true} for footnotes (unlike NBlocksPopover which uses false)
            This ensures nested content (images, code blocks, etc.) within footnotes is displayed */}
        <NotionBlocks
          blocks={footnote.Content.Blocks}
          renderChildren={true}
          setId={false}
        />
      </div>
    )}

    {footnote.Content.Type === 'comment' && (
      <div class="footnote-comment">
        {footnote.Content.RichTexts && (
          <div class="footnote-richtext">
            {footnote.Content.RichTexts.map(rt => (
              <RichTextComponent richText={rt} blockID={blockID} />
            ))}
          </div>
        )}

        {footnote.Content.CommentAttachments && footnote.Content.CommentAttachments.length > 0 && (
          <div class="footnote-images mt-2 space-y-2">
            {footnote.Content.CommentAttachments.map(attachment => (
              <img
                src={attachment.Url}
                alt="Footnote attachment"
                class="max-w-full rounded border border-gray-200 dark:border-gray-700"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</template>
```

### 5.2 Update RichText Component

**File**: `src/components/notion-blocks/RichText.astro`

**Add import** at the top:

```astro
---
import FootnoteMarker from "@/components/notion-blocks/annotations/FootnoteMarker.astro";
// ... other existing imports
```

**Modify the component** to accept optional block prop and handle footnote markers.

Change the Props interface:

```astro
export interface Props {
  richText: RichText;
  blockID?: string;
  block?: Block;  // NEW: Optional block for footnote content access
}

const { richText, blockID, block } = Astro.props;
```

**Add footnote marker rendering** - Insert this check early in the component logic, right after the props destructuring:

```astro
---
// ... imports and props ...

// NEW: Check if this is a footnote marker
if (richText.IsFootnoteMarker && richText.FootnoteRef) {
  ---
  <FootnoteMarker richText={richText} blockID={blockID || 'unknown'} block={block} />
  ---
}
---
```

This will short-circuit and render the FootnoteMarker component if the RichText is marked as a footnote marker.

**IMPORTANT**: Need to pass the block prop down through the rendering chain. This will require updates to multiple components that call RichText:

- `Paragraph.astro`
- `Heading1.astro`, `Heading2.astro`, `Heading3.astro`
- `Quote.astro`
- `Callout.astro`
- All other components that render RichText

Example for `Paragraph.astro`:

```astro
{block.Paragraph.RichTexts.map((richText) => (
  <RichText richText={richText} blockID={block.Id} block={block} />
))}
```

### 5.3 Update All Block Components That Render RichText

This is tedious but necessary. For each component in `src/components/notion-blocks/`:

- `Paragraph.astro`
- `Heading1.astro`
- `Heading2.astro`
- `Heading3.astro`
- `BulletedListItems.astro`
- `NumberedListItems.astro`
- `ToDo.astro`
- `Quote.astro`
- `Callout.astro`
- `Toggle.astro`
- `NCode.astro` - ⚠️ Only for Caption, NOT for code content
- `Caption.astro` (used for image/video/audio captions)
- `Table.astro` - ⚠️ **Special attention**: Multiple RichText locations per table!
  - Column header cells (lines 64-66, 75-77)
  - Row header cells (lines 101-103)
  - Regular data cells (lines 109-111)
  - All three locations need `block={block}` passed

**Change**: Pass `block` prop to RichText component calls.

Example (Paragraph.astro line 30):

```astro
<!-- Before -->
{block.Paragraph.RichTexts.map((richText) => <RichText richText={richText} blockID={block.Id} />)}

<!-- After -->
{block.Paragraph.RichTexts.map((richText) => (
  <RichText richText={richText} blockID={block.Id} block={block} />
))}
```

Example for Table.astro (needs updates in 3 locations):

```astro
<!-- Line 64-66: Column headers -->
{cell.RichTexts.map((richText: interfaces.RichText) => (
  <RichText richText={richText} blockID={block.Id} block={block} />
))}

<!-- Line 75-77: Column headers (non-datatable) -->
{cell.RichTexts.map((richText: interfaces.RichText) => (
  <RichText richText={richText} blockID={block.Id} block={block} />
))}

<!-- Line 101-103: Row headers -->
{cell.RichTexts.map((richText: interfaces.RichText) => (
  <RichText richText={richText} blockID={block.Id} block={block} />
))}

<!-- Line 109-111: Regular data cells -->
{cell.RichTexts.map((richText: interfaces.RichText) => (
  <RichText richText={richText} blockID={block.Id} block={block} />
))}
```

### 5.4 Footnotes Section Component

**New File**: `src/components/blog/FootnotesSection.astro`

```astro
---
import type { Block, Footnote } from "@/lib/interfaces";
import { FOOTNOTES } from "@/constants";
import RichText from "@/components/notion-blocks/RichText.astro";
import NotionBlocks from "@/components/NotionBlocks.astro";

export interface Props {
  blocks: Block[];
}

const { blocks } = Astro.props;
const config = FOOTNOTES?.['in-page-footnotes-settings'];

// Check if footnotes section should be generated
if (!config?.['generate-footnotes-section']) {
  return null;
}

// Collect all footnotes from all blocks recursively
const allFootnotes: Footnote[] = [];
let footnoteIndex = 1;

function collectFootnotes(blocks: Block[]): void {
  blocks.forEach(block => {
    if (block.Footnotes && block.Footnotes.length > 0) {
      block.Footnotes.forEach(footnote => {
        // Assign sequential index
        const indexedFootnote = { ...footnote, Index: footnoteIndex++ };
        allFootnotes.push(indexedFootnote);
      });
    }

    // Recursively check children
    const children = getChildrenFromBlock(block);
    if (children && children.length > 0) {
      collectFootnotes(children);
    }

    // Check column list
    if (block.ColumnList?.Columns) {
      block.ColumnList.Columns.forEach(column => {
        if (column.Children) {
          collectFootnotes(column.Children);
        }
      });
    }

    // Check table rows
    if (block.Table?.Rows) {
      // Tables don't have child blocks, footnotes would be in cell text
      // Already captured above
    }
  });
}

function getChildrenFromBlock(block: Block): Block[] | null {
  if (block.Paragraph?.Children) return block.Paragraph.Children;
  if (block.Heading1?.Children) return block.Heading1.Children;
  if (block.Heading2?.Children) return block.Heading2.Children;
  if (block.Heading3?.Children) return block.Heading3.Children;
  if (block.Quote?.Children) return block.Quote.Children;
  if (block.Callout?.Children) return block.Callout.Children;
  if (block.Toggle?.Children) return block.Toggle.Children;
  if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
  if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
  if (block.ToDo?.Children) return block.ToDo.Children;
  if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
  return null;
}

collectFootnotes(blocks);
---

{allFootnotes.length > 0 && (
  <section class="footnotes-section mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
    <h2 class="mb-6 text-2xl font-semibold text-accent">Footnotes</h2>
    <ol class="footnotes-list space-y-4">
      {allFootnotes.map(footnote => (
        <li
          id={`footnote-def-${footnote.Marker}`}
          class="footnote-item"
          data-footnote-index={footnote.Index}
        >
          <div class="flex">
            <span class="footnote-number mr-3 font-mono text-sm text-gray-500 dark:text-gray-400">
              {footnote.Index}.
            </span>
            <div class="footnote-content-section flex-1">
              {footnote.Content.Type === 'rich_text' && footnote.Content.RichTexts && (
                <div class="text-sm">
                  {footnote.Content.RichTexts.map(rt => (
                    <RichText richText={rt} />
                  ))}
                </div>
              )}

              {footnote.Content.Type === 'blocks' && footnote.Content.Blocks && (
                <div class="text-sm">
                  {/* CRITICAL: renderChildren={true} to show nested content in footnotes */}
                  <NotionBlocks
                    blocks={footnote.Content.Blocks}
                    renderChildren={true}
                    setId={false}
                  />
                </div>
              )}

              {footnote.Content.Type === 'comment' && (
                <div class="text-sm">
                  {footnote.Content.RichTexts && (
                    <div>
                      {footnote.Content.RichTexts.map(rt => (
                        <RichText richText={rt} />
                      ))}
                    </div>
                  )}

                  {footnote.Content.CommentAttachments && footnote.Content.CommentAttachments.length > 0 && (
                    <div class="mt-3 space-y-2">
                      {footnote.Content.CommentAttachments.map(attachment => (
                        <img
                          src={attachment.Url}
                          alt="Footnote attachment"
                          class="max-w-sm rounded border border-gray-200 dark:border-gray-700"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  </section>
)}

<style>
  .footnotes-list {
    list-style: none;
    counter-reset: footnote-counter;
  }

  .footnote-item {
    counter-increment: footnote-counter;
  }
</style>
```

---

## Phase 6: Client-Side Interactions

### 6.1 Footnote Popover JavaScript

**IMPORTANT**: Do NOT create new JavaScript files. The existing popover system in `Base.astro` (lines 71-273) already handles ALL popovers automatically.

**How It Works**:
1. Base.astro loads `@floating-ui/dom` from CDN
2. On `DOMContentLoaded`, it finds all `[data-popover-target]` elements
3. For each target, it looks for a `<template>` with matching ID
4. It clones the template content and creates a popover
5. Uses `computePosition()` from floating-ui for positioning
6. Handles click, hover, and keyboard events automatically

**For Footnotes to Work**:
- FootnoteMarker.astro must use `data-popover-target` attribute
- Template element must have ID matching the target pattern
- **NO additional JavaScript needed** - Base.astro handles everything

**Pattern (from NBlocksPopover.astro)**:
```astro
<!-- Trigger -->
<span data-popover-target="popover-description-{id}">
  Click me
</span>

<!-- Content Template -->
<template id="template-popover-description-{id}">
  <div data-popover id="popover-description-{id}" class="popoverEl">
    <!-- Content here -->
  </div>
</template>
```

**Nothing to implement in this phase** - the existing system handles footnote popovers automatically once FootnoteMarker.astro follows the correct pattern.

### 6.2 Margin Notes JavaScript (Optional - Advanced Feature)

**Note**: This is ONLY needed if implementing the "small-popup-large-margin" display mode. For "always-popup" mode, Base.astro already handles everything.

#### Understanding the Layout

The existing layout provides the space we need:

```html
<body class="max-w-3xl">                    <!-- 768px -->
  <main class="lg:w-[125%]">                <!-- 960px on lg screens -->
    <div class="max-w-[708px] sm:mr-20">   <!-- Content area + 80px margin -->
      <article class="break-words">
        <div class="post-body max-w-[708px]"> <!-- Post content -->
          <!-- Footnote markers here -->
        </div>
      </article>
    </div>
  </main>
</body>
```

**Available space calculation:**
- Main width on large screens: 768px × 1.25 = **960px**
- Content width: 708px
- Right margin: 80px
- **Available for footnotes**: 960px - 708px - 80px = **172px** (~10.75rem)

#### Strategy: Position Relative to .post-body

We position footnotes absolutely relative to `.post-body`, allowing them to overflow into the existing right margin space created by `lg:w-[125%]` on main.

**New File**: `src/scripts/footnotes-margin.ts`

```typescript
/**
 * Initializes Tufte-style margin notes for footnotes
 *
 * LAYOUT STRATEGY:
 * - Main already expands to 125% on large screens via lg:w-[125%]
 * - This creates ~172px of space to the right of .post-body (708px)
 * - Footnotes positioned absolutely relative to .post-body, overflowing into this space
 * - No need to modify article/body widths - space already exists!
 *
 * BEHAVIOR:
 * - Desktop (≥1024px): Always visible margin notes (Tufte style)
 * - Mobile (<1024px): Falls back to Base.astro popover system
 * - Hover marker or note: Highlights both
 * - Overlapping notes: Automatically stacked with gaps
 */
export function initializeMarginNotes(): void {
  // Only initialize on large screens
  if (window.matchMedia('(max-width: 1023px)').matches) {
    return; // Use popover system on mobile (Base.astro handles it)
  }

  positionMarginNotes();

  // Re-position on window resize (with debounce)
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        // Clear existing notes and re-position
        document.querySelectorAll('.footnote-margin-note').forEach(n => n.remove());
        positionMarginNotes();
      }
    }, 250);
  });
}

/**
 * Positions footnote content in the right margin
 *
 * KEY INSIGHT: Position relative to .post-body, not article or body
 * The .post-body container already has max-w-[708px], and main expands
 * beyond it via lg:w-[125%], creating the space we need.
 */
function positionMarginNotes(): void {
  const markers = document.querySelectorAll('[data-margin-note]');
  const createdNotes: HTMLElement[] = [];

  markers.forEach((markerEl) => {
    const footnoteId = markerEl.getAttribute('data-margin-note');
    if (!footnoteId) return;

    // Find the template with content
    const template = document.getElementById(`template-${footnoteId}`) as HTMLTemplateElement;
    if (!template) {
      console.warn(`Footnotes: No template found for ${footnoteId}`);
      return;
    }

    // Find .post-body container (the positioning context)
    const postBody = markerEl.closest('.post-body') as HTMLElement;
    if (!postBody) {
      console.warn('Footnotes: Marker not inside .post-body');
      return;
    }

    // Ensure post-body is positioned
    if (getComputedStyle(postBody).position === 'static') {
      postBody.style.position = 'relative';
    }

    // Create margin note element
    const marginNote = document.createElement('aside');
    marginNote.className = 'footnote-margin-note';
    marginNote.dataset.noteId = footnoteId;

    // Clone template content
    const content = template.content.cloneNode(true) as DocumentFragment;
    marginNote.appendChild(content);

    // Position at same vertical level as marker
    const postBodyRect = postBody.getBoundingClientRect();
    const markerRect = markerEl.getBoundingClientRect();
    const topOffset = markerRect.top - postBodyRect.top + postBody.scrollTop;

    marginNote.style.top = `${topOffset}px`;

    // Append to post-body (not article!)
    postBody.appendChild(marginNote);
    createdNotes.push(marginNote);

    // Setup hover highlighting (bidirectional)
    setupHoverHighlight(markerEl as HTMLElement, marginNote);
  });

  // Stack overlapping notes
  stackOverlappingNotes(createdNotes);
}

/**
 * Sets up bidirectional hover highlighting between marker and note
 * Hover marker → highlight note, hover note → highlight marker
 */
function setupHoverHighlight(marker: HTMLElement, note: HTMLElement): void {
  // Hover marker → highlight both
  marker.addEventListener('mouseenter', () => {
    marker.classList.add('highlighted');
    note.classList.add('highlighted');
  });

  marker.addEventListener('mouseleave', () => {
    marker.classList.remove('highlighted');
    note.classList.remove('highlighted');
  });

  // Hover note → highlight both
  note.addEventListener('mouseenter', () => {
    marker.classList.add('highlighted');
    note.classList.add('highlighted');
  });

  note.addEventListener('mouseleave', () => {
    marker.classList.remove('highlighted');
    note.classList.remove('highlighted');
  });
}

/**
 * Stacks ALL margin notes globally to prevent overlaps across different blocks
 *
 * ⚠️ IMPLEMENTATION UPDATE (2025-10-24): Changed from per-batch stacking to global stacking
 *
 * Original approach: stackOverlappingNotes(createdNotes) was called inside the forEach loop,
 * only stacking notes from the same rendering batch. This didn't prevent overlaps between blocks.
 *
 * New approach: stackAllMarginNotesGlobally() finds ALL notes on the page, sorts them,
 * and stacks them globally. This prevents long footnotes in Block 1 from overlapping with
 * footnotes in Block 2.
 *
 * See implementation-notes.md Problem 27 for details.
 */
function stackAllMarginNotesGlobally(): void {
  // Find all margin notes in the document
  const allNotes = Array.from(document.querySelectorAll('.footnote-margin-note'));

  if (allNotes.length === 0) return;

  // Sort by initial top position
  allNotes.sort((a, b) => {
    const aTop = parseInt(a.style.top) || 0;
    const bTop = parseInt(b.style.top) || 0;
    return aTop - bTop;
  });

  // Stack with minimum gap of 8px
  for (let i = 1; i < allNotes.length; i++) {
    const prevNote = allNotes[i - 1];
    const currNote = allNotes[i];

    const prevTop = parseInt(prevNote.style.top) || 0;
    const prevBottom = prevTop + prevNote.offsetHeight;
    const currTop = parseInt(currNote.style.top) || 0;

    // If current note would overlap with previous note, push it down
    if (currTop < prevBottom + 8) {
      currNote.style.top = `${prevBottom + 8}px`;
    }
  }
}
```

---

## Phase 7: Styling

### 7.1 Footnote Styles

**New File**: `src/styles/footnotes.css`

```css
/* ===================================================================
   Footnote Marker Styles
   =================================================================== */

.footnote-marker {
  font-size: 0.75rem;
  line-height: 0;
  vertical-align: super;
  margin-left: 0.1em;
  margin-right: 0.1em;
}

.footnote-marker span {
  color: var(--color-link, #3b82f6);
  cursor: pointer;
  transition: color 0.2s ease;
}

.footnote-marker span:hover {
  color: var(--color-link-hover, #2563eb);
}

.footnote-marker span:focus {
  outline: 2px solid var(--color-accent-2, #93c5fd);
  outline-offset: 2px;
  border-radius: 2px;
}

/* ===================================================================
   Popover Footnote Content
   =================================================================== */

.footnote-content-wrapper {
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 20rem;
}

.footnote-richtext,
.footnote-blocks,
.footnote-comment {
  color: var(--color-text-muted, #6b7280);
}

.footnote-richtext > *,
.footnote-blocks > *,
.footnote-comment > * {
  font-size: 0.875rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.footnote-richtext p,
.footnote-blocks p,
.footnote-comment p {
  margin: 0.25rem 0;
}

.footnote-images img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
}

/* ===================================================================
   Margin Notes (Tufte-style, desktop only)
   =================================================================== */

/**
 * LAYOUT STRATEGY:
 * - .post-body is the positioning context (position: relative set by JS)
 * - Main already expands to 125% (960px) via lg:w-[125%]
 * - Content is 708px wide, leaving ~172px to the right
 * - Notes positioned absolutely: left: 100% overflows into this space
 * - No need to modify article/body widths!
 */

.footnote-margin-note {
  position: absolute;
  left: 100%;           /* Start at right edge of .post-body (708px) */
  margin-left: 1.5rem;  /* 24px gap from content */
  width: 10rem;         /* 160px - fits in 172px available space */
  font-size: 0.75rem;   /* Small text */
  line-height: 1.5;
  color: rgb(107 114 128); /* gray-500 */
  opacity: 0.7;
  transition: opacity 0.2s ease, color 0.2s ease;
  pointer-events: auto;
}

/* Highlighted state (hover marker or note) */
.footnote-margin-note.highlighted {
  opacity: 1;
  color: rgb(31 41 55); /* gray-800 */
}

.dark .footnote-margin-note {
  color: rgb(156 163 175); /* gray-400 */
}

.dark .footnote-margin-note.highlighted {
  color: rgb(243 244 246); /* gray-100 */
}

/* Hide margin notes on screens smaller than lg breakpoint */
@media (max-width: 1023px) {
  .footnote-margin-note {
    display: none;
  }
}

/* Only show on large screens where we have the space */
@media (min-width: 1024px) {
  .footnote-margin-note {
    display: block;
  }

  /* Ensure .post-body can be a positioning context */
  .post-body {
    position: relative;
  }
}

/* Marker highlight style */
.footnote-marker span.highlighted {
  background-color: rgb(254 249 195); /* yellow-100 */
}

.dark .footnote-marker span.highlighted {
  background-color: rgb(113 63 18); /* yellow-900 */
}

/* ===================================================================
   Footnotes Section (end of page)
   =================================================================== */

.footnotes-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.dark .footnotes-section {
  border-top-color: var(--color-border-dark, #374151);
}

.footnotes-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--color-accent, #1f2937);
}

.dark .footnotes-section h2 {
  color: var(--color-accent-dark, #f9fafb);
}

.footnotes-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footnote-item {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.footnote-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.dark .footnote-item:not(:last-child) {
  border-bottom-color: var(--color-border-light-dark, #1f2937);
}

.footnote-number {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  min-width: 2rem;
  display: inline-block;
}

.footnote-content-section {
  font-size: 0.875rem;
  line-height: 1.6;
}

.footnote-content-section p {
  margin: 0.25rem 0;
}

.footnote-content-section img {
  margin-top: 0.75rem;
  max-width: 24rem;
  height: auto;
  border-radius: 0.375rem;
}

/* ===================================================================
   Responsive Adjustments
   =================================================================== */

@media (max-width: 640px) {
  .footnote-content-wrapper {
    max-width: calc(100vw - 3rem);
  }

  .footnotes-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
  }

  .footnotes-section h2 {
    font-size: 1.25rem;
  }
}

/* ===================================================================
   Dark Mode Overrides
   =================================================================== */

.dark .footnote-richtext,
.dark .footnote-blocks,
.dark .footnote-comment {
  color: var(--color-text-muted-dark, #9ca3af);
}

.dark .footnote-margin-note {
  color: var(--color-text-muted-dark, #9ca3af);
  border-left-color: var(--color-accent-2-dark, #3b82f6);
}
```

### 7.2 Import Styles

**File**: Add to existing global styles or layout

Add import in main layout or in `src/styles/global.css`:

```css
@import './footnotes.css';
```

---

## Phase 8: Page-Level Integration (CACHE-BASED)

### 8.1 Overview of Cache-Based Integration

With the cache-based architecture, page-level integration is simple:

1. Load `footnotesInPage` from `getPostContentByPostId()`
2. Pass footnotes array to `FootnotesSection` component
3. No runtime collection, no state management, no context threading

### 8.2 Update Post Pages

**Files modified**:
1. `src/pages/posts/[slug].astro` - Individual blog posts
2. `src/components/blog/PostPreviewFull.astro` - Full post previews in collections

#### Changes to [slug].astro

**1. Add imports**:
```astro
---
import FootnotesSection from "@/components/blog/FootnotesSection.astro";
import { FOOTNOTES } from "@/constants";
// Remove if present: resetFootnotes, getCollectedFootnotes
---
```

**2. Load footnotes from getPostContentByPostId**:
```astro
---
let footnotesInPage = null;

if (postFound) {
    const result = await getPostContentByPostId(post);
    blocks = result.blocks;
    referencesInPage = result.referencesInPage;
    footnotesInPage = result.footnotesInPage;  // NEW
}
---
```

**3. Render FootnotesSection after NotionBlocks**:
```astro
<PostLayout post={post} headings={headings} shouldUseCache={shouldUseCache}>
    <div class="post-body max-w-[708px] print:max-w-full"
         data-html-type={shouldUseCache && cachedHtml ? "cached" : "new"}>
        {shouldUseCache && cachedHtml ? (
            <div set:html={cachedHtml} />
        ) : (
            <NotionBlocks blocks={blocks} />
        )}

        {/* Render FootnotesSection for both cached and fresh HTML */}
        {FOOTNOTES?.['in-page-footnotes-settings']?.['generate-footnotes-section'] && footnotesInPage && (
            <FootnotesSection footnotes={footnotesInPage} />
        )}
    </div>
</PostLayout>
```

**Key Points**:
- ✅ Works with both cached and fresh HTML
- ✅ No invisible rendering needed
- ✅ Footnotes loaded once from cache
- ✅ Simple conditional rendering

#### Changes to PostPreviewFull.astro

**1. Add imports**:
```astro
---
import FootnotesSection from "@/components/blog/FootnotesSection.astro";
import { FOOTNOTES } from "@/constants";
// Remove if present: resetFootnotes, getCollectedFootnotes
---
```

**2. Load footnotes from getPostContentByPostId**:
```astro
---
const { blocks, referencesInPage, footnotesInPage } = await getPostContentByPostId(post_full_preview);
---
```

**3. Render FootnotesSection after NotionBlocks**:
```astro
<section class="post-body" data-html-type={shouldUseCache && cachedHtml ? "cached" : "new"}>
    {shouldUseCache && cachedHtml ? (
        <div set:html={cachedHtml} />
    ) : (
        <NotionBlocks blocks={blocks} />
    )}

    {FOOTNOTES?.['in-page-footnotes-settings']?.['generate-footnotes-section'] && footnotesInPage && (
        <FootnotesSection footnotes={footnotesInPage} />
    )}
</section>
```

### 8.3 Client-Side Scripts

**For "always-popup" mode**: NO SCRIPT NEEDED - Base.astro already handles everything automatically via `data-popover-target` attributes.

**For "small-popup-large-margin" mode**: The margin notes JavaScript is already in Base.astro (lines 279-462), activated automatically when margin mode is detected. NO PAGE-LEVEL SCRIPTS NEEDED.

### 8.4 What's NOT Needed

With the cache-based architecture, the following are **NOT** required:

❌ **NO runtime state management** - No blog-helpers.ts functions
❌ **NO reset functions** - resetFootnotes() not needed
❌ **NO renderingContext prop** - NotionBlocks doesn't need to know context
❌ **NO invisible rendering** - Works with cached HTML automatically
❌ **NO context prop threading** - Simple props only

### 8.5 Cache Invalidation

Footnotes cache automatically invalidates when:
- Post is updated (LastUpdatedTimeStamp > LAST_BUILD_TIME)
- Blocks cache is regenerated
- Uses same logic as references cache

**Cache location**: `tmp/blocks-json-cache/footnotes-in-page/<page-id>.json`

**Cache structure**:
```json
[
  {
    "Marker": "ft_a",
    "Index": 1,
    "Content": {
      "Type": "rich_text",
      "RichTexts": [...]
    }
  }
]
```

### 8.6 Ensure NBlocksPopover Compatibility (CRITICAL - Don't Break Legacy!)

**File**: `src/components/blog/references/NBlocksPopover.astro`

⚠️ **IMPORTANT**: This component handles the **legacy manual footnotes system**. Users have existing content that relies on this feature. **DO NOT MODIFY THIS COMPONENT**.

The component already has footnote detection (lines 22-26):

```astro
let isFootnote = false;
const footnotePattern = "posts/" + SITEWIDE_FOOTNOTES_PAGE_SLUG;
if (linkedTo && (linkedTo.includes(footnotePattern + "/") || linkedTo.endsWith(footnotePattern))) {
  isFootnote = true;
}
```

**How Legacy System Works:**
1. User creates a page with slug `_all-footnotes` (configurable via `sitewide-footnotes-page-slug`)
2. User manually adds "footnote-like" reference blocks to this page
3. User manually creates links to these blocks in their content
4. NBlocksPopover detects links to `_all-footnotes` page and shows popovers
5. Uses `renderChildren={false}` (link preview style)

**How New System Works:**
1. User types `[^ft_a]` marker in content
2. Provides content via end-of-block, child-blocks, or comments
3. FootnoteMarker component renders the marker with assigned index
4. Base.astro handles popover automatically
5. Uses `renderChildren={true}` (full footnote content)

**Both systems are completely independent:**
- Legacy: NBlocksPopover handles manual links to special page
- New: FootnoteMarker handles automatic `[^marker]` detection
- No conflicts, no interference
- Users can use both simultaneously if needed

**Testing Checklist:**
- [ ] Legacy system still works after implementing new system
- [ ] Links to `_all-footnotes` page still show popovers
- [ ] New `[^ft_a]` markers work independently
- [ ] Both can appear on same page without conflicts

## Phase 9:

### 9.1 Update Constants

**File**: `src/constants.ts`

Line 71 already has:
```typescript
export const FOOTNOTES = key_value_from_json["footnotes"] || null;
```

**Add** after this line:
```typescript
export const SITEWIDE_FOOTNOTES_PAGE_SLUG =
  FOOTNOTES?.['sitewide-footnotes-page-slug'] ||
  '_all-footnotes';
```

### 9.2 Sample Configuration

**File**: `constants-config.json`

Add the footnotes configuration:

```json
{
  "footnotes": {
    "sitewide-footnotes-page-slug": "_all-footnotes",
    "in-page-footnotes-settings": {
      "enabled": true,
      "source": {
        "end-of-block": true,
        "start-of-child-blocks": false,
        "block-comments": false,
        "block-inline-text-comments": false
      },
      "marker-prefix": "^ft_",
      "generate-footnotes-section": false,
      "intext-display": {
        "always-popup": true,
        "small-popup-large-margin": false
      }
    }
  }
}
```

**Note**: This is the default configuration. Users can modify this to enable different source types and display modes.

---

## Phase 10: Testing & Edge Cases

### 10.1 Test Cases

#### End-of-Block Footnotes

1. **Single footnote in paragraph**
   - Text with `[^ft_a]` marker
   - Followed by `\n\n[^ft_a]: Footnote content`
   - Expected: Marker rendered as †, popover shows content

2. **Multiple footnotes in one block**
   - Text with `[^ft_a]` and `[^ft_b]`
   - Followed by definitions for both
   - Expected: Both markers work independently

3. **Multiline footnote content**
   - Definition spans multiple lines
   - Expected: All lines captured in footnote

4. **Footnotes with rich text formatting**
   - Content has bold, italic, links
   - Expected: Formatting preserved

5. **Footnotes in captions**
   - Image caption contains marker and definition
   - Expected: Works same as in paragraph

6. **Footnotes in table cells**
   - Cell contains marker and definition
   - Expected: Marker rendered in cell, popover works

7. **Marker without content**
   - Marker present but no matching definition
   - Expected: Rendered as muted text or warning

8. **Content without marker**
   - Definition present but no marker
   - Expected: Ignored, not processed

#### Start-of-Child-Blocks Footnotes

1. **Simple child block footnotes**
   - Paragraph with markers
   - First N children are footnotes
   - Expected: Children removed, footnotes extracted

2. **Multi-block footnotes**
   - Footnote child block has its own children
   - Expected: Entire tree captured as footnote

3. **Mixed content**
   - Some children are footnotes, others are not
   - Expected: Only footnote children removed

4. **Incorrect count**
   - 3 markers but only 2 child blocks
   - Expected: Warning logged, partial extraction

5. **Child blocks without marker prefix**
   - Child block doesn't start with `[^...]:`
   - Expected: Not treated as footnote, remains as child

#### Block-Comments Footnotes

1. **Rich text in comments**
   - Comment has formatted text
   - Expected: Formatting preserved

2. **Comments with attachments**
   - Comment has images
   - Expected: Images rendered in footnote

3. **Multiple comments on one block**
   - Some are footnotes, some are not
   - Expected: Only footnote comments extracted

4. **Non-footnote comments**
   - Comment doesn't start with marker
   - Expected: Ignored

5. **Permission denied**
   - No comments API access
   - Expected: Falls back to end-of-block

#### Marker Splitting

1. **Marker in middle of formatted text**
   - `**bold text [^ft_a] more bold**`
   - Expected: Split preserves bold annotation

2. **Multiple markers in one RichText**
   - `Text [^ft_a] more [^ft_b] end`
   - Expected: Split into 5 RichText elements

3. **Marker at start/end**
   - `[^ft_a] text` or `text [^ft_a]`
   - Expected: Correct handling of boundaries

4. **Marker with link**
   - `[Link text [^ft_a]](url)`
   - Expected: Tricky - need to handle carefully

#### Display Modes

1. **Always-popup on all screens**
   - Test on desktop, tablet, mobile
   - Expected: Consistent popover behavior

2. **small-popup-large-margin responsive**
   - Test on desktop (should show margin)
   - Test on mobile (should show popup)
   - Expected: Switches based on screen size

3. **Margin note positioning**
   - Multiple footnotes close together
   - Expected: No overlap, readable

4. **Popup near viewport edge**
   - Marker at bottom of screen
   - Expected: Popup adjusts position

5. **Footnotes section**
   - Test sequential numbering
   - Test linking back to markers
   - Expected: Correct correspondence

### 10.2 Edge Cases

1. **Block with markers but no matching content**
   - Handle gracefully, don't crash

2. **Nested footnotes**
   - Footnote content that itself has footnotes
   - Decide on behavior: allow or prevent?

3. **Captions with footnotes**
   - All caption types: image, video, audio, file, embed
   - Test each separately

4. **Table cells with footnotes**
   - Test all cell types: normal, header
   - Multiple footnotes in one cell

5. **Footnotes in synced blocks**
   - Original block has footnotes
   - Synced block references it
   - Expected: Both show footnotes

6. **Footnote markers in code blocks**
   - Should NOT be processed
   - Expected: Rendered as literal text

7. **Footnote markers in equations**
   - Should NOT be processed
   - Expected: Rendered as part of equation

8. **RTL text with footnotes**
   - Right-to-left languages
   - Expected: Marker positioning correct

9. **Very long footnote content**
   - Multi-paragraph, multi-block content
   - Expected: Scrollable popover if needed

10. **Comments API failures**
    - Rate limiting, network errors
    - Expected: Graceful fallback or error logging

### 10.3 Testing Strategy

1. **Unit Tests** (if testing framework available)
   - Test marker detection regex
   - Test RichText splitting logic
   - Test footnote parsing

2. **Integration Tests**
   - Test full extraction pipeline
   - Test with real Notion API responses

3. **Manual Testing**
   - Create test Notion pages with all scenarios
   - Build site and verify rendering
   - Test interactions in browser

4. **Performance Testing**
   - Measure build time impact
   - Profile slow pages
   - Optimize if needed

---

## Phase 11: Build Process Integration

### 11.1 Cache Invalidation

Since footnotes are processed during build in `client.ts`:

1. **Cached blocks** are stored in `tmp/blocks-json-cache/`
2. Cache is invalidated based on `LastUpdatedTimeStamp` vs `LAST_BUILD_TIME`
3. **Footnote config changes** don't automatically invalidate cache

**Solution**:

Add config hash to cache key or:

```typescript
// In client.ts, getPostContentByPostId function
const footnoteConfigHash = FOOTNOTES ?
  JSON.stringify(FOOTNOTES).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) : 0;

// Include in cache validation
const configChanged = footnoteConfigHash !== loadCachedConfigHash();
if (!isPostUpdatedAfterLastBuild && !configChanged && fs.existsSync(cacheFilePath)) {
  // Use cache
}
```

### 11.2 Performance Considerations

1. **Comments API calls**
   - Only called if source is block-comments
   - Can be slow for pages with many blocks
   - **Mitigation**: Cache comment responses per block

2. **RichText processing**
   - Splitting RichTexts adds overhead
   - **Mitigation**: Short-circuit if no markers found

3. **Recursive processing**
   - Every child block is processed
   - **Mitigation**: Already recursive, minimal impact

4. **Build time increase**
   - Expected: 5-10% for pages with footnotes
   - Expected: <1% for pages without footnotes

### 11.3 Error Handling

Wrap all footnote processing in try-catch:

```typescript
try {
  // Footnote processing
} catch (error) {
  console.error('Footnotes: Error processing block', error);
  // Continue build without footnotes
}
```

This ensures footnote errors don't break the entire build.

---

## Implementation Order

**Note**: For agent-based implementation. Agents should work sequentially due to dependencies.

### Phase 1: Types and Configuration
1. Add footnote types to `src/lib/interfaces.ts`
   - `Footnote`, `FootnotesConfig`, `FootnoteExtractionResult`, etc.
2. Add configuration to `src/constants.ts`
   - `FOOTNOTES_CONFIG` constant with all settings
3. Update `constants-config.json` with example configuration

**Dependencies**: None

### Phase 2: Core Extraction Logic
4. Create `src/lib/footnotes.ts` with ALL extraction functions
   - Helper utilities (`joinPlainText`, `cloneRichText`)
   - Marker detection (`findAllFootnoteMarkers`)
   - RichText splitting (`splitRichTextWithMarkers`, `extractFootnoteDefinitionsFromRichText`)
   - Extraction logic (`extractFootnotes`, `extractEndOfBlockFootnotes`, etc.)
   - Start with **end-of-block only**, add other sources later

**Dependencies**: Phase 1 (types)

### Phase 3: Client Integration
5. Modify `src/lib/notion/client.ts`
   - Import `extractFootnotes` from `footnotes.ts`
   - Call in `_buildBlock()` after block is built
   - Handle footnote storage on block

**Dependencies**: Phase 2 (footnotes.ts exists)

### Phase 4: Component Rendering
6. Create `src/components/notion-blocks/FootnoteMarker.astro`
   - Render `†` symbol with appropriate attributes
   - Handle both popup and margin note modes
   - Follow pattern from MentionPage.astro

7. Update `src/components/notion-blocks/RichText.astro`
   - Add check for `richText.FootnoteRef`
   - Render FootnoteMarker component
   - Similar to existing Equation, Mention checks

**Dependencies**: Phase 3 (blocks have footnotes data)

### Phase 5: Popup Integration
8. Verify popover functionality works automatically
   - Base.astro already handles `data-popover-target`
   - Test that footnote popovers appear on click
   - No code changes needed if pattern is correct

**Dependencies**: Phase 4 (FootnoteMarker rendered)

### Phase 6: Margin Notes (OPTIONAL - Only if using that mode)
9. Add margin notes JavaScript to `src/layouts/Base.astro`
   - Inline `<script>` block similar to existing popover script
   - Position notes in right margin using Tailwind
   - Handle responsive behavior (desktop only)

**Dependencies**: Phase 4 (FootnoteMarker rendered)

### Phase 7: Collated Section (OPTIONAL)
10. Create `src/components/blog/FootnotesSection.astro`
    - Render list of all footnotes at page end
    - Only needed if user enables this feature

**Dependencies**: Phase 4 (FootnoteMarker rendered)

### Phase 8: Additional Sources (Later)
11. Add start-of-child-blocks extraction to `footnotes.ts`
12. Add block-comments extraction to `footnotes.ts`
13. Test each source type

**Dependencies**: Phase 5 (basic system working)

---

## Files Summary

### Simplified Structure (Following Existing Codebase Patterns)

**Philosophy**: No module explosion. Keep everything together. Use existing patterns.

### New Files (3 total)

1. **`src/lib/footnotes.ts`** - ALL footnote logic in ONE file
   - Extraction functions (`extractFootnotes`, `extractEndOfBlockFootnotes`, etc.)
   - RichText manipulation (`splitRichTextWithMarkers`, `extractFootnoteDefinitionsFromRichText`, etc.)
   - Helper utilities (`joinPlainText`, `cloneRichText`, etc.)
   - ~500-700 lines total

2. **`src/components/notion-blocks/FootnoteMarker.astro`** - Single component
   - Renders `†` symbol
   - Handles both popup and margin note modes
   - Similar pattern to MentionPage.astro, MentionDate.astro

3. **`src/components/blog/FootnotesSection.astro`** - Optional collated list
   - Only needed if user enables footnotes section at page end

### Modified Files (4 total)

1. **`src/lib/interfaces.ts`** - Add footnote types
   - `Footnote`, `FootnotesConfig`, `FootnoteExtractionResult`
   - No separate types file

2. **`src/constants.ts`** - Add footnotes configuration
   - `FOOTNOTES_CONFIG` constant with all settings
   - Marker prefix, display mode, etc.

3. **`src/components/notion-blocks/RichText.astro`** - Handle footnote markers
   - Add check for `richText.FootnoteRef`
   - Render FootnoteMarker component
   - Same pattern as Equation, Mention

4. **`src/layouts/Base.astro`** - Add margin notes JavaScript
   - Inline script for margin notes (only if needed for that mode)
   - Similar to existing popover script already in Base.astro
   - All Tailwind classes, NO CSS files

### Integration Points (Modified During Implementation)

**`src/lib/notion/client.ts`** - Add footnote processing call in `_buildBlock()`

**Block components** - Pass `block` prop to RichText (already done for most)

---

## Risk Assessment

### High Risk Areas

1. **RichText Splitting Complexity** 🔴
   - Risk: Losing annotation properties during split
   - Mitigation: Thorough testing, clone function
   - Impact: Visual bugs, formatting loss

2. **Performance Impact** 🟡
   - Risk: Slow builds with many blocks
   - Mitigation: Short-circuit, caching
   - Impact: Longer build times

3. **Comments API Reliability** 🟡
   - Risk: Rate limiting, network errors
   - Mitigation: Graceful fallback, error handling
   - Impact: Missing footnotes or build failures

4. **Recursive Processing** 🟡
   - Risk: Stack overflow with deeply nested blocks
   - Mitigation: Already handled by existing recursive logic
   - Impact: Build crashes

5. **Cache Invalidation** 🟡
   - Risk: Stale footnotes after config changes
   - Mitigation: Include config in cache key
   - Impact: Incorrect rendering until full rebuild

### Medium Risk Areas

1. **Regex Pattern Matching** 🟡
   - Risk: False positives/negatives
   - Mitigation: Strict pattern, escaping
   - Impact: Missed or incorrect footnotes

2. **Popover Integration** 🟢
   - Risk: None - using existing Base.astro system
   - Mitigation: Follow exact pattern from NBlocksPopover.astro
   - Impact: If pattern wrong, popovers won't work

3. **Accessibility** 🟢
   - Risk: Keyboard nav, screen readers
   - Mitigation: ARIA labels, keyboard handlers
   - Impact: Poor UX for disabled users

### Low Risk Areas

1. **Styling** 🟢
   - Risk: Visual inconsistencies
   - Mitigation: CSS variables, testing
   - Impact: Cosmetic issues only

2. **Configuration** 🟢
   - Risk: User misconfiguration
   - Mitigation: Validation, defaults
   - Impact: Footnotes don't work, clear errors

---

## Success Criteria

### Must Have ✅

- [x] End-of-block footnotes work correctly
- [x] Markers detected in all RichText locations (content, captions, tables)
- [x] Markers rendered as † symbol
- [x] Always-popup mode shows content in popovers
- [x] Rich text formatting preserved in footnotes
- [x] No build crashes or errors
- [x] Basic accessibility (keyboard, ARIA)

### Should Have 🎯

- [ ] Start-of-child-blocks footnotes work
- [ ] Block-comments footnotes work (with permission check)
- [ ] small-popup-large-margin mode works responsively
- [ ] Footnotes section generated when configured
- [ ] Multi-block footnotes render correctly
- [ ] Performance impact < 10% on footnote-heavy pages

### Nice to Have 🌟

- [ ] Sequential numbering in markers (instead of †)
- [ ] Click footnote to jump to definition (if section enabled)
- [ ] Smooth animations for popover/margin notes
- [ ] Advanced keyboard shortcuts (Esc to close, Tab to navigate)
- [ ] Footnote preview on hover (in addition to click)
- [ ] Export footnotes to separate markdown file

---

## Next Steps After Implementation

1. **User Documentation**
   - Write guide on using footnotes in Notion
   - Document configuration options
   - Provide examples for each source type

2. **Performance Optimization**
   - Profile build times
   - Identify bottlenecks
   - Implement caching improvements

3. **Feature Enhancements**
   - Sequential numbering option
   - Customizable marker symbols
   - Multiple footnote "namespaces"

4. **Community Feedback**
   - Gather user experiences
   - Fix reported bugs
   - Iterate on UX

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding footnotes to Webtrotion. The critical insight is recognizing that RichText can appear in **many locations** beyond just paragraph and heading content - captions, table cells, and comments all need to be processed.

The phased approach allows for incremental development and testing, starting with the simplest source type (end-of-block) and building up to more complex features (comments API, margin notes).

Key success factors:
- Robust RichText extraction and splitting
- Careful handling of all block types
- Graceful error handling and fallbacks
- Thorough testing of edge cases
- Performance-conscious implementation

With this plan, the footnotes feature will be a powerful addition to Webtrotion, enabling rich academic and technical writing directly from Notion.

---

## Post-Implementation Addendum: Dark Mode Optimization (2025-10-25)

After the initial implementation was completed, user testing revealed that footnote colors didn't adapt properly to dark mode. The issue was that the implementation used standard Tailwind color patterns (`text-gray-500 dark:text-gray-400`, hardcoded RGB values) instead of the site's theme system.

### Issues Found

1. **Margin note hover dimmed** instead of brightening in dark mode
2. **Yellow highlight colors** (`yellow-100`/`yellow-900`) didn't match site theme
3. **Permission check** ran 3 times per build instead of once

### Solution Applied

Refactored all footnote colors to use **CSS custom properties** from the theme system:

- Margin notes: `text-textColor/70` → `text-textColor` on hover
- Marker highlight: `color-mix(in srgb, var(--color-accent) 20%, transparent)`
- Marker text: `var(--color-accent-2)`
- Permission check: Added promise caching for single-run guarantee

### Key Lesson

**Theme integration is first-class, not an afterthought.** When a codebase has a custom theme system with CSS variables for colors, those should be used from the start, not generic Tailwind colors. The theme system is as important as the caching system or the block processing pipeline.

This aligns with Tailwind 4 best practices:
- Use CSS variables directly (not `@apply`)
- Use `color-mix()` for opacity variations
- Let theme variables handle light/dark mode automatically

See `implementation-notes.md` for detailed analysis of the root cause and solution.

---

**End of Implementation Plan**
