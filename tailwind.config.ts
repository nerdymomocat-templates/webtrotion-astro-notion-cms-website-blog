import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

import config from './constants-config.json';
const key_value_from_json = { ...config };
const theme_config_font_fonts = key_value_from_json["THEME"]['fontFamily-Google Fonts'];

const fontFamilySans = theme_config_font_fonts && theme_config_font_fonts['sans_font_name'] ? [theme_config_font_fonts['sans_font_name'], ...fontFamily.sans] : [...fontFamily.sans];
const fontFamilySerif = theme_config_font_fonts && theme_config_font_fonts['serif_font_name'] ? [theme_config_font_fonts['serif_font_name'], ...fontFamily.serif] : [...fontFamily.serif];
const fontFamilyMono = theme_config_font_fonts && theme_config_font_fonts['mono_font_name'] ? [theme_config_font_fonts['mono_font_name'], ...fontFamily.mono] : [...fontFamily.mono];


export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}"],
  darkMode: "class",
  corePlugins: {
    // disable aspect ratio as per docs -> @tailwindcss/aspect-ratio
    aspectRatio: false,
    // disable some core plugins as they are included in the css, even when unused
    touchAction: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
    scrollSnapType: false,
    borderOpacity: false,
    textOpacity: false,
    fontVariantNumeric: false,
  },

  theme: {
    extend: {
      colors: {
        bgColor: "rgb(var(--theme-bg) / <alpha-value>)",
        textColor: "rgb(var(--theme-text) / <alpha-value>)",
        link: "rgb(var(--theme-link) / <alpha-value>)",
        accent: "rgb(var(--theme-accent) / <alpha-value>)",
        "accent-2": "rgb(var(--theme-accent-2) / <alpha-value>)",
        quote: "rgb(var(--theme-quote) / <alpha-value>)",
        ngray: {
          'txt-light': '#9B9A97',
          'txt-dark': '#979A9B',
          'bg-light': '#EBECED',
          // 'bg-dark': '#454B4E',
          'bg-dark': '#566670'
        },
        nbrown: {
          'txt-light': '#64473A',
          'txt-dark': '#937264',
          'bg-light': '#ede4df',
          // 'bg-dark': '#434040',
          'bg-dark': '#514E4B'
        },
        norange: {
          'txt-light': '#D9730D',
          'txt-dark': '#FFA344',
          'bg-light': '#FAEBDD',
          // 'bg-dark': '#594A3A',
          'bg-dark': '#70544A'
        },
        nyellow: {
          'txt-light': '#DFAB01',
          'txt-dark': '#FFDC49',
          'bg-light': '#FBF3DB',
          // 'bg-dark': '#59563B',
          'bg-dark': '#707049'
        },
        ngreen: {
          'txt-light': '#0F7B6C',
          'txt-dark': '#4DAB9A',
          'bg-light': '#DDEDEA',
          // 'bg-dark': '#354C4B',
          'bg-dark': '#41706A'
        },
        nblue: {
          'txt-light': '#0B6E99',
          'txt-dark': '#529CCA',
          'bg-light': '#DDEBF1',
          // 'bg-dark': '#364954',
          'bg-dark': '#41727A'
        },
        npurple: {
          'txt-light': '#6940A5',
          'txt-dark': '#9A6DD7',
          'bg-light': '#EAE4F2',
          // 'bg-dark': '#443F57',
          'bg-dark': '#5A5672'
        },
        npink: {
          'txt-light': '#AD1A72',
          'txt-dark': '#E255A1',
          'bg-light': '#F4DFEB',
          // 'bg-dark': '#533B4C',
          'bg-dark': '#6A4C64'
        },
        nred: {
          'txt-light': '#E03E3E',
          'txt-dark': '#FF7369',
          'bg-light': '#FBE4E4',
          // 'bg-dark': '#594141',
          'bg-dark': '#6A4545'
        },
      },
      fontFamily: {
        // Add any custom fonts here
        sans: fontFamilySans,
        serif: fontFamilySerif,
        mono: fontFamilyMono
      },
      transitionProperty: {
        height: "height",
      }
    },
  },
  plugins: [
    // require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    plugin(function ({ addComponents }) {
      addComponents({
        ".cactus-link": {
          "@apply bg-[size:100%_6px] bg-bottom bg-repeat-x": {},
          backgroundImage:
            "linear-gradient(transparent,transparent 5px,rgb(var(--theme-text)) 5px,rgb(var(--theme-text)))",
          "&:hover": {
            backgroundImage:
              "linear-gradient(transparent,transparent 4px,rgb(var(--theme-link)) 4px,rgb(var(--theme-link)))",
          },
        },
        ".title": {
          "@apply text-2xl font-semibold text-accent-2": {},
        },
      });
    }),
  ],
} satisfies Config;
