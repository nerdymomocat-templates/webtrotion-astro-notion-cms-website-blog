import { defineConfig, fontProviders, svgoOptimizer } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";

import path from "node:path";
import fs from "node:fs";
import JSON5 from "json5";
import { CUSTOM_DOMAIN, BASE_PATH, EXTERNAL_CONTENT_CONFIG } from "./src/constants";
import satteriExternalMdxAssets from "./src/lib/external-content/satteri-external-mdx-assets";
import { externalContentVitePlugins } from "./src/lib/vite-external-content-plugins";

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
		const cfUrl = new URL(process.env.CF_PAGES_URL);
		if (cfUrl.host.endsWith(".pages.dev")) {
			const strippedHost = cfUrl.host.split(".").slice(1).join(".");
			return new URL(BASE_PATH, `https://${strippedHost}`).toString();
		}
		return new URL(BASE_PATH, process.env.CF_PAGES_URL).toString();
	}
	if (process.env.GITHUB_PAGES) {
		return new URL(process.env.BASE || BASE_PATH, process.env.SITE).toString();
	}
	return new URL(BASE_PATH, "http://localhost:4321").toString();
};
import CustomIconDownloader from "./src/integrations/custom-icon-downloader";
import EntryCacheEr from "./src/integrations/entry-cache-er";
import PublicNotionCopier from "./src/integrations/public-notion-copier";
import blocksHtmlCacher from "./src/integrations/block-html-cache-er";
import DeleteBuildCache from "./src/integrations/delete-build-cache";
import buildTimestampRecorder from "./src/integrations/build-timestamp-recorder";
import rssContentEnhancer from "./src/integrations/rss-content-enhancer";
import markdownExporter from "./src/integrations/markdown-exporter";
import externalRenderCacher from "./src/integrations/external-render-cacheer";
import CSSWriter from "./src/integrations/theme-constants-to-css";
import createFoldersIfMissing from "./src/integrations/create-folders-if-missing";
import citationsInitializer from "./src/integrations/citations-initializer";
import astroImageCacheCleanerCopier from "./src/integrations/astro-image-cache-cleaner-copier";
import externalContentDownloader from "./src/integrations/external-content-downloader";
import robotsTxt from "astro-robots-txt";
import partytown from "@astrojs/partytown";

const configContent = fs.readFileSync("./constants-config.json5", "utf8");
const config = JSON5.parse(configContent);
const key_value_from_json = {
	...config,
};
function modifyRedirectPaths(
	redirects: Record<string, string>,
	basePath: string,
): Record<string, string> {
	const modifiedRedirects: Record<string, string> = {};

	// Normalize basePath: ensure it starts with "/" and remove trailing slash.
	if (!basePath.startsWith("/")) {
		basePath = "/" + basePath;
	}
	basePath = basePath.replace(/\/+$/, ""); // remove trailing slashes

	for (const [key, value] of Object.entries(redirects)) {
		// If it's an external URL, leave it unchanged.
		if (value.startsWith("http://") || value.startsWith("https://")) {
			modifiedRedirects[key] = value;
			continue;
		}

		// Ensure value starts with a slash.
		let normalizedValue = value.startsWith("/") ? value : "/" + value;
		modifiedRedirects[key] = path.posix.join(basePath, normalizedValue);
	}

	return modifiedRedirects;
}

// https://astro.build/config
export default defineConfig({
	site: getSite(),
	base: process.env.BASE || BASE_PATH,
	cacheDir: "./tmp/.astro",
	redirects: key_value_from_json?.redirects
		? modifyRedirectPaths(key_value_from_json.redirects, process.env.BASE || BASE_PATH)
		: {},
	fonts: (() => {
		const fontConfig = key_value_from_json?.theme?.["fontfamily-google-fonts"];

		if (!fontConfig) {
			return [];
		}

		const fonts = [];
		const weights: [number, ...number[]] = [400, 500, 600, 700];
		const styles: ["normal" | "italic", ...("normal" | "italic")[]] = ["normal", "italic"];
		const formats = ["woff2"] as const;
		const buildGoogleFont = ({
			name,
			cssVariable,
			fallbacks,
		}: {
			name: string;
			cssVariable: string;
			fallbacks: string[];
		}) => ({
			provider: fontProviders.google(),
			name,
			cssVariable,
			weights,
			styles,
			formats,
			fallbacks,
			optimizedFallbacks: true,
			display: "swap" as const,
		});

		const sansFontName = fontConfig["sans-font-name"];
		const monoFontName = fontConfig["mono-font-name"];
		const accentFontName = fontConfig["accent-font-name"];

		if (sansFontName) {
			fonts.push(
				buildGoogleFont({
					name: sansFontName,
					cssVariable: "--font-sans",
					fallbacks: ["sans-serif"],
				}),
			);
		}

		if (monoFontName) {
			if (!sansFontName) {
				fonts.push(
					buildGoogleFont({
						name: monoFontName,
						cssVariable: "--font-sans",
						fallbacks: ["monospace", "sans-serif"],
					}),
				);
			}

			fonts.push(
				buildGoogleFont({
					name: monoFontName,
					cssVariable: "--font-mono",
					fallbacks: ["monospace"],
				}),
			);
		}

		if (accentFontName) {
			fonts.push(
				buildGoogleFont({
					name: accentFontName,
					cssVariable: "--font-accent",
					fallbacks: ["serif"],
				}),
			);
		}

		return fonts;
	})(),
	experimental: {
		clientPrerender: true,
		svgOptimizer: svgoOptimizer(),
	},
	markdown: {
		processor: satteri({
			mdastPlugins: [satteriExternalMdxAssets],
		}),
	},
	integrations: [
		createFoldersIfMissing(),
		mdx(),
		EXTERNAL_CONTENT_CONFIG.enabled ? externalContentDownloader() : undefined,
		buildTimestampRecorder(),
		citationsInitializer(), // Initialize BibTeX cache after timestamp is recorded
		EntryCacheEr(),
		CustomIconDownloader(),
		CSSWriter(),
		partytown({
			// Adds dataLayer.push as a forwarding-event.
			config: {
				forward: ["dataLayer.push"],
			},
		}),
		robotsTxt({
			sitemapBaseFileName: "sitemap",
		}),
		rssContentEnhancer(),
		markdownExporter(),
		blocksHtmlCacher(),
		externalRenderCacher(),
		PublicNotionCopier(),
		astroImageCacheCleanerCopier(),
		DeleteBuildCache(),
	],
	image: {
		remotePatterns: [{}],
	},
	prefetch: true,
	vite: {
		plugins: [...externalContentVitePlugins(), tailwindcss()],
		resolve: {
			alias: {
				"custom-components": path.resolve("./src/components/custom-components"),
				"@custom-components": path.resolve("./src/components/custom-components"),
			},
		},
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
	},
});
