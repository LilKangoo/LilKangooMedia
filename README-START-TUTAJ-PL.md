# LilKangooMedia — Phase 29.6: MATTE GRAPHITE & GOLD

Pakiet zbudowany na bazie LKM 29.5 (Kangaroo Larger, More Centered) i zweryfikowany względem bieżących plików GitHub `LilKangoo/LilKangooMedia` z 11.11.2026.

## Co zmienia pakiet

- Na stronie głównej zamienia granatowy motyw na neutralny, matowy grafitowy gradient z subtelnym ciepłym złotym bokeh.
- Dopasowuje kolory hero, panelu Personal / Business, kafelków ofert, panelu Real moments, ram portfolio, ocen i opinii, końcowego CTA i stopki.
- Przyciski i ceny pozostają złote; teksty są jasne i kontrastowe.
- Zachowuje BIAŁY pasek „Based in Cyprus ...” oraz białą nawigację.
- Nie zmienia oryginalnego logo kangura ani jego pozycji, rozmiaru i przewijania z Phase 29.5.
- Nie modyfikuje cenników, pakietów, zdjęć, usług, Supabase ani procesu zapytań.

Kolory we wspólnym nagłówku nawigacji są też neutralne zamiast granatowych. Pozostałe podstrony (w szczególności Services, panel admin i formularze) nie otrzymują nowego tła.

## Instalacja ręczna

1. Upewnij się, że masz wdrożoną wersję LKM 29.5.
2. Rozpakuj ZIP na Macu.
3. W lokalnym repozytorium `LilKangooMedia` otwórz folder `assets/lkm-v3/`.
4. Zrób kopię obecnych dwóch plików, następnie **podmień**:
   - `assets/lkm-v3/phase29-home.css`
   - `assets/lkm-v3/phase28-catalog.js`
5. Nie usuwaj ani nie podmieniaj `phase29-home.js`, `service-detail-v14.js`, `site.js`, `site.css`, `index.html`, danych ani innych plików.
6. W GitHub Desktop: sprawdź zmiany, Commit, Push.
7. Sprawdź ukończony deploy na Netlify (status Published).
8. Odwiedź https://lilkangoomedia.com/ i użyj `Shift + Command + R`.

`phase28-catalog.js` zawiera wyłącznie zmianę wersji adresu stylu Home z `?v=29-5` na `?v=29-6` oraz komentarza. To wymusza pobranie świeżej wersji arkusza bez zmieniania działania katalogu.

## Kontrola po wdrożeniu

1. Hero: matowy ciemny grafit, złoty GROW; fotografie i linki działają.
2. Biała belka `Based in Cyprus` nadal jest biała.
3. `Find exactly what you need`: kafle mają grafitowy fade, nie granatowy.
4. `Real moments`: grafitowa karta i czytelny przycisk.
5. `Our work speaks visually`: zdjęcia i podpisy są czytelne.
6. `Words that matter`: grafitowe karty, widoczne gwiazdki i linki opinii.
7. `Ready to create something` i stopka: ten sam matowy, neutralny motyw.
8. Kangur: ten sam oryginalny obraz i ruch z Phase 29.5 podczas scrollowania w obu kierunkach.
9. Sprawdź Home na telefonie, a także `#/services`, otwarcie usługi i wysłanie testowego zapytania bez finalnego submit, aby potwierdzić, że formularz pozostał nietknięty.

## Testy wykonane

- Parsowanie CSS: 149 reguł, bez błędów.
- `node --check` dla zmienionego JS: OK.
- W odtworzonym widoku Chromium: 8 rozmiarów (320, 360, 390, 480, 760, 960, 1280, 1440 px), brak poziomego przewijania w fixture; kontrast tekstu nagłówków kart około 16.3:1, tekstu recenzji około 12.2:1 (na bazowych powierzchniach). To test stylów na odtworzonym widoku, **nie test autoryzowanej produkcyjnej strony**.

## SQL

**Brak.** Nie wykonuj migracji Supabase.

## Cofnięcie

Przywróć oba pliki z kopii LKM 29.5, następnie Commit/Push i odśwież stronę.
