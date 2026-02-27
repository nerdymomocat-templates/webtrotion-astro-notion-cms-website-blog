import fs from "node:fs";
import axios from "axios";
import type { AxiosResponse } from "axios";
import sharp from "sharp";
import retry from "async-retry";
import ExifTransformer from "exif-be-gone";
import pngToIco from "png-to-ico";
import path from "path";
import {
	NOTION_API_SECRET,
	NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API,
	DATABASE_ID,
	DATA_SOURCE_ID,
	MENU_PAGES_COLLECTION,
	OPTIMIZE_IMAGES,
	LAST_BUILD_TIME,
	HIDE_UNDERSCORE_SLUGS_IN_LISTS,
	BUILD_FOLDER_PATHS,
	IN_PAGE_FOOTNOTES_ENABLED,
	FOOTNOTES,
	BIBTEX_CITATIONS_ENABLED,
	CITATIONS,
	MDX_SNIPPET_TRIGGER,
	EXTERNAL_CONTENT_CONFIG,
	AUTHORS_CONFIG,
	AUTHOR_SHORTCODES,
	AUTHOR,
} from "../../constants";
import { resolveExternalContentDescriptor } from "../external-content/external-content-utils";
import { extractFootnotesFromBlock } from "../../lib/footnotes";
import { extractCitationsFromBlock } from "../../lib/citations";
import type * as responses from "@/lib/notion/responses";
import type * as requestParams from "@/lib/notion/request-params";
import type {
	Database,
	Post,
	Block,
	Paragraph,
	Heading1,
	Heading2,
	Heading3,
	BulletedListItem,
	NumberedListItem,
	ToDo,
	NImage,
	Code,
	Quote,
	Equation,
	Callout,
	Embed,
	Video,
	File,
	Bookmark,
	LinkPreview,
	SyncedBlock,
	SyncedFrom,
	Table,
	TableRow,
	TableCell,
	Toggle,
	ColumnList,
	Column,
	TableOfContents,
	RichText,
	Text,
	Annotation,
	SelectProperty,
	Emoji,
	FileObject,
	LinkToPage,
	Mention,
	InterlinkedContent,
	NAudio,
	InterlinkedContentInPage,
	Footnote,
	Citation,
	ParsedCitationEntry,
	AuthorProperty,
} from "@/lib/interfaces";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { Client, APIResponseError, LogLevel } from "@notionhq/client";
import { getFormattedDateWithTime } from "../../utils/date";
import { slugify } from "../../utils/slugify";
import { writeMdxSnippet } from "./mdx-snippet-writer";
import { extractPageContent } from "../../lib/blog-helpers";
import { buildMarkdownBlocks } from "../external-content/markdown-block-builder";
import superjson from "superjson";

const notionBlockApiSecret = NOTION_API_SECRET || NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API;
const notionMarkdownApiSecret = NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API;

const client = new Client({
	auth: notionBlockApiSecret,
	notionVersion: "2025-09-03",
});

const markdownClient = notionMarkdownApiSecret
	? new Client({
			auth: notionMarkdownApiSecret,
			notionVersion: "2025-09-03",
			logLevel: LogLevel.ERROR,
		})
	: null;

let resolvedDataSourceId: string | null = null;

const numberOfRetry = 5;
const minTimeout = 1000; // waits 1 second before the first retry
const factor = 2; // doubles the wait time with each retry

const inFlightDownloads = new Map<string, Promise<void>>();

let allEntriesCache: Post[] | null = null;
let dsCache: Database | null = null;
let blockIdPostIdMap: { [key: string]: string } | null = null;
let allTagsWithCountsCache:
	| { name: string; count: number; description: string; color: string }[]
	| null = null;

// Authors: Cache for authors with counts
let allAuthorsWithCountsCache:
	| {
			name: string;
			count: number;
			description: string;
			color: string;
			url?: string;
			photo?: string;
			bio?: string;
	  }[]
	| null = null;

// Authors: Track if Authors property exists in database schema
let authorsPropertyExistsCache: boolean | null = null;

// Footnotes: Adjusted config (set once at module initialization, includes permission fallback)
export let adjustedFootnotesConfig: any = null;

// Footnotes: Track initialization promise to ensure it only runs once
let initializationPromise: Promise<void> | null = null;

// Citations: Module-level cache for BibTeX entries
// Now loaded from cache created by citations-initializer integration
let bibEntriesCache: Map<string, ParsedCitationEntry> | null = null;

/**
 * Initialize footnotes config once at module load
 * This checks permissions and applies fallback if needed
 */
async function initializeFootnotesConfig(): Promise<void> {
	// Return existing promise if already initializing/initialized
	if (initializationPromise) {
		return initializationPromise;
	}

	// Create and store the initialization promise
	initializationPromise = (async () => {
		// If footnotes not enabled, set to empty object
		if (!IN_PAGE_FOOTNOTES_ENABLED || !FOOTNOTES) {
			adjustedFootnotesConfig = {};
			return;
		}

		// Check if block-comments is configured (includes block-inline-text-comments for future)
		const isBlockCommentsConfigured =
			FOOTNOTES?.["in-page-footnotes-settings"]?.source?.["block-comments"] === true ||
			FOOTNOTES?.["in-page-footnotes-settings"]?.source?.["block-inline-text-comments"] === true;

		if (isBlockCommentsConfigured) {
			// Check permission
			console.log(
				"Footnotes: Checking Comments API permission (block-comments source configured)...",
			);
			console.log(
				'           The "@notionhq/client warn" below is EXPECTED and means permission is granted.',
			);

			try {
				await client.comments.list({ block_id: "00000000-0000-0000-0000-000000000000" });
				console.log("Footnotes: ✓ Permission confirmed - block-comments source available.");
				adjustedFootnotesConfig = FOOTNOTES;
			} catch (error: any) {
				if (error?.status === 403 || error?.code === "restricted_resource") {
					console.log("Footnotes: ✗ Permission denied - falling back to end-of-block source.");
					// Create fallback config
					adjustedFootnotesConfig = {
						...FOOTNOTES,
						"in-page-footnotes-settings": {
							...FOOTNOTES["in-page-footnotes-settings"],
							source: {
								...FOOTNOTES["in-page-footnotes-settings"].source,
								"block-comments": false,
								"block-inline-text-comments": false,
								"inline-latex-footnote-command": false,
								"end-of-block": true,
							},
						},
					};
				} else {
					console.log("Footnotes: ✓ Permission confirmed - block-comments source available.");
					adjustedFootnotesConfig = FOOTNOTES;
				}
			}
		} else {
			// No permission check needed
			adjustedFootnotesConfig = FOOTNOTES;
		}
	})();

	return initializationPromise;
}

/**
 * Load BibTeX entries from cache (created by citations-initializer integration)
 * This is a lazy loader - only loads when first needed and caches the result
 */
function getBibEntriesCache(): Map<string, ParsedCitationEntry> {
	if (bibEntriesCache !== null) {
		return bibEntriesCache;
	}

	if (!BIBTEX_CITATIONS_ENABLED) {
		bibEntriesCache = new Map();
		return bibEntriesCache;
	}

	// Load from combined cache file (created by integration at build:start)
	const cacheDir = BUILD_FOLDER_PATHS.bibFilesCache;
	const combinedPath = path.join(cacheDir, "combined-entries.json");

	if (fs.existsSync(combinedPath)) {
		try {
			const content = fs.readFileSync(combinedPath, "utf-8");
			const entriesObject = JSON.parse(content);
			bibEntriesCache = new Map<string, ParsedCitationEntry>(Object.entries(entriesObject));
		} catch (error) {
			console.warn("Failed to load BibTeX cache from combined-entries.json:", error);
			bibEntriesCache = new Map();
		}
	} else {
		console.warn("BibTeX cache not found. Citations may not work correctly.");
		bibEntriesCache = new Map();
	}

	return bibEntriesCache;
}

export function getBibEntriesCacheSnapshot(): Map<string, ParsedCitationEntry> {
	return getBibEntriesCache();
}

const BUILDCACHE_DIR = BUILD_FOLDER_PATHS["buildcache"];
async function getResolvedDataSourceId(): Promise<string> {
	// Initialize config once at module load
	await initializeFootnotesConfig();
	// Note: BibTeX cache is now initialized by citations-initializer integration at build:start

	if (resolvedDataSourceId) {
		return resolvedDataSourceId;
	}

	if (DATA_SOURCE_ID) {
		resolvedDataSourceId = DATA_SOURCE_ID;
		return resolvedDataSourceId;
	}

	if (!DATABASE_ID) {
		throw new Error(
			"Either DATA_SOURCE_ID or DATABASE_ID must be defined in environment variables.",
		);
	}

	console.log(`DATA_SOURCE_ID not provided, fetching from database: ${DATABASE_ID}`);

	const response = await retry(
		async (bail) => {
			try {
				return (await client.databases.retrieve({
					database_id: DATABASE_ID,
				})) as any;
			} catch (error: unknown) {
				if (error instanceof APIResponseError) {
					if (error.status && error.status >= 400 && error.status < 500) {
						bail(error);
					}
				}
				throw error;
			}
		},
		{
			retries: numberOfRetry,
			minTimeout: minTimeout,
			factor: factor,
		},
	);

	const dataSources = response.data_sources;

	if (!dataSources || dataSources.length === 0) {
		throw new Error(`No data sources found for database ID: ${DATABASE_ID}`);
	}

	resolvedDataSourceId = dataSources[0].id;
	console.log(`Using the first data source found: ${resolvedDataSourceId}`);
	return resolvedDataSourceId;
}

// Generic function to save data to buildcache
function saveBuildcache<T>(filename: string, data: T): void {
	const filePath = path.join(BUILDCACHE_DIR, filename);
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(filePath, superjson.stringify(data), "utf8");
}

// Generic function to load data from buildcache
function loadBuildcache<T>(filename: string): T | null {
	const filePath = path.join(BUILDCACHE_DIR, filename);
	if (fs.existsSync(filePath)) {
		const data = fs.readFileSync(filePath, "utf8");
		return superjson.parse(data) as T;
	}
	return null;
}

type RetrievePageMarkdownResponse = {
	object: "page_markdown";
	id: string;
	markdown: string;
	truncated: boolean;
	unknown_block_ids: string[];
};

function isRestrictedResourceError(error: unknown): boolean {
	return error instanceof APIResponseError && error.code === "restricted_resource";
}

let markdownApiRestricted = false;

const UNSUPPORTED_NOTION_ENHANCED_MARKDOWN_PATTERNS: RegExp[] = [/<unknown\b/i];

function hasUnsupportedNotionEnhancedMarkdown(markdown: string): boolean {
	return UNSUPPORTED_NOTION_ENHANCED_MARKDOWN_PATTERNS.some((pattern) => pattern.test(markdown));
}

function normalizeNotionEnhancedMarkdown(markdown: string): string {
	let normalized = markdown;

	// Normalize Notion-only placeholders and trailing attribute lists for the generic markdown parser.
	normalized = normalized.replace(/<empty-block\s*\/>/g, "");
	normalized = normalized.replace(
		/\s+\{(?:[^{}"']|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')+\}(?=\s*$)/gm,
		"",
	);
	normalized = normalized.replace(/<mention-[^>]+>(.*?)<\/mention-[^>]+>/g, "$1");
	normalized = normalized.replace(/<mention-[^>]+\/>/g, "");

	return normalized;
}

async function retrieveNotionPageMarkdown(pageId: string): Promise<string> {
	if (!markdownClient) {
		return "";
	}

	const markdownChunks: string[] = [];
	const queue = [pageId];
	const visited = new Set<string>();

	while (queue.length > 0) {
		const currentId = queue.shift();
		if (!currentId || visited.has(currentId)) {
			continue;
		}
		visited.add(currentId);

		const response = await retry(
			async (bail) => {
				try {
					return (await markdownClient.pages.retrieveMarkdown({
						page_id: currentId,
					})) as RetrievePageMarkdownResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						const status = error.status;
						if (status && status >= 400 && status < 500 && status !== 429) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
				minTimeout: minTimeout,
				factor: factor,
			},
		);

		markdownChunks.push(response.markdown || "");
		if (response.truncated && response.unknown_block_ids?.length) {
			queue.push(...response.unknown_block_ids);
		}
	}

	return markdownChunks.join("\n\n");
}

async function getAllBlocksByPageMarkdown(post: Post): Promise<Block[] | null> {
	if (!markdownClient || markdownApiRestricted) {
		return null;
	}

	try {
		const markdown = await retrieveNotionPageMarkdown(post.PageId);
		if (hasUnsupportedNotionEnhancedMarkdown(markdown)) {
			console.warn(
				`Page ${post.PageId} contains markdown <unknown> blocks; falling back to block API.`,
			);
			return null;
		}

		const normalizedMarkdown = normalizeNotionEnhancedMarkdown(markdown);
		const blocks = buildMarkdownBlocks(normalizedMarkdown, {
			post,
			descriptor: {
				type: "markdown",
				sourceId: "notion",
				folderName: "",
			},
		});
		if (normalizedMarkdown.trim().length > 0 && blocks.length === 0) {
			console.warn(
				`Page ${post.PageId} markdown did not map into renderable blocks; falling back to block API.`,
			);
			return null;
		}

		return blocks;
	} catch (error) {
		if (isRestrictedResourceError(error)) {
			if (!markdownApiRestricted) {
				console.warn(
					"Notion markdown endpoints are restricted for this integration; using block API fallback.",
				);
			}
			markdownApiRestricted = true;
		} else {
			console.warn(
				`Failed to retrieve markdown for page ${post.PageId}; falling back to block API.`,
				error,
			);
		}
		return null;
	}
}

type QueryFilters = requestParams.CompoundFilterObject;

export async function getAllEntries(): Promise<Post[]> {
	if (allEntriesCache !== null) {
		return allEntriesCache;
	}

	allEntriesCache = loadBuildcache<Post[]>("allEntries.json");
	if (allEntriesCache) {
		allEntriesCache = allEntriesCache.map((entry) => ({
			...entry,
			ExternalUrl: entry.ExternalUrl || null,
			IsExternal: !!(entry.ExternalUrl || entry.IsExternal),
		}));
		return allEntriesCache;
	}

	// console.log("Did not find cache for getAllEntries");

	const queryFilters: QueryFilters = {};
	const dataSourceId = await getResolvedDataSourceId();

	const params: any = {
		data_source_id: dataSourceId,
		filter: {
			and: [
				{
					property: "Published",
					checkbox: {
						equals: true,
					},
				},
				{
					property: "Publish Date",
					formula: {
						date: {
							on_or_before: new Date().toISOString(),
						},
					},
				},
				{
					property: "Slug",
					formula: {
						string: {
							is_not_empty: true,
						},
					},
				},

				...(queryFilters?.and || []),
			],
			or: queryFilters?.or || undefined,
		},
		sorts: [
			{
				timestamp: "created_time",
				direction: "descending",
			},
		],
		page_size: 100,
	};

	let results: responses.PageObject[] = [];
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.dataSources.query(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.QueryDatabaseResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
				minTimeout: minTimeout,
				factor: factor,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	allEntriesCache = await Promise.all(
		results
			.filter((pageObject) => _validPageObject(pageObject))
			.map((pageObject) => _buildPost(pageObject)),
	);

	allEntriesCache = allEntriesCache.sort(
		(a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
	);
	//console.log("posts Cache", postsCache);
	saveBuildcache("allEntries.json", allEntriesCache);
	return allEntriesCache;
}

export async function getAllPosts(): Promise<Post[]> {
	const allEntries = await getAllEntries();
	return allEntries.filter((post) => !(MENU_PAGES_COLLECTION === post.Collection));
}

export async function getAllPages(): Promise<Post[]> {
	const allEntries = await getAllEntries();
	return allEntries.filter((post) => MENU_PAGES_COLLECTION === post.Collection);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
	const allPosts = await getAllEntries();
	return allPosts.find((post) => post.Slug === slug) || null;
}

export async function getPostByPageId(pageId: string): Promise<Post | null> {
	const allPosts = await getAllEntries();
	return allPosts.find((post) => post.PageId === pageId) || null;
}

export async function getPostContentByPostId(post: Post): Promise<{
	blocks: Block[];
	interlinkedContentInPage: InterlinkedContentInPage[] | null;
	footnotesInPage: Footnote[] | null;
	citationsInPage: Citation[] | null;
}> {
	if (post.IsExternal) {
		return {
			blocks: [],
			interlinkedContentInPage: null,
			footnotesInPage: null,
			citationsInPage: null,
		};
	}

	const tmpDir = BUILD_FOLDER_PATHS["blocksJson"];
	const cacheFilePath = path.join(tmpDir, `${post.PageId}.json`);
	const cacheInterlinkedContentInPageFilePath = path.join(
		BUILD_FOLDER_PATHS["interlinkedContentInPage"],
		`${post.PageId}.json`,
	);
	const cacheFootnotesInPageFilePath = path.join(
		BUILD_FOLDER_PATHS["footnotesInPage"],
		`${post.PageId}.json`,
	);
	const cacheCitationsInPageFilePath = path.join(
		BUILD_FOLDER_PATHS["citationsInPage"],
		`${post.PageId}.json`,
	);
	const isPostUpdatedAfterLastBuild = LAST_BUILD_TIME
		? post.LastUpdatedTimeStamp > LAST_BUILD_TIME
		: true;

	let blocks: Block[];
	let interlinkedContentInPage: InterlinkedContentInPage[] | null;
	let footnotesInPage: Footnote[] | null = null;
	let citationsInPage: Citation[] | null = null;

	const shouldExtractFootnotes =
		adjustedFootnotesConfig?.["in-page-footnotes-settings"]?.enabled || false;

	if (!isPostUpdatedAfterLastBuild && fs.existsSync(cacheFilePath)) {
		// CACHE HIT PATH: Post was not updated, try to load all caches
		blocks = superjson.parse(fs.readFileSync(cacheFilePath, "utf-8"));

		// Check which caches exist
		const hasInterlinkedCache = fs.existsSync(cacheInterlinkedContentInPageFilePath);
		const hasFootnotesCache = fs.existsSync(cacheFootnotesInPageFilePath);
		const hasCitationsCache = fs.existsSync(cacheCitationsInPageFilePath);

		// If all relevant caches exist, load them
		const allCachesExist =
			hasInterlinkedCache &&
			(!shouldExtractFootnotes || hasFootnotesCache) &&
			(!BIBTEX_CITATIONS_ENABLED || hasCitationsCache);

		if (allCachesExist) {
			// Load all from cache
			interlinkedContentInPage = superjson.parse(
				fs.readFileSync(cacheInterlinkedContentInPageFilePath, "utf-8"),
			);
			if (shouldExtractFootnotes) {
				footnotesInPage = superjson.parse(fs.readFileSync(cacheFootnotesInPageFilePath, "utf-8"));
			}
			if (BIBTEX_CITATIONS_ENABLED) {
				citationsInPage = superjson.parse(fs.readFileSync(cacheCitationsInPageFilePath, "utf-8"));
			}
		} else {
			// Some caches missing - use unified extraction for missing pieces
			const extracted = extractPageContent(post.PageId, blocks, {
				extractFootnotes: shouldExtractFootnotes && !hasFootnotesCache,
				extractCitations: BIBTEX_CITATIONS_ENABLED && !hasCitationsCache,
				extractInterlinkedContent: !hasInterlinkedCache,
			});

			// Use extracted or cached data
			interlinkedContentInPage = hasInterlinkedCache
				? superjson.parse(fs.readFileSync(cacheInterlinkedContentInPageFilePath, "utf-8"))
				: extracted.interlinkedContent;

			footnotesInPage = hasFootnotesCache
				? superjson.parse(fs.readFileSync(cacheFootnotesInPageFilePath, "utf-8"))
				: shouldExtractFootnotes
					? extracted.footnotes
					: null;

			citationsInPage = hasCitationsCache
				? superjson.parse(fs.readFileSync(cacheCitationsInPageFilePath, "utf-8"))
				: BIBTEX_CITATIONS_ENABLED
					? extracted.citations
					: null;

			// Save missing caches
			if (!hasInterlinkedCache) {
				fs.writeFileSync(
					cacheInterlinkedContentInPageFilePath,
					superjson.stringify(interlinkedContentInPage),
					"utf-8",
				);
			}
			if (!hasFootnotesCache && shouldExtractFootnotes && footnotesInPage) {
				fs.writeFileSync(
					cacheFootnotesInPageFilePath,
					superjson.stringify(footnotesInPage),
					"utf-8",
				);
			}
			if (!hasCitationsCache && BIBTEX_CITATIONS_ENABLED && citationsInPage) {
				fs.writeFileSync(
					cacheCitationsInPageFilePath,
					superjson.stringify(citationsInPage),
					"utf-8",
				);
			}

			// Re-save blocks if footnotes or citations were extracted (they mutate blocks)
			if (
				(!hasFootnotesCache && shouldExtractFootnotes) ||
				(!hasCitationsCache && BIBTEX_CITATIONS_ENABLED)
			) {
				fs.writeFileSync(cacheFilePath, superjson.stringify(blocks), "utf-8");
			}
		}
	} else {
		// CACHE MISS PATH: Post was updated or no cache exists
		const markdownBlocks = await getAllBlocksByPageMarkdown(post);
		if (markdownBlocks) {
			blocks = markdownBlocks;
		} else {
			const { blocks: allBlocks, fileBlocks } = await getAllBlocksByBlockId(post.PageId);
			blocks = allBlocks;

			// Download all files in parallel
			await processFileBlocks(fileBlocks);
		}

		// Use unified extraction for all three types in ONE tree traversal
		const extracted = extractPageContent(post.PageId, blocks, {
			extractFootnotes: shouldExtractFootnotes,
			extractCitations: BIBTEX_CITATIONS_ENABLED,
			extractInterlinkedContent: true,
		});

		footnotesInPage = extracted.footnotes.length > 0 ? extracted.footnotes : null;
		citationsInPage = extracted.citations.length > 0 ? extracted.citations : null;
		interlinkedContentInPage = extracted.interlinkedContent;

		// Save blocks to cache (with mutated footnote/citation indices)
		fs.writeFileSync(cacheFilePath, superjson.stringify(blocks), "utf-8");

		// Save all extracted content to their respective caches
		fs.writeFileSync(
			cacheInterlinkedContentInPageFilePath,
			superjson.stringify(interlinkedContentInPage),
			"utf-8",
		);

		if (shouldExtractFootnotes && footnotesInPage) {
			fs.writeFileSync(cacheFootnotesInPageFilePath, superjson.stringify(footnotesInPage), "utf-8");
		}

		if (BIBTEX_CITATIONS_ENABLED && citationsInPage) {
			fs.writeFileSync(cacheCitationsInPageFilePath, superjson.stringify(citationsInPage), "utf-8");
		}
	}

	// Update the blockIdPostIdMap
	updateBlockIdPostIdMap(post.PageId, blocks);

	return { blocks, interlinkedContentInPage, footnotesInPage, citationsInPage };
}

function formatUUID(id: string): string {
	if (id.includes("-")) return id; // Already formatted
	return id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

function updateBlockIdPostIdMap(postId: string, blocks: Block[]) {
	if (blockIdPostIdMap === null) {
		blockIdPostIdMap = loadBuildcache<{ [key: string]: string }>("blockIdPostIdMap.json") || {};
	}

	blocks.forEach((block) => {
		blockIdPostIdMap[formatUUID(block.Id)] = formatUUID(postId);
	});

	saveBuildcache("blockIdPostIdMap.json", blockIdPostIdMap);
}

function getBlockIdPostIdMap(): { [key: string]: string } {
	if (blockIdPostIdMap === null) {
		blockIdPostIdMap = loadBuildcache<{ [key: string]: string }>("blockIdPostIdMap.json") || {};
	}
	return blockIdPostIdMap;
}

export function createInterlinkedContentToThisEntry(
	interlinkedContentInEntries: {
		interlinkedContentInPage: InterlinkedContentInPage[] | null;
		entryId: string;
	}[],
) {
	const entryInterlinkedContentMap: { [entryId: string]: { entryId: string; block: Block }[] } = {};

	// Initialize entryInterlinkedContentMap with empty arrays for each entry
	interlinkedContentInEntries.forEach(({ entryId }) => {
		entryInterlinkedContentMap[entryId] = [];
	});

	// Collect blocks for each entry if there's a match in other_pages
	interlinkedContentInEntries.forEach(({ interlinkedContentInPage, entryId }) => {
		if (interlinkedContentInPage) {
			interlinkedContentInPage.forEach((interlinkedContent) => {
				// Check and collect blocks where InternalHref.PageId matches an entryId in the map
				interlinkedContent.other_pages.forEach((richText) => {
					if (
						richText.InternalHref?.PageId &&
						entryInterlinkedContentMap[richText.InternalHref.PageId]
					) {
						entryInterlinkedContentMap[richText.InternalHref.PageId].push({
							entryId: entryId,
							block: interlinkedContent.block,
						});
					} else if (
						richText.Mention?.Page?.PageId &&
						entryInterlinkedContentMap[richText.Mention?.Page?.PageId]
					) {
						entryInterlinkedContentMap[richText.Mention.Page.PageId].push({
							entryId: entryId,
							block: interlinkedContent.block,
						});
					}
				});

				// Check and collect blocks where link_to_pageid matches an entryId in the map
				if (
					interlinkedContent.link_to_pageid &&
					entryInterlinkedContentMap[interlinkedContent.link_to_pageid]
				) {
					entryInterlinkedContentMap[interlinkedContent.link_to_pageid].push({
						entryId: entryId,
						block: interlinkedContent.block,
					});
				}
			});
		}
	});

	// Write each entry's interlinked content to a file
	Object.entries(entryInterlinkedContentMap).forEach(([entryId, interlinkedContent]) => {
		const filePath = path.join(BUILD_FOLDER_PATHS["interlinkedContentToPage"], `${entryId}.json`);
		fs.writeFileSync(filePath, superjson.stringify(interlinkedContent), "utf-8");
	});
}

export async function getAllBlocksByBlockId(
	blockId: string,
): Promise<{ blocks: Block[]; fileBlocks: Block[] }> {
	let results: responses.BlockObject[] = [];

	const params: requestParams.RetrieveBlockChildren = {
		block_id: blockId,
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.children.list(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockChildrenResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
				minTimeout: minTimeout,
				factor: factor,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	const allBlocks = await Promise.all(
		results.map((blockObject) => _buildBlock(blockObject, blockId)),
	);
	// Filter blocks that have files to download
	const allFileBlocks = allBlocks.filter(
		(block) =>
			block.Video?.File?.Url ||
			block.NImage?.File?.Url ||
			block.NAudio?.File?.Url ||
			block.File?.File?.Url,
	);

	for (let i = 0; i < allBlocks.length; i++) {
		const block = allBlocks[i];

		if (block.Type === "table" && block.Table) {
			block.Table.Rows = await _getTableRows(block.Id);
		} else if (block.Type === "column_list" && block.ColumnList) {
			const { columns, fileBlocks: columnFileBlocks } = await _getColumns(block.Id);
			block.ColumnList.Columns = columns;
			allFileBlocks.push(...columnFileBlocks);
		} else if (block.Type === "bulleted_list_item" && block.BulletedListItem && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.BulletedListItem.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "numbered_list_item" && block.NumberedListItem && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.NumberedListItem.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "to_do" && block.ToDo && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.ToDo.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "synced_block" && block.SyncedBlock) {
			const { blocks: syncedChildren, fileBlocks: syncedFileBlocks } =
				await _getSyncedBlockChildren(block);
			block.SyncedBlock.Children = syncedChildren;
			allFileBlocks.push(...syncedFileBlocks);
		} else if (block.Type === "toggle" && block.Toggle && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.Toggle.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "paragraph" && block.Paragraph && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.Paragraph.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "heading_1" && block.Heading1 && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.Heading1.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "heading_2" && block.Heading2 && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.Heading2.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "heading_3" && block.Heading3 && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.Heading3.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "quote" && block.Quote && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.Quote.Children = children;
			allFileBlocks.push(...childFileBlocks);
		} else if (block.Type === "callout" && block.Callout && block.HasChildren) {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				block.Id,
			);
			block.Callout.Children = children;
			allFileBlocks.push(...childFileBlocks);
		}

		// Get bibCache once for both citation extraction and footnote comment citations
		let bibCache: Map<string, ParsedCitationEntry> | undefined;

		// CRITICAL ORDER: Extract footnotes BEFORE citations
		// This allows us to detect footnote markers in RichTexts and extract citations from footnote content inline
		try {
			if (
				adjustedFootnotesConfig &&
				adjustedFootnotesConfig["in-page-footnotes-settings"]?.enabled
			) {
				const extractionResult = await extractFootnotesFromBlock(
					block,
					adjustedFootnotesConfig,
					client,
				);
				if (extractionResult.footnotes.length > 0) {
					block.Footnotes = extractionResult.footnotes;
				}
			}
		} catch (error) {
			console.error(`Failed to extract footnotes from block ${block.Id}:`, error);
			// Continue without footnotes rather than failing the entire build
		}

		// Extract citations AFTER footnotes are extracted
		// extractCitationsFromBlock() will detect footnote markers and extract citations from footnote content
		try {
			if (BIBTEX_CITATIONS_ENABLED) {
				bibCache = getBibEntriesCache();
				if (bibCache.size > 0) {
					const citationResult = extractCitationsFromBlock(block, CITATIONS!, bibCache);
					if (citationResult.citations.length > 0) {
						block.Citations = citationResult.citations;
					}
				}
			}
		} catch (error) {
			console.error(`Failed to extract citations from block ${block.Id}:`, error);
			// Continue without citations rather than failing the entire build
		}
	}

	return { blocks: allBlocks, fileBlocks: allFileBlocks };
}

export async function getBlock(
	blockId: string,
	forceRefresh = false,
	skipFileDownload = false,
): Promise<Block | null> {
	if (!forceRefresh) {
		// First, check if the block-id exists in our mapping
		const blockIdPostIdMap = getBlockIdPostIdMap();
		const postId = blockIdPostIdMap[formatUUID(blockId)];

		if (postId) {
			// If we have a mapping, look for the block in the cached post JSON
			const tmpDir = BUILD_FOLDER_PATHS["blocksJson"];
			const cacheFilePath = path.join(tmpDir, `${postId}.json`);

			if (fs.existsSync(cacheFilePath)) {
				const cachedBlocks: Block[] = superjson.parse(fs.readFileSync(cacheFilePath, "utf-8"));
				const block = cachedBlocks.find((b) => b.Id === formatUUID(blockId));

				if (block) {
					return block;
				}
			}
		}
	}

	// console.log("Did not find cache for blockId: " + formatUUID(blockId));
	// If we couldn't find the block in our cache, fall back to the API call
	const params: requestParams.RetrieveBlock = {
		block_id: blockId,
	};

	try {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.retrieve(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
				minTimeout: minTimeout,
				factor: factor,
			},
		);

		const block = await _buildBlock(res, blockId);

		// If this is a file block, download it (unless skipFileDownload is true)
		if (
			!skipFileDownload &&
			(block.Video?.File?.Url ||
				block.NImage?.File?.Url ||
				block.NAudio?.File?.Url ||
				block.File?.File?.Url)
		) {
			await processFileBlocks([block]);
		}

		// Update our mapping and cache with this new block
		const blockIdPostIdMap = getBlockIdPostIdMap();
		const postId = blockIdPostIdMap[formatUUID(blockId)];
		if (!postId) {
			updateBlockIdPostIdMap(blockId, [block]);
		}

		return block;
	} catch (error) {
		// Log the error if necessary
		console.error("Error retrieving block:" + blockId, error);
		return null; // Return null if an error occurs
	}
}

function containsMdxSnippetTrigger(rawText: string): boolean {
	if (!rawText) return false;
	const trigger = MDX_SNIPPET_TRIGGER?.toLowerCase().trim();
	if (!trigger) return false;

	const trimmed = rawText.trimStart();
	const lower = trimmed.toLowerCase();
	if (lower.startsWith(trigger)) return true;

	// Also check for HTML-escaped comment markers at the start
	const decoded = trimmed.replaceAll("&lt;!--", "<!--").replaceAll("--&gt;", "-->");
	return decoded.toLowerCase().startsWith("<!-- mdx inject -->");
}

export function getUniqueTags(posts: Post[]) {
	const tagNames: string[] = [];
	return posts
		.flatMap((post) => post.Tags)
		.reduce((acc, tag) => {
			if (!tagNames.includes(tag.name)) {
				acc.push(tag);
				tagNames.push(tag.name);
			}
			return acc;
		}, [] as SelectProperty[])
		.sort((a: SelectProperty, b: SelectProperty) => a.name.localeCompare(b.name));
}

export async function getAllTags(): Promise<SelectProperty[]> {
	const allPosts = await getAllPosts();
	const filteredPosts = HIDE_UNDERSCORE_SLUGS_IN_LISTS
		? allPosts.filter((post) => !post.Slug.startsWith("_"))
		: allPosts;

	return getUniqueTags(filteredPosts);
}

export async function getAllTagsWithCounts(): Promise<
	{ name: string; count: number; description: string; color: string }[]
> {
	if (allTagsWithCountsCache) {
		return allTagsWithCountsCache;
	}

	const allPosts = await getAllPosts();
	const filteredPosts = HIDE_UNDERSCORE_SLUGS_IN_LISTS
		? allPosts.filter((post) => !post.Slug.startsWith("_"))
		: allPosts;
	const { propertiesRaw } = await getDataSource();
	const options = propertiesRaw.Tags?.multi_select?.options || [];

	const tagsNameWDesc = options.reduce(
		(acc, option) => {
			acc[option.name] = option.description || "";
			return acc;
		},
		{} as Record<string, string>,
	);
	const tagCounts: Record<string, { count: number; description: string; color: string }> = {};

	filteredPosts.forEach((post) => {
		post.Tags.forEach((tag) => {
			const tagName = tag.name;
			if (tagCounts[tag.name]) {
				tagCounts[tag.name].count++;
			} else {
				tagCounts[tagName] = {
					count: 1,
					description: tagsNameWDesc[tag.name] ? tagsNameWDesc[tag.name] : "",
					color: tag.color,
				};
			}
		});
	});

	// Convert the object to an array and sort it
	const sortedTagCounts = Object.entries(tagCounts)
		.map(([tagName, { count, description, color }]) => ({
			name: tagName,
			color,
			count,
			description,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	allTagsWithCountsCache = sortedTagCounts;
	return sortedTagCounts;
}

// ============================================================================
// Author Functions
// ============================================================================

/**
 * Parse author description to extract URL, photo, and bio from shortcodes.
 * Shortcodes are configurable via constants-config.json5 (shortcodes.author-url and shortcodes.author-photo-url)
 * Remaining text after extraction = bio
 */
export function parseAuthorDescription(description: string): {
	url?: string;
	photo?: string;
	bio?: string;
} {
	if (!description) {
		return {};
	}

	let remaining = description;
	let url: string | undefined;
	let photo: string | undefined;

	// Escape special regex characters in shortcode strings
	const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// Extract URL using configurable shortcodes
	const urlStart = escapeRegex(AUTHOR_SHORTCODES.url.start);
	const urlEnd = escapeRegex(AUTHOR_SHORTCODES.url.end);
	const urlRegex = new RegExp(`${urlStart}(.+?)${urlEnd}`);
	const urlMatch = remaining.match(urlRegex);
	if (urlMatch) {
		url = urlMatch[1].trim();
		remaining = remaining.replace(urlMatch[0], "");
	}

	// Extract photo using configurable shortcodes
	const photoStart = escapeRegex(AUTHOR_SHORTCODES.photo.start);
	const photoEnd = escapeRegex(AUTHOR_SHORTCODES.photo.end);
	const photoRegex = new RegExp(`${photoStart}(.+?)${photoEnd}`);
	const photoMatch = remaining.match(photoRegex);
	if (photoMatch) {
		photo = photoMatch[1].trim();
		remaining = remaining.replace(photoMatch[0], "");
	}

	// Remaining text is the bio (trim whitespace)
	const bio = remaining.trim() || undefined;

	return { url, photo, bio };
}

/**
 * Check if Authors multi-select property exists in the Notion database schema.
 * Returns true if the property exists, false otherwise.
 */
export async function hasAuthorsProperty(): Promise<boolean> {
	if (authorsPropertyExistsCache !== null) {
		return authorsPropertyExistsCache;
	}

	const { propertiesRaw } = await getDataSource();
	authorsPropertyExistsCache = !!propertiesRaw.Authors?.multi_select;
	return authorsPropertyExistsCache;
}

/**
 * Check if any post has a custom (non-default) author.
 * This is used with only-when-custom-authors config to determine if author features should be shown.
 * The default author is the site's AUTHOR constant.
 */
export async function hasCustomAuthors(): Promise<boolean> {
	const hasProperty = await hasAuthorsProperty();
	if (!hasProperty) {
		return false;
	}

	// Default author is the site's AUTHOR constant
	const defaultName = AUTHOR;

	const allPosts = await getAllPosts();
	for (const post of allPosts) {
		if (post.Authors && post.Authors.length > 0) {
			// Check if any author is not the default
			for (const author of post.Authors) {
				if (author.name !== defaultName) {
					return true;
				}
			}
		}
	}

	return false;
}

/**
 * Get unique authors from a list of posts
 */
export function getUniqueAuthors(posts: Post[]): AuthorProperty[] {
	const authorNames: string[] = [];
	return posts
		.filter((post) => post.Authors !== undefined)
		.flatMap((post) => post.Authors || [])
		.reduce((acc, author) => {
			if (!authorNames.includes(author.name)) {
				acc.push(author);
				authorNames.push(author.name);
			}
			return acc;
		}, [] as AuthorProperty[])
		.sort((a: AuthorProperty, b: AuthorProperty) => a.name.localeCompare(b.name));
}

/**
 * Get all authors with their post counts.
 * Mirrors the getAllTagsWithCounts pattern.
 */
export async function getAllAuthorsWithCounts(): Promise<
	{
		name: string;
		count: number;
		description: string;
		color: string;
		url?: string;
		photo?: string;
		bio?: string;
	}[]
> {
	if (allAuthorsWithCountsCache) {
		return allAuthorsWithCountsCache;
	}

	const hasProperty = await hasAuthorsProperty();
	if (!hasProperty) {
		allAuthorsWithCountsCache = [];
		return [];
	}

	const allPosts = await getAllPosts();
	const filteredPosts = HIDE_UNDERSCORE_SLUGS_IN_LISTS
		? allPosts.filter((post) => !post.Slug.startsWith("_"))
		: allPosts;

	const { propertiesRaw } = await getDataSource();
	const options = propertiesRaw.Authors?.multi_select?.options || [];

	// Build a map of author name to raw description
	const authorsNameWDesc = options.reduce(
		(acc, option) => {
			acc[option.name] = option.description || "";
			return acc;
		},
		{} as Record<string, string>,
	);

	// Build a map of author name to color
	const authorsNameWColor = options.reduce(
		(acc, option) => {
			acc[option.name] = option.color || "default";
			return acc;
		},
		{} as Record<string, string>,
	);

	const authorCounts: Record<
		string,
		{
			count: number;
			description: string;
			color: string;
			url?: string;
			photo?: string;
			bio?: string;
		}
	> = {};

	filteredPosts.forEach((post) => {
		// Check if Authors property exists (it's undefined if property doesn't exist in schema)
		if (post.Authors === undefined) return;

		if (post.Authors.length === 0) {
			// Implicit default author
			const defaultName = AUTHOR;
			if (defaultName) {
				if (authorCounts[defaultName]) {
					authorCounts[defaultName].count++;
				} else {
					const rawDesc = authorsNameWDesc[defaultName] || "";
					const parsed = parseAuthorDescription(rawDesc);
					authorCounts[defaultName] = {
						count: 1,
						description: rawDesc,
						color: authorsNameWColor[defaultName] || "default",
						url: parsed.url || (defaultName === AUTHOR ? AUTHORS_CONFIG.siteAuthorUrl : undefined),
						photo:
							parsed.photo || (defaultName === AUTHOR ? AUTHORS_CONFIG.siteAuthorPhoto : undefined),
						bio: parsed.bio,
					};
				}
			}
		} else {
			post.Authors.forEach((author) => {
				const authorName = author.name;
				if (authorCounts[authorName]) {
					authorCounts[authorName].count++;
				} else {
					const rawDesc = authorsNameWDesc[authorName] || "";
					const parsed = parseAuthorDescription(rawDesc);
					authorCounts[authorName] = {
						count: 1,
						description: rawDesc,
						color: authorsNameWColor[authorName] || author.color || "default",
						url: parsed.url || (authorName === AUTHOR ? AUTHORS_CONFIG.siteAuthorUrl : undefined),
						photo:
							parsed.photo || (authorName === AUTHOR ? AUTHORS_CONFIG.siteAuthorPhoto : undefined),
						bio: parsed.bio,
					};
				}
			});
		}
	});

	// Convert to sorted array
	const sortedAuthorCounts = Object.entries(authorCounts)
		.map(([name, { count, description, color, url, photo, bio }]) => ({
			name,
			count,
			description,
			color,
			url,
			photo,
			bio,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	allAuthorsWithCountsCache = sortedAuthorCounts;
	return sortedAuthorCounts;
}

/**
 * Determine if author bylines and pages should be shown based on config.
 * Returns true if:
 * - Authors property exists AND
 * - (only-when-custom-authors is false OR there are custom authors)
 */
export async function shouldShowAuthors(): Promise<boolean> {
	const hasProperty = await hasAuthorsProperty();
	if (!hasProperty) {
		return false;
	}

	if (!AUTHORS_CONFIG.onlyWhenCustomAuthors) {
		return true;
	}

	return await hasCustomAuthors();
}

export function generateFilePath(url: URL, isImageForAstro: boolean = false) {
	// Route images to src/assets/notion, everything else to public/notion
	const BASE_DIR = isImageForAstro
		? BUILD_FOLDER_PATHS["srcAssetsNotion"]
		: BUILD_FOLDER_PATHS["publicNotion"];

	// Get the directory name from the second last segment of the path
	const segments = url.pathname.split("/");
	let dirName = segments.slice(-2)[0];

	if (url.hostname.includes("unsplash")) {
		if (!dirName || dirName === "") {
			dirName = "page-cover";
		}
	}

	const dir = path.join(BASE_DIR, dirName);

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	// Get the file name and decode it
	let filename = decodeURIComponent(segments.slice(-1)[0]);

	if (url.hostname.includes("unsplash") && url.searchParams.has("fm")) {
		const ext = url.searchParams.get("fm");
		if (ext && !path.extname(filename)) {
			filename = `${filename}.${ext}`;
		}
	}

	// No webp conversion - let Astro handle it
	const filepath = path.join(dir, filename);

	return filepath;
}

// Helper function to check if file is an image type for Astro (includes SVG)
export function isImageTypeForAstro(filepath: string): boolean {
	const lowerPath = filepath.toLowerCase();
	if (
		lowerPath.includes(".png") ||
		lowerPath.includes(".jpg") ||
		lowerPath.includes(".jpeg") ||
		lowerPath.includes(".avif") ||
		lowerPath.includes(".svg") ||
		lowerPath.includes(".webp")
	) {
		return true;
	}
	return false;
}

export async function downloadFile(
	url: URL,
	isImageForAstro: boolean = false,
	isFavicon: boolean = false,
	convertToPng: boolean = false,
): Promise<string | void> {
	let res!: AxiosResponse;
	try {
		res = await axios({
			method: "get",
			url: url.toString(),
			timeout: 10000,
			responseType: "stream",
		});
	} catch (err) {
		console.log(err);
		return Promise.resolve();
	}

	if (!res || res.status != 200) {
		console.log(res);
		return Promise.resolve();
	}

	const filepath = generateFilePath(url, isImageForAstro);
	const ext = path.extname(filepath).toLowerCase();
	const pngPath = path.join(path.dirname(filepath), `${path.parse(filepath).name}.png`);

	let stream = res.data;

	const processFavicon = async (sourcePath: string) => {
		const favicon16Path = path.join(BUILD_FOLDER_PATHS["public"], "favicon16.png");
		const favicon32Path = path.join(BUILD_FOLDER_PATHS["public"], "favicon32.png");
		const faviconIcoPath = path.join(BUILD_FOLDER_PATHS["public"], "favicon.ico");

		try {
			// Save the original image as favicon16.png (16x16)
			await sharp(sourcePath).resize(16, 16).toFile(favicon16Path);

			// Save the original image as favicon32.png (32x32)
			await sharp(sourcePath).resize(32, 32).toFile(favicon32Path);

			// Convert both favicon16.png and favicon32.png to favicon.ico
			const icoBuffer = await pngToIco([favicon16Path, favicon32Path]);
			fs.writeFileSync(faviconIcoPath, icoBuffer);

			// Delete the temporary PNG files
			fs.unlinkSync(favicon16Path);
			fs.unlinkSync(favicon32Path);
		} catch (err) {
			console.error("Error processing favicon:", err);
		}
	};

	// Handle favicon special case (rotate if JPEG, then process)
	if (isFavicon && res.headers["content-type"] === "image/jpeg") {
		stream = stream.pipe(sharp().rotate());
	}

	const writeStream = fs.createWriteStream(filepath);

	// Apply EXIF transformer for everything
	stream.pipe(new ExifTransformer()).pipe(writeStream);

	await new Promise<void>((resolve) => {
		writeStream.on("finish", async () => {
			if (isFavicon) {
				await processFavicon(filepath);
			}
			resolve();
		});
		stream.on("error", function (err) {
			console.error("Error reading stream:", err);
			resolve();
		});
		writeStream.on("error", function (err) {
			console.error("Error writing file:", err);
			resolve();
		});
	});

	// Convert non-jpg/png images to png when we downloaded an asset image (favicons handled separately)
	const shouldConvertToPng = convertToPng && !isFavicon && ![".jpg", ".jpeg", ".png"].includes(ext);

	if (shouldConvertToPng) {
		try {
			await sharp(filepath).png().toFile(pngPath);
			fs.unlinkSync(filepath);
			return pngPath;
		} catch (err) {
			console.error("Error converting image to PNG (conversion skipped):", err);
			return filepath;
		}
	}

	return filepath;
}

async function ensureDownloaded(url: URL, isImageForAstro: boolean): Promise<void> {
	const filepath = generateFilePath(url, isImageForAstro);
	if (fs.existsSync(filepath)) return;

	const key = `${isImageForAstro ? "assets" : "public"}:${url.toString()}`;
	const existing = inFlightDownloads.get(key);
	if (existing) {
		await existing;
		return;
	}

	const task = (async () => {
		await downloadFile(url, isImageForAstro);
	})().finally(() => {
		inFlightDownloads.delete(key);
	});

	inFlightDownloads.set(key, task);
	await task;
}

export async function processFileBlocks(fileAttachedBlocks: Block[]) {
	await Promise.all(
		fileAttachedBlocks.map(async (block) => {
			const fileDetails = (block.NImage || block.File || block.Video || block.NAudio).File;
			const expiryTime = fileDetails.ExpiryTime;
			let url = new URL(fileDetails.Url);

			// Determine if this is an image for Astro
			const isImage = block.NImage && isImageTypeForAstro(url.pathname);

			const cacheFilePath = generateFilePath(url, isImage);

			const shouldDownload = LAST_BUILD_TIME
				? block.LastUpdatedTimeStamp > LAST_BUILD_TIME || !fs.existsSync(cacheFilePath)
				: true;

			if (shouldDownload) {
				if (Date.parse(expiryTime) < Date.now()) {
					// If the file is expired, get the block again and extract the new URL
					const updatedBlock = await getBlock(block.Id, true, true); // skipFileDownload = true to avoid circular call
					if (!updatedBlock) {
						return null;
					}
					url = new URL(
						(
							updatedBlock.NImage ||
							updatedBlock.File ||
							updatedBlock.Video ||
							updatedBlock.NAudio
						).File.Url,
					);
				}

				return downloadFile(url, isImage); // Download the file
			}

			return null;
		}),
	);
}

export function isNotionHostedIconUrl(rawUrl: string): boolean {
	if (!rawUrl || typeof rawUrl !== "string") return false;

	try {
		const url = new URL(rawUrl);
		const isNotionHost = url.hostname === "www.notion.so" || url.hostname === "notion.so";
		return isNotionHost && url.pathname.startsWith("/icons/") && url.pathname.endsWith(".svg");
	} catch {
		return false;
	}
}

export async function getDataSource(): Promise<Database> {
	if (dsCache !== null) {
		return Promise.resolve(dsCache);
	}

	const dataSourceId = await getResolvedDataSourceId();
	const cacheFileName = `datasource_${dataSourceId}.json`;

	dsCache = loadBuildcache<Database>(cacheFileName);
	if (dsCache) {
		return dsCache;
	}

	const params: any = {
		data_source_id: dataSourceId,
	};

	const res = await retry(
		async (bail) => {
			try {
				return (await client.dataSources.retrieve(
					params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
				)) as responses.RetrieveDatabaseResponse;
			} catch (error: unknown) {
				if (error instanceof APIResponseError) {
					if (error.status && error.status >= 400 && error.status < 500) {
						bail(error);
					}
				}
				throw error;
			}
		},
		{
			retries: numberOfRetry,
			minTimeout: minTimeout,
			factor: factor,
		},
	);

	let icon: FileObject | Emoji | null = null;
	if (res.icon) {
		if (res.icon.type === "emoji" && "emoji" in res.icon) {
			icon = {
				Type: res.icon.type,
				Emoji: res.icon.emoji,
			};
		} else if (res.icon.type === "external" && "external" in res.icon) {
			const iconUrl = res.icon.external?.url || "";

			// Notion's built-in icon set comes back as `external`, but we still want to cache it locally.
			if (iconUrl && isNotionHostedIconUrl(iconUrl)) {
				try {
					const url = new URL(iconUrl);
					const isImage = isImageTypeForAstro(url.pathname);
					await ensureDownloaded(url, isImage);
				} catch (err) {
					console.log(`Error downloading database icon: ${err}`);
				}
			}

			icon = {
				Type: res.icon.type,
				Url: iconUrl,
			};
		} else if (res.icon.type === "file" && "file" in res.icon) {
			icon = {
				Type: res.icon.type,
				Url: res.icon.file?.url || "",
			};
		}
	}

	let cover: FileObject | null = null;
	if (res.cover) {
		cover = {
			Type: res.cover.type,
			Url: res.cover.external?.url || res.cover?.file?.url || "",
		};
	}

	const database: Database = {
		Title: res.title.map((richText) => richText.plain_text).join(""),
		Description: res.description.map((richText) => richText.plain_text).join(""),
		Icon: icon,
		Cover: cover,
		propertiesRaw: res.properties,
		LastUpdatedTimeStamp: new Date(res.last_edited_time),
	};

	dsCache = database;
	saveBuildcache(cacheFileName, dsCache);
	return database;
}

async function _buildBlock(blockObject: responses.BlockObject, pageId?: string): Promise<Block> {
	const block: Block = {
		Id: blockObject.id,
		Type: blockObject.type,
		HasChildren: blockObject.has_children,
		LastUpdatedTimeStamp: new Date(blockObject.last_edited_time),
	};

	switch (blockObject.type) {
		case "paragraph":
			if (blockObject.paragraph) {
				const paragraph: Paragraph = {
					RichTexts: await Promise.all(blockObject.paragraph.rich_text.map(_buildRichText)),
					Color: blockObject.paragraph.color,
				};
				block.Paragraph = paragraph;
			}
			break;
		case "heading_1":
			if (blockObject.heading_1) {
				const heading1: Heading1 = {
					RichTexts: await Promise.all(blockObject.heading_1.rich_text.map(_buildRichText)),
					Color: blockObject.heading_1.color,
					IsToggleable: blockObject.heading_1.is_toggleable,
				};
				block.Heading1 = heading1;
			}
			break;
		case "heading_2":
			if (blockObject.heading_2) {
				const heading2: Heading2 = {
					RichTexts: await Promise.all(blockObject.heading_2.rich_text.map(_buildRichText)),
					Color: blockObject.heading_2.color,
					IsToggleable: blockObject.heading_2.is_toggleable,
				};
				block.Heading2 = heading2;
			}
			break;
		case "heading_3":
			if (blockObject.heading_3) {
				const heading3: Heading3 = {
					RichTexts: await Promise.all(blockObject.heading_3.rich_text.map(_buildRichText)),
					Color: blockObject.heading_3.color,
					IsToggleable: blockObject.heading_3.is_toggleable,
				};
				block.Heading3 = heading3;
			}
			break;
		case "bulleted_list_item":
			if (blockObject.bulleted_list_item) {
				const bulletedListItem: BulletedListItem = {
					RichTexts: await Promise.all(
						blockObject.bulleted_list_item.rich_text.map(_buildRichText),
					),
					Color: blockObject.bulleted_list_item.color,
				};
				block.BulletedListItem = bulletedListItem;
			}
			break;
		case "numbered_list_item":
			if (blockObject.numbered_list_item) {
				const numberedListItem: NumberedListItem = {
					RichTexts: await Promise.all(
						blockObject.numbered_list_item.rich_text.map(_buildRichText),
					),
					Color: blockObject.numbered_list_item.color,
				};
				block.NumberedListItem = numberedListItem;
			}
			break;
		case "to_do":
			if (blockObject.to_do) {
				const toDo: ToDo = {
					RichTexts: await Promise.all(blockObject.to_do.rich_text.map(_buildRichText)),
					Checked: blockObject.to_do.checked,
					Color: blockObject.to_do.color,
				};
				block.ToDo = toDo;
			}
			break;
		case "video":
			if (blockObject.video) {
				const video: Video = {
					Caption: await Promise.all(blockObject.video.caption?.map(_buildRichText) || []),
					Type: blockObject.video.type,
				};
				if (blockObject.video.type === "external" && blockObject.video.external) {
					video.External = { Url: blockObject.video.external.url };
				} else if (blockObject.video.type === "file" && blockObject.video.file) {
					video.File = {
						Type: blockObject.video.type,
						Url: blockObject.video.file.url,
						ExpiryTime: blockObject.video.file.expiry_time,
						// Size: blockObject.video.file.size,
					};
				}
				block.Video = video;
			}
			break;
		case "image":
			if (blockObject.image) {
				const image: NImage = {
					Caption: await Promise.all(blockObject.image.caption?.map(_buildRichText) || []),
					Type: blockObject.image.type,
				};
				if (blockObject.image.type === "external" && blockObject.image.external) {
					image.External = { Url: blockObject.image.external.url };
				} else if (blockObject.image.type === "file" && blockObject.image.file) {
					image.File = {
						Type: blockObject.image.type,
						Url: blockObject.image.file.url,
						ExpiryTime: blockObject.image.file.expiry_time,
					};
				}
				block.NImage = image;
			}
			break;
		case "audio":
			if (blockObject.audio) {
				const audio: NAudio = {
					Caption: await Promise.all(blockObject.audio.caption?.map(_buildRichText) || []),
					Type: blockObject.audio.type,
				};
				if (blockObject.audio.type === "external" && blockObject.audio.external) {
					audio.External = { Url: blockObject.audio.external.url };
				} else if (blockObject.audio.type === "file" && blockObject.audio.file) {
					audio.File = {
						Type: blockObject.audio.type,
						Url: blockObject.audio.file.url,
						ExpiryTime: blockObject.audio.file.expiry_time,
					};
				}
				block.NAudio = audio;
			}
			break;
		case "file":
			if (blockObject.file) {
				const file: File = {
					Caption: await Promise.all(blockObject.file.caption?.map(_buildRichText) || []),
					Type: blockObject.file.type,
				};
				if (blockObject.file.type === "external" && blockObject.file.external) {
					file.External = { Url: blockObject.file.external.url };
				} else if (blockObject.file.type === "file" && blockObject.file.file) {
					file.File = {
						Type: blockObject.file.type,
						Url: blockObject.file.file.url,
						ExpiryTime: blockObject.file.file.expiry_time,
					};
				}
				block.File = file;
			}
			break;
		case "code":
			if (blockObject.code) {
				const code: Code = {
					Caption: await Promise.all(blockObject.code.caption?.map(_buildRichText) || []),
					RichTexts: await Promise.all(blockObject.code.rich_text.map(_buildRichText)),
					Language: blockObject.code.language,
				};
				block.Code = code;

				const rawText = (blockObject.code.rich_text || [])
					.map((rt) => ("plain_text" in rt ? rt.plain_text : ""))
					.join("")
					.trim();
				if (containsMdxSnippetTrigger(rawText)) {
					const hasCustomComponents = !!EXTERNAL_CONTENT_CONFIG.customComponents;
					const featureEnabled = EXTERNAL_CONTENT_CONFIG.enabled || hasCustomComponents;
					if (featureEnabled && hasCustomComponents) {
						const pageRef = pageId || blockObject.id || "snippet";
						const blockId =
							blockObject.id || `${pageRef}-mdx-${Math.random().toString(36).slice(2)}`;
						block.Type = "mdx_snippet" as any;
						block.MdxSnippet = {
							PageId: pageRef,
							BlockId: blockId,
							Slug: slugify(`${pageRef}-${blockId}`),
						};
						const snippetContent = blockObject.code.rich_text
							.map((rt) => ("plain_text" in rt ? rt.plain_text : ""))
							.join("");
						const cleanedContent = snippetContent.replaceAll(MDX_SNIPPET_TRIGGER, "").trimStart();
						writeMdxSnippet({
							pageId: pageRef,
							blockId,
							slug: slugify(`${pageRef}-${blockId}`),
							content: cleanedContent,
						});
					}
				}
			}
			break;
		case "quote":
			if (blockObject.quote) {
				const quote: Quote = {
					RichTexts: await Promise.all(blockObject.quote.rich_text.map(_buildRichText)),
					Color: blockObject.quote.color,
				};
				block.Quote = quote;
			}
			break;
		case "equation":
			if (blockObject.equation) {
				const equation: Equation = {
					Expression: blockObject.equation.expression,
				};
				block.Equation = equation;
			}
			break;
		case "callout":
			if (blockObject.callout) {
				let icon: FileObject | Emoji | null = null;
				if (blockObject.callout.icon) {
					if (blockObject.callout.icon.type === "emoji" && "emoji" in blockObject.callout.icon) {
						icon = {
							Type: blockObject.callout.icon.type,
							Emoji: blockObject.callout.icon.emoji,
						};
					} else if (
						blockObject.callout.icon.type === "external" &&
						"external" in blockObject.callout.icon
					) {
						const iconUrl = blockObject.callout.icon.external?.url || "";

						icon = {
							Type: blockObject.callout.icon.type,
							Url: iconUrl,
						};

						// Notion's built-in icon set comes back as `external`, but we still want to cache it locally.
						if (iconUrl && isNotionHostedIconUrl(iconUrl)) {
							try {
								const url = new URL(iconUrl);
								const isImage = isImageTypeForAstro(url.pathname);
								await ensureDownloaded(url, isImage);
							} catch (err) {
								console.log(`Error downloading callout icon: ${err}`);
							}
						}
					} else if (
						blockObject.callout.icon.type === "file" &&
						"file" in blockObject.callout.icon
					) {
						const iconUrl = blockObject.callout.icon.file?.url || "";

						icon = {
							Type: blockObject.callout.icon.type,
							Url: iconUrl,
							ExpiryTime: blockObject.callout.icon.file?.expiry_time,
						};

						// Download icon if it doesn't exist
						if (iconUrl) {
							try {
								const url = new URL(iconUrl);
								const isImage = isImageTypeForAstro(url.pathname);
								const filepath = generateFilePath(url, isImage);
								if (!fs.existsSync(filepath)) {
									await downloadFile(url, isImage);
								}
							} catch (err) {
								console.log(`Error downloading callout icon: ${err}`);
							}
						}
					} else if (
						blockObject.callout.icon.type === "custom_emoji" &&
						"custom_emoji" in blockObject.callout.icon
					) {
						const emojiUrl = blockObject.callout.icon.custom_emoji?.url || "";

						icon = {
							Type: blockObject.callout.icon.type,
							Url: emojiUrl,
						};

						// Download custom emoji if it doesn't exist
						if (emojiUrl) {
							try {
								const url = new URL(emojiUrl);
								const isImage = isImageTypeForAstro(url.pathname);
								const filepath = generateFilePath(url, isImage);
								if (!fs.existsSync(filepath)) {
									await downloadFile(url, isImage);
								}
							} catch (err) {
								console.log(`Error downloading callout custom emoji: ${err}`);
							}
						}
					}
				}

				const callout: Callout = {
					RichTexts: await Promise.all(blockObject.callout.rich_text.map(_buildRichText)),
					Icon: icon,
					Color: blockObject.callout.color,
				};
				block.Callout = callout;
			}
			break;
		case "synced_block":
			if (blockObject.synced_block) {
				let syncedFrom: SyncedFrom | null = null;
				if (blockObject.synced_block.synced_from && blockObject.synced_block.synced_from.block_id) {
					syncedFrom = {
						BlockId: blockObject.synced_block.synced_from.block_id,
					};
				}

				const syncedBlock: SyncedBlock = {
					SyncedFrom: syncedFrom,
				};
				block.SyncedBlock = syncedBlock;
			}
			break;
		case "toggle":
			if (blockObject.toggle) {
				const toggle: Toggle = {
					RichTexts: await Promise.all(blockObject.toggle.rich_text.map(_buildRichText)),
					Color: blockObject.toggle.color,
					Children: [],
				};
				block.Toggle = toggle;
			}
			break;
		case "embed":
			if (blockObject.embed) {
				const embed: Embed = {
					Caption: await Promise.all(blockObject.embed.caption?.map(_buildRichText) || []),
					Url: blockObject.embed.url,
				};
				block.Embed = embed;
			}
			break;
		case "bookmark":
			if (blockObject.bookmark) {
				const bookmark: Bookmark = {
					Caption: await Promise.all(blockObject.bookmark.caption?.map(_buildRichText) || []),
					Url: blockObject.bookmark.url,
				};
				block.Bookmark = bookmark;
			}
			break;
		case "link_preview":
			if (blockObject.link_preview) {
				const linkPreview: LinkPreview = {
					Caption: await Promise.all(blockObject.link_preview.caption?.map(_buildRichText) || []),
					Url: blockObject.link_preview.url,
				};
				block.LinkPreview = linkPreview;
			}
			break;
		case "table":
			if (blockObject.table) {
				const table: Table = {
					TableWidth: blockObject.table.table_width,
					HasColumnHeader: blockObject.table.has_column_header,
					HasRowHeader: blockObject.table.has_row_header,
					Rows: [],
				};
				block.Table = table;
			}
			break;
		case "column_list":
			// eslint-disable-next-line no-case-declarations
			const columnList: ColumnList = {
				Columns: [],
			};
			block.ColumnList = columnList;
			break;
		case "table_of_contents":
			if (blockObject.table_of_contents) {
				const tableOfContents: TableOfContents = {
					Color: blockObject.table_of_contents.color,
				};
				block.TableOfContents = tableOfContents;
			}
			break;
		case "link_to_page":
			if (blockObject.link_to_page && blockObject.link_to_page.page_id) {
				const linkToPage: LinkToPage = {
					Type: blockObject.link_to_page.type,
					PageId: blockObject.link_to_page.page_id,
				};
				block.LinkToPage = linkToPage;
			}
			break;
	}

	return block;
}

async function _getTableRows(blockId: string): Promise<TableRow[]> {
	let results: responses.BlockObject[] = [];

	const params: requestParams.RetrieveBlockChildren = {
		block_id: blockId,
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.children.list(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockChildrenResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
				minTimeout: minTimeout,
				factor: factor,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	return Promise.all(
		results.map(async (blockObject) => {
			const tableRow: TableRow = {
				Id: blockObject.id,
				Type: blockObject.type,
				HasChildren: blockObject.has_children,
				Cells: [],
			};

			if (blockObject.type === "table_row" && blockObject.table_row) {
				const cells: TableCell[] = await Promise.all(
					blockObject.table_row.cells.map(async (cell) => {
						const tableCell: TableCell = {
							RichTexts: await Promise.all(cell.map(_buildRichText)),
						};

						return tableCell;
					}),
				);

				tableRow.Cells = cells;
			}

			return tableRow;
		}),
	);
}

async function _getColumns(blockId: string): Promise<{ columns: Column[]; fileBlocks: Block[] }> {
	let results: responses.BlockObject[] = [];

	const params: requestParams.RetrieveBlockChildren = {
		block_id: blockId,
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.children.list(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockChildrenResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
				minTimeout: minTimeout,
				factor: factor,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	const allFileBlocks: Block[] = [];

	const columns = await Promise.all(
		results.map(async (blockObject) => {
			const { blocks: children, fileBlocks: childFileBlocks } = await getAllBlocksByBlockId(
				blockObject.id,
			);
			allFileBlocks.push(...childFileBlocks);

			const column: Column = {
				Id: blockObject.id,
				Type: blockObject.type,
				HasChildren: blockObject.has_children,
				Children: children,
			};

			return column;
		}),
	);

	return { columns, fileBlocks: allFileBlocks };
}

async function _getSyncedBlockChildren(
	block: Block,
): Promise<{ blocks: Block[]; fileBlocks: Block[] }> {
	let originalBlock: Block | null = block;
	if (block.SyncedBlock && block.SyncedBlock.SyncedFrom && block.SyncedBlock.SyncedFrom.BlockId) {
		originalBlock = await getBlock(block.SyncedBlock.SyncedFrom.BlockId);
		if (!originalBlock) {
			console.log("Could not retrieve the original synced_block");
			return { blocks: [], fileBlocks: [] };
		}
	}

	const { blocks: children, fileBlocks } = await getAllBlocksByBlockId(originalBlock.Id);
	return { blocks: children, fileBlocks };
}

function _validPageObject(pageObject: responses.PageObject): boolean {
	const prop = pageObject.properties;
	return !!prop.Page.title && prop.Page.title.length > 0;
}

async function _buildPost(pageObject: responses.PageObject): Promise<Post> {
	const prop = pageObject.properties;

	let icon: FileObject | Emoji | null = null;
	if (pageObject.icon) {
		if (pageObject.icon.type === "emoji" && "emoji" in pageObject.icon) {
			icon = {
				Type: pageObject.icon.type,
				Emoji: pageObject.icon.emoji,
			};
		} else if (pageObject.icon.type === "external" && "external" in pageObject.icon) {
			const iconUrl = pageObject.icon.external?.url || "";

			icon = {
				Type: pageObject.icon.type,
				Url: iconUrl,
			};

			// Notion's built-in icon set comes back as `external`, but we still want to cache it locally.
			if (iconUrl && isNotionHostedIconUrl(iconUrl)) {
				try {
					const url = new URL(iconUrl);
					const isImage = isImageTypeForAstro(url.pathname);
					await ensureDownloaded(url, isImage);
				} catch (err) {
					console.log(`Error downloading page icon: ${err}`);
				}
			}
		} else if (pageObject.icon.type === "file" && "file" in pageObject.icon) {
			const iconUrl = pageObject.icon.file?.url || "";

			icon = {
				Type: pageObject.icon.type,
				Url: iconUrl,
				ExpiryTime: pageObject.icon.file?.expiry_time,
			};

			// Download icon if it doesn't exist
			if (iconUrl) {
				try {
					const url = new URL(iconUrl);
					const isImage = isImageTypeForAstro(url.pathname);
					const filepath = generateFilePath(url, isImage);
					if (!fs.existsSync(filepath)) {
						await downloadFile(url, isImage);
					}
				} catch (err) {
					console.log(`Error downloading page icon: ${err}`);
				}
			}
		} else if (pageObject.icon.type === "custom_emoji" && "custom_emoji" in pageObject.icon) {
			const emojiUrl = pageObject.icon.custom_emoji?.url || "";

			icon = {
				Type: pageObject.icon.type,
				Url: emojiUrl,
			};

			// Download custom emoji if it doesn't exist
			if (emojiUrl) {
				try {
					const url = new URL(emojiUrl);
					const isImage = isImageTypeForAstro(url.pathname);
					const filepath = generateFilePath(url, isImage);
					if (!fs.existsSync(filepath)) {
						await downloadFile(url, isImage);
					}
				} catch (err) {
					console.log(`Error downloading page custom emoji: ${err}`);
				}
			}
		}
	}

	let cover: FileObject | null = null;
	if (pageObject.cover) {
		cover = {
			Type: pageObject.cover.type,
			Url: pageObject.cover.external?.url || "",
		};
	}

	let featuredImage: FileObject | null = null;
	if (prop.FeaturedImage.files && prop.FeaturedImage.files.length > 0) {
		if (prop.FeaturedImage.files[0].external) {
			featuredImage = {
				Type: prop.FeaturedImage.type,
				Url: prop.FeaturedImage.files[0].external.url,
			};
		} else if (prop.FeaturedImage.files[0].file) {
			featuredImage = {
				Type: prop.FeaturedImage.type,
				Url: prop.FeaturedImage.files[0].file.url,
				ExpiryTime: prop.FeaturedImage.files[0].file.expiry_time,
			};
		}
	}

	const externalUrl =
		prop["External URL"] && "url" in prop["External URL"] && prop["External URL"]?.url
			? prop["External URL"].url.trim()
			: "";
	const isExternal = !!externalUrl;

	const slugValue = prop.Slug?.formula?.string ? slugify(prop.Slug.formula.string) : "";
	const externalContentDescriptor = resolveExternalContentDescriptor(externalUrl);

	// Parse Authors multi-select if the property exists
	// Returns undefined if property doesn't exist (different from empty array)
	let authors: AuthorProperty[] | undefined = undefined;
	if (prop.Authors && "multi_select" in prop.Authors) {
		// Property exists - parse it (may be empty array)
		const rawAuthors = prop.Authors.multi_select || [];

		// Fetch schema to get author descriptions
		const { propertiesRaw } = await getDataSource();
		const options = propertiesRaw.Authors?.multi_select?.options || [];
		const authorsDescMap = options.reduce(
			(acc, option) => {
				acc[option.name] = option.description || "";
				return acc;
			},
			{} as Record<string, string>,
		);

		const parsedAuthors = rawAuthors.map((author) => {
			const description = authorsDescMap[author.name] || "";
			const parsed = parseAuthorDescription(description);
			return {
				id: author.id,
				name: author.name,
				color: author.color,
				description: description,
				url: parsed.url,
				photo: parsed.photo,
				bio: parsed.bio,
			};
		});
		// Deduplicate authors by name (keep first occurrence)
		const seenNames = new Set<string>();
		authors = parsedAuthors.filter((author) => {
			if (seenNames.has(author.name)) {
				return false;
			}
			seenNames.add(author.name);
			return true;
		});
	}

	const post: Post = {
		PageId: pageObject.id,
		Title: prop.Page?.title ? prop.Page.title.map((richText) => richText.plain_text).join("") : "",
		LastUpdatedTimeStamp: pageObject.last_edited_time
			? new Date(pageObject.last_edited_time)
			: null,
		Icon: icon,
		Cover: cover,
		Collection: prop.Collection?.select ? prop.Collection.select.name : "",
		Slug: slugValue,
		Date: prop["Publish Date"]?.formula?.date ? prop["Publish Date"]?.formula?.date.start : "",
		Tags: prop.Tags?.multi_select ? prop.Tags.multi_select : [],
		Excerpt:
			prop.Excerpt?.rich_text && prop.Excerpt.rich_text.length > 0
				? prop.Excerpt.rich_text.map((richText) => richText.plain_text).join("")
				: "",
		FeaturedImage: featuredImage,
		Rank: prop.Rank?.number ?? null,
		LastUpdatedDate: prop["Last Updated Date"]?.formula?.date
			? prop["Last Updated Date"]?.formula.date.start
			: "",
		Pinned: prop.Pinned && prop.Pinned.checkbox === true ? true : false,
		BlueSkyPostLink:
			prop["Bluesky Post Link"] && prop["Bluesky Post Link"].url
				? prop["Bluesky Post Link"].url
				: "",
		IsExternal: isExternal,
		ExternalUrl: externalUrl || null,
		ExternalContent: externalContentDescriptor,
		Authors: authors,
	};
	return post;
}

export async function _buildRichText(richTextObject: responses.RichTextObject): Promise<RichText> {
	const annotation: Annotation = {
		Bold: richTextObject.annotations.bold,
		Italic: richTextObject.annotations.italic,
		Strikethrough: richTextObject.annotations.strikethrough,
		Underline: richTextObject.annotations.underline,
		Code: richTextObject.annotations.code,
		Color: richTextObject.annotations.color,
	};

	const richText: RichText = {
		Annotation: annotation,
		PlainText: richTextObject.plain_text,
		Href: richTextObject.href,
	};

	if (richTextObject.href?.startsWith("/")) {
		// Notion adds a `v=` query parameter to links copied from peek view.
		// We need to remove it to parse the link correctly.
		richTextObject.href = richTextObject.href.replace(/([&?])v=[^#]*/, "");
		if (richTextObject.href?.includes("#")) {
			const interlinkedContent: InterlinkedContent = {
				PageId: richTextObject.href
					.split("#")[0]
					.substring(1)
					.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
				BlockId: richTextObject.href.split("#")[1],
				Type: "block",
			};
			richText.InternalHref = interlinkedContent;
		} else {
			const interlinkedContent: InterlinkedContent = {
				PageId: richTextObject.href
					.substring(1)
					.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
				Type: "page",
			};
			richText.InternalHref = interlinkedContent;
		}
	}

	if (richTextObject.type === "text" && richTextObject.text) {
		const text: Text = {
			Content: richTextObject.text.content,
		};

		if (richTextObject.text.link) {
			text.Link = {
				Url: richTextObject.text.link.url,
			};
		}

		richText.Text = text;
	} else if (richTextObject.type === "equation" && richTextObject.equation) {
		const equation: Equation = {
			Expression: richTextObject.equation.expression,
		};
		richText.Equation = equation;
	} else if (richTextObject.type === "mention" && richTextObject.mention) {
		const mention: Mention = {
			Type: richTextObject.mention.type,
		};

		if (richTextObject.mention.type === "page" && richTextObject.mention.page) {
			const interlinkedContent: InterlinkedContent = {
				PageId: richTextObject.mention.page.id,
				Type: richTextObject.mention.type,
			};
			mention.Page = interlinkedContent;
		} else if (richTextObject.mention.type === "date") {
			let formatted_date = richTextObject.mention.date?.start
				? richTextObject.mention.date?.end
					? getFormattedDateWithTime(richTextObject.mention.date?.start) +
						" to " +
						getFormattedDateWithTime(richTextObject.mention.date?.end)
					: getFormattedDateWithTime(richTextObject.mention.date?.start)
				: "Invalid Date";

			mention.DateStr = formatted_date;
		} else if (
			richTextObject.mention.type === "link_mention" &&
			richTextObject.mention.link_mention
		) {
			const linkMention = richTextObject.mention.link_mention;
			mention.LinkMention = {
				Href: linkMention.href,
				Title: linkMention.title,
				IconUrl: linkMention.icon_url,
				Description: linkMention.description,
				LinkAuthor: linkMention.link_author,
				ThumbnailUrl: linkMention.thumbnail_url,
				Height: linkMention.height,
				IframeUrl: linkMention.iframe_url,
				LinkProvider: linkMention.link_provider,
			};
		} else if (
			richTextObject.mention.type === "custom_emoji" &&
			richTextObject.mention.custom_emoji
		) {
			const emojiUrl = richTextObject.mention.custom_emoji.url || "";

			mention.CustomEmoji = {
				Name: richTextObject.mention.custom_emoji.name,
				Url: emojiUrl,
			};

			// Download custom emoji if it doesn't exist
			if (emojiUrl) {
				try {
					const url = new URL(emojiUrl);
					const isImage = isImageTypeForAstro(url.pathname);
					const filepath = generateFilePath(url, isImage);
					if (!fs.existsSync(filepath)) {
						await downloadFile(url, isImage);
					}
				} catch (err) {
					console.log(`Error downloading custom emoji: ${err}`);
				}
			}
		}

		richText.Mention = mention;
	}

	return richText;
}
