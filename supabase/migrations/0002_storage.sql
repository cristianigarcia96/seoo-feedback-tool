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
