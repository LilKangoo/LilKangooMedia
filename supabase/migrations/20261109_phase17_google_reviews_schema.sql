-- LilKangooMedia Phase 17: Google Reviews schema.
-- RUN THIS FIRST. Safe to rerun. Requires the existing lkm_is_admin() function.
-- Google Takeout is the source. No Google Cloud, third-party widget or payment needed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.lkm_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_review_id text UNIQUE,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('google_takeout','google_manual','manual')),
  source_url text NOT NULL DEFAULT '',
  reviewer_name text NOT NULL CHECK(length(btrim(reviewer_name)) BETWEEN 1 AND 180),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body_en text NOT NULL DEFAULT '',
  body_original text NOT NULL DEFAULT '',
  is_google_translation boolean NOT NULL DEFAULT false,
  edited_for_site boolean NOT NULL DEFAULT false,
  reviewed_at timestamptz,
  owner_reply text NOT NULL DEFAULT '',
  visible boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lkm_reviews_google_source CHECK(source <> 'google_takeout' OR google_review_id IS NOT NULL),
  CONSTRAINT lkm_reviews_manual_google_url CHECK(source <> 'google_manual' OR length(btrim(source_url)) > 0)
);
CREATE INDEX IF NOT EXISTS lkm_reviews_public_idx ON public.lkm_reviews(visible,featured,sort_order,reviewed_at DESC);
ALTER TABLE public.lkm_reviews ENABLE ROW LEVEL SECURITY;
-- For repeatable migrations, policies are only created once.
DO $block$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lkm_reviews' AND policyname='lkm public reads visible reviews') THEN
    CREATE POLICY "lkm public reads visible reviews" ON public.lkm_reviews FOR SELECT TO anon USING(visible = true);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lkm_reviews' AND policyname='lkm authenticated reads visible or admin reviews') THEN
    CREATE POLICY "lkm authenticated reads visible or admin reviews" ON public.lkm_reviews FOR SELECT TO authenticated USING(visible = true OR public.lkm_is_admin());
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lkm_reviews' AND policyname='lkm admin creates reviews') THEN
    CREATE POLICY "lkm admin creates reviews" ON public.lkm_reviews FOR INSERT TO authenticated WITH CHECK(public.lkm_is_admin());
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lkm_reviews' AND policyname='lkm admin updates reviews') THEN
    CREATE POLICY "lkm admin updates reviews" ON public.lkm_reviews FOR UPDATE TO authenticated USING(public.lkm_is_admin()) WITH CHECK(public.lkm_is_admin());
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lkm_reviews' AND policyname='lkm admin deletes reviews') THEN
    CREATE POLICY "lkm admin deletes reviews" ON public.lkm_reviews FOR DELETE TO authenticated USING(public.lkm_is_admin());
  END IF;
END
$block$;
CREATE OR REPLACE FUNCTION public.lkm_review_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $f$ BEGIN NEW.updated_at=now(); RETURN NEW; END $f$;
DROP TRIGGER IF EXISTS lkm_reviews_update_timestamp ON public.lkm_reviews;
CREATE TRIGGER lkm_reviews_update_timestamp BEFORE UPDATE ON public.lkm_reviews
FOR EACH ROW EXECUTE FUNCTION public.lkm_review_updated_at();

-- Public grants still respect RLS. Do not grant write access to anon.
GRANT SELECT ON public.lkm_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lkm_reviews TO authenticated;
