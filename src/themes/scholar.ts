import type { ThemePreset } from "../theme";
import { deepMerge } from "./merge";
import { classicTheme } from "./classic";
import type { ThemeTemplateParams } from "./css-template-types";

// Personality deltas merged onto base.ts: matching selectors replace the base body, new rules are appended. Shared rules belong in base.ts.
export const scholarOverride = (params: ThemeTemplateParams): string => `
@layer components {
.ann-bg-c {
    @apply rounded-sm px-1;
    background-color: var(--abc, transparent);
  }
.annotation-underline {
    @apply underline decoration-dotted decoration-2 decoration-accent/40 underline-offset-3;
  }
.author-icon-link {
    @apply inline-flex items-center transition-[color,transform] duration-200 ease-out justify-center rounded-full border border-dotted border-gray-200 p-0.5;
  }
.author-icon-link:hover {
    @apply border-gray-400;
  }
.author-name-link {
    @apply transition-colors border-b border-dotted border-gray-200 font-medium tracking-[0.08em];
  }
.author-name-link:hover {
    @apply text-quote;
  }
.auto-imported-section {
    @apply mt-12 border-t border-dotted border-gray-200 pt-4;
  }
.bookmark-card {
    @apply flex w-full max-w-full min-w-0 grow items-stretch overflow-hidden rounded-sm border border-gray-200 no-underline select-none dark:border-gray-800 border-dotted;
  }
.bottom-toc-button {
    @apply fixed end-4 ${params.bottomTocButtonBottom} z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border text-3xl transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] sm:hidden print:hidden border-dotted;
  }
.bottom-toc-button,
  .to-top-btn,
  .copy-markdown-btn {
    background-color: color-mix(in srgb, var(--color-accent) 8%, var(--color-bgColor));
    border-color: color-mix(in srgb, var(--color-textColor) 28%, var(--color-bgColor));
    color: color-mix(in srgb, var(--color-textColor) 65%, var(--color-bgColor));
  }
.callout {
    @apply mx-auto flex w-full max-w-full px-3 py-4 leading-6 my-3 rounded-sm border border-gray-200;
  }
.copy-markdown-btn {
    @apply inline-flex items-center gap-1 transition disabled:opacity-60 disabled:cursor-not-allowed h-10 w-10 rounded-full border flex justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer backdrop-blur-md print:hidden border-dotted shadow-none;
  }
.count-badge {
    @apply ml-2 bg-gray-100 px-2 py-0.5 text-rose-800 dark:bg-gray-800 dark:text-rose-300 rounded-full border border-gray-200 dark:border-gray-700;
  }
.dark .footer-link::before {
    background-color: color-mix(in srgb, var(--color-textColor) 55%, transparent);
  }
.dark .nav-link::before {
    background-color: color-mix(in srgb, var(--color-textColor) 55%, transparent);
  }
.divider {
    @apply mx-auto w-full border-none bg-accent/15 my-6 h-px rounded-none;
  }
.footer-link {
    @apply relative z-0 px-4 py-2 sm:px-2 sm:py-0 tracking-[0.06em] font-accent;
  }
.footer-link::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -0.15em;
    height: 1px;
    border-radius: 0;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
    background-color: color-mix(in srgb, var(--color-textColor) 30%, transparent);
  }
.footer-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 2px;
    background-color: color-mix(in srgb, var(--color-accent-2) 55%, transparent);
  }
.footer-nav {
    @apply flex flex-wrap gap-x-2 border-gray-200 sm:gap-x-2 sm:border-none dark:border-gray-700 print:hidden rounded-none border-t border-b border-dotted;
  }
.hasId::before {
    content: "¶";
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
    @apply font-bold text-textColor tracking-[-0.01em] mt-5 mb-3 font-accent;
  }
.nav-link {
    @apply relative z-0 w-fit self-end px-3 py-1 text-right sm:w-auto sm:self-auto sm:py-0 sm:text-left tracking-[0.08em] font-accent;
  }
.nav-link::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -0.15em;
    height: 1px;
    border-radius: 0;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
    background-color: color-mix(in srgb, var(--color-textColor) 30%, transparent);
  }
.nav-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 2px;
    background-color: color-mix(in srgb, var(--color-accent-2) 55%, transparent);
  }
.nav-menu {
    @apply text-accent absolute -inset-x-4 top-14 hidden flex-col items-end py-2 text-base backdrop-blur-sm group-[.menu-open]:z-50 group-[.menu-open]:flex sm:static sm:z-auto sm:-ms-4 sm:mt-1 sm:flex sm:flex-row sm:items-center sm:rounded-none sm:py-0 sm:text-sm sm:shadow-none sm:backdrop-blur-none lg:text-base print:hidden gap-y-3 sm:gap-y-0 lg:gap-x-4 bg-bgColor/95 rounded-sm border border-dotted border-gray-200 shadow-none;
  }
.non-toggle-h2 {
    @apply relative mb-4 cursor-pointer text-2xl font-normal tracking-[0.08em] font-accent;
  }
.non-toggle-h2::before {
    content: "¶";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
.notion-divider {
    @apply mx-auto w-full border-none bg-accent-2/12 my-6 h-px rounded-none;
  }
.notion-h1 {
    @apply cursor-pointer text-2xl mt-10 mb-2 font-medium tracking-[0.02em] border-b border-dotted border-gray-200 pb-1 font-accent;
  }
.notion-h2 {
    @apply cursor-pointer text-xl mt-8 mb-2 font-medium tracking-[0.02em] border-b border-dotted border-gray-200 pb-1 font-accent;
  }
.notion-h3 {
    @apply cursor-pointer text-lg mt-6 mb-2 font-medium tracking-[0.02em] border-b border-dotted border-gray-200 pb-1 font-accent;
  }
.notion-list-ol {
    @apply list-outside pl-6 space-y-2;
  }
.notion-list-ul {
    @apply list-outside list-disc pl-6 space-y-2;
  }
.notion-tag {
    @apply inline-block text-sm;
  }
.notion-tag,
  a[aria-label^="View more blogs with the tag"],
  a[aria-label^="View all posts with the tag:"],
  a[data-pagefind-filter="tags"] {
    @apply rounded-sm border border-dotted border-gray-200 px-2 py-0.5 font-medium tracking-[0.08em];
  }
.nquote {
    @apply my-4 border-gray-600 dark:border-gray-300 border-s-2 border-dotted px-3!;
  }
.search-btn {
    @apply hover:text-accent active:scale-[0.94] flex h-10 w-10 cursor-pointer items-center justify-center transition-[color,transform] duration-150 ease-out rounded-full border border-dotted;
  }
.search-close-btn {
    @apply ms-auto cursor-pointer rounded-full border border-dotted bg-zinc-200 p-2 font-semibold dark:bg-zinc-700;
  }
.search-dialog {
    @apply bg-bgColor/90 h-full max-h-full w-full max-w-full border border-dotted border-zinc-400 shadow-none backdrop:backdrop-blur-sm sm:mx-auto sm:mt-16 sm:mb-auto sm:h-max sm:max-h-[calc(100%-8rem)] sm:min-h-[15rem] sm:w-5/6 sm:max-w-[48rem] sm:rounded-sm;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-textColor) 10%, transparent);
  }
.search-frame {
    @apply flex flex-col gap-4 p-6 pt-12 sm:pt-6;
  }
.site-footer {
    @apply text-accent mt-auto flex w-full flex-col items-center justify-center gap-y-2 pt-20 pb-4 text-center align-top text-sm sm:flex-row sm:justify-between lg:-ml-[25%] lg:w-[150%] border-t border-dotted border-gray-200;
  }
.site-page-link {
    @apply underline decoration-accent-2/40 hover:decoration-accent-2/60 decoration-dotted decoration-2 underline-offset-3 tracking-[0.06em] font-accent;
  }
.theme-toggle-btn {
    @apply hover:text-accent active:scale-[0.94] relative h-10 w-10 cursor-pointer p-2 transition-[color,transform] duration-150 ease-out rounded-full border border-dotted;
  }
.title {
    @apply text-3xl text-accent-2 font-medium tracking-[0.02em] font-accent;
  }
.to-top-btn {
    @apply fixed end-4 ${params.toTopBtnBottom} z-30 flex h-10 w-10 translate-y-28 cursor-pointer items-center justify-center rounded-full border text-3xl opacity-0 transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] data-[show=true]:translate-y-0 data-[show=true]:opacity-100 sm:end-8 sm:bottom-8 sm:h-12 sm:w-12 print:hidden border-dotted;
  }
.toc-content {
    @apply border-accent/10 bg-bgColor absolute right-1 bottom-0 max-h-[55vh] w-76 overflow-y-auto border p-2 transition-[opacity,transform] duration-200 ease-out sm:top-0 sm:bottom-auto sm:max-h-[68vh] rounded-sm border-dotted;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-textColor) 12%, transparent);
  }
.toc-content .text-quote\\! {
    @apply border border-dotted border-gray-200 bg-accent/15 font-semibold;
  }
.toc-content [id^="-tocid--"] {
    @apply rounded-sm border border-dotted border-gray-200 px-2 py-1 tracking-[0.08em] transition-colors duration-200;
  }
.toc-content [id^="-tocid--"]:hover {
    @apply bg-accent/10;
  }
.visual-container {
    @apply bg-bgColor absolute top-6 right-0 hidden w-8 flex-col items-end space-y-2 overflow-hidden p-2 transition-opacity duration-200 sm:flex border border-dotted border-gray-200;
  }
.visual-container [id^="-vistocid--"] {
    @apply rounded-full border border-dotted border-gray-200;
  }
#auto-recent-posts {
    @apply relative mt-8 mb-4 cursor-pointer text-2xl font-normal font-accent;
  }
#auto-recent-posts::before {
    content: "¶";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
a[aria-label^="View posts by"] {
    @apply border-b border-dotted border-gray-200 tracking-[0.1em];
  }
}
@layer components {
.auto-imported-section > hr {
    @apply mx-auto w-full bg-transparent my-6 h-0 border-t border-dotted border-gray-200;
  }
}
@layer components {
a[aria-label^="View all posts with the tag:"] > span {
    @apply rounded-full border border-dotted border-gray-200 px-1 font-semibold tracking-[0.12em];
  }
}
@layer components {
a[aria-label^="View posts by"] > span {
    @apply rounded-sm border border-dotted border-gray-200 px-2 py-1 font-semibold tracking-[0.1em];
  }
}
@layer components {
a[aria-label^="View posts with the tag:"] > span,
  h1.title > span {
    @apply rounded-sm border border-dotted border-gray-200 px-2 py-1 font-semibold tracking-[0.08em];
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
.gallery-grid {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7;
}
.post-card {
    @apply relative overflow-hidden bg-bgColor duration-200 rounded-md border border-gray-200 transition-[transform];
    transition-timing-function: var(--ease-out);
}
.post-card-authors {
    @apply -mt-1 px-0 pb-1 tracking-[0.04em];
}
.post-card-image {
    @apply h-full w-full object-cover transition-transform duration-300 ease-out rounded-md;
}
.post-card-image-container {
    @apply relative overflow-hidden border aspect-[3/2] rounded-md;
    border-color: color-mix(in srgb, var(--color-textColor) 6%, transparent);
}
.post-card-placeholder {
    @apply flex h-full w-full items-center justify-center rounded-md;
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent));
    transition: transform 300ms ease, filter 300ms ease;
}
.post-card-tags {
    @apply flex flex-wrap items-baseline px-0 pb-3 gap-2 tracking-[0.04em];
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
  @apply relative overflow-hidden bg-bgColor transition-[box-shadow,transform] duration-200 rounded-sm border border-dotted border-gray-300 dark:border-gray-700;
  transition-timing-function: var(--ease-out);
}
.post-card:hover {
  box-shadow: 0 6px 20px -14px color-mix(in srgb, var(--color-textColor) 26%, transparent);
  transform: translateY(-3px);
}
.post-card-image-container {
  @apply relative overflow-hidden aspect-[3/2] rounded-sm border border-dotted;
  border-color: color-mix(in srgb, var(--color-textColor) 6%, transparent);
}
.post-card-image {
  @apply h-full w-full object-cover transition-transform duration-300 ease-out rounded-sm;
}
.post-card-placeholder {
  @apply flex h-full w-full items-center justify-center rounded-sm;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent));
  transition: transform 300ms ease, filter 300ms ease;
}
.post-card-placeholder span {
  @apply text-[2.5rem] font-bold;
  color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}
.post-card-badge {
  @apply bg-quote/90 absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-sm border border-dotted border-white/40 uppercase tracking-[0.1em];
}
.post-card-meta-date {
  @apply text-accent/80 mb-1 block font-mono text-[10px] uppercase tracking-[0.12em];
}
.post-card-title {
  @apply mb-1 text-sm leading-snug font-semibold font-accent tracking-[0.01em];
}
.post-card-author-link {
  @apply text-textColor/60 hover:text-accent text-[10px] transition-colors tracking-[0.06em];
}


/* Search modal + results */
html site-search {
  --pf-border-radius: 0.15rem;
  --pf-shadow: 0 18px 48px color-mix(in srgb, #000 15%, transparent);
  --pf-border: color-mix(in srgb, var(--color-textColor) 28%, transparent);
}
html site-search .pf-modal,
html site-search .pf-input,
html site-search .pf-dropdown-menu,
html site-search .pf-dropdown-trigger,
html .webtrotion-search-result-card,
html .webtrotion-search-navigation-link,
html .webtrotion-search-pinned-link,
html .webtrotion-search-subresult-link {
  border-radius: 0.15rem !important;
}


/* Component radius (new astro-v7 components -> theme radius scale) */
html :is(.embed-media-box, .embed-iframe-notion, .embed-iframe-maps, .notion-popover, .notion-image, .notion-file-container, .notion-file-link, .notion-tab-button, .notion-tab-button.is-active, .code-rendered, .code-iframe, .html-frame-lightbox-content .code-iframe, .code .mermaid, .datatable-input, .toc-content) {
    border-radius: 0.0625rem;
  }
html :is(.notion-list-item-colored, .toggle-colored, .todo-item-colored, .annotation-code, .toc-link, .toc-visual) {
    border-radius: 0;
  }
`;

// Scholar theme icons - Lucide-style thin strokes, elegant curves, outlined
// Characterized by: 1.5-2px stroke width, minimal designs, clean outlines
// NO inheritance from classicIcons - complete standalone set

const scholarIcons = {
	"🗓️": "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
	download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5l5-5m-5 5V3",
	rss: "M4 11a9 9 0 0 1 9 9m-9-5a5 5 0 0 1 5 5m-4-1a1 1 0 1 1 0 2a1 1 0 0 1 0-2M4 4a16 16 0 0 1 16 16",
	dblp: "M3.075.002c-.096.013-.154.092-.094.31L4.97 7.73L3.1 8.6s-.56.26-.4.85l2.45 9.159s.16.59.72.33l6.169-2.869l1.3-.61s.52-.24.42-.79l-.01-.06l-1.13-4.22l-.658-2.45l-.672-2.49v-.04s-.16-.59-.84-1L3.5.141s-.265-.16-.425-.139M18.324 5.03a.7.7 0 0 0-.193.06l-5.602 2.6l.862 3.2l1.09 4.08l.01.06c.05.47-.411.79-.411.79l-1.88.87l.5 1.89l.04.1c.07.17.28.6.81.91l6.95 4.269s.68.41.52-.17l-1.981-7.4l1.861-.86s.56-.26.4-.85L18.85 5.42s-.116-.452-.526-.39",
	email: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 2l8 5l8-5",
	github:
		"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5a4.8 4.8 0 0 0-.5-2a4.8 4.8 0 0 0 0-3s-1-.5-3 1.5a13 13 0 0 0-6 0C8.5 3 7.5 3.5 7.5 3.5a4.8 4.8 0 0 0 0 3a4.8 4.8 0 0 0-.5 2c0 3.5 3 5.5 6 5.5a4.8 4.8 0 0 0-1 3.5v4m-4 0c-4 1-4-2-6-2",
	googlescholar:
		"M5.242 13.769L0 9.5L12 0l12 9.5l-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269M12 10a7 7 0 1 0 0 14a7 7 0 0 0 0-14",
	linkedin:
		"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6M2 9h4v12H2zM4 2a2 2 0 1 0 0 4a2 2 0 0 0 0-4",
	facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
	twitter:
		"M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6c2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4c-.9-4.2 4-6.6 7-3.8c1.1 0 3-1.2 3-1.2",
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
		"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10m5-13h-5m5 0v5m0-5l-7 7",
	document:
		"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm6 18H6V4h7v5h5zM8 13h8m-8 4h8",
	expand:
		"M21 21l-6-6m6 6v-4.8m0 4.8h-4.8M3 3l6 6M3 3v4.8M3 3h4.8m0 18l6-6m-6 6v-4.8m0 4.8H3m18-18l-6 6m6-6v4.8m0-4.8h-4.8",
	"preview-pdf":
		"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm6 18H6V4h7v5h5zm-8-5a3 3 0 1 0 0-6a3 3 0 0 0 0 6",
	"table-of-contents": "M4 6h10M4 10h10M4 14h10M4 18h10M18 6v12",
	"clear-search": "M10 17a7 7 0 1 0 0-14a7 7 0 0 0 0 14m11 4l-6-6M7 7l6 6M7 13l6-6",
	close: "M18 6L6 18M6 6l12 12",
	"checkbox-unchecked": "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
	"checkbox-checked":
		"M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm6 7l2 2l4-4",
	"clipboard-copy-code":
		"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m-1 2h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1",
	"clipboard-copy-code-done":
		"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m-1 2h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1m1 8l2 2l4-4",
	"tag-multiple": "M7.5 7.5h.01M11 2H2v9l9 9l6-6l-6-6m4 0l9 9l-6 6",
	pin: "M12 17v5m0-22v10m-5-5l2 4v2h6v-2l2-4V4H7z",
	"pin-bold": "M12 17v5m0-22v10m-5-5l2 4v2h6v-2l2-4V4H7z",
	"pin-elegant": "M12 17v5m0-22v10m-5-5l2 4v2h6v-2l2-4V4H7z",
	"pin-outline": "M12 17v5m0-22v10m-5-5l2 4v2h6v-2l2-4V4H7z",
	"pin-playful": "M12 17v5m0-22v10m-5-5l2 4v2h6v-2l2-4V4H7z",
	"tag-outline": "M7.5 7.5h.01M2 12V2h10l10 10l-10 10z",
	web: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20M2 12h20M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10a15.3 15.3 0 0 1-4-10a15.3 15.3 0 0 1 4-10",
	"open-in-new": "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m0-6l-11 11",
	search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0a7 7 0 0 1 14 0",
	"theme-dark": "M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79",
	"theme-light":
		"M12 3v1m0 16v1m-8-9H3m18 0h1M5.64 5.64l.7.7m12.02-.7l-.7.7M5.64 18.36l.7-.7m12.02.7l-.7-.7M8 12a4 4 0 1 1 8 0a4 4 0 0 1-8 0",
	"to-top": "M12 6l-6 6m6-6l6 6m-6 6l-6 6m6-6l6 6",
	"theme-system":
		"M9.173 14.83a4 4 0 1 1 5.657-5.657m-2.83 2.827a7.5 7.5 0 0 0 8.845 2.492A9 9 0 0 1 5.642 18.36M3 12h1m8-9v1M5.6 5.6l.7.7M3 21L21 3",
	"toggle-triangle": "M12 6v12m-6-6h12",
	menu: "M4 6h16M4 12h16M4 18h16",
	filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
	author: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8",
	"table-search": "M18 18l-3-3m1-5a6 6 0 1 1-12 0a6 6 0 0 1 12 0M2 4h10M2 8h6M2 12h4",
	calendar:
		"M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm13-4v4M8 2v4M3 10h18",
	"external-link-mention":
		"M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6v6m0-6L10 14",
	bluesky:
		"M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565C.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479c.815 2.736 3.713 3.66 6.383 3.364q.204-.03.415-.056q-.207.033-.415.056c-3.912.58-7.387 2.005-2.83 7.078c5.013 5.19 6.87-1.113 7.823-4.308c.953 3.195 2.05 9.271 7.733 4.308c4.267-4.308 1.172-6.498-2.74-7.078a9 9 0 0 1-.415-.056q.21.026.415.056c2.67.297 5.568-.628 6.383-3.364c.246-.828.624-5.79.624-6.478c0-.69-.139-1.861-.902-2.206c-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8",
	substack:
		"M22.539 8.242H1.46V5.406h21.08zM1.46 10.812V24L12 18.11L22.54 24V10.812zM22.54 0H1.46v2.836h21.08z",
	kofi: "M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734c4.352.24 7.422-2.831 6.649-6.916m-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09c-.443-.441-3.368-3.049-4.034-3.954c-.709-.965-1.041-2.7-.091-3.71c.951-1.01 3.005-1.086 4.363.407c0 0 1.565-1.782 3.468-.963s1.832 3.011.723 4.311m6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015",
	"buy-me-a-coffee":
		"m20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379c-.197-.069-.42-.098-.57-.241c-.152-.143-.196-.366-.231-.572c-.065-.378-.125-.756-.192-1.133c-.057-.325-.102-.69-.25-.987c-.195-.4-.597-.634-.996-.788a6 6 0 0 0-.626-.194c-1-.263-2.05-.36-3.077-.416a26 26 0 0 0-3.7.062c-.915.083-1.88.184-2.75.5c-.318.116-.646.256-.888.501c-.297.302-.393.77-.177 1.146c.154.267.415.456.692.58c.36.162.737.284 1.123.366c1.075.238 2.189.331 3.287.37q1.829.074 3.65-.118q.449-.05.896-.119c.352-.054.578-.513.474-.834c-.124-.383-.457-.531-.834-.473c-.466.074-.96.108-1.382.146q-1.767.12-3.536.006a22 22 0 0 1-1.157-.107c-.086-.01-.18-.025-.258-.036q-.364-.055-.724-.13c-.111-.027-.111-.185 0-.212h.005q.416-.09.838-.147h.002c.131-.009.263-.032.394-.048a25 25 0 0 1 3.426-.12q1.011.029 2.017.144l.228.031q.4.06.798.145c.392.085.895.113 1.07.542c.055.137.08.288.111.431l.319 1.484a.237.237 0 0 1-.199.284h-.003l-.112.015a37 37 0 0 1-4.743.295a37 37 0 0 1-4.699-.304c-.14-.017-.293-.042-.417-.06c-.326-.048-.649-.108-.973-.161c-.393-.065-.768-.032-1.123.161c-.29.16-.527.404-.675.701c-.154.316-.199.66-.267 1c-.069.34-.176.707-.135 1.056c.087.753.613 1.365 1.37 1.502a39.7 39.7 0 0 0 11.343.376a.483.483 0 0 1 .535.53l-.071.697l-1.018 9.907c-.041.41-.047.832-.125 1.237c-.122.637-.553 1.028-1.182 1.171q-.868.197-1.756.205c-.656.004-1.31-.025-1.966-.022c-.699.004-1.556-.06-2.095-.58c-.475-.458-.54-1.174-.605-1.793l-.731-7.013l-.322-3.094c-.037-.351-.286-.695-.678-.678c-.336.015-.718.3-.678.679l.228 2.185l.949 9.112c.147 1.344 1.174 2.068 2.446 2.272c.742.12 1.503.144 2.257.156c.966.016 1.942.053 2.892-.122c1.408-.258 2.465-1.198 2.616-2.657l1.024-9.995l.215-2.087a.48.48 0 0 1 .39-.426c.402-.078.787-.212 1.074-.518c.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233c-2.416.359-4.866.54-7.308.46c-1.748-.06-3.477-.254-5.207-.498c-.17-.024-.353-.055-.47-.18c-.22-.236-.111-.71-.054-.995c.052-.26.152-.609.463-.646c.484-.057 1.046.148 1.526.22q.865.132 1.737.212c2.48.226 5.002.19 7.472-.14q.675-.09 1.345-.21c.399-.072.84-.206 1.08.206c.166.281.188.657.162.974a.54.54 0 0 1-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a6 6 0 0 1-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38c0 0 1.243.065 1.658.065c.447 0 1.786-.065 1.786-.065c.783 0 1.434-.6 1.499-1.38l.94-9.95a4 4 0 0 0-1.322-.238c-.826 0-1.491.284-2.26.613",
	"external-link": "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m0-6L10 14",
	next: "M9 18l6-6l-6-6",
	before: "M15 18l-6-6l6-6",
	info: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10m0-14v2m0 4v4",
	jump: "M12 14a2 2 0 1 1 0 4a2 2 0 0 1 0-4m0-12a8 8 0 1 1 0 16m0-16v8",
	"copy-as-markdown":
		"M12 21v-7q0-.825.588-1.412T14 12h6q.825 0 1.413.588T22 14v7h-2v-7h-2v5h-2v-5h-2v7zm-7 0q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.175q.275-.875 1.075-1.437T12 1q1 0 1.788.563T14.85 3H19q.825 0 1.413.588T21 5v5h-2V5h-2v3H7V5H5v14h5v2zm7-16q.425 0 .713-.288T13 4t-.288-.712T12 3t-.712.288T11 4t.288.713T12 5",
} as const;

export const scholarTheme: ThemePreset = deepMerge(classicTheme, {
	name: "scholar",
	colors: {
		surface1: "color-mix(in srgb, var(--theme-text) 2%, var(--theme-bg))",
		surface2: "color-mix(in srgb, var(--theme-text) 5%, var(--theme-bg))",
		border: "color-mix(in srgb, var(--theme-text) 10%, transparent)",
		mutedText: "color-mix(in srgb, var(--theme-text) 50%, transparent)",
		inlineCodeBg: { light: "#f7f1e8", dark: "#2b2420" },
		inlineCodeText: { light: "#7b2d2d", dark: "#f2c1b1" },
		tableBorder: { light: "rgba(214, 206, 195, 0.9)", dark: "rgba(84, 74, 66, 0.9)" },
		searchDialogBorder: "#a8a29e",
		buttonMutedBg: { light: "#ece5db", dark: "#3a332d" },
	},
	mix: {
		blockquoteBg: 5,
		fabBg: 8,
		fabBorder: 25,
		fabText: 65,
		inlineHighlight: 12,
		anchorHash: 35,
		navGrad: { a: 2, b: 6, c: 3 },
		navGradDark: { a: 4, b: 10, c: 5 },
		navActive: { a: 5, b: 14, c: 7 },
		heroTintTop: 78,
		heroTintBottom: 60,
		cardPlaceholder: { a: 6, b: 14 },
		cardImageBorder: 3,
	},
	typography: {
		bodyFont: "serif",
		headingFont: "accent",
		navFont: "serif",
		codeFont: "mono",
	},
	letterSpacing: {
		heading: "-0.02em",
		nav: "0.03em",
		chip: "0.04em",
	},
	textTransform: {
		heading: "none",
		nav: "uppercase",
		chip: "uppercase",
		tableHeader: "uppercase",
	},
	lineHeight: {
		body: "1.85",
		heading: "1.3",
		mdxH1: "1.25",
		mdxH2: "1.3",
		mdxH3: "1.35",
		list: "1.75",
		callout: "1.65",
		todo: "1.85",
		bookmarkTitle: "1.3",
		bookmarkMeta: "1.15",
	},
	spacing: {
		pageMaxWidth: "46rem",
		pagePaddingX: "2.75rem",
		pagePaddingTop: "3rem",
		scrollMarginTop: "3rem",
		h1: { mt: "3rem", mb: "0.75rem" },
		h2: { mt: "2.25rem", mb: "0.6rem" },
		h3: { mt: "1.75rem", mb: "0.5rem" },
		text: { my: "0.4rem", minHeight: "1.9rem" },
		list: { gap: "0.35rem", pl: "1.75rem" },
		columnList: { my: "1.5rem", gapX: "1.25rem" },
		columnBasis: "12rem",
		divider: { my: "1.25rem", height: "0.125rem" },
		codeBlock: { padding: "1.25rem", mb: "0.5rem", maxHeight: "360px" },
		codeLine: {
			bleedWidth: "calc(100% + 2rem)",
			bleedMl: "-2rem",
			bleedPl: "2rem",
			bleedPr: "1rem",
		},
		codeMarker: { left: "1.25rem", width: "1.25rem" },
		codeFocus: { ml: "-1rem", pl: "1rem" },
		highlightWord: { px: "0.25rem", mx: "-2px" },
		blockquote: { my: "1.25rem", px: "0.75rem", py: "0.5rem", borderWidth: "3px" },
		callout: { my: "0.75rem", px: "1rem", py: "1.1rem", iconMr: "0.5rem" },
		table: { pb: "0.75rem", cellPadding: "0.6rem" },
		bookmark: {
			padding: "1rem",
			titleHeight: "1.6rem",
			descHeight: "2.2rem",
			captionMt: "0.5rem",
			iconMr: "0.4rem",
			iconSize: "1rem",
		},
		file: { padding: "0.4rem", previewMl: "0.6rem" },
		tag: { px: "0.4rem" },
		badge: { ml: "0.5rem", px: "0.45rem", py: "0.2rem" },
		image: { figureMt: "0.5rem" },
		todo: {
			pl: "0.6rem",
			gap: "0.5rem",
			checkboxMt: "0.3rem",
			checkboxPr: "0.5rem",
			checkboxSize: "1.15rem",
		},
		toc: {
			right: "1.5rem",
			topSm: "10rem",
			visualTop: "2rem",
			visualWidth: "2rem",
			visualPadding: "0.5rem",
			visualGap: "0.5rem",
			panelRight: "0.5rem",
			panelWidth: "18rem",
			panelMaxHeight: "60vh",
			panelMaxHeightSm: "70vh",
			panelPadding: "0.75rem",
		},
		iconButton: { size: "2.75rem", sizeSm: "3rem", fontSize: "1.75rem" },
		header: { paddingStartSm: "5rem", mb: "2.5rem" },
		layout: { bleedMlLg: "-22%", bleedWidthLg: "144%" },
		nav: {
			dropdownTop: "3.5rem",
			dropdownInsetX: "-1rem",
			dropdownPy: "0.6rem",
			gapYMobile: "0.85rem",
			gapXLg: "1.5rem",
		},
		footer: {
			pt: "6rem",
			pb: "1.5rem",
			navGapX: "0.75rem",
			navBorderWidth: "1px",
			linkPx: "1rem",
			linkPy: "0.6rem",
		},
		searchDialog: {
			mtSm: "4rem",
			maxHeightSm: "calc(100% - 9rem)",
			minHeightSm: "16rem",
			widthSm: "80%",
			maxWidthSm: "46rem",
		},
		searchFrame: { padding: "1.75rem", paddingTop: "3rem", gap: "1.25rem" },
		gallery: { gap: "1.5rem" },
		card: { imageAspect: "4 / 3", tagsPb: "0.9rem", authorsMt: "0" },
		hero: { minHeight: "18rem", padding: "2.5rem", mb: "2rem" },
		mdx: {
			paragraphMb: "1rem",
			listMt: "0.6rem",
			listMb: "1rem",
			listMs: "1.25rem",
			listPs: "0.75rem",
			listItemMy: "0.35rem",
			listItemPs: "0.25rem",
			blockquoteMy: "1.2rem",
			blockquotePx: "1rem",
			blockquotePy: "0.6rem",
			codePx: "1.1rem",
			codePy: "0.9rem",
			codeMy: "1.2rem",
			headingMt: "1.75rem",
			headingMb: "0.75rem",
		},
		datatable: {
			inputPx: "0.75rem",
			inputPy: "0.5rem",
			filterTogglePx: "0.5rem",
			filterRowMaxHeight: "26rem",
			topMb: "1rem",
			cellPaddingMultiplier: "1.05",
			sorterPr: "1.5rem",
			sorterIconTop: "0.3rem",
		},
		popover: { maxWidthGutter: "2rem" },
		marginNote: { px: "0.5rem", mx: "0" },
		pagefind: { underlineHeight: "5px", underlineGap: "4px", underlineGapHover: "3px" },
	},
	radius: {
		sm: "0",
		md: "0.0625rem",
		lg: "0.125rem",
		xl: "0.125rem",
		"2xl": "0.25rem",
		full: "9999px",
		code: "0.0625rem",
		card: "0.0625rem",
		tag: "0",
		badge: "0",
		blockquoteRight: "0",
		navHighlight: "0",
	},
	border: {
		default: "1px",
		blockquote: "2px",
		footerNav: "1px",
		focus: "1px",
		focusRing: "0.1rem",
		searchDialog: "1px",
		dividerStyle: "solid",
	},
	shadow: {
		sm: "none",
		md: "none",
		lg: "none",
		xl: "none",
		tocPanel: "none",
		card: "none",
		fab: "none",
	},
	effect: {
		codeUnfocusedBlur: "0px",
		backdropBlurSm: "0px",
		backdropBlurMd: "0px",
	},
	opacity: {
		codeUnfocused: 0.6,
		highlighted: 1,
		hidden: 0,
		hoverDim: 0.7,
		secondaryText: 0.6,
		bodyMuted: 0.9,
		iconMuted: 0.4,
		icon: 0.7,
		dialogSurface: 0.85,
	},
	motion: {
		cardImageHoverScale: 1.01,
		iconHoverScale: 1.02,
		cardHoverBrightness: 1,
		toggleOpenRotate: "45deg",
		toTopHiddenTranslateY: "6rem",
	},
	underline: {
		style: "solid",
		thickness: "1px",
		offset: "2px",
		offsetHover: "3px",
		annotationStyle: "dotted",
		mdxThickness: "1px",
		mdxOffset: "2px",
	},
	anchor: {
		hashContent: "§",
		hashMl: "-1.2rem",
		hashMlToggle: "-2.2rem",
		hashOpacityHidden: 0,
		hashOpacityShown: 1,
	},
	nav: {
		highlightType: "underline",
		highlightPosition: "bottom",
		highlight: { insetX: "0", height: "2px", heightActive: "3px", bottom: "0" },
		footerHighlight: { bottom: "0", height: "2px", heightActive: "3px" },
	},
	pinned: {
		size: "1.35rem",
		color: "var(--theme-quote)",
		rotate: "0deg",
		hasBackground: false,
		hasGlass: false,
	},
	icons: scholarIcons,
});
