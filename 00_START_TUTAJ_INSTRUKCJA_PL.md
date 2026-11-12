# LilKangooMedia | Phase 31.1 | CyprusEye Case Study Integration

## Co rozwiązuje poprawka

1. `Projects & Stories` obsługuje od teraz **wiele Related services**, a nie tylko jedną.
2. Projekt powiązany z kilkoma usługami pojawia się w ich `See this service in action`, po opublikowaniu galerii i wybranych zdjęć/filmów.
3. Strona główna pokazuje nową, kompaktową sekcję **Real projects. Real results.** z autentycznymi, opublikowanymi historiami. Dotychczasowe pięć kafelków portfolio pozostaje bez zmian.
4. Historia CyprusEye pokazuje w środku odnośniki do faktycznie powiązanych usług. Zdjęcia/filmy pozostają w istniejącej galerii Supabase.
5. Nie zmieniamy cen, rezerwacji, formularzy ani bazy klientów.

## WAŻNE: kolejność instalacji

### Krok 1. SQL w istniejącym projekcie Supabase LilKangooMedia

1. Otwórz Supabase Dashboard dla **LilKangooMedia** (nie dla CyprusEye).
2. Wejdź w `SQL Editor` -> `New query`.
3. Otwórz `01_SQL_URUCHOM_NAJPIERW/20261112_lkm_multi_related_services.sql` z tej paczki.
4. Wklej zawartość i kliknij `Run`.
5. Oczekiwany wynik: brak błędu i jeden wiersz z informacjami o CyprusEye. Nowa kolumna nazywa się `related_service_slugs`.

SQL jest addytywny. Nie usuwa obecnego `related_service_slug` ani powiązań innych projektów. Nie wykonuj ponownie dawnych SQL do tworzenia CyprusEye.

### Krok 2. Kopia plików projektu

Otwórz lokalne repozytorium `LilKangooMedia` na Macu. Przed podmianą skopiuj istniejące pliki do folderu backup:

- `assets/lkm-v3/studio.mjs`
- `assets/lkm-v3/studio.css`
- `assets/lkm-v3/phase30-public.js`
- `scripts/phase30_apply_theme.py`

### Krok 3. Kopiowanie plików

W paczce przejdź do folderu `02_SKOPIUJ_DO_PROJEKTU_LILKANGOOMEDIA`.

**Nie kopiuj folderu 02 jako nowego podfolderu projektu.** Skopiuj jego zawartość do folderu głównego lokalnego repozytorium `LilKangooMedia`, zachowując strukturę `assets/lkm-v3` i `scripts`.

Dokładnie:

| Plik z paczki | Do którego miejsca | Czynność |
| --- | --- | --- |
| `assets/lkm-v3/studio.mjs` | `assets/lkm-v3/studio.mjs` | Podmień |
| `assets/lkm-v3/studio.css` | `assets/lkm-v3/studio.css` | Podmień |
| `assets/lkm-v3/phase30-public.js` | `assets/lkm-v3/phase30-public.js` | Podmień |
| `assets/lkm-v3/phase31-public.js` | `assets/lkm-v3/phase31-public.js` | Nowy plik |
| `assets/lkm-v3/phase31-public.css` | `assets/lkm-v3/phase31-public.css` | Nowy plik |
| `scripts/phase30_apply_theme.py` | `scripts/phase30_apply_theme.py` | Podmień |

**Nie podmieniaj** `index.html`, `portfolio.html`, `site.js`, `portfolio-stories.mjs`, `netlify.toml`, `phase29-home.js`, modułów rezerwacji ani zdjęć.

### Krok 4. GitHub Desktop i Netlify

1. Otwórz GitHub Desktop.
2. Sprawdź, czy widzisz dokładnie 6 zmienionych/dodanych plików powyżej.
3. Commit: `Phase 31.1 multiple related services and published case studies on Home`.
4. Kliknij `Push origin`.
5. W Netlify sprawdź status `Published`. Jeśli deploy zgłosi błąd, nie publikuj nic kolejnego. Skopiuj log.
6. Odśwież stronę: `Shift + Command + R`.

### Krok 5. Wybierz usługi dla CyprusEye

1. Otwórz `https://lilkangoomedia.com/admin#projects`.
2. Otwórz projekt `CyprusEye | Tourism SaaS, Branding and Digital Growth`.
3. W `Related services (choose multiple)` zaznacz usługi, które faktycznie obejmuje projekt. Lista pochodzi z Twojej prawdziwej tabeli `services`.
4. Kliknij zwykły **Save project settings** (nie trzeba klikać Save Case Study ponownie).
5. Upewnij się, że `Gallery access` nadal jest `Public` i `Publish the story` pozostaje zaznaczone.
6. Wejdź ponownie do edycji, sprawdź, czy zaznaczenia zostały zapamiętane.

W bazie nadal pozostaje stare pole `related_service_slug` z pierwszym wybranym wpisem. Wszystkie wybrane usługi zapisują się w nowym `related_service_slugs`.

### Krok 6. Sprawdź publiczne strony

- Home: `https://lilkangoomedia.com/`
  Pod `Our work speaks visually` zobaczysz dodatkowy blok `Real projects. Real results.`. Karta CyprusEye prowadzi do historii. Jeśli opublikowany jest również projekt Eléa, może pojawić się obok.
- Stories: `https://lilkangoomedia.com/portfolio.html#/stories`
  CyprusEye i istniejące historie pozostają widoczne. Widok portfolio `/portfolio` także jest obsługiwany.
- Historia: `https://lilkangoomedia.com/portfolio.html#/story/cypruseye-tourism-saas-platform`
  W dolnej części historii znajdziesz powiązane, aktywne usługi.
- Strony usług: otwórz `/#/service/SLUG` dla wybranych usług. W `See this service in action` powinna pojawić się historia CyprusEye, jeśli ma publiczne materiały.

**Ważne:** nowa karta Home używa jednej publicznej okładki projektu. Nie próbuje wyświetlać całej galerii ani uruchamiać filmów w małej karcie. Filmy pozostają w pełnej historii, o ile są prawidłowo przypięte do galerii i ustawione jako `public`.

### Krok 7. Weryfikacja danych w Supabase (opcjonalnie)

Otwórz `03_KONTROLA_OPCJONALNA/VERIFY_CYPRUSEYE.sql` i uruchom w SQL Editor. Pokazuje status projektu, powiązane usługi i liczby publicznych mediów. Niczego nie zapisuje.

## Co zrobić, jeśli coś nie działa?

- Błąd `column related_service_slugs does not exist`: nie wykonano Krok 1 SQL we właściwym projekcie Supabase.
- Brak zaznaczeń po zapisie: sprawdź DevTools Network przy aktualizacji `portfolio_galleries` oraz status `Save project settings`.
- Brak karty CyprusEye na Home: sprawdź, czy historia ma `is_published = true` i galeria `visibility = public`. Odśwież stronę i sprawdź, czy Netlify ma status Published.
- Brak filmu w historii: sprawdź, czy istnieje wpis w `media_videos`, z tym samym `gallery_id` oraz `visibility = public`, i poprawnym `youtube_id`.
- Brak zdjęć: sprawdź analogiczne przypisania w `portfolio_images`.

## Bezpieczny rollback

Przywróć cztery pliki z kopii, usuń dwa nowe pliki `phase31-public.js` i `phase31-public.css`, zrób Commit i Push. Nowa kolumna może pozostać w Supabase, ponieważ stary kod jej nie używa. Nie wykonuj `DROP COLUMN`, żeby nie utracić wybranych powiązań.

## Zasady bezpieczeństwa

- CSS i JS frontend nie zawierają kluczy administracyjnych.
- Odczyty publiczne respektują istniejące RLS w Supabase.
- Widoki publiczne pokazują tylko opublikowane historie, publiczne galerie oraz publiczne zdjęcia i filmy.
- Repozytorium, płatności i dane klientów pozostają bez zmian poza wskazanymi plikami.
