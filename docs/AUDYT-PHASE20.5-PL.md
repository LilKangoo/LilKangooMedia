# Phase 20.5 — wyniki audytu

## Potwierdzony stan repozytorium przed poprawką
- `sitemap.xml`: wpisy z datą `lastmod` 2024-02-03; stare przyjazne ścieżki; generator `scripts/build_articles.py` dopisywał nowe wpisy, nie usuwał historycznych.
- `robots.txt`: tylko `User-agent: *` i `Allow: /`, bez wpisu Sitemap.
- `index.html` / `home.html`: tylko podstawowe `og:title` i `og:image`; canonical `/`; GA4 i zgoda na cookies były już wdrożone.
- `portfolio.html` / `blog.html`: canonical istnieją, ale brakowało META Open Graph dla udostępnienia.
- Katalog usług: odsyłacze `/#/service/...` — nie są odpowiednim fundamentem indywidualnego indeksowania podstron według Google Search Central.

## Zakres tej zmiany
Bezpieczne META + JSON-LD, wskazówki pobierania zasobów, automatyczny sitemap po dotychczasowym buildzie artykułów. Nie ma migracji routingu, nie ma zmian danych, brak redirectów SEO.

## Co pozostaje do audytu po deployu
- Search Console: stan indeksowania i wybrane canonical.
- PageSpeed/Lighthouse na realnej domenie, urządzeniu i sieci.
- Faktyczna dostępność historycznych przyjaznych URL-i Netlify.
- Per-service landing pages bez hash routingu (osobny etap).

Źródła standardów: Google Search Central — URL Structure, Build and Submit a Sitemap, JavaScript SEO; web.dev — Optimize LCP.
