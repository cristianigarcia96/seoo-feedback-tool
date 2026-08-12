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
