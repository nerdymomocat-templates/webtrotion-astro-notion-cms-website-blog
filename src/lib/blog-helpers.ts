import {
	BUILD_FOLDER_PATHS,
	HOME_PAGE_SLUG,
	MENU_PAGES_COLLECTION,
	BIBLIOGRAPHY_STYLE,
} from "../constants";
import type {
	Block,
	Heading1,
	Heading2,
	Heading3,
	RichText,
	Column,
	InterlinkedContentInPage,
	Post,
	Footnote,
	Citation,
} from "@/lib/interfaces";
import type { ImageMetadata } from "astro";
import { slugify } from "../utils/slugify";
import path from "path";
import fs from "node:fs";
import { getBlock, getPostByPageId } from "../lib/notion/client";
import superjson from "superjson";
import { prepareBibliography } from "./citations";
import { joinPlainText } from "../utils/richtext-utils";

const BASE_PATH = import.meta.env.BASE_URL;
let downloadedImagesinSrc = null;
let interlinkedContentInPageCache: { [entryId: string]: InterlinkedContentInPage[] } | null = null;
let interlinkedContentToPageCache: {
	[entryId: string]: { entryId: string; block: Block }[];
} | null = null;
let firstImage = true;
let track_current_page_id: string | null = null;
let current_headings = null;

function getDownloadedImagesInSrc() {
	if (!downloadedImagesinSrc) {
		downloadedImagesinSrc = import.meta.glob<{ default: ImageMetadata }>(
			"/src/assets/notion/**/*.{jpeg,jpg,png,gif,webp,avif,svg}",
			{ eager: true },
		);
	}
	return downloadedImagesinSrc;
}

export async function getNotionImage(url: URL): Promise<ImageMetadata | null> {
	// Extract the second-to-last and last segments (matches generateFilePath logic)
	const segments = url.pathname.split("/");
	const dirName = segments.slice(-2)[0];
	const filename = decodeURIComponent(segments.slice(-1)[0]);

	const imagePath = `/src/assets/notion/${dirName}/${filename}`;
	let downloadedImagesinSrcUpdated = getDownloadedImagesInSrc();

	// Check if image exists in the eager glob results
	if (!downloadedImagesinSrcUpdated[imagePath]) {
		// console.warn(`Image not found in glob: ${imagePath}`);
		return null;
	}

	// Return the eagerly loaded image
	return downloadedImagesinSrcUpdated[imagePath].default;
}

export function getImageComponentFormat(
	imageMetadata: ImageMetadata,
): "svg" | "avif" | "gif" | "webp" {
	const format = imageMetadata.format;
	if (format === "svg" || format === "avif" || format === "gif") {
		return format;
	}
	return "webp";
}

export function setCurrentHeadings(headings) {
	current_headings = headings;
	return true;
}

export function resetCurrentHeadings() {
	current_headings = null;
	return true;
}

export function getCurrentHeadings() {
	return current_headings;
}

export function resetFirstImage() {
	firstImage = true;
	return firstImage;
}
export function getFirstImage() {
	let returnval = firstImage;
	if (firstImage) {
		firstImage = false;
	}
	return returnval;
}
export function setTrackCurrentPageId(pageId: string) {
	track_current_page_id = pageId;
	return true;
}

export const filePath = (url: URL): string => {
	const [dir, filename] = url.pathname.split("/").slice(-2);
	return path.join(BASE_PATH, `/notion/${dir}/${decodeURIComponent(filename)}`);
};

export const buildTimeFilePath = (url: URL): string => {
	const [dir, filename] = url.pathname.split("/").slice(-2);
	return `/notion/${dir}/${filename}`;
};

export function getInterlinkedContentInPage(entryId: string) {
	// Load and aggregate data if interlinkedContentInPageCache is null
	if (interlinkedContentInPageCache === null) {
		interlinkedContentInPageCache = Object.fromEntries(
			fs.readdirSync(BUILD_FOLDER_PATHS["interlinkedContentInPage"]).map((file) => {
				const pageId = file.replace(".json", "");
				return [
					pageId,
					superjson.parse(
						fs.readFileSync(
							path.join(BUILD_FOLDER_PATHS["interlinkedContentInPage"], file),
							"utf-8",
						),
					),
				];
			}),
		);
	}
	// Return the interlinked content for the given entryId, or null if not found
	return interlinkedContentInPageCache ? interlinkedContentInPageCache[entryId] : null;
}

export function getInterlinkedContentToPage(entryId: string) {
	// Load and aggregate data if interlinkedContentToPageCache is null
	if (interlinkedContentToPageCache === null) {
		interlinkedContentToPageCache = {};

		interlinkedContentToPageCache = Object.fromEntries(
			fs.readdirSync(BUILD_FOLDER_PATHS["interlinkedContentToPage"]).map((file) => {
				const pageId = file.replace(".json", "");
				return [
					pageId,
					superjson.parse(
						fs.readFileSync(
							path.join(BUILD_FOLDER_PATHS["interlinkedContentToPage"], file),
							"utf-8",
						),
					),
				];
			}),
		);
	}
	// Return the interlinked content for the given entryId, or null if not found
	return interlinkedContentToPageCache ? interlinkedContentToPageCache[entryId] : null;
}

export const extractTargetBlocks = (blockTypes: string[], blocks: Block[]): Block[] => {
	return blocks
		.reduce((acc: Block[], block) => {
			if (blockTypes.includes(block.Type)) {
				acc.push(block);
			}

			if (block.ColumnList && block.ColumnList.Columns) {
				acc = acc.concat(_extractTargetBlockFromColumns(blockTypes, block.ColumnList.Columns));
			} else if (block.BulletedListItem && block.BulletedListItem.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.BulletedListItem.Children));
			} else if (block.NumberedListItem && block.NumberedListItem.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.NumberedListItem.Children));
			} else if (block.ToDo && block.ToDo.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.ToDo.Children));
			} else if (block.SyncedBlock && block.SyncedBlock.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.SyncedBlock.Children));
			} else if (block.Toggle && block.Toggle.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.Toggle.Children));
			} else if (block.Paragraph && block.Paragraph.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.Paragraph.Children));
			} else if (block.Heading1 && block.Heading1.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.Heading1.Children));
			} else if (block.Heading2 && block.Heading2.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.Heading2.Children));
			} else if (block.Heading3 && block.Heading3.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.Heading3.Children));
			} else if (block.Quote && block.Quote.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.Quote.Children));
			} else if (block.Callout && block.Callout.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, block.Callout.Children));
			}

			return acc;
		}, [])
		.flat();
};

const _extractTargetBlockFromColumns = (blockTypes: string[], columns: Column[]): Block[] => {
	return columns
		.reduce((acc: Block[], column) => {
			if (column.Children) {
				acc = acc.concat(extractTargetBlocks(blockTypes, column.Children));
			}
			return acc;
		}, [])
		.flat();
};

const _filterRichTexts = (
	postId: string,
	block: Block,
	rich_texts: RichText[],
): InterlinkedContentInPage => ({
	block,
	other_pages:
		rich_texts.reduce((acc, richText) => {
			if (richText.InternalHref && richText.InternalHref?.PageId !== postId) {
				acc.push(richText);
			}
			if (richText.Mention?.Page?.PageId && richText.Mention.Page.PageId !== postId) {
				acc.push(richText);
			}
			return acc;
		}, [] as RichText[]) || [],
	external_hrefs:
		rich_texts.reduce((acc, richText) => {
			if (
				(!richText.InternalHref && !richText.Mention && richText.Href) ||
				(richText.Mention && richText.Mention.LinkMention)
			) {
				acc.push(richText);
			}
			return acc;
		}, [] as RichText[]) || [],
	same_page:
		rich_texts.reduce((acc, richText) => {
			if (richText.InternalHref?.PageId === postId) {
				acc.push(richText);
			}
			if (richText.Mention?.Page?.PageId && richText.Mention.Page.PageId === postId) {
				acc.push(richText);
			}
			return acc;
		}, [] as RichText[]) || [],
	direct_media_link: null,
	link_to_pageid: null,
	direct_nonmedia_link: null,
});

const _extractInterlinkedContentInBlock = (
	postId: string,
	block: Block,
): InterlinkedContentInPage => {
	let rich_texts =
		block.Bookmark?.Caption ||
		block.BulletedListItem?.RichTexts ||
		block.Callout?.RichTexts ||
		block.Code?.RichTexts ||
		block.Embed?.Caption ||
		block.File?.Caption ||
		block.Heading1?.RichTexts ||
		block.Heading2?.RichTexts ||
		block.Heading3?.RichTexts ||
		block.LinkPreview?.Caption ||
		block.NAudio?.Caption ||
		block.NImage?.Caption ||
		block.NumberedListItem?.RichTexts ||
		block.Paragraph?.RichTexts ||
		block.Quote?.RichTexts ||
		block.ToDo?.RichTexts ||
		block.Toggle?.RichTexts ||
		block.Video?.Caption ||
		[];

	// Extract RichTexts from table cells
	if (block.Table?.Rows) {
		const tableRichTexts: RichText[] = [];
		block.Table.Rows.forEach((row) => {
			row.Cells.forEach((cell) => {
				if (cell.RichTexts && cell.RichTexts.length > 0) {
					tableRichTexts.push(...cell.RichTexts);
				}
			});
		});
		// Combine table RichTexts with existing rich_texts
		if (tableRichTexts.length > 0) {
			rich_texts = [...rich_texts, ...tableRichTexts];
		}
	}

	let filteredRichText = _filterRichTexts(postId, block, rich_texts);
	let direct_media_link =
		block.NAudio?.External?.Url ||
		block.NAudio?.File?.Url ||
		block.File?.External?.Url ||
		block.File?.File?.Url ||
		block.NImage?.External?.Url ||
		block.NImage?.File?.Url ||
		block.Video?.External?.Url ||
		block.Video?.File?.Url;
	let direct_nonmedia_link = block.Embed?.Url || block.LinkPreview?.Url || block.Bookmark?.Url;
	let link_to_pageid =
		block.LinkToPage?.PageId && block.LinkToPage?.PageId !== postId
			? block.LinkToPage?.PageId
			: null;
	filteredRichText.direct_media_link = direct_media_link ?? null;
	filteredRichText.direct_nonmedia_link = direct_nonmedia_link ?? null;
	filteredRichText.link_to_pageid = link_to_pageid ?? null;
	return filteredRichText;
};

export const buildURLToHTMLMap = async (urls: URL[]): Promise<{ [key: string]: string }> => {
	const htmls: string[] = await Promise.all(
		urls.map(async (url: URL) => {
			const controller = new AbortController();
			const timeout = setTimeout(() => {
				controller.abort();
			}, 10000);

			return fetch(url.toString(), { signal: controller.signal })
				.then((res) => {
					return res.text();
				})
				.catch(() => {
					console.log("Request was aborted");
					return "";
				})
				.finally(() => {
					clearTimeout(timeout);
				});
		}),
	);

	return urls.reduce((acc: { [key: string]: string }, url, i) => {
		if (htmls[i]) {
			acc[url.toString()] = htmls[i];
		}
		return acc;
	}, {});
};

export const getNavLink = (nav: string) => {
	if (!nav && BASE_PATH) {
		return path.join(BASE_PATH, "") + "/";
	}
	return path.join(BASE_PATH, nav);
};

export const getAnchorLinkAndBlock = async (
	richText: RichText,
): Promise<{
	hreflink: string | null;
	blocklinked: Block | null;
	conditionmatch: string | null;
	post: Post | null;
	isBlockLinkedHeading: boolean;
}> => {
	let block_linked: Block | null = null;
	let block_linked_id = null;
	let post: Post | null = null;
	let pageId = null;
	let isBlockLinkedHeading = false;

	pageId = richText.InternalHref?.PageId;
	if (pageId) {
		post = await getPostByPageId(pageId);
	}

	if (post && richText.InternalHref?.BlockId) {
		block_linked = await getBlock(richText.InternalHref?.BlockId);
		block_linked_id = block_linked ? block_linked.Id : null;
		if (block_linked && (block_linked.Heading1 || block_linked.Heading2 || block_linked.Heading3)) {
			block_linked_id = buildHeadingId(
				block_linked.Heading1 || block_linked.Heading2 || block_linked.Heading3,
			);
			isBlockLinkedHeading = true;
		}
	}

	if (post && isExternalPost(post)) {
		return {
			hreflink: post.ExternalUrl as string,
			blocklinked: block_linked,
			conditionmatch: "external_post",
			post,
			isBlockLinkedHeading,
		};
	}

	if (richText.Href && !richText.Mention && !richText.InternalHref) {
		return {
			hreflink: richText.Href,
			blocklinked: block_linked,
			conditionmatch: "external",
			post: post,
			isBlockLinkedHeading,
		};
	} else if (block_linked_id && post && post.PageId === track_current_page_id) {
		const baseHref = resolvePostHref(post);
		return {
			hreflink: `${baseHref}#${block_linked_id}`,
			blocklinked: block_linked,
			conditionmatch: "block_current_page",
			post: post,
			isBlockLinkedHeading,
		};
	} else if (block_linked_id && post) {
		const baseHref = resolvePostHref(post);
		return {
			hreflink: `${baseHref}#${block_linked_id}`,
			blocklinked: block_linked,
			conditionmatch: "block_other_page",
			post: post,
			isBlockLinkedHeading,
		};
	} else if (post) {
		const baseHref = resolvePostHref(post);
		return {
			hreflink: baseHref,
			blocklinked: block_linked,
			conditionmatch: "other_page",
			post: post,
			isBlockLinkedHeading,
		};
	}
	return {
		hreflink: null,
		blocklinked: null,
		conditionmatch: "no_match",
		post: null,
		isBlockLinkedHeading,
	};
};

export const getInterlinkedContentLink = async (
	current_page_id: string,
	linkedPageId?: string,
	block_linked?: Block,
	currentOverride: boolean = false,
): Promise<[string | null, Post | null]> => {
	const linkedpost = currentOverride
		? null
		: linkedPageId
			? await getPostByPageId(linkedPageId)
			: null;
	let block_linked_id = block_linked ? block_linked.Id : null;
	if (linkedpost || currentOverride) {
		if (block_linked && (block_linked.Heading1 || block_linked.Heading2 || block_linked.Heading3)) {
			block_linked_id = buildHeadingId(
				block_linked.Heading1 || block_linked.Heading2 || block_linked.Heading3,
			);
		}
	}

	if (linkedpost && isExternalPost(linkedpost)) {
		return [linkedpost.ExternalUrl as string, linkedpost];
	}

	if (
		block_linked_id &&
		((linkedpost && current_page_id && linkedPageId == current_page_id) || currentOverride)
	) {
		return [`#${block_linked_id}`, linkedpost];
	} else if (block_linked_id && linkedpost) {
		const baseHref = resolvePostHref(linkedpost);
		return [`${baseHref}#${block_linked_id}`, linkedpost];
	} else if (linkedpost) {
		return [resolvePostHref(linkedpost), linkedpost];
	}
	return [null, null];
};

export const getPostLink = (slug: string, isRoot: boolean = false): string => {
	const linkedPath = isRoot
		? slug === HOME_PAGE_SLUG
			? path.posix.join(BASE_PATH, "/")
			: path.posix.join(BASE_PATH, slug)
		: path.posix.join(BASE_PATH, "posts", slug);

	return linkedPath.endsWith("/") ? linkedPath : `${linkedPath}/`; // Ensure trailing slash
};

export const buildHeadingId = (heading: Heading1 | Heading2 | Heading3) => {
	return slugify(joinPlainText(heading.RichTexts).trim());
};

export const hasExternalContentDescriptor = (post?: Post | null): boolean => {
	return !!post?.ExternalContent;
};

export const isExternalPost = (post?: Post | null): boolean => {
	if (!post) return false;
	if (hasExternalContentDescriptor(post)) {
		return false;
	}
	return post.IsExternal === true && !!post.ExternalUrl;
};

export const resolvePostHref = (
	post: Post,
	options?: {
		forceIsRoot?: boolean;
	},
): string => {
	if (isExternalPost(post)) {
		return post.ExternalUrl as string;
	}

	const isRoot =
		typeof options?.forceIsRoot === "boolean"
			? options.forceIsRoot
			: post.Collection === MENU_PAGES_COLLECTION;

	return getPostLink(post.Slug, isRoot);
};

export const isTweetURL = (url: URL): boolean => {
	if (
		url.hostname !== "twitter.com" &&
		url.hostname !== "www.twitter.com" &&
		url.hostname !== "x.com" &&
		url.hostname !== "www.x.com"
	) {
		return false;
	}
	return /\/[^/]+\/status\/[\d]+/.test(url.pathname);
};

export const isBlueskyAppURL = (url: URL): boolean => {
	if (url.hostname !== "bsky.app" && url.hostname !== "www.bsky.app") {
		return false;
	}
	return /^\/profile\/[^/]+\/post\/\w+$/.test(url.pathname);
};

export const isTikTokURL = (url: URL): boolean => {
	if (url.hostname !== "tiktok.com" && url.hostname !== "www.tiktok.com") {
		return false;
	}
	return /\/[^/]+\/video\/[\d]+/.test(url.pathname);
};
export const isInstagramURL = (url: URL): boolean => {
	if (url.hostname !== "instagram.com" && url.hostname !== "www.instagram.com") {
		return false;
	}
	return /\/p\/[^/]+/.test(url.pathname);
};
export const isPinterestURL = (url: URL): boolean => {
	if (
		url.hostname !== "pinterest.com" &&
		url.hostname !== "www.pinterest.com" &&
		url.hostname !== "pinterest.jp" &&
		url.hostname !== "www.pinterest.jp"
	) {
		return false;
	}
	return /\/pin\/[\d]+/.test(url.pathname);
};

export const isSpotifyURL = (url: URL): boolean => {
	if (
		url.hostname !== "spotify.com" &&
		url.hostname !== "www.spotify.com" &&
		url.hostname !== "open.spotify.com"
	) {
		return false;
	}
	return /\/embed\//.test(url.pathname);
};

export const isGoogleMapsURL = (url: URL): boolean => {
	if (url.toString().startsWith("https://www.google.com/maps/embed")) {
		return true;
	}
	return false;
};

export const isCodePenURL = (url: URL): boolean => {
	if (url.hostname !== "codepen.io" && url.hostname !== "www.codepen.io") {
		return false;
	}
	return /\/[^/]+\/pen\/[^/]+/.test(url.pathname);
};

export const isShortAmazonURL = (url: URL): boolean => {
	if (url.hostname === "amzn.to" || url.hostname === "www.amzn.to") {
		return true;
	}
	return false;
};
export const isFullAmazonURL = (url: URL): boolean => {
	if (
		url.hostname === "amazon.com" ||
		url.hostname === "www.amazon.com" ||
		url.hostname === "amazon.co.jp" ||
		url.hostname === "www.amazon.co.jp" ||
		url.hostname === "www.amazon.in"
	) {
		return true;
	}
	return false;
};
export const isAmazonURL = (url: URL): boolean => {
	return isShortAmazonURL(url) || isFullAmazonURL(url);
};

export const isNotionEmbedURL = (url: URL): boolean => {
	// Ensure the pathname starts with "/ebd/"
	const pathname = url.pathname;
	if (!pathname.startsWith("/ebd/")) {
		return false;
	}

	// Regular expression to match the expected pattern after "/ebd/"
	const notionEmbedPattern = /^\/ebd\/.*[a-zA-Z0-9]{32}(\/|\?|$)/;
	if (!notionEmbedPattern.test(pathname)) {
		return false;
	}

	// All checks passed
	return true;
};

export const isYouTubeURL = (url: URL): boolean => {
	if (["www.youtube.com", "youtube.com", "youtu.be"].includes(url.hostname)) {
		return true;
	}
	return false;
};

// Supported URL
//
// - https://youtu.be/0zM3nApSvMg
// - https://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
// - https://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
// - https://www.youtube.com/watch?v=0zM3nApSvMg
// - https://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0
// - https://www.youtube.com/embed/0zM3nApSvMg?rel=0
// - https://youtube.com/live/uOLwqWlpKbA
export const parseYouTubeVideoIdTitle = async (url: URL): Promise<[string, string]> => {
	if (!isYouTubeURL(url)) return ["", ""];
	let id = "";

	if (url.hostname === "youtu.be") {
		id = url.pathname.split("/")[1];
	} else if (url.pathname === "/watch") {
		id = url.searchParams.get("v") || "";
	} else {
		const elements = url.pathname.split("/");

		if (elements.length < 2) {
			id = "";
		}

		if (elements[1] === "v" || elements[1] === "embed" || elements[1] === "live") {
			id = elements[2];
		}
	}

	let title = "";
	if (id) {
		const res = await fetch(
			`https://noembed.com/embed?dataType=json&url=https://www.youtube.com/embed/${id}`,
		);
		const data = await res.json();
		title = data.title;
	}
	return [id, title];
};

export const isEmbeddableURL = async (url: URL): Promise<boolean> => {
	try {
		const urlString = url.toString();
		const response = await fetch(urlString, {
			method: "HEAD",
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; EmbedChecker/1.0)",
			},
		});

		if (!response.ok) {
			return false;
		}

		const xFrameOptions = response.headers.get("x-frame-options");
		const contentSecurityPolicy = response.headers.get("content-security-policy");

		// Check X-Frame-Options header
		if (xFrameOptions) {
			const xfoValue = xFrameOptions.toLowerCase();
			if (xfoValue === "deny" || xfoValue === "sameorigin") {
				return false;
			}
		}

		// Check Content-Security-Policy header
		if (contentSecurityPolicy) {
			const cspValue = contentSecurityPolicy.toLowerCase();

			// Look for frame-ancestors directive
			const frameAncestorsMatch = cspValue
				.split(";")
				.find((directive) => directive.trim().startsWith("frame-ancestors"));

			if (frameAncestorsMatch) {
				const values = frameAncestorsMatch.split(" ").slice(1);

				// Not embeddable if:
				// 1. frame-ancestors is 'none'
				// 2. doesn't include '*' or your domain
				if (values.includes("'none'")) {
					return false;
				}

				// If it includes '*' or your domain, it's embeddable
				if (values.includes("*")) {
					return true;
				}

				// Check if your domain is allowed
				const yourDomain = new URL(urlString).origin;
				if (!values.some((v) => v === "'self'" || v === yourDomain)) {
					return false;
				}
			}
		}

		return true;
	} catch (error) {
		console.error("Error checking URL:", error);
		return false;
	}
};

/**
 * Load cached HTML for a post
 * @param postSlug - The slug of the post
 * @param shouldUseCache - Whether to attempt to load cache
 * @returns The cached HTML string or empty string if not found
 */
export async function loadCachedHtml(postSlug: string, shouldUseCache: boolean): Promise<string> {
	if (!shouldUseCache) return "";

	const cacheFilePath = path.join(BUILD_FOLDER_PATHS["blocksHtmlCache"], `${postSlug}.html`);
	try {
		return await fs.promises.readFile(cacheFilePath, "utf-8");
	} catch (e) {
		return ""; // Fallback to rendering if cache read fails
	}
}

/**
 * Load cached headings for a post
 * @param postSlug - The slug of the post
 * @param postLastUpdatedBeforeLastBuild - Whether the post was updated before last build
 * @returns The cached headings or null if not found
 */
export async function loadCachedHeadings(
	postSlug: string,
	postLastUpdatedBeforeLastBuild: boolean,
): Promise<any | null> {
	if (!postLastUpdatedBeforeLastBuild) return null;

	const headingsCacheDir = BUILD_FOLDER_PATHS["headingsCache"];
	const headingsCacheFile = path.join(headingsCacheDir, `${postSlug}.json`);

	try {
		const headingsData = await fs.promises.readFile(headingsCacheFile, "utf-8");
		return superjson.parse(headingsData);
	} catch (e) {
		return null; // Fallback to building headings if cache read fails
	}
}

/**
 * Save headings to cache
 * @param postSlug - The slug of the post
 * @param headings - The headings to save
 */
export async function saveCachedHeadings(postSlug: string, headings: any): Promise<void> {
	const headingsCacheDir = BUILD_FOLDER_PATHS["headingsCache"];
	const headingsCacheFile = path.join(headingsCacheDir, `${postSlug}.json`);

	try {
		await fs.promises.writeFile(headingsCacheFile, superjson.stringify(headings), "utf-8");
	} catch (e) {
		console.error("Error saving headings cache:", e);
	}
}

// ============================================================================
// Unified Page Content Extraction
// ============================================================================

/**
 * Unified Page Content Extraction System
 *
 * This combines footnotes, citations, and interlinked content extraction
 * into a SINGLE tree traversal for optimal performance.
 *
 * Instead of:
 * - extractFootnotesInPage (full tree traversal)
 * - extractCitationsInPage (full tree traversal)
 * - extractInterlinkedContentInPage (full tree traversal)
 *
 * We now do ONE traversal that collects all three types of content.
 */

export interface PageContentExtractionResult {
	footnotes: Footnote[];
	citations: Citation[];
	interlinkedContent: InterlinkedContentInPage[];
}

/**
 * Unified extraction function that traverses the block tree ONCE
 * and collects footnotes, citations, and interlinked content
 */
export function extractPageContent(
	postId: string,
	blocks: Block[],
	options: {
		extractFootnotes: boolean;
		extractCitations: boolean;
		extractInterlinkedContent: boolean;
	},
): PageContentExtractionResult {
	const allFootnotes: Footnote[] = [];
	const citationMap = new Map<string, Citation>();
	const allInterlinkedContent: InterlinkedContentInPage[] = [];

	// Tracking for footnotes
	let footnoteIndex = 0;

	// Tracking for citations
	const keyToIndex = new Map<string, number>();
	const keyToMainContentIndex = new Map<string, number>(); // Track first appearance in main content
	let firstAppearanceCounter = 0;
	let firstAppearanceInMainContentCounter = 0;
	/**
	 * Recursive function that processes a single block and all its children
	 */
	function processBlock(block: Block): void {
		// 1. Extract and process footnotes
		if (options.extractFootnotes && block.Footnotes && block.Footnotes.length > 0) {
			block.Footnotes.forEach((footnote) => {
				// Assign sequential index if not already assigned
				if (!footnote.Index) {
					footnote.Index = ++footnoteIndex;
				}
				// Store the block ID where this marker appears (for back-links)
				if (!footnote.SourceBlockId) {
					footnote.SourceBlockId = block.Id;
					footnote.SourceBlock = block;
				}
				allFootnotes.push(footnote);
			});
		}

		// 2. Extract and process citations
		if (options.extractCitations && block.Citations && block.Citations.length > 0) {
			block.Citations.forEach((citation) => {
				const key = citation.Key;

				if (keyToIndex.has(key)) {
					// Already seen this key - reuse existing index
					const existingIndex = keyToIndex.get(key)!;
					citation.Index = existingIndex; // MUTATE directly
					// DO NOT overwrite FirstAppearanceIndex - it should remain undefined for subsequent occurrences
					// This allows CitationMarker.astro to distinguish first vs subsequent occurrences

					// Check if this is the first time seeing this key in main content (not in footnote)
					if (!keyToMainContentIndex.has(key) && !citation.IsInFootnoteContent) {
						firstAppearanceInMainContentCounter++;
						citation.FirstAppearanceInMainContentIndex = firstAppearanceInMainContentCounter;
						keyToMainContentIndex.set(key, firstAppearanceInMainContentCounter);

						// Also update the existing citation in the map
						const existing = citationMap.get(key)!;
						existing.FirstAppearanceInMainContentIndex = firstAppearanceInMainContentCounter;
					}

					// Add this block ID and Block object to the citation's SourceBlockIds and SourceBlocks
					const existing = citationMap.get(key)!;
					if (!existing.SourceBlockIds.includes(block.Id)) {
						existing.SourceBlockIds.push(block.Id);
						if (!existing.SourceBlocks) {
							existing.SourceBlocks = [];
						}
						existing.SourceBlocks.push(block);
					}
				} else {
					// First time seeing this key - assign new index
					firstAppearanceCounter++;
					const index =
						BIBLIOGRAPHY_STYLE === "simplified-ieee" ? firstAppearanceCounter : undefined;

					// MUTATE the citation directly
					citation.Index = index;
					citation.FirstAppearanceIndex = firstAppearanceCounter;
					citation.SourceBlockIds = [block.Id];
					citation.SourceBlocks = [block];

					// Also track FirstAppearanceInMainContentIndex if this is in main content
					if (!citation.IsInFootnoteContent) {
						firstAppearanceInMainContentCounter++;
						citation.FirstAppearanceInMainContentIndex = firstAppearanceInMainContentCounter;
						keyToMainContentIndex.set(key, firstAppearanceInMainContentCounter);
					}

					// Track this key's index
					if (index !== undefined) {
						keyToIndex.set(key, index);
					}

					// Add to map for bibliography
					citationMap.set(key, citation);
				}
			});
		}

		// 3. Extract interlinked content
		if (options.extractInterlinkedContent) {
			const interlinkedContent = _extractInterlinkedContentInBlock(postId, block);
			allInterlinkedContent.push(interlinkedContent);
		}

		// 4. Recursively process children
		const childBlocks: Block[] = [];

		// Collect all possible children
		if (block.Paragraph?.Children) childBlocks.push(...block.Paragraph.Children);
		if (block.Heading1?.Children) childBlocks.push(...block.Heading1.Children);
		if (block.Heading2?.Children) childBlocks.push(...block.Heading2.Children);
		if (block.Heading3?.Children) childBlocks.push(...block.Heading3.Children);
		if (block.Quote?.Children) childBlocks.push(...block.Quote.Children);
		if (block.Callout?.Children) childBlocks.push(...block.Callout.Children);
		if (block.Toggle?.Children) childBlocks.push(...block.Toggle.Children);
		if (block.BulletedListItem?.Children) childBlocks.push(...block.BulletedListItem.Children);
		if (block.NumberedListItem?.Children) childBlocks.push(...block.NumberedListItem.Children);
		if (block.ToDo?.Children) childBlocks.push(...block.ToDo.Children);
		if (block.SyncedBlock?.Children) childBlocks.push(...block.SyncedBlock.Children);
		if (block.Table?.Children) childBlocks.push(...block.Table.Children);

		// Recurse into children
		childBlocks.forEach(processBlock);

		// Handle column lists specially
		if (block.ColumnList?.Columns) {
			block.ColumnList.Columns.forEach((column) => {
				if (column.Children) {
					column.Children.forEach(processBlock);
				}
			});
		}

		// Also process footnote content blocks (for footnotes, interlinked content, etc.)
		if (block.Footnotes) {
			block.Footnotes.forEach((footnote) => {
				if (footnote.Content.Type === "blocks" && footnote.Content.Blocks) {
					footnote.Content.Blocks.forEach(processBlock);
				}
			});
		}
	}

	// Process all top-level blocks
	blocks.forEach(processBlock);

	// Post-processing for footnotes
	let footnotes: Footnote[] = [];
	if (options.extractFootnotes) {
		// Remove duplicates based on Marker
		const uniqueFootnotes = Array.from(new Map(allFootnotes.map((fn) => [fn.Marker, fn])).values());

		// Sort by Index
		uniqueFootnotes.sort((a, b) => {
			if (a.Index && b.Index) {
				return a.Index - b.Index;
			}
			return a.Marker.localeCompare(b.Marker);
		});

		footnotes = uniqueFootnotes;
	}

	// Post-processing for citations
	let citations: Citation[] = [];
	if (options.extractCitations) {
		citations = Array.from(citationMap.values());
		citations = prepareBibliography(citations);
	}

	return {
		footnotes,
		citations,
		interlinkedContent: allInterlinkedContent,
	};
}
