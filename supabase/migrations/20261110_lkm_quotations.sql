-- LilKangooMedia Phase 23.2 — Quotation Builder.
-- Run once in the EXISTING LKM Supabase SQL Editor after Phase 23.1 Sales CRM migration.
-- Additive only. No Stripe writes, payment/refund API, emails, booking status changes.
-- Quotes are private: only previously configured admin users (public.lkm_is_admin()).
BEGIN;

CREATE TABLE IF NOT EXISTS public.lkm_crm_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  lead_id uuid NOT NULL REFERENCES public.contact_leads(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  title text NOT NULL DEFAULT '' CHECK (char_length(title)<=180),
  customer_name text NOT NULL DEFAULT '' CHECK (char_length(customer_name)<=120),
  customer_email text NOT NULL DEFAULT '' CHECK (char_length(customer_email)<=200),
  customer_company text NOT NULL DEFAULT '' CHECK (char_length(customer_company)<=160),
  customer_phone text NOT NULL DEFAULT '' CHECK (char_length(customer_phone)<=50),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date NOT NULL DEFAULT CURRENT_DATE+14,
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency='EUR'),
  introduction text NOT NULL DEFAULT '' CHECK (char_length(introduction)<=1600),
  scope_notes text NOT NULL DEFAULT '' CHECK (char_length(scope_notes)<=3000),
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(line_items)='array' AND jsonb_array_length(line_items) BETWEEN 0 AND 30),
  discount_cents bigint NOT NULL DEFAULT 0 CHECK (discount_cents BETWEEN 0 AND 1000000000),
  terms text NOT NULL DEFAULT '' CHECK (char_length(terms)<=3000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  CONSTRAINT lkm_quote_dates_valid CHECK (valid_until>=issue_date),
  CONSTRAINT lkm_quote_customer_email CHECK (customer_email = '' OR customer_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);
CREATE INDEX IF NOT EXISTS lkm_crm_quotes_lead_idx ON public.lkm_crm_quotes(lead_id,created_at DESC);
CREATE INDEX IF NOT EXISTS lkm_crm_quotes_status_idx ON public.lkm_crm_quotes(status,updated_at DESC);

-- RLS is enabled even for authenticated users. The browser only receives a publishable key.
ALTER TABLE public.lkm_crm_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_crm_quotes FROM PUBLIC, anon;
GRANT SELECT,INSERT,UPDATE ON public.lkm_crm_quotes TO authenticated;
-- Identity sequence is needed for inserts; the table RLS remains the authority.
GRANT USAGE ON SEQUENCE public.lkm_crm_quotes_quote_number_seq TO authenticated;
DROP POLICY IF EXISTS "lkm quotes admin select" ON public.lkm_crm_quotes;
DROP POLICY IF EXISTS "lkm quotes admin insert" ON public.lkm_crm_quotes;
DROP POLICY IF EXISTS "lkm quotes admin update" ON public.lkm_crm_quotes;
CREATE POLICY "lkm quotes admin select" ON public.lkm_crm_quotes FOR SELECT TO authenticated
  USING(public.lkm_is_admin());
CREATE POLICY "lkm quotes admin insert" ON public.lkm_crm_quotes FOR INSERT TO authenticated
  WITH CHECK(public.lkm_is_admin());
CREATE POLICY "lkm quotes admin update" ON public.lkm_crm_quotes FOR UPDATE TO authenticated
  USING(public.lkm_is_admin()) WITH CHECK(public.lkm_is_admin());

CREATE OR REPLACE FUNCTION public.lkm_quote_touch() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
  NEW.updated_at=now();
  NEW.updated_by=auth.uid();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_quote_touch_trigger ON public.lkm_crm_quotes;
CREATE TRIGGER lkm_quote_touch_trigger BEFORE UPDATE ON public.lkm_crm_quotes
  FOR EACH ROW EXECUTE FUNCTION public.lkm_quote_touch();
COMMIT;
