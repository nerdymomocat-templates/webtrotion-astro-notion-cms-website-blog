import type { ThemePreset } from "../theme";
import type { ThemeTemplateParams } from "./css-template-types";

// Personality deltas merged onto base.ts: matching selectors replace the base body, new rules are appended. Shared rules belong in base.ts.
export const classicOverride = (params: ThemeTemplateParams): string => `
@layer components {
.ann-bg-c {
    @apply rounded-sm px-1;
    background-color: var(--abc, transparent);
  }
.author-icon-link {
    @apply inline-flex items-center transition-[color,transform] duration-200 ease-out justify-center rounded-full border border-accent/20 p-0.5 text-textColor/60 transition-colors hover:text-link;
  }
.author-icon-link:hover {
    @apply border-accent/40;
  }
.author-name-link {
    @apply underline decoration-accent-2/40 underline-offset-2 transition-colors decoration-dotted font-medium font-accent;
  }
.author-name-link:hover {
    @apply decoration-accent-2/70 text-accent;
  }
.copy-markdown-btn {
    @apply inline-flex items-center gap-1 transition disabled:opacity-60 disabled:cursor-not-allowed h-10 w-10 rounded-full border shadow-lg flex justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer backdrop-blur-md print:hidden;
  }
.footer-link {
    @apply relative z-0 px-4 py-2 sm:px-2 sm:py-0 font-accent;
  }
.mdx-notion h1,
  .mdx-notion h2,
  .mdx-notion h3 {
    @apply font-bold text-textColor tracking-[-0.01em] mt-5 mb-3 font-accent;
  }
.nav-link {
    @apply relative z-0 w-fit self-end px-3 py-1 text-right sm:w-auto sm:self-auto sm:py-0 sm:text-left font-accent;
  }
.non-toggle-h2 {
    @apply relative mb-4 cursor-pointer text-2xl font-normal font-accent;
  }
.notion-h1 {
    @apply mt-8 mb-1 cursor-pointer text-2xl font-semibold font-accent;
  }
.notion-h2 {
    @apply mt-6 mb-1 cursor-pointer text-xl font-semibold font-accent;
  }
.notion-h3 {
    @apply mt-4 mb-1 cursor-pointer text-lg font-semibold font-accent;
  }
.notion-tag {
    @apply inline-block text-sm;
  }
.notion-tag,
  a[aria-label^="View more blogs with the tag"],
  a[aria-label^="View all posts with the tag:"],
  a[data-pagefind-filter="tags"] {
    @apply rounded-md border border-accent/20 px-2 py-0.5 font-medium tracking-[0.04em];
  }
.search-close-btn {
    @apply ms-auto cursor-pointer rounded-md bg-zinc-200 p-2 font-semibold dark:bg-zinc-700;
  }
.search-dialog {
    @apply bg-bgColor/80 h-full max-h-full w-full max-w-full border border-zinc-400 shadow-sm backdrop:backdrop-blur-sm sm:mx-auto sm:mt-16 sm:mb-auto sm:h-max sm:max-h-[calc(100%-8rem)] sm:min-h-[15rem] sm:w-5/6 sm:max-w-[48rem] sm:rounded-lg;
  }
.search-frame {
    @apply flex flex-col gap-4 p-6 pt-12 sm:pt-6;
  }
.site-page-link {
    @apply underline decoration-wavy decoration-from-font decoration-accent-2/40 hover:decoration-accent-2/60 underline-offset-2 font-accent;
  }
.title {
    @apply text-3xl font-bold text-accent-2 font-accent;
  }
.toc-content .text-quote\\! {
    @apply border-accent/30 bg-accent/10 font-semibold;
  }
.toc-content [id^="-tocid--"] {
    @apply rounded-md border border-transparent px-2 py-1 transition-colors duration-200;
  }
.toc-content [id^="-tocid--"]:hover {
    @apply border-accent/20 bg-accent/10 text-textColor;
  }
.visual-container [id^="-vistocid--"] {
    @apply rounded-full;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-textColor) 12%, transparent);
  }
#auto-recent-posts {
    @apply relative mt-8 mb-4 cursor-pointer text-2xl font-normal font-accent;
  }
a[aria-label^="View posts by"] {
    @apply underline decoration-dotted decoration-accent/40 underline-offset-2;
  }
}
@layer components {
a[aria-label^="View all posts with the tag:"] > span {
    @apply rounded-sm border border-accent/20 px-1 font-semibold tracking-[0.08em];
  }
}
@layer components {
a[aria-label^="View posts by"] > span {
    @apply rounded-md border border-accent/20 px-2 py-1 font-semibold tracking-[0.04em];
  }
}
@layer components {
a[aria-label^="View posts with the tag:"] > span,
  h1.title > span {
    @apply rounded-md border border-accent/20 px-2 py-1 font-semibold tracking-[0.04em];
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
.post-card-title {
  @apply mb-1 text-sm leading-snug font-semibold font-accent;
}

`;

export const classicIcons = {
	"🗓️": "M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1",
	download:
		"M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12S6.5 2 12 2M8 17h8v-2H8zm8-7h-2.5V6h-3v4H8l4 4z",
	rss: "M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93z",
	dblp: "M3.075.002c-.096.013-.154.092-.094.31L4.97 7.73L3.1 8.6s-.56.26-.4.85l2.45 9.159s.16.59.72.33l6.169-2.869l1.3-.61s.52-.24.42-.79l-.01-.06l-1.13-4.22l-.658-2.45l-.672-2.49v-.04s-.16-.59-.84-1L3.5.141s-.265-.16-.425-.139M18.324 5.03a.7.7 0 0 0-.193.06l-5.602 2.6l.862 3.2l1.09 4.08l.01.06c.05.47-.411.79-.411.79l-1.88.87l.5 1.89l.04.1c.07.17.28.6.81.91l6.95 4.269s.68.41.52-.17l-1.981-7.4l1.861-.86s.56-.26.4-.85L18.85 5.42s-.116-.452-.526-.39",
	email:
		"M12 15c.81 0 1.5-.3 2.11-.89c.59-.61.89-1.3.89-2.11s-.3-1.5-.89-2.11C13.5 9.3 12.81 9 12 9s-1.5.3-2.11.89C9.3 10.5 9 11.19 9 12s.3 1.5.89 2.11c.61.59 1.3.89 2.11.89m0-13c2.75 0 5.1 1 7.05 2.95S22 9.25 22 12v1.45c0 1-.35 1.85-1 2.55c-.7.67-1.5 1-2.5 1c-1.2 0-2.19-.5-2.94-1.5c-1 1-2.18 1.5-3.56 1.5c-1.37 0-2.55-.5-3.54-1.46C7.5 14.55 7 13.38 7 12c0-1.37.5-2.55 1.46-3.54C9.45 7.5 10.63 7 12 7c1.38 0 2.55.5 3.54 1.46C16.5 9.45 17 10.63 17 12v1.45c0 .41.16.77.46 1.08s.65.47 1.04.47c.42 0 .77-.16 1.07-.47s.43-.67.43-1.08V12c0-2.19-.77-4.07-2.35-5.65S14.19 4 12 4s-4.07.77-5.65 2.35S4 9.81 4 12s.77 4.07 2.35 5.65S9.81 20 12 20h5v2h-5c-2.75 0-5.1-1-7.05-2.95S2 14.75 2 12s1-5.1 2.95-7.05S9.25 2 12 2",
	github:
		"M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2",
	googlescholar:
		"M5.242 13.769L0 9.5L12 0l12 9.5l-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269M12 10a7 7 0 1 0 0 14a7 7 0 0 0 0-14",
	linkedin:
		"M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z",
	facebook:
		"M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95",
	twitter:
		"M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.2 4.2 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.52 8.52 0 0 1-5.33 1.84q-.51 0-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23",
	threads:
		"M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098c1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015c-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164c1.43 1.783 3.631 2.698 6.54 2.717c2.623-.02 4.358-.631 5.8-2.045c1.647-1.613 1.618-3.593 1.09-4.798c-.31-.71-.873-1.3-1.634-1.75c-.192 1.352-.622 2.446-1.284 3.272c-.886 1.102-2.14 1.704-3.73 1.79c-1.202.065-2.361-.218-3.259-.801c-1.063-.689-1.685-1.74-1.752-2.964c-.065-1.19.408-2.285 1.33-3.082c.88-.76 2.119-1.207 3.583-1.291a14 14 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757c-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32l-1.757-1.18c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388q.163.07.321.142c1.49.7 2.58 1.761 3.154 3.07c.797 1.82.871 4.79-1.548 7.158c-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69q-.362 0-.739.021c-1.836.103-2.98.946-2.916 2.143c.067 1.256 1.452 1.839 2.784 1.767c1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221",
	instagram:
		"M13.028 2c1.125.003 1.696.009 2.189.023l.194.007c.224.008.445.018.712.03c1.064.05 1.79.218 2.427.465c.66.254 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428c.012.266.022.487.03.712l.006.194c.015.492.021 1.063.023 2.188l.001.746v1.31a79 79 0 0 1-.023 2.188l-.006.194c-.008.225-.018.446-.03.712c-.05 1.065-.22 1.79-.466 2.428a4.9 4.9 0 0 1-1.153 1.772a4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.427.465l-.712.03l-.194.006c-.493.014-1.064.021-2.189.023l-.746.001h-1.309a78 78 0 0 1-2.189-.023l-.194-.006a63 63 0 0 1-.712-.031c-1.064-.05-1.79-.218-2.428-.465a4.9 4.9 0 0 1-1.771-1.153a4.9 4.9 0 0 1-1.154-1.772c-.247-.637-.415-1.363-.465-2.428l-.03-.712l-.005-.194A79 79 0 0 1 2 13.028v-2.056a79 79 0 0 1 .022-2.188l.007-.194c.008-.225.018-.446.03-.712c.05-1.065.218-1.79.465-2.428A4.9 4.9 0 0 1 3.68 3.678a4.9 4.9 0 0 1 1.77-1.153c.638-.247 1.363-.415 2.428-.465c.266-.012.488-.022.712-.03l.194-.006a79 79 0 0 1 2.188-.023zM12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10m0 2a3 3 0 1 1 .001 6a3 3 0 0 1 0-6m5.25-3.5a1.25 1.25 0 0 0 0 2.5a1.25 1.25 0 0 0 0-2.5",
	mastodon:
		"M20.94 14c-.28 1.41-2.44 2.96-4.97 3.26c-1.31.15-2.6.3-3.97.24c-2.25-.11-4-.54-4-.54v.62c.32 2.22 2.22 2.35 4.03 2.42c1.82.05 3.44-.46 3.44-.46l.08 1.65s-1.28.68-3.55.81c-1.25.07-2.81-.03-4.62-.5c-3.92-1.05-4.6-5.24-4.7-9.5l-.01-3.43c0-4.34 2.83-5.61 2.83-5.61C6.95 2.3 9.41 2 11.97 2h.06c2.56 0 5.02.3 6.47.96c0 0 2.83 1.27 2.83 5.61c0 0 .04 3.21-.39 5.43M18 8.91c0-1.08-.3-1.91-.85-2.56c-.56-.63-1.3-.96-2.23-.96c-1.06 0-1.87.41-2.42 1.23l-.5.88l-.5-.88c-.56-.82-1.36-1.23-2.43-1.23c-.92 0-1.66.33-2.23.96C6.29 7 6 7.83 6 8.91v5.26h2.1V9.06c0-1.06.45-1.62 1.36-1.62c1 0 1.5.65 1.5 1.93v2.79h2.07V9.37c0-1.28.5-1.93 1.51-1.93c.9 0 1.35.56 1.35 1.62v5.11H18z",
	semanticscholar:
		"M24 8.609c-.848.536-1.436.83-2.146 1.245c-4.152 2.509-8.15 5.295-11.247 8.981l-1.488 1.817l-4.568-7.268c1.021.814 3.564 3.098 4.603 3.599l3.356-2.526c2.336-1.644 8.946-5.226 11.49-5.848M8.046 15.201c.346.277.692.537.969.744c.761-3.668.121-7.613-1.886-11.039c3.374-.052 6.731-.087 10.105-.139a14.8 14.8 0 0 1 1.298 5.295c.294-.156.588-.294.883-.433c-.104-1.868-.641-3.91-1.662-6.263c-4.602-.018-9.188-.018-13.79-.018c2.993 3.547 4.36 7.839 4.083 11.853m-.623-.484c.087.086.191.155.277.225c-.138-3.409-1.419-6.887-3.824-9.881H1.73c3.098 2.855 4.984 6.299 5.693 9.656m-.744-.658c.104.087.208.173.329.277c-.9-2.526-2.492-5.018-4.741-7.198H0c2.89 2.076 5.122 4.481 6.679 6.921",
	"this-github-repo":
		"M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m6.75 11.5c2.75 0 3.49-2.03 3.68-3.1c.91-.29 1.57-1.14 1.57-2.15C18 7 17 6 15.75 6S13.5 7 13.5 8.25c0 .94.57 1.75 1.39 2.08C14.67 11 14 12 12 12c-1.38 0-2.34.35-3 .84V8.87c.87-.31 1.5-1.14 1.5-2.12c0-1.25-1-2.25-2.25-2.25S6 5.5 6 6.75c0 .98.63 1.81 1.5 2.12v6.26c-.87.31-1.5 1.14-1.5 2.12c0 1.25 1 2.25 2.25 2.25s2.25-1 2.25-2.25c0-.93-.56-1.75-1.37-2.07c.28-.68 1.1-1.68 3.62-1.68m-4.5 3a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75m0-10.5a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75m7.5 1.5a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75a.75.75 0 0 1-.75-.75a.75.75 0 0 1 .75-.75",
	"page-mention-ne-arrow":
		"M12 3.97c-4.41 0-8.03 3.62-8.03 8.03s3.62 8.03 8.03 8.03s8.03-3.62 8.03-8.03S16.41 3.97 12 3.97M12 2c5.54 0 10 4.46 10 10s-4.46 10-10 10S2 17.54 2 12S6.46 2 12 2m1.88 9.53L16 13.64V8h-5.64l2.11 2.12L7.5 15.1l1.4 1.4",
	document:
		"M13 9h5.5L13 3.5zM6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m9 16v-2H6v2zm3-4v-2H6v2z",
	expand:
		"m16 4l4 4V4m0 12l-4 4h4M8 20l-4-4v4M4 8l4-4H4m12.95 3.05a7.007 7.007 0 0 0-9.9 0a7.007 7.007 0 0 0 0 9.9a7.007 7.007 0 0 0 9.9 0c2.73-2.73 2.73-7.16 0-9.9m-1.1 8.8a5.4 5.4 0 0 1-7.7 0a5.4 5.4 0 0 1 0-7.7a5.4 5.4 0 0 1 7.7 0a5.4 5.4 0 0 1 0 7.7",
	"preview-pdf":
		"M9 13a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3a3 3 0 0 0-3 3m11 6.59V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12c.45 0 .85-.15 1.19-.4l-4.43-4.43c-.8.52-1.76.83-2.76.83a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5c0 1-.31 1.96-.83 2.75z",
	"table-of-contents":
		"M3 9h14V7H3zm0 4h14v-2H3zm0 4h14v-2H3zm16 0h2v-2h-2zm0-10v2h2V7zm0 6h2v-2h-2z",
	"clear-search":
		"m12.546 9.966l-.94-.941l.788-1.904h-2.73L8.427 5.885h10.689v1.23h-5.358zm6.793 10.788l-7.973-7.993l-2.308 5.431H7.706l2.725-6.365l-7.377-7.358l.708-.707l16.284 16.284z",
	close:
		"M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z",
	"checkbox-unchecked":
		"M19 3H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 2v14H5V5z",
	"checkbox-checked":
		"m10 17l-5-5l1.41-1.42L10 14.17l7.59-7.59L19 8m0-5H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2",
	"clipboard-copy-code":
		"M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-7 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1",
	"clipboard-copy-code-done":
		"m10 17l-4-4l1.41-1.41L10 14.17l6.59-6.59L18 9m-6-6a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m7 0h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2",
	"tag-multiple":
		"M6.5 10C7.3 10 8 9.3 8 8.5S7.3 7 6.5 7S5 7.7 5 8.5S5.7 10 6.5 10M9 6l7 7l-5 5l-7-7V6zm0-2H4c-1.1 0-2 .9-2 2v5c0 .6.2 1.1.6 1.4l7 7c.3.4.8.6 1.4.6s1.1-.2 1.4-.6l5-5c.4-.4.6-.9.6-1.4c0-.6-.2-1.1-.6-1.4l-7-7C10.1 4.2 9.6 4 9 4m4.5 1.7l1-1l6.9 6.9c.4.4.6.9.6 1.4s-.2 1.1-.6 1.4L16 19.8l-1-1l5.7-5.8z",
	pin: "M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z",
	"pin-elegant": "M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z",
	"pin-bold": "M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z",
	"pin-outline": "M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z",
	"pin-playful": "M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z",
	"tag-outline":
		"m21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9A2 2 0 0 0 13 22a2 2 0 0 0 1.41-.59l7-7A2 2 0 0 0 22 13a2 2 0 0 0-.59-1.42M13 20l-9-9V4h7l9 9M6.5 5A1.5 1.5 0 1 1 5 6.5A1.5 1.5 0 0 1 6.5 5",
	web: "M16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2s.06-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.92 7.92 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8 8 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.7 15.7 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2",
	"open-in-new":
		"M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z",
	search:
		"M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5l-1.5 1.5l-5-5v-.79l-.27-.27A6.52 6.52 0 0 1 9.5 16A6.5 6.5 0 0 1 3 9.5A6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14S14 12 14 9.5S12 5 9.5 5",
	"theme-dark":
		"M3 11.507a9.493 9.493 0 0 0 18 4.219c-8.507 0-12.726-4.22-12.726-12.726A9.49 9.49 0 0 0 3 11.507",
	"theme-light":
		"M12 18a6 6 0 1 0 0-12a6 6 0 0 0 0 12m10-6h1M12 2V1m0 22v-1m8-2l-1-1m1-15l-1 1M4 20l1-1M4 4l1 1m-4 7h1",
	"to-top": "M7.41 18.41L6 17l6-6l6 6l-1.41 1.41L12 13.83zm0-6L6 11l6-6l6 6l-1.41 1.41L12 7.83z",
	"theme-system":
		"M 9.173 14.83 a 4 4 0 1 1 5.657 -5.657 m -2.83 2.827 a 7.5 7.5 0 0 0 8.845 2.492 A 9 9 0 0 1 5.642 18.36 M 3 12 h 1 m 8 -9 v 1 M 5.6 5.6 l 0.7 0.7 M 3 21 L 21 3",
	"toggle-triangle": "M 9.2075 8.5912 L 15.8925 12.45 L 9.2075 16.3087 Z",
	menu: "M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3",
	filter:
		"M14 12v7.88c.04.3-.06.62-.29.83a.996.996 0 0 1-1.41 0l-2.01-2.01a.99.99 0 0 1-.29-.83V12h-.03L4.21 4.62a1 1 0 0 1 .17-1.4c.19-.14.4-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 0 1 .17 1.4L14.03 12z",
	author:
		"M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2M7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.5.88 4.93 1.78A7.9 7.9 0 0 1 12 20c-1.86 0-3.57-.64-4.93-1.72m11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33A7.93 7.93 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.5-1.64 4.83M12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6m0 5a1.5 1.5 0 0 1-1.5-1.5A1.5 1.5 0 0 1 12 8a1.5 1.5 0 0 1 1.5 1.5A1.5 1.5 0 0 1 12 11",
	"table-search":
		"M19.3 17.89c1.32-2.1.7-4.89-1.41-6.21a4.52 4.52 0 0 0-6.21 1.41C10.36 15.2 11 18 13.09 19.3c1.47.92 3.33.92 4.8 0L21 22.39L22.39 21zm-2-.62c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.96.99.95 2.57-.03 3.54zM19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5.81a6.3 6.3 0 0 1-1.31-2H5v-4h4.18c.16-.71.43-1.39.82-2H5V8h6v2.81a6.3 6.3 0 0 1 2-1.31V8h6v2a6.5 6.5 0 0 1 2 2V6a2 2 0 0 0-2-2",
	calendar:
		"M22.86 17.74c-.09.11-.21.17-.33.2l-1.87.36l1.29 2.84c.16.29.02.65-.28.79l-2.14 1.01c-.09.06-.17.06-.26.06c-.22 0-.43-.12-.53-.34l-1.29-2.83l-1.49 1.21a.593.593 0 0 1-.96-.47V11.6c0-.33.26-.6.59-.6c.15 0 .29.05.41.13l6.77 5.76c.27.23.3.61.09.85M12 15v-5H7v5zm7-12h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H5V8h14v3.06l2 1.7V5c0-1.1-.9-2-2-2",
	"external-link-mention":
		"M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-5.06 11.81L11.73 17c-.65.67-1.51 1-2.37 1S7.64 17.67 7 17c-1.33-1.29-1.33-3.42 0-4.74l1.35-1.36l-.01.6c-.01.5.07 1 .23 1.44l.05.15l-.4.41a1.597 1.597 0 0 0 0 2.28c.61.62 1.67.62 2.28 0l2.2-2.19c.3-.31.48-.72.48-1.15c0-.44-.18-.83-.48-1.14a.87.87 0 0 1 0-1.24c.33-.33.91-.32 1.24 0c.63.64.98 1.48.98 2.38s-.35 1.74-.98 2.37M17 11.74l-1.34 1.36v-.6c.01-.5-.07-1-.23-1.44l-.05-.14l.4-.42a1.597 1.597 0 0 0 0-2.28c-.61-.62-1.68-.61-2.28 0l-2.2 2.2c-.3.3-.48.71-.48 1.14c0 .44.18.83.48 1.14c.17.16.26.38.26.62s-.09.46-.26.62a.86.86 0 0 1-.62.25c-.22 0-.45-.08-.62-.25a3.36 3.36 0 0 1 0-4.75L12.27 7A3.31 3.31 0 0 1 17 7c.65.62 1 1.46 1 2.36s-.35 1.74-1 2.38",
	bluesky:
		"M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565C.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479c.815 2.736 3.713 3.66 6.383 3.364q.204-.03.415-.056q-.207.033-.415.056c-3.912.58-7.387 2.005-2.83 7.078c5.013 5.19 6.87-1.113 7.823-4.308c.953 3.195 2.05 9.271 7.733 4.308c4.267-4.308 1.172-6.498-2.74-7.078a9 9 0 0 1-.415-.056q.21.026.415.056c2.67.297 5.568-.628 6.383-3.364c.246-.828.624-5.79.624-6.478c0-.69-.139-1.861-.902-2.206c-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8",
	substack:
		"M22.539 8.242H1.46V5.406h21.08zM1.46 10.812V24L12 18.11L22.54 24V10.812zM22.54 0H1.46v2.836h21.08z",
	kofi: "M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734c4.352.24 7.422-2.831 6.649-6.916m-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09c-.443-.441-3.368-3.049-4.034-3.954c-.709-.965-1.041-2.7-.091-3.71c.951-1.01 3.005-1.086 4.363.407c0 0 1.565-1.782 3.468-.963s1.832 3.011.723 4.311m6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015",
	"buy-me-a-coffee":
		"m20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379c-.197-.069-.42-.098-.57-.241c-.152-.143-.196-.366-.231-.572c-.065-.378-.125-.756-.192-1.133c-.057-.325-.102-.69-.25-.987c-.195-.4-.597-.634-.996-.788a6 6 0 0 0-.626-.194c-1-.263-2.05-.36-3.077-.416a26 26 0 0 0-3.7.062c-.915.083-1.88.184-2.75.5c-.318.116-.646.256-.888.501c-.297.302-.393.77-.177 1.146c.154.267.415.456.692.58c.36.162.737.284 1.123.366c1.075.238 2.189.331 3.287.37q1.829.074 3.65-.118q.449-.05.896-.119c.352-.054.578-.513.474-.834c-.124-.383-.457-.531-.834-.473c-.466.074-.96.108-1.382.146q-1.767.12-3.536.006a22 22 0 0 1-1.157-.107c-.086-.01-.18-.025-.258-.036q-.364-.055-.724-.13c-.111-.027-.111-.185 0-.212h.005q.416-.09.838-.147h.002c.131-.009.263-.032.394-.048a25 25 0 0 1 3.426-.12q1.011.029 2.017.144l.228.031q.4.06.798.145c.392.085.895.113 1.07.542c.055.137.08.288.111.431l.319 1.484a.237.237 0 0 1-.199.284h-.003l-.112.015a37 37 0 0 1-4.743.295a37 37 0 0 1-4.699-.304c-.14-.017-.293-.042-.417-.06c-.326-.048-.649-.108-.973-.161c-.393-.065-.768-.032-1.123.161c-.29.16-.527.404-.675.701c-.154.316-.199.66-.267 1c-.069.34-.176.707-.135 1.056c.087.753.613 1.365 1.37 1.502a39.7 39.7 0 0 0 11.343.376a.483.483 0 0 1 .535.53l-.071.697l-1.018 9.907c-.041.41-.047.832-.125 1.237c-.122.637-.553 1.028-1.182 1.171q-.868.197-1.756.205c-.656.004-1.31-.025-1.966-.022c-.699.004-1.556-.06-2.095-.58c-.475-.458-.54-1.174-.605-1.793l-.731-7.013l-.322-3.094c-.037-.351-.286-.695-.678-.678c-.336.015-.718.3-.678.679l.228 2.185l.949 9.112c.147 1.344 1.174 2.068 2.446 2.272c.742.12 1.503.144 2.257.156c.966.016 1.942.053 2.892-.122c1.408-.258 2.465-1.198 2.616-2.657l1.024-9.995l.215-2.087a.48.48 0 0 1 .39-.426c.402-.078.787-.212 1.074-.518c.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233c-2.416.359-4.866.54-7.308.46c-1.748-.06-3.477-.254-5.207-.498c-.17-.024-.353-.055-.47-.18c-.22-.236-.111-.71-.054-.995c.052-.26.152-.609.463-.646c.484-.057 1.046.148 1.526.22q.865.132 1.737.212c2.48.226 5.002.19 7.472-.14q.675-.09 1.345-.21c.399-.072.84-.206 1.08.206c.166.281.188.657.162.974a.54.54 0 0 1-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a6 6 0 0 1-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38c0 0 1.243.065 1.658.065c.447 0 1.786-.065 1.786-.065c.783 0 1.434-.6 1.499-1.38l.94-9.95a4 4 0 0 0-1.322-.238c-.826 0-1.491.284-2.26.613",
	"external-link":
		"M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z",
	next: "M9.31 6.71a.996.996 0 0 0 0 1.41L13.19 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.72 6.7c-.38-.38-1.02-.38-1.41.01",
	before:
		"M14.91 6.71a.996.996 0 0 0-1.41 0L8.91 11.3a.996.996 0 0 0 0 1.41l4.59 4.59a.996.996 0 1 0 1.41-1.41L11.03 12l3.88-3.88c.38-.39.38-1.03 0-1.41",
	info: "M11 7v2h2V7zm3 10v-2h-1v-4h-3v2h1v2h-1v2zm8-5c0 5.5-4.5 10-10 10S2 17.5 2 12S6.5 2 12 2s10 4.5 10 10m-2 0c0-4.42-3.58-8-8-8s-8 3.58-8 8s3.58 8 8 8s8-3.58 8-8",
	jump: "M12 14a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m11.46-5.14l-1.59 6.89L15 14.16l3.8-2.38A7.97 7.97 0 0 0 12 8c-3.95 0-7.23 2.86-7.88 6.63l-1.97-.35C2.96 9.58 7.06 6 12 6c3.58 0 6.73 1.89 8.5 4.72z",
	"copy-as-markdown":
		"M12 21v-7q0-.825.588-1.412T14 12h6q.825 0 1.413.588T22 14v7h-2v-7h-2v5h-2v-5h-2v7zm-7 0q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.175q.275-.875 1.075-1.437T12 1q1 0 1.788.563T14.85 3H19q.825 0 1.413.588T21 5v5h-2V5h-2v3H7V5H5v14h5v2zm7-16q.425 0 .713-.288T13 4t-.288-.712T12 3t-.712.288T11 4t.288.713T12 5",
} as const;

export const classicTheme: ThemePreset = {
	name: "classic",
	colors: {
		surface1: "color-mix(in srgb, var(--theme-text) 4%, var(--theme-bg))",
		surface2: "color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg))",
		border: "color-mix(in srgb, var(--theme-text) 12%, transparent)",
		mutedText: "color-mix(in srgb, var(--theme-text) 60%, transparent)",
		inlineCodeBg: { light: "#f3f4f6", dark: "#1f2937" },
		inlineCodeText: { light: "#9f1239", dark: "#fda4af" },
		tableBorder: { light: "rgba(229, 231, 235, 0.9)", dark: "rgba(55, 65, 81, 0.9)" },
		searchDialogBorder: "#a1a1aa",
		buttonMutedBg: { light: "#e4e4e7", dark: "#3f3f46" },
	},
	mix: {
		blockquoteBg: 8,
		fabBg: 12,
		fabBorder: 40,
		fabText: 80,
		inlineHighlight: 20,
		anchorHash: 50,
		navGrad: { a: 4, b: 10, c: 5 },
		navGradDark: { a: 6, b: 14, c: 7 },
		navActive: { a: 8, b: 20, c: 10 },
		heroTintTop: 70,
		heroTintBottom: 50,
		cardPlaceholder: { a: 10, b: 20 },
		cardImageBorder: 6,
	},
	typography: {
		bodyFont: "sans",
		headingFont: "sans",
		navFont: "sans",
		codeFont: "mono",
	},
	fontSize: {
		root: "14px",
		rootSm: "16px",
		title: "1.875rem",
		h1: "1.5rem",
		h2: "1.25rem",
		h3: "1.125rem",
		body: "1rem",
		small: "0.875rem",
		xs: "0.75rem",
		inlineCode: "0.95rem",
		cardPlaceholder: "2.5rem",
		datatableFilterIcon: "20px",
		mdxH1: "clamp(1.8rem, 2.6vw, 2.05rem)",
		mdxH2: "clamp(1.45rem, 2.3vw, 1.8rem)",
		mdxH3: "clamp(1.2rem, 2vw, 1.55rem)",
	},
	fontWeight: {
		normal: "400",
		medium: "500",
		semibold: "600",
		bold: "700",
		heading: "600",
		nav: "400",
		tableHeader: "600",
		chip: "600",
	},
	letterSpacing: {
		heading: "-0.01em",
		nav: "0",
		chip: "0.05em",
	},
	textTransform: {
		heading: "none",
		nav: "none",
		chip: "uppercase",
		tableHeader: "uppercase",
	},
	lineHeight: {
		body: "1.75",
		heading: "1.2",
		mdxH1: "1.2",
		mdxH2: "1.25",
		mdxH3: "1.3",
		list: "1.65",
		callout: "1.5",
		todo: "1.75",
		bookmarkTitle: "1.25",
		bookmarkMeta: "1",
	},
	spacing: {
		pageMaxWidth: "48rem",
		pagePaddingX: "2rem",
		pagePaddingTop: "2rem",
		scrollMarginTop: "2.5rem",
		h1: { mt: "2rem", mb: "0.25rem" },
		h2: { mt: "1.5rem", mb: "0.25rem" },
		h3: { mt: "1rem", mb: "0.25rem" },
		text: { my: "0.25rem", minHeight: "1.75rem" },
		list: { gap: "0.25rem", pl: "1.5rem" },
		columnList: { my: "1rem", gapX: "1rem" },
		columnBasis: "11rem",
		divider: { my: "1rem", height: "0.125rem" },
		codeBlock: { padding: "1rem", mb: "0.25rem", maxHeight: "340px" },
		codeLine: {
			bleedWidth: "calc(100% + 2rem)",
			bleedMl: "-2rem",
			bleedPl: "2rem",
			bleedPr: "1rem",
		},
		codeMarker: { left: "1rem", width: "1rem" },
		codeFocus: { ml: "-1rem", pl: "1rem" },
		highlightWord: { px: "0.25rem", mx: "-2px" },
		blockquote: { my: "1rem", px: "0.5rem", py: "0", borderWidth: "4px" },
		callout: { my: "0.5rem", px: "0.75rem", py: "1rem", iconMr: "0.5rem" },
		table: { pb: "0.5rem", cellPadding: "0.5rem" },
		bookmark: {
			padding: "0.75rem",
			titleHeight: "1.5rem",
			descHeight: "2rem",
			captionMt: "0.375rem",
			iconMr: "0.375rem",
			iconSize: "1rem",
		},
		file: { padding: "0.25rem", previewMl: "0.5rem" },
		tag: { px: "0.25rem" },
		badge: { ml: "0.5rem", px: "0.5rem", py: "0.125rem" },
		image: { figureMt: "0.25rem" },
		todo: {
			pl: "0.5rem",
			gap: "0.5rem",
			checkboxMt: "0.25rem",
			checkboxPr: "0.5rem",
			checkboxSize: "1.25rem",
		},
		toc: {
			right: "1rem",
			topSm: "10rem",
			visualTop: "1.5rem",
			visualWidth: "2rem",
			visualPadding: "0.5rem",
			visualGap: "0.5rem",
			panelRight: "0.25rem",
			panelWidth: "19rem",
			panelMaxHeight: "55vh",
			panelMaxHeightSm: "68vh",
			panelPadding: "0.5rem",
		},
		iconButton: { size: "2.5rem", sizeSm: "3rem", fontSize: "1.875rem" },
		header: { paddingStartSm: "4.5rem", mb: "2rem" },
		layout: { bleedMlLg: "-25%", bleedWidthLg: "150%" },
		nav: {
			dropdownTop: "3.5rem",
			dropdownInsetX: "-1rem",
			dropdownPy: "0.5rem",
			gapYMobile: "0.75rem",
			gapXLg: "1rem",
		},
		footer: {
			pt: "5rem",
			pb: "1rem",
			navGapX: "0.5rem",
			navBorderWidth: "2px",
			linkPx: "1rem",
			linkPy: "0.5rem",
		},
		searchDialog: {
			mtSm: "4rem",
			maxHeightSm: "calc(100% - 8rem)",
			minHeightSm: "15rem",
			widthSm: "83.333%",
			maxWidthSm: "48rem",
		},
		searchFrame: { padding: "1.5rem", paddingTop: "3rem", gap: "1rem" },
		gallery: { gap: "1.5rem" },
		card: { imageAspect: "3 / 2", tagsPb: "0.75rem", authorsMt: "-0.25rem" },
		hero: { minHeight: "150px", padding: "1.5rem", mb: "1rem" },
		mdx: {
			paragraphMb: "0.9rem",
			listMt: "0.2rem",
			listMb: "1rem",
			listMs: "1.25rem",
			listPs: "1.25rem",
			listItemMy: "0.1rem",
			listItemPs: "0.1rem",
			blockquoteMy: "1.1rem",
			blockquotePx: "1rem",
			blockquotePy: "0.75rem",
			codePx: "1rem",
			codePy: "1rem",
			codeMy: "1.1rem",
			headingMt: "1.25rem",
			headingMb: "0.75rem",
		},
		datatable: {
			inputPx: "6px",
			inputPy: "3px",
			filterTogglePx: "10px",
			filterRowMaxHeight: "50px",
			topMb: "10px",
			cellPaddingMultiplier: "2",
			sorterPr: "1rem",
			sorterIconTop: "-2px",
		},
		popover: { maxWidthGutter: "10px" },
		marginNote: { px: "2px", mx: "-2px" },
		pagefind: { underlineHeight: "6px", underlineGap: "5px", underlineGapHover: "4px" },
	},
	radius: {
		sm: "0.125rem",
		md: "0.375rem",
		lg: "0.5rem",
		xl: "0.75rem",
		"2xl": "1rem",
		full: "9999px",
		code: "0.375rem",
		card: "0.5rem",
		tag: "0.375rem",
		badge: "0.125rem",
		blockquoteRight: "0.5rem",
		navHighlight: "0.4em 0.2em",
	},
	border: {
		default: "1px",
		blockquote: "4px",
		footerNav: "2px",
		focus: "1px",
		focusRing: "0.2rem",
		searchDialog: "1px",
		dividerStyle: "solid",
	},
	shadow: {
		sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
		md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
		lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
		xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
		tocPanel:
			"0 20px 25px -5px color-mix(in srgb, var(--theme-accent) 5%, transparent), 0 8px 10px -6px color-mix(in srgb, var(--theme-accent) 5%, transparent)",
		card: "none",
		fab: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
	},
	effect: {
		codeUnfocusedBlur: "1px",
		backdropBlurSm: "4px",
		backdropBlurMd: "12px",
	},
	opacity: {
		codeUnfocused: 0.5,
		highlighted: 1,
		hidden: 0,
		hoverDim: 0.7,
		secondaryText: 0.7,
		bodyMuted: 0.9,
		iconMuted: 0.5,
		icon: 0.75,
		dialogSurface: 0.8,
	},
	motion: {
		cardImageHoverScale: 1.05,
		iconHoverScale: 1.1,
		cardHoverBrightness: 1.03,
		toggleOpenRotate: "90deg",
		toTopHiddenTranslateY: "7rem",
	},
	duration: {
		fast: "200ms",
		medium: "300ms",
		slow: "500ms",
		navHighlight: "200ms",
		hashReveal: "300ms",
		cardHover: "300ms",
	},
	easing: {
		standard: "ease",
		inOut: "ease-in-out",
	},
	underline: {
		style: "wavy",
		thickness: "from-font",
		offset: "2px",
		offsetHover: "4px",
		annotationStyle: "dashed",
		mdxThickness: "1px",
		mdxOffset: "3px",
	},
	anchor: {
		hashContent: "#",
		hashMl: "-1.5rem",
		hashMlToggle: "-2.5rem",
		hashOpacityHidden: 0,
		hashOpacityShown: 1,
	},
	nav: {
		highlightType: "gradient",
		highlightPosition: "bottom",
		highlight: { insetX: "0.08em", height: "0.42em", heightActive: "0.62em", bottom: "0" },
		footerHighlight: { bottom: "0.05em", height: "0.5em", heightActive: "0.7em" },
	},
	pinned: {
		size: "1.5rem",
		color: "var(--theme-quote)",
		rotate: "0deg",
		hasBackground: false,
		hasGlass: false,
	},
	icons: classicIcons,
};
