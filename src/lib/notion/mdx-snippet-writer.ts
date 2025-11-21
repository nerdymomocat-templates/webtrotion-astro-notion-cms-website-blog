import fs from "node:fs";
import path from "node:path";
import { EXTERNAL_CONTENT_PATHS } from "../../constants";

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function ensureBlankLineAfterImports(source: string): string {
	const lines = source.split(/\r?\n/);
	let idx = 0;
	let sawImport = false;

	while (idx < lines.length) {
		const trimmed = lines[idx].trim();
		if (!trimmed) {
			if (!sawImport) {
				idx += 1;
				continue;
			}
			break;
		}
		if (/^(import|export)\s/.test(trimmed)) {
			sawImport = true;
			idx += 1;
			continue;
		}
		break;
	}

	if (!sawImport) return source;
	if (idx >= lines.length) return source;
	if (lines[idx].trim() === "") return source;

	lines.splice(idx, 0, "");
	return lines.join("\n");
}

export function writeMdxSnippet(options: {
	pageId: string;
	blockId: string;
	slug: string;
	content: string;
}) {
	const tmpDir = EXTERNAL_CONTENT_PATHS.mdxSnippetsCache;
	const destDir = EXTERNAL_CONTENT_PATHS.mdxSnippets;
	ensureDir(tmpDir);
	ensureDir(destDir);

	const filename = `${options.slug}.mdx`;
	const tmpPath = path.join(tmpDir, filename);
	const destPath = path.join(destDir, filename);
	const normalized = ensureBlankLineAfterImports(options.content);

	fs.writeFileSync(tmpPath, normalized, "utf-8");
	fs.writeFileSync(destPath, normalized, "utf-8");

	return { tmpPath, destPath };
}
