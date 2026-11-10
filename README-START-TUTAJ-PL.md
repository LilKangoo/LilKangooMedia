# LilKangooMedia — Phase 20.5: SEO & Performance

**Instaluj po Phase 20.4.** Paczka powstała na bazie `index.html` oraz `home.html` z Phase 20.4 i zachowuje wszystkie wcześniejsze skrypty (`phase20-conversion`, `phase20-funnel`, `phase20-ux`, `phase20-reliability`).

## Co zostało poprawione

1. **Sitemap:** po obecnym `scripts/build_articles.py` Netlify uruchamia `scripts/phase20_rebuild_sitemap.py`. Skrypt odbudowuje mapę na podstawie publicznego `articles-index.json` i istniejących historycznych stron, usuwa oczywiste martwe linki i powtarzające się wpisy strony głównej. Nie zmienia artykułów ani ich adresów. Nie publikuje roboczych wpisów Supabase.
2. **Aktualne dane:** z mapy usuwane są niezweryfikowane `lastmod` z 2024 r. Daty znaczących zmian będziemy uzupełniać tylko na podstawie rzeczywistych danych.
3. **robots.txt:** dodaje `Sitemap: https://lilkangoomedia.com/sitemap.xml`, zachowując ogólne `Allow: /`.
4. **Homepage:** Open Graph `description`, `url`, `site_name`, alternatywny opis zdjęcia i Twitter/X card. Bez duplikowania tagu canonical.
5. **Portfolio / blog:** dodaje własne Open Graph i Twitter/X card oraz prawidłowe canonical, zachowując istniejącą zawartość, CMS, Analytics i menu.
6. **JSON-LD:** uporządkowane dane o LilKangooMedia jako `ProfessionalService`: prawdziwe kontakty, strona, oficjalne profile i obszar działania — Cypr. Nie deklaruje nieistniejącej siedziby, ocen ani niepotwierdzonej ceny.
7. **Szybkość startu:** preconnect do Google Fonts i warunkowy `preload` pierwszego dużego zdjęcia strony głównej. Preload nie jest aktywny przy wejściu od razu na inne widoki `/#/...`.

**Nie zmieniamy:** Supabase, Stripe, Resend, schema DB, parametrów płatności, panelu admina, opinii, adresów starych artykułów, galeríi, Netlify Functions ani wszystkich modułów wcześniejszych Phase 20.

## Instalacja — FULL (polecana, jeżeli przed chwilą wgrałeś 20.4)

1. Sprawdź Netlify → Deploys: **Phase 20.4 = Published**.
2. Rozpakuj ZIP `LilKangooMedia_Phase20_5_SEO_PERFORMANCE_FULL.zip`.
3. Przenieś z paczki do odpowiednich miejsc w repozytorium `LilKangoo/LilKangooMedia`:
   - `index.html`
   - `home.html`
   - `blog.html`
   - `portfolio.html`
   - `robots.txt`
   - `netlify.toml`
   - `scripts/phase20_rebuild_sitemap.py` (**nowy**)
   - `tests/test_phase20_5.py` (opcjonalne testy)
4. **Nie usuwaj** `scripts/build_articles.py` ani żadnych starych plików.
5. Zrób Commit changes. Netlify powinien uruchomić polecenie:
   `python3 scripts/build_articles.py && python3 scripts/phase20_rebuild_sitemap.py`.
6. Po statusie **Published** otwórz `/sitemap.xml`, `/robots.txt`, `/portfolio.html`, `/blog.html`, `/` i sprawdź, czy ładują się prawidłowo.

**Ważne:** nie wgrywamy ręcznie `sitemap.xml` z paczki. Tworzy się automatycznie w czasie builda, w oparciu o *aktualną* bazę opublikowanych artykułów. Ręczna statyczna mapa szybko stałaby się nieaktualna.

## Wariant CORE PATCH, jeżeli ręcznie edytowałeś HTML

Paczka `LilKangooMedia_Phase20_5_SEO_SITEMAP_CORE_PATCH.zip` zawiera tylko `robots.txt`, nowy generator sitemap i testy. W swoim aktualnym `netlify.toml` zmień **tylko** komendę `build.command`, zachowując inne ustawienia:

**Przed:** `python3 scripts/build_articles.py`

**Po:** `python3 scripts/build_articles.py && python3 scripts/phase20_rebuild_sitemap.py`

Dodatkowe META / JSON-LD / preload możesz scalić ręcznie z odpowiednich czterech HTML z FULL. CORE PATCH bez takiego scalenia poprawia **tylko sitemap i robots.txt**, a nie META/szybkość.

## Test po instalacji

1. **Build Netlify:** log powinien zawierać `Phase 20.5: sitemap has ... URLs`. Jeśli budowa się nie uda, skopiuj fragment logu. Nie publikuj wadliwej wersji.
2. **Sitemap:** otwórz `https://lilkangoomedia.com/sitemap.xml`. Sprawdź, czy występują artykuły; nie powinno być starych dat 2024 i pustych adresów.
3. **Google Search Console:** dodaj/prześlij sitemap `https://lilkangoomedia.com/sitemap.xml`, a później sprawdź indeksowanie, canonical i stan artykułów. Samo przesłanie nie gwarantuje indeksacji.
4. **Linki usług:** sprawdź bezpośrednie wejścia do `/#/services` i kilku `/#/service/...`, Quick Enquiry, formularz, portfolio i blog. `/#/service/...` **nadal nie jest osobną indeksowalną stroną** — wymaga kolejnej fazy z adresami URL bez `#`.
5. **Wydajność:** porównaj PageSpeed Insights na telefonie przed/po na `/`, `/portfolio.html` i `/blog.html`. Ta paczka daje optymalizacje pobierania zasobów, ale bez rzeczywistego pomiaru nie deklarujemy poprawy LCP w milisekundach.
6. **Social sharing:** sprawdź Open Graph w udostępnieniu `/`, `/portfolio.html`, `/blog.html`. Do udostępnienia usług nadal używaj istniejących `/share/service/:slug`.

## Testy lokalne

`python3 -m unittest discover -s tests -p test_phase20_5.py -v`

7 testów: generowanie, powtarzalność, brak manifestu, błędny XML, bezpieczeństwo URL, zgodność z Phase 20.4, META i Netlify. Sprawdzono także 11 testów backendu formularza z Phase 20.4. **Nie przeprowadzono testu rzeczywistego deployu ani Chrome/Lighthouse w tym środowisku**.

## Cofnięcie zmian

Przywróć poprzedni działający deploy Netlify lub przywróć stare `netlify.toml`, `robots.txt`, `index.html`, `home.html`, `blog.html`, `portfolio.html`. Sam nowy skrypt nie działa bez odwołania w `netlify.toml`. Nie wymaga wycofywania SQL.

## Następny etap

Phase 21 — zatwierdzanie dostępności i płatności; osobnym zadaniem SEO będzie przygotowanie realnych stron usług z adresami bez `#` i unikalnym META, bez łamania historycznych linków.
