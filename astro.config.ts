import { defineConfig } from "astro/config";
import fs from "fs";
// import { remarkReadingTime } from "./src/utils/remark-reading-time";
import tailwind from "@astrojs/tailwind";
import prefetch from "@astrojs/prefetch";
import path from 'path';
import { CUSTOM_DOMAIN, BASE_PATH } from "./src/constants";
const getSite = function () {
  if (CUSTOM_DOMAIN) {
    return new URL(BASE_PATH, `https://${CUSTOM_DOMAIN}`).toString();
  }
  if (process.env.VERCEL && process.env.VERCEL_URL) {
    return new URL(BASE_PATH, `https://${process.env.VERCEL_URL}`).toString();
  }
  if (process.env.CF_PAGES) {
    if (process.env.CF_PAGES_BRANCH !== 'main') {
      return new URL(BASE_PATH, process.env.CF_PAGES_URL).toString();
    }
    return new URL(BASE_PATH, `https://${new URL(process.env.CF_PAGES_URL).host.split('.').slice(1).join('.')}`).toString();
  }
  if (process.env.GITHUB_PAGES) {
    return new URL(process.env.BASE || BASE_PATH, process.env.SITE).toString();
  }
  return new URL(BASE_PATH, 'http://localhost:4321').toString();
};
import CustomIconDownloader from './src/integrations/custom-icon-downloader';
import FeaturedImageDownloader from './src/integrations/featured-image-downloader';
import PublicNotionCopier from './src/integrations/public-notion-copier';
import buildTimestampRecorder from './src/integrations/build-timestamp-recorder.ts';
import CSSWriter from './src/integrations/theme-constants-to-css';
import robotsTxt from "astro-robots-txt";
import config from "./constants-config.json";
import partytown from "@astrojs/partytown";

const key_value_from_json = {
  ...config
};
function modifyRedirectPaths(redirects: Record<string, string>, basePath: string): Record<string, string> {
  const modifiedRedirects: Record<string, string> = {};
  for (const [key, value] of Object.entries(redirects)) {
    if (basePath && !value.startsWith(basePath) && !value.startsWith('/' + basePath)) {
      modifiedRedirects[key] = path.join(basePath, value);
    } else {
      modifiedRedirects[key] = value;
    }
  }
  return modifiedRedirects;
}
// https://astro.build/config
export default defineConfig({
  site: getSite(),
  base: process.env.BASE || BASE_PATH,
  redirects: key_value_from_json["REDIRECTS"] ? modifyRedirectPaths(key_value_from_json["REDIRECTS"], process.env.BASE || BASE_PATH) : {},
  integrations: [
  // mdx({}),
  tailwind({
    applyBaseStyles: false
  }), prefetch(),
  // astroImageTools,
  buildTimestampRecorder(), CustomIconDownloader(), FeaturedImageDownloader(), PublicNotionCopier(), CSSWriter(), robotsTxt(), partytown({
    // Adds dataLayer.push as a forwarding-event.
    config: {
      forward: ["dataLayer.push"]
    }
  })],
  image: {
    domains: ["webmention.io"]
  },
  vite: {
    plugins: [rawFonts([".ttf"])],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"]
    }
  }
});
function rawFonts(ext: Array<string>) {
  return {
    name: "vite-plugin-raw-fonts",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore:next-line
    transform(_, id) {
      if (ext.some(e => id.endsWith(e))) {
        const buffer = fs.readFileSync(id);
        return {
          code: `export default ${JSON.stringify(buffer)}`,
          map: null
        };
      }
    }
  };
}
