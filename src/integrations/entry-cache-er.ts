import type { AstroIntegration } from 'astro'
import { downloadFile, getAllEntries, generateFilePath, getPostContentByPostId } from '../lib/notion/client'
import { LAST_BUILD_TIME } from '../constants'
import fs from "node:fs";
import path from "path";
import { ReferencesInPage, Block } from '../lib/interfaces';

export default (): AstroIntegration => ({
  name: 'entry-cache-er',
  hooks: {
    'astro:build:start': async () => {
      const entries = await getAllEntries();

      const referencesInEntries = await Promise.all(
        entries.map(async (entry) => {
          let tasks = [];

          // Conditionally add the downloadFile task
          if (entry.FeaturedImage && entry.FeaturedImage.Url && !(LAST_BUILD_TIME && entry.LastUpdatedTimeStamp < LAST_BUILD_TIME && !fs.existsSync(generateFilePath(new URL(entry.FeaturedImage.Url))))) {
            let url;
            try {
              url = new URL(entry.FeaturedImage.Url);
              tasks.push(downloadFile(url, false));
            } catch (err) {
              console.log('Invalid FeaturedImage URL');
            }
          }

          // Add the getPostContentByPostId task
          const postContentPromise = getPostContentByPostId(entry).then(result => ({ referencesInPage: result.referencesInPage, entryId: entry.PageId }));
          tasks.push(postContentPromise);

          // Wait for all tasks for this entry to complete
          await Promise.all(tasks);

          // Return only the referencesInPage
          return postContentPromise;
        })
      );

      // Once all entries are processed, call createBlockIdPostIdMap with the referencesInPages
      createBlockIdPostIdMap(referencesInEntries);
      createReferencesToThisEntry(referencesInEntries);
    },
  },
});


function createBlockIdPostIdMap(referencesInEntries) {
  const blockIdToPostIdMap = referencesInEntries.reduce((acc, { referencesInPage, entryId }) => {
    if (referencesInPage) {
      for (const reference of referencesInPage) {
        const blockId = reference.block.Id; // Assuming each block has a unique 'id' property
        acc[blockId] = entryId;
      }
    }
    return acc;
  }, {});

  const blockToPostIdPath = path.join('./tmp', "blockid_to_postid_map.json");
  fs.writeFileSync(blockToPostIdPath, JSON.stringify(blockIdToPostIdMap, null, 2), 'utf-8');

  return true;
}


function createReferencesToThisEntry(referencesInEntries: { referencesInPage: ReferencesInPage[] | null, entryId: string }[]) {
  const entryReferencesMap: { [entryId: string]: { entryId: string, block: Block }[] } = {};

  // Initialize entryReferencesMap with empty arrays for each entry
  referencesInEntries.forEach(({ entryId }) => {
    entryReferencesMap[entryId] = [];
  });

  // Collect blocks for each entry if there's a match in other_pages
  referencesInEntries.forEach(({ referencesInPage, entryId }) => {
    if (referencesInPage) {
      referencesInPage.forEach(reference => {
        // Check and collect blocks where InternalHref.PageId matches an entryId in the map
        reference.other_pages.forEach(richText => {
          if (richText.InternalHref?.PageId && entryReferencesMap[richText.InternalHref.PageId]) {
            entryReferencesMap[richText.InternalHref.PageId].push({ entryId: entryId, block: reference.block });
          }
        });

        // Check and collect blocks where link_to_pageid matches an entryId in the map
        if (reference.link_to_pageid && entryReferencesMap[reference.link_to_pageid]) {
          entryReferencesMap[reference.link_to_pageid].push({ entryId: entryId, block: reference.block });
        }
      });
    }
  });

  // Write each entry's references to a file
  Object.entries(entryReferencesMap).forEach(([entryId, references]) => {
    const filePath = path.join('./tmp', `${entryId}_ReferencesToPage.json`);
    fs.writeFileSync(filePath, JSON.stringify(references, null, 2), 'utf-8');
  });
}




