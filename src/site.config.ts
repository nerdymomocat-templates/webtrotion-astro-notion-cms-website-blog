import { getDatabase } from "@/lib/notion/client";
// import { getNavLink, getSite } from "@/lib/blog-helpers";
import type { SiteConfig } from "@/types";
import { AUTHOR, WEBMENTION_LINK, HOME_PAGE_SLUG } from "./constants";

const tl = "",
	ds = "",
	path = "/",
	oim = "";
const database = await getDatabase();

const siteTitle = tl ? `${tl} - ${database.Title}` : database.Title;
const siteDescription = ds ? ds : database.Description;

export const siteInfo: SiteConfig = {
	title: siteTitle,
	description: siteDescription,
	author: AUTHOR,
	lang: "en",
	homePageSlug: HOME_PAGE_SLUG,
	// Meta property, found in src/components/BaseHead.astro L:42
	ogLocale: "en",
	// Date.prototype.toLocaleDateString() parameters, found in src/utils/date.ts.
	date: {
		locale: "en",
		options: {
			day: "numeric",
			month: "short",
			year: "numeric",
		},
	},
	webmentions: {
		link: WEBMENTION_LINK,
		// link: "https://webmention.io/astro-cactus.chriswilliams.dev/webmention",
		// site: "https://astro-cactus.chriswilliams.dev/",
	},
	logo: database.Icon || null,
};
