import fs from "node:fs";
import type { AstroIntegration } from "astro";
import config from "../../constants-config.json";
const key_value_from_json = { ...config };
const theme_config = key_value_from_json["theme"];
import path from "path";

export default (): AstroIntegration => ({
	name: "theme-constants-to-css",
	hooks: {
		"astro:build:start": async () => {
			// Define the path to the constants-config.json file

			// Function to create CSS variables from the config
			const createCssVariables = (theme) => {
				let cssContent = "";
				for (const key in theme_config.colors) {
					let color = theme_config.colors[key][theme];
					if (!color) {
						if (key.includes("bg")) {
							// Set default background colors
							color = theme === "light" ? "255 255 255" : "0 0 0"; // White for light theme, Black for dark theme
						} else {
							// Set default text and other colors
							color = theme === "light" ? "0 0 0" : "255 255 255"; // Black for light theme, White for dark theme
						}
					}
					cssContent += `    --theme-${key}: ${color};\n`;
				}
				return cssContent;
			};

			// Generate CSS content for light and dark themes
			let cssContent =
`@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
${createCssVariables("light")}
  }

  :root.dark {
    color-scheme: dark;
${createCssVariables("dark")}
  }

  html {
    @apply scroll-smooth;
    font-size: 14px;
    @media screen(sm) {
      font-size: 16px;
    }
  }

  html body {
    @apply mx-auto flex min-h-screen max-w-3xl flex-col bg-bgColor px-8 pt-8 text-textColor antialiased overflow-x-hidden;
  }

  * {
    @apply scroll-mt-10
  }
  pre {
    @apply rounded-md p-4 font-mono;
  }

  /* Common styles for pre elements */
  pre.has-diff,
  pre.has-focused,
  pre.has-highlighted,
  pre.has-diff code,
  pre.has-focused code,
  pre.has-highlighted code {
    @apply inline-block min-w-full;
  }

  /* Styles for diff lines */
  pre.has-diff .line.diff,
  pre.has-highlighted .line.highlighted.error,
  pre.has-highlighted .line.highlighted.warning {
    @apply inline-block w-max min-w-[calc(100%+2rem)] -ml-8 pl-8 pr-4 box-border relative z-0;
  }

  pre.has-diff .line.diff::before {
    @apply content-[''] absolute left-4 top-0 bottom-0 w-4 flex items-center justify-center text-gray-400;
  }

  pre.has-diff .line.diff.remove {
    @apply bg-red-500/20;
  }

  pre.has-diff .line.diff.remove::before {
    @apply content-['-'];
  }

  pre.has-diff .line.diff.add {
    @apply bg-blue-500/20;
  }

  pre.has-diff .line.diff.add::before {
    @apply content-['+'];
  }

  /* Styles for focused lines */
  pre.has-focused .line {
    @apply inline-block w-max min-w-[calc(100%+2rem)] -ml-4 pl-4 pr-4 box-border transition-all duration-300 ease-in-out;
  }

  pre.has-focused .line:not(.focused) {
    @apply blur-[1px] opacity-50;
  }

  pre.has-focused:hover .line:not(.focused) {
    @apply blur-0 opacity-100;
  }

  /* Styles for highlighted lines */
  pre.has-highlighted .line.highlighted {
    @apply inline-block w-max min-w-[calc(100%+2rem)] -ml-4 pl-4 pr-4 box-border bg-gray-500/20;
  }

  /* Styles for highlighted words */
  .highlighted-word {
    @apply bg-gray-500/20 rounded px-1 -mx-[2px];
  }

  pre.has-highlighted .line.highlighted.error::before,
  pre.has-highlighted .line.highlighted.warning::before {
    @apply content-[''] absolute left-4 top-0 bottom-0 w-4 flex items-center justify-center text-gray-400;
  }

  pre.has-highlighted .line.highlighted.error {
    @apply bg-red-500/30;
  }

  pre.has-highlighted .line.highlighted.error::before {
    @apply content-['x'];
  }

  pre.has-highlighted .line.highlighted.warning {
    @apply bg-yellow-500/20;
  }

  pre.has-highlighted .line.highlighted.warning::before {
    @apply content-['!'];
  }
}`;

			// Define the path to the output CSS file
			const cssOutputPath = "src/styles/global.css";
      // Ensure the directory exists
      const dir = path.dirname(cssOutputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

			// Write the CSS content to the file
			fs.writeFileSync(cssOutputPath, cssContent);
		},
	},
});
