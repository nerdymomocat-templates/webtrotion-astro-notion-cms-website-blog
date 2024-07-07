import rss from "@astrojs/rss";
// import { siteConfig } from "@/site-config";
import { getAllPosts, getDatabase } from "@/lib/notion/client";
import { getPostLink } from "../lib/blog-helpers";
import { HIDE_UNDERSCORE_SLUGS_IN_LISTS } from "@/constants";

export const GET = async () => {
	const [posts, database] = await Promise.all([getAllPosts(), getDatabase()]);

	// Filter posts if HIDE_UNDERSCORE_SLUGS_IN_LISTS is true
	const filteredPosts = HIDE_UNDERSCORE_SLUGS_IN_LISTS
		? posts.filter((post) => !post.Slug.startsWith("_"))
		: posts;

	return rss({
		title: database.Title,
		description: database.Description,
		site: import.meta.env.SITE,
		items: filteredPosts.map((post) => ({
			title: post.Title,
			description: post.Excerpt,
			pubDate: new Date(post.LastUpdatedDate),
			link: new URL(getPostLink(post.Slug), import.meta.env.SITE).toString(),
		})),
	});
};
