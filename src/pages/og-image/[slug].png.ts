import type { APIContext, GetStaticPaths } from "astro";
import satori, { type SatoriOptions } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getFormattedDate } from "@/utils";
import { buildTimeFilePath } from "@/lib/blog-helpers";
import {
	getPostBySlug,
	getAllEntries,
	getAllTagsWithCounts,
	getAllAuthorsWithCounts,
	hasAuthorsProperty,
	hasCustomAuthors,
	downloadFile,
	generateFilePath,
	getDataSource,
} from "@/lib/notion/client";
import { getCollectionsWDesc } from "@/utils";
import { siteInfo } from "@/siteInfo";
import { resolveTheme } from "@/theme";
import {
	OG_SETUP,
	LAST_BUILD_TIME,
	HOME_PAGE_SLUG,
	THEME,
	MENU_PAGES_COLLECTION,
	BUILD_FOLDER_PATHS,
	AUTHORS_CONFIG,
} from "@/constants";
import fs from "fs";
import sharp from "sharp";
import path from "path";
import type { Database } from "@/lib/interfaces";

// --- Helpers & Configuration ---

const rgbToHex = (rgb: string) =>
	"#" +
	rgb
		.split(" ")
		.map((s) => parseInt(s).toString(16).padStart(2, "0"))
		.join("");

const rgbToRgba = (rgb: string, alpha: number) => `rgba(${rgb.split(" ").join(", ")}, ${alpha})`;

const resolvedTheme = resolveTheme();
const ogBorderWidth = resolvedTheme.name === "neobrutal" ? "2px" : "1px";
const ogShadowOffset = resolvedTheme.name === "neobrutal" ? 6 : 5;

const og_images_colors = {
	backgroundColor: THEME["colors"]["bg"]["light"]
		? rgbToHex(THEME["colors"]["bg"]["light"])
		: "white",
	boxShadow: `${ogShadowOffset}px ${ogShadowOffset}px 0px ${THEME["colors"]["accent-2"]["light"] ? rgbToHex(THEME["colors"]["accent-2"]["light"]) : "#374151"}`,
	border: `${ogBorderWidth} solid ${THEME["colors"]["accent-2"]["light"] ? rgbToHex(THEME["colors"]["accent-2"]["light"]) : "#374151"}`,
	titleColor: THEME["colors"]["accent"]["light"]
		? rgbToHex(THEME["colors"]["accent"]["light"])
		: "#374151",
	descColor: THEME["colors"]["text"]["light"]
		? rgbToHex(THEME["colors"]["text"]["light"])
		: "#374151",
	infoColor: THEME["colors"]["quote"]["light"]
		? rgbToHex(THEME["colors"]["quote"]["light"])
		: "#374151",
	backgroundImage: `radial-gradient(circle at 25px 25px, ${THEME["colors"]["accent-2"]["light"] ? rgbToRgba(THEME["colors"]["accent-2"]["light"], 0.1) : "lightgray"} 2%, transparent 0%), radial-gradient(circle at 75px 75px, ${THEME["colors"]["accent-2"]["light"] ? rgbToRgba(THEME["colors"]["accent-2"]["light"], 0.1) : "lightgray"} 2%, transparent 0%)`,
	maskImage: `linear-gradient(to bottom, ${THEME["colors"]["bg"]["light"] ? rgbToRgba(THEME["colors"]["bg"]["light"], 0.1) : "rgba(255, 255, 255, 0.1)"} 30%, ${THEME["colors"]["bg"]["light"] ? rgbToRgba(THEME["colors"]["bg"]["light"], 0.1) : "rgba(255, 255, 255, 0.1)"} 30%, ${THEME["colors"]["bg"]["light"] ? rgbToRgba(THEME["colors"]["bg"]["light"], 0.25) : "rgba(255, 255, 255, 0.25)"} 80%, ${THEME["colors"]["bg"]["light"] ? rgbToRgba(THEME["colors"]["bg"]["light"], 0.1) : "rgba(255, 255, 255, 0.1)"} 80%)`,
};

const titleFontFamily = OG_SETUP["title-font-name"] || "sans-serif";
const footnoteFontFamily = OG_SETUP["footnote-font-name"] || "monospace";

let dataSourcePromise: Promise<Database> | null = null;
const getDataSourceCached = () => {
	if (!dataSourcePromise) dataSourcePromise = getDataSource();
	return dataSourcePromise;
};

// --- Image Processing ---

const imageToDataUrl = async (filepath: string, resize?: { w: number; h: number }) => {
	try {
		let pipeline = sharp(filepath);
		if (resize) pipeline = pipeline.resize(resize.w, resize.h);
		const buffer = await pipeline.png().toBuffer();
		return `data:image/png;base64,${buffer.toString("base64")}`;
	} catch (err) {
		console.error("Error processing image:", err);
		return null;
	}
};

// Prepare Logo
let customIconURL = "";
if (siteInfo.logo && siteInfo.logo.Type === "file") {
	try {
		customIconURL = path.join(
			process.cwd(),
			"public",
			buildTimeFilePath(new URL(siteInfo.logo.Url)),
		);
	} catch (err) {
		console.log("Invalid DB custom icon URL");
	}
}

const logo_src =
	siteInfo.logo && siteInfo.logo.Type === "external"
		? siteInfo.logo.Url
		: siteInfo.logo && siteInfo.logo.Type === "file" && customIconURL
			? await imageToDataUrl(customIconURL, { w: 30, h: 30 })
			: null;

const normalizeOgImageSrc = async (
	urlStr: string | undefined,
	mode: "featured" | "author" = "featured",
): Promise<string | undefined> => {
	if (!urlStr) return undefined;
	try {
		const url = new URL(urlStr);
		const ext = path.extname(url.pathname).toLowerCase();
		const isPngLike = [".jpg", ".jpeg", ".png"].includes(ext);

		if (mode === "featured") {
			let publicPathUrl = new URL(url.href);
			if (!isPngLike) {
				publicPathUrl.pathname += ".png";
			}
			const publicPath = generateFilePath(publicPathUrl, false);
			if (fs.existsSync(publicPath)) {
				return (await imageToDataUrl(publicPath)) || publicPath;
			}
			const savedPath = await downloadFile(url, false, false, true);
			return savedPath ? (await imageToDataUrl(savedPath)) || savedPath : undefined;
		}

		// Author mode
		if (isPngLike) return urlStr;
		const savedPath = await downloadFile(url, false, false, true);
		return savedPath ? (await imageToDataUrl(savedPath)) || savedPath : undefined;
	} catch (err) {
		console.error("Error normalizing OG image src:", err);
		return undefined;
	}
};

const isImageUrl = (url?: string) => {
	if (!url) return false;
	try {
		return /\.(png|jpe?g|gif|webp|avif)$/i.test(new URL(url).pathname.toLowerCase());
	} catch {
		return false;
	}
};

// --- Fonts ---

async function getFontFromGoogle(name: string, weight: number): Promise<SatoriOptions["fonts"][0]> {
	const validWeight = weight < 100 || weight > 900 || !Number.isFinite(weight) ? 400 : weight;
	const css = await fetch(
		`https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@${validWeight}&display=swap`,
		{
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
			},
		},
	).then((res) => res.text());
	const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
	if (!resource) throw new Error(`Failed to find font URL for ${name}`);
	const data = await fetch(resource[1]).then((res) => res.arrayBuffer());
	return { name, style: "normal", weight: validWeight, data };
}

async function getOgFonts(): Promise<SatoriOptions["fonts"]> {
	const fonts: SatoriOptions["fonts"] = [];
	if (OG_SETUP["title-font-name"])
		fonts.push(
			await getFontFromGoogle(OG_SETUP["title-font-name"], OG_SETUP["title-font-weight"] || 700),
		);
	if (OG_SETUP["footnote-font-name"])
		fonts.push(
			await getFontFromGoogle(
				OG_SETUP["footnote-font-name"],
				OG_SETUP["footnote-font-weight"] || 700,
			),
		);
	return fonts;
}

let ogFontsPromise: Promise<SatoriOptions["fonts"]> | null = null;
const getOgFontsCached = () => {
	if (!ogFontsPromise) ogFontsPromise = getOgFonts();
	return ogFontsPromise;
};

// --- Layout Builders ---

const buildAuthorBlock = (author: string, size: number) => {
	if (!author && !logo_src) return null;
	const children = [];
	if (logo_src) {
		children.push({
			type: "img",
			props: {
				src: logo_src,
				style: {
					height: `${size}px`,
					width: `${size}px`,
					objectFit: "contain",
					objectPosition: "center",
				},
			},
		});
	}
	if (author) {
		const names = author
			.split(",")
			.map((n) => n.trim())
			.filter(Boolean);
		const fontSize =
			names.length > 2
				? Math.max(12, size - 8)
				: names.length === 2
					? Math.max(12, size - 4)
					: size;
		children.push({
			type: "span",
			props: {
				style: { marginRight: "16px", fontSize: `${fontSize}px`, fontFamily: footnoteFontFamily },
				children: names.join(", "),
			},
		});
	}
	return {
		type: "div",
		props: { style: { display: "flex", alignItems: "center", gap: "10px" }, children },
	};
};

const buildOgImage = ({
	title,
	date,
	desc,
	img,
	author,
	layout,
}: {
	title: string;
	date: string;
	desc?: string;
	img?: string;
	author: string;
	layout: "split" | "simple" | "bg";
}) => {
	const hasDesc = !!desc;
	let titleSize = "42px";
	let descSize = "24px";
	let metaSize = "16px";

	if (layout === "split") {
		titleSize = hasDesc ? "32px" : "42px";
		descSize = "24px";
		metaSize = hasDesc ? "16px" : "40px"; // Preserved logic: without desc, split layout had larger meta
	} else if (layout === "simple") {
		titleSize = hasDesc ? "52px" : "64px";
		descSize = "30px";
		metaSize = hasDesc ? "24px" : "32px";
	} else if (layout === "bg") {
		titleSize = "48px";
		metaSize = "24px";
	}

	const TextColumn = {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				flex: "1",
				paddingBottom: "44px",
				marginLeft: layout === "split" ? "16px" : "0",
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							fontSize: titleSize,
							fontWeight: "700",
							lineHeight: layout === "simple" ? "4rem" : "3rem",
							padding: layout === "simple" || layout === "bg" ? "20px 30px" : "10px 0 20px 0",
							color: og_images_colors["titleColor"],
							flex: hasDesc ? "0.5" : "1",
							display: "flex",
							fontFamily: titleFontFamily,
						},
						children: title,
					},
				},
				hasDesc && {
					type: "div",
					props: {
						style: {
							fontSize: descSize,
							fontWeight: "700",
							lineHeight: "2rem",
							padding: layout === "simple" ? "10px 30px" : "10px 0 20px 0",
							color: og_images_colors["descColor"],
							flex: "1",
							display: "flex",
							fontFamily: footnoteFontFamily,
						},
						children: desc,
					},
				},
				{
					type: "div",
					props: {
						style: {
							fontSize: metaSize,
							fontWeight: "700",
							color: og_images_colors["infoColor"],
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							padding: layout === "simple" || layout === "bg" ? "10px 30px" : "0",
							fontFamily: footnoteFontFamily,
						},
						children: [
							{ type: "div", props: { style: { display: "flex" }, children: date } },
							buildAuthorBlock(author, parseInt(metaSize) + (layout === "split" ? 14 : 6)),
						],
					},
				},
			].filter(Boolean),
		},
	};

	const Card = {
		type: "div",
		props: {
			style: {
				padding: "20px",
				display: "flex",
				width: "100%",
				height: "100%",
				justifyContent: "center",
				alignItems: "stretch",
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
							border: og_images_colors["border"],
							borderRadius: "8px",
							boxShadow: og_images_colors["boxShadow"],
							width: "100%",
							height: "100%",
							padding: layout === "split" ? "10px" : "0",
						},
						children: [
							layout === "split"
								? {
										type: "div",
										props: {
											style: { display: "flex", flex: "1" },
											children: [
												{
													type: "img",
													props: {
														src: img,
														style: {
															width: "100%",
															height: "100%",
															objectFit: "contain",
															objectPosition: "center",
														},
													},
												},
											],
										},
									}
								: null,
							TextColumn,
						].filter(Boolean),
					},
				},
			],
		},
	};

	const ContainerStyle = {
		display: "flex",
		flexDirection: "column",
		width: "100%",
		height: "100%",
		backgroundColor: og_images_colors["backgroundColor"],
		...(layout === "bg" ? { position: "relative" } : {}),
	};

	const BackgroundContent =
		layout === "simple"
			? {
					style: {
						height: "100%",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						fontSize: "32px",
						fontWeight: "700",
						backgroundImage: og_images_colors["backgroundImage"],
						backgroundSize: "100px 100px",
						fontFamily: titleFontFamily,
					},
					children: [Card],
				}
			: layout === "bg"
				? {
						style: {
							height: "100%",
							width: "100%",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "32px",
							fontWeight: "700",
							fontFamily: titleFontFamily,
						},
						children: [
							{
								type: "img",
								props: {
									src: img,
									style: {
										position: "absolute",
										top: "0",
										left: "0",
										height: "100%",
										width: "100%",
										maskImage: og_images_colors["maskImage"],
										objectFit: "cover",
									},
								},
							},
							Card,
						],
					}
				: {
						style: {
							height: "100%",
							width: "100%",
							display: "flex",
							fontFamily: titleFontFamily,
						},
						children: [Card],
					};

	return {
		type: "div",
		props: {
			style: ContainerStyle,
			children: [{ type: "div", props: { ...BackgroundContent } }],
		},
	};
};

// --- Main Handler ---

export async function GET(context: APIContext) {
	const {
		params: { slug },
		props,
	} = context;
	const BASE_DIR = BUILD_FOLDER_PATHS["ogImages"];
	const imagePath = path.join(BASE_DIR, `${slug}.png`);

	let keyStr = slug;
	let type = "postpage";
	if (keyStr?.includes("---")) {
		const parts = slug.split("---");
		type = parts[0];
		keyStr = parts[1];
	}

	let post = null;
	const isPost = type === "postpage";
	if (isPost) {
		post = await getPostBySlug(keyStr!);
	}

	// Prepare Content
	let title = siteInfo.title;
	let desc = "";
	let dateStr = " ";
	let author = siteInfo.author?.trim() || "";
	let layout: "split" | "simple" | "bg" = "simple";
	const featuredUrlStr = isPost ? post?.FeaturedImage?.Url : undefined;
	const featuredExpiry = isPost ? post?.FeaturedImage?.ExpiryTime : undefined;
	let featuredIsValidNow = false;
	let needsImageNormalization = false;
	let img: string | undefined = undefined;

	// Determine Data based on Type
	if (isPost) {
		title = post?.Title
			? post.Slug == HOME_PAGE_SLUG
				? siteInfo.title
				: post.Title
			: siteInfo.title;
		const isMenuPage = post?.Collection && MENU_PAGES_COLLECTION.includes(post.Collection);
		dateStr =
			post?.Slug == HOME_PAGE_SLUG || isMenuPage ? "" : getFormattedDate(post?.Date ?? Date.now());

		const authorsProp = await hasAuthorsProperty();
		if (authorsProp && post?.Authors?.length) {
			author = post.Authors.map((a) => a.name).join(", ");
		}
		if (post?.Slug == HOME_PAGE_SLUG) author = "";

		const hasValidImg =
			featuredUrlStr && (!featuredExpiry || Date.parse(featuredExpiry) > Date.now());

		featuredIsValidNow = !!hasValidImg;
		if (hasValidImg) needsImageNormalization = true;
		desc = (OG_SETUP["excerpt"] && post?.Excerpt) || "";

		// Layout Logic
		if (OG_SETUP["columns"] == 1 && hasValidImg) layout = "bg";
		else if (OG_SETUP["columns"] && hasValidImg) layout = "split";
		else layout = "simple";
	} else if (type === "collectionpage") {
		title = `${keyStr} : A collection of posts`;
		desc = (props as any)?.description || "";
		layout = "simple";
	} else if (type === "tagpage") {
		title = `All posts tagged with #${keyStr}`;
		desc = (props as any)?.description || "";
		layout = "simple";
	} else if (type === "authorpage") {
		title = `Posts by ${keyStr}`;
		desc = (props as any)?.description || "";
		const photo = (props as any)?.photo;
		if (photo && isImageUrl(photo)) needsImageNormalization = true;
		// Author Page Layout: Always split if image exists, regardless of desc
		layout = photo && isImageUrl(photo) ? "split" : "simple";
		author = ""; // Author name is in title
	} else if (type === "tagsindex") {
		title = "All topics I've written about";
	} else if (type === "collectionsindex") {
		title = "All collections that hold my posts";
	} else if (type === "authorsindex") {
		title = "All Authors";
		author = "";
	} else {
		title = "All posts in one place";
	}

	// Cache reuse behavior:
	// - Post pages: reuse if the post wasn't edited after LAST_BUILD_TIME and image exists.
	// - Collection/tag/author pages: reuse if the *data source* wasn't edited after LAST_BUILD_TIME and image exists.
	// - Index pages: same data source check (and file exists).
	const canConsiderReuse = !!LAST_BUILD_TIME && fs.existsSync(imagePath);
	if (canConsiderReuse) {
		if (isPost) {
			if (post?.LastUpdatedTimeStamp && post.LastUpdatedTimeStamp < LAST_BUILD_TIME) {
				return new Response(fs.readFileSync(imagePath), {
					headers: {
						"Content-Type": "image/png",
						"Cache-Control": "public, max-age=31536000, immutable",
					},
				});
			}
		} else {
			const dataSource = await getDataSourceCached();
			if (dataSource?.LastUpdatedTimeStamp && dataSource.LastUpdatedTimeStamp < LAST_BUILD_TIME) {
				return new Response(fs.readFileSync(imagePath), {
					headers: {
						"Content-Type": "image/png",
						"Cache-Control": "public, max-age=31536000, immutable",
					},
				});
			}
		}
	}

	// Only resolve/normalize image sources when we actually need to (regeneration path).
	if (needsImageNormalization) {
		if (isPost) {
			img = await normalizeOgImageSrc(featuredUrlStr);
		} else if (type === "authorpage") {
			const photo = (props as any)?.photo;
			if (photo && isImageUrl(photo)) {
				img = await normalizeOgImageSrc(photo, "author");
			}
		}
	}

	const fonts = await getOgFontsCached();
	const ogOptions: SatoriOptions = { width: 1200, height: 630, fonts };

	// Generate
	const markup = buildOgImage({ title, date: dateStr, desc, img, author, layout });

	// Fallback markup (always simple layout) in case of Satori failure with images
	const fallbackMarkup = buildOgImage({
		title,
		date: dateStr,
		desc,
		img: undefined,
		author,
		layout: "simple",
	});

	let svg;
	try {
		svg = await satori(markup as any, ogOptions);
	} catch (error) {
		console.error("Error in satori:", error);
		svg = await satori(fallbackMarkup as any, ogOptions);
	}

	let pngBuffer = new Resvg(svg).render().asPng();

	if (pngBuffer.length > 102400) {
		pngBuffer = await sharp(pngBuffer).png({ quality: 80 }).toBuffer();
		fs.writeFileSync(imagePath, pngBuffer);
	} else {
		fs.writeFileSync(imagePath, pngBuffer);
	}

	return new Response(pngBuffer, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}

export const getStaticPaths: GetStaticPaths = async () => {
	const posts = (await getAllEntries()).filter((entry) => !entry.IsExternal);
	const postsMap = posts.map(({ Slug }) => ({ params: { slug: Slug } }));

	const collectionsWDesc = await getCollectionsWDesc();
	const collectionMap = collectionsWDesc.map((c) => ({
		params: { slug: "collectionpage---" + c.name },
		props: { description: c.description },
	}));

	const allTags = await getAllTagsWithCounts();
	const tagMap = allTags.map((t) => ({
		params: { slug: "tagpage---" + t.name },
		props: { description: t.description },
	}));

	const authorsProp = await hasAuthorsProperty();
	const includeAuthorPages =
		AUTHORS_CONFIG.enableAuthorPages &&
		authorsProp &&
		(!AUTHORS_CONFIG.onlyWhenCustomAuthors || (await hasCustomAuthors()));

	let authorMap: any[] = [];
	let authorsindex: any = null;

	if (includeAuthorPages) {
		const allAuthors = await getAllAuthorsWithCounts();
		authorMap = allAuthors.map((a) => ({
			params: { slug: "authorpage---" + a.name },
			props: { description: a.bio || "", photo: a.photo },
		}));
		authorsindex = { params: { slug: "authorsindex---index" } };
	}

	return [
		...postsMap,
		...collectionMap,
		...tagMap,
		...authorMap,
		{ params: { slug: "tagsindex---index" } },
		{ params: { slug: "postsindex---index" } },
		{ params: { slug: "collectionsindex---index" } },
		...(authorsindex ? [authorsindex] : []),
	];
};
