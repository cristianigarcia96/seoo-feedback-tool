// Lightweight HTML parsing for PAGE-LEVEL SEO metadata (title, meta description,
// canonical, robots, H1 count). Element bounding boxes are NOT derivable from raw
// HTML — those require a real browser layout and come from the provider's
// in-browser evaluation (see browserless.ts). This is regex-based on purpose:
// edge functions run on Deno with no DOM, and we only need a handful of tags.

import type { CaptureMeta } from "./types.ts";

function firstMatch(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

export function parseMeta(html: string): CaptureMeta {
  const titleTag = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = firstMatch(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i,
  );
  const canonical = firstMatch(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([\s\S]*?)["']/i,
  );
  const robots = firstMatch(
    html,
    /<meta[^>]+name=["']robots["'][^>]+content=["']([\s\S]*?)["']/i,
  );
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;

  return { titleTag, metaDescription, canonical, robots, h1Count };
}
