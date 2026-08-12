// Supabase-backed Repository. Maps snake_case DB rows to the camelCase domain
// model so UI code stays DB-agnostic. RLS (see supabase/migrations) enforces
// tenant isolation for the authenticated SEO side; the no-login client view goes
// through the `get_shared_page` RPC, which is the only anon-readable path.

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
import { getSupabase } from "@/lib/supabase";
import type { NewComment, NewWireframe, Repository } from "./repository";

/* ------------------------------- row mappers ------------------------------ */

type Row = Record<string, unknown>;

const s = (v: unknown): string => String(v ?? "");
const ns = (v: unknown): string | null => (v == null ? null : String(v));
const n = (v: unknown): number => Number(v ?? 0);

function mapClient(r: Row): Client {
  return { id: s(r.id), name: s(r.name), createdAt: s(r.created_at) };
}
function mapProject(r: Row): Project {
  return { id: s(r.id), clientId: s(r.client_id), name: s(r.name), createdAt: s(r.created_at) };
}
function mapPage(r: Row): Page {
  return {
    id: s(r.id),
    projectId: s(r.project_id),
    sourceUrl: s(r.source_url),
    status: s(r.status) as Page["status"],
    screenshotUrl: ns(r.screenshot_url),
    screenshotWidth: n(r.screenshot_width),
    screenshotHeight: n(r.screenshot_height),
    seoMeta: {
      titleTag: ns(r.title_tag),
      metaDescription: ns(r.meta_description),
      canonical: ns(r.canonical),
      robots: ns(r.robots),
      h1Count: r.h1_count == null ? null : n(r.h1_count),
    },
    shareToken: s(r.share_token),
    createdAt: s(r.created_at),
  };
}
function mapSeo(r: Row): SeoElement {
  return {
    id: s(r.id),
    pageId: s(r.page_id),
    type: s(r.type) as SeoElement["type"],
    detail: ns(r.detail),
    x: n(r.x),
    y: n(r.y),
    width: n(r.width),
    height: n(r.height),
  };
}
function mapComment(r: Row): Comment {
  return {
    id: s(r.id),
    pageId: s(r.page_id),
    x: n(r.x),
    y: n(r.y),
    author: s(r.author),
    title: s(r.title),
    note: s(r.note),
    suggestedCopy: ns(r.suggested_copy),
    resolved: Boolean(r.resolved),
    clientReply: ns(r.client_reply),
    createdAt: s(r.created_at),
  };
}
function mapElement(r: Row): WireframeElement {
  return {
    id: s(r.id),
    wireframeId: s(r.wireframe_id),
    type: s(r.type) as WireframeElement["type"],
    x: n(r.x),
    y: n(r.y),
    width: n(r.width),
    height: n(r.height),
    content: s(r.content),
    preset: s(r.preset || "body") as WireframeElement["preset"],
    label: s(r.label),
    z: n(r.z),
  };
}
function mapWireframe(r: Row, elements: WireframeElement[]): Wireframe {
  return {
    id: s(r.id),
    pageId: s(r.page_id),
    insertY: n(r.insert_y),
    title: s(r.title),
    height: n(r.height),
    open: Boolean(r.open),
    elements: elements.sort((a, b) => a.z - b.z),
    createdAt: s(r.created_at),
  };
}

function commentToRow(c: Partial<Comment>): Row {
  const row: Row = {};
  if (c.pageId !== undefined) row.page_id = c.pageId;
  if (c.x !== undefined) row.x = c.x;
  if (c.y !== undefined) row.y = c.y;
  if (c.author !== undefined) row.author = c.author;
  if (c.title !== undefined) row.title = c.title;
  if (c.note !== undefined) row.note = c.note;
  if (c.suggestedCopy !== undefined) row.suggested_copy = c.suggestedCopy;
  if (c.resolved !== undefined) row.resolved = c.resolved;
  if (c.clientReply !== undefined) row.client_reply = c.clientReply;
  return row;
}
function elementToRow(e: Partial<WireframeElement>): Row {
  return {
    wireframe_id: e.wireframeId,
    type: e.type,
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    content: e.content,
    preset: e.preset,
    label: e.label,
    z: e.z,
  };
}

/* ------------------------------- repository ------------------------------- */

export function createSupabaseRepository(): Repository {
  const db = getSupabase();

  async function loadElements(wireframeIds: string[]): Promise<Map<string, WireframeElement[]>> {
    const byWf = new Map<string, WireframeElement[]>();
    if (wireframeIds.length === 0) return byWf;
    const { data, error } = await db
      .from("wireframe_elements")
      .select("*")
      .in("wireframe_id", wireframeIds);
    if (error) throw error;
    for (const row of data ?? []) {
      const el = mapElement(row);
      const list = byWf.get(el.wireframeId) ?? [];
      list.push(el);
      byWf.set(el.wireframeId, list);
    }
    return byWf;
  }

  async function assembleBundle(page: Page): Promise<PageBundle> {
    const [seoRes, commentsRes, wfRes] = await Promise.all([
      db.from("seo_elements").select("*").eq("page_id", page.id),
      db.from("comments").select("*").eq("page_id", page.id).order("created_at"),
      db.from("wireframes").select("*").eq("page_id", page.id).order("insert_y"),
    ]);
    if (seoRes.error) throw seoRes.error;
    if (commentsRes.error) throw commentsRes.error;
    if (wfRes.error) throw wfRes.error;

    const wfRows = wfRes.data ?? [];
    const elementsByWf = await loadElements(wfRows.map((r) => s(r.id)));
    return {
      page,
      seoElements: (seoRes.data ?? []).map(mapSeo),
      comments: (commentsRes.data ?? []).map(mapComment),
      wireframes: wfRows.map((r) => mapWireframe(r, elementsByWf.get(s(r.id)) ?? [])),
    };
  }

  return {
    async listClients() {
      const { data, error } = await db.from("clients").select("*").order("name");
      if (error) throw error;
      return (data ?? []).map(mapClient);
    },
    async listProjects(clientId) {
      const { data, error } = await db
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProject);
    },
    async listPages(projectId) {
      const { data, error } = await db
        .from("pages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapPage);
    },

    async getPageBundle(pageId) {
      const { data, error } = await db.from("pages").select("*").eq("id", pageId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return assembleBundle(mapPage(data));
    },

    async getSharedBundle(shareToken) {
      // Single anon-safe entrypoint: a SECURITY DEFINER RPC that returns the
      // whole bundle as JSON for exactly one page, scoped by token.
      const { data, error } = await db.rpc("get_shared_page", { p_token: shareToken });
      if (error) throw error;
      if (!data) return null;
      const b = data as {
        page: Row;
        seo_elements: Row[];
        comments: Row[];
        wireframes: Array<Row & { elements: Row[] }>;
      };
      return {
        page: mapPage(b.page),
        seoElements: (b.seo_elements ?? []).map(mapSeo),
        comments: (b.comments ?? []).map(mapComment),
        wireframes: (b.wireframes ?? []).map((w) => mapWireframe(w, (w.elements ?? []).map(mapElement))),
      };
    },

    async createPage({ projectId, sourceUrl }) {
      // The capture edge function inserts the pending row, runs the snapshot,
      // and returns the created page. Doing it server-side keeps provider keys
      // out of the browser.
      const { data, error } = await db.functions.invoke("capture-page", {
        body: { projectId, sourceUrl },
      });
      if (error) throw error;
      return mapPage((data as { page: Row }).page);
    },

    async createComment(input: NewComment) {
      const { data, error } = await db.from("comments").insert(commentToRow(input)).select().single();
      if (error) throw error;
      return mapComment(data);
    },
    async updateComment(id, patch) {
      const { data, error } = await db
        .from("comments")
        .update(commentToRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapComment(data);
    },
    async deleteComment(id) {
      const { error } = await db.from("comments").delete().eq("id", id);
      if (error) throw error;
    },

    async createWireframe(input: NewWireframe) {
      const { data: wfRow, error } = await db
        .from("wireframes")
        .insert({
          page_id: input.pageId,
          insert_y: input.insertY,
          title: input.title,
          height: input.height,
          open: input.open,
        })
        .select()
        .single();
      if (error) throw error;
      const wfId = s(wfRow.id);
      const elementRows = input.elements.map((el, i) => elementToRow({ ...el, wireframeId: wfId, z: el.z ?? i }));
      const { data: els, error: elErr } = await db
        .from("wireframe_elements")
        .insert(elementRows)
        .select();
      if (elErr) throw elErr;
      return mapWireframe(wfRow, (els ?? []).map(mapElement));
    },
    async updateWireframe(id, patch) {
      const row: Row = {};
      if (patch.insertY !== undefined) row.insert_y = patch.insertY;
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.height !== undefined) row.height = patch.height;
      if (patch.open !== undefined) row.open = patch.open;
      const { data, error } = await db.from("wireframes").update(row).eq("id", id).select().single();
      if (error) throw error;
      const elementsByWf = await loadElements([id]);
      return mapWireframe(data, elementsByWf.get(id) ?? []);
    },
    async deleteWireframe(id) {
      const { error } = await db.from("wireframes").delete().eq("id", id);
      if (error) throw error;
    },
    async saveWireframeElements(wireframeId, elements: WireframeElement[]) {
      // Replace-all: delete then reinsert keeps element ids simple for the mock
      // parity. For high-frequency saves you'd diff instead.
      const del = await db.from("wireframe_elements").delete().eq("wireframe_id", wireframeId);
      if (del.error) throw del.error;
      const rows = elements.map((el, i) => elementToRow({ ...el, wireframeId, z: el.z ?? i }));
      const { data: els, error } = await db.from("wireframe_elements").insert(rows).select();
      if (error) throw error;
      const { data: wfRow, error: wfErr } = await db
        .from("wireframes")
        .select("*")
        .eq("id", wireframeId)
        .single();
      if (wfErr) throw wfErr;
      return mapWireframe(wfRow, (els ?? []).map(mapElement));
    },
  };
}
