import * as fs from "node:fs";
import type { WebmentionsFeed, WebmentionsCache, WebmentionsChildren } from "@/types";
import { BUILD_FOLDER_PATHS } from "@/constants";

const DOMAIN = import.meta.env.SITE;
const API_TOKEN = import.meta.env.WEBMENTION_API_KEY;
const CACHE_DIR = BUILD_FOLDER_PATHS["tmp"];
const filePath = `${CACHE_DIR}/webmentions.json`;
const validWebmentionTypes = ["like-of", "mention-of", "in-reply-to"];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isWebmention(value: unknown): value is WebmentionsChildren {
	return (
		isRecord(value) &&
		typeof value.type === "string" &&
		typeof value.url === "string" &&
		typeof value["wm-received"] === "string" &&
		typeof value["wm-id"] === "number" &&
		typeof value["wm-source"] === "string" &&
		typeof value["wm-target"] === "string" &&
		typeof value["wm-protocol"] === "string" &&
		typeof value["mention-of"] === "string" &&
		typeof value["wm-property"] === "string" &&
		typeof value["wm-private"] === "boolean" &&
		(value.author === null || isRecord(value.author)) &&
		(value.content === null || value.content === undefined || isRecord(value.content))
	);
}

function isWebmentionsFeed(value: unknown): value is WebmentionsFeed {
	return (
		isRecord(value) &&
		typeof value.type === "string" &&
		typeof value.name === "string" &&
		Array.isArray(value.children) &&
		value.children.every(isWebmention)
	);
}

function isWebmentionsCache(value: unknown): value is WebmentionsCache {
	return (
		isRecord(value) &&
		(value.lastFetched === null || typeof value.lastFetched === "string") &&
		Array.isArray(value.children) &&
		value.children.every(isWebmention)
	);
}

function getHostName() {
	if (!DOMAIN) return null;
	try {
		return new URL(DOMAIN).hostname;
	} catch {
		console.warn("Invalid site domain. Please set SITE to a valid URL.");
		return null;
	}
}

const hostName = getHostName();

// Calls webmention.io api.
async function fetchWebmentions(timeFrom: string | null, perPage = 1000) {
	if (!DOMAIN || !hostName) {
		console.warn("No domain specified. Please set in astro.config.ts");
		return null;
	}

	if (!API_TOKEN) {
		console.warn("No webmention api token specified in .env");
		return null;
	}

	let url = `https://webmention.io/api/mentions.jf2?domain=${hostName}&token=${API_TOKEN}&sort-dir=up&per-page=${perPage}`;

	if (timeFrom) url += `&since${timeFrom}`;

	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const data: unknown = await res.json();
		if (isWebmentionsFeed(data)) return data;
		console.warn("Webmention API returned an invalid response.");
	} catch (error) {
		console.warn("Failed to fetch webmentions.", error);
	}
	return null;
}

// Merge cached entries [a] with fresh webmentions [b], merge by wm-id
function mergeWebmentions(a: WebmentionsCache, b: WebmentionsFeed): WebmentionsChildren[] {
	return Array.from(
		[...a.children, ...b.children]
			.reduce((map, obj) => map.set(obj["wm-id"], obj), new Map())
			.values(),
	);
}

// filter out WebmentionChildren
export function filterWebmentions(webmentions: WebmentionsChildren[]) {
	return webmentions.filter((webmention) => {
		// make sure the mention has a property so we can sort them later
		if (!validWebmentionTypes.includes(webmention["wm-property"])) return false;

		// make sure 'mention-of' or 'in-reply-to' has text content.
		if (webmention["wm-property"] === "mention-of" || webmention["wm-property"] === "in-reply-to") {
			return webmention.content && webmention.content.text !== "";
		}

		return true;
	});
}

// save combined webmentions in cache file
function writeToCache(data: WebmentionsCache) {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		console.log(`Webmentions saved to ${filePath}`);
	} catch (error) {
		console.warn(`Failed to save webmentions to ${filePath}.`, error);
	}
}

function getFromCache(): WebmentionsCache {
	if (fs.existsSync(filePath)) {
		try {
			const data: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			if (isWebmentionsCache(data)) return data;
			console.warn("Ignoring an invalid webmentions cache.");
		} catch (error) {
			console.warn("Unable to read the webmentions cache.", error);
		}
	}
	// no cache found
	return {
		lastFetched: null,
		children: [],
	};
}

async function getAndCacheWebmentions() {
	const cache = getFromCache();
	const mentions = await fetchWebmentions(cache.lastFetched);

	if (mentions) {
		mentions.children = filterWebmentions(mentions.children);
		const webmentions: WebmentionsCache = {
			lastFetched: new Date().toISOString(),
			// Make sure the first arg is the cache
			children: mergeWebmentions(cache, mentions),
		};

		writeToCache(webmentions);
		return webmentions;
	}

	return cache;
}

let webMentions: WebmentionsCache;

export async function getWebmentionsForUrl(url: string) {
	if (!webMentions) webMentions = await getAndCacheWebmentions();

	return webMentions.children.filter((entry) => entry["wm-target"] === url);
}
