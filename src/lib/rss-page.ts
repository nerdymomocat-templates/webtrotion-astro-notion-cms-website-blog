export interface FeedPageItem {
	title: string;
	link: string;
	pubDate: string;
	description?: string;
	category?: string | string[];
	content?: string | undefined;
}

function escapeHtml(value: string): string {
	return String(value).replace(/[&<>"']/g, (character) => {
		const entities: Record<string, string> = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		};
		return entities[character]!;
	});
}

/** Render the same entries for the static preview and the enriched build output. */
export function renderFeedEntries(items: FeedPageItem[]): string {
	return items
		.map((item) => {
			const categories = item.category
				? Array.isArray(item.category)
					? item.category
					: [item.category]
				: [];
			return [
				'<article class="-feed-entry-wrapper"><header>',
				`<h2><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></h2>`,
				`<time>${escapeHtml(item.pubDate)}</time>`,
				categories.length
					? `<div class="categories">${categories.map((category, index) => `<span class="category">${index === 0 ? "📚" : "🏷️"} ${escapeHtml(category)}</span>`).join("")}</div>`
					: "",
				"</header>",
				`<div class="-feed-entry-content">${item.content || escapeHtml(item.description || "")}</div>`,
				"</article>",
			].join("");
		})
		.join("");
}
