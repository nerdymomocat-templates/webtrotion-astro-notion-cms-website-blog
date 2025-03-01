import config from "../constants-config.json";
const key_value_from_json = { ...config };

import fs from "fs";
import path from "path";

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
	referencesInPage: path.join("./tmp", "blocks-json-cache", "references-in-page"),
	referencesToPage: path.join("./tmp", "blocks-json-cache", "references-to-page"),
	ogImages: path.join("./tmp", "og-images"),
	rssCache: path.join("./tmp", "rss-cache"),
	blocksHtmlCache: path.join("./tmp", "blocks-html-cache"),
	referencesHtmlCache: path.join("./tmp", "blocks-html-cache", "references"),
	public: path.join("./public"),
	publicNotion: path.join("./public", "notion/"),
};

export const NOTION_API_SECRET =
	import.meta.env.NOTION_API_SECRET || process.env.NOTION_API_SECRET || "";
export const DATABASE_ID = process.env.DATABASE_ID || key_value_from_json["database-id"] || "";
export const AUTHOR = key_value_from_json["author"] || "";
export const TRACKING = key_value_from_json["tracking"] || {};
export const WEBMENTION_API_KEY =
	import.meta.env.WEBMENTION_API_KEY ||
	process.env.WEBMENTION_API_KEY ||
	key_value_from_json["webmention"]["webmention-api-key"] ||
	"";
export const WEBMENTION_LINK = key_value_from_json["webmention"]["webmention-link"] || "";

export const CUSTOM_DOMAIN =
	process.env.CUSTOM_DOMAIN || key_value_from_json["custom-domain"] || ""; // <- Set your custom domain if you have. e.g. alpacat.com
export const BASE_PATH =
	process.env.BASE || process.env.BASE_PATH || key_value_from_json["base-path"] || ""; // <- Set sub directory path if you want. e.g. /docs/

export const NUMBER_OF_POSTS_PER_PAGE = key_value_from_json["number-of-posts-per-page"] || 10;

export const ENABLE_LIGHTBOX = key_value_from_json["enable-lightbox"] || false;

/**
 *  a collection which represents a page
 */
export const MENU_PAGES_COLLECTION = key_value_from_json["menu-pages-collection"] || "main";

export const HEADING_BLOCKS = key_value_from_json["heading-blocks"] || [
	"heading_11",
	"heading_2",
	"heading_3",
];

export const FULL_PREVIEW_COLLECTIONS = key_value_from_json["full-preview-collections"] || [];

export const HIDE_UNDERSCORE_SLUGS_IN_LISTS =
	key_value_from_json["hide-underscore-slugs-in-lists"] || false;

export const HOME_PAGE_SLUG = key_value_from_json["home-page-slug"] || "home";
export const ALL_FOOTNOTES_PAGE_SLUG = key_value_from_json["all-footnotes-page-slug"] || null;

export const OG_SETUP = key_value_from_json["og-setup"] || {
	columns: 1,
	excerpt: false,
};

// export const OPTIMIZE_IMAGES = key_value_from_json["optimize-images"] == null ? true : key_value_from_json["optimize-images"];
export const OPTIMIZE_IMAGES = key_value_from_json["optimize-images"] || false;

export const SHORTCODES = key_value_from_json["shortcodes"] || {
	"html-render": "",
	"html-inject": "",
	"alt-text": null,
	"expressive-code": null,
	"shiki-transform": "",
	table: "",
};

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

export const REFERENCES = key_value_from_json["references"] || null;

export const RECENT_POSTS_ON_HOME_PAGE = key_value_from_json["recent-posts-on-home-page"] || false;

export const SOCIALS = key_value_from_json["socials"] || {};

export const GISCUS = key_value_from_json["giscus"] || null;

export const BLUESKY_COMM = key_value_from_json["bluesky-comments"] || {};

export const THEME = key_value_from_json["theme"] || {};

export const GOOGLE_SEARCH_CONSOLE_META_TAG =
	key_value_from_json["google-search-console-html-tag"] || null;

export const FULL_WIDTH_SM = key_value_from_json["full-width-social-embeds"] || false;

const TRANSFORMER_FUNCTIONS_ARR = [
	transformerNotationFocus(),
	transformerNotationDiff(),
	transformerNotationHighlight(),
	transformerNotationWordHighlight(),
	transformerNotationErrorLevel(),
];

export { TRANSFORMER_FUNCTIONS_ARR };
