//NOTE ADDED
import { getAllPages, getDatabase } from "@/lib/notion/client";
// import { siteConfig } from "@/site-config";
import type { Block, BlockTypes } from "@/lib/interfaces";
import { MENU_PAGES_COLLECTION, HOME_PAGE_SLUG } from "@/constants";
import { slugify } from "@/utils/slugify";
import { getNavLink } from "@/lib/blog-helpers";
// import { siteInfo } from "./site.config";

export { getFormattedDate, getFormattedDateWithTime, areDifferentDates } from "./date";
export { elementHasClass, toggleClass, rootHasDarkClass } from "./domElement";
// export { generateToc } from "./generateToc";
export { generateToc, buildHeadings } from "./generateToc";
export type { TocItem } from "./generateToc";
export { getWebmentionsForUrl } from "./webmentions";
export { slugify } from "./slugify";
// export { siteInfo } from "./site.config";

//NOTE ADDED FROM HERE ON

export async function getCollections() {
	const { propertiesRaw } = await getDatabase();

	return propertiesRaw.Collection.select!.options.map(({ name }) => name).filter(
		(name) => name !== MENU_PAGES_COLLECTION,
	);
}

export async function getTagsNameWDesc() {
	const { propertiesRaw } = await getDatabase();
	const options = propertiesRaw.Tags?.multi_select?.options || [];

	const mappedOptions = options.reduce((acc, option) => {
		acc[option.name] = option.description || "";
		return acc;
	}, {});

	return mappedOptions;
}

export async function getCollectionsWDesc() {
	const { propertiesRaw } = await getDatabase();

	return propertiesRaw.Collection.select!.options.filter(
		({ name }) => name !== MENU_PAGES_COLLECTION,
	).map(({ name, description }) => ({ name, description }));
}

export async function getMenu(): Promise<
	{ title: string; path: string; children?: { title: string; path: string }[] }[]
> {
	const pages = await getAllPages();
	const collections = await getCollections();
	const collectionLinks = collections.map((name) => ({
		title: name,
		path: getNavLink("/collections/" + slugify(name)),
	}));

	const pageLinks = pages
		.map((page) => ({
			...page,
			// Assign rank -1 to homePageSlug and 99 to pages with no rank
			Rank:
				page.Slug === HOME_PAGE_SLUG
					? -1
					: page.Rank === undefined || page.Rank === null
						? 99
						: page.Rank,
		}))
		.sort((a, b) => a.Rank - b.Rank)
		.map((page) => ({
			title: page.Title,
			path: getNavLink(page.Slug === HOME_PAGE_SLUG ? "/" : "/" + page.Slug),
		}));

	return [...pageLinks, ...collectionLinks];
}

const BLOCKS_FOR_WORD_COUNT: BlockTypes[] = [
	"heading_1",
	"heading_2",
	"heading_3",
	"paragraph",
	"bulleted_list_item",
	"numbered_list_item",
	"to_do",
	"callout",
	"quote",
];

type ContentBlock = {
	content: string;
	children: ContentBlock[];
};
function getSupportedBlocks(blocks: Block[]): ContentBlock[] {
	return blocks
		.filter((block) => BLOCKS_FOR_WORD_COUNT.includes(block.Type))
		.map((block) => {
			if (block.Type === "heading_1" && block.Heading1) {
				return {
					content: block.Heading1.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.Heading1?.Children || []),
				};
			}
			if (block.Type === "heading_2" && block.Heading2) {
				return {
					content: block.Heading2.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.Heading2?.Children || []),
				};
			}
			if (block.Type === "heading_3" && block.Heading3) {
				return {
					content: block.Heading3.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.Heading3?.Children || []),
				};
			}
			if (block.Type === "paragraph" && block.Paragraph) {
				return {
					content: block.Paragraph.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.Paragraph?.Children || []),
				};
			}
			if (block.Type === "bulleted_list_item" && block.BulletedListItem) {
				return {
					content: block.BulletedListItem.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.BulletedListItem?.Children || []),
				};
			}
			if (block.Type === "numbered_list_item" && block.NumberedListItem) {
				return {
					content: block.NumberedListItem.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.NumberedListItem?.Children || []),
				};
			}
			if (block.Type === "to_do" && block.ToDo) {
				return {
					content: block.ToDo.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.ToDo?.Children || []),
				};
			}
			if (block.Type === "callout" && block.Callout) {
				return {
					content: block.Callout.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.Callout?.Children || []),
				};
			}
			if (block.Type === "quote" && block.Quote) {
				return {
					content: block.Quote.RichTexts.map((text) => text.PlainText).join(" "),
					children: getSupportedBlocks(block.Quote?.Children || []),
				};
			}

			return { content: "", children: [] };
		});
}

function generateTexts(contentBlocks: ContentBlock[]): string {
	return contentBlocks
		.map((block) => {
			return block.content + "\n" + generateTexts(block.children);
		})
		.join("\n");
}

export function getPageStats(blocks: Block[]) {
	const supportedBlocks = getSupportedBlocks(blocks);
	const pageText = generateTexts(supportedBlocks);

	const wordCount = pageText.split(" ").length;

	return {
		wordCount,
		readTime: `${Math.round((wordCount / 250) * 100) / 100} min`,
	};
}
