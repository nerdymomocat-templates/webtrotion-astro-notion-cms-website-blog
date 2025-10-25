# OG Images with Descriptions Implementation

## Overview
Added support for displaying tag and collection descriptions in Open Graph (OG) images. Descriptions are now automatically pulled from Notion and displayed on OG images for tag and collection pages when available.

## Implementation Date
2025-10-25

## Problem Statement
Tag and collection pages were generating OG images without their descriptions, even though descriptions were available in Notion. This resulted in less informative social media previews when sharing tag or collection pages.

## Solution
Modified the OG image generation system to:
1. Fetch descriptions from Notion for both tags and collections
2. Pass descriptions through Astro's `getStaticPaths` props mechanism
3. Conditionally render OG images with descriptions when available
4. Maintain backward compatibility for items without descriptions

## Files Modified

### `src/pages/og-image/[slug].png.ts`
**Single file implementation** - All changes consolidated in the OG image generator.

#### Changes Made:

1. **Import Updates** (Lines 11-12)
   ```typescript
   // ADDED: getAllTagsWithCounts for tag descriptions
   import { getPostBySlug, getAllEntries, getAllTagsWithCounts } from "@/lib/notion/client";
   // ADDED: getCollectionsWDesc for collection descriptions
   import { getCollectionsWDesc } from "@/utils";
   ```

2. **getStaticPaths Updates** (Lines 1193-1202)

   **Tags:**
   ```typescript
   // OLD: Only got tag names without descriptions
   const uniqueTags = [...new Set(posts.flatMap((post) => post.Tags))];
   const tagMap = uniqueTags.map((tag) => ({
     params: { slug: "tagpage---" + tag.name },
   }));

   // NEW: Fetch tags with descriptions and pass via props
   const allTags = await getAllTagsWithCounts();
   const tagMap = allTags.map((tag) => ({
     params: { slug: "tagpage---" + tag.name },
     props: { description: tag.description },
   }));
   ```

   **Collections:**
   ```typescript
   // OLD: Only got collection names without descriptions
   const collections = await getCollections();
   const collectionMap = collections.map((collection) => ({
     params: { slug: "collectionpage---" + collection },
   }));

   // NEW: Fetch collections with descriptions and pass via props
   const collectionsWDesc = await getCollectionsWDesc();
   const collectionMap = collectionsWDesc.map((collection) => ({
     params: { slug: "collectionpage---" + collection.name },
     props: { description: collection.description },
   }));
   ```

3. **GET Function Signature Update** (Line 1062)
   ```typescript
   // OLD:
   export async function GET({ params: { slug } }: APIContext) {

   // NEW: Added props parameter to receive descriptions
   export async function GET({ params: { slug }, props }: APIContext) {
   ```

4. **Collection OG Generation** (Lines 1143-1151)
   ```typescript
   } else if (type == "collectionpage") {
     const collectionDescription = (props as any)?.description || "";
     chosen_markup = collectionDescription
       ? obj_img_none_with_desc(keyStr + " : " + "A collection of posts", " ", collectionDescription, author)
       : obj_img_none_without_desc(
           keyStr + " : " + "A collection of posts",
           " ",
           author,
         );
   }
   ```

5. **Tag OG Generation** (Lines 1156-1160)
   ```typescript
   } else if (type == "tagpage") {
     const tagDescription = (props as any)?.description || "";
     chosen_markup = tagDescription
       ? obj_img_none_with_desc("All posts tagged with #" + keyStr, " ", tagDescription, author)
       : obj_img_none_without_desc("All posts tagged with #" + keyStr, " ", author);
   }
   ```

## Technical Details

### Data Flow
1. **Build Time**: `getStaticPaths()` runs and fetches all tags and collections with descriptions from Notion
2. **Props Passing**: Descriptions are passed via the `props` object to each static path
3. **GET Handler**: Receives props containing the description for the specific tag/collection
4. **Rendering**: Conditionally uses `obj_img_none_with_desc()` or `obj_img_none_without_desc()` based on description availability

### Key Functions Used

#### From `@/lib/notion/client.ts`
- `getAllTagsWithCounts()`: Returns `{ name: string; count: number; description: string; color: string }[]`
  - Fetches tags from Notion database properties
  - Includes descriptions from multi-select options

#### From `@/utils/index.ts`
- `getCollectionsWDesc()`: Returns `{ name: string; description: string }[]`
  - Fetches collections from Notion database properties
  - Includes descriptions from select options

### OG Image Layouts

The implementation uses existing OG image layout functions:
- `obj_img_none_with_desc(title, pubDate, description, author)`: Layout with description text
- `obj_img_none_without_desc(title, pubDate, author)`: Fallback layout without description

## Backward Compatibility

✅ **Fully backward compatible**
- Works with tags/collections that have no descriptions
- Gracefully falls back to original format when description is empty or undefined
- No breaking changes to existing OG image URLs or paths

## Testing

### Test Cases Verified
1. ✅ Tags with descriptions → Shows description in OG image
2. ✅ Tags without descriptions → Shows original format without description
3. ✅ Collections with descriptions → Shows description in OG image
4. ✅ Collections without descriptions → Shows original format without description
5. ✅ Build process completes successfully
6. ✅ No TypeScript errors
7. ✅ Proper heading format maintained:
   - Tags: "All posts tagged with #TagName"
   - Collections: "CollectionName : A collection of posts"

## Benefits

1. **Richer Social Media Previews**: Tag and collection pages now display meaningful descriptions when shared
2. **Automatic Updates**: Descriptions from Notion automatically propagate to OG images
3. **Zero Configuration**: Works automatically for any tag/collection with a description in Notion
4. **Consistent Design**: Uses existing OG image design patterns
5. **Performance**: Descriptions are fetched once at build time, no runtime overhead

## Usage in Notion

To add descriptions that will appear in OG images:

### For Tags:
1. Open your Notion database
2. Click on the "Tags" property settings
3. Edit any tag option
4. Add a description in the description field
5. Rebuild your site

### For Collections:
1. Open your Notion database
2. Click on the "Collection" property settings
3. Edit any collection option
4. Add a description in the description field
5. Rebuild your site

## Example Output

### Before:
- **Tag OG Image**: Title only - "All posts tagged with #Guide"
- **Collection OG Image**: Title only - "Personal Notes : A collection of posts"

### After (with descriptions):
- **Tag OG Image**:
  - Title: "All posts tagged with #Guide"
  - Description: "Step-by-step tutorials and how-to guides"
- **Collection OG Image**:
  - Title: "Personal Notes : A collection of posts"
  - Description: "Personal thoughts, ideas, and reflections"

## Future Enhancements

Potential improvements for future iterations:
- Add support for images in OG descriptions
- Custom OG image templates per tag/collection
- Support for multi-line descriptions with formatting
- Description length truncation for very long descriptions

## Implementation Notes

### Why This Approach?
- **Props vs Dynamic Fetch**: Used Astro's props mechanism rather than fetching descriptions in the GET handler to leverage build-time optimizations
- **Type Casting**: Used `(props as any)` for props access since Astro's APIContext type doesn't explicitly define the props field in TypeScript
- **Conditional Rendering**: Checks for description existence before choosing layout to ensure clean fallback behavior

### Lessons Learned
1. Astro endpoint `.ts` files CAN accept props from `getStaticPaths` (initially uncertain)
2. The OG image generator is completely independent of page components - requires separate data fetching
3. Notion multi-select and select properties support descriptions natively
4. Existing `getAllTagsWithCounts()` and `getCollectionsWDesc()` functions already provided the needed data

## Related Files (Not Modified)

These files already had the infrastructure in place:
- `src/lib/notion/client.ts`: `getAllTagsWithCounts()` function (lines 695-744)
- `src/utils/index.ts`: `getCollectionsWDesc()` function (lines 33-39)
- `src/pages/tags/[tag]/[...page].astro`: Uses descriptions in UI
- `src/pages/collections/[collection]/[...page].astro`: Uses descriptions in UI

## Maintenance

### When to Update:
- No regular maintenance needed
- Changes only required if OG image layout structure changes
- Consider updating if Notion API changes description field structure

### Common Issues:
- **Description not showing**: Ensure description is set in Notion database property options
- **Build errors**: Verify `getAllTagsWithCounts()` and `getCollectionsWDesc()` are working correctly
- **Type errors**: May need to update APIContext type if Astro updates their types

## References

- Astro Static Paths: https://docs.astro.build/en/reference/api-reference/#getstaticpaths
- Satori (OG Image Generation): https://github.com/vercel/satori
- Notion API Multi-select Properties: https://developers.notion.com/reference/property-object#multi-select

---

**Implementation Status**: ✅ Complete and Tested
**Lines of Code Modified**: ~30 lines
**Files Modified**: 1 file
**Breaking Changes**: None
**Performance Impact**: Negligible (build-time only)
