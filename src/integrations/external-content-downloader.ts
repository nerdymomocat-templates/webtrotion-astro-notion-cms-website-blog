import type { AstroIntegration } from "astro";
import type { AstroIntegrationLogger } from "astro";
import path from "node:path";
import fs from "node:fs";
import type { ExternalContentSourceConfig } from "../constants";
import { EXTERNAL_CONTENT_CONFIG, EXTERNAL_CONTENT_PATHS, LAST_BUILD_TIME } from "../constants";
import { writeExternalFolderVersion } from "../lib/external-content/external-render-cache";

const GITHUB_API_BASE = "https://api.github.com";
const RAW_HEADERS = {
	Accept: "application/vnd.github.v3+json",
	"User-Agent": "external-content-sync",
};
const githubToken = process.env.GITHUB_TOKEN;

async function fetchJson(url: string) {
	const headers: Record<string, string> = { ...RAW_HEADERS };
	if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(`GitHub request failed: ${res.status}`);
	return res.json();
}

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function joinRemotePath(base: string, suffix?: string) {
	if (!suffix) return base;
	return base ? path.posix.join(base, suffix) : suffix;
}

async function getLatestCommitDate(
	source: ExternalContentSourceConfig,
	remotePath: string,
): Promise<Date | null> {
	const url = `${GITHUB_API_BASE}/repos/${source.owner}/${source.repo}/commits?path=${encodeURIComponent(
		remotePath,
	)}&sha=${encodeURIComponent(source.ref)}&per_page=1`;
	try {
		const commits: any[] = await fetchJson(url);
		const first = Array.isArray(commits) ? commits[0] : null;
		const dateString = first?.commit?.author?.date || first?.commit?.committer?.date;
		return dateString ? new Date(dateString) : null;
	} catch (error) {
		return null;
	}
}

function needsDownload(latestCommit: Date | null, stagingDir: string) {
	if (!fs.existsSync(stagingDir)) return true;
	if (!LAST_BUILD_TIME) return true;
	if (!latestCommit) return true;
	return latestCommit.getTime() > LAST_BUILD_TIME.getTime();
}

async function downloadFolder(
	source: ExternalContentSourceConfig,
	remotePath: string,
	dest: string,
	logger: AstroIntegrationLogger,
) {
	const url = `${GITHUB_API_BASE}/repos/${source.owner}/${source.repo}/contents/${remotePath}?ref=${encodeURIComponent(
		source.ref,
	)}`;
	const listing: any[] = await fetchJson(url);
	ensureDir(dest);
	for (const entry of listing) {
		const entryDest = path.join(dest, entry.name);
		if (entry.type === "file") {
			const rawUrl = entry.download_url;
			const res = await fetch(rawUrl, {
				headers: githubToken ? { Authorization: `Bearer ${githubToken}` } : {},
			});
			if (!res.ok) throw new Error(`Failed to download ${rawUrl}`);
			const buf = Buffer.from(await res.arrayBuffer());
			ensureDir(path.dirname(entryDest));
			fs.writeFileSync(entryDest, buf);
		} else if (entry.type === "dir") {
			await downloadFolder(source, entry.path, entryDest, logger);
		}
	}
	logger.info(`[external-content] Downloaded ${remotePath} -> ${dest}`);
}

function copyDir(src: string, dest: string) {
	ensureDir(dest);
	fs.cpSync(src, dest, { recursive: true });
}

function copyAssetsFilter(src: string, dest: string, filter: (p: string) => boolean) {
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
	if (!copiedAny) fs.rmSync(dest, { recursive: true, force: true });
	return copiedAny;
}

async function runExternalSync(logger: AstroIntegrationLogger) {
	if (!EXTERNAL_CONTENT_CONFIG.enabled) return;

	ensureDir(EXTERNAL_CONTENT_PATHS.tmpRoot);
	ensureDir(EXTERNAL_CONTENT_PATHS.externalPosts);
	ensureDir(EXTERNAL_CONTENT_PATHS.customComponents);
	ensureDir(EXTERNAL_CONTENT_PATHS.publicAssets);
	ensureDir(EXTERNAL_CONTENT_PATHS.publicCustomComponents);
	ensureDir(EXTERNAL_CONTENT_PATHS.commitMetadata);
	ensureDir(EXTERNAL_CONTENT_PATHS.renderCache);

	// Handle content sources
	for (const source of EXTERNAL_CONTENT_CONFIG.sources) {
		let listing: any[] = [];
		try {
			const url = `${GITHUB_API_BASE}/repos/${source.owner}/${source.repo}/contents/${source.path}?ref=${encodeURIComponent(
				source.ref,
			)}`;
			listing = await fetchJson(url);
		} catch (error) {
			logger.warn(`[external-content] Failed to list folders for ${source.id}:`, error);
			continue;
		}

		const folders = listing.filter((entry) => entry.type === "dir");

		for (const folder of folders) {
			const remotePath = folder.path ?? joinRemotePath(source.path, folder.name);
			const folderName = folder.name;
			const stagingDir = path.join(EXTERNAL_CONTENT_PATHS.tmpRoot, source.id, folderName);

			let shouldDownload = !fs.existsSync(stagingDir);
			let latestCommit: Date | null = null;
			try {
				latestCommit = await getLatestCommitDate(source, remotePath);
				shouldDownload = shouldDownload || needsDownload(latestCommit, stagingDir);
			} catch (error) {
				logger.warn(
					`[external-content] Failed to check timestamps for ${source.id}/${folderName}:`,
					error,
				);
				shouldDownload = true;
			}

			if (shouldDownload) {
				fs.rmSync(stagingDir, { recursive: true, force: true });
				await downloadFolder(source, remotePath, stagingDir, logger);
			}

			const version =
				latestCommit?.toISOString() ||
				(fs.existsSync(stagingDir) ? fs.statSync(stagingDir).mtime.toISOString() : "");
			if (version) {
				writeExternalFolderVersion(source.id, folderName, version, remotePath);
			}

			const destContent = path.join(EXTERNAL_CONTENT_PATHS.externalPosts, folderName);
			copyDir(stagingDir, destContent);
			const destAssets = path.join(EXTERNAL_CONTENT_PATHS.publicAssets, folderName);
			copyAssetsFilter(stagingDir, destAssets, (p) => {
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

	// Custom components
	if (EXTERNAL_CONTENT_CONFIG.customComponents) {
		const cc = EXTERNAL_CONTENT_CONFIG.customComponents;
		const stagingDir = path.join(EXTERNAL_CONTENT_PATHS.tmpRoot, "custom-components");
		let shouldDownload = !fs.existsSync(stagingDir);
		let latestCommit: Date | null = null;
		try {
			const remotePath = cc.path;
			latestCommit = remotePath ? await getLatestCommitDate(cc, remotePath) : null;
			shouldDownload = shouldDownload || needsDownload(latestCommit, stagingDir);
		} catch (error) {
			logger.warn(`[external-content] Failed to check timestamps for custom components:`, error);
			shouldDownload = true;
		}

		if (shouldDownload) {
			fs.rmSync(stagingDir, { recursive: true, force: true });
			await downloadFolder(cc, cc.path, stagingDir, logger);
		}

		const version =
			latestCommit?.toISOString() ||
			(fs.existsSync(stagingDir) ? fs.statSync(stagingDir).mtime.toISOString() : "");
		if (version) {
			writeExternalFolderVersion(cc.id, "root", version, cc.path);
		}

		copyDir(stagingDir, EXTERNAL_CONTENT_PATHS.customComponents);
		copyAssetsFilter(stagingDir, EXTERNAL_CONTENT_PATHS.publicCustomComponents, (p) => {
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
