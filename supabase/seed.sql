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
