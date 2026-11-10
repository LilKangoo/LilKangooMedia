# LilKangooMedia — Phase 22.4: Business Solutions

Jedna paczka nakładkowa do istniejącego repozytorium `LilKangoo/LilKangooMedia`.
Przygotowana po Phase 22.3. **To nie jest kopia całego repozytorium:** podmień tylko pliki zawarte w ZIP-ie. Zachowaj katalogi.

## 1. Wdrożenie

1. Rozpakuj `LKM_22_4.zip` na komputerze.
2. Skopiuj **całą zawartość rozpakowanego ZIP-a**, nie sam folder ZIP, do katalogu głównego repozytorium na GitHub. Zgódź się na nadpisanie `index.html`, `home.html` oraz `scripts/phase20_rebuild_sitemap.py`.
3. Zapisz zmiany przyciskiem **Commit changes** (lub wyślij commit w swoim edytorze).
4. Poczekaj na **zakończenie** deployu Netlify i dopiero potem sprawdź nowe podstrony.

**Brak migracji SQL**, brak nowych tabel, brak zmian kluczy Stripe/Resend i brak zmian webhooków. Wszystkie ceny pozostają w istniejącym katalogu usług Supabase. Nowe zestawy to sugestie usług, nie fixed-price packages ani produkty Stripe.

## 2. Nowe strony

- https://lilkangoomedia.com/business-solutions.html — centralny katalog B2B
- https://lilkangoomedia.com/business-restaurants.html — restauracje i kawiarnie
- https://lilkangoomedia.com/business-hotels.html — hotele i noclegi
- https://lilkangoomedia.com/business-retail.html — retail i e-commerce
- https://lilkangoomedia.com/business-brands.html — marki i inne firmy

W nagłówku i stopce głównego `index.html` / `home.html` dodano link **For Business / Business Solutions**. Podstrony mają odrębny tytuł, opis i canonical. Generator sitemap po deployu dopisuje nowe istniejące strony (oraz `case-studies.html`), zachowując wcześniejsze reguły filtrowania.

## 3. Jak działają oferty

Na stronach branżowych pokazujemy trzy **proponowane kombinacje** opublikowanych usług. Nazwy usług pochodzą z istniejącej tabeli `services` przez `LKMStore.publicServices()`. Ukryte, nieaktywne lub prywatne usługi nie są przedstawiane w zestawach. Kliknięcie **Request this mix** zaznacza odpowiednie usługi w formularzu.

Nie dodano nowych cenników, deklaracji rabatów, fikcyjnych projektów, wyników ani opinii.

## 4. Formularz zapytania B2B

Klient podaje imię, e-mail, firmę, cel projektu, a opcjonalnie lokalizację, telefon, terminy, zainteresowane usługi i orientacyjny budżet. Wysyłka trafia do **istniejącego** `/api/enquiry` (Netlify), typu `business_enquiry`, a nie do Stripe. Brief jest zapisywany w `contact_leads` (kolumna `message`) i dostępny w panelu **Enquiries & bookings**. Resend wysyła powiadomienie tylko wtedy, gdy istniejąca integracja działa. Mechanizm `request_id` chroni przed przypadkowym duplikatem przy ponowieniu tej samej wiadomości.

- Zgłoszenie **nie** pobiera płatności.
- Zgłoszenie **nie** potwierdza rezerwacji.
- Strona **nie** robi refundów: ewentualne zwroty nadal wyłącznie w aplikacji Stripe.
- Jeżeli skonfigurowano po stronie serwera `TURNSTILE_SECRET`, formularz wymaga również poprawnego, publicznego `TURNSTILE_SITE_KEY` w `lkm-config.js`, zgodnie z dotychczasową konfiguracją wszystkich formularzy.

## 5. Co sprawdzić po deployu (krótka lista)

1. Wejdź na https://lilkangoomedia.com/ i sprawdź nowy link **For Business** na komputerze oraz telefonie.
2. Otwórz każdą z 5 nowych stron. Sprawdź, czy są czytelne i czy linki między branżami prowadzą na właściwe adresy.
3. Na stronie restauracji kliknij **Request this mix**. Powinien przewinąć do formularza i zaznaczyć rzeczywiście aktywne usługi (np. fotografię produktową, filmy), jeśli istnieją w CMS.
4. Sprawdź, czy żadne ceny nie są nadpisane. Kliknięcie nazwy usługi powinno prowadzić na jej aktualną stronę i prawdziwą konfigurację.
5. Wyślij **jedno oznaczone zgłoszenie testowe** (np. w polu firma: `TEST - Phase 22.4`, w opisie: `To jest tylko test formularza`). Sprawdź w `https://lilkangoomedia.com/admin.html#leads`, czy zapisano właściwy sektor, firmę i zakres, oraz czy dotarł e-mail Resend, jeżeli jest skonfigurowany. Po teście oznacz lub usuń testowe zgłoszenie zgodnie z obecną procedurą administratora.
6. Otwórz `https://lilkangoomedia.com/sitemap.xml` i znajdź nowe adresy `business-*.html`.

**Pełny audyt produkcyjny**, w tym bezpieczeństwo, wydajność, Stripe, Supabase, rezerwacje i SEO, wykonamy po zakończeniu Phase 25, zgodnie z ustaloną roadmapą. Lokalny test przeglądarki jest odizolowany i nie oznacza zweryfikowania strony produkcyjnej.

## 6. Testy techniczne

- `node --test tests/phase22-business-solutions.test.mjs` — 14 testów z prawdziwymi plikami tej paczki, bez połączenia z siecią.
- `python3 tests/test_phase22_business_sitemap.py` — próba generatora sitemap w tymczasowym katalogu.
- `python3 tests/test_phase22_business_browser.py` — odizolowany Chromium z syntetyczną listą usług i symulowanym sukcesem zapytania; NIE korzysta z prawdziwego `/api/enquiry`.

## 7. Pliki paczki

- `index.html` i `home.html`: nowe linki nawigacji, z zachowaniem dotychczasowych assetów Phase 19–22.3
- `business-solutions.html`, `business-restaurants.html`, `business-hotels.html`, `business-retail.html`, `business-brands.html`
- `assets/lkm-v3/business-data.mjs`: jawnie oznaczone sugestie kombinacji i bezpieczna logika danych
- `assets/lkm-v3/business-solutions.mjs`: dynamiczne opcje z Supabase i formularz `/api/enquiry`
- `assets/lkm-v3/business-solutions.css`: responsywny design
- `scripts/phase20_rebuild_sitemap.py`: dopisanie publicznych stron do istniejącej mapy
- `tests/*`: testy
- `README-START-TUTAJ-PL.md`: ta instrukcja

## Następne etapy

Phase 23 — CRM, oferty PDF i follow-upy; Phase 24 — panel klienta; Phase 25 — PL/EN, SEO usług i optymalizacja konwersji; Final Audit na końcu.
