# Theme Preset Implementation Plan — Comprehensive Reference

## Overview

This document provides an **exhaustive specification** for implementing a preset-based theming system. A developer with minimal context should be able to implement this by following the detailed specifications below.

**Goal**: Change `theme.preset` in `constants-config.json5` → entire site looks visually distinct.

**Single Source of Truth**: `src/integrations/theme-constants-to-css.ts` generates all CSS at build time using resolved theme tokens.

---

## Table of Contents

1. [File Structure](#1-file-structure)
2. [Config Changes](#2-config-changes)
3. [Complete Token Reference](#3-complete-token-reference)
4. [TypeScript Types](#4-typescript-types)
5. [Preset Definitions](#5-preset-definitions)
6. [CSS Variable Emission](#6-css-variable-emission)
7. [Icon System](#7-icon-system)
8. [Component Styling Details](#8-component-styling-details)
9. [Implementation Phases](#9-implementation-phases)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. File Structure

### Theme Files

```
src/
├── theme.ts                    # Types + resolver + utility functions (~300 lines)
└── themes/
    ├── index.ts                # Re-exports + THEME_PRESETS map (~50 lines)
    ├── classic.ts              # Classic preset (~500 lines)
    ├── scholar.ts              # Scholar preset (~500 lines)
    ├── neobrutal.ts            # Neobrutal preset (~500 lines)
    ├── newspaper.ts            # Newspaper preset (~500 lines)
    └── playful.ts              # Playful preset (~500 lines)
```

### What Lives Where

| File | Contents |
|------|----------|
| `src/theme.ts` | `ThemePreset` type, `resolveTheme()` function, `getIconPath()` helper, default token values |
| `src/themes/index.ts` | `THEME_PRESETS` map, `DEFAULT_PRESET`, re-exports all presets |
| `src/themes/[preset].ts` | Full preset definition including all tokens AND icon mappings for that theme |

### Consumption Points

- `src/integrations/theme-constants-to-css.ts` — Imports `resolveTheme()`, emits CSS variables
- `src/pages/og-image/[slug].png.ts` — Uses resolved theme for OG image colors
- `src/components/ui/Icon.astro` — Uses theme's icon set for path lookups

---

## 2. Config Changes

### User Colors (Already Defined in `constants-config.json5`)

These colors are **already user-configurable** and should NOT be duplicated in preset tokens. The theme system should USE these variables:

```json5
{
  "theme": {
    "colors": {
      "bg": { "light": "...", "dark": "..." },      // → var(--theme-bg)
      "text": { "light": "...", "dark": "..." },    // → var(--theme-text)
      "link": { "light": "...", "dark": "..." },    // → var(--theme-link)
      "accent": { "light": "...", "dark": "..." },  // → var(--theme-accent)
      "accent-2": { "light": "...", "dark": "..." }, // → var(--theme-accent-2)
      "quote": { "light": "...", "dark": "..." }    // → var(--theme-quote)
    }
  }
}
```

### New Config Structure

```json5
{
  "theme": {
    // REQUIRED: Selects the visual preset
    "preset": "classic",  // "classic" | "scholar" | "neobrutal" | "newspaper" | "playful"
    
    // EXISTING: User-defined colors (preset provides defaults if omitted)
    "colors": { /* ... */ },
    
    // EXISTING: Custom fonts
    "fontfamily-google-fonts": {
      "sans-font-name": "...",
      "mono-font-name": "...",
      "accent-font-name": "..."  // NEW: Optional heading/accent font
    },
    
    // EXISTING
    "cover-as-hero-background": true
  }
}
```

---

## 3. Complete Token Reference

### IMPORTANT: Colors We DO NOT Define

The following are **user-defined** in `constants-config.json5` and accessed via CSS variables:
- `var(--theme-bg)` / `var(--color-bgColor)`
- `var(--theme-text)` / `var(--color-textColor)`
- `var(--theme-link)` / `var(--color-link)`
- `var(--theme-accent)` / `var(--color-accent)`
- `var(--theme-accent-2)` / `var(--color-accent-2)`
- `var(--theme-quote)` / `var(--color-quote)`

### Derived Color Tokens (Computed from User Colors)

These are **derived** from user colors using `color-mix()` and opacity:

| Token | Description | Example Value |
|-------|-------------|---------------|
| `colors.surface1` | Subtle surface (cards, code bg) | `color-mix(in srgb, var(--theme-text) 4%, var(--theme-bg))` |
| `colors.surface2` | Stronger surface (hover states) | `color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg))` |
| `colors.border` | Default border color | `color-mix(in srgb, var(--theme-text) 12%, transparent)` |
| `colors.mutedText` | Secondary text | `color-mix(in srgb, var(--theme-text) 60%, transparent)` |
| `colors.inlineCodeBg` | Inline code background | Preset-specific (gray-100/gray-800 currently) |
| `colors.inlineCodeText` | Inline code text | Preset-specific (rose-800/rose-300 currently) |
| `colors.tableBorder` | Table borders | `rgba(229, 231, 235, 0.9)` / `rgba(55, 65, 81, 0.9)` |
| `colors.searchDialogBorder` | Search dialog border | `zinc-400` |
| `colors.buttonMutedBg` | Muted button background | `zinc-200` / `zinc-700` |

### Color Mix Percentages (Theme-Variable)

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `mix.blockquoteBg` | Blockquote bg tint | `8%` | `6%` | `12%` | `5%` | `10%` |
| `mix.fabBg` | FAB button bg | `12%` | `10%` | `20%` | `8%` | `15%` |
| `mix.fabBorder` | FAB button border | `40%` | `30%` | `60%` | `25%` | `45%` |
| `mix.fabText` | FAB button text | `80%` | `70%` | `100%` | `60%` | `85%` |
| `mix.inlineHighlight` | Margin note highlight | `20%` | `15%` | `25%` | `12%` | `22%` |
| `mix.anchorHash` | Heading # color | `50%` | `40%` | `70%` | `35%` | `55%` |
| `mix.navGrad.a` | Nav highlight gradient start | `4%` | `3%` | `8%` | `2%` | `5%` |
| `mix.navGrad.b` | Nav highlight gradient mid | `10%` | `8%` | `16%` | `6%` | `12%` |
| `mix.navGrad.c` | Nav highlight gradient end | `5%` | `4%` | `10%` | `3%` | `6%` |
| `mix.navGradDark.a` | Nav highlight gradient (dark) start | `6%` | `5%` | `12%` | `4%` | `8%` |
| `mix.navGradDark.b` | Nav highlight gradient (dark) mid | `14%` | `12%` | `24%` | `10%` | `18%` |
| `mix.navGradDark.c` | Nav highlight gradient (dark) end | `7%` | `6%` | `14%` | `5%` | `9%` |
| `mix.navActive.a` | Active nav gradient start | `8%` | `6%` | `15%` | `5%` | `10%` |
| `mix.navActive.b` | Active nav gradient mid | `20%` | `16%` | `30%` | `12%` | `24%` |
| `mix.navActive.c` | Active nav gradient end | `10%` | `8%` | `18%` | `6%` | `12%` |
| `mix.heroTintTop` | Hero tint gradient top | `70%` | `75%` | `60%` | `80%` | `65%` |
| `mix.heroTintBottom` | Hero tint gradient bottom | `50%` | `55%` | `40%` | `60%` | `45%` |
| `mix.cardPlaceholder.a` | Card placeholder gradient start | `10%` | `8%` | `15%` | `6%` | `12%` |
| `mix.cardPlaceholder.b` | Card placeholder gradient end | `20%` | `16%` | `30%` | `12%` | `24%` |
| `mix.cardImageBorder` | Card image border tint | `6%` | `4%` | `10%` | `3%` | `8%` |

---

### Typography Tokens

#### Font Selection

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `typography.bodyFont` | Body text font stack | `"sans"` | `"serif"` | `"sans"` | `"serif"` | `"sans"` |
| `typography.headingFont` | Heading font stack | `"sans"` | `"accent"` | `"sans"` | `"accent"` | `"sans"` |
| `typography.navFont` | Navigation font stack | `"sans"` | `"sans"` | `"sans"` | `"serif"` | `"sans"` |
| `typography.codeFont` | Code font stack | `"mono"` | `"mono"` | `"mono"` | `"mono"` | `"mono"` |

#### Font Sizes

| Token | Description | Default Value |
|-------|-------------|---------------|
| `fontSize.root` | HTML root font size | `14px` |
| `fontSize.rootSm` | Root font size (sm breakpoint) | `16px` |
| `fontSize.title` | Page title (`.title`) | `text-3xl` (1.875rem) |
| `fontSize.h1` | Notion H1 | `text-2xl` (1.5rem) |
| `fontSize.h2` | Notion H2 | `text-xl` (1.25rem) |
| `fontSize.h3` | Notion H3 | `text-lg` (1.125rem) |
| `fontSize.body` | Body text | `text-base` (1rem) |
| `fontSize.small` | Small text (captions, meta) | `text-sm` (0.875rem) |
| `fontSize.xs` | Extra small (chips, badges) | `text-xs` (0.75rem) |
| `fontSize.inlineCode` | Inline code | `0.95rem` |
| `fontSize.cardPlaceholder` | Card placeholder letter | `2.5rem` |
| `fontSize.datatableFilterIcon` | Datatable filter icon | `20px` |

#### MDX Heading Clamp Values

| Token | Description | Default Value |
|-------|-------------|---------------|
| `fontSize.mdxH1` | MDX H1 clamp | `clamp(1.8rem, 2.6vw, 2.05rem)` |
| `fontSize.mdxH2` | MDX H2 clamp | `clamp(1.45rem, 2.3vw, 1.8rem)` |
| `fontSize.mdxH3` | MDX H3 clamp | `clamp(1.2rem, 2vw, 1.55rem)` |

#### Font Weights

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `fontWeight.normal` | Normal text | `400` | `400` | `400` | `400` | `400` |
| `fontWeight.medium` | Medium emphasis | `500` | `500` | `500` | `500` | `500` |
| `fontWeight.semibold` | Semibold (headings) | `600` | `600` | `700` | `600` | `600` |
| `fontWeight.bold` | Bold (titles) | `700` | `700` | `800` | `700` | `700` |
| `fontWeight.heading` | Heading weight | `600` | `600` | `800` | `700` | `700` |
| `fontWeight.nav` | Nav link weight | `400` | `400` | `600` | `400` | `500` |
| `fontWeight.tableHeader` | Table header | `600` | `600` | `700` | `600` | `600` |
| `fontWeight.chip` | Badge/chip weight | `600` | `500` | `700` | `500` | `600` |

#### Letter Spacing

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `letterSpacing.heading` | Heading tracking | `-0.01em` | `-0.02em` | `0` | `-0.01em` | `0` |
| `letterSpacing.nav` | Nav tracking | `0` | `0` | `0.05em` | `0` | `0.02em` |
| `letterSpacing.chip` | Badge/chip tracking | `0.05em` | `0.03em` | `0.08em` | `0.02em` | `0.04em` |

#### Text Transform

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `textTransform.heading` | Heading transform | `none` | `none` | `uppercase` | `none` | `none` |
| `textTransform.nav` | Nav transform | `none` | `none` | `uppercase` | `none` | `none` |
| `textTransform.chip` | Badge/chip transform | `uppercase` | `none` | `uppercase` | `uppercase` | `none` |
| `textTransform.tableHeader` | Table header | `uppercase` | `none` | `uppercase` | `uppercase` | `none` |

#### Line Heights

| Token | Description | Default Value |
|-------|-------------|---------------|
| `lineHeight.body` | Body text | `1.75` |
| `lineHeight.heading` | Headings | `1.2` |
| `lineHeight.mdxH1` | MDX H1 | `1.2` |
| `lineHeight.mdxH2` | MDX H2 | `1.25` |
| `lineHeight.mdxH3` | MDX H3 | `1.3` |
| `lineHeight.list` | List items | `1.65` |
| `lineHeight.callout` | Callout content | `1.5` (leading-6) |
| `lineHeight.todo` | Todo items | `1.75` (leading-7) |
| `lineHeight.bookmarkTitle` | Bookmark title | `1.25` (leading-5) |
| `lineHeight.bookmarkMeta` | Bookmark meta | `1` (leading-4) |

---

### Spacing Tokens

#### Global Layout

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.pageMaxWidth` | Body max-width | `max-w-3xl` (48rem) |
| `spacing.pagePaddingX` | Body horizontal padding | `2rem` (px-8) |
| `spacing.pagePaddingTop` | Body top padding | `2rem` (pt-8) |
| `spacing.scrollMarginTop` | Scroll margin for anchors | `2.5rem` (scroll-mt-10) |

#### Heading Margins

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `spacing.h1.mt` | H1 margin-top | `2rem` | `2.5rem` | `3rem` | `2rem` | `2rem` |
| `spacing.h1.mb` | H1 margin-bottom | `0.25rem` | `0.5rem` | `0.5rem` | `0.25rem` | `0.5rem` |
| `spacing.h2.mt` | H2 margin-top | `1.5rem` | `2rem` | `2.5rem` | `1.5rem` | `1.5rem` |
| `spacing.h2.mb` | H2 margin-bottom | `0.25rem` | `0.5rem` | `0.5rem` | `0.25rem` | `0.5rem` |
| `spacing.h3.mt` | H3 margin-top | `1rem` | `1.5rem` | `2rem` | `1rem` | `1rem` |
| `spacing.h3.mb` | H3 margin-bottom | `0.25rem` | `0.5rem` | `0.5rem` | `0.25rem` | `0.5rem` |

#### Content Block Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.text.my` | Paragraph margin-y | `0.25rem` (my-1) |
| `spacing.text.minHeight` | Text min-height | `1.75rem` (min-h-7) |
| `spacing.list.gap` | List item gap | `0.25rem` (space-y-1) |
| `spacing.list.pl` | List padding-left | `1.5rem` (pl-6) |
| `spacing.columnList.my` | Column list margin-y | `1rem` (my-4) |
| `spacing.columnList.gapX` | Column gap | `1rem` (gap-x-4) |
| `spacing.columnBasis` | Column basis | `11rem` (basis-44) |
| `spacing.divider.my` | Divider margin-y | `1rem` (my-4) |
| `spacing.divider.height` | Divider height | `0.125rem` (h-0.5) |

#### Code Block Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.codeBlock.padding` | Code block padding | `1rem` (p-4) |
| `spacing.codeBlock.mb` | Code block margin-bottom | `0.25rem` (mb-1) |
| `spacing.codeBlock.maxHeight` | Code scroll max-height | `340px` |
| `spacing.codeLine.bleedWidth` | Diff line bleed | `calc(100% + 2rem)` |
| `spacing.codeLine.bleedMl` | Diff line margin-left | `-2rem` (-ml-8) |
| `spacing.codeLine.bleedPl` | Diff line padding-left | `2rem` (pl-8) |
| `spacing.codeLine.bleedPr` | Diff line padding-right | `1rem` (pr-4) |
| `spacing.codeMarker.left` | Diff marker left | `1rem` (left-4) |
| `spacing.codeMarker.width` | Diff marker width | `1rem` (w-4) |
| `spacing.codeFocus.ml` | Focus line margin-left | `-1rem` (-ml-4) |
| `spacing.codeFocus.pl` | Focus line padding-left | `1rem` (pl-4) |
| `spacing.highlightWord.px` | Highlight word padding-x | `0.25rem` (px-1) |
| `spacing.highlightWord.mx` | Highlight word margin-x | `-2px` |

#### Blockquote & Callout Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.blockquote.my` | Blockquote margin-y | `1rem` (my-4) |
| `spacing.blockquote.px` | Blockquote padding-x | `0.5rem` (px-2) |
| `spacing.blockquote.py` | Blockquote padding-y | `0` |
| `spacing.blockquote.borderWidth` | Blockquote border width | `4px` (border-s-4) |
| `spacing.callout.my` | Callout margin-y | `0.5rem` (my-2) |
| `spacing.callout.px` | Callout padding-x | `0.75rem` (px-3) |
| `spacing.callout.py` | Callout padding-y | `1rem` (py-4) |
| `spacing.callout.iconMr` | Callout icon margin-right | `0.5rem` (mr-2) |

#### Table Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.table.pb` | Table container padding-bottom | `0.5rem` (pb-2) |
| `spacing.table.cellPadding` | Table cell padding | `0.5rem` (p-2) |

#### Bookmark Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.bookmark.padding` | Bookmark text padding | `0.75rem` (p-3) |
| `spacing.bookmark.titleHeight` | Bookmark title height | `1.5rem` (h-6) |
| `spacing.bookmark.descHeight` | Bookmark desc height | `2rem` (h-8) |
| `spacing.bookmark.captionMt` | Caption margin-top | `0.375rem` (mt-1.5) |
| `spacing.bookmark.iconMr` | Icon margin-right | `0.375rem` (mr-1.5) |
| `spacing.bookmark.iconSize` | Icon size | `1rem` (h-4 w-4) |

#### File & Tag Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.file.padding` | File container padding | `0.25rem` (p-1) |
| `spacing.file.previewMl` | File preview margin-left | `0.5rem` (ml-2) |
| `spacing.tag.px` | Tag padding-x | `0.25rem` (px-1) |
| `spacing.badge.ml` | Count badge margin-left | `0.5rem` (ml-2) |
| `spacing.badge.px` | Count badge padding-x | `0.5rem` (px-2) |
| `spacing.badge.py` | Count badge padding-y | `0.125rem` (py-0.5) |

#### Image Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.image.figureMt` | Image figure margin-top | `0.25rem` (mt-1) |

#### Todo Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.todo.pl` | Todo padding-left | `0.5rem` (pl-2) |
| `spacing.todo.gap` | Todo container gap | `0.5rem` (gap-2) |
| `spacing.todo.checkboxMt` | Checkbox wrapper margin-top | `0.25rem` (mt-1) |
| `spacing.todo.checkboxPr` | Checkbox wrapper padding-right | `0.5rem` (pr-2) |
| `spacing.todo.checkboxSize` | Checkbox icon size | `1.25rem` (h-5 w-5) |

#### TOC & Floating UI Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.toc.right` | TOC container right | `1rem` (right-4) |
| `spacing.toc.topSm` | TOC top (sm+) | `10rem` (sm:top-40) |
| `spacing.toc.visualTop` | Visual container top | `1.5rem` (top-6) |
| `spacing.toc.visualWidth` | Visual container width | `2rem` (w-8) |
| `spacing.toc.visualPadding` | Visual container padding | `0.5rem` (p-2) |
| `spacing.toc.visualGap` | Visual container gap | `0.5rem` (space-y-2) |
| `spacing.toc.panelRight` | Panel right | `0.25rem` (right-1) |
| `spacing.toc.panelWidth` | Panel width | `19rem` (w-76) |
| `spacing.toc.panelMaxHeight` | Panel max-height | `55vh` |
| `spacing.toc.panelMaxHeightSm` | Panel max-height (sm+) | `68vh` |
| `spacing.toc.panelPadding` | Panel padding | `0.5rem` (p-2) |

#### Button Sizing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.iconButton.size` | Icon button size (h/w) | `2.5rem` (h-10 w-10) |
| `spacing.iconButton.sizeSm` | Icon button size (sm+) | `3rem` (sm:h-12 sm:w-12) |
| `spacing.iconButton.fontSize` | Icon button font size | `1.875rem` (text-3xl) |

#### Navigation & Header Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.header.paddingStartSm` | Header left padding (sm+) | `4.5rem` |
| `spacing.layout.bleedMlLg` | Header/footer bleed margin | `-25%` |
| `spacing.layout.bleedWidthLg` | Header/footer bleed width | `150%` |
| `spacing.nav.dropdownTop` | Mobile nav dropdown top | `3.5rem` (top-14) |
| `spacing.nav.dropdownInsetX` | Nav dropdown inset-x | `-1rem` (-inset-x-4) |
| `spacing.nav.dropdownPy` | Nav dropdown padding-y | `0.5rem` (py-2) |
| `spacing.nav.gapYMobile` | Nav gap-y (mobile) | `0.75rem` (gap-y-3) |
| `spacing.nav.gapXLg` | Nav gap-x (lg+) | `1rem` (lg:gap-x-4) |

#### Footer Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.footer.pt` | Footer padding-top | `5rem` (pt-20) |
| `spacing.footer.pb` | Footer padding-bottom | `1rem` (pb-4) |
| `spacing.footer.navGapX` | Footer nav gap-x | `0.5rem` (gap-x-2) |
| `spacing.footer.navBorderWidth` | Footer nav border width | `2px` (border-t-2) |
| `spacing.footer.linkPx` | Footer link padding-x | `1rem` (px-4) |
| `spacing.footer.linkPy` | Footer link padding-y | `0.5rem` (py-2) |

#### Search Dialog Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.searchDialog.mtSm` | Dialog margin-top (sm+) | `4rem` (sm:mt-16) |
| `spacing.searchDialog.maxHeightSm` | Dialog max-height (sm+) | `calc(100% - 8rem)` |
| `spacing.searchDialog.minHeightSm` | Dialog min-height (sm+) | `15rem` |
| `spacing.searchDialog.widthSm` | Dialog width (sm+) | `83.333%` (sm:w-5/6) |
| `spacing.searchDialog.maxWidthSm` | Dialog max-width (sm+) | `48rem` |
| `spacing.searchFrame.padding` | Frame padding | `1.5rem` (p-6) |
| `spacing.searchFrame.paddingTop` | Frame padding-top | `3rem` (pt-12) |

#### Gallery & Card Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.gallery.gap` | Gallery grid gap | `1.5rem` (gap-6) |
| `spacing.card.imageAspect` | Card image aspect ratio | `3/2` |
| `spacing.card.tagsPb` | Card tags padding-bottom | `0.75rem` (pb-3) |
| `spacing.card.authorsMt` | Card authors margin-top | `-0.25rem` (-mt-1) |

#### Hero Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.hero.minHeight` | Hero min-height | `150px` |
| `spacing.hero.padding` | Hero content padding | `1.5rem` (p-6) |
| `spacing.hero.mb` | Hero margin-bottom | `1rem` (mb-4) |

#### MDX Content Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.mdx.paragraphMb` | MDX paragraph margin-bottom | `0.9rem` |
| `spacing.mdx.listMy` | MDX list margin-y | `0.2rem` / `1rem` |
| `spacing.mdx.listMs` | MDX list margin-start | `1.25rem` |
| `spacing.mdx.listPs` | MDX list padding-start | `1.25rem` |
| `spacing.mdx.listItemMy` | MDX list item margin-y | `0.1rem` |
| `spacing.mdx.listItemPs` | MDX list item padding-start | `0.1rem` |
| `spacing.mdx.blockquoteMy` | MDX blockquote margin-y | `1.1rem` |
| `spacing.mdx.blockquotePx` | MDX blockquote padding-x | `1rem` (px-4) |
| `spacing.mdx.blockquotePy` | MDX blockquote padding-y | `0.75rem` (py-3) |
| `spacing.mdx.codePx` | MDX code block padding-x | `1rem` (px-4) |
| `spacing.mdx.codePy` | MDX code block padding-y | `1rem` (py-4) |
| `spacing.mdx.codeMy` | MDX code block margin-y | `1.1rem` |
| `spacing.mdx.headingMt` | MDX heading margin-top | `1.25rem` (mt-5) |
| `spacing.mdx.headingMb` | MDX heading margin-bottom | `0.75rem` (mb-3) |

#### Datatable Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.datatable.inputPx` | Input padding-x | `6px` |
| `spacing.datatable.inputPy` | Input padding-y | `3px` |
| `spacing.datatable.filterTogglePx` | Filter toggle padding-x | `10px` |
| `spacing.datatable.filterRowMaxHeight` | Filter row max-height | `50px` |
| `spacing.datatable.topMb` | Top section margin-bottom | `10px` |
| `spacing.datatable.cellPaddingMultiplier` | Cell padding multiplier | `2` |
| `spacing.datatable.sorterPr` | Sorter padding-right | `1rem` (pr-4) |
| `spacing.datatable.sorterIconTop` | Sorter icon top offset | `-2px` |

#### Popover Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.popover.maxWidthGutter` | Popover max-width gutter | `10px` |

#### Margin Note Spacing

| Token | Description | Default Value |
|-------|-------------|---------------|
| `spacing.marginNote.px` | Highlight padding-x | `2px` |
| `spacing.marginNote.mx` | Highlight margin-x | `-2px` |

---

### Border Tokens

#### Border Radii

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `radius.sm` | Small radius | `0.125rem` | `0.0625rem` | `0` | `0.0625rem` | `0.25rem` |
| `radius.md` | Medium radius | `0.375rem` | `0.25rem` | `0` | `0.25rem` | `0.5rem` |
| `radius.lg` | Large radius | `0.5rem` | `0.375rem` | `0` | `0.375rem` | `0.75rem` |
| `radius.xl` | Extra large radius | `0.75rem` | `0.5rem` | `0` | `0.5rem` | `1rem` |
| `radius.2xl` | 2XL radius | `1rem` | `0.75rem` | `0` | `0.75rem` | `1.25rem` |
| `radius.full` | Full radius (pills) | `9999px` | `9999px` | `0` | `9999px` | `9999px` |
| `radius.code` | Code block radius | `0.375rem` | `0.25rem` | `0` | `0.25rem` | `1rem` |
| `radius.card` | Card radius | `0.5rem` | `0.375rem` | `0` | `0.375rem` | `0.75rem` |
| `radius.tag` | Tag radius | `0.375rem` | `0.25rem` | `0` | `0.25rem` | `9999px` |
| `radius.badge` | Badge radius | `0.125rem` | `0.0625rem` | `0` | `0.0625rem` | `9999px` |
| `radius.blockquoteRight` | Blockquote right radius | `0.5rem` | `0` | `0` | `0` | `0.75rem` |

#### Nav Highlight Geometry

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `radius.navHighlight` | Nav highlight radius | `0.4em 0.2em` | `0` | `0` | `0` | `9999px` |
| `spacing.navHighlight.insetX` | Highlight inset-x | `0.08em` | `0` | `0` | `0` | `0.5em` |
| `spacing.navHighlight.height` | Highlight height | `0.42em` | `2px` | `0.5em` | `2px` | `1.5em` |
| `spacing.navHighlight.heightActive` | Active highlight height | `0.62em` | `3px` | `0.6em` | `3px` | `1.5em` |
| `spacing.navHighlight.bottom` | Nav highlight bottom | `0` | `0` | `0` | `0` | `50%` |
| `spacing.footerHighlight.bottom` | Footer highlight bottom | `0.05em` | `0` | `0` | `0` | `50%` |
| `spacing.footerHighlight.height` | Footer highlight height | `0.5em` | `2px` | `0.5em` | `2px` | `1.5em` |
| `spacing.footerHighlight.heightActive` | Active footer highlight | `0.7em` | `3px` | `0.6em` | `3px` | `1.5em` |

#### Border Widths

| Token | Description | Default Value |
|-------|-------------|---------------|
| `border.default` | Default border width | `1px` |
| `border.blockquote` | Blockquote border width | `4px` |
| `border.footerNav` | Footer nav border width | `2px` |
| `border.focus` | Focus outline width | `1px` |
| `border.focusRing` | Focus ring width | `0.2rem` |
| `border.searchDialog` | Search dialog border | `1px` |

#### Border Styles (Theme-Variable)

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `border.dividerStyle` | Divider border style | `solid` | `solid` | `solid` | `solid` | `dashed` |

---

### Shadow Tokens

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `shadow.sm` | Small shadow | `0 1px 2px rgba(0,0,0,0.05)` | `none` | `2px 2px 0 currentColor` | `none` | `0 1px 3px rgba(0,0,0,0.1)` |
| `shadow.md` | Medium shadow | Tailwind default | `none` | `3px 3px 0 currentColor` | `none` | `0 4px 6px rgba(0,0,0,0.1)` |
| `shadow.lg` | Large shadow | Tailwind default | `none` | `4px 4px 0 currentColor` | `none` | `0 10px 15px rgba(0,0,0,0.1)` |
| `shadow.xl` | Extra large shadow | Tailwind default | `none` | `6px 6px 0 currentColor` | `none` | `0 20px 25px rgba(0,0,0,0.1)` |
| `shadow.tocPanel` | TOC panel shadow | `shadow-xl shadow-accent/5` | `none` | `4px 4px 0 var(--theme-accent)` | `none` | `0 20px 25px rgba(0,0,0,0.08)` |
| `shadow.card` | Card shadow | `none` | `none` | `3px 3px 0 var(--theme-accent-2)` | `none` | `0 4px 12px rgba(0,0,0,0.08)` |
| `shadow.fab` | FAB button shadow | `shadow-lg` | `none` | `3px 3px 0 currentColor` | `none` | `0 8px 16px rgba(0,0,0,0.12)` |

---

### Effect & Motion Tokens

#### Blur & Backdrop

| Token | Description | Default Value |
|-------|-------------|---------------|
| `effect.codeUnfocusedBlur` | Unfocused code line blur | `1px` |
| `effect.backdropBlurSm` | Small backdrop blur | `4px` |
| `effect.backdropBlurMd` | Medium backdrop blur | `12px` |

#### Opacity

| Token | Description | Default Value |
|-------|-------------|---------------|
| `opacity.codeUnfocused` | Unfocused code line opacity | `0.5` |
| `opacity.highlighted` | Highlighted element | `1` |
| `opacity.hidden` | Hidden element | `0` |
| `opacity.hoverDim` | Hover dim | `0.7` |
| `opacity.secondaryText` | Secondary text (captions) | `0.7` |
| `opacity.bodyMuted` | Muted body text | `0.9` |
| `opacity.iconMuted` | Muted icon | `0.5` |
| `opacity.icon` | Standard icon | `0.75` |
| `opacity.dialogSurface` | Dialog backdrop | `0.8` |

#### Transforms (Theme-Variable)

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `motion.cardImageHoverScale` | Card image hover scale | `1.05` | `1` | `1` | `1` | `1.08` |
| `motion.iconHoverScale` | Icon hover scale | `1.1` | `1` | `1.05` | `1` | `1.15` |
| `motion.cardHoverBrightness` | Card placeholder hover | `1.03` | `1` | `1` | `1` | `1.05` |
| `motion.toggleOpenRotate` | Toggle icon rotation | `90deg` | `90deg` | `90deg` | `90deg` | `90deg` |
| `motion.toTopHiddenTranslateY` | To-top hidden offset | `7rem` | `7rem` | `7rem` | `7rem` | `7rem` |

#### Transition Durations

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `duration.fast` | Fast transitions | `200ms` | `150ms` | `100ms` | `200ms` | `250ms` |
| `duration.medium` | Medium transitions | `300ms` | `250ms` | `150ms` | `300ms` | `350ms` |
| `duration.slow` | Slow transitions | `500ms` | `400ms` | `200ms` | `500ms` | `600ms` |
| `duration.navHighlight` | Nav highlight | `200ms` | `150ms` | `0ms` | `200ms` | `250ms` |
| `duration.hashReveal` | Heading hash reveal | `300ms` | `250ms` | `100ms` | `300ms` | `350ms` |
| `duration.cardHover` | Card hover effects | `300ms` | `200ms` | `100ms` | `300ms` | `400ms` |

#### Transition Easings

| Token | Description | Default Value |
|-------|-------------|---------------|
| `easing.standard` | Standard easing | `ease` |
| `easing.inOut` | In-out easing | `ease-in-out` |

---

### Link & Decoration Tokens

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `underline.style` | Link underline style | `wavy` | `solid` | `solid` | `solid` | `wavy` |
| `underline.thickness` | Link underline thickness | `from-font` | `1px` | `2px` | `1px` | `from-font` |
| `underline.offset` | Link underline offset | `2px` | `3px` | `2px` | `3px` | `3px` |
| `underline.offsetHover` | Pagination link hover | `4px` | `4px` | `3px` | `4px` | `5px` |
| `underline.annotationStyle` | Annotation underline | `dashed` | `dotted` | `solid` | `dotted` | `dashed` |

---

### Visual Pattern Tokens

#### Heading Anchor Hash

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `anchor.hashContent` | Anchor hash character | `"#"` | `"§"` | `"#"` | `"¶"` | `"→"` |
| `anchor.hashMl` | Hash margin-left | `-1.5rem` | `-1.5rem` | `-1.5rem` | `-1.5rem` | `-1.5rem` |
| `anchor.hashMlToggle` | Toggle heading hash ml | `-2.5rem` | `-2.5rem` | `-2.5rem` | `-2.5rem` | `-2.5rem` |
| `anchor.hashOpacityHidden` | Hash hidden opacity | `0` | `0` | `0.3` | `0` | `0` |
| `anchor.hashOpacityShown` | Hash shown opacity | `1` | `1` | `1` | `1` | `1` |

#### Nav Highlight Style (Theme-Variable)

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `nav.highlightType` | Highlight type | `gradient` | `underline` | `solidBlock` | `underline` | `pillBg` |
| `nav.highlightPosition` | Highlight position | `bottom` | `bottom` | `bottom` | `bottom` | `center` |

#### Pagefind Underline

| Token | Description | Default Value |
|-------|-------------|---------------|
| `pagefind.underlineHeight` | Search result underline height | `6px` |
| `pagefind.underlineGap` | Baseline gap | `5px` |
| `pagefind.underlineGapHover` | Baseline gap (hover) | `4px` |

---

### Pinned Post Indicator Tokens

The pinned post indicator can be styled differently per theme:

| Token | Description | Classic | Scholar | Neobrutal | Newspaper | Playful |
|-------|-------------|---------|---------|-----------|-----------|---------|
| `pinned.icon` | Icon name | `"pin"` | `"pin-elegant"` | `"pin-bold"` | `"pin-outline"` | `"pin-playful"` |
| `pinned.size` | Icon size | `1.5rem` | `1.5rem` | `1.75rem` | `1.5rem` | `1.5rem` |
| `pinned.color` | Icon color | `var(--theme-quote)` | `var(--theme-accent)` | `var(--theme-accent-2)` | `var(--theme-accent)` | `var(--theme-accent)` |
| `pinned.rotate` | Icon rotation | `0deg` | `0deg` | `-15deg` | `0deg` | `15deg` |
| `pinned.hasBackground` | Show background circle | `false` | `false` | `true` | `false` | `true` |
| `pinned.bgColor` | Background color | — | — | `var(--theme-accent)/10` | — | `var(--theme-accent)/15` |
| `pinned.bgRadius` | Background radius | — | — | `0` | — | `9999px` |
| `pinned.bgSize` | Background size | — | — | `2rem` | — | `2.25rem` |
| `pinned.hasGlass` | Glass/blur effect | `false` | `false` | `false` | `false` | `true` |
| `pinned.glassBlur` | Glass blur amount | — | — | — | — | `4px` |
| `pinned.glassBg` | Glass background | — | — | — | — | `var(--theme-bg)/60` |

---

## 4. TypeScript Types

### Main Types (`src/theme.ts`)

```typescript
// Font stack options
type FontStack = "sans" | "serif" | "mono" | "accent";

// Nav highlight style
type NavHighlightType = "gradient" | "underline" | "solidBlock" | "pillBg";

// Color mix percentages
interface ColorMixTokens {
  blockquoteBg: number;
  fabBg: number;
  fabBorder: number;
  fabText: number;
  inlineHighlight: number;
  anchorHash: number;
  navGrad: { a: number; b: number; c: number };
  navGradDark: { a: number; b: number; c: number };
  navActive: { a: number; b: number; c: number };
  heroTintTop: number;
  heroTintBottom: number;
  cardPlaceholder: { a: number; b: number };
  cardImageBorder: number;
}

// Derived colors (computed from user colors)
interface DerivedColors {
  surface1: string;  // CSS color-mix expression
  surface2: string;
  border: string;
  mutedText: string;
  inlineCodeBg: { light: string; dark: string };
  inlineCodeText: { light: string; dark: string };
  tableBorder: { light: string; dark: string };
  searchDialogBorder: string;
  buttonMutedBg: { light: string; dark: string };
}

// Typography tokens
interface TypographyTokens {
  bodyFont: FontStack;
  headingFont: FontStack;
  navFont: FontStack;
  codeFont: FontStack;
}

interface FontSizeTokens {
  root: string;
  rootSm: string;
  title: string;
  h1: string;
  h2: string;
  h3: string;
  body: string;
  small: string;
  xs: string;
  inlineCode: string;
  cardPlaceholder: string;
  datatableFilterIcon: string;
  mdxH1: string;
  mdxH2: string;
  mdxH3: string;
}

interface FontWeightTokens {
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
  heading: string;
  nav: string;
  tableHeader: string;
  chip: string;
}

interface LetterSpacingTokens {
  heading: string;
  nav: string;
  chip: string;
}

interface TextTransformTokens {
  heading: string;
  nav: string;
  chip: string;
  tableHeader: string;
}

interface LineHeightTokens {
  body: string;
  heading: string;
  mdxH1: string;
  mdxH2: string;
  mdxH3: string;
  list: string;
  callout: string;
  todo: string;
  bookmarkTitle: string;
  bookmarkMeta: string;
}

// Spacing tokens (abbreviated - full version has all sub-objects)
interface SpacingTokens {
  pageMaxWidth: string;
  pagePaddingX: string;
  pagePaddingTop: string;
  scrollMarginTop: string;
  h1: { mt: string; mb: string };
  h2: { mt: string; mb: string };
  h3: { mt: string; mb: string };
  // ... all other spacing tokens
}

// Border tokens
interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  full: string;
  code: string;
  card: string;
  tag: string;
  badge: string;
  blockquoteRight: string;
  navHighlight: string;
}

interface BorderTokens {
  default: string;
  blockquote: string;
  footerNav: string;
  focus: string;
  focusRing: string;
  searchDialog: string;
  dividerStyle: string;
}

// Shadow tokens
interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  tocPanel: string;
  card: string;
  fab: string;
}

// Effect tokens
interface EffectTokens {
  codeUnfocusedBlur: string;
  backdropBlurSm: string;
  backdropBlurMd: string;
}

interface OpacityTokens {
  codeUnfocused: number;
  highlighted: number;
  hidden: number;
  hoverDim: number;
  secondaryText: number;
  bodyMuted: number;
  iconMuted: number;
  icon: number;
  dialogSurface: number;
}

interface MotionTokens {
  cardImageHoverScale: number;
  iconHoverScale: number;
  cardHoverBrightness: number;
  toggleOpenRotate: string;
  toTopHiddenTranslateY: string;
}

interface DurationTokens {
  fast: string;
  medium: string;
  slow: string;
  navHighlight: string;
  hashReveal: string;
  cardHover: string;
}

interface EasingTokens {
  standard: string;
  inOut: string;
}

// Link tokens
interface UnderlineTokens {
  style: string;
  thickness: string;
  offset: string;
  offsetHover: string;
  annotationStyle: string;
}

// Visual pattern tokens
interface AnchorTokens {
  hashContent: string;
  hashMl: string;
  hashMlToggle: string;
  hashOpacityHidden: number;
  hashOpacityShown: number;
}

interface NavStyleTokens {
  highlightType: NavHighlightType;
  highlightPosition: string;
  highlight: {
    insetX: string;
    height: string;
    heightActive: string;
    bottom: string;
  };
  footerHighlight: {
    bottom: string;
    height: string;
    heightActive: string;
  };
}

// Pinned indicator tokens
interface PinnedTokens {
  icon: string;
  size: string;
  color: string;
  rotate: string;
  hasBackground: boolean;
  bgColor?: string;
  bgRadius?: string;
  bgSize?: string;
  hasGlass: boolean;
  glassBlur?: string;
  glassBg?: string;
}

// Icon mapping
interface IconMapping {
  [key: string]: string;  // icon name → SVG path
}

// Complete preset definition
export interface ThemePreset {
  name: string;
  
  // Derived colors
  colors: DerivedColors;
  mix: ColorMixTokens;
  
  // Typography
  typography: TypographyTokens;
  fontSize: FontSizeTokens;
  fontWeight: FontWeightTokens;
  letterSpacing: LetterSpacingTokens;
  textTransform: TextTransformTokens;
  lineHeight: LineHeightTokens;
  
  // Spacing
  spacing: SpacingTokens;
  
  // Borders
  radius: RadiusTokens;
  border: BorderTokens;
  
  // Shadows
  shadow: ShadowTokens;
  
  // Effects
  effect: EffectTokens;
  opacity: OpacityTokens;
  motion: MotionTokens;
  duration: DurationTokens;
  easing: EasingTokens;
  
  // Links
  underline: UnderlineTokens;
  
  // Visual patterns
  anchor: AnchorTokens;
  nav: NavStyleTokens;
  
  // Pinned indicator
  pinned: PinnedTokens;
  
  // Icons
  icons: IconMapping;
}
```

---

## 5. Preset Definitions

Each preset file (`src/themes/[preset].ts`) exports a complete `ThemePreset` object.

### Classic Preset (Summary)

The "classic" preset matches the **current site styling** exactly:
- Sans-serif body, wavy underlines
- Subtle border radii, soft shadows
- Standard transitions
- Gradient-based nav highlights
- MDI icon set

### Scholar Preset (Summary)

Academic/scholarly aesthetic:
- Serif body font, accent font for headings
- Solid underlines, minimal radii
- No shadows, clean borders
- Underline-based nav highlights
- Lucide icon set
- Section symbol (§) for anchor hash

### Neobrutal Preset (Summary)

Bold, brutalist design:
- Heavy font weights, uppercase transforms
- Zero border radius everywhere
- Hard offset shadows
- Solid block nav highlights
- Fast/instant transitions
- Tabler icon set (bold strokes)
- Tilted pinned indicator with background

### Newspaper Preset (Summary)

Classic print/editorial aesthetic:
- Serif fonts throughout
- Minimal styling, clean lines
- No shadows
- Pilcrow (¶) for anchor hash
- MDI Outline icon set

### Playful Preset (Summary)

Fun, modern aesthetic:
- Large border radii (pill-shaped elements)
- Soft shadows with blur
- Scale animations on hover
- Pill-shaped nav highlights
- Glass-effect pinned indicator
- Phosphor icon set
- Arrow (→) for anchor hash

---

## 6. CSS Variable Emission & @apply Strategy

### Core Principle: No Component Changes

All theming is achieved by:
1. Changing token values in theme files
2. Re-generating `global.css` via `theme-constants-to-css.ts`

**Components are NEVER modified** — they use the same CSS classes regardless of preset.

### The @apply-First Approach

The current codebase uses `@apply` with Tailwind utilities wherever possible. We maintain this pattern:

1. **Emit CSS variables in `:root`** — Raw token values from the resolved theme
2. **Map to Tailwind theme in `@theme {}`** — Makes tokens usable in `@apply`
3. **Use `@apply` in component styles** — Keeps styling declarative and consistent
4. **Raw CSS only when required** — For things Tailwind can't express

### What CAN Use @apply (via @theme mapping)

| Category | Example Tokens | Tailwind @apply Usage |
|----------|----------------|----------------------|
| Spacing | `--t-h1-mt`, `--t-h1-mb` | `@apply mt-[--t-h1-mt] mb-[--t-h1-mb]` |
| Font sizes | `--t-font-h1` | `@apply text-[length:--t-font-h1]` |
| Font weights | `--t-weight-heading` | `@apply font-[--t-weight-heading]` |
| Colors | `--t-surface-1` | `@apply bg-[--t-surface-1]` |
| Border radius | `--t-radius-md` | `@apply rounded-[--t-radius-md]` |
| Opacity | `--t-opacity-muted` | `@apply opacity-[--t-opacity-muted]` |
| Transitions | `--t-duration-fast` | `@apply duration-[--t-duration-fast]` |
| Transforms | `--t-scale-hover` | `@apply hover:scale-[--t-scale-hover]` |

### What MUST Use Raw CSS

These cannot be expressed with `@apply`:

| Feature | Why Raw CSS | Example |
|---------|-------------|---------|
| `content: "..."` | Tailwind doesn't support arbitrary content | `content: var(--t-anchor-hash);` |
| Complex gradients | Multi-stop gradients with color-mix | `background-image: linear-gradient(...)` |
| `color-mix()` expressions | Not a Tailwind utility | `color-mix(in srgb, var(--theme-accent) var(--t-mix-percent), transparent)` |
| Pseudo-element positioning | Complex ::before/::after geometry | `position: absolute; left: var(--t-anchor-ml);` |
| CSS counters | `counter-increment`, `counter-reset` | Counter-based bibliography |
| `backdrop-filter` with variables | Limited support | `backdrop-filter: blur(var(--t-glass-blur))` |

### Example Output Structure

```css
/* ============================================
   LAYER 1: CSS Variables (from resolved theme)
   ============================================ */
@layer base {
  :root {
    color-scheme: light;
    
    /* User-defined colors (from constants-config.json5) */
    --theme-bg: #f9f9f9;
    --theme-text: #22272a;
    --theme-link: #557b76;
    --theme-accent: #cb2941;
    --theme-accent-2: #111111;
    --theme-quote: #cb2941;
    
    /* Theme tokens (from resolved preset) */
    /* -- Typography -- */
    --t-font-heading: var(--font-sans);
    --t-font-h1: 1.5rem;
    --t-font-h2: 1.25rem;
    --t-font-h3: 1.125rem;
    --t-weight-heading: 600;
    --t-tracking-heading: -0.01em;
    --t-transform-heading: none;
    
    /* -- Spacing -- */
    --t-h1-mt: 2rem;
    --t-h1-mb: 0.25rem;
    --t-h2-mt: 1.5rem;
    --t-h2-mb: 0.25rem;
    --t-h3-mt: 1rem;
    --t-h3-mb: 0.25rem;
    
    /* -- Borders -- */
    --t-radius-sm: 0.125rem;
    --t-radius-md: 0.375rem;
    --t-radius-lg: 0.5rem;
    --t-radius-code: 0.375rem;
    
    /* -- Shadows -- */
    --t-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --t-shadow-card: none;
    
    /* -- Derived Colors -- */
    --t-surface-1: color-mix(in srgb, var(--theme-text) 4%, var(--theme-bg));
    --t-inline-code-bg: #f1f5f9;
    --t-inline-code-text: #9f1239;
    
    /* -- Effects -- */
    --t-scale-hover: 1.05;
    --t-duration-fast: 200ms;
    --t-duration-medium: 300ms;
    
    /* -- Underlines -- */
    --t-underline-style: wavy;
    --t-underline-offset: 2px;
    
    /* -- Visual Patterns -- */
    --t-anchor-hash: "#";
    --t-anchor-ml: -1.5rem;
    
    /* -- Color Mix Percentages -- */
    --t-mix-blockquote-bg: 8%;
    --t-mix-nav-grad-a: 4%;
    --t-mix-nav-grad-b: 10%;
    --t-mix-nav-grad-c: 5%;
    
    /* -- Pinned Indicator -- */
    --t-pinned-color: var(--theme-quote);
    --t-pinned-rotate: 0deg;
    --t-pinned-has-bg: 0; /* 0 = false, 1 = true for CSS calc tricks */
  }

  :root.dark {
    color-scheme: dark;
    --theme-bg: #1c1e20;
    /* ... dark color overrides ... */
    --t-inline-code-bg: #1e293b;
    --t-inline-code-text: #fda4af;
  }
}

/* ============================================
   LAYER 2: Tailwind Theme Mapping
   ============================================ */
@theme {
  /* Fonts */
  --font-sans: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
  --font-serif: var(--font-serif, ui-serif, Georgia, serif);
  --font-mono: var(--font-mono, ui-monospace, monospace);
  
  /* Colors mapped for Tailwind utilities */
  --color-bgColor: var(--theme-bg);
  --color-textColor: var(--theme-text);
  --color-link: var(--theme-link);
  --color-accent: var(--theme-accent);
  --color-accent-2: var(--theme-accent-2);
  --color-quote: var(--theme-quote);
  --color-surface-1: var(--t-surface-1);
  --color-inline-code-bg: var(--t-inline-code-bg);
  --color-inline-code-text: var(--t-inline-code-text);
  
  /* Existing Notion color mappings... */
${colorDefinitions}
}

/* ============================================
   LAYER 3: Component Styles (using @apply)
   ============================================ */
@layer components {
  /* Headings - using @apply with CSS variable references */
  .notion-h1 {
    @apply cursor-pointer;
    margin-top: var(--t-h1-mt);
    margin-bottom: var(--t-h1-mb);
    font-size: var(--t-font-h1);
    font-weight: var(--t-weight-heading);
    letter-spacing: var(--t-tracking-heading);
    text-transform: var(--t-transform-heading);
  }

  .notion-h2 {
    @apply cursor-pointer;
    margin-top: var(--t-h2-mt);
    margin-bottom: var(--t-h2-mb);
    font-size: var(--t-font-h2);
    font-weight: var(--t-weight-heading);
    letter-spacing: var(--t-tracking-heading);
    text-transform: var(--t-transform-heading);
  }

  .notion-h3 {
    @apply cursor-pointer;
    margin-top: var(--t-h3-mt);
    margin-bottom: var(--t-h3-mb);
    font-size: var(--t-font-h3);
    font-weight: var(--t-weight-heading);
    letter-spacing: var(--t-tracking-heading);
    text-transform: var(--t-transform-heading);
  }

  /* Links - @apply for most, raw CSS for decoration-style */
  .site-page-link {
    @apply underline underline-offset-2;
    text-decoration-style: var(--t-underline-style);
    text-decoration-color: color-mix(in srgb, var(--color-accent-2) 40%, transparent);
  }
  .site-page-link:hover {
    text-decoration-color: color-mix(in srgb, var(--color-accent-2) 60%, transparent);
  }

  /* Code blocks - @apply for layout, variables for theme-specific */
  pre {
    @apply p-4 font-mono;
    border-radius: var(--t-radius-code);
  }

  /* Inline code - @apply with mapped colors */
  .annotation-code {
    @apply font-mono px-1 border-none;
    border-radius: var(--t-radius-sm);
  }
  .annotation-code.bg-default {
    background-color: var(--t-inline-code-bg);
  }
  .annotation-code.text-default {
    color: var(--t-inline-code-text);
  }

  /* Cards - @apply for layout, variables for visual */
  .post-card {
    @apply relative overflow-hidden bg-bgColor;
    border-radius: var(--t-radius-lg);
    box-shadow: var(--t-shadow-card);
    transition: box-shadow var(--t-duration-fast), transform var(--t-duration-fast);
  }

  /* Anchor hash - MUST use raw CSS for content */
  .hasId::before {
    content: var(--t-anchor-hash);
    position: absolute;
    margin-left: var(--t-anchor-ml);
    display: inline-block;
    opacity: 0;
    transition: opacity var(--t-duration-medium) ease;
    color: color-mix(in srgb, var(--color-accent) var(--t-mix-anchor-hash), transparent);
  }
  .hasId:hover::before {
    opacity: 1;
  }

  /* Nav highlight - MUST use raw CSS for gradient */
  .nav-link::before {
    content: "";
    position: absolute;
    left: var(--t-nav-highlight-inset-x);
    right: var(--t-nav-highlight-inset-x);
    bottom: var(--t-nav-highlight-bottom);
    height: var(--t-nav-highlight-height);
    border-radius: var(--t-nav-highlight-radius);
    background-image: linear-gradient(
      to right,
      color-mix(in srgb, var(--color-accent) var(--t-mix-nav-grad-a), transparent),
      color-mix(in srgb, var(--color-accent) var(--t-mix-nav-grad-b), transparent) 6%,
      color-mix(in srgb, var(--color-accent) var(--t-mix-nav-grad-c), transparent)
    );
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--t-duration-fast) ease;
    z-index: -1;
  }

  /* Pinned indicator - conditional styling via CSS variables */
  [aria-label="Pinned Post"] {
    @apply me-1 inline-block;
    width: var(--t-pinned-size, 1.5rem);
    height: var(--t-pinned-size, 1.5rem);
    color: var(--t-pinned-color);
    transform: rotate(var(--t-pinned-rotate));
  }
  /* Background circle (when --t-pinned-has-bg is 1) */
  [aria-label="Pinned Post"]::before {
    content: "";
    position: absolute;
    inset: calc(-4px * var(--t-pinned-has-bg));
    background: var(--t-pinned-bg-color, transparent);
    border-radius: var(--t-pinned-bg-radius, 0);
    backdrop-filter: blur(calc(var(--t-pinned-glass-blur, 0px) * var(--t-pinned-has-bg)));
    z-index: -1;
    opacity: var(--t-pinned-has-bg);
  }
}
```

### Comparison: Current vs New

#### Current (Hardcoded)
```css
.notion-h1 {
  @apply mt-8 mb-1 cursor-pointer text-2xl font-semibold;
}
```

#### New (Theme Variables with @apply where possible)
```css
.notion-h1 {
  @apply cursor-pointer;
  margin-top: var(--t-h1-mt);
  margin-bottom: var(--t-h1-mb);
  font-size: var(--t-font-h1);
  font-weight: var(--t-weight-heading);
  letter-spacing: var(--t-tracking-heading);
  text-transform: var(--t-transform-heading);
}
```

The key insight: We keep `@apply cursor-pointer` (behavior, not theme-specific) but move all visual tokens to CSS variables. This maintains the `@apply` pattern while enabling theming.

### Token Categories and Their CSS Output

| Token Category | @apply Usable? | How Emitted |
|----------------|----------------|-------------|
| Layout utilities (`flex`, `block`, etc.) | ✅ Yes | `@apply flex items-center` |
| Fixed behaviors (`cursor-pointer`, `overflow-hidden`) | ✅ Yes | `@apply cursor-pointer` |
| Theme colors | ⚠️ Via mapped var | `@apply bg-bgColor` or `background: var(--t-surface-1)` |
| Theme spacing | ❌ Must use var | `margin-top: var(--t-h1-mt)` |
| Theme radii | ❌ Must use var | `border-radius: var(--t-radius-md)` |
| Theme shadows | ❌ Must use var | `box-shadow: var(--t-shadow-card)` |
| Theme durations | ❌ Must use var | `transition-duration: var(--t-duration-fast)` |
| Theme transforms | ❌ Must use var | `transform: scale(var(--t-scale-hover))` |
| Pseudo content | ❌ Raw CSS only | `content: var(--t-anchor-hash)` |
| Gradients | ❌ Raw CSS only | `background-image: linear-gradient(...)` |
| color-mix() | ❌ Raw CSS only | `color-mix(in srgb, ...)` |

### Ensuring No Component Changes

All component `.astro` files use semantic class names like:
- `.notion-h1`, `.notion-h2`, `.notion-h3`
- `.site-page-link`
- `.post-card`
- `.nav-link`
- `[aria-label="Pinned Post"]`

These classes are styled in `global.css` (generated by `theme-constants-to-css.ts`). 

**Switching presets** only changes:
1. The CSS variable values in `:root`
2. The resulting visual appearance

**Component files remain untouched.**

---

## 6B. Complete Component Styling Audit

This section lists EVERY styled component in `theme-constants-to-css.ts`, categorizing what can use `@apply` vs what needs raw CSS.

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Can use `@apply` |
| ⚠️ | Partially `@apply` (some properties need raw CSS) |
| ❌ | Must use raw CSS |

---

### @layer base

#### `html`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `scroll-smooth` | `@apply scroll-smooth` | ✅ | (behavior, not themed) |
| `font-size: 14px` | raw CSS | ❌ | `--t-font-root` |
| `font-size: 16px` (sm) | raw CSS in @variant | ❌ | `--t-font-root-sm` |

#### `html body`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| Layout | `@apply mx-auto flex min-h-screen flex-col` | ✅ | (layout, not themed) |
| `max-w-3xl` | `@apply max-w-3xl` | ✅ | `--t-layout-max-width` (via @theme) |
| `px-8` | `@apply px-8` | ✅ | `--t-layout-padding-x` |
| `pt-8` | `@apply pt-8` | ✅ | `--t-layout-padding-top` |
| `bg-bgColor` | `@apply bg-bgColor` | ✅ | (uses theme color) |
| `text-textColor` | `@apply text-textColor` | ✅ | (uses theme color) |
| `antialiased` | `@apply antialiased` | ✅ | (behavior) |

#### `*` (all elements)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `scroll-mt-10` | `@apply scroll-mt-10` | ✅ | `--t-scroll-margin-top` |

#### `pre` (code blocks)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-code` |
| `p-4` | `@apply p-4` | ✅ | `--t-code-padding` |
| `font-mono` | `@apply font-mono` | ✅ | (font stack) |

#### Code Diff/Focus/Highlight Lines
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| Layout | `@apply inline-block min-w-full` | ✅ | (layout) |
| Bleed width | `min-w-[calc(100%+2rem)]` | ✅ | `--t-code-line-bleed` |
| Bleed margins | `-ml-8 pl-8 pr-4` | ✅ | `--t-code-line-ml/pl/pr` |
| Marker position | `absolute left-4 w-4` | ✅ | `--t-code-marker-left/width` |
| `content-['-']` | `@apply content-['-']` | ✅ | `--t-code-diff-remove-char` |
| `content-['+']` | `@apply content-['+']` | ✅ | `--t-code-diff-add-char` |
| `content-['x']` | `@apply content-['x']` | ✅ | `--t-code-error-char` |
| `content-['!']` | `@apply content-['!']` | ✅ | `--t-code-warning-char` |
| `bg-red-500/20` | `@apply bg-red-500/20` | ⚠️ | `--t-code-diff-remove-bg` (needs color var) |
| `bg-blue-500/20` | `@apply bg-blue-500/20` | ⚠️ | `--t-code-diff-add-bg` |
| `bg-gray-500/20` | `@apply bg-gray-500/20` | ⚠️ | `--t-code-highlight-bg` |
| `bg-red-500/30` | `@apply bg-red-500/30` | ⚠️ | `--t-code-error-bg` |
| `bg-yellow-500/20` | `@apply bg-yellow-500/20` | ⚠️ | `--t-code-warning-bg` |
| `text-gray-400` | `@apply text-gray-400` | ⚠️ | `--t-code-marker-color` |
| `blur-[1px]` | `@apply blur-[1px]` | ✅ | `--t-code-unfocused-blur` |
| `opacity-50` | `@apply opacity-50` | ✅ | `--t-code-unfocused-opacity` |
| `duration-300` | `@apply duration-300` | ✅ | `--t-duration-medium` |

#### Highlighted Word
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `bg-gray-500/20` | `@apply bg-gray-500/20` | ⚠️ | `--t-code-word-highlight-bg` |
| `rounded` | `@apply rounded` | ✅ | `--t-radius-sm` |
| `px-1 -mx-[2px]` | `@apply px-1 -mx-[2px]` | ✅ | `--t-code-word-px/mx` |

---

### @layer components

#### `.site-page-link` (Content Links)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `underline` | `@apply underline` | ✅ | (base style) |
| `decoration-wavy` | `@apply decoration-wavy` | ⚠️ | `--t-underline-style` (needs arbitrary) |
| `decoration-from-font` | `@apply decoration-from-font` | ✅ | (or `--t-underline-thickness`) |
| `decoration-accent-2/40` | `@apply decoration-accent-2/40` | ✅ | (uses theme color) |
| `hover:decoration-accent-2/60` | `@apply hover:...` | ✅ | `--t-underline-hover-opacity` |
| `underline-offset-2` | `@apply underline-offset-2` | ✅ | `--t-underline-offset` |

#### `.title` (Page Title)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `text-3xl` | `@apply text-3xl` | ✅ | `--t-font-title` |
| `font-bold` | `@apply font-bold` | ✅ | `--t-weight-title` |
| `text-accent-2` | `@apply text-accent-2` | ✅ | (uses theme color) |

#### `.notion-h1`, `.notion-h2`, `.notion-h3` (Headings)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `mt-8/6/4` | `@apply mt-8` | ✅ | `--t-h1/h2/h3-mt` |
| `mb-1` | `@apply mb-1` | ✅ | `--t-h1/h2/h3-mb` |
| `cursor-pointer` | `@apply cursor-pointer` | ✅ | (behavior) |
| `text-2xl/xl/lg` | `@apply text-2xl` | ✅ | `--t-font-h1/h2/h3` |
| `font-semibold` | `@apply font-semibold` | ✅ | `--t-weight-heading` |
| (missing) letter-spacing | — | ✅ | `--t-tracking-heading` |
| (missing) text-transform | — | ✅ | `--t-transform-heading` |

#### `.notion-text` (Paragraphs)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `my-1` | `@apply my-1` | ✅ | `--t-text-my` |
| `min-h-7` | `@apply min-h-7` | ✅ | `--t-text-min-height` |

#### `.notion-list-ul`, `.notion-list-ol` (Lists)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `list-outside list-disc` | `@apply list-outside list-disc` | ✅ | (style) |
| `space-y-1` | `@apply space-y-1` | ✅ | `--t-list-gap` |
| `pl-6` | `@apply pl-6` | ✅ | `--t-list-pl` |

#### `.notion-list-item-colored`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `rounded-sm` | `@apply rounded-sm` | ✅ | `--t-radius-sm` |
| `px-1` | `@apply px-1` | ✅ | `--t-list-item-px` |

#### `.notion-column-list` (Columns)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| Layout | `@apply mx-auto block w-full flex-wrap sm:flex md:flex-nowrap` | ✅ | (layout) |
| `my-4` | `@apply my-4` | ✅ | `--t-column-my` |
| `gap-x-4` | `@apply gap-x-4` | ✅ | `--t-column-gap` |
| `basis-44` | `@apply basis-44` | ✅ | `--t-column-basis` |

#### `.divider`, `.notion-divider` (Dividers)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `bg-accent/30` or `bg-accent-2/10` | `@apply bg-accent/30` | ✅ | `--t-divider-opacity` |
| `my-4` | `@apply my-4` | ✅ | `--t-divider-my` |
| `h-0.5` | `@apply h-0.5` | ✅ | `--t-divider-height` |
| `rounded-sm` | `@apply rounded-sm` | ✅ | `--t-radius-sm` |
| `border-none` | `@apply border-none` | ✅ | (style) |

#### `.ntable` (Tables)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| Layout | `@apply relative max-w-full table-auto overflow-x-auto` | ✅ | (layout) |
| `pb-2` | `@apply pb-2` | ✅ | `--t-table-pb` |
| `text-sm` | `@apply text-sm` | ✅ | `--t-table-font-size` |
| `text-textColor/90` | `@apply text-textColor/90` | ✅ | (theme color) |

#### `.ntable th` (Table Headers)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `bg-ngray-table-header-bg-light` | `@apply bg-ngray-table-header-bg-light` | ✅ | (Notion color) |
| `p-2` | `@apply p-2` | ✅ | `--t-table-cell-padding` |
| `text-xs` | `@apply text-xs` | ✅ | `--t-table-header-font-size` |
| `font-semibold` | `@apply font-semibold` | ✅ | `--t-table-header-weight` |
| `uppercase` | `@apply uppercase` | ✅ | `--t-table-header-transform` |
| `border-b border-gray-200/90` | `@apply border-b border-gray-200/90` | ⚠️ | `--t-table-border-color` |

#### `.ntable td`, `.ntable tr`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `p-2` | `@apply p-2` | ✅ | `--t-table-cell-padding` |
| `border-b border-gray-200/90` | `@apply border-b border-gray-200/90` | ⚠️ | `--t-table-border-color` |

#### `.bookmark-card` (Bookmark Cards)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| Layout | `@apply flex w-full grow items-stretch overflow-hidden` | ✅ | (layout) |
| `rounded-sm` | `@apply rounded-sm` | ✅ | `--t-radius-bookmark` |
| `border border-gray-200` | `@apply border border-gray-200` | ⚠️ | `--t-bookmark-border-color` |
| `dark:border-gray-800` | `@apply dark:border-gray-800` | ⚠️ | `--t-bookmark-border-color-dark` |
| `no-underline select-none` | `@apply no-underline select-none` | ✅ | (behavior) |

#### `.bookmark-text`, `.bookmark-title`, `.bookmark-description`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `text-textColor/90` | `@apply text-textColor/90` | ✅ | (theme color) |
| `p-3` | `@apply p-3` | ✅ | `--t-bookmark-padding` |
| `h-6` | `@apply h-6` | ✅ | `--t-bookmark-title-height` |
| `mb-0.5` | `@apply mb-0.5` | ✅ | `--t-bookmark-title-mb` |
| `leading-5` | `@apply leading-5` | ✅ | `--t-bookmark-title-lh` |
| `h-8` | `@apply h-8` | ✅ | `--t-bookmark-desc-height` |
| `text-xs` | `@apply text-xs` | ✅ | `--t-bookmark-meta-font-size` |
| `leading-4` | `@apply leading-4` | ✅ | `--t-bookmark-meta-lh` |
| `opacity-80` | `@apply opacity-80` | ✅ | `--t-bookmark-desc-opacity` |

#### `.nquote` (Blockquotes)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `my-4` | `@apply my-4` | ✅ | `--t-blockquote-my` |
| `border-s-4` | `@apply border-s-4` | ✅ | `--t-blockquote-border-width` |
| `border-gray-600 dark:border-gray-300` | `@apply border-gray-600 dark:border-gray-300` | ⚠️ | `--t-blockquote-border-color` |
| `px-2!` | `@apply px-2!` | ✅ | `--t-blockquote-px` |

#### `.callout` (Callouts)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| Layout | `@apply mx-auto flex w-full max-w-full` | ✅ | (layout) |
| `my-2` | `@apply my-2` | ✅ | `--t-callout-my` |
| `rounded` | `@apply rounded` | ✅ | `--t-radius-callout` |
| `px-3 py-4` | `@apply px-3 py-4` | ✅ | `--t-callout-px/py` |
| `leading-6` | `@apply leading-6` | ✅ | `--t-callout-lh` |
| `mr-2` (icon) | `@apply mr-2` | ✅ | `--t-callout-icon-mr` |

#### `.toggle`, `.toggle-summary`, `.toggle-heading-*`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `my-1` | `@apply my-1` | ✅ | `--t-toggle-my` |
| `gap-2` | `@apply gap-2` | ✅ | `--t-toggle-gap` |
| `cursor-pointer list-none` | `@apply cursor-pointer list-none` | ✅ | (behavior) |
| `rotate-90` (open) | `@apply rotate-90` | ✅ | `--t-toggle-rotate` |
| `mt-8/6/4 mb-0/1` | `@apply mt-8 mb-0` | ✅ | `--t-toggle-h1/h2/h3-mt/mb` |

#### `.to-do`, `.todo-*` (Todos)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `pl-2` | `@apply pl-2` | ✅ | `--t-todo-pl` |
| `leading-7` | `@apply leading-7` | ✅ | `--t-todo-lh` |
| `gap-2` | `@apply gap-2` | ✅ | `--t-todo-gap` |
| `mt-1 pr-2` | `@apply mt-1 pr-2` | ✅ | `--t-todo-checkbox-mt/pr` |
| `h-5 w-5` | `@apply h-5 w-5` | ✅ | `--t-todo-checkbox-size` |
| `text-textColor/50` | `@apply text-textColor/50` | ✅ | `--t-todo-checkbox-opacity` |

#### `.notion-tag` (Tags)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `inline-block` | `@apply inline-block` | ✅ | (layout) |
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-tag` |
| `px-1` | `@apply px-1` | ✅ | `--t-tag-px` |
| `text-sm` | `@apply text-sm` | ✅ | `--t-tag-font-size` |

#### `.count-badge` (Count Badges)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `ml-2` | `@apply ml-2` | ✅ | `--t-badge-ml` |
| `rounded-sm` | `@apply rounded-sm` | ✅ | `--t-radius-badge` |
| `bg-gray-100 dark:bg-gray-800` | `@apply bg-gray-100 dark:bg-gray-800` | ⚠️ | `--t-badge-bg` |
| `px-2 py-0.5` | `@apply px-2 py-0.5` | ✅ | `--t-badge-px/py` |
| `text-rose-800 dark:text-rose-300` | `@apply text-rose-800 dark:text-rose-300` | ⚠️ | `--t-badge-text-color` |

#### `.notion-image`, `.notion-image-figure`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `mt-1` | `@apply mt-1` | ✅ | `--t-image-mt` |
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-image` |

#### `.notion-file-container`, `.notion-file-link`, `.notion-file-preview`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `rounded-lg` | `@apply rounded-lg` | ✅ | `--t-radius-file` |
| `border-accent-2/20` | `@apply border-accent-2/20` | ✅ | (theme color) |
| `p-1` | `@apply p-1` | ✅ | `--t-file-padding` |
| `decoration-wavy` | `@apply decoration-wavy` | ⚠️ | `--t-underline-style` |
| `ml-2` | `@apply ml-2` | ✅ | `--t-file-preview-ml` |
| `text-sm` | `@apply text-sm` | ✅ | `--t-file-font-size` |

#### `.toc-container`, `.toc-content`, `.visual-container`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| Position | `@apply fixed right-4` | ✅ | `--t-toc-right` |
| Bottom (dynamic) | `${tocContainerBottom}` | ❌ | Keep dynamic |
| `sm:top-40` | `@apply sm:top-40` | ✅ | `--t-toc-top-sm` |
| `z-10` | `@apply z-10` | ✅ | (behavior) |
| `top-6 right-0 w-8 p-2 space-y-2` | `@apply top-6 right-0 w-8 p-2 space-y-2` | ✅ | `--t-toc-visual-*` |
| `duration-500` | `@apply duration-500` | ✅ | `--t-duration-slow` |
| `rounded-xl` | `@apply rounded-xl` | ✅ | `--t-radius-toc` |
| `border-accent/10` | `@apply border-accent/10` | ✅ | (theme color) |
| `shadow-xl shadow-accent/5` | `@apply shadow-xl shadow-accent/5` | ⚠️ | `--t-shadow-toc` |
| `w-76` | `@apply w-76` | ✅ | `--t-toc-width` |
| `max-h-[55vh]` | `@apply max-h-[55vh]` | ✅ | `--t-toc-max-height` |
| `p-2` | `@apply p-2` | ✅ | `--t-toc-padding` |
| `duration-200` | `@apply duration-200` | ✅ | `--t-duration-fast` |

#### `.bottom-toc-button`, `.to-top-btn`, `.copy-markdown-btn` (FABs)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `h-10 w-10` | `@apply h-10 w-10` | ✅ | `--t-fab-size` |
| `sm:h-12 sm:w-12` | `@apply sm:h-12 sm:w-12` | ✅ | `--t-fab-size-sm` |
| `rounded-full` | `@apply rounded-full` | ✅ | `--t-radius-fab` |
| `text-3xl` | `@apply text-3xl` | ✅ | `--t-fab-icon-size` |
| `duration-300` | `@apply duration-300` | ✅ | `--t-duration-medium` |
| `translate-y-28` | `@apply translate-y-28` | ✅ | `--t-fab-hidden-translate` |
| `shadow-lg` | `@apply shadow-lg` | ✅ | `--t-shadow-fab` |
| `backdrop-blur-md` | `@apply backdrop-blur-md` | ✅ | `--t-fab-backdrop-blur` |
| `color-mix bg/border/color` | raw CSS | ❌ | `--t-fab-bg/border/text-mix` |
| `opacity: 0.75` (svg) | raw CSS | ❌ | `--t-fab-icon-opacity` |
| Success border | `@apply border-green-500/60` | ⚠️ | `--t-color-success-border` |
| Error border | `@apply border-red-500/50` | ⚠️ | `--t-color-error-border` |

#### `.social-link` (Social Links)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `inline-block` | `@apply inline-block` | ✅ | (layout) |
| `p-1` | `@apply p-1` | ✅ | `--t-social-padding` |
| `sm:hover:text-link` | `@apply sm:hover:text-link` | ✅ | (theme color) |

#### `a[aria-label="Visit external site"]` (External Badge)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `border-quote/60` | `@apply border-quote/60` | ✅ | (theme color) |
| `text-quote` | `@apply text-quote` | ✅ | (theme color) |
| `mr-2` | `@apply mr-2` | ✅ | `--t-external-badge-mr` |
| `rounded` | `@apply rounded` | ✅ | `--t-radius-external-badge` |
| `px-2 py-[2px]` | `@apply px-2 py-[2px]` | ✅ | `--t-external-badge-px/py` |
| `text-[11px]` | `@apply text-[11px]` | ✅ | `--t-external-badge-font-size` |
| `font-semibold` | `@apply font-semibold` | ✅ | `--t-external-badge-weight` |
| `tracking-wider` | `@apply tracking-wider` | ✅ | `--t-external-badge-tracking` |
| `uppercase` | `@apply uppercase` | ✅ | `--t-external-badge-transform` |

#### `[aria-label="Pinned Post"]` (Pinned Indicator)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `me-1` | `@apply me-1` | ✅ | `--t-pinned-mr` |
| `inline-block` | `@apply inline-block` | ✅ | (layout) |
| `h-6 w-6` | `@apply h-6 w-6` | ✅ | `--t-pinned-size` |
| (missing) color | — | ⚠️ | `--t-pinned-color` |
| (missing) rotate | — | ❌ | `--t-pinned-rotate` |
| (missing) background | — | ❌ | `--t-pinned-bg-*` |

#### `.theme-toggle-btn`, `.theme-icon`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `h-10 w-10` | `@apply h-10 w-10` | ✅ | `--t-theme-btn-size` |
| `hover:text-accent` | `@apply hover:text-accent` | ✅ | (theme color) |
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-theme-btn` |
| `p-2` | `@apply p-2` | ✅ | `--t-theme-btn-padding` |
| `h-7 w-7` (icon) | `@apply h-7 w-7` | ✅ | `--t-theme-icon-size` |
| Transform/opacity | `@apply scale-0 opacity-0` | ✅ | (behavior) |

#### `.anchor-link-dashed` (Annotation Links)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `text-link` | `@apply text-link` | ✅ | (theme color) |
| `decoration-accent-2/40` | `@apply decoration-accent-2/40` | ✅ | (theme color) |
| `decoration-dashed` | `@apply decoration-dashed` | ⚠️ | `--t-annotation-underline-style` |
| `underline-offset-2` | `@apply underline-offset-2` | ✅ | `--t-underline-offset` |

#### `.ann-bg-c` (Annotation Background)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `background-color: var(--abc)` | raw CSS | ❌ | (dynamic per annotation) |
| `rounded-sm px-1` | `@apply rounded-sm px-1` | ✅ | `--t-annotation-radius/px` |

#### `.annotation-strikethrough`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `line-through` | `@apply line-through` | ✅ | (style) |
| `decoration-slate-500/50` | `@apply decoration-slate-500/50` | ⚠️ | `--t-strikethrough-color` |

#### `.author-name-link` (Author Links)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `text-link` | `@apply text-link` | ✅ | (theme color) |
| `decoration-wavy` | `@apply decoration-wavy` | ⚠️ | `--t-underline-style` |
| `decoration-accent-2/40` | `@apply decoration-accent-2/40` | ✅ | (theme color) |
| `hover:decoration-accent-2/80` | `@apply hover:decoration-accent-2/80` | ✅ | (theme color) |
| `underline-offset-2` | `@apply underline-offset-2` | ✅ | `--t-underline-offset` |

#### `.author-icon-link`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `hover:scale-110` | `@apply hover:scale-110` | ✅ | `--t-icon-hover-scale` |
| `hover:text-accent` | `@apply hover:text-accent` | ✅ | (theme color) |

#### `.annotation-code` (Inline Code)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `rounded-sm` | `@apply rounded-sm` | ✅ | `--t-radius-inline-code` |
| `border-none` | `@apply border-none` | ✅ | (style) |
| `px-1` | `@apply px-1` | ✅ | `--t-inline-code-px` |
| `font-mono` | `@apply font-mono` | ✅ | (font stack) |
| `bg-gray-100 dark:bg-gray-800` | `@apply bg-gray-100 dark:bg-gray-800` | ⚠️ | `--t-inline-code-bg` |
| `text-rose-800 dark:text-rose-300` | `@apply text-rose-800 dark:text-rose-300` | ⚠️ | `--t-inline-code-text` |

#### `#auto-recent-posts`, `.non-toggle-h2`, `.hasId` (Anchor Hash)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `relative` | `@apply relative` | ✅ | (layout) |
| `mt-8 mb-4` | `@apply mt-8 mb-4` | ✅ | `--t-section-header-mt/mb` |
| `cursor-pointer` | `@apply cursor-pointer` | ✅ | (behavior) |
| `text-2xl` | `@apply text-2xl` | ✅ | `--t-section-header-font-size` |
| `font-normal` | `@apply font-normal` | ✅ | `--t-section-header-weight` |
| `content: "#"` | raw CSS | ❌ | `--t-anchor-hash` |
| `position: absolute` | raw CSS | ❌ | (pseudo-element) |
| `color-mix(... 50%)` | raw CSS | ❌ | `--t-anchor-hash-mix` |
| `margin-left: -1.5rem` | raw CSS | ❌ | `--t-anchor-hash-ml` |
| `margin-left: -2.5rem` (toggle) | raw CSS | ❌ | `--t-anchor-hash-ml-toggle` |
| `opacity: 0/1` | raw CSS | ❌ | `--t-anchor-hash-opacity-hidden/shown` |
| `transition: opacity 0.3s ease` | raw CSS | ❌ | `--t-anchor-hash-transition` |

#### `.auto-imported-section` (Section Dividers)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `mt-12` | `@apply mt-12` | ✅ | `--t-section-mt` |
| `bg-accent/30` | `@apply bg-accent/30` | ✅ | (theme color) |
| `h-0.5` | `@apply h-0.5` | ✅ | `--t-divider-height` |
| `rounded-sm` | `@apply rounded-sm` | ✅ | `--t-radius-sm` |

#### `.pagination-nav` (Pagination)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `mt-8` | `@apply mt-8` | ✅ | `--t-pagination-mt` |
| Layout | `@apply flex items-center gap-x-4` | ✅ | (layout) |
| `text-link` | `@apply text-link` | ✅ | (theme color) |
| `py-2` | `@apply py-2` | ✅ | `--t-pagination-link-py` |
| `hover:underline-offset-4` | `@apply hover:underline-offset-4` | ✅ | `--t-underline-offset-hover` |

#### `.footnote-*`, `.bibliography-*` (Footnotes/Bibliography)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `list-none` | `@apply list-none` | ✅ | (style) |
| `gap-2` | `@apply gap-2` | ✅ | `--t-footnote-gap` |
| `text-accent-2/60` | `@apply text-accent-2/60` | ✅ | (theme color) |
| `font-mono text-sm` | `@apply font-mono text-sm` | ✅ | `--t-footnote-marker-font-size` |
| `space-y-2` | `@apply space-y-2` | ✅ | `--t-bibliography-gap` |
| `bg-accent/10 hover:bg-accent/20` | `@apply bg-accent/10 hover:bg-accent/20` | ✅ | (theme color) |
| `w-4 h-4 rounded-full` | `@apply w-4 h-4 rounded-full` | ✅ | `--t-citation-back-btn-size/radius` |
| `duration-200` | `@apply duration-200` | ✅ | `--t-duration-fast` |
| `counter-reset/increment` | raw CSS | ❌ | (CSS counters) |
| `content: "[" counter(...) "] "` | raw CSS | ❌ | (CSS counters) |
| `font-family: monospace` | raw CSS | ❌ | `--t-bibliography-counter-font` |
| `margin-right: 0.5rem` | raw CSS | ❌ | `--t-bibliography-counter-mr` |

#### `.site-header`, `.nav-menu`, `.nav-link` (Navigation)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `mb-8` | `@apply mb-8` | ✅ | `--t-header-mb` |
| Layout | `@apply relative flex w-full items-center justify-between` | ✅ | (layout) |
| `sm:ps-[4.5rem]` | `@apply sm:ps-[4.5rem]` | ✅ | `--t-header-padding-start-sm` |
| `lg:-ml-[25%] lg:w-[150%]` | `@apply lg:-ml-[25%] lg:w-[150%]` | ✅ | `--t-layout-bleed` |
| `bg-bgColor/90` | `@apply bg-bgColor/90` | ✅ | `--t-nav-bg-opacity` |
| `text-accent` | `@apply text-accent` | ✅ | (theme color) |
| `-inset-x-4 top-14` | `@apply -inset-x-4 top-14` | ✅ | `--t-nav-dropdown-inset/top` |
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-nav-dropdown` |
| `py-2` | `@apply py-2` | ✅ | `--t-nav-dropdown-py` |
| `shadow-sm backdrop-blur-sm` | `@apply shadow-sm backdrop-blur-sm` | ✅ | `--t-nav-shadow/blur` |
| `text-base sm:text-sm lg:text-base` | `@apply text-base sm:text-sm lg:text-base` | ✅ | `--t-nav-font-size` |
| `gap-y-3 lg:gap-x-4` | `@apply gap-y-3 lg:gap-x-4` | ✅ | `--t-nav-gap-y/gap-x` |
| `px-3 py-1` | `@apply px-3 py-1` | ✅ | `--t-nav-link-px/py` |

#### `.nav-link::before` (Nav Highlight - ALL RAW CSS)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `content: ""` | raw CSS | ❌ | (pseudo) |
| `position: absolute` | raw CSS | ❌ | (pseudo) |
| `left/right: 0.08em` | raw CSS | ❌ | `--t-nav-highlight-inset-x` |
| `bottom: 0` | raw CSS | ❌ | `--t-nav-highlight-bottom` |
| `height: 0.42em` | raw CSS | ❌ | `--t-nav-highlight-height` |
| `border-radius: 0.4em 0.2em` | raw CSS | ❌ | `--t-nav-highlight-radius` |
| `background-image: linear-gradient(...)` | raw CSS | ❌ | `--t-mix-nav-grad-a/b/c` |
| `transform: scaleX(0)` | raw CSS | ❌ | (animation) |
| `transform-origin: left` | raw CSS | ❌ | (animation) |
| `transition: transform 200ms ease` | raw CSS | ❌ | `--t-duration-fast` |
| Active `height: 0.62em` | raw CSS | ❌ | `--t-nav-highlight-height-active` |
| Active gradient (accent-2) | raw CSS | ❌ | `--t-mix-nav-active-a/b/c` |
| Dark mode gradients | raw CSS | ❌ | `--t-mix-nav-grad-dark-a/b/c` |

#### `.site-footer`, `.footer-nav`, `.footer-link` (Footer)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `text-accent` | `@apply text-accent` | ✅ | (theme color) |
| `mt-auto` | `@apply mt-auto` | ✅ | (layout) |
| `pt-20 pb-4` | `@apply pt-20 pb-4` | ✅ | `--t-footer-pt/pb` |
| `text-sm` | `@apply text-sm` | ✅ | `--t-footer-font-size` |
| `gap-x-2` | `@apply gap-x-2` | ✅ | `--t-footer-gap` |
| `border-t-2 border-b-2 border-gray-200 dark:border-gray-700` | `@apply border-t-2 border-b-2 border-gray-200 dark:border-gray-700` | ⚠️ | `--t-footer-border-width/color` |
| `px-4 py-2 sm:px-2 sm:py-0` | `@apply px-4 py-2 sm:px-2 sm:py-0` | ✅ | `--t-footer-link-px/py` |
| `text-accent/45` (separator) | `@apply text-accent/45` | ✅ | `--t-footer-separator-opacity` |

#### `.footer-link::before` (Footer Highlight - ALL RAW CSS)
Same as `.nav-link::before` with different values for height/bottom.

#### `.search-btn` (Search Button)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `hover:text-accent` | `@apply hover:text-accent` | ✅ | (theme color) |
| Layout | `@apply flex h-10 w-10 cursor-pointer items-center justify-center` | ✅ | `--t-search-btn-size` |
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-search-btn` |

#### `.search-dialog` (Search Dialog)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `bg-bgColor/80` | `@apply bg-bgColor/80` | ✅ | `--t-search-dialog-bg-opacity` |
| `border border-zinc-400` | `@apply border border-zinc-400` | ⚠️ | `--t-search-dialog-border-color` |
| `shadow-sm` | `@apply shadow-sm` | ✅ | `--t-shadow-search-dialog` |
| `backdrop:backdrop-blur-sm` | `@apply backdrop:backdrop-blur-sm` | ✅ | `--t-search-dialog-backdrop-blur` |
| `sm:mt-16` | `@apply sm:mt-16` | ✅ | `--t-search-dialog-mt-sm` |
| `sm:max-h-[calc(100%-8rem)]` | `@apply sm:max-h-[calc(100%-8rem)]` | ✅ | `--t-search-dialog-max-height` |
| `sm:min-h-[15rem]` | `@apply sm:min-h-[15rem]` | ✅ | `--t-search-dialog-min-height` |
| `sm:w-5/6 sm:max-w-[48rem]` | `@apply sm:w-5/6 sm:max-w-[48rem]` | ✅ | `--t-search-dialog-width/max-width` |
| `sm:rounded-lg` | `@apply sm:rounded-lg` | ✅ | `--t-radius-search-dialog` |

#### `.search-frame`, `.search-close-btn`
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `gap-4` | `@apply gap-4` | ✅ | `--t-search-frame-gap` |
| `p-6 pt-12 sm:pt-6` | `@apply p-6 pt-12 sm:pt-6` | ✅ | `--t-search-frame-padding` |
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-search-close-btn` |
| `bg-zinc-200 dark:bg-zinc-700` | `@apply bg-zinc-200 dark:bg-zinc-700` | ⚠️ | `--t-search-close-btn-bg` |
| `p-2` | `@apply p-2` | ✅ | `--t-search-close-btn-padding` |
| `font-semibold` | `@apply font-semibold` | ✅ | `--t-search-close-btn-weight` |

#### `.code-iframe`, `.code .mermaid` (Rendered Code)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `h-[340px]` | `@apply h-[340px]` | ✅ | `--t-code-iframe-height` |
| `rounded-lg` | `@apply rounded-lg` | ✅ | `--t-radius-code-iframe` |
| `rounded-sm` | `@apply rounded-sm` | ✅ | `--t-radius-mermaid` |
| `p-4` | `@apply p-4` | ✅ | `--t-mermaid-padding` |

#### `.mdx-notion *` (MDX Content)
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `font-bold` | `@apply font-bold` | ✅ | `--t-mdx-heading-weight` |
| `text-textColor` | `@apply text-textColor` | ✅ | (theme color) |
| `tracking-[-0.01em]` | `@apply tracking-[-0.01em]` | ✅ | `--t-mdx-heading-tracking` |
| `mt-5 mb-3` | `@apply mt-5 mb-3` | ✅ | `--t-mdx-heading-mt/mb` |
| `font-size: clamp(...)` | raw CSS | ❌ | `--t-mdx-h1/h2/h3-font-size` |
| `line-height: 1.2/1.25/1.3` | raw CSS | ❌ | `--t-mdx-h1/h2/h3-lh` |
| `mb-[0.9rem]` | `@apply mb-[0.9rem]` | ✅ | `--t-mdx-p-mb` |
| `text-base leading-[1.75]` | `@apply text-base leading-[1.75]` | ✅ | `--t-mdx-p-font-size/lh` |
| List margins | `@apply my-[0.2rem] mb-[1rem] ms-[1.25rem] ps-[1.25rem]` | ✅ | `--t-mdx-list-*` |
| `leading-[1.65]` | `@apply leading-[1.65]` | ✅ | `--t-mdx-list-lh` |
| Blockquote `my-[1.1rem] px-4 py-3 rounded-r-lg` | `@apply ...` | ✅ | `--t-mdx-blockquote-*` |
| `border-left: 4px solid var(--theme-quote)` | raw CSS | ❌ | `--t-mdx-blockquote-border` |
| `background-color: color-mix(... 8%)` | raw CSS | ❌ | `--t-mix-blockquote-bg` |
| Inline code `bg-gray-100 text-rose-800` | `@apply bg-gray-100 text-rose-800` | ⚠️ | `--t-inline-code-bg/text` |
| `text-[0.95rem]` | `@apply text-[0.95rem]` | ✅ | `--t-mdx-inline-code-font-size` |
| `py-[0.15rem]` | `@apply py-[0.15rem]` | ✅ | `--t-mdx-inline-code-py` |
| Code block `rounded-2xl` | `@apply rounded-2xl` | ✅ | `--t-mdx-code-block-radius` |
| Link `decoration-wavy decoration-1 underline-offset-[3px]` | `@apply ...` | ⚠️ | `--t-underline-*` |
| `duration-200` | `@apply duration-200` | ✅ | `--t-duration-fast` |

#### Pagefind Overrides
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `--pagefind-ui-font: inherit` | raw CSS | ❌ | (inherit) |
| `--pagefind-ui-primary` etc | raw CSS | ❌ | (uses theme vars) |
| `width: calc(60px * ...)` | raw CSS | ❌ | `--t-pagefind-clear-width` |
| `outline: 1px solid` | raw CSS | ❌ | `--t-focus-outline` |
| Mask/background for icons | raw CSS | ❌ | (SVG mask) |
| `p-3 border-0` | `@apply p-3 border-0` | ✅ | `--t-pagefind-result-padding` |
| `background-size: 100% 6px` | raw CSS | ❌ | `--t-pagefind-underline-height` |
| `background-image: linear-gradient(...)` | raw CSS | ❌ | (underline effect) |
| `text-quote bg-transparent font-semibold` | `@apply text-quote bg-transparent font-semibold` | ✅ | (theme color) |

#### Gallery & Cards
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | `@apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | ✅ | (layout) |
| `gap-6` | `@apply gap-6` | ✅ | `--t-gallery-gap` |
| `rounded-lg` | `@apply rounded-lg` | ✅ | `--t-radius-card` |
| `duration-200 ease-in-out` | `@apply duration-200 ease-in-out` | ✅ | `--t-duration-fast` |
| `aspect-[3/2]` | `@apply aspect-[3/2]` | ✅ | `--t-card-image-aspect` |
| `border-color: color-mix(... 6%)` | raw CSS | ❌ | `--t-mix-card-image-border` |
| `scale-105` (hover) | `@apply scale-105` | ✅ | `--t-card-image-hover-scale` |
| Placeholder gradient | raw CSS | ❌ | `--t-mix-card-placeholder-a/b` |
| `text-[2.5rem]` | `@apply text-[2.5rem]` | ✅ | `--t-card-placeholder-font-size` |
| `brightness(1.03)` | raw CSS | ❌ | `--t-card-hover-brightness` |

#### Hero/Cover
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `min-h-[150px]` | `@apply min-h-[150px]` | ✅ | `--t-hero-min-height` |
| `rounded-lg` | `@apply rounded-lg` | ✅ | `--t-radius-hero` |
| `mb-4` | `@apply mb-4` | ✅ | `--t-hero-mb` |
| `opacity-40` | `@apply opacity-40` | ✅ | `--t-hero-image-opacity` |
| Tint gradient | raw CSS | ❌ | `--t-mix-hero-tint-top/bottom` |
| `p-6` | `@apply p-6` | ✅ | `--t-hero-padding` |

#### Margin Notes / Popovers
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `max-w-[calc(100vw-10px)]` | `@apply max-w-[calc(100vw-10px)]` | ✅ | `--t-popover-max-width-gutter` |
| `opacity-100 text-textColor` | `@apply opacity-100 text-textColor` | ✅ | (behavior) |
| `background-color: color-mix(... 20%)` | raw CSS | ❌ | `--t-mix-inline-highlight` |
| `rounded px-[2px] -mx-[2px]` | `@apply rounded px-[2px] -mx-[2px]` | ✅ | `--t-margin-note-radius/px/mx` |

#### Datatable
| Property | Current | @apply? | Token |
|----------|---------|---------|-------|
| `rounded-md` | `@apply rounded-md` | ✅ | `--t-radius-datatable-input` |
| `border border-[#ccc]` | `@apply border border-[#ccc]` | ⚠️ | `--t-datatable-input-border-color` |
| `px-[6px] py-[3px]` | `@apply px-[6px] py-[3px]` | ✅ | `--t-datatable-input-px/py` |
| `text-sm` | `@apply text-sm` | ✅ | `--t-datatable-input-font-size` |
| `duration-300 ease-in-out` | `@apply duration-300 ease-in-out` | ✅ | `--t-duration-medium` |
| `border-[#007bff]` (focus) | `@apply border-[#007bff]` | ⚠️ | `--t-datatable-focus-border-color` |
| `ring-[0.2rem] ring-[rgba(0,123,255,0.25)]` | `@apply ring-[0.2rem] ring-[...]` | ⚠️ | `--t-datatable-focus-ring` |
| `text-[20px]` | `@apply text-[20px]` | ✅ | `--t-datatable-filter-icon-size` |
| `px-[10px]` | `@apply px-[10px]` | ✅ | `--t-datatable-filter-toggle-px` |
| `max-h-[50px]` | `@apply max-h-[50px]` | ✅ | `--t-datatable-filterrow-max-height` |
| `border-bottom-color: var(--color-accent)` | raw CSS | ❌ | (uses theme var) |
| `padding: calc(var(--spacing) * 2)` | raw CSS | ❌ | (uses Tailwind var) |
| `opacity: 0.3` (sorter icons) | raw CSS | ❌ | `--t-datatable-sorter-icon-opacity` |
| `border-bottom-color: rgba(...)` | raw CSS | ❌ | `--t-table-border-color` |

---

### Summary: @apply vs Raw CSS

| Category | @apply Count | Raw CSS Count |
|----------|--------------|---------------|
| Layout/Positioning | ~95% | ~5% |
| Spacing (margin/padding) | ~100% | 0% |
| Typography (size/weight) | ~95% | ~5% (clamp values) |
| Colors (theme vars) | ~100% | 0% |
| Colors (hardcoded) | ⚠️ 0% | ⚠️ Need tokenizing |
| Border radius | ~100% | 0% |
| Shadows | ~90% | ~10% |
| Transitions | ~80% | ~20% |
| Pseudo-element content | 0% | 100% |
| Gradients | 0% | 100% |
| color-mix() | 0% | 100% |
| CSS counters | 0% | 100% |
| Transforms (static) | ~80% | ~20% |

---

## 7. Icon System

### Icon Mapping Per Theme

Each theme includes its own `icons` object mapping icon names to SVG paths. This allows themes to use different icon sets (MDI, Lucide, Tabler, Phosphor, etc.).

### Icon Names (Semantic)

These icon names are used throughout the codebase:

| Icon Name | Usage |
|-----------|-------|
| `pin` | Pinned post indicator |
| `tag-outline` | Tag page header |
| `tag-multiple` | Post list header |
| `author` | Author page header |
| `to-top` | Scroll to top button |
| `search` | Search button |
| `menu` | Mobile menu toggle |
| `next` | Pagination next |
| `before` | Pagination previous |
| `external-link` | External link indicator |
| `download` | Download button |
| `rss` | RSS feed link |
| `theme-dark` | Dark mode icon |
| `theme-light` | Light mode icon |
| `theme-system` | System theme icon |
| `checkbox-checked` | Todo checked |
| `checkbox-unchecked` | Todo unchecked |
| `clipboard-copy-code` | Copy code button |
| `clipboard-copy-code-done` | Copy code success |
| `table-of-contents` | TOC button |
| `close` | Close button |
| `filter` | Filter toggle |
| `info` | Info icon |
| `jump` | Jump to element |
| `copy-as-markdown` | Copy markdown button |
| (social icons) | Social links |

### Theme-Specific Icon Sets

| Theme | Icon Set | Style |
|-------|----------|-------|
| Classic | MDI (Material Design Icons) | Filled |
| Scholar | Lucide | Clean, minimal strokes |
| Neobrutal | Tabler | Bold strokes |
| Newspaper | MDI Outline | Outlined |
| Playful | Phosphor | Rounded, friendly |

### Icon Component Usage

The `Icon.astro` component will import the resolved theme and use its icon mapping:

```typescript
// src/components/ui/Icon.astro
import { resolveTheme } from "@/theme";

const theme = resolveTheme();
const path = theme.icons[name] || "";
```

---

## 8. Component Styling Details

### Pinned Post Indicator Variants

#### Classic (Default)
```css
[aria-label="Pinned Post"] {
  color: var(--theme-quote);
}
```

#### Neobrutal (With Background)
```css
[aria-label="Pinned Post"] {
  position: relative;
  color: var(--theme-accent-2);
  transform: rotate(-15deg);
}
[aria-label="Pinned Post"]::before {
  content: "";
  position: absolute;
  inset: -4px;
  background: color-mix(in srgb, var(--theme-accent) 10%, transparent);
  border-radius: 0;
  z-index: -1;
}
```

#### Playful (Glass Effect)
```css
[aria-label="Pinned Post"] {
  position: relative;
  color: var(--theme-accent);
  transform: rotate(15deg);
}
[aria-label="Pinned Post"]::before {
  content: "";
  position: absolute;
  inset: -6px;
  background: color-mix(in srgb, var(--theme-bg) 60%, transparent);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  z-index: -1;
}
```

### Nav Highlight Variants

#### Classic (Gradient)
```css
.nav-link::before {
  background-image: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-accent) 4%, transparent),
    color-mix(in srgb, var(--color-accent) 10%, transparent) 6%,
    color-mix(in srgb, var(--color-accent) 5%, transparent)
  );
  border-radius: 0.4em 0.2em;
  height: 0.42em;
  bottom: 0;
}
```

#### Scholar (Underline)
```css
.nav-link::before {
  background: var(--color-accent);
  height: 2px;
  bottom: 0;
  border-radius: 0;
}
```

#### Neobrutal (Solid Block)
```css
.nav-link::before {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
  height: 0.5em;
  bottom: 0;
  border-radius: 0;
}
```

#### Playful (Pill)
```css
.nav-link::before {
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  border-radius: 9999px;
  inset: 0.25em 0.5em;
  height: auto;
  transform: scaleX(0);
}
.nav-link:hover::before {
  transform: scaleX(1);
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (No Visual Changes)
1. Create `src/theme.ts` with types
2. Create `src/themes/index.ts` with preset map
3. Create `src/themes/classic.ts` matching current styling exactly
4. Wire resolver into CSS generator (no output changes)
5. **Verify**: Generated CSS is byte-for-byte identical

### Phase 2: Emit New CSS Variables
1. Update `theme-constants-to-css.ts` to emit all tokens as CSS vars
2. Keep existing inline values for now
3. **Verify**: No visual changes, new vars appear in CSS

### Phase 3: Refactor Components to Use Variables
1. Replace hardcoded values with CSS variables
2. Start with typography, then spacing, then colors
3. Test each component individually
4. **Verify**: Classic preset looks identical

### Phase 4: Add Icon System
1. Move icon mappings into each theme
2. Update `Icon.astro` to use theme icons
3. **Verify**: Icons render correctly with classic

### Phase 5: Add Remaining Presets
1. Add `scholar.ts`
2. Add `neobrutal.ts`
3. Add `newspaper.ts`
4. Add `playful.ts`
5. Test each thoroughly

### Phase 6: Pinned Indicator Variants
1. Implement CSS for each pinned style
2. Add conditional CSS based on theme
3. Test all variants

### Phase 7: OG Images
1. Update OG image generation to use resolved theme
2. Test with each preset

### Phase 8: Documentation
1. Update README with preset documentation
2. Add visual examples

---

## 10. Testing Checklist

### Per-Preset Visual Tests
- [ ] Page title styling
- [ ] Heading hierarchy (H1-H3)
- [ ] Paragraph and body text
- [ ] Lists (ordered, unordered)
- [ ] Links (underline style)
- [ ] Code blocks (inline and block)
- [ ] Blockquotes
- [ ] Callouts
- [ ] Tables
- [ ] Navigation (hover, active states)
- [ ] Footer (links, styling)
- [ ] Cards (gallery view)
- [ ] Pinned indicator
- [ ] Tags and badges
- [ ] Buttons (FAB, toggle)
- [ ] Search dialog
- [ ] TOC panel
- [ ] Hero background
- [ ] Icons (all icon types)

### Classic Preset Parity
- [ ] Generate CSS with classic preset
- [ ] Diff against current CSS
- [ ] Visual comparison at multiple breakpoints
- [ ] Light and dark mode

### Cross-Preset Tests
- [ ] Switching presets produces distinct visuals
- [ ] No style bleed between presets
- [ ] All interactive states work
- [ ] Responsive behavior maintained

### OG Image Tests
- [ ] Colors match preset
- [ ] Fonts render correctly
- [ ] Works with color overrides

---

## Appendix: Files Summary

### Files to Create

| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `src/theme.ts` | ~300 | Types, resolver, utilities |
| `src/themes/index.ts` | ~50 | Preset map, exports |
| `src/themes/classic.ts` | ~500 | Classic preset (matches current) |
| `src/themes/scholar.ts` | ~500 | Scholar preset |
| `src/themes/neobrutal.ts` | ~500 | Neobrutal preset |
| `src/themes/newspaper.ts` | ~500 | Newspaper preset |
| `src/themes/playful.ts` | ~500 | Playful preset |

### Files to Modify

| File | Changes |
|------|---------|
| `src/integrations/theme-constants-to-css.ts` | Import resolver, emit all tokens as CSS vars, refactor component styles |
| `src/components/ui/Icon.astro` | Use theme icon mapping |
| `src/pages/og-image/[slug].png.ts` | Use resolved theme for colors |
| `constants-config.json5` | Add `accent-font-name` option |
| `src/components/listing-layout/PostPreview.astro` | Remove hardcoded pin fill |
| `src/components/listing-layout/PostPreviewFull.astro` | Remove hardcoded pin fill |
| `src/components/listing-layout/PostCardGallery.astro` | Remove hardcoded pin fill |

### Token Count Summary

| Category | Count |
|----------|-------|
| Derived colors | ~12 |
| Color mix percentages | ~25 |
| Font selection | 4 |
| Font sizes | ~15 |
| Font weights | ~8 |
| Letter spacing | 3 |
| Text transforms | 4 |
| Line heights | ~10 |
| Spacing tokens | ~120+ |
| Border radii | ~12 |
| Border widths/styles | ~6 |
| Shadows | ~7 |
| Effects/blur | 3 |
| Opacity | ~9 |
| Motion/transforms | ~5 |
| Durations | ~6 |
| Easings | 2 |
| Underline | 5 |
| Anchor/hash | 5 |
| Nav highlight | ~12 |
| Pinned indicator | ~12 |
| **Total** | **~280+** |
