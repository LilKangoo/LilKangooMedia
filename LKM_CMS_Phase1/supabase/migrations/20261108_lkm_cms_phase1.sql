-- LilKangooMedia CMS phase 1: additive schema; run AFTER 20261108_lkm_site.sql
-- Does not replace or modify existing services, admin_users, orders or public pages.
-- All imported content defaults to DRAFT / REVIEW before public display.
BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  legacy_path text UNIQUE,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  cover_url text,
  cover_alt text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  canonical_url text,
  source_file text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (legacy_path IS NULL OR legacy_path ~ '^/[A-Za-z0-9._%+~-]+\.html$')
);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts(category_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_public_idx ON public.blog_posts(status, published_at DESC);

CREATE TABLE IF NOT EXISTS public.portfolio_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Uncategorized',
  client_name text,
  related_service_slug text REFERENCES public.services(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  cover_image_id uuid,
  display_order integer NOT NULL DEFAULT 100,
  visibility text NOT NULL DEFAULT 'review' CHECK (visibility IN ('review','public','private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES public.portfolio_galleries(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  original_path text,
  alt_text text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 100,
  visibility text NOT NULL DEFAULT 'review' CHECK (visibility IN ('review','public','private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(original_path)
);
CREATE INDEX IF NOT EXISTS portfolio_images_gallery_idx ON public.portfolio_images(gallery_id, display_order);

-- The cover FK is declared after both tables exist.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_gallery_cover_fk') THEN
    ALTER TABLE public.portfolio_galleries
      ADD CONSTRAINT portfolio_gallery_cover_fk FOREIGN KEY (cover_image_id)
      REFERENCES public.portfolio_images(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lkm_categories_public_select ON public.blog_categories;
CREATE POLICY lkm_categories_public_select ON public.blog_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS lkm_categories_admin_all ON public.blog_categories;
CREATE POLICY lkm_categories_admin_all ON public.blog_categories FOR ALL TO authenticated
  USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());

DROP POLICY IF EXISTS lkm_posts_published_select ON public.blog_posts;
CREATE POLICY lkm_posts_published_select ON public.blog_posts FOR SELECT TO anon, authenticated
  USING ((status='published' AND published_at IS NOT NULL AND published_at <= now()) OR public.lkm_is_admin());
DROP POLICY IF EXISTS lkm_posts_admin_all ON public.blog_posts;
CREATE POLICY lkm_posts_admin_all ON public.blog_posts FOR ALL TO authenticated
  USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());

DROP POLICY IF EXISTS lkm_galleries_public_select ON public.portfolio_galleries;
CREATE POLICY lkm_galleries_public_select ON public.portfolio_galleries FOR SELECT TO anon, authenticated
  USING (visibility='public' OR public.lkm_is_admin());
DROP POLICY IF EXISTS lkm_galleries_admin_all ON public.portfolio_galleries;
CREATE POLICY lkm_galleries_admin_all ON public.portfolio_galleries FOR ALL TO authenticated
  USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());

DROP POLICY IF EXISTS lkm_images_public_select ON public.portfolio_images;
CREATE POLICY lkm_images_public_select ON public.portfolio_images FOR SELECT TO anon, authenticated
  USING (public.lkm_is_admin() OR (
    visibility='public' AND EXISTS (
      SELECT 1 FROM public.portfolio_galleries g
      WHERE g.id=gallery_id AND g.visibility='public'
    )
  ));
DROP POLICY IF EXISTS lkm_images_admin_all ON public.portfolio_images;
CREATE POLICY lkm_images_admin_all ON public.portfolio_images FOR ALL TO authenticated
  USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());

CREATE OR REPLACE FUNCTION public.lkm_cms_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS lkm_blog_updated_at ON public.blog_posts;
CREATE TRIGGER lkm_blog_updated_at BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.lkm_cms_updated_at();
DROP TRIGGER IF EXISTS lkm_gallery_updated_at ON public.portfolio_galleries;
CREATE TRIGGER lkm_gallery_updated_at BEFORE UPDATE ON public.portfolio_galleries
FOR EACH ROW EXECUTE FUNCTION public.lkm_cms_updated_at();

INSERT INTO public.blog_categories (slug,name,sort_order) VALUES
('photo-education','Photo Education',10),('cyprus-travel','Articles about Cyprus',20)
ON CONFLICT (slug) DO NOTHING;
COMMIT;
