export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const deepMerge = <T>(base: T, override: DeepPartial<T>): T => {
	if (Array.isArray(base) || Array.isArray(override)) {
		return (override ?? base) as T;
	}
	if (
		typeof base !== "object" ||
		base === null ||
		typeof override !== "object" ||
		override === null
	) {
		return (override ?? base) as T;
	}
	const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
	for (const [key, value] of Object.entries(override)) {
		const baseValue = (base as Record<string, unknown>)[key];
		if (value && typeof value === "object" && !Array.isArray(value)) {
			result[key] = deepMerge(
				baseValue as Record<string, unknown>,
				value as Record<string, unknown>,
			);
		} else if (value !== undefined) {
			result[key] = value;
		}
	}
	return result as T;
};
