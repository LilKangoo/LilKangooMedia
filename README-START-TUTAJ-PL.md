# LilKangooMedia — Phase 20.1: Conversion & Quick Enquiry

## Co jest w tej aktualizacji

- Przycisk „Quick enquiry” na każdej karcie usługi (Personal i Business).
- Szybki formularz otwierany bez opuszczania katalogu. Automatycznie przypisuje service_slug i korzysta z istniejącej funkcji POST /api/enquiry, bazy contact_leads, powiadomień Resend i istniejącego Turnstile (jeśli skonfigurowany).
- Mobilny, przyklejony pasek na szczegółach usługi: „Configure package” (dotychczasowa wycena) i „Ask a question” (szybki formularz).
- Zdarzenia GA4: lkm_quick_enquiry_open oraz generate_lead, wysyłane tylko po udzieleniu zgody na Analytics.
- Bez zmian w bazie danych, tabelach, cenach, pakietach, checkout Stripe, adminie, artykułach, meta i przekierowaniach SEO.

## Instalacja w GitHub

1. Otwórz repozytorium `LilKangoo/LilKangooMedia`.
2. Rozpakuj ZIP i **skopiuj cztery pliki** do tej samej struktury katalogów, nadpisując tylko istniejące `index.html` i `home.html`:
   - `index.html`
   - `home.html`
   - `assets/lkm-v3/phase20-conversion.js` (nowy plik)
   - `assets/lkm-v3/phase20-conversion.css` (nowy plik)
3. Najlepiej zapisz zmiany w osobnej gałęzi i utwórz pull request; jeśli korzystasz z głównej gałęzi, dopilnuj, aby repo było aktualne.
4. Po zakończonym deployu Netlify odśwież stronę skrótem `Cmd + Shift + R`.

**Ważne:** indeks został oparty dokładnie na pliku GitHub `main` w momencie przygotowania paczki (blob SHA `625e21862a0ee2bc143ed204d5dc033bd83fb199`); jeśli od tego czasu zmieniłeś stronę główną, nie nadpisuj jej w ciemno. Dodaj do aktualnego `index.html` i `home.html` tylko dwie linie tuż przed `</head>`:

```html
<link rel="stylesheet" href="/assets/lkm-v3/phase20-conversion.css">
<script defer src="/assets/lkm-v3/phase20-conversion.js"></script>
```

## Testy po deployu (5 minut)

1. Otwórz `https://lilkangoomedia.com/#/services?audience=personal`. Na kartach powinien być „Quick enquiry”.
2. Kliknij go i sprawdź, czy formularz pokazuje właściwą nazwę usługi.
3. Wyślij testowe zapytanie z własnym e-mailem i słowem `TEST` w treści (minimum 6 znaków). **Nie wysyłaj danych prawdziwego klienta na etapie testowym.**
4. Sprawdź nowy rekord w Supabase `contact_leads` (`submission_type = quick_enquiry`, poprawny `service_slug`) oraz e-mail z Resend.
5. Na telefonie otwórz szczegóły usługi i sprawdź dolny pasek. „Configure package” powinno otworzyć istniejącą wycenę, a „Ask a question” — szybki formularz.
6. Sprawdź, czy użytkownik bez zgody analytics nie uruchamia zdarzeń GA4.
7. Sprawdź zwykły formularz, konfigurator i galerię, żeby potwierdzić brak regresji.

## Przywrócenie poprzedniej wersji

Usuń z `index.html` i `home.html` dwie powyższe linie (`phase20-conversion`), albo przywróć poprzedni commit/deploy w Netlify. Pliki JS/CSS mogą pozostać w repo bez wpływu na stronę, jeśli nie są dołączone w HTML.

## Weryfikacja techniczna

- `node --check assets/lkm-v3/phase20-conversion.js` — PASS.
- Porównanie oryginalnego `index.html` z bazą GitHub po odjęciu dwóch linijek — identyczny blob SHA.
- Lokalny browser smoke test Chromium nie powiódł się z powodu ograniczeń środowiska; działania produkcyjnego nie uznajemy za przetestowane przed sprawdzeniem w Netlify.
- Nie wykonywano z tego środowiska żadnych operacji na działającej bazie Supabase ani produkcyjnych płatności.

## Następne etapy

Phase 20.2 — analityka całego lejka, uproszczenie komunikatów błędów i pomiar mobilnego CTA.
Phase 21 — kalendarz i potwierdzanie terminów, serwerowe walidacje Stripe i dopłaty/zadatek.
Phase 22 — przypisanie portfolio/opinii do usług i landing pages branżowe.
Phase 23–25 — wyceny PDF, automatyzacja, panel klienta, rozbudowa SEO/PL/EN oraz optymalizacja na podstawie danych.
