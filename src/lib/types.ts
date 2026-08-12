// -----------------------------------------------------------------------------
// Domain model. This is the app's own vocabulary — the repository layer maps
// database rows to these shapes, so UI code never touches DB column names.
//
// Coordinate convention (IMPORTANT — see features/annotator/coords.ts):
//   All stored positions (comment x/y, wireframe insertY, seo element boxes)
//   live in ORIGINAL-page pixel space: the coordinate system of the captured
//   screenshot at CAPTURE_WIDTH, with NO wireframes inserted. The renderer
//   converts to on-screen ("rendered") space per view. Never persist a
//   rendered-space value.
// -----------------------------------------------------------------------------

/** Default width a page is captured at — a realistic desktop viewport, so sites
 *  render the layout a real user sees (not a cramped tablet breakpoint). Each
 *  page stores its own `screenshotWidth`, and the renderer sizes the frame from
 *  that per page, so captures at different widths all stay pixel-aligned. This
 *  is the default the capture provider uses and the fallback frame width. */
export const CAPTURE_WIDTH = 1280;

export type PageStatus = "pending" | "capturing" | "ready" | "failed";

export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  createdAt: string;
}

/** A single snapshot session of a client's page. */
export interface Page {
  id: string;
  projectId: string;
  sourceUrl: string;
  status: PageStatus;
  /** Public URL of the captured full-page screenshot (Supabase Storage). */
  screenshotUrl: string | null;
  /** Intrinsic pixels of the screenshot in original-page space. */
  screenshotWidth: number;
  screenshotHeight: number;
  /** Page-level SEO metadata not tied to one on-page element. */
  seoMeta: PageSeoMeta;
  /** Opaque token used for the no-login client share link. */
  shareToken: string;
  createdAt: string;
}

export interface PageSeoMeta {
  titleTag: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  h1Count: number | null;
}

export type SeoElementType = "H1" | "H2" | "H3" | "IMG" | "CTA" | "LINK";

/** A tagged on-page element with a bounding box, shown as a hover badge.
 *  Box is in original-page space. */
export interface SeoElement {
  id: string;
  pageId: string;
  type: SeoElementType;
  /** e.g. `alt="Farmer with sheep"` or `internal link` — shown after the tag. */
  detail: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Comment {
  id: string;
  pageId: string;
  /** Original-page space. */
  x: number;
  y: number;
  author: string;
  title: string;
  note: string;
  /** Actionable replacement text (rendered in green). null = not provided. */
  suggestedCopy: string | null;
  resolved: boolean;
  /** Optional single reply from the client side (two-way is still open). */
  clientReply: string | null;
  createdAt: string;
}

export type TextPreset = "heading" | "subhead" | "body";
export type WireframeElementType = "text" | "rect" | "line";

export interface WireframeElement {
  id: string;
  wireframeId: string;
  type: WireframeElementType;
  /** Local to the wireframe canvas (not page space). */
  x: number;
  y: number;
  width: number;
  /** rect only; text/line ignore it. */
  height: number;
  /** text only. */
  content: string;
  /** text only. */
  preset: TextPreset;
  /** rect only. */
  label: string;
  /** stacking order within the wireframe. */
  z: number;
}

export interface Wireframe {
  id: string;
  pageId: string;
  /** Anchor point in ORIGINAL-page space — where this section slices in. */
  insertY: number;
  title: string;
  /** Rendered height of the canvas body area when open. */
  height: number;
  open: boolean;
  elements: WireframeElement[];
  createdAt: string;
}

/** Everything needed to render one page for either view. */
export interface PageBundle {
  page: Page;
  seoElements: SeoElement[];
  comments: Comment[];
  wireframes: Wireframe[];
}
