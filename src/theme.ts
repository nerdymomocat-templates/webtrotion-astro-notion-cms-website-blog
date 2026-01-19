import { THEME } from "@/constants";
import { DEFAULT_PRESET, THEME_PRESETS } from "@/themes";

export type FontStack = "sans" | "serif" | "mono" | "accent";
export type NavHighlightType = "gradient" | "underline" | "solidBlock" | "pillBg";

export interface ColorMixTokens {
	blockquoteBg: number;
	fabBg: number;
	fabBorder: number;
	fabText: number;
	inlineHighlight: number;
	anchorHash: number;
	navGrad: { a: number; b: number; c: number };
	navGradDark: { a: number; b: number; c: number };
	navActive: { a: number; b: number; c: number };
	heroTintTop: number;
	heroTintBottom: number;
	cardPlaceholder: { a: number; b: number };
	cardImageBorder: number;
}

export interface ModeValue {
	light: string;
	dark: string;
}

export interface DerivedColors {
	surface1: string;
	surface2: string;
	border: string;
	mutedText: string;
	inlineCodeBg: ModeValue;
	inlineCodeText: ModeValue;
	tableBorder: ModeValue;
	searchDialogBorder: string;
	buttonMutedBg: ModeValue;
}

export interface TypographyTokens {
	bodyFont: FontStack;
	headingFont: FontStack;
	navFont: FontStack;
	codeFont: FontStack;
}

export interface FontSizeTokens {
	root: string;
	rootSm: string;
	title: string;
	h1: string;
	h2: string;
	h3: string;
	body: string;
	small: string;
	xs: string;
	inlineCode: string;
	cardPlaceholder: string;
	datatableFilterIcon: string;
	mdxH1: string;
	mdxH2: string;
	mdxH3: string;
}

export interface FontWeightTokens {
	normal: string;
	medium: string;
	semibold: string;
	bold: string;
	heading: string;
	nav: string;
	tableHeader: string;
	chip: string;
}

export interface LetterSpacingTokens {
	heading: string;
	nav: string;
	chip: string;
}

export interface TextTransformTokens {
	heading: string;
	nav: string;
	chip: string;
	tableHeader: string;
}

export interface LineHeightTokens {
	body: string;
	heading: string;
	mdxH1: string;
	mdxH2: string;
	mdxH3: string;
	list: string;
	callout: string;
	todo: string;
	bookmarkTitle: string;
	bookmarkMeta: string;
}

export interface SpacingTokens {
	pageMaxWidth: string;
	pagePaddingX: string;
	pagePaddingTop: string;
	scrollMarginTop: string;
	h1: { mt: string; mb: string };
	h2: { mt: string; mb: string };
	h3: { mt: string; mb: string };
	text: { my: string; minHeight: string };
	list: { gap: string; pl: string };
	columnList: { my: string; gapX: string };
	columnBasis: string;
	divider: { my: string; height: string };
	codeBlock: { padding: string; mb: string; maxHeight: string };
	codeLine: { bleedWidth: string; bleedMl: string; bleedPl: string; bleedPr: string };
	codeMarker: { left: string; width: string };
	codeFocus: { ml: string; pl: string };
	highlightWord: { px: string; mx: string };
	blockquote: { my: string; px: string; py: string; borderWidth: string };
	callout: { my: string; px: string; py: string; iconMr: string };
	table: { pb: string; cellPadding: string };
	bookmark: {
		padding: string;
		titleHeight: string;
		descHeight: string;
		captionMt: string;
		iconMr: string;
		iconSize: string;
	};
	file: { padding: string; previewMl: string };
	tag: { px: string };
	badge: { ml: string; px: string; py: string };
	image: { figureMt: string };
	todo: { pl: string; gap: string; checkboxMt: string; checkboxPr: string; checkboxSize: string };
	toc: {
		right: string;
		topSm: string;
		visualTop: string;
		visualWidth: string;
		visualPadding: string;
		visualGap: string;
		panelRight: string;
		panelWidth: string;
		panelMaxHeight: string;
		panelMaxHeightSm: string;
		panelPadding: string;
	};
	iconButton: { size: string; sizeSm: string; fontSize: string };
	header: { paddingStartSm: string; mb: string };
	layout: { bleedMlLg: string; bleedWidthLg: string };
	nav: {
		dropdownTop: string;
		dropdownInsetX: string;
		dropdownPy: string;
		gapYMobile: string;
		gapXLg: string;
	};
	footer: {
		pt: string;
		pb: string;
		navGapX: string;
		navBorderWidth: string;
		linkPx: string;
		linkPy: string;
	};
	searchDialog: {
		mtSm: string;
		maxHeightSm: string;
		minHeightSm: string;
		widthSm: string;
		maxWidthSm: string;
	};
	searchFrame: { padding: string; paddingTop: string; gap: string };
	gallery: { gap: string };
	card: { imageAspect: string; tagsPb: string; authorsMt: string };
	hero: { minHeight: string; padding: string; mb: string };
	mdx: {
		paragraphMb: string;
		listMt: string;
		listMb: string;
		listMs: string;
		listPs: string;
		listItemMy: string;
		listItemPs: string;
		blockquoteMy: string;
		blockquotePx: string;
		blockquotePy: string;
		codePx: string;
		codePy: string;
		codeMy: string;
		headingMt: string;
		headingMb: string;
	};
	datatable: {
		inputPx: string;
		inputPy: string;
		filterTogglePx: string;
		filterRowMaxHeight: string;
		topMb: string;
		cellPaddingMultiplier: string;
		sorterPr: string;
		sorterIconTop: string;
	};
	popover: { maxWidthGutter: string };
	marginNote: { px: string; mx: string };
	pagefind: { underlineHeight: string; underlineGap: string; underlineGapHover: string };
}

export interface RadiusTokens {
	sm: string;
	md: string;
	lg: string;
	xl: string;
	"2xl": string;
	full: string;
	code: string;
	card: string;
	tag: string;
	badge: string;
	blockquoteRight: string;
	navHighlight: string;
}

export interface BorderTokens {
	default: string;
	blockquote: string;
	footerNav: string;
	focus: string;
	focusRing: string;
	searchDialog: string;
	dividerStyle: string;
}

export interface ShadowTokens {
	sm: string;
	md: string;
	lg: string;
	xl: string;
	tocPanel: string;
	card: string;
	fab: string;
}

export interface EffectTokens {
	codeUnfocusedBlur: string;
	backdropBlurSm: string;
	backdropBlurMd: string;
}

export interface OpacityTokens {
	codeUnfocused: number;
	highlighted: number;
	hidden: number;
	hoverDim: number;
	secondaryText: number;
	bodyMuted: number;
	iconMuted: number;
	icon: number;
	dialogSurface: number;
}

export interface MotionTokens {
	cardImageHoverScale: number;
	iconHoverScale: number;
	cardHoverBrightness: number;
	toggleOpenRotate: string;
	toTopHiddenTranslateY: string;
}

export interface DurationTokens {
	fast: string;
	medium: string;
	slow: string;
	navHighlight: string;
	hashReveal: string;
	cardHover: string;
}

export interface EasingTokens {
	standard: string;
	inOut: string;
}

export interface UnderlineTokens {
	style: string;
	thickness: string;
	offset: string;
	offsetHover: string;
	annotationStyle: string;
	mdxThickness: string;
	mdxOffset: string;
}

export interface AnchorTokens {
	hashContent: string;
	hashMl: string;
	hashMlToggle: string;
	hashOpacityHidden: number;
	hashOpacityShown: number;
}

export interface NavStyleTokens {
	highlightType: NavHighlightType;
	highlightPosition: string;
	highlight: {
		insetX: string;
		height: string;
		heightActive: string;
		bottom: string;
	};
	footerHighlight: {
		bottom: string;
		height: string;
		heightActive: string;
	};
}

export interface PinnedTokens {
	size: string;
	color: string;
	rotate: string;
	hasBackground: boolean;
	bgColor?: string;
	bgRadius?: string;
	bgSize?: string;
	hasGlass: boolean;
	glassBlur?: string;
	glassBg?: string;
}

export interface IconMapping {
	[key: string]: string;
}

export interface ThemePreset {
	name: string;
	colors: DerivedColors;
	mix: ColorMixTokens;
	typography: TypographyTokens;
	fontSize: FontSizeTokens;
	fontWeight: FontWeightTokens;
	letterSpacing: LetterSpacingTokens;
	textTransform: TextTransformTokens;
	lineHeight: LineHeightTokens;
	spacing: SpacingTokens;
	radius: RadiusTokens;
	border: BorderTokens;
	shadow: ShadowTokens;
	effect: EffectTokens;
	opacity: OpacityTokens;
	motion: MotionTokens;
	duration: DurationTokens;
	easing: EasingTokens;
	underline: UnderlineTokens;
	anchor: AnchorTokens;
	nav: NavStyleTokens;
	pinned: PinnedTokens;
	icons: IconMapping;
}

export const resolveThemePresetName = (presetOverride?: string) => {
	const configPreset = (THEME?.preset as string | undefined) || DEFAULT_PRESET;
	const rawPreset = (presetOverride || configPreset || DEFAULT_PRESET).toLowerCase();
	return (rawPreset in THEME_PRESETS ? rawPreset : DEFAULT_PRESET) as keyof typeof THEME_PRESETS;
};

export const resolveTheme = (presetOverride?: string): ThemePreset => {
	const presetKey = resolveThemePresetName(presetOverride);
	return THEME_PRESETS[presetKey] ?? THEME_PRESETS[DEFAULT_PRESET];
};

export const getFontStackValue = (stack: FontStack): string => {
	switch (stack) {
		case "serif":
			return "var(--font-serif)";
		case "mono":
			return "var(--font-mono)";
		case "accent":
			return "var(--font-accent)";
		case "sans":
		default:
			return "var(--font-sans)";
	}
};

export const getTextToSVGPath = (name: string): string => {
	const theme = resolveTheme();
	return theme.icons[name] || "";
};
