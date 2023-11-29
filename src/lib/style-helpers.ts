// eslint-disable-next-line prettier/prettier
export const convertToTailwindColor = (s: string) => {
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

export const convertToTailwindColorForBorder = (s: string) => {
  // Convert snake_case to kebab-case
  const kebabCase = s.replaceAll("_", "-");

  // Unified mapping of custom colors to Tailwind classes for text and background colors
  const colorMap = {
    // Background color classes
    'gray-background': 'border-gray-200 dark:border-gray-800',
    'brown-background': 'border-amber-200 dark:border-amber-800', // No exact brown in Tailwind, using amber
    'orange-background': 'border-orange-200 dark:border-orange-800',
    'yellow-background': 'border-yellow-200 dark:border-yellow-800',
    'green-background': 'bg-emerald-200 dark:border-emerald-800',
    'blue-background': 'border-sky-200 dark:border-sky-800',
    'purple-background': 'border-purple-200 dark:border-purple-800',
    'pink-background': 'border-pink-200 dark:border-pink-800',
    'red-background': 'border-red-200 dark:border-red-800',
    'default-background': 'border-gray-200 dark:border-gray-800',
  };

  // Return the Tailwind color classes, defaulting to the input if no mapping is found
  return colorMap[kebabCase];
};

export const textToAstroIcon = (text: string) => {
  const textIconMap = {
    "🗓️": "mdi:calendar-blank",
    "download": "mdi:download-circle",
    "copy-code": "mdi:content-copy",
    "copied-to-clipboard": "mdi:clipboard-check",
    "rss": "mdi:rss",
    "dblp": "simple-icons:dblp",
    "email": "mdi:email",
    "github": "mdi:github",
    "googlescholar": "simple-icons:google-scholar",
    "linkedin": "mdi:linkedin",
    "facebook": "mdi:facebook",
    "twitter": "mdi:twitter",
    // "threads": "simple-icons:threads",
    "instagram": "mdi:instagram",
    "mastodon": "mdi:mastodon",
    "semanticscholar": "simple-icons:semantic-scholar",
    "this-github-repo": "mdi:github-face",
    "page-mention-ne-arrow": "mdi:arrow-top-right-thin-circle-outline",
    "document": "mdi:file-document",

  }
  if (text in textIconMap) {
    return textIconMap[text];
  }
  return "";
}
