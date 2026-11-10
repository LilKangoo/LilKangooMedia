-- LilKangooMedia Phase 21.4A: secure, atomic ADMIN confirmation of full-day service bookings.
-- Run once in the existing LKM Supabase project after Phase 21.3.
-- A confirmation reserves ONE service for ONE full Cyprus calendar day.
-- Payments are NEVER taken and refunds are NEVER issued by this migration.
-- Existing services, leads, Stripe orders and availability blocks remain intact.
BEGIN;

CREATE TABLE IF NOT EXISTS public.lkm_booking_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('lead','order')),
  source_id uuid NOT NULL,
  service_slug text NOT NULL REFERENCES public.services(slug) ON UPDATE CASCADE,
  booking_date date NOT NULL,
  state text NOT NULL DEFAULT 'confirmed' CHECK (state IN ('confirmed','cancelled')),
  confirmed_by uuid REFERENCES auth.users(id),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS lkm_booking_confirmed_service_day
  ON public.lkm_booking_confirmations (service_slug, booking_date) WHERE state = 'confirmed';
CREATE INDEX IF NOT EXISTS lkm_booking_confirmation_day
  ON public.lkm_booking_confirmations (booking_date, state);
ALTER TABLE public.lkm_booking_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_booking_confirmations FROM PUBLIC, anon;
GRANT SELECT ON public.lkm_booking_confirmations TO authenticated;
DROP POLICY IF EXISTS "lkm confirmation admin read" ON public.lkm_booking_confirmations;
CREATE POLICY "lkm confirmation admin read" ON public.lkm_booking_confirmations
  FOR SELECT TO authenticated USING (public.lkm_is_admin());
-- No direct INSERT/UPDATE/DELETE grant or RLS policy for browser clients.
-- Changes are allowed only through the server-side transactional RPC below.

CREATE OR REPLACE FUNCTION public.lkm_admin_booking_decision(
  p_source_type text, p_source_id uuid, p_decision text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_date date;
  v_slug text;
  v_status text;
  v_current text;
  v_saved_id uuid;
  v_is_test boolean := false;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  IF p_source_type IS NULL OR p_decision IS NULL
     OR p_source_type NOT IN ('lead','order') OR p_decision NOT IN ('confirm','decline','cancel')
     OR p_source_id IS NULL THEN
    RAISE EXCEPTION 'Invalid booking decision' USING ERRCODE = '22023';
  END IF;

  IF p_source_type = 'lead' THEN
    SELECT l.preferred_date, l.service_slug, l.status INTO v_date,v_slug,v_status
      FROM public.contact_leads l WHERE l.id=p_source_id FOR UPDATE;
  ELSE
    SELECT o.preferred_date, o.service_slug, o.status INTO v_date,v_slug,v_status
      FROM public.stripe_orders o WHERE o.id=p_source_id FOR UPDATE;
    v_is_test := left(coalesce(v_status,''),5)='test_';
  END IF;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Booking request not found' USING ERRCODE='22023'; END IF;

  SELECT state INTO v_current FROM public.lkm_booking_confirmations
    WHERE source_type=p_source_type AND source_id=p_source_id FOR UPDATE;

  IF p_decision = 'confirm' THEN
    IF v_date IS NULL OR v_slug IS NULL OR v_slug !~ '^[a-z0-9-]{1,90}$'
       OR v_date < (now() AT TIME ZONE 'Asia/Nicosia')::date THEN
      RAISE EXCEPTION 'A future preferred date and valid service are required' USING ERRCODE='22023';
    END IF;
    IF p_source_type='order' AND v_status NOT IN
        ('paid_pending_confirmation','test_paid_pending_confirmation','confirmed','test_confirmed') THEN
      RAISE EXCEPTION 'This paid request cannot be confirmed from its current state' USING ERRCODE='22023';
    ELSIF p_source_type='lead' AND v_status IN ('declined','cancelled','refund_review_required') THEN
      RAISE EXCEPTION 'This enquiry cannot be confirmed from its current state' USING ERRCODE='22023';
    END IF;

    -- Serialize competing calendar changes for this date, including global blocks.
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('LKM-BOOKING-'||v_date::text));
    IF EXISTS (SELECT 1 FROM public.lkm_availability_blocks
        WHERE blocked_date=v_date AND (service_slug IS NULL OR service_slug=v_slug)) THEN
      RAISE EXCEPTION 'This date is manually blocked' USING ERRCODE='23505';
    END IF;
    INSERT INTO public.lkm_booking_confirmations
      (source_type,source_id,service_slug,booking_date,state,confirmed_by,confirmed_at,cancelled_at)
      VALUES (p_source_type,p_source_id,v_slug,v_date,'confirmed',auth.uid(),now(),NULL)
    ON CONFLICT (source_type,source_id) DO UPDATE SET
      service_slug=EXCLUDED.service_slug, booking_date=EXCLUDED.booking_date,
      state='confirmed',confirmed_by=auth.uid(),confirmed_at=now(),cancelled_at=NULL
    RETURNING id INTO v_saved_id;
    -- Unique (service_slug, booking_date) for active confirmations prevents two admins
    -- confirming different requests for the same service/day, even concurrently.
    IF p_source_type='order' THEN
      UPDATE public.stripe_orders SET status=CASE WHEN v_is_test THEN 'test_confirmed' ELSE 'confirmed' END WHERE id=p_source_id;
    ELSE
      UPDATE public.contact_leads SET status='confirmed' WHERE id=p_source_id;
    END IF;
    RETURN jsonb_build_object('ok',true,'state','confirmed','id',v_saved_id,'booking_date',v_date,'service_slug',v_slug);
  END IF;

  -- Only pending requests can be declined; confirmed requests must be cancelled.
  IF p_decision='decline' AND v_current='confirmed' THEN
    RAISE EXCEPTION 'Cancel this confirmed booking instead of declining it' USING ERRCODE='22023';
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
    -- Paid orders are NEVER automatically refunded or marked as refunded.
    -- This status is a staff-only reminder to review Stripe and contact the client.
    UPDATE public.stripe_orders SET status=CASE WHEN v_is_test THEN 'test_refund_review_required'
                                            ELSE 'refund_review_required' END WHERE id=p_source_id;
  ELSE
    UPDATE public.contact_leads SET status=CASE WHEN p_decision='decline' THEN 'declined' ELSE 'cancelled' END
      WHERE id=p_source_id;
  END IF;
  RETURN jsonb_build_object('ok',true,'state',p_decision,'refund_review_required',p_source_type='order');
END;
$$;
REVOKE ALL ON FUNCTION public.lkm_admin_booking_decision(text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lkm_admin_booking_decision(text,uuid,text) TO authenticated;

-- A manually added global or service-specific date block cannot silently
-- override an existing confirmed booking. Both operations share a DB date lock.
CREATE OR REPLACE FUNCTION public.lkm_block_check_confirmed_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('LKM-BOOKING-'||NEW.blocked_date::text));
  IF EXISTS (SELECT 1 FROM public.lkm_booking_confirmations b
      WHERE b.booking_date=NEW.blocked_date AND b.state='confirmed'
        AND (NEW.service_slug IS NULL OR b.service_slug=NEW.service_slug)) THEN
    RAISE EXCEPTION 'Cannot block date with confirmed booking' USING ERRCODE='23505';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS lkm_block_prevent_conflict ON public.lkm_availability_blocks;
CREATE TRIGGER lkm_block_prevent_conflict
  BEFORE INSERT OR UPDATE OF blocked_date, service_slug ON public.lkm_availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.lkm_block_check_confirmed_booking();
COMMIT;
