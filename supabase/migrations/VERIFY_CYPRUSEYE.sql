-- Read-only verification in LilKangooMedia Supabase SQL Editor.
-- Run after Phase 31.1 migration and after choosing related services in Admin.
SELECT g.id, g.slug, g.title, g.visibility, g.cover_image_id,
       g.related_service_slug AS legacy_related_service,
       g.related_service_slugs AS all_related_services,
       s.is_published,
       (SELECT count(*) FROM public.portfolio_images i
          WHERE i.gallery_id=g.id AND i.visibility='public') AS public_photos,
       (SELECT count(*) FROM public.media_videos v
          WHERE v.gallery_id=g.id AND v.visibility='public') AS public_videos
FROM public.portfolio_galleries g
LEFT JOIN public.lkm_case_studies s ON s.gallery_id=g.id
WHERE g.slug='cypruseye-tourism-saas-platform';
