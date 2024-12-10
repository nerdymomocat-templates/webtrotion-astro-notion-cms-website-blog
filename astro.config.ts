import path from "path";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import { BASE_PATH, CUSTOM_DOMAIN } from "./src/constants";
const getSite = function () {
	if (CUSTOM_DOMAIN) {
		return new URL(BASE_PATH, `https://${CUSTOM_DOMAIN}`).toString();
	}
	if (process.env.VERCEL && process.env.VERCEL_URL) {
		return new URL(BASE_PATH, `https://${process.env.VERCEL_URL}`).toString();
	}
	if (process.env.CF_PAGES) {
		if (process.env.CF_PAGES_BRANCH !== "main") {
			return new URL(BASE_PATH, process.env.CF_PAGES_URL).toString();
		}
		return new URL(
			BASE_PATH,
			`https://${new URL(process.env.CF_PAGES_URL).host.split(".").slice(1).join(".")}`,
		).toString();
	}
	if (process.env.GITHUB_PAGES) {
		return new URL(process.env.BASE || BASE_PATH, process.env.SITE).toString();
	}
	return new URL(BASE_PATH, "http://localhost:4321").toString();
};
import partytown from "@astrojs/partytown";
import robotsTxt from "astro-robots-txt";
import config from "./constants-config.json";
import buildTimestampRecorder from "./src/integrations/build-timestamp-recorder.ts";
import CustomIconDownloader from "./src/integrations/custom-icon-downloader";
import DeleteBuildCache from "./src/integrations/delete-build-cache";
import EntryCacheEr from "./src/integrations/entry-cache-er";
import PublicNotionCopier from "./src/integrations/public-notion-copier";
import rssContentEnhancer from "./src/integrations/rss-content-enhancer";
import CSSWriter from "./src/integrations/theme-constants-to-css";
const key_value_from_json = {
	...config,
};
function modifyRedirectPaths(
	redirects: Record<string, string>,
	basePath: string,
): Record<string, string> {
	const modifiedRedirects: Record<string, string> = {};
	for (const [key, value] of Object.entries(redirects)) {
		if (basePath && !value.startsWith(basePath) && !value.startsWith("/" + basePath)) {
			modifiedRedirects[key] = path.join(basePath, value);
		} else {
			modifiedRedirects[key] = value;
		}
	}
	return modifiedRedirects;
}

// https://astro.build/config
export default defineConfig({
	site: getSite(),
	base: process.env.BASE || BASE_PATH,
	redirects: key_value_from_json["redirects"]
		? modifyRedirectPaths(key_value_from_json["redirects"], process.env.BASE || BASE_PATH)
		: {},
	integrations: [
		// mdx({}),
		tailwind({
			applyBaseStyles: false,
		}),
		// astroImageTools,
		buildTimestampRecorder(),
		CustomIconDownloader(),
		EntryCacheEr(),
		PublicNotionCopier(),
		DeleteBuildCache(),
		CSSWriter(),
		rssContentEnhancer(),
		robotsTxt({
			sitemapBaseFileName: "sitemap",
		}),
		partytown({
			// Adds dataLayer.push as a forwarding-event.
			config: {
				forward: ["dataLayer.push"],
			},
		}),
	],
	image: {
		domains: ["webmention.io"],
	},
	prefetch: true,
	vite: {
		plugins: [],
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
	},
});
