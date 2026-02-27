> ⚠️ **Important Upgrade Notice – Version 2.0.0**
>
> Upgrading to **v2.0.0** requires changes to your `constants-config` file:
>
> - The configuration format has been updated to **JSON5**.
> - You **must migrate or update** your existing `constants-config` to the new `.json5` format.
> - Failing to do so may **break your setup or runtime behavior**.
>
> **Do not upgrade to v2.0.0** unless you are prepared to handle this change.

<div align="center">
  <img alt="Webtrotion Cat" src="https://github.com/nerdymomocat-templates/webtrotion-astro-notion-cms-website-blog/assets/125716950/b8206c1e-7c27-46d5-b192-850699117c8b" width="70" />
</div>
<h1 align="center">
  Webtrotion
</h1>

> [!NOTE]
> Read this page on the [rendered website](https://nerdymomocat.github.io/posts/introducing-webtrotion/) to see how it looks and what setup entails. That version is updated more frequently, but you can also check the [Demo](#demo) for source → render mapping. For supported blocks, see [here](https://nerdymomocat.github.io/posts/supported-blocks-in-webtrotion/).

Webtrotion is an easy-to-install, highly-configurable starter built with [Astro](https://astro.build/) and [Notion](notion://www.notion.so/), perfect for a blog or a full website.

Most Notion-based builders force you to use a custom or third-party domain (like Vercel), paid tools, or split your content between Notion and the repo—and they're not easily configurable (like [super.so](http://super.so) or scattered code edits). I wanted a free, fully static GitHub site, with both pages and blog posts in Notion, so I built **Webtrotion**.

Acknowledgments: Thanks to [Astro Cactus](https://github.com/chrismwilliams/astro-theme-cactus), [notion-astro-blog](https://github.com/otoyo/astro-notion-blog), and [this Fiverr creator](https://www.fiverr.com/franklinshera?source=inbox).

---

# Key Features

- Astro v5 and Tailwind v4
- **Integrates with Notion to create a website and not just a blog**
- **Single file configuration**
- TailwindCSS Utility classes **with Notion Color Matching for everything.**
- Accessible, semantic HTML markup
- Responsive & SEO-friendly
- System / Dark / Light mode, using Tailwind and CSS variables **that can be modified using a single config file**
- [Satori](https://github.com/vercel/satori) for creating open graph png images **that includes your featured image**
- Pagination
- Automatic RSS feed, **with content**.
- [Webmentions](https://webmention.io/)
- **Giscus and Bluesky comments**
- Auto-generated sitemap
- [Pagefind](https://pagefind.app/) static search library integration
- **Pinned Posts**
- **Shiki Transformers for Code Blocks**
- **API request output caching on Github Actions for fast build times**
- **Mini blog streams (idea copied from [Linus’s stream](https://stream.thesephist.com/))**
- **Auto-generated related content and pages that link to this page**
- **Pretty looking wikipedia like popovers on hover that works with links to any block on any page.**
- **Floating Table of Contents**
- **Footnotes and citation support**

## Demo

Check out the [Demo with Template](https://nerdymomocat-templates.github.io/webtrotion-astro-notion-cms-website-blog/), hosted on Github Pages using Github actions.

# Preview

| Device  | Light Mode                                                                                             | Dark Mode                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Desktop | ![Light Mode Desktop](https://github.com/user-attachments/assets/7c7b2633-b656-4cd6-977f-c57f799350c8) | ![Dark Mode Desktop](https://github.com/user-attachments/assets/9dbdba46-4f87-4496-8e86-053e3a0171a0) |
| Mobile  | ![Light Mode Mobile](https://github.com/user-attachments/assets/b6324270-eb43-48f2-a407-65db92d98d4e)  | ![Dark Mode Mobile](https://github.com/user-attachments/assets/4bb660f4-27c0-46f0-875e-6c43889ed94f)  |

## Optional: OAuth token flow for markdown endpoints

The Notion Markdown Content API requires a **public integration token**. This repo now supports two auth paths:

1. **Direct integration token (existing):** set `NOTION_API_SECRET` in GitHub secrets.
2. **Public integration OAuth token (optional):** set `NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API` in GitHub secrets.

Runtime behavior:

- Markdown retrieval is attempted **first** only when `NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API` is set.
- If markdown fails/unsupported, the build falls back to block API using `NOTION_API_SECRET` (or `NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API` if direct secret is not set).

### Static helper page

- Hosted helper: `https://nerdymomocat.github.io/tools/webtrotion-oauth-token-generator.html`
- Use it to start OAuth against your Worker and copy `NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API` into GitHub Secret `NOTION_OAUTH_TOKEN_FOR_MARKDOWN_API`.

# License

MIT

If you end up using webtrotion, please consider buying me a coffee here:

[Support Nerdy Momo Cat on Ko-fi! ❤️. ko-fi.com/nerdymomocat](https://ko-fi.com/nerdymomocat)
