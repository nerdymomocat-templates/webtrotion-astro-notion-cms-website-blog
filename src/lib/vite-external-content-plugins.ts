import fs from "node:fs";
import path from "node:path";

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

export function externalContentVitePlugins() {
	return [
		{
			name: "external-custom-components-fallback",
			enforce: "pre",
			load(id: string) {
				const target = `${path.sep}src${path.sep}components${path.sep}custom-components${path.sep}`;
				if (!id.includes(target)) return null;
				if (fs.existsSync(id)) return null;
				if (!/\.(astro|jsx|tsx|js|ts)$/.test(id)) return null;
				return `---\nconst { children, ...props } = Astro.props;\n---\n<div class="missing-remote-component" data-missing-component="${id}" {...props}>\n  <slot />\n</div>\n`;
			},
		},
		{
			name: "external-mdx-prep",
			enforce: "pre",
			transform(code: string, id: string) {
				if (
					!id.endsWith(".mdx") ||
					!id.includes(`${path.sep}src${path.sep}external-posts${path.sep}`)
				) {
					return null;
				}
				const adjusted = ensureBlankLineAfterImports(code);
				return adjusted === code ? null : adjusted;
			},
		},
		{
			name: "custom-components-asset-rewrite",
			enforce: "pre",
			transform(code: string, id: string) {
				if (!id.endsWith(".astro")) return null;
				const parts = id.split(path.sep);
				const idx = parts.lastIndexOf("custom-components");
				if (idx === -1) return null;

				const relPath = parts.slice(idx + 1, -1); // folders inside custom-components
				const rewriteAsset = (raw: string) => {
					if (!raw.startsWith(".")) return raw;
					const abs = path.posix.normalize(
						path.posix.join("/custom-components", relPath.join("/"), raw),
					);
					return abs;
				};

				let mutated = code;
				const attrRegex = /(src|href|poster|data-src|data-href)\s*=\s*["'](\.{1,2}\/[^"']+)["']/g;
				mutated = mutated.replace(attrRegex, (_m, attr, url) => `${attr}="${rewriteAsset(url)}"`);
				return mutated === code ? null : mutated;
			},
		},
	];
}
