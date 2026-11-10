-- LilKangooMedia Phase 21.3 — administrator-managed unavailable dates.
-- Run ONCE in the existing LilKangooMedia Supabase project > SQL Editor.
-- This migration does not edit or delete existing services, leads, or Stripe orders.
-- It intentionally does NOT auto-confirm bookings: confirmed capacity/holds are Phase 21.4.

begin;
create table if not exists public.lkm_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  service_slug text references public.services(slug) on update cascade on delete cascade,
  blocked_date date not null,
  note text not null default '' check (char_length(note) <= 400),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
-- A NULL service_slug blocks the date for all services. A service-specific row only blocks that service.
-- This unique index also prevents two admins adding the same block simultaneously.
create unique index if not exists lkm_availability_one_block_per_scope_day
  on public.lkm_availability_blocks ((coalesce(service_slug, '*')), blocked_date);
create index if not exists lkm_availability_blocks_by_date
  on public.lkm_availability_blocks (blocked_date, service_slug);

alter table public.lkm_availability_blocks enable row level security;
revoke all on public.lkm_availability_blocks from public, anon;
grant select, insert, update, delete on public.lkm_availability_blocks to authenticated;
-- The existing project-owned public.lkm_is_admin() security check is required.
drop policy if exists "lkm calendar admin reads" on public.lkm_availability_blocks;
drop policy if exists "lkm calendar admin creates" on public.lkm_availability_blocks;
drop policy if exists "lkm calendar admin updates" on public.lkm_availability_blocks;
drop policy if exists "lkm calendar admin removes" on public.lkm_availability_blocks;
create policy "lkm calendar admin reads" on public.lkm_availability_blocks
  for select to authenticated using (public.lkm_is_admin());
create policy "lkm calendar admin creates" on public.lkm_availability_blocks
  for insert to authenticated with check (public.lkm_is_admin());
create policy "lkm calendar admin updates" on public.lkm_availability_blocks
  for update to authenticated using (public.lkm_is_admin()) with check (public.lkm_is_admin());
create policy "lkm calendar admin removes" on public.lkm_availability_blocks
  for delete to authenticated using (public.lkm_is_admin());
commit;
