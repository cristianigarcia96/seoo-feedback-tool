// -----------------------------------------------------------------------------
// Coordinate-space conversions (Gotcha #1 from the handoff brief).
//
// There are two spaces:
//
//   ORIGINAL space  — the captured screenshot's own pixels, with NO wireframes
//                     inserted. Everything is persisted in this space.
//   RENDERED space  — what's actually on screen in "Edited version" view, where
//                     every open/collapsed wireframe inserted above a point has
//                     pushed that point further down.
//
// A wireframe inserted at insertY adds `blockHeight(wf)` pixels to everything at
// or below insertY. So the forward map is a monotonic step function:
//
//   rendered(y) = y + Σ blockHeight(wf) for every wf with wf.insertY <= y
//
// and placing a new annotation means inverting it: given a click in rendered
// space, recover the original-space Y it corresponds to. Getting this wrong is
// exactly the bug the brief describes (sections landing far from the click).
//
// In "Original screenshot" view no wireframes are inserted, so rendered == original.
// -----------------------------------------------------------------------------

import type { Wireframe } from "@/lib/types";

/** Rendered height a wireframe contributes to the page flow. */
export const HEADER_H = 44;
export const COLLAPSED_STRIP_H = 68;

export function blockHeight(wf: Pick<Wireframe, "open" | "height">): number {
  return wf.open ? wf.height : COLLAPSED_STRIP_H;
}

type Anchored = Pick<Wireframe, "insertY" | "open" | "height">;

function byInsertY(a: Anchored, b: Anchored) {
  return a.insertY - b.insertY;
}

/**
 * ORIGINAL → RENDERED. Where does an original-space Y appear on screen once
 * every wireframe above it has been sliced in? Used to position comments, SEO
 * badges, and anything else anchored to page content in the edited view.
 */
export function originalToRenderedY(originalY: number, wireframes: Anchored[]): number {
  let rendered = originalY;
  for (const wf of wireframes) {
    if (wf.insertY <= originalY) rendered += blockHeight(wf);
  }
  return rendered;
}

/**
 * RENDERED → ORIGINAL. Invert the step function for a click captured in the
 * rendered page. Walk wireframes top-to-bottom subtracting the height each one
 * contributed above the (progressively corrected) point. Because we compare
 * each insertY against the running original-space cursor, multiple stacked
 * wireframes compose correctly.
 */
export function renderedToOriginalY(renderedY: number, wireframes: Anchored[]): number {
  const sorted = [...wireframes].sort(byInsertY);
  let original = renderedY;
  for (const wf of sorted) {
    if (wf.insertY < original) {
      original -= blockHeight(wf);
    } else {
      break;
    }
  }
  return Math.max(0, original);
}

/**
 * Cut points for slicing the screenshot into bands. Returns, in order, the
 * [startY, endY) band of original-space screenshot that renders before each
 * wireframe, plus the trailing band after the last one. `end` is null for the
 * final band (render to the bottom of the image).
 */
export function sliceBands(
  wireframes: Anchored[],
  screenshotHeight: number,
): Array<{ startY: number; endY: number | null }> {
  const sorted = [...wireframes].sort(byInsertY);
  const bands: Array<{ startY: number; endY: number | null }> = [];
  let cursor = 0;
  for (const wf of sorted) {
    const clamped = Math.max(cursor, Math.min(wf.insertY, screenshotHeight));
    bands.push({ startY: cursor, endY: clamped });
    cursor = clamped;
  }
  bands.push({ startY: cursor, endY: null });
  return bands;
}
