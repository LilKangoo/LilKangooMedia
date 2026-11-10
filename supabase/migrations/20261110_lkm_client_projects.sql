-- LilKangooMedia Phase 24.2: client projects and published progress updates.
-- ONLY SQL to run for Phase 24.2. Run after 20261110_lkm_client_portal_foundation.sql (Phase 24.1).
-- ADDITIVE: does not alter earlier SQL or update existing leads, bookings, quotes, Stripe, payments or refunds.
-- Admin edits use native Supabase RLS. Clients use ONLY the read-only RPC below.
BEGIN;

CREATE TABLE IF NOT EXISTS public.lkm_client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.contact_leads(id) ON DELETE RESTRICT,
  order_id uuid UNIQUE REFERENCES public.stripe_orders(id) ON DELETE SET NULL,
  title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 3 AND 160),
  summary text NOT NULL DEFAULT '' CHECK(char_length(summary)<=1800),
  phase text NOT NULL DEFAULT 'planning'
    CHECK(phase IN ('planning','in_progress','client_review','delivered','on_hold','cancelled')),
  progress integer NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  target_date date,
  next_step text NOT NULL DEFAULT '' CHECK(char_length(next_step)<=900),
  client_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS lkm_projects_by_phase ON public.lkm_client_projects(phase,updated_at DESC);
CREATE INDEX IF NOT EXISTS lkm_projects_visible ON public.lkm_client_projects(lead_id) WHERE client_visible=true;

CREATE TABLE IF NOT EXISTS public.lkm_client_project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.lkm_client_projects(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 3 AND 140),
  detail text NOT NULL DEFAULT '' CHECK(char_length(detail)<=1500),
  client_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS lkm_project_updates_by_project ON public.lkm_client_project_updates(project_id,created_at DESC);

ALTER TABLE public.lkm_client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lkm_client_project_updates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_client_projects FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.lkm_client_project_updates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lkm_client_projects TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lkm_client_project_updates TO authenticated;
DROP POLICY IF EXISTS "lkm projects private admin" ON public.lkm_client_projects;
CREATE POLICY "lkm projects private admin" ON public.lkm_client_projects
 FOR ALL TO authenticated USING(public.lkm_is_admin()) WITH CHECK(public.lkm_is_admin());
DROP POLICY IF EXISTS "lkm project updates private admin" ON public.lkm_client_project_updates;
CREATE POLICY "lkm project updates private admin" ON public.lkm_client_project_updates
 FOR ALL TO authenticated USING(public.lkm_is_admin()) WITH CHECK(public.lkm_is_admin());

-- Protect explicit order linkage: only a REAL paid order belonging to exactly this lead's email.
CREATE OR REPLACE FUNCTION public.lkm_project_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text;v_archived timestamptz;v_order_email text;v_order_status text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
  RAISE EXCEPTION 'Administrator required.' USING ERRCODE='42501';
 END IF;
 SELECT lower(btrim(l.customer_email)),l.archived_at INTO v_email,v_archived
  FROM public.contact_leads l WHERE l.id=NEW.lead_id;
 IF v_email IS NULL THEN RAISE EXCEPTION 'Unknown customer enquiry.' USING ERRCODE='22023'; END IF;
 IF NEW.client_visible AND v_archived IS NOT NULL THEN
  RAISE EXCEPTION 'Restore this enquiry before publishing its project.' USING ERRCODE='23514';
 END IF;
 IF NEW.order_id IS NOT NULL THEN
  SELECT lower(btrim(o.customer_email)),o.status INTO v_order_email,v_order_status
    FROM public.stripe_orders o WHERE o.id=NEW.order_id;
  IF v_order_email IS DISTINCT FROM v_email OR v_order_status IS NULL OR
     v_order_status LIKE 'test_%' OR
     v_order_status NOT IN ('paid_pending_confirmation','confirmed','cancelled','declined','refund_review_required') THEN
    RAISE EXCEPTION 'Choose a real payment record belonging to the same email address.' USING ERRCODE='23514';
  END IF;
 END IF;
 NEW.updated_at:=now();NEW.updated_by:=auth.uid();
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_project_guard_trigger ON public.lkm_client_projects;
CREATE TRIGGER lkm_project_guard_trigger BEFORE INSERT OR UPDATE ON public.lkm_client_projects
 FOR EACH ROW EXECUTE FUNCTION public.lkm_project_guard();

CREATE OR REPLACE FUNCTION public.lkm_project_update_touch()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN NEW.updated_at:=now();NEW.updated_by:=auth.uid();RETURN NEW;END; $$;
DROP TRIGGER IF EXISTS lkm_project_update_touch_trigger ON public.lkm_client_project_updates;
CREATE TRIGGER lkm_project_update_touch_trigger BEFORE UPDATE ON public.lkm_client_project_updates
 FOR EACH ROW EXECUTE FUNCTION public.lkm_project_update_touch();

-- A published project or a project with history cannot be deleted (unpublish instead).
CREATE OR REPLACE FUNCTION public.lkm_project_delete_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.client_visible OR EXISTS(SELECT 1 FROM public.lkm_client_project_updates u WHERE u.project_id=OLD.id) THEN
  RAISE EXCEPTION 'Unpublish project and retain its history. Only unpublished projects without updates can be deleted.' USING ERRCODE='23514';
 END IF;
 RETURN OLD;
END; $$;
DROP TRIGGER IF EXISTS lkm_project_delete_guard_trigger ON public.lkm_client_projects;
CREATE TRIGGER lkm_project_delete_guard_trigger BEFORE DELETE ON public.lkm_client_projects
 FOR EACH ROW EXECUTE FUNCTION public.lkm_project_delete_guard();

-- Public tables have no client SELECT grants or client policies. This RPC enforces
-- verified auth email + per-enquiry active portal grant + explicit publication.
CREATE OR REPLACE FUNCTION public.lkm_client_project_dashboard()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text;v_projects jsonb;
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN
  RAISE EXCEPTION 'Verified sign-in required.' USING ERRCODE='42501';
 END IF;
 v_email:=lower(btrim(coalesce(auth.jwt()->>'email','')));
 IF char_length(v_email)<5 OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id=auth.uid() AND
    lower(btrim(u.email))=v_email AND u.email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Verified email required.' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'project_id',p.id,'request_id',l.id,'title',p.title,'summary',p.summary,
  'phase',p.phase,'progress',p.progress,'target_date',p.target_date,
  'next_step',p.next_step,'updated_at',p.updated_at,
  'order',CASE WHEN o.id IS NOT NULL THEN jsonb_build_object(
    'status',o.status,'paid_amount_cents',o.paid_amount_cents,
    'payment_kind',o.payment_kind,'currency','EUR') ELSE NULL END,
  'updates',coalesce((SELECT jsonb_agg(jsonb_build_object(
       'id',u.id,'title',u.title,'detail',u.detail,'created_at',u.created_at)
     ORDER BY u.created_at DESC)
    FROM public.lkm_client_project_updates u
    WHERE u.project_id=p.id AND u.client_visible=true),'[]'::jsonb)
 ) ORDER BY p.updated_at DESC),'[]'::jsonb) INTO v_projects
 FROM public.lkm_client_projects p
 JOIN public.contact_leads l ON l.id=p.lead_id
 JOIN public.lkm_client_grants g ON g.lead_id=l.id
 LEFT JOIN public.stripe_orders o ON o.id=p.order_id
   AND lower(btrim(o.customer_email))=v_email AND o.status NOT LIKE 'test_%'
 WHERE g.active=true AND g.client_email=v_email
   AND lower(btrim(l.customer_email))=v_email
   AND l.archived_at IS NULL AND p.client_visible=true;
 RETURN jsonb_build_object('ok',true,'projects',v_projects);
END; $$;
REVOKE ALL ON FUNCTION public.lkm_client_project_dashboard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_client_project_dashboard() TO authenticated;
COMMIT;
