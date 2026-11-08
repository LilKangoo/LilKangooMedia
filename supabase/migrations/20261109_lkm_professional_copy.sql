-- LilKangooMedia | Professional copy update | Phase 5
-- Safe for the existing Supabase project. Does NOT change prices, packages, photos or publication status.
-- Changes source-imported copy only: an admin-edited text value is left untouched.
-- Review on a backup/staging copy before applying to production.
BEGIN;
UPDATE public.services
SET summary = CASE WHEN summary = 'Professional on-location portrait sessions across Cyprus.' THEN 'Portraits and family photography in locations across Cyprus.' ELSE summary END,
    description = CASE WHEN description = 'Professional on-location portrait sessions across Cyprus.' THEN 'Individual portraits, couples and family photography, planned around your occasion and preferred setting. Choose a session package and share the style, location and date you have in mind.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'portrait-photography';
UPDATE public.services
SET summary = CASE WHEN summary = 'Cinematic filming and edited video for people and memorable experiences.' THEN 'Personal films for celebrations, milestones and memorable experiences.' ELSE summary END,
    description = CASE WHEN description = 'Cinematic filming and edited video for people and memorable experiences.' THEN 'Filming and editing for personal occasions and meaningful moments. Tell us what you would like to capture, where the filming will take place and how you plan to use the finished video.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'personal-videography';
UPDATE public.services
SET summary = CASE WHEN summary = 'Beautiful, heartfelt wedding and proposal photography and film.' THEN 'Wedding, engagement and proposal photography and film in Cyprus.' ELSE summary END,
    description = CASE WHEN description = 'Beautiful, heartfelt wedding and proposal photography and film.' THEN 'Photography and videography for weddings, engagements and proposals. Coverage can be tailored to your schedule and the moments that matter most, with available packages and deliverables agreed before booking.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'wedding-photography-video';
UPDATE public.services
SET summary = CASE WHEN summary = 'Private photo excursions and personal travel memories.' THEN 'Private Cyprus experiences with professional photography.' ELSE summary END,
    description = CASE WHEN description = 'Private photo excursions and personal travel memories.' THEN 'Combine a private day exploring Cyprus with photographs of your experience. Choose a trip duration and share your preferred locations, group size and pickup arrangements when requesting availability.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'cyprus-photo-trips';
UPDATE public.services
SET summary = CASE WHEN summary = 'A cinematic film of your Cyprus adventure.' THEN 'Private Cyprus experiences captured in a professionally edited film.' ELSE summary END,
    description = CASE WHEN description = 'A cinematic film of your Cyprus adventure.' THEN 'A private trip and video experience for travelers who want to remember their time in Cyprus on film. Select a duration and tell us about your route, group and the moments you would like to capture.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'cyprus-video-trips';
UPDATE public.services
SET summary = CASE WHEN summary = 'Birthdays, christenings, anniversaries and private celebrations.' THEN 'Photography and video for birthdays, anniversaries and special occasions.' ELSE summary END,
    description = CASE WHEN description = 'Tell us the event type, location, guests and desired coverage. We will prepare an individual quote.' THEN 'From birthdays and anniversaries to family gatherings and other celebrations, we can plan photographic or video coverage around your event. Share the date, venue, approximate guest count and deliverables to receive a quote.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'private-events';
UPDATE public.services
SET summary = CASE WHEN summary = 'Premium visual content for products, hospitality and advertising.' THEN 'Product, jewellery and brand photography for commercial use.' ELSE summary END,
    description = CASE WHEN description = 'Commercial product photography, business portraits and photo campaigns. Pricing is based on brief, usage, editing and deliverables.' THEN 'Photography for products, jewellery, hospitality and branded campaigns. Each shoot is planned around the subject, where the images will be used and the final image requirements.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'product-brand-photography';
UPDATE public.services
SET summary = CASE WHEN summary = 'Branded videos, commercial reels, event films and campaigns.' THEN 'Video production and reels for brands, venues and campaigns.' ELSE summary END,
    description = CASE WHEN description = 'Production, editing and delivery of professional commercial video with scope confirmed by consultation.' THEN 'Commercial filming and editing for business promotions, social channels, events and campaigns. We discuss the format, location, filming requirements and final edits before preparing a quote.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'commercial-video-reels';
UPDATE public.services
SET summary = CASE WHEN summary = 'Planning, production and management of your social media presence.' THEN 'Content planning and social media support for Cyprus businesses.' ELSE summary END,
    description = CASE WHEN description = 'Custom monthly social media management, content creation, posting strategy and reporting. No confirmed public monthly price on supplied website; ask for a quote.' THEN 'Support for social media content planning, creative production and publishing based on your business goals. Monthly scope and pricing depend on the channels, content volume and production requirements.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'social-media-management';
UPDATE public.services
SET summary = CASE WHEN summary = 'Identity, campaign visuals, posters and creative assets.' THEN 'Brand identity, campaign visuals and creative design.' ELSE summary END,
    description = CASE WHEN description = 'Custom graphic design, illustrations, brand visuals and social media creatives.' THEN 'Graphic design for logos, visual identity, advertising, posters and digital content. We develop visuals around your brief, brand direction and required formats.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'graphic-design';
UPDATE public.services
SET summary = CASE WHEN summary = 'Responsive websites and platforms designed for your business.' THEN 'Responsive websites and digital solutions for businesses.' ELSE summary END,
    description = CASE WHEN description = 'Web design, ecommerce and development. Pricing is quoted after discussing requirements.' THEN 'Website design and development shaped around your business requirements. Tell us the pages, content, functionality and integrations you need so we can propose the appropriate scope.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'website-design';
UPDATE public.services
SET summary = CASE WHEN summary = 'Brand setup, visuals, website and content bundles.' THEN 'Brand identity, websites and creative content for new businesses.' ELSE summary END,
    description = CASE WHEN description = 'Brand setup, visuals, website and content bundles.' THEN 'Combined design and content packages for businesses preparing to launch or refresh their presentation. Compare the available packages and request details about the deliverables included in each option.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'brand-launch-packages';
UPDATE public.services
SET summary = CASE WHEN summary = 'Strategy and campaign content to make your business more visible.' THEN 'Creative campaigns and marketing content for business growth.' ELSE summary END,
    description = CASE WHEN description = 'Consultation-led marketing and advertising campaigns. Scope and price confirmed in a proposal.' THEN 'Creative marketing services covering campaign planning, visual production and advertising materials. We prepare a proposal based on your objectives, intended channels, deliverables and budget.' ELSE description END,
    source = CASE WHEN source LIKE 'Official site, HTML snapshots%' THEN 'LilKangooMedia service catalogue' ELSE source END
WHERE slug = 'marketing-advertising';
-- 'Business Setup Packages' describes creative brand-launch packages, not company formation.
UPDATE public.services SET title='Brand Launch Packages'
WHERE slug='brand-launch-packages' AND title='Business Setup Packages';
-- Portraits: retain editor changes, do not alter publication status.
UPDATE public.portfolio_galleries
SET title = CASE WHEN title='Portraits' THEN 'Portrait & Lifestyle Photography' ELSE title END,
    description = CASE WHEN description LIKE 'Restored from the original LilKangooMedia gallery %'
      THEN 'Portrait photography featuring individual sessions, couples, families and expressive moments.' ELSE description END
WHERE slug IN ('legacy-portraits','portraits');
-- Nature Photography: retain editor changes, do not alter publication status.
UPDATE public.portfolio_galleries
SET title = CASE WHEN title='Nature Photography' THEN 'Nature & Wildlife Photography' ELSE title END,
    description = CASE WHEN description LIKE 'Restored from the original LilKangooMedia gallery %'
      THEN 'Nature and wildlife photography featuring birds, landscapes and outdoor scenes.' ELSE description END
WHERE slug IN ('legacy-nature','nature-photography');
-- Products & Jewellery Photography: retain editor changes, do not alter publication status.
UPDATE public.portfolio_galleries
SET title = CASE WHEN title='Products & Jewellery Photography' THEN 'Product & Jewellery Photography' ELSE title END,
    description = CASE WHEN description LIKE 'Restored from the original LilKangooMedia gallery %'
      THEN 'Photography focused on jewellery, watches and products, with attention to details, materials and presentation.' ELSE description END
WHERE slug IN ('legacy-products','product-jewellery-photography');
-- Graphic Design: retain editor changes, do not alter publication status.
UPDATE public.portfolio_galleries
SET title = CASE WHEN title='Graphic Design' THEN 'Graphic Design & Visual Identity' ELSE title END,
    description = CASE WHEN description LIKE 'Restored from the original LilKangooMedia gallery %'
      THEN 'A selection of graphic design work including illustrations, posters, visual identities and promotional artwork.' ELSE description END
WHERE slug IN ('legacy-graphic-design','graphic-design');
-- 18 Igor & Gabrysia: retain editor changes, do not alter publication status.
UPDATE public.portfolio_galleries
SET title = CASE WHEN title='18 Igor & Gabrysia' THEN '18 Igor & Gabrysia' ELSE title END,
    description = CASE WHEN description LIKE 'Restored from the original LilKangooMedia gallery %'
      THEN 'Photo collection for Igor and Gabrysia.' ELSE description END
WHERE slug IN ('legacy-igori-gabrysia','igor-gabrysia');
UPDATE public.portfolio_galleries SET slug='portraits'
WHERE slug='legacy-portraits'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_galleries WHERE slug='portraits');
UPDATE public.portfolio_galleries SET slug='nature-photography'
WHERE slug='legacy-nature'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_galleries WHERE slug='nature-photography');
UPDATE public.portfolio_galleries SET slug='product-jewellery-photography'
WHERE slug='legacy-products'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_galleries WHERE slug='product-jewellery-photography');
UPDATE public.portfolio_galleries SET slug='graphic-design'
WHERE slug='legacy-graphic-design'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_galleries WHERE slug='graphic-design');
UPDATE public.portfolio_galleries SET slug='igor-gabrysia'
WHERE slug='legacy-igori-gabrysia'
AND NOT EXISTS (SELECT 1 FROM public.portfolio_galleries WHERE slug='igor-gabrysia');
COMMIT;
-- After execution, confirm all five gallery slugs were updated and review every public description.
SELECT slug, title, category, description, visibility
FROM public.portfolio_galleries
WHERE slug IN ('portraits','nature-photography','product-jewellery-photography','graphic-design','igor-gabrysia',
               'legacy-portraits','legacy-nature','legacy-products','legacy-graphic-design','legacy-igori-gabrysia')
ORDER BY slug;
