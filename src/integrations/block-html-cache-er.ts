import type { AstroIntegration } from "astro";
import * as fs from "fs/promises";
import * as path from "path";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { render } from "dom-serializer";
import { getAllPosts, getAllPages } from "../lib/notion/client";
import { LAST_BUILD_TIME, HOME_PAGE_SLUG, BUILD_FOLDER_PATHS } from "../constants";

const blocksHtmlCacher = (): AstroIntegration => {
	return {
		name: "blocks-html-cache-er",
		hooks: {
			"astro:build:done": async () => {
				const distDir = "dist";
				const tmpBlocksCacheDir = BUILD_FOLDER_PATHS["blocksHtmlCache"];
				const tmpReferencesCacheDir = BUILD_FOLDER_PATHS["referencesHtmlCache"];

				console.log("Starting blocks-html-cache and references-html-cache");
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

					const blocksCacheFilePath = path.join(tmpBlocksCacheDir, `${slug}.html`);
					const staticReferencesCacheFilePath = path.join(
						tmpReferencesCacheDir,
						`${slug}-static.html`,
					);
					const postLastUpdatedBeforeLastBuild = LAST_BUILD_TIME
						? entry.LastUpdatedTimeStamp < LAST_BUILD_TIME
						: false;

					// Skip blocks caching if not updated and cache exists
					let blocksNeedsUpdate = true;
					try {
						await fs.access(blocksCacheFilePath);
						if (postLastUpdatedBeforeLastBuild) {
							console.log(`Skipping blocks for ${slug} (no update and cache exists)`);
							blocksNeedsUpdate = false;
						}
					} catch {
						// Cache file doesn't exist; we'll write it
					}

					// Skip references caching if not updated and caches exist
					let staticReferencesNeedsUpdate = true;
					try {
						await fs.access(staticReferencesCacheFilePath);
						if (postLastUpdatedBeforeLastBuild) {
							console.log(`Skipping static references for ${slug} (no update and cache exists)`);
							staticReferencesNeedsUpdate = false;
						}
					} catch {
						// Cache file doesn't exist; we'll write it
					}

					if (!blocksNeedsUpdate && !staticReferencesNeedsUpdate) {
						continue;
					}

					try {
						const htmlContent = await fs.readFile(filePath, "utf-8");
						const document = parseDocument(htmlContent);

						// Extract blocks HTML
						if (blocksNeedsUpdate) {
							const divPostBody = DomUtils.findOne(
								(elem) =>
									elem.type === "tag" &&
									elem.name === "div" &&
									!!elem.attribs?.class &&
									elem.attribs.class.split(" ").includes("post-body"),
								document.children,
								true,
							);
							if (divPostBody) {
								const extractedHtml = render(divPostBody.children);
								await fs.writeFile(blocksCacheFilePath, extractedHtml, "utf-8");
								console.log(`Cached blocks for ${slug} to ${blocksCacheFilePath}`);
							} else {
								console.warn(`No <div class="post-body"> found for ${slug}`);
							}
						}

						// Extract static references HTML
						if (staticReferencesNeedsUpdate) {
							const divStaticReferences = DomUtils.findOne(
								(elem) =>
									elem.type === "tag" &&
									elem.name === "div" &&
									!!elem.attribs?.class &&
									elem.attribs.class.split(" ").includes("static-references"),
								document.children,
								true,
							);
							if (divStaticReferences) {
								const staticHtml = render(divStaticReferences.children);
								await fs.writeFile(staticReferencesCacheFilePath, staticHtml, "utf-8");
								console.log(
									`Cached static references for ${slug} to ${staticReferencesCacheFilePath}`,
								);
							} else {
								console.warn(`No <div class="static-references"> found for ${slug}`);
							}
						}
					} catch (error) {
						console.error(`Error processing ${slug}:`, error);
					}
				}
			},
		},
	};
};

export default blocksHtmlCacher;
