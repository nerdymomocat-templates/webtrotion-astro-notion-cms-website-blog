// src/components/mdx-components.ts
// Register all components you want to use in MDX buckets here.

import TestComponent from "./TestComponent.astro";
// import AnotherComponent from './AnotherComponent.astro';

export const mdxComponents = {
	// The key is the name you'll use in MDX, e.g., <TestComponent />
	TestComponent,
	// AnotherComponent,
};
