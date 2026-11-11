# LilKangooMedia — Phase 30.2 — Portfolio Graphite & Gold Hotfix

## Problem / przyczyna
Moduł `assets/lkm-v3/portfolio-stories.css` posiadał bardziej szczegółowe reguły CSS (selektory `#cmsPublic .lkm-ps-*`) z zielonymi wartościami. Wspólny motyw 30.0 nie nadpisywał ich na stronie `portfolio.html`.

## Instalacja
1. Zrób kopię bezpieczeństwa aktualnego `assets/lkm-v3/phase30-public.css` i `scripts/phase30_apply_theme.py`.
2. Wklej dwa pliki z tej paczki do folderu głównego repozytorium LilKangooMedia, zachowując ich ścieżki.
3. W GitHub Desktop potwierdź, że zmieniane są WYŁĄCZNIE `assets/lkm-v3/phase30-public.css` oraz `scripts/phase30_apply_theme.py`.
4. Wykonaj Commit / Push origin, a następnie sprawdź, czy Netlify osiąga `Published`.
5. W przeglądarce otwórz `https://lilkangoomedia.com/portfolio.html` oraz `https://lilkangoomedia.com/portfolio.html#/stories`. Odśwież `Shift + Command + R`.

## Co poprawiono
- `Stories behind the work`: nagłówek biały, opis jasny, link `View all stories` złoty.
- Przełącznik `Visual galleries` / `Stories behind the work`: grafit i złoto.
- Karty projektów, etykiety, statusy, komunikaty, odnośnik z galerii do story.
- Pojedyncze story `#/story/...`: hero, narracja, deliverables, galerie zdjęć, filmy, linki i kolor komunikatów.
- Odświeżenie query string motywu `v=30-2` także na stronach generowanych przez Netlify; odporność na wcześniejsze tagi.

## Czego nie zmieniono
Bez zmian w `portfolio.html`, `portfolio-stories.mjs`, `portfolio-stories.css`, adresach URL, panelu admina, Supabase, cenach i bazie danych. Nie ma migracji SQL.

## Co przetestować po deploy
- Portfolio: Visual galleries i Stories, na desktop i telefonie.
- `View all stories` nadal otwiera `#/stories`.
- Karta projektu nadal otwiera `#/story/<slug>` i czytelną zawartość.
- Formularze, admin i inne strony pozostają bez zmian.

Weryfikacja lokalna używa odtworzonych reprezentatywnych komponentów; nie zastępuje sprawdzenia autentycznych danych w środowisku produkcyjnym.
