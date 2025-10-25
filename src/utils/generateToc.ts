import type { MarkdownHeading } from "astro";
//ADDED
import { HEADING_BLOCKS } from "@/constants";
import type { Block } from "@/lib/interfaces";
import type { Heading } from "@/types";
import { slugify } from "@/utils/slugify";

export interface TocItem extends MarkdownHeading {
	subheadings: Array<TocItem>;
}

function diveChildren(item: TocItem, depth: number): Array<TocItem> {
	//NOTE: That did not work -> change to 0 I guess because headings 2 are not being indented
	if (depth === 1 || !item.subheadings.length) {
		return item.subheadings;
	} else {
		// e.g., 2
		return diveChildren(item.subheadings[item.subheadings.length - 1] as TocItem, depth - 1);
	}
}

export function generateToc(headings: ReadonlyArray<MarkdownHeading>) {
	//NOTE: commented this because it was skipping h2s in our setup
	const toc: Array<TocItem> = [];

	headings.forEach((h) => {
		const heading: TocItem = { ...h, subheadings: [] };
		let ignore = false;

		//NOTE: changed it to 1 for top level
		if (heading.depth === 1) {
			toc.push(heading);
		} else {
			const lastItemInToc = toc ? toc[toc.length - 1]! : null;
			if (!lastItemInToc || heading.depth < lastItemInToc.depth) {
				console.log(`Orphan heading found: ${heading.text}.`);
				ignore = true;
			}
			if (!ignore) {
				const gap = heading.depth - lastItemInToc.depth;
				const target = diveChildren(lastItemInToc, gap);
				target.push(heading);
			}
		}
	});
	// console.log(toc);
	return toc;
}

//ADDED

function cleanHeading(heading: Block): Heading {
	let text = "";
	let depth = 0;
	if (heading.Type === "heading_1" && heading.Heading1) {
		text = heading.Heading1?.RichTexts.map((richText) => richText.PlainText).join(" ");
		depth = 1;
	}
	if (heading.Type === "heading_2" && heading.Heading2) {
		text = heading.Heading2?.RichTexts.map((richText) => richText.PlainText).join(" ");
		depth = 2;
	}
	if (heading.Type === "heading_3" && heading.Heading3) {
		text = heading.Heading3?.RichTexts.map((richText) => richText.PlainText).join(" ");
		depth = 3;
	}

	return { text, slug: slugify(text), depth };
}

export function buildHeadings(blocks: Block[]): Heading[] | [] | null {
	const headingBlocks: Block[] = [];

	blocks.forEach((block) => {
		// Extract page-level headings
		if (HEADING_BLOCKS.includes(block.Type)) {
			headingBlocks.push(block);
		}

		// Extract headings that are direct children (1 level deep) of special blocks
		// This includes headings inside toggles, callouts, columns, and toggleable headings
		// Note: Only direct children are extracted, NOT nested deeper than 1 level
		if (
			block.Type === "toggle" ||
			block.Type === "column_list" ||
			block.Type === "callout" ||
			(block.Type === "heading_1" && block.Heading1?.IsToggleable) ||
			(block.Type === "heading_2" && block.Heading2?.IsToggleable) ||
			(block.Type === "heading_3" && block.Heading3?.IsToggleable)
		) {
			const childHeadings = getChildHeadings(block);
			headingBlocks.push(...childHeadings);
		}
	});

	return headingBlocks.map(cleanHeading);
}

/**
 * Extracts headings that are DIRECT CHILDREN (1 level deep) of special container blocks.
 *
 * Examples:
 * ✅ Page → Callout → Heading (direct child, INCLUDED)
 * ✅ Page → Toggle → Heading (direct child, INCLUDED)
 * ❌ Page → Callout → Toggle → Heading (2 levels deep, NOT INCLUDED)
 * ❌ Page → Toggle → Callout → Heading (2 levels deep, NOT INCLUDED)
 *
 * This function uses .filter() on the Children array to find only direct heading children,
 * ensuring it does NOT recurse into nested structures.
 */
function getChildHeadings(block: Block): Block[] {
	const childHeadings: Block[] = [];

	if (block.Type === "toggle" && block.Toggle?.Children) {
		// Extract headings that are direct children of toggle blocks
		childHeadings.push(
			...block.Toggle.Children.filter((child) => HEADING_BLOCKS.includes(child.Type)),
		);
	} else if (block.Type === "column_list" && block.ColumnList?.Columns) {
		// Extract headings that are direct children of each column
		block.ColumnList.Columns.forEach((column) => {
			if (column.Children) {
				childHeadings.push(
					...column.Children.filter((child) => HEADING_BLOCKS.includes(child.Type)),
				);
			}
		});
	} else if (block.Type === "callout" && block.Callout?.Children) {
		// Extract headings that are direct children of callout blocks
		childHeadings.push(
			...block.Callout.Children.filter((child) => HEADING_BLOCKS.includes(child.Type)),
		);
	} else if (
		block.Type === "heading_1" &&
		block.Heading1?.IsToggleable &&
		block.Heading1.Children
	) {
		// Extract headings that are direct children of toggleable H1 headings
		childHeadings.push(
			...block.Heading1.Children.filter((child) => HEADING_BLOCKS.includes(child.Type)),
		);
	} else if (
		block.Type === "heading_2" &&
		block.Heading2?.IsToggleable &&
		block.Heading2.Children
	) {
		// Extract headings that are direct children of toggleable H2 headings
		childHeadings.push(
			...block.Heading2.Children.filter((child) => HEADING_BLOCKS.includes(child.Type)),
		);
	} else if (
		block.Type === "heading_3" &&
		block.Heading3?.IsToggleable &&
		block.Heading3.Children
	) {
		// Extract headings that are direct children of toggleable H3 headings
		childHeadings.push(
			...block.Heading3.Children.filter((child) => HEADING_BLOCKS.includes(child.Type)),
		);
	}

	return childHeadings;
}
