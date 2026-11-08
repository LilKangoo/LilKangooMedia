-- LilKangooMedia: restore genuine legacy gallery groupings.
-- Run AFTER Phase 1 CMS migration; additive, idempotent, does NOT delete old HTML/images.
-- Important: allows one original photo to be referenced in multiple galleries without copying it.
BEGIN;
ALTER TABLE public.portfolio_images DROP CONSTRAINT IF EXISTS portfolio_images_original_path_key;
CREATE UNIQUE INDEX IF NOT EXISTS lkm_portfolio_img_gallery_path_unique
    ON public.portfolio_images(gallery_id, original_path);

-- ORIGINAL: /Portraits.html | 52 photographs | public
INSERT INTO public.portfolio_galleries
    (slug,title,description,category,client_name,related_service_slug,display_order,visibility)
VALUES ('legacy-portraits', 'Portraits', 'Restored from the original LilKangooMedia gallery /Portraits.html. Historical image grouping and order preserved.', 'Portraits', NULL, 'portrait-photography', '100', 'public')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/1-9-3603x4804.jpg', 'assets/images/1-9-3603x4804.jpg', 'Portraits — photograph 1', '', 10, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/1-9-3603x4804.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/1-9-3603x4804.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/1-10-3899x4874.jpg', 'assets/images/1-10-3899x4874.jpg', 'Portraits — photograph 2', '', 20, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/1-10-3899x4874.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/1-10-3899x4874.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/1-12-3858x4822.jpg', 'assets/images/1-12-3858x4822.jpg', 'Portraits — photograph 3', '', 30, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/1-12-3858x4822.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/1-12-3858x4822.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-14.jpg', 'assets/images/portrait-14.jpg', 'Portraits — photograph 4', '', 40, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-14.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-14.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dani-1.jpg', 'assets/images/dani-1.jpg', 'Portraits — photograph 5', '', 50, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dani-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dani-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/kd-42.jpg', 'assets/images/kd-42.jpg', 'Portraits — photograph 6', '', 60, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/kd-42.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/kd-42.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/ewelina-wisniewska-88-1638x2048.jpg', 'assets/images/ewelina-wisniewska-88-1638x2048.jpg', 'Portraits — photograph 7', '', 70, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/ewelina-wisniewska-88-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/ewelina-wisniewska-88-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/ewelina-wisniewska-56-1638x2048.jpg', 'assets/images/ewelina-wisniewska-56-1638x2048.jpg', 'Portraits — photograph 8', '', 80, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/ewelina-wisniewska-56-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/ewelina-wisniewska-56-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/ewelina-wisniewska-26-1638x2048.jpg', 'assets/images/ewelina-wisniewska-26-1638x2048.jpg', 'Portraits — photograph 9', '', 90, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/ewelina-wisniewska-26-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/ewelina-wisniewska-26-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/wedding-6.jpg', 'assets/images/wedding-6.jpg', 'Portraits — photograph 10', '', 100, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/wedding-6.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/wedding-6.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/wedding-5.jpg', 'assets/images/wedding-5.jpg', 'Portraits — photograph 11', '', 110, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/wedding-5.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/wedding-5.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/wedding-3.jpg', 'assets/images/wedding-3.jpg', 'Portraits — photograph 12', '', 120, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/wedding-3.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/wedding-3.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/photoshoot-napa-11.jpg', 'assets/images/photoshoot-napa-11.jpg', 'Portraits — photograph 13', '', 130, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/photoshoot-napa-11.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/photoshoot-napa-11.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/photoshoot-napa-15.jpg', 'assets/images/photoshoot-napa-15.jpg', 'Portraits — photograph 14', '', 140, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/photoshoot-napa-15.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/photoshoot-napa-15.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/photoshoot-napa-35.jpg', 'assets/images/photoshoot-napa-35.jpg', 'Portraits — photograph 15', '', 150, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/photoshoot-napa-35.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/photoshoot-napa-35.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/woodstock-2-2048x1638.jpg', 'assets/images/woodstock-2-2048x1638.jpg', 'Portraits — photograph 16', '', 160, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/woodstock-2-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/woodstock-2-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/woodstock-1-2048x1363.jpg', 'assets/images/woodstock-1-2048x1363.jpg', 'Portraits — photograph 17', '', 170, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/woodstock-1-2048x1363.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/woodstock-1-2048x1363.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/woodstock-3-2048x1363.jpg', 'assets/images/woodstock-3-2048x1363.jpg', 'Portraits — photograph 18', '', 180, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/woodstock-3-2048x1363.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/woodstock-3-2048x1363.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/woodstock-7-2048x1363.jpg', 'assets/images/woodstock-7-2048x1363.jpg', 'Portraits — photograph 19', '', 190, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/woodstock-7-2048x1363.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/woodstock-7-2048x1363.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/woodstock-5-2048x1688.jpg', 'assets/images/woodstock-5-2048x1688.jpg', 'Portraits — photograph 20', '', 200, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/woodstock-5-2048x1688.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/woodstock-5-2048x1688.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/woodstock-8-2048x1237.jpg', 'assets/images/woodstock-8-2048x1237.jpg', 'Portraits — photograph 21', '', 210, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/woodstock-8-2048x1237.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/woodstock-8-2048x1237.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/from-within-3802x3802.jpg', 'assets/images/from-within-3802x3802.jpg', 'Portraits — photograph 22', '', 220, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/from-within-3802x3802.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/from-within-3802x3802.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dark-3-3215x4019.jpg', 'assets/images/dark-3-3215x4019.jpg', 'Portraits — photograph 23', '', 230, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dark-3-3215x4019.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dark-3-3215x4019.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-6.jpg', 'assets/images/portrait-6.jpg', 'Portraits — photograph 24', '', 240, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-6.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-6.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-1.jpg', 'assets/images/portrait-1.jpg', 'Portraits — photograph 25', '', 250, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-2.jpg', 'assets/images/portrait-2.jpg', 'Portraits — photograph 26', '', 260, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/kd-10.jpg', 'assets/images/kd-10.jpg', 'Portraits — photograph 27', '', 270, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/kd-10.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/kd-10.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/kd-7.jpg', 'assets/images/kd-7.jpg', 'Portraits — photograph 28', '', 280, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/kd-7.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/kd-7.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/wedding-2.jpg', 'assets/images/wedding-2.jpg', 'Portraits — photograph 29', '', 290, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/wedding-2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/wedding-2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-15.jpg', 'assets/images/portrait-15.jpg', 'Portraits — photograph 30', '', 300, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-15.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-15.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-3.jpg', 'assets/images/portrait-3.jpg', 'Portraits — photograph 31', '', 310, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-3.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-3.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dani-2.jpg', 'assets/images/dani-2.jpg', 'Portraits — photograph 32', '', 320, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dani-2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dani-2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-4.jpg', 'assets/images/portrait-4.jpg', 'Portraits — photograph 33', '', 330, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-4.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-4.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-8.jpg', 'assets/images/portrait-8.jpg', 'Portraits — photograph 34', '', 340, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-8.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-8.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-7.jpg', 'assets/images/portrait-7.jpg', 'Portraits — photograph 35', '', 350, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-7.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-7.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-5.jpg', 'assets/images/portrait-5.jpg', 'Portraits — photograph 36', '', 360, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-5.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-5.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-9.jpg', 'assets/images/portrait-9.jpg', 'Portraits — photograph 37', '', 370, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-9.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-9.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-10.jpg', 'assets/images/portrait-10.jpg', 'Portraits — photograph 38', '', 380, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-10.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-10.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-11.jpg', 'assets/images/portrait-11.jpg', 'Portraits — photograph 39', '', 390, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-11.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-11.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-12.jpg', 'assets/images/portrait-12.jpg', 'Portraits — photograph 40', '', 400, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-12.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-12.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-13.jpg', 'assets/images/portrait-13.jpg', 'Portraits — photograph 41', '', 410, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-13.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-13.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-16.jpg', 'assets/images/portrait-16.jpg', 'Portraits — photograph 42', '', 420, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-16.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-16.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-17.jpg', 'assets/images/portrait-17.jpg', 'Portraits — photograph 43', '', 430, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-17.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-17.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/portrait-18.jpg', 'assets/images/portrait-18.jpg', 'Portraits — photograph 44', '', 440, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/portrait-18.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/portrait-18.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/car-6.jpg', 'assets/images/car-6.jpg', 'Portraits — photograph 45', '', 450, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/car-6.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/car-6.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/rose2-1-of-4.jpg', 'assets/images/rose2-1-of-4.jpg', 'Portraits — photograph 46', '', 460, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/rose2-1-of-4.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/rose2-1-of-4.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/kite-3.jpg', 'assets/images/kite-3.jpg', 'Portraits — photograph 47', '', 470, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/kite-3.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/kite-3.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/1.jpg', 'assets/images/1.jpg', 'Portraits — photograph 48', '', 480, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dsc06240.jpg', 'assets/images/dsc06240.jpg', 'Portraits — photograph 49', '', 490, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dsc06240.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dsc06240.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/katvideoclip-3.jpg', 'assets/images/katvideoclip-3.jpg', 'Portraits — photograph 50', '', 500, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/katvideoclip-3.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/katvideoclip-3.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/katvideoclip.jpg', 'assets/images/katvideoclip.jpg', 'Portraits — photograph 51', '', 510, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/katvideoclip.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/katvideoclip.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/wnuk.jpg', 'assets/images/wnuk.jpg', 'Portraits — photograph 52', '', 520, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/wnuk.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/wnuk.jpg'))
ON CONFLICT DO NOTHING;

-- ORIGINAL: /Nature.html | 28 photographs | public
INSERT INTO public.portfolio_galleries
    (slug,title,description,category,client_name,related_service_slug,display_order,visibility)
VALUES ('legacy-nature', 'Nature Photography', 'Restored from the original LilKangooMedia gallery /Nature.html. Historical image grouping and order preserved.', 'Nature', NULL, NULL, '100', 'public')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jump20dear20jump-1000x1000.jpg', 'assets/images/jump20dear20jump-1000x1000.jpg', 'Nature Photography — photograph 1', '', 10, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jump20dear20jump-1000x1000.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jump20dear20jump-1000x1000.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dear-boys-995x995.jpg', 'assets/images/dear-boys-995x995.jpg', 'Nature Photography — photograph 2', '', 20, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dear-boys-995x995.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dear-boys-995x995.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dear-bucket-shot-808x808.jpg', 'assets/images/dear-bucket-shot-808x808.jpg', 'Nature Photography — photograph 3', '', 30, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dear-bucket-shot-808x808.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dear-bucket-shot-808x808.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/flamingo-4-2048x1171.jpg', 'assets/images/flamingo-4-2048x1171.jpg', 'Nature Photography — photograph 4', '', 40, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/flamingo-4-2048x1171.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/flamingo-4-2048x1171.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/flamingo-3-2048x1299.jpg', 'assets/images/flamingo-3-2048x1299.jpg', 'Nature Photography — photograph 5', '', 50, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/flamingo-3-2048x1299.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/flamingo-3-2048x1299.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/flamingo-1-2048x976.jpg', 'assets/images/flamingo-1-2048x976.jpg', 'Nature Photography — photograph 6', '', 60, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/flamingo-1-2048x976.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/flamingo-1-2048x976.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/flamingo-2-1463x2048.jpg', 'assets/images/flamingo-2-1463x2048.jpg', 'Nature Photography — photograph 7', '', 70, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/flamingo-2-1463x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/flamingo-2-1463x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-1-1638x2048.jpg', 'assets/images/scotland-1-1638x2048.jpg', 'Nature Photography — photograph 8', '', 80, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-1-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-1-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-2-1639x2048.jpg', 'assets/images/scotland-2-1639x2048.jpg', 'Nature Photography — photograph 9', '', 90, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-2-1639x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-2-1639x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-3-1638x2048.jpg', 'assets/images/scotland-3-1638x2048.jpg', 'Nature Photography — photograph 10', '', 100, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-3-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-3-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-4-2048x1638.jpg', 'assets/images/scotland-4-2048x1638.jpg', 'Nature Photography — photograph 11', '', 110, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-4-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-4-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-5-2048x1638.jpg', 'assets/images/scotland-5-2048x1638.jpg', 'Nature Photography — photograph 12', '', 120, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-5-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-5-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-6-2048x1390.jpg', 'assets/images/scotland-6-2048x1390.jpg', 'Nature Photography — photograph 13', '', 130, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-6-2048x1390.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-6-2048x1390.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-7-1638x2048.jpg', 'assets/images/scotland-7-1638x2048.jpg', 'Nature Photography — photograph 14', '', 140, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-7-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-7-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-8-2048x1638.jpg', 'assets/images/scotland-8-2048x1638.jpg', 'Nature Photography — photograph 15', '', 150, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-8-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-8-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-9-1638x2048.jpg', 'assets/images/scotland-9-1638x2048.jpg', 'Nature Photography — photograph 16', '', 160, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-9-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-9-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-10-1638x2048.jpg', 'assets/images/scotland-10-1638x2048.jpg', 'Nature Photography — photograph 17', '', 170, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-10-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-10-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-11-2048x1365.jpg', 'assets/images/scotland-11-2048x1365.jpg', 'Nature Photography — photograph 18', '', 180, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-11-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-11-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-12-1152x2048.jpg', 'assets/images/scotland-12-1152x2048.jpg', 'Nature Photography — photograph 19', '', 190, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-12-1152x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-12-1152x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-13-2048x1341.jpg', 'assets/images/scotland-13-2048x1341.jpg', 'Nature Photography — photograph 20', '', 200, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-13-2048x1341.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-13-2048x1341.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-14-1639x2048.jpg', 'assets/images/scotland-14-1639x2048.jpg', 'Nature Photography — photograph 21', '', 210, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-14-1639x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-14-1639x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/scotland-15-1638x2048.jpg', 'assets/images/scotland-15-1638x2048.jpg', 'Nature Photography — photograph 22', '', 220, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/scotland-15-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/scotland-15-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dsc01657.jpg', 'assets/images/dsc01657.jpg', 'Nature Photography — photograph 23', '', 230, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dsc01657.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dsc01657.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/ptaszek.jpeg', 'assets/images/ptaszek.jpeg', 'Nature Photography — photograph 24', '', 240, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/ptaszek.jpeg' OR i.image_url='https://lilkangoomedia.com/assets/images/ptaszek.jpeg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/anglia-3-of-13.jpg', 'assets/images/anglia-3-of-13.jpg', 'Nature Photography — photograph 25', '', 250, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/anglia-3-of-13.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/anglia-3-of-13.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/anglia-8-of-10.jpg', 'assets/images/anglia-8-of-10.jpg', 'Nature Photography — photograph 26', '', 260, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/anglia-8-of-10.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/anglia-8-of-10.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/reflection.jpg', 'assets/images/reflection.jpg', 'Nature Photography — photograph 27', '', 270, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/reflection.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/reflection.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dsc02857.jpg', 'assets/images/dsc02857.jpg', 'Nature Photography — photograph 28', '', 280, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dsc02857.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/dsc02857.jpg'))
ON CONFLICT DO NOTHING;

-- ORIGINAL: /Products.html | 34 photographs | public
INSERT INTO public.portfolio_galleries
    (slug,title,description,category,client_name,related_service_slug,display_order,visibility)
VALUES ('legacy-products', 'Products & Jewellery Photography', 'Restored from the original LilKangooMedia gallery /Products.html. Historical image grouping and order preserved.', 'Products', NULL, 'product-brand-photography', '100', 'public')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/orofino-4.jpg', 'assets/images/orofino-4.jpg', 'Products & Jewellery Photography — photograph 1', '', 10, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/orofino-4.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/orofino-4.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/orofino-1.jpg', 'assets/images/orofino-1.jpg', 'Products & Jewellery Photography — photograph 2', '', 20, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/orofino-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/orofino-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/zegarek-7.jpg', 'assets/images/zegarek-7.jpg', 'Products & Jewellery Photography — photograph 3', '', 30, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/zegarek-7.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/zegarek-7.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-27.jpg', 'assets/images/jewel-27.jpg', 'Products & Jewellery Photography — photograph 4', '', 40, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-27.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-27.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-1.jpg', 'assets/images/jewel-1.jpg', 'Products & Jewellery Photography — photograph 5', '', 50, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-3.jpg', 'assets/images/jewel-3.jpg', 'Products & Jewellery Photography — photograph 6', '', 60, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-3.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-3.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-14.jpg', 'assets/images/jewel-14.jpg', 'Products & Jewellery Photography — photograph 7', '', 70, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-14.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-14.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-17.jpg', 'assets/images/jewel-17.jpg', 'Products & Jewellery Photography — photograph 8', '', 80, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-17.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-17.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-16.jpg', 'assets/images/jewel-16.jpg', 'Products & Jewellery Photography — photograph 9', '', 90, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-16.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-16.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-10.jpg', 'assets/images/jewel-10.jpg', 'Products & Jewellery Photography — photograph 10', '', 100, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-10.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-10.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-8.jpg', 'assets/images/jewel-8.jpg', 'Products & Jewellery Photography — photograph 11', '', 110, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-8.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-8.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-9.jpg', 'assets/images/jewel-9.jpg', 'Products & Jewellery Photography — photograph 12', '', 120, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-9.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-9.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-24.jpg', 'assets/images/jewel-24.jpg', 'Products & Jewellery Photography — photograph 13', '', 130, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-24.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-24.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-23.jpg', 'assets/images/jewel-23.jpg', 'Products & Jewellery Photography — photograph 14', '', 140, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-23.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-23.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewel-30.jpg', 'assets/images/jewel-30.jpg', 'Products & Jewellery Photography — photograph 15', '', 150, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewel-30.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewel-30.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/orofino-3.jpg', 'assets/images/orofino-3.jpg', 'Products & Jewellery Photography — photograph 16', '', 160, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/orofino-3.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/orofino-3.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/eggring.jpg', 'assets/images/eggring.jpg', 'Products & Jewellery Photography — photograph 17', '', 170, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/eggring.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/eggring.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-9.jpg', 'assets/images/jewl-9.jpg', 'Products & Jewellery Photography — photograph 18', '', 180, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-9.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-9.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/bez-nazwy-103x.jpg', 'assets/images/bez-nazwy-103x.jpg', 'Products & Jewellery Photography — photograph 19', '', 190, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/bez-nazwy-103x.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/bez-nazwy-103x.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-8.jpg', 'assets/images/jewl-8.jpg', 'Products & Jewellery Photography — photograph 20', '', 200, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-8.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-8.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-1.jpg', 'assets/images/jewl-1.jpg', 'Products & Jewellery Photography — photograph 21', '', 210, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-6.jpg', 'assets/images/jewl-6.jpg', 'Products & Jewellery Photography — photograph 22', '', 220, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-6.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-6.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/orofino-2.jpg', 'assets/images/orofino-2.jpg', 'Products & Jewellery Photography — photograph 23', '', 230, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/orofino-2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/orofino-2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/zegarek.jpg', 'assets/images/zegarek.jpg', 'Products & Jewellery Photography — photograph 24', '', 240, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/zegarek.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/zegarek.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/zegarek-8.jpg', 'assets/images/zegarek-8.jpg', 'Products & Jewellery Photography — photograph 25', '', 250, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/zegarek-8.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/zegarek-8.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-7.jpg', 'assets/images/jewl-7.jpg', 'Products & Jewellery Photography — photograph 26', '', 260, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-7.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-7.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-11.jpg', 'assets/images/jewl-11.jpg', 'Products & Jewellery Photography — photograph 27', '', 270, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-11.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-11.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/neck-19.jpg', 'assets/images/neck-19.jpg', 'Products & Jewellery Photography — photograph 28', '', 280, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/neck-19.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/neck-19.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/perre-61.jpeg', 'assets/images/perre-61.jpeg', 'Products & Jewellery Photography — photograph 29', '', 290, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/perre-61.jpeg' OR i.image_url='https://lilkangoomedia.com/assets/images/perre-61.jpeg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/perre-81.jpeg', 'assets/images/perre-81.jpeg', 'Products & Jewellery Photography — photograph 30', '', 300, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/perre-81.jpeg' OR i.image_url='https://lilkangoomedia.com/assets/images/perre-81.jpeg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-10.jpg', 'assets/images/jewl-10.jpg', 'Products & Jewellery Photography — photograph 31', '', 310, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-10.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-10.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/shop-46.jpg', 'assets/images/shop-46.jpg', 'Products & Jewellery Photography — photograph 32', '', 320, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/shop-46.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/shop-46.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/shop-44.jpeg', 'assets/images/shop-44.jpeg', 'Products & Jewellery Photography — photograph 33', '', 330, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/shop-44.jpeg' OR i.image_url='https://lilkangoomedia.com/assets/images/shop-44.jpeg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/dani.jpeg', 'assets/images/dani.jpeg', 'Products & Jewellery Photography — photograph 34', '', 340, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/dani.jpeg' OR i.image_url='https://lilkangoomedia.com/assets/images/dani.jpeg'))
ON CONFLICT DO NOTHING;

-- ORIGINAL: /GraphicDesign.html | 22 photographs | public
INSERT INTO public.portfolio_galleries
    (slug,title,description,category,client_name,related_service_slug,display_order,visibility)
VALUES ('legacy-graphic-design', 'Graphic Design', 'Restored from the original LilKangooMedia gallery /GraphicDesign.html. Historical image grouping and order preserved.', 'Graphic Design', NULL, 'graphic-design', '100', 'public')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/jewl-16.jpg', 'assets/images/jewl-16.jpg', 'Graphic Design — photograph 1', '', 10, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/jewl-16.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/jewl-16.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/mad.tango.cd.jpg', 'assets/images/mad.tango.cd.jpg', 'Graphic Design — photograph 2', '', 20, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/mad.tango.cd.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/mad.tango.cd.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/michael.cd1.jpg', 'assets/images/michael.cd1.jpg', 'Graphic Design — photograph 3', '', 30, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/michael.cd1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/michael.cd1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/michael.cd2.jpg', 'assets/images/michael.cd2.jpg', 'Graphic Design — photograph 4', '', 40, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/michael.cd2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/michael.cd2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/front-cover-higher-uality.jpg', 'assets/images/front-cover-higher-uality.jpg', 'Graphic Design — photograph 5', '', 50, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/front-cover-higher-uality.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/front-cover-higher-uality.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/fury.animal2.jpg', 'assets/images/fury.animal2.jpg', 'Graphic Design — photograph 6', '', 60, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/fury.animal2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/fury.animal2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/logo.final.b-1.png', 'assets/images/logo.final.b-1.png', 'Graphic Design — photograph 7', '', 70, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/logo.final.b-1.png' OR i.image_url='https://lilkangoomedia.com/assets/images/logo.final.b-1.png'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/iself-icon-3994x3168.png', 'assets/images/iself-icon-3994x3168.png', 'Graphic Design — photograph 8', '', 80, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/iself-icon-3994x3168.png' OR i.image_url='https://lilkangoomedia.com/assets/images/iself-icon-3994x3168.png'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/king.jpg', 'assets/images/king.jpg', 'Graphic Design — photograph 9', '', 90, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/king.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/king.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/olympic-poster2.jpg', 'assets/images/olympic-poster2.jpg', 'Graphic Design — photograph 10', '', 100, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/olympic-poster2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/olympic-poster2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/illustration.jpg', 'assets/images/illustration.jpg', 'Graphic Design — photograph 11', '', 110, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/illustration.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/illustration.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/calendar.nov-1.jpg', 'assets/images/calendar.nov-1.jpg', 'Graphic Design — photograph 12', '', 120, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/calendar.nov-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/calendar.nov-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/calendar.nov2.jpg', 'assets/images/calendar.nov2.jpg', 'Graphic Design — photograph 13', '', 130, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/calendar.nov2.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/calendar.nov2.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/calendar.japan.jpg', 'assets/images/calendar.japan.jpg', 'Graphic Design — photograph 14', '', 140, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/calendar.japan.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/calendar.japan.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/calendar6.jpg', 'assets/images/calendar6.jpg', 'Graphic Design — photograph 15', '', 150, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/calendar6.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/calendar6.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/design.logo1.jpg', 'assets/images/design.logo1.jpg', 'Graphic Design — photograph 16', '', 160, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/design.logo1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/design.logo1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/effect.logo.jpg', 'assets/images/effect.logo.jpg', 'Graphic Design — photograph 17', '', 170, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/effect.logo.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/effect.logo.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/mad.tango.logo.jpg', 'assets/images/mad.tango.logo.jpg', 'Graphic Design — photograph 18', '', 180, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/mad.tango.logo.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/mad.tango.logo.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/my.logo1-1.jpg', 'assets/images/my.logo1-1.jpg', 'Graphic Design — photograph 19', '', 190, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/my.logo1-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/my.logo1-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/mycartaoutlines-1.jpg', 'assets/images/mycartaoutlines-1.jpg', 'Graphic Design — photograph 20', '', 200, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/mycartaoutlines-1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/mycartaoutlines-1.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/pixels.logo.jpg', 'assets/images/pixels.logo.jpg', 'Graphic Design — photograph 21', '', 210, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/pixels.logo.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/pixels.logo.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/pow.1.jpg', 'assets/images/pow.1.jpg', 'Graphic Design — photograph 22', '', 220, 'public'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/pow.1.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/pow.1.jpg'))
ON CONFLICT DO NOTHING;

-- ORIGINAL: /IgoriGabrysia.html | 74 photographs | review
INSERT INTO public.portfolio_galleries
    (slug,title,description,category,client_name,related_service_slug,display_order,visibility)
VALUES ('legacy-igori-gabrysia', '18 Igor & Gabrysia', 'Restored from the original LilKangooMedia gallery /IgoriGabrysia.html. Historical image grouping and order preserved.', 'Client Projects', NULL, NULL, '100', 'review')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-75-1638x2048.jpg', 'assets/images/18-igor-gabrysia-75-1638x2048.jpg', '18 Igor & Gabrysia — photograph 1', '', 10, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-75-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-75-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-76-2048x1638.jpg', 'assets/images/18-igor-gabrysia-76-2048x1638.jpg', '18 Igor & Gabrysia — photograph 2', '', 20, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-76-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-76-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-77-2048x1638.jpg', 'assets/images/18-igor-gabrysia-77-2048x1638.jpg', '18 Igor & Gabrysia — photograph 3', '', 30, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-77-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-77-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-78-2048x1638.jpg', 'assets/images/18-igor-gabrysia-78-2048x1638.jpg', '18 Igor & Gabrysia — photograph 4', '', 40, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-78-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-78-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-79-2048x1638.jpg', 'assets/images/18-igor-gabrysia-79-2048x1638.jpg', '18 Igor & Gabrysia — photograph 5', '', 50, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-79-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-79-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-80-2048x1365.jpg', 'assets/images/18-igor-gabrysia-80-2048x1365.jpg', '18 Igor & Gabrysia — photograph 6', '', 60, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-80-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-80-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-81-2048x1365.jpg', 'assets/images/18-igor-gabrysia-81-2048x1365.jpg', '18 Igor & Gabrysia — photograph 7', '', 70, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-81-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-81-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-82-2048x1638.jpg', 'assets/images/18-igor-gabrysia-82-2048x1638.jpg', '18 Igor & Gabrysia — photograph 8', '', 80, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-82-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-82-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-83-2048x1638.jpg', 'assets/images/18-igor-gabrysia-83-2048x1638.jpg', '18 Igor & Gabrysia — photograph 9', '', 90, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-83-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-83-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-84-2048x1638.jpg', 'assets/images/18-igor-gabrysia-84-2048x1638.jpg', '18 Igor & Gabrysia — photograph 10', '', 100, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-84-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-84-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-85-2048x1365.jpg', 'assets/images/18-igor-gabrysia-85-2048x1365.jpg', '18 Igor & Gabrysia — photograph 11', '', 110, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-85-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-85-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-86-2048x1365.jpg', 'assets/images/18-igor-gabrysia-86-2048x1365.jpg', '18 Igor & Gabrysia — photograph 12', '', 120, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-86-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-86-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-87-2048x1365.jpg', 'assets/images/18-igor-gabrysia-87-2048x1365.jpg', '18 Igor & Gabrysia — photograph 13', '', 130, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-87-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-87-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-88-2048x1638.jpg', 'assets/images/18-igor-gabrysia-88-2048x1638.jpg', '18 Igor & Gabrysia — photograph 14', '', 140, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-88-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-88-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-89-2048x1638.jpg', 'assets/images/18-igor-gabrysia-89-2048x1638.jpg', '18 Igor & Gabrysia — photograph 15', '', 150, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-89-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-89-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-90-2048x1365.jpg', 'assets/images/18-igor-gabrysia-90-2048x1365.jpg', '18 Igor & Gabrysia — photograph 16', '', 160, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-90-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-90-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-91-2048x1638.jpg', 'assets/images/18-igor-gabrysia-91-2048x1638.jpg', '18 Igor & Gabrysia — photograph 17', '', 170, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-91-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-91-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-92-2048x1365.jpg', 'assets/images/18-igor-gabrysia-92-2048x1365.jpg', '18 Igor & Gabrysia — photograph 18', '', 180, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-92-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-92-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-93-1638x2048.jpg', 'assets/images/18-igor-gabrysia-93-1638x2048.jpg', '18 Igor & Gabrysia — photograph 19', '', 190, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-93-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-93-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-94-2048x1365.jpg', 'assets/images/18-igor-gabrysia-94-2048x1365.jpg', '18 Igor & Gabrysia — photograph 20', '', 200, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-94-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-94-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-95-2048x1638.jpg', 'assets/images/18-igor-gabrysia-95-2048x1638.jpg', '18 Igor & Gabrysia — photograph 21', '', 210, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-95-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-95-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-96-2048x1365.jpg', 'assets/images/18-igor-gabrysia-96-2048x1365.jpg', '18 Igor & Gabrysia — photograph 22', '', 220, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-96-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-96-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-97-2048x1638.jpg', 'assets/images/18-igor-gabrysia-97-2048x1638.jpg', '18 Igor & Gabrysia — photograph 23', '', 230, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-97-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-97-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-98-2048x1638.jpg', 'assets/images/18-igor-gabrysia-98-2048x1638.jpg', '18 Igor & Gabrysia — photograph 24', '', 240, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-98-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-98-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-99-2048x1638.jpg', 'assets/images/18-igor-gabrysia-99-2048x1638.jpg', '18 Igor & Gabrysia — photograph 25', '', 250, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-99-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-99-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-100-2048x1638.jpg', 'assets/images/18-igor-gabrysia-100-2048x1638.jpg', '18 Igor & Gabrysia — photograph 26', '', 260, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-100-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-100-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-101-2048x1365.jpg', 'assets/images/18-igor-gabrysia-101-2048x1365.jpg', '18 Igor & Gabrysia — photograph 27', '', 270, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-101-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-101-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-102-2048x1638.jpg', 'assets/images/18-igor-gabrysia-102-2048x1638.jpg', '18 Igor & Gabrysia — photograph 28', '', 280, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-102-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-102-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-103-2048x1638.jpg', 'assets/images/18-igor-gabrysia-103-2048x1638.jpg', '18 Igor & Gabrysia — photograph 29', '', 290, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-103-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-103-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-104-2048x1638.jpg', 'assets/images/18-igor-gabrysia-104-2048x1638.jpg', '18 Igor & Gabrysia — photograph 30', '', 300, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-104-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-104-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-105-2048x1638.jpg', 'assets/images/18-igor-gabrysia-105-2048x1638.jpg', '18 Igor & Gabrysia — photograph 31', '', 310, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-105-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-105-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-106-2048x1638.jpg', 'assets/images/18-igor-gabrysia-106-2048x1638.jpg', '18 Igor & Gabrysia — photograph 32', '', 320, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-106-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-106-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-107-2048x1638.jpg', 'assets/images/18-igor-gabrysia-107-2048x1638.jpg', '18 Igor & Gabrysia — photograph 33', '', 330, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-107-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-107-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-108-2048x1638.jpg', 'assets/images/18-igor-gabrysia-108-2048x1638.jpg', '18 Igor & Gabrysia — photograph 34', '', 340, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-108-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-108-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-109-2048x1365.jpg', 'assets/images/18-igor-gabrysia-109-2048x1365.jpg', '18 Igor & Gabrysia — photograph 35', '', 350, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-109-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-109-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-110-2048x1638.jpg', 'assets/images/18-igor-gabrysia-110-2048x1638.jpg', '18 Igor & Gabrysia — photograph 36', '', 360, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-110-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-110-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-111-2048x1365.jpg', 'assets/images/18-igor-gabrysia-111-2048x1365.jpg', '18 Igor & Gabrysia — photograph 37', '', 370, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-111-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-111-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-112-1638x2048.jpg', 'assets/images/18-igor-gabrysia-112-1638x2048.jpg', '18 Igor & Gabrysia — photograph 38', '', 380, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-112-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-112-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-113-1365x2048.jpg', 'assets/images/18-igor-gabrysia-113-1365x2048.jpg', '18 Igor & Gabrysia — photograph 39', '', 390, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-113-1365x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-113-1365x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-114-2048x1638.jpg', 'assets/images/18-igor-gabrysia-114-2048x1638.jpg', '18 Igor & Gabrysia — photograph 40', '', 400, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-114-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-114-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-115-2048x1638.jpg', 'assets/images/18-igor-gabrysia-115-2048x1638.jpg', '18 Igor & Gabrysia — photograph 41', '', 410, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-115-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-115-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-116-2048x1365.jpg', 'assets/images/18-igor-gabrysia-116-2048x1365.jpg', '18 Igor & Gabrysia — photograph 42', '', 420, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-116-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-116-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-117-1365x2048.jpg', 'assets/images/18-igor-gabrysia-117-1365x2048.jpg', '18 Igor & Gabrysia — photograph 43', '', 430, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-117-1365x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-117-1365x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-118-2048x1638.jpg', 'assets/images/18-igor-gabrysia-118-2048x1638.jpg', '18 Igor & Gabrysia — photograph 44', '', 440, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-118-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-118-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-119-2048x1365.jpg', 'assets/images/18-igor-gabrysia-119-2048x1365.jpg', '18 Igor & Gabrysia — photograph 45', '', 450, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-119-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-119-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-120-1638x2048.jpg', 'assets/images/18-igor-gabrysia-120-1638x2048.jpg', '18 Igor & Gabrysia — photograph 46', '', 460, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-120-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-120-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-121-2048x1638.jpg', 'assets/images/18-igor-gabrysia-121-2048x1638.jpg', '18 Igor & Gabrysia — photograph 47', '', 470, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-121-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-121-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-122-1638x2048.jpg', 'assets/images/18-igor-gabrysia-122-1638x2048.jpg', '18 Igor & Gabrysia — photograph 48', '', 480, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-122-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-122-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-123-2048x1638.jpg', 'assets/images/18-igor-gabrysia-123-2048x1638.jpg', '18 Igor & Gabrysia — photograph 49', '', 490, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-123-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-123-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-124-2048x1365.jpg', 'assets/images/18-igor-gabrysia-124-2048x1365.jpg', '18 Igor & Gabrysia — photograph 50', '', 500, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-124-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-124-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-125-2048x1638.jpg', 'assets/images/18-igor-gabrysia-125-2048x1638.jpg', '18 Igor & Gabrysia — photograph 51', '', 510, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-125-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-125-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-126-1638x2048.jpg', 'assets/images/18-igor-gabrysia-126-1638x2048.jpg', '18 Igor & Gabrysia — photograph 52', '', 520, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-126-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-126-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-127-1638x2048.jpg', 'assets/images/18-igor-gabrysia-127-1638x2048.jpg', '18 Igor & Gabrysia — photograph 53', '', 530, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-127-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-127-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-128-2048x1638.jpg', 'assets/images/18-igor-gabrysia-128-2048x1638.jpg', '18 Igor & Gabrysia — photograph 54', '', 540, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-128-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-128-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-129-2048x1638.jpg', 'assets/images/18-igor-gabrysia-129-2048x1638.jpg', '18 Igor & Gabrysia — photograph 55', '', 550, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-129-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-129-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-130-2048x1638.jpg', 'assets/images/18-igor-gabrysia-130-2048x1638.jpg', '18 Igor & Gabrysia — photograph 56', '', 560, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-130-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-130-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-131-2048x1638.jpg', 'assets/images/18-igor-gabrysia-131-2048x1638.jpg', '18 Igor & Gabrysia — photograph 57', '', 570, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-131-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-131-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-132-2048x1638.jpg', 'assets/images/18-igor-gabrysia-132-2048x1638.jpg', '18 Igor & Gabrysia — photograph 58', '', 580, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-132-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-132-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-133-1638x2048.jpg', 'assets/images/18-igor-gabrysia-133-1638x2048.jpg', '18 Igor & Gabrysia — photograph 59', '', 590, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-133-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-133-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-134-2048x1638.jpg', 'assets/images/18-igor-gabrysia-134-2048x1638.jpg', '18 Igor & Gabrysia — photograph 60', '', 600, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-134-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-134-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-135-2048x1638.jpg', 'assets/images/18-igor-gabrysia-135-2048x1638.jpg', '18 Igor & Gabrysia — photograph 61', '', 610, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-135-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-135-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-136-1638x2048.jpg', 'assets/images/18-igor-gabrysia-136-1638x2048.jpg', '18 Igor & Gabrysia — photograph 62', '', 620, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-136-1638x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-136-1638x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-137-2048x1638.jpg', 'assets/images/18-igor-gabrysia-137-2048x1638.jpg', '18 Igor & Gabrysia — photograph 63', '', 630, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-137-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-137-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-138-2048x1638.jpg', 'assets/images/18-igor-gabrysia-138-2048x1638.jpg', '18 Igor & Gabrysia — photograph 64', '', 640, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-138-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-138-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-139-2048x1638.jpg', 'assets/images/18-igor-gabrysia-139-2048x1638.jpg', '18 Igor & Gabrysia — photograph 65', '', 650, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-139-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-139-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-140-2048x1638.jpg', 'assets/images/18-igor-gabrysia-140-2048x1638.jpg', '18 Igor & Gabrysia — photograph 66', '', 660, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-140-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-140-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-141-2048x1365.jpg', 'assets/images/18-igor-gabrysia-141-2048x1365.jpg', '18 Igor & Gabrysia — photograph 67', '', 670, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-141-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-141-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-142-2048x1365.jpg', 'assets/images/18-igor-gabrysia-142-2048x1365.jpg', '18 Igor & Gabrysia — photograph 68', '', 680, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-142-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-142-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-143-2048x1638.jpg', 'assets/images/18-igor-gabrysia-143-2048x1638.jpg', '18 Igor & Gabrysia — photograph 69', '', 690, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-143-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-143-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-144-2048x1365.jpg', 'assets/images/18-igor-gabrysia-144-2048x1365.jpg', '18 Igor & Gabrysia — photograph 70', '', 700, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-144-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-144-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-145-1365x2048.jpg', 'assets/images/18-igor-gabrysia-145-1365x2048.jpg', '18 Igor & Gabrysia — photograph 71', '', 710, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-145-1365x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-145-1365x2048.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-146-2048x1638.jpg', 'assets/images/18-igor-gabrysia-146-2048x1638.jpg', '18 Igor & Gabrysia — photograph 72', '', 720, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-146-2048x1638.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-146-2048x1638.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-147-2048x1365.jpg', 'assets/images/18-igor-gabrysia-147-2048x1365.jpg', '18 Igor & Gabrysia — photograph 73', '', 730, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-147-2048x1365.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-147-2048x1365.jpg'))
ON CONFLICT DO NOTHING;
INSERT INTO public.portfolio_images
    (gallery_id,image_url,original_path,alt_text,caption,display_order,visibility)
SELECT g.id, 'https://lilkangoomedia.com/assets/images/18-igor-gabrysia-148-1365x2048.jpg', 'assets/images/18-igor-gabrysia-148-1365x2048.jpg', '18 Igor & Gabrysia — photograph 74', '', 740, 'review'
FROM public.portfolio_galleries AS g WHERE g.slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_images AS i
  WHERE i.gallery_id=g.id AND (i.original_path='assets/images/18-igor-gabrysia-148-1365x2048.jpg' OR i.image_url='https://lilkangoomedia.com/assets/images/18-igor-gabrysia-148-1365x2048.jpg'))
ON CONFLICT DO NOTHING;
COMMIT;
-- Read-only verification of imported gallery sizes:
SELECT g.slug,g.title,g.category,g.visibility,COUNT(i.id) AS image_count
FROM public.portfolio_galleries g LEFT JOIN public.portfolio_images i ON i.gallery_id=g.id
WHERE g.slug LIKE 'legacy-%'
GROUP BY g.slug,g.title,g.category,g.visibility
ORDER BY g.category,g.title;
