-- LilKangooMedia Phase 22.3 — REAL project case studies.
-- Run ONCE in the existing Supabase project, after CMS Phase1 migration.
-- Non-destructive: does not touch services, Stripe payments, galleries, photos or leads.
-- All newly created case studies start as DRAFTS and are invisible to the public.
BEGIN;
CREATE TABLE IF NOT EXISTS public.lkm_case_studies (
  gallery_id uuid PRIMARY KEY REFERENCES public.portfolio_galleries(id) ON DELETE CASCADE,
  headline text NOT NULL DEFAULT '' CHECK (char_length(headline)<=180),
  objective text NOT NULL DEFAULT '' CHECK (char_length(objective)<=2500),
  approach text NOT NULL DEFAULT '' CHECK (char_length(approach)<=3500),
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(deliverables)='array' AND jsonb_array_length(deliverables)<=18),
  outcomes text NOT NULL DEFAULT '' CHECK (char_length(outcomes)<=2500),
  client_label text NOT NULL DEFAULT '' CHECK (char_length(client_label)<=140),
  project_location text NOT NULL DEFAULT '' CHECK (char_length(project_location)<=120),
  project_year smallint CHECK (project_year IS NULL OR project_year BETWEEN 2000 AND 2100),
  is_published boolean NOT NULL DEFAULT false,
  updated_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lkm_case_study_publish_completeness CHECK (
    NOT is_published OR (
      char_length(btrim(headline))>=8 AND
      char_length(btrim(objective))>=20 AND
      char_length(btrim(approach))>=20
    )
  )
);
CREATE INDEX IF NOT EXISTS lkm_case_studies_public_idx ON public.lkm_case_studies (is_published,updated_at DESC);
ALTER TABLE public.lkm_case_studies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_case_studies FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lkm_case_studies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lkm_case_studies TO authenticated;
DROP POLICY IF EXISTS "lkm cases public published select" ON public.lkm_case_studies;
DROP POLICY IF EXISTS "lkm cases admin all" ON public.lkm_case_studies;
CREATE POLICY "lkm cases public published select" ON public.lkm_case_studies
  FOR SELECT TO anon,authenticated USING (
    is_published AND EXISTS (
      SELECT 1 FROM public.portfolio_galleries g
      WHERE g.id=gallery_id AND g.visibility='public'
    )
  );
CREATE POLICY "lkm cases admin all" ON public.lkm_case_studies
  FOR ALL TO authenticated USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());
CREATE OR REPLACE FUNCTION public.lkm_case_studies_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at=now(); NEW.updated_by=auth.uid(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS lkm_case_studies_update_time ON public.lkm_case_studies;
CREATE TRIGGER lkm_case_studies_update_time BEFORE UPDATE ON public.lkm_case_studies
  FOR EACH ROW EXECUTE FUNCTION public.lkm_case_studies_touch();
COMMIT;
