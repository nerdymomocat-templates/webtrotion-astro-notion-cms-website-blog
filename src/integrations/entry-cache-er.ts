import type { AstroIntegration } from "astro";
import {
	downloadFile,
	getAllEntries,
	generateFilePath,
	getPostContentByPostId,
	createReferencesToThisEntry,
} from "../lib/notion/client";
import { LAST_BUILD_TIME } from "../constants";
import fs from "node:fs";

export default (): AstroIntegration => ({
	name: "entry-cache-er",
	hooks: {
		"astro:build:start": async () => {
			const entries = await getAllEntries();

			const referencesInEntries = await Promise.all(
				entries.map(async (entry) => {
					let tasks = [];

					// Conditionally add the downloadFile task
					if (
						entry.FeaturedImage &&
						entry.FeaturedImage.Url &&
						!(
							LAST_BUILD_TIME &&
							entry.LastUpdatedTimeStamp < LAST_BUILD_TIME &&
							!fs.existsSync(generateFilePath(new URL(entry.FeaturedImage.Url)))
						)
					) {
						let url;
						try {
							url = new URL(entry.FeaturedImage.Url);
							tasks.push(downloadFile(url, false));
						} catch (err) {
							console.log("Invalid FeaturedImage URL");
						}
					}

					// Add the getPostContentByPostId task
					const postContentPromise = getPostContentByPostId(entry).then((result) => ({
						referencesInPage: result.referencesInPage,
						entryId: entry.PageId,
					}));
					tasks.push(postContentPromise);

					// Wait for all tasks for this entry to complete
					await Promise.all(tasks);

					// Return only the referencesInPage
					return postContentPromise;
				}),
			);

			// Once all entries are processed, call createBlockIdPostIdMap with the referencesInPages
			createReferencesToThisEntry(referencesInEntries);
		},
	},
});
