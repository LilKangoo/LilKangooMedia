# LilKangooMedia — PHASE 30.1 — naprawa błędu Netlify Deploy

## Dokładna przyczyna

W logach Netlify: `python3: can't open file '/opt/build/repo/scripts/phase30_apply_theme.py': [Errno 2] No such file or directory`.

Sprawdzono aktualne repozytorium GitHub `LilKangoo/LilKangooMedia`:
- `netlify.toml` istnieje i poprawnie wywołuje ten skrypt;
- `assets/lkm-v3/phase30-public.css` już istnieje;
- `assets/lkm-v3/phase30-public.js` już istnieje;
- BRAKUJE WYŁĄCZNIE `scripts/phase30_apply_theme.py`.

Ten ZIP zawiera brakujący skrypt odtworzony z zatwierdzonej paczki 30.0. Nie zmieniaj innych plików.

## Instalacja — wykonaj dokładnie w tej kolejności

1. Rozpakuj `LKM_30_1_Deploy_Fix_Missing_Build_Script.zip`.
2. Otwórz *główny folder* lokalnego projektu LilKangooMedia (ten zawierający folder `scripts` i plik `netlify.toml`).
3. Z rozpakowanego ZIP skopiuj plik `scripts/phase30_apply_theme.py` do **istniejącego** folderu `scripts` Twojego projektu.
4. Docelowa ścieżka w repozytorium ma wyglądać dokładnie tak:

   `LilKangooMedia/scripts/phase30_apply_theme.py`

   **NIE** `LilKangooMedia/assets/scripts/...`, **NIE** `LilKangooMedia/scripts/scripts/...` i **NIE** `LilKangooMedia/phase30_apply_theme.py`.

5. Otwórz GitHub Desktop i upewnij się, że zakładka **Changes** pokazuje nowy plik `scripts/phase30_apply_theme.py`. Jeśli go tam nie ma, skopiowano go do niewłaściwego folderu lub wybrano inne repozytorium.
6. Wpisz commit message: `Fix Phase 30 Netlify build — restore missing theme script`.
7. Kliknij **Commit to main** (lub nazwę aktualnego branch), następnie **Push origin**.
8. Potwierdź na GitHub, że plik widnieje w folderze `scripts/` na gałęzi używanej do deploymentu Netlify.
9. W Netlify otwórz Deploys i sprawdź nowy deploy. Powinien zakończyć się statusem **Published**. Jeśli nowy deploy nie wystartuje automatycznie, uruchom go z panelu Netlify.

## Co powinno pojawić się w logach

Po komendach `build_articles.py`, `build_service_pages.py` i `phase20_rebuild_sitemap.py` powinieneś zobaczyć:

`LKM Phase 30: checked ... HTML files, updated ..., skipped ... legacy/private templates.`

Potem status `Published`. Liczby mogą się różnić zależnie od liczby wygenerowanych stron.

## Po sukcesie

Sprawdź:
- Home: https://lilkangoomedia.com/
- Services: https://lilkangoomedia.com/#/services
- Business: https://lilkangoomedia.com/business-solutions.html
- Portfolio: https://lilkangoomedia.com/portfolio.html
- Articles: https://lilkangoomedia.com/blog.html
- Recenzje: https://lilkangoomedia.com/reviews.html
- SEO service page: https://lilkangoomedia.com/services/commercial-video-reels.html

Motyw ma poprawnie dołączać na tych publicznych stronach. Home 29.6 ma zachować swój dotychczasowy wygląd. Panel admina i portal klienta nie są zmieniane.

## SQL / rollback

SQL: NIE JEST POTRZEBNY. Nie zmieniamy Supabase. Zmiana jest addytywna: jedynie nowy plik w `scripts/`.

W razie problemu cofnij commit dodający ten skrypt, ale pamiętaj, że wtedy Netlify znów nie zbuduje strony, dopóki `netlify.toml` nadal go wywołuje. Nie usuwaj skryptu bez jednoczesnego usunięcia wywołania z konfiguracji.

## Weryfikacja wykonana przed spakowaniem

- Skrypt `python3 -m py_compile` — PASS.
- Dziewięć reprezentatywnych szablonów publicznych — PASS.
- Wykluczenie sześciu szablonów legacy/admin/client — PASS.
- Alias `Reviews.html` -> `reviews.html` — PASS.
- Powtórne uruchomienie bez dublowania kodu — PASS.

To są lokalne testy skryptu, nie potwierdzenie ukończonego wdrożenia produkcyjnego.
