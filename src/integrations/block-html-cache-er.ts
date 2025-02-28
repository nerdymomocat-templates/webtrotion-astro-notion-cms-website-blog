import type { AstroIntegration } from "astro";
import * as fs from "fs/promises";
import * as path from "path";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { render } from "dom-serializer";
import { getAllPosts, getAllPages } from "../lib/notion/client";
import { LAST_BUILD_TIME, HOME_PAGE_SLUG } from "../constants";

const blocksHtmlCacher = (): AstroIntegration => {
	return {
		name: "blocks-html-cache-er",
		hooks: {
			"astro:build:done": async () => {
				const distDir = "dist";
				const tmpCacheDir = "./tmp/blocks-html-cache";
				await fs.mkdir(tmpCacheDir, { recursive: true });

				console.log("starting block-html-cache");
				// Retrieve posts and pages and combine into one list.
				const posts = await getAllPosts();
				const pages = await getAllPages();
				const allEntries = [...posts, ...pages];

				for (const entry of allEntries) {
					const slug = entry.Slug;
					let filePath: string;

					// Special case: if slug is the home page, map it directly to dist/index.html
					if (slug === HOME_PAGE_SLUG) {
						filePath = path.join(distDir, "index.html");
					} else {
						// Determine file path based on whether the entry is a post or a page.
						filePath =
							posts.find((p) => p.Slug === slug) !== undefined
								? path.join(distDir, "posts", slug, "index.html")
								: path.join(distDir, slug, "index.html");
					}

					const cacheFilePath = path.join(tmpCacheDir, `${slug}.html`);

					// Determine if the entry was updated before the last build.
					// (Assuming entry.LastUpdatedTimeStamp and LAST_BUILD_TIME are Date objects.)
					const postLastUpdatedBeforeLastBuild = LAST_BUILD_TIME
						? entry.LastUpdatedTimeStamp < LAST_BUILD_TIME
						: false;

					// Check if the cache file exists. If it exists and the post was last updated before the last build, skip processing.
					try {
						await fs.access(cacheFilePath);
						if (postLastUpdatedBeforeLastBuild) {
							console.log(`Skipping ${slug} (no update and cache exists)`);
							continue; // No need to update this cache.
						}
					} catch {
						// Cache file doesn't exist; we'll write it.
					}

					try {
						// Proceed to read and extract HTML only if we need to write.
						const htmlContent = await fs.readFile(filePath, "utf-8");
						const document = parseDocument(htmlContent);

						// Find the first <div> element with class "post-body"
						const divPostBody = DomUtils.findOne(
							(elem) =>
								elem.type === "tag" &&
								elem.name === "div" &&
								!!elem.attribs?.class &&
								elem.attribs.class.split(" ").includes("post-body"),
							document.children,
							true,
						);

						if (!divPostBody) {
							console.warn(`No <div class="post-body"> found for ${slug}`);
							continue;
						}

						// Use dom-serializer's render() to extract inner HTML
						const extractedHtml = render(divPostBody.children);
						await fs.writeFile(cacheFilePath, extractedHtml, "utf-8");
						console.log(`Cached ${slug} to ${cacheFilePath}`);
					} catch (error) {
						console.error(`Error processing ${slug}:`, error);
					}
				}
			},
		},
	};
};

export default blocksHtmlCacher;
