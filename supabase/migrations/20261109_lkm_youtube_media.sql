-- LilKangooMedia Phase 10: YouTube video placement in existing gallery/service content.
-- Run AFTER the existing CMS and services migrations. Safe to rerun.
-- Does NOT alter or delete services, packages, portfolio_images or existing photos.

create table if not exists public.media_videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '',
  gallery_id uuid references public.portfolio_galleries(id) on update cascade on delete cascade,
  service_slug text references public.services(slug) on update cascade on delete cascade,
  visibility text not null default 'review' check (visibility in ('review','public','hidden')),
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_video_single_target check ((gallery_id is null) <> (service_slug is null))
);

create unique index if not exists media_videos_gallery_unique
  on public.media_videos (gallery_id, youtube_id) where gallery_id is not null;
create unique index if not exists media_videos_service_unique
  on public.media_videos (service_slug, youtube_id) where service_slug is not null;
create index if not exists media_videos_gallery_order on public.media_videos (gallery_id, visibility, display_order);
create index if not exists media_videos_service_order on public.media_videos (service_slug, visibility, display_order);

alter table public.media_videos enable row level security;

drop policy if exists "lkm_video_read" on public.media_videos;
drop policy if exists "lkm_video_public_read" on public.media_videos;
drop policy if exists "lkm_video_admin_read" on public.media_videos;
create policy "lkm_video_public_read" on public.media_videos for select to anon, authenticated
using (
  visibility = 'public'
  and (
    (gallery_id is not null and exists (
      select 1 from public.portfolio_galleries g
      where g.id=gallery_id and g.visibility='public'
    ))
    or (service_slug is not null and exists (
      select 1 from public.services s where s.slug=service_slug and s.active=true
    ))
  )
);
create policy "lkm_video_admin_read" on public.media_videos for select to authenticated
using (public.lkm_is_admin());
drop policy if exists "lkm_video_insert" on public.media_videos;
create policy "lkm_video_insert" on public.media_videos for insert to authenticated
with check (public.lkm_is_admin());
drop policy if exists "lkm_video_update" on public.media_videos;
create policy "lkm_video_update" on public.media_videos for update to authenticated
using (public.lkm_is_admin()) with check (public.lkm_is_admin());
drop policy if exists "lkm_video_delete" on public.media_videos;
create policy "lkm_video_delete" on public.media_videos for delete to authenticated
using (public.lkm_is_admin());

grant select on public.media_videos to anon, authenticated;
grant insert, update, delete on public.media_videos to authenticated;

-- created_at/updated_at on videos; lkm_updated_at exists in Phase 1 services migration.
drop trigger if exists media_videos_updated_at on public.media_videos;
create trigger media_videos_updated_at before update on public.media_videos
for each row execute function public.lkm_updated_at();
