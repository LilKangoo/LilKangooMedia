# QA — staging status

Checks completed in this environment:
- `node --check` passed for public JavaScript and Cloudflare server modules.
- `npm test`: 4 of 4 backend tests PASS (DB-based price calculation, invalid extras rejection, Stripe deposit calculation independent of browser quote, unconfigured email transport error).
- JSON seed parsed and source prices checked: **13 services / 20 priced packages**. Two presets are documented but retained on the original shop for migration.
- All 4 submitted original logo images were processed into optimized files.
- An **in-memory headless Chromium preview** successfully rendered the homepage, Business catalog (7 cards), service details, quote screen and admin service list (13 rows), with no JavaScript errors.
- Mobile 390px preview: no document horizontal overflow.
- Screenshots from the in-memory UI test: `desktop-preview.png`, `catalog-preview.png`, `quote-preview.png`, `mobile-preview.png`, `admin-preview.png`.
- A standalone HTML bundle also rendered its two main Personal/Business cards without JavaScript errors.

**Important limits of QA:** Direct browser navigation to localhost/file URLs was blocked by this environment, so we ran a page-content Chromium test. The screenshots are not from a real website deployment. To make visuals reliable offline, screenshots substitute the actual portfolio image URLs with **concept placeholders** derived from the previous approved mockup. Browser-and-network production integration tests remain outstanding.

Manual staging checklist before deployment:
1. Open site over `http://localhost:8000` on a Mac and test browser navigation, scroll reveal, page readability and layout in Safari/Chrome.
2. Change a price in admin preview and refresh customer catalog in the same browser.
3. With Supabase set up, test admin login, RLS, edits across devices and media upload.
4. Check all real original portfolio image URLs and replace placeholders by actual media files before production.
5. Test Cloudflare enquiry endpoint and incoming email at `photo@lilkangoomedia.com`.
6. Test Stripe in **test mode only** with a signed webhook, then review deposit, cancellation and tax terms.
7. Migrate the legacy newsletter, smart cart, old images/blog pages and SEO redirects before domain cutover.
