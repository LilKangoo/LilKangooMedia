# Phase 12 — Testy

- `node --check assets/lkm-v3/video-admin.js` — PASS
- Chromium + mock Supabase: 7 testów: utworzenie sekcji, lista filmów, zaznaczanie, insert, blokada duplikatów, odłączenie filmu, dodanie YouTube URL — PASS
- Chromium + `site.js` w wersji obecnie dostępnej w GitHubie: publiczny film przypisany do `service_slug` wyświetla się na stronie usługi, miniatura otwiera odtwarzacz — PASS
- Prawdziwej bazy Supabase, publikacji na Netlify i konta YouTube **nie dotykano**.
