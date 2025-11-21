import path from "node:path";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { isRelativePath, toPublicUrl } from "./external-html-utils";

type MdxJsxNode = {
	type: "mdxJsxFlowElement" | "mdxJsxTextElement";
	attributes?: { type: string; name?: string; value?: unknown }[];
};

function getFolderName(filePath: string | undefined): string | null {
	if (!filePath) return null;
	const normalized = filePath.replace(/\\/g, "/");
	const match = normalized.match(/\/src\/external-posts\/([^/]+)\/index\.mdx$/);
	return match?.[1] || null;
}

function rewriteIfRelative(value: unknown, folderName: string): unknown {
	if (typeof value !== "string") return value;
	if (!isRelativePath(value)) return value;
	return toPublicUrl(value, { type: "mdx", sourceId: "external", folderName });
}

function rewriteAttributes(node: MdxJsxNode, folderName: string) {
	if (!Array.isArray(node.attributes)) return;
	for (const attr of node.attributes) {
		if (attr?.type !== "mdxJsxAttribute") continue;
		if (!attr.name || typeof attr.value === "object") continue;
		if (!["src", "href", "poster", "data-src", "dataSrc"].includes(attr.name)) continue;
		attr.value = rewriteIfRelative(attr.value, folderName);
	}
}

export default function remarkExternalMdxAssets() {
	return (tree: Root, file: any) => {
		const folderName = getFolderName(file?.path);
		if (!folderName) return;

		const rewrite = (value: unknown) => rewriteIfRelative(value, folderName);

		visit(tree, ["image", "link", "definition"], (node: any) => {
			if (node && node.url) {
				node.url = rewrite(node.url);
			}
		});

		visit(
			tree,
			(node: any): node is MdxJsxNode =>
				node?.type === "mdxJsxFlowElement" || node?.type === "mdxJsxTextElement",
			(node) => rewriteAttributes(node, folderName),
		);
	};
}
