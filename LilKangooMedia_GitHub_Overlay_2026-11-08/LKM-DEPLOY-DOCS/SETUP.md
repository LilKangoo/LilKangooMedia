# Deploy / configuration — LilKangooMedia v3

## 0. Safety first

**Do not overwrite the live website while this version is still in staging.** We only received a subset of HTML and four logos, not the complete assets, gallery files, shop, terms, blog and every route. Keep the existing domain and email DNS intact during preview. Make a backup of current Cloudflare deployment and Git repository before applying changes.

## 1. Start a local preview

Open Terminal in the project folder:

```bash
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000` and `http://localhost:8000/admin.html`.

Until you configure Supabase, admin changes are saved only to browser localStorage. You can edit service names, prices, packages, media URLs and visibility, then refresh the public page in the same browser to see the change. **This is an interactive demo, not protected admin hosting.**

## 2. Set up Supabase (staging)

1. Create a separate staging project in Supabase, or use a staging schema/project approved for this test. Never initially connect to production customer data.
2. Paste `supabase/20261108_lkm_site.sql` into Supabase SQL Editor and run once. The file creates `services`, `admin_users`, `contact_leads` and `stripe_orders`, enables RLS and seeds 13 sample services containing 20 price packages.
3. In Supabase Authentication, manually create/invite your admin account. Find the Auth **user UUID**.
4. In SQL Editor run:
   ```sql
   insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');
   ```
5. Copy the project **URL and PUBLIC anon/publishable key** into `public/config.js`. Never use the service-role key in `public/config.js`.
6. Open the admin page, sign in, and edit one price. Confirm it appears on the public services page on a second device. Confirm a non-admin account cannot read non-public records or change services.
7. Upload new photos from admin after the `portfolio` Storage bucket exists. Original media URLs from the old site are used until you migrate your full original media folder.

## 3. Cloudflare Pages Functions

1. Create a **staging** Cloudflare Pages project linked to your GitHub repo. Keep all repository files; set output directory to `public`.
2. Keep `functions/api/` alongside `public/`. Pages Functions will be exposed under `/api/*`.
3. In Cloudflare Pages project settings, add encrypted environment secrets using `.env.example` as the checklist:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret)
   - `RESEND_API_KEY` (secret)
   - `FROM_EMAIL` (sender on a verified Resend domain)
   - `CONTACT_EMAIL=photo@lilkangoomedia.com`
   - `SITE_URL` (exact staging URL for Stripe testing, production URL for live)
   - `STRIPE_SECRET_KEY` (test key first)
   - `STRIPE_WEBHOOK_SECRET`
   - optional `TURNSTILE_SECRET` (only after adding its matching public site key)
4. Ensure no API credentials appear in GitHub or in files inside the `public/` directory. Cloudflare secret values stay server-side.
5. Verify the notification sender domain in Resend using its required DNS records. Add these without breaking any existing MX, SPF or DKIM records needed for the current business email. Receiving at `photo@lilkangoomedia.com` and sending *from* a verified address are two separate configurations.
6. Submit a test enquiry, ensure exactly one lead appears in Supabase and the notification arrives at `photo@lilkangoomedia.com`. If the backend is not configured, the website must **show an error rather than falsely claiming submission**.
7. Consider adding Cloudflare Turnstile for anti-spam. Put `TURNSTILE_SITE_KEY` in `public/config.js`, and its matching `TURNSTILE_SECRET` only in Pages secrets. If one is configured without the other, submission verification may fail.

## 4. Stripe test mode

1. Ensure the Stripe business account is allowed to accept the payment types, currencies and sales described in your service terms.
2. First use a `sk_test_...` key as the server-side `STRIPE_SECRET_KEY`.
3. Add webhook URL `https://YOUR-STAGING-URL/api/stripe-webhook` for `checkout.session.completed` and copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. In admin, select a service **with a fixed priced package**. Choose payment mode `deposit` (configure a percent from 1–100) or `full`. All imported services start as `enquiry` by default.
5. Test checkout, server-side price recomputation, Stripe test payment and webhook delivery. Confirm a paid row appears in `stripe_orders` and the team receives an email.
6. **Important:** preferred dates are **not checked against a live calendar** in this staging version. A successful payment creates a **paid booking request pending manual availability confirmation**, not a guaranteed confirmed appointment. Do not switch on live charges until you approve cancellation/refund rules and either add availability validation or explicitly tell customers their date is pending confirmation.
7. Stripe fees, taxes/VAT status, invoices and cancellation policies require business/accountant review before launch.

## 5. Full production migration checklist

- Gather the ENTIRE original `assets/` folder, photos, videos, scripts, CSS, every existing HTML subpage, `manifest.json`, service worker, sitemap, `_redirects`, terms/privacy, and all active contact forms.
- Migrate existing photo/video galleries to the new media system; do not use temporary crop placeholders in production.
- Build SEO-friendly, indexable `/services/<slug>` pages rather than relying entirely on hash-based preview routes. Preserve existing canonical URLs with tested 301 redirects and a renewed sitemap.
- Preserve/migrate the existing newsletter consent/workflow, digital preset store, smart cart, reviews/testimonials, blog/article archive and Google Search Console access. This preview deliberately does not claim these legacy features are migrated.
- Verify compatibility with GA4 measurement ID `G-VB93M2KSMX`, only loading optional analytics after consent, and track conversion events.
- Confirm all published prices, travel fees, image/video deliverables, date policies, deposit rates, payment/refund terms and social-media subscription scopes.
- Accessibility: test contrast, keyboard use, screen readers, mobile forms and reduced-motion mode. Test browser behavior in real Safari and Chrome before cutover.
- Make backups, stage the domain switch, observe error logs, then release gradually. Never change email MX records simply to deploy the website.

## 6. Items needing confirmation from LilKangooMedia

- Which of the **published historic prices** remain valid now? Especially video pricing (€349 / 1h versus previously discussed €250/h).
- Which services accept payment immediately and what deposit percentage applies? What are the cancellation/rescheduling conditions?
- Will you require manually confirmed booking requests initially, or must the website show live available times from day one?
- What actual monthly plans, content quantities and prices should be offered for Social Media Management?
- Provide the complete original `assets` folder and currently active website repository so actual gallery photos, portfolio media, legacy forms, blog and shop can be preserved.
