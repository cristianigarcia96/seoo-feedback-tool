// Seed data for the in-memory demo repository. Mirrors the "Wool&Rest" page
// from the prototype so the app is explorable with zero backend. Multi-tenant
// shape (client → project → page) is present from the start per the brief.

import type { Client, Comment, Page, Project, SeoElement, Wireframe } from "@/lib/types";
import { DEMO_SCREENSHOT_HEIGHT, DEMO_SCREENSHOT_URL } from "./demoScreenshot";

export const DEMO_SHARE_TOKEN = "demo-woolrest-share";
const now = "2026-08-11T09:00:00.000Z";

export const demoClients: Client[] = [
  { id: "client-woolroom", name: "Woolroom", createdAt: now },
  { id: "client-inspired", name: "Inspired Closets", createdAt: now },
];

export const demoProjects: Project[] = [
  { id: "project-woolrest", clientId: "client-woolroom", name: "Homepage refresh", createdAt: now },
];

export const demoPages: Page[] = [
  {
    id: "page-woolrest-home",
    projectId: "project-woolrest",
    sourceUrl: "https://woolandrest.com",
    status: "ready",
    screenshotUrl: DEMO_SCREENSHOT_URL,
    screenshotWidth: 900,
    screenshotHeight: DEMO_SCREENSHOT_HEIGHT,
    seoMeta: {
      titleTag: "Wool&Rest — Natural Wool Bedding",
      metaDescription:
        "Wool duvets and bedding sourced from small British farms. Naturally temperature-regulating.",
      canonical: "https://woolandrest.com/",
      robots: "index, follow",
      h1Count: 1,
    },
    shareToken: DEMO_SHARE_TOKEN,
    createdAt: now,
  },
];

export const demoSeoElements: SeoElement[] = [
  { id: "seo-h1", pageId: "page-woolrest-home", type: "H1", detail: null, x: 250, y: 158, width: 400, height: 34 },
  { id: "seo-cta", pageId: "page-woolrest-home", type: "CTA", detail: "internal link", x: 390, y: 248, width: 120, height: 40 },
  { id: "seo-img1", pageId: "page-woolrest-home", type: "IMG", detail: 'alt="Product 1 — wool duvet"', x: 60, y: 364, width: 240, height: 140 },
  { id: "seo-img2", pageId: "page-woolrest-home", type: "IMG", detail: 'alt="Product 2 — wool duvet"', x: 330, y: 364, width: 240, height: 140 },
  { id: "seo-img3", pageId: "page-woolrest-home", type: "IMG", detail: 'alt="Product 3 — wool duvet"', x: 600, y: 364, width: 240, height: 140 },
  { id: "seo-imgfarm", pageId: "page-woolrest-home", type: "IMG", detail: 'alt="Farmer with sheep, Yorkshire Dales"', x: 64, y: 674, width: 368, height: 180 },
  { id: "seo-h2story", pageId: "page-woolrest-home", type: "H2", detail: null, x: 470, y: 716, width: 300, height: 26 },
  { id: "seo-h2reviews", pageId: "page-woolrest-home", type: "H2", detail: null, x: 330, y: 910, width: 240, height: 20 },
];

export const demoComments: Comment[] = [
  {
    id: "comment-meta",
    pageId: "page-woolrest-home",
    x: 250,
    y: 158,
    author: "SEO",
    title: "Meta title too generic",
    note: "Current title tag doesn't include the primary keyword.",
    suggestedCopy: "Merino Wool Duvets & Bedding | Wool&Rest",
    resolved: false,
    clientReply: null,
    createdAt: now,
  },
];

export const demoWireframes: Wireframe[] = [
  {
    id: "wireframe-hero",
    pageId: "page-woolrest-home",
    insertY: 334,
    title: "Hero restructure",
    height: 280,
    open: true,
    createdAt: now,
    elements: [
      { id: "wfe-1", wireframeId: "wireframe-hero", type: "text", preset: "heading", content: "New headline: lead with the wool sourcing story", x: 40, y: 24, width: 340, height: 0, label: "", z: 0 },
      { id: "wfe-2", wireframeId: "wireframe-hero", type: "text", preset: "body", content: "Supporting line: naturally breathable, ethically farmed, 30-night trial.", x: 40, y: 60, width: 320, height: 0, label: "", z: 1 },
      { id: "wfe-3", wireframeId: "wireframe-hero", type: "rect", preset: "body", content: "", x: 40, y: 104, width: 340, height: 40, label: "Trust badges row", z: 2 },
      { id: "wfe-4", wireframeId: "wireframe-hero", type: "rect", preset: "body", content: "", x: 40, y: 164, width: 140, height: 36, label: "CTA button", z: 3 },
      { id: "wfe-5", wireframeId: "wireframe-hero", type: "line", preset: "body", content: "", x: 40, y: 224, width: 340, height: 0, label: "", z: 4 },
    ],
  },
];
