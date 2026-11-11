-- LKM Phase 26.3: remove a SINGLE media placement without deleting the master asset.
-- NEW migration only. Run after 20261111_lkm_portfolio_studio.sql. No old SQL reruns.
-- Keeps original image files, uploaded image catalog records, other gallery and service placements.
-- If an image is the active gallery cover, require replacement before detaching it.
BEGIN;

CREATE OR REPLACE FUNCTION public.lkm_studio_unassign(p_placement_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  place public.lkm_studio_placements%ROWTYPE;
  asset public.lkm_studio_assets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  IF p_placement_id IS NULL THEN
    RAISE EXCEPTION 'Placement ID is required' USING ERRCODE = '22023';
  END IF;

  -- Read the target without a row lock, acquire the same advisory lock as assign,
  -- then lock/recheck the row. This order avoids lock-order deadlocks.
  SELECT * INTO place FROM public.lkm_studio_placements
   WHERE id = p_placement_id;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(
    hashtext(place.asset_id::text),
    hashtext(coalesce(place.gallery_id::text, place.service_slug))
  );
  SELECT * INTO place FROM public.lkm_studio_placements
    WHERE id = p_placement_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO asset FROM public.lkm_studio_assets
    WHERE id = place.asset_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source asset no longer exists';
  END IF;

  IF asset.media_type = 'image' AND place.gallery_id IS NOT NULL THEN
    -- Do not silently break published covers. The user must select another cover first.
    IF EXISTS (
      SELECT 1
      FROM public.portfolio_galleries g
      JOIN public.portfolio_images i ON i.id = g.cover_image_id
      WHERE g.id = place.gallery_id AND i.gallery_id = place.gallery_id
        AND i.image_url = asset.image_url
    ) THEN
      RAISE EXCEPTION 'This photograph is the gallery cover. Set another cover photo first.'
        USING ERRCODE = '23514';
    END IF;
    -- Unlink the photo from this gallery; retain the image row and underlying file.
    -- Photo sync trigger hides the old placement until this function removes it below.
    UPDATE public.portfolio_images
      SET gallery_id = NULL, visibility = 'review'
      WHERE gallery_id = place.gallery_id AND image_url = asset.image_url;

  ELSIF asset.media_type = 'youtube' AND place.gallery_id IS NOT NULL THEN
    -- media_videos is the legacy per-destination projection, NOT the YouTube source.
    DELETE FROM public.media_videos
      WHERE gallery_id = place.gallery_id AND youtube_id = asset.youtube_id;

  ELSIF asset.media_type = 'youtube' AND place.service_slug IS NOT NULL THEN
    DELETE FROM public.media_videos
      WHERE service_slug = place.service_slug AND youtube_id = asset.youtube_id;

  ELSIF asset.media_type = 'image' AND place.service_slug IS NOT NULL THEN
    -- A service cover is an independent reference. Never claim it vanished
    -- from a service when it is still the cover: require another cover first.
    IF EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.slug = place.service_slug AND s.cover_url = asset.image_url
    ) THEN
      RAISE EXCEPTION 'This photograph is the service cover. Choose a different service cover first.'
        USING ERRCODE = '23514';
    END IF;
    -- Remove this exact URL from the selected service, not from any other service.
    UPDATE public.services
      SET gallery_urls = coalesce(gallery_urls, '[]'::jsonb) - asset.image_url
      WHERE slug = place.service_slug;
  END IF;

  DELETE FROM public.lkm_studio_placements WHERE id = p_placement_id;

  INSERT INTO public.lkm_studio_audit(actor_id, action, asset_id, gallery_id, context)
  VALUES (
    auth.uid(), 'media.unassign', place.asset_id, place.gallery_id,
    jsonb_build_object('placement_id', place.id, 'service_slug', place.service_slug,
                       'media_type', asset.media_type, 'previous_visibility', place.visibility)
  );
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.lkm_studio_unassign(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lkm_studio_unassign(uuid) TO authenticated;

COMMIT;
