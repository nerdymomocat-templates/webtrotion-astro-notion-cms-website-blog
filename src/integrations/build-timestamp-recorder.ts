import fs from "fs";
import path from "path";
import type { AstroIntegration } from "astro";

const TEMP_FILE_PATH = path.join("./tmp", "build_start_timestamp_temp.txt");
const FINAL_FILE_PATH = path.join("./tmp", "build_start_timestamp.txt");

export default (): AstroIntegration => ({
	name: "build-timestamp-recorder",
	hooks: {
		"astro:build:start": async () => {
			const currentTime = new Date();
			currentTime.setMinutes(currentTime.getMinutes() - 2); // Subtract 5 minutes for safety
			const buildTimestamp = currentTime.getTime(); // Get timestamp

			fs.writeFileSync(TEMP_FILE_PATH, buildTimestamp.toString());
		},
		"astro:build:done": async () => {
			if (fs.existsSync(TEMP_FILE_PATH)) {
				fs.renameSync(TEMP_FILE_PATH, FINAL_FILE_PATH);
				console.log("Build Start Time Successfully Recorded");
			}
		},
	},
});
