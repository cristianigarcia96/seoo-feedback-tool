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

const CAPTURE_WIDTH = 1280;

// Script executed inside the page. Collects meta-relevant element rects. Kept in
// a string because it runs in the browser context, not in Deno.
const PAGE_SCRIPT = `
export default async function ({ page, context }) {
  await page.setViewport({ width: ${CAPTURE_WIDTH}, height: 1200, deviceScaleFactor: 1 });
  await page.goto(context.url, { waitUntil: "networkidle2", timeout: 60000 });

  // Let late pop-ups / consent modals mount, then dismiss anything that would
  // block the page or freeze scrolling (which collapses the full-page height).
  await new Promise((r) => setTimeout(r, 2000));
  try { await page.keyboard.press("Escape"); } catch (e) {}

  await page.evaluate(() => {
    const KILL = /(cookie|consent|gdpr|newsletter|popup|pop-up|modal|subscribe|klaviyo|interstitial)/i;
    const vw = innerWidth, vh = innerHeight;
    // Only ever remove OVERLAYS — elements out of normal flow. In-flow page
    // content (static/relative) is never touched, so the page can't be blanked.
    document.querySelectorAll("body *").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed" && cs.position !== "sticky") return;
      const role = el.getAttribute && el.getAttribute("role");
      const modalAttr = el.getAttribute && el.getAttribute("aria-modal");
      const z = parseInt(cs.zIndex) || 0;
      const r = el.getBoundingClientRect();
      const coversMost = r.width >= vw * 0.9 && r.height >= vh * 0.7; // backdrop/modal
      let cls = "";
      try { cls = (el.className && el.className.baseVal !== undefined) ? el.className.baseVal : (el.className || ""); } catch (e) {}
      const named = KILL.test((el.id || "") + " " + cls);
      if (role === "dialog" || modalAttr === "true" || coversMost || z >= 1000 || named) {
        el.remove();
      }
    });
    for (const node of [document.documentElement, document.body]) {
      node.style.overflow = "visible"; node.style.position = "static"; node.style.height = "auto";
    }
    ["no-scroll","modal-open","overflow-hidden","is-locked","noscroll","scroll-lock"].forEach((c) => {
      document.documentElement.classList.remove(c); document.body.classList.remove(c);
    });
  });

  // Scroll through the page to trigger lazy-loaded images, then return to top.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0; const step = 700;
      const t = setInterval(() => {
        window.scrollBy(0, step); y += step;
        if (y >= document.body.scrollHeight) { clearInterval(t); resolve(); }
      }, 120);
    });
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.evaluate(() => window.scrollTo(0, 0));

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
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
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
      // Browserless v2 wraps the function's return under `data` ({ data, type });
      // older/self-hosted returns it flat. Accept both.
      const raw = (await fnRes.json()) as {
        data?: { screenshot: string; dims?: { width: number; height: number }; seoElements?: CapturedSeoElement[] };
        screenshot?: string;
        dims?: { width: number; height: number };
        seoElements?: CapturedSeoElement[];
      };
      const payload = raw.data ?? raw;
      if (!payload.screenshot) {
        throw new Error("browserless /function returned no screenshot");
      }

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
