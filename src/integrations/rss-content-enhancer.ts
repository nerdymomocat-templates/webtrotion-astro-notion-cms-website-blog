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
											// Only remove spans that are completely empty (no text at all)
											// Keep spans with whitespace for proper spacing
											(frame.tag === "span" && !frame.text) ||
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

								// Fix footnotes for RSS: strip markers and normalize spacing
								fixFootnotesForRss(root);

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

function fixFootnotesForRss(node) {
	// Strip footnote marker prefixes like [^ft_marker]:
	stripFootnoteMarkers(node);

	// Remove back-reference links in footnotes section
	removeFootnoteBackLinks(node);

	// Trim whitespace from links and move outside
	trimLinksAndMoveSpacesOutside(node);

	// Consolidate adjacent spans to reduce clutter
	consolidateAdjacentSpans(node);

	// Normalize spacing between inline elements
	normalizeSpacing(node);

	return node;
}

function stripFootnoteMarkers(node) {
	if (node.type === "text") {
		// Remove patterns like [^ft_marker]: from the start of text
		node.data = node.data.replace(/^\[\^ft_[^\]]+\]:\s*/, "");
		return;
	}

	if (node.children) {
		node.children.forEach(stripFootnoteMarkers);
	}
}

function removeFootnoteBackLinks(node) {
	// Find sections with footnotes by looking for <section><hr><h2>Footnotes</h2><ol>
	if (node.type === "tag" && node.name === "section" && node.children) {
		// Check if this section contains the "Footnotes" heading
		const hasFootnotesHeading = DomUtils.findOne(
			(elem) => {
				if (elem.type === "tag" && elem.name === "h2") {
					const text = DomUtils.textContent(elem).trim();
					return text === "Footnotes";
				}
				return false;
			},
			node.children,
			true
		);

		if (hasFootnotesHeading) {
			// Find the <ol> element
			const olElement = DomUtils.findOne(
				(elem) => elem.type === "tag" && elem.name === "ol",
				node.children,
				true
			);

			if (olElement && olElement.children) {
				// For each <li> in the <ol>
				olElement.children.forEach((li) => {
					if (li.type === "tag" && li.name === "li" && li.children) {
						// Remove the first <a> child if it's a back-reference (href starts with #)
						const firstChild = li.children[0];
						if (
							firstChild &&
							firstChild.type === "tag" &&
							firstChild.name === "a" &&
							firstChild.attribs?.href?.startsWith("#")
						) {
							li.children.shift(); // Remove the first element
						}
					}
				});
			}
		}
	}

	// Recurse into children
	if (node.children) {
		node.children.forEach(removeFootnoteBackLinks);
	}
}

function trimLinksAndMoveSpacesOutside(node) {
	if (node.type === "tag" && node.name === "a" && node.children) {
		// For <a> tags, trim leading/trailing whitespace from text content
		const firstChild = node.children[0];
		const lastChild = node.children[node.children.length - 1];

		// Track spaces to move outside
		let leadingSpace = "";
		let trailingSpace = "";

		// Check first text node for leading space
		if (firstChild && firstChild.type === "text") {
			const match = firstChild.data.match(/^(\s+)/);
			if (match) {
				leadingSpace = match[1];
				firstChild.data = firstChild.data.slice(leadingSpace.length);
			}
		}

		// Check last text node for trailing space
		if (lastChild && lastChild.type === "text") {
			const match = lastChild.data.match(/(\s+)$/);
			if (match) {
				trailingSpace = match[1];
				lastChild.data = lastChild.data.slice(0, -trailingSpace.length);
			}
		}

		// Store the spaces so parent can add them outside the link
		if (leadingSpace) node._leadingSpace = leadingSpace;
		if (trailingSpace) node._trailingSpace = trailingSpace;
	}

	// Recurse into children first
	if (node.children) {
		node.children.forEach(trimLinksAndMoveSpacesOutside);

		// After processing children, move spaces outside links
		const newChildren = [];
		for (const child of node.children) {
			if (child.type === "tag" && child.name === "a") {
				if (child._leadingSpace) {
					newChildren.push({ type: "text", data: child._leadingSpace, parent: node });
					delete child._leadingSpace;
				}
				newChildren.push(child);
				if (child._trailingSpace) {
					newChildren.push({ type: "text", data: child._trailingSpace, parent: node });
					delete child._trailingSpace;
				}
			} else {
				newChildren.push(child);
			}
		}
		node.children = newChildren;
	}
}

function consolidateAdjacentSpans(node) {
	if (!node.children || node.children.length === 0) {
		return;
	}

	const newChildren = [];
	let i = 0;

	while (i < node.children.length) {
		const child = node.children[i];

		// If this is a span with only text content and no attributes, try to merge with adjacent spans
		if (
			child.type === "tag" &&
			child.name === "span" &&
			(!child.attribs || Object.keys(child.attribs).length === 0)
		) {
			// Collect all adjacent spans with no attributes
			const spansToMerge = [child];
			let j = i + 1;

			while (j < node.children.length) {
				const nextChild = node.children[j];
				if (
					nextChild.type === "tag" &&
					nextChild.name === "span" &&
					(!nextChild.attribs || Object.keys(nextChild.attribs).length === 0)
				) {
					spansToMerge.push(nextChild);
					j++;
				} else {
					break;
				}
			}

			// If we found adjacent spans, merge them
			if (spansToMerge.length > 1) {
				const mergedSpan = {
					type: "tag",
					name: "span",
					attribs: {},
					children: [],
					parent: node,
				};

				// Combine all children from the spans
				for (const span of spansToMerge) {
					if (span.children) {
						mergedSpan.children.push(...span.children);
					}
				}

				newChildren.push(mergedSpan);
				i = j;
			} else {
				newChildren.push(child);
				i++;
			}
		} else {
			newChildren.push(child);
			i++;
		}
	}

	node.children = newChildren;

	// Recurse into children
	node.children.forEach((child) => {
		if (child.type === "tag") {
			consolidateAdjacentSpans(child);
		}
	});
}

function normalizeSpacing(node) {
	if (!node.children || node.children.length === 0) {
		return;
	}

	const inlineElements = ["span", "a", "strong", "em", "b", "i", "code", "u", "s", "sup", "sub"];
	const newChildren = [];

	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		const nextChild = node.children[i + 1];

		// Add current child to newChildren
		newChildren.push(child);

		// Check if we need to add a space between inline elements
		if (child.type === "tag" && inlineElements.includes(child.name)) {
			if (nextChild && nextChild.type === "tag" && inlineElements.includes(nextChild.name)) {
				// Two adjacent inline elements - check if there's a space between them
				const childText = DomUtils.textContent(child);
				const nextText = DomUtils.textContent(nextChild);

				// Check if child ends with space or nextChild starts with space
				const childEndsWithSpace = childText.match(/\s$/);
				const nextStartsWithSpace = nextText.match(/^\s/);

				// If neither has a space at the boundary, insert a space
				if (!childEndsWithSpace && !nextStartsWithSpace && childText && nextText) {
					const spaceNode = {
						type: "text",
						data: " ",
						parent: node,
					};
					newChildren.push(spaceNode);
				}
			}
		}
	}

	node.children = newChildren;

	// Recurse into children
	node.children.forEach((child) => {
		if (child.type === "tag") {
			normalizeSpacing(child);
		}
	});
}
