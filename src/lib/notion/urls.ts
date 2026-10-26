import type { InterlinkedContent } from "../interfaces";

const NOTION_APP_HOSTS = new Set([
	"app.notion.com",
	"notion.com",
	"www.notion.com",
	"notion.so",
	"www.notion.so",
]);
const UUID_PATTERN =
	"(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";
const PAGE_ID_PATTERN = new RegExp(`(?:^|-)(${UUID_PATTERN})$`, "i");
const BLOCK_ID_PATTERN = new RegExp(`^${UUID_PATTERN}$`, "i");

export function isNotionAppUrl(url: URL): boolean {
	return (
		["https:", "http:"].includes(url.protocol) &&
		NOTION_APP_HOSTS.has(url.hostname) &&
		!url.username &&
		!url.password &&
		!url.port
	);
}

function normalizeId(id: string): string {
	return id
		.replace(/-/g, "")
		.toLowerCase()
		.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

export function parseNotionPageLink(href: string | null | undefined): InterlinkedContent | null {
	if (!href || href.startsWith("//")) return null;

	try {
		const url = href.startsWith("/") ? new URL(href, "https://app.notion.com") : new URL(href);
		if (!isNotionAppUrl(url)) return null;

		const segments = url.pathname.replace(/\/$/, "").split("/").slice(1);
		if (segments[0] === "ebd" || segments[0] === "icons") return null;
		if (segments[0] === "p") segments.shift();
		if (segments.length < 1 || segments.length > 2 || segments.some((part) => !part)) {
			return null;
		}

		const pageId = segments[segments.length - 1]?.match(PAGE_ID_PATTERN)?.[1];
		if (!pageId) return null;

		const fragment = url.hash.slice(1);
		const blockId = BLOCK_ID_PATTERN.test(fragment) ? normalizeId(fragment) : undefined;
		return {
			PageId: normalizeId(pageId),
			Type: blockId ? "block" : "page",
			...(blockId ? { BlockId: blockId } : {}),
		};
	} catch {
		return null;
	}
}
