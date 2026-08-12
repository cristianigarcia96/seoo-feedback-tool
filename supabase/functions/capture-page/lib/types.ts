// Shared shapes for the capture pipeline.

export interface CapturedSeoElement {
  type: "H1" | "H2" | "H3" | "IMG" | "CTA" | "LINK";
  detail: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureMeta {
  titleTag: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  h1Count: number | null;
}

export interface CaptureResult {
  /** Full-page screenshot bytes. */
  screenshot: Uint8Array;
  contentType: string; // e.g. "image/png"
  /** Intrinsic size in original-page pixels (capture width + full scroll height). */
  width: number;
  height: number;
  meta: CaptureMeta;
  /** Tagged elements with bounding boxes in original-page space. */
  seoElements: CapturedSeoElement[];
}

export interface CaptureProvider {
  readonly name: string;
  capture(url: string): Promise<CaptureResult>;
}
