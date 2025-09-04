// src/content/config.ts
import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.date(),
		modDate: z.date().optional(),
		tags: z.array(z.string()).optional(),
		authors: z.array(z.string()).optional(),
		ogImage: z.string().optional(),
		isDraft: z.boolean().optional(),
	}),
});

export const collections = {
	blog: blogCollection,
};
