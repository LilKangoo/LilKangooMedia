-- LKM Phase 23.3B — one-time migration, run AFTER 23.3A.
-- ONLY SQL to run for this package. No Stripe/refunds/bookings/emails.
-- Public clients have NO table read/write permissions; the random one-time
-- bearer link is the sole authorization for one immutable sent quotation.
BEGIN;
CREATE TABLE IF NOT EXISTS public.lkm_quote_approvals (
 quote_id uuid PRIMARY KEY REFERENCES public.lkm_crm_quotes(id) ON DELETE RESTRICT,
 token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 decision text NOT NULL DEFAULT 'pending' CHECK(decision IN ('pending','accepted','declined','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 decided_at timestamptz,
 client_confirmed_name text NOT NULL DEFAULT '' CHECK(char_length(client_confirmed_name)<=120)
);
CREATE INDEX IF NOT EXISTS lkm_quote_approvals_pending_idx ON public.lkm_quote_approvals(expires_at) WHERE decision='pending';
ALTER TABLE public.lkm_quote_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_quote_approvals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lkm_quote_approvals TO authenticated;
DROP POLICY IF EXISTS "lkm quote approvals admin read" ON public.lkm_quote_approvals;
CREATE POLICY "lkm quote approvals admin read" ON public.lkm_quote_approvals
 FOR SELECT TO authenticated USING(public.lkm_is_admin());

-- Sent quotes represent immutable customer-visible snapshots.
CREATE OR REPLACE FUNCTION public.lkm_quote_protect_sent()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.status='sent' AND
   (to_jsonb(NEW)-'updated_at'-'updated_by') IS DISTINCT FROM (to_jsonb(OLD)-'updated_at'-'updated_by') THEN
  RAISE EXCEPTION 'Sent quotations are immutable. Create a new draft revision.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_quote_protect_sent_trigger ON public.lkm_crm_quotes;
CREATE TRIGGER lkm_quote_protect_sent_trigger BEFORE UPDATE ON public.lkm_crm_quotes
 FOR EACH ROW EXECUTE FUNCTION public.lkm_quote_protect_sent();

-- Admin creates/rotates a fresh secret; only its SHA-256 hash is kept in the DB.
-- Rotating a link invalidates all older links. Completed decisions cannot be reset.
CREATE OR REPLACE FUNCTION public.lkm_quote_admin_share(p_quote_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_quote public.lkm_crm_quotes%ROWTYPE;v_token text;v_prior text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
  RAISE EXCEPTION 'Administrator required.' USING ERRCODE='42501';
 END IF;
 SELECT * INTO v_quote FROM public.lkm_crm_quotes WHERE id=p_quote_id FOR UPDATE;
 IF NOT FOUND OR v_quote.status<>'sent' THEN
  RAISE EXCEPTION 'Mark this quotation sent before sharing.' USING ERRCODE='22023';
 END IF;
 IF v_quote.valid_until < (now() AT TIME ZONE 'Asia/Nicosia')::date THEN
  RAISE EXCEPTION 'Quotation has expired. Create a new revision.' USING ERRCODE='22023';
 END IF;
 SELECT decision INTO v_prior FROM public.lkm_quote_approvals WHERE quote_id=p_quote_id FOR UPDATE;
 IF v_prior IN ('accepted','declined') THEN
  RAISE EXCEPTION 'Client decision is final. Create a new quotation revision.' USING ERRCODE='23514';
 END IF;
 v_token:='lkm_'||replace(pg_catalog.gen_random_uuid()::text,'-','')||replace(pg_catalog.gen_random_uuid()::text,'-','');
 INSERT INTO public.lkm_quote_approvals(quote_id,token_hash,decision,expires_at,decided_at,client_confirmed_name)
 VALUES(p_quote_id,encode(pg_catalog.sha256(pg_catalog.convert_to(v_token,'UTF8')),'hex'),'pending',
  ((v_quote.valid_until+1)::timestamp AT TIME ZONE 'Asia/Nicosia'),NULL,'')
 ON CONFLICT(quote_id) DO UPDATE SET
  token_hash=EXCLUDED.token_hash,decision='pending',expires_at=EXCLUDED.expires_at,
  decided_at=NULL,client_confirmed_name='';
 RETURN jsonb_build_object('ok',true,'token',v_token,'expires_on',v_quote.valid_until);
END; $$;
REVOKE ALL ON FUNCTION public.lkm_quote_admin_share(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_quote_admin_share(uuid) TO authenticated;

-- Public bearer-link RPC: returns one quote only when the link is valid.
-- Never returns underlying contact_leads, CRM notes, secret hash or other quotes.
CREATE OR REPLACE FUNCTION public.lkm_quote_client_action(
 p_token text,p_action text DEFAULT 'view',p_confirm boolean DEFAULT false,p_name text DEFAULT ''
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_link public.lkm_quote_approvals%ROWTYPE;v_quote public.lkm_crm_quotes%ROWTYPE;
 v_total bigint:=0;v_subtotal bigint:=0;v_item jsonb;v_qty numeric;v_price bigint;
BEGIN
 IF p_token IS NULL OR p_token !~ '^lkm_[a-f0-9]{64}$' OR
    p_action NOT IN ('view','accept','decline') OR char_length(coalesce(p_name,''))>120 THEN
  RETURN jsonb_build_object('ok',false,'error','Link unavailable.');
 END IF;
 SELECT * INTO v_link FROM public.lkm_quote_approvals
  WHERE token_hash=encode(pg_catalog.sha256(pg_catalog.convert_to(p_token,'UTF8')),'hex') FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Link unavailable.'); END IF;
 SELECT * INTO v_quote FROM public.lkm_crm_quotes WHERE id=v_link.quote_id AND status='sent';
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Link unavailable.'); END IF;
 IF p_action<>'view' THEN
  IF v_link.decision<>'pending' OR v_link.expires_at<=now() THEN
   RETURN jsonb_build_object('ok',false,'error','This offer is no longer awaiting a decision.');
  END IF;
  IF p_action='accept' AND (p_confirm IS DISTINCT FROM true OR char_length(btrim(coalesce(p_name,'')))<2) THEN
   RETURN jsonb_build_object('ok',false,'error','Confirm the terms and enter your full name.');
  END IF;
  UPDATE public.lkm_quote_approvals SET decision=CASE WHEN p_action='accept' THEN 'accepted' ELSE 'declined' END,
   decided_at=now(),client_confirmed_name=CASE WHEN p_action='accept' THEN btrim(p_name) ELSE '' END
   WHERE quote_id=v_quote.id AND decision='pending'
   RETURNING * INTO v_link;
 END IF;
 -- Display only the stored quote snapshot. Totals computed server-side.
 FOR v_item IN SELECT value FROM pg_catalog.jsonb_array_elements(v_quote.line_items) LOOP
  v_qty:=(v_item->>'quantity')::numeric;
  v_price:=(v_item->>'unit_price_cents')::bigint;
  IF v_qty<=0 OR v_qty>1000 OR v_price<0 THEN
   RETURN jsonb_build_object('ok',false,'error','Offer data unavailable.');
  END IF;
  v_subtotal:=v_subtotal+round(v_qty*v_price)::bigint;
 END LOOP;
 v_total:=GREATEST(0,v_subtotal-v_quote.discount_cents);
 RETURN jsonb_build_object('ok',true,'decision',v_link.decision,
  'expired',v_link.expires_at<=now(),'decided_at',v_link.decided_at,
  'quote_number',v_quote.quote_number,'title',v_quote.title,
  'customer_name',v_quote.customer_name,'customer_company',v_quote.customer_company,
  'issue_date',v_quote.issue_date,'valid_until',v_quote.valid_until,
  'introduction',v_quote.introduction,'scope_notes',v_quote.scope_notes,
  'line_items',v_quote.line_items,'discount_cents',v_quote.discount_cents,
  'terms',v_quote.terms,'subtotal_cents',v_subtotal,'total_cents',v_total,'currency','EUR',
  'notice','Acceptance acknowledges the proposal, but does not process payment, confirm a booking or create an invoice.');
END; $$;
REVOKE ALL ON FUNCTION public.lkm_quote_client_action(text,text,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lkm_quote_client_action(text,text,boolean,text) TO anon,authenticated;
COMMIT;
