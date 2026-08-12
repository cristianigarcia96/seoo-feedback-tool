// Mock capture provider: returns a canned screenshot + SEO data with no network.
// Lets `createPage` work end-to-end locally before a real screenshot vendor is
// wired. Selected when CAPTURE_PROVIDER is unset or "mock".

import type { CaptureProvider, CaptureResult } from "./types.ts";

// 1x1 transparent PNG — placeholder bytes so Storage upload has something real.
// The mock's screenshot_url is set to a data URI in index.ts for a nicer preview;
// these bytes exist only to exercise the upload path.
const ONE_PX_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
);

export function createMockProvider(): CaptureProvider {
  return {
    name: "mock",
    async capture(url: string): Promise<CaptureResult> {
      return {
        screenshot: ONE_PX_PNG,
        contentType: "image/png",
        width: 900,
        height: 1204,
        meta: {
          titleTag: `Captured: ${url}`,
          metaDescription: "Mock capture — wire a real provider via CAPTURE_PROVIDER.",
          canonical: url,
          robots: "index, follow",
          h1Count: 1,
        },
        seoElements: [
          { type: "H1", detail: null, x: 250, y: 158, width: 400, height: 34 },
          { type: "CTA", detail: "internal link", x: 390, y: 248, width: 120, height: 40 },
        ],
      };
    },
  };
}
