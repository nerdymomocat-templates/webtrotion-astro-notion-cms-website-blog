# Implementation Plan: Footnote Issues and Margin Overlap

## Issues to Fix

### Issue 1: Footnote Section Alignment ✅ SIMPLE FIX
**Problem**: The footnote marker `[1]` is not aligned with the baseline of the footnote content text.

**Current Code** (FootnotesSection.astro line 71):
```astro
<li class="flex gap-2">
```

**Solution**: Change from `flex` (default align-items: stretch) to use baseline alignment:
```astro
<li class="flex gap-2 items-baseline">
```

**Impact**: Minimal - one class addition
**Files**: `src/components/blog/FootnotesSection.astro`

---

### Issue 2: Start-of-Child-Blocks with Multiple Children Not Showing ⚠️ NEEDS INVESTIGATION

**Problem**: When using start-of-child-blocks source, if a footnote has multiple child blocks (e.g., a paragraph with an image child), the footnote shows in popup/margin but not in the footnotes section.

**Hypothesis**: The `extractFootnotesInPage()` function might not be collecting footnotes from child blocks that have their own children because it only looks at `block.Footnotes` property, but start-of-child-blocks creates footnote content as `{ Type: "blocks", Blocks: [child] }` which might have nested blocks.

**Investigation Needed**:
1. Check if footnote blocks with children are being added to `block.Footnotes` array correctly
2. Verify that `extractFootnotesInPage()` is finding all footnotes including those with nested children
3. Check if the issue is in extraction or rendering

**Current Code** (footnotes.ts line 883):
```typescript
footnotes.push({
    Marker: marker,
    FullMarker: `[^${markerPrefix}${marker}]`,
    Content: {
        Type: "blocks",
        Blocks: [child],  // This child might have its own children
    },
    SourceLocation: "content",
});
```

**Potential Issue**: When this footnote is pushed to `block.Footnotes`, and later `extractFootnotesInPage()` collects it, the child block inside `Content.Blocks` might have its own children that need rendering. But `FootnotesSection.astro` line 138 has:
```astro
<NotionBlocks blocks={footnote.Content.Blocks} renderChildren={false} />
```

**Solution**: Change `renderChildren={false}` to `renderChildren={true}` in FootnotesSection.astro line 138.

**Impact**: Medium - allows nested blocks to render in footnotes section
**Files**: `src/components/blog/FootnotesSection.astro`

---

### Issue 3: Margin Notes Overlapping ⚠️ COMPLEX PROBLEM

**Problem**: When a block has two footnotes, and the second footnote is very long, it can overlap with footnotes from the next block. This is especially problematic for margin notes.

**Current Behavior** (Base.astro lines 450-467):
- `stackOverlappingNotes()` function only stacks notes from the SAME rendering pass
- If Block 1 has footnotes A and B, and Block 2 has footnotes C and D, the function stacks A→B and C→D separately
- But if B is very long, it can extend down and overlap with C

**Example Scenario**:
```
Block 1 text with [1] and [2]     |  [1]: Short note
                                   |  [2]: Very long note
Block 2 text with [3] and [4]     |       that extends down
                                   |       and overlaps with [3]: Next note
                                   |  [4]: Another note
```

**Possible Solutions**:

#### Option A: Global Stacking (Recommended)
- Collect ALL margin notes on the page
- Sort by vertical position
- Stack them globally with minimum gaps
- **Pros**: Ensures no overlaps ever
- **Cons**: More complex, need to track all notes globally

#### Option B: Height-Based Truncation with Expand
- Set a maximum height for each margin note (e.g., 200px)
- Truncate with `overflow: hidden` and add "Show more" button
- Clicking expands to full height and restacks
- **Pros**: Prevents most overlaps, keeps notes compact
- **Cons**: Requires clicking to see full content, more UI complexity

#### Option C: Lazy Stacking with Collision Detection
- Initial render positions notes at marker positions
- After render, check for collisions using `getBoundingClientRect()`
- Push down any colliding notes
- Repeat until no collisions
- **Pros**: More accurate, works with dynamic content
- **Cons**: May cause layout shift, more expensive

#### Option D: Fixed Height Slots (Like Tufte CSS)
- Each block gets a "slot" of fixed height (e.g., min-height of block)
- Margin notes for that block can only use that slot height
- Truncate with expand button if content exceeds slot
- **Pros**: Guarantees no overlap between blocks
- **Cons**: Very restrictive, may hide content

**Recommended Approach**: Option A (Global Stacking)

**Implementation Plan**:

1. **Modify `positionMarginNotes()` function** (Base.astro line 384):
   - Don't call `stackOverlappingNotes()` inside the forEach loop
   - Instead, collect all notes and their initial positions
   - After all notes are created, call global stacking function

2. **Create `stackAllMarginNotesGlobally()` function**:
   ```javascript
   function stackAllMarginNotesGlobally() {
     // Find all margin notes in the document
     const allNotes = Array.from(document.querySelectorAll('.footnote-margin-note'));

     // Sort by initial top position
     allNotes.sort((a, b) => {
       const aTop = parseInt(a.style.top) || 0;
       const bTop = parseInt(b.style.top) || 0;
       return aTop - bTop;
     });

     // Stack with minimum gap
     for (let i = 1; i < allNotes.length; i++) {
       const prevNote = allNotes[i - 1];
       const currNote = allNotes[i];

       const prevTop = parseInt(prevNote.style.top) || 0;
       const prevBottom = prevTop + prevNote.offsetHeight;
       const currTop = parseInt(currNote.style.top) || 0;

       // If current note would overlap, push it down
       if (currTop < prevBottom + 8) {
         currNote.style.top = `${prevBottom + 8}px`;
       }
     }
   }
   ```

3. **Update `positionMarginNotes()`**:
   ```javascript
   function positionMarginNotes() {
     const markers = document.querySelectorAll('[data-margin-note]');

     markers.forEach((markerEl) => {
       // ... existing code to create and position notes ...
       // Remove stackOverlappingNotes() call here
     });

     // After all notes are created, stack globally
     stackAllMarginNotesGlobally();
   }
   ```

4. **Consider Height-Based Truncation** (Optional Enhancement):
   - Add maximum height to margin notes (e.g., `max-height: 300px`)
   - Add `overflow: hidden` by default
   - Add expand/collapse button for notes exceeding max height
   - On expand, rerun global stacking

**Alternative Simpler Approach**: Height-Based Truncation Only
If global stacking proves too complex or causes issues, we could just implement truncation:

```css
.footnote-margin-note {
  max-height: 200px;
  overflow: hidden;
  position: relative;
}

.footnote-margin-note.expanded {
  max-height: none;
}

.footnote-margin-note-expand-btn {
  display: none;  /* Hidden by default */
}

.footnote-margin-note.truncated .footnote-margin-note-expand-btn {
  display: block;  /* Show button if content is truncated */
}
```

**Files to Modify**:
- `src/layouts/Base.astro` - Margin notes JavaScript and CSS

**Impact**: High - requires careful testing to ensure no layout shifts or performance issues

---

## Implementation Order

1. ✅ **Fix Issue 1 (Alignment)** - 1 minute
   - Add `items-baseline` class
   - Test footnotes section rendering

2. ✅ **Fix Issue 2 (Multi-block footnotes)** - 2 minutes
   - Change `renderChildren={false}` to `renderChildren={true}`
   - Test with footnote that has image child

3. ⚠️ **Investigate Issue 3 (Overlap)** - Research phase
   - Review current stacking logic
   - Identify edge cases
   - Decide on approach (global stacking vs truncation)

4. 🔧 **Implement Issue 3 Fix** - 30-60 minutes
   - Implement chosen approach
   - Add CSS for truncation if needed
   - Test with various scenarios:
     - Multiple blocks with multiple footnotes each
     - Very long footnotes
     - Short and long footnotes mixed
     - Resize behavior

---

## Testing Checklist

### Issue 1 (Alignment):
- [ ] Footnote number aligns with first line of text
- [ ] Works for all three content types (rich_text, blocks, comment)
- [ ] Works in light and dark mode

### Issue 2 (Multi-block):
- [ ] Footnote with single child shows in section
- [ ] Footnote with child + grandchildren shows in section
- [ ] Footnote with image child renders image in section
- [ ] Footnote with nested blocks renders all levels

### Issue 3 (Overlap):
- [ ] Two footnotes in same block don't overlap
- [ ] Long footnote in Block 1 doesn't overlap with Block 2 footnotes
- [ ] Three+ blocks with footnotes stack correctly
- [ ] Resize window maintains proper stacking
- [ ] Hover highlighting still works after stacking
- [ ] No layout shift or jank during stacking
- [ ] Performance acceptable with 20+ footnotes

---

## Risk Assessment

### Low Risk:
- Issue 1 (alignment) - Simple class addition, no breaking changes

### Medium Risk:
- Issue 2 (multi-block) - Changing renderChildren to true might have unintended consequences if child blocks have unexpected structure

### High Risk:
- Issue 3 (overlap) - Global stacking could cause:
  - Layout shifts during rendering
  - Performance issues with many footnotes
  - Unexpected behavior with dynamic content
  - Issues with resize/reflow

---

## Rollback Plan

If Issue 3 fix causes problems:
1. Revert to current stacking logic (per-batch only)
2. Implement simpler truncation-only approach
3. Document limitation that very long footnotes may overlap

---

## Open Questions

1. **For Issue 2**: Should we limit recursion depth for nested blocks in footnotes? (e.g., max 2 levels deep)
2. **For Issue 3**: Should we implement truncation regardless of stacking approach? (helps readability)
3. **For Issue 3**: What's the ideal max-height for truncated margin notes? (200px? 300px? Based on block height?)
4. **For Issue 3**: Should expand/collapse be animated? (smooth transition vs instant)

---

## User Preferences

Based on user's message:
> "maybe each block gets a collapsed size I guess the size of footnote that the size of block is. I don't know what the ideal situation here is but think about how to fix it."

This suggests the user is open to:
- Height-based truncation
- Per-block slot allocation
- Some form of collapse/expand mechanism

User seems uncertain about the ideal solution, so we should:
1. Implement the simplest working fix first (global stacking)
2. Test and show results
3. If still unsatisfactory, add truncation as enhancement
4. Get user feedback before implementing complex UI (expand/collapse buttons)
