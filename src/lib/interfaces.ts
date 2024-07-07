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
}

export interface ReferencesInPage {
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
	OptimizedUrl?: string;
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
	InternalHref?: Reference;
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
	Page?: Reference;
	DateStr?: string;
}

export interface Reference {
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
