import JSON5 from "json5";
import { parse as parseYaml } from "yaml";
import mermaid from "mermaid";
import postcss from "postcss";
import { utils as cssColor } from "@asamuzakjp/css-color";

type Config = Record<string, unknown>;
const isRecord = (value: unknown): value is Config =>
	Boolean(value && typeof value === "object" && !Array.isArray(value));

/** Read author configuration without rewriting the source used for copying or export. */
export function readDiagramConfig(source: string): Config {
	let config: Config = {};
	const lines = source.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trimStart().split("\n");
	const frontmatterEnd = lines.indexOf("---", 1);
	if (lines[0] === "---" && frontmatterEnd !== -1) {
		const document: unknown = parseYaml(lines.slice(1, frontmatterEnd).join("\n"), {
			maxAliasCount: 50,
		});
		if (isRecord(document) && isRecord(document.config)) config = { ...document.config };
	}
	let searchFrom = 0;
	while (searchFrom < source.length) {
		const marker = source.indexOf("%%{", searchFrom);
		if (marker === -1) break;
		const openingBrace = marker + 2;
		searchFrom = openingBrace + 1;
		const colon = source.indexOf(":", searchFrom);
		if (colon === -1) break;
		const directiveName = source.slice(searchFrom, colon).trim();
		if (!["init", "initialize"].includes(directiveName)) continue;
		// A quoted value can contain }%%, so find the closing brace before parsing JSON5.
		searchFrom = source.length;
		let depth = 0;
		let quote = "";
		let escaped = false;
		for (let cursor = openingBrace; cursor < source.length; cursor++) {
			const char = source[cursor]!;
			if (quote) {
				if (escaped) escaped = false;
				else if (char === "\\") escaped = true;
				else if (char === quote) quote = "";
				continue;
			}
			if (char === '"' || char === "'") quote = char;
			else if (char === "{") depth++;
			else if (char === "}" && --depth === 0) {
				searchFrom = cursor + 3;
				if (source.slice(cursor + 1, searchFrom) !== "%%") break;
				const directive: unknown = JSON5.parse(source.slice(openingBrace, cursor + 1));
				if (!isRecord(directive)) break;
				const value = directive.init ?? directive.initialize;
				if (!isRecord(value)) break;
				config = {
					...config,
					...value,
					...(isRecord(config.themeVariables) || isRecord(value.themeVariables)
						? {
								themeVariables: {
									...(isRecord(config.themeVariables) ? config.themeVariables : {}),
									...(isRecord(value.themeVariables) ? value.themeVariables : {}),
								},
							}
						: {}),
				};
				break;
			}
		}
	}
	return config;
}

const supportedThemes = new Set(["default", "base", "forest", "dark", "neutral"]);

// Feed images have no surrounding page CSS, so authored colors must not depend on custom properties.
const isThemeColor = (value: unknown): value is string =>
	typeof value === "string" &&
	cssColor.isColor(value) &&
	cssColor.extractDashedIdent(value).length === 0;

function readFontFamily(value: unknown): string | undefined {
	if (typeof value !== "string") return;
	try {
		// A font value must stay inside one declaration, rather than append new CSS.
		const css = postcss.parse(`font{font-family:${value}}`);
		const rule = css.first;
		if (css.nodes.length !== 1 || rule?.type !== "rule" || rule.nodes.length !== 1) return;
		const declaration = rule.first;
		if (declaration?.type !== "decl" || declaration.prop !== "font-family" || declaration.important)
			return;
		return declaration.value;
	} catch {
		return;
	}
}

export function convertDiagramTheme(source: string, diagramType: string) {
	const config = readDiagramConfig(source);
	const variables = isRecord(config.themeVariables) ? config.themeVariables : {};
	const hasTheme = typeof config.theme === "string";
	const styles: Record<string, string> = {};
	let resolved: Config = variables;
	if (hasTheme) {
		if (!supportedThemes.has(config.theme as string)) {
			throw new Error(`Unsupported Mermaid theme "${String(config.theme)}".`);
		}
		// Use Mermaid's own palette calculations; only the converted values reach the browser.
		mermaid.initialize({
			startOnLoad: false,
			theme: config.theme as "base",
			themeVariables: variables,
		});
		resolved = mermaid.mermaidAPI.getConfig().themeVariables as Config;
	}
	const put = (name: string, ...keys: string[]) => {
		const value = keys.map((key) => resolved[key]).find(isThemeColor);
		if (typeof value === "string") styles[name] = value;
	};
	put("--pele-bg", "background");
	put("--pele-fg", "textColor");
	put("--pele-muted", "textColor");
	put("--pele-line", "lineColor");
	put("--pele-surface", "nodeBkg", "mainBkg", "primaryColor");
	put("--pele-border", "nodeBorder", "primaryBorderColor");
	put("--pele-surface-alt", "clusterBkg", "tertiaryColor", "secondaryColor");
	put("--pele-accent", "primaryBorderColor");
	put("--diagram-node-text", "nodeTextColor", "textColor", "primaryTextColor");
	put("--diagram-cluster-border", "clusterBorder", "primaryBorderColor");
	put("--diagram-edge-label-bg", "edgeLabelBackground", "background");
	put("--diagram-title", "titleColor", "textColor");
	put("--diagram-note-bg", "noteBkgColor");
	put("--diagram-note-border", "noteBorderColor");
	put("--diagram-note-text", "noteTextColor");
	if (diagramType === "sequence") {
		put("--pele-surface", "actorBkg", "primaryColor");
		put("--pele-border", "actorBorder", "primaryBorderColor");
		put("--pele-line", "signalColor", "lineColor");
		put("--diagram-node-text", "actorTextColor", "textColor");
		put("--diagram-edge-text", "signalTextColor", "textColor");
		put("--diagram-lifeline", "actorLineColor", "lineColor");
	}
	if (diagramType === "pie") {
		put("--diagram-title", "pieTitleTextColor", "titleColor", "textColor");
		put("--diagram-pie-label", "pieSectionTextColor");
		put("--diagram-pie-legend", "pieLegendTextColor");
	}
	if (diagramType === "quadrantChart") {
		put("--diagram-title", "quadrantTitleFill", "textColor");
		put("--diagram-quadrant-point", "quadrantPointFill", "textColor");
		for (let i = 1; i <= 4; i++) {
			put(`--diagram-quadrant-${i}-fill`, `quadrant${i}Fill`);
			put(`--diagram-quadrant-${i}-text`, `quadrant${i}TextFill`);
		}
	}
	if (diagramType === "gantt") {
		put("--diagram-gantt-section-bg", "sectionBkgColor");
		put("--diagram-gantt-section-text", "titleColor", "textColor");
		for (const [status, prefix] of Object.entries({
			task: "task",
			active: "activeTask",
			done: "doneTask",
			crit: "crit",
		})) {
			put(`--diagram-gantt-${status}-fill`, `${prefix}BkgColor`);
			put(`--diagram-gantt-${status}-border`, `${prefix}BorderColor`, "taskBorderColor");
			put(`--diagram-gantt-${status}-text`, `${prefix}TextColor`, "taskTextColor", "textColor");
			if (status === "active" || status === "done")
				put(`--diagram-gantt-${status}-text`, "taskTextDarkColor", "taskTextColor", "textColor");
		}
	}
	const chart = isRecord(resolved.xyChart) ? resolved.xyChart : {};
	if (diagramType === "xychart") {
		for (const [key, value] of Object.entries(chart)) {
			if (!isThemeColor(value)) continue;
			const names: Record<string, string> = {
				backgroundColor: "--pele-bg",
				titleColor: "--diagram-title",
				xAxisLabelColor: "--diagram-x-label",
				yAxisLabelColor: "--diagram-y-label",
				xAxisLineColor: "--diagram-x-line",
				yAxisLineColor: "--diagram-y-line",
				xAxisTitleColor: "--diagram-x-title",
				yAxisTitleColor: "--diagram-y-title",
			};
			if (names[key]) styles[names[key]!] = value;
		}
	}
	const palette =
		typeof chart.plotColorPalette === "string"
			? chart.plotColorPalette.split(",").map((value) => value.trim())
			: [];
	if (diagramType === "gitGraph") put("--diagram-git-commit-text", "gitCommitLabelColor");
	for (let i = 1; i <= 8; i++) {
		if (diagramType === "xychart" && isThemeColor(palette[i - 1])) {
			styles[`--pele-series-${i}`] = palette[i - 1]!;
		} else if (diagramType === "pie") put(`--pele-series-${i}`, `pie${i}`);
		else if (diagramType === "gitGraph") put(`--pele-series-${i}`, `git${i - 1}`);
		else put(`--pele-series-${i}`, `cScale${i - 1}`);
		if (diagramType === "gitGraph") put(`--diagram-git-label-${i}`, `gitBranchLabel${i - 1}`);
	}
	const font =
		typeof variables.fontFamily === "string"
			? variables.fontFamily
			: typeof config.fontFamily === "string"
				? config.fontFamily
				: hasTheme
					? resolved.fontFamily
					: undefined;
	const fontFamily = readFontFamily(font);
	const size = variables.fontSize ?? config.fontSize;
	const fontSize =
		typeof size === "string" || typeof size === "number"
			? Number.parseFloat(String(size))
			: undefined;
	return {
		styles,
		hasTheme,
		fontFamily,
		fontSize: fontSize && Number.isFinite(fontSize) && fontSize > 0 ? fontSize : undefined,
	};
}
