import type { ExternalContentDescriptor, ExternalContentType } from "@/lib/interfaces";
import { EXTERNAL_CONTENT_CONFIG } from "../../constants";

const KNOWN_EXTERNAL_TYPES: ExternalContentType[] = ["html", "markdown", "mdx"];

function normalizePrefix(prefix: string): string {
	return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

function extractFolderName(externalUrl: string, prefix: string): string | null {
	const trimmed = externalUrl.slice(prefix.length).replace(/^\/+/, "");
	if (!trimmed) return null;
	const [folderName] = trimmed.split(/[\\/]/);
	return folderName?.trim() || null;
}

export function resolveExternalContentDescriptor(
	externalUrl: string | null,
): ExternalContentDescriptor | null {
	if (!externalUrl || !EXTERNAL_CONTENT_CONFIG.enabled) {
		return null;
	}

	for (const source of EXTERNAL_CONTENT_CONFIG.sources) {
		const prefix = normalizePrefix(source.externalUrlPrefix);
		if (!externalUrl.startsWith(prefix)) {
			continue;
		}
		const folderName = extractFolderName(externalUrl, prefix);
		if (!folderName) {
			console.warn(
				`[external-content] Could not determine folder name from External URL "${externalUrl}". Expected a folder after "${source.externalUrlPrefix}".`,
			);
			return null;
		}

		const type = source.id as ExternalContentType;
		if (!KNOWN_EXTERNAL_TYPES.includes(type)) {
			return null;
		}

		return {
			type,
			sourceId: source.id,
			folderName,
		};
	}

	return null;
}
