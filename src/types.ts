import type { FileObject, Emoji } from "./lib/interfaces";

export type SocialLink = {
	name: string;
	friendlyName: string;
	link: string;
	isWebmention?: boolean;
};

export type SiteConfig = {
	author: string;
	title: string;
	description: string;
	lang: string;
	ogLocale: string;
	date: {
		locale: string | string[] | undefined;
		options: Intl.DateTimeFormatOptions;
	};
	homePageSlug: string;
	webmentions?: {
		link: string;
		pingback?: string;
	};
	logo?: FileObject | Emoji | null;
};

export type PaginationLink = {
	url: string;
	text?: string;
	srLabel?: string;
};

export type SiteMeta = {
	title: string;
	description?: string;
	ogImage?: string | undefined;
	articleDate?: string | undefined;
};

/** Webmentions */
export type WebmentionsFeed = {
	type: string;
	name: string;
	children: WebmentionsChildren[];
};

export type WebmentionsCache = {
	lastFetched: string | null;
	children: WebmentionsChildren[];
};

export type WebmentionsChildren = {
	type: string;
	author: Author | null;
	url: string;
	published?: string | null;
	"wm-received": string;
	"wm-id": number;
	"wm-source": string;
	"wm-target": string;
	"wm-protocol": string;
	syndication?: string[] | null;
	content?: Content | null;
	"mention-of": string;
	"wm-property": string;
	"wm-private": boolean;
	rels?: Rels | null;
	name?: string | null;
	photo?: string[] | null;
	summary?: Summary | null;
};

export type Author = {
	type: string;
	name: string;
	photo: string;
	url: string;
};

export type Content = {
	"content-type": string;
	value: string;
	html: string;
	text: string;
};

export type Rels = {
	canonical: string;
};

export type Summary = {
	"content-type": string;
	value: string;
};
//ADDED
export type Heading = { text: string; slug: string; depth: number };
