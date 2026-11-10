# LilKangooMedia — Phase 22.2 (Real Client Reviews & Trust)

## Instalacja (bez edycji kodu)

1. Rozpakuj ten jeden plik ZIP.
2. Wgraj jego zawartość do głównego folderu repozytorium GitHub `LilKangoo/LilKangooMedia`, zachowując ścieżki katalogów. Pliki `index.html` i `home.html` zastępują obecne wersje — przygotowano je na podstawie rzeczywistego stanu GitHub po Phase 22.1.
3. W GitHub wybierz **Commit changes**.
4. Po publikacji Netlify, wejdź na dowolną stronę szczegółów usługi, np. `https://lilkangoomedia.com/#/service/portrait-photography`.

Nie trzeba uruchamiać SQL, konfigurować nowego API ani modyfikować czegokolwiek ręcznie. Zmiany w Stripe/Netlify/Supabase nie są wymagane.

## Co zmienia się po wdrożeniu

- Na stronach usług pojawia się sekcja „What clients say about LilKangooMedia”.
- Dane pobierane są z już istniejącego publicznego archiwum `lkm_reviews` w Supabase z filtrem `visible=true`.
- Maksymalnie trzy **rzeczywiście opublikowane opinie z tekstem** są wyświetlane z oceną, autorem i źródłem.
- Opinie oznaczone jako przetłumaczone albo redagowane dla strony mają stosowną etykietę.
- Sekcja wyraźnie wyjaśnia, że są to **opinie o firmie**, niekoniecznie o konkretnej usłudze.
- Można przejść do `/reviews.html`, firmowego profilu Google i konfiguratora usługi `#/quote`.
- Jeśli baza opinii jest pusta/niedostępna, zamiast wymyślonych opinii pokazywany jest komunikat i odsyłacze.
- Phase 22.1 Portfolio, bieżąca nawigacja i CTA, Stripe, kalendarz i formularze pozostają bez zmian.

## Co zawiera paczka

- `index.html` — oryginalna obecna strona z dodanym odnośnikiem do skryptu i CSS 22.2.
- `home.html` — analogiczna aktualizacja drugiej strony startowej.
- `assets/lkm-v3/phase22-trust-reviews.js` — nowa, izolowana logika sekcji opinii.
- `assets/lkm-v3/phase22-trust-reviews.css` — styl mobilny i desktopowy.
- `tests/phase22-trust.test.mjs` — testy bez zmian w systemie produkcyjnym.
- ten plik README.

## Testy wykonane lokalnie

- `node --check assets/lkm-v3/phase22-trust-reviews.js` — poprawna składnia.
- `node --test tests/phase22-trust.test.mjs` — 6 testów PASS.
- Kontrola integralności ZIP i zgodności z HTML Phase 22.1.
- Osobny test Chromium nie ukończył się z powodu problemu uruchomienia przeglądarki w środowisku testowym; nie traktuj tego jako potwierdzenia wyglądu na produkcji.

## Plan po tym etapie

- Phase 22.3: opisy rzeczywistych case studies — bez wymyślania wyników i nazw klientów.
- Phase 22.4: dedykowane sekcje i strony dla branż.
- Phase 23: CRM, oferty, follow-upy.
- Phase 24: panel klienta i dostarczanie plików.
- Phase 25: PL/EN, indeksowalne podstrony usług i konwersja.
- Na koniec wszystkich etapów: pełne testy produkcyjne end-to-end (Netlify, Supabase, Stripe, SEO, formularze, responsywność).

**Zasada:** Refundacje i zwroty środków wykonywane są wyłącznie w Stripe, nigdy z panelu strony.
