import "@pagefind/component-ui";
// Keep the Pagefind popup CSS (~7KB gzipped) off the render-blocking critical path.
// A plain `import ".../css"` gets hoisted by Astro into a render-blocking <link> in
// every page's <head>, even though this module is only dynamically imported on search
// intent. Importing with `?url` instead yields just the hashed asset URL (no CSS is
// registered on the page's module graph), and we inject the stylesheet at runtime when
// the search chunk actually loads. Prefetch fires on hover/focus, so styles are ready
// before the modal opens.
import pagefindComponentCssUrl from "@pagefind/component-ui/css?url";
import { getInstanceManager } from "@pagefind/component-ui";
import type {
	FilterSelection,
	PagefindRawResult,
	PagefindResultData,
	PagefindSearchResult,
	PagefindSubResult,
} from "@pagefind/component-ui";
import { getSvgIcon } from "@/utils/style-helpers";

const SEARCH_INSTANCE = "webtrotion-search";

// Inject the Pagefind component-ui stylesheet on demand (this module is only imported
// on search intent) and expose a promise that resolves once it has actually applied.
// The search UI waits on this before revealing the modal, so the popup never flashes
// unstyled on first open — even for keyboard/touch users who never hover to prefetch.
// The stylesheet is HTTP-cached after the first load, so on later pages (MPA re-inits
// on each navigation) the `load` event fires from cache almost instantly.
export const stylesReady: Promise<void> = injectPagefindStyles();

function injectPagefindStyles(): Promise<void> {
	if (typeof document === "undefined") return Promise.resolve();
	const existing = document.getElementById("pagefind-component-ui-css") as HTMLLinkElement | null;
	if (existing) {
		// Already present (and, in practice, already applied) — nothing to wait for.
		return existing.sheet ? Promise.resolve() : linkLoaded(existing);
	}
	const link = document.createElement("link");
	link.id = "pagefind-component-ui-css";
	link.rel = "stylesheet";
	link.href = pagefindComponentCssUrl;
	const ready = linkLoaded(link);
	document.head.appendChild(link);
	return ready;
}

function linkLoaded(link: HTMLLinkElement): Promise<void> {
	return new Promise((resolve) => {
		// Resolve on error too, so a failed stylesheet never hangs the modal open.
		link.addEventListener("load", () => resolve(), { once: true });
		link.addEventListener("error", () => resolve(), { once: true });
	});
}

interface GotoEntry {
	t: string;
	u: string;
	k?: string;
	e?: string;
	ie?: string;
	im?: string;
}

export interface SearchRuntime {
	open(): void;
	openFromUrl(): void;
}

// A go-to link is only reachable by arrow-key navigation when it isn't tucked
// inside a collapsed section; keyboard traversal must skip over hidden links.
const isNavigableLink = (link: HTMLElement | null | undefined): boolean =>
	!!link && !link.closest("details.webtrotion-search-goto-section:not([open])");

class WebtrotionSearchNavigation extends HTMLElement {
	private links: Array<{
		href: string;
		label: string;
		iconEmoji: string;
		iconImage: string;
	}> = [];
	private pinnedPost: {
		title: string;
		url: string;
		collection: string;
		excerpt: string;
		iconEmoji: string;
		iconImage: string;
	} | null = null;
	private eventRoot: Element | null = null;
	private gotoIndexUrl = "";
	private gotoIndex: GotoEntry[] | null = null;
	private gotoLoading = false;
	// Which go-to sections the user has collapsed, keyed by section label. Kept on
	// the element so the choice survives the full re-render on every keystroke.
	private gotoCollapsed = new Set<string>();
	private onInput = (event: Event) => {
		const input = event.target;
		if (input instanceof HTMLInputElement && input.matches(".pf-input")) {
			this.render(input.value);
		}
	};

	connectedCallback() {
		this.links = Array.from(
			document.querySelectorAll<HTMLAnchorElement>("#navigation-menu a[href]"),
		)
			.map((link) => ({
				href: link.href,
				label: link.textContent?.trim() || "",
				iconEmoji: link.dataset.pageIconEmoji || "",
				iconImage: link.dataset.pageIconImage || "",
			}))
			.filter((link) => link.label);
		const title = this.dataset.pinnedTitle || "";
		const url = this.dataset.pinnedUrl || "";
		this.pinnedPost =
			title && url
				? {
						title,
						url,
						collection: this.dataset.pinnedCollection || "",
						excerpt: this.dataset.pinnedExcerpt || "",
						iconEmoji: this.dataset.pinnedIconEmoji || "",
						iconImage: this.dataset.pinnedIconImage || "",
					}
				: null;
		this.eventRoot = this.closest("site-search") || this.parentElement;
		this.gotoIndexUrl = this.dataset.gotoIndexUrl || "";
		this.eventRoot?.addEventListener("input", this.onInput);
		const instance = getInstanceManager().getInstance(SEARCH_INSTANCE);
		instance.on(
			"results",
			() => {
				const input = this.eventRoot?.querySelector<HTMLInputElement>(".pf-input");
				this.render(input?.value || "");
			},
			this,
		);
		this.render("");
	}

	disconnectedCallback() {
		this.eventRoot?.removeEventListener("input", this.onInput);
	}

	private render(query: string) {
		const raw = query ?? "";
		const shell = this.closest<HTMLElement>(".webtrotion-search-shell");
		// A leading "/" switches the popup into path/title "go to page" mode, which
		// is resolved entirely client-side against a static index — Pagefind's
		// content search is never involved (and its surface is hidden via CSS).
		if (raw.trimStart().startsWith("/")) {
			shell?.setAttribute("data-goto-mode", "");
			shell?.removeAttribute("data-idle-mode");
			shell?.removeAttribute("data-filter-browse-mode");
			this.renderGoto(raw.trimStart().slice(1));
			return;
		}
		shell?.removeAttribute("data-goto-mode");

		const normalizedQuery = query.trim().toLocaleLowerCase();
		const instance = getInstanceManager().getInstance(SEARCH_INSTANCE);
		const hasFilters = Object.values(instance.searchFilters || {}).some((values) => values.length);
		const hasQuery = Boolean(normalizedQuery);
		shell?.toggleAttribute("data-idle-mode", !hasQuery && !hasFilters);
		shell?.toggleAttribute("data-filter-browse-mode", !hasQuery && hasFilters);
		const matches = this.links.filter((link) =>
			normalizedQuery ? link.label.toLocaleLowerCase().includes(normalizedQuery) : true,
		);
		this.hidden = hasFilters || !matches.length;
		this.replaceChildren();
		if (hasFilters || !matches.length) return;

		const label = document.createElement("p");
		label.className = "webtrotion-search-navigation-label";
		label.textContent = "Navigate";
		const list = document.createElement("ul");
		list.className = "webtrotion-search-navigation-list";
		for (const item of matches) {
			const listItem = document.createElement("li");
			const link = document.createElement("a");
			link.className = "webtrotion-search-navigation-link";
			link.href = item.href;
			const icon = document.createElement("span");
			icon.className = "webtrotion-search-navigation-icon";
			icon.setAttribute("aria-hidden", "true");
			if (item.iconEmoji) {
				icon.textContent = item.iconEmoji;
			} else if (item.iconImage) {
				const img = document.createElement("img");
				img.src = item.iconImage;
				img.alt = "";
				img.loading = "lazy";
				icon.append(img);
			} else {
				icon.classList.add("is-default");
				icon.innerHTML = getSvgIcon("bookmark-outline");
			}
			const label = document.createElement("span");
			label.className = "webtrotion-search-navigation-text";
			label.textContent = item.label;
			link.append(icon, label);
			listItem.append(link);
			list.append(listItem);
		}
		this.append(label, list);

		if (!normalizedQuery && this.pinnedPost) {
			const pinned = document.createElement("section");
			pinned.className = "webtrotion-search-pinned";
			const pinnedLabel = document.createElement("p");
			pinnedLabel.className = "webtrotion-search-pinned-label";
			pinnedLabel.textContent = "Pinned";
			const pinnedLink = document.createElement("a");
			pinnedLink.className = "webtrotion-search-pinned-link";
			pinnedLink.href = this.pinnedPost.url;
			pinnedLink.dataset.pinnedTitle = this.pinnedPost.title;
			pinnedLink.dataset.pinnedExcerpt = this.pinnedPost.excerpt;
			const marker = document.createElement("span");
			marker.className = "webtrotion-search-pinned-marker";
			marker.setAttribute("aria-hidden", "true");
			marker.innerHTML =
				'<svg viewBox="0 0 24 24" focusable="false"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z" /></svg>';
			const icon = document.createElement("span");
			icon.className = "webtrotion-search-pinned-icon";
			icon.setAttribute("aria-hidden", "true");
			if (this.pinnedPost.iconEmoji) {
				icon.textContent = this.pinnedPost.iconEmoji;
			} else if (this.pinnedPost.iconImage) {
				const iconImg = document.createElement("img");
				iconImg.src = this.pinnedPost.iconImage;
				iconImg.alt = "";
				iconImg.loading = "lazy";
				icon.append(iconImg);
			} else {
				icon.innerHTML =
					'<svg viewBox="0 0 24 24" focusable="false"><path d="M6 3.75h8.4L19 8.35v11.9H6z" /><path d="M14.25 4v4.6h4.5" /><path d="M8.75 12h6.5M8.75 15h5M8.75 18h3.75" /></svg>';
			}
			const pinnedContent = document.createElement("span");
			pinnedContent.className = "webtrotion-search-pinned-content";
			const title = document.createElement("span");
			title.className = "webtrotion-search-pinned-title";
			title.textContent = this.pinnedPost.title;
			const detail = document.createElement("span");
			detail.className = "webtrotion-search-pinned-detail";
			detail.textContent = [this.pinnedPost.collection, this.pinnedPost.excerpt]
				.filter(Boolean)
				.join(" - ");
			pinnedContent.append(title);
			if (detail.textContent) pinnedContent.append(detail);
			pinnedLink.append(marker, icon, pinnedContent);
			pinned.append(pinnedLabel, pinnedLink);
			this.append(pinned);
		}
	}

	private async loadGotoIndex() {
		if (this.gotoLoading || this.gotoIndex || !this.gotoIndexUrl) return;
		this.gotoLoading = true;
		try {
			const res = await fetch(this.gotoIndexUrl, { headers: { Accept: "application/json" } });
			this.gotoIndex = res.ok ? await res.json() : [];
		} catch {
			this.gotoIndex = [];
		}
		this.gotoLoading = false;
		// Re-render with whatever the query is now — the user may have kept typing.
		const input = this.eventRoot?.querySelector<HTMLInputElement>(".pf-input");
		const value = input?.value ?? "";
		if (value.trimStart().startsWith("/")) this.render(value);
	}

	private buildGotoStatus(message: string) {
		const status = document.createElement("p");
		status.className = "webtrotion-search-navigation-empty";
		status.setAttribute("aria-live", "polite");
		status.textContent = message;
		return status;
	}

	private renderGoto(afterSlash: string) {
		this.hidden = false;
		this.replaceChildren();

		if (!this.gotoIndex) {
			this.append(this.buildGotoStatus("Loading pages…"));
			void this.loadGotoIndex();
			return;
		}

		const term = afterSlash.trim().toLocaleLowerCase();
		const scored: Array<{ item: GotoEntry; score: number }> = [];
		for (const item of this.gotoIndex) {
			const title = (item.t || "").toLocaleLowerCase();
			const url = (item.u || "").toLocaleLowerCase();
			if (!term) {
				scored.push({ item, score: 0 });
				continue;
			}
			let score = -1;
			if (title.startsWith(term)) score = 0;
			else if (title.includes(term)) score = 1;
			else if (url.includes(term)) score = 2;
			if (score >= 0) scored.push({ item, score });
		}
		scored.sort((a, b) => a.score - b.score || a.item.t.localeCompare(b.item.t));

		if (!scored.length) {
			this.append(this.buildGotoStatus("No pages match that path or title."));
			return;
		}

		// Group the flat, globally-sorted list into three collapsible sections.
		// Pages and posts share one section (they render alike); collections and
		// tags each get their own. Only sections with matches are rendered.
		const sections: Array<{ label: string; kinds: string[] }> = [
			{ label: "Pages", kinds: ["page", "post"] },
			{ label: "Collections", kinds: ["collection"] },
			{ label: "Tags", kinds: ["tag"] },
		];
		// On the bare "/" (no term) each section is capped so the panel stays
		// scannable; once the user types, the caps lift (bounded only by a global
		// ceiling that keeps the DOM light).
		const previewCap = 6;
		const globalCap = 50;
		const perSectionCap = term ? Infinity : previewCap;
		let rendered = 0;

		for (const section of sections) {
			if (rendered >= globalCap) break;
			const groupItems = scored.filter(({ item }) => section.kinds.includes(item.k || ""));
			if (!groupItems.length) continue;
			const capacity = Math.min(perSectionCap, globalCap - rendered);
			const visible = groupItems.slice(0, capacity);
			if (!visible.length) continue;

			const details = document.createElement("details");
			details.className = "webtrotion-search-goto-section";
			details.open = !this.gotoCollapsed.has(section.label);
			const sectionLabel = section.label;
			details.addEventListener("toggle", () => {
				if (details.open) this.gotoCollapsed.delete(sectionLabel);
				else this.gotoCollapsed.add(sectionLabel);
			});

			const summary = document.createElement("summary");
			summary.className = "webtrotion-search-goto-summary";
			const chevron = document.createElement("span");
			chevron.className = "webtrotion-search-goto-chevron";
			chevron.setAttribute("aria-hidden", "true");
			chevron.innerHTML = getSvgIcon("toggle-triangle");
			const heading = document.createElement("span");
			heading.className = "webtrotion-search-goto-heading";
			heading.textContent = section.label;
			summary.append(chevron, heading);

			const list = document.createElement("ul");
			list.className = "webtrotion-search-navigation-list";
			for (const { item } of visible) {
				list.append(this.buildGotoListItem(item));
			}
			details.append(summary, list);
			this.append(details);
			rendered += visible.length;
		}
	}

	private buildGotoListItem(item: GotoEntry): HTMLLIElement {
		const listItem = document.createElement("li");
		const link = document.createElement("a");
		link.className = "webtrotion-search-navigation-link is-goto";
		link.href = item.u;

		// Icon rules: pages get a generic bookmark; posts show their own Notion
		// icon when they have one; tags/collections (and iconless posts) show none.
		// Iconless rows still reserve the gutter column (empty span) so every row's
		// TEXT lines up in one left column, with icons/toggle sitting in the gutter.
		const icon = this.buildGotoIcon(item);
		if (icon) {
			link.append(icon);
		} else {
			const spacer = document.createElement("span");
			spacer.className = "webtrotion-search-navigation-icon";
			spacer.setAttribute("aria-hidden", "true");
			link.append(spacer);
		}

		const body = document.createElement("span");
		body.className = "webtrotion-search-navigation-body";
		const title = document.createElement("span");
		title.className = "webtrotion-search-navigation-text";
		title.textContent = item.t;
		body.append(title);
		if (item.e) {
			const snippet = document.createElement("span");
			snippet.className = "webtrotion-search-navigation-snippet";
			snippet.textContent = item.e;
			body.append(snippet);
		}
		link.append(body);
		listItem.append(link);
		return listItem;
	}

	private buildGotoIcon(item: GotoEntry): HTMLSpanElement | null {
		if (item.k === "page") {
			const icon = document.createElement("span");
			icon.className = "webtrotion-search-navigation-icon is-default";
			icon.setAttribute("aria-hidden", "true");
			icon.innerHTML = getSvgIcon("bookmark-outline");
			return icon;
		}
		if (item.ie) {
			const icon = document.createElement("span");
			icon.className = "webtrotion-search-navigation-icon";
			icon.setAttribute("aria-hidden", "true");
			icon.textContent = item.ie;
			return icon;
		}
		if (item.im) {
			const icon = document.createElement("span");
			icon.className = "webtrotion-search-navigation-icon";
			icon.setAttribute("aria-hidden", "true");
			const img = document.createElement("img");
			img.src = item.im;
			img.alt = "";
			img.loading = "lazy";
			icon.append(img);
			return icon;
		}
		// Tags/collections without an emoji stay iconless (blank gutter) — the
		// section header already makes the row type obvious, so a generic
		// hash/folder glyph would only add noise.
		return null;
	}
}

class WebtrotionSearchPreview extends HTMLElement {
	private instanceName = SEARCH_INSTANCE;
	private resultDataByUrl = new Map<string, PagefindResultData>();
	private latestResults: PagefindRawResult[] = [];
	private eventRoot: Element | null = null;
	private currentPreviewUrl: string | null = null;
	private selectionObserver: MutationObserver | null = null;
	private lastSelectedResultUrl: string | null = null;
	private restoreSelectedPreviewOnOpen = false;

	private syncSelectedResult = () => {
		const selected = this.eventRoot?.querySelector<HTMLAnchorElement>(
			".webtrotion-search-result-link[data-pf-selected], .webtrotion-search-subresult-link[data-pf-selected]",
		);
		if (selected?.getClientRects().length) {
			const url = selected.getAttribute("href") || "";
			this.lastSelectedResultUrl = url;
			void this.renderForUrl(url);
		}
	};

	private scheduleSelectedResultSync = () => {
		requestAnimationFrame(this.syncSelectedResult);
	};

	private previewFor(target: Element | null) {
		const link = target?.closest<HTMLAnchorElement>(
			".webtrotion-search-result-link, .webtrotion-search-subresult-link",
		);
		if (link) {
			this.renderForUrl(link.getAttribute("href") || "");
			return;
		}

		const pinnedLink = target?.closest<HTMLAnchorElement>(".webtrotion-search-pinned-link");
		if (pinnedLink) {
			this.renderPinned(pinnedLink);
			return;
		}

		if (target?.closest(".webtrotion-search-navigation-link")) {
			this.renderEmpty();
		}
	}

	private onFocusIn = (event: Event) => {
		const target = event.target as Element | null;
		// Returning focus to the query box collapses the preview so the panel does not
		// keep showing a stale result while the user edits their search.
		if (target instanceof HTMLInputElement && target.matches(".pf-input")) {
			if (this.hasAttribute("data-preview-active")) {
				this.renderEmpty(
					this.latestResults.length
						? "Select a result or matching section to preview it"
						: "No preview available",
				);
			}
			return;
		}
		this.previewFor(target);
	};

	// Hover previews are driven by pointermove rather than pointerover: when the
	// results re-render under a stationary cursor the browser emits a synthetic
	// pointerover that would auto-open a preview the user never pointed at. pointermove
	// only fires on genuine movement, so a still cursor never opens a preview.
	private onPointerMove = (event: Event) => {
		this.previewFor(event.target as Element | null);
	};

	connectedCallback() {
		if (this.hasAttribute("instance")) {
			this.instanceName = this.getAttribute("instance") || SEARCH_INSTANCE;
		}

		this.renderEmpty();
		queueMicrotask(() => {
			// The preview is a pointer-hover affordance with no purpose on touch / no-hover
			// devices, where tapping a result simply navigates. Skip wiring it up there
			// (the slot itself is hidden via a matching hover media query in the CSS).
			if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
			// Bind to the whole modal (not just the body) so focus landing on the header
			// search input is observed here and collapses the preview.
			this.eventRoot =
				this.closest("pagefind-modal") || this.closest("pagefind-modal-body") || this.parentElement;
			this.eventRoot?.addEventListener("focusin", this.onFocusIn);
			this.eventRoot?.addEventListener("pointermove", this.onPointerMove);
			if (this.eventRoot) {
				this.selectionObserver = new MutationObserver((mutations) => {
					const dialogMutation = mutations.find(
						(mutation) =>
							mutation.attributeName === "open" && mutation.target instanceof HTMLDialogElement,
					);
					if (dialogMutation?.target instanceof HTMLDialogElement) {
						if (!dialogMutation.target.open) {
							this.restoreSelectedPreviewOnOpen = Boolean(this.lastSelectedResultUrl);
						} else if (this.restoreSelectedPreviewOnOpen && this.lastSelectedResultUrl) {
							this.restoreSelectedPreviewOnOpen = false;
							requestAnimationFrame(() => void this.renderForUrl(this.lastSelectedResultUrl || ""));
						}
					}
					if (mutations.some((mutation) => mutation.attributeName === "data-pf-selected")) {
						this.scheduleSelectedResultSync();
					}
				});
				this.selectionObserver.observe(this.eventRoot, {
					attributes: true,
					attributeFilter: ["data-pf-selected", "open"],
					subtree: true,
				});
			}
		});

		const instance = getInstanceManager().getInstance(this.instanceName);
		instance.on(
			"loading",
			() => {
				this.latestResults = [];
				this.resultDataByUrl.clear();
				this.lastSelectedResultUrl = null;
				this.restoreSelectedPreviewOnOpen = false;
				this.renderLoading();
			},
			this,
		);
		instance.on(
			"results",
			(results) => {
				const searchResults = results as PagefindSearchResult;
				this.latestResults = searchResults.results || [];
				this.resultDataByUrl.clear();
				this.renderEmpty(
					this.latestResults.length
						? "Select a result or matching section to preview it"
						: "No preview available",
				);
			},
			this,
		);
	}

	disconnectedCallback() {
		this.eventRoot?.removeEventListener("focusin", this.onFocusIn);
		this.eventRoot?.removeEventListener("pointermove", this.onPointerMove);
		this.selectionObserver?.disconnect();
	}

	private normalizeUrl(url: string) {
		try {
			const parsed = new URL(url, window.location.origin);
			parsed.searchParams.delete("highlight");
			return parsed.pathname + parsed.search + parsed.hash;
		} catch {
			return url;
		}
	}

	private async renderForUrl(url: string) {
		const normalized = this.normalizeUrl(url);
		if (normalized === this.currentPreviewUrl && this.hasAttribute("data-preview-active")) return;
		this.currentPreviewUrl = normalized;
		const cached = this.resultDataByUrl.get(normalized);
		if (cached) {
			const cachedSubresult = cached.sub_results?.find(
				(sub: PagefindSubResult) => this.normalizeUrl(sub.url) === normalized,
			);
			if (cachedSubresult) {
				this.renderSubResult(cached, cachedSubresult);
				return;
			}
			this.renderResult(cached);
			return;
		}

		for (const rawResult of this.latestResults) {
			const data = await rawResult.data();
			this.cacheResult(data);
			if (this.normalizeUrl(data.meta?.url || data.url) === normalized) {
				this.renderResult(data);
				return;
			}
			const subresult = data.sub_results?.find(
				(sub: PagefindSubResult) => this.normalizeUrl(sub.url) === normalized,
			);
			if (subresult) {
				this.renderSubResult(data, subresult);
				return;
			}
		}
	}

	private cacheResult(data: PagefindResultData) {
		this.resultDataByUrl.set(this.normalizeUrl(data.meta?.url || data.url), data);
		for (const subresult of data.sub_results || []) {
			this.resultDataByUrl.set(this.normalizeUrl(subresult.url), data);
		}
	}

	private getDisplaySubResults(data: PagefindResultData, limit: number) {
		const pageUrl = this.normalizeUrl(data.meta?.url || data.url);
		const seenUrls = new Set<string>();
		const uniqueSubResults = (data.sub_results || []).filter((subresult) => {
			const url = this.normalizeUrl(subresult.url);
			if (url === pageUrl || seenUrls.has(url)) return false;
			seenUrls.add(url);
			return true;
		});
		if (uniqueSubResults.length <= limit) return uniqueSubResults;

		const topUrls = new Set(
			[...uniqueSubResults]
				.sort((a, b) => (b.locations?.length || 0) - (a.locations?.length || 0))
				.slice(0, limit)
				.map((subresult) => this.normalizeUrl(subresult.url)),
		);
		return uniqueSubResults.filter((subresult) => topUrls.has(this.normalizeUrl(subresult.url)));
	}

	private renderSectionRows(subResults: PagefindSubResult[]) {
		return subResults
			.map(
				(subresult) =>
					`<li><span>${this.escapeHtml(subresult.title || "Section")}</span>${
						subresult.excerpt ? `<p>${subresult.excerpt}</p>` : ""
					}</li>`,
			)
			.join("");
	}

	private renderEmpty(message = "Start typing to preview a result") {
		this.removeAttribute("data-preview-active");
		this.currentPreviewUrl = null;
		this.innerHTML = `<aside class="webtrotion-search-preview-card" aria-label="Search preview">
			<p class="webtrotion-search-preview-empty">${message}</p>
		</aside>`;
	}

	private renderLoading() {
		this.removeAttribute("data-preview-active");
		this.currentPreviewUrl = null;
		this.innerHTML = `<aside class="webtrotion-search-preview-card" aria-label="Search preview" aria-busy="true">
			<div class="webtrotion-search-preview-skeleton title"></div>
			<div class="webtrotion-search-preview-skeleton line"></div>
			<div class="webtrotion-search-preview-skeleton line short"></div>
		</aside>`;
	}

	private renderResult(data: PagefindResultData) {
		this.setAttribute("data-preview-active", "");
		this.dataset.previewKind = "result";
		const title = this.escapeHtml(data.meta?.title || "Untitled");
		const subResults = this.getDisplaySubResults(data, 4);

		this.innerHTML = `<aside class="webtrotion-search-preview-card" aria-label="Search preview">
			<p class="webtrotion-search-preview-kind">Page result</p>
			<h2 class="webtrotion-search-preview-title">${title}</h2>
			${
				subResults.length
					? `<ul class="webtrotion-search-preview-sections">${this.renderSectionRows(subResults)}</ul>`
					: ""
			}
		</aside>`;
	}

	private renderPinned(link: HTMLAnchorElement) {
		this.setAttribute("data-preview-active", "");
		this.dataset.previewKind = "pinned";
		this.currentPreviewUrl = this.normalizeUrl(link.getAttribute("href") || "");
		const title = this.escapeHtml(link.dataset.pinnedTitle || "Untitled");
		const excerpt = this.escapeHtml(link.dataset.pinnedExcerpt || "");
		this.innerHTML = `<aside class="webtrotion-search-preview-card" aria-label="Page preview">
			<p class="webtrotion-search-preview-kind">Pinned post</p>
			<h2 class="webtrotion-search-preview-title">${title}</h2>
			${excerpt ? `<p class="webtrotion-search-preview-excerpt">${excerpt}</p>` : ""}
		</aside>`;
	}

	private renderSubResult(data: PagefindResultData, subresult: PagefindSubResult) {
		this.setAttribute("data-preview-active", "");
		this.dataset.previewKind = "subresult";
		const title = this.escapeHtml(subresult.title || data.meta?.title || "Untitled");
		const parentTitle = this.escapeHtml(data.meta?.title || "Untitled");
		const excerpt = subresult.excerpt || data.excerpt || "";
		const selectedUrl = this.normalizeUrl(subresult.url);
		const relatedSections = this.getDisplaySubResults(data, 4).filter(
			(related) => this.normalizeUrl(related.url) !== selectedUrl,
		);

		this.innerHTML = `<aside class="webtrotion-search-preview-card" aria-label="Matching section preview">
			<p class="webtrotion-search-preview-kind">Matching section</p>
			<h2 class="webtrotion-search-preview-title">${title}</h2>
			<p class="webtrotion-search-preview-context">In ${parentTitle}</p>
			${excerpt ? `<p class="webtrotion-search-preview-excerpt">${excerpt}</p>` : ""}
			${
				relatedSections.length
					? `<p class="webtrotion-search-preview-section-label">Other matching sections</p><ul class="webtrotion-search-preview-sections webtrotion-search-preview-related-sections">${this.renderSectionRows(relatedSections)}</ul>`
					: ""
			}
		</aside>`;
	}

	private escapeHtml(value: string) {
		return value.replace(/[&<>"']/g, (char) => {
			switch (char) {
				case "&":
					return "&amp;";
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case '"':
					return "&quot;";
				case "'":
					return "&#39;";
				default:
					return char;
			}
		});
	}
}

function readUrlFilters(queryParams: URLSearchParams): FilterSelection {
	const filters: FilterSelection = {};
	const aliases: Record<string, string[]> = {
		collections: ["collections", "collection"],
		tags: ["tags", "tag"],
	};

	for (const [filter, names] of Object.entries(aliases)) {
		const values = names.flatMap((name) =>
			queryParams
				.getAll(name)
				.flatMap((value) => value.split(","))
				.map((value) => value.trim())
				.filter(Boolean),
		);
		if (values.length) filters[filter] = [...new Set(values)];
	}

	return filters;
}

function defineRuntimeElements() {
	if (!customElements.get("webtrotion-search-navigation")) {
		customElements.define("webtrotion-search-navigation", WebtrotionSearchNavigation);
	}
	if (!customElements.get("webtrotion-search-preview")) {
		customElements.define("webtrotion-search-preview", WebtrotionSearchPreview);
	}
}

function scrollIntoViewIfNeeded(target: HTMLElement) {
	const scrollContainer = target.closest<HTMLElement>(".webtrotion-search-results-pane");
	if (!scrollContainer) return;
	const targetRect = target.getBoundingClientRect();
	const containerRect = scrollContainer.getBoundingClientRect();
	if (targetRect.top < containerRect.top || targetRect.bottom > containerRect.bottom) {
		target.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
	}
}

export function createSearchRuntime(host: HTMLElement): SearchRuntime {
	defineRuntimeElements();

	const modalElement = host.querySelector("pagefind-modal") as
		(HTMLElement & { open?: () => void }) | null;
	const emptyStateElement = host.querySelector<HTMLElement>(".webtrotion-search-empty-state");

	const onModalKeydown = (event: KeyboardEvent) => {
		const target = event.target;
		if (
			event.key === "Escape" &&
			target instanceof HTMLElement &&
			target.matches(".pf-dropdown-trigger.open")
		) {
			const dropdown = target.closest("pagefind-filter-dropdown") as
				| (HTMLElement & {
						close?: () => void;
				  })
				| null;
			dropdown?.close?.();
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}

		// Clear the query (⌘/Ctrl+Backspace) without closing the modal. Handled here in
		// the capture phase so the browser's default word-delete never runs.
		if (
			(event.metaKey || event.ctrlKey) &&
			!event.altKey &&
			(event.key === "Backspace" || event.key === "Delete")
		) {
			const input = host.querySelector<HTMLInputElement>(".pf-input");
			if (input) {
				event.preventDefault();
				event.stopImmediatePropagation();
				if (input.value !== "") {
					input.value = "";
					input.dispatchEvent(new Event("input", { bubbles: true }));
				}
				input.focus({ preventScroll: true });
			}
			return;
		}

		// Cmd/Ctrl+/ always returns to the query box. A bare slash is reserved for typing
		// Go-to mode into that box, so its meaning never changes with focus.
		if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key === "/") {
			const input = host.querySelector<HTMLInputElement>(".pf-input");
			if (input && event.target !== input) {
				event.preventDefault();
				event.stopImmediatePropagation();
				input.focus({ preventScroll: true });
				const end = input.value.length;
				input.setSelectionRange?.(end, end);
				return;
			}
		}

		if (
			event.defaultPrevented ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			event.key !== "ArrowDown" ||
			!(target instanceof HTMLInputElement) ||
			!target.matches(".pf-input")
		) {
			return;
		}

		const firstLink = Array.from(
			host.querySelectorAll<HTMLAnchorElement>(
				".webtrotion-search-navigation-link, .webtrotion-search-pinned-link, .webtrotion-search-result-link",
			),
		).find(isNavigableLink);
		if (!firstLink) return;

		event.preventDefault();
		event.stopImmediatePropagation();
		firstLink.focus({ preventScroll: true });
		scrollIntoViewIfNeeded(firstLink);
	};

	const onResultsKeydown = (event: KeyboardEvent) => {
		if (
			event.defaultPrevented ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey
		) {
			return;
		}

		const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
			".webtrotion-search-navigation-link, .webtrotion-search-pinned-link, .webtrotion-search-result-link, .webtrotion-search-subresult-link",
		);
		if (!link || !modalElement?.contains(link)) return;
		if (event.key === "Enter") {
			event.preventDefault();
			event.stopImmediatePropagation();
			link.click();
			return;
		}

		const mainLinks = Array.from(
			host.querySelectorAll<HTMLAnchorElement>(".webtrotion-search-result-link"),
		).filter((link) => link.getClientRects().length > 0);
		const navigationLinks = Array.from(
			host.querySelectorAll<HTMLAnchorElement>(
				".webtrotion-search-navigation-link, .webtrotion-search-pinned-link",
			),
		).filter(isNavigableLink);
		const navigationIndex = navigationLinks.indexOf(link);
		let destination: HTMLAnchorElement | undefined;

		if (navigationIndex !== -1) {
			if (event.key === "ArrowDown")
				destination = navigationLinks[navigationIndex + 1] || mainLinks[0];
			if (event.key === "ArrowUp") {
				destination = navigationLinks[navigationIndex - 1];
				if (!destination) {
					const input = host.querySelector<HTMLInputElement>(".pf-input");
					if (!input) return;
					event.preventDefault();
					input.focus({ preventScroll: true });
					return;
				}
			}
			if (!destination) return;
			event.preventDefault();
			event.stopImmediatePropagation();
			destination.focus({ preventScroll: true });
			scrollIntoViewIfNeeded(destination);
			return;
		}

		const result = link.closest<HTMLElement>(".webtrotion-search-result");
		if (!result) return;
		const mainLink = result.querySelector<HTMLAnchorElement>(".webtrotion-search-result-link");
		if (!mainLink) return;

		const resultIndex = mainLinks.indexOf(mainLink);
		const subLinks = Array.from(
			result.querySelectorAll<HTMLAnchorElement>(".webtrotion-search-subresult-link"),
		);
		const subIndex = subLinks.indexOf(link);
		const isSubResult = subIndex !== -1;
		if (!isSubResult) {
			// Up/Down stay on the main-result axis and skip over sections entirely.
			if (event.key === "ArrowDown") destination = mainLinks[resultIndex + 1];
			if (event.key === "ArrowUp")
				destination = mainLinks[resultIndex - 1] || navigationLinks.at(-1);
			// Right steps into this result's sections.
			if (event.key === "ArrowRight") destination = subLinks[0];
		} else {
			// Within sections, Left/Right move between them; Left off the first returns to
			// the main result. Up/Down leave sections and continue on the main-result axis.
			if (event.key === "ArrowRight") destination = subLinks[subIndex + 1];
			if (event.key === "ArrowLeft") destination = subLinks[subIndex - 1] || mainLink;
			if (event.key === "ArrowDown") destination = mainLinks[resultIndex + 1];
			if (event.key === "ArrowUp") destination = mainLink;
		}

		if (!destination && event.key === "ArrowUp" && !isSubResult) {
			const input = host.querySelector<HTMLInputElement>(".pf-input");
			if (!input) return;
			event.preventDefault();
			input.focus({ preventScroll: true });
			return;
		}

		if (!destination) return;

		event.preventDefault();
		event.stopImmediatePropagation();
		destination.focus({ preventScroll: true });
		const scrollTarget =
			destination.closest<HTMLElement>(".webtrotion-search-subresults li") ||
			destination.closest<HTMLElement>(".webtrotion-search-result") ||
			destination;
		scrollIntoViewIfNeeded(scrollTarget);
	};

	modalElement?.addEventListener("keydown", onModalKeydown, true);
	modalElement?.addEventListener("keydown", onResultsKeydown, true);

	const instance = getInstanceManager().getInstance(SEARCH_INSTANCE);
	instance.on(
		"loading",
		() => {
			if (emptyStateElement) emptyStateElement.hidden = true;
		},
		host,
	);
	instance.on(
		"results",
		(results) => {
			const searchResults = results as PagefindSearchResult;
			const hasQuery = Boolean(instance.searchTerm?.trim());
			const hasFilters = Object.values(instance.searchFilters || {}).some(
				(values) => values.length,
			);
			if (emptyStateElement) {
				emptyStateElement.hidden =
					Boolean(searchResults.results?.length) || !(hasQuery || hasFilters);
			}
		},
		host,
	);

	const openModal = () => {
		if (customElements.get("pagefind-modal")) {
			modalElement?.open?.();
			return;
		}
		customElements.whenDefined("pagefind-modal").then(() => modalElement?.open?.());
	};

	return {
		open: openModal,
		openFromUrl: () => {
			const queryParams = new URLSearchParams(window.location.search);
			const searchTerm = queryParams.get("q") || "";
			const searchFilters = readUrlFilters(queryParams);
			const run = () => {
				modalElement?.open?.();
				const input = host.querySelector<HTMLInputElement>(".pf-input");
				if (input) input.value = searchTerm;
				instance.triggerSearchWithFilters(searchTerm, searchFilters);
			};
			if (customElements.get("pagefind-modal")) {
				run();
				return;
			}
			customElements.whenDefined("pagefind-modal").then(run);
		},
	};
}
