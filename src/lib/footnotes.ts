/**
 * Footnotes Extraction System
 *
 * This module contains ALL footnote extraction logic for Webtrotion.
 * It handles:
 * - End-of-block footnotes ([^ft_a]: content at end of RichText)
 * - Start-of-child-blocks footnotes (child blocks as footnote content)
 * - Block-comments footnotes (Notion comments as footnote content)
 *
 * Key principles:
 * - Preserve ALL RichText formatting (bold, italic, colors, etc.)
 * - Process at BUILD-TIME only (in client.ts)
 * - Components have ZERO logic, only render pre-processed data
 */

import type {
	Block,
	RichText,
	Footnote,
	FootnoteContent,
	FootnotesConfig,
	FootnoteExtractionResult,
	FootnoteMarkerInfo,
	RichTextLocation,
	Mention,
	Reference,
} from "./interfaces";
import { downloadFile, isConvImageType } from "./notion/client";
import { buildTimeFilePath } from "./blog-helpers";
import { OPTIMIZE_IMAGES } from "../constants";

// ============================================================================
// Configuration and Validation
// ============================================================================

/**
 * Default configuration for footnotes
 */
export const DEFAULT_FOOTNOTES_CONFIG: FootnotesConfig = {
	allFootnotesPageSlug: "_all-footnotes",
	pageSettings: {
		enabled: false,
		source: {
			"end-of-block": true,
			"start-of-child-blocks": false,
			"block-comments": false,
		},
		markerPrefix: "ft_",
		generateFootnotesSection: false,
		intextDisplay: {
			alwaysPopup: true,
			smallPopupLargeMargin: false,
		},
	},
};

/**
 * Normalizes footnotes configuration from constants-config.json
 */
export function normalizeFootnotesConfig(rawConfig: any): FootnotesConfig {
	if (!rawConfig || typeof rawConfig !== "object") {
		return DEFAULT_FOOTNOTES_CONFIG;
	}

	const inPageSettings = rawConfig["in-page-footnotes-settings"] || {};

	// Handle block-inline-text-comments: treat as block-comments (forward-looking feature)
	// If block-inline-text-comments is enabled, treat it as block-comments
	// The permission check will then handle fallback to end-of-block if no permission
	const blockCommentsEnabled =
		inPageSettings.source?.["block-comments"] === true ||
		inPageSettings.source?.["block-inline-text-comments"] === true;

	return {
		allFootnotesPageSlug:
			rawConfig["all-footnotes-page-slug"] ||
			DEFAULT_FOOTNOTES_CONFIG.allFootnotesPageSlug,
		pageSettings: {
			enabled: inPageSettings.enabled === true,
			source: {
				"end-of-block": inPageSettings.source?.["end-of-block"] === true,
				"start-of-child-blocks":
					inPageSettings.source?.["start-of-child-blocks"] === true,
				"block-comments": blockCommentsEnabled,
			},
			markerPrefix:
				inPageSettings["marker-prefix"] ||
				DEFAULT_FOOTNOTES_CONFIG.pageSettings.markerPrefix,
			generateFootnotesSection:
				inPageSettings["generate-footnotes-section"] === true,
			intextDisplay: {
				alwaysPopup: inPageSettings["intext-display"]?.["always-popup"] === true,
				smallPopupLargeMargin:
					inPageSettings["intext-display"]?.["small-popup-large-margin"] ===
					true,
			},
		},
	};
}

/**
 * Determines which source type is active (only one can be active at a time)
 */
function getActiveSource(
	config: FootnotesConfig
): "end-of-block" | "start-of-child-blocks" | "block-comments" | null {
	const source = config.pageSettings.source;
	if (source["end-of-block"]) return "end-of-block";
	if (source["start-of-child-blocks"]) return "start-of-child-blocks";
	if (source["block-comments"]) return "block-comments";
	return null;
}

// ============================================================================
// RichText Helper Utilities
// ============================================================================

/**
 * Joins PlainText from RichText array into a single string
 * Used for pattern matching and character position calculations
 *
 * PERFORMANCE: This is called frequently, so results should be cached where possible
 */
export function joinPlainText(richTexts: RichText[]): string {
	return richTexts.map((rt) => rt.PlainText).join("");
}

/**
 * Deep clones a RichText object, preserving all annotation properties
 * CRITICAL: Must preserve Bold, Italic, Color, Code, etc.
 */
export function cloneRichText(richText: RichText): RichText {
	return {
		...richText,
		Text: richText.Text ? { ...richText.Text, Link: richText.Text.Link ? { ...richText.Text.Link } : undefined } : undefined,
		Annotation: { ...richText.Annotation },
		Equation: richText.Equation ? { ...richText.Equation } : undefined,
		Mention: richText.Mention ? { ...richText.Mention } : undefined,
		InternalHref: richText.InternalHref ? { ...richText.InternalHref } : undefined,
	};
}

/**
 * Splits a RichText array at a specific character position
 * Returns the part before and after the split point
 *
 * @param richTexts - Array to split
 * @param splitCharPos - Character position in the concatenated string
 * @returns { before, after } arrays
 */
function splitRichTextsAtCharPosition(
	richTexts: RichText[],
	splitCharPos: number
): { before: RichText[]; after: RichText[] } {
	const before: RichText[] = [];
	const after: RichText[] = [];
	let currentPos = 0;

	for (const richText of richTexts) {
		const length = richText.PlainText.length;
		const rtStart = currentPos;
		const rtEnd = currentPos + length;

		if (splitCharPos <= rtStart) {
			// Entirely after split point
			after.push(richText);
		} else if (splitCharPos >= rtEnd) {
			// Entirely before split point
			before.push(richText);
		} else {
			// Split occurs within this RichText
			const splitOffset = splitCharPos - rtStart;

			// First part (before split)
			if (splitOffset > 0) {
				const beforePart = cloneRichText(richText);
				beforePart.PlainText = richText.PlainText.substring(0, splitOffset);
				if (beforePart.Text) {
					beforePart.Text.Content = beforePart.PlainText;
				}
				before.push(beforePart);
			}

			// Second part (after split)
			if (splitOffset < length) {
				const afterPart = cloneRichText(richText);
				afterPart.PlainText = richText.PlainText.substring(splitOffset);
				if (afterPart.Text) {
					afterPart.Text.Content = afterPart.PlainText;
				}
				after.push(afterPart);
			}
		}

		currentPos += length;
	}

	return { before, after };
}

/**
 * Extracts a character range from RichText array, preserving all annotations
 * This is the KEY function that maintains formatting in footnote content
 *
 * @param richTexts - Source array
 * @param startChar - Start position (inclusive)
 * @param endChar - End position (exclusive)
 * @returns New RichText array with the extracted range
 */
export function extractRichTextRange(
	richTexts: RichText[],
	startChar: number,
	endChar: number
): RichText[] {
	const result: RichText[] = [];
	let currentPos = 0;

	for (const richText of richTexts) {
		const length = richText.PlainText.length;
		const rtStart = currentPos;
		const rtEnd = currentPos + length;

		// Check if this RichText overlaps with the target range
		if (rtEnd > startChar && rtStart < endChar) {
			const sliceStart = Math.max(0, startChar - rtStart);
			const sliceEnd = Math.min(length, endChar - rtStart);
			const slicedText = richText.PlainText.substring(sliceStart, sliceEnd);

			if (slicedText.length > 0) {
				const slicedRichText = cloneRichText(richText);
				slicedRichText.PlainText = slicedText;
				if (slicedRichText.Text) {
					slicedRichText.Text.Content = slicedText;
				}
				result.push(slicedRichText);
			}
		}

		currentPos += length;
	}

	// Trim whitespace from first/last elements
	if (result.length > 0) {
		const first = result[0];
		first.PlainText = first.PlainText.trimStart();
		if (first.Text) first.Text.Content = first.Text.Content.trimStart();

		const last = result[result.length - 1];
		last.PlainText = last.PlainText.trimEnd();
		if (last.Text) last.Text.Content = last.Text.Content.trimEnd();
	}

	return result;
}

// ============================================================================
// Marker Detection and Extraction
// ============================================================================

/**
 * Finds all footnote markers in RichText arrays across a block
 * Returns locations of all markers found
 *
 * Pattern: [^marker_prefix*]
 * Example: [^ft_a], [^ft_b], [^ft_intro]
 */
export function findAllFootnoteMarkers(
	locations: RichTextLocation[],
	markerPrefix: string
): FootnoteMarkerInfo[] {
	const markers: FootnoteMarkerInfo[] = [];
	// Negative lookahead (?!:) ensures we don't match [^ft_a]: (content markers in child blocks)
	// Only match [^ft_a] without a following colon (inline markers)
	const pattern = new RegExp(`\\[\\^${markerPrefix}([a-zA-Z0-9_]+)\\](?!:)`, "g");

	locations.forEach((location) => {
		const fullText = joinPlainText(location.richTexts);
		let match: RegExpExecArray | null;

		while ((match = pattern.exec(fullText)) !== null) {
			const marker = match[1]; // e.g., "a" from "[^ft_a]"
			const fullMarker = match[0]; // e.g., "[^ft_a]"
			const charStart = match.index;
			const charEnd = charStart + fullMarker.length;

			// Find which RichText element this marker is in
			let currentPos = 0;
			let richTextIndex = -1;
			for (let i = 0; i < location.richTexts.length; i++) {
				const len = location.richTexts[i].PlainText.length;
				if (currentPos <= charStart && charStart < currentPos + len) {
					richTextIndex = i;
					break;
				}
				currentPos += len;
			}

			if (richTextIndex >= 0) {
				markers.push({
					Marker: marker,
					FullMarker: fullMarker,
					Location: {
						BlockProperty: location.property,
						RichTextIndex: richTextIndex,
						CharStart: charStart,
						CharEnd: charEnd,
					},
				});
			}
		}
	});

	return markers;
}

/**
 * Gets all RichText array locations within a block
 * This includes content, captions, table cells, etc.
 */
export function getAllRichTextLocations(block: Block): RichTextLocation[] {
	const locations: RichTextLocation[] = [];

	// Helper to add a location
	const addLocation = (
		property: string,
		richTexts: RichText[],
		setter: (newRichTexts: RichText[]) => void
	) => {
		if (richTexts && richTexts.length > 0) {
			locations.push({ property, richTexts, setter });
		}
	};

	// Paragraph
	if (block.Paragraph) {
		addLocation(
			"Paragraph.RichTexts",
			block.Paragraph.RichTexts,
			(rt) => (block.Paragraph!.RichTexts = rt)
		);
	}

	// Headings
	if (block.Heading1) {
		addLocation(
			"Heading1.RichTexts",
			block.Heading1.RichTexts,
			(rt) => (block.Heading1!.RichTexts = rt)
		);
	}
	if (block.Heading2) {
		addLocation(
			"Heading2.RichTexts",
			block.Heading2.RichTexts,
			(rt) => (block.Heading2!.RichTexts = rt)
		);
	}
	if (block.Heading3) {
		addLocation(
			"Heading3.RichTexts",
			block.Heading3.RichTexts,
			(rt) => (block.Heading3!.RichTexts = rt)
		);
	}

	// List items
	if (block.BulletedListItem) {
		addLocation(
			"BulletedListItem.RichTexts",
			block.BulletedListItem.RichTexts,
			(rt) => (block.BulletedListItem!.RichTexts = rt)
		);
	}
	if (block.NumberedListItem) {
		addLocation(
			"NumberedListItem.RichTexts",
			block.NumberedListItem.RichTexts,
			(rt) => (block.NumberedListItem!.RichTexts = rt)
		);
	}

	// ToDo
	if (block.ToDo) {
		addLocation("ToDo.RichTexts", block.ToDo.RichTexts, (rt) => (block.ToDo!.RichTexts = rt));
	}

	// Quote
	if (block.Quote) {
		addLocation(
			"Quote.RichTexts",
			block.Quote.RichTexts,
			(rt) => (block.Quote!.RichTexts = rt)
		);
	}

	// Callout
	if (block.Callout) {
		addLocation(
			"Callout.RichTexts",
			block.Callout.RichTexts,
			(rt) => (block.Callout!.RichTexts = rt)
		);
	}

	// Toggle
	if (block.Toggle) {
		addLocation(
			"Toggle.RichTexts",
			block.Toggle.RichTexts,
			(rt) => (block.Toggle!.RichTexts = rt)
		);
	}

	// Code caption (but NOT Code.RichTexts - code content is excluded)
	if (block.Code?.Caption) {
		addLocation(
			"Code.Caption",
			block.Code.Caption,
			(rt) => (block.Code!.Caption = rt)
		);
	}

	// Media captions
	if (block.NImage?.Caption) {
		addLocation(
			"NImage.Caption",
			block.NImage.Caption,
			(rt) => (block.NImage!.Caption = rt)
		);
	}
	if (block.Video?.Caption) {
		addLocation(
			"Video.Caption",
			block.Video.Caption,
			(rt) => (block.Video!.Caption = rt)
		);
	}
	if (block.NAudio?.Caption) {
		addLocation(
			"NAudio.Caption",
			block.NAudio.Caption,
			(rt) => (block.NAudio!.Caption = rt)
		);
	}
	if (block.File?.Caption) {
		addLocation(
			"File.Caption",
			block.File.Caption,
			(rt) => (block.File!.Caption = rt)
		);
	}

	// Embed and bookmark captions
	if (block.Embed?.Caption) {
		addLocation(
			"Embed.Caption",
			block.Embed.Caption,
			(rt) => (block.Embed!.Caption = rt)
		);
	}
	if (block.Bookmark?.Caption) {
		addLocation(
			"Bookmark.Caption",
			block.Bookmark.Caption,
			(rt) => (block.Bookmark!.Caption = rt)
		);
	}
	if (block.LinkPreview?.Caption) {
		addLocation(
			"LinkPreview.Caption",
			block.LinkPreview.Caption,
			(rt) => (block.LinkPreview!.Caption = rt)
		);
	}

	// Tables - EVERY cell
	if (block.Table?.Rows) {
		block.Table.Rows.forEach((row, rowIndex) => {
			row.Cells.forEach((cell, cellIndex) => {
				addLocation(
					`Table.Rows[${rowIndex}].Cells[${cellIndex}]`,
					cell.RichTexts,
					(rt) => (block.Table!.Rows![rowIndex].Cells[cellIndex].RichTexts = rt)
				);
			});
		});
	}

	return locations;
}

/**
 * Splits RichText arrays at marker positions, creating separate RichText elements for markers
 * Sets IsFootnoteMarker and FootnoteRef properties on marker elements
 */
export function splitRichTextWithMarkers(
	location: RichTextLocation,
	markers: FootnoteMarkerInfo[],
	markerPrefix: string
): RichText[] {
	// Get markers for this specific location, sorted by position (descending for safe splitting)
	const locationMarkers = markers
		.filter((m) => m.Location.BlockProperty === location.property)
		.sort((a, b) => b.Location.CharStart - a.Location.CharStart);

	if (locationMarkers.length === 0) {
		return location.richTexts;
	}

	let result = [...location.richTexts];

	// Split from right to left to avoid position shift issues
	for (const marker of locationMarkers) {
		const { before, after } = splitRichTextsAtCharPosition(
			result,
			marker.Location.CharStart
		);
		const { before: markerPart, after: afterMarker } = splitRichTextsAtCharPosition(
			after,
			marker.FullMarker.length
		);

		// Create footnote marker RichText element
		if (markerPart.length > 0) {
			const markerRichText = markerPart[0];
			markerRichText.IsFootnoteMarker = true;
			markerRichText.FootnoteRef = marker.Marker;
			// Keep original PlainText as marker text for now (will be replaced with † in component)
		}

		result = [...before, ...markerPart, ...afterMarker];
	}

	return result;
}

// ============================================================================
// End-of-Block Extraction
// ============================================================================

/**
 * Extracts footnote definitions from end of RichText array
 * Format: \n\n[^ft_a]: content here\n\n[^ft_b]: more content
 *
 * Returns cleaned content (without definitions) and map of marker -> RichText[]
 *
 * PERFORMANCE: Caches fullText to avoid repeated joinPlainText() calls
 */
export function extractFootnoteDefinitionsFromRichText(
	richTexts: RichText[],
	markerPrefix: string,
	cachedFullText?: string
): {
	cleanedRichTexts: RichText[];
	footnoteDefinitions: Map<string, RichText[]>;
} {
	const fullText = cachedFullText || joinPlainText(richTexts);

	// Find the start of footnote definitions section
	// Pattern: \n\n[^
	const firstDefMatch = fullText.match(/\n\n\[\^/);

	if (!firstDefMatch || firstDefMatch.index === undefined) {
		return { cleanedRichTexts: richTexts, footnoteDefinitions: new Map() };
	}

	const splitPoint = firstDefMatch.index;

	// Split at the first definition
	const { before: mainContent, after: definitionsSection } =
		splitRichTextsAtCharPosition(richTexts, splitPoint);

	// Parse individual footnote definitions from the definitions section
	const definitionsText = fullText.substring(splitPoint);
	const footnoteDefinitions = parseFootnoteDefinitionsFromRichText(
		definitionsSection,
		markerPrefix,
		definitionsText
	);

	return { cleanedRichTexts: mainContent, footnoteDefinitions };
}

/**
 * Parses individual footnote definitions from the definitions section
 * Format: [^ft_a]: content\n\n[^ft_b]: more content
 */
function parseFootnoteDefinitionsFromRichText(
	definitionsRichTexts: RichText[],
	markerPrefix: string,
	definitionsText: string
): Map<string, RichText[]> {
	const definitions = new Map<string, RichText[]>();
	const pattern = new RegExp(
		`\\n\\n\\[\\^${markerPrefix}([a-zA-Z0-9_]+)\\]:\\s*`,
		"g"
	);

	const matches: Array<{ marker: string; start: number; end: number; matchIndex: number }> = [];
	let match: RegExpExecArray | null;

	// Find all definition starts
	while ((match = pattern.exec(definitionsText)) !== null) {
		matches.push({
			marker: match[1],
			start: match.index + match[0].length, // After the "[^ft_a]: " part
			matchIndex: match.index, // Start of "\n\n[^ft_a]:"
			end: -1, // Will be set later
		});
	}

	// Set end positions (before the next "\n\n[^" starts)
	for (let i = 0; i < matches.length; i++) {
		if (i < matches.length - 1) {
			// End at the position where next footnote marker starts (before the \n\n)
			matches[i].end = matches[i + 1].matchIndex;
		} else {
			matches[i].end = definitionsText.length;
		}
	}

	// Extract RichText ranges for each definition
	matches.forEach((m) => {
		const contentRichTexts = extractRichTextRange(
			definitionsRichTexts,
			m.start,
			m.end
		);

		// Skip empty content (edge case handling - silent skip)
		if (
			contentRichTexts.length === 0 ||
			joinPlainText(contentRichTexts).trim() === ""
		) {
			return;
		}

		definitions.set(m.marker, contentRichTexts);
	});

	return definitions;
}

/**
 * Extracts footnotes from end-of-block format
 * Main entry point for end-of-block source type
 */
function extractEndOfBlockFootnotes(
	block: Block,
	config: FootnotesConfig
): FootnoteExtractionResult {
	const locations = getAllRichTextLocations(block);
	const footnotes: Footnote[] = [];
	const markerPrefix = config.pageSettings.markerPrefix;

	// Find all markers first
	const markers = findAllFootnoteMarkers(locations, markerPrefix);
	if (markers.length === 0) {
		return {
			footnotes: [],
			hasProcessedRichTexts: false,
			hasProcessedChildren: false,
		};
	}

	// Performance: Cache fullText for each location
	const fullTextCache = new Map<string, string>();
	locations.forEach((loc) => {
		fullTextCache.set(loc.property, joinPlainText(loc.richTexts));
	});

	// Process each location
	locations.forEach((location) => {
		const cachedText = fullTextCache.get(location.property);

		// Extract footnote definitions as RichText arrays (not strings!)
		const { cleanedRichTexts, footnoteDefinitions } =
			extractFootnoteDefinitionsFromRichText(
				location.richTexts,
				markerPrefix,
				cachedText
			);

		// Create Footnote objects from extracted definitions
		footnoteDefinitions.forEach((contentRichTexts, marker) => {
			const hasMarker = markers.some((m) => m.Marker === marker);
			// Only create footnote if there's a marker in the text (silent skip orphaned definitions)
			if (hasMarker) {
				footnotes.push({
					Marker: marker,
					FullMarker: `[^${markerPrefix}${marker}]`,
					Content: {
						Type: "rich_text",
						RichTexts: contentRichTexts,
					},
					SourceLocation: location.property.includes("Caption")
						? "caption"
						: location.property.includes("Table")
							? "table"
							: "content",
				});
			}
		});

		// Update the location with cleaned RichTexts (definitions removed)
		location.setter(cleanedRichTexts);

		// Split markers in the cleaned RichTexts
		const splitRichTexts = splitRichTextWithMarkers(
			{ ...location, richTexts: cleanedRichTexts },
			markers,
			markerPrefix
		);
		location.setter(splitRichTexts);
	});

	return { footnotes, hasProcessedRichTexts: true, hasProcessedChildren: false };
}

// ============================================================================
// Start-of-Child-Blocks Extraction
// ============================================================================

/**
 * Creates a regex pattern to match footnote content markers
 * Pattern: ^\[^ft_(\w+)\]:\s* matches [^ft_a]: at line start and captures "a"
 */
function createContentPattern(markerPrefix: string): RegExp {
	const escapedPrefix = markerPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^\\[\\^${escapedPrefix}(\\w+)\\]:\\s*`, "gm");
}

/**
 * Gets children array from a block (various block types have children)
 */
function getChildrenFromBlock(block: Block): Block[] | null {
	if (block.Paragraph?.Children) return block.Paragraph.Children;
	if (block.Heading1?.Children) return block.Heading1.Children;
	if (block.Heading2?.Children) return block.Heading2.Children;
	if (block.Heading3?.Children) return block.Heading3.Children;
	if (block.Quote?.Children) return block.Quote.Children;
	if (block.Callout?.Children) return block.Callout.Children;
	if (block.Toggle?.Children) return block.Toggle.Children;
	if (block.BulletedListItem?.Children) return block.BulletedListItem.Children;
	if (block.NumberedListItem?.Children) return block.NumberedListItem.Children;
	if (block.ToDo?.Children) return block.ToDo.Children;
	if (block.SyncedBlock?.Children) return block.SyncedBlock.Children;
	return null;
}

/**
 * Sets children array in a block
 */
function setChildrenInBlock(block: Block, children: Block[]): void {
	if (block.Paragraph) block.Paragraph.Children = children;
	else if (block.Heading1) block.Heading1.Children = children;
	else if (block.Heading2) block.Heading2.Children = children;
	else if (block.Heading3) block.Heading3.Children = children;
	else if (block.Quote) block.Quote.Children = children;
	else if (block.Callout) block.Callout.Children = children;
	else if (block.Toggle) block.Toggle.Children = children;
	else if (block.BulletedListItem) block.BulletedListItem.Children = children;
	else if (block.NumberedListItem) block.NumberedListItem.Children = children;
	else if (block.ToDo) block.ToDo.Children = children;
	else if (block.SyncedBlock) block.SyncedBlock.Children = children;
}

/**
 * Removes marker prefix from start of RichText array
 * Used to clean [^ft_a]: prefix from child block content
 */
function removeMarkerPrefix(
	richTexts: RichText[],
	prefixLength: number
): RichText[] {
	if (richTexts.length === 0 || prefixLength === 0) {
		return richTexts;
	}

	const result = [...richTexts];
	let remaining = prefixLength;

	for (let i = 0; i < result.length && remaining > 0; i++) {
		const richText = result[i];
		const length = richText.PlainText.length;

		if (length <= remaining) {
			// Remove this entire RichText
			result.splice(i, 1);
			remaining -= length;
			i--; // Adjust index after splice
		} else {
			// Truncate this RichText
			const truncated = cloneRichText(richText);
			if (truncated.Text) {
				truncated.Text = {
					...truncated.Text,
					Content: truncated.Text.Content.substring(remaining),
				};
			}
			truncated.PlainText = truncated.PlainText.substring(remaining);
			result[i] = truncated;
			remaining = 0;
		}
	}

	return result;
}

/**
 * Extracts footnotes from start-of-child-blocks format
 * Child blocks at the start are footnote content
 *
 * Format: If block has markers [^ft_a] and [^ft_b], first 2 child blocks
 * should start with [^ft_a]: and [^ft_b]: respectively
 */
function extractStartOfChildBlocksFootnotes(
	block: Block,
	config: FootnotesConfig
): FootnoteExtractionResult {
	const locations = getAllRichTextLocations(block);
	const footnotes: Footnote[] = [];
	const markerPrefix = config.pageSettings.markerPrefix;

	// Find all markers
	const markers = findAllFootnoteMarkers(locations, markerPrefix);

	if (markers.length === 0) {
		return {
			footnotes: [],
			hasProcessedRichTexts: false,
			hasProcessedChildren: false,
		};
	}

	// Count how many markers we found
	const markerCount = markers.length;

	// Get children blocks
	const children = getChildrenFromBlock(block);

	// Scan children to find which ones are footnote blocks (start with [^marker]:)
	// We only check up to markerCount children, but not all may be footnote blocks
	const contentPattern = createContentPattern(markerPrefix);
	const childrenToCheck = children ? children.slice(0, Math.max(markerCount, children.length)) : [];
	const footnoteBlockIndices: number[] = [];
	const remainingChildren: Block[] = [];

	childrenToCheck.forEach((child, index) => {
		const blockLocations = getAllRichTextLocations(child);

		if (blockLocations.length === 0) {
			remainingChildren.push(child);
			return;
		}

		const blockText = joinPlainText(blockLocations[0].richTexts);

		// Reset regex state before each exec
		contentPattern.lastIndex = 0;
		const match = contentPattern.exec(blockText);

		if (!match) {
			remainingChildren.push(child);
			return;
		}

		const marker = match[1];

		// Remove the [^marker]: prefix from the block
		const cleanedRichTexts = removeMarkerPrefix(
			blockLocations[0].richTexts,
			match[0].length
		);
		blockLocations[0].setter(cleanedRichTexts);

		// Create footnote with the entire block (and its descendants) as content
		footnotes.push({
			Marker: marker,
			FullMarker: `[^${markerPrefix}${marker}]`,
			Content: {
				Type: "blocks",
				Blocks: [child],
			},
			SourceLocation: "content",
		});

		footnoteBlockIndices.push(index);
	});

	// Add any remaining children beyond the first markerCount
	if (children && children.length > markerCount) {
		remainingChildren.push(...children.slice(markerCount));
	}

	// Update children to remove footnote blocks
	setChildrenInBlock(block, remainingChildren);

	// Split markers in RichTexts
	locations.forEach((location) => {
		const splitRichTexts = splitRichTextWithMarkers(
			location,
			markers,
			markerPrefix
		);
		location.setter(splitRichTexts);
	});

	return {
		footnotes,
		hasProcessedRichTexts: true,
		hasProcessedChildren: true,
	};
}

// ============================================================================
// Block-Comments Extraction
// ============================================================================

/**
 * Converts Notion API rich_text format to our RichText interface
 * This mirrors the logic from client.ts: _buildRichText()
 */
function convertNotionRichTextToOurFormat(notionRichTexts: any[]): RichText[] {
	return notionRichTexts.map((nrt: any) => {
		const richText: RichText = {
			Annotation: {
				Bold: nrt.annotations?.bold || false,
				Italic: nrt.annotations?.italic || false,
				Strikethrough: nrt.annotations?.strikethrough || false,
				Underline: nrt.annotations?.underline || false,
				Code: nrt.annotations?.code || false,
				Color: nrt.annotations?.color || "default",
			},
			PlainText: nrt.plain_text || "",
			Href: nrt.href,
		};

		if (nrt.type === "text" && nrt.text) {
			richText.Text = {
				Content: nrt.text.content || "",
				Link: nrt.text.link ? { Url: nrt.text.link.url } : undefined,
			};
		}

		// Handle equations if present
		if (nrt.type === "equation" && nrt.equation) {
			richText.Equation = {
				Expression: nrt.equation.expression || "",
			};
		}

		// Handle mentions if present - PROPERLY structured like client.ts does
		if (nrt.type === "mention" && nrt.mention) {
			const mention: Mention = {
				Type: nrt.mention.type,
			};

			if (nrt.mention.type === "page" && nrt.mention.page) {
				const reference: Reference = {
					PageId: nrt.mention.page.id,
					Type: nrt.mention.type,
				};
				mention.Page = reference;
			} else if (nrt.mention.type === "date") {
				// For dates, we need to format them
				// Using simple ISO format since we don't have getFormattedDateWithTime here
				let formatted_date = nrt.mention.date?.start || "Invalid Date";
				if (nrt.mention.date?.end) {
					formatted_date += " to " + nrt.mention.date.end;
				}
				mention.DateStr = formatted_date;
			} else if (
				nrt.mention.type === "link_mention" &&
				nrt.mention.link_mention
			) {
				const linkMention = nrt.mention.link_mention;
				mention.LinkMention = {
					Href: linkMention.href,
					Title: linkMention.title,
					IconUrl: linkMention.icon_url,
					Description: linkMention.description,
					LinkAuthor: linkMention.link_author,
					ThumbnailUrl: linkMention.thumbnail_url,
					Height: linkMention.height,
					IframeUrl: linkMention.iframe_url,
					LinkProvider: linkMention.link_provider,
				};
			} else if (
				nrt.mention.type === "custom_emoji" &&
				nrt.mention.custom_emoji
			) {
				mention.CustomEmoji = {
					Name: nrt.mention.custom_emoji.name,
					Url: nrt.mention.custom_emoji.url,
				};
			}

			richText.Mention = mention;
		}

		return richText;
	});
}

/**
 * Extracts footnotes from Notion block comments
 *
 * PERFORMANCE OPTIMIZATION: Only calls Comments API if markers are found in block.
 * This avoids expensive API calls for blocks without footnote markers.
 */
async function extractBlockCommentsFootnotes(
	block: Block,
	config: FootnotesConfig,
	notionClient?: any
): Promise<FootnoteExtractionResult> {
	const locations = getAllRichTextLocations(block);
	const footnotes: Footnote[] = [];
	const markerPrefix = config.pageSettings.markerPrefix;

	// Find all markers in the block
	const markers = findAllFootnoteMarkers(locations, markerPrefix);

	// OPTIMIZATION: Skip API call if no markers found in this block
	if (markers.length === 0) {
		return {
			footnotes: [],
			hasProcessedRichTexts: false,
			hasProcessedChildren: false,
		};
	}

	// Ensure we have a Notion client
	if (!notionClient || !notionClient.comments) {
		console.warn(
			"Footnotes: Comments API requested but Notion client not available"
		);
		return {
			footnotes: [],
			hasProcessedRichTexts: false,
			hasProcessedChildren: false,
		};
	}

	try {
		// Only fetch comments if we found footnote markers
		// This saves expensive API calls for blocks without footnotes
		const response: any = await notionClient.comments.list({
			block_id: block.Id,
		});

		const comments = response.results || [];
		const contentPattern = createContentPattern(markerPrefix);

		// Process each comment (using for loop to support async/await)
		for (const comment of comments) {
			const richTextArray = comment.rich_text || [];

			if (richTextArray.length === 0) {
				continue;
			}

			// Check if this comment is a footnote (starts with [^marker]:)
			const firstText = richTextArray[0]?.plain_text || "";
			const match = contentPattern.exec(firstText);

			if (!match) {
				continue; // Not a footnote comment
			}

			const marker = match[1];

			// Convert Notion comment rich_text to our RichText format
			const contentRichTexts = convertNotionRichTextToOurFormat(richTextArray);

			// Remove the [^marker]: prefix from first RichText
			const cleanedRichTexts = removeMarkerPrefix(
				contentRichTexts,
				match[0].length
			);

			// Handle attachments (images) - download and convert to local paths
			const attachments: CommentAttachment[] = [];
			if (comment.attachments && comment.attachments.length > 0) {
				for (const attachment of comment.attachments) {
					if (attachment.category === "image" && attachment.file?.url) {
						// Download the image file (same pattern as regular images in client.ts)
						const imageUrl = new URL(attachment.file.url);

						// Download the file to local storage
						await downloadFile(imageUrl);

						// Convert URL to webp if optimizing images (same as client.ts does for NImage)
						let optimizedUrl = attachment.file.url;
						if (isConvImageType(attachment.file.url) && OPTIMIZE_IMAGES) {
							optimizedUrl = attachment.file.url.substring(
								0,
								attachment.file.url.lastIndexOf(".")
							) + ".webp";
						}

						// Convert to local path for display
						const localPath = buildTimeFilePath(new URL(optimizedUrl));

						attachments.push({
							Category: "image",
							Url: localPath, // Store local path, not the remote URL
							ExpiryTime: attachment.file.expiry_time,
						});
					}
				}
			}

			footnotes.push({
				Marker: marker,
				FullMarker: `[^${markerPrefix}${marker}]`,
				Content: {
					Type: "comment",
					RichTexts: cleanedRichTexts,
					CommentAttachments: attachments.length > 0 ? attachments : undefined,
				},
				SourceLocation: "comment",
			});
		}

		// Split markers in RichTexts
		locations.forEach((location) => {
			const splitRichTexts = splitRichTextWithMarkers(
				location,
				markers,
				markerPrefix
			);
			location.setter(splitRichTexts);
		});

		return {
			footnotes,
			hasProcessedRichTexts: true,
			hasProcessedChildren: false,
		};
	} catch (error: any) {
		// Check if this is a permission error (403)
		if (error?.status === 403 || error?.code === 'restricted_resource') {
			console.warn(
				'Footnotes: block-comments source is enabled but Comments API permission is not available. ' +
				'Please grant comment permissions to your Notion integration, or switch to end-of-block or start-of-child-blocks source.'
			);
		} else {
			console.error(
				`Footnotes: Error fetching comments for block ${block.Id}:`,
				error
			);
		}
		// Continue without footnotes rather than failing
		return {
			footnotes: [],
			hasProcessedRichTexts: false,
			hasProcessedChildren: false,
		};
	}
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main entry point for extracting footnotes from a block (SYNCHRONOUS)
 * This handles end-of-block and start-of-child-blocks sources
 *
 * Called from client.ts during block building
 *
 * NOTE: block-comments source requires async (Comments API), so it's handled separately
 */
export function extractFootnotesFromBlock(
	block: Block,
	config: FootnotesConfig
): FootnoteExtractionResult {
	// Check if footnotes are enabled
	if (!config.pageSettings.enabled) {
		return {
			footnotes: [],
			hasProcessedRichTexts: false,
			hasProcessedChildren: false,
		};
	}

	const source = getActiveSource(config);

	switch (source) {
		case "end-of-block":
			return extractEndOfBlockFootnotes(block, config);
		case "start-of-child-blocks":
			return extractStartOfChildBlocksFootnotes(block, config);
		case "block-comments":
			// Block comments require async API calls, not supported in synchronous build
			console.warn(
				"block-comments source requires async processing and is not yet implemented"
			);
			return {
				footnotes: [],
				hasProcessedRichTexts: false,
				hasProcessedChildren: false,
			};
		default:
			return {
				footnotes: [],
				hasProcessedRichTexts: false,
				hasProcessedChildren: false,
			};
	}
}

/**
 * Async version for extracting footnotes with block-comments support
 * Use this when you need Comments API integration
 *
 * NOTE: This requires async block building, which is not currently supported
 * in the synchronous _buildBlock function. To enable block-comments:
 * 1. Make _buildBlock async
 * 2. Update all callers to await _buildBlock()
 * 3. Replace extractFootnotesFromBlock with extractFootnotesFromBlockAsync in client.ts
 */
export async function extractFootnotesFromBlockAsync(
	block: Block,
	config: FootnotesConfig,
	notionClient?: any
): Promise<FootnoteExtractionResult> {
	// Check if footnotes are enabled
	if (!config.pageSettings.enabled) {
		return {
			footnotes: [],
			hasProcessedRichTexts: false,
			hasProcessedChildren: false,
		};
	}

	const source = getActiveSource(config);

	switch (source) {
		case "end-of-block":
			return extractEndOfBlockFootnotes(block, config);
		case "start-of-child-blocks":
			return extractStartOfChildBlocksFootnotes(block, config);
		case "block-comments":
			return await extractBlockCommentsFootnotes(block, config, notionClient);
		default:
			return {
				footnotes: [],
				hasProcessedRichTexts: false,
				hasProcessedChildren: false,
			};
	}
}
