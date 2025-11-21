import fs from "node:fs";
import path from "node:path";
import type { Block, Post, Footnote, Citation, InterlinkedContentInPage } from "@/lib/interfaces";
import type { Heading } from "@/types";
import { EXTERNAL_CONTENT_PATHS, CITATIONS, BIBTEX_CITATIONS_ENABLED } from "@/constants";
import { buildMarkdownBlocks } from "./markdown-block-builder";
import { buildHeadings } from "@/utils";
import { extractPageContent } from "@/lib/blog-helpers";
import { adjustedFootnotesConfig, getBibEntriesCacheSnapshot } from "@/lib/notion/client";
import { extractCitationsFromBlock } from "@/lib/citations";
import {
	loadExternalRenderCache,
	readExternalFolderVersion,
	extractHeadingsFromHtml,
} from "./external-render-cache";

export type MarkdownRenderResult = {
	blocks: Block[];
	headings: Heading[];
	footnotes: Footnote[] | null;
	citations: Citation[] | null;
	interlinkedContent: InterlinkedContentInPage[] | null;
	cachedHtml?: string | null;
};

export async function renderExternalMarkdown(post: Post): Promise<MarkdownRenderResult> {
	const descriptor = post.ExternalContent;
	if (!descriptor || descriptor.type !== "markdown") {
		return { blocks: [], headings: [], footnotes: null, citations: null, interlinkedContent: null };
	}

	const entryDir = path.join(EXTERNAL_CONTENT_PATHS.externalPosts, descriptor.folderName);
	const entryPath = path.join(entryDir, "index.md");
	if (!fs.existsSync(entryPath)) {
		console.warn(
			`[external-content] Missing index.md for external post "${post.Slug}" at ${entryPath}`,
		);
		return { blocks: [], headings: [], footnotes: null, citations: null, interlinkedContent: null };
	}

	const version = readExternalFolderVersion(descriptor);
	const cached = loadExternalRenderCache(descriptor, version);
	if (cached) {
		const headings =
			cached.meta.headings && cached.meta.headings.length
				? cached.meta.headings
				: extractHeadingsFromHtml(cached.html);
		return {
			blocks: [],
			headings,
			footnotes: null,
			citations: null,
			interlinkedContent: null,
			cachedHtml: cached.html,
		};
	}

	let fileContents = "";
	try {
		fileContents = fs.readFileSync(entryPath, "utf-8");
	} catch (error) {
		console.warn(
			`[external-content] Failed to read Markdown file for "${post.Slug}" (${entryPath})`,
			error,
		);
		return { blocks: [], headings: [], footnotes: null, citations: null, interlinkedContent: null };
	}

	const blocks = buildMarkdownBlocks(fileContents, { post, descriptor });
	if (!blocks.length) {
		return { blocks: [], headings: [], footnotes: null, citations: null, interlinkedContent: null };
	}

	if (BIBTEX_CITATIONS_ENABLED && CITATIONS) {
		const bibEntries = getBibEntriesCacheSnapshot();
		if (bibEntries && bibEntries.size > 0) {
			const walk = (items: Block[]) => {
				for (const block of items) {
					const result = extractCitationsFromBlock(block, CITATIONS, bibEntries);
					if (result.citations.length) {
						block.Citations = result.citations;
					}
					const children = getChildBlocks(block);
					if (children.length) walk(children);
				}
			};
			walk(blocks);
		}
	}

	const extraction = extractPageContent(post.PageId, blocks, {
		extractFootnotes: adjustedFootnotesConfig?.["in-page-footnotes-settings"]?.enabled === true,
		extractCitations: BIBTEX_CITATIONS_ENABLED && !!CITATIONS,
		extractInterlinkedContent: true,
	});

	const headings = buildHeadings(blocks);

	return {
		blocks,
		headings,
		footnotes: extraction.footnotes.length ? extraction.footnotes : null,
		citations: extraction.citations.length ? extraction.citations : null,
		interlinkedContent:
			extraction.interlinkedContent.length > 0 ? extraction.interlinkedContent : null,
	};
}

function getChildBlocks(block: Block): Block[] {
	const children: Block[] = [];
	const pushChildren = (maybe?: Block[]) => {
		if (maybe && maybe.length) children.push(...maybe);
	};

	pushChildren(block.Paragraph?.Children);
	pushChildren(block.Heading1?.Children);
	pushChildren(block.Heading2?.Children);
	pushChildren(block.Heading3?.Children);
	pushChildren(block.Quote?.Children);
	pushChildren(block.Callout?.Children);
	pushChildren(block.Toggle?.Children);
	pushChildren(block.BulletedListItem?.Children);
	pushChildren(block.NumberedListItem?.Children);
	pushChildren(block.ToDo?.Children);
	pushChildren(block.SyncedBlock?.Children);
	pushChildren(block.Table?.Children);
	if (block.ColumnList?.Columns) {
		block.ColumnList.Columns.forEach((col) => pushChildren(col.Children));
	}
	return children;
}
