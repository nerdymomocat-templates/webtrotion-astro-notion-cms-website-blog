import fs from "fs";
import type { AstroIntegration } from "astro";
import { BUILD_FOLDER_PATHS } from "../constants";

export default (): AstroIntegration => ({
	name: "create-folders-if-missing",
	hooks: {
		"astro:build:start": async () => {
			const dirs = Object.values(BUILD_FOLDER_PATHS);

			dirs.forEach((dir) => {
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir, { recursive: true });
					console.log(`Created directory: ${dir}`);
				} else {
					console.log(`Directory already exists: ${dir}`);
				}
			});

			console.log("Required folders checked and created if missing.");
		},
	},
});
