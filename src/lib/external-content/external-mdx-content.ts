import fs from "node:fs";
import path from "node:path";
import type { Block, Post, Footnote, Citation, InterlinkedContentInPage } from "@/lib/interfaces";
import type { Heading } from "@/types";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import { EXTERNAL_CONTENT_PATHS, CITATIONS, BIBTEX_CITATIONS_ENABLED } from "@/constants";
import { buildMarkdownBlocks } from "./markdown-block-builder";
import { buildHeadings } from "@/utils";
import { extractPageContent } from "@/lib/blog-helpers";
import { adjustedFootnotesConfig, getBibEntriesCacheSnapshot } from "@/lib/notion/client";
import { extractCitationsFromBlock } from "@/lib/citations";

function ensureBlankLineAfterImports(source: string): string {
	const lines = source.split(/\r?\n/);
	let idx = 0;
	let sawImport = false;

	while (idx < lines.length) {
		const trimmed = lines[idx].trim();
		if (!trimmed) {
			if (!sawImport) {
				idx += 1;
				continue;
			}
			break;
		}
		if (/^(import|export)\s/.test(trimmed)) {
			sawImport = true;
			idx += 1;
			continue;
		}
		break;
	}

	if (!sawImport) return source;
	if (idx >= lines.length) return source;
	if (lines[idx].trim() === "") return source;

	lines.splice(idx, 0, "");
	return lines.join("\n");
}

type ExternalMdxModule = {
	default: AstroComponentFactory;
	components?: Record<string, any>;
};

const mdxModules = import.meta.glob<ExternalMdxModule>("/src/external-posts/*/index.mdx");

export type ExternalMdxRenderResult = {
	Component: AstroComponentFactory | null;
	mdxComponents: Record<string, any>;
	blocks: Block[];
	headings: Heading[];
	footnotes: Footnote[] | null;
	citations: Citation[] | null;
	interlinkedContent: InterlinkedContentInPage[] | null;
};

function getMdxModule(folderName: string) {
	const targetSuffix = `/src/external-posts/${folderName}/index.mdx`;
	for (const [key, loader] of Object.entries(mdxModules)) {
		if (key.endsWith(targetSuffix)) {
			return loader;
		}
	}
	return null;
}

export async function renderExternalMdx(post: Post): Promise<ExternalMdxRenderResult> {
	const descriptor = post.ExternalContent;
	if (!descriptor || descriptor.type !== "mdx") {
		return {
			Component: null,
			mdxComponents: {},
			blocks: [],
			headings: [],
			footnotes: null,
			citations: null,
			interlinkedContent: null,
		};
	}

	const entryDir = path.join(EXTERNAL_CONTENT_PATHS.externalPosts, descriptor.folderName);
	const entryPath = path.join(entryDir, "index.mdx");
	if (!fs.existsSync(entryPath)) {
		console.warn(
			`[external-content] Missing index.mdx for external post "${post.Slug}" at ${entryPath}`,
		);
		return {
			Component: null,
			mdxComponents: {},
			blocks: [],
			headings: [],
			footnotes: null,
			citations: null,
			interlinkedContent: null,
		};
	}

	let fileContents = "";
	try {
		fileContents = ensureBlankLineAfterImports(fs.readFileSync(entryPath, "utf-8"));
	} catch (error) {
		console.warn(
			`[external-content] Failed to read MDX file for "${post.Slug}" (${entryPath})`,
			error,
		);
		return {
			Component: null,
			mdxComponents: {},
			blocks: [],
			headings: [],
			footnotes: null,
			citations: null,
			interlinkedContent: null,
		};
	}

	const blocks = buildMarkdownBlocks(fileContents, { post, descriptor, allowMdx: true });
	if (!blocks.length) {
		return {
			Component: null,
			mdxComponents: {},
			blocks: [],
			headings: [],
			footnotes: null,
			citations: null,
			interlinkedContent: null,
		};
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

	let Component: AstroComponentFactory | null = null;
	let mdxComponents: Record<string, any> = {};
	const loader = getMdxModule(descriptor.folderName);
	if (!loader) {
		console.warn(
			`[external-content] Missing index.mdx module for external post "${post.Slug}" in folder "${descriptor.folderName}".`,
		);
	} else {
		try {
			const mod = await loader();
			Component = mod.default || null;
			mdxComponents = mod.components || {};
		} catch (error) {
			console.warn(
				`[external-content] Failed to load MDX module for "${post.Slug}" (${descriptor.folderName}).`,
				error,
			);
		}
	}

	return {
		Component,
		mdxComponents,
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
