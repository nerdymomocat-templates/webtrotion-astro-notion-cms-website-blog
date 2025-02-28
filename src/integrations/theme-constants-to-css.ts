import fs from "node:fs";
import type { AstroIntegration } from "astro";
import config from "../../constants-config.json";
const key_value_from_json = { ...config };
const theme_config = key_value_from_json["theme"];

// Helper function that normalizes a color string to hex format
function normalizeColor(value: string): string {
  // If it's already a hex color (3 or 6 digits), return it directly.
  if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
    return value;
  }
  // Otherwise assume it's a space-separated RGB string
  const parts = value.trim().split(/\s+/).map(Number);
  if (parts.length >= 3) {
    const toHex = (num: number): string => {
      const hex = num.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`;
  }
  // If the format is unexpected, return the original value as a fallback
  return value;
}

export default (): AstroIntegration => ({
  name: "theme-constants-to-css",
  hooks: {
    "astro:build:start": async () => {
      const defaultSans = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
      const defaultSerif = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
      const defaultMono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

      const theme_config_font_fonts = key_value_from_json["theme"]["fontfamily-google-fonts"];
      const sansFontName = theme_config_font_fonts?.["sans-font-name"] || "";
      const serifFontName = theme_config_font_fonts?.["serif-font-name"] || "";
      const monoFontName = theme_config_font_fonts?.["mono-font-name"] || "";

      const fontSans = sansFontName ? `"${sansFontName}", ${defaultSans}` : defaultSans;
      const fontSerif = serifFontName ? `"${serifFontName}", ${defaultSerif}` : defaultSerif;
      const fontMono = monoFontName ? `"${monoFontName}", ${defaultMono}` : defaultMono;

      const customColors = {
        ngray: {
          "txt-light": "#787774",
          "txt-dark": "#9B9B9B",
          "bg-light": "#F1F1EF",
          "bg-dark": "#2F2F2F",
          "bg-tag-light": "#E3E2E0",
          "bg-tag-dark": "#5A5A5A",
          "table-header-bg-light": "#F7F6F3",
          "table-header-bg-dark": "#FFFFFF",
          "callout-border-light": "#DFDFDE",
          "callout-border-dark": "#373737",
        },
        nlgray: {
          "bg-tag-light": "#F1F1F0",
          "bg-tag-dark": "#373737",
        },
        nbrown: {
          "txt-light": "#9F6B53",
          "txt-dark": "#BA856F",
          "bg-light": "#F4EEEE",
          "bg-dark": "#4A3228",
          "bg-tag-light": "#EEE0DA",
          "bg-tag-dark": "#603B2C",
        },
        norange: {
          "txt-light": "#D9730D",
          "txt-dark": "#C77D48",
          "bg-light": "#FBECDD",
          "bg-dark": "#5C3B23",
          "bg-tag-light": "#FADEC9",
          "bg-tag-dark": "#854C1D",
        },
        nyellow: {
          "txt-light": "#CB912F",
          "txt-dark": "#CA9849",
          "bg-light": "#FBEDD6",
          "bg-dark": "#56452F",
          "bg-tag-light": "#F9E4BC",
          "bg-tag-dark": "#835E33",
        },
        ngreen: {
          "txt-light": "#448361",
          "txt-dark": "#529E72",
          "bg-light": "#EDF3EC",
          "bg-dark": "#243D30",
          "bg-tag-light": "#DBEDDB",
          "bg-tag-dark": "#2B593F",
        },
        nblue: {
          "txt-light": "#337EA9",
          "txt-dark": "#5E87C9",
          "bg-light": "#E7F3F8",
          "bg-dark": "#143A4E",
          "bg-tag-light": "#D3E5EF",
          "bg-tag-dark": "#28456C",
        },
        npurple: {
          "txt-light": "#9065B0",
          "txt-dark": "#9D68D3",
          "bg-light": "#F7F3F8",
          "bg-dark": "#3C2D49",
          "bg-tag-light": "#E8DEEE",
          "bg-tag-dark": "#492F64",
        },
        npink: {
          "txt-light": "#C14C8A",
          "txt-dark": "#9D68D3",
          "bg-light": "#FBF2F5",
          "bg-dark": "#4E2C3C",
          "bg-tag-light": "#F5E0E9",
          "bg-tag-dark": "#69314C",
        },
        nred: {
          "txt-light": "#D44C47",
          "txt-dark": "#DF5452",
          "bg-light": "#FDEBEC",
          "bg-dark": "#522E2A",
          "bg-tag-light": "#FFE2DD",
          "bg-tag-dark": "#6E3630",
        },
      };

      let colorDefinitions = "";
      for (const [group, shades] of Object.entries(customColors)) {
        for (const [shade, value] of Object.entries(shades)) {
          colorDefinitions += `  --color-${group}-${shade}: ${value};\n`;
        }
      }

      const createCssVariables = (theme) => {
        let cssContent = "";
        for (const key in theme_config.colors) {
          let color = theme_config.colors[key][theme];
          let cssValue;
          // If no color is defined, use defaults in hex format
          if (!color) {
            cssValue = key.includes("bg")
              ? theme === "light" ? "#ffffff" : "#000000"
              : theme === "light" ? "#000000" : "#ffffff";
          } else {
            // Normalize the provided color value to hex
            cssValue = normalizeColor(color);
          }
          cssContent += `    --theme-${key}: ${cssValue};\n`;
        }
        return cssContent;
      };

      let cssContent = `@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: ${fontSans};
  --font-serif: ${fontSerif};
  --font-mono: ${fontMono};
  --color-bgColor: var(--theme-bg);
  --color-textColor: var(--theme-text);
  --color-link: var(--theme-link);
  --color-accent: var(--theme-accent);
  --color-accent-2: var(--theme-accent-2);
  --color-quote: var(--theme-quote);
${colorDefinitions}
}

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

    @variant sm {
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
    @apply blur-none opacity-100;
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
}

@layer components {
  .site-page-link {
    @apply underline decoration-wavy decoration-from-font decoration-accent-2/20 hover:decoration-accent-2/40 underline-offset-2 hover:underline;
  }

  .title {
    @apply text-3xl font-bold text-accent-2;
  }
}

@utility transition-height {
  transition-property: height;
}`;

      const cssOutputPath = "src/styles/global.css";
      fs.writeFileSync(cssOutputPath, cssContent);
    },
  },
});
