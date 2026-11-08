-- LilKangooMedia v3 — run once in Supabase SQL editor in a staging project.
-- IMPORTANT: review the prices and terms before enabling live bookings.
create extension if not exists pgcrypto;
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "admin may view own membership" on public.admin_users for select to authenticated using (user_id = auth.uid());

create or replace function public.lkm_is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;
revoke all on function public.lkm_is_admin() from public;
grant execute on function public.lkm_is_admin() to authenticated;

create table if not exists public.services (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 audience text not null check (audience in ('personal','business')),
 category text not null,
 title text not null,
 summary text not null default '',
 description text not null default '',
 cover_url text not null default '',
 gallery_urls jsonb not null default '[]'::jsonb check(jsonb_typeof(gallery_urls)='array'),
 packages jsonb not null default '[]'::jsonb check(jsonb_typeof(packages)='array'),
 addons jsonb not null default '[]'::jsonb check(jsonb_typeof(addons)='array'),
 booking_mode text not null default 'enquiry' check (booking_mode in ('enquiry','deposit','full')),
 deposit_percent integer not null default 0 check (deposit_percent between 0 and 100),
 active boolean not null default true,
 featured boolean not null default false,
 sort_order integer not null default 100,
 source text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists services_audience_sort_idx on public.services(audience,active,sort_order);
alter table public.services enable row level security;
create policy "public reads active services" on public.services for select to anon, authenticated using (active=true or public.lkm_is_admin());
create policy "admin inserts services" on public.services for insert to authenticated with check (public.lkm_is_admin());
create policy "admin updates services" on public.services for update to authenticated using (public.lkm_is_admin()) with check (public.lkm_is_admin());
create policy "admin deletes services" on public.services for delete to authenticated using (public.lkm_is_admin());

create table if not exists public.contact_leads (
 id uuid primary key default gen_random_uuid(),
 customer_name text not null,
 customer_email text not null,
 phone text not null default '',
 service_slug text,
 service_type text,
 package_id text,
 preferred_date date,
 message text not null default '',
 addons jsonb not null default '[]'::jsonb,
 submission_type text not null default 'general_enquiry',
 status text not null default 'new',
 created_at timestamptz not null default now()
);
create index if not exists contact_leads_created_idx on public.contact_leads(created_at desc);
alter table public.contact_leads enable row level security;
create policy "admin reads leads" on public.contact_leads for select to authenticated using (public.lkm_is_admin());
create policy "admin edits leads" on public.contact_leads for update to authenticated using (public.lkm_is_admin()) with check(public.lkm_is_admin());
-- No client-side insert policy; only Pages Function + service-role key may create leads.

create table if not exists public.stripe_orders (
 id uuid primary key default gen_random_uuid(),
 stripe_session_id text not null unique,
 stripe_event_id text unique,
 customer_email text not null,
 customer_name text not null default '',
 service_slug text not null,
 package_id text not null,
 preferred_date date,
 paid_amount_cents integer not null,
 quoted_total_cents integer not null,
 payment_kind text not null,
 status text not null default 'paid_pending_confirmation',
 created_at timestamptz not null default now()
);
create index if not exists stripe_orders_created_idx on public.stripe_orders(created_at desc);
alter table public.stripe_orders enable row level security;
create policy "admin reads orders" on public.stripe_orders for select to authenticated using (public.lkm_is_admin());
create policy "admin edits orders" on public.stripe_orders for update to authenticated using (public.lkm_is_admin()) with check(public.lkm_is_admin());

create or replace function public.lkm_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services for each row execute function public.lkm_updated_at();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio','portfolio',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "public views portfolio" on storage.objects for select to anon,authenticated using (bucket_id='portfolio');
create policy "admins upload portfolio" on storage.objects for insert to authenticated with check (bucket_id='portfolio' and public.lkm_is_admin());
create policy "admins update portfolio" on storage.objects for update to authenticated using(bucket_id='portfolio' and public.lkm_is_admin()) with check(bucket_id='portfolio' and public.lkm_is_admin());
create policy "admins delete portfolio" on storage.objects for delete to authenticated using(bucket_id='portfolio' and public.lkm_is_admin());

-- Add the Auth user UUID *after* creating it in Supabase Auth > Users:
-- insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');

-- Imported source pricing. These are visible but all payment modes default to ENQUIRY ONLY.
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('portrait-photography', 'personal', 'Photography', 'Portrait & Family Photography', 'Professional on-location portrait sessions across Cyprus.', 'Professional on-location portrait sessions across Cyprus.', 'https://lilkangoomedia.com/assets/images/portrait-15.jpg', '["https://lilkangoomedia.com/assets/images/portrait-15.jpg", "https://lilkangoomedia.com/assets/images/dani-small-www-1256x837.jpg", "https://lilkangoomedia.com/assets/images/portrait-14.jpg", "https://lilkangoomedia.com/assets/images/gracjana-2-630x787.jpg"]'::jsonb, '[{"id": "photo-basic-·-1h", "name": "Photo Basic · 1h", "price_cents": 14900, "description": "1 hour, 1 location, approximately 20–50 images", "duration_hours": 1}, {"id": "photo-combo-·-3h", "name": "Photo Combo · 3h", "price_cents": 34900, "description": "3 hours, up to 3 locations, approximately 60–100 images", "duration_hours": 3}, {"id": "photo-all-day-·-8h", "name": "Photo All Day · 8h", "price_cents": 99900, "description": "8 hours, up to 5 locations, approximately 80–300 images", "duration_hours": 8}]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, true, 10, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('personal-videography', 'personal', 'Videography', 'Personal Videography', 'Cinematic filming and edited video for people and memorable experiences.', 'Cinematic filming and edited video for people and memorable experiences.', 'https://lilkangoomedia.com/assets/images/woodstock-1-2048x1363.jpg', '["https://lilkangoomedia.com/assets/images/woodstock-1-2048x1363.jpg", "https://lilkangoomedia.com/assets/images/katvideoclip.jpg", "https://lilkangoomedia.com/assets/images/dani-small-www-1256x837.jpg"]'::jsonb, '[{"id": "video-basic-·-1h", "name": "Video Basic · 1h", "price_cents": 34900, "description": "1 hour on location, video up to 3 min", "duration_hours": 1}, {"id": "video-combo-·-3h", "name": "Video Combo · 3h", "price_cents": 59900, "description": "3 hours filming, video up to 30 min", "duration_hours": 3}, {"id": "video-all-day-·-8h", "name": "Video All Day · 8h", "price_cents": 219900, "description": "8 hours filming, long-form video and short highlights", "duration_hours": 8}]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, false, 20, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('wedding-photography-video', 'personal', 'Wedding', 'Weddings & Engagements', 'Beautiful, heartfelt wedding and proposal photography and film.', 'Beautiful, heartfelt wedding and proposal photography and film.', 'https://lilkangoomedia.com/assets/images/wedding-6.jpeg', '["https://lilkangoomedia.com/assets/images/wedding-6.jpeg", "https://lilkangoomedia.com/assets/images/wedding-8.jpeg", "https://lilkangoomedia.com/assets/images/dani-small-www-1256x837.jpg"]'::jsonb, '[{"id": "wedding-basic", "name": "Wedding Basic", "price_cents": 54900, "description": "Up to 5h; 150–300 edited images", "duration_hours": 5}, {"id": "wedding-combo", "name": "Wedding Combo", "price_cents": 129900, "description": "Up to 5h plus 1h photoshoot; 250–400 images and video", "duration_hours": 5}, {"id": "wedding-all-day", "name": "Wedding All Day", "price_cents": 249900, "description": "Up to 8h plus 2h photoshoot; 350–700 images and edited video", "duration_hours": 8}]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, true, 30, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('cyprus-photo-trips', 'personal', 'Experiences', 'Cyprus Photo Trips', 'Private photo excursions and personal travel memories.', 'Private photo excursions and personal travel memories.', 'https://lilkangoomedia.com/assets/images/aleksandra-mateusz-18-1048x685.jpg', '["https://lilkangoomedia.com/assets/images/aleksandra-mateusz-18-1048x685.jpg", "https://lilkangoomedia.com/assets/images/ola-jakub-gajeccy-11-1048x726.jpg", "https://lilkangoomedia.com/assets/images/marta-gasiorek-web-14-996x664.jpeg", "https://lilkangoomedia.com/assets/images/zaneta-zgliczynska-31-998x1248.jpeg"]'::jsonb, '[{"id": "photo-trip-·-half-day-5h", "name": "Photo Trip · Half Day 5h", "price_cents": 40000, "description": "Up to 30 photos; up to 4 people; additional participant pricing applies", "duration_hours": 5}, {"id": "photo-trip-·-3-4-day-8h", "name": "Photo Trip · 3/4 Day 8h", "price_cents": 50000, "description": "Up to 50 photos; up to 4 people", "duration_hours": 8}, {"id": "photo-trip-·-all-day-10h", "name": "Photo Trip · All Day 10h", "price_cents": 60000, "description": "Up to 60 photos; up to 4 people", "duration_hours": 10}, {"id": "photo-trip-·-two-days-20h", "name": "Photo Trip · Two Days 20h", "price_cents": 110000, "description": "Up to 120 photos; up to 4 people", "duration_hours": 20}]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, true, 40, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('cyprus-video-trips', 'personal', 'Experiences', 'Cyprus Video Trips', 'A cinematic film of your Cyprus adventure.', 'A cinematic film of your Cyprus adventure.', 'https://lilkangoomedia.com/assets/images/photoshoot-1.jpeg', '["https://lilkangoomedia.com/assets/images/photoshoot-1.jpeg", "https://lilkangoomedia.com/assets/images/magda-wolna-14-1529x860.jpg", "https://lilkangoomedia.com/assets/images/walczak-18-2048x1638.jpeg"]'::jsonb, '[{"id": "video-trip-·-half-day-5h", "name": "Video Trip · Half Day 5h", "price_cents": 80000, "description": "Video up to 2 min, up to 4 people", "duration_hours": 5}, {"id": "video-trip-·-3-4-day-8h", "name": "Video Trip · 3/4 Day 8h", "price_cents": 90000, "description": "Video up to 3 min, up to 4 people", "duration_hours": 8}, {"id": "video-trip-·-all-day-10h", "name": "Video Trip · All Day 10h", "price_cents": 100000, "description": "Video up to 3 min, up to 4 people", "duration_hours": 10}, {"id": "video-trip-·-two-days-20h", "name": "Video Trip · Two Days 20h", "price_cents": 180000, "description": "Video up to 6 min, up to 4 people", "duration_hours": 20}]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, false, 50, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('private-events', 'personal', 'Events', 'Celebrations & Events', 'Birthdays, christenings, anniversaries and private celebrations.', 'Tell us the event type, location, guests and desired coverage. We will prepare an individual quote.', 'https://lilkangoomedia.com/assets/images/wedding-8.jpeg', '["https://lilkangoomedia.com/assets/images/wedding-8.jpeg", "https://lilkangoomedia.com/assets/images/wedding-6.jpeg", "https://lilkangoomedia.com/assets/images/portrait-13.jpg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, false, 60, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('product-brand-photography', 'business', 'Photography', 'Product & Brand Photography', 'Premium visual content for products, hospitality and advertising.', 'Commercial product photography, business portraits and photo campaigns. Pricing is based on brief, usage, editing and deliverables.', 'https://lilkangoomedia.com/assets/images/orofino-4.jpg', '["https://lilkangoomedia.com/assets/images/orofino-4.jpg", "https://lilkangoomedia.com/assets/images/orofino-1.jpg", "https://lilkangoomedia.com/assets/images/jewel-27.jpg", "https://lilkangoomedia.com/assets/images/zegarek-8.jpg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, true, 70, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('commercial-video-reels', 'business', 'Videography', 'Commercial Video & Reels', 'Branded videos, commercial reels, event films and campaigns.', 'Production, editing and delivery of professional commercial video with scope confirmed by consultation.', 'https://lilkangoomedia.com/assets/images/woodstock-1-2048x1363.jpg', '["https://lilkangoomedia.com/assets/images/woodstock-1-2048x1363.jpg", "https://lilkangoomedia.com/assets/images/katvideoclip.jpg", "https://lilkangoomedia.com/assets/images/dani-small-www-1256x837.jpg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, true, 80, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('social-media-management', 'business', 'Social Media', 'Social Media Management', 'Planning, production and management of your social media presence.', 'Custom monthly social media management, content creation, posting strategy and reporting. No confirmed public monthly price on supplied website; ask for a quote.', 'https://lilkangoomedia.com/assets/images/mbr-1187x791.jpg', '["https://lilkangoomedia.com/assets/images/mbr-1187x791.jpg", "https://lilkangoomedia.com/assets/images/front-cover-higher-uality.jpg", "https://lilkangoomedia.com/assets/images/orofino-4.jpg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, true, 90, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('graphic-design', 'business', 'Design', 'Graphic Design & Brand Identity', 'Identity, campaign visuals, posters and creative assets.', 'Custom graphic design, illustrations, brand visuals and social media creatives.', 'https://lilkangoomedia.com/assets/images/olympic-poster2.jpg', '["https://lilkangoomedia.com/assets/images/olympic-poster2.jpg", "https://lilkangoomedia.com/assets/images/my.logo1-1.jpg", "https://lilkangoomedia.com/assets/images/design.logo1.jpg", "https://lilkangoomedia.com/assets/images/page3-4.jpg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, false, 100, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('website-design', 'business', 'Web Design', 'Website Design & Development', 'Responsive websites and platforms designed for your business.', 'Web design, ecommerce and development. Pricing is quoted after discussing requirements.', 'https://lilkangoomedia.com/assets/images/mbr-1187x791.jpg', '["https://lilkangoomedia.com/assets/images/mbr-1187x791.jpg", "https://lilkangoomedia.com/assets/images/mbr-305x225.png", "https://lilkangoomedia.com/assets/images/front-cover-higher-uality.jpg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, false, 110, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('brand-launch-packages', 'business', 'Business Setup', 'Business Setup Packages', 'Brand setup, visuals, website and content bundles.', 'Brand setup, visuals, website and content bundles.', 'https://lilkangoomedia.com/assets/images/orofino-1.jpg', '["https://lilkangoomedia.com/assets/images/orofino-1.jpg", "https://lilkangoomedia.com/assets/images/mbr-1187x791.jpg", "https://lilkangoomedia.com/assets/images/olympic-poster2.jpg"]'::jsonb, '[{"id": "basic-business-setup", "name": "Basic Business Setup", "price_cents": 150000, "description": "Brand identity, logo, simple web design and print design", "duration_hours": null}, {"id": "simple-business-setup", "name": "Simple Business Setup", "price_cents": 250000, "description": "Basic package with social media content and photography", "duration_hours": null}, {"id": "premium-business-setup", "name": "Premium Business Setup", "price_cents": 1000000, "description": "Extended setup including design, infographics, video ads and social media content", "duration_hours": null}]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, true, 120, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
insert into public.services (slug, audience, category, title, summary, description, cover_url, gallery_urls, packages, addons, booking_mode, deposit_percent, active, featured, sort_order, source) values ('marketing-advertising', 'business', 'Marketing', 'Marketing & Advertising', 'Strategy and campaign content to make your business more visible.', 'Consultation-led marketing and advertising campaigns. Scope and price confirmed in a proposal.', 'https://lilkangoomedia.com/assets/images/orofino-4.jpg', '["https://lilkangoomedia.com/assets/images/orofino-4.jpg", "https://lilkangoomedia.com/assets/images/web-orofino.gif", "https://lilkangoomedia.com/assets/images/mbr-1187x791.jpg"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'enquiry', 0, true, false, 130, 'Official site, HTML snapshots supplied 2026-11-08; verify before launch') on conflict (slug) do nothing;
