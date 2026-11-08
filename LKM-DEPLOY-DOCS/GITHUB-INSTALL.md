# LilKangooMedia v3 — GitHub overlay release

**Source repository (confirmed):** https://github.com/LilKangoo/LilKangooMedia (main)  
**Prepared:** 2026-11-08  
**Status:** complete frontend package ready for preview / staged GitHub commit; the new back-office, email and online checkout still require deployment configuration and production end-to-end testing.

## How to add this ZIP to your EXISTING repository

1. Download this ZIP and **extract it**. Do **not** remove or replace the existing repository contents.
2. Create a new Git branch named e.g. `lkm-v3-staging`, or make a local backup of `main`.
3. Copy the **contents** of this extracted folder directly into the repository root (not the enclosing folder), allowing `home.html` to be replaced. The old home page is backed up as `legacy-home-2026.html`.
4. Keep the existing `/assets/images/`, existing legacy `/assets/` directories, all other HTML pages (`shop.html`, `FAQ.html`, `Photography.html`, `Videography.html`, etc.), `sitemap.xml`, `robots.txt`, service worker and original shopping/cart assets **untouched**.
5. Run `npm test` and `npm run check` if Node.js is installed. Open a pull request, preview the website from your hosting service, check on a phone, then merge **only after staging acceptance**.

## Route map

- `/` -> new `index.html` (modern homepage; Personal/Business, service catalog, galleries)
- `/home.html` -> identical modern homepage for legacy navigation links
- `/admin.html` -> dedicated admin interface (demo mode until Supabase is configured)
- `/legacy-home-2026.html` -> previous homepage retained for emergency rollback / comparison (noindex)
- `/shop.html`, `/FAQ.html`, `/Photography.html` and every other older route -> originals, untouched
- `/api/enquiry`, `/api/checkout`, `/api/stripe-webhook` -> Cloudflare **Pages Functions** (requires deployment to Cloudflare Pages with functions enabled)

## Google integrations preserved

- GA4 Measurement ID: `G-VB93M2KSMX` in `assets/lkm-v3/site.js`, dynamically loaded after analytics consent. SPA routes emit `page_view` events.
- Legacy Universal Analytics property: `UA-200005173-1` retained for reference; Google retired UA collection. It is not an independent active reporting service.
- Google AdSense publisher: `ca-pub-1951868717311818` in the new `index.html` and `home.html`, with the original AdSense loader. Existing manual AdSense slots on old pages remain untouched. The former homepage manual unit `5414859035` is preserved in the legacy-home backup but is not replicated within the new homepage design; Google Auto Ads can still run if configured.
- Google Search Console verification token: preserved in `index.html` and `home.html`.
- Existing canonical root URL, OG image and basic metadata are included. Preserve existing sitemap/robots and test Google indexing after rollout.

**EEA/Cyprus advertising consent warning:** The legacy ad script is preserved as requested, but this package does **not** implement a Google-certified CMP/TCF consent flow. Verify or configure your compliant Google-certified CMP before activating personalized advertisements in the EU. The simple analytics preferences UI is not a substitute for a certified AdSense CMP.

## Setup before live form submissions / bookings

1. Confirm whether your LilKangooMedia host is **Cloudflare Pages**. Functions will not work on plain GitHub Pages or static-only Cloudflare deployments.
2. Create a **new staging Supabase project** and run `supabase/migrations/20261108_lkm_site.sql` in its SQL editor. Validate policies before adding real clients.
3. Configure public `lkm-config.js` with Supabase project URL and **publishable/anon** key only. NEVER place service role keys or payment secrets in browser files.
4. Add Cloudflare Pages secrets from `LKM-DEPLOY-DOCS/cloudflare-environment.example` via Cloudflare Dashboard settings. Do not commit secrets into GitHub.
5. Configure a verified sending domain for Resend, to deliver enquiries to `photo@lilkangoomedia.com`; add a live Turnstile secret/site key. Perform a genuine end-to-end test email.
6. Setup Stripe test mode / webhook (`/api/stripe-webhook`). Test payment, deposit, cancellation and refund scenarios before switching to live keys.
7. Review `LKM-DEPLOY-DOCS/PRICING-AUDIT.md` and approve each package/current price before enabling checkout. All service payment modes start as *enquiry-only* on the seeded database.
8. Test old site newsletter, presets shop, old checkout, social links, SEO and canonical URL. This ZIP preserves existing routes but does not port all old widgets into the redesigned homepage.

## Notes and limits

- This is a **merge overlay ZIP**, not a 4-GB full copy of the existing repository. Its purpose is to add only new or changed files, leaving all other files in place.
- Existing original assets and SEO pages are available on GitHub; do not delete them. The new site references some original images from `/assets/images/` and includes fallback visual preview photos.
- Prior to Supabase setup, admin changes are **local to the browser**. They are not shared with visitors; this is demo mode only.
- New contact forms cannot reliably email anyone until the Cloudflare Functions + Resend + Supabase secrets are configured and tested.
- The built-in website does not contain a live calendar; chosen dates are requests pending confirmation.
- The old home page is retained for comparison, but its legacy newsletter and other widgets do not automatically appear inside the new frontend. A production launch requires functional regression testing and decisions about replacing or linking the legacy features.
- Do not enable live Stripe simply by inserting keys; review refunds, deposits, VAT and price/deliverable disputes first.
