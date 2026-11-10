-- LilKangooMedia Phase 21.4B — hourly confirmation slots + checkout holds.
-- Install AFTER 21.3 and 21.4A, using the SAME Supabase project.
-- No refunds, transfers, credits, or Stripe API access are implemented in this migration.
-- Safe repeat: CREATE OR REPLACE / IF NOT EXISTS; modifications run in one transaction.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.lkm_booking_confirmations
  ADD COLUMN IF NOT EXISTS start_min integer,
  ADD COLUMN IF NOT EXISTS end_min integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='lkm_booking_slot_minutes' AND conrelid='public.lkm_booking_confirmations'::regclass) THEN
    ALTER TABLE public.lkm_booking_confirmations ADD CONSTRAINT lkm_booking_slot_minutes CHECK
      ((start_min IS NULL AND end_min IS NULL) OR
       (start_min IS NOT NULL AND end_min IS NOT NULL AND start_min >= 0 AND end_min <= 1440
        AND end_min > start_min AND start_min % 30 = 0 AND end_min % 30 = 0));
  END IF;
END $$;
-- Existing full-day confirmations remain [00:00,24:00). New time slots may share
-- one service/day ONLY when their intervals do not overlap.
DROP INDEX IF EXISTS public.lkm_booking_confirmed_service_day;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='lkm_booking_exclude_overlaps'
     AND conrelid='public.lkm_booking_confirmations'::regclass) THEN
    ALTER TABLE public.lkm_booking_confirmations ADD CONSTRAINT lkm_booking_exclude_overlaps
    EXCLUDE USING gist (
      service_slug WITH =, booking_date WITH =,
      (int4range(coalesce(start_min,0),coalesce(end_min,1440),'[)')) WITH &&
    ) WHERE (state='confirmed');
  END IF;
END $$;

-- The Checkout hold is intentionally WHOLE-DAY for now. A fixed-price package may
-- occupy more than one hour; full-day holds avoid underselling unknown durations.
-- 'holding' stays reserved until an authenticated Stripe expired/failed webhook
-- or an administrator verifies the session in Stripe and releases it.
-- 'paid' stays reserved until an administrator confirms/declines the order.
CREATE TABLE IF NOT EXISTS public.lkm_booking_checkout_holds (
  request_id uuid PRIMARY KEY,
  service_slug text NOT NULL REFERENCES public.services(slug) ON UPDATE CASCADE,
  booking_date date NOT NULL,
  state text NOT NULL DEFAULT 'holding' CHECK (state IN ('holding','paid','released')),
  stripe_session_id text UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '35 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lkm_hold_service_date_idx ON public.lkm_booking_checkout_holds(service_slug,booking_date,state);
ALTER TABLE public.lkm_booking_checkout_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_booking_checkout_holds FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lkm_booking_checkout_holds TO authenticated;
DROP POLICY IF EXISTS "lkm holds admin read" ON public.lkm_booking_checkout_holds;
CREATE POLICY "lkm holds admin read" ON public.lkm_booking_checkout_holds FOR SELECT TO authenticated
  USING (public.lkm_is_admin());

-- Server-only atomic reserve. Lock the calendar day with the same advisory lock
-- as admin confirmations and date block triggers.
CREATE OR REPLACE FUNCTION public.lkm_checkout_hold_acquire(p_request_id uuid,p_service_slug text,p_booking_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_hold public.lkm_booking_checkout_holds%ROWTYPE;
BEGIN
  IF p_request_id IS NULL OR p_service_slug !~ '^[a-z0-9-]{1,90}$'
     OR p_booking_date IS NULL OR p_booking_date < (now() AT TIME ZONE 'Asia/Nicosia')::date THEN
    RAISE EXCEPTION 'Invalid checkout hold' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE slug=p_service_slug AND active=true) THEN
    RAISE EXCEPTION 'Service unavailable' USING ERRCODE='22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('LKM-BOOKING-'||p_booking_date::text));
  SELECT * INTO v_hold FROM public.lkm_booking_checkout_holds WHERE request_id=p_request_id FOR UPDATE;
  IF FOUND THEN
    IF v_hold.service_slug<>p_service_slug OR v_hold.booking_date<>p_booking_date
       OR v_hold.state<>'holding' THEN
      RAISE EXCEPTION 'Checkout request already used or expired' USING ERRCODE='22023';
    END IF;
    -- Do not silently renew an old Stripe session. Its event may be delayed.
    RETURN jsonb_build_object('ok',true,'reused',true,'expires_at',v_hold.expires_at);
  END IF;
  IF EXISTS (SELECT 1 FROM public.lkm_availability_blocks b WHERE b.blocked_date=p_booking_date
       AND (b.service_slug IS NULL OR b.service_slug=p_service_slug))
    OR EXISTS (SELECT 1 FROM public.lkm_booking_confirmations c WHERE c.booking_date=p_booking_date
       AND c.service_slug=p_service_slug AND c.state='confirmed')
    OR EXISTS (SELECT 1 FROM public.lkm_booking_checkout_holds h WHERE h.booking_date=p_booking_date
       AND h.service_slug=p_service_slug AND h.state IN ('holding','paid')) THEN
    RAISE EXCEPTION 'Requested date is not available for checkout' USING ERRCODE='23505';
  END IF;
  INSERT INTO public.lkm_booking_checkout_holds(request_id,service_slug,booking_date,state)
    VALUES(p_request_id,p_service_slug,p_booking_date,'holding') RETURNING * INTO v_hold;
  RETURN jsonb_build_object('ok',true,'reused',false,'expires_at',v_hold.expires_at);
END $$;
REVOKE ALL ON FUNCTION public.lkm_checkout_hold_acquire(uuid,text,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lkm_checkout_hold_acquire(uuid,text,date) TO service_role;

CREATE OR REPLACE FUNCTION public.lkm_checkout_hold_attach(p_request_id uuid,p_session_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  IF p_request_id IS NULL OR p_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Invalid Checkout session' USING ERRCODE='22023';
  END IF;
  UPDATE public.lkm_booking_checkout_holds SET stripe_session_id=p_session_id,updated_at=now()
    WHERE request_id=p_request_id AND state IN ('holding','paid')
      AND (stripe_session_id IS NULL OR stripe_session_id=p_session_id);
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'Checkout hold not found' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.lkm_checkout_hold_attach(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lkm_checkout_hold_attach(uuid,text) TO service_role;

-- Called only AFTER a signed Stripe event passes all payment validation.
CREATE OR REPLACE FUNCTION public.lkm_checkout_hold_paid(p_request_id uuid,p_session_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.lkm_booking_checkout_holds SET state='paid',stripe_session_id=p_session_id,updated_at=now()
    WHERE request_id=p_request_id AND state IN ('holding','paid')
      AND (stripe_session_id IS NULL OR stripe_session_id=p_session_id);
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'Missing or conflicting payment hold' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.lkm_checkout_hold_paid(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lkm_checkout_hold_paid(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.lkm_checkout_hold_expired(p_request_id uuid,p_session_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  -- Never release a hold once it has reached 'paid'. No refund action here.
  UPDATE public.lkm_booking_checkout_holds SET state='released',updated_at=now()
    WHERE request_id=p_request_id AND state IN ('holding','paid')
      AND (stripe_session_id IS NULL OR stripe_session_id=p_session_id);
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN jsonb_build_object('ok',true,'released',v_count=1);
END $$;
REVOKE ALL ON FUNCTION public.lkm_checkout_hold_expired(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lkm_checkout_hold_expired(uuid,text) TO service_role;

-- Manual recovery of a stale hold. Staff MUST check Stripe before proceeding.
CREATE OR REPLACE FUNCTION public.lkm_admin_release_stale_hold(p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501';
  END IF;
  UPDATE public.lkm_booking_checkout_holds SET state='released',updated_at=now()
    WHERE request_id=p_request_id AND state='holding' AND expires_at < now();
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'Only expired, unpaid holds may be released' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.lkm_admin_release_stale_hold(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_admin_release_stale_hold(uuid) TO authenticated;

-- Existing admin RPC remains backwards-compatible: 3 arguments still work.
-- Additional optional times reserve a specific interval instead of the full day.
DROP FUNCTION IF EXISTS public.lkm_admin_booking_decision(text,uuid,text);
CREATE OR REPLACE FUNCTION public.lkm_admin_booking_decision(
  p_source_type text, p_source_id uuid, p_decision text,
  p_start_min integer DEFAULT NULL, p_end_min integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_date date;v_slug text;v_status text;v_current text;v_saved_id uuid;
  v_session_id text;v_is_test boolean := false;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  IF p_source_type NOT IN ('lead','order') OR p_decision NOT IN ('confirm','decline','cancel')
     OR p_source_id IS NULL THEN
    RAISE EXCEPTION 'Invalid booking decision' USING ERRCODE='22023';
  END IF;
  IF p_decision='confirm' THEN
    IF (p_start_min IS NULL) <> (p_end_min IS NULL) OR
       (p_start_min IS NOT NULL AND (p_start_min < 0 OR p_end_min > 1440
         OR p_end_min <= p_start_min OR p_start_min%30<>0 OR p_end_min%30<>0)) THEN
      RAISE EXCEPTION 'Invalid time slot' USING ERRCODE='22023';
    END IF;
  ELSIF p_start_min IS NOT NULL OR p_end_min IS NOT NULL THEN
    RAISE EXCEPTION 'Time slot only applies to confirmation' USING ERRCODE='22023';
  END IF;
  IF p_source_type='lead' THEN
    SELECT l.preferred_date,l.service_slug,l.status INTO v_date,v_slug,v_status
      FROM public.contact_leads l WHERE l.id=p_source_id FOR UPDATE;
  ELSE
    SELECT o.preferred_date,o.service_slug,o.status,o.stripe_session_id
      INTO v_date,v_slug,v_status,v_session_id
      FROM public.stripe_orders o WHERE o.id=p_source_id FOR UPDATE;
    v_is_test := left(coalesce(v_status,''),5)='test_';
  END IF;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Booking request not found' USING ERRCODE='22023'; END IF;
  SELECT state INTO v_current FROM public.lkm_booking_confirmations
    WHERE source_type=p_source_type AND source_id=p_source_id FOR UPDATE;

  IF p_decision='confirm' THEN
    IF v_date IS NULL OR v_slug IS NULL OR v_slug !~ '^[a-z0-9-]{1,90}$'
       OR v_date < (now() AT TIME ZONE 'Asia/Nicosia')::date THEN
      RAISE EXCEPTION 'Future date and valid service required' USING ERRCODE='22023';
    END IF;
    IF p_source_type='order' AND v_status NOT IN
        ('paid_pending_confirmation','test_paid_pending_confirmation','confirmed','test_confirmed') THEN
      RAISE EXCEPTION 'This paid request cannot be confirmed' USING ERRCODE='22023';
    ELSIF p_source_type='lead' AND v_status IN ('declined','cancelled','refund_review_required') THEN
      RAISE EXCEPTION 'This enquiry cannot be confirmed' USING ERRCODE='22023';
    END IF;
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('LKM-BOOKING-'||v_date::text));
    IF EXISTS (SELECT 1 FROM public.lkm_availability_blocks b
       WHERE b.blocked_date=v_date AND (b.service_slug IS NULL OR b.service_slug=v_slug)) THEN
      RAISE EXCEPTION 'Date is manually blocked' USING ERRCODE='23505';
    END IF;
    IF EXISTS (SELECT 1 FROM public.lkm_booking_checkout_holds h
       WHERE h.booking_date=v_date AND h.service_slug=v_slug AND h.state IN ('holding','paid')
         AND (p_source_type<>'order' OR h.stripe_session_id IS DISTINCT FROM v_session_id)) THEN
      RAISE EXCEPTION 'Date has an ongoing Checkout or paid request awaiting decision' USING ERRCODE='23505';
    END IF;
    INSERT INTO public.lkm_booking_confirmations
      (source_type,source_id,service_slug,booking_date,state,confirmed_by,confirmed_at,cancelled_at,start_min,end_min)
      VALUES (p_source_type,p_source_id,v_slug,v_date,'confirmed',auth.uid(),now(),NULL,p_start_min,p_end_min)
    ON CONFLICT (source_type,source_id) DO UPDATE SET
      service_slug=EXCLUDED.service_slug,booking_date=EXCLUDED.booking_date,
      state='confirmed',confirmed_by=auth.uid(),confirmed_at=now(),cancelled_at=NULL,
      start_min=EXCLUDED.start_min,end_min=EXCLUDED.end_min
    RETURNING id INTO v_saved_id;
    IF p_source_type='order' THEN
      UPDATE public.stripe_orders SET status=CASE WHEN v_is_test THEN 'test_confirmed' ELSE 'confirmed' END WHERE id=p_source_id;
      UPDATE public.lkm_booking_checkout_holds SET state='released',updated_at=now()
        WHERE stripe_session_id=v_session_id AND state='paid';
    ELSE
      UPDATE public.contact_leads SET status='confirmed' WHERE id=p_source_id;
    END IF;
    RETURN jsonb_build_object('ok',true,'state','confirmed','id',v_saved_id,'booking_date',v_date,
      'service_slug',v_slug,'start_min',p_start_min,'end_min',p_end_min);
  END IF;

  IF p_decision='decline' AND v_current='confirmed' THEN
    RAISE EXCEPTION 'Cancel confirmed bookings instead' USING ERRCODE='22023';
  END IF;
  IF p_decision='cancel' AND v_current IS DISTINCT FROM 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can be cancelled' USING ERRCODE='22023';
  END IF;
  IF v_date IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('LKM-BOOKING-'||v_date::text));
  END IF;
  UPDATE public.lkm_booking_confirmations SET state='cancelled',cancelled_at=now()
    WHERE source_type=p_source_type AND source_id=p_source_id AND state='confirmed';
  IF p_source_type='order' THEN
    -- STATUS ONLY. Any actual refund is performed manually in STRIPE, never on the website.
    UPDATE public.stripe_orders SET status=CASE WHEN v_is_test THEN 'test_refund_review_required'
      ELSE 'refund_review_required' END WHERE id=p_source_id;
    UPDATE public.lkm_booking_checkout_holds SET state='released',updated_at=now()
      WHERE stripe_session_id=v_session_id AND state IN ('holding','paid');
  ELSE
    UPDATE public.contact_leads SET status=CASE WHEN p_decision='decline' THEN 'declined' ELSE 'cancelled' END
      WHERE id=p_source_id;
  END IF;
  RETURN jsonb_build_object('ok',true,'state',p_decision,'stripe_review_required',p_source_type='order');
END $$;
REVOKE ALL ON FUNCTION public.lkm_admin_booking_decision(text,uuid,text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_admin_booking_decision(text,uuid,text,integer,integer) TO authenticated;

-- Keep global/manual date blocks from conflicting with paid/ongoing Checkout holds.
CREATE OR REPLACE FUNCTION public.lkm_block_check_confirmed_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('LKM-BOOKING-'||NEW.blocked_date::text));
  IF EXISTS (SELECT 1 FROM public.lkm_booking_confirmations b
      WHERE b.booking_date=NEW.blocked_date AND b.state='confirmed'
        AND (NEW.service_slug IS NULL OR b.service_slug=NEW.service_slug))
     OR EXISTS (SELECT 1 FROM public.lkm_booking_checkout_holds h
      WHERE h.booking_date=NEW.blocked_date AND h.state IN ('holding','paid')
        AND (NEW.service_slug IS NULL OR h.service_slug=NEW.service_slug)) THEN
    RAISE EXCEPTION 'Cannot block date with confirmed booking or active Checkout hold' USING ERRCODE='23505';
  END IF;
  RETURN NEW;
END $$;
-- The existing trigger installed by Phase 21.4A calls this replaced function.
NOTIFY pgrst, 'reload schema';
COMMIT;
