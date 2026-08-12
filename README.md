# SEO Feedback Tool

A live webpage feedback tool for SEO work. An SEO **snapshots** a client's page,
annotates it with **comments** (including suggested copy) and editable
**wireframe sections**, then shares a **no-login link**. The client opens it and
sees the feedback in context.

Built from the validated `wireframe-mock-v4` prototype — behavior preserved, the
prototype's known hacks replaced with production approaches (see
[Gotchas addressed](#gotchas-addressed)).

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind
- **Backend:** Supabase — Postgres (data), Storage (screenshots), Auth (SEO
  side), RLS (tenant isolation), Edge Functions (capture orchestration)
- **Capture:** pluggable provider (`mock` built in, `browserless` adapter
  included, others drop in)

## Run it now (no backend)

```bash
npm install
npm run dev
```

With no `VITE_SUPABASE_URL` set, the app runs on **in-memory demo data** so the
whole thing is clickable immediately:

- `/` — dashboard (clients → projects → pages)
- `/editor/page-woolrest-home` — SEO editor (comments, wireframes, SEO badges, original/edited toggle, share-link copy)
- `/share/demo-woolrest-share` — the no-login client view (read-only)

Run the tests (coordinate math) and typecheck:

```bash
npm test
npm run typecheck
```

## Architecture

```
src/
  lib/types.ts              Domain model + CAPTURE_WIDTH + coordinate convention
  lib/supabase.ts           Client + "use Supabase vs demo" decision
  data/
    repository.ts           Backend-agnostic Repository interface (the seam)
    mockRepository.ts       In-memory impl (demo data)
    supabaseRepository.ts   Supabase impl (row <-> domain mapping)
    index.ts                Picks the impl once, from config
  features/annotator/
    coords.ts               Coordinate-space transforms (+ coords.test.ts)
    SlicedScreenshot.tsx     Real screenshot slicing at pixel offsets
    WireframeSection.tsx / WireframeElementView.tsx
    CommentPin.tsx / CommentPopover.tsx
    SeoElementsOverlay.tsx   Always-on hover badges
    PageSeoPanel.tsx         Page-level SEO meta (title/desc/canonical)
    BottomBar.tsx            Persistent view toggle + add tools
    useAnnotatorState.ts     Loads a bundle, optimistic mutators -> repository
    Annotator.tsx            Composition + place/view interaction
  pages/                    EditorPage (SEO) · SharePage (client) · DashboardPage
supabase/
  migrations/               Schema + RLS + get_shared_page RPC + storage bucket
  seed.sql                  Demo tenant/page mirroring the in-app demo
  functions/capture-page/   Edge function + swappable capture providers
```

The UI never imports Supabase directly — it talks to `repository`. That's what
lets the app run on demo data and swap backends without touching components.

## Gotchas addressed

Numbered to the handoff brief:

1. **Coordinate spaces** — `coords.ts` centralizes the original↔rendered
   transforms. Everything is persisted in **original-page space**; the renderer
   converts per view. `renderedToOriginalY` inverts the insert-offset step
   function so a click in the edited view lands where the user clicked.
   Unit-tested in `coords.test.ts`.
2. **Screenshot slicing** — `SlicedScreenshot.tsx` clips a single captured
   raster into bands (`overflow:hidden` + `translateY(-startY)`) and splices
   wireframes between them. No re-rendering the DOM (the prototype's hack). The
   frame is fixed at `CAPTURE_WIDTH` so original px map 1:1 to the image; narrow
   screens scroll instead of scaling (which would desync overlays).
3. **Tailwind arbitrary values** — brand colors that mattered are set via inline
   `style` (`theme.ts`), sidestepping the bracket-class failure mode entirely.
   Standard JIT classes are used elsewhere and build fine.
4. **Wireframes anchor to absolute Y** — `insert_y` in original-page space, not
   named sections. Stale-anchor handling (page redesigns) is a future decision;
   the model supports re-capture as a new `page` row.
5. **Add-element controls always visible** — Text/Box/Line live in each open
   wireframe's header (`WireframeSection.tsx`).

## Wiring Supabase

1. Copy env and fill in the target project's public values:
   ```bash
   cp .env.example .env
   # VITE_SUPABASE_URL=https://<ref>.supabase.co
   # VITE_SUPABASE_ANON_KEY=<anon/publishable key>
   ```
2. Apply the schema (CLI route):
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   supabase db seed        # optional demo data
   ```
3. Deploy the capture function and set its secrets (never in `.env`):
   ```bash
   supabase functions deploy capture-page
   supabase secrets set CAPTURE_PROVIDER=mock
   # for real capture:
   # supabase secrets set CAPTURE_PROVIDER=browserless BROWSERLESS_URL=... BROWSERLESS_TOKEN=...
   ```
4. Create an agency user (Auth) and grant client membership so the editor is
   accessible — see the note at the top of `seed.sql`. The **share view needs no
   auth**: it reads through the `get_shared_page` RPC only.

### Tenant isolation

RLS scopes every table to `client_members`. The single anon-readable path is the
`get_shared_page(token)` SECURITY DEFINER RPC — tables stay locked; the client
link resolves exactly one page's bundle.

## Open product questions (unchanged from brief, now with hooks in place)

- **Link expiry / access control** — add an `expires_at` column + a check inside
  `get_shared_page`. No schema fight; it's one guard clause.
- **Two-way commenting** — `comments.client_reply` exists but the client UI is
  read-only. Threading is a UI + a `comment_replies` table when decided.
- **Stale wireframe anchors** on client redesigns — currently re-capture as a new
  page. A migration/re-anchor flow is unbuilt.
- **SEO element coverage** — capture tags H1/H2/IMG/CTA; page-level meta shows in
  `PageSeoPanel`. Broaden the in-page script in `browserless.ts` to add more.
```
