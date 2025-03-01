//NOTE ADDED
import { getAllPages, getDatabase } from "@/lib/notion/client";
import type { Block, BlockTypes } from "@/lib/interfaces";
import { MENU_PAGES_COLLECTION, HOME_PAGE_SLUG } from "@/constants";
import { slugify } from "@/utils/slugify";
import { getNavLink } from "@/lib/blog-helpers";
export { getFormattedDate, getFormattedDateWithTime, areDifferentDates } from "@/utils/date";
export { generateToc, buildHeadings } from "@/utils/generateToc";
export type { TocItem } from "@/utils/generateToc";
export { getWebmentionsForUrl } from "@/utils/webmentions";
export { slugify } from "@/utils/slugify";

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
