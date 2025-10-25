# almost everything works

**Hash:** a8b7a49 | **Author:** Mimansa Jaiswal | **Date:** 2025-10-24

## Description:

## Changes:
---
 constants-config.json                              |   19 +-
 src/components/blog/FootnotesSection.astro         |  162 +++
 .../notion-blocks/BulletedListItems.astro          |    2 +-
 src/components/notion-blocks/Callout.astro         |    2 +-
 src/components/notion-blocks/Caption.astro         |    2 +-
 src/components/notion-blocks/FootnoteMarker.astro  |  175 +++
 src/components/notion-blocks/Heading1.astro        |    4 +-
 src/components/notion-blocks/Heading2.astro        |    4 +-
 src/components/notion-blocks/Heading3.astro        |    4 +-
 .../notion-blocks/NumberedListItems.astro          |    2 +-
 src/components/notion-blocks/Paragraph.astro       |    2 +-
 src/components/notion-blocks/Quote.astro           |    2 +-
 src/components/notion-blocks/RichText.astro        |  130 +-
 src/components/notion-blocks/Table.astro           |    8 +-
 src/components/notion-blocks/ToDo.astro            |    4 +-
 src/components/notion-blocks/Toggle.astro          |    4 +-
 src/constants.ts                                   |   15 +-
 src/layouts/Base.astro                             |  252 +++-
 src/lib/footnotes.ts                               | 1254 ++++++++++++++++++++
 src/lib/interfaces.ts                              |   94 ++
 src/lib/notion/client.ts                           |  107 +-
 src/pages/[...page].astro                          |   53 +-
 src/pages/posts/[slug].astro                       |   53 +-
 23 files changed, 2259 insertions(+), 95 deletions(-)

diff --git a/constants-config.json b/constants-config.json
index 28e14b9..84bbc4e 100644
--- a/constants-config.json
+++ b/constants-config.json
@@ -120,7 +120,24 @@
 	"full-preview-collections": ["Stream"],
 	"hide-underscore-slugs-in-lists": true,
 	"home-page-slug": "",
-	"all-footnotes-page-slug": "_all-footnotes",
+	"footnotes": {
+		"all-footnotes-page-slug": "_all-footnotes",
+		"in-page-footnotes-settings": {
+			"enabled": true,
+			"source": {
+				"end-of-block": false,
+				"start-of-child-blocks": true,
+				"block-comments": false,
+				"block-inline-text-comments": false
+			},
+			"marker-prefix": "ft_",
+			"generate-footnotes-section": true,
+			"intext-display": {
+				"always-popup": true,
+				"small-popup-large-margin": false
+			}
+		}
+	},
 	"og-setup": {
 		"columns": 1,
 		"excerpt": false,
diff --git a/src/components/blog/FootnotesSection.astro b/src/components/blog/FootnotesSection.astro
new file mode 100644
index 0000000..e7d8277
--- /dev/null
+++ b/src/components/blog/FootnotesSection.astro
@@ -0,0 +1,162 @@
+---
+import type { Block, Footnote } from "@/lib/interfaces";
+import NotionBlocks from "@/components/NotionBlocks.astro";
+
+export interface Props {
+	blocks: Block[];
+}
+
+const { blocks } = Astro.props;
+
+// Collect all footnotes from all blocks
+const allFootnotes: Footnote[] = [];
+blocks.forEach((block) => {
+	if (block.Footnotes && block.Footnotes.length > 0) {
+		allFootnotes.push(...block.Footnotes);
+	}
+});
+
+// Remove duplicates based on Marker (in case same footnote appears in multiple blocks)
+const uniqueFootnotes = Array.from(
+	new Map(allFootnotes.map((fn) => [fn.Marker, fn])).values()
+);
+
+// Sort by marker (alphabetically)
+uniqueFootnotes.sort((a, b) => a.Marker.localeCompare(b.Marker));
+---
+
+{
+	uniqueFootnotes.length > 0 && (
+		<section class="footnotes-section mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
+			<h2 class="text-xl font-semibold mb-4">Footnotes</h2>
+			<ol class="space-y-4 text-sm">
+				{uniqueFootnotes.map((footnote, index) => (
+					<li
+						id={`footnote-def-${footnote.Marker}`}
+						class="flex gap-2"
+					>
+						<span class="font-mono text-gray-500 dark:text-gray-400 shrink-0">
+							[{index + 1}]
+						</span>
+						<div class="footnote-content flex-1">
+							{footnote.Content.Type === "rich_text" &&
+								footnote.Content.RichTexts && (
+									<div>
+										{footnote.Content.RichTexts.map((rt) => (
+											<>
+												{rt.Text && (
+													<span
+														class={
+															(rt.Annotation.Bold
+																? "font-bold "
+																: "") +
+															(rt.Annotation.Italic ? "italic " : "") +
+															(rt.Annotation.Strikethrough
+																? "line-through "
+																: "") +
+															(rt.Annotation.Underline ? "underline " : "") +
+															(rt.Annotation.Code
+																? "font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded "
+																: "")
+														}
+														style={
+															rt.Annotation.Color &&
+															rt.Annotation.Color !== "default"
+																? `color: ${rt.Annotation.Color}`
+																: ""
+														}
+													>
+														{rt.Href ? (
+															<a
+																href={rt.Href}
+																class="text-link hover:underline"
+															>
+																{rt.Text.Content}
+															</a>
+														) : (
+															rt.Text.Content
+														)}
+													</span>
+												)}
+												{rt.Equation && (
+													<span class="inline-block">{rt.Equation.Expression}</span>
+												)}
+											</>
+										))}
+									</div>
+								)}
+							{footnote.Content.Type === "blocks" &&
+								footnote.Content.Blocks && (
+									<div class="prose prose-sm max-w-none dark:prose-invert">
+										<NotionBlocks
+											blocks={footnote.Content.Blocks}
+											renderChildren={false}
+											setId={false}
+										/>
+									</div>
+								)}
+							{footnote.Content.Type === "comment" &&
+								footnote.Content.RichTexts && (
+									<div>
+										{footnote.Content.RichTexts.map((rt) => (
+											<>
+												{rt.Text && (
+													<span
+														class={
+															(rt.Annotation.Bold
+																? "font-bold "
+																: "") +
+															(rt.Annotation.Italic ? "italic " : "") +
+															(rt.Annotation.Strikethrough
+																? "line-through "
+																: "") +
+															(rt.Annotation.Underline ? "underline " : "") +
+															(rt.Annotation.Code
+																? "font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded "
+																: "")
+														}
+														style={
+															rt.Annotation.Color &&
+															rt.Annotation.Color !== "default"
+																? `color: ${rt.Annotation.Color}`
+																: ""
+														}
+													>
+														{rt.Href ? (
+															<a
+																href={rt.Href}
+																class="text-link hover:underline"
+															>
+																{rt.Text.Content}
+															</a>
+														) : (
+															rt.Text.Content
+														)}
+													</span>
+												)}
+											</>
+										))}
+										{footnote.Content.CommentAttachments &&
+											footnote.Content.CommentAttachments.length > 0 && (
+												<div class="mt-2 space-y-1">
+													{footnote.Content.CommentAttachments.map(
+														(attachment) =>
+															attachment.Category === "image" && (
+																<img
+																	src={attachment.Url}
+																	alt=""
+																	class="max-w-full rounded"
+																/>
+															)
+													)}
+												</div>
+											)}
+									</div>
+								)}
+						</div>
+					</li>
+				))}
+			</ol>
+		</section>
+	)
+}
diff --git a/src/components/notion-blocks/BulletedListItems.astro b/src/components/notion-blocks/BulletedListItems.astro
index c8dc95c..1aefc5a 100644
--- a/src/components/notion-blocks/BulletedListItems.astro
+++ b/src/components/notion-blocks/BulletedListItems.astro
@@ -30,7 +30,7 @@ const { block, renderChildren = true, setId = true } = Astro.props;
 					id={setId ? b.Id : undefined}
 				>
 					{b.BulletedListItem.RichTexts.map((richText: interfaces.RichText) => (
-						<RichText richText={richText} blockID={b.Id} />
+						<RichText richText={richText} blockID={b.Id} block={b} />
 					))}
 					{b.HasChildren && renderChildren && (
 						<NotionBlocks
diff --git a/src/components/notion-blocks/Callout.astro b/src/components/notion-blocks/Callout.astro
index 1b64534..0de0a3d 100644
--- a/src/components/notion-blocks/Callout.astro
+++ b/src/components/notion-blocks/Callout.astro
@@ -44,7 +44,7 @@ const hasRichTexts = block.Callout && block.Callout.RichTexts && block.Callout.R
 		{
 			hasRichTexts &&
 				block.Callout.RichTexts.map((richText: interfaces.RichText) => (
-					<RichText richText={richText} blockID={block.Id} />
+					<RichText richText={richText} blockID={block.Id} block={block} />
 				))
 		}
 		{
diff --git a/src/components/notion-blocks/Caption.astro b/src/components/notion-blocks/Caption.astro
index 4b50ad7..9e85a84 100644
--- a/src/components/notion-blocks/Caption.astro
+++ b/src/components/notion-blocks/Caption.astro
@@ -16,7 +16,7 @@ const { richTexts, block, as: Tag = "div" } = Astro.props;
 	(
 		<Tag class="caption text-textColor/70 min-w-0 pt-1 text-sm">
 			{richTexts.map((richText: interfaces.RichText) => (
-				<RichText richText={richText} blockID={block.Id} />
+				<RichText richText={richText} blockID={block.Id} block={block} />
 			))}
 		</Tag>
 	)
diff --git a/src/components/notion-blocks/FootnoteMarker.astro b/src/components/notion-blocks/FootnoteMarker.astro
new file mode 100644
index 0000000..7ed1589
--- /dev/null
+++ b/src/components/notion-blocks/FootnoteMarker.astro
@@ -0,0 +1,175 @@
+---
+import type { RichText, Block, Footnote } from "@/lib/interfaces";
+import { FOOTNOTES } from "@/constants";
+import NotionBlocks from "@/components/NotionBlocks.astro";
+import RichTextComponent from "@/components/notion-blocks/RichText.astro";
+
+export interface Props {
+	richText: RichText;
+	block: Block;
+}
+
+const { richText, block } = Astro.props;
+
+// Get footnote configuration
+const config = FOOTNOTES?.["in-page-footnotes-settings"];
+const displayMode = config?.["intext-display"];
+
+// Determine display mode
+const isAlwaysPopup = displayMode?.["always-popup"] === true;
+const isMarginMode = displayMode?.["small-popup-large-margin"] === true;
+
+// Get the footnote marker reference (e.g., "ft_a")
+const footnoteRef = richText.FootnoteRef;
+
+// Find the corresponding footnote in block.Footnotes
+let footnote: Footnote | undefined = undefined;
+if (block.Footnotes && footnoteRef) {
+	footnote = block.Footnotes.find((fn) => fn.Marker === footnoteRef);
+}
+
+// Generate unique ID for this footnote marker
+const uniqueId = `footnote-${block.Id}-${footnoteRef}`;
+
+// Determine what symbol to display:
+// - Use sequential numbers if footnotes section is enabled OR margin mode is enabled
+// - Otherwise use † symbol
+const generateSection = config?.['generate-footnotes-section'];
+const displaySymbol = (generateSection || isMarginMode) && footnote?.Index ? `[${footnote.Index}]` : '[†]';
+---
+
+{/* If no footnote content found, render as muted text (broken reference) */}
+{!footnote ? (
+	<span class="footnote-marker-broken text-gray-400 dark:text-gray-600" title="Footnote content not found">
+		{richText.PlainText}
+	</span>
+) : (
+	<>
+		{/* Render footnote marker with appropriate attributes for popup or margin mode */}
+		{isAlwaysPopup ? (
+			<sup class="footnote-marker">
+				<span
+					data-footnote-id={uniqueId}
+					data-popover-target={`popover-${uniqueId}`}
+					data-popover-placement="bottom-start"
+					class="cursor-pointer text-link hover:text-link-hover transition-colors"
+					aria-label={`Show footnote ${displaySymbol}`}
+					role="button"
+					tabindex="0"
+				>
+					{displaySymbol}
+				</span>
+			</sup>
+		) : isMarginMode ? (
+			<sup class="footnote-marker">
+				<span
+					data-footnote-id={uniqueId}
+					data-margin-note={uniqueId}
+					data-popover-target={`popover-${uniqueId}`}
+					data-popover-placement="bottom-start"
+					class="cursor-pointer text-link hover:text-link-hover transition-colors"
+					aria-label={`Show footnote ${displaySymbol}`}
+					role="button"
+					tabindex="0"
+				>
+					{displaySymbol}
+				</span>
+			</sup>
+		) : (
+			<sup class="footnote-marker">
+				<span
+					data-footnote-id={uniqueId}
+					data-popover-target={`popover-${uniqueId}`}
+					data-popover-placement="bottom-start"
+					class="cursor-pointer text-link hover:text-link-hover transition-colors"
+					aria-label={`Show footnote ${displaySymbol}`}
+					role="button"
+					tabindex="0"
+				>
+					{displaySymbol}
+				</span>
+			</sup>
+		)}
+
+		<!-- Template for popover content -->
+		<template id={`template-popover-${uniqueId}`}>
+			<div
+				data-popover
+				id={`popover-${uniqueId}`}
+				role="tooltip"
+				class="popoverEl invisible absolute z-40 inline-block hidden w-md rounded-lg border border-gray-200 bg-white text-sm text-gray-500 opacity-0 shadow-xs transition-opacity duration-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
+			>
+				<div class="space-y-2 p-2">
+					{footnote.Content.Type === "rich_text" && footnote.Content.RichTexts && (
+						<div class="footnote-content">
+							{footnote.Content.RichTexts.map((rt) => (
+								<RichTextComponent richText={rt} blockID={block.Id} block={block} />
+							))}
+						</div>
+					)}
+					{footnote.Content.Type === "blocks" && footnote.Content.Blocks && (
+						<div class="footnote-content">
+							<NotionBlocks blocks={footnote.Content.Blocks} renderChildren={true} setId={false} />
+						</div>
+					)}
+					{footnote.Content.Type === "comment" && footnote.Content.RichTexts && (
+						<div class="footnote-content">
+							{footnote.Content.RichTexts.map((rt) => (
+								<RichTextComponent richText={rt} blockID={block.Id} block={block} />
+							))}
+							{footnote.Content.CommentAttachments && footnote.Content.CommentAttachments.length > 0 && (
+								<div class="mt-2 space-y-1">
+									{footnote.Content.CommentAttachments.map((attachment) => (
+										attachment.Category === "image" && (
+											<img src={attachment.Url} alt="" class="max-w-full rounded" />
+										)
+									))}
+								</div>
+							)}
+						</div>
+					)}
+				</div>
+			</div>
+		</template>
+
+		<!-- Template for margin notes content (same structure, used by margin notes script) -->
+		{isMarginMode && (
+			<template id={`template-margin-${uniqueId}`}>
+				<div class="footnote-margin-content">
+					{/* Add sequential number prefix if index exists */}
+					{footnote.Index && (
+						<strong class="footnote-margin-number">[{footnote.Index}]: </strong>
+					)}
+					{footnote.Content.Type === "rich_text" && footnote.Content.RichTexts && (
+						<span>
+							{footnote.Content.RichTexts.map((rt) => (
+								<RichTextComponent richText={rt} blockID={block.Id} block={block} />
+							))}
+						</span>
+					)}
+					{footnote.Content.Type === "blocks" && footnote.Content.Blocks && (
+						<div class="text-xs">
+							<NotionBlocks blocks={footnote.Content.Blocks} renderChildren={true} setId={false} />
+						</div>
+					)}
+					{footnote.Content.Type === "comment" && footnote.Content.RichTexts && (
+						<span>
+							{footnote.Content.RichTexts.map((rt) => (
+								<RichTextComponent richText={rt} blockID={block.Id} block={block} />
+							))}
+							{footnote.Content.CommentAttachments && footnote.Content.CommentAttachments.length > 0 && (
+								<div class="mt-2 space-y-1">
+									{footnote.Content.CommentAttachments.map((attachment) => (
+										attachment.Category === "image" && (
+											<img src={attachment.Url} alt="" class="max-w-full rounded" />
+										)
+									))}
+								</div>
+							)}
+						</span>
+					)}
+				</div>
+			</template>
+		)}
+	</>
+)}
diff --git a/src/components/notion-blocks/Heading1.astro b/src/components/notion-blocks/Heading1.astro
index 15eed3d..9ede577 100644
--- a/src/components/notion-blocks/Heading1.astro
+++ b/src/components/notion-blocks/Heading1.astro
@@ -42,7 +42,7 @@ const id = buildHeadingId(block.Heading1);
         document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth' });"
 					>
 						{block.Heading1.RichTexts.map((richText: interfaces.RichText) => (
-							<RichText richText={richText} blockID={block.Id} />
+							<RichText richText={richText} blockID={block.Id} block={block} />
 						))}
 					</h2>
 				</span>
@@ -68,7 +68,7 @@ const id = buildHeadingId(block.Heading1);
         document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth' });"
 		>
 			{block.Heading1.RichTexts.map((richText: interfaces.RichText) => (
-				<RichText richText={richText} blockID={block.Id} />
+				<RichText richText={richText} blockID={block.Id} block={block} />
 			))}
 		</h2>
 	)
diff --git a/src/components/notion-blocks/Heading2.astro b/src/components/notion-blocks/Heading2.astro
index 6f2672a..f827003 100644
--- a/src/components/notion-blocks/Heading2.astro
+++ b/src/components/notion-blocks/Heading2.astro
@@ -43,7 +43,7 @@ const id = buildHeadingId(block.Heading2);
     "
 					>
 						{block.Heading2.RichTexts.map((richText: interfaces.RichText) => (
-							<RichText richText={richText} blockID={block.Id} />
+							<RichText richText={richText} blockID={block.Id} block={block} />
 						))}
 					</h3>
 				</span>
@@ -69,7 +69,7 @@ const id = buildHeadingId(block.Heading2);
         document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth' });"
 		>
 			{block.Heading2.RichTexts.map((richText: interfaces.RichText) => (
-				<RichText richText={richText} blockID={block.Id} />
+				<RichText richText={richText} blockID={block.Id} block={block} />
 			))}
 		</h3>
 	)
diff --git a/src/components/notion-blocks/Heading3.astro b/src/components/notion-blocks/Heading3.astro
index 3f3a8eb..b0693fd 100644
--- a/src/components/notion-blocks/Heading3.astro
+++ b/src/components/notion-blocks/Heading3.astro
@@ -41,7 +41,7 @@ const id = buildHeadingId(block.Heading3);
         document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth' });"
 					>
 						{block.Heading3.RichTexts.map((richText: interfaces.RichText) => (
-							<RichText richText={richText} blockID={block.Id} />
+							<RichText richText={richText} blockID={block.Id} block={block} />
 						))}
 					</h4>
 				</span>
@@ -67,7 +67,7 @@ const id = buildHeadingId(block.Heading3);
         document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth' });"
 		>
 			{block.Heading3.RichTexts.map((richText: interfaces.RichText) => (
-				<RichText richText={richText} blockID={block.Id} />
+				<RichText richText={richText} blockID={block.Id} block={block} />
 			))}
 		</h4>
 	)
diff --git a/src/components/notion-blocks/NumberedListItems.astro b/src/components/notion-blocks/NumberedListItems.astro
index df39804..86286d2 100644
--- a/src/components/notion-blocks/NumberedListItems.astro
+++ b/src/components/notion-blocks/NumberedListItems.astro
@@ -37,7 +37,7 @@ const listTypes = ["lower-roman", "decimal", "lower-alpha"];
 						id={setId ? b.Id : undefined}
 					>
 						{b.NumberedListItem.RichTexts.map((richText: interfaces.RichText) => (
-							<RichText richText={richText} blockID={b.Id} />
+							<RichText richText={richText} blockID={b.Id} block={b} />
 						))}
 						{b.HasChildren && renderChildren && (
 							<NotionBlocks
diff --git a/src/components/notion-blocks/Paragraph.astro b/src/components/notion-blocks/Paragraph.astro
index 6f3fb73..49d7559 100644
--- a/src/components/notion-blocks/Paragraph.astro
+++ b/src/components/notion-blocks/Paragraph.astro
@@ -27,7 +27,7 @@ const Tag = hasChildren && renderChildren ? "div" : "p";
 	]}
 	id={setId ? block.Id : undefined}
 >
-	{block.Paragraph.RichTexts.map((richText) => <RichText richText={richText} blockID={block.Id} />)}
+	{block.Paragraph.RichTexts.map((richText) => <RichText richText={richText} blockID={block.Id} block={block} />)}
 	{block.Paragraph.RichTexts.length === 0 && <br />}
 	{
 		hasChildren && renderChildren && (
diff --git a/src/components/notion-blocks/Quote.astro b/src/components/notion-blocks/Quote.astro
index 663e9e9..0938c41 100644
--- a/src/components/notion-blocks/Quote.astro
+++ b/src/components/notion-blocks/Quote.astro
@@ -27,7 +27,7 @@ const { block, renderChildren = true, setId = true } = Astro.props;
 	<div class="p-1">
 		{
 			block.Quote.RichTexts.map((richText: interfaces.RichText) => (
-				<RichText richText={richText} blockID={block.Id} />
+				<RichText richText={richText} blockID={block.Id} block={block} />
 			))
 		}
 		{
diff --git a/src/components/notion-blocks/RichText.astro b/src/components/notion-blocks/RichText.astro
index 64a9e91..307914c 100644
--- a/src/components/notion-blocks/RichText.astro
+++ b/src/components/notion-blocks/RichText.astro
@@ -1,6 +1,6 @@
 ---
 import katex from "katex";
-import type { RichText } from "@/lib/interfaces.ts";
+import type { RichText, Block } from "@/lib/interfaces.ts";
 import Bold from "@/components/notion-blocks/annotations/Bold.astro";
 import Italic from "@/components/notion-blocks/annotations/Italic.astro";
 import Strikethrough from "@/components/notion-blocks/annotations/Strikethrough.astro";
@@ -12,73 +12,79 @@ import MentionPage from "@/components/notion-blocks/MentionPage.astro";
 import MentionDate from "@/components/notion-blocks/MentionDate.astro";
 import MentionLink from "@/components/notion-blocks/MentionLink.astro";
 import MentionCustomEmoji from "@/components/notion-blocks/MentionCustomEmoji.astro";
+import FootnoteMarker from "@/components/notion-blocks/FootnoteMarker.astro";
 
 export interface Props {
 	richText: RichText;
 	blockID?: string;
+	block?: Block;
 }
 
-const { richText, blockID } = Astro.props;
+const { richText, blockID, block } = Astro.props;
 ---
 
-<Anchor richText={richText} blockID={blockID}>
-	{
-		(
-			<Code richText={richText}>
-				{
-					<Color richText={richText}>
-						{
-							<Underline richText={richText}>
-								{
-									<Strikethrough richText={richText}>
-										{
-											<Italic richText={richText}>
-												{
-													<Bold richText={richText}>
-														{richText.Text &&
-															richText.Text.Content.split("\n").map(
-																(content: string, i: number) => {
-																	if (i === 0) {
-																		return content;
-																	}
-																	return (
-																		<>
-																			<br />
-																			{content}
-																		</>
-																	);
-																},
+{richText.IsFootnoteMarker && block ? (
+	<FootnoteMarker richText={richText} block={block} />
+) : (
+	<Anchor richText={richText} blockID={blockID}>
+		{
+			(
+				<Code richText={richText}>
+					{
+						<Color richText={richText}>
+							{
+								<Underline richText={richText}>
+									{
+										<Strikethrough richText={richText}>
+											{
+												<Italic richText={richText}>
+													{
+														<Bold richText={richText}>
+															{richText.Text &&
+																richText.Text.Content.split("\n").map(
+																	(content: string, i: number) => {
+																		if (i === 0) {
+																			return content;
+																		}
+																		return (
+																			<>
+																				<br />
+																				{content}
+																			</>
+																		);
+																	},
+																)}
+															{richText.Equation && (
+																<span
+																	set:html={katex.renderToString(richText.Equation.Expression, {
+																		throwOnError: false,
+																	})}
+																/>
 															)}
-														{richText.Equation && (
-															<span
-																set:html={katex.renderToString(richText.Equation.Expression, {
-																	throwOnError: false,
-																})}
-															/>
-														)}
-														{richText.Mention && richText.Mention.Page && (
-															<MentionPage pageId={richText.Mention.Page.PageId} />
-														)}
-														{richText.Mention && richText.Mention.DateStr && (
-															<MentionDate mention_date={richText.Mention.DateStr} />
-														)}
-														{richText.Mention && richText.Mention.LinkMention && (
-															<MentionLink mention={richText.Mention} />
-														)}
-														{richText.Mention && richText.Mention.CustomEmoji && (
-															<MentionCustomEmoji mention={richText.Mention} />
-														)}
-													</Bold>
-												}
-											</Italic>
-										}
-									</Strikethrough>
-								}
-							</Underline>
-						}
-					</Color>
-				}
-			</Code>
-		)
-	}
-</Anchor>
+															{richText.Mention && richText.Mention.Page && (
+																<MentionPage pageId={richText.Mention.Page.PageId} />
+															)}
+															{richText.Mention && richText.Mention.DateStr && (
+																<MentionDate mention_date={richText.Mention.DateStr} />
+															)}
+															{richText.Mention && richText.Mention.LinkMention && (
+																<MentionLink mention={richText.Mention} />
+															)}
+															{richText.Mention && richText.Mention.CustomEmoji && (
+																<MentionCustomEmoji mention={richText.Mention} />
+															)}
+														</Bold>
+													}
+												</Italic>
+											}
+										</Strikethrough>
+									}
+								</Underline>
+							}
+						</Color>
+					}
+				</Code>
+			)
+		}
+	</Anchor>
+)}
diff --git a/src/components/notion-blocks/Table.astro b/src/components/notion-blocks/Table.astro
index 8f99efb..bfba231 100644
--- a/src/components/notion-blocks/Table.astro
+++ b/src/components/notion-blocks/Table.astro
@@ -62,7 +62,7 @@ function getColumnType(cellContent: string) {
 										data-type={columnType}
 									>
 										{cell.RichTexts.map((richText: interfaces.RichText) => (
-											<RichText richText={richText} blockID={block.Id} />
+											<RichText richText={richText} blockID={block.Id} block={block} />
 										))}
 									</th>
 								);
@@ -73,7 +73,7 @@ function getColumnType(cellContent: string) {
 										class="bg-ngray-table-header-bg-light text-textColor/90 dark:bg-ngray-table-header-bg-dark/[.03] p-2 text-xs font-semibold uppercase"
 									>
 										{cell.RichTexts.map((richText: interfaces.RichText) => (
-											<RichText richText={richText} blockID={block.Id} />
+											<RichText richText={richText} blockID={block.Id} block={block} />
 										))}
 									</th>
 								);
@@ -99,7 +99,7 @@ function getColumnType(cellContent: string) {
 											class="bg-ngray-table-header-bg-light text-textColor dark:bg-ngray-table-header-bg-dark/[.03] p-2 font-semibold whitespace-nowrap"
 										>
 											{cell.RichTexts.map((richText: interfaces.RichText) => (
-												<RichText richText={richText} blockID={block.Id} />
+												<RichText richText={richText} blockID={block.Id} block={block} />
 											))}
 										</th>
 									);
@@ -107,7 +107,7 @@ function getColumnType(cellContent: string) {
 								return (
 									<td class="p-2">
 										{cell.RichTexts.map((richText: interfaces.RichText) => (
-											<RichText richText={richText} blockID={block.Id} />
+											<RichText richText={richText} blockID={block.Id} block={block} />
 										))}
 									</td>
 								);
diff --git a/src/components/notion-blocks/ToDo.astro b/src/components/notion-blocks/ToDo.astro
index 01416b3..778f801 100644
--- a/src/components/notion-blocks/ToDo.astro
+++ b/src/components/notion-blocks/ToDo.astro
@@ -48,11 +48,11 @@ const { block, renderChildren = true, setId = true } = Astro.props;
 									return (
 										<span class="line-through decoration-slate-500/50">
 											{/* Block element for the text */}
-											<RichText richText={richText} blockID={b.Id} />
+											<RichText richText={richText} blockID={b.Id} block={b} />
 										</span>
 									);
 								}
-								return <RichText richText={richText} blockID={b.Id} />;
+								return <RichText richText={richText} blockID={b.Id} block={b} />;
 							})}
 						</div>
 					</div>
diff --git a/src/components/notion-blocks/Toggle.astro b/src/components/notion-blocks/Toggle.astro
index 38202bd..0155c0a 100644
--- a/src/components/notion-blocks/Toggle.astro
+++ b/src/components/notion-blocks/Toggle.astro
@@ -41,7 +41,7 @@ const { block, renderChildren = true, setId = true } = Astro.props;
 				</div>
 				<div>
 					{block.Toggle.RichTexts.map((richText: interfaces.RichText) => (
-						<RichText richText={richText} blockID={block.Id} />
+						<RichText richText={richText} blockID={block.Id} block={block} />
 					))}
 				</div>
 			</summary>
@@ -71,7 +71,7 @@ const { block, renderChildren = true, setId = true } = Astro.props;
 			</div>
 			<div>
 				{block.Toggle.RichTexts.map((richText: interfaces.RichText) => (
-					<RichText richText={richText} blockID={block.Id} />
+					<RichText richText={richText} blockID={block.Id} block={block} />
 				))}
 			</div>
 		</div>
diff --git a/src/constants.ts b/src/constants.ts
index 472502c..09180dd 100644
--- a/src/constants.ts
+++ b/src/constants.ts
@@ -68,7 +68,20 @@ export const HIDE_UNDERSCORE_SLUGS_IN_LISTS =
 	key_value_from_json["hide-underscore-slugs-in-lists"] || false;
 
 export const HOME_PAGE_SLUG = key_value_from_json["home-page-slug"] || "home";
-export const ALL_FOOTNOTES_PAGE_SLUG = key_value_from_json["all-footnotes-page-slug"] || null;
+
+/**
+ * Footnotes configuration
+ * - "all-footnotes-page-slug": Legacy manual footnotes page (already works via NBlocksPopover)
+ * - "in-page-footnotes-settings": Automatic in-page footnotes with markers (new feature)
+ */
+export const FOOTNOTES = key_value_from_json["footnotes"] || null;
+
+// Legacy manual footnotes page slug (used by NBlocksPopover)
+export const ALL_FOOTNOTES_PAGE_SLUG = FOOTNOTES?.["all-footnotes-page-slug"] || "_all-footnotes";
+
+// Helper to check if in-page footnotes are enabled
+export const IN_PAGE_FOOTNOTES_ENABLED =
+	FOOTNOTES?.["in-page-footnotes-settings"]?.enabled === true;
 
 export const OG_SETUP = key_value_from_json["og-setup"] || {
 	columns: 1,
diff --git a/src/layouts/Base.astro b/src/layouts/Base.astro
index 9c041bd..761b248 100644
--- a/src/layouts/Base.astro
+++ b/src/layouts/Base.astro
@@ -5,7 +5,7 @@ import Header from "@/components/layout/Header.astro";
 import Footer from "@/components/layout/Footer.astro";
 import SkipLink from "@/components/SkipLink.astro";
 import { siteInfo } from "@/siteInfo";
-import { ENABLE_LIGHTBOX, REFERENCES } from "@/constants";
+import { ENABLE_LIGHTBOX, REFERENCES, FOOTNOTES } from "@/constants";
 interface Props {
 meta: SiteMeta;
 }
@@ -80,11 +80,15 @@ window.addEventListener('afterprint', function () {
   document.addEventListener('DOMContentLoaded', () => {
       // Determine if it's a mobile device
   const isSmBreakpoint = window.matchMedia('(max-width: 639px)').matches;
+  const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
 
 // Create the selector based on the device type
+// Exclude footnote markers with data-margin-note on large screens (they use margin notes instead)
 const selector = isSmBreakpoint
   ? '[data-popover-target]:not([data-popover-type-lm="true"])'
-  : '[data-popover-target]';
+  : isLargeScreen
+    ? '[data-popover-target]:not([data-margin-note])'
+    : '[data-popover-target]';
 
 // Select popover triggers based on the device-specific selector
 const popoverTriggers = document.querySelectorAll(selector);
@@ -200,10 +204,12 @@ const popoverTriggers = document.querySelectorAll(selector);
           triggerEl.parentNode.insertBefore(popoverEl, triggerEl.nextSibling);
           addPTEventListeners(triggerEl, popoverEl);
           // Add event listeners to any new popover triggers within this popover
-          const selector = isSmBreakpoint
+          const nestedSelector = isSmBreakpoint
     ? '[data-popover-target]:not([data-popover-type-lm="true"])'
-    : '[data-popover-target]';
-    const nestedTriggers = popoverEl.querySelectorAll(selector);
+    : isLargeScreen
+      ? '[data-popover-target]:not([data-margin-note])'
+      : '[data-popover-target]';
+    const nestedTriggers = popoverEl.querySelectorAll(nestedSelector);
     nestedTriggers.forEach(nestedTrigger => {
       addPTEventListeners(nestedTrigger, null);
     });
@@ -276,6 +282,242 @@ const popoverTriggers = document.querySelectorAll(selector);
 
       )
       }
+{/* Margin Notes Script (for small-popup-large-margin display mode) */}
+{FOOTNOTES && FOOTNOTES["in-page-footnotes-settings"]?.["intext-display"]?.["small-popup-large-margin"] && (
+<script type="module">
+  /**
+   * Initializes Tufte-style margin notes for footnotes
+   *
+   * LAYOUT STRATEGY:
+   * - Main already expands to 125% on large screens via lg:w-[125%]
+   * - This creates ~172px of space to the right of .post-body (708px)
+   * - Footnotes positioned absolutely relative to .post-body, overflowing into this space
+   * - No need to modify article/body widths - space already exists!
+   *
+   * BEHAVIOR:
+   * - Desktop (≥1024px): Always visible margin notes (Tufte style)
+   * - Mobile (<1024px): Falls back to Base.astro popover system
+   * - Hover marker or note: Highlights both
+   * - Overlapping notes: Automatically stacked with gaps
+   */
+  document.addEventListener('DOMContentLoaded', () => {
+    // Initialize margin notes if on large screen
+    if (window.matchMedia('(min-width: 1024px)').matches) {
+      positionMarginNotes();
+    }
+
+    // Handle window resize
+    let resizeTimeout;
+    window.addEventListener('resize', () => {
+      clearTimeout(resizeTimeout);
+      resizeTimeout = setTimeout(() => {
+        const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
+
+        if (isLargeScreen) {
+          // Switched to large screen - remove old margin notes and recreate them
+          document.querySelectorAll('.footnote-margin-note').forEach(n => n.remove());
+          positionMarginNotes();
+        } else {
+          // Switched to small screen - remove margin notes (popover system takes over)
+          document.querySelectorAll('.footnote-margin-note').forEach(n => n.remove());
+        }
+      }, 250);
+    });
+  });
+
+  function positionMarginNotes() {
+    const markers = document.querySelectorAll('[data-margin-note]');
+    const createdNotes = [];
+
+    markers.forEach((markerEl) => {
+      const footnoteId = markerEl.getAttribute('data-margin-note');
+      if (!footnoteId) return;
+
+      const template = document.getElementById(`template-margin-${footnoteId}`);
+      if (!template) return;
+
+      const postBody = markerEl.closest('.post-body');
+      if (!postBody) return;
+
+      if (getComputedStyle(postBody).position === 'static') {
+        postBody.style.position = 'relative';
+      }
+
+      const marginNote = document.createElement('aside');
+      marginNote.className = 'footnote-margin-note';
+      marginNote.dataset.noteId = footnoteId;
+
+      const content = template.content.cloneNode(true);
+      marginNote.appendChild(content);
+
+      const postBodyRect = postBody.getBoundingClientRect();
+      const markerRect = markerEl.getBoundingClientRect();
+      const topOffset = markerRect.top - postBodyRect.top + postBody.scrollTop;
+
+      marginNote.style.top = `${topOffset}px`;
+
+      postBody.appendChild(marginNote);
+      createdNotes.push(marginNote);
+
+      setupHoverHighlight(markerEl, marginNote);
+      setupClickHighlight(markerEl, marginNote);
+    });
+
+    stackOverlappingNotes(createdNotes);
+  }
+
+  function setupHoverHighlight(marker, note) {
+    marker.addEventListener('mouseenter', () => {
+      marker.classList.add('highlighted');
+      note.classList.add('highlighted');
+    });
+
+    marker.addEventListener('mouseleave', () => {
+      marker.classList.remove('highlighted');
+      note.classList.remove('highlighted');
+    });
+
+    note.addEventListener('mouseenter', () => {
+      marker.classList.add('highlighted');
+      note.classList.add('highlighted');
+    });
+
+    note.addEventListener('mouseleave', () => {
+      marker.classList.remove('highlighted');
+      note.classList.remove('highlighted');
+    });
+  }
+
+  /**
+   * Sets up click-to-highlight for margin notes
+   * Clicking a note toggles a persistent highlight class
+   */
+  function setupClickHighlight(marker, note) {
+    note.addEventListener('click', (e) => {
+      e.stopPropagation(); // Prevent event bubbling
+
+      // Remove highlight from all other notes
+      document.querySelectorAll('.footnote-margin-note').forEach(n => {
+        if (n !== note) {
+          n.classList.remove('clicked-highlight');
+        }
+      });
+
+      // Toggle highlight on clicked note
+      note.classList.toggle('clicked-highlight');
+    });
+  }
+
+  // Click outside to dismiss highlights
+  document.addEventListener('click', (e) => {
+    // If click is outside any margin note, remove all highlights
+    if (!e.target.closest('.footnote-margin-note')) {
+      document.querySelectorAll('.footnote-margin-note').forEach(note => {
+        note.classList.remove('clicked-highlight');
+      });
+    }
+  });
+
+  function stackOverlappingNotes(notes) {
+    const sortedNotes = notes.sort((a, b) => {
+      return parseInt(a.style.top || '0') - parseInt(b.style.top || '0');
+    });
+
+    for (let i = 1; i < sortedNotes.length; i++) {
+      const prevNote = sortedNotes[i - 1];
+      const currNote = sortedNotes[i];
+
+      const prevTop = parseInt(prevNote.style.top || '0');
+      const prevBottom = prevTop + prevNote.offsetHeight;
+      const currTop = parseInt(currNote.style.top || '0');
+
+      if (currTop < prevBottom + 8) {
+        currNote.style.top = `${prevBottom + 8}px`;
+      }
+    }
+  }
+</script>
+
+<style>
+  /* ===================================================================
+     Margin Notes (Tufte-style, desktop only)
+     =================================================================== */
+
+  /**
+   * LAYOUT STRATEGY:
+   * - .post-body is the positioning context (position: relative set by JS)
+   * - Main already expands to 125% (960px) via lg:w-[125%]
+   * - Content is 708px wide, leaving ~172px to the right
+   * - Notes positioned absolutely: left: 100% overflows into this space
+   * - No need to modify article/body widths!
+   */
+
+  .footnote-margin-note {
+    position: absolute;
+    left: 100%;           /* Start at right edge of .post-body (708px) */
+    margin-left: 3rem;    /* 48px gap from content (increased from 1.5rem) */
+    width: 10rem;         /* 160px */
+    font-size: 0.75rem;   /* Small text */
+    line-height: 1.5;
+    color: rgb(107 114 128); /* gray-500 */
+    opacity: 0.7;
+    transition: opacity 0.2s ease, color 0.2s ease;
+    pointer-events: auto;
+  }
+
+  .footnote-margin-note.highlighted {
+    opacity: 1;
+    color: rgb(31 41 55); /* gray-800 */
+  }
+
+  /* Clicked highlight state - more prominent than hover */
+  .footnote-margin-note.clicked-highlight {
+    opacity: 1;
+    background-color: rgb(254 243 199); /* yellow-100 */
+    border-left: 3px solid rgb(251 191 36); /* yellow-400 */
+    padding-left: 0.5rem;
+    transition: all 0.2s ease;
+  }
+
+  :global(.dark) .footnote-margin-note {
+    color: rgb(156 163 175); /* gray-400 */
+  }
+
+  :global(.dark) .footnote-margin-note.highlighted {
+    color: rgb(243 244 246); /* gray-100 */
+  }
+
+  :global(.dark) .footnote-margin-note.clicked-highlight {
+    background-color: rgb(113 63 18); /* yellow-900 */
+    border-left-color: rgb(245 158 11); /* yellow-500 */
+  }
+
+  @media (max-width: 1023px) {
+    .footnote-margin-note {
+      display: none;
+    }
+  }
+
+  @media (min-width: 1024px) {
+    .footnote-margin-note {
+      display: block;
+    }
+
+    .post-body {
+      position: relative;
+    }
+  }
+
+  .footnote-marker span.highlighted {
+    background-color: rgb(254 249 195); /* yellow-100 */
+  }
+
+  :global(.dark) .footnote-marker span.highlighted {
+    background-color: rgb(113 63 18); /* yellow-900 */
+  }
+</style>
+)}
+
 <script>
   document.addEventListener('DOMContentLoaded', function() {
     const dataTables = document.querySelectorAll('table.datatable');
diff --git a/src/lib/footnotes.ts b/src/lib/footnotes.ts
new file mode 100644
index 0000000..ffa61b0
--- /dev/null
+++ b/src/lib/footnotes.ts
@@ -0,0 +1,1254 @@
+/**
+ * Footnotes Extraction System
+ *
+ * This module contains ALL footnote extraction logic for Webtrotion.
+ * It handles:
+ * - End-of-block footnotes ([^ft_a]: content at end of RichText)
+ * - Start-of-child-blocks footnotes (child blocks as footnote content)
+ * - Block-comments footnotes (Notion comments as footnote content)
+ *
+ * Key principles:
+ * - Preserve ALL RichText formatting (bold, italic, colors, etc.)
+ * - Process at BUILD-TIME only (in client.ts)
+ * - Components have ZERO logic, only render pre-processed data
+ */
+
+import type {
+	Block,
+	RichText,
+	Footnote,
+	FootnoteContent,
+	FootnotesConfig,
+	FootnoteExtractionResult,
+	FootnoteMarkerInfo,
+	RichTextLocation,
+	Mention,
+	Reference,
+} from "./interfaces";
+import { downloadFile, isConvImageType } from "./notion/client";
+import { buildTimeFilePath } from "./blog-helpers";
+import { OPTIMIZE_IMAGES } from "../constants";
+
+// ============================================================================
+// Configuration and Validation
+// ============================================================================
+
+/**
+ * Default configuration for footnotes
+ */
+export const DEFAULT_FOOTNOTES_CONFIG: FootnotesConfig = {
+	allFootnotesPageSlug: "_all-footnotes",
+	pageSettings: {
+		enabled: false,
+		source: {
+			"end-of-block": true,
+			"start-of-child-blocks": false,
+			"block-comments": false,
+		},
+		markerPrefix: "ft_",
+		generateFootnotesSection: false,
+		intextDisplay: {
+			alwaysPopup: true,
+			smallPopupLargeMargin: false,
+		},
+	},
+};
+
+/**
+ * Normalizes footnotes configuration from constants-config.json
+ */
+export function normalizeFootnotesConfig(rawConfig: any): FootnotesConfig {
+	if (!rawConfig || typeof rawConfig !== "object") {
+		return DEFAULT_FOOTNOTES_CONFIG;
+	}
+
+	const inPageSettings = rawConfig["in-page-footnotes-settings"] || {};
+
+	// Handle block-inline-text-comments: treat as block-comments (forward-looking feature)
+	// If block-inline-text-comments is enabled, treat it as block-comments
+	// The permission check will then handle fallback to end-of-block if no permission
+	const blockCommentsEnabled =
+		inPageSettings.source?.["block-comments"] === true ||
+		inPageSettings.source?.["block-inline-text-comments"] === true;
+
+	return {
+		allFootnotesPageSlug:
+			rawConfig["all-footnotes-page-slug"] ||
+			DEFAULT_FOOTNOTES_CONFIG.allFootnotesPageSlug,
+		pageSettings: {
+			enabled: inPageSettings.enabled === true,
+			source: {
+				"end-of-block": inPageSettings.source?.["end-of-block"] === true,
+				"start-of-child-blocks":
+					inPageSettings.source?.["start-of-child-blocks"] === true,
+				"block-comments": blockCommentsEnabled,
+			},
+			markerPrefix:
+				inPageSettings["marker-prefix"] ||
+				DEFAULT_FOOTNOTES_CONFIG.pageSettings.markerPrefix,
+			generateFootnotesSection:
+				inPageSettings["generate-footnotes-section"] === true,
+			intextDisplay: {
+				alwaysPopup: inPageSettings["intext-display"]?.["always-popup"] === true,
+				smallPopupLargeMargin:
+					inPageSettings["intext-display"]?.["small-popup-large-margin"] ===
+					true,
+			},
+		},
+	};
+}
+
+/**
+ * Determines which source type is active (only one can be active at a time)
+ */
+function getActiveSource(
+	config: FootnotesConfig
+): "end-of-block" | "start-of-child-blocks" | "block-comments" | null {
+	const source = config.pageSettings.source;
+	if (source["end-of-block"]) return "end-of-block";
+	if (source["start-of-child-blocks"]) return "start-of-child-blocks";
+	if (source["block-comments"]) return "block-comments";
+	return null;
+}
+
+// ============================================================================
+// RichText Helper Utilities
+// ============================================================================
+
+/**
+ * Joins PlainText from RichText array into a single string
+ * Used for pattern matching and character position calculations
+ *
+ * PERFORMANCE: This is called frequently, so results should be cached where possible
+ */
+export function joinPlainText(richTexts: RichText[]): string {
+	return richTexts.map((rt) => rt.PlainText).join("");
+}
+
+/**
+ * Deep clones a RichText object, preserving all annotation properties
+ * CRITICAL: Must preserve Bold, Italic, Color, Code, etc.
+ */
+export function cloneRichText(richText: RichText): RichText {
+	return {
+		...richText,
+		Text: richText.Text ? { ...richText.Text, Link: richText.Text.Link ? { ...richText.Text.Link } : undefined } : undefined,
+		Annotation: { ...richText.Annotation },
+		Equation: richText.Equation ? { ...richText.Equation } : undefined,
+		Mention: richText.Mention ? { ...richText.Mention } : undefined,
+		InternalHref: richText.InternalHref ? { ...richText.InternalHref } : undefined,
+	};
+}
+
+/**
+ * Splits a RichText array at a specific character position
+ * Returns the part before and after the split point
+ *
+ * @param richTexts - Array to split
+ * @param splitCharPos - Character position in the concatenated string
+ * @returns { before, after } arrays
+ */
+function splitRichTextsAtCharPosition(
+	richTexts: RichText[],
+	splitCharPos: number
+): { before: RichText[]; after: RichText[] } {
+	const before: RichText[] = [];
+	const after: RichText[] = [];
+	let currentPos = 0;
+
+	for (const richText of richTexts) {
+		const length = richText.PlainText.length;
+		const rtStart = currentPos;
+		const rtEnd = currentPos + length;
+
+		if (splitCharPos <= rtStart) {
+			// Entirely after split point
+			after.push(richText);
+		} else if (splitCharPos >= rtEnd) {
+			// Entirely before split point
+			before.push(richText);
+		} else {
+			// Split occurs within this RichText
+			const splitOffset = splitCharPos - rtStart;
+
+			// First part (before split)
+			if (splitOffset > 0) {
+				const beforePart = cloneRichText(richText);
+				beforePart.PlainText = richText.PlainText.substring(0, splitOffset);
+				if (beforePart.Text) {
+					beforePart.Text.Content = beforePart.PlainText;
+				}
+				before.push(beforePart);
+			}
+
+			// Second part (after split)
+			if (splitOffset < length) {
+				const afterPart = cloneRichText(richText);
+				afterPart.PlainText = richText.PlainText.substring(splitOffset);
+				if (afterPart.Text) {
+					afterPart.Text.Content = afterPart.PlainText;
+				}
+				after.push(afterPart);
+			}
+		}
+
+		currentPos += length;
+	}
+
+	return { before, after };
+}
+
+/**
+ * Extracts a character range from RichText array, preserving all annotations
+ * This is the KEY function that maintains formatting in footnote content
+ *
+ * @param richTexts - Source array
+ * @param startChar - Start position (inclusive)
+ * @param endChar - End position (exclusive)
+ * @returns New RichText array with the extracted range
+ */
+export function extractRichTextRange(
+	richTexts: RichText[],
+	startChar: number,
+	endChar: number
+): RichText[] {
+	const result: RichText[] = [];
+	let currentPos = 0;
+
+	for (const richText of richTexts) {
+		const length = richText.PlainText.length;
+		const rtStart = currentPos;
+		const rtEnd = currentPos + length;
+
+		// Check if this RichText overlaps with the target range
+		if (rtEnd > startChar && rtStart < endChar) {
+			const sliceStart = Math.max(0, startChar - rtStart);
+			const sliceEnd = Math.min(length, endChar - rtStart);
+			const slicedText = richText.PlainText.substring(sliceStart, sliceEnd);
+
+			if (slicedText.length > 0) {
+				const slicedRichText = cloneRichText(richText);
+				slicedRichText.PlainText = slicedText;
+				if (slicedRichText.Text) {
+					slicedRichText.Text.Content = slicedText;
+				}
+				result.push(slicedRichText);
+			}
+		}
+
+		currentPos += length;
+	}
+
+	// Trim whitespace from first/last elements
+	if (result.length > 0) {
+		const first = result[0];
+		first.PlainText = first.PlainText.trimStart();
+		if (first.Text) first.Text.Content = first.Text.Content.trimStart();
+
+		const last = result[result.length - 1];
+		last.PlainText = last.PlainText.trimEnd();
+		if (last.Text) last.Text.Content = last.Text.Content.trimEnd();
+	}
+
+	return result;
+}
+
+// ============================================================================
+// Marker Detection and Extraction
+// ============================================================================
+
+/**
+ * Finds all footnote markers in RichText arrays across a block
+ * Returns locations of all markers found
+ *
+ * Pattern: [^marker_prefix*]
+ * Example: [^ft_a], [^ft_b], [^ft_intro]
+ */
+export function findAllFootnoteMarkers(
+	locations: RichTextLocation[],
+	markerPrefix: string
+): FootnoteMarkerInfo[] {
+	const markers: FootnoteMarkerInfo[] = [];
+	// Negative lookahead (?!:) ensures we don't match [^ft_a]: (content markers in child blocks)
+	// Only match [^ft_a] without a following colon (inline markers)
+	const pattern = new RegExp(`\\[\\^${markerPrefix}([a-zA-Z0-9_]+)\\](?!:)`, "g");
+
+	locations.forEach((location) => {
+		const fullText = joinPlainText(location.richTexts);
+		let match: RegExpExecArray | null;
+
+		while ((match = pattern.exec(fullText)) !== null) {
+			const marker = match[1]; // e.g., "a" from "[^ft_a]"
+			const fullMarker = match[0]; // e.g., "[^ft_a]"
+			const charStart = match.index;
+			const charEnd = charStart + fullMarker.length;
+
+			// Find which RichText element this marker is in
+			let currentPos = 0;
+			let richTextIndex = -1;
+			for (let i = 0; i < location.richTexts.length; i++) {
+				const len = location.richTexts[i].PlainText.length;
+				if (currentPos <= charStart && charStart < currentPos + len) {
+					richTextIndex = i;
+					break;
+				}
+				currentPos += len;
+			}
+
+			if (richTextIndex >= 0) {
+				markers.push({
+					Marker: marker,
+					FullMarker: fullMarker,
+					Location: {
+						BlockProperty: location.property,
+						RichTextIndex: richTextIndex,
+						CharStart: charStart,
+						CharEnd: charEnd,
+					},
+				});
+			}
+		}
+	});
+
+	return markers;
+}
+
+/**
+ * Gets all RichText array locations within a block
+ * This includes content, captions, table cells, etc.
+ */
+export function getAllRichTextLocations(block: Block): RichTextLocation[] {
+	const locations: RichTextLocation[] = [];
+
+	// Helper to add a location
+	const addLocation = (
+		property: string,
+		richTexts: RichText[],
+		setter: (newRichTexts: RichText[]) => void
+	) => {
+		if (richTexts && richTexts.length > 0) {
+			locations.push({ property, richTexts, setter });
+		}
+	};
+
+	// Paragraph
+	if (block.Paragraph) {
+		addLocation(
+			"Paragraph.RichTexts",
+			block.Paragraph.RichTexts,
+			(rt) => (block.Paragraph!.RichTexts = rt)
+		);
+	}
+
+	// Headings
+	if (block.Heading1) {
+		addLocation(
+			"Heading1.RichTexts",
+			block.Heading1.RichTexts,
+			(rt) => (block.Heading1!.RichTexts = rt)
+		);
+	}
+	if (block.Heading2) {
+		addLocation(
+			"Heading2.RichTexts",
+			block.Heading2.RichTexts,
+			(rt) => (block.Heading2!.RichTexts = rt)
+		);
+	}
+	if (block.Heading3) {
+		addLocation(
+			"Heading3.RichTexts",
+			block.Heading3.RichTexts,
+			(rt) => (block.Heading3!.RichTexts = rt)
+		);
+	}
+
+	// List items
+	if (block.BulletedListItem) {
+		addLocation(
+			"BulletedListItem.RichTexts",
+			block.BulletedListItem.RichTexts,
+			(rt) => (block.BulletedListItem!.RichTexts = rt)
+		);
+	}
+	if (block.NumberedListItem) {
+		addLocation(
+			"NumberedListItem.RichTexts",
+			block.NumberedListItem.RichTexts,
+			(rt) => (block.NumberedListItem!.RichTexts = rt)
+		);
+	}
+
+	// ToDo
+	if (block.ToDo) {
+		addLocation("ToDo.RichTexts", block.ToDo.RichTexts, (rt) => (block.ToDo!.RichTexts = rt));
+	}
+
+	// Quote
+	if (block.Quote) {
+		addLocation(
+			"Quote.RichTexts",
+			block.Quote.RichTexts,
+			(rt) => (block.Quote!.RichTexts = rt)
+		);
+	}
+
+	// Callout
+	if (block.Callout) {
+		addLocation(
+			"Callout.RichTexts",
+			block.Callout.RichTexts,
+			(rt) => (block.Callout!.RichTexts = rt)
+		);
+	}
+
+	// Toggle
+	if (block.Toggle) {
+		addLocation(
+			"Toggle.RichTexts",
+			block.Toggle.RichTexts,
+			(rt) => (block.Toggle!.RichTexts = rt)
+		);
+	}
+
+	// Code caption (but NOT Code.RichTexts - code content is excluded)
+	if (block.Code?.Caption) {
+		addLocation(
+			"Code.Caption",
+			block.Code.Caption,
+			(rt) => (block.Code!.Caption = rt)
+		);
+	}
+
+	// Media captions
+	if (block.NImage?.Caption) {
+		addLocation(
+			"NImage.Caption",
+			block.NImage.Caption,
+			(rt) => (block.NImage!.Caption = rt)
+		);
+	}
+	if (block.Video?.Caption) {
+		addLocation(
+			"Video.Caption",
+			block.Video.Caption,
+			(rt) => (block.Video!.Caption = rt)
+		);
+	}
+	if (block.NAudio?.Caption) {
+		addLocation(
+			"NAudio.Caption",
+			block.NAudio.Caption,
+			(rt) => (block.NAudio!.Caption = rt)
+		);
+	}
+	if (block.File?.Caption) {
+		addLocation(
+			"File.Caption",
+			block.File.Caption,
+			(rt) => (block.File!.Caption = rt)
+		);
+	}
+
+	// Embed and bookmark captions
+	if (block.Embed?.Caption) {
+		addLocation(
+			"Embed.Caption",
+			block.Embed.Caption,
+			(rt) => (block.Embed!.Caption = rt)
+		);
+	}
+	if (block.Bookmark?.Caption) {
+		addLocation(
+			"Bookmark.Caption",
+			block.Bookmark.Caption,
+			(rt) => (block.Bookmark!.Caption = rt)
+		);
+	}
+	if (block.LinkPreview?.Caption) {
+		addLocation(
+			"LinkPreview.Caption",
+			block.LinkPreview.Caption,
+			(rt) => (block.LinkPreview!.Caption = rt)
+		);
+	}
+
+	// Tables - EVERY cell
+	if (block.Table?.Rows) {
+		block.Table.Rows.forEach((row, rowIndex) => {
+			row.Cells.forEach((cell, cellIndex) => {
+				addLocation(
+					`Table.Rows[${rowIndex}].Cells[${cellIndex}]`,
+					cell.RichTexts,
+					(rt) => (block.Table!.Rows![rowIndex].Cells[cellIndex].RichTexts = rt)
+				);
+			});
+		});
+	}
+
+	return locations;
+}
+
+/**
+ * Splits RichText arrays at marker positions, creating separate RichText elements for markers
+ * Sets IsFootnoteMarker and FootnoteRef properties on marker elements
+ */
+export function splitRichTextWithMarkers(
+	location: RichTextLocation,
+	markers: FootnoteMarkerInfo[],
+	markerPrefix: string
+): RichText[] {
+	// Get markers for this specific location, sorted by position (descending for safe splitting)
+	const locationMarkers = markers
+		.filter((m) => m.Location.BlockProperty === location.property)
+		.sort((a, b) => b.Location.CharStart - a.Location.CharStart);
+
+	if (locationMarkers.length === 0) {
+		return location.richTexts;
+	}
+
+	let result = [...location.richTexts];
+
+	// Split from right to left to avoid position shift issues
+	for (const marker of locationMarkers) {
+		const { before, after } = splitRichTextsAtCharPosition(
+			result,
+			marker.Location.CharStart
+		);
+		const { before: markerPart, after: afterMarker } = splitRichTextsAtCharPosition(
+			after,
+			marker.FullMarker.length
+		);
+
+		// Create footnote marker RichText element
+		if (markerPart.length > 0) {
+			const markerRichText = markerPart[0];
+			markerRichText.IsFootnoteMarker = true;
+			markerRichText.FootnoteRef = marker.Marker;
+			// Keep original PlainText as marker text for now (will be replaced with † in component)
+		}
+
+		result = [...before, ...markerPart, ...afterMarker];
+	}
+
+	return result;
+}
+
+// ============================================================================
+// End-of-Block Extraction
+// ============================================================================
+
+/**
+ * Extracts footnote definitions from end of RichText array
+ * Format: \n\n[^ft_a]: content here\n\n[^ft_b]: more content
+ *
+ * Returns cleaned content (without definitions) and map of marker -> RichText[]
+ *
+ * PERFORMANCE: Caches fullText to avoid repeated joinPlainText() calls
+ */
+export function extractFootnoteDefinitionsFromRichText(
+	richTexts: RichText[],
+	markerPrefix: string,
+	cachedFullText?: string
+): {
+	cleanedRichTexts: RichText[];
+	footnoteDefinitions: Map<string, RichText[]>;
+} {
+	const fullText = cachedFullText || joinPlainText(richTexts);
+
+	// Find the start of footnote definitions section
+	// Pattern: \n\n[^
+	const firstDefMatch = fullText.match(/\n\n\[\^/);
+
+	if (!firstDefMatch || firstDefMatch.index === undefined) {
+		return { cleanedRichTexts: richTexts, footnoteDefinitions: new Map() };
+	}
+
+	const splitPoint = firstDefMatch.index;
+
+	// Split at the first definition
+	const { before: mainContent, after: definitionsSection } =
+		splitRichTextsAtCharPosition(richTexts, splitPoint);
+
+	// Parse individual footnote definitions from the definitions section
+	const definitionsText = fullText.substring(splitPoint);
+	const footnoteDefinitions = parseFootnoteDefinitionsFromRichText(
+		definitionsSection,
+		markerPrefix,
+		definitionsText
+	);
+
+	return { cleanedRichTexts: mainContent, footnoteDefinitions };
+}
+
+/**
+ * Parses individual footnote definitions from the definitions section
+ * Format: [^ft_a]: content\n\n[^ft_b]: more content
+ */
+function parseFootnoteDefinitionsFromRichText(
+	definitionsRichTexts: RichText[],
+	markerPrefix: string,
+	definitionsText: string
+): Map<string, RichText[]> {
+	const definitions = new Map<string, RichText[]>();
+	const pattern = new RegExp(
+		`\\n\\n\\[\\^${markerPrefix}([a-zA-Z0-9_]+)\\]:\\s*`,
+		"g"
+	);
+
+	const matches: Array<{ marker: string; start: number; end: number; matchIndex: number }> = [];
+	let match: RegExpExecArray | null;
+
+	// Find all definition starts
+	while ((match = pattern.exec(definitionsText)) !== null) {
+		matches.push({
+			marker: match[1],
+			start: match.index + match[0].length, // After the "[^ft_a]: " part
+			matchIndex: match.index, // Start of "\n\n[^ft_a]:"
+			end: -1, // Will be set later
+		});
+	}
+
+	// Set end positions (before the next "\n\n[^" starts)
+	for (let i = 0; i < matches.length; i++) {
+		if (i < matches.length - 1) {
+			// End at the position where next footnote marker starts (before the \n\n)
+			matches[i].end = matches[i + 1].matchIndex;
+		} else {
+			matches[i].end = definitionsText.length;
+		}
+	}
+
+	// Extract RichText ranges for each definition
+	matches.forEach((m) => {
+		const contentRichTexts = extractRichTextRange(
+			definitionsRichTexts,
+			m.start,
+			m.end
+		);
+
+		// Skip empty content (edge case handling - silent skip)
+		if (
+			contentRichTexts.length === 0 ||
+			joinPlainText(contentRichTexts).trim() === ""
+		) {
+			return;
+		}
+
+		definitions.set(m.marker, contentRichTexts);
+	});
+
+	return definitions;
+}
+
+/**
+ * Extracts footnotes from end-of-block format
+ * Main entry point for end-of-block source type
+ */
+function extractEndOfBlockFootnotes(
+	block: Block,
+	config: FootnotesConfig
+): FootnoteExtractionResult {
+	const locations = getAllRichTextLocations(block);
+	const footnotes: Footnote[] = [];
+	const markerPrefix = config.pageSettings.markerPrefix;
+
+	// Find all markers first
+	const markers = findAllFootnoteMarkers(locations, markerPrefix);
+	if (markers.length === 0) {
+		return {
+			footnotes: [],
+			hasProcessedRichTexts: false,
+			hasProcessedChildren: false,
+		};
+	}
+
+	// Performance: Cache fullText for each location
+	const fullTextCache = new Map<string, string>();
+	locations.forEach((loc) => {
+		fullTextCache.set(loc.property, joinPlainText(loc.richTexts));
+	});
+
+	// Process each location
+	locations.forEach((location) => {
+		const cachedText = fullTextCache.get(location.property);
+
+		// Extract footnote definitions as RichText arrays (not strings!)
+		const { cleanedRichTexts, footnoteDefinitions } =
+			extractFootnoteDefinitionsFromRichText(
+				location.richTexts,
+				markerPrefix,
+				cachedText
+			);
+
+		// Create Footnote objects from extracted definitions
+		footnoteDefinitions.forEach((contentRichTexts, marker) => {
+			const hasMarker = markers.some((m) => m.Marker === marker);
+			// Only create footnote if there's a marker in the text (silent skip orphaned definitions)
+			if (hasMarker) {
+				footnotes.push({
+					Marker: marker,
+					FullMarker: `[^${markerPrefix}${marker}]`,
+					Content: {
+						Type: "rich_text",
+						RichTexts: contentRichTexts,
+					},
+					SourceLocation: location.property.includes("Caption")
+						? "caption"
+						: location.property.includes("Table")
+							? "table"
+							: "content",
+				});
+			}
+		});
+
+		// Update the location with cleaned RichTexts (definitions removed)
+		location.setter(cleanedRichTexts);
+
+		// Split markers in the cleaned RichTexts
+		const splitRichTexts = splitRichTextWithMarkers(
+			{ ...location, richTexts: cleanedRichTexts },
+			markers,
+			markerPrefix
+		);
+		location.setter(splitRichTexts);
+	});
+
+	return { footnotes, hasProcessedRichTexts: true, hasProcessedChildren: false };
+}
+
+// ============================================================================
+// Start-of-Child-Blocks Extraction
+// ============================================================================
+
+/**
+ * Creates a regex pattern to match footnote content markers
+ * Pattern: ^\[^ft_(\w+)\]:\s* matches [^ft_a]: at line start and captures "a"
+ */
+function createContentPattern(markerPrefix: string): RegExp {
+	const escapedPrefix = markerPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
+	return new RegExp(`^\\[\\^${escapedPrefix}(\\w+)\\]:\\s*`, "gm");
+}
+
+/**
+ * Gets children array from a block (various block types have children)
+ */
+function getChildrenFromBlock(block: Block): Block[] | null {
+	if (block.Paragraph?.Children) return block.Paragraph.Children;
+	if (block.Heading1?.Children) return block.Heading1.Children;
+	if (block.Heading2?.Children) return block.Heading2.Children;
+	if (block.Heading3?.Children) return block.Heading3.Children;
+	if (block.Quote?.Children) return block.Quote.Children;
+	if (block.Callout?.Children) return block.Callout.Children;
+	if (block.Toggle?.Children) return block.Toggle.Children;
+	if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
+	if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
+	if (block.ToDo?.Children) return block.ToDo.Children;
+	if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
+	return null;
+}
+
+/**
+ * Sets children array in a block
+ */
+function setChildrenInBlock(block: Block, children: Block[]): void {
+	if (block.Paragraph) block.Paragraph.Children = children;
+	else if (block.Heading1) block.Heading1.Children = children;
+	else if (block.Heading2) block.Heading2.Children = children;
+	else if (block.Heading3) block.Heading3.Children = children;
+	else if (block.Quote) block.Quote.Children = children;
+	else if (block.Callout) block.Callout.Children = children;
+	else if (block.Toggle) block.Toggle.Children = children;
+	else if (block.BulletedListItem) block.BulletedListItem.Children = children;
+	else if (block.NumberedListItem) block.NumberedListItem.Children = children;
+	else if (block.ToDo) block.ToDo.Children = children;
+	else if (block.SyncedBlock) block.SyncedBlock.Children = children;
+}
+
+/**
+ * Removes marker prefix from start of RichText array
+ * Used to clean [^ft_a]: prefix from child block content
+ */
+function removeMarkerPrefix(
+	richTexts: RichText[],
+	prefixLength: number
+): RichText[] {
+	if (richTexts.length === 0 || prefixLength === 0) {
+		return richTexts;
+	}
+
+	const result = [...richTexts];
+	let remaining = prefixLength;
+
+	for (let i = 0; i < result.length && remaining > 0; i++) {
+		const richText = result[i];
+		const length = richText.PlainText.length;
+
+		if (length <= remaining) {
+			// Remove this entire RichText
+			result.splice(i, 1);
+			remaining -= length;
+			i--; // Adjust index after splice
+		} else {
+			// Truncate this RichText
+			const truncated = cloneRichText(richText);
+			if (truncated.Text) {
+				truncated.Text = {
+					...truncated.Text,
+					Content: truncated.Text.Content.substring(remaining),
+				};
+			}
+			truncated.PlainText = truncated.PlainText.substring(remaining);
+			result[i] = truncated;
+			remaining = 0;
+		}
+	}
+
+	return result;
+}
+
+/**
+ * Extracts footnotes from start-of-child-blocks format
+ * Child blocks at the start are footnote content
+ *
+ * Format: If block has markers [^ft_a] and [^ft_b], first 2 child blocks
+ * should start with [^ft_a]: and [^ft_b]: respectively
+ */
+function extractStartOfChildBlocksFootnotes(
+	block: Block,
+	config: FootnotesConfig
+): FootnoteExtractionResult {
+	const locations = getAllRichTextLocations(block);
+	const footnotes: Footnote[] = [];
+	const markerPrefix = config.pageSettings.markerPrefix;
+
+	// Find all markers
+	const markers = findAllFootnoteMarkers(locations, markerPrefix);
+
+	if (markers.length === 0) {
+		return {
+			footnotes: [],
+			hasProcessedRichTexts: false,
+			hasProcessedChildren: false,
+		};
+	}
+
+	// Count how many markers we found
+	const markerCount = markers.length;
+
+	// Get children blocks
+	const children = getChildrenFromBlock(block);
+
+	// Scan children to find which ones are footnote blocks (start with [^marker]:)
+	// We only check up to markerCount children, but not all may be footnote blocks
+	const contentPattern = createContentPattern(markerPrefix);
+	const childrenToCheck = children ? children.slice(0, Math.max(markerCount, children.length)) : [];
+	const footnoteBlockIndices: number[] = [];
+	const remainingChildren: Block[] = [];
+
+	childrenToCheck.forEach((child, index) => {
+		const blockLocations = getAllRichTextLocations(child);
+
+		if (blockLocations.length === 0) {
+			remainingChildren.push(child);
+			return;
+		}
+
+		const blockText = joinPlainText(blockLocations[0].richTexts);
+
+		// Reset regex state before each exec
+		contentPattern.lastIndex = 0;
+		const match = contentPattern.exec(blockText);
+
+		if (!match) {
+			remainingChildren.push(child);
+			return;
+		}
+
+		const marker = match[1];
+
+		// Remove the [^marker]: prefix from the block
+		const cleanedRichTexts = removeMarkerPrefix(
+			blockLocations[0].richTexts,
+			match[0].length
+		);
+		blockLocations[0].setter(cleanedRichTexts);
+
+		// Create footnote with the entire block (and its descendants) as content
+		footnotes.push({
+			Marker: marker,
+			FullMarker: `[^${markerPrefix}${marker}]`,
+			Content: {
+				Type: "blocks",
+				Blocks: [child],
+			},
+			SourceLocation: "content",
+		});
+
+		footnoteBlockIndices.push(index);
+	});
+
+	// Add any remaining children beyond the first markerCount
+	if (children && children.length > markerCount) {
+		remainingChildren.push(...children.slice(markerCount));
+	}
+
+	// Update children to remove footnote blocks
+	setChildrenInBlock(block, remainingChildren);
+
+	// Split markers in RichTexts
+	locations.forEach((location) => {
+		const splitRichTexts = splitRichTextWithMarkers(
+			location,
+			markers,
+			markerPrefix
+		);
+		location.setter(splitRichTexts);
+	});
+
+	return {
+		footnotes,
+		hasProcessedRichTexts: true,
+		hasProcessedChildren: true,
+	};
+}
+
+// ============================================================================
+// Block-Comments Extraction
+// ============================================================================
+
+/**
+ * Converts Notion API rich_text format to our RichText interface
+ * This mirrors the logic from client.ts: _buildRichText()
+ */
+function convertNotionRichTextToOurFormat(notionRichTexts: any[]): RichText[] {
+	return notionRichTexts.map((nrt: any) => {
+		const richText: RichText = {
+			Annotation: {
+				Bold: nrt.annotations?.bold || false,
+				Italic: nrt.annotations?.italic || false,
+				Strikethrough: nrt.annotations?.strikethrough || false,
+				Underline: nrt.annotations?.underline || false,
+				Code: nrt.annotations?.code || false,
+				Color: nrt.annotations?.color || "default",
+			},
+			PlainText: nrt.plain_text || "",
+			Href: nrt.href,
+		};
+
+		if (nrt.type === "text" && nrt.text) {
+			richText.Text = {
+				Content: nrt.text.content || "",
+				Link: nrt.text.link ? { Url: nrt.text.link.url } : undefined,
+			};
+		}
+
+		// Handle equations if present
+		if (nrt.type === "equation" && nrt.equation) {
+			richText.Equation = {
+				Expression: nrt.equation.expression || "",
+			};
+		}
+
+		// Handle mentions if present - PROPERLY structured like client.ts does
+		if (nrt.type === "mention" && nrt.mention) {
+			const mention: Mention = {
+				Type: nrt.mention.type,
+			};
+
+			if (nrt.mention.type === "page" && nrt.mention.page) {
+				const reference: Reference = {
+					PageId: nrt.mention.page.id,
+					Type: nrt.mention.type,
+				};
+				mention.Page = reference;
+			} else if (nrt.mention.type === "date") {
+				// For dates, we need to format them
+				// Using simple ISO format since we don't have getFormattedDateWithTime here
+				let formatted_date = nrt.mention.date?.start || "Invalid Date";
+				if (nrt.mention.date?.end) {
+					formatted_date += " to " + nrt.mention.date.end;
+				}
+				mention.DateStr = formatted_date;
+			} else if (
+				nrt.mention.type === "link_mention" &&
+				nrt.mention.link_mention
+			) {
+				const linkMention = nrt.mention.link_mention;
+				mention.LinkMention = {
+					Href: linkMention.href,
+					Title: linkMention.title,
+					IconUrl: linkMention.icon_url,
+					Description: linkMention.description,
+					LinkAuthor: linkMention.link_author,
+					ThumbnailUrl: linkMention.thumbnail_url,
+					Height: linkMention.height,
+					IframeUrl: linkMention.iframe_url,
+					LinkProvider: linkMention.link_provider,
+				};
+			} else if (
+				nrt.mention.type === "custom_emoji" &&
+				nrt.mention.custom_emoji
+			) {
+				mention.CustomEmoji = {
+					Name: nrt.mention.custom_emoji.name,
+					Url: nrt.mention.custom_emoji.url,
+				};
+			}
+
+			richText.Mention = mention;
+		}
+
+		return richText;
+	});
+}
+
+/**
+ * Extracts footnotes from Notion block comments
+ *
+ * PERFORMANCE OPTIMIZATION: Only calls Comments API if markers are found in block.
+ * This avoids expensive API calls for blocks without footnote markers.
+ */
+async function extractBlockCommentsFootnotes(
+	block: Block,
+	config: FootnotesConfig,
+	notionClient?: any
+): Promise<FootnoteExtractionResult> {
+	const locations = getAllRichTextLocations(block);
+	const footnotes: Footnote[] = [];
+	const markerPrefix = config.pageSettings.markerPrefix;
+
+	// Find all markers in the block
+	const markers = findAllFootnoteMarkers(locations, markerPrefix);
+
+	// OPTIMIZATION: Skip API call if no markers found in this block
+	if (markers.length === 0) {
+		return {
+			footnotes: [],
+			hasProcessedRichTexts: false,
+			hasProcessedChildren: false,
+		};
+	}
+
+	// Ensure we have a Notion client
+	if (!notionClient || !notionClient.comments) {
+		console.warn(
+			"Footnotes: Comments API requested but Notion client not available"
+		);
+		return {
+			footnotes: [],
+			hasProcessedRichTexts: false,
+			hasProcessedChildren: false,
+		};
+	}
+
+	try {
+		// Only fetch comments if we found footnote markers
+		// This saves expensive API calls for blocks without footnotes
+		const response: any = await notionClient.comments.list({
+			block_id: block.Id,
+		});
+
+		const comments = response.results || [];
+		const contentPattern = createContentPattern(markerPrefix);
+
+		// Process each comment (using for loop to support async/await)
+		for (const comment of comments) {
+			const richTextArray = comment.rich_text || [];
+
+			if (richTextArray.length === 0) {
+				continue;
+			}
+
+			// Check if this comment is a footnote (starts with [^marker]:)
+			const firstText = richTextArray[0]?.plain_text || "";
+			const match = contentPattern.exec(firstText);
+
+			if (!match) {
+				continue; // Not a footnote comment
+			}
+
+			const marker = match[1];
+
+			// Convert Notion comment rich_text to our RichText format
+			const contentRichTexts = convertNotionRichTextToOurFormat(richTextArray);
+
+			// Remove the [^marker]: prefix from first RichText
+			const cleanedRichTexts = removeMarkerPrefix(
+				contentRichTexts,
+				match[0].length
+			);
+
+			// Handle attachments (images) - download and convert to local paths
+			const attachments: CommentAttachment[] = [];
+			if (comment.attachments && comment.attachments.length > 0) {
+				for (const attachment of comment.attachments) {
+					if (attachment.category === "image" && attachment.file?.url) {
+						// Download the image file (same pattern as regular images in client.ts)
+						const imageUrl = new URL(attachment.file.url);
+
+						// Download the file to local storage
+						await downloadFile(imageUrl);
+
+						// Convert URL to webp if optimizing images (same as client.ts does for NImage)
+						let optimizedUrl = attachment.file.url;
+						if (isConvImageType(attachment.file.url) && OPTIMIZE_IMAGES) {
+							optimizedUrl = attachment.file.url.substring(
+								0,
+								attachment.file.url.lastIndexOf(".")
+							) + ".webp";
+						}
+
+						// Convert to local path for display
+						const localPath = buildTimeFilePath(new URL(optimizedUrl));
+
+						attachments.push({
+							Category: "image",
+							Url: localPath, // Store local path, not the remote URL
+							ExpiryTime: attachment.file.expiry_time,
+						});
+					}
+				}
+			}
+
+			footnotes.push({
+				Marker: marker,
+				FullMarker: `[^${markerPrefix}${marker}]`,
+				Content: {
+					Type: "comment",
+					RichTexts: cleanedRichTexts,
+					CommentAttachments: attachments.length > 0 ? attachments : undefined,
+				},
+				SourceLocation: "comment",
+			});
+		}
+
+		// Split markers in RichTexts
+		locations.forEach((location) => {
+			const splitRichTexts = splitRichTextWithMarkers(
+				location,
+				markers,
+				markerPrefix
+			);
+			location.setter(splitRichTexts);
+		});
+
+		return {
+			footnotes,
+			hasProcessedRichTexts: true,
+			hasProcessedChildren: false,
+		};
+	} catch (error: any) {
+		// Check if this is a permission error (403)
+		if (error?.status === 403 || error?.code === 'restricted_resource') {
+			console.warn(
+				'Footnotes: block-comments source is enabled but Comments API permission is not available. ' +
+				'Please grant comment permissions to your Notion integration, or switch to end-of-block or start-of-child-blocks source.'
+			);
+		} else {
+			console.error(
+				`Footnotes: Error fetching comments for block ${block.Id}:`,
+				error
+			);
+		}
+		// Continue without footnotes rather than failing
+		return {
+			footnotes: [],
+			hasProcessedRichTexts: false,
+			hasProcessedChildren: false,
+		};
+	}
+}
+
+// ============================================================================
+// Main Entry Point
+// ============================================================================
+
+/**
+ * Main entry point for extracting footnotes from a block (SYNCHRONOUS)
+ * This handles end-of-block and start-of-child-blocks sources
+ *
+ * Called from client.ts during block building
+ *
+ * NOTE: block-comments source requires async (Comments API), so it's handled separately
+ */
+export function extractFootnotesFromBlock(
+	block: Block,
+	config: FootnotesConfig
+): FootnoteExtractionResult {
+	// Check if footnotes are enabled
+	if (!config.pageSettings.enabled) {
+		return {
+			footnotes: [],
+			hasProcessedRichTexts: false,
+			hasProcessedChildren: false,
+		};
+	}
+
+	const source = getActiveSource(config);
+
+	switch (source) {
+		case "end-of-block":
+			return extractEndOfBlockFootnotes(block, config);
+		case "start-of-child-blocks":
+			return extractStartOfChildBlocksFootnotes(block, config);
+		case "block-comments":
+			// Block comments require async API calls, not supported in synchronous build
+			console.warn(
+				"block-comments source requires async processing and is not yet implemented"
+			);
+			return {
+				footnotes: [],
+				hasProcessedRichTexts: false,
+				hasProcessedChildren: false,
+			};
+		default:
+			return {
+				footnotes: [],
+				hasProcessedRichTexts: false,
+				hasProcessedChildren: false,
+			};
+	}
+}
+
+/**
+ * Async version for extracting footnotes with block-comments support
+ * Use this when you need Comments API integration
+ *
+ * NOTE: This requires async block building, which is not currently supported
+ * in the synchronous _buildBlock function. To enable block-comments:
+ * 1. Make _buildBlock async
+ * 2. Update all callers to await _buildBlock()
+ * 3. Replace extractFootnotesFromBlock with extractFootnotesFromBlockAsync in client.ts
+ */
+export async function extractFootnotesFromBlockAsync(
+	block: Block,
+	config: FootnotesConfig,
+	notionClient?: any
+): Promise<FootnoteExtractionResult> {
+	// Check if footnotes are enabled
+	if (!config.pageSettings.enabled) {
+		return {
+			footnotes: [],
+			hasProcessedRichTexts: false,
+			hasProcessedChildren: false,
+		};
+	}
+
+	const source = getActiveSource(config);
+
+	switch (source) {
+		case "end-of-block":
+			return extractEndOfBlockFootnotes(block, config);
+		case "start-of-child-blocks":
+			return extractStartOfChildBlocksFootnotes(block, config);
+		case "block-comments":
+			return await extractBlockCommentsFootnotes(block, config, notionClient);
+		default:
+			return {
+				footnotes: [],
+				hasProcessedRichTexts: false,
+				hasProcessedChildren: false,
+			};
+	}
+}
diff --git a/src/lib/interfaces.ts b/src/lib/interfaces.ts
index 3602800..91ad6e2 100644
--- a/src/lib/interfaces.ts
+++ b/src/lib/interfaces.ts
@@ -58,6 +58,9 @@ export interface Block {
 	ColumnList?: ColumnList;
 	TableOfContents?: TableOfContents;
 	LinkToPage?: LinkToPage;
+
+	// Footnotes (populated by extractFootnotes during build)
+	Footnotes?: Footnote[];
 }
 
 export interface ReferencesInPage {
@@ -260,6 +263,10 @@ export interface RichText {
 	Equation?: Equation;
 	Mention?: Mention;
 	InternalHref?: Reference;
+
+	// Footnote marker (set by extractFootnotes during build)
+	FootnoteRef?: string; // e.g., "ft_a" (without [^] wrapper)
+	IsFootnoteMarker?: boolean;
 }
 
 export interface Text {
@@ -361,3 +368,90 @@ export type BlockTypes =
 	| "toggle"
 	| "video"
 	| "audio";
+
+// ============================================================================
+// Footnotes Types
+// ============================================================================
+
+/**
+ * Represents a single footnote extracted from content
+ */
+export interface Footnote {
+	Marker: string; // e.g., "ft_a" (without [^] wrapper)
+	FullMarker: string; // e.g., "[^ft_a]" (with wrapper for matching)
+	Content: FootnoteContent;
+	Index?: number; // Sequential index for display (1, 2, 3...)
+	SourceLocation: "content" | "caption" | "table" | "comment"; // Where it came from
+}
+
+/**
+ * Content of a footnote - can be RichText, Blocks, or Comments
+ */
+export interface FootnoteContent {
+	Type: "rich_text" | "blocks" | "comment";
+	RichTexts?: RichText[]; // For end-of-block and block-comments
+	Blocks?: Block[]; // For start-of-child-blocks
+	CommentAttachments?: CommentAttachment[]; // For images in comments
+}
+
+/**
+ * Attachment from Notion Comments API
+ */
+export interface CommentAttachment {
+	Category: string; // 'image'
+	Url: string;
+	ExpiryTime?: string;
+}
+
+/**
+ * Information about where a footnote marker was found
+ */
+export interface FootnoteMarkerInfo {
+	Marker: string; // e.g., "ft_a"
+	FullMarker: string; // e.g., "[^ft_a]"
+	Location: {
+		BlockProperty: string; // e.g., 'Paragraph.RichTexts' or 'NImage.Caption'
+		RichTextIndex: number;
+		CharStart: number;
+		CharEnd: number;
+	};
+}
+
+/**
+ * Configuration for footnotes system
+ */
+export interface FootnotesConfig {
+	allFootnotesPageSlug: string; // Legacy system slug
+	pageSettings: {
+		enabled: boolean;
+		source: {
+			"end-of-block": boolean;
+			"start-of-child-blocks": boolean;
+			"block-comments": boolean;
+		};
+		markerPrefix: string; // e.g., "ft_" → markers like [^ft_a]
+		generateFootnotesSection: boolean; // Collated list at page end
+		intextDisplay: {
+			alwaysPopup: boolean; // Always show as popup
+			smallPopupLargeMargin: boolean; // Responsive: margin on large screens (≥1024px), popup on mobile
+		};
+	};
+}
+
+/**
+ * Result from extracting footnotes from a block
+ */
+export interface FootnoteExtractionResult {
+	footnotes: Footnote[];
+	hasProcessedRichTexts: boolean;
+	hasProcessedChildren: boolean;
+}
+
+/**
+ * Location of RichText array within a block
+ */
+export interface RichTextLocation {
+	property: string; // e.g., "Paragraph.RichTexts", "NImage.Caption"
+	richTexts: RichText[];
+	setter: (newRichTexts: RichText[]) => void;
+}
diff --git a/src/lib/notion/client.ts b/src/lib/notion/client.ts
index f239bcb..df67bda 100644
--- a/src/lib/notion/client.ts
+++ b/src/lib/notion/client.ts
@@ -15,7 +15,13 @@ import {
 	LAST_BUILD_TIME,
 	HIDE_UNDERSCORE_SLUGS_IN_LISTS,
 	BUILD_FOLDER_PATHS,
+	IN_PAGE_FOOTNOTES_ENABLED,
+	FOOTNOTES,
 } from "../../constants";
+import {
+	extractFootnotesFromBlockAsync,
+	normalizeFootnotesConfig,
+} from "../../lib/footnotes";
 import type * as responses from "@/lib/notion/responses";
 import type * as requestParams from "@/lib/notion/request-params";
 import type {
@@ -83,6 +89,53 @@ let dsCache: Database | null = null;
 let blockIdPostIdMap: { [key: string]: string } | null = null;
 let allTagsWithCountsCache: { name: string; count: number; description: string; color: string }[] | null = null;
 
+// Footnotes: Comments API permission check cache (checked once per build)
+// null = not checked yet, true = has permission, false = no permission
+let hasCommentsPermission: boolean | null = null;
+
+/**
+ * Check Comments API permission once per build
+ * This is called from getAllBlocksByBlockId the first time it's invoked
+ */
+async function ensureCommentsPermissionChecked(): Promise<void> {
+	// If already checked, return immediately
+	if (hasCommentsPermission !== null) {
+		return;
+	}
+
+	// Only check if block-comments source is enabled
+	if (!IN_PAGE_FOOTNOTES_ENABLED || !FOOTNOTES) {
+		hasCommentsPermission = false; // Mark as checked (not needed)
+		return;
+	}
+
+	const config = normalizeFootnotesConfig(FOOTNOTES);
+	const activeSource = config.pageSettings.source['block-comments'];
+
+	if (!activeSource) {
+		hasCommentsPermission = false; // Mark as checked (not needed)
+		return;
+	}
+
+	console.log('Footnotes: Checking Comments API permission (block-comments source configured)...');
+	console.log('           The "@notionhq/client warn" below is EXPECTED and means permission is granted.');
+
+	try {
+		await client.comments.list({ block_id: "00000000-0000-0000-0000-000000000000" });
+		hasCommentsPermission = true;
+		console.log('Footnotes: ✓ Permission confirmed - block-comments source available.');
+	} catch (error: any) {
+		if (error?.status === 403 || error?.code === 'restricted_resource') {
+			hasCommentsPermission = false;
+			console.log('Footnotes: ✗ Permission denied - falling back to end-of-block source.');
+		} else {
+			// Any other error (object_not_found, validation_error) = has permission
+			hasCommentsPermission = true;
+			console.log('Footnotes: ✓ Permission confirmed - block-comments source available.');
+		}
+	}
+}
+
 const BUILDCACHE_DIR = BUILD_FOLDER_PATHS["buildcache"];
 async function getResolvedDataSourceId(): Promise<string> {
 	if (resolvedDataSourceId) {
@@ -437,7 +490,37 @@ export async function getAllBlocksByBlockId(blockId: string): Promise<Block[]> {
 		params["start_cursor"] = res.next_cursor as string;
 	}
 
-	const allBlocks = results.map((blockObject) => _buildBlock(blockObject));
+	const allBlocks = await Promise.all(results.map((blockObject) => _buildBlock(blockObject)));
+
+	// Check Comments API permission once (cached for entire build)
+	await ensureCommentsPermissionChecked();
+
+	// Prepare footnotes config with permission-based fallback
+	let adjustedFootnotesConfig = null;
+	if (IN_PAGE_FOOTNOTES_ENABLED && FOOTNOTES) {
+		const footnotesConfig = normalizeFootnotesConfig(FOOTNOTES);
+
+		// If block-comments is enabled but no permission, create a modified copy
+		if (footnotesConfig.pageSettings.source['block-comments'] && !hasCommentsPermission) {
+			console.warn(
+				'Footnotes: block-comments source enabled but permission denied. Falling back to end-of-block source.'
+			);
+			// Create a new config object with modified source settings
+			adjustedFootnotesConfig = {
+				...footnotesConfig,
+				pageSettings: {
+					...footnotesConfig.pageSettings,
+					source: {
+						...footnotesConfig.pageSettings.source,
+						'block-comments': false,
+						'end-of-block': true,
+					},
+				},
+			};
+		} else {
+			adjustedFootnotesConfig = footnotesConfig;
+		}
+	}
 
 	for (let i = 0; i < allBlocks.length; i++) {
 		const block = allBlocks[i];
@@ -469,6 +552,24 @@ export async function getAllBlocksByBlockId(blockId: string): Promise<Block[]> {
 		} else if (block.Type === "callout" && block.Callout && block.HasChildren) {
 			block.Callout.Children = await getAllBlocksByBlockId(block.Id);
 		}
+
+		// Extract footnotes AFTER children are fetched
+		// This is critical for start-of-child-blocks mode which needs the Children array populated
+		try {
+			if (adjustedFootnotesConfig) {
+				const extractionResult = await extractFootnotesFromBlockAsync(
+					block,
+					adjustedFootnotesConfig,
+					client
+				);
+				if (extractionResult.footnotes.length > 0) {
+					block.Footnotes = extractionResult.footnotes;
+				}
+			}
+		} catch (error) {
+			console.error(`Failed to extract footnotes from block ${block.Id}:`, error);
+			// Continue without footnotes rather than failing the entire build
+		}
 	}
 
 	return allBlocks;
@@ -525,7 +626,7 @@ export async function getBlock(blockId: string, forceRefresh = false): Promise<B
 			},
 		);
 
-		const block = _buildBlock(res);
+		const block = await _buildBlock(res);
 
 		// Update our mapping and cache with this new block
 		const blockIdPostIdMap = getBlockIdPostIdMap();
@@ -875,7 +976,7 @@ export async function getDataSource(): Promise<Database> {
 	return database;
 }
 
-function _buildBlock(blockObject: responses.BlockObject): Block {
+async function _buildBlock(blockObject: responses.BlockObject): Promise<Block> {
 	const block: Block = {
 		Id: blockObject.id,
 		Type: blockObject.type,
diff --git a/src/pages/[...page].astro b/src/pages/[...page].astro
index a1a37af..d1b3b7e 100644
--- a/src/pages/[...page].astro
+++ b/src/pages/[...page].astro
@@ -3,9 +3,9 @@ import PageLayout from "@/layouts/Base.astro";
 import { getAllPages, getAllPosts, getPostContentByPostId, processFileBlocks } from "@/lib/notion/client";
 import { extractTargetBlocks, getNavLink, getReferencesInPage, resetCurrentHeadings, resetFirstImage, setCurrentHeadings, setTrackCurrentPageId } from "@/lib/blog-helpers";
 import NotionBlocks from "@/components/NotionBlocks.astro";
-import type { Post } from "@/lib/interfaces";
+import type { Post, Block } from "@/lib/interfaces";
 import { siteInfo } from "@/siteInfo";
-import { FULL_PREVIEW_COLLECTIONS, HIDE_UNDERSCORE_SLUGS_IN_LISTS, HOME_PAGE_SLUG, RECENT_POSTS_ON_HOME_PAGE, LAST_BUILD_TIME, BUILD_FOLDER_PATHS } from "@/constants";
+import { FULL_PREVIEW_COLLECTIONS, HIDE_UNDERSCORE_SLUGS_IN_LISTS, HOME_PAGE_SLUG, RECENT_POSTS_ON_HOME_PAGE, LAST_BUILD_TIME, BUILD_FOLDER_PATHS, FOOTNOTES } from "@/constants";
 import PostPreview from "@/components/blog/PostPreview.astro";
 import Icon from "@/components/Icon.astro";
 import { buildHeadings } from "@/utils";
@@ -109,11 +109,60 @@ if (pageFound && pageLastUpdatedBeforeLastBuild) {
 	}
 }
 
+// Helper function to get children from a block
+function getChildrenFromBlock(block: Block): Block[] | null {
+	if (block.Paragraph?.Children) return block.Paragraph.Children;
+	if (block.Heading1?.Children) return block.Heading1.Children;
+	if (block.Heading2?.Children) return block.Heading2.Children;
+	if (block.Heading3?.Children) return block.Heading3.Children;
+	if (block.Quote?.Children) return block.Quote.Children;
+	if (block.Callout?.Children) return block.Callout.Children;
+	if (block.Toggle?.Children) return block.Toggle.Children;
+	if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
+	if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
+	if (block.ToDo?.Children) return block.ToDo.Children;
+	if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
+	return null;
+}
+
+// Function to assign footnote indices recursively
+function assignFootnoteIndices(blocks: Block[], footnoteNumber: { value: number }): void {
+	blocks.forEach(block => {
+		if (block.Footnotes && block.Footnotes.length > 0) {
+			block.Footnotes.forEach(footnote => {
+				footnote.Index = footnoteNumber.value++;
+			});
+		}
+
+		// Recursively process children
+		const children = getChildrenFromBlock(block);
+		if (children && children.length > 0) {
+			assignFootnoteIndices(children, footnoteNumber);
+		}
+
+		// Process column lists
+		if (block.ColumnList?.Columns) {
+			block.ColumnList.Columns.forEach(column => {
+				if (column.Children) {
+					assignFootnoteIndices(column.Children, footnoteNumber);
+				}
+			});
+		}
+	});
+}
+
 if (pageFound) {
 		const result = await getPostContentByPostId(page);
 		blocks = result.blocks;
 		referencesInPage = result.referencesInPage;
 
+		// Assign footnote indices if generate-footnotes-section is enabled
+		const generateSection = FOOTNOTES?.['in-page-footnotes-settings']?.['generate-footnotes-section'];
+		if (generateSection && blocks) {
+			const footnoteNumber = { value: 1 };
+			assignFootnoteIndices(blocks, footnoteNumber);
+		}
+
 		if (cachedHeadings) {
 				headings = cachedHeadings;
 		} else {
diff --git a/src/pages/posts/[slug].astro b/src/pages/posts/[slug].astro
index 992ab54..e215de6 100644
--- a/src/pages/posts/[slug].astro
+++ b/src/pages/posts/[slug].astro
@@ -12,7 +12,8 @@ import { getAllPosts, getPostContentByPostId, processFileBlocks } from "@/lib/no
 import { getReferencesInPage } from "@/lib/blog-helpers";
 import type { Post } from "@/lib/interfaces";
 import { buildHeadings } from "@/utils";
-import { BUILD_FOLDER_PATHS, LAST_BUILD_TIME } from "@/constants";
+import { BUILD_FOLDER_PATHS, LAST_BUILD_TIME, FOOTNOTES } from "@/constants";
+import type { Block } from "@/lib/interfaces";
 import fs from "fs/promises";
 import path from "path";
 import superjson from "superjson";
@@ -109,11 +110,61 @@ if (postFound && postLastUpdatedBeforeLastBuild) {
 	}
 }
 
+// Helper function to get children from a block
+function getChildrenFromBlock(block: Block): Block[] | null {
+	if (block.Paragraph?.Children) return block.Paragraph.Children;
+	if (block.Heading1?.Children) return block.Heading1.Children;
+	if (block.Heading2?.Children) return block.Heading2.Children;
+	if (block.Heading3?.Children) return block.Heading3.Children;
+	if (block.Quote?.Children) return block.Quote.Children;
+	if (block.Callout?.Children) return block.Callout.Children;
+	if (block.Toggle?.Children) return block.Toggle.Children;
+	if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
+	if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
+	if (block.ToDo?.Children) return block.ToDo.Children;
+	if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
+	return null;
+}
+
+// Function to assign footnote indices recursively
+function assignFootnoteIndices(blocks: Block[], footnoteNumber: { value: number }): void {
+	blocks.forEach(block => {
+		if (block.Footnotes && block.Footnotes.length > 0) {
+			block.Footnotes.forEach(footnote => {
+				footnote.Index = footnoteNumber.value++;
+			});
+		}
+
+		// Recursively process children
+		const children = getChildrenFromBlock(block);
+		if (children && children.length > 0) {
+			assignFootnoteIndices(children, footnoteNumber);
+		}
+
+		// Process column lists
+		if (block.ColumnList?.Columns) {
+			block.ColumnList.Columns.forEach(column => {
+				if (column.Children) {
+					assignFootnoteIndices(column.Children, footnoteNumber);
+				}
+			});
+		}
+	});
+}
+
 if (postFound) {
 	const result = await getPostContentByPostId(post);
 	blocks = result.blocks;
 	referencesInPage = result.referencesInPage;
 
+	// Assign footnote indices if generate-footnotes-section OR margin mode is enabled
+	const generateSection = FOOTNOTES?.['in-page-footnotes-settings']?.['generate-footnotes-section'];
+	const isMarginMode = FOOTNOTES?.['in-page-footnotes-settings']?.['intext-display']?.['small-popup-large-margin'];
+	if ((generateSection || isMarginMode) && blocks) {
+		const footnoteNumber = { value: 1 };
+		assignFootnoteIndices(blocks, footnoteNumber);
+	}
+
 	// Use cached headings if available, otherwise build and save them
 	if (cachedHeadings) {
 		headings = cachedHeadings;

# completed-implementation

**Hash:** 9651b1d | **Author:** Mimansa Jaiswal | **Date:** 2025-10-25

## Description:

## Changes:
---
 constants-config.json                              |  10 +-
 src/components/blog/FootnotesSection.astro         |  96 ++++++++---
 src/components/blog/PostPreviewFull.astro          |  24 ++-
 .../blog/references/NBlocksPopover.astro           |   4 +-
 src/components/notion-blocks/FootnoteMarker.astro  |  82 ++++-----
 src/constants.ts                                   |   5 +-
 src/layouts/Base.astro                             | 185 ++++++++++++---------
 src/layouts/BlogPost.astro                         |  17 +-
 src/lib/blog-helpers.ts                            |  56 +++++++
 src/lib/footnotes.ts                               | 167 +++++++++----------
 src/lib/interfaces.ts                              |  16 +-
 src/lib/notion/client.ts                           | 154 ++++++++++-------
 src/pages/posts/[slug].astro                       | 120 ++++---------
 13 files changed, 527 insertions(+), 409 deletions(-)

diff --git a/constants-config.json b/constants-config.json
index 84bbc4e..0d767eb 100644
--- a/constants-config.json
+++ b/constants-config.json
@@ -121,20 +121,20 @@
 	"hide-underscore-slugs-in-lists": true,
 	"home-page-slug": "",
 	"footnotes": {
-		"all-footnotes-page-slug": "_all-footnotes",
+		"sitewide-footnotes-page-slug": "_all-footnotes",
 		"in-page-footnotes-settings": {
 			"enabled": true,
 			"source": {
-				"end-of-block": false,
-				"start-of-child-blocks": true,
+				"end-of-block": true,
+				"start-of-child-blocks": false,
 				"block-comments": false,
 				"block-inline-text-comments": false
 			},
 			"marker-prefix": "ft_",
 			"generate-footnotes-section": true,
 			"intext-display": {
-				"always-popup": true,
-				"small-popup-large-margin": false
+				"always-popup": false,
+				"small-popup-large-margin": true
 			}
 		}
 	},
diff --git a/src/components/blog/FootnotesSection.astro b/src/components/blog/FootnotesSection.astro
index e7d8277..83b34da 100644
--- a/src/components/blog/FootnotesSection.astro
+++ b/src/components/blog/FootnotesSection.astro
@@ -1,43 +1,93 @@
 ---
-import type { Block, Footnote } from "@/lib/interfaces";
+import type { Footnote } from "@/lib/interfaces";
 import NotionBlocks from "@/components/NotionBlocks.astro";
+import { adjustedFootnotesConfig } from "@/lib/notion/client";
 
 export interface Props {
-	blocks: Block[];
+	footnotes: Footnote[];
 }
 
-const { blocks } = Astro.props;
+const { footnotes } = Astro.props;
 
-// Collect all footnotes from all blocks
-const allFootnotes: Footnote[] = [];
-blocks.forEach((block) => {
-	if (block.Footnotes && block.Footnotes.length > 0) {
-		allFootnotes.push(...block.Footnotes);
+// Remove duplicates based on Marker (in case same footnote appears multiple times)
+const uniqueFootnotes = Array.from(
+	new Map(footnotes.map((fn) => [fn.Marker, fn])).values()
+);
+
+// Sort by Index (sequential numbering) if available, otherwise by Marker
+uniqueFootnotes.sort((a, b) => {
+	if (a.Index && b.Index) {
+		return a.Index - b.Index;
 	}
+	return a.Marker.localeCompare(b.Marker);
 });
 
-// Remove duplicates based on Marker (in case same footnote appears in multiple blocks)
-const uniqueFootnotes = Array.from(
-	new Map(allFootnotes.map((fn) => [fn.Marker, fn])).values()
-);
+// Check if start-of-child-blocks is enabled (no spacing needed for block-type footnotes)
+const isStartOfChildBlocks = adjustedFootnotesConfig?.["in-page-footnotes-settings"]?.source?.["start-of-child-blocks"] === true;
+
+// Define styles matching Interlinked Content section
+const footnotesHeaderStyles = `
+	#autogenerated-footnotes::before {
+		content: "#";
+		position: absolute;
+		color: color-mix(in srgb, var(--color-accent) 50%, transparent);
+		margin-left: -1.5rem;
+		display: inline-block;
+		opacity: 0;
+		transition: opacity 0.3s ease;
+	}
+
+	#autogenerated-footnotes:hover::before {
+		opacity: 1;
+	}
 
-// Sort by marker (alphabetically)
-uniqueFootnotes.sort((a, b) => a.Marker.localeCompare(b.Marker));
+	#-tocid--autogenerated-footnotes,
+	#-vistocid--autogenerated-footnotes {
+		display: block !important;
+	}
+
+	#-bottomtocid--autogenerated-footnotes {
+		display: inline !important;
+	}
+`;
 ---
 
 {
 	uniqueFootnotes.length > 0 && (
-		<section class="footnotes-section mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
-			<h2 class="text-xl font-semibold mb-4">Footnotes</h2>
-			<ol class="space-y-4 text-sm">
-				{uniqueFootnotes.map((footnote, index) => (
+		<section class="footnotes-section mt-12">
+			<hr class="divider bg-accent/30 mx-auto my-4 h-0.5 w-full rounded-sm border-none" />
+			<h2
+				class="non-toggle-h2 mb-4 cursor-pointer text-2xl font-normal"
+				id="autogenerated-footnotes"
+				onclick="
+					var fullUrl = `${window.location.origin}${window.location.pathname}#${id}`;
+					navigator.clipboard.writeText(fullUrl);
+					window.history.pushState(null, '', fullUrl);
+					document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth' });
+				"
+			>
+				Footnotes
+			</h2>
+			<style set:html={footnotesHeaderStyles} />
+			<ol class={isStartOfChildBlocks ? "text-sm" : "space-y-2 text-sm"}>
+				{uniqueFootnotes.map((footnote) => (
 					<li
 						id={`footnote-def-${footnote.Marker}`}
-						class="flex gap-2"
+						class="flex gap-2 items-baseline"
 					>
-						<span class="font-mono text-gray-500 dark:text-gray-400 shrink-0">
-							[{index + 1}]
-						</span>
+						{footnote.SourceBlockId ? (
+							<a
+								href={`#${footnote.SourceBlockId}`}
+								class="font-mono text-sm text-gray-500 dark:text-gray-400 hover:text-link dark:hover:text-link shrink-0 no-underline"
+								aria-label={`Jump back to footnote ${footnote.Index || footnote.Marker} in text`}
+							>
+								[{footnote.Index || footnote.Marker}]
+							</a>
+						) : (
+							<span class="font-mono text-sm text-gray-500 dark:text-gray-400 shrink-0">
+								[{footnote.Index || footnote.Marker}]
+							</span>
+						)}
 						<div class="footnote-content flex-1">
 							{footnote.Content.Type === "rich_text" &&
 								footnote.Content.RichTexts && (
@@ -90,7 +140,7 @@ uniqueFootnotes.sort((a, b) => a.Marker.localeCompare(b.Marker));
 									<div class="prose prose-sm max-w-none dark:prose-invert">
 										<NotionBlocks
 											blocks={footnote.Content.Blocks}
-											renderChildren={false}
+											renderChildren={true}
 											setId={false}
 										/>
 									</div>
diff --git a/src/components/blog/PostPreviewFull.astro b/src/components/blog/PostPreviewFull.astro
index 1fa2585..310779b 100644
--- a/src/components/blog/PostPreviewFull.astro
+++ b/src/components/blog/PostPreviewFull.astro
@@ -12,6 +12,8 @@ import {
 import NotionBlocks from "@/components/NotionBlocks.astro";
 import { getNotionColorToTailwindColor } from "@/lib/style-helpers";
 import { MENU_PAGES_COLLECTION, BUILD_FOLDER_PATHS } from "@/constants";
+import { adjustedFootnotesConfig } from "@/lib/notion/client";
+import FootnotesSection from "@/components/blog/FootnotesSection.astro";
 import Icon from "@/components/Icon.astro";
 import { buildHeadings, slugify } from "@/utils";
 import fs from "fs/promises";
@@ -33,7 +35,7 @@ const {
 	as: Tag = "div",
 	withDesc = false,
 } = Astro.props;
-const { blocks, referencesInPage } = await getPostContentByPostId(post_full_preview);
+const { blocks, referencesInPage, footnotesInPage } = await getPostContentByPostId(post_full_preview);
 
 // --- Headings Cache Handling ---
 let headings = null;
@@ -152,12 +154,18 @@ const postLink = getPostLink(
 	)
 }
 
-{
-	shouldUseCache && cachedHtml ? (
-		<section class="post-body" data-html-type="cached" set:html={cachedHtml} />
+<section class="post-body post-preview-full-container" data-html-type={shouldUseCache && cachedHtml ? "cached" : "new"}>
+	{shouldUseCache && cachedHtml ? (
+		<div set:html={cachedHtml} />
 	) : (
-		<section class="post-body" data-html-type="new">
+		<>
 			<NotionBlocks blocks={blocks} />
-		</section>
-	)
-}
+			{/* Footnotes section - only render when NOT using cache (cached HTML already includes it) */}
+			{adjustedFootnotesConfig?.['in-page-footnotes-settings']?.enabled &&
+			 adjustedFootnotesConfig?.['in-page-footnotes-settings']?.['generate-footnotes-section'] &&
+			 footnotesInPage && (
+				<FootnotesSection footnotes={footnotesInPage} />
+			)}
+		</>
+	)}
+</section>
diff --git a/src/components/blog/references/NBlocksPopover.astro b/src/components/blog/references/NBlocksPopover.astro
index 496936a..69c7917 100644
--- a/src/components/blog/references/NBlocksPopover.astro
+++ b/src/components/blog/references/NBlocksPopover.astro
@@ -1,7 +1,7 @@
 ---
 import type { Block } from "@/lib/interfaces";
 import NotionBlocks from "@/components/NotionBlocks.astro";
-import { ALL_FOOTNOTES_PAGE_SLUG } from "@/constants";
+import { SITEWIDE_FOOTNOTES_PAGE_SLUG } from "@/constants";
 interface Props {
 	block: Block;
 	linkedTo: string;
@@ -20,7 +20,7 @@ const {
 } = Astro.props;
 let id = "id" + Math.random().toString(16).slice(2) + "---" + block.Id;
 let isFootnote = false;
-const footnotePattern = "posts/" + ALL_FOOTNOTES_PAGE_SLUG;
+const footnotePattern = "posts/" + SITEWIDE_FOOTNOTES_PAGE_SLUG;
 if (linkedTo && (linkedTo.includes(footnotePattern + "/") || linkedTo.endsWith(footnotePattern))) {
 	isFootnote = true;
 }
diff --git a/src/components/notion-blocks/FootnoteMarker.astro b/src/components/notion-blocks/FootnoteMarker.astro
index 7ed1589..a7b9609 100644
--- a/src/components/notion-blocks/FootnoteMarker.astro
+++ b/src/components/notion-blocks/FootnoteMarker.astro
@@ -1,6 +1,6 @@
 ---
 import type { RichText, Block, Footnote } from "@/lib/interfaces";
-import { FOOTNOTES } from "@/constants";
+import { adjustedFootnotesConfig } from "@/lib/notion/client";
 import NotionBlocks from "@/components/NotionBlocks.astro";
 import RichTextComponent from "@/components/notion-blocks/RichText.astro";
 
@@ -12,7 +12,7 @@ export interface Props {
 const { richText, block } = Astro.props;
 
 // Get footnote configuration
-const config = FOOTNOTES?.["in-page-footnotes-settings"];
+const config = adjustedFootnotesConfig?.["in-page-footnotes-settings"];
 const displayMode = config?.["intext-display"];
 
 // Determine display mode
@@ -32,10 +32,11 @@ if (block.Footnotes && footnoteRef) {
 const uniqueId = `footnote-${block.Id}-${footnoteRef}`;
 
 // Determine what symbol to display:
-// - Use sequential numbers if footnotes section is enabled OR margin mode is enabled
-// - Otherwise use † symbol
+// - Use † ONLY when always-popup is true AND generate-footnotes-section is false
+// - Otherwise use sequential numbers [1], [2], etc.
 const generateSection = config?.['generate-footnotes-section'];
-const displaySymbol = (generateSection || isMarginMode) && footnote?.Index ? `[${footnote.Index}]` : '[†]';
+const useNumbering = generateSection || isMarginMode || !isAlwaysPopup;
+const displaySymbol = useNumbering && footnote?.Index ? `[${footnote.Index}]` : '[†]';
 ---
 
 {/* If no footnote content found, render as muted text (broken reference) */}
@@ -52,7 +53,7 @@ const displaySymbol = (generateSection || isMarginMode) && footnote?.Index ? `[$
 					data-footnote-id={uniqueId}
 					data-popover-target={`popover-${uniqueId}`}
 					data-popover-placement="bottom-start"
-					class="cursor-pointer text-link hover:text-link-hover transition-colors"
+					class="cursor-pointer text-link hover:text-link-hover transition-colors font-mono text-sm"
 					aria-label={`Show footnote ${displaySymbol}`}
 					role="button"
 					tabindex="0"
@@ -67,7 +68,7 @@ const displaySymbol = (generateSection || isMarginMode) && footnote?.Index ? `[$
 					data-margin-note={uniqueId}
 					data-popover-target={`popover-${uniqueId}`}
 					data-popover-placement="bottom-start"
-					class="cursor-pointer text-link hover:text-link-hover transition-colors"
+					class="cursor-pointer text-link hover:text-link-hover transition-colors font-mono text-sm"
 					aria-label={`Show footnote ${displaySymbol}`}
 					role="button"
 					tabindex="0"
@@ -81,7 +82,7 @@ const displaySymbol = (generateSection || isMarginMode) && footnote?.Index ? `[$
 					data-footnote-id={uniqueId}
 					data-popover-target={`popover-${uniqueId}`}
 					data-popover-placement="bottom-start"
-					class="cursor-pointer text-link hover:text-link-hover transition-colors"
+					class="cursor-pointer text-link hover:text-link-hover transition-colors font-mono text-sm"
 					aria-label={`Show footnote ${displaySymbol}`}
 					role="button"
 					tabindex="0"
@@ -135,40 +136,39 @@ const displaySymbol = (generateSection || isMarginMode) && footnote?.Index ? `[$
 		<!-- Template for margin notes content (same structure, used by margin notes script) -->
 		{isMarginMode && (
 			<template id={`template-margin-${uniqueId}`}>
-				<div class="footnote-margin-content">
-					{/* Add sequential number prefix if index exists */}
-					{footnote.Index && (
-						<strong class="footnote-margin-number">[{footnote.Index}]: </strong>
-					)}
-					{footnote.Content.Type === "rich_text" && footnote.Content.RichTexts && (
-						<span>
-							{footnote.Content.RichTexts.map((rt) => (
-								<RichTextComponent richText={rt} blockID={block.Id} block={block} />
-							))}
-						</span>
-					)}
-					{footnote.Content.Type === "blocks" && footnote.Content.Blocks && (
-						<div class="text-xs">
-							<NotionBlocks blocks={footnote.Content.Blocks} renderChildren={true} setId={false} />
-						</div>
-					)}
-					{footnote.Content.Type === "comment" && footnote.Content.RichTexts && (
-						<span>
-							{footnote.Content.RichTexts.map((rt) => (
-								<RichTextComponent richText={rt} blockID={block.Id} block={block} />
-							))}
-							{footnote.Content.CommentAttachments && footnote.Content.CommentAttachments.length > 0 && (
-								<div class="mt-2 space-y-1">
-									{footnote.Content.CommentAttachments.map((attachment) => (
-										attachment.Category === "image" && (
-											<img src={attachment.Url} alt="" class="max-w-full rounded" />
-										)
-									))}
-								</div>
+				{/* Add sequential number prefix for margin notes as inline superscript */}
+				{footnote.Content.Type === "rich_text" && footnote.Content.RichTexts && (
+					<span class="!text-sm">
+						<sup class="font-mono text-xxs">[{footnote.Index || footnote.Marker}]</sup>{" "}
+						{footnote.Content.RichTexts.map((rt) => (
+							<RichTextComponent richText={rt} blockID={block.Id} block={block} />
+						))}
+					</span>
+				)}
+				{footnote.Content.Type === "blocks" && footnote.Content.Blocks && (
+					<div class="!text-sm footnote-margin-blocks">
+						<sup class="font-mono text-xxs">[{footnote.Index || footnote.Marker}]</sup>{" "}
+						<NotionBlocks blocks={footnote.Content.Blocks} renderChildren={true} setId={false} />
+					</div>
+				)}
+				{footnote.Content.Type === "comment" && footnote.Content.RichTexts && (
+					<span class="!text-sm">
+						<sup class="font-mono text-xxs">[{footnote.Index || footnote.Marker}]</sup>{" "}
+						{footnote.Content.RichTexts.map((rt) => (
+							<RichTextComponent richText={rt} blockID={block.Id} block={block} />
+						))}
+						{footnote.Content.CommentAttachments && footnote.Content.CommentAttachments.length > 0 && (
+							<div class="mt-2 space-y-1">
+								{footnote.Content.CommentAttachments.map((attachment) => (
+									attachment.Category === "image" && (
+										<img src={attachment.Url} alt="" class="max-w-full rounded" />
+									)
+								)
 							)}
-						</span>
-					)}
-				</div>
+							</div>
+						)}
+					</span>
+				)}
 			</template>
 		)}
 	</>
diff --git a/src/constants.ts b/src/constants.ts
index 09180dd..4d78e7a 100644
--- a/src/constants.ts
+++ b/src/constants.ts
@@ -20,6 +20,7 @@ export const BUILD_FOLDER_PATHS = {
 	headingsCache: path.join("./tmp", "blocks-json-cache", "headings"),
 	referencesInPage: path.join("./tmp", "blocks-json-cache", "references-in-page"),
 	referencesToPage: path.join("./tmp", "blocks-json-cache", "references-to-page"),
+	footnotesInPage: path.join("./tmp", "blocks-json-cache", "footnotes-in-page"),
 	ogImages: path.join("./tmp", "og-images"),
 	rssCache: path.join("./tmp", "rss-cache"),
 	blocksHtmlCache: path.join("./tmp", "blocks-html-cache"),
@@ -71,13 +72,13 @@ export const HOME_PAGE_SLUG = key_value_from_json["home-page-slug"] || "home";
 
 /**
  * Footnotes configuration
- * - "all-footnotes-page-slug": Legacy manual footnotes page (already works via NBlocksPopover)
+ * - "sitewide-footnotes-page-slug": Legacy manual footnotes page (already works via NBlocksPopover)
  * - "in-page-footnotes-settings": Automatic in-page footnotes with markers (new feature)
  */
 export const FOOTNOTES = key_value_from_json["footnotes"] || null;
 
 // Legacy manual footnotes page slug (used by NBlocksPopover)
-export const ALL_FOOTNOTES_PAGE_SLUG = FOOTNOTES?.["all-footnotes-page-slug"] || "_all-footnotes";
+export const SITEWIDE_FOOTNOTES_PAGE_SLUG = FOOTNOTES?.["sitewide-footnotes-page-slug"] || "_all-footnotes";
 
 // Helper to check if in-page footnotes are enabled
 export const IN_PAGE_FOOTNOTES_ENABLED =
diff --git a/src/layouts/Base.astro b/src/layouts/Base.astro
index 761b248..8564506 100644
--- a/src/layouts/Base.astro
+++ b/src/layouts/Base.astro
@@ -5,7 +5,8 @@ import Header from "@/components/layout/Header.astro";
 import Footer from "@/components/layout/Footer.astro";
 import SkipLink from "@/components/SkipLink.astro";
 import { siteInfo } from "@/siteInfo";
-import { ENABLE_LIGHTBOX, REFERENCES, FOOTNOTES } from "@/constants";
+import { ENABLE_LIGHTBOX, REFERENCES } from "@/constants";
+import { adjustedFootnotesConfig } from "@/lib/notion/client";
 interface Props {
 meta: SiteMeta;
 }
@@ -78,20 +79,28 @@ window.addEventListener('afterprint', function () {
   } from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.5.3/+esm';
 
   document.addEventListener('DOMContentLoaded', () => {
+      // State variables for popovers
+      let popoverTriggersSet = new Set(); // Track which elements have listeners
+
       // Determine if it's a mobile device
-  const isSmBreakpoint = window.matchMedia('(max-width: 639px)').matches;
-  const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
+  let isSmBreakpoint = window.matchMedia('(max-width: 639px)').matches;
+  let isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
 
 // Create the selector based on the device type
 // Exclude footnote markers with data-margin-note on large screens (they use margin notes instead)
-const selector = isSmBreakpoint
-  ? '[data-popover-target]:not([data-popover-type-lm="true"])'
-  : isLargeScreen
-    ? '[data-popover-target]:not([data-margin-note])'
-    : '[data-popover-target]';
+function getPopoverSelector() {
+  const isSmBreakpoint = window.matchMedia('(max-width: 639px)').matches;
+  const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
+
+  return isSmBreakpoint
+    ? '[data-popover-target]:not([data-popover-type-lm="true"])'
+    : isLargeScreen
+      ? '[data-popover-target]:not([data-margin-note])'
+      : '[data-popover-target]';
+}
 
 // Select popover triggers based on the device-specific selector
-const popoverTriggers = document.querySelectorAll(selector);
+const popoverTriggers = document.querySelectorAll(getPopoverSelector());
 
       let openPopovers = [];
       let cleanupAutoUpdate = new Map();
@@ -257,10 +266,29 @@ const popoverTriggers = document.querySelectorAll(selector);
           cleanupAutoUpdate.set(popoverEl, autoUpdate(triggerEl, popoverEl, update));
       };
 
+      // Function to initialize popover triggers for footnote markers only (on resize to small screen)
+      const initializeFootnotePopoverTriggers = () => {
+          // Only add listeners to footnote markers that don't already have them
+          const footnoteMarkers = document.querySelectorAll('[data-margin-note]');
+
+          footnoteMarkers.forEach(triggerEl => {
+              // Only add listeners if not already added
+              if (!popoverTriggersSet.has(triggerEl)) {
+                  addPTEventListeners(triggerEl, null);
+                  popoverTriggersSet.add(triggerEl);
+              }
+          });
+      };
+
+      // Initialize popovers for the first time
       popoverTriggers.forEach(triggerEl => {
           addPTEventListeners(triggerEl, null);
+          popoverTriggersSet.add(triggerEl);
       });
 
+      // Store the initialization function globally so resize handler can access it
+      window.reinitializeFootnotePopovers = initializeFootnotePopoverTriggers;
+
       document.addEventListener('click', (event) => {
           const popoverLink = event.target.closest('[data-popover-link]');
           if (popoverLink) {
@@ -283,7 +311,7 @@ const popoverTriggers = document.querySelectorAll(selector);
       )
       }
 {/* Margin Notes Script (for small-popup-large-margin display mode) */}
-{FOOTNOTES && FOOTNOTES["in-page-footnotes-settings"]?.["intext-display"]?.["small-popup-large-margin"] && (
+{adjustedFootnotesConfig && adjustedFootnotesConfig["in-page-footnotes-settings"]?.["intext-display"]?.["small-popup-large-margin"] && (
 <script type="module">
   /**
    * Initializes Tufte-style margin notes for footnotes
@@ -314,12 +342,41 @@ const popoverTriggers = document.querySelectorAll(selector);
         const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
 
         if (isLargeScreen) {
-          // Switched to large screen - remove old margin notes and recreate them
+          // Switched to large screen - remove margin notes and recreate them
           document.querySelectorAll('.footnote-margin-note').forEach(n => n.remove());
           positionMarginNotes();
+
+          // Hide any open popovers for footnote markers and mark them as non-interactive
+          document.querySelectorAll('[data-margin-note]').forEach(marker => {
+            const popoverId = marker.getAttribute('data-popover-target');
+            if (popoverId) {
+              const popover = document.getElementById(popoverId);
+              if (popover) {
+                popover.style.display = 'none';
+                popover.style.visibility = 'hidden';
+                popover.classList.add('hidden');
+              }
+            }
+          });
         } else {
-          // Switched to small screen - remove margin notes (popover system takes over)
+          // Switched to small screen - remove margin notes and reinitialize popover listeners for footnotes only
           document.querySelectorAll('.footnote-margin-note').forEach(n => n.remove());
+
+          // Re-enable popovers for footnote markers
+          document.querySelectorAll('[data-margin-note]').forEach(marker => {
+            const popoverId = marker.getAttribute('data-popover-target');
+            if (popoverId) {
+              const popover = document.getElementById(popoverId);
+              if (popover) {
+                popover.style.display = '';
+              }
+            }
+          });
+
+          // Reinitialize popover listeners only for footnote markers that were previously excluded
+          if (window.reinitializeFootnotePopovers) {
+            window.reinitializeFootnotePopovers();
+          }
         }
       }, 250);
     });
@@ -327,7 +384,6 @@ const popoverTriggers = document.querySelectorAll(selector);
 
   function positionMarginNotes() {
     const markers = document.querySelectorAll('[data-margin-note]');
-    const createdNotes = [];
 
     markers.forEach((markerEl) => {
       const footnoteId = markerEl.getAttribute('data-margin-note');
@@ -339,12 +395,15 @@ const popoverTriggers = document.querySelectorAll(selector);
       const postBody = markerEl.closest('.post-body');
       if (!postBody) return;
 
+      // Skip if inside a post-preview-full-container (collection full preview pages)
+      if (postBody.classList.contains('post-preview-full-container')) return;
+
       if (getComputedStyle(postBody).position === 'static') {
         postBody.style.position = 'relative';
       }
 
       const marginNote = document.createElement('aside');
-      marginNote.className = 'footnote-margin-note';
+      marginNote.className = 'footnote-margin-note absolute left-full ml-8 w-32 xl:ml-12 xl:w-48 text-sm leading-relaxed text-gray-500 dark:text-gray-400 opacity-70 transition-opacity duration-200 pointer-events-auto';
       marginNote.dataset.noteId = footnoteId;
 
       const content = template.content.cloneNode(true);
@@ -357,13 +416,12 @@ const popoverTriggers = document.querySelectorAll(selector);
       marginNote.style.top = `${topOffset}px`;
 
       postBody.appendChild(marginNote);
-      createdNotes.push(marginNote);
 
       setupHoverHighlight(markerEl, marginNote);
-      setupClickHighlight(markerEl, marginNote);
     });
 
-    stackOverlappingNotes(createdNotes);
+    // After all notes are created, stack them globally to prevent overlaps
+    stackAllMarginNotesGlobally();
   }
 
   function setupHoverHighlight(marker, note) {
@@ -388,49 +446,35 @@ const popoverTriggers = document.querySelectorAll(selector);
     });
   }
 
+
   /**
-   * Sets up click-to-highlight for margin notes
-   * Clicking a note toggles a persistent highlight class
+   * Stacks all margin notes globally to prevent overlaps across different blocks
+   * This ensures that even if Block 1 has a very long footnote, it won't overlap
+   * with footnotes from Block 2
    */
-  function setupClickHighlight(marker, note) {
-    note.addEventListener('click', (e) => {
-      e.stopPropagation(); // Prevent event bubbling
-
-      // Remove highlight from all other notes
-      document.querySelectorAll('.footnote-margin-note').forEach(n => {
-        if (n !== note) {
-          n.classList.remove('clicked-highlight');
-        }
-      });
+  function stackAllMarginNotesGlobally() {
+    // Find all margin notes in the document
+    const allNotes = Array.from(document.querySelectorAll('.footnote-margin-note'));
 
-      // Toggle highlight on clicked note
-      note.classList.toggle('clicked-highlight');
-    });
-  }
-
-  // Click outside to dismiss highlights
-  document.addEventListener('click', (e) => {
-    // If click is outside any margin note, remove all highlights
-    if (!e.target.closest('.footnote-margin-note')) {
-      document.querySelectorAll('.footnote-margin-note').forEach(note => {
-        note.classList.remove('clicked-highlight');
-      });
-    }
-  });
+    if (allNotes.length === 0) return;
 
-  function stackOverlappingNotes(notes) {
-    const sortedNotes = notes.sort((a, b) => {
-      return parseInt(a.style.top || '0') - parseInt(b.style.top || '0');
+    // Sort by initial top position
+    allNotes.sort((a, b) => {
+      const aTop = parseInt(a.style.top) || 0;
+      const bTop = parseInt(b.style.top) || 0;
+      return aTop - bTop;
     });
 
-    for (let i = 1; i < sortedNotes.length; i++) {
-      const prevNote = sortedNotes[i - 1];
-      const currNote = sortedNotes[i];
+    // Stack with minimum gap of 8px
+    for (let i = 1; i < allNotes.length; i++) {
+      const prevNote = allNotes[i - 1];
+      const currNote = allNotes[i];
 
-      const prevTop = parseInt(prevNote.style.top || '0');
+      const prevTop = parseInt(prevNote.style.top) || 0;
       const prevBottom = prevTop + prevNote.offsetHeight;
-      const currTop = parseInt(currNote.style.top || '0');
+      const currTop = parseInt(currNote.style.top) || 0;
 
+      // If current note would overlap with previous note, push it down
       if (currTop < prevBottom + 8) {
         currNote.style.top = `${prevBottom + 8}px`;
       }
@@ -452,44 +496,20 @@ const popoverTriggers = document.querySelectorAll(selector);
    * - No need to modify article/body widths!
    */
 
-  .footnote-margin-note {
-    position: absolute;
-    left: 100%;           /* Start at right edge of .post-body (708px) */
-    margin-left: 3rem;    /* 48px gap from content (increased from 1.5rem) */
-    width: 10rem;         /* 160px */
-    font-size: 0.75rem;   /* Small text */
-    line-height: 1.5;
-    color: rgb(107 114 128); /* gray-500 */
-    opacity: 0.7;
-    transition: opacity 0.2s ease, color 0.2s ease;
-    pointer-events: auto;
-  }
-
+  /* Highlighted state for margin notes (toggled via JavaScript) */
   .footnote-margin-note.highlighted {
     opacity: 1;
     color: rgb(31 41 55); /* gray-800 */
   }
 
-  /* Clicked highlight state - more prominent than hover */
-  .footnote-margin-note.clicked-highlight {
-    opacity: 1;
-    background-color: rgb(254 243 199); /* yellow-100 */
-    border-left: 3px solid rgb(251 191 36); /* yellow-400 */
-    padding-left: 0.5rem;
-    transition: all 0.2s ease;
-  }
-
-  :global(.dark) .footnote-margin-note {
-    color: rgb(156 163 175); /* gray-400 */
-  }
-
   :global(.dark) .footnote-margin-note.highlighted {
     color: rgb(243 244 246); /* gray-100 */
   }
 
-  :global(.dark) .footnote-margin-note.clicked-highlight {
-    background-color: rgb(113 63 18); /* yellow-900 */
-    border-left-color: rgb(245 158 11); /* yellow-500 */
+  /* Make second child (first content block after <sup>) in blocks-type margin notes display inline with the marker */
+  .footnote-margin-blocks > :nth-child(2) {
+    display: inline !important;
+    margin-top: 0 !important;
   }
 
   @media (max-width: 1023px) {
@@ -508,6 +528,11 @@ const popoverTriggers = document.querySelectorAll(selector);
     }
   }
 
+  /* Hide margin notes when inside PostPreviewFull component (collection full preview pages) */
+  .post-preview-full-container .footnote-margin-note {
+    display: none !important;
+  }
+
   .footnote-marker span.highlighted {
     background-color: rgb(254 249 195); /* yellow-100 */
   }
diff --git a/src/layouts/BlogPost.astro b/src/layouts/BlogPost.astro
index d68847d..8891efe 100644
--- a/src/layouts/BlogPost.astro
+++ b/src/layouts/BlogPost.astro
@@ -7,6 +7,7 @@ import type { Post } from "@/lib/interfaces";
 import type { Heading } from "@/types";
 import PostComments from "@/components/blog/PostComments.astro";
 import { REFERENCES } from "@/constants";
+import { adjustedFootnotesConfig } from "@/lib/notion/client";
 import ReferencesSection from "@/components/blog/references/ReferencesSection.astro";
 import Icon from "@/components/Icon.astro";
 
@@ -15,10 +16,12 @@ interface Props {
 	ogImage?: string;
 	headings: Heading[];
 	shouldUseCache: boolean;
+	footnotesInPage?: any[] | null;
 }
 
-const { post, ogImage, headings, shouldUseCache } = Astro.props;
+const { post, ogImage, headings, shouldUseCache, footnotesInPage } = Astro.props;
 
+// Add Interlinked Content heading to TOC if references exist
 REFERENCES
 	? headings.push({
 			text: "Interlinked Content",
@@ -27,6 +30,18 @@ REFERENCES
 		})
 	: headings;
 
+// Add Footnotes heading to TOC if footnotes exist and generate-footnotes-section is true
+if (adjustedFootnotesConfig?.['in-page-footnotes-settings']?.enabled &&
+    adjustedFootnotesConfig?.['in-page-footnotes-settings']?.['generate-footnotes-section'] &&
+    footnotesInPage &&
+    footnotesInPage.length > 0) {
+	headings.push({
+		text: "Footnotes",
+		slug: "autogenerated-footnotes",
+		depth: 1,
+	});
+}
+
 const socialImage = ogImage ? ogImage : `/og-image/${post.Slug}.png`;
 const articleDate = new Date(post.Date).toISOString();
 ---
diff --git a/src/lib/blog-helpers.ts b/src/lib/blog-helpers.ts
index 9f331fc..6f0bdd9 100644
--- a/src/lib/blog-helpers.ts
+++ b/src/lib/blog-helpers.ts
@@ -682,4 +682,60 @@ export const isEmbeddableURL = async (url: URL): Promise<boolean> => {
 		console.error("Error checking URL:", error);
 		return false;
 	}
+}
+
+/**
+ * Load cached HTML for a post
+ * @param postSlug - The slug of the post
+ * @param shouldUseCache - Whether to attempt to load cache
+ * @returns The cached HTML string or empty string if not found
+ */
+export async function loadCachedHtml(postSlug: string, shouldUseCache: boolean): Promise<string> {
+	if (!shouldUseCache) return "";
+
+	const cacheFilePath = path.join(BUILD_FOLDER_PATHS["blocksHtmlCache"], `${postSlug}.html`);
+	try {
+		return await fs.promises.readFile(cacheFilePath, "utf-8");
+	} catch (e) {
+		return ""; // Fallback to rendering if cache read fails
+	}
+}
+
+/**
+ * Load cached headings for a post
+ * @param postSlug - The slug of the post
+ * @param postLastUpdatedBeforeLastBuild - Whether the post was updated before last build
+ * @returns The cached headings or null if not found
+ */
+export async function loadCachedHeadings(
+	postSlug: string,
+	postLastUpdatedBeforeLastBuild: boolean,
+): Promise<any | null> {
+	if (!postLastUpdatedBeforeLastBuild) return null;
+
+	const headingsCacheDir = BUILD_FOLDER_PATHS["headingsCache"];
+	const headingsCacheFile = path.join(headingsCacheDir, `${postSlug}.json`);
+
+	try {
+		const headingsData = await fs.promises.readFile(headingsCacheFile, "utf-8");
+		return superjson.parse(headingsData);
+	} catch (e) {
+		return null; // Fallback to building headings if cache read fails
+	}
+}
+
+/**
+ * Save headings to cache
+ * @param postSlug - The slug of the post
+ * @param headings - The headings to save
+ */
+export async function saveCachedHeadings(postSlug: string, headings: any): Promise<void> {
+	const headingsCacheDir = BUILD_FOLDER_PATHS["headingsCache"];
+	const headingsCacheFile = path.join(headingsCacheDir, `${postSlug}.json`);
+
+	try {
+		await fs.promises.writeFile(headingsCacheFile, superjson.stringify(headings), "utf-8");
+	} catch (e) {
+		console.error("Error saving headings cache:", e);
+	}
 };
diff --git a/src/lib/footnotes.ts b/src/lib/footnotes.ts
index ffa61b0..4dacae2 100644
--- a/src/lib/footnotes.ts
+++ b/src/lib/footnotes.ts
@@ -32,79 +32,13 @@ import { OPTIMIZE_IMAGES } from "../constants";
 // ============================================================================
 // Configuration and Validation
 // ============================================================================
-
-/**
- * Default configuration for footnotes
- */
-export const DEFAULT_FOOTNOTES_CONFIG: FootnotesConfig = {
-	allFootnotesPageSlug: "_all-footnotes",
-	pageSettings: {
-		enabled: false,
-		source: {
-			"end-of-block": true,
-			"start-of-child-blocks": false,
-			"block-comments": false,
-		},
-		markerPrefix: "ft_",
-		generateFootnotesSection: false,
-		intextDisplay: {
-			alwaysPopup: true,
-			smallPopupLargeMargin: false,
-		},
-	},
-};
-
-/**
- * Normalizes footnotes configuration from constants-config.json
- */
-export function normalizeFootnotesConfig(rawConfig: any): FootnotesConfig {
-	if (!rawConfig || typeof rawConfig !== "object") {
-		return DEFAULT_FOOTNOTES_CONFIG;
-	}
-
-	const inPageSettings = rawConfig["in-page-footnotes-settings"] || {};
-
-	// Handle block-inline-text-comments: treat as block-comments (forward-looking feature)
-	// If block-inline-text-comments is enabled, treat it as block-comments
-	// The permission check will then handle fallback to end-of-block if no permission
-	const blockCommentsEnabled =
-		inPageSettings.source?.["block-comments"] === true ||
-		inPageSettings.source?.["block-inline-text-comments"] === true;
-
-	return {
-		allFootnotesPageSlug:
-			rawConfig["all-footnotes-page-slug"] ||
-			DEFAULT_FOOTNOTES_CONFIG.allFootnotesPageSlug,
-		pageSettings: {
-			enabled: inPageSettings.enabled === true,
-			source: {
-				"end-of-block": inPageSettings.source?.["end-of-block"] === true,
-				"start-of-child-blocks":
-					inPageSettings.source?.["start-of-child-blocks"] === true,
-				"block-comments": blockCommentsEnabled,
-			},
-			markerPrefix:
-				inPageSettings["marker-prefix"] ||
-				DEFAULT_FOOTNOTES_CONFIG.pageSettings.markerPrefix,
-			generateFootnotesSection:
-				inPageSettings["generate-footnotes-section"] === true,
-			intextDisplay: {
-				alwaysPopup: inPageSettings["intext-display"]?.["always-popup"] === true,
-				smallPopupLargeMargin:
-					inPageSettings["intext-display"]?.["small-popup-large-margin"] ===
-					true,
-			},
-		},
-	};
-}
-
 /**
  * Determines which source type is active (only one can be active at a time)
  */
 function getActiveSource(
 	config: FootnotesConfig
 ): "end-of-block" | "start-of-child-blocks" | "block-comments" | null {
-	const source = config.pageSettings.source;
+	const source = config["in-page-footnotes-settings"].source;
 	if (source["end-of-block"]) return "end-of-block";
 	if (source["start-of-child-blocks"]) return "start-of-child-blocks";
 	if (source["block-comments"]) return "block-comments";
@@ -651,7 +585,7 @@ function extractEndOfBlockFootnotes(
 ): FootnoteExtractionResult {
 	const locations = getAllRichTextLocations(block);
 	const footnotes: Footnote[] = [];
-	const markerPrefix = config.pageSettings.markerPrefix;
+	const markerPrefix = config["in-page-footnotes-settings"]["marker-prefix"];
 
 	// Find all markers first
 	const markers = findAllFootnoteMarkers(locations, markerPrefix);
@@ -820,7 +754,7 @@ function extractStartOfChildBlocksFootnotes(
 ): FootnoteExtractionResult {
 	const locations = getAllRichTextLocations(block);
 	const footnotes: Footnote[] = [];
-	const markerPrefix = config.pageSettings.markerPrefix;
+	const markerPrefix = config["in-page-footnotes-settings"]["marker-prefix"];
 
 	// Find all markers
 	const markers = findAllFootnoteMarkers(locations, markerPrefix);
@@ -1016,7 +950,7 @@ async function extractBlockCommentsFootnotes(
 ): Promise<FootnoteExtractionResult> {
 	const locations = getAllRichTextLocations(block);
 	const footnotes: Footnote[] = [];
-	const markerPrefix = config.pageSettings.markerPrefix;
+	const markerPrefix = config["in-page-footnotes-settings"]["marker-prefix"];
 
 	// Find all markers in the block
 	const markers = findAllFootnoteMarkers(locations, markerPrefix);
@@ -1176,15 +1110,6 @@ export function extractFootnotesFromBlock(
 	block: Block,
 	config: FootnotesConfig
 ): FootnoteExtractionResult {
-	// Check if footnotes are enabled
-	if (!config.pageSettings.enabled) {
-		return {
-			footnotes: [],
-			hasProcessedRichTexts: false,
-			hasProcessedChildren: false,
-		};
-	}
-
 	const source = getActiveSource(config);
 
 	switch (source) {
@@ -1226,15 +1151,6 @@ export async function extractFootnotesFromBlockAsync(
 	config: FootnotesConfig,
 	notionClient?: any
 ): Promise<FootnoteExtractionResult> {
-	// Check if footnotes are enabled
-	if (!config.pageSettings.enabled) {
-		return {
-			footnotes: [],
-			hasProcessedRichTexts: false,
-			hasProcessedChildren: false,
-		};
-	}
-
 	const source = getActiveSource(config);
 
 	switch (source) {
@@ -1252,3 +1168,78 @@ export async function extractFootnotesFromBlockAsync(
 			};
 	}
 }
+
+/**
+ * Extracts all footnotes from all blocks in a page (recursively)
+ * Returns an array of all unique footnotes with their assigned indices
+ * This is used to cache footnotes for the page
+ */
+export function extractFootnotesInPage(blocks: Block[]): Footnote[] {
+	const allFootnotes: Footnote[] = [];
+	let footnoteIndex = 0;
+
+	function collectFromBlock(block: Block): void {
+		// Collect footnotes from this block
+		if (block.Footnotes && block.Footnotes.length > 0) {
+			block.Footnotes.forEach(footnote => {
+				// Assign sequential index if not already assigned
+				if (!footnote.Index) {
+					footnote.Index = ++footnoteIndex;
+				}
+				// Store the block ID where this marker appears (for back-links)
+				if (!footnote.SourceBlockId) {
+					footnote.SourceBlockId = block.Id;
+				}
+				allFootnotes.push(footnote);
+			});
+		}
+
+		// Recursively collect from children
+		const childBlocks = getChildrenBlocks(block);
+		if (childBlocks) {
+			childBlocks.forEach(collectFromBlock);
+		}
+
+		// Collect from column lists
+		if (block.ColumnList?.Columns) {
+			block.ColumnList.Columns.forEach(column => {
+				if (column.Children) {
+					column.Children.forEach(collectFromBlock);
+				}
+			});
+		}
+	}
+
+	// Helper to get children blocks from any block type
+	function getChildrenBlocks(block: Block): Block[] | null {
+		if (block.Paragraph?.Children) return block.Paragraph.Children;
+		if (block.Heading1?.Children) return block.Heading1.Children;
+		if (block.Heading2?.Children) return block.Heading2.Children;
+		if (block.Heading3?.Children) return block.Heading3.Children;
+		if (block.Quote?.Children) return block.Quote.Children;
+		if (block.Callout?.Children) return block.Callout.Children;
+		if (block.Toggle?.Children) return block.Toggle.Children;
+		if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
+		if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
+		if (block.ToDo?.Children) return block.ToDo.Children;
+		if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
+		return null;
+	}
+
+	blocks.forEach(collectFromBlock);
+
+	// Remove duplicates based on Marker
+	const uniqueFootnotes = Array.from(
+		new Map(allFootnotes.map(fn => [fn.Marker, fn])).values()
+	);
+
+	// Sort by Index
+	uniqueFootnotes.sort((a, b) => {
+		if (a.Index && b.Index) {
+			return a.Index - b.Index;
+		}
+		return a.Marker.localeCompare(b.Marker);
+	});
+
+	return uniqueFootnotes;
+}
diff --git a/src/lib/interfaces.ts b/src/lib/interfaces.ts
index 91ad6e2..eb84654 100644
--- a/src/lib/interfaces.ts
+++ b/src/lib/interfaces.ts
@@ -382,6 +382,7 @@ export interface Footnote {
 	Content: FootnoteContent;
 	Index?: number; // Sequential index for display (1, 2, 3...)
 	SourceLocation: "content" | "caption" | "table" | "comment"; // Where it came from
+	SourceBlockId?: string; // ID of the block where the marker appears (for back-links)
 }
 
 /**
@@ -421,19 +422,20 @@ export interface FootnoteMarkerInfo {
  * Configuration for footnotes system
  */
 export interface FootnotesConfig {
-	allFootnotesPageSlug: string; // Legacy system slug
-	pageSettings: {
+	"sitewide-footnotes-page-slug": string; // Legacy system slug
+	"in-page-footnotes-settings": {
 		enabled: boolean;
 		source: {
 			"end-of-block": boolean;
 			"start-of-child-blocks": boolean;
 			"block-comments": boolean;
+			"block-inline-text-comments": boolean;
 		};
-		markerPrefix: string; // e.g., "ft_" → markers like [^ft_a]
-		generateFootnotesSection: boolean; // Collated list at page end
-		intextDisplay: {
-			alwaysPopup: boolean; // Always show as popup
-			smallPopupLargeMargin: boolean; // Responsive: margin on large screens (≥1024px), popup on mobile
+		"marker-prefix": string; // e.g., "ft_" → markers like [^ft_a]
+		"generate-footnotes-section": boolean; // Collated list at page end
+		"intext-display": {
+			"always-popup": boolean; // Always show as popup
+			"small-popup-large-margin": boolean; // Responsive: margin on large screens (≥1024px), popup on mobile
 		};
 	};
 }
diff --git a/src/lib/notion/client.ts b/src/lib/notion/client.ts
index df67bda..190031d 100644
--- a/src/lib/notion/client.ts
+++ b/src/lib/notion/client.ts
@@ -20,7 +20,7 @@ import {
 } from "../../constants";
 import {
 	extractFootnotesFromBlockAsync,
-	normalizeFootnotesConfig,
+	extractFootnotesInPage,
 } from "../../lib/footnotes";
 import type * as responses from "@/lib/notion/responses";
 import type * as requestParams from "@/lib/notion/request-params";
@@ -65,6 +65,7 @@ import type {
 	Reference,
 	NAudio,
 	ReferencesInPage,
+	Footnote,
 } from "@/lib/interfaces";
 // eslint-disable-next-line @typescript-eslint/no-var-requires
 import { Client, APIResponseError } from "@notionhq/client";
@@ -93,51 +94,70 @@ let allTagsWithCountsCache: { name: string; count: number; description: string;
 // null = not checked yet, true = has permission, false = no permission
 let hasCommentsPermission: boolean | null = null;
 
+// Footnotes: Adjusted config (set once at module initialization, includes permission fallback)
+// Export so other files can use the same config
+export let adjustedFootnotesConfig: any = null;
+
 /**
- * Check Comments API permission once per build
- * This is called from getAllBlocksByBlockId the first time it's invoked
+ * Initialize footnotes config once at module load
+ * This checks permissions and applies fallback if needed
  */
-async function ensureCommentsPermissionChecked(): Promise<void> {
-	// If already checked, return immediately
-	if (hasCommentsPermission !== null) {
-		return;
-	}
-
-	// Only check if block-comments source is enabled
+async function initializeFootnotesConfig(): Promise<void> {
+	// If footnotes not enabled, set to empty object
 	if (!IN_PAGE_FOOTNOTES_ENABLED || !FOOTNOTES) {
-		hasCommentsPermission = false; // Mark as checked (not needed)
+		adjustedFootnotesConfig = {};
 		return;
 	}
 
-	const config = normalizeFootnotesConfig(FOOTNOTES);
-	const activeSource = config.pageSettings.source['block-comments'];
-
-	if (!activeSource) {
-		hasCommentsPermission = false; // Mark as checked (not needed)
-		return;
-	}
+	// Check if block-comments is configured (includes block-inline-text-comments for future)
+	const isBlockCommentsConfigured =
+		FOOTNOTES?.["in-page-footnotes-settings"]?.source?.["block-comments"] === true ||
+		FOOTNOTES?.["in-page-footnotes-settings"]?.source?.["block-inline-text-comments"] === true;
 
-	console.log('Footnotes: Checking Comments API permission (block-comments source configured)...');
-	console.log('           The "@notionhq/client warn" below is EXPECTED and means permission is granted.');
+	if (isBlockCommentsConfigured) {
+		// Check permission
+		console.log('Footnotes: Checking Comments API permission (block-comments source configured)...');
+		console.log('           The "@notionhq/client warn" below is EXPECTED and means permission is granted.');
 
-	try {
-		await client.comments.list({ block_id: "00000000-0000-0000-0000-000000000000" });
-		hasCommentsPermission = true;
-		console.log('Footnotes: ✓ Permission confirmed - block-comments source available.');
-	} catch (error: any) {
-		if (error?.status === 403 || error?.code === 'restricted_resource') {
-			hasCommentsPermission = false;
-			console.log('Footnotes: ✗ Permission denied - falling back to end-of-block source.');
-		} else {
-			// Any other error (object_not_found, validation_error) = has permission
+		try {
+			await client.comments.list({ block_id: "00000000-0000-0000-0000-000000000000" });
 			hasCommentsPermission = true;
 			console.log('Footnotes: ✓ Permission confirmed - block-comments source available.');
+			adjustedFootnotesConfig = FOOTNOTES;
+		} catch (error: any) {
+			if (error?.status === 403 || error?.code === 'restricted_resource') {
+				hasCommentsPermission = false;
+				console.log('Footnotes: ✗ Permission denied - falling back to end-of-block source.');
+				// Create fallback config
+				adjustedFootnotesConfig = {
+					...FOOTNOTES,
+					"in-page-footnotes-settings": {
+						...FOOTNOTES["in-page-footnotes-settings"],
+						source: {
+							...FOOTNOTES["in-page-footnotes-settings"].source,
+							"block-comments": false,
+							"block-inline-text-comments": false,
+							"end-of-block": true,
+						}
+					}
+				};
+			} else {
+				hasCommentsPermission = true;
+				console.log('Footnotes: ✓ Permission confirmed - block-comments source available.');
+				adjustedFootnotesConfig = FOOTNOTES;
+			}
 		}
+	} else {
+		// No permission check needed
+		adjustedFootnotesConfig = FOOTNOTES;
 	}
 }
 
 const BUILDCACHE_DIR = BUILD_FOLDER_PATHS["buildcache"];
 async function getResolvedDataSourceId(): Promise<string> {
+	// Initialize config once at module load
+	await initializeFootnotesConfig();
+
 	if (resolvedDataSourceId) {
 		return resolvedDataSourceId;
 	}
@@ -333,19 +353,24 @@ export async function getPostByPageId(pageId: string): Promise<Post | null> {
 
 export async function getPostContentByPostId(
 	post: Post,
-): Promise<{ blocks: Block[]; referencesInPage: ReferencesInPage[] | null }> {
+): Promise<{ blocks: Block[]; referencesInPage: ReferencesInPage[] | null; footnotesInPage: Footnote[] | null }> {
 	const tmpDir = BUILD_FOLDER_PATHS["blocksJson"];
 	const cacheFilePath = path.join(tmpDir, `${post.PageId}.json`);
 	const cacheReferencesInPageFilePath = path.join(
 		BUILD_FOLDER_PATHS["referencesInPage"],
 		`${post.PageId}.json`,
 	);
+	const cacheFootnotesInPageFilePath = path.join(
+		BUILD_FOLDER_PATHS["footnotesInPage"],
+		`${post.PageId}.json`,
+	);
 	const isPostUpdatedAfterLastBuild = LAST_BUILD_TIME
 		? post.LastUpdatedTimeStamp > LAST_BUILD_TIME
 		: true;
 
 	let blocks: Block[];
 	let referencesInPage: ReferencesInPage[] | null;
+	let footnotesInPage: Footnote[] | null = null;
 
 	if (!isPostUpdatedAfterLastBuild && fs.existsSync(cacheFilePath)) {
 		// If the post was not updated after the last build and cache file exists, return the cached data
@@ -361,19 +386,50 @@ export async function getPostContentByPostId(
 				"utf-8",
 			);
 		}
+		// Load or extract footnotes (only if footnotes are enabled)
+		if (adjustedFootnotesConfig?.["in-page-footnotes-settings"]?.enabled) {
+			if (fs.existsSync(cacheFootnotesInPageFilePath)) {
+				footnotesInPage = superjson.parse(fs.readFileSync(cacheFootnotesInPageFilePath, "utf-8"));
+				// Still need to update blocks with indices in case blocks cache is old
+				extractFootnotesInPage(blocks);
+			} else {
+				footnotesInPage = extractFootnotesInPage(blocks);
+				fs.writeFileSync(
+					cacheFootnotesInPageFilePath,
+					superjson.stringify(footnotesInPage),
+					"utf-8",
+				);
+				// Re-save blocks cache with updated footnote indices
+				fs.writeFileSync(cacheFilePath, superjson.stringify(blocks), "utf-8");
+			}
+		}
 	} else {
 		// If the post was updated after the last build or cache does not exist, fetch new data
 		blocks = await getAllBlocksByBlockId(post.PageId);
-		// Write the new data to the cache file
+
+		// Extract footnotes first (this assigns Index and SourceBlockId to block.Footnotes in place)
+		// Only if footnotes are enabled
+		if (adjustedFootnotesConfig?.["in-page-footnotes-settings"]?.enabled) {
+			footnotesInPage = extractFootnotesInPage(blocks);
+		}
+
+		// Now write blocks to cache (with updated footnote indices)
 		fs.writeFileSync(cacheFilePath, superjson.stringify(blocks), "utf-8");
+
+		// Extract and save references
 		referencesInPage = extractReferencesInPage(post.PageId, blocks);
 		fs.writeFileSync(cacheReferencesInPageFilePath, superjson.stringify(referencesInPage), "utf-8");
+
+		// Save footnotes cache (only if footnotes are enabled)
+		if (adjustedFootnotesConfig?.["in-page-footnotes-settings"]?.enabled && footnotesInPage) {
+			fs.writeFileSync(cacheFootnotesInPageFilePath, superjson.stringify(footnotesInPage), "utf-8");
+		}
 	}
 
 	// Update the blockIdPostIdMap
 	updateBlockIdPostIdMap(post.PageId, blocks);
 
-	return { blocks, referencesInPage };
+	return { blocks, referencesInPage, footnotesInPage };
 }
 
 function formatUUID(id: string): string {
@@ -492,36 +548,6 @@ export async function getAllBlocksByBlockId(blockId: string): Promise<Block[]> {
 
 	const allBlocks = await Promise.all(results.map((blockObject) => _buildBlock(blockObject)));
 
-	// Check Comments API permission once (cached for entire build)
-	await ensureCommentsPermissionChecked();
-
-	// Prepare footnotes config with permission-based fallback
-	let adjustedFootnotesConfig = null;
-	if (IN_PAGE_FOOTNOTES_ENABLED && FOOTNOTES) {
-		const footnotesConfig = normalizeFootnotesConfig(FOOTNOTES);
-
-		// If block-comments is enabled but no permission, create a modified copy
-		if (footnotesConfig.pageSettings.source['block-comments'] && !hasCommentsPermission) {
-			console.warn(
-				'Footnotes: block-comments source enabled but permission denied. Falling back to end-of-block source.'
-			);
-			// Create a new config object with modified source settings
-			adjustedFootnotesConfig = {
-				...footnotesConfig,
-				pageSettings: {
-					...footnotesConfig.pageSettings,
-					source: {
-						...footnotesConfig.pageSettings.source,
-						'block-comments': false,
-						'end-of-block': true,
-					},
-				},
-			};
-		} else {
-			adjustedFootnotesConfig = footnotesConfig;
-		}
-	}
-
 	for (let i = 0; i < allBlocks.length; i++) {
 		const block = allBlocks[i];
 
@@ -556,7 +582,7 @@ export async function getAllBlocksByBlockId(blockId: string): Promise<Block[]> {
 		// Extract footnotes AFTER children are fetched
 		// This is critical for start-of-child-blocks mode which needs the Children array populated
 		try {
-			if (adjustedFootnotesConfig) {
+			if (adjustedFootnotesConfig && adjustedFootnotesConfig["in-page-footnotes-settings"]?.enabled) {
 				const extractionResult = await extractFootnotesFromBlockAsync(
 					block,
 					adjustedFootnotesConfig,
diff --git a/src/pages/posts/[slug].astro b/src/pages/posts/[slug].astro
index e215de6..4268071 100644
--- a/src/pages/posts/[slug].astro
+++ b/src/pages/posts/[slug].astro
@@ -7,16 +7,18 @@ import {
 	resetFirstImage,
 	setCurrentHeadings,
 	setTrackCurrentPageId,
+	getReferencesInPage,
+	loadCachedHtml,
+	loadCachedHeadings,
+	saveCachedHeadings,
 } from "@/lib/blog-helpers";
 import { getAllPosts, getPostContentByPostId, processFileBlocks } from "@/lib/notion/client";
-import { getReferencesInPage } from "@/lib/blog-helpers";
 import type { Post } from "@/lib/interfaces";
 import { buildHeadings } from "@/utils";
-import { BUILD_FOLDER_PATHS, LAST_BUILD_TIME, FOOTNOTES } from "@/constants";
+import { LAST_BUILD_TIME } from "@/constants";
+import { adjustedFootnotesConfig } from "@/lib/notion/client";
 import type { Block } from "@/lib/interfaces";
-import fs from "fs/promises";
-import path from "path";
-import superjson from "superjson";
+import FootnotesSection from "@/components/blog/FootnotesSection.astro";
 
 export async function getStaticPaths() {
 	const posts = await getAllPosts();
@@ -89,94 +91,32 @@ if (!post) {
 
 // Load cached HTML only if shouldUseCache is true
 let cachedHtml = "";
-if (postFound && shouldUseCache) {
-	const cacheFilePath = path.join(BUILD_FOLDER_PATHS["blocksHtmlCache"], `${post.Slug}.html`);
-	try {
-		cachedHtml = await fs.readFile(cacheFilePath, "utf-8");
-	} catch (e) {
-		cachedHtml = ""; // Fallback to rendering if cache read fails
-	}
+if (postFound) {
+	cachedHtml = await loadCachedHtml(post.Slug, shouldUseCache);
 }
 
+// Load cached headings if available
 let cachedHeadings = null;
-const headingsCacheDir = BUILD_FOLDER_PATHS["headingsCache"];
-if (postFound && postLastUpdatedBeforeLastBuild) {
-	const headingsCacheFile = path.join(headingsCacheDir, `${post.Slug}.json`);
-	try {
-		const headingsData = await fs.readFile(headingsCacheFile, "utf-8");
-		cachedHeadings = superjson.parse(headingsData);
-	} catch (e) {
-		cachedHeadings = null; // Fallback to building headings if cache read fails
-	}
-}
-
-// Helper function to get children from a block
-function getChildrenFromBlock(block: Block): Block[] | null {
-	if (block.Paragraph?.Children) return block.Paragraph.Children;
-	if (block.Heading1?.Children) return block.Heading1.Children;
-	if (block.Heading2?.Children) return block.Heading2.Children;
-	if (block.Heading3?.Children) return block.Heading3.Children;
-	if (block.Quote?.Children) return block.Quote.Children;
-	if (block.Callout?.Children) return block.Callout.Children;
-	if (block.Toggle?.Children) return block.Toggle.Children;
-	if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
-	if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
-	if (block.ToDo?.Children) return block.ToDo.Children;
-	if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
-	return null;
+if (postFound) {
+	cachedHeadings = await loadCachedHeadings(post.Slug, postLastUpdatedBeforeLastBuild);
 }
 
-// Function to assign footnote indices recursively
-function assignFootnoteIndices(blocks: Block[], footnoteNumber: { value: number }): void {
-	blocks.forEach(block => {
-		if (block.Footnotes && block.Footnotes.length > 0) {
-			block.Footnotes.forEach(footnote => {
-				footnote.Index = footnoteNumber.value++;
-			});
-		}
-
-		// Recursively process children
-		const children = getChildrenFromBlock(block);
-		if (children && children.length > 0) {
-			assignFootnoteIndices(children, footnoteNumber);
-		}
-
-		// Process column lists
-		if (block.ColumnList?.Columns) {
-			block.ColumnList.Columns.forEach(column => {
-				if (column.Children) {
-					assignFootnoteIndices(column.Children, footnoteNumber);
-				}
-			});
-		}
-	});
-}
+let footnotesInPage = null;
 
 if (postFound) {
 	const result = await getPostContentByPostId(post);
 	blocks = result.blocks;
 	referencesInPage = result.referencesInPage;
-
-	// Assign footnote indices if generate-footnotes-section OR margin mode is enabled
-	const generateSection = FOOTNOTES?.['in-page-footnotes-settings']?.['generate-footnotes-section'];
-	const isMarginMode = FOOTNOTES?.['in-page-footnotes-settings']?.['intext-display']?.['small-popup-large-margin'];
-	if ((generateSection || isMarginMode) && blocks) {
-		const footnoteNumber = { value: 1 };
-		assignFootnoteIndices(blocks, footnoteNumber);
-	}
+	footnotesInPage = result.footnotesInPage;
 
 	// Use cached headings if available, otherwise build and save them
 	if (cachedHeadings) {
 		headings = cachedHeadings;
 	} else {
 		headings = buildHeadings(blocks);
-		const headingsCacheFile = path.join(headingsCacheDir, `${post.Slug}.json`);
-		try {
-			await fs.writeFile(headingsCacheFile, superjson.stringify(headings), "utf-8");
-		} catch (e) {
-			console.error("Error saving headings cache:", e);
-		}
+		await saveCachedHeadings(post.Slug, headings);
 	}
+
 	setCurrentHeadings(headings);
 
 	// Process file blocks only if cache isn't used
@@ -199,18 +139,22 @@ if (postFound) {
 
 {
 	postFound && resetFirstImage() && setTrackCurrentPageId(post.PageId) && (
-		<PostLayout post={post} headings={headings} shouldUseCache={shouldUseCache}>
-			{shouldUseCache && cachedHtml ? (
-				<div
-					class="post-body max-w-[708px] print:max-w-full"
-					data-html-type="cached"
-					set:html={cachedHtml}
-				/>
-			) : (
-				<div class="post-body max-w-[708px] print:max-w-full" data-html-type="new">
-					<NotionBlocks blocks={blocks} />
-				</div>
-			)}
+		<PostLayout post={post} headings={headings} shouldUseCache={shouldUseCache} footnotesInPage={footnotesInPage}>
+			<div class="post-body max-w-[708px] print:max-w-full" data-html-type={shouldUseCache && cachedHtml ? "cached" : "new"}>
+				{shouldUseCache && cachedHtml ? (
+					<div set:html={cachedHtml} />
+				) : (
+					<>
+						<NotionBlocks blocks={blocks} />
+						{/* Footnotes section - only render when NOT using cache (cached HTML already includes it) */}
+						{adjustedFootnotesConfig?.['in-page-footnotes-settings']?.enabled &&
+						 adjustedFootnotesConfig?.['in-page-footnotes-settings']?.['generate-footnotes-section'] &&
+						 footnotesInPage && (
+							<FootnotesSection footnotes={footnotesInPage} />
+						)}
+					</>
+				)}
+			</div>
 		</PostLayout>
 	)
 }
