# LilKangooMedia — Phase 17: Google Reviews (bez Google Cloud)

## Co jest gotowe

- **121 autentycznych Google ratings**, potwierdzonych z 7 dostarczonych plików JSON Google Takeout (wszystkie 5 gwiazdek).
- **91 opinii z tekstem** (72 już zawierają angielskie tłumaczenie Google), **30 samych ocen gwiazdkowych**.
- Każda opinia zachowuje źródłowego autora, oryginalne gwiazdki, datę, angielskie brzmienie, tekst oryginalny i — jeśli istnieje — odpowiedź firmy.
- Sekcja karuzeli na **stronie głównej po portfolio, przed końcowym CTA**.
- Nowa **`/reviews.html`** z wszystkimi opublikowanymi opiniami, wyszukiwaniem, filtrem (tekst / gwiazdki), paginacją i linkami do Google Maps.
- Nowy **`/admin-reviews.html`**, dostępny z zakładki **Customer reviews** w istniejącym `/admin.html`.
- Admin: dodawanie, edycja angielskiego tekstu, publikowanie/ukrywanie, wyróżnianie, usuwanie, kolejność, import kolejnych JSON z Google Takeout (bez duplikatów). Autora, ocenę, datę i tekst źródłowy importowanych opinii celowo chronimy przed zmianą.
- SQL RLS: odczyt opublikowanych wpisów publiczny, edycja tylko dla autoryzowanych administratorów LilKangooMedia.
- Brak Google Cloud, Google API, abonamentów na widget i kluczy prywatnych w kodzie.

## DWA RÓŻNE PLIKI DO POBRANIA

**1. `LilKangooMedia_Phase17_Google_Reviews_CODE.zip` — kod publicznej strony.**

**2. `LilKangooMedia_Phase17_PRIVATE_IMPORT.sql` — PRYWATNE dane recenzji.**

**BARDZO WAŻNE: Pliku `LilKangooMedia_Phase17_PRIVATE_IMPORT.sql` nie wgrywaj do GitHub, Netlify, repozytorium ani publicznego folderu strony.** To realne imiona/nazwy autorów i pełne komentarze. Wyłącznie wklej zawartość pliku do Supabase SQL Editor, uruchom i przechowuj lokalnie.

Plik z kodem celowo **NIE** zawiera danych klientów ani publicznego pliku JSON z tymi opiniami. Dzięki temu opcja Hide w panelu naprawdę usuwa daną opinię z publicznego API i nie zostawia równoległej statycznej kopii na stronie. Oryginały pozostają w prywatnym eksporcie Google Takeout.

## Instrukcja wdrożenia — 5 kroków

### 1. Kopia bazy i Netlify Deploy Preview

W Supabase przygotuj backup. Repozytorium: `LilKangoo/LilKangooMedia` → gałąź testowa/PR → Netlify Deploy Preview. Nie publikuj najpierw bez testów.

### 2. Wgraj pliki z CODE.zip do repozytorium

Zachowaj dokładnie ścieżki. Paczka zawiera:

- `index.html`, `home.html` — odnośniki do Reviews, nowego CSS/JS, zachowane odnośniki Phase 18.
- `admin.html` — tylko dodany skrypt linku Reviews; istniejące skrypty CMS oraz Services pozostawione.
- `reviews.html`, `admin-reviews.html` — nowa podstrona opinii i moduł administratora.
- `assets/lkm-v3/reviews-public.js` i `reviews-public.css`.
- `assets/lkm-v3/reviews-admin.js`, `reviews-admin.css`, `reviews-admin-link.js`.
- `assets/lkm-v3/phase18-pricing.js`, `phase18-pricing.css` — dołączone **bez zmian** dla kompatybilności z poprzednią paczką Phase 18. Żadne istniejące pliki `site.js`, `store.js`, `admin.js`, `cms.js`, `seed.js`, galerii i płatności nie są nadpisywane.
- `supabase/migrations/20261109_phase17_google_reviews_schema.sql` — schemat bazy i polityki RLS, można trzymać w repozytorium.

**Uwaga dotycząca Phase 18:** w tym ZIP jest tylko frontend Phase 18, żeby przy aktualizacji HTML nie utracić jego skryptów. Migracja cenowa Phase 18 nadal pozostaje osobnym krokiem i nie jest uruchamiana przez Phase 17.

### 3. Uruchom schemat SQL w Supabase

Supabase → SQL Editor → wklej zawartość pliku z paczki:

`supabase/migrations/20261109_phase17_google_reviews_schema.sql`

Kliknij **Run**. Zmiana tworzy osobną tabelę `public.lkm_reviews`, nie dotyka tabel `services`, `contact_leads` ani `stripe_orders`. Zakłada, że istnieje już funkcja `public.lkm_is_admin()` z aktualnego systemu LilKangooMedia.

### 4. Uruchom PRYWATNY import SQL — tylko Supabase SQL Editor

Otwórz osobny, pobrany plik:

`LilKangooMedia_Phase17_PRIVATE_IMPORT.sql`

Wklej w SQL Editor i uruchom. Oczekiwany wynik zapytania kontrolnego:

- `google_ratings = 121`
- `written_reviews = 91`
- `translated_reviews = 72`
- `ratings_without_text = 30`

Import jest idempotentny: ponowne uruchomienie pomija istniejące `google_review_id` i **nie nadpisuje późniejszych zmian wykonanych przez admina**. Wszystkie 121 recenzji początkowo są widoczne. Wybrane 12 recenzji z tekstem są oznaczone jako Featured w karuzeli.

### 5. Sprawdź i opublikuj

- `/#/` — sekcja **Words that matter** jest po portfolio i przed ostatnim CTA. Średnia **5.0/5 z 121 importowanych ocen**.
- `/reviews.html` — wszystkie 121 ocen, w tym 91 z tekstem i 30 bez komentarza. Wyszukiwanie i filtry działają.
- `/admin.html` — w lewym menu **Customer reviews**.
- `/admin-reviews.html` — zaloguj się tą samą metodą co do panelu admina. Przetestuj Hide/Publish, Featured, add/edit, import JSON, wyszukiwarkę.
- Wejdź na stronę w telefonie; sprawdź karuzelę i pełną listę.
- Przejrzyj również dotychczasowe usługi, formularz zapytania i Phase 18 — zmiany w recenzjach nie powinny ich dotykać.
- Po pozytywnym teście zmerguj do `main`.

**Ważne o Deploy Preview:** jeśli preview i strona produkcyjna korzystają z tej samej bazy Supabase, uruchomienie SQL doda nową tabelę do produkcyjnej bazy (jednak nie zmieni dotychczasowej tabeli usług). Kod nowej podstrony pojawi się klientom dopiero po publikacji.

## Jak dodawać nowe opinie później?

- Dodaj ręcznie nowy wpis w `/admin-reviews.html` i wybierz **Google Maps (manually copied)**, podając autentyczny link do Google; albo
- Pozyskaj aktualny eksport Google Takeout, w panelu **Customer reviews → Import Google Takeout files (JSON)** wybierz nowe pliki i kliknij **Import & skip duplicates**.

Import JSON akceptuje tylko rekordy przypisane do lokalizacji Google LilKangooMedia `12745176287903667711`; wpisy z innych wizytówek nie zostaną zaimportowane. Bez API nie ma synchronizacji na żywo.

## Dane, źródło i transparentność

- 121 recenzji i ich gwiazdki pochodzą z plików Google Takeout przekazanych 9 listopada 2026. **Wszystkie mają 5 gwiazdek**, dlatego średnia archiwalna wynosi dokładnie 5,0/5.
- Tłumaczenia Google wyraźnie oznaczone jako „Translated by Google”. Pozostałe angielskie komentarze zachowano bez poprawek.
- Star-only ratings są opisane jako ocena bez komentarza, a nie jako wymyślony cytat.
- Nie stosujemy manipulacyjnego `AggregateRating` w schema.org dla własnych opinii firmy.
- Nie deklarujemy automatycznej synchronizacji ani bieżącej oceny Google Maps — to **archiwum z eksportu**. Nowe recenzje należy dodać osobno.
- Jeśli opublikowany wpis Google zostanie przeredagowany po angielsku w adminie, zostanie oznaczony „Edited for website”; oryginał źródłowy pozostanie zachowany.
- Jako operator strony upewnij się, że publikacja ocen i nazw autorów spełnia obowiązujące zasady Google oraz wymagania ochrony danych (GDPR), w tym procedurę obsługi próśb o usunięcie danych.

## Testy

`node --check` dla nowych skryptów, weryfikacja 121 unikalnych identyfikatorów i statystyk, testy interakcji w Chromium na izolowanym widoku HTML: renderowanie, filtry, search, mobile, dodawanie, ukrywanie, import JSON i pomijanie duplikatów. Wyniki: `docs/PHASE17-TEST-RESULTS.md`. **Połączenia z prawdziwym Supabase i działanie na stronie Netlify wymagają testu po wdrożeniu**; w tej sesji nie wykonywano zmian na serwerze.
