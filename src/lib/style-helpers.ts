// eslint-disable-next-line prettier/prettier
export const getNotionColorToTailwindColor = (s: string) => {
  // Convert snake_case to kebab-case
  const kebabCase = s.replaceAll("_", "-");

  // Unified mapping of custom colors to Tailwind classes for text and background colors
  const colorMap = {
    // Text color classes
    'gray': 'text-ngray-txt-light dark:text-ngray-txt-dark',
    'brown': 'text-nbrown-txt-light dark:text-nbrown-txt-dark',
    'orange': 'text-norange-txt-light dark:text-norange-txt-dark',
    'yellow': 'text-nyellow-txt-light dark:text-nyellow-txt-dark',
    'green': 'text-ngreen-txt-light dark:text-ngreen-txt-dark',
    'blue': 'text-nblue-txt-light dark:text-nblue-txt-dark',
    'purple': 'text-npurple-txt-light dark:text-npurple-txt-dark',
    'pink': 'text-npink-txt-light dark:text-npink-txt-dark',
    'red': 'text-nred-txt-light dark:text-nred-txt-dark',
    'default': '',

    // Background color classes
    'gray-background': 'px-1 rounded bg-ngray-bg-light dark:bg-ngray-bg-dark',
    'brown-background': 'px-1 rounded bg-nbrown-bg-light dark:bg-nbrown-bg-dark',
    'orange-background': 'px-1 rounded bg-norange-bg-light dark:bg-norange-bg-dark',
    'yellow-background': 'px-1 rounded bg-nyellow-bg-light dark:bg-nyellow-bg-dark',
    'green-background': 'px-1 rounded bg-ngreen-bg-light dark:bg-ngreen-bg-dark',
    'blue-background': 'px-1 rounded bg-nblue-bg-light dark:bg-nblue-bg-dark',
    'purple-background': 'px-1 rounded bg-npurple-bg-light dark:bg-npurple-bg-dark',
    'pink-background': 'px-1 rounded bg-npink-bg-light dark:bg-npink-bg-dark',
    'red-background': 'px-1 rounded bg-nred-bg-light dark:bg-nred-bg-dark',
    'default-background': '',
  };

  // Return the Tailwind color classes, defaulting to the input if no mapping is found
  return colorMap[kebabCase];
};

export const getNotionColorToTailwindColorForBorder = (s: string) => {
  // Convert snake_case to kebab-case
  const kebabCase = s.replaceAll("_", "-");

  // Unified mapping of custom colors to Tailwind classes for text and background colors
  const colorMap = {
    // Background color classes
    'gray-background': 'border-gray-200 dark:border-gray-900',
    'brown-background': 'border-amber-200 dark:border-amber-900', // No exact brown in Tailwind, using amber
    'orange-background': 'border-orange-200 dark:border-orange-900',
    'yellow-background': 'border-yellow-200 dark:border-yellow-900',
    'green-background': 'bg-emerald-200 dark:border-emerald-900',
    'blue-background': 'border-sky-200 dark:border-sky-900',
    'purple-background': 'border-purple-200 dark:border-purple-900',
    'pink-background': 'border-pink-200 dark:border-pink-900',
    'red-background': 'border-red-200 dark:border-red-900',
    'default-background': 'border-gray-200 dark:border-gray-700',
    'default': 'border-gray-200 dark:border-gray-700'
  };

  // Return the Tailwind color classes, defaulting to the input if no mapping is found
  return colorMap[kebabCase];
};

export const getIconCssFilter = (iconUrl: string): string | null | undefined => {
  // Regular expression to match the pattern:
  // (1) Any characters after the last underscore
  // (2) Ending with ".svg"
  const regex = /_([^.]+)\.svg$/;
  const match = iconUrl.match(regex);

  // If a match is found, return the captured group, which is the color part.
  // Otherwise, return null if no match is found.
  return match ? match[1] : null;
}

export const getToggleSVGPath = () => {
  return "M 9.2075 8.5912 L 15.8925 12.45 L 9.2075 16.3087 Z";
}

export const getIconTailwindFilterStyle = (url: string): string => {
  // if (!url.startsWith('https://www.notion.so/icons/')) {
  //       return '';
  //   }

  const ncolors = ["gray", "lightgray", "brown", "yellow", "orange", "green", "blue", "purple", "pink","red"]

  // Extract the color name from the URL using regex
  const regex = /_([^.]+)\.svg$/;
  const match = url.match(regex);
  const colorName = match ? match[1] : null;

  if (colorName && ncolors.includes(colorName)) {
      // return `dark:hue-rotate-${colorName} dark:saturate-${colorName} dark:brightness-${colorName}`;
      let hueT = '';
      let saturateT = '';
      let brightnessT = '';
      if (colorName=="lightgray") {hueT='dark:-hue-rotate-30'; saturateT='dark:saturate-0';}
      if (colorName=="gray") {hueT='dark:-hue-rotate-60'; saturateT='dark:saturate-0'; brightnessT = 'dark:brightness-150'}
      return hueT+" "+saturateT+" "+brightnessT;
      //VERY TEMP FIX -- only light gray and gray icons will cause z index issue now because i was returning defaults of saturate-100, hue rotate 0 and brightness-100 before anyway.
    }
  return "";
}

export const isNotionIconURL = (url:string): boolean => {
  return !url.startsWith('https://www.notion.so/icons/');
}


export const getTextToAstroIcon = (text: string) => {
  const textIconMap = {
    "🗓️": "mdi:calendar-blank",
    "download": "mdi:download-circle",
    "copy-code": "ic:twotone-content-copy",
    "copied-to-clipboard": "mdi:clipboard-check",
    "rss": "mdi:rss",
    "dblp": "simple-icons:dblp",
    "email": "mdi:email",
    "github": "mdi:github",
    "googlescholar": "simple-icons:googlescholar",
    "linkedin": "mdi:linkedin",
    "facebook": "mdi:facebook",
    "twitter": "mdi:twitter",
    "threads": "simple-icons:threads",
    "instagram": "mdi:instagram",
    "mastodon": "mdi:mastodon",
    "semanticscholar": "simple-icons:semanticscholar",
    "this-github-repo": "mdi:github-face",
    "page-mention-ne-arrow": "mdi:arrow-top-right-thin-circle-outline",
    "document": "mdi:file-document",
    "expand": "pepicons-print:expand-circle-filled",
    "preview-pdf": "material-symbols:preview",
    "table-of-contents":"mdi:table-of-contents",
    "clear-search":"mdi:format-clear",
    "close-search":"mdi:close-thick",
    "checkbox-blank":"mdi:checkbox-blank-outline",
    "checkbox-checked":"mdi:checkbox-marked",
    "clipboard-copy-code":"mdi:clipboard",
    "clipboard-copy-code-done":"mdi:clipboard-check"
  }
  if (text in textIconMap) {
    return textIconMap[text];
  }
  return "";
}
