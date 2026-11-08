# LilKangooMedia CMS — Phase 1 (staging only)

Prepared against `LilKangoo/LilKangooMedia` on 8 Nov 2026. This is an **additive groundwork pack**, not a complete published blog/CMS. **No production code has been modified.**

## What was verified
- Existing Supabase schema already contains `admin_users`, `services`, `contact_leads`, `stripe_orders`, and portfolio **Storage bucket**.
- Current redesigned portfolio uses only five hard-coded image references.
- `Education.html` indexes photography-education articles and `articlesaboutcyprus.html` indexes Cyprus-travel articles.
- `assets/images` contains many files; some are associated with client galleries. Do not publish all files automatically.
- Public site is on Netlify; previously prepared Cloudflare Pages Functions are not Netlify Functions.

## Apply in this order
1. Back up current Supabase project and GitHub branch; do not change `main` for this phase.
2. In your existing **LilKangooMedia Supabase project**, SQL Editor: run `supabase/migrations/20261108_lkm_cms_phase1.sql` **after** the original schema. Inspect the resulting four new tables and RLS policies. It does not replace the `services` data.
3. On a local clone of the **whole** GitHub repository, run `python3 scripts/audit-legacy-content.py /path/to/LilKangooMedia /path/to/output` (copy the script into the repo first, or run it from this folder). The script reads local files only and creates `articles.csv` and `images.csv` with **REVIEW** statuses.
4. Review article classifications, file paths, copyrights and customer sharing permissions before import. `articles.csv` includes only files linked from the two legacy index pages, not arbitrary HTML pages.
5. Next build: authenticated admin CRUD, image upload/categorization, import preview with idempotency, full-content HTML renderer, Netlify static article generation and sitemap integration. These are **not included** in this foundation.

## SEO safeguards
- Do not rename/remove existing `.html` articles, sitemap, analytics or ad tags until SEO parity tests pass.
- Preserve current canonical URL for each article, original titles, H1, images and metadata, unless the migration explicitly maps a verified correction.
- Draft and review status are non-public by RLS; portfolio images require both gallery and image `public` flags. **Storage buckets/public legacy files are separate from these database flags**; never copy private customer media into public storage.
- Auth visibility is not authorization: verify Supabase RLS from a non-admin authenticated account before launch.

## Supabase quick check
```sql
select 'blog_posts' as table_name, count(*) from public.blog_posts
union all select 'portfolio_galleries', count(*) from public.portfolio_galleries
union all select 'portfolio_images', count(*) from public.portfolio_images;
```

**Netlify:** A separate migration of `/api/enquiry`, checkout and webhook handlers is needed before forms and payment can go live; this pack does not enable these endpoints.
