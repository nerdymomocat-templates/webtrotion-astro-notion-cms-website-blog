// eslint-disable-next-line prettier/prettier
export const convertToTailwindColor = (s: string) => {
  // Convert snake_case to kebab-case
  const kebabCase = s.replaceAll("_", "-");

  // Unified mapping of custom colors to Tailwind classes for text and background colors
  const colorMap = {
    // Text color classes
    'gray': 'text-gray-800 dark:text-gray-300',
    'brown': 'text-amber-800 dark:text-amber-300', // No exact brown in Tailwind, using yellow
    'orange': 'text-orange-800 dark:text-orange-300',
    'yellow': 'text-yellow-800 dark:text-yellow-300',
    'green': 'text-emerald-800 dark:text-emerald-300',
    'blue': 'text-sky-800 dark:text-sky-300',
    'purple': 'text-purple-800 dark:text-purple-300',
    'pink': 'text-pink-800 dark:text-pink-300',
    'red': 'text-red-800 dark:text-red-300',
    'default': '',

    // Background color classes
    'gray-background': 'px-1 rounded bg-gray-50 dark:bg-gray-900',
    'brown-background': 'px-1 rounded bg-amber-50 dark:bg-amber-900', // No exact brown in Tailwind, using amber
    'orange-background': 'px-1 rounded bg-orange-50 dark:bg-orange-900',
    'yellow-background': 'px-1 rounded bg-yellow-50 dark:bg-yellow-900',
    'green-background': 'px-1 rounded bg-emerald-50 dark:bg-emerald-900',
    'blue-background': 'px-1 rounded bg-sky-50 dark:bg-sky-900',
    'purple-background': 'px-1 rounded bg-purple-50 dark:bg-purple-900',
    'pink-background': 'px-1 rounded bg-pink-50 dark:bg-pink-500',
    'red-background': 'px-1 rounded bg-red-50 dark:bg-red-900',
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
    'gray-background': 'border-gray-200 dark:border-gray-700',
    'brown-background': 'border-amber-200 dark:border-amber-700', // No exact brown in Tailwind, using amber
    'orange-background': 'border-orange-200 dark:border-orange-700',
    'yellow-background': 'border-yellow-200 dark:border-yellow-700',
    'green-background': 'bg-emerald-200 dark:border-emerald-700',
    'blue-background': 'border-sky-200 dark:border-sky-700',
    'purple-background': 'border-purple-200 dark:border-purple-700',
    'pink-background': 'border-pink-200 dark:border-pink-700',
    'red-background': 'border-red-200 dark:border-red-700',
    'default-background': 'border-gray-200 dark:border-gray-700',
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
    "this-github-repo": "mdi:github-face"

  }
  if (text in textIconMap) {
    return textIconMap[text];
  }
  return "";
}
