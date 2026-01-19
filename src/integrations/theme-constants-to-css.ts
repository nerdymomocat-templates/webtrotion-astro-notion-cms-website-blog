import fs from "node:fs";
import type { AstroIntegration } from "astro";
import JSON5 from "json5";
import { classicCssTemplate } from "../themes/classic";
import { neobrutalCssTemplate } from "../themes/neobrutal";
import { newspaperCssTemplate } from "../themes/newspaper";
import { playfulCssTemplate } from "../themes/playful";
import { scholarCssTemplate } from "../themes/scholar";
import type { ThemeTemplateParams } from "../themes/css-template-types";

const configContent = fs.readFileSync("./constants-config.json5", "utf8");
const config = JSON5.parse(configContent);
const key_value_from_json = { ...config };
const theme_config = key_value_from_json["theme"];

// Helper function that normalizes a color string to hex format
function normalizeColor(value: string): string {
	// If it's already a hex color (3 or 6 digits), return it directly.
	if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
		return value;
	}
	// Otherwise assume it's a space-separated RGB string
	const parts = value.trim().split(/\s+/).map(Number);
	if (parts.length >= 3) {
		const toHex = (num: number): string => {
			const hex = num.toString(16);
			return hex.length === 1 ? "0" + hex : hex;
		};
		return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`;
	}
	// If the format is unexpected, return the original value as a fallback
	return value;
}

export default (): AstroIntegration => ({
	name: "theme-constants-to-css",
	hooks: {
		"astro:build:start": async () => {
			// Use CSS variables that will be populated by Astro's Font API
			// If Font API isn't configured, fall back to system fonts
			const fontSans = "var(--font-sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif)";
			const fontSerif = "var(--font-serif, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif)";
			const fontMono = "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace)";

			const isMarkdownEnabled = key_value_from_json["block-rendering"]?.["process-content-to-markdown"] === true;
			const tocContainerBottom = isMarkdownEnabled ? "bottom-52" : "bottom-40";
			const bottomTocButtonBottom = isMarkdownEnabled ? "bottom-20" : "bottom-8";
			const toTopBtnBottom = isMarkdownEnabled ? "bottom-32" : "bottom-20";
			const copyBtnPosition = isMarkdownEnabled ? "end-4 bottom-8" : "start-4 bottom-8";

			const customColors = {
				ngray: {
					"txt-light": "#787774",
					"txt-dark": "#9B9B9B",
					"bg-light": "#F1F1EF",
					"bg-dark": "#2F2F2F",
					"bg-tag-light": "#E3E2E0",
					"bg-tag-dark": "#5A5A5A",
					"table-header-bg-light": "#F7F6F3",
					"table-header-bg-dark": "#FFFFFF",
					"callout-border-light": "#DFDFDE",
					"callout-border-dark": "#373737",
				},
				nlgray: {
					"bg-tag-light": "#F1F1F0",
					"bg-tag-dark": "#373737",
				},
				nbrown: {
					"txt-light": "#9F6B53",
					"txt-dark": "#BA856F",
					"bg-light": "#F4EEEE",
					"bg-dark": "#4A3228",
					"bg-tag-light": "#EEE0DA",
					"bg-tag-dark": "#603B2C",
				},
				norange: {
					"txt-light": "#D9730D",
					"txt-dark": "#C77D48",
					"bg-light": "#FBECDD",
					"bg-dark": "#5C3B23",
					"bg-tag-light": "#FADEC9",
					"bg-tag-dark": "#854C1D",
				},
				nyellow: {
					"txt-light": "#CB912F",
					"txt-dark": "#CA9849",
					"bg-light": "#FBEDD6",
					"bg-dark": "#56452F",
					"bg-tag-light": "#F9E4BC",
					"bg-tag-dark": "#835E33",
				},
				ngreen: {
					"txt-light": "#448361",
					"txt-dark": "#529E72",
					"bg-light": "#EDF3EC",
					"bg-dark": "#243D30",
					"bg-tag-light": "#DBEDDB",
					"bg-tag-dark": "#2B593F",
				},
				nblue: {
					"txt-light": "#337EA9",
					"txt-dark": "#5E87C9",
					"bg-light": "#E7F3F8",
					"bg-dark": "#143A4E",
					"bg-tag-light": "#D3E5EF",
					"bg-tag-dark": "#28456C",
				},
				npurple: {
					"txt-light": "#9065B0",
					"txt-dark": "#9D68D3",
					"bg-light": "#F7F3F8",
					"bg-dark": "#3C2D49",
					"bg-tag-light": "#E8DEEE",
					"bg-tag-dark": "#492F64",
				},
				npink: {
					"txt-light": "#C14C8A",
					"txt-dark": "#9D68D3",
					"bg-light": "#FBF2F5",
					"bg-dark": "#4E2C3C",
					"bg-tag-light": "#F5E0E9",
					"bg-tag-dark": "#69314C",
				},
				nred: {
					"txt-light": "#D44C47",
					"txt-dark": "#DF5452",
					"bg-light": "#FDEBEC",
					"bg-dark": "#522E2A",
					"bg-tag-light": "#FFE2DD",
					"bg-tag-dark": "#6E3630",
				},
			};

			let colorDefinitions = "";
			for (const [group, shades] of Object.entries(customColors)) {
				for (const [shade, value] of Object.entries(shades)) {
					colorDefinitions += `  --color-${group}-${shade}: ${value};\n`;
				}
			}

			const createCssVariables = (theme) => {
				let cssContent = "";
				let bgHex = "#ffffff";

				for (const key in theme_config.colors) {
					let color = theme_config.colors[key][theme];
					let cssValue;
					// If no color is defined, use defaults in hex format
					if (!color) {
						cssValue = key.includes("bg")
							? theme === "light" ? "#ffffff" : "#000000"
							: theme === "light" ? "#000000" : "#ffffff";
					} else {
						// Normalize the provided color value to hex
						cssValue = normalizeColor(color);
					}

					if (key === "bg") bgHex = cssValue;

					cssContent += `    --theme-${key}: ${cssValue};\n`;
				}

				// Compute popover-bg based on bg color
				const refHex =
					parseInt(bgHex.slice(5, 7), 16) > parseInt(bgHex.slice(1, 3), 16)
						? theme === "light" ? "#D2E7F7" : "#acd5e7" // cool
						: theme === "light" ? "#FBE4CE" : "#F3C699"; // warm

				const mix = (v1: string, v2: string) =>
					Math.round(0.9 * parseInt(v1, 16) + 0.1 * parseInt(v2, 16))
						.toString(16)
						.padStart(2, "0");

				const popoverHex = `#${mix(bgHex.slice(1, 3), refHex.slice(1, 3))}${mix(bgHex.slice(3, 5), refHex.slice(3, 5))}${mix(bgHex.slice(5, 7), refHex.slice(5, 7))}`;
				cssContent += `    --theme-popover-bg: ${popoverHex};`;

				return cssContent;
			};

			const themeKeys = ["classic", "scholar", "neobrutal", "newspaper", "playful"];
			const rawThemeName = (theme_config?.preset || "classic").toLowerCase();
			const resolvedThemeName = themeKeys.includes(rawThemeName) ? rawThemeName : "classic";

			const templateParams: ThemeTemplateParams = {
				fontSans,
				fontSerif,
				fontMono,
				colorDefinitions,
				lightVariables: createCssVariables("light"),
				darkVariables: createCssVariables("dark"),
				tocContainerBottom,
				bottomTocButtonBottom,
				toTopBtnBottom,
				copyBtnPosition,
			};

			const themeTemplates: Record<string, (params: ThemeTemplateParams) => string> = {
				classic: classicCssTemplate,
				scholar: scholarCssTemplate,
				neobrutal: neobrutalCssTemplate,
				newspaper: newspaperCssTemplate,
				playful: playfulCssTemplate,
			};

			const buildCssContent = (themeName: string) => {
				const template = themeTemplates[themeName] ?? classicCssTemplate;
				return template(templateParams);
			};

			const cssContent = buildCssContent(resolvedThemeName);
			const cssOutputPath = "src/styles/global.css";
			fs.writeFileSync(cssOutputPath, cssContent);
		},
	},
});
