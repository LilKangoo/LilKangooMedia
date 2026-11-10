-- LilKangooMedia | Elea Golf Club | CASE STUDY + CURATED 18-PHOTO UPDATE
-- Prepared for the existing Supabase schema (CMS, YouTube Media, Case Studies).
-- HOW TO USE: Supabase Dashboard > SQL Editor > New query > paste entire file > Run.
-- No previous migrations should be rerun. This SQL does not create or alter tables.
-- Behaviour: update EXISTING Elea gallery/case, keep exactly 2 featured videos and add 18 real photos.
-- CRITICAL: upload ALL included /assets/images/elea-golf-club/*.webp to GitHub first,
-- wait for Netlify production deploy, THEN run this SQL. Otherwise images will 404.
-- Idempotent and additive; it never deletes or unpublishes existing gallery photos.
-- The separately commissioned Mariusz/Agnieszka images are NOT deployed to
-- public assets before permission for public promotional usage is confirmed.
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
    'Event photography and film from the 2026 European Senior Men''s & Ladies'' Championships, followed by a separate aerial and promotional production for Eléa Golf Club in Paphos. LilKangooMedia delivered over 400 photographs across championship and separately commissioned participant assignments, alongside 18 individual hole flyover videos, one complete compilation and two reels.';
  v_objective constant text := $objective$
Eléa Golf Club commissioned LilKangooMedia to document the 2026 European Senior Men’s & Ladies’ Championships with photography covering the event and filming of its opening and closing ceremonies.

Following the championship, the club commissioned additional photography and video production. The broader goal was to create a versatile library of high-quality visual material for the club’s website, social media and ongoing promotion: documenting the event, showcasing the course and supporting communications with golfers and visitors.
$objective$;
  v_approach constant text := $approach$
CHAMPIONSHIP COVERAGE
Our work began with photographic coverage throughout the European Senior Championships, capturing competition, participants, the atmosphere and key moments. We also filmed the opening and closing ceremonies. Across the championship event, follow-up work and separately commissioned participant sessions, LilKangooMedia delivered more than 400 photographs.

PRIVATE COMMISSIONS FOR TWO POLISH COMPETITORS
During the championship, two individual participants, Mariusz and Agnieszka, separately hired LilKangooMedia for dedicated photographic coverage of their rounds. They were competing under Poland's white-and-red national colours. We photographed their play discreetly from a distance, without interfering with the competition. These individual commissions were separate from the work contracted directly by Eléa Golf Club.

FOLLOW-UP PHOTOGRAPHY & AERIAL PRODUCTION
After the event, the club commissioned further work on a separate production date. We returned for additional photography and a comprehensive aerial film project covering all 18 holes of the golf course. The production resulted in 18 individual hole-by-hole flyover videos and one longer film combining the complete course flyover.

SOCIAL MEDIA & AUDIO
We also produced two short-form promotional reels. For the narrated video material, the club initially provided a voice-over recording; we then returned to record the narration on our own equipment for improved audio quality.

The result was a combination of event documentation and reusable course-focused visuals. The two featured films below are a complete 18-hole flyover and a short-form video. The remaining individual flyovers and the second reel are listed as delivered work, not included as featured videos.
$approach$;
  v_deliverables jsonb := jsonb_build_array(
    'More than 400 photographs delivered across event, follow-up and separate participant commissions',
    'Photographic coverage of the 2026 European Senior Men’s & Ladies’ Championships',
    'Separate discreet tournament photography for Mariusz and Agnieszka, two Polish competitors',
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
  v_img record;
  v_image_id uuid;
  v_photo_counter integer := 0;
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

  -- 18 real user-supplied photographs selected out of 409 in Web.zip.
  -- Photo image_url points to static files that MUST be deployed before this SQL.
  -- Existing photos in this gallery are preserved. Any re-run updates only metadata
  -- for the same selected image URLs and does not alter manually changed visibility.
  FOR v_img IN
    SELECT * FROM (VALUES
      ('/assets/images/elea-golf-club/aerial-course-sand-bunkers.webp', 'Aerial view of the landscaped bunkers and fairway at Elea Golf Club', 'Wide drone photograph of the Elea Golf Club course, green fairways and sand bunkers', 100),
      ('/assets/images/elea-golf-club/drone-fairway-bunker.webp', 'Golf course fairway and sculpted sand bunker viewed from a drone', 'Aerial perspective of a green fairway and sculpted bunker at Elea Golf Club', 110),
      ('/assets/images/elea-golf-club/overhead-drone-golf-holes.webp', 'Overhead view of the Elea golf holes and their sculpted bunkers', 'Top-down drone photograph of Elea Golf Club fairways and bunkers', 120),
      ('/assets/images/elea-golf-club/ega-championship-flags.webp', 'European golf championship flags and event display at Elea Golf Club', 'Tournament display and national flags at the 2026 European senior golf championships', 130),
      ('/assets/images/elea-golf-club/competitors-near-water.webp', 'Golf competitors by a water feature during the championship', 'Golfers participating in the championship alongside the course water feature', 140),
      ('/assets/images/elea-golf-club/championship-tee-shot.webp', 'Competitor completes a golf swing on the championship course', 'Athlete playing a golf shot during the European senior championship', 150),
      ('/assets/images/elea-golf-club/championship-putting.webp', 'Focused golfer putting on the championship green', 'Player completing a putt on the green at Elea Golf Club', 160),
      ('/assets/images/elea-golf-club/championship-fairway-view.webp', 'Competitors on a hillside fairway near the Elea clubhouse', 'Wide view of tournament golfers playing below the clubhouse at Elea Golf Club', 170),
      ('/assets/images/elea-golf-club/golfer-focused-putt.webp', 'Competitor concentrating on a putt during the golf championship', 'Close scene of a golfer on the putting green during competition', 180),
      ('/assets/images/elea-golf-club/final-day-golf-equipment.webp', 'Golf bags and competitors gathered during the final competition day', 'Golf bags lined up and golfers meeting before the final day at Elea Golf Club', 190),
      ('/assets/images/elea-golf-club/final-day-players-group.webp', 'Championship attendees gathered near a tournament display', 'Players and attendees photographed during the European senior golf championships', 200),
      ('/assets/images/elea-golf-club/final-day-drive.webp', 'Competitor striking a golf ball above the sweeping fairway', 'Golfer taking a swing on an elevated fairway on the championship final day', 210),
      ('/assets/images/elea-golf-club/final-day-course-water.webp', 'Golfers crossing the green near a course water feature', 'View across a water feature towards golfers on the final championship day', 220),
      ('/assets/images/elea-golf-club/course-sand-bunkers.webp', 'Wide fairway and sculpted sand bunkers in bright sunshine', 'Golf course architecture featuring sand bunkers and green fairway at Elea Golf Club', 230),
      ('/assets/images/elea-golf-club/golf-course-water.webp', 'Landscaped water feature and rolling terrain at Elea Golf Club', 'Scenic photo of water and surrounding terrain at the golf club', 240),
      ('/assets/images/elea-golf-club/golf-course-wide-view.webp', 'Landscape overview of the championship course and fairways', 'Golf course landscape with greens, paths and sand bunkers', 250),
      ('/assets/images/elea-golf-club/golf-action-at-green.webp', 'Competitor crouches to inspect the putting green', 'Golf player assessing the green during the senior golf championship', 260),
      ('/assets/images/elea-golf-club/players-final-day-moment.webp', 'Two golfers sharing a moment during the final day', 'Players meeting during the closing day of the golf championship', 270)
    ) AS i(image_url, alt_text, caption, display_order)
  LOOP
    v_image_id := NULL;
    SELECT p.id INTO v_image_id
    FROM public.portfolio_images p
    WHERE p.gallery_id = v_gallery AND p.image_url = v_img.image_url
    LIMIT 1;
    IF v_image_id IS NULL THEN
      INSERT INTO public.portfolio_images
        (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
      VALUES
        (v_gallery,v_img.image_url,NULL,v_img.alt_text,v_img.caption,v_img.display_order,'public');
    ELSE
      UPDATE public.portfolio_images
      SET alt_text=v_img.alt_text,caption=v_img.caption,display_order=v_img.display_order
      WHERE id=v_image_id;
      -- Important: do not override an admin's later manual visibility change.
    END IF;
    v_photo_counter:=v_photo_counter+1;
  END LOOP;

  -- Preserve a previously chosen cover. When no cover exists, use our best
  -- curated panoramic drone photograph as the gallery / case-study thumbnail.
  UPDATE public.portfolio_galleries g
    SET cover_image_id = (SELECT p.id FROM public.portfolio_images p
      WHERE p.gallery_id=v_gallery
        AND p.image_url='/assets/images/elea-golf-club/aerial-course-sand-bunkers.webp'
      LIMIT 1), updated_at=now()
  WHERE g.id=v_gallery AND g.cover_image_id IS NULL;

  RAISE NOTICE 'Eléa Golf Club updated. Gallery %, case public %, photos selected %, public videos 2.', v_gallery, v_publish, v_photo_counter;
END;
$lkm_elea$;

COMMIT;

-- Verification results from the SAME SQL run. Expected: published=true,
-- video_count=2, photo_count>=18 (assuming empty gallery before import).
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
