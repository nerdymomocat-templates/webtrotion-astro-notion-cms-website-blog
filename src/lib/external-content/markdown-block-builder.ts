import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import type {
	Block,
	Footnote,
	RichText,
	Annotation,
	Paragraph as ParagraphBlock,
	Emoji,
} from "@/lib/interfaces";
import type { ExternalContentDescriptor, Post } from "@/lib/interfaces";
import type {
	Content,
	DefinitionContent,
	FootnoteDefinition,
	Heading,
	Image,
	List,
	ListItem,
	PhrasingContent,
	Paragraph,
	Root,
	Table,
	TableRow,
	TableCell as MdTableCell,
	HTML,
	MdxJsxFlowElement,
	MdxJsxTextElement,
} from "mdast";
import { toString } from "mdast-util-to-string";
import { isRelativePath, toPublicUrl } from "./external-html-utils";
import { SHORTCODES, BASE_PATH, CUSTOM_DOMAIN } from "@/constants";

type AnnotationState = Partial<Omit<Annotation, "Color">> & {
	color?: string;
	href?: string;
};

function createAnnotation(state?: AnnotationState): Annotation {
	return {
		Bold: !!state?.Bold,
		Italic: !!state?.Italic,
		Strikethrough: !!state?.Strikethrough,
		Underline: !!state?.Underline,
		Code: !!state?.Code,
		Color: state?.color || "default",
	};
}

function createRichText(
	text: string,
	state?: AnnotationState,
	options?: { href?: string },
): RichText {
	const trimmed = text.replace(/\r/g, "");
	return {
		PlainText: trimmed,
		Text: {
			Content: trimmed,
			Link: options?.href ? { Url: options.href } : undefined,
		},
		Href: options?.href,
		Annotation: createAnnotation(state),
	};
}

type ConvertInlineOptions = {
	footnotes: Footnote[];
	blockId: string;
	addBlock?: (block: Block) => void;
	prefix?: string;
};

type BuilderOptions = {
	post: Post;
	descriptor: ExternalContentDescriptor;
	allowMdx?: boolean;
};

const MEDIA_EXTENSIONS = {
	video: [".mp4", ".mov", ".webm", ".mkv", ".avi"],
	audio: [".mp3", ".wav", ".ogg", ".m4a", ".flac"],
};

const CALLOUT_PRESETS: Record<string, { icon: Emoji; color: string }> = {
	NOTE: { icon: { Type: "emoji", Emoji: "💡" }, color: "blue_background" },
	TIP: { icon: { Type: "emoji", Emoji: "💡" }, color: "blue_background" },
	IMPORTANT: { icon: { Type: "emoji", Emoji: "❗" }, color: "orange_background" },
	WARNING: { icon: { Type: "emoji", Emoji: "⚠️" }, color: "red_background" },
	CAUTION: { icon: { Type: "emoji", Emoji: "⚠️" }, color: "yellow_background" },
};

export function buildMarkdownBlocks(markdown: string, options: BuilderOptions): Block[] {
	const builder = new MarkdownBlockBuilder(markdown, options);
	return builder.build();
}

export class MarkdownBlockBuilder {
	private footnoteDefinitions: Map<string, FootnoteDefinition> = new Map();
	private footnoteCache: Map<string, Footnote> = new Map();
	private blockIdCounter = 0;
	private tree: Root;
	private lastUpdated: Date;
	private allowMdx: boolean;

	constructor(
		private markdown: string,
		private options: BuilderOptions,
	) {
		this.allowMdx = !!options.allowMdx;
		this.tree = this.parseMarkdown(markdown);
		this.lastUpdated = options.post.LastUpdatedTimeStamp || new Date();
	}

	build(): Block[] {
		return this.convertNodes(this.tree.children);
	}

	private parseMarkdown(source: string): Root {
		const processor = unified().use(remarkParse).use(remarkGfm);

		if (this.allowMdx) {
			processor.use(remarkMdx);
		}

		processor.use(remarkFrontmatter, ["yaml", "toml"]);
		const tree = processor.parse(source) as Root;
		const filteredChildren: Content[] = [];
		for (const node of tree.children) {
			if (node.type === "yaml" || node.type === "toml") continue;
			if (node.type === "html" && typeof (node as any).value === "string") {
				const raw = (node as any).value.trim();
				if (raw.startsWith("<!--") && raw.endsWith("-->")) continue;
			}
			if (node.type === "footnoteDefinition") {
				this.footnoteDefinitions.set(node.identifier, node);
				continue;
			}
			filteredChildren.push(node);
		}
		tree.children = filteredChildren;
		return tree;
	}

	private nextBlockId(prefix = "md"): string {
		this.blockIdCounter += 1;
		return `${this.options.post.PageId}-${prefix}-${this.blockIdCounter}`;
	}

	private resolveUrl(raw: string | null | undefined): string {
		if (!raw) return "";
		if (isRelativePath(raw)) {
			return toPublicUrl(raw, this.options.descriptor);
		}
		return raw;
	}

	private resolveAssetUrl(raw: string | null | undefined): string {
		const resolved = this.resolveUrl(raw || "");
		if (!resolved) return "";
		if (resolved.startsWith("http://") || resolved.startsWith("https://")) return resolved;
		const origin = CUSTOM_DOMAIN ? `https://${CUSTOM_DOMAIN}` : "http://localhost:4321";
		const joined = path.posix.join(BASE_PATH || "/", resolved.replace(/^\//, ""));
		return new URL(joined, origin).toString();
	}

	private classifyMedia(url: string): "video" | "audio" | null {
		const lower = url.toLowerCase();
		if (MEDIA_EXTENSIONS.video.some((ext) => lower.endsWith(ext))) return "video";
		if (MEDIA_EXTENSIONS.audio.some((ext) => lower.endsWith(ext))) return "audio";
		return null;
	}

	private getFootnote(identifier: string): Footnote | null {
		if (this.footnoteCache.has(identifier)) {
			return this.footnoteCache.get(identifier)!;
		}
		const definition = this.footnoteDefinitions.get(identifier);
		if (!definition) return null;

		const blocks = this.convertNodes(definition.children, undefined, "fn");
		const marker = `mdfn_${this.footnoteCache.size + 1}`;
		const footnote: Footnote = {
			Marker: marker,
			FullMarker: `[^${marker}]`,
			SourceLocation: "content",
			Content: blocks.length
				? { Type: "blocks", Blocks: blocks }
				: { Type: "rich_text", RichTexts: [createRichText(toString(definition))] },
		};
		this.footnoteCache.set(identifier, footnote);
		return footnote;
	}

	private convertInlineNodes(
		children: PhrasingContent[],
		options: ConvertInlineOptions,
		state?: AnnotationState,
	): RichText[] {
		const results: RichText[] = [];
		for (const child of children) {
			results.push(...this.convertInlineNode(child, options, state));
		}
		return results.filter((rt) => !!rt.PlainText || rt.IsFootnoteMarker);
	}

	private convertInlineNode(
		node: PhrasingContent,
		options: ConvertInlineOptions,
		state?: AnnotationState,
	): RichText[] {
		switch (node.type) {
			case "text":
				return node.value ? [createRichText(node.value, state, { href: state?.href })] : [];
			case "strong":
				return this.convertInlineNodes(node.children, options, { ...state, Bold: true });
			case "emphasis":
				return this.convertInlineNodes(node.children, options, { ...state, Italic: true });
			case "delete":
				return this.convertInlineNodes(node.children, options, { ...state, Strikethrough: true });
			case "inlineCode":
				return [createRichText(node.value, { ...state, Code: true })];
			case "link": {
				const href = this.resolveAssetUrl(node.url);
				const mediaKind = href ? this.classifyMedia(href) : null;
				if (mediaKind) {
					const mediaBlock =
						mediaKind === "video"
							? this.buildMediaBlock(
									{ url: href, alt: node.title || href },
									"video",
									options.prefix,
								)
							: this.buildMediaBlock(
									{ url: href, alt: node.title || href },
									"audio",
									options.prefix,
								);
					if (mediaBlock && options.addBlock) {
						options.addBlock(mediaBlock);
						return [];
					}
				}

				const childRichTexts = this.convertInlineNodes(node.children, options, {
					...state,
					href,
				});
				if (childRichTexts.length === 0 && node.title) {
					return [createRichText(node.title, state, { href })];
				}
				return childRichTexts.length ? childRichTexts : [createRichText(href, state, { href })];
			}
			case "break":
				return [createRichText("\n", state)];
			case "footnoteReference": {
				const footnote = this.getFootnote(node.identifier);
				if (!footnote) return [createRichText("[†]", state)];
				options.footnotes.push(footnote);
				return [
					{
						PlainText: "[†]",
						Text: { Content: "[†]" },
						Annotation: createAnnotation(state),
						IsFootnoteMarker: true,
						FootnoteRef: footnote.Marker,
					},
				];
			}
			case "image": {
				const url = this.resolveAssetUrl(node.url || "");
				const altText = node.alt || url;
				const mediaKind = this.classifyMedia(url);
				if (mediaKind) {
					const mediaBlock =
						mediaKind === "video"
							? this.buildMediaBlock({ url, alt: altText }, "video", options.prefix)
							: this.buildMediaBlock({ url, alt: altText }, "audio", options.prefix);
					if (mediaBlock && options.addBlock) {
						options.addBlock(mediaBlock);
						return [];
					}
				}
				const imageBlock = this.buildImageBlock(node);
				if (imageBlock && options.addBlock) {
					options.addBlock(imageBlock);
					return [];
				}
				return [createRichText(altText, state, { href: url })];
			}
			case "mdxJsxTextElement": {
				const htmlString = this.serializeMdxJsx(node as unknown as MdxJsxTextElement);
				if (!htmlString) return [];
				if (options.addBlock) {
					const block = this.buildHtmlBlock({ type: "html", value: htmlString } as HTML);
					if (block) options.addBlock(block);
					return [];
				}
				return [createRichText("")];
			}
			default:
				return [];
		}
	}

	private buildParagraphBlocks(node: Paragraph, prefix?: string): Block[] {
		const blocks: Block[] = [];
		const blockId = this.nextBlockId(prefix);
		const footnotes: Footnote[] = [];
		let current: RichText[] = [];

		const flushParagraph = () => {
			if (!current.length) return;
			const firstText = current[0]?.PlainText?.trim() || "";
			const calloutMatch = firstText.match(/^\[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
			if (calloutMatch) {
				const key = calloutMatch[1].toUpperCase();
				const preset = CALLOUT_PRESETS[key];
				if (preset) {
					current[0].PlainText = current[0].PlainText.replace(calloutMatch[0], "").trimStart();
					if (current[0].Text) {
						current[0].Text.Content = current[0].PlainText;
					}
					const callout: Block = {
						Id: this.nextBlockId(prefix),
						Type: "callout",
						HasChildren: false,
						LastUpdatedTimeStamp: this.lastUpdated,
						Callout: {
							RichTexts: current,
							Color: preset.color,
							Icon: preset.icon,
							Children: undefined,
						},
					};
					if (footnotes.length) callout.Footnotes = footnotes;
					blocks.push(callout);
					current = [];
					return;
				}
			}

			const paragraphBlock: Block = {
				Id: this.nextBlockId(prefix),
				Type: "paragraph",
				HasChildren: false,
				LastUpdatedTimeStamp: this.lastUpdated,
				Paragraph: {
					RichTexts: current,
					Color: "default",
				},
			};
			if (footnotes.length) paragraphBlock.Footnotes = footnotes;
			blocks.push(paragraphBlock);
			current = [];
		};

		const addBlockInOrder = (block: Block) => {
			flushParagraph();
			blocks.push(block);
		};

		for (const child of node.children) {
			const richTexts = this.convertInlineNode(child as PhrasingContent, {
				footnotes,
				blockId,
				addBlock: addBlockInOrder,
				prefix,
			});
			if (richTexts.length) current.push(...richTexts);
		}

		flushParagraph();
		return blocks;
	}

	private buildHeadingBlock(node: Heading): Block | null {
		if (node.depth < 1 || node.depth > 3) {
			return this.buildParagraphBlocks({
				type: "paragraph",
				children: node.children,
			} as Paragraph)[0];
		}

		const blockId = this.nextBlockId();
		const footnotes: Footnote[] = [];
		const richTexts = this.convertInlineNodes(node.children, { footnotes, blockId });
		if (!richTexts.length) return null;

		const base: Block = {
			Id: blockId,
			Type: `heading_${node.depth}` as Block["Type"],
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
		};

		if (node.depth === 1) {
			base.Heading1 = { RichTexts: richTexts, Color: "default", IsToggleable: false };
		} else if (node.depth === 2) {
			base.Heading2 = { RichTexts: richTexts, Color: "default", IsToggleable: false };
		} else {
			base.Heading3 = { RichTexts: richTexts, Color: "default", IsToggleable: false };
		}

		if (footnotes.length) base.Footnotes = footnotes;
		return base;
	}

	private buildListBlocks(node: List): Block[] {
		const blocks: Block[] = [];
		for (const item of node.children) {
			if (item.type !== "listItem") continue;
			const built = this.buildListItemBlock(item, node.ordered);
			if (built.length) blocks.push(...built);
		}
		return blocks;
	}

	private buildListItemBlock(item: ListItem, ordered: boolean | null): Block[] {
		const paragraphChild = item.children.find((child) => child.type === "paragraph") as
			| Paragraph
			| undefined;
		const otherChildren = item.children.filter((child) => child !== paragraphChild) as Content[];
		const isTask = item.checked !== null && item.checked !== undefined;

		const blockId = this.nextBlockId();
		const footnotes: Footnote[] = [];
		const blocks: Block[] = [];
		let current: RichText[] = [];

		const flushInline = () => {
			if (!current.length) return;
			const payload: ParagraphBlock = {
				RichTexts: current,
				Color: "default",
				Children: this.convertNodes(otherChildren),
			};
			const block: Block = {
				Id: blockId,
				Type: isTask ? "to_do" : ordered ? "numbered_list_item" : "bulleted_list_item",
				HasChildren: otherChildren.length > 0,
				LastUpdatedTimeStamp: this.lastUpdated,
			};
			if (isTask) {
				block.ToDo = { ...payload, Checked: !!item.checked };
			} else if (ordered) {
				block.NumberedListItem = payload;
			} else {
				block.BulletedListItem = payload;
			}
			if (footnotes.length) block.Footnotes = footnotes;
			blocks.push(block);
			current = [];
		};

		const addBlockInOrder = (block: Block) => {
			flushInline();
			blocks.push(block);
		};

		for (const child of paragraphChild?.children || []) {
			const richTexts = this.convertInlineNode(child as PhrasingContent, {
				footnotes,
				blockId,
				addBlock: addBlockInOrder,
			});
			if (richTexts.length) current.push(...richTexts);
		}

		flushInline();
		return blocks;
	}

	private buildCodeBlock(node: Content & { type: "code"; lang?: string; value: string }): Block {
		const blockId = this.nextBlockId();
		return {
			Id: blockId,
			Type: "code",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			Code: {
				Language: node.lang || "plain text",
				RichTexts: [createRichText(node.value || "", { Code: false })],
				Caption: [],
			},
		};
	}

	private buildTable(node: Table): Block | null {
		if (!node.children?.length) return null;
		const blockId = this.nextBlockId();

		const rows = node.children as TableRow[];
		const mappedRows =
			rows?.map((row) => {
				const cells = (row.children as MdTableCell[]).map((cell) => {
					const blockIdCell = this.nextBlockId("cell");
					const footnotes: Footnote[] = [];
					const richTexts = this.convertInlineNodes(cell.children as PhrasingContent[], {
						footnotes,
						blockId: blockIdCell,
					});
					return { RichTexts: richTexts };
				});
				return { Id: this.nextBlockId("row"), Type: "table_row", HasChildren: false, Cells: cells };
			}) || [];

		return {
			Id: blockId,
			Type: "table",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			Table: {
				Rows: mappedRows,
			},
		};
	}

	private buildHtmlBlock(node: HTML): Block | null {
		const raw = typeof node.value === "string" ? node.value : "";
		if (!raw.trim()) return null;

		const rewritten = raw.replace(/(src|href)=(["'])([^"']+)\2/gi, (_, attr, quote, url) => {
			const resolved = this.resolveAssetUrl(url);
			return `${attr}=${quote}${resolved}${quote}`;
		});

		const injectShortcode =
			SHORTCODES["html-inject"] && SHORTCODES["html-inject"].trim()
				? SHORTCODES["html-inject"]
				: "<!DOCTYPE html> <!-- inject -->";

		const codeContent = `${injectShortcode}\n${rewritten}`;

		return {
			Id: this.nextBlockId("html"),
			Type: "code",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			Code: {
				Language: "html",
				RichTexts: [createRichText(codeContent)],
				Caption: [],
			},
		};
	}

	private buildImageBlock(node: Image, prefix?: string): Block | null {
		const url = this.resolveAssetUrl(node.url || "");
		if (!url) return null;

		const mediaKind = this.classifyMedia(url);
		if (mediaKind) {
			return this.buildMediaBlock(
				{ url, alt: node.alt || url },
				mediaKind === "video" ? "video" : "audio",
				prefix,
			);
		}

		const blockId = this.nextBlockId(prefix);
		return {
			Id: blockId,
			Type: "image",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			NImage: {
				Type: "external",
				External: { Url: url },
				Caption: node.alt ? [createRichText(node.alt)] : [],
			},
		};
	}

	private buildMediaBlock(
		node: DefinitionContent & { url?: string; alt?: string },
		kind: "video" | "audio",
		prefix?: string,
	): Block | null {
		const url = this.resolveAssetUrl(node.url || "");
		if (!url) return null;
		const blockId = this.nextBlockId(prefix);
		if (kind === "video") {
			return {
				Id: blockId,
				Type: "video",
				HasChildren: false,
				LastUpdatedTimeStamp: this.lastUpdated,
				Video: {
					Type: "external",
					External: { Url: url },
					Caption: node.alt ? [createRichText(node.alt)] : [],
				},
			};
		}
		return {
			Id: blockId,
			Type: "audio",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			NAudio: {
				Type: "external",
				External: { Url: url },
				Caption: node.alt ? [createRichText(node.alt)] : [],
			},
		};
	}

	private buildQuoteBlock(node: Content & { type: "blockquote"; children: Content[] }): Block[] {
		const paragraphs = node.children.filter((child) => child.type === "paragraph") as Paragraph[];
		if (!paragraphs.length) return [];

		const firstParagraph = paragraphs[0];
		const blockId = this.nextBlockId();
		const footnotes: Footnote[] = [];
		const blocksInQuote: Block[] = [];
		let currentRichTexts: RichText[] = [];

		const addBlockInOrder = (block: Block) => {
			if (currentRichTexts.length) {
				const inlineBlock: Block = {
					Id: this.nextBlockId(),
					Type: "paragraph",
					HasChildren: false,
					LastUpdatedTimeStamp: this.lastUpdated,
					Paragraph: {
						RichTexts: currentRichTexts,
						Color: "default",
					},
				};
				if (footnotes.length) inlineBlock.Footnotes = footnotes;
				blocksInQuote.push(inlineBlock);
				currentRichTexts = [];
			}
			blocksInQuote.push(block);
		};

		for (const child of firstParagraph.children) {
			const richTexts = this.convertInlineNode(child as PhrasingContent, {
				footnotes,
				blockId,
				addBlock: addBlockInOrder,
			});
			if (richTexts.length) currentRichTexts.push(...richTexts);
		}

		const childNodes = node.children.filter((child) => child !== firstParagraph);
		const childBlocks = this.convertNodes(childNodes);

		const firstText = currentRichTexts[0]?.PlainText?.trim() || "";
		const calloutMatch = firstText.match(/^\[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
		if (calloutMatch) {
			const key = calloutMatch[1].toUpperCase();
			const preset = CALLOUT_PRESETS[key];
			if (preset) {
				currentRichTexts[0].PlainText = currentRichTexts[0].PlainText.replace(
					calloutMatch[0],
					"",
				).trimStart();
				if (currentRichTexts[0].Text) {
					currentRichTexts[0].Text.Content = currentRichTexts[0].PlainText;
				}
				const callout: Block = {
					Id: blockId,
					Type: "callout",
					HasChildren: childBlocks.length + blocksInQuote.length > 0,
					LastUpdatedTimeStamp: this.lastUpdated,
					Callout: {
						RichTexts: currentRichTexts,
						Color: preset.color,
						Icon: preset.icon,
						Children:
							blocksInQuote.length + childBlocks.length > 0
								? [...blocksInQuote, ...childBlocks]
								: undefined,
					},
				};
				if (footnotes.length) callout.Footnotes = footnotes;
				return [callout];
			}
		}

		const quote: Block = {
			Id: blockId,
			Type: "quote",
			HasChildren: blocksInQuote.length + childBlocks.length > 0,
			LastUpdatedTimeStamp: this.lastUpdated,
			Quote: {
				RichTexts: currentRichTexts.length ? currentRichTexts : [createRichText("")],
				Color: "default",
				Children:
					blocksInQuote.length + childBlocks.length > 0
						? [...blocksInQuote, ...childBlocks]
						: undefined,
			},
		};

		if (footnotes.length) quote.Footnotes = footnotes;
		return [quote];
	}

	private convertNodes(nodes: Content[], acc: Block[] = [], prefix?: string): Block[] {
		const blocks: Block[] = acc;
		for (const node of nodes) {
			switch (node.type) {
				case "paragraph": {
					const built = this.buildParagraphBlocks(node, prefix);
					if (built.length) blocks.push(...built);
					break;
				}
				case "html": {
					const block = this.buildHtmlBlock(node as HTML);
					if (block) blocks.push(block);
					break;
				}
				case "mdxJsxFlowElement": {
					const htmlString = this.serializeMdxJsx(node as unknown as MdxJsxFlowElement);
					if (htmlString) {
						const block = this.buildHtmlBlock({ type: "html", value: htmlString } as HTML);
						if (block) blocks.push(block);
					}
					break;
				}
				case "heading": {
					const block = this.buildHeadingBlock(node);
					if (block) blocks.push(block);
					break;
				}
				case "list":
					blocks.push(...this.buildListBlocks(node));
					break;
				case "code":
					blocks.push(this.buildCodeBlock(node));
					break;
				case "blockquote": {
					const built = this.buildQuoteBlock(node);
					if (built.length) blocks.push(...built);
					break;
				}
				case "table": {
					const block = this.buildTable(node as Table);
					if (block) blocks.push(block);
					break;
				}
				case "thematicBreak":
					blocks.push({
						Id: this.nextBlockId(prefix),
						Type: "divider",
						HasChildren: false,
						LastUpdatedTimeStamp: this.lastUpdated,
					});
					break;
				case "image": {
					const block = this.buildImageBlock(node, prefix);
					if (block) blocks.push(block);
					break;
				}
				case "mdxJsxTextElement": {
					const htmlString = this.serializeMdxJsx(node as unknown as MdxJsxTextElement);
					if (htmlString) {
						const block = this.buildHtmlBlock({ type: "html", value: htmlString } as HTML);
						if (block) blocks.push(block);
					}
					break;
				}
				case "link": {
					const href = this.resolveAssetUrl(node.url || "");
					const mediaKind = href ? this.classifyMedia(href) : null;
					if (mediaKind) {
						const mediaBlock =
							mediaKind === "video"
								? this.buildMediaBlock(node, "video", prefix)
								: this.buildMediaBlock(node, "audio", prefix);
						if (mediaBlock) {
							blocks.push(mediaBlock);
						}
					}
					break;
				}
				default:
					break;
			}
		}
		return blocks;
	}

	private serializeMdxJsx(node: MdxJsxFlowElement | MdxJsxTextElement): string {
		if (!node || typeof node.name !== "string" || !node.name.trim()) return "";

		const serializeAttr = (attr: any): string => {
			if (!attr || attr.type !== "mdxJsxAttribute") return "";
			if (!attr.name) return "";
			if (attr.value === null || typeof attr.value === "undefined") return attr.name;
			if (typeof attr.value === "string") {
				const resolved = this.resolveAssetUrl(attr.value);
				return `${attr.name}="${resolved}"`;
			}
			return `${attr.name}={...}`;
		};

		const attrs = (node.attributes || [])
			.map((attr: any) => serializeAttr(attr))
			.filter(Boolean)
			.join(" ");
		const open = attrs ? `<${node.name} ${attrs}>` : `<${node.name}>`;

		const childContent =
			node.children && node.children.length
				? node.children.map((child) => toString(child as any)).join("")
				: "";

		if (!childContent) {
			const selfClosing = attrs ? `<${node.name} ${attrs} />` : `<${node.name} />`;
			return selfClosing;
		}

		return `${open}${childContent}</${node.name}>`;
	}
}
