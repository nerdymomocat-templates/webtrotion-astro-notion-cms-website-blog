import fs from "fs";
import path from "path";
import JSON5 from "json5";
import type { ExternalContentType } from "./lib/interfaces";

const configContent = fs.readFileSync("./constants-config.json5", "utf8");
const config = JSON5.parse(configContent);
const key_value_from_json = { ...config };

const DEFAULT_MDX_SNIPPET_TRIGGER = "<!-- mdx inject -->";

type GitHubTreeInfo = {
	owner: string;
	repo: string;
	ref: string;
	path: string;
};

export type ExternalContentSourceConfig = GitHubTreeInfo & {
	id: string;
	externalUrlPrefix: string;
};

export type ExternalContentCustomComponentConfig = GitHubTreeInfo & {
	id: string;
};

export interface ExternalContentConfig {
	enabled: boolean;
	sources: ExternalContentSourceConfig[];
	customComponents: ExternalContentCustomComponentConfig | null;
}

function parseGitHubTreeUrl(rawUrl: string | null | undefined): GitHubTreeInfo | null {
	if (!rawUrl || typeof rawUrl !== "string") {
		return null;
	}

	try {
		const trimmed = rawUrl.trim();
		const url = new URL(trimmed);
		if (url.hostname !== "github.com") {
			return null;
		}

		const segments = url.pathname.split("/").filter(Boolean);
		if (segments.length < 4) {
			return null;
		}

		let keywordIndex = segments.indexOf("tree");
		if (keywordIndex === -1) {
			keywordIndex = segments.indexOf("blob");
		}

		if (keywordIndex === -1 || keywordIndex < 2) {
			return null;
		}

		const owner = segments[0];
		const repo = segments[1];
		const ref = segments[keywordIndex + 1] || "main";
		const pathSegments = segments.slice(keywordIndex + 2);

		return {
			owner,
			repo,
			ref,
			path: pathSegments.join("/"),
		};
	} catch (error) {
		console.warn(`[external-content] Failed to parse GitHub URL "${rawUrl}":`, error);
		return null;
	}
}

function buildExternalContentConfig(): ExternalContentConfig {
	const rawConfig = key_value_from_json?.["external-content"];
	const sources: ExternalContentSourceConfig[] = [];

	if (rawConfig && typeof rawConfig === "object") {
		const rawSources = rawConfig?.sources;
		if (rawSources && typeof rawSources === "object") {
			for (const [id, rawUrl] of Object.entries(rawSources)) {
				if (typeof rawUrl !== "string" || !rawUrl.trim()) {
					continue;
				}
				const parsed = parseGitHubTreeUrl(rawUrl);
				if (!parsed) {
					console.warn(
						`[external-content] Could not parse external content source "${id}". Expected a GitHub tree/blob URL.`,
					);
					continue;
				}

				if (!parsed.path) {
					console.warn(
						`[external-content] GitHub URL for "${id}" should reference a subfolder inside the repository.`,
					);
				}

				sources.push({
					id,
					externalUrlPrefix: rawUrl,
					...parsed,
				});
			}
		}
	}

	let customComponents: ExternalContentCustomComponentConfig | null = null;
	const customComponentsUrl = rawConfig?.["custom-components"];
	if (typeof customComponentsUrl === "string" && customComponentsUrl.trim()) {
		const parsed = parseGitHubTreeUrl(customComponentsUrl);
		if (!parsed) {
			console.warn(
				"[external-content] Could not parse external custom-components GitHub URL. Expected a GitHub tree/blob URL.",
			);
		} else {
			if (!parsed.path) {
				console.warn(
					"[external-content] Custom components URL should point to a folder path inside the repository.",
				);
			}
			customComponents = {
				id: "custom-components",
				...parsed,
			};
		}
	}

	return {
		enabled: sources.length > 0 || customComponents !== null,
		sources,
		customComponents,
	};
}

export const EXTERNAL_CONTENT_CONFIG = buildExternalContentConfig();

import {
	transformerNotationFocus,
	transformerNotationDiff,
	transformerNotationHighlight,
	transformerNotationWordHighlight,
	transformerNotationErrorLevel,
} from "@shikijs/transformers";

export const BUILD_FOLDER_PATHS = {
	buildcache: "./buildcache",
	tmp: "./tmp",
	styles: path.join("src", "styles"),
	blocksJson: path.join("./tmp", "blocks-json-cache"),
	headingsCache: path.join("./tmp", "blocks-json-cache", "headings"),
	interlinkedContentInPage: path.join("./tmp", "blocks-json-cache", "interlinked-content-in-page"),
	interlinkedContentToPage: path.join("./tmp", "blocks-json-cache", "interlinked-content-to-page"),
	footnotesInPage: path.join("./tmp", "blocks-json-cache", "footnotes-in-page"),
	citationsInPage: path.join("./tmp", "blocks-json-cache", "citations-in-page"),
	bibFilesCache: path.join("./tmp", "bib-files-cache"),
	ogImages: path.join("./tmp", "og-images"),
	rssCache: path.join("./tmp", "rss-cache"),
	blocksHtmlCache: path.join("./tmp", "blocks-html-cache"),
	interlinkedContentHtmlCache: path.join("./tmp", "blocks-html-cache", "interlinked-content"),
	astroAssetsCache: path.join("./tmp", ".astro", "assets"),
	public: path.join("./public"),
	publicNotion: path.join("./public", "notion/"),
	srcAssetsNotion: path.join("src", "assets", "notion"),
	externalPosts: path.join("src", "external-posts"),
	externalComponents: path.join("src", "components", "custom-components"),
	publicExternalPosts: path.join("public", "external-posts"),
};

export const EXTERNAL_CONTENT_PATHS = {
	tmpRoot: path.join(BUILD_FOLDER_PATHS.tmp, "external-content"),
	manifestDir: path.join(BUILD_FOLDER_PATHS.tmp, "cache-manifests"),
	manifestFile: path.join(BUILD_FOLDER_PATHS.tmp, "cache-manifests", "external-content.json"),
	commitMetadata: path.join(BUILD_FOLDER_PATHS.tmp, "external-content", "commit-meta"),
	renderCache: path.join(BUILD_FOLDER_PATHS.tmp, "external-content", "render-cache"),
	externalPosts: path.join("src", "external-posts"),
	customComponents: path.join("src", "components", "custom-components"),
	mdxSnippets: path.join("src", "blocks-mdx-inject-snippets"),
	mdxSnippetsCache: path.join(BUILD_FOLDER_PATHS.tmp, "blocks-mdx-inject-snippets-cache"),
	publicAssets: path.join("public", "external-posts"),
	publicCustomComponents: path.join("public", "custom-components"),
};

export const NOTION_API_SECRET =
	import.meta.env.NOTION_API_SECRET || process.env.NOTION_API_SECRET || "";
export const DATABASE_ID =
	process.env.DATABASE_ID || key_value_from_json?.notion?.["database-id"] || "";
export const DATA_SOURCE_ID =
	process.env.DATA_SOURCE_ID || key_value_from_json?.notion?.["data-source-id"] || "";
export const AUTHOR = key_value_from_json?.["site-info"]?.author || "";
export const TRACKING = key_value_from_json["tracking"] || {};
export const WEBMENTION_API_KEY =
	import.meta.env.WEBMENTION_API_KEY ||
	process.env.WEBMENTION_API_KEY ||
	key_value_from_json?.comments?.webmention?.["webmention-api-key"] ||
	"";
export const WEBMENTION_LINK = key_value_from_json?.comments?.webmention?.["webmention-link"] || "";

export const CUSTOM_DOMAIN =
	process.env.CUSTOM_DOMAIN || key_value_from_json?.["site-info"]?.["custom-domain"] || ""; // <- Set your custom domain if you have. e.g. alpacat.com
export const BASE_PATH =
	process.env.BASE ||
	process.env.BASE_PATH ||
	key_value_from_json?.["site-info"]?.["base-path"] ||
	""; // <- Set sub directory path if you want. e.g. /docs/

export const NUMBER_OF_POSTS_PER_PAGE =
	key_value_from_json?.["collections-and-listings"]?.["number-of-posts-per-page"] || 10;

export const ENABLE_LIGHTBOX =
	key_value_from_json?.["block-rendering"]?.["enable-lightbox"] || false;

/**
 *  a collection which represents a page
 */
export const MENU_PAGES_COLLECTION =
	key_value_from_json?.["collections-and-listings"]?.["menu-pages-collection"] || "main";

export const FULL_PREVIEW_COLLECTIONS =
	key_value_from_json?.["collections-and-listings"]?.["full-preview-collections"] || [];

export const HIDE_UNDERSCORE_SLUGS_IN_LISTS =
	key_value_from_json?.["collections-and-listings"]?.["hide-underscore-slugs-in-lists"] || false;

export const HOME_PAGE_SLUG =
	key_value_from_json?.["collections-and-listings"]?.["home-page-slug"] || "home";

/**
 * Footnotes configuration
 * - "sitewide-footnotes-page-slug": Legacy manual footnotes page (already works via NBlocksPopover)
 * - "in-page-footnotes-settings": Automatic in-page footnotes with markers (new feature)
 */
export const FOOTNOTES = key_value_from_json?.["auto-extracted-sections"]?.footnotes || null;

// Legacy manual footnotes page slug (used by NBlocksPopover)
export const SITEWIDE_FOOTNOTES_PAGE_SLUG =
	FOOTNOTES?.["sitewide-footnotes-page-slug"] || "_all-footnotes";

// Helper to check if in-page footnotes are enabled
export const IN_PAGE_FOOTNOTES_ENABLED =
	FOOTNOTES?.["in-page-footnotes-settings"]?.enabled === true;

/**
 * Citations configuration
 * - "add-cite-this-post-section": Show BibTeX entry for current page
 * - "extract-and-process-bibtex-citations": Automatic citation processing from BibTeX files
 */
export const CITATIONS = key_value_from_json?.["auto-extracted-sections"]?.citations || null;

// Helper to check if BibTeX citation extraction is enabled and has URL list
export const BIBTEX_CITATIONS_ENABLED = (() => {
	if (CITATIONS?.["extract-and-process-bibtex-citations"]?.enabled !== true) {
		return false;
	}
	const urlList = CITATIONS["extract-and-process-bibtex-citations"]["bibtex-file-url-list"];
	return Array.isArray(urlList) && urlList.length > 0;
})();

// Get bibliography style (either "apa" or "simplified-ieee")
export const BIBLIOGRAPHY_STYLE = (() => {
	if (!CITATIONS?.["extract-and-process-bibtex-citations"]) return null;
	const formats = CITATIONS["extract-and-process-bibtex-citations"]["bibliography-format"];
	if (formats?.["simplified-ieee"]) return "simplified-ieee";
	if (formats?.apa) return "apa";
	return "simplified-ieee"; // default
})();

export const OG_SETUP = key_value_from_json["og-setup"] || {
	columns: 1,
	excerpt: false,
};

// export const OPTIMIZE_IMAGES = key_value_from_json?.["block-rendering"]?.["optimize-images"] == null ? true : key_value_from_json?.["block-rendering"]?.["optimize-images"];
export const OPTIMIZE_IMAGES =
	key_value_from_json?.["block-rendering"]?.["optimize-images"] || false;

const defaultShortcodes = {
	"html-render": "<!DOCTYPE html> <!-- iframe -->",
	"html-inject": "<!DOCTYPE html> <!-- inject -->",
	"alt-text": null,
	"expressive-code": null,
	"shiki-transform": "",
	table: "",
};

const resolvedShortcodes =
	typeof key_value_from_json["shortcodes"] === "object" &&
	key_value_from_json["shortcodes"] !== null
		? key_value_from_json["shortcodes"]
		: defaultShortcodes;

export const SHORTCODES = resolvedShortcodes;

export const MDX_SNIPPET_TRIGGER =
	process.env.MDX_SNIPPET_TRIGGER ||
	(typeof resolvedShortcodes?.["mdx-inject"] === "string" && resolvedShortcodes["mdx-inject"].trim()
		? resolvedShortcodes["mdx-inject"].trim()
		: key_value_from_json?.["mdx-snippets"]?.["trigger"]) ||
	DEFAULT_MDX_SNIPPET_TRIGGER;

// Function to read the build start time from the file
const readBuildStartTime = () => {
	const filePath = path.join(BUILD_FOLDER_PATHS["tmp"], "build_start_timestamp.txt");
	if (fs.existsSync(filePath)) {
		const buildTimestampStr = fs.readFileSync(filePath, "utf8");
		const buildTimestamp = parseInt(buildTimestampStr, 10);
		return new Date(buildTimestamp);
	}
	return null;
};

export const LAST_BUILD_TIME = readBuildStartTime();
console.log("Last Build Start Time:", LAST_BUILD_TIME);

export const INTERLINKED_CONTENT =
	key_value_from_json?.["auto-extracted-sections"]?.["interlinked-content"] || null;

export const RECENT_POSTS_ON_HOME_PAGE =
	key_value_from_json?.["collections-and-listings"]?.["recent-posts-on-home-page"] || false;

export const SOCIALS = key_value_from_json["socials"] || {};

export const GISCUS = key_value_from_json?.comments?.giscus || null;

export const BLUESKY_COMM = key_value_from_json?.comments?.["bluesky-comments"] || {};

export const THEME = key_value_from_json["theme"] || {};

export const GOOGLE_SEARCH_CONSOLE_META_TAG =
	key_value_from_json?.tracking?.["google-search-console-html-tag"] || null;

export const FULL_WIDTH_SM =
	key_value_from_json?.["block-rendering"]?.["full-width-social-embeds"] || false;

const TRANSFORMER_FUNCTIONS_ARR = [
	transformerNotationFocus(),
	transformerNotationDiff(),
	transformerNotationHighlight(),
	transformerNotationWordHighlight(),
	transformerNotationErrorLevel(),
];

export { TRANSFORMER_FUNCTIONS_ARR };
