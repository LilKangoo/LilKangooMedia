# Safe file list

**Overwrite intentionally:** `home.html` (new homepage alias; original saved as `legacy-home-2026.html`).

**New files:** `index.html`, `admin.html`, `lkm-config.js`, `legacy-home-2026.html`, `assets/lkm-v3/**`, `functions/api/{enquiry,checkout,stripe-webhook}.js`, `functions/_shared.js`, `supabase/migrations/20261108_lkm_site.sql`, `package.json`, `tests/backend.test.mjs`, `LKM-DEPLOY-DOCS/**`.

**Must remain unchanged:** `shop.html`, `FAQ.html`, `Photography.html`, `Videography.html`, `AboutUs.html`, all articles, `assets/images/**`, `assets/mobirise/**`, `assets/theme/**`, original `sitemap.xml`, `robots.txt` and any existing Cloudflare environment settings.

If any listed "new" path unexpectedly already exists in your working tree, stop before overwriting; compare the files first.
