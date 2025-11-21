import type { DatabaseProperties } from "./notion/responses";

/* eslint-disable prettier/prettier */
export interface Database {
	Title: string;
	Description: string;
	Icon: FileObject | Emoji | null;
	Cover: FileObject | null;
	propertiesRaw: DatabaseProperties;
	LastUpdatedTimeStamp: Date;
}

export interface Post {
	PageId: string;
	Title: string;
	Collection: string;
	Icon: FileObject | Emoji | null;
	Cover: FileObject | null;
	Slug: string;
	Date: string;
	Tags: SelectProperty[];
	Excerpt: string;
	FeaturedImage: FileObject | null;
	Rank: number;
	LastUpdatedDate: string;
	LastUpdatedTimeStamp: Date;
	Pinned: boolean;
	BlueSkyPostLink: string | "";
	IsExternal: boolean;
	ExternalUrl: string | null;
	ExternalContent?: ExternalContentDescriptor | null;
}

export type ExternalContentType = "html" | "markdown" | "mdx";

export interface ExternalContentDescriptor {
	type: ExternalContentType;
	sourceId: string;
	folderName: string;
}

export interface Block {
	Id: string;
	Type: BlockTypes;
	HasChildren: boolean;
	LastUpdatedTimeStamp: Date;

	Paragraph?: Paragraph;
	Heading1?: Heading1;
	Heading2?: Heading2;
	Heading3?: Heading3;
	BulletedListItem?: BulletedListItem;
	NumberedListItem?: NumberedListItem;
	ToDo?: ToDo;
	NImage?: NImage;
	NAudio?: NAudio;
	File?: File;
	Code?: Code;
	MdxSnippet?: {
		PageId: string;
		BlockId: string;
		Slug: string;
	};
	Quote?: Quote;
	Equation?: Equation;
	Callout?: Callout;
	SyncedBlock?: SyncedBlock;
	Toggle?: Toggle;
	Embed?: Embed;
	Video?: Video;
	Bookmark?: Bookmark;
	LinkPreview?: LinkPreview;
	Table?: Table;
	ColumnList?: ColumnList;
	TableOfContents?: TableOfContents;
	LinkToPage?: LinkToPage;

	// Footnotes (populated by extractFootnotes during build)
	Footnotes?: Footnote[];
	// Citations (populated by extractCitations during build)
	Citations?: Citation[];
}

export interface InterlinkedContentInPage {
	block: Block;
	other_pages: RichText[];
	external_hrefs: RichText[];
	same_page: RichText[];
	direct_media_link: string | null;
	link_to_pageid: string | null;
	direct_nonmedia_link: string | null;
}

export interface Paragraph {
	RichTexts: RichText[];
	Color: string;
	Children?: Block[];
}

export interface Heading1 {
	RichTexts: RichText[];
	Color: string;
	IsToggleable: boolean;
	Children?: Block[];
}

export interface Heading2 {
	RichTexts: RichText[];
	Color: string;
	IsToggleable: boolean;
	Children?: Block[];
}

export interface Heading3 {
	RichTexts: RichText[];
	Color: string;
	IsToggleable: boolean;
	Children?: Block[];
}

export interface BulletedListItem {
	RichTexts: RichText[];
	Color: string;
	Children?: Block[];
}

export interface NumberedListItem {
	RichTexts: RichText[];
	Color: string;
	Children?: Block[];
}

export interface ToDo {
	RichTexts: RichText[];
	Checked: boolean;
	Color: string;
	Children?: Block[];
}

export interface NImage {
	Caption: RichText[];
	Type: string;
	File?: FileObject;
	External?: External;
	Width?: number;
	Height?: number;
}

export interface Video {
	Caption: RichText[];
	Type: string;
	External?: External;
	File?: FileObject;
	Width?: number;
	Height?: number;
	Size?: number;
}

export interface NAudio {
	Caption: RichText[];
	Type: string;
	External?: External;
	File?: FileObject;
}

export interface File {
	Caption: RichText[];
	Type: string;
	File?: FileObject;
	External?: External;
}

export interface FileObject {
	Type: string;
	Url: string;
	ExpiryTime?: string;
	Size?: number;
}

export interface External {
	Url: string;
}

export interface Code {
	Caption: RichText[];
	RichTexts: RichText[];
	Language: string;
}

export interface Quote {
	RichTexts: RichText[];
	Color: string;
	Children?: Block[];
}

export interface Equation {
	Expression: string;
}

export interface Callout {
	RichTexts: RichText[];
	Icon: FileObject | Emoji | null;
	Color: string;
	Children?: Block[];
}

export interface SyncedBlock {
	SyncedFrom: SyncedFrom | null;
	Children?: Block[];
}

export interface SyncedFrom {
	BlockId: string;
}

export interface Toggle {
	RichTexts: RichText[];
	Color: string;
	Children: Block[];
}

export interface Embed {
	Caption: RichText[];
	Url: string;
}

export interface Bookmark {
	Caption: RichText[];
	Url: string;
}

export interface LinkPreview {
	Caption: RichText[];
	Url: string;
}

export interface Table {
	TableWidth: number;
	HasColumnHeader: boolean;
	HasRowHeader: boolean;
	Rows: TableRow[];
}

export interface TableRow {
	Id: string;
	Type: string;
	HasChildren: boolean;
	Cells: TableCell[];
}

export interface TableCell {
	RichTexts: RichText[];
}

export interface ColumnList {
	Columns: Column[];
}

export interface Column {
	Id: string;
	Type: string;
	HasChildren: boolean;
	Children: Block[];
}

export interface List {
	Type: string;
	ListItems: Block[];
}

export interface TableOfContents {
	Color: string;
}

export interface RichText {
	Text?: Text;
	Annotation: Annotation;
	PlainText: string;
	Href?: string;
	Equation?: Equation;
	Mention?: Mention;
	InternalHref?: InterlinkedContent;

	// Footnote marker (set by extractFootnotes during build)
	FootnoteRef?: string; // e.g., "ft_a" (without [^] wrapper)
	IsFootnoteMarker?: boolean;

	// Citation marker (set by extractCitations during build)
	CitationRef?: string; // e.g., "smith2020" (citation key)
	IsCitationMarker?: boolean;
}

export interface Text {
	Content: string;
	Link?: Link;
}

export interface Emoji {
	Type: string;
	Emoji: string;
}

export interface Annotation {
	Bold: boolean;
	Italic: boolean;
	Strikethrough: boolean;
	Underline: boolean;
	Code: boolean;
	Color: string;
}

export interface Link {
	Url: string;
}

export interface SelectProperty {
	id: string;
	name: string;
	color: string;
	description: string;
}

export interface LinkToPage {
	Type: string;
	PageId: string;
}

export interface Mention {
	Type: string;
	Page?: InterlinkedContent;
	DateStr?: string;
	LinkMention?: LinkMention | undefined;
	CustomEmoji?: CustomEmojiMention | undefined;
}

export interface LinkMention {
	Href: string;
	Title: string;
	IconUrl?: string;
	Description?: string;
	LinkAuthor?: string;
	ThumbnailUrl?: string;
	Height?: number;
	IframeUrl?: string;
	LinkProvider?: string;
}

export interface CustomEmojiMention {
	Name: string;
	Url?: string;
}

export interface InterlinkedContent {
	PageId: string;
	Type: string;
	BlockId?: string;
}

export type BlockTypes =
	| "bookmark"
	| "breadcrumb"
	| "code"
	| "bulleted_list_item"
	| "callout"
	| "child_database"
	| "child_page"
	| "column"
	| "column_list"
	| "divider"
	| "embed"
	| "equation"
	| "file"
	| "heading_1"
	| "heading_2"
	| "heading_3"
	| "image"
	| "link_preview"
	| "link_to_page"
	| "numbered_list_item"
	| "paragraph"
	| "pdf"
	| "quote"
	| "synced_block"
	| "table"
	| "table_of_contents"
	| "table_row"
	| "template"
	| "to_do"
	| "toggle"
	| "video"
	| "audio";

// ============================================================================
// Footnotes Types
// ============================================================================

/**
 * Represents a single footnote extracted from content
 */
export interface Footnote {
	Marker: string;
	FullMarker: string;
	Index?: number;
	Content: {
		Type: "rich_text" | "blocks" | "comment";
		RichTexts?: RichText[];
		Blocks?: Block[];
		CommentAttachments?: CommentAttachment[];
	};
	SourceLocation: "content" | "caption" | "table" | "comment";
	SourceBlockId?: string;
	SourceBlock?: Block;
}

/**
 * Content of a footnote - can be RichText, Blocks, or Comments
 */
export interface FootnoteContent {
	Type: "rich_text" | "blocks" | "comment";
	RichTexts?: RichText[]; // For end-of-block, inline-latex-footnote-command, and block-comments
	Blocks?: Block[]; // For start-of-child-blocks
	CommentAttachments?: CommentAttachment[]; // For images in comments
}

/**
 * Attachment from Notion Comments API
 */
export interface CommentAttachment {
	Category: string;
	Url: string;
	Name?: string;
	ExpiryTime: string;
}

/**
 * Information about where a footnote marker was found
 */
export interface FootnoteMarkerInfo {
	Marker: string; // e.g., "ft_a"
	FullMarker: string; // e.g., "[^ft_a]"
	Location: {
		BlockProperty: string; // e.g., 'Paragraph.RichTexts' or 'NImage.Caption'
		RichTextIndex: number;
		CharStart: number;
		CharEnd: number;
	};
}

/**
 * Configuration for footnotes system
 */
export interface FootnotesConfig {
	"sitewide-footnotes-page-slug": string; // Legacy system slug
	"in-page-footnotes-settings": {
		enabled: boolean;
		source: {
			"end-of-block": boolean;
			"start-of-child-blocks": boolean;
			"block-comments": boolean;
			"block-inline-text-comments": boolean;
			"inline-latex-footnote-command": boolean;
		};
		"marker-prefix": string; // e.g., "ft_" → markers like [^ft_a]
		"generate-footnotes-section": boolean; // Collated list at page end
		"show-in-margin-on-large-screens": boolean; // Responsive: margin on large screens (≥1024px), popover on mobile
	};
}

/**
 * Result from extracting footnotes from a block
 */
export interface FootnoteExtractionResult {
	footnotes: Footnote[];
	hasProcessedRichTexts: boolean;
	hasProcessedChildren: boolean;
}

/**
 * Location of RichText array within a block
 */
export interface RichTextLocation {
	property: string; // e.g., "Paragraph.RichTexts", "NImage.Caption"
	richTexts: RichText[];
	setter: (newRichTexts: RichText[]) => void;
}

// ============================================================================
// Citations Types
// ============================================================================

/**
 * Represents a single citation extracted from content
 */
export interface Citation {
	Key: string; // e.g., "smith2020"
	Index?: number; // Sequential index for IEEE style (1, 2, 3...)
	FormattedEntry: string; // HTML formatted bibliography entry (dynamically selected based on style)
	Authors: string; // "Smith et al." or "Smith, J."
	Year: string; // "2020"
	Url?: string; // URL to the cited work
	SourceBlockIds: string[]; // ARRAY of all block IDs where this key appears
	SourceBlocks?: Block[]; // ARRAY of actual Block objects where this key appears (like interlinked content)
	FirstAppearanceIndex?: number; // Order of first occurrence in document
	FirstAppearanceInMainContentIndex?: number; // Sequential index for first appearance in main content specifically (ignoring footnote content)
	IsInFootnoteContent?: boolean; // True if citation appears in footnote content
}

/**
 * Parsed and formatted citation entry stored in cache
 * This is the minimal data we need for each citation
 */
export interface ParsedCitationEntry {
	key: string; // Citation key (e.g., "smith2020")
	authors: string; // Formatted authors string
	year: string; // Publication year
	url?: string; // URL to the citation source
	ieee_formatted: string; // HTML formatted entry in IEEE style
	apa_formatted: string; // HTML formatted entry in APA style
}

/**
 * Configuration for citations system
 */
export interface CitationsConfig {
	"add-cite-this-post-section": boolean;
	"extract-and-process-bibtex-citations": {
		enabled: boolean;
		"bibtex-file-url-list": string[];
		"in-text-citation-format": string; // "[@key]", "\cite{key}", or "#cite(key)"
		"bibliography-format": {
			"simplified-ieee": boolean;
			apa: boolean;
		};
		"generate-bibliography-section": boolean;
		"show-in-margin-on-large-screens": boolean;
	};
}

/**
 * Information about a BibTeX source URL
 */
export interface BibSourceInfo {
	source: "github-gist" | "github-repo" | "dropbox" | "google-drive" | "unknown";
	download_url: string;
	updated_url: string | null; // null if no public timestamp available
	updated_instructions: string | null;
}

/**
 * Result from extracting citations from a block
 */
export interface CitationExtractionResult {
	citations: Citation[];
	processedRichTexts: boolean;
}
