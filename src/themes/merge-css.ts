import postcss from "postcss";
import type { Container, ChildNode } from "postcss";

const norm = (s: string | undefined) => (s || "").replace(/\s+/g, " ").trim();

const nodeKey = (n: ChildNode): string | null => {
	if (n.type === "rule") return "R:" + norm(n.selector);
	if (n.type === "atrule") return "A:" + n.name + " " + norm(n.params);
	return null;
};

const findChild = (container: Container, key: string, consumed: Set<number>) => {
	const kids = (container.nodes || []) as ChildNode[];
	for (let i = 0; i < kids.length; i++) {
		if (consumed.has(i)) continue;
		if (nodeKey(kids[i]) === key) return i;
	}
	return -1;
};

// Apply override container nodes onto the base container (mutates base).
// Matching rule/at-rule bodies are replaced wholesale; unmatched nodes are appended.
function mergeContainer(baseC: Container, ovrNodes: ChildNode[]) {
	const consumed = new Set<number>();
	for (const onode of ovrNodes) {
		const key = nodeKey(onode);
		if (!key) continue;
		const bi = findChild(baseC, key, consumed);
		if (bi === -1) {
			baseC.append(onode.clone());
			continue;
		}
		consumed.add(bi);
		const bnode = baseC.nodes![bi] as ChildNode;
		if (onode.type === "atrule" && onode.nodes && bnode.type === "atrule") {
			mergeContainer(bnode, onode.nodes as ChildNode[]);
		} else if ("removeAll" in bnode) {
			(bnode as Container).removeAll();
			for (const c of (onode.nodes || []) as ChildNode[]) (bnode as Container).append(c.clone());
		}
	}
}

/**
 * Merge a theme's override CSS onto the complete base CSS.
 * Override rules replace the body of the matching base rule (matched by
 * at-rule-path + selector); rules with no match are appended. This keeps every
 * base rule intact so themes inherit all features automatically, while letting
 * each theme restyle only the selectors it personalizes.
 */
export function mergeThemeCss(baseCss: string, overrideCss: string): string {
	if (!overrideCss || !overrideCss.trim()) return baseCss;
	const base = postcss.parse(baseCss);
	const ovr = postcss.parse(overrideCss);
	mergeContainer(base, ovr.nodes as ChildNode[]);
	return base.toString();
}
