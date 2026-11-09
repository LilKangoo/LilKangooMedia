# Phase 18 local verification — 2026-11-09

Tests completed with headless Chromium and the existing site/bundle/service-detail rendering model, using realistic in-memory service data. No production Supabase write has been performed.

- PASS: all 7 services contain the proposed price data (33 new priced packages in SQL/JSON).
- PASS: 5 event packages + Custom quote rendered on service page.
- PASS: Within one event quote, 2h photo (€290) + 2h highlights film (€490) yields €780; alternative photo hours disabled.
- PASS: Separate custom-quote checkbox and text survive quote → request navigation.
- PASS: Submitted enquiry includes additional event package and special requirements.
- PASS: Social Media Management renders 16/24/48 posts per month for €250/€450/€950, plus Custom quote; subscriptions remain mutually exclusive.
- PASS: Fixed marketing consultation (€90) plus monthly ads management (€350/month) are displayed with separate billing frequencies.
- PASS: Phase 13 additional services remain selectable and appear in the combined estimate.
- PASS: 320 px mobile viewport without horizontal page overflow.
- PASS: no browser JavaScript exceptions in covered flows.
- PASS: node --check syntax on new JavaScript.

Limitations: tests use the public site code and a mock browser data source. Live Supabase RLS behavior, Netlify production deployment, actual email delivery, and business acceptance of final detailed deliverables must be checked by the owner after deployment. No automatic production SQL execution or GitHub commit was attempted.
