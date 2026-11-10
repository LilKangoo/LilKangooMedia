-- LilKangooMedia Phase 23.1 — Sales CRM.
-- Run once in Supabase SQL Editor AFTER the existing LKM site migration.
-- ADDITIVE ONLY: does not update contact_leads, stripe_orders, bookings, Stripe or payment status.
-- All CRM details and activities are private to authenticated administrators.
begin;

create table if not exists public.lkm_crm_lead_details (
  lead_id uuid primary key references public.contact_leads(id) on delete cascade,
  stage text not null default 'new'
    check (stage in ('new','qualified','proposal','negotiation','won','lost')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high')),
  estimated_value_cents bigint
    check (estimated_value_cents is null or estimated_value_cents between 0 and 1000000000),
  next_follow_up_date date,
  internal_notes text not null default '' check (char_length(internal_notes) <= 5000),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index if not exists lkm_crm_followup_idx on public.lkm_crm_lead_details(next_follow_up_date);
create index if not exists lkm_crm_stage_idx on public.lkm_crm_lead_details(stage);

create table if not exists public.lkm_crm_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.contact_leads(id) on delete cascade,
  kind text not null check(kind in ('note','call','email','meeting')),
  summary text not null check(char_length(btrim(summary)) between 2 and 1500),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
create index if not exists lkm_crm_activity_lead_idx on public.lkm_crm_activities(lead_id,created_at desc);

alter table public.lkm_crm_lead_details enable row level security;
alter table public.lkm_crm_activities enable row level security;
revoke all on public.lkm_crm_lead_details from public,anon;
revoke all on public.lkm_crm_activities from public,anon;
grant select,insert,update on public.lkm_crm_lead_details to authenticated;
grant select,insert on public.lkm_crm_activities to authenticated;

drop policy if exists "lkm crm details admin read" on public.lkm_crm_lead_details;
drop policy if exists "lkm crm details admin add" on public.lkm_crm_lead_details;
drop policy if exists "lkm crm details admin edit" on public.lkm_crm_lead_details;
create policy "lkm crm details admin read" on public.lkm_crm_lead_details for select to authenticated
  using (public.lkm_is_admin());
create policy "lkm crm details admin add" on public.lkm_crm_lead_details for insert to authenticated
  with check (public.lkm_is_admin());
create policy "lkm crm details admin edit" on public.lkm_crm_lead_details for update to authenticated
  using (public.lkm_is_admin()) with check (public.lkm_is_admin());

drop policy if exists "lkm crm activities admin read" on public.lkm_crm_activities;
drop policy if exists "lkm crm activities admin add" on public.lkm_crm_activities;
create policy "lkm crm activities admin read" on public.lkm_crm_activities for select to authenticated
  using (public.lkm_is_admin());
create policy "lkm crm activities admin add" on public.lkm_crm_activities for insert to authenticated
  with check (public.lkm_is_admin());

create or replace function public.lkm_crm_touch_details()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.updated_at=now();
  new.updated_by=auth.uid();
  return new;
end;$$;
drop trigger if exists lkm_crm_details_touch on public.lkm_crm_lead_details;
create trigger lkm_crm_details_touch before update on public.lkm_crm_lead_details
for each row execute function public.lkm_crm_touch_details();
commit;
