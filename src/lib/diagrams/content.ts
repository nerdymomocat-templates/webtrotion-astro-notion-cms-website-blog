import { DomUtils } from "htmlparser2";
import { Element, Text, type AnyNode } from "domhandler";
import { parseNotionPageLink } from "../notion/urls.ts";

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
	if (href.startsWith("//")) return null;
	let url: URL;
	try {
		url = new URL(href, "https://app.notion.com");
	} catch {
		return null;
	}
	// Published Notion sites use the same page and block IDs as app links.
	if (url.hostname.endsWith(".notion.site")) url.hostname = "app.notion.com";
	const link = parseNotionPageLink(url.href);
	return link ? { pageId: link.PageId, blockId: link.BlockId || "" } : null;
}

export async function buildDiagramLinkMap(
	source: string,
	resolve: (href: string) => Promise<string>,
) {
	// Find quoted URL candidates, including relative /paths. URL parsing above validates
	// the host and Notion ID before any candidate is resolved.
	const quotedUrl = /["'](?<url>(?:https?:\/\/|\/)[^\s"'<>]+)["']/gi;
	const urls = new Set(Array.from(source.matchAll(quotedUrl), (match) => match.groups!.url!));
	const map: Record<string, string> = {};
	for (const url of urls) {
		if (!parseDiagramNotionLink(url)) continue;
		const href = await resolve(url);
		if (href !== url) {
			map[url] = href;
			// Pele normalizes absolute URLs before writing SVG href attributes.
			if (!url.startsWith("/")) map[new URL(url).href] = href;
		}
	}
	return map;
}
