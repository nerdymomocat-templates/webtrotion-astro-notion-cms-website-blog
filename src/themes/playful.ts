import type { ThemePreset } from "../theme";
import { deepMerge } from "./merge";
import { classicTheme } from "./classic";
import type { ThemeTemplateParams } from "./css-template-types";

// Personality deltas merged onto base.ts: matching selectors replace the base body, new rules are appended. Shared rules belong in base.ts.
export const playfulOverride = (params: ThemeTemplateParams): string => `
@layer base {
.highlighted-word {
    @apply rounded px-1 -mx-[2px];
    background-image: repeating-linear-gradient( -6deg, color-mix(in srgb, var(--color-accent) 22%, transparent) 0, color-mix(in srgb, var(--color-accent) 22%, transparent) 8px, transparent 8px, transparent 12px );
    background-repeat: no-repeat;
    background-size: 100% 1.2em;
    background-position: 0 70%;
  }
}
@layer components {
.ann-bg-c {
    @apply rounded-sm px-1;
    background-color: var(--abc, transparent);
  }
.annotation-underline {
    @apply underline decoration-wavy decoration-2 decoration-accent/70 underline-offset-5;
  }
.author-icon-link {
    @apply inline-flex items-center transition-[color,transform] duration-200 ease-out justify-center rounded-full border-2 border-dashed border-gray-200 p-0.5;
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-accent) 16%, transparent);
  }
.author-icon-link:hover {
    @apply border-gray-400;
  }
.author-name-link {
    @apply underline decoration-wavy decoration-1 transition-colors decoration-accent/60 underline-offset-4 font-medium;
  }
.author-name-link:hover {
    @apply decoration-accent/90 text-quote;
  }
.auto-imported-section {
    @apply mt-12 border-t border-accent/15 pt-4;
  }
.bookmark-card {
    @apply flex w-full max-w-full min-w-0 grow items-stretch overflow-hidden no-underline select-none border-2 border-solid;
    border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
    border-radius: 225px 15px 255px 15px / 15px 255px 15px 225px;
    box-shadow: 3px 3px 0 color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
.bottom-toc-button {
    @apply fixed end-4 ${params.bottomTocButtonBottom} z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-3xl transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] sm:hidden print:hidden border-2 border-dashed;
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-accent) 20%, transparent);
  }
.bottom-toc-button,
  .to-top-btn,
  .copy-markdown-btn {
    background-color: color-mix(in srgb, var(--color-accent) 18%, var(--color-bgColor));
    border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-bgColor));
    color: color-mix(in srgb, var(--color-accent) 85%, var(--color-bgColor));
  }
.callout {
    @apply mx-auto flex w-full max-w-full px-3 py-4 leading-6 my-3 border-2 border-solid;
    border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-accent) 10%, transparent);
  }
.copy-markdown-btn {
    @apply inline-flex items-center gap-1 transition disabled:opacity-60 disabled:cursor-not-allowed h-10 w-10 rounded-full flex justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer backdrop-blur-md print:hidden border-2 border-dashed shadow-none;
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-accent) 20%, transparent);
  }
.count-badge {
    @apply ml-2 bg-gray-100 px-2 py-0.5 text-rose-800 dark:bg-gray-800 dark:text-rose-300 rounded-full font-mono;
  }
.dark .footer-link::before {
    background-image: none;
    background-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  }
.dark .nav-link::before {
    background-image: none;
    background-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
  }
.divider {
    @apply mx-auto w-full bg-transparent my-6 h-0 border-t border-accent/25;
  }
.footer-link {
    @apply relative z-0 px-4 py-2 sm:px-2 sm:py-0 tracking-[0.08em];
  }
.footer-link::before {
    content: "";
    position: absolute;
    left: 0.1em;
    right: 0.1em;
    bottom: 0.05em;
    height: 0.5em;
    border-radius: 0.6em 0.3em;
    background-color: color-mix(in srgb, var(--color-accent) 22%, transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
  }
.footer-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 0.7em;
    background-image: repeating-linear-gradient( -12deg, color-mix(in srgb, var(--color-accent-2) 24%, transparent) 0, color-mix(in srgb, var(--color-accent-2) 24%, transparent) 6px, transparent 6px, transparent 10px );
  }
.footer-nav {
    @apply flex flex-wrap gap-x-2 rounded-sm border-t border-b border-accent/15 sm:gap-x-2 sm:border-none print:hidden;
  }
.hasId::before {
    content: "~";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
.mdx-notion h1,
  .mdx-notion h2 {
    @apply font-bold text-textColor tracking-[-0.01em] mt-5 mb-3 font-accent;
  }
.mdx-notion h3 {
    @apply font-bold text-textColor tracking-[-0.01em] mt-5 mb-3;
  }
.nav-link {
    @apply relative z-0 w-fit self-end px-3 py-1 text-right sm:w-auto sm:self-auto sm:py-0 sm:text-left tracking-[0.08em];
  }
.nav-link::before {
    content: "";
    position: absolute;
    left: 0.1em;
    right: 0.1em;
    bottom: 0.05em;
    height: 0.5em;
    border-radius: 0.6em 0.3em;
    background-color: color-mix(in srgb, var(--color-accent) 22%, transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
  }
.nav-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 0.7em;
    background-image: repeating-linear-gradient( -12deg, color-mix(in srgb, var(--color-accent-2) 24%, transparent) 0, color-mix(in srgb, var(--color-accent-2) 24%, transparent) 6px, transparent 6px, transparent 10px );
  }
.nav-menu {
    @apply bg-bgColor/95 text-accent absolute -inset-x-4 top-14 hidden flex-col items-end py-2 text-base shadow-lg backdrop-blur-sm group-[.menu-open]:z-50 group-[.menu-open]:flex sm:static sm:z-auto sm:-ms-4 sm:mt-1 sm:flex sm:flex-row sm:items-center sm:rounded-none sm:py-0 sm:text-sm sm:shadow-none sm:backdrop-blur-none lg:text-base print:hidden gap-y-3 sm:gap-y-0 lg:gap-x-4 rounded-2xl border border-accent/15 sm:border-none;
  }
.non-toggle-h2 {
    @apply relative mb-4 cursor-pointer text-2xl font-normal tracking-[0.08em] font-accent;
  }
.non-toggle-h2::before {
    content: "~";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
.notion-divider {
    @apply mx-auto w-full bg-transparent my-6 h-0 border-t border-accent-2/30;
  }
.notion-h1 {
    @apply cursor-pointer text-2xl font-semibold mt-10 mb-2 tracking-[0.05em] font-accent;
    background-image: repeating-linear-gradient( -8deg, color-mix(in srgb, var(--color-accent) 18%, transparent) 0, color-mix(in srgb, var(--color-accent) 18%, transparent) 8px, transparent 8px, transparent 12px );
    background-repeat: no-repeat;
    background-size: 100% 0.5em;
    background-position: 0 92%;
  }
.notion-h2 {
    @apply cursor-pointer text-xl font-semibold mt-8 mb-2 tracking-[0.05em];
    background-image: repeating-linear-gradient( -8deg, color-mix(in srgb, var(--color-accent) 15%, transparent) 0, color-mix(in srgb, var(--color-accent) 15%, transparent) 8px, transparent 8px, transparent 12px );
    background-repeat: no-repeat;
    background-size: 100% 0.45em;
    background-position: 0 92%;
  }
.notion-h3 {
    @apply cursor-pointer text-lg font-semibold mt-6 mb-2 tracking-[0.05em];
    background-image: repeating-linear-gradient( -8deg, color-mix(in srgb, var(--color-accent) 13%, transparent) 0, color-mix(in srgb, var(--color-accent) 13%, transparent) 8px, transparent 8px, transparent 12px );
    background-repeat: no-repeat;
    background-size: 100% 0.4em;
    background-position: 0 92%;
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
    @apply border-2 border-solid px-3 py-0.5 font-medium tracking-[0.08em];
    border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
    border-radius: 120px 18px 120px 18px / 18px 120px 18px 120px;
    background-image: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-accent) 10%, transparent),
      transparent 70%
    );
  }
.nquote {
    @apply relative my-4 border-s-4 border-solid px-4! py-3 bg-accent/8;
    border-inline-start-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
  }
.nquote::before,
  .nquote::after {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    width: 0.7rem;
    height: 0;
    border-top: 4px solid color-mix(in srgb, var(--color-accent) 60%, transparent);
  }
.nquote::before {
    top: 0;
  }
.nquote::after {
    bottom: 0;
  }
.search-btn {
    @apply hover:text-accent hover:bg-accent/10 active:scale-[0.94] flex h-10 w-10 cursor-pointer items-center justify-center transition-[color,background-color,transform] duration-150 ease-out rounded-full border-2 border-dashed;
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
.search-close-btn {
    @apply ms-auto cursor-pointer rounded-full border-2 border-dashed bg-zinc-200 p-2 font-semibold dark:bg-zinc-700;
  }
.search-dialog {
    @apply bg-bgColor/90 h-full max-h-full w-full max-w-full border border-solid border-accent/25 shadow-none backdrop:backdrop-blur-sm sm:mx-auto sm:mt-16 sm:mb-auto sm:h-max sm:max-h-[calc(100%-8rem)] sm:min-h-[15rem] sm:w-5/6 sm:max-w-[48rem] sm:rounded-2xl;
    box-shadow: 3px 3px 0 color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
.search-frame {
    @apply flex flex-col gap-4 p-6 pt-12 sm:pt-6;
  }
.site-footer {
    @apply text-accent mt-auto flex w-full flex-col items-center justify-center gap-y-2 pt-20 pb-4 text-center align-top text-sm sm:flex-row sm:justify-between lg:-ml-[25%] lg:w-[150%] border-t border-accent/15;
  }
.site-name {
    @apply font-accent;
  }
.site-page-link {
    @apply underline decoration-wavy decoration-from-font decoration-4 decoration-accent-2/70 hover:decoration-accent-2/90 underline-offset-5 tracking-[0.06em];
  }
.theme-toggle-btn {
    @apply hover:text-accent hover:bg-accent/10 active:scale-[0.94] relative h-10 w-10 cursor-pointer p-2 transition-[color,background-color,transform] duration-150 ease-out rounded-full border-2 border-dashed;
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
.title {
    @apply text-3xl text-accent-2 font-extrabold tracking-[0.04em] font-accent;
  }
.to-top-btn {
    @apply fixed end-4 ${params.toTopBtnBottom} z-30 flex h-10 w-10 translate-y-28 cursor-pointer items-center justify-center rounded-full text-3xl opacity-0 transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] data-[show=true]:translate-y-0 data-[show=true]:opacity-100 sm:end-8 sm:bottom-8 sm:h-12 sm:w-12 print:hidden border-2 border-dashed;
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--color-accent) 20%, transparent);
  }
.toc-content {
    @apply border-accent/15 bg-bgColor absolute right-1 bottom-0 max-h-[55vh] w-76 overflow-y-auto p-2 transition-[opacity,transform] duration-200 ease-out sm:top-0 sm:bottom-auto sm:max-h-[68vh] rounded-2xl border border-solid;
    background-image: repeating-linear-gradient( -6deg, color-mix(in srgb, var(--color-accent) 6%, transparent) 0, color-mix(in srgb, var(--color-accent) 6%, transparent) 10px, transparent 10px, transparent 16px );
    box-shadow: 3px 3px 0 color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
.toc-content .text-quote\\! {
    @apply bg-accent/15 font-semibold;
    background-image: repeating-linear-gradient(
      -12deg,
      color-mix(in srgb, var(--color-accent) 12%, transparent) 0,
      color-mix(in srgb, var(--color-accent) 12%, transparent) 8px,
      transparent 8px,
      transparent 14px
    );
  }
.toc-content [id^="-tocid--"] {
    @apply rounded-md px-2 py-1 tracking-[0.08em] transition-colors duration-200;
  }
.toc-content [id^="-tocid--"]:hover {
    @apply bg-accent/10;
    background-image: repeating-linear-gradient(
      -12deg,
      color-mix(in srgb, var(--color-accent) 12%, transparent) 0,
      color-mix(in srgb, var(--color-accent) 12%, transparent) 8px,
      transparent 8px,
      transparent 14px
    );
  }
.visual-container {
    @apply bg-bgColor absolute top-6 right-0 hidden w-8 flex-col items-end space-y-2 overflow-hidden p-2 transition-opacity duration-200 sm:flex border border-solid border-accent/15 rounded-full;
  }
.visual-container [id^="-vistocid--"] {
    @apply h-1.5 w-1.5 rounded-full;
    border: none;
    box-shadow: none;
  }
#auto-recent-posts {
    @apply relative mt-8 mb-4 cursor-pointer text-2xl font-normal font-accent;
  }
#auto-recent-posts::before {
    content: "~";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
a[aria-label^="View posts by"] {
    @apply underline decoration-wavy decoration-accent/40 underline-offset-4 tracking-[0.08em];
  }
}
@layer components {
.auto-imported-section > hr {
    @apply mx-auto w-full bg-transparent my-6 h-0 border-t border-accent/15;
  }
}
@layer components {
a[aria-label^="View all posts with the tag:"] > span {
    @apply border border-solid border-accent/25 px-1 font-semibold tracking-[0.12em];
    border-radius: 90px 14px 90px 14px / 14px 90px 14px 90px;
  }
}
@layer components {
a[aria-label^="View posts by"] > span {
    @apply border-2 border-solid border-accent/25 px-3 py-1 font-semibold tracking-[0.08em];
    border-radius: 120px 18px 120px 18px / 18px 120px 18px 120px;
    background-image: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-accent) 10%, transparent),
      transparent 70%
    );
  }
}
@layer components {
a[aria-label^="View posts with the tag:"] > span,
  h1.title > span {
    @apply border-2 border-solid border-accent/25 px-3 py-1 font-semibold tracking-[0.08em];
    border-radius: 120px 18px 120px 18px / 18px 120px 18px 120px;
    background-image: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-accent) 10%, transparent),
      transparent 70%
    );
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
    @apply relative overflow-hidden bg-bgColor transition-[box-shadow,transform] duration-200 border-2 border-solid border-gray-200;
    border-radius: 250px 25px 230px 20px / 20px 230px 25px 250px;
    transition-timing-function: var(--ease-out);
    box-shadow: 4px 4px 0 color-mix(in srgb, var(--color-accent) 18%, transparent);
}
.post-card-authors {
    @apply -mt-1 px-0 pb-1 tracking-[0.06em];
}
.post-card-image {
    @apply h-full w-full object-cover transition-transform duration-300 ease-out rounded-2xl;
}
.post-card-image-container {
    @apply relative overflow-hidden aspect-[3/2] rounded-2xl border-2 border-solid;
    border-color: color-mix(in srgb, var(--color-textColor) 6%, transparent);
}
.post-card-placeholder {
    @apply flex h-full w-full items-center justify-center rounded-2xl;
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent));
    transition: transform 300ms ease, filter 300ms ease;
}
.post-card-tags {
    @apply flex flex-wrap items-baseline px-0 pb-3 gap-2 tracking-[0.06em];
}
.post-card:hover {
    @apply -translate-y-1;
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
  @apply relative overflow-hidden bg-bgColor transition-[box-shadow,transform] duration-200 border-2 border-solid border-accent/30;
  border-radius: 250px 25px 230px 20px / 20px 230px 25px 250px;
  transition-timing-function: var(--ease-out);
  box-shadow: 4px 4px 0 color-mix(in srgb, var(--color-accent) 18%, transparent);
}
.post-card:hover {
  box-shadow: 7px 7px 0 color-mix(in srgb, var(--color-accent) 26%, transparent);
  transform: translateY(-4px);
}
.post-card-image-container {
  @apply relative overflow-hidden aspect-[3/2] rounded-2xl border-2 border-solid border-accent/30;
}
.post-card-image {
  @apply h-full w-full object-cover transition-transform duration-300 ease-out rounded-2xl;
}
.post-card-placeholder {
  @apply flex h-full w-full items-center justify-center rounded-2xl;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent));
  transition: transform 300ms ease, filter 300ms ease;
}
.post-card-placeholder span {
  @apply text-[2.5rem] font-bold;
  color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}
.post-card-badge {
  @apply bg-quote/90 absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-full border-2 border-white/50 font-bold;
}
.post-card-meta-date {
  @apply text-accent/80 mb-1 block font-mono text-[10px] tracking-[0.04em];
}
.post-card-title {
  @apply mb-1 text-sm leading-snug font-semibold font-accent;
}
.post-card-author-link {
  @apply text-textColor/60 hover:text-accent text-[10px] transition-colors hover:underline decoration-dashed underline-offset-2;
}


/* Search modal + results */
html site-search {
  --pf-border-radius: 0.9rem;
  --pf-shadow: 6px 6px 0 color-mix(in srgb, var(--color-accent) 22%, transparent);
  --pf-border: color-mix(in srgb, var(--color-accent) 35%, transparent);
}
html site-search .pf-modal,
html site-search .pf-input,
html site-search .pf-dropdown-menu,
html site-search .pf-dropdown-trigger,
html .webtrotion-search-result-card,
html .webtrotion-search-navigation-link,
html .webtrotion-search-pinned-link,
html .webtrotion-search-subresult-link {
  border-radius: 0.9rem !important;
}


/* Component radius (new astro-v7 components -> theme radius scale) */
html :is(.embed-media-box, .embed-iframe-notion, .embed-iframe-maps, .notion-popover, .notion-image, .notion-file-container, .notion-file-link, .code-rendered, .code-iframe, .html-frame-lightbox-content .code-iframe, .code .mermaid, .datatable-input, .toc-content) {
    border-radius: 1.25rem;
  }
html :is(.notion-list-item-colored, .toggle-colored, .todo-item-colored, .annotation-code, .toc-link, .toc-visual) {
    border-radius: 0.5rem;
  }

/* ── A5: tinted / alpha Notion colored surfaces (kill opaque poster-slabs) ── */
/* Non-tag colored fills (callout / to-do / colored list / toggle) mixed toward
   transparent so the page bg shows through. Tag pills use separate -bg-tag- tokens
   and are unaffected. Notion "default" uses a border token (no bg fill), so no rule. */
.callout[class*="ngray-bg"],
.todo-item-colored[class*="ngray-bg"],
.notion-list-item-colored[class*="ngray-bg"],
.toggle-colored[class*="ngray-bg"] {
  background-color: color-mix(in srgb, var(--color-ngray-bg-light) 62%, transparent);
}
.dark .callout[class*="ngray-bg"],
.dark .todo-item-colored[class*="ngray-bg"],
.dark .notion-list-item-colored[class*="ngray-bg"],
.dark .toggle-colored[class*="ngray-bg"] {
  background-color: color-mix(in srgb, var(--color-ngray-bg-dark) 55%, transparent);
}
.callout[class*="nbrown-bg"],
.todo-item-colored[class*="nbrown-bg"],
.notion-list-item-colored[class*="nbrown-bg"],
.toggle-colored[class*="nbrown-bg"] {
  background-color: color-mix(in srgb, var(--color-nbrown-bg-light) 62%, transparent);
}
.dark .callout[class*="nbrown-bg"],
.dark .todo-item-colored[class*="nbrown-bg"],
.dark .notion-list-item-colored[class*="nbrown-bg"],
.dark .toggle-colored[class*="nbrown-bg"] {
  background-color: color-mix(in srgb, var(--color-nbrown-bg-dark) 55%, transparent);
}
.callout[class*="norange-bg"],
.todo-item-colored[class*="norange-bg"],
.notion-list-item-colored[class*="norange-bg"],
.toggle-colored[class*="norange-bg"] {
  background-color: color-mix(in srgb, var(--color-norange-bg-light) 62%, transparent);
}
.dark .callout[class*="norange-bg"],
.dark .todo-item-colored[class*="norange-bg"],
.dark .notion-list-item-colored[class*="norange-bg"],
.dark .toggle-colored[class*="norange-bg"] {
  background-color: color-mix(in srgb, var(--color-norange-bg-dark) 55%, transparent);
}
.callout[class*="nyellow-bg"],
.todo-item-colored[class*="nyellow-bg"],
.notion-list-item-colored[class*="nyellow-bg"],
.toggle-colored[class*="nyellow-bg"] {
  background-color: color-mix(in srgb, var(--color-nyellow-bg-light) 62%, transparent);
}
.dark .callout[class*="nyellow-bg"],
.dark .todo-item-colored[class*="nyellow-bg"],
.dark .notion-list-item-colored[class*="nyellow-bg"],
.dark .toggle-colored[class*="nyellow-bg"] {
  background-color: color-mix(in srgb, var(--color-nyellow-bg-dark) 55%, transparent);
}
.callout[class*="ngreen-bg"],
.todo-item-colored[class*="ngreen-bg"],
.notion-list-item-colored[class*="ngreen-bg"],
.toggle-colored[class*="ngreen-bg"] {
  background-color: color-mix(in srgb, var(--color-ngreen-bg-light) 62%, transparent);
}
.dark .callout[class*="ngreen-bg"],
.dark .todo-item-colored[class*="ngreen-bg"],
.dark .notion-list-item-colored[class*="ngreen-bg"],
.dark .toggle-colored[class*="ngreen-bg"] {
  background-color: color-mix(in srgb, var(--color-ngreen-bg-dark) 55%, transparent);
}
.callout[class*="nblue-bg"],
.todo-item-colored[class*="nblue-bg"],
.notion-list-item-colored[class*="nblue-bg"],
.toggle-colored[class*="nblue-bg"] {
  background-color: color-mix(in srgb, var(--color-nblue-bg-light) 62%, transparent);
}
.dark .callout[class*="nblue-bg"],
.dark .todo-item-colored[class*="nblue-bg"],
.dark .notion-list-item-colored[class*="nblue-bg"],
.dark .toggle-colored[class*="nblue-bg"] {
  background-color: color-mix(in srgb, var(--color-nblue-bg-dark) 55%, transparent);
}
.callout[class*="npurple-bg"],
.todo-item-colored[class*="npurple-bg"],
.notion-list-item-colored[class*="npurple-bg"],
.toggle-colored[class*="npurple-bg"] {
  background-color: color-mix(in srgb, var(--color-npurple-bg-light) 62%, transparent);
}
.dark .callout[class*="npurple-bg"],
.dark .todo-item-colored[class*="npurple-bg"],
.dark .notion-list-item-colored[class*="npurple-bg"],
.dark .toggle-colored[class*="npurple-bg"] {
  background-color: color-mix(in srgb, var(--color-npurple-bg-dark) 55%, transparent);
}
.callout[class*="npink-bg"],
.todo-item-colored[class*="npink-bg"],
.notion-list-item-colored[class*="npink-bg"],
.toggle-colored[class*="npink-bg"] {
  background-color: color-mix(in srgb, var(--color-npink-bg-light) 62%, transparent);
}
.dark .callout[class*="npink-bg"],
.dark .todo-item-colored[class*="npink-bg"],
.dark .notion-list-item-colored[class*="npink-bg"],
.dark .toggle-colored[class*="npink-bg"] {
  background-color: color-mix(in srgb, var(--color-npink-bg-dark) 55%, transparent);
}
.callout[class*="nred-bg"],
.todo-item-colored[class*="nred-bg"],
.notion-list-item-colored[class*="nred-bg"],
.toggle-colored[class*="nred-bg"] {
  background-color: color-mix(in srgb, var(--color-nred-bg-light) 62%, transparent);
}
.dark .callout[class*="nred-bg"],
.dark .todo-item-colored[class*="nred-bg"],
.dark .notion-list-item-colored[class*="nred-bg"],
.dark .toggle-colored[class*="nred-bg"] {
  background-color: color-mix(in srgb, var(--color-nred-bg-dark) 55%, transparent);
}
/* Confine the to-do colored row so it reads as a translucent marker, not a slab */
.todo-item-colored {
  @apply rounded-md;
}

/* ── B3: callout icon badge (contain the info-dot bullet) ── */
.callout-icon {
  @apply rounded-full p-1;
  background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

/* ── A6: custom playful checkbox (to-do) states ── */
/* Checkbox is an inline SVG glyph; state comes through via aria-label. Raise
   contrast and tint by state so checked/unchecked are clearly distinct. */
.todo-checkbox-icon {
  color: color-mix(in srgb, var(--color-accent) 70%, var(--color-textColor));
}
.todo-checkbox-icon[aria-label="checkbox-checked"] {
  color: color-mix(in srgb, var(--color-accent) 85%, transparent);
}
.todo-checkbox-icon[aria-label="checkbox-unchecked"] {
  color: color-mix(in srgb, var(--color-accent) 45%, var(--color-textColor));
}
/* Completed to-do text: strike-through annotation in accent (R1 strike role) */
.todo-text .line-through {
  color: color-mix(in srgb, var(--color-textColor) 55%, transparent);
  text-decoration-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
}

/* ── B4: tab states (ghost inactive, stronger active box) ── */
/* Unlayered so these win over base's layered border:none. */
.notion-tab-button {
  border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
  background-color: transparent;
}
.notion-tab-button:hover {
  background-color: color-mix(in srgb, var(--color-accent) 8%, var(--color-bgColor));
}
.notion-tab-button.is-active {
  border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
  background-color: color-mix(in srgb, var(--color-accent) 18%, var(--color-bgColor));
  border-radius: 130px 14px 130px 14px / 14px 130px 14px 130px;
}
.notion-tab-panel {
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
}

/* ── B6: bookmark card dark elevation ── */
.dark .bookmark-card {
  background-color: color-mix(in srgb, var(--color-accent) 6%, var(--color-bgColor));
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--color-accent) 22%, transparent),
    0 10px 24px -16px color-mix(in srgb, var(--color-textColor) 60%, transparent);
}

/* ── B5: code caption separation ── */
.code > .caption {
  @apply mt-2 pt-1 text-xs text-textColor/55;
  border-top: 1px solid color-mix(in srgb, var(--color-accent) 12%, transparent);
}
`;

// Playful theme icons - Phosphor Duotone style with rounded corners, friendly appearance
// Characterized by: Rounded corners, 2px stroke, bouncy/whimsical feel
// NO inheritance from classicIcons - complete standalone set

const playfulIcons = {
	"🗓️": "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V10h14zM9 14a1 1 0 1 1 0-2a1 1 0 0 1 0 2m3 0a1 1 0 1 1 0-2a1 1 0 0 1 0 2m3 0a1 1 0 1 1 0-2a1 1 0 0 1 0 2",
	download:
		"M12 3a1 1 0 0 1 1 1v9.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 13.586V4a1 1 0 0 1 1-1zM5 17a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1z",
	rss: "M4 4a16 16 0 0 1 16 16a1.5 1.5 0 0 1-3 0A13 13 0 0 0 4 7a1.5 1.5 0 0 1 0-3m0 6a10 10 0 0 1 10 10a1.5 1.5 0 0 1-3 0a7 7 0 0 0-7-7a1.5 1.5 0 0 1 0-3m1 7a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5",
	dblp: "M3.075.002c-.096.013-.154.092-.094.31L4.97 7.73L3.1 8.6s-.56.26-.4.85l2.45 9.159s.16.59.72.33l6.169-2.869l1.3-.61s.52-.24.42-.79l-.01-.06l-1.13-4.22l-.658-2.45l-.672-2.49v-.04s-.16-.59-.84-1L3.5.141s-.265-.16-.425-.139M18.324 5.03a.7.7 0 0 0-.193.06l-5.602 2.6l.862 3.2l1.09 4.08l.01.06c.05.47-.411.79-.411.79l-1.88.87l.5 1.89l.04.1c.07.17.28.6.81.91l6.95 4.269s.68.41.52-.17l-1.981-7.4l1.861-.86s.56-.26.4-.85L18.85 5.42s-.116-.452-.526-.39",
	email:
		"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2m8 7l8-5H4zm0 2L4 8v10h16V8z",
	github:
		"M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.49c.5.09.682-.218.682-.484l-.013-1.874c-2.782.605-3.369-1.343-3.369-1.343c-.454-1.156-1.11-1.464-1.11-1.464c-.908-.62.069-.608.069-.608c1.003.07 1.531 1.031 1.531 1.031c.892 1.53 2.341 1.087 2.91.831c.091-.647.35-1.087.636-1.337c-2.22-.253-4.555-1.11-4.555-4.943c0-1.091.39-1.984 1.03-2.682c-.103-.254-.447-1.27.098-2.646c0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.836a9.6 9.6 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025c.546 1.376.202 2.392.1 2.646c.64.698 1.028 1.59 1.028 2.682c0 3.842-2.337 4.687-4.565 4.935c.359.309.678.919.678 1.852l-.012 2.746c0 .268.18.578.688.48C19.138 20.16 22 16.416 22 12c0-5.523-4.477-10-10-10z",
	googlescholar:
		"M5.242 13.769L0 9.5L12 0l12 9.5l-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269M12 10a7 7 0 1 0 0 14a7 7 0 0 0 0-14",
	linkedin:
		"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037c-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85c3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065a2.064 2.064 0 1 1 2.063 2.065m1.782 13.019H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z",
	facebook:
		"M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89c1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z",
	twitter:
		"M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.2 4.2 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.52 8.52 0 0 1-5.33 1.84q-.51 0-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23",
	threads:
		"M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098c1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015c-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164c1.43 1.783 3.631 2.698 6.54 2.717c2.623-.02 4.358-.631 5.8-2.045c1.647-1.613 1.618-3.593 1.09-4.798c-.31-.71-.873-1.3-1.634-1.75c-.192 1.352-.622 2.446-1.284 3.272c-.886 1.102-2.14 1.704-3.73 1.79c-1.202.065-2.361-.218-3.259-.801c-1.063-.689-1.685-1.74-1.752-2.964c-.065-1.19.408-2.285 1.33-3.082c.88-.76 2.119-1.207 3.583-1.291a14 14 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757c-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32l-1.757-1.18c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388q.163.07.321.142c1.49.7 2.58 1.761 3.154 3.07c.797 1.82.871 4.79-1.548 7.158c-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69q-.362 0-.739.021c-1.836.103-2.98.946-2.916 2.143c.067 1.256 1.452 1.839 2.784 1.767c1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221",
	instagram:
		"M12 2.163c3.204 0 3.584.012 4.85.07c3.252.148 4.771 1.691 4.919 4.919c.058 1.265.069 1.645.069 4.849c0 3.205-.012 3.584-.069 4.849c-.149 3.225-1.664 4.771-4.919 4.919c-1.266.058-1.644.07-4.85.07c-3.204 0-3.584-.012-4.849-.07c-3.26-.149-4.771-1.699-4.919-4.92c-.058-1.265-.07-1.644-.07-4.849c0-3.204.013-3.583.07-4.849c.149-3.227 1.664-4.771 4.919-4.919c1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072C2.695.272.273 2.69.073 7.052C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98c.059-1.28.073-1.689.073-4.948c0-3.259-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324a6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8a4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881a1.44 1.44 0 0 0 0-2.881z",
	mastodon:
		"M20.94 14c-.28 1.41-2.44 2.96-4.97 3.26c-1.31.15-2.6.3-3.97.24c-2.25-.11-4-.54-4-.54v.62c.32 2.22 2.22 2.35 4.03 2.42c1.82.05 3.44-.46 3.44-.46l.08 1.65s-1.28.68-3.55.81c-1.25.07-2.81-.03-4.62-.5c-3.92-1.05-4.6-5.24-4.7-9.5l-.01-3.43c0-4.34 2.83-5.61 2.83-5.61C6.95 2.3 9.41 2 11.97 2h.06c2.56 0 5.02.3 6.47.96c0 0 2.83 1.27 2.83 5.61c0 0 .04 3.21-.39 5.43M18 8.91c0-1.08-.3-1.91-.85-2.56c-.56-.63-1.3-.96-2.23-.96c-1.06 0-1.87.41-2.42 1.23l-.5.88l-.5-.88c-.56-.82-1.36-1.23-2.43-1.23c-.92 0-1.66.33-2.23.96C6.29 7 6 7.83 6 8.91v5.26h2.1V9.06c0-1.06.45-1.62 1.36-1.62c1 0 1.5.65 1.5 1.93v2.79h2.07V9.37c0-1.28.5-1.93 1.51-1.93c.9 0 1.35.56 1.35 1.62v5.11H18z",
	semanticscholar:
		"M24 8.609c-.848.536-1.436.83-2.146 1.245c-4.152 2.509-8.15 5.295-11.247 8.981l-1.488 1.817l-4.568-7.268c1.021.814 3.564 3.098 4.603 3.599l3.356-2.526c2.336-1.644 8.946-5.226 11.49-5.848M8.046 15.201c.346.277.692.537.969.744c.761-3.668.121-7.613-1.886-11.039c3.374-.052 6.731-.087 10.105-.139a14.8 14.8 0 0 1 1.298 5.295c.294-.156.588-.294.883-.433c-.104-1.868-.641-3.91-1.662-6.263c-4.602-.018-9.188-.018-13.79-.018c2.993 3.547 4.36 7.839 4.083 11.853m-.623-.484c.087.086.191.155.277.225c-.138-3.409-1.419-6.887-3.824-9.881H1.73c3.098 2.855 4.984 6.299 5.693 9.656m-.744-.658c.104.087.208.173.329.277c-.9-2.526-2.492-5.018-4.741-7.198H0c2.89 2.076 5.122 4.481 6.679 6.921",
	"this-github-repo":
		"M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm6.75 10.5c2.75 0 3.49-2.03 3.68-3.1c.91-.29 1.57-1.14 1.57-2.15C18 7 17 6 15.75 6S13.5 7 13.5 8.25c0 .94.57 1.75 1.39 2.08C14.67 11 14 12 12 12c-1.38 0-2.34.35-3 .84V8.87c.87-.31 1.5-1.14 1.5-2.12c0-1.25-1-2.25-2.25-2.25S6 5.5 6 6.75c0 .98.63 1.81 1.5 2.12v6.26c-.87.31-1.5 1.14-1.5 2.12c0 1.25 1 2.25 2.25 2.25s2.25-1 2.25-2.25c0-.93-.56-1.75-1.37-2.07c.28-.68 1.1-1.68 3.62-1.68m-4.5 3a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75m0-10.5a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75m7.5 1.5a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75",
	"page-mention-ne-arrow":
		"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m5 6v5a1 1 0 0 1-2 0v-2.586l-5.293 5.293a1 1 0 0 1-1.414-1.414L13.586 9H11a1 1 0 0 1 0-2h5z",
	document:
		"M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm7 1.5L18.5 9H13zM8 12h8a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2m0 4h6a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2",
	expand:
		"M4 14a1 1 0 0 1 1 1v4h4a1 1 0 0 1 0 2H5a2 2 0 0 1-2-2v-4a1 1 0 0 1 1-1m16 0a1 1 0 0 1 1 1v4a2 2 0 0 1-2 2h-4a1 1 0 0 1 0-2h4v-4a1 1 0 0 1 1-1M9 3a1 1 0 0 1 0 2H5v4a1 1 0 0 1-2 0V5a2 2 0 0 1 2-2zm6 0h4a2 2 0 0 1 2 2v4a1 1 0 0 1-2 0V5h-4a1 1 0 0 1 0-2",
	"preview-pdf":
		"M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm7 1.5L18.5 9H13zm-1 7.5a3 3 0 1 1 0 6a3 3 0 0 1 0-6",
	"table-of-contents":
		"M4 6a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1m0 4a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1m1 3a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2zm-1 5a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1m14-12a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1",
	"clear-search":
		"M10 4a6 6 0 1 0 0 12a6 6 0 0 0 0-12m-8 6a8 8 0 1 1 14.32 4.906l4.387 4.387a1 1 0 0 1-1.414 1.414l-4.387-4.387A8 8 0 0 1 2 10m5.293-.707a1 1 0 0 1 1.414 0L10 10.586l1.293-1.293a1 1 0 1 1 1.414 1.414L11.414 12l1.293 1.293a1 1 0 0 1-1.414 1.414L10 13.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L8.586 12L7.293 10.707a1 1 0 0 1 0-1.414",
	close:
		"M6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0-1.414-1.414L12 10.586z",
	"checkbox-unchecked": "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z",
	"checkbox-checked":
		"M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm6.707 7.707a1 1 0 0 1-1.414 0l-2-2a1 1 0 1 1 1.414-1.414L10 11.586l4.293-4.293a1 1 0 1 1 1.414 1.414z",
	"clipboard-copy-code":
		"M9 3a1 1 0 0 0-1 1H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2a1 1 0 0 0-1-1zm0 2v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5h1v14H6V5z",
	"clipboard-copy-code-done":
		"M9 3a1 1 0 0 0-1 1H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2a1 1 0 0 0-1-1zm0 2v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5h1v14H6V5zm6.707 6.707l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 1 1 1.414-1.414L11 13.586l3.293-3.293a1 1 0 1 1 1.414 1.414z",
	"tag-multiple":
		"M7.5 8.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 1.414.586l7 7a2 2 0 0 1 0 2.828l-5 5a2 2 0 0 1-2.828 0l-7-7A2 2 0 0 1 3 10zm10 0a1 1 0 0 1 1 0l7 7a3 3 0 0 1 0 4.242l-3.879 3.879a1 1 0 0 1-1.414-1.414l3.879-3.879a1 1 0 0 0 0-1.414l-7-7a1 1 0 0 1 1.414-1.414z",
	pin: "M9 2a1 1 0 0 0-1 1v9.586l-2.707 2.707a1 1 0 0 0 1.414 1.414L9 14.414V21a1 1 0 1 0 2 0v-6.586l2.293 2.293a1 1 0 0 0 1.414-1.414L12 12.586V3a1 1 0 0 0-1-1z",
	"pin-bold":
		"M9 2a1 1 0 0 0-1 1v9.586l-2.707 2.707a1 1 0 0 0 1.414 1.414L9 14.414V21a1 1 0 1 0 2 0v-6.586l2.293 2.293a1 1 0 0 0 1.414-1.414L12 12.586V3a1 1 0 0 0-1-1z",
	"pin-elegant":
		"M9 2a1 1 0 0 0-1 1v9.586l-2.707 2.707a1 1 0 0 0 1.414 1.414L9 14.414V21a1 1 0 1 0 2 0v-6.586l2.293 2.293a1 1 0 0 0 1.414-1.414L12 12.586V3a1 1 0 0 0-1-1z",
	"pin-outline":
		"M9 2a1 1 0 0 0-1 1v9.586l-2.707 2.707a1 1 0 0 0 1.414 1.414L9 14.414V21a1 1 0 1 0 2 0v-6.586l2.293 2.293a1 1 0 0 0 1.414-1.414L12 12.586V3a1 1 0 0 0-1-1z",
	"pin-playful":
		"M9 2a1 1 0 0 0-1 1v9.586l-2.707 2.707a1 1 0 0 0 1.414 1.414L9 14.414V21a1 1 0 1 0 2 0v-6.586l2.293 2.293a1 1 0 0 0 1.414-1.414L12 12.586V3a1 1 0 0 0-1-1z",
	"tag-outline":
		"M7.5 8a1 1 0 1 0 0-2a1 1 0 0 0 0 2M5 3a2 2 0 0 0-2 2v5a2 2 0 0 0 .586 1.414l7 7a2 2 0 0 0 2.828 0l5-5a2 2 0 0 0 0-2.828l-7-7A2 2 0 0 0 10 3z",
	web: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20m-1 17.93A8 8 0 0 1 4 12c0-.61.08-1.21.21-1.78L9 15v1a2 2 0 0 0 2 2zm6.9-2.54A2 2 0 0 0 16 16h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a8 8 0 0 1 2.9 12.8",
	"open-in-new":
		"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6a1 1 0 0 1 0 2H5v11h11v-6a1 1 0 0 1 2 0m3-10a1 1 0 0 0-1-1h-6a1 1 0 0 0 0 2h3.586l-9.293 9.293a1 1 0 0 0 1.414 1.414L19 5.414V9a1 1 0 0 0 2 0z",
	search:
		"M10 4a6 6 0 1 0 0 12a6 6 0 0 0 0-12m-8 6a8 8 0 1 1 14.32 4.906l4.387 4.387a1 1 0 0 1-1.414 1.414l-4.387-4.387A8 8 0 0 1 2 10z",
	"theme-dark":
		"M12.055 3a1 1 0 0 1 .97 1.243A7 7 0 0 0 19.757 11a1 1 0 0 1 1.243.97a9.004 9.004 0 0 1-8.97 9.03C6.5 21 2 16.5 2 11c0-4.973 3.636-9.095 8.394-9.857A1 1 0 0 1 12.055 3z",
	"theme-light":
		"M12 1a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1zM4.222 4.222a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1-1.414 1.414L4.222 5.636a1 1 0 0 1 0-1.414zM18.364 4.222a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8m-6 4a6 6 0 1 1 12 0a6 6 0 0 1-12 0zm-5 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1zm19 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM5.636 16.95a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zm12.728 0a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 0-1.414zM12 19a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1z",
	"to-top":
		"M12 4a1 1 0 0 1 .707.293l5 5a1 1 0 0 1-1.414 1.414L12 6.414l-4.293 4.293a1 1 0 0 1-1.414-1.414l5-5A1 1 0 0 1 12 4zm.707 8.293a1 1 0 0 0-1.414 0l-5 5a1 1 0 1 0 1.414 1.414L12 14.414l4.293 4.293a1 1 0 0 0 1.414-1.414z",
	"theme-system":
		"M9.173 14.83a4 4 0 1 1 5.657-5.657m-2.83 2.827a7.5 7.5 0 0 0 8.845 2.492A9 9 0 0 1 5.642 18.36M3 12h1m8-9v1M5.6 5.6l.7.7M3 21L21 3",
	"toggle-triangle": "M8 7a1 1 0 0 1 1.6-.8l6 4.5a1 1 0 0 1 0 1.6l-6 4.5A1 1 0 0 1 8 16z",
	menu: "M3 6a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 6a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm1 5a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2z",
	filter:
		"M4 4a2 2 0 0 0-2 2v2a2 2 0 0 0 .586 1.414L8 14.828V19a2 2 0 0 0 .586 1.414l2 2A2 2 0 0 0 14 21v-6.172l5.414-5.414A2 2 0 0 0 20 8V6a2 2 0 0 0-2-2z",
	author:
		"M12 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8M6 8a6 6 0 1 1 12 0A6 6 0 0 1 6 8zm2 10a2 2 0 0 0-2 2a1 1 0 1 1-2 0a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4a1 1 0 1 1-2 0a2 2 0 0 0-2-2z",
	"table-search":
		"M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6.81a6.5 6.5 0 0 1-1.31-2H5v-4h5.5a6.5 6.5 0 0 1 1-2H5V8h6v2.81a6.5 6.5 0 0 1 2-1.31V8h6v2a6.5 6.5 0 0 1 2 2V6a2 2 0 0 0-2-2m1.3 13.89c1.32-2.1.7-4.89-1.41-6.21a4.52 4.52 0 0 0-6.21 1.41C11.36 15.2 12 18 14.09 19.3c1.47.92 3.33.92 4.8 0L22 22.39L23.39 21z",
	calendar:
		"M17 3a1 1 0 0 0-2 0v1H9V3a1 1 0 0 0-2 0v1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2zm2 7H5v10h14zM8 13a1 1 0 1 1 0 2a1 1 0 0 1 0-2m4 0a1 1 0 1 1 0 2a1 1 0 0 1 0-2m4 0a1 1 0 1 1 0 2a1 1 0 0 1 0-2",
	"external-link-mention":
		"M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4a1 1 0 0 1 2 0v4a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h4a1 1 0 1 1 0 2m4-2a1 1 0 1 0 0 2h3.586l-6.293 6.293a1 1 0 0 0 1.414 1.414L19 7.414V11a1 1 0 1 0 2 0V5a1 1 0 0 0-1-1z",
	bluesky:
		"M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565C.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479c.815 2.736 3.713 3.66 6.383 3.364q.204-.03.415-.056q-.207.033-.415.056c-3.912.58-7.387 2.005-2.83 7.078c5.013 5.19 6.87-1.113 7.823-4.308c.953 3.195 2.05 9.271 7.733 4.308c4.267-4.308 1.172-6.498-2.74-7.078a9 9 0 0 1-.415-.056q.21.026.415.056c2.67.297 5.568-.628 6.383-3.364c.246-.828.624-5.79.624-6.478c0-.69-.139-1.861-.902-2.206c-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8",
	substack:
		"M22.539 8.242H1.46V5.406h21.08zM1.46 10.812V24L12 18.11L22.54 24V10.812zM22.54 0H1.46v2.836h21.08z",
	kofi: "M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734c4.352.24 7.422-2.831 6.649-6.916m-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09c-.443-.441-3.368-3.049-4.034-3.954c-.709-.965-1.041-2.7-.091-3.71c.951-1.01 3.005-1.086 4.363.407c0 0 1.565-1.782 3.468-.963s1.832 3.011.723 4.311m6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015",
	"buy-me-a-coffee":
		"m20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379c-.197-.069-.42-.098-.57-.241c-.152-.143-.196-.366-.231-.572c-.065-.378-.125-.756-.192-1.133c-.057-.325-.102-.69-.25-.987c-.195-.4-.597-.634-.996-.788a6 6 0 0 0-.626-.194c-1-.263-2.05-.36-3.077-.416a26 26 0 0 0-3.7.062c-.915.083-1.88.184-2.75.5c-.318.116-.646.256-.888.501c-.297.302-.393.77-.177 1.146c.154.267.415.456.692.58c.36.162.737.284 1.123.366c1.075.238 2.189.331 3.287.37q1.829.074 3.65-.118q.449-.05.896-.119c.352-.054.578-.513.474-.834c-.124-.383-.457-.531-.834-.473c-.466.074-.96.108-1.382.146q-1.767.12-3.536.006a22 22 0 0 1-1.157-.107c-.086-.01-.18-.025-.258-.036q-.364-.055-.724-.13c-.111-.027-.111-.185 0-.212h.005q.416-.09.838-.147h.002c.131-.009.263-.032.394-.048a25 25 0 0 1 3.426-.12q1.011.029 2.017.144l.228.031q.4.06.798.145c.392.085.895.113 1.07.542c.055.137.08.288.111.431l.319 1.484a.237.237 0 0 1-.199.284h-.003l-.112.015a37 37 0 0 1-4.743.295a37 37 0 0 1-4.699-.304c-.14-.017-.293-.042-.417-.06c-.326-.048-.649-.108-.973-.161c-.393-.065-.768-.032-1.123.161c-.29.16-.527.404-.675.701c-.154.316-.199.66-.267 1c-.069.34-.176.707-.135 1.056c.087.753.613 1.365 1.37 1.502a39.7 39.7 0 0 0 11.343.376a.483.483 0 0 1 .535.53l-.071.697l-1.018 9.907c-.041.41-.047.832-.125 1.237c-.122.637-.553 1.028-1.182 1.171q-.868.197-1.756.205c-.656.004-1.31-.025-1.966-.022c-.699.004-1.556-.06-2.095-.58c-.475-.458-.54-1.174-.605-1.793l-.731-7.013l-.322-3.094c-.037-.351-.286-.695-.678-.678c-.336.015-.718.3-.678.679l.228 2.185l.949 9.112c.147 1.344 1.174 2.068 2.446 2.272c.742.12 1.503.144 2.257.156c.966.016 1.942.053 2.892-.122c1.408-.258 2.465-1.198 2.616-2.657l1.024-9.995l.215-2.087a.48.48 0 0 1 .39-.426c.402-.078.787-.212 1.074-.518c.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233c-2.416.359-4.866.54-7.308.46c-1.748-.06-3.477-.254-5.207-.498c-.17-.024-.353-.055-.47-.18c-.22-.236-.111-.71-.054-.995c.052-.26.152-.609.463-.646c.484-.057 1.046.148 1.526.22q.865.132 1.737.212c2.48.226 5.002.19 7.472-.14q.675-.09 1.345-.21c.399-.072.84-.206 1.08.206c.166.281.188.657.162.974a.54.54 0 0 1-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a6 6 0 0 1-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38c0 0 1.243.065 1.658.065c.447 0 1.786-.065 1.786-.065c.783 0 1.434-.6 1.499-1.38l.94-9.95a4 4 0 0 0-1.322-.238c-.826 0-1.491.284-2.26.613",
	"external-link":
		"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6a1 1 0 1 1 0 2H5v11h11v-6a1 1 0 0 1 2 0m3-10a1 1 0 0 0-1-1h-6a1 1 0 1 0 0 2h3.586l-9.293 9.293a1 1 0 0 0 1.414 1.414L19 5.414V9a1 1 0 0 0 2 0z",
	next: "M9.293 5.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414L14.586 12L9.293 6.707a1 1 0 0 1 0-1.414z",
	before:
		"M14.707 5.293a1 1 0 0 1 0 1.414L9.414 12l5.293 5.293a1 1 0 0 1-1.414 1.414l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 0z",
	info: "M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12zm10-3a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1zm1-2a1 1 0 1 1-2 0a1 1 0 0 1 2 0z",
	jump: "M12 14a2 2 0 1 1 0 4a2 2 0 0 1 0-4m11.46-5.14l-1.59 6.89L15 14.16l3.8-2.38A7.97 7.97 0 0 0 12 8c-3.95 0-7.23 2.86-7.88 6.63l-1.97-.35C2.96 9.58 7.06 6 12 6c3.58 0 6.73 1.89 8.5 4.72z",
	"copy-as-markdown":
		"M12 21v-7q0-.825.588-1.412T14 12h6q.825 0 1.413.588T22 14v7h-2v-7h-2v5h-2v-5h-2v7zm-7 0q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.175q.275-.875 1.075-1.437T12 1q1 0 1.788.563T14.85 3H19q.825 0 1.413.588T21 5v5h-2V5h-2v3H7V5H5v14h5v2zm7-16q.425 0 .713-.288T13 4t-.288-.712T12 3t-.712.288T11 4t.288.713T12 5",
} as const;

export const playfulTheme: ThemePreset = deepMerge(classicTheme, {
	name: "playful",
	colors: {
		surface1: "color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg))",
		surface2: "color-mix(in srgb, var(--theme-text) 16%, var(--theme-bg))",
		border: "color-mix(in srgb, var(--theme-text) 18%, transparent)",
		mutedText: "color-mix(in srgb, var(--theme-text) 65%, transparent)",
		inlineCodeBg: { light: "#fae8ff", dark: "#2a1f33" },
		inlineCodeText: { light: "#6d28d9", dark: "#f5d0fe" },
		tableBorder: { light: "rgba(196, 181, 253, 0.9)", dark: "rgba(99, 86, 128, 0.9)" },
		searchDialogBorder: "#c084fc",
		buttonMutedBg: { light: "#f5d0fe", dark: "#3b2a4a" },
	},
	mix: {
		blockquoteBg: 16,
		fabBg: 22,
		fabBorder: 55,
		fabText: 90,
		inlineHighlight: 26,
		anchorHash: 60,
		navGrad: { a: 6, b: 14, c: 8 },
		navGradDark: { a: 10, b: 20, c: 12 },
		navActive: { a: 12, b: 28, c: 16 },
		heroTintTop: 62,
		heroTintBottom: 42,
		cardPlaceholder: { a: 14, b: 26 },
		cardImageBorder: 10,
	},
	typography: {
		bodyFont: "sans",
		headingFont: "accent",
		navFont: "accent",
		codeFont: "mono",
	},
	letterSpacing: {
		heading: "0.01em",
		nav: "0.06em",
		chip: "0.08em",
	},
	textTransform: {
		heading: "none",
		nav: "uppercase",
		chip: "uppercase",
		tableHeader: "uppercase",
	},
	lineHeight: {
		body: "1.85",
		heading: "1.25",
		mdxH1: "1.2",
		mdxH2: "1.25",
		mdxH3: "1.3",
		list: "1.7",
		callout: "1.6",
		todo: "1.8",
		bookmarkTitle: "1.25",
		bookmarkMeta: "1.1",
	},
	spacing: {
		pageMaxWidth: "52rem",
		pagePaddingX: "3rem",
		pagePaddingTop: "3rem",
		scrollMarginTop: "3rem",
		h1: { mt: "2.75rem", mb: "0.7rem" },
		h2: { mt: "2.2rem", mb: "0.65rem" },
		h3: { mt: "1.6rem", mb: "0.6rem" },
		text: { my: "0.35rem", minHeight: "1.85rem" },
		list: { gap: "0.4rem", pl: "1.75rem" },
		columnList: { my: "1.5rem", gapX: "1.25rem" },
		columnBasis: "12rem",
		divider: { my: "1.5rem", height: "0.125rem" },
		codeBlock: { padding: "1.25rem", mb: "0.5rem", maxHeight: "360px" },
		codeLine: {
			bleedWidth: "calc(100% + 2.25rem)",
			bleedMl: "-2.25rem",
			bleedPl: "2.25rem",
			bleedPr: "1.25rem",
		},
		codeMarker: { left: "1.25rem", width: "1.25rem" },
		codeFocus: { ml: "-1rem", pl: "1rem" },
		highlightWord: { px: "0.35rem", mx: "-2px" },
		blockquote: { my: "1.25rem", px: "0.8rem", py: "0.6rem", borderWidth: "4px" },
		callout: { my: "0.8rem", px: "1.1rem", py: "1.2rem", iconMr: "0.6rem" },
		table: { pb: "0.75rem", cellPadding: "0.6rem" },
		bookmark: {
			padding: "1rem",
			titleHeight: "1.6rem",
			descHeight: "2.2rem",
			captionMt: "0.5rem",
			iconMr: "0.45rem",
			iconSize: "1rem",
		},
		file: { padding: "0.5rem", previewMl: "0.7rem" },
		tag: { px: "0.5rem" },
		badge: { ml: "0.6rem", px: "0.6rem", py: "0.2rem" },
		image: { figureMt: "0.6rem" },
		todo: {
			pl: "0.7rem",
			gap: "0.6rem",
			checkboxMt: "0.3rem",
			checkboxPr: "0.6rem",
			checkboxSize: "1.3rem",
		},
		toc: {
			right: "1.5rem",
			topSm: "10.5rem",
			visualTop: "2rem",
			visualWidth: "2.25rem",
			visualPadding: "0.6rem",
			visualGap: "0.6rem",
			panelRight: "0.5rem",
			panelWidth: "20rem",
			panelMaxHeight: "62vh",
			panelMaxHeightSm: "72vh",
			panelPadding: "0.75rem",
		},
		iconButton: { size: "2.75rem", sizeSm: "3.25rem", fontSize: "2rem" },
		header: { paddingStartSm: "5rem", mb: "2.5rem" },
		layout: { bleedMlLg: "-24%", bleedWidthLg: "148%" },
		nav: {
			dropdownTop: "3.75rem",
			dropdownInsetX: "-1rem",
			dropdownPy: "0.75rem",
			gapYMobile: "1rem",
			gapXLg: "1.8rem",
		},
		footer: {
			pt: "6rem",
			pb: "1.5rem",
			navGapX: "1rem",
			navBorderWidth: "2px",
			linkPx: "1.1rem",
			linkPy: "0.6rem",
		},
		searchDialog: {
			mtSm: "4.5rem",
			maxHeightSm: "calc(100% - 9rem)",
			minHeightSm: "16rem",
			widthSm: "85%",
			maxWidthSm: "52rem",
		},
		searchFrame: { padding: "1.8rem", paddingTop: "3.25rem", gap: "1.25rem" },
		gallery: { gap: "1.75rem" },
		card: { imageAspect: "4 / 3", tagsPb: "1rem", authorsMt: "0.25rem" },
		hero: { minHeight: "20rem", padding: "3rem", mb: "2.5rem" },
		mdx: {
			paragraphMb: "1.1rem",
			listMt: "0.7rem",
			listMb: "1.1rem",
			listMs: "1.4rem",
			listPs: "0.9rem",
			listItemMy: "0.4rem",
			listItemPs: "0.3rem",
			blockquoteMy: "1.4rem",
			blockquotePx: "1.1rem",
			blockquotePy: "0.7rem",
			codePx: "1.2rem",
			codePy: "1rem",
			codeMy: "1.2rem",
			headingMt: "2rem",
			headingMb: "0.9rem",
		},
		datatable: {
			inputPx: "0.85rem",
			inputPy: "0.6rem",
			filterTogglePx: "0.7rem",
			filterRowMaxHeight: "28rem",
			topMb: "1.1rem",
			cellPaddingMultiplier: "1.1",
			sorterPr: "1.6rem",
			sorterIconTop: "0.35rem",
		},
		popover: { maxWidthGutter: "2.5rem" },
		marginNote: { px: "0.6rem", mx: "0" },
		pagefind: { underlineHeight: "7px", underlineGap: "5px", underlineGapHover: "4px" },
	},
	radius: {
		sm: "0.5rem",
		md: "0.875rem",
		lg: "1.25rem",
		xl: "1.5rem",
		"2xl": "2rem",
		full: "9999px",
		code: "1.25rem",
		card: "1.5rem",
		tag: "9999px",
		badge: "9999px",
		blockquoteRight: "1.25rem",
		navHighlight: "9999px",
	},
	border: {
		default: "2px",
		blockquote: "4px",
		footerNav: "2px",
		focus: "2px",
		focusRing: "0.4rem",
		searchDialog: "2px",
		dividerStyle: "dashed",
	},
	shadow: {
		sm: "0 6px 16px rgba(0, 0, 0, 0.08)",
		md: "0 12px 24px rgba(0, 0, 0, 0.1)",
		lg: "0 20px 36px rgba(0, 0, 0, 0.12)",
		xl: "0 32px 48px rgba(0, 0, 0, 0.14)",
		tocPanel: "0 24px 36px rgba(0, 0, 0, 0.1)",
		card: "0 12px 28px rgba(0, 0, 0, 0.12)",
		fab: "0 16px 32px rgba(0, 0, 0, 0.14)",
	},
	effect: {
		codeUnfocusedBlur: "2px",
		backdropBlurSm: "12px",
		backdropBlurMd: "20px",
	},
	opacity: {
		codeUnfocused: 0.5,
		highlighted: 1,
		hidden: 0,
		hoverDim: 0.8,
		secondaryText: 0.75,
		bodyMuted: 0.92,
		iconMuted: 0.6,
		icon: 0.9,
		dialogSurface: 0.85,
	},
	motion: {
		cardImageHoverScale: 1.15,
		iconHoverScale: 1.25,
		cardHoverBrightness: 1.1,
		toggleOpenRotate: "135deg",
		toTopHiddenTranslateY: "8rem",
	},
	underline: {
		style: "wavy",
		thickness: "2px",
		offset: "4px",
		offsetHover: "7px",
		annotationStyle: "wavy",
		mdxThickness: "2px",
		mdxOffset: "5px",
	},
	anchor: {
		hashContent: "*",
		hashMl: "-1.6rem",
		hashMlToggle: "-2.6rem",
		hashOpacityHidden: 0,
		hashOpacityShown: 1,
	},
	nav: {
		highlightType: "pillBg",
		highlightPosition: "center",
		highlight: { insetX: "0.5em", height: "1.6em", heightActive: "1.6em", bottom: "50%" },
		footerHighlight: { bottom: "50%", height: "1.6em", heightActive: "1.6em" },
	},
	pinned: {
		size: "1.8rem",
		color: "var(--theme-accent)",
		rotate: "12deg",
		hasBackground: true,
		bgColor: "color-mix(in srgb, var(--theme-accent) 25%, transparent)",
		bgRadius: "9999px",
		bgSize: "2.6rem",
		hasGlass: true,
		glassBlur: "8px",
		glassBg: "color-mix(in srgb, var(--theme-bg) 55%, transparent)",
	},
	icons: playfulIcons,
});
