import fetch from "node-fetch";
import { REQUEST_TIMEOUT_MS, HOME_PAGE_SLUG } from "../constants";
import type { Block, Heading1, Heading2, Heading3, RichText, Column, ReferencesInPage } from "./interfaces";
import slugify from '@sindresorhus/slugify';
import path from 'path';


const BASE_PATH = import.meta.env.BASE_URL;

export const filePath = (url: URL): string => {
  const [dir, filename] = url.pathname.split("/").slice(-2);
  return path.join(BASE_PATH, `/notion/${dir}/${filename}`);
  // return path.join(BASE_PATH, `./src/notion-assets/${dir}/${filename}`);
};

export const extractTargetBlocks = (blockTypes: string[], blocks: Block[]): Block[] => {
  return blocks
    .reduce((acc: Block[], block) => {
      if (blockTypes.includes(block.Type)) {
        acc.push(block);
      }

      if (block.ColumnList && block.ColumnList.Columns) {
        acc = acc.concat(_extractTargetBlockFromColumns(blockTypes, block.ColumnList.Columns));
      } else if (block.BulletedListItem && block.BulletedListItem.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.BulletedListItem.Children));
      } else if (block.NumberedListItem && block.NumberedListItem.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.NumberedListItem.Children));
      } else if (block.ToDo && block.ToDo.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.ToDo.Children));
      } else if (block.SyncedBlock && block.SyncedBlock.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.SyncedBlock.Children));
      } else if (block.Toggle && block.Toggle.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.Toggle.Children));
      } else if (block.Paragraph && block.Paragraph.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.Paragraph.Children));
      } else if (block.Heading1 && block.Heading1.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.Heading1.Children));
      } else if (block.Heading2 && block.Heading2.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.Heading2.Children));
      } else if (block.Heading3 && block.Heading3.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.Heading3.Children));
      } else if (block.Quote && block.Quote.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.Quote.Children));
      } else if (block.Callout && block.Callout.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, block.Callout.Children));
      }

      return acc;
    }, [])
    .flat();
};


const _extractTargetBlockFromColumns = (blockTypes: string[], columns: Column[]): Block[] => {
  return columns
    .reduce((acc: Block[], column) => {
      if (column.Children) {
        acc = acc.concat(extractTargetBlocks(blockTypes, column.Children));
      }
      return acc;
    }, [])
    .flat();
};

const _filterRichTexts = (postId:string, block: Block, rich_texts:RichText[]): ReferencesInPage => ({
  block,
  other_pages: rich_texts.reduce((acc, richText) => {
      if (richText.InternalHref && richText.InternalHref?.PageId!== postId) {
          acc.push(richText);
      }
      if (richText.Mention?.Page?.PageId && richText.Mention.Page.PageId!==postId) {
          acc.push(richText);
      }
      return acc;
  }, [] as RichText[]) || [],
  external_hrefs: rich_texts.reduce((acc, richText) => {
      if (!richText.InternalHref && richText.Href) {
          acc.push(richText);
      }
      return acc;
  }, [] as RichText[]) || [],
  same_page: rich_texts.reduce((acc, richText) => {
    if (richText.InternalHref?.PageId=== postId) {
        acc.push(richText);
    }
    if (richText.Mention?.Page?.PageId && richText.Mention.Page.PageId===postId) {
        acc.push(richText);
    }
    return acc;
}, [] as RichText[]) || [],
direct_link: null,
link_to_pageid: null
});

const _extractReferencesInBlock = (postId:string, block: Block): ReferencesInPage => {
  //MISSING TABLE ROWS
  // console.debug("here in _extractReferencesInBlock");
  const rich_texts = block.Bookmark?.Caption || block.BulletedListItem?.RichTexts || block.Callout?.RichTexts || block.Code?.RichTexts || block.Embed?.Caption || block.File?.Caption || block.Heading1?.RichTexts || block.Heading2?.RichTexts || block.Heading3?.RichTexts || block.LinkPreview?.Caption || block.NAudio?.Caption || block.NImage?.Caption || block.NumberedListItem?.RichTexts || block.Paragraph?.RichTexts || block.Quote?.RichTexts || block.ToDo?.RichTexts || block.Toggle?.RichTexts || block.Video?.Caption || [];
  let filteredRichText = _filterRichTexts(postId, block, rich_texts);
  let direct_link = block.Embed?.Url || block.LinkPreview?.Url || block.NAudio?.External?.Url || block.File?.External?.Url || block.NImage?.External?.Url || block.Video?.External?.Url;
  let link_to_pageid = block.LinkToPage?.PageId;
  filteredRichText.direct_link = direct_link??null;
  filteredRichText.link_to_pageid = link_to_pageid??null;
  return filteredRichText;
};



export const extractReferencesInPage =(postId:string, blocks:Block[]):ReferencesInPage[]=>{
  // console.debug("here in extractReferencesInPage");
  return blocks
  .reduce((acc: ReferencesInPage[], block) => {

    acc.push(_extractReferencesInBlock(postId, block));

    if (block.ColumnList && block.ColumnList.Columns) {
      acc = acc.concat(_extractReferencesFromColumns(postId, block.ColumnList.Columns));
    } else if (block.BulletedListItem && block.BulletedListItem.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.BulletedListItem.Children));
    } else if (block.NumberedListItem && block.NumberedListItem.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.NumberedListItem.Children));
    } else if (block.ToDo && block.ToDo.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.ToDo.Children));
    } else if (block.SyncedBlock && block.SyncedBlock.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.SyncedBlock.Children));
    } else if (block.Toggle && block.Toggle.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.Toggle.Children));
    } else if (block.Paragraph && block.Paragraph.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.Paragraph.Children));
    } else if (block.Heading1 && block.Heading1.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.Heading1.Children));
    } else if (block.Heading2 && block.Heading2.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.Heading2.Children));
    } else if (block.Heading3 && block.Heading3.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.Heading3.Children));
    } else if (block.Quote && block.Quote.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.Quote.Children));
    } else if (block.Callout && block.Callout.Children) {
      acc = acc.concat(extractReferencesInPage(postId, block.Callout.Children));
    }

    return acc;
  }, [])
  .flat();
}


const _extractReferencesFromColumns = (postId:string, columns: Column[]): ReferencesInPage[] => {
  return columns
    .reduce((acc: ReferencesInPage[], column) => {
      if (column.Children) {
        acc = acc.concat(extractReferencesInPage(postId, column.Children));
      }
      return acc;
    }, [])
    .flat();
};

export const buildURLToHTMLMap = async (urls: URL[]): Promise<{ [key: string]: string }> => {
  const htmls: string[] = await Promise.all(
    urls.map(async (url: URL) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      return fetch(url.toString(), { signal: controller.signal })
        .then((res) => {
          return res.text();
        })
        .catch(() => {
          console.log("Request was aborted");
          return "";
        })
        .finally(() => {
          clearTimeout(timeout);
        });
    }),
  );

  return urls.reduce((acc: { [key: string]: string }, url, i) => {
    if (htmls[i]) {
      acc[url.toString()] = htmls[i];
    }
    return acc;
  }, {});
};

export const getStaticFilePath = (pathsup: string): string => {
  return path.join(BASE_PATH, pathsup);
};

export const getNavLink = (nav: string) => {
  if ((!nav) && BASE_PATH) {
    return path.join(BASE_PATH, "") + "/";
  }
  return path.join(BASE_PATH, nav);
};

export const getPostLink = (slug: string, isRoot: boolean = false) => {
  const linkedPath = isRoot ? (slug === HOME_PAGE_SLUG ? path.join(BASE_PATH, `/`) : path.join(BASE_PATH, `/${slug}`)) : path.join(BASE_PATH, `/posts/${slug}`);
  return linkedPath;
};

export const getTagLink = (tag: string) => {
  return path.join(BASE_PATH, `/posts/tag/${encodeURIComponent(tag)}`);
};

export const getPageLink = (page: number, tag: string) => {
  if (page === 1) {
    return tag ? getTagLink(tag) : path.join(BASE_PATH, "/");
  }
  return tag
    ? path.join(BASE_PATH, `/posts/tag/${encodeURIComponent(tag)}/page/${page.toString()}`)
    : path.join(BASE_PATH, `/posts/page/${page.toString()}`);
};

export const getDateStr = (date: string) => {
  const dt = new Date(date);

  if (date.indexOf("T") !== -1) {
    // Consider timezone
    const elements = date.split("T")[1].split(/([+-])/);
    if (elements.length > 1) {
      const diff = parseInt(`${elements[1]}${elements[2]}`, 10);
      dt.setHours(dt.getHours() + diff);
    }
  }

  const y = dt.getFullYear();
  const m = ("00" + (dt.getMonth() + 1)).slice(-2);
  const d = ("00" + dt.getDate()).slice(-2);
  return y + "-" + m + "-" + d;
};

export const buildHeadingId = (heading: Heading1 | Heading2 | Heading3) => {
  return slugify(
    heading.RichTexts.map((richText: RichText) => {
      if (!richText.Text) {
        return "";
      }
      return richText.Text.Content;
    })
      .join()
      .trim(),
  );
};

export const isTweetURL = (url: URL): boolean => {
  if (
    url.hostname !== 'twitter.com' &&
    url.hostname !== 'www.twitter.com' &&
    url.hostname !== 'x.com' &&
    url.hostname !== 'www.x.com'
  ) {
    return false
  }
  return /\/[^/]+\/status\/[\d]+/.test(url.pathname)
}
export const isTikTokURL = (url: URL): boolean => {
  if (url.hostname !== 'tiktok.com' && url.hostname !== 'www.tiktok.com') {
    return false
  }
  return /\/[^/]+\/video\/[\d]+/.test(url.pathname)
}
export const isInstagramURL = (url: URL): boolean => {
  if (
    url.hostname !== 'instagram.com' &&
    url.hostname !== 'www.instagram.com'
  ) {
    return false
  }
  return /\/p\/[^/]+/.test(url.pathname)
}
export const isPinterestURL = (url: URL): boolean => {
  if (
    url.hostname !== 'pinterest.com' &&
    url.hostname !== 'www.pinterest.com' &&
    url.hostname !== 'pinterest.jp' &&
    url.hostname !== 'www.pinterest.jp'
  ) {
    return false
  }
  return /\/pin\/[\d]+/.test(url.pathname)
}

export const isSpotifyURL = (url: URL): boolean => {
  if (
    url.hostname !== 'spotify.com' &&
    url.hostname !== 'www.spotify.com' &&
    url.hostname !== 'open.spotify.com'
  ) {
    return false
  }
  return /\/embed\//.test(url.pathname)
}

export const isGoogleMapsURL = (url:URL): boolean => {
  if (
    url.toString().startsWith("https://www.google.com/maps/embed")
  )
  {
    return true;
  }
  return false;
}

export const isCodePenURL = (url: URL): boolean => {
  if (url.hostname !== 'codepen.io' && url.hostname !== 'www.codepen.io') {
    return false
  }
  return /\/[^/]+\/pen\/[^/]+/.test(url.pathname)
}

export const isShortAmazonURL = (url: URL): boolean => {
  if (url.hostname === 'amzn.to' || url.hostname === 'www.amzn.to') {
    return true
  }
  return false
}
export const isFullAmazonURL = (url: URL): boolean => {
  if (
    url.hostname === 'amazon.com' ||
    url.hostname === 'www.amazon.com' ||
    url.hostname === 'amazon.co.jp' ||
    url.hostname === 'www.amazon.co.jp' ||
    url.hostname === 'www.amazon.in'
  ) {
    return true
  }
  return false
}
export const isAmazonURL = (url: URL): boolean => {
  return isShortAmazonURL(url) || isFullAmazonURL(url)
}
export const isYouTubeURL = (url: URL): boolean => {
  if (['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) {
    return true
  }
  return false
}

// Supported URL
//
// - https://youtu.be/0zM3nApSvMg
// - https://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
// - https://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
// - https://www.youtube.com/watch?v=0zM3nApSvMg
// - https://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0
// - https://www.youtube.com/embed/0zM3nApSvMg?rel=0
// - https://youtube.com/live/uOLwqWlpKbA
export const parseYouTubeVideoId = (url: URL): string => {
  if (!isYouTubeURL(url)) return "";

  if (url.hostname === "youtu.be") {
    return url.pathname.split("/")[1];
  } else if (url.pathname === "/watch") {
    return url.searchParams.get("v") || "";
  } else {
    const elements = url.pathname.split("/");

    if (elements.length < 2) return "";

    if (elements[1] === "v" || elements[1] === "embed" || elements[1] === "live") {
      return elements[2];
    }
  }

  return "";
};

export const isEmbeddableURL = async (url: URL): Promise<boolean> => {
  try {
    const urlString = url.toString();
    const response = await fetch(urlString, { method: 'HEAD' });
    const xFrameOptions = response.headers.get('x-frame-options');
    const contentSecurityPolicy = response.headers.get('content-security-policy');

    if (xFrameOptions && (xFrameOptions.toLowerCase() === 'deny' || xFrameOptions.toLowerCase() === 'sameorigin')) {
      return false;
    }

    if (contentSecurityPolicy && contentSecurityPolicy.includes("frame-ancestors")) {
      // Further parsing might be required here to interpret the CSP policy
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking URL: ', error);
    return false;
  }
};

