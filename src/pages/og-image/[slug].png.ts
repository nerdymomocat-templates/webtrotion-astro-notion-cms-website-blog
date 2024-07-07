import type { APIContext, GetStaticPaths } from "astro";
// import { getEntryBySlug } from "astro:content";
import satori, { type SatoriOptions } from "satori";
// import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";
// import { siteConfig } from "@/site-config";
import { getFormattedDate } from "@/utils";
import { buildTimeFilePath } from "@/lib/blog-helpers";
import fetch from "node-fetch";

//ADDITION
import { getPostBySlug, getAllEntries } from "@/lib/notion/client";
import { getCollections } from "@/utils";

// import { siteInfo } from "@/utils";
import { siteInfo } from "@/siteInfo";
import {
	OG_SETUP,
	LAST_BUILD_TIME,
	HOME_PAGE_SLUG,
	THEME,
	MENU_PAGES_COLLECTION,
} from "@/constants";

import fs from "fs";
import sharp from "sharp";
import path from "path";

const rgbToHex = (rgb: string): string =>
	"#" +
	rgb
		.split(" ")
		.map((s) => parseInt(s).toString(16).padStart(2, "0"))
		.join("");

const rgbToRgba = (rgb: string, alpha: number): string =>
	`rgba(${rgb.split(" ").join(", ")}, ${alpha})`;

async function getFont(
	font_name: string,
	weight: number,
	font_url: string,
): Promise<SatoriOptions["fonts"]> {
	// Remove '&display=swap' from the URL if it exists
	const url = font_url.replace("&display=swap", "");

	// Extract the first font weight from the URL
	// const weight = parseInt(url.match(/wght@\d+/)?.[0]?.match(/\d+/)?.[0] || default_weight, 10);

	const css = await fetch(url, {
		headers: {
			// Make sure it returns TTF.
			"User-Agent":
				"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
		},
	}).then((response) => response.text());

	const match = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
	if (!match) {
		throw new Error(`Failed to find font URL}`);
	}

	const fontUrl = match[1];

	const buffer = await fetch(fontUrl).then((response) => response.arrayBuffer());

	return [
		{
			name: font_name,
			style: "normal",
			weight: weight,
			data: buffer,
		},
	] as SatoriOptions["fonts"];
}

const ogOptions: SatoriOptions = {
	width: 1200,
	height: 630,
	// debug: true,
	fonts: [
		...(await getFont("title-font", 700, OG_SETUP["title-font-url"])),
		...(await getFont("footnote-font", 500, OG_SETUP["footnote-font-url"])),
	],
};

const og_images_colors = {
	backgroundColor: THEME["colors"]["bg"]["light"]
		? rgbToHex(THEME["colors"]["bg"]["light"])
		: "white",
	boxShadow:
		"5px 5px 0px " +
		(THEME["colors"]["accent-2"]["light"]
			? rgbToHex(THEME["colors"]["accent-2"]["light"])
			: "#374151"),
	border:
		"1px solid " +
		(THEME["colors"]["accent-2"]["light"]
			? rgbToHex(THEME["colors"]["accent-2"]["light"])
			: "#374151"),
	titleColor: THEME["colors"]["accent"]["light"]
		? rgbToHex(THEME["colors"]["accent"]["light"])
		: "#374151",
	descColor: THEME["colors"]["text"]["light"]
		? rgbToHex(THEME["colors"]["text"]["light"])
		: "#374151",
	infoColor: THEME["colors"]["quote"]["light"]
		? rgbToHex(THEME["colors"]["quote"]["light"])
		: "#374151",
	backgroundImage:
		"radial-gradient(circle at 25px 25px, " +
		(THEME["colors"]["accent-2"]["light"]
			? rgbToRgba(THEME["colors"]["accent-2"]["light"], 0.1)
			: "lightgray") +
		" 2%, transparent 0%),radial-gradient(circle at 75px 75px, " +
		(THEME["colors"]["accent-2"]["light"]
			? rgbToRgba(THEME["colors"]["accent-2"]["light"], 0.1)
			: "lightgray") +
		" 2%, transparent 0%)",
	maskImage:
		"linear-gradient(to bottom, " +
		(THEME["colors"]["bg"]["light"]
			? rgbToRgba(THEME["colors"]["bg"]["light"], 0.1)
			: "rgba(255, 255, 255, 0.1)") +
		" 30%, " +
		(THEME["colors"]["bg"]["light"]
			? rgbToRgba(THEME["colors"]["bg"]["light"], 0.1)
			: "rgba(255, 255, 255, 0.1)") +
		" 30%, " +
		(THEME["colors"]["bg"]["light"]
			? rgbToRgba(THEME["colors"]["bg"]["light"], 0.25)
			: "rgba(255, 255, 255, 0.25)") +
		" 80%, " +
		(THEME["colors"]["bg"]["light"]
			? rgbToRgba(THEME["colors"]["bg"]["light"], 0.1)
			: "rgba(255, 255, 255, 0.1)") +
		" 80%)",
};

//NOTE: INCOMPLETE, satori has issues with relative URLs

let customIconURL: string = "";
if (siteInfo.logo && siteInfo.logo.Type === "file") {
	try {
		const absolutePath = path.join(
			process.cwd(),
			"public",
			buildTimeFilePath(new URL(siteInfo.logo.Url)),
		);
		// console.log(siteInfo.logo.Url);
		customIconURL = absolutePath;
	} catch (err) {
		console.log("Invalid DB custom icon URL");
	}
}

// Function to convert image to base64
const logoToBase64 = async (imagePath: string) => {
	try {
		const ext = path.extname(imagePath).slice(1).toLowerCase();
		if (ext === "webp" || ext === "avif") return null;
		const buffer = await sharp(imagePath).resize(30, 30).toBuffer();
		return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buffer.toString("base64")}`;
	} catch (err) {
		console.error("Error processing the logo image:", err);
		return null;
	}
};

const logo_src =
	siteInfo.logo && siteInfo.logo.Type === "external"
		? siteInfo.logo.Url
		: siteInfo.logo && siteInfo.logo.Type === "file" && customIconURL
			? await logoToBase64(customIconURL)
			: null;

const obj_img_sq_without_desc = function (
	title: string,
	pubDate: string,
	img_url: string,
	author: string,
) {
	return {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: og_images_colors["backgroundColor"],
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							height: "100%",
							width: "100%",
							display: "flex",
							fontFamily: "title-font",
						},
						children: [
							{
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
													padding: "10px",
												},
												children: [
													{
														type: "div",
														props: {
															style: {
																display: "flex",
																flex: "1",
															},
															children: [
																{
																	type: "img",
																	props: {
																		src: img_url,
																		style: {
																			width: "100%",
																			height: "100%",
																			objectFit: "contain",
																			objectPosition: "center",
																		},
																		children: [],
																	},
																},
															],
														},
													},
													{
														type: "div",
														props: {
															style: {
																display: "flex",
																flexDirection: "column",
																flex: "1",
																marginLeft: "16px",
																paddingBottom: "44px",
															},
															children: [
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "42px",
																			fontWeight: "700",
																			lineHeight: "3rem",
																			padding: "10px 0 20px 0",
																			color: og_images_colors["titleColor"],
																			flex: "1",
																			display: "flex",
																			fontFamily: "title-font",
																		},
																		children: title,
																	},
																},
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "16px",
																			fontWeight: "700",
																			color: og_images_colors["infoColor"],
																			display: "flex",
																			flexDirection: "row",
																			justifyContent: "space-between",
																			alignItems: "center",
																			fontFamily: "footnote-font",
																		},
																		children: [
																			{
																				type: "div",
																				props: {
																					children: pubDate,
																				},
																			},
																			{
																				type: "div",
																				props: {
																					style: {
																						display: "flex",
																						alignItems: "center",
																						gap: "10px",
																					},
																					children: [
																						logo_src
																							? {
																									type: "img",
																									props: {
																										src: logo_src, // Add the source only if logo_src exists.
																										style: {
																											height: "40px",
																											width: "40px",
																											objectFit: "contain",
																											objectPosition: "center",
																										},
																									},
																								}
																							: null,
																						{
																							type: "span",
																							props: {
																								style: {
																									marginRight: "16px",
																								},
																								children: author,
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	};
};

const obj_img_sq_with_desc = function (
	title: string,
	pubDate: string,
	desc: string,
	img_url: string,
	author: string,
) {
	return {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: og_images_colors["backgroundColor"],
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							height: "100%",
							width: "100%",
							display: "flex",
							fontFamily: "title-font",
						},
						children: [
							{
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
													padding: "10px",
												},
												children: [
													{
														type: "div",
														props: {
															style: {
																display: "flex",
																flex: "1",
															},
															children: [
																{
																	type: "img",
																	props: {
																		src: img_url,
																		style: {
																			width: "100%",
																			height: "100%",
																			objectFit: "contain",
																			objectPosition: "center",
																		},
																		children: [],
																	},
																},
															],
														},
													},
													{
														type: "div",
														props: {
															style: {
																display: "flex",
																flexDirection: "column",
																flex: "1",
																marginLeft: "16px",
																paddingBottom: "44px",
															},
															children: [
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "32px",
																			fontWeight: "700",
																			lineHeight: "3rem",
																			padding: "10px 0 20px 0",
																			color: og_images_colors["titleColor"],
																			flex: "0.5",
																			display: "flex",
																			fontFamily: "title-font",
																		},
																		children: title,
																	},
																},
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "24px",
																			fontWeight: "700",
																			lineHeight: "2rem",
																			padding: "10px 0 20px 0",
																			color: og_images_colors["descColor"],
																			flex: "1",
																			display: "flex",
																			fontFamily: "footnote-font",
																		},
																		children: desc,
																	},
																},
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "16px",
																			fontWeight: "700",
																			color: og_images_colors["infoColor"],
																			display: "flex",
																			flexDirection: "row",
																			justifyContent: "space-between",
																			alignItems: "center",
																			fontFamily: "footnote-font",
																		},
																		children: [
																			{
																				type: "div",
																				props: {
																					children: pubDate,
																				},
																			},
																			{
																				type: "div",
																				props: {
																					style: {
																						display: "flex",
																						alignItems: "center",
																						gap: "10px",
																					},
																					children: [
																						logo_src
																							? {
																									type: "img",
																									props: {
																										src: logo_src, // Add the source only if logo_src exists.
																										style: {
																											height: "30px",
																											width: "30px",
																											objectFit: "contain",
																											objectPosition: "center",
																										},
																									},
																								}
																							: null,
																						{
																							type: "span",
																							props: {
																								style: {
																									marginRight: "16px",
																									fontFamily: "footnote-font",
																								},
																								children: author,
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	};
};

const obj_img_none_without_desc = function (title: string, pubDate: string, author: string) {
	return {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: og_images_colors["backgroundColor"],
			},
			children: [
				{
					type: "div",
					props: {
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
							fontFamily: "title-font",
						},
						children: [
							{
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
												},
												children: [
													null,
													{
														type: "div",
														props: {
															style: {
																display: "flex",
																flexDirection: "column",
																flex: "1",
																paddingBottom: "44px",
															},
															children: [
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "64px",
																			fontWeight: "700",
																			lineHeight: "4rem",
																			padding: "20px 30px",
																			color: og_images_colors["titleColor"],
																			flex: "1",
																			display: "flex",
																		},
																		children: title,
																	},
																},
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "32px",
																			fontWeight: "700",
																			color: og_images_colors["infoColor"],
																			display: "flex",
																			flexDirection: "row",
																			justifyContent: "space-between",
																			alignItems: "center",
																			padding: "10px 30px",
																			fontFamily: "footnote-font",
																		},
																		children: [
																			{
																				type: "div",
																				props: {
																					children: pubDate,
																				},
																			},
																			{
																				type: "div",
																				props: {
																					style: {
																						display: "flex",
																						alignItems: "center",
																						gap: "10px",
																					},
																					children: [
																						logo_src
																							? {
																									type: "img",
																									props: {
																										src: logo_src, // Add the source only if logo_src exists.
																										style: {
																											height: "30px",
																											width: "30px",
																											objectFit: "contain",
																											objectPosition: "center",
																										},
																									},
																								}
																							: null,
																						{
																							type: "span",
																							props: {
																								style: {
																									marginRight: "16px",
																								},
																								children: author,
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	};
};

const obj_img_none_with_desc = function (
	title: string,
	pubDate: string,
	desc: string,
	author: string,
) {
	return {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: og_images_colors["backgroundColor"],
			},
			children: [
				{
					type: "div",
					props: {
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
							fontFamily: "title-font",
						},
						children: [
							{
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
													padding: "10px",
												},
												children: [
													{
														type: "div",
														props: {
															style: {
																display: "flex",
																flexDirection: "column",
																flex: "1",
																paddingBottom: "44px",
															},
															children: [
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "52px",
																			fontWeight: "700",
																			lineHeight: "4rem",
																			padding: "20px 30px",
																			color: og_images_colors["titleColor"],
																			flex: "0.5",
																			display: "flex",
																		},
																		children: title,
																	},
																},
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "30px",
																			fontFamily: "footnote-font",
																			fontWeight: "700",
																			lineHeight: "2rem",
																			padding: "10px 30px",
																			color: og_images_colors["descColor"],
																			flex: "1",
																			display: "flex",
																		},
																		children: desc,
																	},
																},
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "24px",
																			fontWeight: "700",
																			color: og_images_colors["infoColor"],
																			display: "flex",
																			flexDirection: "row",
																			justifyContent: "space-between",
																			alignItems: "center",
																			padding: "10px 20px",
																			fontFamily: "footnote-font",
																		},
																		children: [
																			{
																				type: "div",
																				props: {
																					children: pubDate,
																				},
																			},
																			{
																				type: "div",
																				props: {
																					style: {
																						display: "flex",
																						alignItems: "center",
																						gap: "10px",
																					},
																					children: [
																						logo_src
																							? {
																									type: "img",
																									props: {
																										src: logo_src, // Add the source only if logo_src exists.
																										style: {
																											height: "30px",
																											width: "30px",
																											objectFit: "contain",
																											objectPosition: "center",
																										},
																									},
																								}
																							: null,
																						{
																							type: "span",
																							props: {
																								style: {
																									marginRight: "16px",
																								},
																								children: author,
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	};
};

const obj_img_bg = function (title: string, pubDate: string, img_url: string, author: string) {
	return {
		type: "div",
		props: {
			style: {
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: og_images_colors["backgroundColor"],
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							height: "100%",
							width: "100%",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "32px",
							fontWeight: "700",
							fontFamily: "title-font",
						},
						children: [
							{
								type: "img",
								props: {
									src: img_url,
									style: {
										position: "absolute",
										top: "0",
										left: "0",
										height: "100%",
										width: "100%",
										maskImage: og_images_colors["maskImage"],
										objectFit: "cover",
									},
									children: [],
								},
							},
							{
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
													padding: "10px",
												},
												children: [
													null,
													{
														type: "div",
														props: {
															style: {
																display: "flex",
																flexDirection: "column",
																flex: "1",
																paddingBottom: "44px",
															},
															children: [
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "48px",
																			fontWeight: "700",
																			lineHeight: "3rem",
																			padding: "10px 20px",
																			color: og_images_colors["titleColor"],
																			flex: "1",
																			display: "flex",
																		},
																		children: title,
																	},
																},
																{
																	type: "div",
																	props: {
																		style: {
																			fontSize: "24px",
																			fontWeight: "700",
																			color: og_images_colors["infoColor"],
																			display: "flex",
																			flexDirection: "row",
																			justifyContent: "space-between",
																			alignItems: "center",
																			fontFamily: "footnote-font",
																			padding: "10px 20px",
																		},
																		children: [
																			{
																				type: "div",
																				props: {
																					children: pubDate,
																				},
																			},
																			{
																				type: "div",
																				props: {
																					style: {
																						display: "flex",
																						alignItems: "center",
																						gap: "10px",
																					},
																					children: [
																						logo_src
																							? {
																									type: "img",
																									props: {
																										src: logo_src, // Add the source only if logo_src exists.
																										style: {
																											height: "30px",
																											width: "30px",
																											objectFit: "contain",
																											objectPosition: "center",
																										},
																									},
																								}
																							: null,
																						{
																							type: "span",
																							props: {
																								style: {
																									marginRight: "16px",
																								},
																								children: author,
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	};
};

export async function GET({ params: { slug } }: APIContext) {
	const BASE_DIR = "./tmp/og-images/";
	let keyStr = slug;
	let type = "postpage";
	if (keyStr?.includes("---")) {
		keyStr = slug.split("---")[1];
		type = slug.split("---")[0];
	}
	let post = null;
	let postLastUpdatedBeforeLastBuild = true;

	if (type == "postpage") {
		post = await getPostBySlug(keyStr!);
		postLastUpdatedBeforeLastBuild = LAST_BUILD_TIME
			? post?.LastUpdatedTimeStamp
				? post?.LastUpdatedTimeStamp < LAST_BUILD_TIME
				: false
			: false;
	}

	if (!fs.existsSync(BASE_DIR)) {
		fs.mkdirSync(BASE_DIR, { recursive: true });
	}

	const imagePath = path.join(BASE_DIR, `${slug}.png`);

	if (fs.existsSync(imagePath) && postLastUpdatedBeforeLastBuild) {
		// console.log("reading existing image for og slug", slug);
		// Read the existing image and send it in the response
		const existingImage = fs.readFileSync(imagePath);
		return new Response(existingImage, {
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	}

	let chosen_markup;
	let fallback_markup;
	let author = siteInfo.author;
	if (type == "postpage") {
		const title = post?.Title
			? post.Slug == HOME_PAGE_SLUG
				? siteInfo.title
				: post.Title
			: siteInfo.title;
		const postDate =
			post?.Slug == HOME_PAGE_SLUG ||
			(post?.Collection && MENU_PAGES_COLLECTION.includes(post?.Collection))
				? ""
				: getFormattedDate(post?.Date ?? post?.Date ?? Date.now());
		author = post?.Slug == HOME_PAGE_SLUG ? "" : siteInfo.author;
		if (
			OG_SETUP["columns"] == 1 &&
			post?.FeaturedImage &&
			post?.FeaturedImage.ExpiryTime &&
			Date.parse(post?.FeaturedImage.ExpiryTime) > Date.now() &&
			(post.FeaturedImage.Url.includes(".jpg") ||
				post.FeaturedImage.Url.includes(".png") ||
				post.FeaturedImage.Url.includes(".jpeg"))
		) {
			chosen_markup = obj_img_bg(title, postDate, post.FeaturedImage.Url, author);
		} else if (
			OG_SETUP["columns"] &&
			post?.FeaturedImage &&
			post?.FeaturedImage.ExpiryTime &&
			Date.parse(post?.FeaturedImage.ExpiryTime) > Date.now() &&
			(post.FeaturedImage.Url.includes(".jpg") ||
				post.FeaturedImage.Url.includes(".png") ||
				post.FeaturedImage.Url.includes(".jpeg"))
		) {
			chosen_markup =
				post?.Excerpt && OG_SETUP["excerpt"]
					? obj_img_sq_with_desc(title, postDate, post?.Excerpt, post.FeaturedImage.Url, author)
					: obj_img_sq_without_desc(title, postDate, post.FeaturedImage.Url, author);
		} else {
			chosen_markup =
				post?.Excerpt && OG_SETUP["excerpt"]
					? obj_img_none_with_desc(title, postDate, post?.Excerpt, author)
					: obj_img_none_without_desc(title, postDate, author);
		}
		fallback_markup = post?.Excerpt
			? obj_img_none_with_desc(title, postDate, post?.Excerpt, author)
			: obj_img_none_without_desc(title, postDate, author);
	} else if (type == "collectionpage") {
		chosen_markup = obj_img_none_without_desc(
			keyStr + " : " + "A collection of posts",
			" ",
			author,
		);
	} else if (type == "tagsindex") {
		chosen_markup = obj_img_none_without_desc("All topics I've written about", " ", author);
	} else if (type == "collectionsindex") {
		chosen_markup = obj_img_none_without_desc("All collections that hold my posts", " ", author);
	} else if (type == "tagpage") {
		chosen_markup = obj_img_none_without_desc("All posts tagged with #" + keyStr, " ", author);
	} else {
		chosen_markup = obj_img_none_without_desc("All posts in one place", " ", author);
	}

	// const svg = await satori(chosen_markup, ogOptions);
	let svg;
	try {
		svg = await satori(chosen_markup, ogOptions);
	} catch (error) {
		console.error("Error in satori:", error);
		// Fallback to a basic markup if satori fails
		svg = await satori(fallback_markup, ogOptions);
	}
	const pngBuffer = new Resvg(svg).render().asPng();
	// Check if the buffer size is greater than 100 KB (102400 bytes)
	if (pngBuffer.length > 102400) {
		// Optimize the PNG using Sharp if it's larger than 100 KB
		await sharp(pngBuffer)
			.png({ quality: 80 }) // Adjust quality as needed
			.toFile(imagePath);
	} else {
		// Save the image as is if it's smaller than 100 KB
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
	const posts = await getAllEntries();

	const postsMap = posts.map(({ Slug }) => ({ params: { slug: Slug } }));

	const collections = await getCollections();
	const collectionMap = collections.map((collection) => ({
		params: { slug: "collectionpage---" + collection },
	}));

	const uniqueTags = [...new Set(posts.flatMap((post) => post.Tags))];
	const tagMap = uniqueTags.map((tag) => ({
		params: { slug: "tagpage---" + tag.name },
	}));

	const tagsindex = { params: { slug: "tagsindex---index" } };
	const postsindex = { params: { slug: "postsindex---index" } };
	const collectionsindex = { params: { slug: "collectionsindex---index" } };

	return [...postsMap, ...collectionMap, ...tagMap, tagsindex, postsindex, collectionsindex];
};
