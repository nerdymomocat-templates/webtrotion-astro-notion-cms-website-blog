import path from "node:path";
import { parseDocument, DomUtils } from "htmlparser2";
import type { Document, Element } from "domhandler";
import type { ExternalContentDescriptor } from "@/lib/interfaces";
import type { Heading } from "@/types";
import { slugify } from "../../utils/slugify";

export type HtmlTransformResult = {
	html: string;
	headings: Heading[];
};

const ASSET_ATTRS: Record<string, string[]> = {
	img: ["src", "data-src", "data-large-src"],
	source: ["src", "srcset"],
	video: ["src", "poster"],
	audio: ["src"],
	script: ["src"],
	iframe: ["src"],
	link: ["href"],
};

const RELATIVE_PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/;

export function isRelativePath(value: string): boolean {
	if (!value) return false;
	const trimmed = value.trim();
	if (!trimmed) return false;
	if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) return false;
	if (trimmed.startsWith("//")) return false;
	if (trimmed.startsWith("data:") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
		return false;
	}
	return !RELATIVE_PROTOCOL_REGEX.test(trimmed);
}

export function toPublicUrl(relativePath: string, descriptor: ExternalContentDescriptor): string {
	if (!relativePath) return relativePath;
	const [pathPart, suffix] = relativePath.split(/(?=[?#])/);
	const normalized = path.posix.normalize(pathPart.replace(/^.\//, ""));
	const joined = path.posix.join("/external-posts", descriptor.folderName, normalized);
	return suffix ? `${joined}${suffix}` : joined;
}

function rewriteSrcset(value: string, descriptor: ExternalContentDescriptor): string {
	return value
		.split(",")
		.map((entry) => {
			const trimmed = entry.trim();
			if (!trimmed) return trimmed;
			const [url, descriptorPart] = trimmed.split(/\s+/, 2);
			const rewritten = isRelativePath(url) ? toPublicUrl(url, descriptor) : url;
			return descriptorPart ? `${rewritten} ${descriptorPart}` : rewritten;
		})
		.join(", ");
}

function rewriteAssets(root: Document | Element, descriptor: ExternalContentDescriptor) {
	const elements = DomUtils.findAll(
		(elem) => elem.type === "tag" && !!ASSET_ATTRS[elem.name],
		root.children,
		true,
	);

	for (const elem of elements) {
		const targetAttrs = ASSET_ATTRS[elem.name] || [];
		for (const attrName of targetAttrs) {
			const value = elem.attribs?.[attrName];
			if (!value) continue;

			if (attrName === "srcset") {
				elem.attribs[attrName] = rewriteSrcset(value, descriptor);
				continue;
			}

			if (isRelativePath(value)) {
				elem.attribs[attrName] = toPublicUrl(value, descriptor);
			}
		}
	}
}

function extractHeadings(root: Document | Element): Heading[] {
	const headingTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
	const headingElements = DomUtils.findAll(
		(elem) => elem.type === "tag" && headingTags.has(elem.name),
		root.children,
		true,
	);

	return headingElements
		.map((elem) => {
			const depth = parseInt(elem.name.replace("h", ""), 10);
			const text = DomUtils.textContent(elem).trim();
			if (!text) return null;
			const existingId = elem.attribs?.id;
			const headingSlug = existingId || slugify(text);
			elem.attribs = {
				...elem.attribs,
				id: headingSlug,
			};
			return { text, slug: headingSlug, depth };
		})
		.filter(Boolean) as Heading[];
}

export function transformExternalHtml(
	rawHtml: string,
	descriptor: ExternalContentDescriptor,
	options?: { preferBodyContent?: boolean },
): HtmlTransformResult {
	const document = parseDocument(rawHtml);
	rewriteAssets(document, descriptor);
	const headings = extractHeadings(document);
	const preferBodyContent = options?.preferBodyContent !== false;
	if (preferBodyContent) {
		const bodyElement = DomUtils.findOne(
			(elem) => elem.type === "tag" && elem.name === "body",
			document.children,
			true,
		);
		const html = bodyElement ? DomUtils.getInnerHTML(bodyElement) : DomUtils.getOuterHTML(document);
		return { html, headings };
	}

	return { html: DomUtils.getOuterHTML(document), headings };
}
