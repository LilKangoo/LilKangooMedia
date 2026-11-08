-- LilKangooMedia Phase 6: additive Media Library support.
-- Apply ONCE to the existing LilKangooMedia Supabase project BEFORE deploying the frontend.
-- Does not delete services, photos, galleries, articles or files.
BEGIN;

ALTER TABLE public.portfolio_images
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS image_width integer,
  ADD COLUMN IF NOT EXISTS image_height integer,
  ADD COLUMN IF NOT EXISTS storage_path text;

ALTER TABLE public.portfolio_images
  DROP CONSTRAINT IF EXISTS portfolio_file_size_valid;
ALTER TABLE public.portfolio_images
  ADD CONSTRAINT portfolio_file_size_valid
  CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);
ALTER TABLE public.portfolio_images
  DROP CONSTRAINT IF EXISTS portfolio_dimensions_valid;
ALTER TABLE public.portfolio_images
  ADD CONSTRAINT portfolio_dimensions_valid
  CHECK ((image_width IS NULL OR image_width > 0) AND (image_height IS NULL OR image_height > 0));

CREATE UNIQUE INDEX IF NOT EXISTS lkm_portfolio_storage_unique
ON public.portfolio_images(storage_path)
WHERE storage_path IS NOT NULL;

-- A reversible hide list for public GitHub originals and Supabase uploads.
-- 'Remove' does NOT delete the source file: old page references stay intact.
CREATE TABLE IF NOT EXISTS public.lkm_media_hidden (
  source_key text PRIMARY KEY NOT NULL,
  hidden_at timestamptz NOT NULL DEFAULT now(),
  hidden_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (length(source_key) BETWEEN 1 AND 1200)
);
ALTER TABLE public.lkm_media_hidden ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lkm_media_hidden_admin_select ON public.lkm_media_hidden;
CREATE POLICY lkm_media_hidden_admin_select ON public.lkm_media_hidden
  FOR SELECT TO authenticated USING (public.lkm_is_admin());
DROP POLICY IF EXISTS lkm_media_hidden_admin_insert ON public.lkm_media_hidden;
CREATE POLICY lkm_media_hidden_admin_insert ON public.lkm_media_hidden
  FOR INSERT TO authenticated WITH CHECK (public.lkm_is_admin());
DROP POLICY IF EXISTS lkm_media_hidden_admin_update ON public.lkm_media_hidden;
CREATE POLICY lkm_media_hidden_admin_update ON public.lkm_media_hidden
  FOR UPDATE TO authenticated USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());
DROP POLICY IF EXISTS lkm_media_hidden_admin_delete ON public.lkm_media_hidden;
CREATE POLICY lkm_media_hidden_admin_delete ON public.lkm_media_hidden
  FOR DELETE TO authenticated USING (public.lkm_is_admin());

GRANT SELECT,INSERT,UPDATE,DELETE ON public.lkm_media_hidden TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.portfolio_images TO authenticated;

-- Keep the existing storage INSERT and SELECT policies. Do not enable public writes.
-- Uploads require an authenticated administrator under the current portfolio storage policy.
COMMIT;
