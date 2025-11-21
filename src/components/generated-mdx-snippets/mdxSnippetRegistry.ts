import type { AstroComponentFactory } from "astro/runtime/server/index.js";

import fs from "node:fs";
import path from "node:path";
import { EXTERNAL_CONTENT_PATHS } from "@/constants";

type SnippetModule = { default: AstroComponentFactory };

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function syncSnippetsFromCache() {
	const cacheRoot = EXTERNAL_CONTENT_PATHS.mdxSnippetsCache;
	const destRoot = EXTERNAL_CONTENT_PATHS.mdxSnippets;
	if (!fs.existsSync(cacheRoot)) return;
	ensureDir(destRoot);

	const files = fs.readdirSync(cacheRoot, { withFileTypes: true }).filter((f) => f.isFile());
	for (const file of files) {
		const srcPath = path.join(cacheRoot, file.name);
		const destPath = path.join(destRoot, file.name);
		fs.copyFileSync(srcPath, destPath);
	}
}

syncSnippetsFromCache();

const snippetModules = import.meta.glob<SnippetModule>("/src/blocks-mdx-inject-snippets/**/*.mdx");

export async function mdxSnippetLookup(
	slug: string,
): Promise<{ Component: AstroComponentFactory | null }> {
	const key = Object.keys(snippetModules).find((k) => k.endsWith(`/${slug}.mdx`));
	if (!key) return { Component: null };
	try {
		const mod = await snippetModules[key]();
		return { Component: mod.default || null };
	} catch (error) {
		console.warn(`[mdx-snippet] Failed to load snippet ${slug}`, error);
		return { Component: null };
	}
}
