import { map } from "nanostores";
import type { Footnote } from "./interfaces";

export const footnotes = map<Record<string, Footnote>>({});
export const footnoteOrder = map<Record<string, number>>({});
let counter = 1;

export function addFootnote(footnote: { tag: string; content: string; blockId: string }) {
  if (!footnotes.get()[footnote.tag]) {
    footnotes.setKey(footnote.tag, {
      content: footnote.content,
      blockId: footnote.blockId,
    });
    footnoteOrder.setKey(footnote.tag, counter++);
  }
}

export function resetFootnotes() {
  footnotes.set({});
  footnoteOrder.set({});
  counter = 1;
}
