-- ============================================================
-- SEO Feedback Tool — full setup (schema + RLS + RPC + storage + demo seed)
-- Paste this whole file into the Supabase SQL Editor for project
-- cwdmhpnmllrxdxqyhbzs and click Run. Intended for a FRESH project (run once);
-- tables/inserts guard themselves, but the RLS policies will error if re-run.
-- ============================================================

-- ===== 0001_init.sql =====
-- =============================================================================
-- SEO Feedback Tool — initial schema
--
-- Tenancy: client → project → page → (seo_elements | comments | wireframes →
-- wireframe_elements). The authenticated SEO side is isolated per client via
-- membership + RLS. The no-login client view is served ONLY through the
-- get_shared_page() RPC (SECURITY DEFINER), the single anon-readable path.
--
-- Coordinate convention: all positions (comment x/y, wireframe insert_y, seo
-- boxes) are stored in ORIGINAL-page pixel space (screenshot at capture width,
-- no wireframes inserted). See src/features/annotator/coords.ts.
-- =============================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ profiles
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------- clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Membership: which users may access which client (agency staff).
create table client_members (
  client_id uuid not null references clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

-- ------------------------------------------------------------------ projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on projects (client_id);

-- --------------------------------------------------------------------- pages
create type page_status as enum ('pending', 'capturing', 'ready', 'failed');

create table pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  source_url text not null,
  status page_status not null default 'pending',
  screenshot_url text,
  screenshot_width int not null default 900,
  screenshot_height int not null default 0,
  -- page-level SEO metadata (not tied to one visible element)
  title_tag text,
  meta_description text,
  canonical text,
  robots text,
  h1_count int,
  share_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on pages (project_id);
create index on pages (share_token);

-- ------------------------------------------------------------- seo_elements
create table seo_elements (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages (id) on delete cascade,
  type text not null,           -- H1 | H2 | H3 | IMG | CTA | LINK
  detail text,
  x numeric not null,
  y numeric not null,
  width numeric not null,
  height numeric not null,
  created_at timestamptz not null default now()
);
create index on seo_elements (page_id);

-- ------------------------------------------------------------------ comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages (id) on delete cascade,
  x numeric not null,
  y numeric not null,           -- ORIGINAL-page space
  author text not null default 'SEO',
  title text not null default '',
  note text not null default '',
  suggested_copy text,          -- null = none; actionable replacement copy
  resolved boolean not null default false,
  client_reply text,
  created_at timestamptz not null default now()
);
create index on comments (page_id);

-- ---------------------------------------------------------------- wireframes
create table wireframes (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages (id) on delete cascade,
  insert_y numeric not null,    -- anchor in ORIGINAL-page space
  title text not null default 'New section',
  height numeric not null default 220,
  open boolean not null default true,
  created_at timestamptz not null default now()
);
create index on wireframes (page_id);

create table wireframe_elements (
  id uuid primary key default gen_random_uuid(),
  wireframe_id uuid not null references wireframes (id) on delete cascade,
  type text not null,           -- text | rect | line
  x numeric not null default 0,
  y numeric not null default 0,
  width numeric not null default 0,
  height numeric not null default 0,
  content text not null default '',
  preset text not null default 'body',
  label text not null default '',
  z int not null default 0
);
create index on wireframe_elements (wireframe_id);

-- =============================================================================
-- Access helpers (SECURITY DEFINER to avoid recursive RLS evaluation)
-- =============================================================================

create or replace function is_client_member(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from client_members m
    where m.client_id = cid and m.user_id = auth.uid()
  );
$$;

create or replace function can_access_page(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from pages p
    join projects pr on pr.id = p.project_id
    join client_members m on m.client_id = pr.client_id
    where p.id = pid and m.user_id = auth.uid()
  );
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_members enable row level security;
alter table projects enable row level security;
alter table pages enable row level security;
alter table seo_elements enable row level security;
alter table comments enable row level security;
alter table wireframes enable row level security;
alter table wireframe_elements enable row level security;

-- profiles: a user sees/edits only their own row.
create policy profiles_self on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- client_members: a user sees their own memberships.
create policy members_self on client_members
  for select using (user_id = auth.uid());

-- clients: members can read; any authenticated user can create (becomes owner).
create policy clients_read on clients
  for select using (is_client_member(id));
create policy clients_insert on clients
  for insert with check (auth.uid() is not null);
create policy clients_update on clients
  for update using (is_client_member(id)) with check (is_client_member(id));

-- projects: scoped to client membership.
create policy projects_all on projects
  for all using (is_client_member(client_id)) with check (is_client_member(client_id));

-- pages: scoped via project → client.
create policy pages_all on pages
  for all using (
    is_client_member((select client_id from projects where id = project_id))
  ) with check (
    is_client_member((select client_id from projects where id = project_id))
  );

-- page children: scoped via page.
create policy seo_all on seo_elements
  for all using (can_access_page(page_id)) with check (can_access_page(page_id));
create policy comments_all on comments
  for all using (can_access_page(page_id)) with check (can_access_page(page_id));
create policy wireframes_all on wireframes
  for all using (can_access_page(page_id)) with check (can_access_page(page_id));
create policy wireframe_elements_all on wireframe_elements
  for all using (
    can_access_page((select page_id from wireframes where id = wireframe_id))
  ) with check (
    can_access_page((select page_id from wireframes where id = wireframe_id))
  );

-- =============================================================================
-- No-login client share: one SECURITY DEFINER RPC returns the full bundle for a
-- single page by token. This is the ONLY way anon reads data — the tables stay
-- locked. Two-way replies / expiry are open questions (see README); add an
-- `expires_at` check here when decided.
-- =============================================================================

create or replace function get_shared_page(p_token text)
returns json language sql security definer stable set search_path = public as $$
  select case when p.id is null then null else json_build_object(
    'page', json_build_object(
      'id', p.id, 'project_id', p.project_id, 'source_url', p.source_url,
      'status', p.status, 'screenshot_url', p.screenshot_url,
      'screenshot_width', p.screenshot_width, 'screenshot_height', p.screenshot_height,
      'title_tag', p.title_tag, 'meta_description', p.meta_description,
      'canonical', p.canonical, 'robots', p.robots, 'h1_count', p.h1_count,
      'share_token', p.share_token, 'created_at', p.created_at
    ),
    'seo_elements', coalesce((
      select json_agg(s) from seo_elements s where s.page_id = p.id
    ), '[]'::json),
    'comments', coalesce((
      select json_agg(c order by c.created_at) from comments c where c.page_id = p.id
    ), '[]'::json),
    'wireframes', coalesce((
      select json_agg(w_json order by (w_json->>'insert_y')::numeric)
      from (
        select json_build_object(
          'id', w.id, 'page_id', w.page_id, 'insert_y', w.insert_y,
          'title', w.title, 'height', w.height, 'open', w.open, 'created_at', w.created_at,
          'elements', coalesce((
            select json_agg(e order by e.z) from wireframe_elements e where e.wireframe_id = w.id
          ), '[]'::json)
        ) as w_json
        from wireframes w where w.page_id = p.id
      ) sub
    ), '[]'::json)
  ) end
  from (select * from pages where share_token = p_token) p;
$$;

grant execute on function get_shared_page(text) to anon, authenticated;


-- ===== 0002_storage.sql =====
-- Screenshots bucket. Public read (share links are unauthenticated and need to
-- load the image); writes only by the service role (the capture edge function).

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Anyone can read screenshot objects (needed by the no-login client view).
create policy "screenshots public read"
  on storage.objects for select
  using (bucket_id = 'screenshots');

-- Only authenticated agency users may upload (the edge function uses the service
-- role, which bypasses RLS; this covers any client-side upload fallback).
create policy "screenshots authenticated write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'screenshots');


-- ===== seed.sql (demo data) =====
-- Local dev seed. Mirrors the in-app demo so the Supabase path is explorable
-- immediately. The share view (/share/demo-woolrest-share) works with no auth
-- because get_shared_page() is SECURITY DEFINER. To use the EDITOR against this
-- seed you must sign up a user, then grant membership:
--
--   insert into client_members (client_id, user_id)
--   values ('11111111-1111-1111-1111-111111111111', '<your-auth-uid>');

insert into clients (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Woolroom'),
  ('22222222-2222-2222-2222-222222222222', 'Inspired Closets')
on conflict (id) do nothing;

insert into projects (id, client_id, name) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Homepage refresh')
on conflict (id) do nothing;

insert into pages (
  id, project_id, source_url, status, screenshot_url, screenshot_width, screenshot_height,
  title_tag, meta_description, canonical, robots, h1_count, share_token
) values (
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'https://woolandrest.com',
  'ready',
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22900%22%20height%3D%221204%22%3E%3Crect%20width%3D%22900%22%20height%3D%221204%22%20fill%3D%22rgb(244%2C241%2C234)%22%2F%3E%3Crect%20y%3D%2274%22%20width%3D%22900%22%20height%3D%22260%22%20fill%3D%22rgb(234%2C227%2C214)%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%22364%22%20width%3D%22240%22%20height%3D%22140%22%20fill%3D%22rgb(245%2C245%2C244)%22%2F%3E%3Crect%20x%3D%22330%22%20y%3D%22364%22%20width%3D%22240%22%20height%3D%22140%22%20fill%3D%22rgb(245%2C245%2C244)%22%2F%3E%3Crect%20x%3D%22600%22%20y%3D%22364%22%20width%3D%22240%22%20height%3D%22140%22%20fill%3D%22rgb(245%2C245%2C244)%22%2F%3E%3Crect%20y%3D%22534%22%20width%3D%22900%22%20height%3D%22110%22%20fill%3D%22rgb(41%2C37%2C36)%22%2F%3E%3Crect%20y%3D%22644%22%20width%3D%22900%22%20height%3D%22240%22%20fill%3D%22rgb(251%2C248%2C242)%22%2F%3E%3Crect%20y%3D%221064%22%20width%3D%22900%22%20height%3D%22140%22%20fill%3D%22rgb(28%2C25%2C23)%22%2F%3E%3Ctext%20x%3D%22450%22%20y%3D%22180%22%20font-family%3D%22serif%22%20font-size%3D%2230%22%20text-anchor%3D%22middle%22%20fill%3D%22rgb(41%2C37%2C36)%22%3EWool%20and%20Rest%3C%2Ftext%3E%3Ctext%20x%3D%22450%22%20y%3D%22600%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20fill%3D%22rgb(214%2C211%2C209)%22%3ETRUST%20BAR%3C%2Ftext%3E%3C%2Fsvg%3E',
  900, 1204,
  'Wool&Rest — Natural Wool Bedding',
  'Wool duvets and bedding sourced from small British farms. Naturally temperature-regulating.',
  'https://woolandrest.com/', 'index, follow', 1,
  'demo-woolrest-share'
) on conflict (id) do nothing;

insert into seo_elements (page_id, type, detail, x, y, width, height) values
  ('44444444-4444-4444-4444-444444444444', 'H1',  null, 250, 158, 400, 34),
  ('44444444-4444-4444-4444-444444444444', 'CTA', 'internal link', 390, 248, 120, 40),
  ('44444444-4444-4444-4444-444444444444', 'IMG', 'alt="Product 1 — wool duvet"', 60, 364, 240, 140),
  ('44444444-4444-4444-4444-444444444444', 'IMG', 'alt="Product 2 — wool duvet"', 330, 364, 240, 140),
  ('44444444-4444-4444-4444-444444444444', 'IMG', 'alt="Product 3 — wool duvet"', 600, 364, 240, 140),
  ('44444444-4444-4444-4444-444444444444', 'IMG', 'alt="Farmer with sheep, Yorkshire Dales"', 64, 674, 368, 180),
  ('44444444-4444-4444-4444-444444444444', 'H2',  null, 470, 716, 300, 26),
  ('44444444-4444-4444-4444-444444444444', 'H2',  null, 330, 910, 240, 20);

insert into comments (page_id, x, y, author, title, note, suggested_copy) values
  ('44444444-4444-4444-4444-444444444444', 250, 158, 'SEO',
   'Meta title too generic', 'Current title tag doesn''t include the primary keyword.',
   'Merino Wool Duvets & Bedding | Wool&Rest');

insert into wireframes (id, page_id, insert_y, title, height, open) values
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 334, 'Hero restructure', 280, true)
on conflict (id) do nothing;

insert into wireframe_elements (wireframe_id, type, preset, content, label, x, y, width, height, z) values
  ('55555555-5555-5555-5555-555555555555', 'text', 'heading', 'New headline: lead with the wool sourcing story', '', 40, 24, 340, 0, 0),
  ('55555555-5555-5555-5555-555555555555', 'text', 'body', 'Supporting line: naturally breathable, ethically farmed, 30-night trial.', '', 40, 60, 320, 0, 1),
  ('55555555-5555-5555-5555-555555555555', 'rect', 'body', '', 'Trust badges row', 40, 104, 340, 40, 2),
  ('55555555-5555-5555-5555-555555555555', 'rect', 'body', '', 'CTA button', 40, 164, 140, 36, 3),
  ('55555555-5555-5555-5555-555555555555', 'line', 'body', '', '', 40, 224, 340, 0, 4);
