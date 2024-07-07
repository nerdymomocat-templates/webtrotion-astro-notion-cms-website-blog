import fetch from "node-fetch";
import { REQUEST_TIMEOUT_MS, HOME_PAGE_SLUG, MENU_PAGES_COLLECTION } from "../constants";
import type {
	Block,
	Heading1,
	Heading2,
	Heading3,
	RichText,
	Column,
	ReferencesInPage,
	Post,
} from "./interfaces";
import { slugify } from "../utils/slugify";
import path from "path";
import fs from "node:fs";
import { getBlock, getPostByPageId } from "./notion/client";

const BASE_PATH = import.meta.env.BASE_URL;
let referencesInPageCache: { [entryId: string]: ReferencesInPage[] } | null = null;
let referencesToPageCache: { [entryId: string]: { entryId: string; block: Block }[] } | null = null;
let firstImage = true;

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

export const filePath = (url: URL): string => {
	const [dir, filename] = url.pathname.split("/").slice(-2);
	return path.join(BASE_PATH, `/notion/${dir}/${filename}`);
	// return path.join(BASE_PATH, `./src/notion-assets/${dir}/${filename}`);
};

export const buildTimeFilePath = (url: URL): string => {
	const [dir, filename] = url.pathname.split("/").slice(-2);
	return `/notion/${dir}/${filename}`;
	// return path.join(BASE_PATH, `./src/notion-assets/${dir}/${filename}`);
};

export function getReferencesInPage(entryId: string) {
	// Load and aggregate data if referencesInPageCache is null
	if (referencesInPageCache === null) {
		referencesInPageCache = {};

		// Assuming you have a way to list all relevant JSON files in ./tmp/
		const files = fs.readdirSync("./tmp").filter((file) => file.endsWith("_ReferencesInPage.json"));

		for (const file of files) {
			const filePath = path.join("./tmp", file);
			const fileContent = fs.readFileSync(filePath, "utf-8");
			const pageId = file.replace("_ReferencesInPage.json", "");
			referencesInPageCache[pageId] = JSON.parse(fileContent);
		}
	}

	// Return the references for the given entryId, or null if not found
	return referencesInPageCache[entryId] || null;
}

export function getReferencesToPage(entryId: string) {
	// Load and aggregate data if referencesInPageCache is null
	if (referencesToPageCache === null) {
		referencesToPageCache = {};

		// Assuming you have a way to list all relevant JSON files in ./tmp/
		const files = fs.readdirSync("./tmp").filter((file) => file.endsWith("_ReferencesToPage.json"));

		for (const file of files) {
			const filePath = path.join("./tmp", file);
			const fileContent = fs.readFileSync(filePath, "utf-8");
			const pageId = file.replace("_ReferencesToPage.json", "");
			referencesToPageCache[pageId] = JSON.parse(fileContent);
		}
	}

	// Return the references for the given entryId, or null if not found
	return referencesToPageCache[entryId] || null;
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
): ReferencesInPage => ({
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
			if (!richText.InternalHref && !richText.Mention && richText.Href) {
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

const _extractReferencesInBlock = (postId: string, block: Block): ReferencesInPage => {
	//MISSING TABLE ROWS
	// console.debug("here in _extractReferencesInBlock");
	const rich_texts =
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
	let filteredRichText = _filterRichTexts(postId, block, rich_texts);
	let direct_media_link =
		block.NAudio?.External?.Url ||
		block.NAudio?.File?.OptimizedUrl ||
		block.NAudio?.File?.Url ||
		block.File?.External?.Url ||
		block.File?.File?.OptimizedUrl ||
		block.File?.File?.Url ||
		block.NImage?.External?.Url ||
		block.NImage?.File?.OptimizedUrl ||
		block.NImage?.File?.Url ||
		block.Video?.External?.Url ||
		block.Video?.File?.OptimizedUrl ||
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

export const extractReferencesInPage = (postId: string, blocks: Block[]): ReferencesInPage[] => {
	// console.debug("here in extractReferencesInPage");
	return blocks
		.reduce((acc: ReferencesInPage[], block) => {
			acc.push(_extractReferencesInBlock(postId, block));

			if (block.ColumnList && block.ColumnList.Columns) {
				acc = acc.concat(_extractReferencesFromColumns(postId, block.ColumnList.Columns));
			} else if (block.BulletedListItem && block.BulletedListItem.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.BulletedListItem.Children));
			} else if (block.NumberedListItem && block.NumberedListItem.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.NumberedListItem.Children));
			} else if (block.ToDo && block.ToDo.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.ToDo.Children));
			} else if (block.SyncedBlock && block.SyncedBlock.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.SyncedBlock.Children));
			} else if (block.Toggle && block.Toggle.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.Toggle.Children));
			} else if (block.Paragraph && block.Paragraph.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.Paragraph.Children));
			} else if (block.Heading1 && block.Heading1.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.Heading1.Children));
			} else if (block.Heading2 && block.Heading2.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.Heading2.Children));
			} else if (block.Heading3 && block.Heading3.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.Heading3.Children));
			} else if (block.Quote && block.Quote.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.Quote.Children));
			} else if (block.Callout && block.Callout.Children) {
				acc = acc.concat(extractReferencesInPage(postId, block.Callout.Children));
			}

			return acc;
		}, [])
		.flat();
};

const _extractReferencesFromColumns = (postId: string, columns: Column[]): ReferencesInPage[] => {
	return columns
		.reduce((acc: ReferencesInPage[], column) => {
			if (column.Children) {
				acc = acc.concat(extractReferencesInPage(postId, column.Children));
			}
			return acc;
		}, [])
		.flat();
};

export const buildURLToHTMLMap = async (urls: URL[]): Promise<{ [key: string]: string }> => {
	const htmls: string[] = await Promise.all(
		urls.map(async (url: URL) => {
			const controller = new AbortController();
			const timeout = setTimeout(() => {
				controller.abort();
			}, REQUEST_TIMEOUT_MS);

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

export const getStaticFilePath = (pathsup: string): string => {
	return path.join(BASE_PATH, pathsup);
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
	blocklinked: any | null;
	conditionmatch: string | null;
	post: Post | null;
}> => {
	let block_linked = null;
	let block_linked_id = null;
	let post: Post | null = null;
	let pageId = null;

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
		}
	}

	if (richText.Href && !richText.Mention && !richText.InternalHref) {
		return {
			hreflink: richText.Href,
			blocklinked: block_linked,
			conditionmatch: "external",
			post: post,
		};
	} else if (block_linked_id && post) {
		return {
			hreflink: `${getPostLink(post.Slug, post.Collection === MENU_PAGES_COLLECTION)}/#${block_linked_id}`,
			blocklinked: block_linked,
			conditionmatch: "block_current_or_other_page",
			post: post,
		};
	} else if (post) {
		return {
			hreflink: getPostLink(post.Slug, post.Collection === MENU_PAGES_COLLECTION),
			blocklinked: block_linked,
			conditionmatch: "other_page",
			post: post,
		};
	}
	return { hreflink: null, blocklinked: null, conditionmatch: "no_match", post: null };
};

export const getReferenceLink = async (
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

	if (
		block_linked_id &&
		((linkedpost && current_page_id && linkedPageId == current_page_id) || currentOverride)
	) {
		return [`#${block_linked_id}`, linkedpost];
	} else if (block_linked_id && linkedpost) {
		return [
			`${getPostLink(linkedpost.Slug, linkedpost.Collection === MENU_PAGES_COLLECTION)}#${block_linked_id}`,
			linkedpost,
		];
	} else if (linkedpost) {
		return [
			getPostLink(linkedpost.Slug, linkedpost.Collection === MENU_PAGES_COLLECTION),
			linkedpost,
		];
	}
	return [null, null];
};

export const getPostLink = (slug: string, isRoot: boolean = false) => {
	const linkedPath = isRoot
		? slug === HOME_PAGE_SLUG
			? path.join(BASE_PATH, `/`)
			: path.join(BASE_PATH, `/${slug}`)
		: path.join(BASE_PATH, `/posts/${slug}`);
	return linkedPath;
};

export const getTagLink = (tag: string) => {
	return path.join(BASE_PATH, `/posts/tag/${encodeURIComponent(tag)}`);
};

export const getPageLink = (page: number, tag: string) => {
	if (page === 1) {
		return tag ? getTagLink(tag) : path.join(BASE_PATH, "/");
	}
	return tag
		? path.join(BASE_PATH, `/posts/tag/${encodeURIComponent(tag)}/page/${page.toString()}`)
		: path.join(BASE_PATH, `/posts/page/${page.toString()}`);
};

export const getDateStr = (date: string) => {
	const dt = new Date(date);

	if (date.indexOf("T") !== -1) {
		// Consider timezone
		const elements = date.split("T")[1].split(/([+-])/);
		if (elements.length > 1) {
			const diff = parseInt(`${elements[1]}${elements[2]}`, 10);
			dt.setHours(dt.getHours() + diff);
		}
	}

	const y = dt.getFullYear();
	const m = ("00" + (dt.getMonth() + 1)).slice(-2);
	const d = ("00" + dt.getDate()).slice(-2);
	return y + "-" + m + "-" + d;
};

export const buildHeadingId = (heading: Heading1 | Heading2 | Heading3) => {
	return slugify(
		heading.RichTexts.map((richText: RichText) => {
			if (!richText.Text) {
				return "";
			}
			return richText.Text.Content;
		})
			.join()
			.trim(),
	);
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
		const response = await fetch(urlString, { method: "HEAD" });
		const xFrameOptions = response.headers.get("x-frame-options");
		const contentSecurityPolicy = response.headers.get("content-security-policy");

		if (
			xFrameOptions &&
			(xFrameOptions.toLowerCase() === "deny" || xFrameOptions.toLowerCase() === "sameorigin")
		) {
			return false;
		}

		if (contentSecurityPolicy && contentSecurityPolicy.includes("frame-ancestors")) {
			// Further parsing might be required here to interpret the CSP policy
			return false;
		}

		return true;
	} catch (error) {
		console.error("Error checking URL: ", error);
		return false;
	}
};
