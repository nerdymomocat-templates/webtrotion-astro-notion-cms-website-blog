import fs from "node:fs";
import type { AstroIntegration } from "astro";

export default (): AstroIntegration => ({
	name: "delete-build-cache",
	hooks: {
		"astro:build:done": async () => {
			const buildCacheDir = "./buildcache";
			if (fs.existsSync(buildCacheDir)) {
				fs.rmSync(buildCacheDir, { recursive: true, force: true });
				console.log("Build cache deleted successfully.");
			}
		},
	},
});
