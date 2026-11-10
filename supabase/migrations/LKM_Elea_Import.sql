-- LilKangooMedia | Elea Golf Club Case Study | ONE-TIME CONTENT IMPORT
-- Prepared for the existing Supabase schema (CMS, YouTube Media, Case Studies).
-- HOW TO USE: Supabase Dashboard > SQL Editor > New query > paste entire file > Run.
-- No previous migrations should be rerun. This SQL does not create or alter tables.
-- Behaviour: publish the gallery, case study, and ONLY the two supplied videos now.
-- Photos are NOT created here: upload selected real photographs later in CMS.
-- Rerunnable for these records; it never deletes gallery photos or unrelated records.
-- Re-running WILL refresh this Case Study's text and these two video entries.
-- If an existing same-slug gallery is unrelated or contains other PUBLIC videos,
-- abort the transaction instead of modifying it.

BEGIN;

DO $lkm_elea$
DECLARE
  v_gallery uuid;
  v_old_title text;
  v_old_client text;
  v_slug constant text := 'elea-golf-club';
  v_publish constant boolean := true;
  v_headline constant text := 'Eléa Golf Club — Championship Photography, Aerial Film & Social Media Content';
  v_gallery_title constant text := 'Eléa Golf Club — Photography & Film Production';
  v_gallery_description constant text :=
    'Event photography and film from the 2026 European Senior Men''s & Ladies'' Championships, followed by a separate aerial and promotional production for Eléa Golf Club in Paphos. LilKangooMedia delivered over 300 photographs, 18 individual hole flyover videos, one complete flyover compilation and two social media reels.';
  v_objective constant text := $objective$
Eléa Golf Club commissioned LilKangooMedia to document the 2026 European Senior Men’s & Ladies’ Championships with photography covering the event and filming of its opening and closing ceremonies.

Following the championship, the club commissioned additional photography and video production. The broader goal was to create a versatile library of high-quality visual material for the club’s website, social media and ongoing promotion: documenting the event, showcasing the course and supporting communications with golfers and visitors.
$objective$;
  v_approach constant text := $approach$
CHAMPIONSHIP COVERAGE
Our work began with photographic coverage throughout the European Senior Championships, capturing competition, participants, the atmosphere and key moments. We also filmed the opening and closing ceremonies. Over 300 photographs were delivered to Eléa Golf Club as part of the collaboration.

FOLLOW-UP PHOTOGRAPHY & AERIAL PRODUCTION
After the event, the club commissioned further work on a separate production date. We returned for additional photography and a comprehensive aerial film project covering all 18 holes of the golf course. The production resulted in 18 individual hole-by-hole flyover videos and one longer film combining the complete course flyover.

SOCIAL MEDIA & AUDIO
We also produced two short-form promotional reels. For the narrated video material, the club initially provided a voice-over recording; we then returned to record the narration on our own equipment for improved audio quality.

The result was a combination of event documentation and reusable course-focused visuals. The two featured films below are a complete 18-hole flyover and a short-form video. The remaining individual flyovers and the second reel are listed as delivered work, not included as featured videos.
$approach$;
  v_deliverables jsonb := jsonb_build_array(
    'Over 300 photographs delivered across the Eléa Golf Club collaboration',
    'Photographic coverage of the 2026 European Senior Men’s & Ladies’ Championships',
    'Video coverage of the championship opening and closing ceremonies',
    'Additional photography during a separate follow-up commission',
    '18 individual aerial flyover videos — one for each golf hole',
    'One complete 18-hole course flyover film',
    'Two short-form promotional reels for social media',
    'Follow-up voice-over recording using LilKangooMedia audio equipment'
  );
  v_outcomes constant text := $outcomes$
Eléa Golf Club uses photography supplied by LilKangooMedia in its ongoing online communications, including as backgrounds for social media posts. The club has also published video content from the collaboration through its digital channels, including the complete aerial flyover on its YouTube channel.

The delivered library provides the club with event coverage, photographs for ongoing communication, individual hole-by-hole films and short-form promotional content. No numerical reach, booking or sales results have been provided, so no performance claims are made here.
$outcomes$;
  v_service_slug text;
BEGIN
  -- Fail with a clear error if the project does not have the prior database tables.
  IF to_regclass('public.portfolio_galleries') IS NULL
     OR to_regclass('public.media_videos') IS NULL
     OR to_regclass('public.lkm_case_studies') IS NULL THEN
    RAISE EXCEPTION 'Missing existing CMS/YouTube/Case Study tables. Verify that previous migrations were already installed. Do not rerun them blindly.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.services WHERE slug = 'commercial-video-reels') THEN
    v_service_slug := 'commercial-video-reels';
  ELSE
    v_service_slug := NULL;  -- Gallery stays valid even if this service is absent.
  END IF;

  SELECT g.id, g.title, g.client_name
    INTO v_gallery, v_old_title, v_old_client
  FROM public.portfolio_galleries g
  WHERE g.slug = v_slug
  FOR UPDATE;

  IF v_gallery IS NOT NULL THEN
    IF position('elea' in translate(lower(coalesce(v_old_title,'')), 'éèêë', 'eeee')) = 0
       AND position('elea' in translate(lower(coalesce(v_old_client,'')), 'éèêë', 'eeee')) = 0 THEN
      RAISE EXCEPTION 'The slug elea-golf-club belongs to an unrelated gallery (%). Nothing changed.', v_old_title;
    END IF;

    -- User wants exactly two featured public films. Never hide/delete old videos
    -- silently: abort on a conflict with unrelated already-public gallery videos.
    IF EXISTS (
      SELECT 1 FROM public.media_videos m
      WHERE m.gallery_id = v_gallery
        AND m.visibility = 'public'
        AND m.youtube_id NOT IN ('y1CB22Z-Qm4','kU3ACgDkxDo')
    ) THEN
      RAISE EXCEPTION 'This gallery already contains other public videos. Review them before running this two-video import. Nothing changed.';
    END IF;

    UPDATE public.portfolio_galleries SET
      title = v_gallery_title,
      description = v_gallery_description,
      category = 'Sports & Hospitality',
      client_name = 'Eléa Golf Club',
      related_service_slug = coalesce(v_service_slug, related_service_slug),
      visibility = CASE WHEN v_publish THEN 'public' ELSE 'review' END,
      updated_at = now()
    WHERE id = v_gallery;
  ELSE
    INSERT INTO public.portfolio_galleries
      (slug, title, description, category, client_name, related_service_slug, display_order, visibility)
    VALUES
      (v_slug, v_gallery_title, v_gallery_description,
       'Sports & Hospitality', 'Eléa Golf Club', v_service_slug, 100,
       CASE WHEN v_publish THEN 'public' ELSE 'review' END)
    RETURNING id INTO v_gallery;
  END IF;

  -- One case study per gallery, per the existing CMS schema. Re-running updates
  -- ONLY the story associated with this exact gallery ID.
  INSERT INTO public.lkm_case_studies
    (gallery_id, headline, objective, approach, deliverables, outcomes,
     client_label, project_location, project_year, is_published)
  VALUES
    (v_gallery, v_headline, v_objective, v_approach, v_deliverables, v_outcomes,
     'Eléa Golf Club', 'Paphos, Cyprus', 2026, v_publish)
  ON CONFLICT (gallery_id) DO UPDATE SET
    headline = EXCLUDED.headline,
    objective = EXCLUDED.objective,
    approach = EXCLUDED.approach,
    deliverables = EXCLUDED.deliverables,
    outcomes = EXCLUDED.outcomes,
    client_label = EXCLUDED.client_label,
    project_location = EXCLUDED.project_location,
    project_year = EXCLUDED.project_year,
    is_published = EXCLUDED.is_published;

  -- Video 1: club's complete 18-hole aerial flyover (the first featured thumbnail).
  INSERT INTO public.media_videos
    (youtube_id, title, description, gallery_id, service_slug, visibility, display_order)
  VALUES
    ('y1CB22Z-Qm4', 'Eléa Golf Club — Complete 18-Hole Aerial Flyover',
     'Complete golf course flyover filmed by LilKangooMedia and published on the Eléa Golf Club YouTube channel. Original video: https://youtu.be/y1CB22Z-Qm4',
     v_gallery, NULL, CASE WHEN v_publish THEN 'public' ELSE 'review' END, 10)
  ON CONFLICT (gallery_id, youtube_id) WHERE gallery_id IS NOT NULL
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    visibility = EXCLUDED.visibility,
    display_order = EXCLUDED.display_order;

  -- Video 2: supplied short (do not assume which of the two produced reels it is).
  INSERT INTO public.media_videos
    (youtube_id, title, description, gallery_id, service_slug, visibility, display_order)
  VALUES
    ('kU3ACgDkxDo', 'Eléa Golf Club — Short-Form Promotional Video',
     'A short-form film created for Eléa Golf Club by LilKangooMedia. Original YouTube Short: https://youtube.com/shorts/kU3ACgDkxDo',
     v_gallery, NULL, CASE WHEN v_publish THEN 'public' ELSE 'review' END, 20)
  ON CONFLICT (gallery_id, youtube_id) WHERE gallery_id IS NOT NULL
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    visibility = EXCLUDED.visibility,
    display_order = EXCLUDED.display_order;

  RAISE NOTICE 'Eléa Golf Club imported. Gallery ID: %, publicly visible: %. Photos may be added later.', v_gallery, v_publish;
END;
$lkm_elea$;

COMMIT;

-- Verification results from the SAME SQL run. Expected: published=true,
-- video_count=2, photo_count=0 (until the real photo selection is uploaded).
SELECT
  g.slug AS gallery_slug,
  g.visibility AS gallery_visibility,
  c.is_published AS case_study_published,
  c.headline,
  (SELECT count(*) FROM public.media_videos v
   WHERE v.gallery_id = g.id AND v.visibility = 'public') AS public_video_count,
  (SELECT count(*) FROM public.portfolio_images p
   WHERE p.gallery_id = g.id AND p.visibility = 'public') AS public_photo_count,
  'https://lilkangoomedia.com/case-studies.html#/' || g.slug AS case_study_url
FROM public.portfolio_galleries g
JOIN public.lkm_case_studies c ON c.gallery_id = g.id
WHERE g.slug = 'elea-golf-club';
