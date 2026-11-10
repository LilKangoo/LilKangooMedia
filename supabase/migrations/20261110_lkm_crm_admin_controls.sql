-- LilKangooMedia Phase 23.3A: administrator control over CRM enquiries.
-- Run AFTER Phase 23.1 CRM and Phase 23.2 Quotations migrations.
-- Additive; does not rewrite leads, quotations, bookings, payments, or refunds.
-- Admins can correct input, archive/restore, and permanently delete truly unlinked archived leads.
BEGIN;

ALTER TABLE public.contact_leads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_by uuid;
CREATE INDEX IF NOT EXISTS lkm_contact_leads_archive_idx ON public.contact_leads (archived_at, created_at DESC);

-- Audit records intentionally store NO names, emails, message bodies, or before/after PII.
-- Deletion audit is retained without foreign key so GDPR removal of the underlying lead is possible.
CREATE TABLE IF NOT EXISTS public.lkm_crm_lead_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('edited','archived','restored','deleted')),
  changed_fields text[] NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS lkm_crm_lead_audit_ref_idx ON public.lkm_crm_lead_audit(lead_id,occurred_at DESC);
ALTER TABLE public.lkm_crm_lead_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_crm_lead_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lkm_crm_lead_audit TO authenticated;
DROP POLICY IF EXISTS "lkm crm lead audit admin read" ON public.lkm_crm_lead_audit;
CREATE POLICY "lkm crm lead audit admin read" ON public.lkm_crm_lead_audit
 FOR SELECT TO authenticated USING (public.lkm_is_admin());

CREATE OR REPLACE FUNCTION public.lkm_crm_before_lead_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Never silently move an already-confirmed booking to another day/service.
  IF (NEW.preferred_date IS DISTINCT FROM OLD.preferred_date OR
      NEW.service_slug IS DISTINCT FROM OLD.service_slug) AND
     EXISTS (SELECT 1 FROM public.lkm_booking_confirmations b
       WHERE b.source_type='lead' AND b.source_id=OLD.id AND b.state='confirmed') THEN
    RAISE EXCEPTION 'Confirmed booking: cancel/rebook in the availability calendar before changing service or date.'
      USING ERRCODE='23514';
  END IF;
  NEW.edited_at := now();
  NEW.edited_by := auth.uid();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_crm_guard_lead_edit ON public.contact_leads;
CREATE TRIGGER lkm_crm_guard_lead_edit BEFORE UPDATE ON public.contact_leads
 FOR EACH ROW EXECUTE FUNCTION public.lkm_crm_before_lead_edit();

CREATE OR REPLACE FUNCTION public.lkm_crm_audit_lead_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_fields text[] := '{}';
  v_field text;
  v_action text := 'edited';
BEGIN
  IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
    v_action := 'archived';
  ELSIF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
    v_action := 'restored';
  END IF;
  FOREACH v_field IN ARRAY ARRAY[
    'customer_name','customer_email','phone','service_slug','service_type',
    'package_id','preferred_date','message','addons','submission_type','status','archived_at'
  ] LOOP
    IF (to_jsonb(OLD) -> v_field) IS DISTINCT FROM (to_jsonb(NEW) -> v_field) THEN
      v_fields := array_append(v_fields,v_field);
    END IF;
  END LOOP;
  IF array_length(v_fields,1) IS NOT NULL THEN
    INSERT INTO public.lkm_crm_lead_audit(lead_id,action,changed_fields,actor_id)
      VALUES (NEW.id,v_action,v_fields,auth.uid());
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_crm_audit_lead_edit_trigger ON public.contact_leads;
CREATE TRIGGER lkm_crm_audit_lead_edit_trigger AFTER UPDATE ON public.contact_leads
 FOR EACH ROW EXECUTE FUNCTION public.lkm_crm_audit_lead_edit();

-- No direct DELETE permission is given to browser clients. This RPC is the only
-- allowed permanent-removal path; it refuses any financially or legally linked lead.
CREATE OR REPLACE FUNCTION public.lkm_crm_admin_remove_lead(
  p_lead_id uuid, p_confirmation text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_lead public.contact_leads%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501';
  END IF;
  IF p_lead_id IS NULL OR p_confirmation IS DISTINCT FROM 'DELETE' THEN
    RAISE EXCEPTION 'Type DELETE to confirm permanent removal.' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_lead FROM public.contact_leads WHERE id=p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead does not exist.' USING ERRCODE='22023'; END IF;
  IF v_lead.archived_at IS NULL THEN
    RAISE EXCEPTION 'Archive the enquiry before permanent deletion.' USING ERRCODE='22023';
  END IF;
  IF EXISTS(SELECT 1 FROM public.lkm_crm_quotes q WHERE q.lead_id=p_lead_id) THEN
    RAISE EXCEPTION 'This enquiry has quotations: retain and archive it instead.' USING ERRCODE='23503';
  END IF;
  IF EXISTS(SELECT 1 FROM public.lkm_booking_confirmations b
       WHERE b.source_type='lead' AND b.source_id=p_lead_id) THEN
    RAISE EXCEPTION 'This enquiry has booking history: retain and archive it instead.' USING ERRCODE='23503';
  END IF;
  IF EXISTS(SELECT 1 FROM public.stripe_orders o
       WHERE lower(o.customer_email)=lower(v_lead.customer_email)) THEN
    RAISE EXCEPTION 'A Stripe payment exists for this email: archive the enquiry instead.' USING ERRCODE='23503';
  END IF;
  -- The CRM details and interaction history cascade away; the audit records are minimal.
  INSERT INTO public.lkm_crm_lead_audit(lead_id,action,changed_fields,actor_id)
    VALUES (p_lead_id,'deleted',ARRAY[]::text[],auth.uid());
  DELETE FROM public.contact_leads WHERE id=p_lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deletion failed.' USING ERRCODE='P0001'; END IF;
  RETURN jsonb_build_object('ok',true,'deleted',p_lead_id);
END; $$;
REVOKE ALL ON FUNCTION public.lkm_crm_admin_remove_lead(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_crm_admin_remove_lead(uuid,text) TO authenticated;

-- Allow safely discarding DRAFT quotations only; sent proposals stay in the audit trail.
CREATE OR REPLACE FUNCTION public.lkm_crm_admin_remove_draft_quote(
  p_quote_id uuid, p_confirmation text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_status text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501';
  END IF;
  IF p_quote_id IS NULL OR p_confirmation IS DISTINCT FROM 'DELETE' THEN
    RAISE EXCEPTION 'Type DELETE to remove the draft.' USING ERRCODE='22023';
  END IF;
  SELECT status INTO v_status FROM public.lkm_crm_quotes WHERE id=p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quotation not found.' USING ERRCODE='22023'; END IF;
  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Sent quotations cannot be deleted. Create a revision instead.' USING ERRCODE='23514';
  END IF;
  DELETE FROM public.lkm_crm_quotes WHERE id=p_quote_id;
  RETURN jsonb_build_object('ok',true,'deleted',p_quote_id);
END; $$;
REVOKE ALL ON FUNCTION public.lkm_crm_admin_remove_draft_quote(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_crm_admin_remove_draft_quote(uuid,text) TO authenticated;

COMMIT;
