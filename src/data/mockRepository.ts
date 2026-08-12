// In-memory Repository backed by demo data. Used when Supabase isn't configured
// (VITE_SUPABASE_URL blank) so the whole app — editor + share view — runs and is
// clickable with no backend. Mutations persist for the session only.

import type { Comment, Page, PageBundle, Wireframe, WireframeElement } from "@/lib/types";
import type { NewComment, NewWireframe, Repository } from "./repository";
import {
  demoClients,
  demoComments,
  demoPages,
  demoProjects,
  demoSeoElements,
  demoWireframes,
} from "./demoData";

let seq = 1000;
const uid = (p: string) => `${p}-${seq++}`;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function createMockRepository(): Repository {
  // Local mutable copies so the demo can be edited without touching the seeds.
  const pages: Page[] = clone(demoPages);
  const seoElements = clone(demoSeoElements);
  let comments: Comment[] = clone(demoComments);
  let wireframes: Wireframe[] = clone(demoWireframes);

  const bundleFor = (page: Page): PageBundle => ({
    page: clone(page),
    seoElements: clone(seoElements.filter((s) => s.pageId === page.id)),
    comments: clone(comments.filter((c) => c.pageId === page.id)),
    wireframes: clone(wireframes.filter((w) => w.pageId === page.id)),
  });

  return {
    async listClients() {
      return clone(demoClients);
    },
    async listProjects(clientId) {
      return clone(demoProjects.filter((p) => p.clientId === clientId));
    },
    async listPages(projectId) {
      return clone(pages.filter((p) => p.projectId === projectId));
    },

    async getPageBundle(pageId) {
      const page = pages.find((p) => p.id === pageId);
      return page ? bundleFor(page) : null;
    },
    async getSharedBundle(shareToken) {
      const page = pages.find((p) => p.shareToken === shareToken);
      return page ? bundleFor(page) : null;
    },

    async createPage({ projectId, sourceUrl }) {
      // In the mock we can't actually capture — return a pending page. A real
      // capture would flip this to "ready" with a screenshot asynchronously.
      const page: Page = {
        id: uid("page"),
        projectId,
        sourceUrl,
        status: "pending",
        screenshotUrl: null,
        screenshotWidth: 900,
        screenshotHeight: 0,
        seoMeta: { titleTag: null, metaDescription: null, canonical: null, robots: null, h1Count: null },
        shareToken: uid("share"),
        createdAt: new Date().toISOString(),
      };
      pages.push(page);
      return clone(page);
    },

    async createComment(input: NewComment) {
      const comment: Comment = { ...input, id: uid("comment"), createdAt: new Date().toISOString() };
      comments.push(comment);
      return clone(comment);
    },
    async updateComment(id, patch) {
      const c = comments.find((x) => x.id === id);
      if (!c) throw new Error(`comment ${id} not found`);
      Object.assign(c, patch);
      return clone(c);
    },
    async deleteComment(id) {
      comments = comments.filter((c) => c.id !== id);
    },

    async createWireframe(input: NewWireframe) {
      const id = uid("wireframe");
      const wf: Wireframe = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
        elements: input.elements.map((el, i) => ({ ...el, id: uid("wfe"), wireframeId: id, z: el.z ?? i })),
      };
      wireframes.push(wf);
      return clone(wf);
    },
    async updateWireframe(id, patch) {
      const wf = wireframes.find((w) => w.id === id);
      if (!wf) throw new Error(`wireframe ${id} not found`);
      Object.assign(wf, patch);
      return clone(wf);
    },
    async deleteWireframe(id) {
      wireframes = wireframes.filter((w) => w.id !== id);
    },
    async saveWireframeElements(wireframeId, elements: WireframeElement[]) {
      const wf = wireframes.find((w) => w.id === wireframeId);
      if (!wf) throw new Error(`wireframe ${wireframeId} not found`);
      wf.elements = clone(elements);
      return clone(wf);
    },
  };
}
