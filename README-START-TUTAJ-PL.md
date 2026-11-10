# LilKangooMedia — Phase 22.3: CASE STUDIES (FULL UPDATE)

## Jedna paczka do wgrania na GitHub

To jest kompletna **aktualizacja Phase 22.3** do stanu po Phase 22.2. Nie usuwaj istniejących folderów ani nie wgrywaj ZIP jako nierozpakowanego pojedynczego pliku. Rozpakuj ZIP i wgraj zawartość z zachowaniem ścieżek, pozwalając zastąpić tylko dołączone pliki `index.html`, `home.html`, `admin.html` i `assets/lkm-v3/phase22-related-work.js`.

Nie ma zmian w rezerwacjach, Stripe, Webhookach, cenach, kalendarzach, tabelach leadów ani opinii.

## Instrukcja instalacji

**Kolejność jest ważna:**

1. W Supabase (tym samym projekcie, z którym działa obecny CMS) otwórz **SQL Editor → New query**. Zalecana jest kopia danych / migracja na środowisku testowym.
2. Skopiuj i uruchom bez zmian zawartość `supabase/migrations/20261110_lkm_case_studies.sql`. Powinna zakończyć się bez błędów. Skrypt tworzy nową tabelę `lkm_case_studies` i reguły RLS. **Nie usunie żadnych zdjęć, galerii, usług ani płatności.** Nie trzeba edytować SQL.
3. Wgraj rozpakowane pliki do głównego folderu `LilKangoo/LilKangooMedia` w GitHub, zachowując dokładne nazwy i strukturę folderów. Zatwierdź **Commit changes**.
4. Poczekaj na zakończenie standardowego wdrożenia Netlify i otwórz **https://lilkangoomedia.com/admin-case-studies.html**. Zaloguj się istniejącym kontem administratora LilKangooMedia.
5. Wybierz **istniejącą galerię**. Wypełnij prawdziwe dane: nazwę realizacji, cel projektu, sposób pracy, dostarczone materiały i opcjonalnie zweryfikowane rezultaty.
6. Sprawdź, czy galeria i przynajmniej jedno zdjęcie lub film mają status **Public** w dotychczasowym CMS. W edytorze case study zaznacz „Publish this real case study” i zapisz.
7. Zweryfikuj stronę **https://lilkangoomedia.com/case-studies.html**. Historia projektu jest pod adresem `https://lilkangoomedia.com/case-studies.html#/slug-galerii`.
8. Aby wyświetlić link „Read project story” przy odpowiedniej usłudze, w starym CMS ustaw dla tej galerii pole **Related service**. Jeśli case study nie jest opublikowane, karta zachowuje dotychczasowy link do portfolio.

## Jak działa publikowanie

- Nowe rekordy są **szkicami** (`is_published=false`) i nie są dostępne anonimowo przez API.
- RLS pozwala anonimowym użytkownikom czytać tylko *opublikowane* case studies, których powiązana galeria również ma status **Public**.
- Edytować mogą jedynie konta z tabeli `admin_users` za pośrednictwem Supabase Auth i RLS. W przeglądarce nie ma żadnego klucza administracyjnego ani Stripe secret.
- Publikacja wymaga prawdziwego nagłówka (min. 8 znaków), celu (min. 20 znaków) i opisu podejścia (min. 20 znaków).
- Rezultaty oraz nazwa klienta są opcjonalne. Jeżeli brak potwierdzonych wyników (np. sprzedaży czy zasięgów), **pozostaw pole wyników puste**. Nie należy obiecywać liczb ani przypisywać sobie nieudokumentowanych osiągnięć.
- Publiczny widok pokazuje **jedynie obrazy i filmy oznaczone jako Public**, przypisane do tej samej galerii.
- Case studies są na razie stroną opartą o hash. Indywidualne, indeksowalne URL i metadane per projekt zaplanowano do Phase 25 (SEO).
- Nie wykonuje żadnych automatycznych zwrotów. **Refundacje wyłącznie w Stripe.**

## Wprowadzone pliki

- `case-studies.html` — publiczny katalog i szczegóły opublikowanych realizacji.
- `admin-case-studies.html` — wydzielony panel administracyjny.
- `assets/lkm-v3/case-studies-data.mjs` — wspólne, testowane reguły filtracji i walidacji.
- `assets/lkm-v3/case-studies-public.mjs` — publiczny widok z danymi Supabase.
- `assets/lkm-v3/case-studies-admin.mjs` — bezpieczny edytor z Supabase Auth i RLS.
- `assets/lkm-v3/case-studies.css` — CSS responsywny.
- `assets/lkm-v3/phase22-case-admin-nav.js` — link w istniejącym panelu.
- `assets/lkm-v3/phase22-related-work.js` — pełna wersja istniejącego modułu Phase 22.1, z linkami tylko do opublikowanych historii.
- `index.html` i `home.html` — wyłącznie dodany link w stopce; pozostałe fazy 19–22.2 bez zmian.
- `admin.html` — nowy link do edytora, bez zmian w logice CMS.
- `supabase/migrations/20261110_lkm_case_studies.sql` — nowa tabela i RLS.
- `tests/phase22-case-studies.test.mjs` — testy Node.js.
- `tests/test_phase22_case_studies_browser.py` — lokalny test Chromium, bez połączenia z produkcją.

## Testy przed wdrożeniem

- `node --check assets/lkm-v3/*.mjs` / skrypty JS: składnia PASS.
- `node --test tests/phase22-case-studies.test.mjs`: **15/15 PASS**.
- `python tests/test_phase22_case_studies_browser.py`: public case study i edytor **desktop + mobile PASS (4/4)**, dane testowe w pamięci, bez podłączania do produkcji.
- Integralność archiwum ZIP: PASS.
- **Nie wykonano migracji SQL na Twoim projekcie Supabase ani testu produkcyjnego**. Zgodnie z Twoją decyzją kompleksowy audyt strony będzie po zakończeniu wszystkich etapów.

## Roadmap

- Phase 22.3: Case Studies — ta paczka.
- Phase 22.4: Oferty i strony branżowe B2B.
- Phase 23: CRM, ofertowanie PDF, follow-upy.
- Phase 24: Panel klienta, pliki i dostawy.
- Phase 25: PL/EN, indeksowalne URL usług, SEO i konwersje.
- Final Audit: testy całej produkcyjnej strony (w tym Netlify, Supabase, Stripe i mobilna responsywność).
