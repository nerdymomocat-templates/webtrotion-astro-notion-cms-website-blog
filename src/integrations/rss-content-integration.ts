import fs from 'fs/promises';
import path from 'path';
import sanitizeHtml from 'sanitize-html';
import type { AstroIntegration } from 'astro';

function cleanHTML(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['img', 'code', 'pre', 'p', 'div', 'blockquote', 'ol', 'li', 'ul', 'a', 'em', 'strong', 'span'],
    allowedAttributes: {
      'a': ['href', 'name', 'target'],
      'img': ['src', 'alt', 'title']
    },
    selfClosing: ['img', 'br', 'hr'],
    allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
    allowProtocolRelative: true
  });
}

async function updateRSS(distPath: string): Promise<void> {
  const rssPath = path.join(distPath, 'rss.xml');
  let rssContent = await fs.readFile(rssPath, 'utf-8');

  // Use sanitize-html to parse and manipulate the RSS XML
  rssContent = sanitizeHtml(rssContent, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['rss', 'channel', 'title', 'link', 'description', 'item', 'guid', 'pubDate']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'rss': ['version'],
      'guid': ['isPermaLink']
    },
    parser: {
      xmlMode: true
    },
    transformTags: {
      'item': function(tagName, attribs, children) {
        const link = children.find(child => child.tag === 'link')?.children[0]?.text;
        if (link) {
          const htmlPath = path.join(distPath, link.replace(import.meta.env.SITE, ''), 'index.html');
          try {
            const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
            const cleanedContent = cleanHTML(htmlContent);
            const descriptionIndex = children.findIndex(child => child.tag === 'description');
            if (descriptionIndex !== -1) {
              children[descriptionIndex] = {
                tag: 'description',
                children: [{ text: `<![CDATA[${cleanedContent}]]>` }]
              };
            } else {
              children.push({
                tag: 'description',
                children: [{ text: `<![CDATA[${cleanedContent}]]>` }]
              });
            }
          } catch (error) {
            console.error(`Error processing ${htmlPath}:`, error);
          }
        }
        return { tagName, attribs, children };
      }
    }
  });

  await fs.writeFile(rssPath, rssContent);
}

export default function rssContentIntegration(): AstroIntegration {
  return {
    name: 'rss-content-integration',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distPath = new URL('.', dir).pathname;
        await updateRSS(distPath);
        console.log('RSS feed updated with full content');
      },
    },
  };
}
