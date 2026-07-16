import type { ThemePreset } from "../theme";
import { deepMerge } from "./merge";
import { classicTheme } from "./classic";
import type { ThemeTemplateParams } from "./css-template-types";

// Personality deltas merged onto base.ts: matching selectors replace the base body, new rules are appended. Shared rules belong in base.ts.
export const neobrutalOverride = (params: ThemeTemplateParams): string => `
@layer components {
.ann-bg-c {
    @apply rounded-sm px-1;
    background-color: var(--abc, transparent);
  }
.annotation-underline {
    @apply underline decoration-solid decoration-4 decoration-accent/80 underline-offset-6;
  }
.author-icon-link {
    @apply inline-flex items-center transition-[color,transform] duration-200 ease-out justify-center rounded-none border-2 border-gray-200 p-0.5;
    box-shadow: 2px 2px 0 var(--nb-shadow);
  }
.author-icon-link:hover {
    @apply border-gray-400;
  }
.author-name-link {
    @apply transition-colors border-b-2 border-gray-200 px-1 font-bold uppercase tracking-[0.18em];
  }
.author-name-link:hover {
    @apply bg-accent/20;
  }
.auto-imported-section {
    @apply mt-12 border-t-4 border-accent/20 pt-4;
  }
.bookmark-card {
    @apply flex w-full max-w-full min-w-0 grow items-stretch overflow-hidden border-gray-200 no-underline select-none dark:border-gray-800 rounded-none border-2;
    box-shadow: 6px 6px 0 var(--nb-shadow);
  }
.bottom-toc-button {
    @apply fixed end-4 ${params.bottomTocButtonBottom} z-30 flex h-10 w-10 cursor-pointer items-center justify-center text-3xl transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] sm:hidden print:hidden rounded-none border-2;
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
.bottom-toc-button,
  .to-top-btn,
  .copy-markdown-btn {
    background-color: color-mix(in srgb, var(--color-textColor) 6%, var(--color-bgColor));
    border-color: color-mix(in srgb, var(--color-textColor) 45%, var(--color-bgColor));
    color: color-mix(in srgb, var(--color-textColor) 85%, var(--color-bgColor));
  }
.callout {
    @apply mx-auto flex w-full max-w-full px-3 py-4 leading-6 my-3 rounded-none border-2 border-gray-200;
    box-shadow: 6px 6px 0 var(--nb-shadow);
  }
.copy-markdown-btn {
    @apply inline-flex items-center gap-1 transition disabled:opacity-60 disabled:cursor-not-allowed h-10 w-10 flex justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer backdrop-blur-md print:hidden rounded-none border-2 shadow-none;
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
.count-badge {
    @apply ml-2 bg-gray-100 px-2 py-0.5 text-rose-800 dark:bg-gray-800 dark:text-rose-300 rounded-none border-2 border-gray-200 dark:border-gray-700;
  }
.dark .footer-link::before {
    background-color: color-mix(in srgb, var(--color-accent) 28%, transparent);
    border-color: color-mix(in srgb, var(--color-textColor) 40%, transparent);
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.dark .nav-link::before {
    background-color: color-mix(in srgb, var(--color-accent) 28%, transparent);
    border-color: color-mix(in srgb, var(--color-textColor) 40%, transparent);
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.divider {
    @apply bg-accent/30 mx-auto w-full border-none my-6 h-2 rounded-none;
  }
.footer-link {
    @apply relative z-0 px-4 py-2 sm:px-2 sm:py-0 uppercase tracking-[0.12em] border-2 border-gray-200 bg-bgColor font-sans;
  }
.footer-link::before {
    content: "";
    position: absolute;
    left: -0.2em;
    right: -0.2em;
    bottom: -0.2em;
    height: 0.85em;
    border-radius: 0;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
    background-color: color-mix(in srgb, var(--color-accent) 18%, transparent);
    border: 2px solid color-mix(in srgb, var(--color-textColor) 25%, transparent);
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.footer-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 1.1em;
    background-color: color-mix(in srgb, var(--color-accent-2) 22%, transparent);
    border-color: color-mix(in srgb, var(--color-accent-2) 45%, transparent);
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
.footer-nav {
    @apply flex flex-wrap gap-x-2 border-gray-200 sm:gap-x-2 sm:border-none dark:border-gray-700 print:hidden rounded-none border-t-4 border-b-4;
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
.hasId::before {
    content: "■";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
.mdx-notion h1,
  .mdx-notion h2,
  .mdx-notion h3 {
    @apply font-bold text-textColor tracking-[-0.01em] mt-5 mb-3 font-sans;
  }
.nav-link {
    @apply relative z-0 w-fit self-end text-right sm:w-auto sm:self-auto sm:py-0 sm:text-left px-4 py-2 uppercase tracking-[0.16em] border-2 border-gray-200 bg-bgColor font-sans;
  }
.nav-link::before {
    content: "";
    position: absolute;
    left: -0.2em;
    right: -0.2em;
    bottom: -0.25em;
    height: 0.9em;
    border-radius: 0;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
    background-color: color-mix(in srgb, var(--color-accent) 18%, transparent);
    border: 2px solid color-mix(in srgb, var(--color-textColor) 25%, transparent);
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.nav-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 1.1em;
    background-color: color-mix(in srgb, var(--color-accent-2) 22%, transparent);
    border-color: color-mix(in srgb, var(--color-accent-2) 45%, transparent);
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
.nav-menu {
    @apply bg-bgColor/90 text-accent absolute -inset-x-4 top-14 hidden flex-col items-end py-2 text-base shadow-sm backdrop-blur-sm group-[.menu-open]:z-50 group-[.menu-open]:flex sm:static sm:z-auto sm:-ms-4 sm:mt-1 sm:flex sm:flex-row sm:items-center sm:rounded-none sm:py-0 sm:text-sm sm:shadow-none sm:backdrop-blur-none lg:text-base print:hidden gap-y-3 sm:gap-y-0 lg:gap-x-4 rounded-none border-2 border-gray-200;
    box-shadow: 6px 6px 0 var(--nb-shadow);
  }
.non-toggle-h2 {
    @apply relative mb-4 cursor-pointer text-2xl font-normal uppercase tracking-[0.14em] font-sans;
  }
.non-toggle-h2::before {
    content: "■";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
.notion-divider {
    @apply bg-accent-2/10 mx-auto w-full border-none my-6 h-2 rounded-none;
  }
.notion-h1 {
    @apply cursor-pointer text-2xl mt-10 mb-2 font-black uppercase tracking-[0.14em] border-b-4 border-accent-2/40 pb-2 font-sans;
  }
.notion-h2 {
    @apply cursor-pointer text-xl mt-8 mb-2 font-bold uppercase tracking-[0.12em] border-b-2 border-accent-2/30 pb-1 font-sans;
  }
.notion-h3 {
    @apply cursor-pointer text-lg mt-6 mb-2 font-bold uppercase tracking-[0.1em] border-b-2 border-accent-2/20 pb-1 font-sans;
  }
.notion-list-ol {
    @apply list-outside space-y-2 pl-7;
  }
.notion-list-ul {
    @apply list-outside list-disc space-y-2 pl-7;
  }
.notion-tag {
    @apply inline-block text-sm;
  }
.notion-tag,
  a[aria-label^="View more blogs with the tag"],
  a[aria-label^="View all posts with the tag:"],
  a[data-pagefind-filter="tags"] {
    @apply rounded-none border-2 border-gray-200 px-2 py-0.5 font-bold uppercase tracking-[0.18em];
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.nquote {
    @apply border-gray-600 dark:border-gray-300 my-6 border-s-[6px] px-3! py-2 bg-accent/5;
  }
.search-btn {
    @apply hover:text-accent active:scale-[0.94] flex h-10 w-10 cursor-pointer items-center justify-center transition-[color,transform] duration-150 ease-out rounded-none border-2;
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.search-close-btn {
    @apply ms-auto cursor-pointer rounded-none border-2 bg-zinc-200 p-2 font-semibold dark:bg-zinc-700;
  }
.search-dialog {
    @apply bg-bgColor/90 h-full max-h-full w-full max-w-full border-2 border-zinc-400 shadow-none backdrop:backdrop-blur-sm sm:mx-auto sm:mt-16 sm:mb-auto sm:h-max sm:max-h-[calc(100%-8rem)] sm:min-h-[15rem] sm:w-5/6 sm:max-w-[48rem] sm:rounded-none;
    box-shadow: 8px 8px 0 var(--nb-shadow);
  }
.search-frame {
    @apply flex flex-col gap-4 p-6 pt-12 sm:pt-6;
  }
.site-footer {
    @apply text-accent mt-auto flex w-full flex-col items-center justify-center gap-y-2 pt-20 pb-4 text-center align-top text-sm sm:flex-row sm:justify-between lg:-ml-[25%] lg:w-[150%] border-t-4 border-gray-200;
  }
.site-page-link {
    @apply underline decoration-solid decoration-4 decoration-accent-2/70 hover:decoration-accent-2/90 underline-offset-6 font-bold font-sans;
  }
.theme-toggle-btn {
    @apply hover:text-accent active:scale-[0.94] relative h-10 w-10 cursor-pointer p-2 transition-[color,transform] duration-150 ease-out rounded-none border-2;
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.title {
    @apply text-3xl text-accent-2 font-black uppercase tracking-[0.18em] border-b-4 border-accent-2/60 pb-2 font-sans;
  }
.to-top-btn {
    @apply fixed end-4 ${params.toTopBtnBottom} z-30 flex h-10 w-10 translate-y-28 cursor-pointer items-center justify-center text-3xl opacity-0 transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] data-[show=true]:translate-y-0 data-[show=true]:opacity-100 sm:end-8 sm:bottom-8 sm:h-12 sm:w-12 print:hidden rounded-none border-2;
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
.toc-content {
    @apply border-accent/10 bg-bgColor absolute right-1 bottom-0 max-h-[55vh] w-76 overflow-y-auto p-2 transition-[opacity,transform] duration-200 ease-out sm:top-0 sm:bottom-auto sm:max-h-[68vh] rounded-none border-2;
    box-shadow: 6px 6px 0 var(--nb-shadow);
  }
.toc-content .text-quote\\! {
    @apply border-2 border-gray-200 bg-accent/30 font-bold;
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.toc-content [id^="-tocid--"] {
    @apply rounded-none border-2 border-gray-200 px-2 py-1 font-semibold uppercase tracking-[0.12em] transition-all duration-150;
    box-shadow: 3px 3px 0 var(--nb-shadow);
  }
.toc-content [id^="-tocid--"]:hover {
    @apply bg-accent/20;
  }
.visual-container {
    @apply bg-bgColor absolute top-6 right-0 hidden w-8 flex-col items-end space-y-2 overflow-hidden p-2 transition-opacity duration-200 sm:flex border-2 border-gray-200;
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
.visual-container [id^="-vistocid--"] {
    @apply rounded-none border-none;
    box-shadow: none;
  }
#auto-recent-posts {
    @apply relative mt-8 mb-4 cursor-pointer text-2xl font-normal font-sans;
  }
#auto-recent-posts::before {
    content: "■";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
a[aria-label^="View posts by"] {
    @apply border-b-2 border-gray-200 uppercase tracking-[0.14em];
  }
}
@layer components {
.auto-imported-section > hr {
    @apply mx-auto w-full border-none bg-accent/40 my-6 h-2 rounded-none;
  }
}
@layer components {
a[aria-label^="View all posts with the tag:"] > span {
    @apply rounded-none border-2 border-gray-200 px-1 font-bold uppercase tracking-[0.12em];
  }
}
@layer components {
a[aria-label^="View posts by"] > span {
    @apply rounded-none border-2 border-gray-200 px-2 py-1 font-bold uppercase tracking-[0.18em];
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
}
@layer components {
a[aria-label^="View posts with the tag:"] > span,
  h1.title > span {
    @apply rounded-none border-2 border-gray-200 px-2 py-1 font-bold uppercase tracking-[0.18em];
    box-shadow: 4px 4px 0 var(--nb-shadow);
  }
}
@layer components {
details.toggle[open] > summary > div > .rotate-svg {
    @apply rotate-90;
  }
}
@media (max-width: 640px) {
#webtrotion__search .pagefind-ui__drawer {
      @apply !gap-3;
    }
}
:root {
    --pagefind-ui-font: inherit;
  }
.cover-hero-container {
    @apply grid relative w-full overflow-hidden min-h-[150px] rounded-lg mb-4 isolate;
    grid-template-areas: "stack";
}
.cover-hero-content {
    @apply relative z-10 min-h-[150px] p-6 flex flex-col justify-center;
    grid-area: stack;
}
.cover-hero-image {
    @apply absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none;
    grid-area: stack;
}
.cover-hero-tint {
    @apply absolute inset-0 pointer-events-none;
    grid-area: stack;
    background: linear-gradient( to bottom, color-mix(in srgb, var(--color-bgColor) 70%, transparent), color-mix(in srgb, var(--color-bgColor) 50%, transparent) );
}
.post-card {
    @apply relative overflow-hidden bg-bgColor transition-[box-shadow,transform] duration-200 rounded-none border-2 border-gray-200;
    transition-timing-function: var(--ease-out);
    box-shadow: 6px 6px 0 var(--nb-shadow);
}
.post-card-image {
    @apply h-full w-full object-cover transition-transform duration-300 ease-out rounded-none;
}
.post-card-image-container {
    @apply relative overflow-hidden aspect-[3/2] rounded-none border-2;
    border-color: color-mix(in srgb, var(--color-textColor) 6%, transparent);
}
.post-card-placeholder {
    @apply flex h-full w-full items-center justify-center rounded-none;
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent));
    transition: transform 300ms ease, filter 300ms ease;
}
.post-card-tags {
    @apply flex flex-wrap items-baseline gap-1 px-0 pb-3 pt-2 border-t-2 border-gray-200;
}
.post-card:hover {
    @apply -translate-x-1 -translate-y-1;
    box-shadow: 0 10px 30px -14px color-mix(in srgb, var(--color-textColor) 32%, transparent);
    transform: translateY(-3px);
}
[data-margin-note].highlighted {
    @apply rounded px-[2px] -mx-[2px];
    background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
  /* This prevents the padding from shifting surrounding text */
}
#webtrotion__search {
    --pagefind-ui-primary: var(--color-accent);
    --pagefind-ui-text: var(--color-textColor);
    --pagefind-ui-background: var(--color-bgColor);
    --pagefind-ui-border: var(--color-zinc-400);
    --pagefind-ui-border-width: 1px;
  }
#webtrotion__search .pagefind-ui__result {
    @apply p-3 border-0 overflow-x-hidden;
  }
#webtrotion__search .pagefind-ui__result-link {
    background-size: 100% 6px;
    background-position: bottom;
    background-repeat: repeat-x;
    background-image: linear-gradient(transparent, transparent 5px, var(--color-textColor) 5px, var(--color-textColor));
  }
#webtrotion__search .pagefind-ui__result-link:hover {
    @apply no-underline;
    background-image: linear-gradient(transparent, transparent 4px, var(--color-link) 4px, var(--color-link));
  }
#webtrotion__search .pagefind-ui__search-clear {
    @apply p-0 bg-transparent overflow-hidden;
    width: calc(60px * var(--pagefind-ui-scale));
  }
#webtrotion__search .pagefind-ui__search-clear::before {
    content: "";
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'  %3E%3Cpath d='M6 5v.18L8.82 8h2.4l-.72 1.68l2.1 2.1L14.21 8H20V5H6M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21L18 19.73L3.55 5.27L3.27 5Z'%3E%3C/path%3E%3C/svg%3E") center / 60% no-repeat;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 5v.18L8.82 8h2.4l-.72 1.68l2.1 2.1L14.21 8H20V5H6M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21L18 19.73L3.55 5.27L3.27 5Z'%3E%3C/path%3E%3C/svg%3E") center / 60% no-repeat;
    background-color: var(--color-accent);
    display: block;
    width: 100%;
    height: 100%;
  }
#webtrotion__search .pagefind-ui__search-clear:focus {
    outline: 1px solid var(--color-accent-2);
  }
#webtrotion__search mark {
    @apply text-quote bg-transparent font-semibold;
  }
.footnote-margin-note.highlighted > :first-child > :first-child {
    @apply rounded px-[2px] -mx-[2px];
    background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
    color: var(--color-quote);
  /* Prevents padding from shifting text */
  /* Keep the quote color for the number */
}

/* Post cards */
.post-card {
  @apply relative overflow-hidden bg-bgColor transition-[box-shadow,transform] duration-200 rounded-none border-2 border-textColor/80;
  transition-timing-function: var(--ease-out);
  box-shadow: 5px 5px 0 color-mix(in srgb, var(--color-accent) 45%, transparent);
}
.post-card:hover {
  box-shadow: 7px 7px 0 color-mix(in srgb, var(--color-accent) 60%, transparent);
  transform: translateY(-3px);
}
.post-card-image-container {
  @apply relative overflow-hidden aspect-[3/2] rounded-none border-2 border-textColor/70;
}
.post-card-image {
  @apply h-full w-full object-cover transition-transform duration-300 ease-out rounded-none;
}
.post-card-placeholder {
  @apply flex h-full w-full items-center justify-center rounded-none;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent));
  transition: transform 300ms ease, filter 300ms ease;
}
.post-card-placeholder span {
  @apply text-[2.5rem] font-black;
  color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}
.post-card-badge {
  @apply bg-quote/90 absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-none border-2 border-textColor/80 uppercase tracking-[0.14em] font-bold;
}
.post-card-meta-date {
  @apply text-accent/80 mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] font-bold;
}
.post-card-title {
  @apply mb-1 text-sm leading-snug font-sans font-black uppercase tracking-[0.02em];
}
.post-card-excerpt {
  @apply text-textColor/70 line-clamp-2 block text-xs font-medium not-italic;
}
.post-card-author-link {
  @apply text-textColor/60 hover:text-accent text-[10px] transition-colors uppercase tracking-[0.1em] font-semibold;
}


/* Search modal + results */
html {
  --nb-ink: color-mix(in srgb, var(--color-textColor) 90%, var(--color-bgColor));
  --nb-shadow: color-mix(in srgb, var(--color-textColor) 82%, transparent);
}
html site-search {
  --pf-border-radius: 0;
  --pf-shadow: 6px 6px 0 color-mix(in srgb, var(--color-accent) 55%, transparent);
  --pf-border: color-mix(in srgb, var(--color-textColor) 85%, transparent);
}
html site-search .pf-modal,
html site-search .pf-input,
html site-search .pf-dropdown-menu,
html site-search .pf-dropdown-trigger,
html .webtrotion-search-result-card,
html .webtrotion-search-navigation-link,
html .webtrotion-search-pinned-link,
html .webtrotion-search-subresult-link {
  border-radius: 0 !important;
}


/* Component radius (new astro-v7 components -> theme radius scale) */
html :is(.embed-media-box, .embed-iframe-notion, .embed-iframe-maps, .notion-popover, .notion-image, .notion-file-container, .notion-file-link, .notion-tab-button, .notion-tab-button.is-active, .code-rendered, .code-iframe, .html-frame-lightbox-content .code-iframe, .code .mermaid, .datatable-input, .toc-content) {
    border-radius: 0;
  }
html :is(.notion-list-item-colored, .toggle-colored, .todo-item-colored, .annotation-code, .toc-link, .toc-visual) {
    border-radius: 0;
  }

/* Crisp ink borders on structural containers (derived from the user's text color). */
:is(.callout, .bookmark-card, .post-card, .post-card-image-container, .nav-link,
    .footer-nav, .search-btn, .theme-toggle-btn, .search-close-btn, .count-badge,
    .notion-tag, .author-name-link, .author-icon-link, .bottom-toc-button,
    .to-top-btn, .copy-markdown-btn, .search-dialog, .toc-content, .visual-container,
    .nav-menu, .site-footer, .post-card-tags, .nquote,
    .toc-content [id^="-tocid--"], a[data-pagefind-filter="tags"],
    a[aria-label^="View more blogs with the tag"],
    a[aria-label^="View all posts with the tag:"],
    a[aria-label^="View all posts with the tag:"] > span,
    a[aria-label^="View posts with the tag:"] > span,
    a[aria-label^="View posts by"], a[aria-label^="View posts by"] > span,
    h1.title > span) {
  border-color: var(--nb-ink) !important;
}

/* Code blocks — ink frame + hard offset shadow (border on the clipping scroll box, shadow on outer .code) */
.code {
  box-shadow: 6px 6px 0 var(--nb-shadow);
}
.code-scroll {
  border: 2px solid var(--nb-ink);
  border-radius: 0;
}
.code pre {
  border-radius: 0 !important;
}

/* Tables — ink gridlines + solid header */
.ntable table {
  border: 2px solid var(--nb-ink);
}
.ntable th {
  border-bottom-width: 2px !important;
  border-bottom-color: var(--nb-ink) !important;
  background-color: color-mix(in srgb, var(--color-textColor) 10%, var(--color-bgColor));
}
.ntable tr {
  border-bottom-color: color-mix(in srgb, var(--color-textColor) 28%, transparent) !important;
}
.ntable td:not(:last-child),
.ntable th:not(:last-child) {
  border-right: 1px solid color-mix(in srgb, var(--color-textColor) 18%, transparent);
}

/* Tab block — square, thick ink frame, hard shadow; active tab boxed (transparent border on inactive avoids layout shift) */
.notion-tab-block {
  border-width: 2px !important;
  border-color: var(--nb-ink) !important;
  border-radius: 0 !important;
  box-shadow: 5px 5px 0 var(--nb-shadow);
}
.notion-tab-button {
  border: 2px solid transparent !important;
}
.notion-tab-button.is-active {
  border: 2px solid var(--nb-ink) !important;
  background-color: color-mix(in srgb, var(--color-accent) 22%, var(--color-bgColor)) !important;
  box-shadow: 3px 3px 0 var(--nb-shadow) !important;
}

/* Search filter dropdowns — ink border to match brutalist chrome */
site-search .pf-dropdown-trigger {
  border-width: 2px !important;
  border-color: var(--nb-ink) !important;
}

/* Last-updated badge — square boxed to match brutalist chrome */
.last-updated-badge {
  border-radius: 0 !important;
  border: 2px solid var(--nb-ink);
  box-shadow: 2px 2px 0 var(--nb-shadow);
}
`;

// Neobrutal theme icons - Tabler Bold style with thick strokes, geometric shapes
// Characterized by: 2.5px+ stroke width, chunky appearance, strong geometric forms
// NO inheritance from classicIcons - complete standalone set
const neobrutalIcons = {
	"🗓️": "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V10h14zM5 8V6h14v2z",
	download: "M12 3v12m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2",
	rss: "M4 4a16 16 0 0 1 16 16M4 11a9 9 0 0 1 9 9m-8-1a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
	dblp: "M3.075.002c-.096.013-.154.092-.094.31L4.97 7.73L3.1 8.6s-.56.26-.4.85l2.45 9.159s.16.59.72.33l6.169-2.869l1.3-.61s.52-.24.42-.79l-.01-.06l-1.13-4.22l-.658-2.45l-.672-2.49v-.04s-.16-.59-.84-1L3.5.141s-.265-.16-.425-.139M18.324 5.03a.7.7 0 0 0-.193.06l-5.602 2.6l.862 3.2l1.09 4.08l.01.06c.05.47-.411.79-.411.79l-1.88.87l.5 1.89l.04.1c.07.17.28.6.81.91l6.95 4.269s.68.41.52-.17l-1.981-7.4l1.861-.86s.56-.26.4-.85L18.85 5.42s-.116-.452-.526-.39",
	email: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 0l9 6l9-6",
	github:
		"M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1-.1-1.4-.5-2c2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2a4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6c-.4.5-.5 1-.5 2V21",
	googlescholar:
		"M5.242 13.769L0 9.5L12 0l12 9.5l-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269M12 10a7 7 0 1 0 0 14a7 7 0 0 0 0-14",
	linkedin:
		"M4 4m0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm4 5v6m0-9v.01M12 9v6m0 0c0-2 3-2 3 0v0",
	facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
	twitter:
		"M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6c2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4c-.9-4.2 4-6.6 7-3.8c1.1 0 3-1.2 3-1.2z",
	threads:
		"M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098c1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015c-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164c1.43 1.783 3.631 2.698 6.54 2.717c2.623-.02 4.358-.631 5.8-2.045c1.647-1.613 1.618-3.593 1.09-4.798c-.31-.71-.873-1.3-1.634-1.75c-.192 1.352-.622 2.446-1.284 3.272c-.886 1.102-2.14 1.704-3.73 1.79c-1.202.065-2.361-.218-3.259-.801c-1.063-.689-1.685-1.74-1.752-2.964c-.065-1.19.408-2.285 1.33-3.082c.88-.76 2.119-1.207 3.583-1.291a14 14 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757c-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32l-1.757-1.18c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388q.163.07.321.142c1.49.7 2.58 1.761 3.154 3.07c.797 1.82.871 4.79-1.548 7.158c-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69q-.362 0-.739.021c-1.836.103-2.98.946-2.916 2.143c.067 1.256 1.452 1.839 2.784 1.767c1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221",
	instagram:
		"M4 4m0 4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zm8-2a6 6 0 1 0 0 12a6 6 0 0 0 0-12m0 2a4 4 0 1 1 0 8a4 4 0 0 1 0-8m5-3a1 1 0 1 0 0 2a1 1 0 0 0 0-2",
	mastodon:
		"M20.94 14c-.28 1.41-2.44 2.96-4.97 3.26c-1.31.15-2.6.3-3.97.24c-2.25-.11-4-.54-4-.54v.62c.32 2.22 2.22 2.35 4.03 2.42c1.82.05 3.44-.46 3.44-.46l.08 1.65s-1.28.68-3.55.81c-1.25.07-2.81-.03-4.62-.5c-3.92-1.05-4.6-5.24-4.7-9.5l-.01-3.43c0-4.34 2.83-5.61 2.83-5.61C6.95 2.3 9.41 2 11.97 2h.06c2.56 0 5.02.3 6.47.96c0 0 2.83 1.27 2.83 5.61c0 0 .04 3.21-.39 5.43M18 8.91c0-1.08-.3-1.91-.85-2.56c-.56-.63-1.3-.96-2.23-.96c-1.06 0-1.87.41-2.42 1.23l-.5.88l-.5-.88c-.56-.82-1.36-1.23-2.43-1.23c-.92 0-1.66.33-2.23.96C6.29 7 6 7.83 6 8.91v5.26h2.1V9.06c0-1.06.45-1.62 1.36-1.62c1 0 1.5.65 1.5 1.93v2.79h2.07V9.37c0-1.28.5-1.93 1.51-1.93c.9 0 1.35.56 1.35 1.62v5.11H18z",
	semanticscholar:
		"M24 8.609c-.848.536-1.436.83-2.146 1.245c-4.152 2.509-8.15 5.295-11.247 8.981l-1.488 1.817l-4.568-7.268c1.021.814 3.564 3.098 4.603 3.599l3.356-2.526c2.336-1.644 8.946-5.226 11.49-5.848M8.046 15.201c.346.277.692.537.969.744c.761-3.668.121-7.613-1.886-11.039c3.374-.052 6.731-.087 10.105-.139a14.8 14.8 0 0 1 1.298 5.295c.294-.156.588-.294.883-.433c-.104-1.868-.641-3.91-1.662-6.263c-4.602-.018-9.188-.018-13.79-.018c2.993 3.547 4.36 7.839 4.083 11.853m-.623-.484c.087.086.191.155.277.225c-.138-3.409-1.419-6.887-3.824-9.881H1.73c3.098 2.855 4.984 6.299 5.693 9.656m-.744-.658c.104.087.208.173.329.277c-.9-2.526-2.492-5.018-4.741-7.198H0c2.89 2.076 5.122 4.481 6.679 6.921",
	"this-github-repo":
		"M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m6.75 11.5c2.75 0 3.49-2.03 3.68-3.1c.91-.29 1.57-1.14 1.57-2.15C18 7 17 6 15.75 6S13.5 7 13.5 8.25c0 .94.57 1.75 1.39 2.08C14.67 11 14 12 12 12c-1.38 0-2.34.35-3 .84V8.87c.87-.31 1.5-1.14 1.5-2.12c0-1.25-1-2.25-2.25-2.25S6 5.5 6 6.75c0 .98.63 1.81 1.5 2.12v6.26c-.87.31-1.5 1.14-1.5 2.12c0 1.25 1 2.25 2.25 2.25s2.25-1 2.25-2.25c0-.93-.56-1.75-1.37-2.07c.28-.68 1.1-1.68 3.62-1.68m-4.5 3a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75m0-10.5a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75m7.5 1.5a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75",
	"page-mention-ne-arrow":
		"M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20m4 6v5h-2v-2.59l-4.29 4.3l-1.42-1.42L12.59 9H10V7h5z",
	document:
		"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5zm-3-9v2H7v-2zm3 4v2H7v-2z",
	expand: "M4 8V4h4M4 16v4h4M16 4h4v4M16 20h4v-4M9 9l-3-3M15 9l3-3M9 15l-3 3M15 15l3 3",
	"preview-pdf":
		"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5zM9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0",
	"table-of-contents": "M4 6h10M4 10h10M4 14h10M4 18h10M18 6h2M18 10h2M18 14h2M18 18h2",
	"clear-search": "M17.5 12a5.5 5.5 0 1 1-11 0a5.5 5.5 0 0 1 11 0m4 9.5l-5-5M9 10l6 6M9 16l6-6",
	close: "M18 6L6 18M6 6l12 12",
	"checkbox-unchecked": "M4 4h16v16H4z",
	"checkbox-checked": "M4 4h16v16H4zM9 12l2 2l4-4",
	"clipboard-copy-code":
		"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z",
	"clipboard-copy-code-done":
		"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM9 14l2 2l4-4",
	"tag-multiple": "M7.5 8.5a1 1 0 1 0 0-2a1 1 0 0 0 0 2M3 5v6l7 7l6-6l-7-7zm10 2l6 6l-6 6",
	pin: "M9 4v6l-2 4v2h6m0-12v6l2 4v2h-6m6 0v6m-6 0v-6",
	"pin-bold": "M9 4v6l-2 4v2h6m0-12v6l2 4v2h-6m6 0v6m-6 0v-6",
	"pin-elegant": "M9 4v6l-2 4v2h6m0-12v6l2 4v2h-6m6 0v6m-6 0v-6",
	"pin-outline": "M9 4v6l-2 4v2h6m0-12v6l2 4v2h-6m6 0v6m-6 0v-6",
	"pin-playful": "M9 4v6l-2 4v2h6m0-12v6l2 4v2h-6m6 0v6m-6 0v-6",
	"tag-outline": "M7 7.5a.5.5 0 1 0 1 0a.5.5 0 0 0-1 0M3 6l.75-.75L12 3l9 9l-6.75 6.75L12 21l-9-9z",
	web: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20M2 12h20M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10a15.3 15.3 0 0 1-4-10a15.3 15.3 0 0 1 4-10",
	"open-in-new": "M11 4H4v16h16v-7m-4-9h7v7m0-7L10 14",
	search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0a7 7 0 0 1 14 0",
	"theme-dark":
		"M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26a5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1",
	"theme-light":
		"M12 3v1m0 16v1m-8-9H3m18 0h1M5.6 5.6l.7.7m12.1-.7l-.7.7m-12.1 11.4l.7-.7m12.1.7l-.7-.7M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8",
	"to-top": "M6 11l6-6l6 6M6 17l6-6l6 6",
	"theme-system":
		"M9.173 14.83a4 4 0 1 1 5.657-5.657m-2.83 2.827a7.5 7.5 0 0 0 8.845 2.492A9 9 0 0 1 5.642 18.36M3 12h1m8-9v1M5.6 5.6l.7.7M3 21L21 3",
	"toggle-triangle": "M7 7l10 5l-10 5V7z",
	menu: "M4 6h16M4 12h16M4 18h16",
	filter: "M4 4h16v2.17l-6 5.83v8l-4-2v-6L4 6.17z",
	author: "M12 2a4 4 0 1 0 0 8a4 4 0 0 0 0-8m0 12c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4",
	"table-search":
		"M19.3 17.89a4.52 4.52 0 1 0-6.21-6.21a4.52 4.52 0 0 0 6.21 6.21M21 21l-3-3M3 4h18v2H3zM3 10h8v2H3zM3 16h5v2H3z",
	calendar:
		"M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 3v4M8 3v4M4 9h16M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01",
	"external-link-mention": "M11 4H4v16h16v-7M16 3h5v5M21 3l-9 9",
	bluesky:
		"M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565C.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479c.815 2.736 3.713 3.66 6.383 3.364q.204-.03.415-.056q-.207.033-.415.056c-3.912.58-7.387 2.005-2.83 7.078c5.013 5.19 6.87-1.113 7.823-4.308c.953 3.195 2.05 9.271 7.733 4.308c4.267-4.308 1.172-6.498-2.74-7.078a9 9 0 0 1-.415-.056q.21.026.415.056c2.67.297 5.568-.628 6.383-3.364c.246-.828.624-5.79.624-6.478c0-.69-.139-1.861-.902-2.206c-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8",
	substack:
		"M22.539 8.242H1.46V5.406h21.08zM1.46 10.812V24L12 18.11L22.54 24V10.812zM22.54 0H1.46v2.836h21.08z",
	kofi: "M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734c4.352.24 7.422-2.831 6.649-6.916m-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09c-.443-.441-3.368-3.049-4.034-3.954c-.709-.965-1.041-2.7-.091-3.71c.951-1.01 3.005-1.086 4.363.407c0 0 1.565-1.782 3.468-.963s1.832 3.011.723 4.311m6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015",
	"buy-me-a-coffee":
		"m20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379c-.197-.069-.42-.098-.57-.241c-.152-.143-.196-.366-.231-.572c-.065-.378-.125-.756-.192-1.133c-.057-.325-.102-.69-.25-.987c-.195-.4-.597-.634-.996-.788a6 6 0 0 0-.626-.194c-1-.263-2.05-.36-3.077-.416a26 26 0 0 0-3.7.062c-.915.083-1.88.184-2.75.5c-.318.116-.646.256-.888.501c-.297.302-.393.77-.177 1.146c.154.267.415.456.692.58c.36.162.737.284 1.123.366c1.075.238 2.189.331 3.287.37q1.829.074 3.65-.118q.449-.05.896-.119c.352-.054.578-.513.474-.834c-.124-.383-.457-.531-.834-.473c-.466.074-.96.108-1.382.146q-1.767.12-3.536.006a22 22 0 0 1-1.157-.107c-.086-.01-.18-.025-.258-.036q-.364-.055-.724-.13c-.111-.027-.111-.185 0-.212h.005q.416-.09.838-.147h.002c.131-.009.263-.032.394-.048a25 25 0 0 1 3.426-.12q1.011.029 2.017.144l.228.031q.4.06.798.145c.392.085.895.113 1.07.542c.055.137.08.288.111.431l.319 1.484a.237.237 0 0 1-.199.284h-.003l-.112.015a37 37 0 0 1-4.743.295a37 37 0 0 1-4.699-.304c-.14-.017-.293-.042-.417-.06c-.326-.048-.649-.108-.973-.161c-.393-.065-.768-.032-1.123.161c-.29.16-.527.404-.675.701c-.154.316-.199.66-.267 1c-.069.34-.176.707-.135 1.056c.087.753.613 1.365 1.37 1.502a39.7 39.7 0 0 0 11.343.376a.483.483 0 0 1 .535.53l-.071.697l-1.018 9.907c-.041.41-.047.832-.125 1.237c-.122.637-.553 1.028-1.182 1.171q-.868.197-1.756.205c-.656.004-1.31-.025-1.966-.022c-.699.004-1.556-.06-2.095-.58c-.475-.458-.54-1.174-.605-1.793l-.731-7.013l-.322-3.094c-.037-.351-.286-.695-.678-.678c-.336.015-.718.3-.678.679l.228 2.185l.949 9.112c.147 1.344 1.174 2.068 2.446 2.272c.742.12 1.503.144 2.257.156c.966.016 1.942.053 2.892-.122c1.408-.258 2.465-1.198 2.616-2.657l1.024-9.995l.215-2.087a.48.48 0 0 1 .39-.426c.402-.078.787-.212 1.074-.518c.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233c-2.416.359-4.866.54-7.308.46c-1.748-.06-3.477-.254-5.207-.498c-.17-.024-.353-.055-.47-.18c-.22-.236-.111-.71-.054-.995c.052-.26.152-.609.463-.646c.484-.057 1.046.148 1.526.22q.865.132 1.737.212c2.48.226 5.002.19 7.472-.14q.675-.09 1.345-.21c.399-.072.84-.206 1.08.206c.166.281.188.657.162.974a.54.54 0 0 1-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a6 6 0 0 1-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38c0 0 1.243.065 1.658.065c.447 0 1.786-.065 1.786-.065c.783 0 1.434-.6 1.499-1.38l.94-9.95a4 4 0 0 0-1.322-.238c-.826 0-1.491.284-2.26.613",
	"external-link": "M10 4H4v16h16v-6M20 4h-6m6 0v6m0-6L10 14",
	next: "M9 6l6 6l-6 6",
	before: "M15 6l-6 6l6 6",
	info: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20m0 5a1 1 0 1 1 0 2a1 1 0 0 1 0-2m1 4v6h-2v-6z",
	jump: "M12 14a2 2 0 1 1 0 4a2 2 0 0 1 0-4m0-12l8.5 6l-3 1.5A8 8 0 0 1 12 20a8 8 0 0 1-5.5-10.5L3.5 8z",
	"copy-as-markdown":
		"M12 21v-7q0-.825.588-1.412T14 12h6q.825 0 1.413.588T22 14v7h-2v-7h-2v5h-2v-5h-2v7zm-7 0q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.175q.275-.875 1.075-1.437T12 1q1 0 1.788.563T14.85 3H19q.825 0 1.413.588T21 5v5h-2V5h-2v3H7V5H5v14h5v2zm7-16q.425 0 .713-.288T13 4t-.288-.712T12 3t-.712.288T11 4t.288.713T12 5",
} as const;

export const neobrutalTheme: ThemePreset = deepMerge(classicTheme, {
	name: "neobrutal",
	colors: {
		surface1: "color-mix(in srgb, var(--theme-text) 12%, var(--theme-bg))",
		surface2: "color-mix(in srgb, var(--theme-text) 20%, var(--theme-bg))",
		border: "color-mix(in srgb, var(--theme-text) 28%, transparent)",
		mutedText: "color-mix(in srgb, var(--theme-text) 75%, transparent)",
		inlineCodeBg: { light: "#fff1a6", dark: "#2b2b2b" },
		inlineCodeText: { light: "#111827", dark: "#fef08a" },
		tableBorder: { light: "rgba(17, 24, 39, 0.6)", dark: "rgba(255, 255, 255, 0.45)" },
		searchDialogBorder: "#18181b",
		buttonMutedBg: { light: "#fde047", dark: "#27272a" },
	},
	mix: {
		blockquoteBg: 18,
		fabBg: 25,
		fabBorder: 70,
		fabText: 100,
		inlineHighlight: 30,
		anchorHash: 75,
		navGrad: { a: 10, b: 20, c: 12 },
		navGradDark: { a: 15, b: 28, c: 18 },
		navActive: { a: 18, b: 34, c: 22 },
		heroTintTop: 55,
		heroTintBottom: 35,
		cardPlaceholder: { a: 18, b: 32 },
		cardImageBorder: 12,
	},
	typography: {
		bodyFont: "sans",
		headingFont: "sans",
		navFont: "sans",
		codeFont: "mono",
	},
	letterSpacing: {
		heading: "0.04em",
		nav: "0.12em",
		chip: "0.14em",
	},
	textTransform: {
		heading: "uppercase",
		nav: "uppercase",
		chip: "uppercase",
		tableHeader: "uppercase",
	},
	lineHeight: {
		body: "1.55",
		heading: "1.05",
		mdxH1: "1.05",
		mdxH2: "1.1",
		mdxH3: "1.15",
		list: "1.45",
		callout: "1.4",
		todo: "1.55",
		bookmarkTitle: "1.15",
		bookmarkMeta: "1",
	},
	spacing: {
		pageMaxWidth: "54rem",
		pagePaddingX: "2rem",
		pagePaddingTop: "2.25rem",
		scrollMarginTop: "2.75rem",
		h1: { mt: "3.25rem", mb: "0.9rem" },
		h2: { mt: "2.75rem", mb: "0.85rem" },
		h3: { mt: "2.25rem", mb: "0.8rem" },
		text: { my: "0.2rem", minHeight: "1.6rem" },
		list: { gap: "0.2rem", pl: "1.25rem" },
		columnList: { my: "1.25rem", gapX: "0.75rem" },
		columnBasis: "12.5rem",
		divider: { my: "1.25rem", height: "0.2rem" },
		codeBlock: { padding: "1.1rem", mb: "0.4rem", maxHeight: "320px" },
		codeLine: {
			bleedWidth: "calc(100% + 2rem)",
			bleedMl: "-2rem",
			bleedPl: "2rem",
			bleedPr: "1rem",
		},
		codeMarker: { left: "1.25rem", width: "1.25rem" },
		codeFocus: { ml: "-1rem", pl: "1rem" },
		highlightWord: { px: "0.3rem", mx: "-2px" },
		blockquote: { my: "1.2rem", px: "0.75rem", py: "0.4rem", borderWidth: "6px" },
		callout: { my: "0.7rem", px: "0.9rem", py: "1rem", iconMr: "0.6rem" },
		table: { pb: "0.6rem", cellPadding: "0.6rem" },
		bookmark: {
			padding: "0.9rem",
			titleHeight: "1.5rem",
			descHeight: "2rem",
			captionMt: "0.4rem",
			iconMr: "0.5rem",
			iconSize: "1rem",
		},
		file: { padding: "0.3rem", previewMl: "0.5rem" },
		tag: { px: "0.5rem" },
		badge: { ml: "0.5rem", px: "0.55rem", py: "0.2rem" },
		image: { figureMt: "0.5rem" },
		todo: {
			pl: "0.6rem",
			gap: "0.6rem",
			checkboxMt: "0.25rem",
			checkboxPr: "0.5rem",
			checkboxSize: "1.25rem",
		},
		toc: {
			right: "1.25rem",
			topSm: "10rem",
			visualTop: "2rem",
			visualWidth: "2.25rem",
			visualPadding: "0.6rem",
			visualGap: "0.6rem",
			panelRight: "0.5rem",
			panelWidth: "20rem",
			panelMaxHeight: "60vh",
			panelMaxHeightSm: "70vh",
			panelPadding: "0.75rem",
		},
		iconButton: { size: "2.75rem", sizeSm: "3rem", fontSize: "2rem" },
		header: { paddingStartSm: "4.5rem", mb: "2.25rem" },
		layout: { bleedMlLg: "-28%", bleedWidthLg: "160%" },
		nav: {
			dropdownTop: "3.75rem",
			dropdownInsetX: "-1rem",
			dropdownPy: "0.75rem",
			gapYMobile: "0.9rem",
			gapXLg: "1.6rem",
		},
		footer: {
			pt: "5.5rem",
			pb: "1.25rem",
			navGapX: "0.85rem",
			navBorderWidth: "3px",
			linkPx: "1rem",
			linkPy: "0.6rem",
		},
		searchDialog: {
			mtSm: "4rem",
			maxHeightSm: "calc(100% - 8rem)",
			minHeightSm: "16rem",
			widthSm: "85%",
			maxWidthSm: "54rem",
		},
		searchFrame: { padding: "1.6rem", paddingTop: "3rem", gap: "1rem" },
		gallery: { gap: "1.5rem" },
		card: { imageAspect: "1 / 1", tagsPb: "0.75rem", authorsMt: "0.2rem" },
		hero: { minHeight: "20rem", padding: "2.5rem", mb: "2rem" },
		mdx: {
			paragraphMb: "0.9rem",
			listMt: "0.5rem",
			listMb: "0.85rem",
			listMs: "1rem",
			listPs: "0.5rem",
			listItemMy: "0.25rem",
			listItemPs: "0.15rem",
			blockquoteMy: "1.1rem",
			blockquotePx: "0.9rem",
			blockquotePy: "0.5rem",
			codePx: "1.1rem",
			codePy: "0.9rem",
			codeMy: "1.1rem",
			headingMt: "1.6rem",
			headingMb: "0.7rem",
		},
		datatable: {
			inputPx: "0.8rem",
			inputPy: "0.55rem",
			filterTogglePx: "0.6rem",
			filterRowMaxHeight: "26rem",
			topMb: "1rem",
			cellPaddingMultiplier: "1.1",
			sorterPr: "1.5rem",
			sorterIconTop: "0.3rem",
		},
		popover: { maxWidthGutter: "2.25rem" },
		marginNote: { px: "0.5rem", mx: "0" },
		pagefind: { underlineHeight: "6px", underlineGap: "5px", underlineGapHover: "4px" },
	},
	radius: {
		sm: "0",
		md: "0",
		lg: "0",
		xl: "0",
		"2xl": "0",
		full: "0",
		code: "0",
		card: "0",
		tag: "0",
		badge: "0",
		blockquoteRight: "0",
		navHighlight: "0",
	},
	border: {
		default: "3px",
		blockquote: "6px",
		footerNav: "4px",
		focus: "3px",
		focusRing: "0.3rem",
		searchDialog: "3px",
		dividerStyle: "solid",
	},
	shadow: {
		sm: "3px 3px 0 var(--theme-text)",
		md: "4px 4px 0 var(--theme-text)",
		lg: "6px 6px 0 var(--theme-text)",
		xl: "8px 8px 0 var(--theme-text)",
		tocPanel: "5px 5px 0 var(--theme-accent)",
		card: "5px 5px 0 var(--theme-accent-2)",
		fab: "4px 4px 0 var(--theme-text)",
	},
	effect: {
		codeUnfocusedBlur: "0px",
		backdropBlurSm: "0px",
		backdropBlurMd: "0px",
	},
	opacity: {
		codeUnfocused: 0.75,
		highlighted: 1,
		hidden: 0,
		hoverDim: 0.9,
		secondaryText: 0.85,
		bodyMuted: 1,
		iconMuted: 0.7,
		icon: 1,
		dialogSurface: 1,
	},
	motion: {
		cardImageHoverScale: 1.02,
		iconHoverScale: 1.05,
		cardHoverBrightness: 1.01,
		toggleOpenRotate: "90deg",
		toTopHiddenTranslateY: "8rem",
	},
	underline: {
		style: "solid",
		thickness: "3px",
		offset: "3px",
		offsetHover: "4px",
		annotationStyle: "solid",
		mdxThickness: "3px",
		mdxOffset: "3px",
	},
	anchor: {
		hashContent: "#",
		hashMl: "-1.4rem",
		hashMlToggle: "-2.4rem",
		hashOpacityHidden: 0.3,
		hashOpacityShown: 1,
	},
	nav: {
		highlightType: "solidBlock",
		highlightPosition: "bottom",
		highlight: { insetX: "0", height: "0.55em", heightActive: "0.7em", bottom: "0" },
		footerHighlight: { bottom: "0", height: "0.55em", heightActive: "0.7em" },
	},
	pinned: {
		size: "2rem",
		color: "var(--theme-accent-2)",
		rotate: "-15deg",
		hasBackground: true,
		bgColor: "color-mix(in srgb, var(--theme-accent) 25%, transparent)",
		bgRadius: "0",
		bgSize: "2.4rem",
		hasGlass: false,
	},
	icons: neobrutalIcons,
});
