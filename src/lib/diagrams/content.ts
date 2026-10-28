import { DomUtils } from "htmlparser2";
import { Element, Text, type AnyNode } from "domhandler";

/** Markdown exports retain the source; feed diagrams without an SVG also keep it. */
export function restoreDiagramSources(root: AnyNode) {
	const diagrams = DomUtils.findAll(
		(element) => Object.prototype.hasOwnProperty.call(element.attribs, "data-diagram-source"),
		[root],
	);
	for (const diagram of diagrams) {
		const text = new Text(diagram.attribs["data-diagram-source"]!);
		const code = new Element("code", { class: "language-mermaid" }, [text]);
		const pre = new Element("pre", { "data-language": "mermaid" }, [code]);
		text.parent = code;
		code.parent = pre;
		DomUtils.replaceElement(diagram, pre);
	}
}

/** Recognize the Notion page links authors can put in Mermaid click statements. */
export function parseDiagramNotionLink(href: string) {
	let url: URL;
	try {
		url = new URL(href, "https://www.notion.so");
	} catch {
		return null;
	}
	if (
		!["http:", "https:"].includes(url.protocol) ||
		!(
			url.hostname === "notion.so" ||
			url.hostname === "www.notion.so" ||
			url.hostname === "app.notion.com" ||
			url.hostname.endsWith(".notion.site")
		)
	)
		return null;
	const lastSegment = url.pathname.split("/").filter(Boolean).pop() || "";
	const slugParts = lastSegment.split("-");
	const pageId =
		notionIdToUuid(lastSegment) ||
		notionIdToUuid(slugParts[slugParts.length - 1] || "") ||
		notionIdToUuid(slugParts.slice(-5).join("-"));
	if (!pageId) return null;
	const hash = url.hash.slice(1);
	return {
		pageId,
		blockId: notionIdToUuid(hash) || hash,
	};
}

export function notionIdToUuid(value: string): string | null {
	const groups = value.split("-");
	const uuidGroupLengths = [8, 4, 4, 4, 12];
	if (
		groups.length !== 1 &&
		(groups.length !== uuidGroupLengths.length ||
			groups.some((group, index) => group.length !== uuidGroupLengths[index]))
	)
		return null;
	const compact = groups.join("").toLowerCase();
	// Notion URLs use 32 hexadecimal digits; API calls use the same digits grouped 8-4-4-4-12.
	if (!/^[0-9a-f]{32}$/.test(compact)) return null;
	return [
		compact.slice(0, 8),
		compact.slice(8, 12),
		compact.slice(12, 16),
		compact.slice(16, 20),
		compact.slice(20),
	].join("-");
}

export async function buildDiagramLinkMap(
	source: string,
	resolve: (href: string) => Promise<string>,
) {
	// Find quoted URL candidates, including relative /paths. URL parsing above validates
	// the host and Notion ID before any candidate is resolved.
	const quotedUrl = /["'](?<url>(?:https?:\/\/|\/)[^\s"'<>]+)["']/g;
	const urls = new Set(Array.from(source.matchAll(quotedUrl), (match) => match.groups!.url!));
	const map: Record<string, string> = {};
	for (const url of urls) {
		if (!parseDiagramNotionLink(url)) continue;
		const href = await resolve(url);
		if (href !== url) map[url] = href;
	}
	return map;
}
