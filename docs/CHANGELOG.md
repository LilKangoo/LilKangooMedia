# Phase 7 — changes

## Edited production files

- `assets/lkm-v3/admin.js` — full-width accordion service editor; unsaved edit guard; flexible per-package pricing models; dynamic min/max/quantity fields; recurring contract/setup metadata; independently chargeable extras; package reordering; preserved package IDs/legacy metadata; arbitrary service categories; checkout guard.
- `assets/lkm-v3/admin-unified.css` — full-width responsive accordion UI and pricing controls.
- `assets/lkm-v3/site.js` — compatible public pricing display, unit selector, estimated price breakdown, recurring pricing notes, quantity and estimated amount included in standard Netlify enquiries; prevents unsupported direct checkout.
- `assets/lkm-v3/site.css` — public unit input and estimated price presentation.

## Unchanged

No Supabase SQL, `index.html`, `home.html`, `admin.html`, media files, photos, gallery templates, blog pages, Netlify Functions or secrets are included. Price fields are stored inside existing JSONB arrays.
