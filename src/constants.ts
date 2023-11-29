import config from '../constants-config.json';
const key_value_from_json = { ...config };

import fs from 'fs';
import path from 'path';

export const NOTION_API_SECRET =
  import.meta.env.NOTION_API_SECRET || process.env.NOTION_API_SECRET || "";
export const DATABASE_ID = process.env.DATABASE_ID || key_value_from_json["DATABASE_ID"] || "";
export const AUTHOR = key_value_from_json["AUTHOR"] || "";
export const PUBLIC_GA_TRACKING_ID = key_value_from_json["PUBLIC_GA_TRACKING_ID"] || "";
export const WEBMENTION_API_KEY = import.meta.env.WEBMENTION_API_KEY || process.env.WEBMENTION_API_KEY || key_value_from_json["WEBMENTION_API_KEY"] || "";
export const WEBMENTION_LINK = key_value_from_json["WEBMENTION_LINK"] || "";



export const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || key_value_from_json["CUSTOM_DOMAIN"] || ""; // <- Set your costom domain if you have. e.g. alpacat.com
export const BASE_PATH = process.env.BASE_PATH || key_value_from_json["BASE_PATH"] || ""; // <- Set sub directory path if you want. e.g. /docs/

export const NUMBER_OF_POSTS_PER_PAGE = key_value_from_json["NUMBER_OF_POSTS_PER_PAGE"] || 10;
export const REQUEST_TIMEOUT_MS = parseInt(key_value_from_json["REQUEST_TIMEOUT_MS"] || "10000", 10);
export const ENABLE_LIGHTBOX = key_value_from_json["ENABLE_LIGHTBOX"] || false;
/**
 *  a collection which represent a page
 */
export const MENU_PAGES_COLLECTION = key_value_from_json["MENU_PAGES_COLLECTION"] || "main";

export const HEADING_BLOCKS = key_value_from_json["HEADING_BLOCKS"] || ["heading_1", "heading_2", "heading_3"];

export const PUBLISH_ON_FILTER = key_value_from_json["PUBLISH_ON_FILTER"] || "";

export const FULL_PREVIEW_COLLECTIONS = key_value_from_json["FULL_PREVIEW_COLLECTIONS"] || [];

export const HIDE_UNDERSCORE_SLUGS_IN_LISTS = key_value_from_json["HIDE_UNDERSCORE_SLUGS_IN_LISTS"] || false;

export const HOME_PAGE_SLUG = key_value_from_json["HOME_PAGE_SLUG"] || "home";

export const OG_SETUP = key_value_from_json["OG_SETUP"] || {
  "COLUMNS": 2,
  "EXCERPT": true
};

// export const OPTIMIZE_IMAGES = key_value_from_json["OPTIMIZE_IMAGES"] == null ? true : key_value_from_json["OPTIMIZE_IMAGES"];
export const OPTIMIZE_IMAGES = key_value_from_json["OPTIMIZE_IMAGES"] || false;

export const HTML_DIRECTIVE = key_value_from_json["HTML_DIRECTIVE"] || "";

// Function to read the build start time from the file
const readBuildStartTime = () => {
  const filePath = path.join('./tmp', 'build_start_timestamp.txt');
  if (fs.existsSync(filePath)) {
    const buildTimestampStr = fs.readFileSync(filePath, 'utf8');
    const buildTimestamp = parseInt(buildTimestampStr, 10);
    return new Date(buildTimestamp);
  }
  return null;
};

export const LAST_BUILD_TIME = readBuildStartTime();
console.log('Last Build Start Time:', LAST_BUILD_TIME);
