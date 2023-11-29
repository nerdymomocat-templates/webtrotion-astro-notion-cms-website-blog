import type { AstroIntegration } from 'astro'
import type { FileObject } from '../lib/interfaces'
import { getDatabase, downloadFile, generateFilePath } from '../lib/notion/client'
import { LAST_BUILD_TIME } from '../constants'
import fs from "node:fs";

export default (): AstroIntegration => ({
  name: 'custom-icon-downloader',
  hooks: {
    'astro:build:start': async () => {
      const database = await getDatabase();
      const icon = database.Icon as FileObject
      let url!: URL
      try {
        url = new URL(icon.Url)
      } catch (err) {
        console.log('Invalid Icon image URL')
        return Promise.resolve()
      }

      // if (!database.Icon || database.Icon.Type !== 'file' || (database.LastUpdatedTimeStamp < LAST_BUILD_TIME && !fs.existsSync(generateFilePath(url)))) {
      if (!database.Icon || database.Icon.Type !== 'file') {
        return Promise.resolve()
      }




      return downloadFile(url, false, true)
    },
  },
})
