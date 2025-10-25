# Requirements September 11, 2025

First, we'll write a Product Requirements Document (PRD) before implementing anything. This is about introducing footnotes to Webtrotion.

We currently have this in our configuration:
`"all-footnotes-page-slug": "_all-footnotes",`

Now we'll create a dictionary:

```json
{
  "footnotes": {
    "all-footnotes-page-slug": "_all-footnotes",
    "page-settings": {
      "enabled": true,
      "source": {
        "end-of-block": true,
        "start-of-child-blocks": false,
        "block-comments": false,
        "block-inline-text-comments": false,
      },
      "marker-prefix": "^ft_",
      "generate-footnotes-section": false,
      "intext-display": {
        "always-popup": true,
        "small-popup-large-margin": false
      }
    }
  }
}

```

## Terms and Basics

We will use two terms—footnote markers and footnote content.

In something like [^ft_a], this is an inline footnote marker (it must start with the marker-prefix defined in constants-config to be considered a footnote marker), and some content follows here.
[^ft_a]: This is content of the footnote called "footnote content" and starts with a marker, colon, and space.

Notion's structure works like this: everything is a block that can be of various types and contain rich text. Each block can have children, which themselves can be any type of block. Beyond standard block types, even captions for images or videos have rich text arrays. This means they can also contain footnote markers.

A block of content usually has an array of rich text that can be easily accessed by doing something like `.map((richText) => richText.PlainText).join(" ")`.

Each block can have multiple footnotes, and we need a way to handle that.

I want to allow 4 types of per-page-footnotes-setup; block-inline-text-comments will not be supported right now because they are not present in the Notion API.

The processing only needs to be done if "page-settings": { "enabled" is true.
The footnote content should never be normally rendered (this is especially important for end-of-block and start-of-child-blocks options). Comments are not rendered anyway, so if either of these are the source, we need to preprocess content to not only add the corresponding footnote as rich text or set of Notion blocks, but also remove them from rendering.
The footnote marker also needs to be removed from rich_text content. This can probably be done by iterating, finding markers, splitting and set them to special styles, allowing you to add a src/components/notion-blocks/annotations/footnote-marker.astro component that can render them correctly. Initially, instead of rendering them with sequential numbers throughout the page (for which we can set a footnote counter in blog-helpers and reset it when calling in /src/pages/[...page].astro, /src/pages/posts/[slug].astro or /src/pages/collections/[collection]/[...page].astro), we will display all footnote markers as: `†`

Currently, we lack any representation for footnote content, footnote markers in the interface, components, or related elements. We need to start by developing these foundational components. Ideally, we will modify the rich text array to split out footnote markers and add a footnotes array of Notion blocks to each block (defaulting to empty)—all while processing the blocks in client.ts.

## Source Explanations

Let me explain each source now. Note that only one type of source is allowed to be enabled. If multiple are enabled, we take a random one as default:

### end-of-block

This block has both footnote marker and footnote content. Why is it at the end of block instead of inline or end of sentence? Because this option is specifically for people who want to download their content as markdown. Notion doesn't do auto-indents for child blocks of paragraphs—so mixed-content footnotes aren't possible anyway. While a new block adds

, it makes parsing difficult—so we'll use shift+enter to add

 or
 at the end of a block before typing footnote content.

Cool, how might this look you ask?

```json
{
  "object": "block",
  "id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7",
  "parent": {
    "type": "page_id",
    "page_id": "85cb68b6-b12f-4a62-af33-3348ea751f77"
  },
  "created_time": "2025-02-28T14:35:00.000Z",
  "last_edited_time": "2025-09-12T05:51:00.000Z",
  "created_by": {
    "object": "user",
    "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
  },
  "last_edited_by": {
    "object": "user",
    "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
  },
  "has_children": true,
  "archived": false,
  "in_trash": false,
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "edited",
          "link": null
        },
        "annotations": {
          "bold": true,
          "italic": false,
          "strikethrough": false,
          "underline": false,
          "code": false,
          "color": "default"
        },
        "plain_text": "edited",
        "href": null
      },
      {
        "type": "text",
        "text": {
          "content": " it [^ft_a] [^ft_b] [^ft_c]. some other content can be here. ",
          "link": null
        },
        "annotations": {
          "bold": false,
          "italic": false,
          "strikethrough": false,
          "underline": false,
          "code": false,
          "color": "default"
        },
        "plain_text": " it [^ft_a] [^ft_b] [^ft_c]. some other content can be here. ",
        "href": null
      },
      {
        "type": "text",
        "text": {
          "content": "this is not just in paras",
          "link": null
        },
        "annotations": {
          "bold": false,
          "italic": false,
          "strikethrough": false,
          "underline": false,
          "code": false,
          "color": "red_background"
        },
        "plain_text": "this is not just in paras",
        "href": null
      },
      {
        "type": "text",
        "text": {
          "content": ", para [^ft_a1] [^ft_b1] [^ft_c1] is just an example.\n\n[^ft_a]: this is a new line based footnote [end-of-block]\n\n[^ft_a1]: see there can be multiple new line based footnotes [end-of-block] in same block!\neach footnote can also be of multiple lines!!",
          "link": null
        },
        "annotations": {
          "bold": false,
          "italic": false,
          "strikethrough": false,
          "underline": false,
          "code": false,
          "color": "default"
        },
        "plain_text": ", para [^ft_a1] [^ft_b1] [^ft_c1] is just an example.\n\n[^ft_a]: this is a new line based footnote [end-of-block]\n\n[^ft_a1]: see there can be multiple new line based footnotes [end-of-block] in same block!\neach footnote can also be of multiple lines!!",
        "href": null
      }
    ],
    "color": "default"
  },
  "request_id": "95deee9d-0b16-425b-a16a-0b3698ac17d4"
}

```

### start-of-child-blocks

We have this option for users who don't care much about Markdown export but want multi-block footnotes. In this case, we should check and count the number of footnote markers in text by converting the array to plain text and using the marker prefix. Then, those number of blocks at the start of child blocks would be considered footnote content. However, since users might sometimes forget to add footnote content, we need to verify that these blocks are actually footnote content by checking if they start with the marker, colon, and space.

See the block above, it has `"has_children": true`. I'll show what the children output looks like:

```json
{
  "object": "list",
  "results": [
    {
      "object": "block",
      "id": "263817d0-5c92-8027-b35a-efe224dbb67e",
      "parent": {
        "type": "block_id",
        "block_id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7"
      },
      "created_time": "2025-09-03T05:54:00.000Z",
      "last_edited_time": "2025-09-12T05:56:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "last_edited_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "has_children": false,
      "archived": false,
      "in_trash": false,
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "[^ft_b]: this is a start of child block based footnote",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "[^ft_b]: this is a start of child block based footnote",
            "href": null
          }
        ],
        "color": "default"
      }
    },
    {
      "object": "block",
      "id": "26c817d0-5c92-80cf-9725-cde65c211ab2",
      "parent": {
        "type": "block_id",
        "block_id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7"
      },
      "created_time": "2025-09-12T05:55:00.000Z",
      "last_edited_time": "2025-09-12T05:57:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "last_edited_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "has_children": true,
      "archived": false,
      "in_trash": false,
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "[^ft_b1]: why do this at all then? why it be a child-block. because see this child-block has block children and can be mixed media. o",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "[^ft_b1]: why do this at all then? why it be a child-block. because see this child-block has block children and can be mixed media. o",
            "href": null
          }
        ],
        "color": "default"
      }
    },
    {
      "object": "block",
      "id": "26c817d0-5c92-8008-92fc-e20070c9577a",
      "parent": {
        "type": "block_id",
        "block_id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7"
      },
      "created_time": "2025-09-12T05:55:00.000Z",
      "last_edited_time": "2025-09-12T05:58:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "last_edited_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "has_children": false,
      "archived": false,
      "in_trash": false,
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "it can have unrelated children too which are not footnotes! they all will be after the footnote block set though",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "it can have unrelated children too which are not footnotes! they all will be after the footnote block set though",
            "href": null
          }
        ],
        "color": "default"
      }
    }
  ],
  "next_cursor": null,
  "has_more": false,
  "type": "block",
  "block": {},
  "request_id": "5431da7f-d153-42b3-a40b-d7d9b0afd4da"
}

```

See `block_id` `26c817d0-5c92-80cf-9725-cde65c211ab2` – it also has children. Our current Notion block parsing recursively handles children, but I'm pointing this out because all children of a footnote content block are treated as a single footnote (even if they have their own sub-children):

```json
{
  "object": "list",
  "results": [
    {
      "object": "block",
      "id": "26c817d0-5c92-802a-b0b2-f4501cf2a436",
      "parent": {
        "type": "block_id",
        "block_id": "26c817d0-5c92-80cf-9725-cde65c211ab2"
      },
      "created_time": "2025-09-12T05:56:00.000Z",
      "last_edited_time": "2025-09-12T05:57:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "last_edited_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "has_children": false,
      "archived": false,
      "in_trash": false,
      "type": "image",
      "image": {
        "caption": [
          {
            "type": "text",
            "text": {
              "content": "the text above and this image as all part of one footnote!",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "the text above and this image as all part of one footnote!",
            "href": null
          }
        ],
        "type": "file",
        "file": {
          "url": "<https://prod-files-secure.s3.us-west-2.amazonaws.com/6083354a-c9d6-441d-886e-3fa82c5b48de/00eb8641-5847-433b-9d12-11eeefdbfd8b/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466YS2CQZ4O%2F20250912%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250912T061358Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDEW6eApHYQskbZxraV8URIYrjQHKYqzuoU6cM%2BO8ffWwIgUmEbtoszCuoAQ3yUGLbsolzeE3po7EFyseAydVIx%2Bpsq%2FwMIJxAAGgw2Mzc0MjMxODM4MDUiDF7fOthZ9EYzO98dLCrcA6Ex%2Fg2hyiLRsrtc21w2ag%2B5ndDfKgQBOw%2FcwUMk5sPM%2BvebgoT94ke6j3etr3i06SXZ2VlqUmZB81Bdx90PJaKbM7DRLHimatAilQ5m4VGROr5ekGfne2qSA2NNplHrVKJRPhUWVFv%2BU5BF3cECdaRihHEkCSgHVFevD9Zi99G6xc%2FXrqqkpciJkI0l9ebh3pmDxGbbMpoIHjpsceOxIoG7xd6vOAsPhSMiDOkmki3CFW1f2Z6cy89WU5brss7z3Fa3sp1aKMPMxqNq5%2FmUQFicpGWV%2By2GytD%2B7wFBhpvVCNtJ71myyQ109VCMPl5akEXyltIw05B8VXvAJ9qEUtRLe%2FjngfdIQ91Z%2F2mTt%2BLdjBjhKLS8K4Bt74zcoXAl73CjD%2FS2mr6Aob8DAvRYpTsYiIkhZ%2BqJyYCCIE7zKdjTZEr4rrOvzYKBmUmZRxCM1EjFTvBw4r%2BOl9%2F%2FfxbKYo22yS1kp%2BnoUORmKrllRyw8AnYMiZkwprgtm6QNZ5pdsbw4k%2BqXETB%2BFt4URShF%2F%2FhBBFbljnlQqbuULwEsyp2YObvHqD9gYp8k2Z4JTaOpAnIzj95LXOUfsJ6mcO9c8VGi0Vu5bN%2Fk7U1tT8kDOnkhxdSq7%2FcE7Xl8n7Q4MMvpjsYGOqUB1uU5lV%2FLqE78Fqgu54g1QERlZTq5FK5B0wKDmEAF46INGvT5FJZdT8ExKyX67cLBVydeDqhCsQxqqf3aTb2Kf0uvkNr0yGZgkDR2%2BZF68u9RVDIp6%2FE%2Bc84mtpFhANwLbGFSjmJdd7ieWxNzri7%2BbB99awQKrZ11QMZM6FUb8vPgkRH00GlBH3PRP9hInIrYfmRypUm16bFNNAcOXv05LbLRHVOj&X-Amz-Signature=ebc925c88eeca9af1bb52efb77e649b9ad3713386807991f6ad709e799a9ac8f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject>",
          "expiry_time": "2025-09-12T07:13:58.562Z"
        }
      }
    },
    {
      "object": "block",
      "id": "26c817d0-5c92-80a8-81bb-d9e4c72e519d",
      "parent": {
        "type": "block_id",
        "block_id": "26c817d0-5c92-80cf-9725-cde65c211ab2"
      },
      "created_time": "2025-09-12T05:57:00.000Z",
      "last_edited_time": "2025-09-12T05:57:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "last_edited_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "has_children": false,
      "archived": false,
      "in_trash": false,
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "so this footnote is not just multiline, but multi-block.",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "so this footnote is not just multiline, but multi-block.",
            "href": null
          }
        ],
        "color": "default"
      }
    },
    {
      "object": "block",
      "id": "26c817d0-5c92-805a-97f7-f505429c8397",
      "parent": {
        "type": "block_id",
        "block_id": "26c817d0-5c92-80cf-9725-cde65c211ab2"
      },
      "created_time": "2025-09-12T05:57:00.000Z",
      "last_edited_time": "2025-09-12T05:58:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "last_edited_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "has_children": false,
      "archived": false,
      "in_trash": false,
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "all of the children of a footnote content block are part of footnote though",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "all of the children of a footnote content block are part of footnote though",
            "href": null
          }
        ],
        "color": "default"
      }
    }
  ],
  "next_cursor": null,
  "has_more": false,
  "type": "block",
  "block": {},
  "request_id": "5d3d4671-5457-474c-a9db-dfb1f275fb7d"
}

```

### block-comments

Block comments use the Comment API to get footnote content. A block can have both footnote-based and non-footnote-based comments. Footnote-based comments start with a footnote marker, colon, and space. Block comments support rich text annotations, page/date mentions, and images (multiple of them). They're easier to maintain and don't break writing flow, but they're only exported when exporting as `.html`, not as `.md`. They also don't need to be removed from the block list because they were never there in the first place. However, Notion has no API method to list all comments of all child blocks—so if this source option is set to true, we need to modify client.ts parsing to call the Comments API every time. That would look something like this: `const response = await client.comments.list({ block_id: blockId });`

There are two things to consider here: (1) First, check in the constants config if your integration ID has comments permission—this isn't enabled by default. Without it, you'll receive this error:

```json
{
  "object": "error",
  "status": 403,
  "code": "restricted_resource",
  "message": "Insufficient permissions for this endpoint.",
  "request_id": "f4425f29-da1e-4997-92f8-154705626d83"
}
```

First, check with any block_id (even a simple "abcd" will work). If you receive an error, automatically update the config to use end-of-block as the source.

With correct implementation and proper authorization, the response will look like this:

```json
{
  "object": "list",
  "results": [
    {
      "object": "comment",
      "id": "26c817d0-5c92-80eb-a792-001d2a41eead",
      "parent": {
        "type": "block_id",
        "block_id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7"
      },
      "discussion_id": "26c817d0-5c92-8089-9064-001cebea4975",
      "created_time": "2025-09-12T06:16:00.000Z",
      "last_edited_time": "2025-09-12T06:16:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "[^ft_c]: this is a comment based footnote",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "[^ft_c]: this is a comment based footnote",
          "href": null
        }
      ],
      "display_name": {
        "type": "integration",
        "resolved_name": "nerdymomocat-templates/webtrotion"
      }
    },
    {
      "object": "comment",
      "id": "26c817d0-5c92-8064-a486-001dcb4ed6d4",
      "parent": {
        "type": "block_id",
        "block_id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7"
      },
      "discussion_id": "26c817d0-5c92-8089-9064-001cebea4975",
      "created_time": "2025-09-12T06:16:00.000Z",
      "last_edited_time": "2025-09-12T06:16:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "note that it can have non-footnote based comments too, we just ignore them",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "note that it can have non-footnote based comments too, we just ignore them",
          "href": null
        }
      ],
      "display_name": {
        "type": "integration",
        "resolved_name": "nerdymomocat-templates/webtrotion"
      }
    },
    {
      "object": "comment",
      "id": "26c817d0-5c92-80c1-a6a3-001d9ef48174",
      "parent": {
        "type": "block_id",
        "block_id": "1a8817d0-5c92-8027-91a5-f17fd0df45f7"
      },
      "discussion_id": "26c817d0-5c92-8089-9064-001cebea4975",
      "created_time": "2025-09-12T06:18:00.000Z",
      "last_edited_time": "2025-09-12T06:33:00.000Z",
      "created_by": {
        "object": "user",
        "id": "5aa7609b-54f8-42b7-b4a2-6f38a03279bd"
      },
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "[^ft_c1]: comments can also support rich-text annotation like ",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "[^ft_c1]: comments can also support rich-text annotation like ",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": "code",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": true,
            "color": "default"
          },
          "plain_text": "code",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": " or ",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": " or ",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": "formatting",
            "link": null
          },
          "annotations": {
            "bold": true,
            "italic": true,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "formatting",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": " or have ",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": " or have ",
          "href": null
        },
        {
          "type": "mention",
          "mention": {
            "type": "date",
            "date": {
              "start": "2025-09-11",
              "end": null,
              "time_zone": null
            }
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "2025-09-11",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": " or ",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": " or ",
          "href": null
        },
        {
          "type": "mention",
          "mention": {
            "type": "page",
            "page": {
              "id": "85cb68b6-b12f-4a62-af33-3348ea751f77"
            }
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "Test Page That Has Such A long Title For Short Term Testing",
          "href": "<https://www.notion.so/85cb68b6b12f4a62af333348ea751f77>"
        },
        {
          "type": "text",
          "text": {
            "content": " mentions or ",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": " mentions or ",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": "even",
            "link": {
              "url": "<http://www.google.com/>"
            }
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "even",
          "href": "<http://www.google.com/>"
        },
        {
          "type": "text",
          "text": {
            "content": " ",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": " ",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": "colors ",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "brown_background"
          },
          "plain_text": "colors ",
          "href": null
        },
        {
          "type": "text",
          "text": {
            "content": "\n\nAnd you can have images too, multiple of them!",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default_background"
          },
          "plain_text": "\n\nAnd you can have images too, multiple of them!",
          "href": null
        }
      ],
      "display_name": {
        "type": "integration",
        "resolved_name": "nerdymomocat-templates/webtrotion"
      },
      "attachments": [
        {
          "category": "image",
          "file": {
            "url": "<https://prod-files-secure.s3.us-west-2.amazonaws.com/6083354a-c9d6-441d-886e-3fa82c5b48de/3759fd8b-029a-4ed2-89dd-bacf1cffb3a0/3.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466UGBRBLVS%2F20250912%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250912T063344Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDUI3zRD%2BGlwMT1cwyZUjaQHybw62%2BPOS4%2BGxvmuO67fwIgJjhjkq%2BIluDnFwbzf2huAfr44J8kYim8ll4IFPVp%2FsUq%2FwMIJxAAGgw2Mzc0MjMxODM4MDUiDB8cVAqApZyTN0%2FopCrcAyLb9421b9LQFCoKp24tGGcQXJ8KMCOO1XODOmjUazWO9g5El1Ey21C51rZYNXml1fKF83BsVtAjLu1UTcSi34q21sNjwihnzlE2NaGKb2%2B6MJwSbOtpJxO12NRDQP1bzVGuHSXpPbg0Bfmvf6OUSZDw0URNlHmrkJz1vJVxNgPVz%2FSzhEndT6AwTT3z%2BjASZ%2FGGy8BTHuITm0o81DlcHFOSUBwIFppymSNaIkpVMINOdbV3r0OUF0D07EbSjfSA%2BQO49f%2Bvmiz3JRfSWjlUoqLElrQ9T4olgue1sS0aWdsJFzsME%2F%2FlPh1r74BRHMCRHQqTqJBbTgzYtuUp%2B1%2B9aq4qo6NxyKmaaSVTr7Ak4JjxHo72D6f%2FBdG5iHWWFfbF01aKs1qlSaUKX%2BgWp9NS3TYg%2B5v2yo1tIxlxA%2BHoNj6G8Vj6IklRfQeuqPDFqmy%2BS05egIIVNhHIpGPuWg%2BeplKrB3FC62Kh1%2BIHrU68XHeXaBecp%2B6ajdG0igTTnCLdWdkog3nat%2BLNrbTUX6wZi5GP0DLqFFoBhEdsHPYH3XTcxJWUrxy7Mo33d0qhDfo1JRUeXvykSCSlXV69pxTEksDaiTQPVYi5PKixKt2iitG%2F7jhQahms7g1lceY5MIHqjsYGOqUBAisdCv0Ix8JdlKCmYl1f0OROlNhKH5xKHoGCML48J%2Bt%2BKFiYSg8Btpg9ptm3lFo3gw5O%2BkSjBzGZXO%2F63imZGvz0yjjUT05Httl4saEhUoZ6IuoFpJ60b39XeYu4bEwOSWHAzNo0pRfaMzWd92VLsgSPiIdo7dSUL5Dope5CCtxzHmCKYCHBxaYyhcCqWr36%2F%2FWTQQx35AYplcGkgWCuSP73VlN4&X-Amz-Signature=78ddde6a5322e022417dcb8d97564bd4fecd875143534613fc7cc29b31570a8b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject>",
            "expiry_time": "2025-09-12T07:33:44.578Z"
          }
        },
        {
          "category": "image",
          "file": {
            "url": "<https://prod-files-secure.s3.us-west-2.amazonaws.com/6083354a-c9d6-441d-886e-3fa82c5b48de/ff8dfa4c-52c6-4f9e-abb7-d1e8390b552b/2.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466UGBRBLVS%2F20250912%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250912T063344Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEK7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDUI3zRD%2BGlwMT1cwyZUjaQHybw62%2BPOS4%2BGxvmuO67fwIgJjhjkq%2BIluDnFwbzf2huAfr44J8kYim8ll4IFPVp%2FsUq%2FwMIJxAAGgw2Mzc0MjMxODM4MDUiDB8cVAqApZyTN0%2FopCrcAyLb9421b9LQFCoKp24tGGcQXJ8KMCOO1XODOmjUazWO9g5El1Ey21C51rZYNXml1fKF83BsVtAjLu1UTcSi34q21sNjwihnzlE2NaGKb2%2B6MJwSbOtpJxO12NRDQP1bzVGuHSXpPbg0Bfmvf6OUSZDw0URNlHmrkJz1vJVxNgPVz%2FSzhEndT6AwTT3z%2BjASZ%2FGGy8BTHuITm0o81DlcHFOSUBwIFppymSNaIkpVMINOdbV3r0OUF0D07EbSjfSA%2BQO49f%2Bvmiz3JRfSWjlUoqLElrQ9T4olgue1sS0aWdsJFzsME%2F%2FlPh1r74BRHMCRHQqTqJBbTgzYtuUp%2B1%2B9aq4qo6NxyKmaaSVTr7Ak4JjxHo72D6f%2FBdG5iHWWFfbF01aKs1qlSaUKX%2BgWp9NS3TYg%2B5v2yo1tIxlxA%2BHoNj6G8Vj6IklRfQeuqPDFqmy%2BS05egIIVNhHIpGPuWg%2BeplKrB3FC62Kh1%2BIHrU68XHeXaBecp%2B6ajdG0igTTnCLdWdkog3nat%2BLNrbTUX6wZi5GP0DLqFFoBhEdsHPYH3XTcxJWUrxy7Mo33d0qhDfo1JRUeXvykSCSlXV69pxTEksDaiTQPVYi5PKixKt2iitG%2F7jhQahms7g1lceY5MIHqjsYGOqUBAisdCv0Ix8JdlKCmYl1f0OROlNhKH5xKHoGCML48J%2Bt%2BKFiYSg8Btpg9ptm3lFo3gw5O%2BkSjBzGZXO%2F63imZGvz0yjjUT05Httl4saEhUoZ6IuoFpJ60b39XeYu4bEwOSWHAzNo0pRfaMzWd92VLsgSPiIdo7dSUL5Dope5CCtxzHmCKYCHBxaYyhcCqWr36%2F%2FWTQQx35AYplcGkgWCuSP73VlN4&X-Amz-Signature=67ae69795755b8e7ffcee9a279806a0edb34271a0bf3420b203e36af85b5cc93&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject>",
            "expiry_time": "2025-09-12T07:33:44.584Z"
          }
        }
      ]
    }
  ],
  "next_cursor": null,
  "has_more": false,
  "type": "comment",
  "comment": {},
  "request_id": "2a1a4ca5-3f27-4b6f-b6ca-4bcae84185e2"
}
```

### block-inline-text-comments

As I mentioned, these features are forward-looking for when Notion updates its API; currently they don't support this functionality. If someone has set this source to true, simply set block-comments to true, check for authentication, and if there's no permission, set end-of-block to true.

## Other Dictionary Values

Let's discuss these configuration values:

### generate-footnotes-section

If set to true, we collate all footnotes and list them in a dedicated section, similar to how we handle interlinked content.

### intext-display

This will require more extensive implementation. Only one of "always-popup" or "small-popup-large-margin" can be true. If both are true or both are false, we default to "always-popup".

For "**always-popup**", take inspiration from nblockspopover and render the footnote content (creating a fake block with children if needed). Clicking on the inline dagger will trigger the popup. Text, images, and other elements in this popup will appear in extra small size with slightly muted colors.

The "**small-popup-large-margin**" option has two display behaviors based on screen size. Currently, the article body has max-w-[708px]. On medium and larger screens, we'll display the footnote in the right margin by overflowing. On smaller screens, it will behave like a standard popup.

```
