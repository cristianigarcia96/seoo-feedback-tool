// Browserless capture provider. Uses a hosted (or self-hosted) Browserless
// instance to render the page. This is the "third-party screenshot API" path.
//
// Two calls, both stable REST endpoints:
//   POST /content     -> rendered HTML (for page-level meta via seo.ts)
//   POST /function    -> runs a script in the page and returns a base64 full-page
//                        screenshot PLUS element bounding boxes (which only exist
//                        after real layout — see CapturedSeoElement).
//
// Env:
//   BROWSERLESS_URL    e.g. https://chrome.browserless.io  (or your self-hosted)
//   BROWSERLESS_TOKEN  API token
//
// CAPTURE_WIDTH is fixed so original-page pixel space == screenshot pixels 1:1.

import type { CaptureProvider, CaptureResult, CapturedSeoElement } from "./types.ts";
import { parseMeta } from "./seo.ts";

const CAPTURE_WIDTH = 900;

// Script executed inside the page. Collects meta-relevant element rects. Kept in
// a string because it runs in the browser context, not in Deno.
const PAGE_SCRIPT = `
export default async function ({ page }) {
  await page.setViewport({ width: ${CAPTURE_WIDTH}, height: 900, deviceScaleFactor: 1 });
  await page.goto(context.url, { waitUntil: "networkidle2", timeout: 45000 });

  const seoElements = await page.evaluate(() => {
    const out = [];
    const push = (el, type, detail) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      out.push({ type, detail: detail ?? null,
        x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY),
        width: Math.round(r.width), height: Math.round(r.height) });
    };
    document.querySelectorAll("h1").forEach((e) => push(e, "H1"));
    document.querySelectorAll("h2").forEach((e) => push(e, "H2"));
    document.querySelectorAll("img").forEach((e) => push(e, "IMG", e.alt ? 'alt="' + e.alt + '"' : 'alt missing'));
    document.querySelectorAll("a.button, a.btn, .cta a, a.cta").forEach((e) => push(e, "CTA", "internal link"));
    return out;
  });

  const dims = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));

  const screenshot = await page.screenshot({ fullPage: true, encoding: "base64", type: "png" });
  return { data: { screenshot, dims, seoElements }, type: "application/json" };
}
`;

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function createBrowserlessProvider(env: {
  url: string;
  token: string;
}): CaptureProvider {
  const base = env.url.replace(/\/$/, "");
  const auth = `token=${encodeURIComponent(env.token)}`;

  return {
    name: "browserless",
    async capture(url: string): Promise<CaptureResult> {
      // 1) Rendered HTML for page-level meta.
      const contentRes = await fetch(`${base}/content?${auth}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, gotoOptions: { waitUntil: "networkidle2" } }),
      });
      if (!contentRes.ok) throw new Error(`browserless /content ${contentRes.status}`);
      const html = await contentRes.text();

      // 2) Screenshot + element rects in one in-page script.
      const fnRes = await fetch(`${base}/function?${auth}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: PAGE_SCRIPT, context: { url } }),
      });
      if (!fnRes.ok) throw new Error(`browserless /function ${fnRes.status}`);
      const payload = (await fnRes.json()) as {
        screenshot: string;
        dims: { width: number; height: number };
        seoElements: CapturedSeoElement[];
      };

      return {
        screenshot: b64ToBytes(payload.screenshot),
        contentType: "image/png",
        width: CAPTURE_WIDTH,
        height: payload.dims?.height ?? 0,
        meta: parseMeta(html),
        seoElements: payload.seoElements ?? [],
      };
    },
  };
}
