import rss from "@astrojs/rss";
import { getAllPosts, getDataSource } from "@/lib/notion/client";
import { resolvePostHref } from "@/lib/blog-helpers";
import { HIDE_UNDERSCORE_SLUGS_IN_LISTS, AUTHOR } from "@/constants";
import { getDateObject } from "@/utils";

/**
 * Get author string for a post.
 * Uses Authors array if available, falls back to site's AUTHOR constant.
 */
function getPostAuthor(post: { Authors?: { name: string }[] | undefined }): string {
	if (post.Authors && post.Authors.length > 0) {
		return post.Authors.map((a) => a.name).join(", ");
	}
	return AUTHOR;
}

export const GET = async () => {
	const [posts, database] = await Promise.all([getAllPosts(), getDataSource()]);

	// Filter posts if HIDE_UNDERSCORE_SLUGS_IN_LISTS is true
	const filteredPosts = HIDE_UNDERSCORE_SLUGS_IN_LISTS
		? posts.filter((post) => !post.Slug.startsWith("_"))
		: posts;

	// Get site-level author (fallback)
	const siteAuthor = AUTHOR;

	return rss({
		title: database.Title,
		description: database.Description,
		site: import.meta.env.SITE,
		customData: `${siteAuthor ? `<author>${siteAuthor}</author>` : ""}
                <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
		items: filteredPosts.map((post) => {
			const postAuthor = getPostAuthor(post);
			return {
				title: post.Title,
				description: post.Excerpt,
				pubDate: getDateObject(post.LastUpdatedDate) ?? new Date(post.LastUpdatedTimeStamp),
				customData: `<lastUpdatedTimestamp>${post.LastUpdatedTimeStamp}</lastUpdatedTimestamp>${postAuthor ? `<author>${postAuthor}</author>` : ""}`,
				link: new URL(resolvePostHref(post), import.meta.env.SITE).toString(),
				categories: [
					...(post.Collection ? [post.Collection] : []),
					...(post.Tags ? post.Tags.map((tag) => tag.name) : []),
				],
			};
		}),
	});
};
