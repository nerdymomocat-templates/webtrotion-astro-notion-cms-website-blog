import type { AstroIntegration } from "astro";
import fs from "fs/promises";
import path from "path";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { getAllPosts } from "../lib/notion/client";
import { EXTERNAL_CONTENT_PATHS } from "../constants";
import {
	extractHeadingsFromHtml,
	readExternalFolderVersion,
	saveExternalRenderCache,
} from "../lib/external-content/external-render-cache";

const externalRenderCacher = (): AstroIntegration => {
	return {
		name: "external-render-cacher",
		hooks: {
			"astro:build:done": async () => {
				const distDir = "dist";
				const posts = await getAllPosts();
				const externalPosts = posts.filter((p) => p.IsExternal && p.ExternalContent);

				for (const post of externalPosts) {
					const descriptor = post.ExternalContent;
					if (!descriptor) continue;

					const filePath = path.join(distDir, "posts", post.Slug, "index.html");
					try {
						const htmlContent = await fs.readFile(filePath, "utf-8");
						const document = parseDocument(htmlContent);
						const postBody = DomUtils.findOne(
							(elem) =>
								elem.type === "tag" &&
								elem.name === "div" &&
								!!elem.attribs?.class &&
								elem.attribs.class.split(" ").includes("post-body"),
							document.children,
							true,
						);
						if (!postBody) continue;

						const extractedHtml = DomUtils.getInnerHTML(postBody);
						const headings = extractHeadingsFromHtml(extractedHtml);
						const version = readExternalFolderVersion(descriptor) || new Date().toISOString();
						saveExternalRenderCache(descriptor, version, extractedHtml, headings);
					} catch (error) {
						console.warn(
							`[external-content] Failed to cache rendered HTML for ${post.Slug}:`,
							error,
						);
					}
				}
			},
		},
	};
};

export default externalRenderCacher;
