# LilKangooMedia — Phase 30.4: About Us, naprawa SPA + Graphite & Gold

## Dlaczego poprzednia poprawka nie zadziałała?

Istnieją dwie wersje About Us: statyczna `/AboutUs.html` oraz widok aplikacji `/#/about` generowany w `assets/lkm-v3/site.js`. Poprzednia poprawka 30.3 stylowała głównie `body.lkm-about-standalone`, którego widok `/#/about` nie ma. Dlatego na zrzutach nadal pozostały jasne/miętowe karty, słabo widoczne nagłówki oraz napis „LKM”.

Phase 30.4 obsługuje oba widoki. Nie edytujemy `site.js`, danych biznesowych ani nawigacji.

## Instalacja — dokładne lokalizacje

Rozpakuj ZIP i skopiuj **TRZY PLIKI** do repozytorium LilKangooMedia:

- `assets/lkm-v3/phase30-public.css` — **PODMIEŃ** istniejący.
- `assets/lkm-v3/phase30-public.js` — **PODMIEŃ** istniejący.
- `scripts/phase30_apply_theme.py` — **PODMIEŃ** istniejący.

Zachowaj kopię bieżących plików. Nie musisz kopiować README do repo.

Następnie GitHub Desktop → Changes (sprawdź wszystkie trzy ścieżki) → Commit → Push origin. Sprawdź Netlify → Deploys → status `Published`. Otwórz `https://lilkangoomedia.com/#/about` i odśwież przez Shift + Command + R.

## Oczekiwany rezultat

- Jednolity grafitowo-złoty motyw, bez starej jasnej/zielonej sekcji zespołu.
- Nagłówki Michael/Lilyanna i usług białe, opisy jasne, złote wyróżnienia.
- Karty wartości, osób i usług grafitowe z czytelnym kontrastem.
- Ostatni panel CTA grafitowo-złoty (zamiast zielonego).
- W okręgu w hero oryginalny `logo-profile.png` zamiast „LKM”.
- Delikatny `logo-orange.png` przesuwa się w tle SPA podczas przewijania w dół i w górę.
- Podstrona `/AboutUs.html` zachowuje poprawki 30.3; ten sam motyw obsługuje ją i aplikację `/#/about`.

## Co sprawdzić po wdrożeniu

1. `https://lilkangoomedia.com/#/about` — najważniejszy test. Sprawdź kolor zespołu, grafitowe karty i logo w kółku.
2. Przewiń w dół i w górę; dekoracyjny kangur nie może zasłaniać tekstu.
3. Kliknij Services, a następnie wróć na About Us: motyw About powinien być aktywny tylko na stronie About.
4. Sprawdź również `https://lilkangoomedia.com/AboutUs.html` oraz widok mobilny.
5. Jeśli nadal widzisz starą wersję, sprawdź w źródle opublikowanego `index.html`, że CSS i JS mają parametr `?v=30-4`. W logu Netlify musi wykonać się `scripts/phase30_apply_theme.py`.

## Testy przygotowania

- Parser CSS bez błędów; kontrola składni JS/Python.
- Skrypt Netlify poprawnie aktualizuje adresy CSS i JS do `30-4`, nie dubluje wpisów i nie dotyka admina.
- Testy Chromium odtworzonego widoku SPA: 320, 390, 768, 1024, 1440 px, bez poziomego przewijania, czytelne nagłówki, podmiana logo.
- Test nawigacji między widokami: przy wyjściu z About znika klasa motywu About.
- Test kangura: ruch w dół, powrót w górę, identyczna pozycja na początku.
- Lokalna kontrola kontrastu próbek kolorów WCAG AA: zaliczona.

Testy były wykonane na odtworzonym DOM ze stylami poprawki, a nie na zalogowanej/produkcyjnej stronie. Ostateczne potwierdzenie wymaga sprawdzenia opublikowanej witryny.

## SQL i rollback

SQL: NIEPOTRZEBNY. Supabase, płatności, formularze, ceny, SEO i treści pozostają bez zmian.

W razie problemów przywróć trzy poprzednie pliki (Phase 30.3) i wykonaj Commit / Push. Nie trzeba odtwarzać bazy danych.
