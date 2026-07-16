import { classicTheme } from "./classic";
import { scholarTheme } from "./scholar";
import { neobrutalTheme } from "./neobrutal";
import { newspaperTheme } from "./newspaper";
import { playfulTheme } from "./playful";

const BUILTIN_PRESETS = {
	classic: classicTheme,
	scholar: scholarTheme,
	neobrutal: neobrutalTheme,
	newspaper: newspaperTheme,
	playful: playfulTheme,
};

const isThemePreset = (value: unknown): value is { name: string } => {
	return Boolean(
		value &&
			typeof value === "object" &&
			"name" in value &&
			"colors" in value &&
			"mix" in value &&
			"typography" in value,
	);
};

const extractThemePreset = (
	moduleValue: Record<string, unknown>,
	fileBaseName: string,
): { name: string } | null => {
	const expectedExport = `${fileBaseName}Theme`;
	const preset = moduleValue[expectedExport] as unknown;
	return isThemePreset(preset) ? preset : null;
};

const loadCustomPresets = (builtinKeys: Set<string>) => {
	const presets: Record<string, { name: string }> = {};
	const modules = import.meta.glob("./*.ts", { eager: true }) as Record<
		string,
		Record<string, unknown>
	>;
	for (const [filepath, moduleValue] of Object.entries(modules)) {
		const filename = filepath.split("/").pop() || "";
		const name = filename.replace(/\.ts$/, "");
		if (name === "index" || name === "merge" || builtinKeys.has(name)) continue;
		const preset = extractThemePreset(moduleValue, name);
		if (preset) presets[name] = preset;
	}
	return presets;
};

const CUSTOM_PRESETS = loadCustomPresets(new Set(Object.keys(BUILTIN_PRESETS)));

export const THEME_PRESETS = {
	...BUILTIN_PRESETS,
	...CUSTOM_PRESETS,
};

export type ThemePresetName = keyof typeof BUILTIN_PRESETS | (string & {});
export const DEFAULT_PRESET: ThemePresetName = "classic";

export { classicTheme, scholarTheme, neobrutalTheme, newspaperTheme, playfulTheme };
