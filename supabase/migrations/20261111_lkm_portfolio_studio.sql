-- LilKangooMedia Phase 26 — Portfolio Studio / Command Center
-- Run ONCE in existing Supabase SQL Editor AFTER the previously deployed CMS, video and case-study migrations.
-- ADDITIVE: does not delete photo files, galleries, videos, projects, cases, Stripe or bookings.
-- Roll out this SQL BEFORE uploading the frontend ZIP files.
-- Re-running is safe for initial backfill, but use it only once as instructed.
BEGIN;

-- A public gallery can remain directly accessible while its *card* is hidden from the Portfolio index.
-- Independent story visibility still comes from lkm_case_studies.is_published.
ALTER TABLE public.portfolio_galleries
  ADD COLUMN IF NOT EXISTS show_in_portfolio boolean NOT NULL DEFAULT true;
ALTER TABLE public.portfolio_galleries
  ADD COLUMN IF NOT EXISTS portfolio_kind text NOT NULL DEFAULT 'collection';
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='lkm_portfolio_kind_check' AND conrelid='public.portfolio_galleries'::regclass) THEN
   ALTER TABLE public.portfolio_galleries ADD CONSTRAINT lkm_portfolio_kind_check
     CHECK (portfolio_kind IN ('collection','project'));
 END IF;
END $$;
-- Galleries that already have genuine case-study records are actual projects, not generic collections.
-- This changes classification only; all historical links, media and visibility remain unchanged.
UPDATE public.portfolio_galleries g SET portfolio_kind='project'
 WHERE EXISTS (SELECT 1 FROM public.lkm_case_studies c WHERE c.gallery_id=g.id);

-- Requested concrete anti-duplication for the existing Eléa Golf Club project:
-- its story stays public; only the separate gallery *card* is hidden from the portfolio index.
UPDATE public.portfolio_galleries g
 SET portfolio_kind='project', show_in_portfolio=false
 WHERE g.slug='elea-golf-club'
   AND EXISTS (SELECT 1 FROM public.lkm_case_studies c WHERE c.gallery_id=g.id AND c.is_published=true);

-- One unique canonical record per actual photo URL or YouTube video ID.
-- These are existing PUBLIC/portfolio assets, NOT client private-deliverable storage.
CREATE TABLE IF NOT EXISTS public.lkm_studio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text NOT NULL CHECK (media_type IN ('image','youtube')),
  fingerprint text NOT NULL UNIQUE CHECK (fingerprint ~ '^[a-f0-9]{32}$'),
  image_url text CHECK (image_url IS NULL OR char_length(image_url)<=1700),
  youtube_id text CHECK (youtube_id IS NULL OR youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text NOT NULL DEFAULT '' CHECK (char_length(title)<=180),
  alt_text text NOT NULL DEFAULT '' CHECK (char_length(alt_text)<=220),
  description text NOT NULL DEFAULT '' CHECK (char_length(description)<=1500),
  tags text[] NOT NULL DEFAULT '{}'::text[] CHECK (cardinality(tags)<=30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lkm_studio_asset_source_check CHECK (
    (media_type='image' AND image_url IS NOT NULL AND youtube_id IS NULL)
    OR (media_type='youtube' AND youtube_id IS NOT NULL AND image_url IS NULL)
  )
);

-- Many-to-many placement map. Existing photo/video tables are still the public-facing
-- compatibility projection, maintained through admin-only RPC calls and sync triggers.
CREATE TABLE IF NOT EXISTS public.lkm_studio_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.lkm_studio_assets(id) ON DELETE CASCADE,
  gallery_id uuid REFERENCES public.portfolio_galleries(id) ON DELETE CASCADE,
  service_slug text REFERENCES public.services(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'review' CHECK (visibility IN ('public','review','hidden')),
  display_order integer NOT NULL DEFAULT 100,
  legacy_photo_id uuid REFERENCES public.portfolio_images(id) ON DELETE SET NULL,
  legacy_video_id uuid REFERENCES public.media_videos(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lkm_studio_placement_one_target CHECK ((gallery_id IS NULL) <> (service_slug IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS lkm_studio_one_gallery_place
  ON public.lkm_studio_placements(asset_id,gallery_id) WHERE gallery_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lkm_studio_one_service_place
  ON public.lkm_studio_placements(asset_id,service_slug) WHERE service_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS lkm_studio_places_gallery_lookup ON public.lkm_studio_placements(gallery_id,visibility,display_order);
CREATE INDEX IF NOT EXISTS lkm_studio_places_service_lookup ON public.lkm_studio_placements(service_slug,visibility,display_order);

CREATE TABLE IF NOT EXISTS public.lkm_studio_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL CHECK (char_length(action)<=80),
  asset_id uuid REFERENCES public.lkm_studio_assets(id) ON DELETE SET NULL,
  gallery_id uuid REFERENCES public.portfolio_galleries(id) ON DELETE SET NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lkm_studio_audit_recent_idx ON public.lkm_studio_audit(created_at DESC);

-- Canonical backfill: one asset record per source, with every historical gallery placement preserved.
INSERT INTO public.lkm_studio_assets(media_type,fingerprint,image_url,title,alt_text)
SELECT DISTINCT ON (i.image_url) 'image',md5('image:'||i.image_url),i.image_url,
       left(coalesce(nullif(btrim(i.alt_text),''),'Portfolio photograph'),180),left(coalesce(i.alt_text,''),220)
FROM public.portfolio_images i
WHERE i.image_url IS NOT NULL AND btrim(i.image_url)<>'' AND char_length(i.image_url)<=1700
ORDER BY i.image_url,i.created_at ASC
ON CONFLICT (fingerprint) DO NOTHING;
INSERT INTO public.lkm_studio_assets(media_type,fingerprint,youtube_id,title)
SELECT DISTINCT ON (v.youtube_id) 'youtube',md5('youtube:'||v.youtube_id),v.youtube_id,
       left(coalesce(nullif(btrim(v.title),''),'Portfolio video'),180)
FROM public.media_videos v
WHERE v.youtube_id IS NOT NULL AND v.youtube_id ~ '^[A-Za-z0-9_-]{11}$'
ORDER BY v.youtube_id,v.created_at ASC
ON CONFLICT (fingerprint) DO NOTHING;

INSERT INTO public.lkm_studio_placements(asset_id,gallery_id,visibility,display_order,legacy_photo_id)
SELECT a.id,i.gallery_id,
  CASE WHEN i.visibility='public' THEN 'public' WHEN i.visibility='private' THEN 'hidden' ELSE 'review' END,
  i.display_order,i.id
FROM public.portfolio_images i
JOIN public.lkm_studio_assets a ON a.fingerprint=md5('image:'||i.image_url)
WHERE i.gallery_id IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.lkm_studio_placements(asset_id,gallery_id,service_slug,visibility,display_order,legacy_video_id)
SELECT a.id,v.gallery_id,v.service_slug,v.visibility,v.display_order,v.id
FROM public.media_videos v
JOIN public.lkm_studio_assets a ON a.fingerprint=md5('youtube:'||v.youtube_id)
ON CONFLICT DO NOTHING;

-- Capture historical service-photo placements (gallery_urls is an array of URLs).
INSERT INTO public.lkm_studio_assets(media_type,fingerprint,image_url,title)
SELECT DISTINCT ON (photo.url) 'image',md5('image:'||photo.url),photo.url,'Service photograph'
FROM public.services s
CROSS JOIN LATERAL jsonb_array_elements_text(s.gallery_urls) AS photo(url)
WHERE btrim(photo.url)<>'' AND char_length(photo.url)<=1700
ORDER BY photo.url
ON CONFLICT (fingerprint) DO NOTHING;
INSERT INTO public.lkm_studio_placements(asset_id,service_slug,visibility)
SELECT DISTINCT a.id,s.slug,'public'
FROM public.services s
CROSS JOIN LATERAL jsonb_array_elements_text(s.gallery_urls) AS photo(url)
JOIN public.lkm_studio_assets a ON a.fingerprint=md5('image:'||photo.url)
ON CONFLICT DO NOTHING;

-- Protect private business/media metadata: only confirmed administrator accounts see these tables.
ALTER TABLE public.lkm_studio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lkm_studio_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lkm_studio_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_studio_assets,public.lkm_studio_placements,public.lkm_studio_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.lkm_studio_assets TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.lkm_studio_placements TO authenticated;
GRANT SELECT ON public.lkm_studio_audit TO authenticated;
DROP POLICY IF EXISTS lkm_studio_assets_admin ON public.lkm_studio_assets;
DROP POLICY IF EXISTS lkm_studio_placements_admin ON public.lkm_studio_placements;
DROP POLICY IF EXISTS lkm_studio_audit_admin_read ON public.lkm_studio_audit;
CREATE POLICY lkm_studio_assets_admin ON public.lkm_studio_assets FOR ALL TO authenticated
 USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());
CREATE POLICY lkm_studio_placements_admin ON public.lkm_studio_placements FOR ALL TO authenticated
 USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());
CREATE POLICY lkm_studio_audit_admin_read ON public.lkm_studio_audit FOR SELECT TO authenticated
 USING (public.lkm_is_admin());

-- Admin-only asset ingestion (deduplicated by source fingerprint).
CREATE OR REPLACE FUNCTION public.lkm_studio_register_asset(
 p_media_type text, p_source text, p_title text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE asset_uuid uuid; src text:=btrim(coalesce(p_source,'')); mtype text:=btrim(coalesce(p_media_type,'')); key text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
 IF mtype='image' THEN
   IF char_length(src)>1700 OR src='' OR (src !~ '^https://[^[:space:]<>"'']+$' AND src !~ '^/assets/[A-Za-z0-9%._/-]+$') OR src LIKE '%..%' THEN
     RAISE EXCEPTION 'Invalid image URL (HTTPS or /assets/ only)';
   END IF;
 ELSIF mtype='youtube' THEN
   IF src !~ '^[A-Za-z0-9_-]{11}$' THEN RAISE EXCEPTION 'Invalid YouTube video ID'; END IF;
 ELSE RAISE EXCEPTION 'Unsupported media type'; END IF;
 key:=md5(mtype||':'||src);
 INSERT INTO public.lkm_studio_assets(media_type,fingerprint,image_url,youtube_id,title,alt_text)
 VALUES(mtype,key,CASE WHEN mtype='image' THEN src ELSE NULL END,
        CASE WHEN mtype='youtube' THEN src ELSE NULL END,left(btrim(p_title),180),
        CASE WHEN mtype='image' THEN left(btrim(p_title),220) ELSE '' END)
 ON CONFLICT(fingerprint) DO NOTHING RETURNING id INTO asset_uuid;
 IF asset_uuid IS NULL THEN SELECT id INTO asset_uuid FROM public.lkm_studio_assets WHERE fingerprint=key; END IF;
 RETURN asset_uuid;
END $$;

-- One atomic placement RPC: existing public gallery/service readers continue working unchanged.
CREATE OR REPLACE FUNCTION public.lkm_studio_assign(
 p_asset_id uuid,p_gallery_id uuid DEFAULT NULL,p_service_slug text DEFAULT NULL,
 p_visibility text DEFAULT 'public',p_display_order integer DEFAULT 100
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.lkm_studio_assets%ROWTYPE; v_id uuid; existing_id uuid; assigned_id uuid; legacy_vis text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
 IF (p_gallery_id IS NULL) = (p_service_slug IS NULL) THEN RAISE EXCEPTION 'Choose exactly one gallery or service'; END IF;
 IF p_visibility NOT IN ('public','review','hidden') THEN RAISE EXCEPTION 'Invalid visibility'; END IF;
 -- Serialize concurrent placement writes for the same source/target to avoid duplicate legacy rows.
 PERFORM pg_advisory_xact_lock(hashtext(p_asset_id::text),hashtext(coalesce(p_gallery_id::text,p_service_slug)));
 SELECT * INTO m FROM public.lkm_studio_assets WHERE id=p_asset_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Asset not found'; END IF;
 IF p_gallery_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.portfolio_galleries WHERE id=p_gallery_id) THEN
    RAISE EXCEPTION 'Target gallery not found'; END IF;
 IF p_service_slug IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.services WHERE slug=p_service_slug) THEN
    RAISE EXCEPTION 'Target service not found'; END IF;
 IF p_gallery_id IS NOT NULL AND m.media_type='image' THEN
   SELECT id INTO existing_id FROM public.portfolio_images
    WHERE gallery_id=p_gallery_id AND image_url=m.image_url ORDER BY created_at LIMIT 1 FOR UPDATE;
   legacy_vis:=CASE WHEN p_visibility='hidden' THEN 'private' ELSE p_visibility END;
   IF existing_id IS NULL THEN
     INSERT INTO public.portfolio_images(gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
      VALUES(p_gallery_id,m.image_url,NULL,left(coalesce(nullif(m.alt_text,''),m.title),220),'',p_display_order,legacy_vis)
      RETURNING id INTO existing_id;
   ELSE
     UPDATE public.portfolio_images SET visibility=legacy_vis,display_order=p_display_order WHERE id=existing_id;
   END IF;
 ELSIF p_gallery_id IS NOT NULL AND m.media_type='youtube' THEN
   SELECT id INTO existing_id FROM public.media_videos
    WHERE gallery_id=p_gallery_id AND youtube_id=m.youtube_id LIMIT 1 FOR UPDATE;
   IF existing_id IS NULL THEN
     INSERT INTO public.media_videos(youtube_id,title,description,gallery_id,service_slug,visibility,display_order)
      VALUES(m.youtube_id,coalesce(nullif(m.title,''),'Project film'),m.description,p_gallery_id,NULL,p_visibility,p_display_order)
      RETURNING id INTO existing_id;
   ELSE
     UPDATE public.media_videos SET visibility=p_visibility,display_order=p_display_order WHERE id=existing_id;
   END IF;
 ELSIF p_service_slug IS NOT NULL AND m.media_type='youtube' THEN
   SELECT id INTO existing_id FROM public.media_videos
    WHERE service_slug=p_service_slug AND youtube_id=m.youtube_id LIMIT 1 FOR UPDATE;
   IF existing_id IS NULL THEN
     INSERT INTO public.media_videos(youtube_id,title,description,gallery_id,service_slug,visibility,display_order)
      VALUES(m.youtube_id,coalesce(nullif(m.title,''),'Service film'),m.description,NULL,p_service_slug,p_visibility,p_display_order)
      RETURNING id INTO existing_id;
   ELSE UPDATE public.media_videos SET visibility=p_visibility,display_order=p_display_order WHERE id=existing_id; END IF;
 ELSIF p_service_slug IS NOT NULL AND m.media_type='image' THEN
   IF p_visibility='public' THEN
     UPDATE public.services SET gallery_urls=CASE WHEN gallery_urls ? m.image_url THEN gallery_urls
       ELSE gallery_urls||jsonb_build_array(m.image_url) END WHERE slug=p_service_slug;
   ELSE
     UPDATE public.services SET gallery_urls=gallery_urls - m.image_url WHERE slug=p_service_slug;
   END IF;
 END IF;
 INSERT INTO public.lkm_studio_placements(asset_id,gallery_id,service_slug,visibility,display_order,legacy_photo_id,legacy_video_id)
 VALUES(p_asset_id,p_gallery_id,p_service_slug,p_visibility,p_display_order,
        CASE WHEN m.media_type='image' AND p_gallery_id IS NOT NULL THEN existing_id ELSE NULL END,
        CASE WHEN m.media_type='youtube' THEN existing_id ELSE NULL END)
 ON CONFLICT DO NOTHING RETURNING id INTO assigned_id;
 IF assigned_id IS NULL THEN
  UPDATE public.lkm_studio_placements SET visibility=p_visibility,display_order=p_display_order,
      legacy_photo_id=COALESCE(CASE WHEN m.media_type='image' AND p_gallery_id IS NOT NULL THEN existing_id ELSE NULL END,legacy_photo_id),
      legacy_video_id=COALESCE(CASE WHEN m.media_type='youtube' THEN existing_id ELSE NULL END,legacy_video_id),updated_at=now()
   WHERE asset_id=p_asset_id AND gallery_id IS NOT DISTINCT FROM p_gallery_id
     AND service_slug IS NOT DISTINCT FROM p_service_slug RETURNING id INTO assigned_id;
 END IF;
 INSERT INTO public.lkm_studio_audit(actor_id,action,asset_id,gallery_id,context)
 VALUES(auth.uid(),'media.assignment',p_asset_id,p_gallery_id,
        jsonb_build_object('visibility',p_visibility,'service_slug',p_service_slug,'order',p_display_order));
 RETURN assigned_id;
END $$;

-- Keep the new index synchronized when an administrator edits legacy galleries or videos.
CREATE OR REPLACE FUNCTION public.lkm_studio_photo_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE asset_uuid uuid;
BEGIN
 IF TG_OP='DELETE' THEN
   UPDATE public.lkm_studio_placements SET visibility='hidden',legacy_photo_id=NULL,updated_at=now()
    WHERE legacy_photo_id=OLD.id; RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' AND (OLD.gallery_id IS DISTINCT FROM NEW.gallery_id OR OLD.image_url IS DISTINCT FROM NEW.image_url) THEN
   UPDATE public.lkm_studio_placements SET visibility='hidden',legacy_photo_id=NULL,updated_at=now()
    WHERE legacy_photo_id=OLD.id;
 END IF;
 IF NEW.gallery_id IS NULL OR NEW.image_url IS NULL OR btrim(NEW.image_url)='' OR char_length(NEW.image_url)>1700 THEN RETURN NEW; END IF;
 INSERT INTO public.lkm_studio_assets(media_type,fingerprint,image_url,title,alt_text)
 VALUES('image',md5('image:'||NEW.image_url),NEW.image_url,
        left(coalesce(nullif(btrim(NEW.alt_text),''),'Portfolio photograph'),180),left(coalesce(NEW.alt_text,''),220))
 ON CONFLICT(fingerprint) DO NOTHING;
 SELECT id INTO asset_uuid FROM public.lkm_studio_assets WHERE fingerprint=md5('image:'||NEW.image_url);
 INSERT INTO public.lkm_studio_placements(asset_id,gallery_id,visibility,display_order,legacy_photo_id)
 VALUES(asset_uuid,NEW.gallery_id,CASE WHEN NEW.visibility='private' THEN 'hidden' ELSE NEW.visibility END,NEW.display_order,NEW.id)
 ON CONFLICT DO NOTHING;
 UPDATE public.lkm_studio_placements SET visibility=CASE WHEN NEW.visibility='private' THEN 'hidden' ELSE NEW.visibility END,
   display_order=NEW.display_order,legacy_photo_id=NEW.id,updated_at=now()
 WHERE asset_id=asset_uuid AND gallery_id=NEW.gallery_id;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS lkm_studio_sync_photos ON public.portfolio_images;
CREATE TRIGGER lkm_studio_sync_photos AFTER INSERT OR UPDATE OR DELETE ON public.portfolio_images
 FOR EACH ROW EXECUTE FUNCTION public.lkm_studio_photo_sync();

CREATE OR REPLACE FUNCTION public.lkm_studio_video_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE asset_uuid uuid;
BEGIN
 IF TG_OP='DELETE' THEN
  UPDATE public.lkm_studio_placements SET visibility='hidden',legacy_video_id=NULL,updated_at=now()
   WHERE legacy_video_id=OLD.id; RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' AND (OLD.gallery_id IS DISTINCT FROM NEW.gallery_id OR OLD.service_slug IS DISTINCT FROM NEW.service_slug OR OLD.youtube_id IS DISTINCT FROM NEW.youtube_id) THEN
  UPDATE public.lkm_studio_placements SET visibility='hidden',legacy_video_id=NULL,updated_at=now() WHERE legacy_video_id=OLD.id;
 END IF;
 INSERT INTO public.lkm_studio_assets(media_type,fingerprint,youtube_id,title)
 VALUES('youtube',md5('youtube:'||NEW.youtube_id),NEW.youtube_id,left(NEW.title,180))
 ON CONFLICT(fingerprint) DO NOTHING;
 SELECT id INTO asset_uuid FROM public.lkm_studio_assets WHERE fingerprint=md5('youtube:'||NEW.youtube_id);
 INSERT INTO public.lkm_studio_placements(asset_id,gallery_id,service_slug,visibility,display_order,legacy_video_id)
 VALUES(asset_uuid,NEW.gallery_id,NEW.service_slug,NEW.visibility,NEW.display_order,NEW.id)
 ON CONFLICT DO NOTHING;
 UPDATE public.lkm_studio_placements SET visibility=NEW.visibility,display_order=NEW.display_order,
   legacy_video_id=NEW.id,updated_at=now()
 WHERE asset_id=asset_uuid AND gallery_id IS NOT DISTINCT FROM NEW.gallery_id
   AND service_slug IS NOT DISTINCT FROM NEW.service_slug;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS lkm_studio_sync_videos ON public.media_videos;
CREATE TRIGGER lkm_studio_sync_videos AFTER INSERT OR UPDATE OR DELETE ON public.media_videos
 FOR EACH ROW EXECUTE FUNCTION public.lkm_studio_video_sync();

-- Service gallery_url changes (from the pre-existing service editor) are also captured.
CREATE OR REPLACE FUNCTION public.lkm_studio_service_photo_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item text; asset_uuid uuid;
BEGIN
 FOR item IN SELECT value FROM jsonb_array_elements_text(NEW.gallery_urls) LOOP
  IF item='' OR char_length(item)>1700 THEN CONTINUE; END IF;
  INSERT INTO public.lkm_studio_assets(media_type,fingerprint,image_url,title)
   VALUES('image',md5('image:'||item),item,'Service photograph') ON CONFLICT(fingerprint) DO NOTHING;
  SELECT id INTO asset_uuid FROM public.lkm_studio_assets WHERE fingerprint=md5('image:'||item);
  INSERT INTO public.lkm_studio_placements(asset_id,service_slug,visibility)
   VALUES(asset_uuid,NEW.slug,'public') ON CONFLICT DO NOTHING;
  UPDATE public.lkm_studio_placements SET visibility='public',updated_at=now()
   WHERE asset_id=asset_uuid AND service_slug=NEW.slug;
 END LOOP;
 UPDATE public.lkm_studio_placements p SET visibility='hidden',updated_at=now()
 FROM public.lkm_studio_assets a
 WHERE p.asset_id=a.id AND p.service_slug=NEW.slug AND a.media_type='image'
   AND NOT (NEW.gallery_urls ? a.image_url) AND p.visibility<>'hidden';
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS lkm_studio_sync_service_photos ON public.services;
CREATE TRIGGER lkm_studio_sync_service_photos AFTER INSERT OR UPDATE OF gallery_urls ON public.services
 FOR EACH ROW EXECUTE FUNCTION public.lkm_studio_service_photo_sync();

REVOKE ALL ON FUNCTION public.lkm_studio_register_asset(text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.lkm_studio_assign(uuid,uuid,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_studio_register_asset(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lkm_studio_assign(uuid,uuid,text,text,integer) TO authenticated;

COMMIT;

-- Verification (read-only, run separately after successful migration if needed):
-- SELECT (SELECT count(*) FROM public.lkm_studio_assets) AS unique_assets,
--        (SELECT count(*) FROM public.lkm_studio_placements) AS assignments,
--        (SELECT show_in_portfolio FROM public.portfolio_galleries WHERE slug='elea-golf-club') AS elea_gallery_card;
