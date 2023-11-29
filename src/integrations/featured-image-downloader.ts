import type { AstroIntegration } from 'astro'
import { downloadFile, getAllEntries, generateFilePath } from '../lib/notion/client'
import { LAST_BUILD_TIME } from '../constants'
import fs from "node:fs";

export default (): AstroIntegration => ({
  name: 'featured-image-downloader',
  hooks: {
    'astro:build:start': async () => {
      const posts = await getAllEntries()

      await Promise.all(
        posts.map((post) => {
          if (!post.FeaturedImage || !post.FeaturedImage.Url || (post.LastUpdatedTimeStamp < LAST_BUILD_TIME && !fs.existsSync(generateFilePath(new URL(post.FeaturedImage.Url))))) {
            return Promise.resolve()
          }

          let url!: URL
          try {
            url = new URL(post.FeaturedImage.Url)
          } catch (err) {
            console.log('Invalid FeaturedImage URL')
            return Promise.resolve()
          }

          return downloadFile(url, false)
        })
      )
    },
  },
})
