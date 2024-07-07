import fs from "node:fs";
import axios from "axios";
import type { AxiosResponse } from "axios";
import sharp from "sharp";
import retry from "async-retry";
import ExifTransformer from "exif-be-gone";
import pngToIco from "png-to-ico";
import path from "path";
import {
	NOTION_API_SECRET,
	DATABASE_ID,
	NUMBER_OF_POSTS_PER_PAGE,
	REQUEST_TIMEOUT_MS,
	MENU_PAGES_COLLECTION,
	OPTIMIZE_IMAGES,
	LAST_BUILD_TIME,
	HIDE_UNDERSCORE_SLUGS_IN_LISTS,
} from "../../constants";
import type * as responses from "./responses";
import type * as requestParams from "./request-params";
import type {
	Database,
	Post,
	Block,
	Paragraph,
	Heading1,
	Heading2,
	Heading3,
	BulletedListItem,
	NumberedListItem,
	ToDo,
	NImage,
	Code,
	Quote,
	Equation,
	Callout,
	Embed,
	Video,
	File,
	Bookmark,
	LinkPreview,
	SyncedBlock,
	SyncedFrom,
	Table,
	TableRow,
	TableCell,
	Toggle,
	ColumnList,
	Column,
	TableOfContents,
	RichText,
	Text,
	Annotation,
	SelectProperty,
	Emoji,
	FileObject,
	LinkToPage,
	Mention,
	Reference,
	NAudio,
	ReferencesInPage,
} from "../interfaces";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { Client, APIResponseError } from "@notionhq/client";
import { getFormattedDateWithTime } from "../../utils/date";
import { slugify } from "../../utils/slugify";
import { extractReferencesInPage } from "../blog-helpers";

const client = new Client({
	auth: NOTION_API_SECRET,
});

let allEntriesCache: Post[] | null = null;
let dbCache: Database | null = null;
let blockIdPostIdMap: { [blockId: string]: string } | null = null;

const numberOfRetry = 2;

type QueryFilters = requestParams.CompoundFilterObject;

export async function getAllEntries(): Promise<Post[]> {
	if (allEntriesCache !== null) {
		return allEntriesCache;
	}
	// console.log("Did not find cache for getAllEntries");

	const queryFilters: QueryFilters = {};

	const params: requestParams.QueryDatabase = {
		database_id: DATABASE_ID,
		filter: {
			and: [
				{
					property: "Published",
					checkbox: {
						equals: true,
					},
				},
				{
					property: "Publish Date",
					formula: {
						date: {
							on_or_before: new Date().toISOString(),
						},
					},
				},
				{
					property: "Slug",
					formula: {
						string: {
							is_not_empty: true,
						},
					},
				},

				...(queryFilters?.and || []),
			],
			or: queryFilters?.or || undefined,
		},
		sorts: [
			{
				timestamp: "created_time",
				direction: "descending",
			},
		],
		page_size: 100,
	};

	let results: responses.PageObject[] = [];
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.databases.query(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.QueryDatabaseResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	allEntriesCache = results
		.filter((pageObject) => _validPageObject(pageObject))
		.map((pageObject) => _buildPost(pageObject));

	allEntriesCache = allEntriesCache.sort(
		(a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
	);
	//console.log("posts Cache", postsCache);
	return allEntriesCache;
}

export async function getAllPosts(): Promise<Post[]> {
	const allEntries = await getAllEntries();
	return allEntries.filter((post) => !(MENU_PAGES_COLLECTION === post.Collection));
}

export async function getAllPages(): Promise<Post[]> {
	const allEntries = await getAllEntries();
	return allEntries.filter((post) => MENU_PAGES_COLLECTION === post.Collection);
}

export async function getPosts(pageSize = 10): Promise<Post[]> {
	const allPosts = await getAllPosts();
	return allPosts.slice(0, pageSize);
}

export async function getRankedPosts(pageSize = 10): Promise<Post[]> {
	const allPosts = await getAllPosts();
	return allPosts
		.filter((post) => !!post.Rank)
		.sort((a, b) => {
			if (a.Rank > b.Rank) {
				return -1;
			} else if (a.Rank === b.Rank) {
				return 0;
			}
			return 1;
		})
		.slice(0, pageSize);
}

export async function getPageBySlug(slug: string): Promise<Post | null> {
	const allPosts = await getAllPages();
	return allPosts.find((post) => post.Slug === slug) || null;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
	const allPosts = await getAllEntries();
	return allPosts.find((post) => post.Slug === slug) || null;
}

export async function getPostByPageId(pageId: string): Promise<Post | null> {
	const allPosts = await getAllEntries();
	return allPosts.find((post) => post.PageId === pageId) || null;
}

export async function getPostsByTag(tagName: string, pageSize = 10): Promise<Post[]> {
	if (!tagName) return [];

	const allPosts = await getAllPosts();
	return allPosts
		.filter((post) => post.Tags.find((tag) => tag.name === tagName))
		.slice(0, pageSize);
}

// page starts from 1 not 0
export async function getPostsByPage(page: number): Promise<Post[]> {
	if (page < 1) {
		return [];
	}

	const allPosts = await getAllPosts();

	const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
	const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

	return allPosts.slice(startIndex, endIndex);
}

// page starts from 1 not 0
export async function getPostsByTagAndPage(tagName: string, page: number): Promise<Post[]> {
	if (page < 1) {
		return [];
	}

	const allPosts = await getAllPosts();
	const posts = allPosts.filter((post) => post.Tags.find((tag) => tag.name === tagName));

	const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
	const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

	return posts.slice(startIndex, endIndex);
}

export async function getNumberOfPages(): Promise<number> {
	const allPosts = await getAllPosts();
	return (
		Math.floor(allPosts.length / NUMBER_OF_POSTS_PER_PAGE) +
		(allPosts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0)
	);
}

export async function getNumberOfPagesByTag(tagName: string): Promise<number> {
	const allPosts = await getAllPosts();
	const posts = allPosts.filter((post) => post.Tags.find((tag) => tag.name === tagName));
	return (
		Math.floor(posts.length / NUMBER_OF_POSTS_PER_PAGE) +
		(posts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0)
	);
}

export async function getPostContentByPostId(
	post: Post,
): Promise<{ blocks: Block[]; referencesInPage: ReferencesInPage[] | null }> {
	const tmpDir = "./tmp";
	const cacheFilePath = path.join(tmpDir, `${post.PageId}.json`);
	const cacheReferencesInPageFilePath = path.join(tmpDir, `${post.PageId}_ReferencesInPage.json`);
	const isPostUpdatedAfterLastBuild = LAST_BUILD_TIME
		? post.LastUpdatedTimeStamp > LAST_BUILD_TIME
		: true;

	// Ensure the tmp directory exists
	if (!fs.existsSync(tmpDir)) {
		fs.mkdirSync(tmpDir, { recursive: true });
	}

	if (!isPostUpdatedAfterLastBuild && fs.existsSync(cacheFilePath)) {
		// If the post was not updated after the last build and cache file exists, return the cached data
		console.log("Hit cache for", post.Slug);
		const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
		let referencesInPage = null;
		if (!fs.existsSync(cacheReferencesInPageFilePath)) {
			referencesInPage = extractReferencesInPage(post.PageId, cachedData);
			fs.writeFileSync(
				cacheReferencesInPageFilePath,
				JSON.stringify(referencesInPage, null, 2),
				"utf-8",
			);
		} else {
			referencesInPage = JSON.parse(fs.readFileSync(cacheReferencesInPageFilePath, "utf-8"));
		}
		return { blocks: cachedData, referencesInPage: referencesInPage };
	} else {
		// If the post was updated after the last build or cache does not exist, fetch new data
		const allBlocks = await getAllBlocksByBlockId(post.PageId);

		// Write the new data to the cache file
		fs.writeFileSync(cacheFilePath, JSON.stringify(allBlocks, null, 2), "utf-8");
		const referencesInPage = extractReferencesInPage(post.PageId, allBlocks);
		fs.writeFileSync(
			cacheReferencesInPageFilePath,
			JSON.stringify(referencesInPage, null, 2),
			"utf-8",
		);
		return { blocks: allBlocks, referencesInPage: referencesInPage };
	}
}

export function createReferencesToThisEntry(
	referencesInEntries: { referencesInPage: ReferencesInPage[] | null; entryId: string }[],
) {
	const entryReferencesMap: { [entryId: string]: { entryId: string; block: Block }[] } = {};

	// Initialize entryReferencesMap with empty arrays for each entry
	referencesInEntries.forEach(({ entryId }) => {
		entryReferencesMap[entryId] = [];
	});

	// Collect blocks for each entry if there's a match in other_pages
	referencesInEntries.forEach(({ referencesInPage, entryId }) => {
		if (referencesInPage) {
			referencesInPage.forEach((reference) => {
				// Check and collect blocks where InternalHref.PageId matches an entryId in the map
				reference.other_pages.forEach((richText) => {
					if (richText.InternalHref?.PageId && entryReferencesMap[richText.InternalHref.PageId]) {
						entryReferencesMap[richText.InternalHref.PageId].push({
							entryId: entryId,
							block: reference.block,
						});
					} else if (
						richText.Mention?.Page?.PageId &&
						entryReferencesMap[richText.Mention?.Page?.PageId]
					) {
						entryReferencesMap[richText.Mention.Page.PageId].push({
							entryId: entryId,
							block: reference.block,
						});
					}
				});

				// Check and collect blocks where link_to_pageid matches an entryId in the map
				if (reference.link_to_pageid && entryReferencesMap[reference.link_to_pageid]) {
					entryReferencesMap[reference.link_to_pageid].push({
						entryId: entryId,
						block: reference.block,
					});
				}
			});
		}
	});

	// Write each entry's references to a file
	Object.entries(entryReferencesMap).forEach(([entryId, references]) => {
		const filePath = path.join("./tmp", `${entryId}_ReferencesToPage.json`);
		fs.writeFileSync(filePath, JSON.stringify(references, null, 2), "utf-8");
	});
}

export async function getAllBlocksByBlockId(blockId: string): Promise<Block[]> {
	let results: responses.BlockObject[] = [];

	const params: requestParams.RetrieveBlockChildren = {
		block_id: blockId,
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.children.list(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockChildrenResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	const allBlocks = results.map((blockObject) => _buildBlock(blockObject));

	for (let i = 0; i < allBlocks.length; i++) {
		const block = allBlocks[i];

		if (block.Type === "table" && block.Table) {
			block.Table.Rows = await _getTableRows(block.Id);
		} else if (block.Type === "column_list" && block.ColumnList) {
			block.ColumnList.Columns = await _getColumns(block.Id);
		} else if (block.Type === "bulleted_list_item" && block.BulletedListItem && block.HasChildren) {
			block.BulletedListItem.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "numbered_list_item" && block.NumberedListItem && block.HasChildren) {
			block.NumberedListItem.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "to_do" && block.ToDo && block.HasChildren) {
			block.ToDo.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "synced_block" && block.SyncedBlock) {
			block.SyncedBlock.Children = await _getSyncedBlockChildren(block);
		} else if (block.Type === "toggle" && block.Toggle) {
			block.Toggle.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "paragraph" && block.Paragraph && block.HasChildren) {
			block.Paragraph.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "heading_1" && block.Heading1 && block.HasChildren) {
			block.Heading1.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "heading_2" && block.Heading2 && block.HasChildren) {
			block.Heading2.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "heading_3" && block.Heading3 && block.HasChildren) {
			block.Heading3.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "quote" && block.Quote && block.HasChildren) {
			block.Quote.Children = await getAllBlocksByBlockId(block.Id);
		} else if (block.Type === "callout" && block.Callout && block.HasChildren) {
			block.Callout.Children = await getAllBlocksByBlockId(block.Id);
		}
	}

	return allBlocks;
}

export async function getBlock(blockId: string): Promise<Block | null> {
	const params: requestParams.RetrieveBlock = {
		block_id: blockId,
	};

	try {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.retrieve(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
			},
		);

		return _buildBlock(res);
	} catch (error) {
		// Log the error if necessary
		console.error("Error retrieving block:" + blockId, error);
		return null; // Return null if an error occurs
	}
}

export function getUniqueTags(posts: Post[]) {
	const tagNames: string[] = [];
	return posts
		.flatMap((post) => post.Tags)
		.reduce((acc, tag) => {
			if (!tagNames.includes(tag.name)) {
				acc.push(tag);
				tagNames.push(tag.name);
			}
			return acc;
		}, [] as SelectProperty[])
		.sort((a: SelectProperty, b: SelectProperty) => a.name.localeCompare(b.name));
}

export async function getAllTags(): Promise<SelectProperty[]> {
	const allPosts = await getAllPosts();
	const filteredPosts = HIDE_UNDERSCORE_SLUGS_IN_LISTS
		? allPosts.filter((post) => !post.Slug.startsWith("_"))
		: allPosts;

	return getUniqueTags(filteredPosts);
}

export async function getAllTagsWithCounts(): Promise<
	{ name: string; count: number; description: string; color: string }[]
> {
	const allPosts = await getAllPosts();
	const filteredPosts = HIDE_UNDERSCORE_SLUGS_IN_LISTS
		? allPosts.filter((post) => !post.Slug.startsWith("_"))
		: allPosts;
	const { propertiesRaw } = await getDatabase();
	const options = propertiesRaw.Tags?.multi_select?.options || [];

	const tagsNameWDesc = options.reduce((acc, option) => {
		acc[option.name] = option.description || "";
		return acc;
	}, {});
	const tagCounts: Record<string, { count: number; description: string; color: string }> = {};

	filteredPosts.forEach((post) => {
		post.Tags.forEach((tag) => {
			const tagName = tag.name;
			if (tagCounts[tag.name]) {
				tagCounts[tag.name].count++;
			} else {
				tagCounts[tagName] = {
					count: 1,
					description: tagsNameWDesc[tag.name] ? tagsNameWDesc[tag.name] : "",
					color: tag.color,
				};
			}
		});
	});

	// Convert the object to an array and sort it
	const sortedTagCounts = Object.entries(tagCounts)
		.map(([tagName, { count, description, color }]) => ({
			name: tagName,
			color,
			count,
			description,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	return sortedTagCounts;
}

export function generateFilePath(url: URL, convertoWebp: boolean = false) {
	const BASE_DIR = "./public/notion/";
	if (!fs.existsSync(BASE_DIR)) {
		fs.mkdirSync(BASE_DIR);
	}

	const dir = BASE_DIR + url.pathname.split("/").slice(-2)[0];
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	const filename = decodeURIComponent(url.pathname.split("/").slice(-1)[0]);
	let filepath = `${dir}/${filename}`;

	if (convertoWebp && isConvImageType(filename)) {
		filepath = `${dir}/${filename.substring(0, filename.lastIndexOf("."))}.webp`;
	}
	return filepath;
}

export function isConvImageType(filepath: string) {
	if (
		filepath.includes(".png") ||
		filepath.includes(".jpg") ||
		filepath.includes(".jpeg") ||
		filepath.includes(".avif")
	) {
		return true;
	}
	return false;
}

export async function downloadFile(
	url: URL,
	optimize_img: boolean = true,
	isFavicon: boolean = false,
) {
	optimize_img = optimize_img ? OPTIMIZE_IMAGES : optimize_img;
	let res!: AxiosResponse;
	try {
		res = await axios({
			method: "get",
			url: url.toString(),
			timeout: REQUEST_TIMEOUT_MS,
			responseType: "stream",
		});
	} catch (err) {
		console.log(err);
		return Promise.resolve();
	}

	if (!res || res.status != 200) {
		console.log(res);
		return Promise.resolve();
	}

	const filepath = generateFilePath(url);

	let stream = res.data;
	if (res.headers["content-type"] === "image/jpeg") {
		stream = stream.pipe(sharp().rotate());
	}

	const isImage = res.headers["content-type"]?.startsWith("image/");

	const processFavicon = async (sourcePath: string) => {
		const favicon16Path = "./public/favicon16.png";
		const favicon32Path = "./public/favicon32.png";
		const faviconIcoPath = "./public/favicon.ico";

		try {
			// Save the original image as favicon16.png (16x16)
			await sharp(sourcePath).resize(16, 16).toFile(favicon16Path);

			// Save the original image as favicon32.png (32x32)
			await sharp(sourcePath).resize(32, 32).toFile(favicon32Path);

			// Convert both favicon16.png and favicon32.png to favicon.ico
			const icoBuffer = await pngToIco([favicon16Path, favicon32Path]);
			fs.writeFileSync(faviconIcoPath, icoBuffer);

			// Delete the temporary PNG files
			fs.unlinkSync(favicon16Path);
			fs.unlinkSync(favicon32Path);
		} catch (err) {
			console.error("Error processing favicon:", err);
		}
	};

	if (isImage && isConvImageType(filepath) && optimize_img) {
		// Process and write only the optimized webp image
		const webpPath = generateFilePath(url, true);
		// console.log('Writing to', webpPath);
		await stream
			.pipe(
				sharp()
					// .resize({ width: 1024 }) // Adjust the size as needed for "medium"
					.webp({ quality: 80 }),
			) // Adjust quality as needed
			.toFile(webpPath)
			.catch((err) => {
				console.error("Error processing image:", err);
			});
	} else {
		// Original behavior for non-image files or when not optimizing
		const writeStream = fs.createWriteStream(filepath);
		stream.pipe(new ExifTransformer()).pipe(writeStream);

		const writeStreamPromise = new Promise<void>((resolve) => {
			// After the file is written, check if favicon processing is needed
			writeStream.on("finish", async () => {
				if (isFavicon) {
					const fav = await processFavicon(filepath);
				}

				resolve();
			});

			stream.on("error", function (err) {
				console.error("Error reading stream:", err);
				resolve();
			});

			writeStream.on("error", function (err) {
				console.error("Error writing file:", err);
				resolve();
			});
		});

		await writeStreamPromise;
	}
}

export async function processFileBlocks(fileAttachedBlocks: Block[]) {
	await Promise.all(
		fileAttachedBlocks.map(async (block) => {
			const fileDetails = (block.NImage || block.File || block.Video || block.NAudio).File;
			const expiryTime = fileDetails.ExpiryTime;
			let url = new URL(fileDetails.Url);

			const cacheFilePath = generateFilePath(url, isConvImageType(url.pathname) && OPTIMIZE_IMAGES);

			const shouldDownload = LAST_BUILD_TIME
				? block.LastUpdatedTimeStamp > LAST_BUILD_TIME || !fs.existsSync(cacheFilePath)
				: true;

			if (shouldDownload) {
				if (Date.parse(expiryTime) < Date.now()) {
					// If the file is expired, get the block again and extract the new URL
					const updatedBlock = await getBlock(block.Id);
					if (!updatedBlock) {
						return null;
					}
					url = new URL(
						(
							updatedBlock.NImage ||
							updatedBlock.File ||
							updatedBlock.Video ||
							updatedBlock.NAudio
						).File.Url,
					);
				}

				return downloadFile(url); // Download the file
			}

			return null;
		}),
	);
}

export async function getDatabase(): Promise<Database> {
	if (dbCache !== null) {
		return Promise.resolve(dbCache);
	}

	const params: requestParams.RetrieveDatabase = {
		database_id: DATABASE_ID,
	};

	const res = await retry(
		async (bail) => {
			try {
				return (await client.databases.retrieve(
					params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
				)) as responses.RetrieveDatabaseResponse;
			} catch (error: unknown) {
				if (error instanceof APIResponseError) {
					if (error.status && error.status >= 400 && error.status < 500) {
						bail(error);
					}
				}
				throw error;
			}
		},
		{
			retries: numberOfRetry,
		},
	);

	let icon: FileObject | Emoji | null = null;
	if (res.icon) {
		if (res.icon.type === "emoji" && "emoji" in res.icon) {
			icon = {
				Type: res.icon.type,
				Emoji: res.icon.emoji,
			};
		} else if (res.icon.type === "external" && "external" in res.icon) {
			icon = {
				Type: res.icon.type,
				Url: res.icon.external?.url || "",
			};
		} else if (res.icon.type === "file" && "file" in res.icon) {
			icon = {
				Type: res.icon.type,
				Url: res.icon.file?.url || "",
			};
		}
	}

	let cover: FileObject | null = null;
	if (res.cover) {
		cover = {
			Type: res.cover.type,
			Url: res.cover.external?.url || res.cover?.file?.url || "",
		};
	}

	const database: Database = {
		Title: res.title.map((richText) => richText.plain_text).join(""),
		Description: res.description.map((richText) => richText.plain_text).join(""),
		Icon: icon,
		Cover: cover,
		propertiesRaw: res.properties,
		LastUpdatedTimeStamp: new Date(res.last_edited_time),
	};

	dbCache = database;

	return database;
}

function _buildBlock(blockObject: responses.BlockObject): Block {
	const block: Block = {
		Id: blockObject.id,
		Type: blockObject.type,
		HasChildren: blockObject.has_children,
		LastUpdatedTimeStamp: new Date(blockObject.last_edited_time),
	};

	switch (blockObject.type) {
		case "paragraph":
			if (blockObject.paragraph) {
				const paragraph: Paragraph = {
					RichTexts: blockObject.paragraph.rich_text.map(_buildRichText),
					Color: blockObject.paragraph.color,
				};
				block.Paragraph = paragraph;
			}
			break;
		case "heading_1":
			if (blockObject.heading_1) {
				const heading1: Heading1 = {
					RichTexts: blockObject.heading_1.rich_text.map(_buildRichText),
					Color: blockObject.heading_1.color,
					IsToggleable: blockObject.heading_1.is_toggleable,
				};
				block.Heading1 = heading1;
			}
			break;
		case "heading_2":
			if (blockObject.heading_2) {
				const heading2: Heading2 = {
					RichTexts: blockObject.heading_2.rich_text.map(_buildRichText),
					Color: blockObject.heading_2.color,
					IsToggleable: blockObject.heading_2.is_toggleable,
				};
				block.Heading2 = heading2;
			}
			break;
		case "heading_3":
			if (blockObject.heading_3) {
				const heading3: Heading3 = {
					RichTexts: blockObject.heading_3.rich_text.map(_buildRichText),
					Color: blockObject.heading_3.color,
					IsToggleable: blockObject.heading_3.is_toggleable,
				};
				block.Heading3 = heading3;
			}
			break;
		case "bulleted_list_item":
			if (blockObject.bulleted_list_item) {
				const bulletedListItem: BulletedListItem = {
					RichTexts: blockObject.bulleted_list_item.rich_text.map(_buildRichText),
					Color: blockObject.bulleted_list_item.color,
				};
				block.BulletedListItem = bulletedListItem;
			}
			break;
		case "numbered_list_item":
			if (blockObject.numbered_list_item) {
				const numberedListItem: NumberedListItem = {
					RichTexts: blockObject.numbered_list_item.rich_text.map(_buildRichText),
					Color: blockObject.numbered_list_item.color,
				};
				block.NumberedListItem = numberedListItem;
			}
			break;
		case "to_do":
			if (blockObject.to_do) {
				const toDo: ToDo = {
					RichTexts: blockObject.to_do.rich_text.map(_buildRichText),
					Checked: blockObject.to_do.checked,
					Color: blockObject.to_do.color,
				};
				block.ToDo = toDo;
			}
			break;
		case "video":
			if (blockObject.video) {
				const video: Video = {
					Caption: blockObject.video.caption?.map(_buildRichText) || [],
					Type: blockObject.video.type,
				};
				if (blockObject.video.type === "external" && blockObject.video.external) {
					video.External = { Url: blockObject.video.external.url };
				} else if (blockObject.video.type === "file" && blockObject.video.file) {
					video.File = {
						Type: blockObject.video.type,
						Url: blockObject.video.file.url,
						ExpiryTime: blockObject.video.file.expiry_time,
						// Size: blockObject.video.file.size,
					};
				}
				block.Video = video;
			}
			break;
		case "image":
			if (blockObject.image) {
				const image: NImage = {
					Caption: blockObject.image.caption?.map(_buildRichText) || [],
					Type: blockObject.image.type,
				};
				if (blockObject.image.type === "external" && blockObject.image.external) {
					image.External = { Url: blockObject.image.external.url };
				} else if (blockObject.image.type === "file" && blockObject.image.file) {
					image.File = {
						Type: blockObject.image.type,
						Url: blockObject.image.file.url,
						OptimizedUrl:
							isConvImageType(blockObject.image.file.url) && OPTIMIZE_IMAGES
								? blockObject.image.file.url.substring(
										0,
										blockObject.image.file.url.lastIndexOf("."),
									) + ".webp"
								: blockObject.image.file.url,
						ExpiryTime: blockObject.image.file.expiry_time,
					};
				}
				block.NImage = image;
			}
			break;
		case "audio":
			if (blockObject.audio) {
				const audio: NAudio = {
					Caption: blockObject.audio.caption?.map(_buildRichText) || [],
					Type: blockObject.audio.type,
				};
				if (blockObject.audio.type === "external" && blockObject.audio.external) {
					audio.External = { Url: blockObject.audio.external.url };
				} else if (blockObject.audio.type === "file" && blockObject.audio.file) {
					audio.File = {
						Type: blockObject.audio.type,
						Url: blockObject.audio.file.url,
						ExpiryTime: blockObject.audio.file.expiry_time,
					};
				}
				block.NAudio = audio;
			}
			break;
		case "file":
			if (blockObject.file) {
				const file: File = {
					Caption: blockObject.file.caption?.map(_buildRichText) || [],
					Type: blockObject.file.type,
				};
				if (blockObject.file.type === "external" && blockObject.file.external) {
					file.External = { Url: blockObject.file.external.url };
				} else if (blockObject.file.type === "file" && blockObject.file.file) {
					file.File = {
						Type: blockObject.file.type,
						Url: blockObject.file.file.url,
						ExpiryTime: blockObject.file.file.expiry_time,
					};
				}
				block.File = file;
			}
			break;
		case "code":
			if (blockObject.code) {
				const code: Code = {
					Caption: blockObject.code.caption?.map(_buildRichText) || [],
					RichTexts: blockObject.code.rich_text.map(_buildRichText),
					Language: blockObject.code.language,
				};
				block.Code = code;
			}
			break;
		case "quote":
			if (blockObject.quote) {
				const quote: Quote = {
					RichTexts: blockObject.quote.rich_text.map(_buildRichText),
					Color: blockObject.quote.color,
				};
				block.Quote = quote;
			}
			break;
		case "equation":
			if (blockObject.equation) {
				const equation: Equation = {
					Expression: blockObject.equation.expression,
				};
				block.Equation = equation;
			}
			break;
		case "callout":
			if (blockObject.callout) {
				let icon: FileObject | Emoji | null = null;
				if (blockObject.callout.icon) {
					if (blockObject.callout.icon.type === "emoji" && "emoji" in blockObject.callout.icon) {
						icon = {
							Type: blockObject.callout.icon.type,
							Emoji: blockObject.callout.icon.emoji,
						};
					} else if (
						blockObject.callout.icon.type === "external" &&
						"external" in blockObject.callout.icon
					) {
						icon = {
							Type: blockObject.callout.icon.type,
							Url: blockObject.callout.icon.external?.url || "",
						};
					}
				}

				const callout: Callout = {
					RichTexts: blockObject.callout.rich_text.map(_buildRichText),
					Icon: icon,
					Color: blockObject.callout.color,
				};
				block.Callout = callout;
			}
			break;
		case "synced_block":
			if (blockObject.synced_block) {
				let syncedFrom: SyncedFrom | null = null;
				if (blockObject.synced_block.synced_from && blockObject.synced_block.synced_from.block_id) {
					syncedFrom = {
						BlockId: blockObject.synced_block.synced_from.block_id,
					};
				}

				const syncedBlock: SyncedBlock = {
					SyncedFrom: syncedFrom,
				};
				block.SyncedBlock = syncedBlock;
			}
			break;
		case "toggle":
			if (blockObject.toggle) {
				const toggle: Toggle = {
					RichTexts: blockObject.toggle.rich_text.map(_buildRichText),
					Color: blockObject.toggle.color,
					Children: [],
				};
				block.Toggle = toggle;
			}
			break;
		case "embed":
			if (blockObject.embed) {
				const embed: Embed = {
					Caption: blockObject.embed.caption?.map(_buildRichText) || [],
					Url: blockObject.embed.url,
				};
				block.Embed = embed;
			}
			break;
		case "bookmark":
			if (blockObject.bookmark) {
				const bookmark: Bookmark = {
					Caption: blockObject.bookmark.caption?.map(_buildRichText) || [],
					Url: blockObject.bookmark.url,
				};
				block.Bookmark = bookmark;
			}
			break;
		case "link_preview":
			if (blockObject.link_preview) {
				const linkPreview: LinkPreview = {
					Caption: blockObject.link_preview.caption?.map(_buildRichText) || [],
					Url: blockObject.link_preview.url,
				};
				block.LinkPreview = linkPreview;
			}
			break;
		case "table":
			if (blockObject.table) {
				const table: Table = {
					TableWidth: blockObject.table.table_width,
					HasColumnHeader: blockObject.table.has_column_header,
					HasRowHeader: blockObject.table.has_row_header,
					Rows: [],
				};
				block.Table = table;
			}
			break;
		case "column_list":
			// eslint-disable-next-line no-case-declarations
			const columnList: ColumnList = {
				Columns: [],
			};
			block.ColumnList = columnList;
			break;
		case "table_of_contents":
			if (blockObject.table_of_contents) {
				const tableOfContents: TableOfContents = {
					Color: blockObject.table_of_contents.color,
				};
				block.TableOfContents = tableOfContents;
			}
			break;
		case "link_to_page":
			if (blockObject.link_to_page && blockObject.link_to_page.page_id) {
				const linkToPage: LinkToPage = {
					Type: blockObject.link_to_page.type,
					PageId: blockObject.link_to_page.page_id,
				};
				block.LinkToPage = linkToPage;
			}
			break;
	}

	return block;
}

async function _getTableRows(blockId: string): Promise<TableRow[]> {
	let results: responses.BlockObject[] = [];

	const params: requestParams.RetrieveBlockChildren = {
		block_id: blockId,
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.children.list(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockChildrenResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	return results.map((blockObject) => {
		const tableRow: TableRow = {
			Id: blockObject.id,
			Type: blockObject.type,
			HasChildren: blockObject.has_children,
			Cells: [],
		};

		if (blockObject.type === "table_row" && blockObject.table_row) {
			const cells: TableCell[] = blockObject.table_row.cells.map((cell) => {
				const tableCell: TableCell = {
					RichTexts: cell.map(_buildRichText),
				};

				return tableCell;
			});

			tableRow.Cells = cells;
		}

		return tableRow;
	});
}

async function _getColumns(blockId: string): Promise<Column[]> {
	let results: responses.BlockObject[] = [];

	const params: requestParams.RetrieveBlockChildren = {
		block_id: blockId,
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const res = await retry(
			async (bail) => {
				try {
					return (await client.blocks.children.list(
						params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
					)) as responses.RetrieveBlockChildrenResponse;
				} catch (error: unknown) {
					if (error instanceof APIResponseError) {
						if (error.status && error.status >= 400 && error.status < 500) {
							bail(error);
						}
					}
					throw error;
				}
			},
			{
				retries: numberOfRetry,
			},
		);

		results = results.concat(res.results);

		if (!res.has_more) {
			break;
		}

		params["start_cursor"] = res.next_cursor as string;
	}

	return await Promise.all(
		results.map(async (blockObject) => {
			const children = await getAllBlocksByBlockId(blockObject.id);

			const column: Column = {
				Id: blockObject.id,
				Type: blockObject.type,
				HasChildren: blockObject.has_children,
				Children: children,
			};

			return column;
		}),
	);
}

async function _getSyncedBlockChildren(block: Block): Promise<Block[]> {
	let originalBlock: Block | null = block;
	if (block.SyncedBlock && block.SyncedBlock.SyncedFrom && block.SyncedBlock.SyncedFrom.BlockId) {
		originalBlock = await getBlock(block.SyncedBlock.SyncedFrom.BlockId);
		if (!originalBlock) {
			console.log("Could not retrieve the original synced_block");
			return [];
		}
	}

	const children = await getAllBlocksByBlockId(originalBlock.Id);
	return children;
}

function _validPageObject(pageObject: responses.PageObject): boolean {
	const prop = pageObject.properties;
	return !!prop.Page.title && prop.Page.title.length > 0;
}

function _buildPost(pageObject: responses.PageObject): Post {
	const prop = pageObject.properties;

	let icon: FileObject | Emoji | null = null;
	if (pageObject.icon) {
		if (pageObject.icon.type === "emoji" && "emoji" in pageObject.icon) {
			icon = {
				Type: pageObject.icon.type,
				Emoji: pageObject.icon.emoji,
			};
		} else if (pageObject.icon.type === "external" && "external" in pageObject.icon) {
			icon = {
				Type: pageObject.icon.type,
				Url: pageObject.icon.external?.url || "",
			};
		}
	}

	let cover: FileObject | null = null;
	if (pageObject.cover) {
		cover = {
			Type: pageObject.cover.type,
			Url: pageObject.cover.external?.url || "",
		};
	}

	let featuredImage: FileObject | null = null;
	if (prop.FeaturedImage.files && prop.FeaturedImage.files.length > 0) {
		if (prop.FeaturedImage.files[0].external) {
			featuredImage = {
				Type: prop.FeaturedImage.type,
				Url: prop.FeaturedImage.files[0].external.url,
			};
		} else if (prop.FeaturedImage.files[0].file) {
			featuredImage = {
				Type: prop.FeaturedImage.type,
				Url: prop.FeaturedImage.files[0].file.url,
				ExpiryTime: prop.FeaturedImage.files[0].file.expiry_time,
			};
		}
	}

	const post: Post = {
		PageId: pageObject.id,
		Title: prop.Page?.title ? prop.Page.title.map((richText) => richText.plain_text).join("") : "",
		LastUpdatedTimeStamp: pageObject.last_edited_time
			? new Date(pageObject.last_edited_time)
			: null,
		Icon: icon,
		Cover: cover,
		Collection: prop.Collection?.select ? prop.Collection.select.name : "",
		Slug: prop.Slug?.formula?.string ? slugify(prop.Slug.formula.string) : "",
		Date: prop["Publish Date"]?.formula?.date ? prop["Publish Date"]?.formula?.date.start : "",
		Tags: prop.Tags?.multi_select ? prop.Tags.multi_select : [],
		Excerpt:
			prop.Excerpt?.rich_text && prop.Excerpt.rich_text.length > 0
				? prop.Excerpt.rich_text.map((richText) => richText.plain_text).join("")
				: "",
		FeaturedImage: featuredImage,
		Rank: prop.Rank.number ? prop.Rank.number : 0,
		LastUpdatedDate: prop["Last Updated Date"]?.formula?.date
			? prop["Last Updated Date"]?.formula.date.start
			: "",
		Pinned: prop.Pinned && prop.Pinned.checkbox === true ? true : false,
	};
	return post;
}

function _buildRichText(richTextObject: responses.RichTextObject): RichText {
	const annotation: Annotation = {
		Bold: richTextObject.annotations.bold,
		Italic: richTextObject.annotations.italic,
		Strikethrough: richTextObject.annotations.strikethrough,
		Underline: richTextObject.annotations.underline,
		Code: richTextObject.annotations.code,
		Color: richTextObject.annotations.color,
	};

	const richText: RichText = {
		Annotation: annotation,
		PlainText: richTextObject.plain_text,
		Href: richTextObject.href,
	};

	if (richTextObject.href?.startsWith("/")) {
		if (richTextObject.href?.includes("#")) {
			const reference: Reference = {
				PageId: richTextObject.href
					.split("#")[0]
					.substring(1)
					.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
				BlockId: richTextObject.href.split("#")[1],
				Type: "block",
			};
			richText.InternalHref = reference;
		} else {
			const reference: Reference = {
				PageId: richTextObject.href
					.substring(1)
					.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
				Type: "page",
			};
			richText.InternalHref = reference;
		}
	}

	if (richTextObject.type === "text" && richTextObject.text) {
		const text: Text = {
			Content: richTextObject.text.content,
		};

		if (richTextObject.text.link) {
			text.Link = {
				Url: richTextObject.text.link.url,
			};
		}

		richText.Text = text;
	} else if (richTextObject.type === "equation" && richTextObject.equation) {
		const equation: Equation = {
			Expression: richTextObject.equation.expression,
		};
		richText.Equation = equation;
	} else if (richTextObject.type === "mention" && richTextObject.mention) {
		const mention: Mention = {
			Type: richTextObject.mention.type,
		};

		if (richTextObject.mention.type === "page" && richTextObject.mention.page) {
			const reference: Reference = {
				PageId: richTextObject.mention.page.id,
				Type: richTextObject.mention.type,
			};
			mention.Page = reference;
		} else if (richTextObject.mention.type === "date") {
			let formatted_date = richTextObject.mention.date?.start
				? richTextObject.mention.date?.end
					? getFormattedDateWithTime(richTextObject.mention.date?.start) +
						" to " +
						getFormattedDateWithTime(richTextObject.mention.date?.end)
					: getFormattedDateWithTime(richTextObject.mention.date?.start)
				: "Invalid Date";

			mention.DateStr = formatted_date;
		}

		richText.Mention = mention;
	}

	return richText;
}
