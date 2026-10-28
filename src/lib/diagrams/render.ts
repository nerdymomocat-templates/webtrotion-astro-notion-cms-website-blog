import { randomUUID } from "node:crypto";
import { parse, render } from "pele";
import { parseDocument, DomUtils } from "htmlparser2";
import serialize from "dom-serializer";
import { Element } from "domhandler";
import postcss from "postcss";
import { utils as cssValues } from "@asamuzakjp/css-color";
import { convertDiagramTheme, contrastingTextColor } from "./theme.ts";
import { mathjax } from "@mathjax/src/js/mathjax.js";
import { TeX } from "@mathjax/src/js/input/tex.js";
import { SVG } from "@mathjax/src/js/output/svg.js";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";
import { SafeHandler } from "@mathjax/src/js/ui/safe/SafeHandler.js";
import { MathJaxTexFont } from "@mathjax/mathjax-tex-font/js/svg.js";
import "@mathjax/src/js/input/tex/base/BaseConfiguration.js";
import "@mathjax/src/js/input/tex/ams/AmsConfiguration.js";
import "@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js";
import "@mathjax/src/js/input/tex/noundefined/NoUndefinedConfiguration.js";
import "@mathjax/src/js/input/tex/color/ColorConfiguration.js";

/** Render every Mermaid block at build time while preserving the authored direction. */
export function renderDiagram(
	source: string,
	options: { fontFamily?: string; linkMap?: Record<string, string> } = {},
) {
	const idPrefix = `diagram-${randomUUID()}`;
	const model = parse(source);
	const theme = convertDiagramTheme(source, model.type);
	const linkText = theme.styles["--diagram-node-text"] || theme.styles["--pele-fg"];
	if (linkText) theme.styles["--diagram-link-text"] = linkText;
	// An authored font overrides the website font inherited through Pele's CSS variable.
	if (theme.fontFamily) theme.styles["--pele-font"] = theme.fontFamily;
	const renderOptions = {
		fontFamily: theme.fontFamily || options.fontFamily || "sans-serif",
		...(theme.fontSize ? { fontSize: theme.fontSize } : {}),
		math: renderDiagramMath,
	};
	const wide = render(model, {
		...renderOptions,
		idPrefix: `${idPrefix}-wide`,
		autoDirection: false,
	});
	const document = parseDocument(wide.svg, { xmlMode: true });
	const root = DomUtils.findOne((element) => element.name === "svg", document.children, true)!;
	const baseFontSize = theme.fontSize || 16;
	const labelSizes = DomUtils.findAll(
		(el) => el.name === "text" && Boolean(DomUtils.textContent(el).trim()),
		root.children,
	).map((label) => {
		let element: Element | null = label;
		while (element && element !== root) {
			let size = element.attribs["font-size"];
			if (element.attribs.style)
				postcss.parse(`svg{${element.attribs.style}}`).walkDecls("font-size", (decl) => {
					size = decl.value;
				});
			if (size) {
				const pixels = Number(size.endsWith("px") ? size.slice(0, -2) : size);
				if (Number.isFinite(pixels) && pixels > 0) return pixels;
			}
			element = element.parent && DomUtils.isTag(element.parent) ? element.parent : null;
		}
		return baseFontSize;
	});
	root.attribs["data-diagram-label-size"] = String(Math.min(baseFontSize, ...labelSizes));
	root.attribs.style += Object.entries(theme.styles)
		.map(([key, value]) => `;${key}:${value}`)
		.join("");
	if (theme.styles["--pele-bg"]) root.attribs.style += ";background:var(--pele-bg)";
	const scopes: Record<string, Record<string, string>> = {
		"pele-node": { "--_fg": "--diagram-node-text" },
		"pele-cluster": { "--_b": "--diagram-cluster-border" },
		"pele-edge-label": { "--_bg": "--diagram-edge-label-bg", "--_fg": "--diagram-edge-text" },
		"pele-notes": {
			"--_a": "--diagram-note-bg",
			"--_b": "--diagram-note-border",
			"--_fg": "--diagram-note-text",
		},
		"pele-lifelines": { "--_b": "--diagram-lifeline" },
	};
	const paint = (element: Element, attribute: string, variable: string) => {
		if (theme.styles[variable]) element.attribs[attribute] = `var(${variable})`;
	};
	const seriesText = (fill: string): string | undefined => {
		const variable = cssValues.extractDashedIdent(fill)[0];
		if (variable?.startsWith("--pele-series-"))
			return `var(--diagram-on-series-${variable.slice("--pele-series-".length)})`;
		if (variable === "--_c") return "var(--diagram-on-accent)";
		if (variable === "--pele-critical") return "var(--diagram-on-critical)";
		return undefined;
	};
	for (const element of DomUtils.findAll((el) => Boolean(el.attribs.class), root.children)) {
		for (const className of element.attribs.class!.split(/\s+/)) {
			for (const [local, variable] of Object.entries(scopes[className] || {})) {
				if (theme.styles[variable])
					element.attribs.style = `${element.attribs.style || ""};${local}:var(${variable})`;
			}
			if (className === "pele-node" && theme.styles["--diagram-node-text"]) {
				element.attribs.style += ";color:var(--_fg)";
				paint(element, "fill", "--diagram-node-text");
			}
			if (className === "pele-node" && !theme.hasAuthoredNodeText) {
				const shape = DomUtils.findOne(
					(el) => ["rect", "path", "polygon", "circle", "ellipse"].includes(el.name),
					element.children,
					true,
				);
				let background: string | undefined;
				let opaque = [shape?.attribs["fill-opacity"], shape?.attribs.opacity].every(
					(value) => value === undefined || Number(value) === 1,
				);
				if (shape?.attribs.style)
					postcss.parse(`svg{${shape.attribs.style}}`).walkDecls((decl) => {
						if (decl.prop === "fill") background = decl.value;
						if (["fill-opacity", "opacity"].includes(decl.prop) && Number(decl.value) !== 1)
							opaque = false;
					});
				const textColor = contrastingTextColor(
					opaque ? background : undefined,
					theme.styles["--diagram-node-text"] || theme.styles["--pele-fg"],
				);
				if (textColor)
					for (const label of DomUtils.findAll((el) => el.name === "text", element.children)) {
						let authoredColor = Boolean(label.attribs.fill);
						if (label.attribs.style)
							postcss.parse(`svg{${label.attribs.style}}`).walkDecls((decl) => {
								if (decl.prop === "fill" || decl.prop === "color") authoredColor = true;
							});
						if (!authoredColor) label.attribs.fill = textColor;
					}
			}
			if (className === "pele-edge-label") paint(element, "fill", "--diagram-edge-text");
			if (className === "pele-title" && theme.styles["--diagram-title"])
				element.attribs.fill = "var(--diagram-title)";
			if (className === "pele-slice-labels") paint(element, "fill", "--diagram-pie-label");
			if (className === "pele-legend-item" && model.type === "pie")
				paint(element, "fill", "--diagram-pie-legend");
			if (className === "pele-quadrant") {
				const id = element.attribs["data-id"];
				for (const child of element.children) {
					if (!DomUtils.isTag(child)) continue;
					if (child.name === "rect") paint(child, "fill", `--diagram-quadrant-${id}-fill`);
					if (child.name === "text") paint(child, "fill", `--diagram-quadrant-${id}-text`);
				}
			}
			if (className === "pele-task") {
				const classes = element.attribs.class!.split(/\s+/);
				const status =
					["crit", "done", "active"].find((s) => classes.includes(`pele-${s}`)) || "task";
				for (const child of element.children) {
					if (!DomUtils.isTag(child)) continue;
					if (["rect", "polygon", "path"].includes(child.name)) {
						paint(child, "fill", `--diagram-gantt-${status}-fill`);
						paint(child, "stroke", `--diagram-gantt-${status}-border`);
						if (theme.styles[`--diagram-gantt-${status}-fill`])
							delete child.attribs["fill-opacity"];
					}
					if (child.name === "text") paint(child, "fill", `--diagram-gantt-${status}-text`);
				}
			}
			if (className === "pele-section" && model.type === "gantt")
				paint(element, "fill", "--diagram-gantt-section-bg");
			if (className === "pele-section-label" && model.type === "gantt")
				paint(element, "fill", "--diagram-gantt-section-text");
			if (className === "pele-points" && model.type === "quadrantChart")
				paint(element, "fill", "--diagram-quadrant-point");
			if (className === "pele-branch") {
				const lane = DomUtils.findOne(
					(el) => Boolean(el.attribs.stroke?.includes("--pele-series-")),
					element.children,
					true,
				);
				const seriesVariable = cssValues
					.extractDashedIdent(lane?.attribs.stroke || "")
					.find((name) => name.startsWith("--pele-series-"));
				const index = seriesVariable?.slice("--pele-series-".length);
				if (index)
					for (const label of DomUtils.findAll((el) => el.name === "text", element.children))
						paint(label, "fill", `--diagram-git-label-${index}`);
			}
			if (className === "pele-commit-label" && model.type === "gitGraph")
				paint(element, "fill", "--diagram-git-commit-text");
			if (model.type === "xychart") {
				const horizontal = "orientation" in model && model.orientation === "horizontal";
				const verticalAxis = horizontal ? "x" : "y";
				const horizontalAxis = horizontal ? "y" : "x";
				if (className === "pele-axis-labels") {
					for (const label of DomUtils.findAll((el) => el.name === "text", element.children))
						paint(
							label,
							"fill",
							`--diagram-${label.attribs["text-anchor"] === "end" ? verticalAxis : horizontalAxis}-label`,
						);
				}
				if (className === "pele-axis-titles") {
					for (const label of DomUtils.findAll((el) => el.name === "text", element.children)) {
						const rotated =
							label.parent &&
							DomUtils.isTag(label.parent) &&
							label.parent.attribs.transform?.includes("rotate");
						paint(label, "fill", `--diagram-${rotated ? verticalAxis : horizontalAxis}-title`);
					}
				}
				if (
					className === "pele-axis" &&
					element.name === "path" &&
					element.attribs.d &&
					(theme.styles["--diagram-x-line"] || theme.styles["--diagram-y-line"])
				) {
					// Pele joins both XY axes with absolute M (move-to) commands.
					// Split them so each axis can retain its own authored color.
					const paths = element.attribs.d
						.split("M")
						.slice(1)
						.map((commands) => {
							const d = `M${commands}`;
							const path = new Element("path", { ...element.attribs, d });
							const axis = d.includes("V") || d.includes("h") ? verticalAxis : horizontalAxis;
							paint(path, "stroke", `--diagram-${axis}-line`);
							return path;
						});
					const group = new Element("g", { class: "pele-axis" }, paths);
					for (const path of paths) path.parent = group;
					DomUtils.replaceElement(element, group);
				}
			}
		}
	}
	for (const element of DomUtils.findAll((el) => Boolean(el.attribs.stroke), root.children)) {
		const series = cssValues
			.extractDashedIdent(element.attribs.stroke!)
			.find((name) => name.startsWith("--pele-series-"));
		if (series)
			element.attribs.stroke = `var(--diagram-series-line-${series.slice("--pele-series-".length)})`;
		if (model.type === "timeline" && element.attribs.class === "pele-edge")
			element.attribs.stroke = "var(--_l)";
	}
	// Pele uses the canvas color for labels on solid series fills. Choose each fill's own foreground.
	for (const group of DomUtils.findAll((el) => el.name === "g", root.children)) {
		if (group.attribs.class === "pele-slice-labels") {
			if (theme.hasAuthoredPieText) continue;
			const slices = DomUtils.findAll((el) => el.attribs.class === "pele-slice", root.children);
			const labels = group.children.filter(
				(el): el is Element => DomUtils.isTag(el) && el.name === "text",
			);
			for (const [index, label] of labels.entries()) {
				const foreground = seriesText(slices[index]?.attribs.fill || "");
				if (foreground) label.attribs.fill = foreground;
			}
			continue;
		}
		if (theme.hasAuthoredNodeText) continue;
		const shape = group.children.find(
			(el): el is Element =>
				DomUtils.isTag(el) && ["rect", "polygon", "circle", "ellipse"].includes(el.name),
		);
		if (!shape || Number(shape.attribs["fill-opacity"] ?? 1) !== 1) continue;
		const foreground = seriesText(shape.attribs.fill || "");
		if (!foreground) continue;
		for (const label of group.children)
			if (
				DomUtils.isTag(label) &&
				label.name === "text" &&
				(label.attribs.fill === "var(--_bg)" ||
					(!label.attribs.fill && group.attribs.class?.split(/\s+/).includes("pele-leaf")))
			)
				label.attribs.fill = foreground;
	}
	for (const link of DomUtils.findAll(
		(el) => el.name === "a" && Boolean(el.attribs.href || el.attribs["xlink:href"]),
		root.children,
	)) {
		for (const attribute of ["href", "xlink:href"]) {
			const href = link.attribs[attribute];
			if (href && options.linkMap?.[href]) link.attribs[attribute] = options.linkMap[href]!;
		}
		const href = link.attribs.href || link.attribs["xlink:href"]!;
		const internal = href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//"));
		link.attribs.class = `${link.attribs.class || ""} diagram-link`.trim();
		link.attribs.tabindex = "0";
		for (const label of DomUtils.findAll((el) => el.name === "text", link.children))
			label.attribs.class =
				`${label.attribs.class || ""} site-page-link${internal ? "" : " decoration-solid"}`.trim();
		const styled = DomUtils.findOne(
			(el) => {
				if (!el.attribs.style) return false;
				let hasAuthoredColor = false;
				postcss.parse(`svg{${el.attribs.style}}`).walkDecls((declaration) => {
					if (["fill", "stroke", "color"].includes(declaration.prop)) hasAuthoredColor = true;
				});
				return hasAuthoredColor;
			},
			link.children,
			true,
		);
		if (theme.hasTheme || styled) continue;
		link.attribs.class += " diagram-link-themed";
		for (const child of link.children) {
			if (!DomUtils.isTag(child)) continue;
			if (child.name === "text") child.attribs.fill = "var(--diagram-link-text)";
		}
	}
	wide.svg = serialize(document, { xmlMode: true });
	const svg = parseDocument(wide.svg, { xmlMode: true });
	const searchText = DomUtils.findAll(
		(element) =>
			["text", "title", "desc"].includes(element.name) ||
			element.attribs["data-mml-node"] === "math",
		svg.children,
	)
		.map((element) => element.attribs["data-latex"] || DomUtils.textContent(element))
		.join(" ");

	return { wide, searchText };
}

const adaptor = liteAdaptor();
SafeHandler(RegisterHTMLHandler(adaptor));
const mathDocument = mathjax.document("", {
	InputJax: new TeX({ packages: ["base", "ams", "newcommand", "noundefined", "color"] }),
	OutputJax: new SVG({ fontCache: "none", fontData: MathJaxTexFont }),
	safeOptions: { allow: { URLs: "none", classes: "none", cssIDs: "none", styles: "safe" } },
});

/** Inline SVG paths keep equation labels independent of browser scripts and math fonts. */
function renderDiagramMath(tex: string, size: number) {
	const node = mathDocument.convert(tex, { display: true, em: size, ex: size / 2 });
	const svg = adaptor.tags(node, "svg")[0];
	if (!svg) throw new Error("Unable to typeset the Mermaid math label.");
	const width = (Number.parseFloat(adaptor.getAttribute(svg, "width")) * size) / 2;
	const height = (Number.parseFloat(adaptor.getAttribute(svg, "height")) * size) / 2;
	adaptor.setAttribute(svg, "width", String(width));
	adaptor.setAttribute(svg, "height", String(height));
	adaptor.setAttribute(svg, "aria-label", tex);
	adaptor.removeAttribute(svg, "style");
	return { svg: adaptor.outerHTML(svg), width, height };
}
