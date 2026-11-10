-- LilKangooMedia Phase 24.1 — explicit client access, privacy-first.
-- ONLY NEW SQL for this phase. Run AFTER Phase 23.3A (contact_leads archive/CRM).
-- No existing SQL files are altered. No Stripe, booking, quote or payment writes.
-- A verified email login does NOT by itself expose any customer data.
BEGIN;

CREATE TABLE IF NOT EXISTS public.lkm_client_grants (
  lead_id uuid PRIMARY KEY REFERENCES public.contact_leads(id) ON DELETE CASCADE,
  client_email text NOT NULL
    CHECK (client_email = lower(btrim(client_email))
      AND client_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      AND char_length(client_email) BETWEEN 5 AND 200),
  active boolean NOT NULL DEFAULT true,
  granted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS lkm_client_grants_email_idx
  ON public.lkm_client_grants(client_email) WHERE active=true;
ALTER TABLE public.lkm_client_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_client_grants FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.lkm_client_grants TO authenticated;
DROP POLICY IF EXISTS "lkm portal admin view grants" ON public.lkm_client_grants;
DROP POLICY IF EXISTS "lkm portal admin create grants" ON public.lkm_client_grants;
DROP POLICY IF EXISTS "lkm portal admin update grants" ON public.lkm_client_grants;
CREATE POLICY "lkm portal admin view grants" ON public.lkm_client_grants
  FOR SELECT TO authenticated USING (public.lkm_is_admin());
CREATE POLICY "lkm portal admin create grants" ON public.lkm_client_grants
  FOR INSERT TO authenticated WITH CHECK (public.lkm_is_admin());
CREATE POLICY "lkm portal admin update grants" ON public.lkm_client_grants
  FOR UPDATE TO authenticated USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());

-- Prevent granting another email or a deleted/unknown lead, even if a UI bug sends it.
CREATE OR REPLACE FUNCTION public.lkm_client_guard_grant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text;v_archived timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501';
  END IF;
  SELECT lower(btrim(l.customer_email)),l.archived_at INTO v_email,v_archived
    FROM public.contact_leads l WHERE l.id=NEW.lead_id;
  IF v_email IS NULL OR NEW.client_email IS DISTINCT FROM v_email THEN
    RAISE EXCEPTION 'Portal email must match the enquiry email' USING ERRCODE='23514';
  END IF;
  IF NEW.active AND v_archived IS NOT NULL THEN
    RAISE EXCEPTION 'Restore this enquiry before enabling portal access' USING ERRCODE='23514';
  END IF;
  NEW.updated_at:=now();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_client_grant_guard_trg ON public.lkm_client_grants;
CREATE TRIGGER lkm_client_grant_guard_trg BEFORE INSERT OR UPDATE ON public.lkm_client_grants
  FOR EACH ROW EXECUTE FUNCTION public.lkm_client_guard_grant();

-- If the admin changes a customer's email or archives their enquiry, remove access.
-- This prevents old email addresses from continuing to see the enquiry.
CREATE OR REPLACE FUNCTION public.lkm_client_auto_revoke()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF lower(btrim(NEW.customer_email)) IS DISTINCT FROM lower(btrim(OLD.customer_email))
    OR (NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL) THEN
    UPDATE public.lkm_client_grants SET active=false,updated_at=now()
      WHERE lead_id=NEW.id AND active=true;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_client_auto_revoke_trg ON public.contact_leads;
CREATE TRIGGER lkm_client_auto_revoke_trg AFTER UPDATE OF customer_email,archived_at
  ON public.contact_leads FOR EACH ROW EXECUTE FUNCTION public.lkm_client_auto_revoke();

-- Single purpose read-only RPC. It can reveal ONLY summary fields of an
-- explicitly granted enquiry to the VERIFIED owner of the email in auth.jwt().
-- It does not change contact_leads RLS or expose messages, admin notes,
-- quotes, Stripe payments, other customer records, or access grants.
CREATE OR REPLACE FUNCTION public.lkm_client_portal_summary()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text;v_records jsonb;
BEGIN
  IF auth.uid() IS NULL OR
     coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN
    RAISE EXCEPTION 'Verified login required' USING ERRCODE='42501';
  END IF;
  v_email:=lower(btrim(coalesce(auth.jwt()->>'email','')));
  IF char_length(v_email)<5 OR NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id=auth.uid()
      AND lower(btrim(u.email))=v_email AND u.email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Verified email required' USING ERRCODE='42501';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'request_id',l.id,
    'service',coalesce(s.title,l.service_slug,'Creative services'),
    'submitted_on',l.created_at,
    'preferred_date',l.preferred_date,
    'status',CASE WHEN b.id IS NOT NULL THEN 'confirmed'
                  WHEN l.status IN ('declined','cancelled') THEN l.status
                  ELSE 'received' END
   ) ORDER BY l.created_at DESC),'[]'::jsonb) INTO v_records
  FROM public.lkm_client_grants g
  JOIN public.contact_leads l ON l.id=g.lead_id
  LEFT JOIN public.services s ON s.slug=l.service_slug
  LEFT JOIN public.lkm_booking_confirmations b ON b.source_type='lead' AND b.source_id=l.id AND b.state='confirmed'
  WHERE g.active=true AND g.client_email=v_email AND l.archived_at IS NULL;
  RETURN jsonb_build_object('ok',true,'items',v_records);
END; $$;
REVOKE ALL ON FUNCTION public.lkm_client_portal_summary() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_client_portal_summary() TO authenticated;
COMMIT;
