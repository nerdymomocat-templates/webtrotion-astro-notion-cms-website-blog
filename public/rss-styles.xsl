<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <style type="text/css">
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
          }
          .header {
            background: #000;
            color: white;
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          .header p {
            color: #ccc;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }
          .header .feed-info {
            font-size: 0.9rem;
            color: #999;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          .header .feed-info p {
            margin-bottom: 0.25rem;
            font-size: 0.9rem;
          }
          .header a {
            color: #fff;
            text-decoration: underline;
            text-decoration-color: rgba(255,255,255,0.3);
          }
          .header a:hover {
            text-decoration-color: rgba(255,255,255,0.8);
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }
          article {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            overflow: hidden;
          }
          article header {
            padding: 1.5rem;
            border-bottom: 1px solid #eee;
          }
          article h2 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
          }
          article h2 a {
            color: #333;
            text-decoration: none;
          }
          article h2 a:hover {
            color: #0066cc;
          }
          article time {
            color: #666;
            font-size: 0.9rem;
          }
          .-feed-entry-content {
            padding: 1.5rem;
          }
          .-feed-entry-content p {
            margin-bottom: 1rem;
          }
          .-feed-entry-content img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 1rem 0;
          }
          .-feed-entry-content pre {
            background: #f8f8f8;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
          }
          .-feed-entry-content blockquote {
            border-left: 4px solid #eee;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #666;
          }
          @media (max-width: 600px) {
            .header {
              padding: 1.5rem 1rem;
            }
            .header h1 {
              font-size: 1.5rem;
            }
            article header {
              padding: 1rem;
            }
            .-feed-entry-content {
              padding: 1rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p><xsl:value-of select="/rss/channel/description"/></p>
          <div class="feed-info">
            <p>📫 <strong>Subscribe to this RSS feed</strong> to stay updated with the latest content!</p>
            <p>🔗 Feed URL: <a><xsl:attribute name="href"><xsl:value-of select="/rss/channel/link"/></xsl:attribute><xsl:value-of select="/rss/channel/link"/></a></p>
            <p>🕒 Last Updated: <xsl:value-of select="/rss/channel/lastBuildDate"/></p>
            <xsl:if test="/rss/channel/author">
              <p>✍️ Author: <xsl:value-of select="/rss/channel/author"/></p>
            </xsl:if>
          </div>
        </div>
        <div class="container">
          <xsl:for-each select="/rss/channel/item">
            <article>
              <header>
                <h2>
                  <a href="{link}" target="_blank">
                    <xsl:value-of select="title"/>
                  </a>
                </h2>
                <time><xsl:value-of select="pubDate"/></time>
              </header>
              <div class="-feed-entry-content">
                <xsl:choose>
                  <xsl:when test="content">
                    <xsl:value-of select="content" disable-output-escaping="yes"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="description" disable-output-escaping="yes"/>
                  </xsl:otherwise>
                </xsl:choose>
              </div>
            </article>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
