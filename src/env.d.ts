/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "@pagefind/default-ui" {
	declare class PagefindUI {
		constructor(arg: unknown);
	}
}

interface ImportMetaEnv {
	readonly WEBMENTION_API_KEY: string;
	readonly NOTION_API_SECRET: string;
	readonly NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// GLightbox instance for dynamic reloading
interface Window {
	lightboxInstance?: {
		reload: () => void;
	};
}
