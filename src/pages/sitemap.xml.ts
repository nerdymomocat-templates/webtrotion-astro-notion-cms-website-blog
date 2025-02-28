// import { siteConfig } from "@/site-config";
import { getAllPosts, getAllPages } from "@/lib/notion/client";
import { getPostLink } from "@/lib/blog-helpers";
import { HIDE_UNDERSCORE_SLUGS_IN_LISTS } from "@/constants";
import { getCollections } from "@/utils";
import { slugify } from "@/utils";

export const GET = async () => {
	const [posts, pages] = await Promise.all([getAllPosts(), getAllPages()]);

	// Filter posts and pages
	const filterEntries = (entries) =>
		HIDE_UNDERSCORE_SLUGS_IN_LISTS
			? entries.filter((entry) => !entry.Slug.startsWith("_"))
			: entries;

	const filteredPosts = filterEntries(posts);
	const filteredPages = filterEntries(pages);
	const collections = await getCollections();

	// Generate sitemap entries for posts and pages
	const generateEntries = (entries, isPage) =>
		entries
			.map((entry) => {
				const url = new URL(getPostLink(entry.Slug, isPage), import.meta.env.SITE).toString();
				return `<url><loc>${url}</loc></url>`;
			})
			.join("");

	const generateCollectionEntries = (collectionNames) =>
		collectionNames
			.map((collectionName) => {
				const slugifiedName = slugify(collectionName);
				const path = getPostLink(`collections/${slugifiedName}`, true);
				const url = new URL(path, import.meta.env.SITE).toString();
				return `<url><loc>${url}</loc></url>`;
			})
			.join("");

	const postEntries = generateEntries(filteredPosts, false);
	const pageEntries = generateEntries(filteredPages, true);
	const collectionEntries = generateCollectionEntries(collections);

	// Combine post and page entries
	const combinedEntries = postEntries + pageEntries + collectionEntries;

	// Construct the full sitemap
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${combinedEntries}
</urlset>`;

	// return { body: sitemap };
	return new Response(sitemap, {
		headers: {
			"Content-Type": "text/xml",
		},
	});
};
