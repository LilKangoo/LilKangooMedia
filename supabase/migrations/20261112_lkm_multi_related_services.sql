-- LilKangooMedia Phase 31.1
-- Safe additive migration for linking ONE project to MULTIPLE existing services.
-- Run ONCE in the LilKangooMedia Supabase SQL Editor BEFORE installing the ZIP.
-- No price, booking, user, asset, gallery or case-study records are deleted.
BEGIN;

ALTER TABLE public.portfolio_galleries
  ADD COLUMN IF NOT EXISTS related_service_slugs text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Preserve all already-linked projects, including Eléa Golf Club.
UPDATE public.portfolio_galleries
SET related_service_slugs = array_append(related_service_slugs, related_service_slug)
WHERE related_service_slug IS NOT NULL
  AND NOT (related_service_slug = ANY(related_service_slugs));

CREATE INDEX IF NOT EXISTS portfolio_galleries_related_services_gin
  ON public.portfolio_galleries USING GIN (related_service_slugs);

-- Notify PostgREST about the new column before committing.
NOTIFY pgrst, 'reload schema';
COMMIT;

-- Read-only verification: inspect the CyprusEye project after migration.
SELECT slug, title, visibility, related_service_slug, related_service_slugs
FROM public.portfolio_galleries
WHERE slug = 'cypruseye-tourism-saas-platform';
