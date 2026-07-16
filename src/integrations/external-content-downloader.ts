import type { AstroIntegration } from "astro";
import type { AstroIntegrationLogger } from "astro";
import path from "node:path";
import fs from "node:fs";
import { EXTERNAL_CONTENT_CONFIG, EXTERNAL_CONTENT_PATHS } from "../constants";
import type {
	ExternalContentSourceConfig,
	ExternalContentCustomComponentConfig,
} from "../constants";
import { writeExternalFolderVersion } from "../lib/external-content/external-render-cache";

const GITHUB_API_BASE = "https://api.github.com";
const RAW_HEADERS = {
	Accept: "application/vnd.github.v3+json",
	"User-Agent": "external-content-sync",
};
const githubToken = process.env.GITHUB_TOKEN;

interface GitHubTreeItem {
	path: string;
	mode: string;
	type: "blob" | "tree";
	sha: string;
	size?: number;
	url: string;
}

interface GitHubTreeResponse {
	sha: string;
	url: string;
	tree: GitHubTreeItem[];
	truncated: boolean;
}

type CacheManifest = Record<string, string>; // path -> sha

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isGitHubTreeItem(value: unknown): value is GitHubTreeItem {
	return (
		isRecord(value) &&
		typeof value.path === "string" &&
		typeof value.mode === "string" &&
		(value.type === "blob" || value.type === "tree") &&
		typeof value.sha === "string" &&
		typeof value.url === "string" &&
		(value.size === undefined || typeof value.size === "number")
	);
}

function isGitHubTreeResponse(value: unknown): value is GitHubTreeResponse {
	return (
		isRecord(value) &&
		typeof value.sha === "string" &&
		typeof value.url === "string" &&
		typeof value.truncated === "boolean" &&
		Array.isArray(value.tree) &&
		value.tree.every(isGitHubTreeItem)
	);
}

async function fetchJson(url: string): Promise<unknown> {
	const headers: Record<string, string> = { ...RAW_HEADERS };
	if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(`GitHub request failed: ${res.status} ${res.statusText}`);
	return res.json();
}

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadManifest(manifestPath: string): CacheManifest {
	if (!fs.existsSync(manifestPath)) return {};
	try {
		return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
	} catch {
		return {};
	}
}

function saveManifest(manifestPath: string, manifest: CacheManifest) {
	ensureDir(path.dirname(manifestPath));
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

async function downloadFile(
	owner: string,
	repo: string,
	ref: string,
	remotePath: string,
	destPath: string,
) {
	const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${remotePath}`;
	const headers: Record<string, string> = {};
	if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
	const buf = Buffer.from(await res.arrayBuffer());
	ensureDir(path.dirname(destPath));
	fs.writeFileSync(destPath, buf);
}

function copyAssetsFilter(src: string, dest: string, filter: (p: string) => boolean) {
	if (!fs.existsSync(src)) return false;
	let copiedAny = false;
	const walk = (from: string, to: string) => {
		const entries = fs.readdirSync(from, { withFileTypes: true });
		for (const entry of entries) {
			const srcPath = path.join(from, entry.name);
			const destPath = path.join(to, entry.name);
			if (entry.isDirectory()) {
				walk(srcPath, destPath);
			} else if (entry.isFile()) {
				if (!filter(srcPath)) continue;
				ensureDir(path.dirname(destPath));
				fs.copyFileSync(srcPath, destPath);
				copiedAny = true;
			}
		}
	};
	walk(src, dest);
	return copiedAny;
}

async function syncSource(
	config: ExternalContentSourceConfig | ExternalContentCustomComponentConfig,
	stagingRoot: string,
	manifestPath: string,
	logger: AstroIntegrationLogger,
) {
	// 1. Fetch Remote Tree
	const treeUrl = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/git/trees/${config.ref}?recursive=1`;
	let treeResponse: GitHubTreeResponse;
	try {
		const response = await fetchJson(treeUrl);
		if (!isGitHubTreeResponse(response)) {
			logger.warn(
				`[external-content] GitHub returned an invalid tree response for ${config.owner}/${config.repo}.`,
			);
			return;
		}
		treeResponse = response;
	} catch (error) {
		logger.warn(
			`[external-content] Failed to fetch tree for ${config.owner}/${config.repo}:`,
			error,
		);
		return;
	}

	if (treeResponse.truncated) {
		logger.warn(
			`[external-content] Tree response for ${config.owner}/${config.repo} was truncated! Some files may be missing.`,
		);
	}

	// 2. Filter items relevant to our path prefix
	const prefix = config.path.replace(/\/$/, ""); // Remove trailing slash
	const relevantItems = treeResponse.tree.filter((item) => {
		return item.type === "blob" && (item.path === prefix || item.path.startsWith(`${prefix}/`));
	});

	// 3. Load Local Manifest
	const oldManifest = loadManifest(manifestPath);
	const newManifest: CacheManifest = {};
	const downloadQueue: GitHubTreeItem[] = [];

	// 4. Diff
	for (const item of relevantItems) {
		newManifest[item.path] = item.sha;
		if (oldManifest[item.path] !== item.sha) {
			downloadQueue.push(item);
		}
	}

	// Identify deletions
	const deletedPaths = Object.keys(oldManifest).filter((p) => !newManifest[p]);
	for (const p of deletedPaths) {
		const localPath = path.join(stagingRoot, p);
		if (fs.existsSync(localPath)) {
			fs.unlinkSync(localPath);
		}
	}

	// 5. Download Changed Files
	if (downloadQueue.length > 0) {
		logger.info(
			`[external-content] Downloading ${downloadQueue.length} files for ${config.owner}/${config.repo}/${config.path}...`,
		);
		// Process in parallel with concurrency limit
		const CONCURRENCY = 10;
		for (let i = 0; i < downloadQueue.length; i += CONCURRENCY) {
			const chunk = downloadQueue.slice(i, i + CONCURRENCY);
			await Promise.all(
				chunk.map(async (item) => {
					const dest = path.join(stagingRoot, item.path);
					try {
						await downloadFile(config.owner, config.repo, config.ref, item.path, dest);
					} catch (err) {
						logger.error(`[external-content] Failed to download ${item.path}:`, err);
						// Remove from manifest so we retry next time
						delete newManifest[item.path];
					}
				}),
			);
		}
	} else {
		logger.info(
			`[external-content] No changes detected for ${config.owner}/${config.repo}/${config.path}`,
		);
	}

	// 6. Save Manifest
	saveManifest(manifestPath, newManifest);

	// 7. Update Render Cache Version (using the tree SHA as the version)
	const subfolders = new Set<string>();
	const relPathStart = config.path.length + 1; // +1 for slash
	for (const item of relevantItems) {
		if (item.path.startsWith(config.path + "/")) {
			const rel = item.path.slice(relPathStart);
			const firstSeg = rel.split("/")[0];
			if (firstSeg) subfolders.add(firstSeg);
		}
	}

	for (const folder of subfolders) {
		const folderFiles = relevantItems.filter((i) => i.path.startsWith(`${config.path}/${folder}/`));
		if (folderFiles.length > 0) {
			const combinedSha = folderFiles
				.map((f) => f.sha)
				.sort()
				.join("");
			// Simple hash of the combined string
			let hash = 0;
			for (let i = 0; i < combinedSha.length; i++) {
				hash = (hash << 5) - hash + combinedSha.charCodeAt(i);
				hash |= 0;
			}
			writeExternalFolderVersion(config.id, folder, hash.toString(16), `${config.path}/${folder}`);
		}
	}
}

async function runExternalSync(logger: AstroIntegrationLogger) {
	if (!EXTERNAL_CONTENT_CONFIG.enabled) return;

	ensureDir(EXTERNAL_CONTENT_PATHS.tmpRoot);
	ensureDir(EXTERNAL_CONTENT_PATHS.manifestDir);
	ensureDir(EXTERNAL_CONTENT_PATHS.externalPosts);
	ensureDir(EXTERNAL_CONTENT_PATHS.customComponents);
	ensureDir(EXTERNAL_CONTENT_PATHS.publicAssets);
	ensureDir(EXTERNAL_CONTENT_PATHS.publicCustomComponents);
	ensureDir(EXTERNAL_CONTENT_PATHS.commitMetadata);
	ensureDir(EXTERNAL_CONTENT_PATHS.renderCache);

	// 1. Sync Sources (Markdown, MDX, HTML)
	for (const source of EXTERNAL_CONTENT_CONFIG.sources) {
		const manifestPath = path.join(EXTERNAL_CONTENT_PATHS.manifestDir, `${source.id}.json`);
		const stagingRoot = path.join(EXTERNAL_CONTENT_PATHS.tmpRoot, `${source.id}-source`);

		await syncSource(source, stagingRoot, manifestPath, logger);

		// Copy from staging to final destination
		const sourceContentRoot = path.join(stagingRoot, source.path);
		if (fs.existsSync(sourceContentRoot)) {
			const entries = fs.readdirSync(sourceContentRoot, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isDirectory()) {
					const folderName = entry.name;
					const srcDir = path.join(sourceContentRoot, folderName);
					const destContent = path.join(EXTERNAL_CONTENT_PATHS.externalPosts, folderName);
					const destAssets = path.join(EXTERNAL_CONTENT_PATHS.publicAssets, folderName);

					// Copy content
					copyAssetsFilter(srcDir, destContent, () => true);

					// Copy assets to public
					copyAssetsFilter(srcDir, destAssets, (p) => {
						const ext = path.extname(p).toLowerCase();
						return ![
							".md",
							".mdx",
							".markdown",
							".html",
							".htm",
							".astro",
							".ts",
							".tsx",
							".js",
							".jsx",
							".mjs",
							".cjs",
							".json",
						].includes(ext);
					});
				}
			}
		}
	}

	// 2. Sync Custom Components
	if (EXTERNAL_CONTENT_CONFIG.customComponents) {
		const cc = EXTERNAL_CONTENT_CONFIG.customComponents;
		const manifestPath = path.join(EXTERNAL_CONTENT_PATHS.manifestDir, "custom-components.json");
		const stagingRoot = path.join(EXTERNAL_CONTENT_PATHS.tmpRoot, "custom-components-source");

		await syncSource(cc, stagingRoot, manifestPath, logger);

		// Copy to final destinations
		const sourceContentRoot = path.join(stagingRoot, cc.path);
		if (fs.existsSync(sourceContentRoot)) {
			// Copy everything to src/components/custom-components
			copyAssetsFilter(sourceContentRoot, EXTERNAL_CONTENT_PATHS.customComponents, () => true);

			// Copy assets to public/custom-components
			copyAssetsFilter(sourceContentRoot, EXTERNAL_CONTENT_PATHS.publicCustomComponents, (p) => {
				const ext = path.extname(p).toLowerCase();
				return ![
					".astro",
					".ts",
					".tsx",
					".js",
					".jsx",
					".mjs",
					".cjs",
					".json",
					".md",
					".mdx",
					".markdown",
					".html",
					".htm",
				].includes(ext);
			});

			// Write version for custom components root
			const manifest = loadManifest(manifestPath);
			const combinedSha = Object.values(manifest).sort().join("");
			let hash = 0;
			for (let i = 0; i < combinedSha.length; i++) {
				hash = (hash << 5) - hash + combinedSha.charCodeAt(i);
				hash |= 0;
			}
			writeExternalFolderVersion(cc.id, "root", hash.toString(16), cc.path);
		}
	}
}

export default function externalContentDownloader(): AstroIntegration {
	return {
		name: "external-content-downloader",
		hooks: {
			"astro:build:start": async ({ logger }) => {
				try {
					await runExternalSync(logger);
				} catch (error) {
					logger.warn(`[external-content] Failed to sync: ${(error as Error).message}`);
				}
			},
			"astro:dev:start": async ({ logger }) => {
				try {
					await runExternalSync(logger);
				} catch (error) {
					logger.warn(`[external-content] Failed to sync: ${(error as Error).message}`);
				}
			},
		},
	};
}
