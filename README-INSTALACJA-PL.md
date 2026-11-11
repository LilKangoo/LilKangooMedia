# LilKangooMedia — Phase 30.3 — About Us Matte Graphite & Gold

## Co jest poprawione
- Cała strona About Us: sekcja hero, Our Approach, Michael i Lilyanna, What We Do, CTA i stopka w jednolitym motywie Matte Graphite & Gold.
- Białe nagłówki, jasne opisy, złote wyróżnienia i przyciski o właściwym kontraście.
- Dawny okrąg z napisem „LKM” pokazuje prawdziwe logo LilKangooMedia z `/assets/lkm-v3/brand/logo-profile.png`. Podczas buildu Netlify skrypt dodatkowo podmienia stare znaczniki HTML na obrazek logo.
- Zachowane oryginalne fotografie, treści, linki, galeria, nawigacja Phase 30, formularze i baner zgód.
- Oryginalny animowany kangur z Phase 30 pozostaje pod sekcjami. Lekka animacja pojawiania się treści (również podczas przewijania w górę) jest ograniczona do About Us i respektuje preferencję ograniczenia ruchu.

## Instrukcja instalacji
1. Upewnij się, że Phase 30.2 (Portfolio Fix) działa i skrypt `scripts/phase30_apply_theme.py` jest już w repozytorium.
2. Rozpakuj ZIP do katalogu projektu LilKangooMedia, zachowując strukturę folderów.
3. Podmień dwa pliki i dodaj jeden nowy:
   - `assets/lkm-v3/phase30-public.css`
   - `scripts/phase30_apply_theme.py` (podmień)
   - `assets/lkm-v3/phase30-about.js` (dodaj)
4. Zrób Commit + Push origin w GitHub Desktop.
5. Sprawdź w Netlify, czy deploy ma status **Published**.
6. Otwórz `https://lilkangoomedia.com/AboutUs.html`, wykonaj Shift + Command + R i sprawdź na desktop i telefonie.

Nie podmieniaj `site.css`, `phase30-public.js`, `AboutUs.html`, `About Us.html`, `index.html` ani `netlify.toml`. Zmiany w HTML wykonuje obecny skrypt buildu i dotyczy to wyłącznie okręgu logo.

## Sprawdzenie po deploy
- Hero i prawdziwe logo zamiast tekstu LKM.
- Zespół i 4 karty usług bez zielonych/jasnych tłowych bloków.
- Menu mobilne rozwija się prawidłowo.
- CTA prowadzi do istniejących adresów, a formularz i polityka cookies działają.
- Kangur pozostaje w tle na całej stronie i przy przewijaniu.

SQL: niepotrzebny. Nie zmieniano Supabase, cen, linków, klientów ani panelu admina.

## Cofnięcie
Przywróć dwie kopie poprzednich plików Phase 30.2 i usuń `phase30-about.js`, wykonaj Commit/Push i redeploy.
