import type { APIContext, GetStaticPaths } from "astro";
// import { getEntryBySlug } from "astro:content";
import satori, { type SatoriOptions } from "satori";
// import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";
// import { siteConfig } from "@/site-config";
import { getFormattedDate } from "@/utils";

import RobotoMono from "@/assets/roboto-mono-regular.ttf";
import RobotoMonoBold from "@/assets/roboto-mono-700.ttf";
import JetBrainsMonoBold from "@/assets/JetBrainsMono-Bold.ttf";
//ADDITION
import { getAllPosts, getPostBySlug, getAllEntries } from "@/lib/notion/client";
import { getCollections } from "@/utils";

// import { siteInfo } from "@/utils";
import { siteInfo } from "@/siteInfo";
import { OG_SETUP, LAST_BUILD_TIME } from "@/constants";

import fs from 'fs';
import sharp from 'sharp';
import path from 'path';

const ogOptions: SatoriOptions = {
  width: 1200,
  height: 630,
  // debug: true,
  fonts: [
    {
      name: "JetBrainsMono-Bold",
      data: Buffer.from(JetBrainsMonoBold),
      weight: 700,
      style: "normal",
    },
  ],
};

const obj_img_sq_without_desc = function (title: string, pubDate: string, img_url: string) {
  return {
    "type": "div",
    "props": {
      "style": {
        "display": "flex",
        "flexDirection": "column",
        "width": "100%",
        "height": "100%"
      },
      "children": [
        {
          "type": "div",
          "props": {
            "style": {
              "height": "100%",
              "width": "100%",
              "display": "flex",
              "backgroundColor": "white",
              "fontFamily": "JetBrainsMono-Bold"
            },
            "children": [
              null,
              {
                "type": "div",
                "props": {
                  "style": {
                    "padding": "20px",
                    "display": "flex",
                    "width": "100%",
                    "height": "100%",
                    "justifyContent": "center",
                    "alignItems": "stretch"
                  },
                  "children": [
                    null,
                    {
                      "type": "div",
                      "props": {
                        "style": {
                          "display": "flex",
                          "flexDirection": "row",
                          "justifyContent": "space-between",
                          "border": "1px solid #374151",
                          "boxShadow": "5px 5px 0px #374151",
                          "width": "100%",
                          "height": "100%",
                          "padding": "10px"
                        },
                        "children": [
                          null,
                          {
                            "type": "div",
                            "props": {
                              "style": {
                                "display": "flex",
                                "flex": "1"
                              },
                              "children": [
                                null,
                                {
                                  "type": "img",
                                  "props": {
                                    "src": img_url,
                                    "style": {
                                      "width": "100%",
                                      "height": "100%",
                                      "objectFit": "contain",
                                      "objectPosition": "center"
                                    },
                                    "children": []
                                  }
                                }
                              ]
                            }
                          },
                          null,
                          {
                            "type": "div",
                            "props": {
                              "style": {
                                "display": "flex",
                                "flexDirection": "column",
                                "flex": "1"
                              },
                              "children": [
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "32px",
                                      "fontWeight": "700",
                                      "lineHeight": "3rem",
                                      "padding": "10px 0 50px 0",
                                      "color": "#374151",
                                      "flex": "1",
                                      "display": "flex",
                                      "fontFamily": "monospace"
                                    },
                                    "children": title
                                  }
                                },
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "16px",
                                      "fontWeight": "700",
                                      "color": "#374151",
                                      "display": "flex",
                                      "flexDirection": "row",
                                      "justifyContent": "space-between",
                                      "alignItems": "center"
                                    },
                                    "children": [
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "children": pubDate
                                        }
                                      },
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "style": {
                                            "display": "flex",
                                            "alignItems": "center"
                                          },
                                          "children": [
                                            null,
                                            {
                                              "type": "span",
                                              "props": {
                                                "style": {
                                                  "marginRight": "16px"
                                                },
                                                "children": siteInfo.author
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
}

const obj_img_sq_with_desc = function (title: string, pubDate: string, desc: string, img_url: string) {
  return {
    "type": "div",
    "props": {
      "style": {
        "display": "flex",
        "flexDirection": "column",
        "width": "100%",
        "height": "100%"
      },
      "children": [
        {
          "type": "div",
          "props": {
            "style": {
              "height": "100%",
              "width": "100%",
              "display": "flex",
              "backgroundColor": "white",
              "fontFamily": "JetBrainsMono-Bold"
            },
            "children": [
              null,
              {
                "type": "div",
                "props": {
                  "style": {
                    "padding": "20px",
                    "display": "flex",
                    "width": "100%",
                    "height": "100%",
                    "justifyContent": "center",
                    "alignItems": "stretch"
                  },
                  "children": [
                    null,
                    {
                      "type": "div",
                      "props": {
                        "style": {
                          "display": "flex",
                          "flexDirection": "row",
                          "justifyContent": "space-between",
                          "border": "1px solid #374151",
                          "boxShadow": "5px 5px 0px #374151",
                          "width": "100%",
                          "height": "100%",
                          "padding": "10px"
                        },
                        "children": [
                          null,
                          {
                            "type": "div",
                            "props": {
                              "style": {
                                "display": "flex",
                                "flex": "1"
                              },
                              "children": [
                                null,
                                {
                                  "type": "img",
                                  "props": {
                                    "src": img_url,
                                    "style": {
                                      "width": "100%",
                                      "height": "100%",
                                      "objectFit": "contain",
                                      "objectPosition": "center"
                                    },
                                    "children": []
                                  }
                                }
                              ]
                            }
                          },
                          null,
                          {
                            "type": "div",
                            "props": {
                              "style": {
                                "display": "flex",
                                "flexDirection": "column",
                                "flex": "1"
                              },
                              "children": [
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "32px",
                                      "fontWeight": "700",
                                      "lineHeight": "3rem",
                                      "padding": "10px 0 50px 0",
                                      "color": "#374151",
                                      "flex": "0.4",
                                      "display": "flex",
                                      "fontFamily": "monospace"
                                    },
                                    "children": title
                                  }
                                },
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "24px",
                                      "fontWeight": "700",
                                      "lineHeight": "2rem",
                                      "padding": "10px 0 50px 0",
                                      "color": "#374151",
                                      "flex": "1",
                                      "display": "flex",
                                      "fontFamily": "monospace"
                                    },
                                    "children": desc
                                  }
                                },
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "16px",
                                      "fontWeight": "700",
                                      "color": "#374151",
                                      "display": "flex",
                                      "flexDirection": "row",
                                      "justifyContent": "space-between",
                                      "alignItems": "center"
                                    },
                                    "children": [
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "children": pubDate
                                        }
                                      },
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "style": {
                                            "display": "flex",
                                            "alignItems": "center"
                                          },
                                          "children": [
                                            null,
                                            {
                                              "type": "span",
                                              "props": {
                                                "style": {
                                                  "marginRight": "16px"
                                                },
                                                "children": siteInfo.author
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
}

const obj_img_none_without_desc = function (title: string, pubDate: string) {
  return {
    "type": "div",
    "props": {
      "style": {
        "display": "flex",
        "flexDirection": "column",
        "width": "100%",
        "height": "100%"
      },
      "children": [
        {
          "type": "div",
          "props": {
            "style": {
              "height": "100%",
              "width": "100%",
              "display": "flex",
              "flexDirection": "column",
              "alignItems": "center",
              "justifyContent": "center",
              "fontSize": "32px",
              "fontWeight": "700",
              "backgroundColor": "white",
              "backgroundImage": "radial-gradient(circle at 25px 25px, lightgray 2%, transparent 0%),radial-gradient(circle at 75px 75px, lightgray 2%, transparent 0%)",
              "backgroundSize": "100px 100px",
              "fontFamily": "JetBrainsMono-Bold"
            },
            "children": [
              null,
              {
                "type": "div",
                "props": {
                  "style": {
                    "padding": "20px",
                    "display": "flex",
                    "width": "100%",
                    "height": "100%",
                    "justifyContent": "center",
                    "alignItems": "stretch"
                  },
                  "children": [
                    null,
                    {
                      "type": "div",
                      "props": {
                        "style": {
                          "display": "flex",
                          "flexDirection": "row",
                          "justifyContent": "space-between",
                          "border": "1px solid #374151",
                          "boxShadow": "5px 5px 0px #374151",
                          "width": "100%",
                          "height": "100%",
                          "padding": "10px"
                        },
                        "children": [
                          null,
                          {
                            "type": "div",
                            "props": {
                              "style": {
                                "display": "flex",
                                "flexDirection": "column",
                                "flex": "1"
                              },
                              "children": [
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "52px",
                                      "fontWeight": "700",
                                      "lineHeight": "4rem",
                                      "padding": "10px 50px",
                                      "color": "#374151",
                                      "flex": "1",
                                      "display": "flex"
                                    },
                                    "children": title
                                  }
                                },
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "24px",
                                      "fontWeight": "700",
                                      "color": "#374151",
                                      "display": "flex",
                                      "flexDirection": "row",
                                      "justifyContent": "space-between",
                                      "alignItems": "center",
                                      "padding": "10px"
                                    },
                                    "children": [
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "children": pubDate
                                        }
                                      },
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "style": {
                                            "display": "flex",
                                            "alignItems": "center"
                                          },
                                          "children": [
                                            null,
                                            {
                                              "type": "span",
                                              "props": {
                                                "style": {
                                                  "marginRight": "16px"
                                                },
                                                "children": siteInfo.author
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
}

const obj_img_none_with_desc = function (title: string, pubDate: string, desc: string) {
  return {
    "type": "div",
    "props": {
      "style": {
        "display": "flex",
        "flexDirection": "column",
        "width": "100%",
        "height": "100%"
      },
      "children": [
        {
          "type": "div",
          "props": {
            "style": {
              "height": "100%",
              "width": "100%",
              "display": "flex",
              "flexDirection": "column",
              "alignItems": "center",
              "justifyContent": "center",
              "fontSize": "32px",
              "fontWeight": "700",
              "backgroundColor": "white",
              "backgroundImage": "radial-gradient(circle at 25px 25px, lightgray 2%, transparent 0%),radial-gradient(circle at 75px 75px, lightgray 2%, transparent 0%)",
              "backgroundSize": "100px 100px",
              "fontFamily": "JetBrainsMono-Bold"
            },
            "children": [
              null,
              {
                "type": "div",
                "props": {
                  "style": {
                    "padding": "20px",
                    "display": "flex",
                    "width": "100%",
                    "height": "100%",
                    "justifyContent": "center",
                    "alignItems": "stretch"
                  },
                  "children": [
                    null,
                    {
                      "type": "div",
                      "props": {
                        "style": {
                          "display": "flex",
                          "flexDirection": "row",
                          "justifyContent": "space-between",
                          "border": "1px solid #374151",
                          "boxShadow": "5px 5px 0px #374151",
                          "width": "100%",
                          "height": "100%",
                          "padding": "10px"
                        },
                        "children": [
                          null,
                          {
                            "type": "div",
                            "props": {
                              "style": {
                                "display": "flex",
                                "flexDirection": "column",
                                "flex": "1"
                              },
                              "children": [
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "52px",
                                      "fontWeight": "700",
                                      "lineHeight": "4rem",
                                      "padding": "10px 50px",
                                      "color": "#374151",
                                      "flex": "0.4",
                                      "display": "flex"
                                    },
                                    "children": title
                                  }
                                },
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "30px",
                                      "fontWeight": "700",
                                      "lineHeight": "2rem",
                                      "padding": "10px 50px",
                                      "color": "#374151",
                                      "flex": "1",
                                      "display": "flex"
                                    },
                                    "children": desc
                                  }
                                },
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "24px",
                                      "fontWeight": "700",
                                      "color": "#374151",
                                      "display": "flex",
                                      "flexDirection": "row",
                                      "justifyContent": "space-between",
                                      "alignItems": "center",
                                      "padding": "10px"
                                    },
                                    "children": [
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "children": pubDate
                                        }
                                      },
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "style": {
                                            "display": "flex",
                                            "alignItems": "center"
                                          },
                                          "children": [
                                            null,
                                            {
                                              "type": "span",
                                              "props": {
                                                "style": {
                                                  "marginRight": "16px"
                                                },
                                                "children": siteInfo.author
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
}

const obj_img_bg = function (title: string, pubDate: string, img_url: string) {
  return {
    "type": "div",
    "props": {
      "style": {
        "display": "flex",
        "flexDirection": "column",
        "width": "100%",
        "height": "100%"
      },
      "children": [
        {
          "type": "div",
          "props": {
            "style": {
              "height": "100%",
              "width": "100%",
              "display": "flex",
              "flexDirection": "column",
              "alignItems": "center",
              "justifyContent": "center",
              "fontSize": "32px",
              "fontWeight": "700",
              "backgroundColor": "white",
              "fontFamily": "JetBrainsMono"
            },
            "children": [
              null,
              {
                "type": "img",
                "props": {
                  "src": img_url,
                  "style": {
                    "position": "absolute",
                    "top": "0",
                    "left": "0",
                    "height": "100%",
                    "width": "100%",
                    "maskImage": "linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.3) 90%, rgba(255, 255, 255, 0.1) 90%)",
                    "objectFit": "cover"
                  },
                  "children": []
                }
              },
              null,
              {
                "type": "div",
                "props": {
                  "style": {
                    "padding": "20px",
                    "display": "flex",
                    "width": "100%",
                    "height": "100%",
                    "justifyContent": "center",
                    "alignItems": "stretch"
                  },
                  "children": [
                    null,
                    {
                      "type": "div",
                      "props": {
                        "style": {
                          "display": "flex",
                          "flexDirection": "row",
                          "justifyContent": "space-between",
                          "border": "1px solid #374151",
                          "boxShadow": "5px 5px 0px #374151",
                          "width": "100%",
                          "height": "100%",
                          "padding": "10px"
                        },
                        "children": [
                          null,
                          {
                            "type": "div",
                            "props": {
                              "style": {
                                "display": "flex",
                                "flexDirection": "column",
                                "flex": "1"
                              },
                              "children": [
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "px",
                                      "fontWeight": "700",
                                      "lineHeight": "3rem",
                                      "padding": "10px 0 50px 0",
                                      "color": "#374151",
                                      "flex": "1",
                                      "display": "flex"
                                    },
                                    "children": title
                                  }
                                },
                                null,
                                {
                                  "type": "div",
                                  "props": {
                                    "style": {
                                      "fontSize": "16px",
                                      "fontWeight": "700",
                                      "color": "#374151",
                                      "display": "flex",
                                      "flexDirection": "row",
                                      "justifyContent": "space-between",
                                      "alignItems": "center"
                                    },
                                    "children": [
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "children": pubDate
                                        }
                                      },
                                      null,
                                      {
                                        "type": "div",
                                        "props": {
                                          "style": {
                                            "display": "flex",
                                            "alignItems": "center"
                                          },
                                          "children": [
                                            null,
                                            {
                                              "type": "span",
                                              "props": {
                                                "style": {
                                                  "marginRight": "16px"
                                                },
                                                "children": siteInfo.author
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
}

export async function GET({ params: { slug } }: APIContext) {
  const BASE_DIR = "./tmp/og-images/";
  let keyStr = slug;
  let type = "postpage";
  if (keyStr?.includes("---")) {
    keyStr = slug.split("---")[1];
    type = slug.split("---")[0];
  }
  let post = null;
  let postLastUpdatedBeforeLastBuild = true;

  if (type == "postpage") {
    post = await getPostBySlug(keyStr!);
    // Assuming post.LastUpdatedTimestamp is in a format that can be directly converted to a Date object
    postLastUpdatedBeforeLastBuild = LAST_BUILD_TIME ? (post?.LastUpdatedTimeStamp ? (post?.LastUpdatedTimeStamp < LAST_BUILD_TIME) : false) : false;
    // console.log("logging for og slug is", slug, "last updated time stamp is", post?.LastUpdatedTimeStamp, "last build time is", LAST_BUILD_TIME);
  }

  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }

  const imagePath = path.join(BASE_DIR, `${slug}.png`);

  if (fs.existsSync(imagePath) && postLastUpdatedBeforeLastBuild) {
    // console.log("reading existing image for og slug", slug);
    // Read the existing image and send it in the response
    const existingImage = fs.readFileSync(imagePath);
    return new Response(existingImage, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }
  // console.log("generating og image for slug", slug);

  let chosen_markup;
  let fallback_markup;

  if (type == "postpage") {
    const title = post?.Title ?? siteInfo.title;
    const postDate = getFormattedDate(
      post?.Date ?? post?.Date ?? Date.now()
    );
    if (OG_SETUP['COLUMNS'] == 1 && post?.FeaturedImage && post?.FeaturedImage.ExpiryTime && (Date.parse(post?.FeaturedImage.ExpiryTime) > Date.now()) && (post.FeaturedImage.Url.includes(".jpg") || post.FeaturedImage.Url.includes(".png") || post.FeaturedImage.Url.includes(".jpeg"))) {
      chosen_markup = obj_img_bg(title, postDate, post.FeaturedImage.Url);
    } else if (OG_SETUP['COLUMNS'] && post?.FeaturedImage && post?.FeaturedImage.ExpiryTime && (Date.parse(post?.FeaturedImage.ExpiryTime) > Date.now()) && (post.FeaturedImage.Url.includes(".jpg") || post.FeaturedImage.Url.includes(".png") || post.FeaturedImage.Url.includes(".jpeg"))) {
      chosen_markup = post?.Excerpt && OG_SETUP['EXCERPT'] ? obj_img_sq_with_desc(title, postDate, post?.Excerpt, post.FeaturedImage.Url) : obj_img_sq_without_desc(title, postDate, post.FeaturedImage.Url);
    } else {
      chosen_markup = post?.Excerpt && OG_SETUP['EXCERPT'] ? obj_img_none_with_desc(title, postDate, post?.Excerpt) : obj_img_none_without_desc(title, postDate);
    }
    fallback_markup = post?.Excerpt ? obj_img_none_with_desc(title, postDate, post?.Excerpt) : obj_img_none_without_desc(title, postDate);
  }
  else if (type == "collectionpage") {
    chosen_markup = obj_img_none_without_desc(keyStr + " : " + "A collection of posts", " ");
  }
  else if (type == "tagsindex") {
    chosen_markup = obj_img_none_without_desc("All topics I've written about", " ");
  }
  else if (type == "collectionsindex") {
    chosen_markup = obj_img_none_without_desc("All collections that hold my posts", " ");
  }
  else if (type == "tagpage") {
    chosen_markup = obj_img_none_without_desc("All posts tagged with #" + keyStr, " ");
  }
  else {
    chosen_markup = obj_img_none_without_desc("All posts in one place", " ");
  }

  // const svg = await satori(chosen_markup, ogOptions);
  let svg;
  try {
    svg = await satori(chosen_markup, ogOptions);
  } catch (error) {
    console.error("Error in satori:", error);
    // Fallback to a basic markup if satori fails
    svg = await satori(fallback_markup, ogOptions);
  }
  // const png = new Resvg(svg).render().asPng();
  const pngBuffer = new Resvg(svg).render().asPng();
  // Check if the buffer size is greater than 100 KB (102400 bytes)
  if (pngBuffer.length > 102400) {
    // Optimize the PNG using Sharp if it's larger than 100 KB
    await sharp(pngBuffer)
      .png({ quality: 80 }) // Adjust quality as needed
      .toFile(imagePath);
  } else {
    // Save the image as is if it's smaller than 100 KB
    fs.writeFileSync(imagePath, pngBuffer);
  }

  return new Response(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllEntries();

  // // Assuming postsArray is an array of posts
  // const filteredPosts = posts.filter(post => {
  //   const differenceInTime = new Date().getTime() - new Date(post.LastUpdatedDate).getTime();
  //   const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

  //   const ogbeforecutoff =
  //     OG_SETUP &&
  //     OG_SETUP["FULL_PREVIEW_COLLECTIONS_LAST_UPDATED_CUTOFF"] &&
  //     FULL_PREVIEW_COLLECTIONS &&
  //     FULL_PREVIEW_COLLECTIONS.includes(post.Collection) &&
  //     differenceInDays > OG_SETUP["FULL_PREVIEW_COLLECTIONS_LAST_UPDATED_CUTOFF"];

  //   // Return true if the post should be kept, false if it should be removed
  //   return !ogbeforecutoff;
  // });


  const postsMap = posts.map(({ Slug }) => ({ params: { slug: Slug } }));
  // const postsMap = filteredPosts.map(({ Slug }) => ({ params: { slug: Slug } }));

  const collections = await getCollections();
  const collectionMap = collections.map((collection) => ({
    params: { slug: "collectionpage---" + collection }
  }));

  const uniqueTags = [...new Set(posts.flatMap((post) => post.Tags))];
  const tagMap = uniqueTags.map((tag) => ({
    params: { slug: "tagpage---" + tag.name }
  }));

  const tagsindex = { params: { slug: "tagsindex---index" } };
  const postsindex = { params: { slug: "postsindex---index" } };
  const collectionsindex = { params: { slug: "collectionsindex---index" } };

  //Note: using featured image to generate og!
  // return posts.map(({ Slug }) => ({ params: { slug: Slug } }));
  return [...postsMap, ...collectionMap, ...tagMap, tagsindex, postsindex, collectionsindex];
};
