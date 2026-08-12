// -----------------------------------------------------------------------------
// Repository contract. The whole app talks to this interface; the concrete
// implementation (Supabase or in-memory demo) is chosen once at startup in
// index.ts. This is what lets the frontend be built and run before the backend
// is wired, and swapped without touching UI code.
// -----------------------------------------------------------------------------

import type {
  Client,
  Comment,
  Page,
  PageBundle,
  Project,
  SeoElement,
  Wireframe,
  WireframeElement,
} from "@/lib/types";

/** Fields the caller supplies when creating; ids/timestamps are assigned by the repo. */
export type NewComment = Omit<Comment, "id" | "createdAt">;
export type NewWireframe = Omit<Wireframe, "id" | "createdAt" | "elements"> & {
  elements: Array<Omit<WireframeElement, "id" | "wireframeId">>;
};

export interface Repository {
  // --- Tenancy / navigation (SEO side, authenticated) ---
  listClients(): Promise<Client[]>;
  listProjects(clientId: string): Promise<Project[]>;
  listPages(projectId: string): Promise<Page[]>;

  // --- Page bundles ---
  /** Full bundle for the SEO editor (requires access to the owning client). */
  getPageBundle(pageId: string): Promise<PageBundle | null>;
  /** Full bundle for the no-login client view, resolved by share token. */
  getSharedBundle(shareToken: string): Promise<PageBundle | null>;

  // --- Capture ---
  /** Kick off a snapshot; returns the pending Page immediately. */
  createPage(input: { projectId: string; sourceUrl: string }): Promise<Page>;

  // --- Comments ---
  createComment(input: NewComment): Promise<Comment>;
  updateComment(id: string, patch: Partial<Comment>): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // --- Wireframes ---
  createWireframe(input: NewWireframe): Promise<Wireframe>;
  updateWireframe(
    id: string,
    patch: Partial<Omit<Wireframe, "id" | "pageId" | "elements" | "createdAt">>,
  ): Promise<Wireframe>;
  deleteWireframe(id: string): Promise<void>;
  /** Replace the full element list for a wireframe (drag/resize/add/remove). */
  saveWireframeElements(
    wireframeId: string,
    elements: WireframeElement[],
  ): Promise<Wireframe>;
}

export type { SeoElement };
