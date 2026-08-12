// Edge function: capture-page
//
// POST { projectId, sourceUrl } →
//   1. insert a page row (status = capturing)
//   2. run the configured capture provider (screenshot + SEO)
//   3. upload the screenshot to the `screenshots` bucket
//   4. update the page (status = ready, dims, meta) + insert seo_elements
//   5. return { page }  (snake_case row the frontend maps)
//
// Runs server-side so screenshot-vendor keys and the service role key never
// touch the browser. On any failure the page is flagged `failed`, not left
// dangling.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { selectProvider } from "./lib/provider.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let pageId: string | null = null;
  try {
    const { projectId, sourceUrl } = await req.json();
    if (!projectId || !sourceUrl) return json({ error: "projectId and sourceUrl are required" }, 400);

    // --- AuthN + AuthZ -------------------------------------------------------
    // The gateway's verify_jwt only rejects malformed tokens (the public anon
    // key is itself a valid JWT), so we authorize here: the caller must be a
    // real signed-in user AND a member of the client that owns this project.
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: authErr } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (authErr || !user) return json({ error: "Sign in required to capture pages." }, 401);

    const { data: proj, error: projErr } = await admin
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();
    if (projErr || !proj) return json({ error: "Project not found." }, 404);

    const { data: member } = await admin
      .from("client_members")
      .select("user_id")
      .eq("client_id", proj.client_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) return json({ error: "You don't have access to this project." }, 403);
    // -------------------------------------------------------------------------

    // 1) pending row
    const { data: pageRow, error: insErr } = await admin
      .from("pages")
      .insert({ project_id: projectId, source_url: sourceUrl, status: "capturing", created_by: user.id })
      .select()
      .single();
    if (insErr) throw insErr;
    pageId = pageRow.id;

    // 2) capture
    const provider = selectProvider();
    const result = await provider.capture(sourceUrl);

    // 3) upload screenshot (real providers) or inline a preview (mock)
    let screenshotUrl: string;
    if (provider.name === "mock") {
      screenshotUrl =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${result.width}" height="${result.height}"><rect width="100%" height="100%" fill="rgb(244,241,234)"/><text x="50%" y="80" font-family="sans-serif" font-size="16" text-anchor="middle" fill="rgb(120,113,108)">Mock capture — ${sourceUrl}</text></svg>`,
        );
    } else {
      const path = `${pageId}.png`;
      const up = await admin.storage
        .from("screenshots")
        .upload(path, result.screenshot, { contentType: result.contentType, upsert: true });
      if (up.error) throw up.error;
      screenshotUrl = admin.storage.from("screenshots").getPublicUrl(path).data.publicUrl;
    }

    // 4) finalize page + seo elements
    const { data: updated, error: updErr } = await admin
      .from("pages")
      .update({
        status: "ready",
        screenshot_url: screenshotUrl,
        screenshot_width: result.width,
        screenshot_height: result.height,
        title_tag: result.meta.titleTag,
        meta_description: result.meta.metaDescription,
        canonical: result.meta.canonical,
        robots: result.meta.robots,
        h1_count: result.meta.h1Count,
      })
      .eq("id", pageId)
      .select()
      .single();
    if (updErr) throw updErr;

    if (result.seoElements.length > 0) {
      const rows = result.seoElements.map((e) => ({ page_id: pageId, ...e }));
      const { error: seoErr } = await admin.from("seo_elements").insert(rows);
      if (seoErr) throw seoErr;
    }

    return json({ page: updated });
  } catch (err) {
    console.error("capture-page failed", err);
    if (pageId) {
      await admin.from("pages").update({ status: "failed" }).eq("id", pageId);
    }
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
