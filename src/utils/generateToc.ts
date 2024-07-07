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

export function buildHeadings(blocks: Block[]) {
	// console.log(blocks);
	return blocks.filter((block) => HEADING_BLOCKS.includes(block.Type)).map(cleanHeading);
}
