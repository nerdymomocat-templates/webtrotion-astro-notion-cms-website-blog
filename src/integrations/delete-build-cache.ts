import fs from "node:fs";
import type { AstroIntegration } from "astro";
import { BUILD_FOLDER_PATHS } from "../constants";

export default (): AstroIntegration => ({
	name: "delete-build-cache",
	hooks: {
		"astro:build:done": async () => {
			const buildCacheDir = BUILD_FOLDER_PATHS["buildcache"];
			if (fs.existsSync(buildCacheDir)) {
				fs.rmSync(buildCacheDir, { recursive: true, force: true });
				console.log("Build cache deleted successfully.");
			}
		},
	},
});
