# LilKangooMedia CMS — Phase 2 (staging release)

**Prepared for:** `LilKangoo/LilKangooMedia` (Netlify + Supabase).  
**Prerequisite:** existing LilKangooMedia base database migration AND the Phase 1 CMS migration have successfully run.  
**Status:** usable CMS UI and dynamic public article/portfolio pages for staging. **NOT the completed legacy-content/SEO migration.**

## Install safely

1. In GitHub create a new branch from the current `main`, e.g. `lkm-cms-stage2`. Back up the current live version.
2. Extract the ZIP and **copy its contents into the repository root**. Merge `assets/` (add the `lkm-v3` files) — **never delete or replace `/assets/images`**.
3. This overlay updates three existing HTML files (`index.html`, `home.html`, `admin.html`) and one existing JS file (`assets/lkm-v3/site.js`) to add links to the CMS and public pages. The unchanged previous version is preserved in GitHub history. No old blog/gallery pages are removed.
4. It adds `cms.html`, `portfolio.html`, `blog.html`, `assets/lkm-v3/cms.js`, `assets/lkm-v3/cms.css`, `assets/lkm-v3/cms-public.js`, `assets/lkm-v3/cms-public.css`.
5. **Do not overwrite `lkm-config.js`**. Your already configured public Supabase project URL and publishable key remain in place. This ZIP does not contain secrets.
6. Deploy this branch to a Netlify Preview first. In the preview, check `/cms.html`, `/blog.html`, `/portfolio.html`, homepage, pricing, original articles, old galleries, Analytics and your email links.
7. Merge only when the preview has been accepted. Never upload the ZIP as a ZIP file expecting Netlify to unpack it.

## How to use the CMS

- `https://lilkangoomedia.com/cms.html` (or staging preview URL): Supabase email/password sign-in, then check membership in `admin_users`.
- **Articles:** create or update a draft/review/published record; maintain source paths, SEO title/description, canonical and cover. Input article content as HTML using basic tags. Public rendering allows a conservative subset of markup and strips scripts/iframes.
- **Portfolio:** create a gallery, choose category and related service, add image URLs or upload through the protected Supabase Storage bucket. **New galleries and images default to Review.** Both gallery and image must be explicitly set Public before `/portfolio.html` will display the photo.
- **Public catalog:** `/blog.html` and `/portfolio.html` read approved records only using Supabase RLS; they do not display draft/private records.
- **Staff:** existing `/admin.html` service/pricing admin remains in place with a link to content CMS.

## Critical limits / next phase

- This phase **does not import the existing hundreds/thousands of images**. Use the Phase 1 `scripts/audit-legacy-content.py` on a full checkout, review privacy/category assignments and import in a following step. Existing assets and client galleries have not been changed.
- This phase **does not move or rewrite the older SEO articles**. The original `.html` paths, metadata, AdSense and Google Analytics scripts remain as they were. The new `/blog.html` uses a hash-based client-side article view for preview; **this is not adequate final article SEO**. Before using the new CMS as the canonical blog publisher, add a Netlify static article build/export, canonical URLs, dynamic sitemap, old URL parity tests and 301 redirects as needed. New article records should remain drafts until that is in place.
- The new `/blog.html` and `/portfolio.html` load GA4 `G-VB93M2KSMX` **only after analytics consent**, and preserve `ca-pub-1951868717311818` publisher metadata. AdSense Auto Ads are *not* enabled on those two new pages pending a Google-certified EEA CMP integration; existing original pages remain unchanged.
- Supabase RLS enforces administrator writes. **Hiding a UI is not security**: test direct Supabase API reads/writes with unauthenticated and non-admin accounts; ensure both gallery and individual images require explicit public status.
- Existing Cloudflare Pages `/functions/api/` handlers do **not** run on Netlify by themselves; enquiry delivery and Stripe payments need a Netlify Functions conversion before production use.
- No changes have been applied to Supabase automatically by this ZIP. Phase 1 SQL has already created the tables; do not rerun it blindly.

## Staging checklist

- [ ] `/cms.html` without sign-in only shows Supabase login, not content manager
- [ ] Admin login works; private/incognito visitor cannot modify tables via REST API
- [ ] Create an article **Draft**. It does not appear on `/blog.html`
- [ ] Create gallery **Review**, add photo **Review**. It does not appear on `/portfolio.html`
- [ ] After explicit privacy review, set a test gallery + image to Public; they appear on `/portfolio.html`
- [ ] Only publish a test article after agreeing on URL/SEO; it appears on dynamic `/blog.html` preview
- [ ] Old `.html` article pages and photos still return successfully
- [ ] Main homepage, services, prices, Analytics and consent still work

## Rollback

The Phase 2 overlay only adds files and changes four known current files. Revert the corresponding Git commit/PR, or redeploy the previous Netlify production build. Imported database content remains in Supabase; rollback does not delete data.
