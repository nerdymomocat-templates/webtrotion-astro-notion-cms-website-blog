import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import { parseDocument, DomUtils } from "htmlparser2";
import type { Element as ElementNode } from "domhandler";
import type {
	Block,
	Footnote,
	RichText,
	Annotation,
	Paragraph as ParagraphBlock,
	Emoji,
} from "../interfaces";
import type { ExternalContentDescriptor, Post } from "../interfaces";
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
import { isRelativePath, toPublicUrl } from "./external-content-utils";
import { SHORTCODES, BASE_PATH, CUSTOM_DOMAIN } from "../../constants";

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

function normalizeNotionColor(color?: string): string | undefined {
	if (!color) return undefined;
	if (color.endsWith("_bg")) {
		return `${color.slice(0, -3)}_background`;
	}
	return color;
}

function parseBooleanAttribute(value?: string): boolean {
	return value === "true";
}

function extractUuidFromString(value?: string): string | null {
	if (!value) return null;
	const match = value.match(
		/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32}/i,
	);
	if (!match) return null;
	const candidate = match[0].toLowerCase();
	if (candidate.includes("-")) return candidate;
	return `${candidate.slice(0, 8)}-${candidate.slice(8, 12)}-${candidate.slice(12, 16)}-${candidate.slice(16, 20)}-${candidate.slice(20)}`;
}

function dedentNotionChildren(markdown: string): string {
	const lines = markdown.replace(/\r/g, "").split("\n");
	const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
	if (!nonEmptyLines.length) return "";
	const hasUniformTabIndent = nonEmptyLines.every((line) => line.startsWith("\t"));
	if (!hasUniformTabIndent) {
		return markdown.trim();
	}
	return lines
		.map((line) => (line.startsWith("\t") ? line.slice(1) : line))
		.join("\n")
		.trim();
}

function getElementAttr(node: ElementNode, keys: string[]): string | undefined {
	for (const key of keys) {
		const value = node.attribs?.[key];
		if (value) {
			return value;
		}
	}
	return undefined;
}

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

		const tableWidth = mappedRows[0]?.Cells?.length || 0;

		return {
			Id: blockId,
			Type: "table",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			Table: {
				TableWidth: tableWidth,
				HasColumnHeader: true,
				HasRowHeader: false,
				Rows: mappedRows,
			},
		};
	}

	private buildInlineRichTextsFromNotionMarkdown(markdown: string, blockId: string): RichText[] {
		const normalized = markdown
			.replace(/<mention-[^>]+>(.*?)<\/mention-[^>]+>/g, "$1")
			.replace(/<mention-[^>]+\/>/g, "")
			.replace(/<span[^>]*>(.*?)<\/span>/g, "$1")
			.trim();

		if (!normalized) {
			return [];
		}

		const tree = this.parseMarkdown(normalized);
		const firstNode = tree.children[0];
		if (!firstNode || firstNode.type !== "paragraph") {
			return [createRichText(normalized)];
		}

		const footnotes: Footnote[] = [];
		const richTexts = this.convertInlineNodes(
			(firstNode as Paragraph).children as PhrasingContent[],
			{
				footnotes,
				blockId,
			},
		);
		return richTexts.length ? richTexts : [createRichText(normalized)];
	}

	private buildNotionEnhancedTableBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const tableNode = DomUtils.findOne(
			(node) => node.type === "tag" && (node as ElementNode).name === "table",
			document.children,
			true,
		) as ElementNode | null;
		if (!tableNode) {
			return null;
		}

		const columnNodes = DomUtils.findAll(
			(node) => node.type === "tag" && (node as ElementNode).name === "col",
			tableNode.children,
			true,
		) as ElementNode[];
		const columnColors = columnNodes.map((node) => normalizeNotionColor(node.attribs?.color));

		const rowNodes = DomUtils.findAll(
			(node) => node.type === "tag" && (node as ElementNode).name === "tr",
			tableNode.children,
			true,
		) as ElementNode[];
		if (!rowNodes.length) {
			return null;
		}

		const rows = rowNodes.map((rowNode) => {
			const rowColor = normalizeNotionColor(rowNode.attribs?.color);
			const cellNodes = DomUtils.findAll(
				(node) =>
					node.type === "tag" && ["td", "th"].includes((node as ElementNode).name.toLowerCase()),
				rowNode.children,
				false,
			) as ElementNode[];
			const cells = cellNodes.map((cellNode, columnIndex) => {
				const cellColor =
					normalizeNotionColor(cellNode.attribs?.color) ||
					rowColor ||
					columnColors[columnIndex] ||
					undefined;
				const cellMarkdown = DomUtils.getInnerHTML(cellNode).replace(/<br\s*\/?>/gi, "\n");
				const richTexts = this.buildInlineRichTextsFromNotionMarkdown(
					cellMarkdown,
					this.nextBlockId("cell"),
				);
				return {
					RichTexts: richTexts.length ? richTexts : [createRichText("")],
					...(cellColor ? { Color: cellColor } : {}),
				};
			});
			return {
				Id: this.nextBlockId("row"),
				Type: "table_row",
				HasChildren: false,
				Cells: cells,
				...(rowColor ? { Color: rowColor } : {}),
			};
		});

		const tableWidth = rows[0]?.Cells?.length || 0;
		return {
			Id: this.nextBlockId("table"),
			Type: "table",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			Table: {
				TableWidth: tableWidth,
				HasColumnHeader: parseBooleanAttribute(tableNode.attribs?.["header-row"]),
				HasRowHeader: parseBooleanAttribute(tableNode.attribs?.["header-column"]),
				Rows: rows,
				...(normalizeNotionColor(tableNode.attribs?.color)
					? { Color: normalizeNotionColor(tableNode.attribs?.color) }
					: {}),
			},
		};
	}

	private buildNotionEnhancedSyncedBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const syncedNode = DomUtils.findOne(
			(node) =>
				node.type === "tag" &&
				["synced_block", "synced_block_reference"].includes((node as ElementNode).name),
			document.children,
			true,
		) as ElementNode | null;
		if (!syncedNode) {
			return null;
		}

		const isReference = syncedNode.name === "synced_block_reference";
		const syncedFromId = isReference ? extractUuidFromString(syncedNode.attribs?.url) : null;
		const childrenMarkdown = dedentNotionChildren(DomUtils.getInnerHTML(syncedNode));
		const children = childrenMarkdown
			? this.convertNodes(this.parseMarkdown(childrenMarkdown).children, [], "synced")
			: [];

		return {
			Id: this.nextBlockId("synced"),
			Type: "synced_block",
			HasChildren: children.length > 0,
			LastUpdatedTimeStamp: this.lastUpdated,
			SyncedBlock: {
				SyncedFrom: syncedFromId ? { BlockId: syncedFromId } : null,
				Children: children,
			},
		};
	}

	private buildNotionEnhancedColumnsBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const containerNode = DomUtils.findOne(
			(node) =>
				node.type === "tag" &&
				["columns", "tabs"].includes((node as ElementNode).name.toLowerCase()),
			document.children,
			true,
		) as ElementNode | null;
		if (!containerNode) {
			return null;
		}

		const childTagName = containerNode.name.toLowerCase() === "tabs" ? "tab" : "column";
		const childNodes = containerNode.children.filter(
			(node) => node.type === "tag" && (node as ElementNode).name.toLowerCase() === childTagName,
		) as ElementNode[];
		if (!childNodes.length) {
			return null;
		}

		const columns = childNodes.map((childNode) => {
			const childrenMarkdown = dedentNotionChildren(DomUtils.getInnerHTML(childNode));
			const childBlocks = childrenMarkdown
				? this.convertNodes(this.parseMarkdown(childrenMarkdown).children, [], childTagName)
				: [];
			const tabTitle = getElementAttr(childNode, ["title", "name", "label"]);
			if (tabTitle) {
				childBlocks.unshift({
					Id: this.nextBlockId("tab-title"),
					Type: "paragraph",
					HasChildren: false,
					LastUpdatedTimeStamp: this.lastUpdated,
					Paragraph: {
						RichTexts: [createRichText(tabTitle)],
						Color: "default",
					},
				});
			}
			return {
				Id: this.nextBlockId(childTagName),
				Type: "column",
				HasChildren: childBlocks.length > 0,
				Children: childBlocks,
			};
		});

		return {
			Id: this.nextBlockId(containerNode.name.toLowerCase()),
			Type: "column_list",
			HasChildren: columns.length > 0,
			LastUpdatedTimeStamp: this.lastUpdated,
			ColumnList: {
				Columns: columns,
			},
		};
	}

	private buildNotionEnhancedToggleBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const detailsNode = DomUtils.findOne(
			(node) => node.type === "tag" && (node as ElementNode).name.toLowerCase() === "details",
			document.children,
			true,
		) as ElementNode | null;
		if (!detailsNode) {
			return null;
		}

		const summaryNode = detailsNode.children.find(
			(node) => node.type === "tag" && (node as ElementNode).name.toLowerCase() === "summary",
		) as ElementNode | undefined;
		const summaryMarkdown = summaryNode ? DomUtils.getInnerHTML(summaryNode) : "";
		const summaryHtml = summaryNode ? DomUtils.getOuterHTML(summaryNode) : "";
		const childrenHtml = summaryHtml
			? DomUtils.getInnerHTML(detailsNode).replace(summaryHtml, "")
			: DomUtils.getInnerHTML(detailsNode);
		const childrenMarkdown = dedentNotionChildren(childrenHtml);
		const children = childrenMarkdown
			? this.convertNodes(this.parseMarkdown(childrenMarkdown).children, [], "toggle")
			: [];

		return {
			Id: this.nextBlockId("toggle"),
			Type: "toggle",
			HasChildren: children.length > 0,
			LastUpdatedTimeStamp: this.lastUpdated,
			Toggle: {
				RichTexts: this.buildInlineRichTextsFromNotionMarkdown(
					summaryMarkdown || "Toggle",
					this.nextBlockId("toggle-summary"),
				),
				Color: normalizeNotionColor(detailsNode.attribs?.color) || "default",
				Children: children,
			},
		};
	}

	private buildNotionEnhancedTableOfContentsBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const tocNode = DomUtils.findOne(
			(node) =>
				node.type === "tag" && (node as ElementNode).name.toLowerCase() === "table_of_contents",
			document.children,
			true,
		) as ElementNode | null;
		if (!tocNode) {
			return null;
		}

		return {
			Id: this.nextBlockId("toc"),
			Type: "table_of_contents",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			TableOfContents: {
				Color: normalizeNotionColor(tocNode.attribs?.color) || "default",
			},
		};
	}

	private buildNotionEnhancedMediaBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const mediaNode = DomUtils.findOne(
			(node) =>
				node.type === "tag" &&
				["audio", "video", "file", "pdf"].includes((node as ElementNode).name.toLowerCase()),
			document.children,
			true,
		) as ElementNode | null;
		if (!mediaNode) {
			return null;
		}

		const src = this.resolveAssetUrl(mediaNode.attribs?.src || "");
		if (!src) {
			return null;
		}

		const captionText = DomUtils.textContent(mediaNode)?.trim() || "";
		const caption = captionText
			? this.buildInlineRichTextsFromNotionMarkdown(captionText, this.nextBlockId("caption"))
			: [];

		if (mediaNode.name.toLowerCase() === "audio") {
			return {
				Id: this.nextBlockId("audio"),
				Type: "audio",
				HasChildren: false,
				LastUpdatedTimeStamp: this.lastUpdated,
				NAudio: {
					Type: "external",
					External: { Url: src },
					Caption: caption,
				},
			};
		}

		if (mediaNode.name.toLowerCase() === "video") {
			return {
				Id: this.nextBlockId("video"),
				Type: "video",
				HasChildren: false,
				LastUpdatedTimeStamp: this.lastUpdated,
				Video: {
					Type: "external",
					External: { Url: src },
					Caption: caption,
				},
			};
		}

		return {
			Id: this.nextBlockId("file"),
			Type: "file",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			File: {
				Type: "external",
				External: { Url: src },
				Caption: caption,
			},
		};
	}

	private buildNotionEnhancedReferenceBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const referenceNode = DomUtils.findOne(
			(node) =>
				node.type === "tag" &&
				["page", "database"].includes((node as ElementNode).name.toLowerCase()),
			document.children,
			true,
		) as ElementNode | null;
		if (!referenceNode) {
			return null;
		}

		const url = referenceNode.attribs?.url || "";
		const title = DomUtils.textContent(referenceNode)?.trim() || "Untitled";
		if (referenceNode.name.toLowerCase() === "page") {
			const pageId = extractUuidFromString(url);
			if (pageId) {
				return {
					Id: this.nextBlockId("page"),
					Type: "link_to_page",
					HasChildren: false,
					LastUpdatedTimeStamp: this.lastUpdated,
					LinkToPage: {
						Type: "page_id",
						PageId: pageId,
					},
				};
			}
		}

		return {
			Id: this.nextBlockId("reference"),
			Type: "embed",
			HasChildren: false,
			LastUpdatedTimeStamp: this.lastUpdated,
			Embed: {
				Url: this.resolveAssetUrl(url),
				Caption: title ? [createRichText(title)] : [],
			},
		};
	}

	private buildNotionEnhancedMeetingNotesBlock(raw: string): Block | null {
		const document = parseDocument(raw);
		const meetingNotesNode = DomUtils.findOne(
			(node) => node.type === "tag" && (node as ElementNode).name.toLowerCase() === "meeting-notes",
			document.children,
			true,
		) as ElementNode | null;
		if (!meetingNotesNode) {
			return null;
		}

		const childrenMarkdown = dedentNotionChildren(DomUtils.getInnerHTML(meetingNotesNode));
		const children = childrenMarkdown
			? this.convertNodes(this.parseMarkdown(childrenMarkdown).children, [], "meeting-notes")
			: [];
		return {
			Id: this.nextBlockId("meeting-notes"),
			Type: "toggle",
			HasChildren: children.length > 0,
			LastUpdatedTimeStamp: this.lastUpdated,
			Toggle: {
				RichTexts: [createRichText("Meeting notes")],
				Color: "default",
				Children: children,
			},
		};
	}

	private buildHtmlBlock(node: HTML): Block | null {
		const raw = typeof node.value === "string" ? node.value : "";
		if (!raw.trim()) return null;

		const notionTable = this.buildNotionEnhancedTableBlock(raw);
		if (notionTable) {
			return notionTable;
		}

		const notionSyncedBlock = this.buildNotionEnhancedSyncedBlock(raw);
		if (notionSyncedBlock) {
			return notionSyncedBlock;
		}

		const notionColumns = this.buildNotionEnhancedColumnsBlock(raw);
		if (notionColumns) {
			return notionColumns;
		}

		const notionToggle = this.buildNotionEnhancedToggleBlock(raw);
		if (notionToggle) {
			return notionToggle;
		}

		const notionToc = this.buildNotionEnhancedTableOfContentsBlock(raw);
		if (notionToc) {
			return notionToc;
		}

		const notionMedia = this.buildNotionEnhancedMediaBlock(raw);
		if (notionMedia) {
			return notionMedia;
		}

		const notionReference = this.buildNotionEnhancedReferenceBlock(raw);
		if (notionReference) {
			return notionReference;
		}

		const notionMeetingNotes = this.buildNotionEnhancedMeetingNotesBlock(raw);
		if (notionMeetingNotes) {
			return notionMeetingNotes;
		}

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

		// Attributes that typically hold URLs and should be resolved
		const URL_ATTRIBUTES = new Set([
			"href",
			"src",
			"poster",
			"data",
			"cite",
			"action",
			"formaction",
		]);

		const serializeAttr = (attr: any): string => {
			if (!attr || attr.type !== "mdxJsxAttribute") return "";
			if (!attr.name) return "";
			if (attr.value === null || typeof attr.value === "undefined") return attr.name;
			if (typeof attr.value === "string") {
				const resolved = URL_ATTRIBUTES.has(attr.name.toLowerCase())
					? this.resolveAssetUrl(attr.value)
					: attr.value;
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
