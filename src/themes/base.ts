import type { ThemeTemplateParams } from "./css-template-types";

// Single source of truth for the site's CSS. Themes override selectors via *Override.
export const baseCssTemplate = (params: ThemeTemplateParams) => `@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: ${params.fontSans};
  --font-serif: ${params.fontSerif};
  --font-mono: ${params.fontMono};
  --color-bgColor: var(--theme-bg);
  --color-textColor: var(--theme-text);
  --color-link: var(--theme-link);
  --color-accent: var(--theme-accent);
  --color-accent-2: var(--theme-accent-2);
  --color-quote: var(--theme-quote);
  --color-popover-bg: var(--theme-popover-bg);
${params.colorDefinitions}
}

@layer base {
  :root {
    color-scheme: light;
${params.lightVariables}
  }

  :root.dark {
    color-scheme: dark;
${params.darkVariables}
  }

  html {
    @apply scroll-smooth;
    scrollbar-gutter: stable;
    font-size: 14px;

    @variant sm {
      font-size: 16px;
    }
  }

  html body {
    @apply mx-auto flex min-h-screen max-w-3xl flex-col bg-bgColor px-8 pt-8 text-textColor antialiased overflow-x-hidden;
  }

  @media print {
    @page {
      background: var(--color-bgColor);
    }

    html,
    body {
      background: var(--color-bgColor) !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }

  :root {
    --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
    --theme-toggle-duration: 450ms;
    --theme-toggle-easing: var(--ease-out);
    --theme-toggle-feather: 14%;
  }

  @property --theme-toggle-reveal {
    syntax: "<percentage>";
    inherits: true;
    initial-value: 120%;
  }

  :root:active-view-transition-type(theme)::view-transition-old(root),
  :root:active-view-transition-type(theme)::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
  }

  :root:active-view-transition-type(theme)::view-transition-old(root) {
    z-index: 1;
  }

  :root:active-view-transition-type(theme)::view-transition-new(root) {
    z-index: 999;
    mask-image: radial-gradient(
      circle at var(--vt-x, 50%) var(--vt-y, 50%),
      #000 calc(var(--theme-toggle-reveal) - var(--theme-toggle-feather)),
      #0000 var(--theme-toggle-reveal)
    );
    mask-repeat: no-repeat;
  }

  /* Freeze CSS transitions while .dark flips so the theme swaps atomically. */
  :root.theme-switching,
  :root.theme-switching *,
  :root.theme-switching *::before,
  :root.theme-switching *::after {
    transition: none !important;
  }

  * {
    @apply scroll-mt-10
  }

  pre {
    @apply rounded-md p-4 font-mono;
  }

  /* Common styles for pre elements */
  pre.has-diff,
  pre.has-focused,
  pre.has-highlighted,
  pre.has-diff code,
  pre.has-focused code,
  pre.has-highlighted code {
    @apply inline-block min-w-full;
  }

  /* Styles for diff lines */
  pre.has-diff .line.diff,
  pre.has-highlighted .line.highlighted.error,
  pre.has-highlighted .line.highlighted.warning {
    @apply inline-block w-max min-w-[calc(100%+2rem)] -ml-8 pl-8 pr-4 box-border relative z-0;
  }

  pre.has-diff .line.diff::before {
    @apply content-[''] absolute left-4 top-0 bottom-0 w-4 flex items-center justify-center text-gray-400;
  }

  pre.has-diff .line.diff.remove {
    @apply bg-red-500/20;
  }

  pre.has-diff .line.diff.remove::before {
    @apply content-['-'];
  }

  pre.has-diff .line.diff.add {
    @apply bg-blue-500/20;
  }

  pre.has-diff .line.diff.add::before {
    @apply content-['+'];
  }

  /* Styles for focused lines */
  pre.has-focused .line {
    @apply inline-block w-max min-w-[calc(100%+2rem)] -ml-4 pl-4 pr-4 box-border transition-[filter,opacity] duration-200 ease-out;
  }

  pre.has-focused .line:not(.focused) {
    @apply blur-[1px] opacity-50;
  }

  pre.has-focused:hover .line:not(.focused) {
    @apply blur-none opacity-100;
  }

  /* Styles for highlighted lines */
  pre.has-highlighted .line.highlighted {
    @apply inline-block w-max min-w-[calc(100%+2rem)] -ml-4 pl-4 pr-4 box-border bg-gray-500/20;
  }

  /* Styles for highlighted words */
  .highlighted-word {
    @apply -mx-0.5 rounded bg-gray-500/20 px-1;
  }

  pre.has-highlighted .line.highlighted.error::before,
  pre.has-highlighted .line.highlighted.warning::before {
    @apply content-[''] absolute left-4 top-0 bottom-0 w-4 flex items-center justify-center text-gray-400;
  }

  pre.has-highlighted .line.highlighted.error {
    @apply bg-red-500/30;
  }

  pre.has-highlighted .line.highlighted.error::before {
    @apply content-['x'];
  }

  pre.has-highlighted .line.highlighted.warning {
    @apply bg-yellow-500/20;
  }

  pre.has-highlighted .line.highlighted.warning::before {
    @apply content-['!'];
  }
}

@layer components {
  .site-page-link {
    @apply underline decoration-wavy decoration-from-font decoration-accent-2/40 hover:decoration-accent-2/60 underline-offset-2;
  }

  .title {
    @apply text-3xl font-bold text-accent-2;
  }

  .notion-h1 {
    @apply mt-8 mb-1 cursor-pointer text-2xl font-semibold;
  }

  .notion-h2 {
    @apply mt-6 mb-1 cursor-pointer text-xl font-semibold;
  }

  .notion-h3 {
    @apply mt-4 mb-1 cursor-pointer text-lg font-semibold;
  }

  .notion-h4 {
    @apply mt-3 mb-1 cursor-pointer text-base font-semibold;
  }

  .notion-text {
    @apply my-1 min-h-7;
  }

  .notion-list-ul {
    @apply list-outside list-disc space-y-1 pl-6;
  }

  .notion-list-ol {
    @apply list-outside space-y-1 pl-6;
  }

  .notion-list-item-colored {
    @apply rounded-sm px-1;
  }

  /* Column List */
  .notion-column-list {
    @apply mx-auto my-4 block w-full max-w-full flex-wrap gap-x-4 sm:flex md:flex-nowrap;
  }

  .notion-column-list > .ncolumns {
    @apply w-full max-w-full min-w-0 flex-1 basis-44 sm:w-44 md:w-auto;
  }

  /* Divider */
  .divider {
    @apply bg-accent/30 mx-auto my-4 h-0.5 w-full rounded-sm border-none;
  }

  .notion-divider {
    @apply bg-accent-2/10 mx-auto my-4 h-0.5 w-full rounded-sm border-none;
  }

  @media print {
    .divider,
    .notion-divider {
      height: 0;
      background: transparent !important;
      border: 0 !important;
      border-top: 1px solid color-mix(in srgb, var(--color-textColor) 24%, transparent) !important;
      border-radius: 0;
    }
  }

  /* Table */
  .ntable {
    @apply relative max-w-full table-auto overflow-x-auto pb-2;
  }

  .ntable table {
    @apply w-full text-left text-sm text-textColor/90;
  }

  .ntable th {
    @apply bg-ngray-table-header-bg-light text-textColor/90 dark:bg-ngray-table-header-bg-dark/[.03] p-2 text-xs font-semibold uppercase border-b border-gray-200/90 dark:border-gray-700/90;
  }

  .ntable table.datatable th {
    @apply font-bold;
  }

  .ntable .table-row-header {
    @apply whitespace-nowrap;
  }

  .ntable td {
    @apply p-2;
  }

  .ntable tr {
     @apply border-b border-gray-200/90 dark:border-gray-700/90;
  }

  .ntable table.no-column-header tbody tr:first-child {
    @apply border-t border-gray-200/90 dark:border-gray-700/90;
  }

  @media print {
    .ntable {
      @apply max-w-full overflow-visible pb-0;
    }

    .ntable table {
      @apply w-full;
      table-layout: fixed;
    }

    .ntable th,
    .ntable td {
      @apply whitespace-normal;
      overflow-wrap: anywhere;
    }
  }

  /* Bookmark */
  .bookmark {
    @apply pb-2;
  }

  .bookmark-link-container {
    @apply flex w-full max-w-full overflow-hidden text-sm;
  }

  .bookmark-card {
    @apply flex w-full max-w-full min-w-0 grow items-stretch overflow-hidden rounded-sm border border-gray-200 no-underline select-none dark:border-gray-800;
  }

  .bookmark-text {
    @apply text-textColor/90 overflow-hidden p-3 text-left flex-[4_1_180px];
  }

  .bookmark-title {
    @apply mb-0.5 h-6 truncate overflow-hidden leading-5 whitespace-nowrap;
  }

  .bookmark-description {
    @apply h-8 overflow-hidden text-xs leading-4 opacity-80;
  }

  .bookmark-caption-container {
     @apply mt-1.5 flex max-w-full items-baseline;
  }

  .bookmark-icon-container {
    @apply mr-1.5 h-4 w-4 min-w-4;
  }

  .bookmark-link {
    @apply truncate overflow-hidden text-xs leading-4 whitespace-nowrap;
  }

  .bookmark-image-container {
    @apply relative hidden sm:block flex-[1_1_180px];
  }

  /* Embeds (iframe/media sizing on per-embed-block elements) */
  .embed-media-box {
    @apply h-[340px] w-full max-w-full rounded-lg border-none;
  }

  .embed-iframe-notion {
    @apply h-[750px] w-[125%] max-w-[125%] origin-top-left scale-[0.8] transform rounded-lg border-none sm:h-[600px] sm:w-full sm:max-w-full sm:scale-none sm:transform-none;
  }

  .embed-iframe-maps {
    @apply absolute top-0 left-0 h-full w-full max-w-full rounded-lg border-none;
  }

  /* Code */
  .code {
    @apply relative z-0 mb-1 w-full max-w-full text-sm;
  }

  .code-scroll {
     @apply max-h-[340px] overflow-scroll print:max-h-full min-w-0;
  }

  .code-mermaid {
     @apply overflow-x-scroll max-h-none min-w-0;
  }

  .code button[data-code] {
    @apply absolute top-0 right-0 z-10 cursor-pointer border-none p-2 text-gray-500 sm:opacity-100 md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100 print:hidden;
  }

  /* Code-copy icon crossfade: opacity-only, sequenced so the outgoing icon clears before the incoming fades in. */
  .code button[data-code] .copy-icon-before,
  .code button[data-code] .copy-icon-done {
    transition: opacity 110ms var(--ease-out), transform 110ms var(--ease-out);
  }

  .code button[data-code] .copy-icon-before {
    transition-delay: 110ms;
  }

  .code button[data-code] .copy-icon-done {
    @apply absolute inset-2 opacity-0;
    transform: scale(0.8);
    transition-delay: 0ms;
  }

  .code button[data-code].copied .copy-icon-before {
    @apply opacity-0;
    transform: scale(0.8);
    transition-delay: 0ms;
  }

  .code button[data-code].copied .copy-icon-done {
    @apply opacity-100;
    transform: scale(1);
    transition-delay: 110ms;
  }

  /* Quote */
  .nquote {
    @apply my-4 border-s-4 border-gray-600 px-2! dark:border-gray-300;
  }

  .quote-children {
    @apply p-1;
  }

  /* Callout */
  .callout {
    @apply mx-auto my-2 flex w-full max-w-full rounded px-3 py-4 leading-6;
  }

  .callout-icon {
    @apply m-0 mr-2 leading-6;
  }

  .callout-content {
    @apply m-0 min-w-0 leading-6;
  }

  .callout-content.simple > :first-child {
    @apply mt-0;
  }

  .notion-popover {
    @apply border-accent-2/20 bg-popover-bg/95 text-textColor/80 invisible absolute z-40 inline-block max-h-[min(22rem,60vh)] w-72 overflow-y-auto overscroll-contain rounded-lg border text-sm opacity-0 shadow-xs backdrop-blur-sm transition-[opacity,transform] duration-200;
    transform: translateY(-4px) scale(0.98);
    transform-origin: center top;
    transition-timing-function: var(--ease-out);
  }

  /* Lift the height cap while a nested popover is open so the child isn't cropped (JS toggles .popover-has-nested). */
  .notion-popover.popover-has-nested {
    @apply max-h-none overflow-visible;
  }

  .media-expand-icon {
    @apply text-accent-2 hover:text-accent absolute z-10 m-2 cursor-pointer transition-[color,transform] duration-150 ease-out active:scale-90;
  }

  .webmention-avatar {
    @apply ring-textColor hover:ring-link focus-visible:ring-link overflow-hidden rounded-full ring-2 outline-hidden hover:ring-4 focus-visible:ring-4;
  }

  .notion-popover-title {
    @apply text-accent decoration-accent-2/20 font-semibold underline decoration-wavy;
  }

  .notion-popover-link {
    @apply text-link/90 flex max-w-full items-center font-medium hover:underline;
  }

  .notion-mention-icon {
    @apply mb-0.5 inline h-4 w-4 shrink-0 align-sub;
  }

  .notion-custom-emoji {
    @apply mb-0.5 inline h-4 w-4 object-contain align-sub text-transparent;
  }

  .footnote-marker-underline {
    @apply decoration-quote/40 underline decoration-dotted -underline-offset-2;
  }

  .footnote-marker-ref {
    @apply text-quote cursor-pointer align-super font-mono text-xs;
  }

  .citation-marker-underline {
    @apply decoration-quote/40 underline decoration-dotted underline-offset-2;
  }

  .citation-marker-ref {
    @apply text-quote cursor-pointer font-mono text-xs;
  }

  .view-all-link {
    @apply sm:hover:text-accent inline-flex items-center gap-1 transition-colors duration-150 ease-out;
  }

  .listing-grid {
    @apply grid grid-cols-3 gap-y-16 sm:grid-cols-4 sm:items-start sm:gap-x-8;
  }

  .listing-section-heading {
    @apply text-accent-2 mb-4 flex items-center text-lg font-semibold;
  }

  .post-list-item {
    @apply flex max-w-full flex-col flex-wrap gap-1.5 [&_q]:basis-full;
  }

  .post-card-date {
    @apply text-accent/90 min-w-[120px] font-mono text-xs;
  }

  .reading-column {
    @apply max-w-[708px] sm:mr-20 print:mr-auto print:max-w-full;
  }

  /* Toggle */
  .toggle {
    @apply my-1;
  }

  .toggle-colored {
    @apply rounded-sm px-1;
  }

  .toggle-summary {
    @apply max-w-full list-image-none;
  }

  .toggle-summary::-webkit-details-marker {
    display: none;
  }

  .toggle-icon-box {
    @apply inline-flex h-6 w-6 shrink-0 items-center justify-center;
  }

  .rotate-svg {
    @apply h-6 w-6 shrink-0 transition-transform duration-200 ease-out;
  }

  details.toggle[open] .toggle-icon-box > .rotate-svg {
    @apply rotate-90;
  }

  @media print {
    details.toggle[open] .rotate-svg {
      transform: rotate(90deg) !important;
    }
  }

  /* Tab */
  .notion-tab-block {
    @apply my-4 overflow-hidden rounded border;
    border-color: color-mix(in srgb, var(--color-accent-2) 18%, var(--color-bgColor));
    background-color: color-mix(in srgb, var(--color-bgColor) 91%, var(--color-popover-bg));
  }

  .notion-tab-header {
    @apply relative px-3 pb-2 pt-3;
  }

  .notion-tab-list {
    @apply m-0 flex gap-1 overflow-x-auto scroll-smooth;
    scrollbar-width: none;
  }

  .notion-tab-list::-webkit-scrollbar {
    display: none;
  }

  .notion-tab-button {
    @apply inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full bg-transparent px-3 py-2 text-sm font-semibold shadow-none outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent/30;
    appearance: none;
    -webkit-appearance: none;
    border: none;
    color: color-mix(
      in srgb,
      var(--color-textColor) 72%,
      var(--color-accent) 6%,
      var(--color-accent-2) 8%,
      var(--color-bgColor)
    );
  }

  .notion-tab-button:hover {
    border: none;
    color: color-mix(
      in srgb,
      var(--color-textColor) 86%,
      var(--color-accent-2) 12%,
      var(--color-bgColor) 2%
    );
    background-color: color-mix(
      in srgb,
      var(--color-accent-2) 8%,
      var(--color-bgColor)
    );
  }

  .notion-tab-button.is-active {
    border: none;
    color: color-mix(
      in srgb,
      var(--color-textColor) 90%,
      var(--color-accent) 12%,
      var(--color-bgColor) 2%
    );
    background-color: color-mix(
      in srgb,
      var(--color-accent) 8%,
      var(--color-bgColor)
    );
    box-shadow: none;
  }

  .notion-tab-button-text {
    @apply inline-flex min-w-0 items-center gap-2 overflow-hidden text-ellipsis;
  }

  .notion-tab-button a {
    color: inherit;
    text-decoration: none;
  }

  .notion-tab-button img,
  .notion-tab-button svg {
    @apply h-[1.1rem] w-[1.1rem] shrink-0;
  }

  .notion-tab-edge {
    position: absolute;
    top: 0.85rem;
    bottom: 0.55rem;
    width: 1.6rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 160ms ease;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .notion-tab-edge-left {
    left: 0.75rem;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-bgColor) 92%, transparent) 0%,
      color-mix(in srgb, var(--color-bgColor) 70%, transparent) 58%,
      transparent 100%
    );
  }

  .notion-tab-edge-right {
    right: 0.75rem;
    background: linear-gradient(
      270deg,
      color-mix(in srgb, var(--color-bgColor) 92%, transparent) 0%,
      color-mix(in srgb, var(--color-bgColor) 70%, transparent) 58%,
      transparent 100%
    );
  }

  .notion-tab-header[data-can-scroll-left="true"] .notion-tab-edge-left,
  .notion-tab-header[data-can-scroll-right="true"] .notion-tab-edge-right {
    opacity: 1;
  }

  .notion-tab-panel {
    @apply px-4 pb-4 pt-1;
  }

  .notion-tab-panel[hidden] {
    display: none;
  }

  @media print {
    .notion-tab-block {
      @apply overflow-visible border-0 bg-transparent;
      break-inside: auto;
    }

    .notion-tab-header {
      @apply hidden;
    }

    .notion-tab-print-label {
      @apply mb-1 mt-4 text-base font-semibold;
      break-after: avoid;
    }

    .notion-tab-print-label::before {
      content: "Tab: ";
      font-weight: 600;
    }

    .notion-tab-panel,
    .notion-tab-panel[hidden] {
      @apply block! px-0 pb-4 pt-0;
      break-inside: auto;
      border-bottom: 1px solid color-mix(in srgb, var(--color-textColor) 14%, transparent);
    }

    #autogenerated-post-comments .tabs {
      @apply hidden;
    }

    #autogenerated-post-comments .tab-pane,
    #autogenerated-post-comments .tab-pane[hidden] {
      @apply block!;
    }
  }

  /* ToDo */
  .to-do {
    @apply pl-2 leading-7;
  }

  .todo-container {
     @apply gap-2;
  }

  .todo-item {
    @apply flex max-w-full items-start;
  }

  .todo-item-colored {
    @apply rounded-sm px-1;
  }

  .todo-checkbox-wrapper {
    @apply mt-1 pr-2;
  }

  .todo-text {
    @apply min-w-0 flex-1;
  }

  .todo-checkbox-icon {
    @apply text-textColor/50 h-5 w-5;
  }


  /* Tags */
  .notion-tag {
    @apply inline-block rounded-md px-1 text-sm;
  }

  /* Count Badge (for tags and authors) */
  .count-badge {
    @apply ml-2 rounded-sm bg-gray-100 px-2 py-0.5 text-rose-800 dark:bg-gray-800 dark:text-rose-300;
  }

  /* Image */
  .notion-image-figure {
    @apply mx-auto mt-1 max-w-full;
  }

  .notion-image-container {
    @apply mx-auto min-w-0;
  }

  .notion-image {
    @apply block max-w-full rounded-md;
  }

  /* File */
  .notion-file-container {
    @apply border-accent-2/20 hover:border-accent/40 inline-flex max-w-full rounded-lg border p-1;
  }

  .notion-file-link {
    @apply underline decoration-wavy decoration-from-font decoration-accent-2/40 hover:decoration-accent-2/60 underline-offset-2 text-link inline-flex max-w-full items-center justify-center rounded-lg text-sm;
  }

  .notion-file-preview {
    @apply decoration-accent-2/20 hover:decoration-accent/40 ml-2 inline-flex max-w-full items-center justify-center text-sm underline decoration-wavy hidden sm:inline;
  }

  /* TOC */
  .toc-container {
    @apply fixed top-auto right-4 ${params.tocContainerBottom} z-10 block sm:top-40 sm:bottom-auto print:hidden;
  }

  .visual-container {
    @apply bg-bgColor absolute top-6 right-0 hidden w-8 flex-col items-end space-y-2 overflow-hidden p-2 transition-opacity duration-200 sm:flex;
  }

  .toc-content {
    @apply border-accent/10 bg-bgColor shadow-accent/5 absolute right-1 bottom-0 max-h-[55vh] w-76 overflow-y-auto rounded-xl border p-2 shadow-xl transition-[opacity,transform] duration-200 ease-out sm:top-0 sm:bottom-auto sm:max-h-[68vh];
  }

  .toc-link {
    @apply text-textColor/60 hover:bg-accent/5 hover:text-textColor line-clamp-3 block no-underline transition-colors duration-200 ease-in-out rounded-sm px-2 py-1;
  }

  .toc-visual {
    @apply h-[2px] rounded-full transition-colors duration-200;
  }

  .bottom-toc-button {
    @apply fixed end-4 ${params.bottomTocButtonBottom} z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border text-3xl transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] sm:hidden print:hidden;
  }

  /* Social List */
  .social-link {
    @apply sm:hover:text-link inline-block p-1 transition-colors duration-150 ease-out;
  }

  /* Post Preview */
  a[aria-label="Visit external site"] {
    @apply border-quote/60 text-quote hover:border-quote/80 hover:text-quote mr-2 inline-flex items-center gap-1 rounded border px-2 py-[2px] text-[11px] font-semibold tracking-wider uppercase transition;
  }

  [aria-label="Pinned Post"] {
    @apply me-1 inline-block h-6 w-6;
  }

  /* To-Top Button */
  .to-top-btn {
    @apply fixed end-4 ${params.toTopBtnBottom} z-30 flex h-10 w-10 translate-y-28 cursor-pointer items-center justify-center rounded-full border text-3xl opacity-0 transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.94] data-[show=true]:translate-y-0 data-[show=true]:opacity-100 sm:end-8 sm:bottom-8 sm:h-12 sm:w-12 print:hidden;
  }

  .bottom-toc-button,
  .to-top-btn,
  .copy-markdown-btn {
    background-color: color-mix(in srgb, var(--color-accent-2) 12%, var(--color-bgColor));
    border-color: color-mix(in srgb, var(--color-accent-2) 40%, var(--color-bgColor));
    color: color-mix(in srgb, var(--color-accent-2) 80%, var(--color-bgColor));
  }

  .bottom-toc-button svg,
  .to-top-btn svg,
  .copy-markdown-btn svg {
    opacity: 0.75;
  }


  /* Copy Markdown Button */
  .copy-floating-btn {
    @apply fixed z-40 flex items-center justify-center print:hidden ${params.copyBtnPosition};
  }

  @variant sm {
    .copy-floating-btn {
      @apply h-auto w-auto bottom-auto left-auto right-4 top-[7.5rem];
    }
  }

  .copy-markdown-btn {
    @apply inline-flex items-center gap-1 transition disabled:opacity-60 disabled:cursor-not-allowed h-10 w-10 rounded-full border shadow-lg flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer backdrop-blur-md print:hidden;
  }


  .copy-markdown-btn[data-copy-state="success"] {
    @apply border-green-500/60 dark:border-green-400/60;
  }

  .copy-markdown-btn[data-copy-state="error"] {
    @apply border-red-500/50 dark:border-red-400/60;
  }

  /* Theme Icon */
  .theme-toggle-btn {
    @apply hover:text-accent active:scale-[0.94] relative h-10 w-10 cursor-pointer rounded-md p-2 transition-[color,transform] duration-150 ease-out;
  }

  .theme-icon {
    @apply absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 scale-75 opacity-0 transition-[transform,opacity] duration-200 ease-out;
  }

  /* Annotations */
  .anchor-link-dashed {
    @apply text-link decoration-accent-2/40 underline decoration-dashed underline-offset-2;
  }

  .ann-bg-c {
    background-color: var(--abc, transparent);
    @apply rounded-sm px-1;
  }

  :root.dark .ann-bg-c {
    background-color: var(--abc-dark, var(--abc, transparent));
  }

  .annotation-underline {
    @apply underline;
  }

  .annotation-strikethrough {
    @apply line-through decoration-slate-500/50;
  }

  /* Author Byline */
  .author-name-link {
    @apply text-link underline decoration-wavy decoration-from-font decoration-accent-2/40 hover:decoration-accent-2/80 underline-offset-2 transition-colors;
  }

  .author-icon-link {
    @apply text-link inline-flex items-center transition-[color,transform] duration-200 ease-out hover:scale-110 hover:text-accent;
  }

  .annotation-code {
    @apply rounded-sm border-none px-1 font-mono;
  }

  .annotation-code.bg-default {
    @apply bg-gray-100 dark:bg-gray-800;
  }

  .annotation-code.text-default {
    @apply text-rose-800 dark:text-rose-300;
  }

  /* Recent Posts */
  #auto-recent-posts {
    @apply relative mt-8 mb-4 cursor-pointer text-2xl font-normal;
  }

  #auto-recent-posts::before {
    content: "#";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  #auto-recent-posts:hover::before {
    opacity: 1;
  }

  #auto-recent-posts + section ul {
    @apply space-y-4 text-start;
  }

  #auto-recent-posts + section ul li {
    @apply flex max-w-full flex-col flex-wrap gap-1.5 [&_q]:basis-full;
  }

  /* Auto-generated Section Headers & Dividers */
  .auto-imported-section {
    @apply mt-12;
  }

  .auto-imported-section > hr {
    @apply bg-accent/30 mx-auto my-4 h-0.5 w-full rounded-sm border-none;
  }

  .non-toggle-h2 {
    @apply relative mb-4 cursor-pointer text-2xl font-normal;
  }

  .non-toggle-h2::before {
    content: "#";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .non-toggle-h2:hover::before {
    opacity: 1;
  }

  /* Anchor Links (hasId) */
  .hasId {
    @apply relative;
  }

  .hasId::before {
    content: "#";
    position: absolute;
    color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    margin-left: -1.5rem;
    display: inline-block;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .hasId:hover::before {
    opacity: 1;
  }

  .hasId.toggle-heading::before {
    margin-left: -2.5rem;
  }

  .noId::before {
    display: none;
  }

  /* Toggles */
  .toggle > summary::-webkit-details-marker {
    display: none;
  }

  .toggle > summary {
    @apply flex cursor-pointer list-none items-start gap-2;
  }

  .toggle > summary .toggle-heading {
    display: inline !important;
    margin: 0 !important;
  }

  .toggle-icon-box {
    @apply inline-flex h-6 w-6 shrink-0 items-center justify-center;
  }

  details.toggle[open] .toggle-icon-box > .rotate-svg {
    @apply rotate-90;
  }

  @media print {
    .rotate-svg {
      @apply transition-none!;
    }

    details.toggle[open] .rotate-svg {
      rotate: 0deg !important;
      transform: rotate(90deg) !important;
    }
  }

  .toggle-heading-1 {
    @apply mt-8 mb-0;
  }

  .toggle-heading-2 {
    @apply mt-6 mb-1;
  }

  .toggle-heading-3 {
    @apply mt-4 mb-1;
  }

  .toggle-heading-4 {
    @apply mt-3 mb-1;
  }

  #autogenerated-external-links a {
    @apply text-link no-underline hover:decoration-accent-2 hover:underline hover:underline-offset-4;
  }

  /* Pagination */
  .pagination-nav {
    @apply mt-8 flex items-center gap-x-4;
  }

  .pagination-nav > a {
    @apply text-link py-2 no-underline hover:underline hover:underline-offset-4;
  }

  .pagination-nav .pagination-prev-icon,
  .pagination-nav .pagination-next-icon {
    transition: transform 150ms var(--ease-out);
  }

  .pagination-nav > .prev-link:hover .pagination-prev-icon {
    transform: translateX(-3px);
  }

  .pagination-nav > .next-link:hover .pagination-next-icon {
    transform: translateX(3px);
  }

  .pagination-nav > .prev-link {
    @apply me-auto;
  }

  .pagination-nav > .next-link {
    @apply ms-auto;
  }

  /* TOC Visibility for Auto-generated Sections */
  #-tocid--autogenerated-footnotes,
  #-vistocid--autogenerated-footnotes,
  #-tocid--autogenerated-bibliography,
  #-vistocid--autogenerated-bibliography,
  #-tocid--autogenerated-interlinked-content,
  #-vistocid--autogenerated-interlinked-content,
  #-tocid--autogenerated-cite-this-page,
  #-vistocid--autogenerated-cite-this-page {
    @apply !block;
  }

  #-bottomtocid--autogenerated-footnotes,
  #-bottomtocid--autogenerated-bibliography,
  #-bottomtocid--autogenerated-interlinked-content,
  #-bottomtocid--autogenerated-cite-this-page {
    @apply !inline;
  }

  .footnote-content {
    @apply inline;
  }

  /* CSS counter for IEEE style numbering */
  .bibliography-ieee {
    counter-reset: citation-counter;
  }

  .bibliography-ieee li {
    @apply flex items-baseline;
    counter-increment: citation-counter;
  }

  .bibliography-ieee li::before {
    content: "[" counter(citation-counter) "] ";
    font-weight: 400;
    margin-right: 0.5rem;
    font-family: monospace;
    flex-shrink: 0;
  }

  /* Footnotes Internal */
  .footnote-list {
    @apply list-none;
  }
  .footnote-item {
    @apply flex items-baseline gap-2;
  }
  .footnote-marker {
    @apply text-accent-2/60 shrink-0 font-mono text-sm;
  }

  /* Bibliography Internal */
  .bibliography-list {
    @apply space-y-2 list-none;
  }
  .bibliography-item {
    @apply relative;
  }
  .citation-back-btn {
    @apply absolute left-0 -translate-x-full -ml-2 top-0 opacity-0 pointer-events-none w-4 h-4 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-[background-color,opacity,transform] duration-200 ease-out cursor-pointer;
  }
  li[data-show-back-button="true"] .citation-back-btn {
    @apply opacity-100 pointer-events-auto;
  }
  .citation-entry {
    @apply inline;
  }
  .citation-backlinks {
    @apply ml-1;
  }

  /* Header */
  .site-header {
    @apply relative mb-8 flex w-full items-center justify-between sm:ps-[4.5rem] lg:-ml-[25%] lg:w-[150%];
  }
  .nav-menu {
    @apply bg-bgColor/90 text-accent absolute -inset-x-4 top-14 hidden flex-col items-end rounded-md py-2 text-base shadow-sm backdrop-blur-sm group-[.menu-open]:z-50 group-[.menu-open]:flex sm:static sm:z-auto sm:-ms-4 sm:mt-1 sm:flex sm:flex-row sm:items-center sm:rounded-none sm:py-0 sm:text-sm sm:shadow-none sm:backdrop-blur-none lg:text-base print:hidden gap-y-3 sm:gap-y-0 lg:gap-x-4;
  }
  .nav-link {
    @apply relative z-0 w-fit self-end px-3 py-1 text-right sm:w-auto sm:self-auto sm:py-0 sm:text-left;
  }
  .nav-link::before {
    content: "";
    position: absolute;
    left: 0.08em;
    right: 0.08em;
    bottom: 0;
    height: 0.42em;
    border-radius: 0.4em 0.2em;
    background-image:
      linear-gradient(
        to right,
        color-mix(in srgb, var(--color-accent) 4%, transparent),
        color-mix(in srgb, var(--color-accent) 10%, transparent) 6%,
        color-mix(in srgb, var(--color-accent) 5%, transparent)
      );
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
  }
  .dark .nav-link::before {
    background-image: linear-gradient(
      to right,
      color-mix(in srgb, var(--color-accent) 6%, transparent),
      color-mix(in srgb, var(--color-accent) 14%, transparent) 6%,
      color-mix(in srgb, var(--color-accent) 7%, transparent)
    );
  }
  .nav-link:hover::before,
  .nav-link:focus-visible::before {
    transform: scaleX(1);
  }
  .nav-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 0.62em;
    background-image: linear-gradient(
      to right,
      color-mix(in srgb, var(--color-accent-2) 8%, transparent),
      color-mix(in srgb, var(--color-accent-2) 20%, transparent) 6%,
      color-mix(in srgb, var(--color-accent-2) 10%, transparent)
    );
  }

  /* Footer */
  .site-footer {
    @apply text-accent mt-auto flex w-full flex-col items-center justify-center gap-y-2 pt-20 pb-4 text-center align-top text-sm sm:flex-row sm:justify-between lg:-ml-[25%] lg:w-[150%];
  }
  .footer-nav {
    @apply flex flex-wrap gap-x-2 rounded-sm border-t-2 border-b-2 border-gray-200 sm:gap-x-2 sm:border-none dark:border-gray-700 print:hidden;
  }
  .footer-separator {
    @apply flex items-center text-accent/45;
  }
  .footer-link {
    @apply relative z-0 px-4 py-2 sm:px-2 sm:py-0;
  }
  .footer-link + .footer-link {
    @apply sm:pl-0;
  }
  .footer-link::before {
    content: "";
    position: absolute;
    left: 0.08em;
    right: 0.08em;
    bottom: 0.05em;
    height: 0.5em;
    border-radius: 0.4em 0.2em;
    background-image:
      linear-gradient(
        to right,
        color-mix(in srgb, var(--color-accent) 4%, transparent),
        color-mix(in srgb, var(--color-accent) 10%, transparent) 6%,
        color-mix(in srgb, var(--color-accent) 5%, transparent)
      );
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 200ms ease;
    z-index: -1;
  }
  .dark .footer-link::before {
    background-image: linear-gradient(
      to right,
      color-mix(in srgb, var(--color-accent) 6%, transparent),
      color-mix(in srgb, var(--color-accent) 14%, transparent) 6%,
      color-mix(in srgb, var(--color-accent) 7%, transparent)
    );
  }
  .footer-link:hover::before,
  .footer-link:focus-visible::before {
    transform: scaleX(1);
  }
  .footer-link[aria-current="page"]::before {
    transform: scaleX(1);
    height: 0.7em;
    background-image: linear-gradient(
      to right,
      color-mix(in srgb, var(--color-accent-2) 8%, transparent),
      color-mix(in srgb, var(--color-accent-2) 20%, transparent) 6%,
      color-mix(in srgb, var(--color-accent-2) 10%, transparent)
    );
  }

  /* Equation */
  .equation {
    @apply max-w-full overflow-x-auto overscroll-none text-center;
  }

  /* Caption */
  .caption {
    @apply text-textColor/70 min-w-0 pt-1 text-sm;
  }

  /* Search */
  .search-btn {
    @apply hover:text-accent active:scale-[0.94] flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-[color,transform] duration-150 ease-out;
  }

  /* Code Render/Inject */
  .code-rendered {
	@apply relative mb-1 w-full max-w-full overflow-hidden rounded-lg;
	height: var(--html-frame-height, clamp(14rem, 40dvh, 28rem));
	min-height: min(6rem, 100dvh);
	max-height: 100dvh;
	resize: vertical;
  }

  .code-rendered-aspect {
	height: auto;
	aspect-ratio: var(--html-frame-aspect-ratio);
  }

  .code-injected {
    @apply mb-1 max-w-full;
  }

  .code-iframe {
	@apply h-full w-full max-w-full rounded-lg border-none print:max-h-full;
  }

  .html-frame-lightbox-trigger {
    @apply bg-bgColor/85 text-textColor hover:text-accent focus-visible:ring-accent absolute top-2 right-2 z-10 flex cursor-pointer items-center justify-center rounded-full no-underline shadow-md backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:outline-none;
    width: 44px;
    height: 44px;
  }

  .html-frame-lightbox-content {
    width: 100vw;
    height: 100dvh;
    max-width: 100vw;
    background: var(--color-bgColor);
  }

  .html-frame-lightbox-content .code-iframe {
    border-radius: 0;
  }

  .code .mermaid {
    @apply max-w-full rounded-sm p-4 font-mono;
  }

  /* External MDX Content */
  .mdx-notion {
    @apply max-w-none;
  }

  .mdx-notion h1,
  .mdx-notion h2,
  .mdx-notion h3 {
    @apply font-bold text-textColor tracking-[-0.01em] mt-5 mb-3;
  }

  .mdx-notion h1 {
    font-size: clamp(1.8rem, 2.6vw, 2.05rem);
    line-height: 1.2;
  }

  .mdx-notion h2 {
    font-size: clamp(1.45rem, 2.3vw, 1.8rem);
    line-height: 1.25;
  }

  .mdx-notion h3 {
    font-size: clamp(1.2rem, 2vw, 1.55rem);
    line-height: 1.3;
  }

  .mdx-notion p {
    @apply mt-0 ml-0 mb-[0.9rem] text-base leading-[1.75] text-textColor;
  }

  .mdx-notion ul,
  .mdx-notion ol {
    @apply my-[0.2rem] mb-[1rem] ms-[1.25rem] ps-[1.25rem] leading-[1.65] list-outside;
  }

  .mdx-notion ul {
    @apply list-disc;
  }

  .mdx-notion ol {
    @apply list-decimal;
  }

  .mdx-notion li {
    @apply my-[0.1rem] ps-[0.1rem];
  }

  .mdx-notion blockquote {
    @apply my-[1.1rem] px-4 py-3 rounded-r-lg;
    border-left: 4px solid var(--theme-quote);
    background-color: color-mix(in srgb, var(--theme-quote) 8%, transparent);
  }

  .mdx-notion code {
    @apply font-mono rounded-sm px-1 py-[0.15rem] text-[0.95rem] bg-gray-100 text-rose-800 dark:bg-gray-800 dark:text-rose-300;
  }

  .mdx-notion pre {
    @apply font-mono px-4 py-4 rounded-2xl overflow-x-auto my-[1.1rem];
  }

  .mdx-notion pre code {
    @apply bg-transparent p-0 rounded-none;
  }

  .mdx-notion a {
    @apply text-accent underline decoration-wavy decoration-1 underline-offset-[3px] transition-colors duration-200;
  }

  .mdx-notion a:hover {
    @apply text-accent-2;
  }
}

  /* Pagefind Component UI */
  site-search {
    --pf-font: inherit;
    --pf-primary: var(--color-accent);
    --pf-text: var(--color-textColor);
    --pf-background: var(--color-bgColor);
    --pf-border: color-mix(in srgb, var(--color-textColor) 22%, transparent);
    --pf-border-radius: var(--radius-md);
    --pf-shadow: 0 24px 64px color-mix(in srgb, #000 22%, transparent);
    --pf-highlight-background: color-mix(in srgb, var(--color-accent) 10%, transparent);
    --pf-highlight-text: var(--color-textColor);
    --pf-muted: color-mix(in srgb, var(--color-textColor) 68%, transparent);
    --pf-hover: color-mix(in srgb, var(--color-accent) 5%, transparent);
    --webtrotion-search-rule: color-mix(in srgb, var(--color-textColor) 14%, transparent);
    --wt-results-col: min(33rem, calc(100vw - 3rem));
    --wt-preview-col: 22rem;
    --wt-preview-shift: calc(var(--wt-preview-col) / 2);
    --wt-modal-tx: 0px;
    --wt-height-compact: min(32rem, calc(100vh - 5rem));
    --wt-height-results: min(40rem, calc(100vh - 4rem));
    --wt-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --wt-icon-default-tint: color-mix(in srgb, var(--color-accent-2) 62%, var(--pf-muted));
    --wt-sub-tint: color-mix(in srgb, var(--color-link) 80%, var(--pf-muted));
    --pf-outline-focus: var(--color-accent);
    --pf-border-focus: var(--color-accent);
  }

  site-search .search-btn:focus-visible {
    @apply outline-2 outline-accent outline-offset-3;
  }

  site-search .search-btn svg {
    @apply block fill-current;
  }

  site-search pagefind-modal:not(:defined) {
    @apply hidden!;
  }

  site-search .search-loading-modal {
    @apply fixed inset-0 overflow-hidden rounded-xl bg-bgColor p-0 text-textColor;
    margin: var(--pf-modal-top, 10dvh) auto;
    width: var(--wt-results-col);
    max-width: calc(100vw - 3rem);
    height: var(--wt-height-compact);
    max-height: calc(100vh - 4rem);
    border: 1px solid var(--webtrotion-search-rule);
    box-shadow: var(--pf-shadow);
  }

  site-search .search-loading-modal[open] {
    @apply flex flex-col opacity-100;
    transform: scale(1) translateY(0);
    transition:
      opacity 190ms var(--wt-ease-out),
      transform 190ms var(--wt-ease-out);
  }

  @starting-style {
    site-search .search-loading-modal[open] {
      opacity: 0;
      transform: scale(0.97) translateY(6px);
    }
  }

  site-search .search-loading-modal::backdrop {
    background: color-mix(in srgb, #000 40%, transparent);
    backdrop-filter: blur(3px);
  }

  site-search .search-loading-header {
    @apply flex-none bg-bgColor px-3 py-2.5;
    border-bottom: 1px solid var(--webtrotion-search-rule);
  }

  site-search .search-loading-input {
    @apply flex h-12 items-center gap-2 rounded-md px-3.5 text-base;
    border: 1px solid var(--pf-border);
    background: color-mix(in srgb, var(--color-bgColor) 94%, var(--color-textColor) 2%);
    color: color-mix(in srgb, var(--color-textColor) 42%, transparent);
  }

  site-search .search-loading-input-icon {
    @apply size-4.5 shrink-0 fill-current;
    color: var(--pf-muted);
  }

  site-search .search-loading-body {
    @apply flex flex-auto items-center justify-center;
  }

  site-search .search-loading-spinner {
    @apply size-6.5 rounded-full;
    border: 2px solid color-mix(in srgb, var(--color-textColor) 15%, transparent);
    @apply border-t-accent;
    animation: webtrotion-search-spin 0.7s linear infinite;
  }

  @keyframes webtrotion-search-spin {
    to {
      transform: rotate(360deg);
    }
  }

  site-search[data-search-handoff] .pf-modal[open] {
    @apply transition-none!;
  }

  @media (prefers-reduced-motion: reduce) {
    site-search .search-loading-modal[open] {
      @apply transition-none;
    }
    site-search .search-loading-spinner {
      animation-duration: 1.4s !important;
    }
  }

  site-search .pf-modal {
    @apply flex-col! overflow-hidden rounded-xl bg-bgColor p-0 text-textColor;
    width: var(--wt-results-col) !important;
    max-width: calc(100vw - 3rem) !important;
    height: var(--wt-height-compact) !important;
    max-height: calc(100vh - 4rem) !important;
    border: 1px solid var(--webtrotion-search-rule);
    box-shadow: var(--pf-shadow);
    transform-origin: center;
    transition:
      width 240ms var(--wt-ease-out),
      transform 240ms var(--wt-ease-out),
      opacity 180ms var(--wt-ease-out),
      box-shadow 220ms ease;
  }

  @starting-style {
    site-search .pf-modal[open] {
      opacity: 0;
      transform: translateX(0px) scale(0.97) translateY(6px);
    }
  }

  site-search .pf-modal[open] {
    @apply opacity-100;
    transform: translateX(var(--wt-modal-tx, 0px)) scale(1) translateY(0);
  }

  site-search .pf-modal:has(.webtrotion-search-result) {
    height: var(--wt-height-results) !important;
  }

  site-search
    .pf-modal:has(.webtrotion-search-empty-state:not([hidden])):has(
        webtrotion-search-navigation[hidden]
      )
    .webtrotion-search-results-pane {
    @apply flex flex-col justify-center py-4;
  }

  site-search
    .pf-modal:has(.webtrotion-search-empty-state:not([hidden]))
    .pf-summary {
    @apply hidden!;
  }

  site-search
    .webtrotion-search-results-pane:has(webtrotion-search-navigation:not([hidden]))
    .webtrotion-search-empty-state {
    @apply hidden!;
  }

  .webtrotion-search-shell[data-idle-mode] pagefind-summary,
  .webtrotion-search-shell[data-idle-mode] .pagefind-summary,
  .webtrotion-search-shell[data-idle-mode] pagefind-results,
  .webtrotion-search-shell[data-idle-mode] .pagefind-results {
    @apply hidden!;
  }

  site-search .pf-modal:has(webtrotion-search-preview[data-preview-active]) {
    width: calc(var(--wt-results-col) + var(--wt-preview-col)) !important;
    --wt-modal-tx: var(--wt-preview-shift);
    box-shadow: 0 24px 64px color-mix(in srgb, #000 18%, transparent);
  }

  site-search .pf-modal::backdrop {
    background: color-mix(in srgb, #000 40%, transparent);
    backdrop-filter: blur(3px);
  }

  site-search pagefind-modal-header {
    @apply flex-none bg-bgColor px-3 py-2.5;
    border-bottom: 1px solid var(--webtrotion-search-rule);
  }

  site-search .pf-input-wrapper {
    @apply relative;
  }

  site-search .pf-input {
    @apply h-12! min-h-12! rounded-md px-10! text-base text-textColor;
    border: 1px solid var(--pf-border) !important;
    background: color-mix(in srgb, var(--color-bgColor) 94%, var(--color-textColor) 2%) !important;
    font: inherit;
    box-shadow: inset 0 0 0 1px transparent;
  }

  site-search .pf-input:focus {
    @apply border-accent outline-none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
  }

  site-search .pf-input::placeholder {
    color: color-mix(in srgb, var(--color-textColor) 42%, transparent);
  }

  site-search .pf-input-icon {
    @apply start-3.5;
    color: var(--pf-muted);
  }

  site-search .pf-clear-button {
    @apply end-2.5;
    color: var(--pf-muted);
    transition:
      color 130ms ease,
      transform 130ms var(--wt-ease-out);
  }

  site-search .pf-clear-button:hover {
    @apply text-textColor;
  }

  site-search .pf-clear-button:active {
    transform: scale(0.9);
  }

  site-search pagefind-modal-body {
    @apply flex-auto! min-h-0 overflow-hidden p-0!;
  }

  .webtrotion-search-shell {
    @apply flex h-full min-h-0 flex-col;
  }

  .webtrotion-search-filters {
    @apply flex flex-wrap items-center gap-1.5 px-3 py-2;
  }

  .webtrotion-search-filters-icon {
    @apply me-px block size-4 flex-none;
  }

  .webtrotion-search-filters-icon svg {
    @apply block h-full w-full;
    fill: var(--pf-muted);
  }

  .webtrotion-search-filters-icon svg path {
    fill: var(--pf-muted);
  }

  site-search pagefind-filter-dropdown {
    @apply min-w-0;
  }

  site-search .pf-dropdown-trigger {
    @apply inline-flex h-8! min-h-8! items-center gap-1.5 rounded-full px-3! text-xs! text-textColor;
    border: 1px solid var(--pf-border) !important;
    background: color-mix(in srgb, var(--color-bgColor) 94%, var(--color-textColor) 2%);
    font: inherit;
    transition:
      background-color 130ms ease,
      border-color 130ms ease,
      color 130ms ease,
      transform 130ms var(--wt-ease-out);
  }

  site-search .pf-dropdown-trigger:active {
    transform: scale(0.97);
  }

  site-search .pf-dropdown-trigger:focus-visible {
    @apply font-medium text-accent outline-0;
    border-color: var(--pf-border) !important;
    background: color-mix(in srgb, var(--color-accent) 16%, transparent) !important;
    color: var(--color-accent) !important;
    box-shadow: none !important;
    outline: none !important;
    outline-offset: 0 !important;
  }

  site-search .pf-dropdown-trigger:hover,
  site-search .pf-dropdown-trigger.open {
    background: var(--pf-hover);
    border-color: color-mix(in srgb, var(--color-accent) 36%, var(--pf-border));
  }

  site-search .pf-dropdown-trigger:has(.pf-dropdown-selected-badge:not([data-pf-hidden])) {
    border-color: var(--pf-border) !important;
    background: color-mix(in srgb, var(--color-accent) 10%, transparent) !important;
    @apply text-accent!;
  }

  site-search .pf-dropdown-selected-badge {
    @apply h-4 min-w-4 rounded-full bg-accent! px-1.5 text-xs! font-semibold! text-bgColor! tabular-nums;
  }

  site-search .pf-dropdown-arrow {
    @apply opacity-60;
  }

  site-search .pf-dropdown-menu {
    @apply overflow-y-auto! rounded-lg bg-bgColor! p-1;
    max-height: min(18rem, 48vh) !important;
    border: 1px solid var(--pf-border) !important;
    box-shadow: 0 12px 32px color-mix(in srgb, #000 12%, transparent) !important;
  }

  site-search .pf-dropdown-option,
  site-search .pf-filter-checkbox {
    @apply min-h-7! rounded-md px-2! py-1! text-xs! text-textColor!;
  }

  site-search .pf-dropdown-option:hover,
  site-search .pf-filter-checkbox:hover {
    background: var(--pf-hover);
  }

  site-search .pf-dropdown-option:focus-visible,
  site-search .pf-dropdown-option.pf-dropdown-option-focused,
  site-search .pf-filter-checkbox:focus-within,
  site-search .pf-filter-checkbox:has(.pf-checkbox-input:focus-visible) {
    @apply font-medium text-accent outline-0;
    background: color-mix(in srgb, var(--color-accent) 14%, transparent) !important;
    color: var(--color-accent) !important;
    box-shadow: none !important;
    outline: none !important;
    outline-offset: 0 !important;
  }

  site-search .pf-dropdown-option[aria-selected="true"],
  site-search .pf-filter-checkbox:has(.pf-checkbox-input:checked) {
    @apply font-medium text-accent!;
    background: color-mix(in srgb, var(--color-accent) 12%, transparent) !important;
  }

  site-search .pf-filter-checkbox:has(.pf-checkbox-input:checked) .pf-checkbox-input,
  site-search .pf-checkbox-input:checked {
    @apply accent-accent border-accent! bg-accent!;
  }

  site-search .pf-dropdown-option[aria-selected="true"] .pf-dropdown-checkbox {
    @apply border-accent! bg-accent!;
  }

  site-search .pf-dropdown-option-count {
    @apply ml-auto rounded px-1.5 font-mono text-xs leading-5 tabular-nums;
    background: color-mix(in srgb, var(--color-accent-2) 8%, transparent);
    color: var(--pf-muted);
  }

  site-search .pf-dropdown-option[aria-selected="true"] .pf-dropdown-option-count {
    @apply hidden!;
  }

  .webtrotion-search-content {
    @apply flex min-h-0 flex-1 p-0;
  }

  .webtrotion-search-results-pane {
    flex: 0 0 var(--wt-results-col);
    @apply min-h-0 min-w-0 overflow-auto py-1.5;
    scrollbar-gutter: stable;
  }

  webtrotion-search-navigation {
    @apply block px-2 pt-1 pb-0.5;
  }

  .webtrotion-search-navigation-label,
  .webtrotion-search-pinned-label {
    @apply mx-2.5 mt-1.5 mb-1 text-xs font-semibold tracking-wider uppercase;
    color: color-mix(in srgb, var(--color-textColor) 45%, transparent);
  }

  .webtrotion-search-navigation-list {
    @apply m-0 flex list-none flex-col gap-0.5 p-0;
  }

  .webtrotion-search-navigation-link {
    @apply flex items-center gap-2.5 rounded-lg px-2.5 py-2 no-underline text-sm font-medium leading-tight text-textColor;
    transition:
      background-color 120ms ease,
      color 120ms ease,
      box-shadow 120ms ease;
  }

  .webtrotion-search-navigation-icon {
    @apply inline-flex size-4 flex-none items-center justify-center leading-none text-sm;
    transition: color 120ms ease;
  }

  .webtrotion-search-navigation-text {
    @apply min-w-0 truncate;
  }

  .webtrotion-search-navigation-icon img {
    @apply block h-full w-full rounded-sm object-contain;
  }

  .webtrotion-search-navigation-icon.is-default svg {
    @apply block h-full w-full opacity-50;
    fill: var(--wt-icon-default-tint);
    transition:
      fill 120ms ease,
      opacity 120ms ease;
  }

  .webtrotion-search-navigation-link:hover,
  .webtrotion-search-navigation-link:focus-visible {
    @apply outline-0;
  }

  .webtrotion-search-navigation-link:hover {
    background: color-mix(in srgb, var(--color-accent-2) 7%, transparent);
    @apply text-accent;
  }

  .webtrotion-search-navigation-link:focus-visible {
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    @apply text-accent;
  }

  .webtrotion-search-navigation-link:hover .webtrotion-search-navigation-icon.is-default svg,
  .webtrotion-search-navigation-link:focus-visible .webtrotion-search-navigation-icon.is-default svg {
    @apply fill-accent opacity-100;
  }

  .webtrotion-search-navigation-link.is-goto {
    @apply items-start px-2.5 py-1.5;
  }

  .webtrotion-search-navigation-link.is-goto .webtrotion-search-navigation-text {
    @apply text-sm leading-tight;
  }

  .webtrotion-search-navigation-link.is-goto .webtrotion-search-navigation-icon {
    @apply mt-0.5;
  }

  .webtrotion-search-navigation-body {
    @apply flex min-w-0 flex-col gap-0.5;
  }

  .webtrotion-search-navigation-snippet {
    @apply block min-w-0 truncate text-xs font-normal;
    color: color-mix(in srgb, var(--color-textColor) 50%, transparent);
    transition: color 120ms ease;
  }

  .webtrotion-search-navigation-link.is-goto:hover .webtrotion-search-navigation-snippet,
  .webtrotion-search-navigation-link.is-goto:focus-visible .webtrotion-search-navigation-snippet {
    color: color-mix(in srgb, var(--color-textColor) 70%, transparent);
  }

  .webtrotion-search-navigation-empty {
    @apply m-3 text-sm;
    color: color-mix(in srgb, var(--color-textColor) 55%, transparent);
  }

  .webtrotion-search-goto-section {
    @apply block;
  }

  .webtrotion-search-goto-summary {
    @apply mt-3 mb-1 flex cursor-pointer list-image-none select-none items-center gap-2.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase;
    color: color-mix(in srgb, var(--color-textColor) 45%, transparent);
    transition:
      color 120ms ease,
      box-shadow 120ms ease;
  }

  details.webtrotion-search-goto-section:first-of-type .webtrotion-search-goto-summary {
    @apply mt-0.5;
  }

  details.webtrotion-search-goto-section:not(:first-of-type) {
    border-top: 1px solid var(--webtrotion-search-rule);
    @apply mt-2 pt-0.5;
  }

  .webtrotion-search-goto-summary::-webkit-details-marker {
    @apply hidden;
  }

  .webtrotion-search-goto-summary:hover,
  .webtrotion-search-goto-summary:focus-visible {
    @apply outline-0;
  }

  .webtrotion-search-goto-summary:hover {
    color: color-mix(in srgb, var(--color-textColor) 70%, transparent);
  }

  .webtrotion-search-goto-summary:focus-visible {
    @apply text-accent;
  }

  .webtrotion-search-goto-chevron {
    @apply inline-flex size-4 flex-none items-center justify-center;
  }

  .webtrotion-search-goto-chevron svg {
    @apply block size-3 flex-none fill-current stroke-current stroke-2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: rotate 200ms var(--wt-ease-out);
  }

  details.webtrotion-search-goto-section[open] .webtrotion-search-goto-chevron svg {
    rotate: 90deg;
  }

  .webtrotion-search-shell[data-goto-mode] .webtrotion-search-filters,
  .webtrotion-search-shell[data-goto-mode] pagefind-summary,
  .webtrotion-search-shell[data-goto-mode] .pagefind-summary,
  .webtrotion-search-shell[data-goto-mode] pagefind-results,
  .webtrotion-search-shell[data-goto-mode] .pagefind-results,
  .webtrotion-search-shell[data-goto-mode] .webtrotion-search-empty-state,
  .webtrotion-search-shell[data-goto-mode] .webtrotion-search-preview-slot {
    @apply hidden!;
  }

  .webtrotion-search-pinned {
    @apply mt-1.5 px-2;
  }

  .webtrotion-search-pinned-link {
    @apply grid items-start gap-2 rounded-lg px-2.5 py-2 no-underline text-textColor;
    grid-template-columns: 0.85rem 1.1rem minmax(0, 1fr);
    background: color-mix(in srgb, var(--color-textColor) 4%, transparent);
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease;
  }

  .webtrotion-search-pinned-marker {
    @apply inline-flex w-3.5 h-4.5 flex-none items-center justify-center;
    color: color-mix(in srgb, var(--color-accent) 70%, transparent);
  }

  .webtrotion-search-pinned-marker svg {
    @apply block size-3 fill-current;
  }

  .webtrotion-search-pinned-icon {
    @apply mt-px inline-flex size-4.5 flex-none items-center justify-center leading-none text-sm;
  }

  .webtrotion-search-pinned-icon img {
    @apply block h-full w-full rounded-sm object-contain;
  }

  .webtrotion-search-pinned-icon svg {
    @apply block h-full w-full;
    fill: none;
    stroke: var(--wt-icon-default-tint);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
  }

  .webtrotion-search-pinned-content {
    @apply grid min-w-0 gap-0.5;
  }

  .webtrotion-search-pinned-link:hover,
  .webtrotion-search-pinned-link:focus-visible {
    @apply text-textColor outline-0;
  }

  .webtrotion-search-pinned-link:hover {
    background: color-mix(in srgb, var(--color-accent-2) 6%, transparent);
  }

  .webtrotion-search-pinned-link:focus-visible {
    background: color-mix(in srgb, var(--color-accent) 13%, transparent);
  }

  .webtrotion-search-pinned-link:hover .webtrotion-search-pinned-marker,
  .webtrotion-search-pinned-link:focus-visible .webtrotion-search-pinned-marker {
    @apply text-accent;
  }

  .webtrotion-search-pinned-title {
    @apply text-sm font-semibold leading-snug text-textColor;
  }

  .webtrotion-search-pinned-detail {
    @apply truncate text-xs leading-snug;
    color: var(--pf-muted);
  }

  site-search .pf-summary {
    @apply mb-2 px-4.5! text-xs;
    color: var(--pf-muted);
  }

  site-search .pf-results {
    @apply flex flex-col gap-0! m-0 p-0;
  }

  .webtrotion-search-result {
    @apply list-none scroll-my-20;
  }

  .webtrotion-search-result-card {
    @apply relative mx-2 rounded-lg px-2.5 py-2;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease;
  }

  .webtrotion-search-result-card:hover {
    background: color-mix(in srgb, var(--color-accent-2) 5%, transparent);
  }

  .webtrotion-search-result-card:has(.webtrotion-search-result-link:focus-visible) {
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  }

  site-search .webtrotion-search-result-link:focus-visible,
  site-search .webtrotion-search-subresult-link:focus-visible {
    @apply outline-none;
  }

  .webtrotion-search-result-main {
    @apply min-w-0;
  }

  .webtrotion-search-result-heading {
    @apply flex min-w-0 items-start gap-1.5;
  }

  .webtrotion-search-result-icon {
    @apply mt-0.5 inline-flex size-4 flex-none items-center justify-center leading-none text-sm;
    color: var(--pf-muted);
  }

  .webtrotion-search-result-icon img,
  .webtrotion-search-result-icon svg {
    @apply block h-full w-full;
  }

  .webtrotion-search-result-icon img {
    @apply object-contain;
  }

  .webtrotion-search-result-icon svg {
    fill: none;
    stroke: var(--wt-icon-default-tint);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
  }

  .webtrotion-search-result-link {
    @apply block min-w-0 no-underline text-sm font-semibold leading-tight text-textColor;
  }

  .webtrotion-search-result-link:hover,
  .webtrotion-search-result-link:focus-visible {
    @apply text-accent;
  }

  .webtrotion-search-result-excerpt {
    @apply mt-0.5 line-clamp-1 text-sm leading-normal;
    color: var(--pf-muted);
    overflow-wrap: anywhere;
  }

  .webtrotion-search-subresults {
    @apply grid m-0 mr-2 mb-1.5 ml-5.5 list-none gap-0.5 border-0 p-0;
  }

  .webtrotion-search-subresults li {
    @apply block border-0 p-0;
  }

  .webtrotion-search-subresult-link {
    @apply flex items-start gap-2 rounded-md px-2 py-1.5 no-underline;
    transition:
      background-color 110ms ease,
      box-shadow 110ms ease;
  }

  .webtrotion-search-subresult-icon {
    @apply mt-1 block size-3 flex-none;
  }

  .webtrotion-search-subresult-icon svg {
    @apply block h-full w-full;
    fill: var(--wt-sub-tint);
    transition: fill 110ms ease;
  }

  .webtrotion-search-subresult-body {
    @apply grid min-w-0 gap-0.5;
  }

  .webtrotion-search-subresult-title {
    @apply truncate text-sm font-medium leading-snug;
    color: color-mix(in srgb, var(--color-textColor) 82%, transparent);
    transition: color 110ms ease;
  }

  .webtrotion-search-subresult-excerpt {
    @apply line-clamp-1 text-xs leading-snug;
    color: var(--pf-muted);
    overflow-wrap: anywhere;
  }

  .webtrotion-search-subresult-link:hover,
  .webtrotion-search-subresult-link:focus-visible {
    @apply outline-0;
  }

  .webtrotion-search-subresult-link:hover {
    background: color-mix(in srgb, var(--color-accent-2) 7%, transparent);
  }

  .webtrotion-search-subresult-link:focus-visible {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }

  .webtrotion-search-subresult-link:hover .webtrotion-search-subresult-title,
  .webtrotion-search-subresult-link:focus-visible .webtrotion-search-subresult-title {
    @apply text-accent;
  }

  .webtrotion-search-subresult-link:hover .webtrotion-search-subresult-icon svg,
  .webtrotion-search-subresult-link:focus-visible .webtrotion-search-subresult-icon svg {
    @apply fill-accent;
  }

  site-search mark {
    @apply rounded-sm px-0.5 font-semibold no-underline;
    background: var(--pf-highlight-background);
    color: color-mix(in srgb, var(--color-textColor) 92%, transparent);
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  .pagefind-highlight {
    @apply rounded-sm px-0.5 font-semibold no-underline;
    background: color-mix(in srgb, var(--color-accent) 10%, transparent) !important;
    color: color-mix(in srgb, var(--color-textColor) 92%, transparent) !important;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  .webtrotion-search-preview-slot {
    @apply min-w-0 overflow-auto px-5 opacity-0 pointer-events-none;
    flex: 0 0 var(--wt-preview-col);
    border-inline-start: 1px solid var(--webtrotion-search-rule);
    scrollbar-gutter: stable;
    transform: translateX(0.5rem);
    transition:
      opacity 200ms var(--wt-ease-out) 20ms,
      transform 240ms var(--wt-ease-out) 20ms;
  }

  .webtrotion-search-content:has(webtrotion-search-preview[data-preview-active])
    .webtrotion-search-preview-slot {
    @apply opacity-100 pointer-events-auto;
    transform: translateX(0);
  }

  webtrotion-search-preview {
    @apply block;
  }

  .webtrotion-search-preview-card {
    @apply py-3.5;
  }

  .webtrotion-search-preview-kind {
    @apply mb-1.5 text-xs font-semibold tracking-wider uppercase;
    color: var(--pf-muted);
  }

  .webtrotion-search-preview-title {
    @apply text-base font-semibold leading-tight text-textColor;
  }

  .webtrotion-search-preview-empty,
  .webtrotion-search-preview-excerpt {
    color: var(--pf-muted);
  }

  .webtrotion-search-preview-excerpt {
    @apply mt-3 line-clamp-5 text-sm leading-normal;
    overflow-wrap: anywhere;
  }

  .webtrotion-search-preview[data-preview-kind="subresult"] .webtrotion-search-preview-excerpt {
    @apply line-clamp-6;
  }

  .webtrotion-search-preview-context {
    @apply mt-1.5 text-xs font-medium leading-snug;
    color: var(--pf-muted);
  }

  .webtrotion-search-preview-section-label {
    @apply mt-3.5 text-xs font-semibold tracking-wide uppercase;
    color: var(--pf-muted);
  }

  .webtrotion-search-preview-sections {
    @apply grid list-none gap-0 mt-3.5 p-0;
  }

  .webtrotion-search-preview-sections li {
    @apply px-0.5 py-2;
    border-bottom: 1px solid var(--webtrotion-search-rule);
  }

  .webtrotion-search-preview-sections li:first-child {
    @apply pt-0;
  }

  .webtrotion-search-preview-sections li:last-child {
    @apply border-b-0 pb-0;
  }

  .webtrotion-search-preview-sections span {
    @apply text-xs font-semibold text-textColor;
  }

  .webtrotion-search-preview-sections p {
    @apply mt-1 line-clamp-3 text-xs leading-snug;
    color: var(--pf-muted);
  }

  .webtrotion-search-preview-related-sections p {
    @apply line-clamp-2;
  }

  .webtrotion-search-skeleton,
  .webtrotion-search-preview-skeleton {
    @apply block rounded-sm;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-textColor) 8%, transparent),
      color-mix(in srgb, var(--color-textColor) 14%, transparent),
      color-mix(in srgb, var(--color-textColor) 8%, transparent)
    );
    background-size: 220% 100%;
    animation: webtrotion-search-shimmer 1.2s ease-in-out infinite;
  }

  .webtrotion-search-skeleton-title,
  .webtrotion-search-preview-skeleton.title {
    @apply h-4 w-[70%];
  }

  .webtrotion-search-skeleton-line,
  .webtrotion-search-preview-skeleton.line {
    @apply mt-3 h-3 w-[96%];
  }

  .webtrotion-search-skeleton-line.short,
  .webtrotion-search-preview-skeleton.short {
    @apply w-[58%];
  }

  @keyframes webtrotion-search-shimmer {
    from {
      background-position: 140% 0;
    }
    to {
      background-position: -80% 0;
    }
  }

  site-search pagefind-modal-footer {
    @apply flex flex-none items-center bg-bgColor px-3 py-2 text-xs;
    border-top: 1px solid var(--webtrotion-search-rule);
  }

  .webtrotion-search-navigation-hints {
    @apply hidden w-full flex-nowrap items-center justify-start gap-1 font-mono text-xs tracking-normal;
    color: color-mix(in srgb, var(--color-textColor) 58%, transparent);
  }

  @media (min-width: 640px) {
    .webtrotion-search-navigation-hints {
      @apply flex;
    }
  }

  @media (max-width: 639px) {
    site-search pagefind-modal-footer {
      @apply hidden!;
    }
  }

  .webtrotion-search-navigation-hints span {
    @apply inline-flex flex-none items-center gap-1 whitespace-nowrap;
  }

  .webtrotion-search-navigation-hints kbd {
    @apply inline-flex h-4.5 min-w-4.5 items-center justify-center rounded font-mono text-xs font-bold leading-none;
    border: 1px solid color-mix(in srgb, var(--color-textColor) 20%, transparent);
    background: color-mix(in srgb, var(--color-textColor) 4%, transparent);
    color: color-mix(in srgb, var(--color-textColor) 82%, transparent);
  }

  .webtrotion-search-navigation-hints kbd.webtrotion-search-arrow-key {
    @apply font-mono text-xs font-bold leading-none;
  }

  .webtrotion-search-navigation-hints kbd.webtrotion-search-symbol-key,
  .webtrotion-search-navigation-hints kbd.webtrotion-search-platform-modifier {
    @apply font-mono text-xs font-bold leading-none;
    color: color-mix(in srgb, var(--color-textColor) 82%, transparent);
  }

  .webtrotion-search-empty-state {
    @apply m-2 flex flex-col items-center gap-2 text-center text-sm leading-6;
    color: var(--pf-muted);
  }

  .webtrotion-search-empty-state-icon {
    @apply block size-8;
  }

  .webtrotion-search-empty-state-icon svg {
    @apply block h-full w-full fill-current opacity-50;
  }

  @media (max-width: 1023px) {
    site-search .pf-modal {
      @apply inset-x-0!;
      margin: max(2rem, 8dvh) auto !important;
      width: min(34rem, calc(100vw - 1.5rem)) !important;
      max-width: calc(100vw - 1.5rem) !important;
      height: var(--wt-height-compact) !important;
    }

    site-search .pf-modal:has(.webtrotion-search-result) {
      height: var(--wt-height-results) !important;
    }

    site-search .pf-modal:has(webtrotion-search-preview[data-preview-active]) {
      width: min(34rem, calc(100vw - 1.5rem)) !important;
      --wt-modal-tx: 0px;
    }

    .webtrotion-search-content {
      @apply flex-col;
    }

    .webtrotion-search-results-pane {
      @apply flex-auto;
    }

    .webtrotion-search-preview-slot {
      @apply m-0 max-h-0 flex-none rounded-none border-0 border-s-0 bg-transparent shadow-none;
      transform: translateY(0.6rem);
      transition:
        opacity 180ms var(--wt-ease-out) 40ms,
        max-height 240ms var(--wt-ease-out),
        transform 220ms var(--wt-ease-out) 40ms;
    }

    .webtrotion-search-content:has(webtrotion-search-preview[data-preview-active])
      .webtrotion-search-preview-slot {
      max-height: 42%;
      @apply mx-0 mt-2 rounded-t-xl border border-b-0 border-textColor/5 bg-popover-bg shadow-[0_-10px_24px_-12px_rgba(0,0,0,0.22)];
      transform: translateY(0);
    }

    .webtrotion-search-content:has(webtrotion-search-preview[data-preview-kind="subresult"][data-preview-active])
      .webtrotion-search-preview-slot {
      @apply max-h-3/5;
    }

    :root.dark
      .webtrotion-search-content:has(webtrotion-search-preview[data-preview-active])
      .webtrotion-search-preview-slot {
      @apply border-textColor/10 shadow-[0_-12px_28px_-12px_rgba(0,0,0,0.42)];
    }
  }

  @media (max-width: 640px) {
    site-search {
      --wt-modal-top-m: max(2rem, 5dvh);
      --wt-height-compact: 80dvh;
      --wt-height-results: 80dvh;
    }

    site-search .pf-modal,
    site-search .pf-modal:has(.webtrotion-search-result),
    site-search .pf-modal:has(webtrotion-search-preview[data-preview-active]) {
      @apply inset-0! p-0! rounded-xl!;
      margin: var(--wt-modal-top-m) auto !important;
      width: calc(100vw - 2.5rem) !important;
      max-width: calc(100vw - 2.5rem) !important;
      height: var(--wt-height-results) !important;
      max-height: calc(100dvh - var(--wt-modal-top-m) - 1.5rem) !important;
      border: 1px solid var(--webtrotion-search-rule) !important;
      --wt-modal-tx: 0px;
    }

    site-search .search-loading-modal {
      margin: var(--wt-modal-top-m) auto;
      width: calc(100vw - 2.5rem);
      max-width: calc(100vw - 2.5rem);
      height: var(--wt-height-results);
      max-height: calc(100dvh - var(--wt-modal-top-m) - 1.5rem);
      @apply rounded-xl;
    }

    site-search pagefind-modal-header {
      @apply p-2.5;
    }

    site-search .pf-input {
      @apply min-h-11 px-9 text-base;
    }

    .webtrotion-search-filters {
      @apply relative flex-nowrap overflow-visible px-2.5 py-2;
      z-index: 2;
    }

    site-search pagefind-filter-dropdown {
      @apply min-w-0;
    }

    site-search .pf-dropdown-menu {
      @apply start-0! left-0!;
      width: min(18rem, calc(100vw - 1.3rem)) !important;
      max-width: min(18rem, calc(100vw - 1.3rem)) !important;
      transform: none !important;
    }

    site-search pagefind-filter-dropdown:nth-child(2) .pf-dropdown-menu {
      width: min(15rem, calc(100vw - 9.4rem)) !important;
      max-width: min(15rem, calc(100vw - 9.4rem)) !important;
    }

    .webtrotion-search-content {
      @apply p-0;
    }

    webtrotion-search-navigation {
      @apply mb-1.5 px-2;
    }

    .webtrotion-search-result-card {
      @apply mx-1.5;
    }

  }

  @media (hover: none), (pointer: coarse) {
    .webtrotion-search-preview-slot {
      @apply hidden!;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    site-search .pf-modal,
    site-search .pf-modal[open] {
      @apply animate-none;
      transition: opacity 160ms ease;
    }

    .webtrotion-search-content,
    .webtrotion-search-preview-slot,
    .webtrotion-search-result-card,
    .webtrotion-search-skeleton,
    .webtrotion-search-preview-skeleton,
    .webtrotion-search-navigation-link,
    .webtrotion-search-goto-summary,
    .webtrotion-search-pinned-link,
    .webtrotion-search-subresult-link,
    site-search .pf-dropdown-trigger {
      @apply animate-none;
      transition: opacity 160ms ease;
      transform: none !important;
    }
  }

.popoverEl {
  @apply left-0 top-0 max-w-[calc(100vw-10px)];
}

.footnote-margin-note.highlighted {
  @apply opacity-100 text-textColor;
}

[data-margin-note].highlighted {
  background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
  @apply -mx-0.5 rounded px-0.5;
}

.footnote-margin-note> :first-child > :nth-child(2) {
  @apply !inline !mt-0;
}

.footnote-margin-note.highlighted > :first-child > :first-child {
  background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
  @apply -mx-0.5 rounded px-0.5;
  color: var(--color-quote);
}

@media (max-width: 1023px) {
  .footnote-margin-note {
    @apply hidden;
  }
}

@media (min-width: 1024px) {
  .footnote-margin-note {
    @apply block;
  }

  .post-body {
    @apply relative;
  }

  /* Wide / breakout blocks: expand symmetrically by --wt-wide-side per side,
     clamped to the viewport. Overlapping margin notes are pushed below in margin-notes.ts. */
  .webtrotion-wide-breakout {
    --wt-wide-side: 20%;
    --wt-wide-gutter: 24px;
    --wt-wide-width: min(
      calc(100% + 2 * var(--wt-wide-side)),
      calc(100vw - 2 * var(--wt-wide-gutter))
    );
    width: var(--wt-wide-width);
    max-width: none;
    margin-inline: calc((100% - var(--wt-wide-width)) / 2);
  }
}

/* xl+ has room to break out further. */
@media (min-width: 1280px) {
  .webtrotion-wide-breakout {
    --wt-wide-side: 30%;
  }
}

/* Safety net: never break out inside previews (defensive; the class isn't emitted there). */
.notion-popover .webtrotion-wide-breakout,
[data-popover] .webtrotion-wide-breakout,
.footnote-margin-note .webtrotion-wide-breakout {
  width: auto;
  max-width: 100%;
  margin-inline: 0;
}

@media print {
  .print-footnote {
    @apply my-2 pl-3 text-sm leading-relaxed;
    color: color-mix(in srgb, var(--color-textColor) 76%, transparent);
    border-left: 2px solid color-mix(in srgb, var(--color-textColor) 18%, transparent);
    break-inside: avoid;
  }

  .print-footnote > *,
  .print-footnote > * > * {
    @apply m-0 inline;
  }

  .footnote-margin-note,
  .popoverEl,
  .jump-to-bibliography,
  [data-back-to-citation] {
    @apply hidden!;
  }
}

.post-preview-full-container .footnote-margin-note,
.post-preview-full-container .cite-this-page-section,
.post-preview-full-container .bibliography-section,
.post-preview-full-container .footnotes-section,
.post-preview-full-container .jump-to-bibliography {
  @apply !hidden
}

.datatable-input {
  @apply w-full box-border rounded-md border border-[#ccc] px-[6px] py-[3px] text-sm transition-[border-color,box-shadow] duration-200 ease-out;
}

.datatable-input:focus {
  @apply border-[#007bff] outline-none ring-[0.2rem] ring-[rgba(0,123,255,0.25)];
}

.filter-toggle {
  @apply bg-none border-none text-[20px] cursor-pointer px-[10px] transition-opacity duration-200 ease-out;
}

.filter-toggle:hover {
  @apply opacity-70;
}

.filter-row,
.search-inputs {
  @apply transition-[max-height,opacity] duration-300 ease-out max-h-[50px] opacity-100 overflow-hidden;
}

.filter-row.hide,
.search-inputs.hide {
  @apply max-h-0 hidden opacity-0 pt-0 pb-0 mt-0 mb-0;
}

.datatable-top {
  @apply flex flex-wrap justify-between items-center p-1 mb-[10px];
}

.datatable-top-left {
  @apply flex items-center flex-grow;
}

.datatable-info {
  @apply text-sm font-mono transition-colors duration-200 ease-out whitespace-nowrap;
}

.datatable-sorter {
  @apply relative pr-4 bg-transparent;
}

.datatable-sorter::after {
  border-bottom-color: var(--color-accent) !important;
  top: -2px !important;
}

.datatable-sorter::before {
  border-top-color: var(--color-accent) !important;
}

.datatable-table>tbody>tr>td,
.datatable-table>tbody>tr>th,
.datatable-table>tfoot>tr>td,
.datatable-table>tfoot>tr>th,
.datatable-table>thead>tr>td,
.datatable-table>thead>tr>th {
  padding: calc(var(--spacing) * 2);
}

html.dark :not(.datatable-ascending):not(.datatable-descending)>.datatable-sorter::after,
html.dark :not(.datatable-ascending):not(.datatable-descending)>.datatable-sorter::before {
  opacity: 0.3 !important;
}

.datatable-wrapper .datatable-container {
  border: none !important;
}

.datatable-table>thead>tr>th {
  border-bottom-color: rgba(229, 231, 235, 0.9);
}

.dark .datatable-table>thead>tr>th {
  border-bottom-color: rgba(55, 65, 81, 0.9);
}

@media print {
  .datatable-top,
  .filter-row,
  .search-inputs {
    @apply hidden!;
  }

  .datatable-wrapper .datatable-container {
    @apply overflow-visible!;
  }

  .datatable-table tr {
    @apply table-row!;
  }
}

@media (max-width: 640px) {
  .datatable-top {
    @apply flex-nowrap;
  }

  .datatable-top-left {
    @apply w-auto mb-0;
  }

  .datatable-info {
    @apply pl-2;
  }

  .datatable-top.filter-active {
    @apply flex-col items-stretch;
  }

  .datatable-top.filter-active .datatable-top-left {
    @apply w-full mb-2;
  }

  .datatable-top.filter-active .datatable-info {
    @apply w-full pr-2 text-right;
  }
}

/* Gallery Grid Layout - 1 col sm, 2 cols md, 3 cols lg */
.gallery-grid {
  @apply grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3;
}

/* Post Card for Gallery View */
.post-card {
  @apply relative overflow-hidden rounded-lg bg-bgColor transition-[box-shadow,transform] duration-200;
  transition-timing-function: var(--ease-out);
}

.post-card:hover {
  box-shadow: 0 10px 30px -14px color-mix(in srgb, var(--color-textColor) 32%, transparent);
  transform: translateY(-3px);
}

.post-card-link {
  @apply block no-underline text-inherit;
}

.post-card-image-container {
  @apply relative overflow-hidden rounded-lg border aspect-[3/2];
  border-color: color-mix(in srgb, var(--color-textColor) 6%, transparent);
}

.post-card-image {
  @apply h-full w-full object-cover rounded-lg transition-transform duration-300 ease-out;
}

.post-card:hover .post-card-image {
  @apply scale-105;
}

.post-card-placeholder {
  @apply flex h-full w-full items-center justify-center rounded-lg;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 10%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent));
  transition: transform 300ms ease, filter 300ms ease;
}

.post-card-placeholder span {
  @apply text-[2.5rem] font-bold;
  color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.post-card:hover .post-card-placeholder {
  transform: scale(1.05);
  filter: brightness(1.03);
}

.post-card-tags {
  @apply flex flex-wrap items-baseline gap-1 px-0 pb-3;
}

.post-card-authors {
  @apply -mt-1 px-0 pb-1;
}

.post-card-badge {
  @apply bg-quote/90 absolute top-2 right-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white;
}

.post-card-meta-date {
  @apply text-accent/80 mb-1 block font-mono text-[10px];
}

.post-card-title {
  @apply mb-1 text-sm leading-snug font-semibold;
}

.post-card-excerpt {
  @apply text-textColor/70 line-clamp-2 block text-xs italic;
}

.post-card-author-link {
  @apply text-textColor/60 hover:text-accent text-[10px] transition-colors;
}

/* Hero Background (formerly Cover Overlay) for Hero and Stream */
.cover-hero-container {
  @apply grid relative w-full overflow-hidden min-h-[150px] rounded-lg mb-4;
  grid-template-areas: "stack";
  @apply isolate;
}

.cover-hero-image {
  grid-area: stack;
  @apply absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none;
}

.cover-hero-tint {
  grid-area: stack;
  @apply absolute inset-0 pointer-events-none;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-bgColor) 70%, transparent),
    color-mix(in srgb, var(--color-bgColor) 50%, transparent)
  );
}

.cover-hero-content {
  grid-area: stack;
  @apply relative z-10 min-h-[150px] p-6 flex flex-col justify-center;
}

.glightbox-clean .gslide-description {
  background: var(--color-bgColor);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-property: opacity, color, background-color, border-color, fill,
      stroke, box-shadow, text-decoration-color !important;
    transition-duration: 150ms !important;
    transition-delay: 0ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    scroll-behavior: auto !important;
  }

  .code button[data-code] .copy-icon-before,
  .code button[data-code].copied .copy-icon-before,
  .code button[data-code] .copy-icon-done,
  .code button[data-code].copied .copy-icon-done {
    transform: none !important;
    transition-duration: 110ms !important;
  }

  .code button[data-code] .copy-icon-before,
  .code button[data-code].copied .copy-icon-done {
    transition-delay: 110ms !important;
  }

  .code button[data-code] .copy-icon-done,
  .code button[data-code].copied .copy-icon-before {
    transition-delay: 0ms !important;
  }
}

@media print {
  html details.toggle[open] .rotate-svg {
    rotate: initial !important;
    transform: rotate(90deg) !important;
  }
}`;
