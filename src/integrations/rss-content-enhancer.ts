import type { AstroIntegration } from "astro";
import * as fs from "fs/promises";
import * as path from "path";
import sanitizeHtml from "sanitize-html";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { LAST_BUILD_TIME, BASE_PATH, BUILD_FOLDER_PATHS } from "../constants";

const rssContentEnhancer = (): AstroIntegration => {
	return {
		name: "rss-content-enhancer",
		hooks: {
			"astro:build:done": async () => {
				const distDir = "dist";
				const tempDir = BUILD_FOLDER_PATHS["rssCache"];
				const rssPath = path.join(distDir, "rss.xml");

				// Read and parse RSS XML
				const rssContent = await fs.readFile(rssPath, "utf-8");

				const parserOptions = {
					ignoreAttributes: false,
					attributeNamePrefix: "",
					textNodeName: "#text",
					arrayMode: false, // Do not wrap elements in arrays
				};

				const parser = new XMLParser(parserOptions);
				const rssData = parser.parse(rssContent);

				// Extract base URL from channel link
				const baseUrl = rssData.rss.channel.link.replace(/\/$/, ""); // Remove trailing slash if present

				// Ensure items are in an array
				const items = Array.isArray(rssData.rss.channel.item)
					? rssData.rss.channel.item
					: [rssData.rss.channel.item];

				// Process each item
				for (const item of items) {
					const segments = item.link.split("/").filter(Boolean);
					const encodedSlug = segments.pop();
					const slug = decodeURIComponent(encodedSlug);
					const htmlPath = path.join(distDir, "posts", slug, "index.html");

					try {
						const htmlContent = await fs.readFile(htmlPath, "utf-8");

						const lastUpdated = item.lastUpdatedTimestamp;
						if (!lastUpdated) {
							continue;
						}

						const cachePath = path.join(tempDir, `${slug}.html`);

						// Check cache
						let shouldUpdate = true;

						// Check if cache exists
						try {
							await fs.access(cachePath);

							// If cache exists and LAST_BUILD_TIME exists, use it to determine if we need to update
							if (LAST_BUILD_TIME) {
								const lastBuildTime = new Date(LAST_BUILD_TIME);
								shouldUpdate = new Date(lastUpdated) > lastBuildTime;
							}
						} catch {
							// Cache doesn't exist, need to sanitize
							shouldUpdate = true;
						}

						if (shouldUpdate) {
							// Parse the HTML content
							const document = parseDocument(htmlContent);

							// Find the <main> element
							const mainElement = DomUtils.findOne(
								(elem) => elem.type === "tag" && elem.name === "main",
								document.children,
								true,
							);

							if (mainElement) {
								const mainContent = DomUtils.getInnerHTML(mainElement);

								// Sanitize HTML and fix image paths
								const cleanContent = sanitizeHtml(mainContent, {
									allowedTags: [
										// Document sections
										"address",
										"article",
										"aside",
										"footer",
										"header",
										"h1",
										"h2",
										"h3",
										"h4",
										"h5",
										"h6",
										"hgroup",
										"main",
										"nav",
										"section",

										// Block text content
										"blockquote",
										"dd",
										"div",
										"dl",
										"dt",
										"figcaption",
										"figure",
										"hr",
										"li",
										"main",
										"ol",
										"p",
										"pre",
										"ul",
										"details",
										"summary",

										// Inline text
										"a",
										"abbr",
										"b",
										"bdi",
										"bdo",
										"br",
										"cite",
										"code",
										"data",
										"dfn",
										"em",
										"i",
										"kbd",
										"mark",
										"q",
										"rb",
										"rp",
										"rt",
										"rtc",
										"ruby",
										"s",
										"samp",
										"small",
										"span",
										"strong",
										"sub",
										"sup",
										"time",
										"u",
										"var",
										"wbr",

										// Table content
										"caption",
										"col",
										"colgroup",
										"table",
										"tbody",
										"td",
										"tfoot",
										"th",
										"thead",
										"tr",

										// Media
										"img",
										// 'iframe'
									],
									allowedAttributes: {
										a: ["href", "title", "target"],
										img: ["src", "alt", "title"],
										td: ["align", "valign"],
										th: ["align", "valign", "colspan", "rowspan", "scope"],
										// iframe: ['src'],
										pre: ["data-language"],
									},
									disallowedTagsMode: "discard",
									nonTextTags: ["style", "script", "textarea", "option", "noscript", "template"],
									exclusiveFilter: function (frame) {
										return (
											frame.attribs?.class?.includes("no-rss") ||
											frame.attribs?.class?.includes("sr-only") ||
											(frame.attribs?.["data-popover-target"] &&
												frame.attribs?.["data-href"]?.startsWith("#")) ||
											(frame.tag === "strong" &&
												frame.text.trim().toLowerCase() === "table of contents") ||
											frame.tag === "h1" ||
											(frame.tag === "span" && !frame.text.trim()) ||
											(frame.tag === "p" && !frame.text.trim())
										);
									},
									transformTags: {
										details: (tagName, attribs) => ({
											tagName: "div",
											attribs: attribs,
										}),
										summary: (tagName, attribs) => ({
											tagName: "div",
											attribs: attribs,
										}),
										a: (tagName, attribs) => {
											// Add base URL to relative URLs
											if (attribs.href?.startsWith("/")) {
												return {
													tagName,
													attribs: {
														...attribs,
														href: `${baseUrl}${attribs.href}`,
													},
												};
											}
											return { tagName, attribs };
										},
										span: (tagName, attribs) => {
											if (attribs["data-popover-target"]) {
												const href = attribs["data-href"];
												if (href?.startsWith("/")) {
													return {
														tagName: "a",
														attribs: {
															...attribs,
															href: `${baseUrl}${href}`,
														},
													};
												}
											}
											return { tagName, attribs };
										},
										img: (tagName, attribs) => {
											if (attribs.class?.includes("no-rss")) {
												return false;
											}
											if (attribs.src?.startsWith("/")) {
												return {
													tagName,
													attribs: {
														...attribs,
														src: `${baseUrl}${attribs.src}`,
													},
												};
											}
											return { tagName, attribs };
										},
									},
								});

								// Parse the cleaned content
								const cleanContentDom = parseDocument(cleanContent);

								const root = { type: "root", children: cleanContentDom.children };

								// Perform cleanup on interlinked content
								cleanupInterlinkedContentDom(root);

								// Remove empty elements
								removeEmptyElementsFromDom(root);
								// Serialize back to HTML
								let cleanContentFinal = DomUtils.getInnerHTML(cleanContentDom);
								cleanContentFinal = cleanContentFinal.replace(/^\s*<div>\s*<article[^>]*>/i, "");
								cleanContentFinal = cleanContentFinal.replace(
									/<\/article>\s*<\/div>\s*<div><\/div>\s*$/i,
									"",
								);

								// Add a note inside the first <div> tag
								const note = `
                    <p>
                        <em>Note:</em> This RSS feed strips out SVGs and embeds. You might want to read the post on the webpage
                        <a href="${item.link}" target="_blank">here</a>.
                    </p>
                    <hr>
                `;

								cleanContentFinal = cleanContentFinal.replace(/^\s*<div>/, `<div>${note}`);

								// Cache the cleaned content
								await fs.writeFile(cachePath, cleanContentFinal);

								// Add content tag to RSS item
								item.content = cleanContentFinal;

								// If description is empty, generate from content
								if (!item.description?.trim()) {
									const plainText = DomUtils.textContent(cleanContentDom).trim();
									item.description =
										plainText.slice(0, 150) + (plainText.length > 150 ? "..." : "");
								}
							}
						} else {
							// Use cached version
							const cachedContent = await fs.readFile(cachePath, "utf-8");
							item.content = cachedContent;

							// If description is empty, generate from cached content
							if (!item.description?.trim()) {
								const cleanContentDom = parseDocument(cachedContent);
								const plainText = DomUtils.textContent(cleanContentDom).trim();
								item.description = plainText.slice(0, 150) + (plainText.length > 150 ? "..." : "");
							}
						}
					} catch (error) {
						console.error(`Error processing ${slug}:`, error);
					}
				}

				// Update the items back to the channel
				// Build the RSS object
				const rssObject = {
					rss: {
						"@version": "2.0",
						channel: {
							title: rssData.rss.channel.title,
							description: rssData.rss.channel.description,
							link: rssData.rss.channel.link,
							lastBuildDate: rssData.rss.channel.lastBuildDate,
							...(rssData.rss.channel.author && { author: rssData.rss.channel.author }),
							item: items.map((item) => ({
								title: item.title,
								link: item.link,
								guid: {
									"@isPermaLink": "true",
									"#": item.link,
								},
								description: item.description,
								pubDate: item.pubDate,
								lastUpdatedTimestamp: item.lastUpdatedTimestamp,
								...(item.category && {
									category: Array.isArray(item.category) ? item.category : [item.category],
								}),
								...(item.content && { content: item.content }),
							})),
						},
					},
				};

				// Build and save the updated RSS
				const builderOptions = {
					ignoreAttributes: false,
					format: true,
					suppressEmptyNode: true,
					suppressBooleanAttributes: false,
					attributeNamePrefix: "@",
					parseTagValue: false,
					textNodeName: "#",
				};

				const builder = new XMLBuilder(builderOptions);
				const updatedRss = builder.build(rssObject);

				// Add XML declaration and stylesheet
				const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
				const styleSheet = `<?xml-stylesheet href="${path.join(BASE_PATH, "/rss-styles.xsl")}" type="text/xsl"?>\n`;
				const finalXml = xmlDeclaration + styleSheet + updatedRss;

				await fs.writeFile(rssPath, finalXml);
			},
		},
	};
};

export default rssContentEnhancer;

// Helper functions

function removeEmptyElementsFromDom(node) {
	// Remove empty text nodes
	if (node.type === "text") {
		if (node.data.trim() === "") {
			return false; // Remove this node
		}
		return true; // Keep non-empty text nodes
	}

	// Process child nodes first
	if (node.children && node.children.length > 0) {
		node.children = node.children.filter(removeEmptyElementsFromDom);
	}

	// Now check if the current node is empty
	if (node.type === "tag") {
		const emptyTags = ["div", "section", "aside", "span", "p", "main"];
		const isEmptyTag = emptyTags.includes(node.name);

		// Check if the node has any attributes
		const hasAttributes = node.attribs && Object.keys(node.attribs).length > 0;

		// Check if the node has any remaining children
		const hasChildren = node.children && node.children.length > 0;

		// Get the trimmed text content
		const textContent = DomUtils.textContent(node).trim();

		if (isEmptyTag && !hasAttributes && !hasChildren && textContent === "") {
			return false; // Remove this node
		}
	}

	// Remove comment nodes
	if (node.type === "comment") {
		return false; // Remove comment nodes
	}

	return true; // Keep the node
}

function cleanupInterlinkedContentDom(node) {
	if (node.type === "tag" && node.name === "aside") {
		// Process the 'Pages That Mention This Page' section
		const sections = DomUtils.findAll(
			(elem) =>
				elem.type === "tag" &&
				elem.name === "div" &&
				DomUtils.findOne(
					(child) =>
						child.type === "tag" &&
						child.name === "span" &&
						(DomUtils.textContent(child).trim() === "Pages That Mention This Page" ||
							DomUtils.textContent(child).trim() === "Other Pages Mentioned On This Page"),
					elem.children,
				),
			node.children,
		);

		sections.forEach((section) => {
			// Find all child divs within the section
			const childDivs = DomUtils.findAll(
				(child) => child.type === "tag" && child.name === "div",
				section.children,
				false,
			);

			childDivs.forEach((div) => {
				// Find the first <a> element
				const link = DomUtils.findOne(
					(elem) => elem.type === "tag" && elem.name === "a",
					div.children,
					true,
				);

				if (link) {
					// Replace the div's children with just the link
					div.children = [link];
				} else {
					// If no link is found, remove the div
					const index = section.children.indexOf(div);
					if (index !== -1) {
						section.children.splice(index, 1);
					}
				}
			});

			// Remove any remaining text nodes or empty divs
			section.children = section.children.filter((child) => {
				if (child.type === "tag" && child.name === "div") {
					return child.children.length > 0;
				}
				return true;
			});
		});

		// Remove unnecessary <br /> and <hr /> tags
		node.children = node.children.filter(
			(child) =>
				!(
					(child.type === "tag" && child.name === "br") ||
					(child.type === "tag" && child.name === "hr")
				),
		);
	}

	// Recurse into child nodes
	if (node.children) {
		node.children.forEach(cleanupInterlinkedContentDom);
	}
}
