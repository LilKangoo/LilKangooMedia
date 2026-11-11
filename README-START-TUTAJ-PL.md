# LilKangooMedia — Phase 29.2: Navy & Gold Homepage + Navigation

Paczka jest przeznaczona do strony działającej już na Phase 28.2 (czyli takiej jak na zrzutach z 11 listopada 2026). **Nie podmieniaj innych plików.**

## 1. Gdzie skopiować pliki

W lokalnym repozytorium projektu `LilKangooMedia` przejdź do:

`assets/lkm-v3/`

Skopiuj z ZIP dokładnie:

1. `assets/lkm-v3/phase28-catalog.js` — **PODMIEŃ** plik istniejący. Zachowuje wszystkie wcześniejsze zmiany Phase 28.2, dodaje tylko ładowanie nowego modułu Phase 29.2.
2. `assets/lkm-v3/phase29-home.js` — **DODAJ** nowy plik.
3. `assets/lkm-v3/phase29-home.css` — **DODAJ** nowy plik.

**Nie zmieniaj:** `site.js`, `site.css`, `index.html`, `service-detail-v14.js`, plików administracyjnych ani `reviews-public.js`.

## 2. Publikacja

1. Zrób kopię istniejącego `phase28-catalog.js` przed podmianą.
2. Skopiuj powyższe trzy pliki z zachowaniem folderów.
3. W GitHub Desktop sprawdź tylko te trzy zmienione/dodane pliki, wykonaj Commit oraz Push.
4. Poczekaj na status Published odpowiedniego wdrożenia Netlify.
5. Otwórz `https://lilkangoomedia.com/#/` i odśwież w Chrome: Shift + Command + R.

## 3. Co działa i co zostało zmienione

- Zachowane: hero z dwoma kafelkami Personal/Business, 4 zalety w białym pasku, 6 usług z Supabase, aktualne ceny, krótkie opisy, portfolio, prawdziwe recenzje, końcowe CTA, formularze, płatności, SEO i osobne strony usług.
- Hero: `CREATE. CAPTURE. GROW.` w zwięzłym układzie; podpis agencji na środku; mniejsze pionowe odstępy.
- Poniżej białego paska jedna spójna, granatowa powierzchnia z delikatnym statycznym bokeh.
- Kafelki Featured Services na Home: czarny fade zostaje zastąpiony granatowym. Katalog `#/services` pozostaje bez zmian.
- Sekcje: Find exactly..., Real moments..., Our work..., Words that matter..., Ready to create... są na tym samym tle, bez oddzielnych pasów.
- Logo: oryginalny plik **`/assets/lkm-v3/brand/logo-orange.png`** używany też w obecnej stopce; półprzezroczysty i przesuwany razem z przewijaniem w obie strony. Nie używamy „LK”. Przy `prefers-reduced-motion: reduce` animacja jest wyłączona.
- Menu: istniejące odnośniki pozostają bez zmian, dodana jest pozycja Home i rozwijany podział Services -> Personal / Business także w menu mobilnym. Źródłowe adresy pozostałych stron nie są przepisywane.

## 4. Kontrola po opublikowaniu

1. Home, desktop i mobile: nagłówek, białe zalety, 6 kafelków, 5 projektów portfolio, opinie i CTA.
2. Przewiń w dół i w górę: animowane **prawdziwe logo** pod treścią, płynny gradient bez nagłych pasów.
3. Otwórz menu i sprawdź: Home, Services, Personal, Business, For Business, Our Work, Reviews, Articles, About Us, Contact.
4. Kliknij usługę i wybierz pakiet — to wciąż istniejący proces z Phase 27/28, bez zmian.
5. Sprawdź także `https://lilkangoomedia.com/#/services?audience=business` i `...audience=personal` — nie powinny być wizualnie zmienione przez tę poprawkę.
6. Jeśli Chrome pokaże starszą wersję, użyj Shift + Command + R po zakończeniu publikacji.

## 5. SQL

**ŻADEN.** Nie zmieniamy Supabase ani baz danych. Nie uruchamiaj migracji SQL.

## 6. Przywrócenie poprzedniego wyglądu

Przywróć kopię `phase28-catalog.js` sprzed Phase 29.2, wykonaj Commit/Push. Nowe pliki `phase29-home.js` i `phase29-home.css` można pozostawić niewykorzystane lub skasować; bez ładowarki nie będą działać.

## 7. Sprawdzenia wykonane lokalnie

Testy w Chromium na **8 szerokościach**: 320, 375, 390, 430, 760, 1024, 1280, 1440 px. Obejmowały: strukturę i przenoszenie opóźnionego modułu opinii, brak odciętych pasów tła, gradient usług, niezmienione adresy nawigacji, podmenu desktop/mobile, zmianę transformacji logo podczas przewijania, brak JS pageerror i poziomego overflow w odtworzonym widoku.

**Uwaga:** są to testy lokalnego odtworzenia DOM z istniejących selektorów projektu. Rzeczywisty serwis i Supabase wymagają potwierdzenia po wdrożeniu. Nie została wykonana publikacja na produkcji.
