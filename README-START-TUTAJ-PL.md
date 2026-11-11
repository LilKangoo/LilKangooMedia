# LilKangooMedia — Phase 26: Dark Command Center / Portfolio Studio

**Wersja: 2026-11-11.** Nowy panel zarządzania zawartością portfolio, kolekcjami, projektami i Case Studies. Wygląd: ciemna zieleń/czerń z funkcjonalnymi neonowymi akcentami: zieleń — opublikowane/zapisane, złoto — wyróżnione/edycja, czerwień — ukrycie/ostrzeżenie. Interfejs pozostaje po angielsku.

## Instalacja (ważna kolejność)

**0. Zrób kopię zapasową Supabase przed migracją** (według dostępnych opcji Twojego planu) lub przetestuj najpierw na kopii/staging. Nie uruchamiaj wcześniej wykonanych SQL ponownie.

1. W panelu Supabase właściwego projektu przejdź do **SQL Editor → New query**.
2. Otwórz **TYLKO JEDEN NOWY SQL** `supabase/migrations/20261111_lkm_portfolio_studio.sql`. Skopiuj całość i kliknij **Run**. Plik korzysta z tabel stworzonych we wcześniejszych, już wdrożonych fazach CMS, Video i Case Studies. Jeżeli pojawi się błąd, **zatrzymaj wdrożenie i prześlij komunikat**. Transakcja ma `BEGIN` / `COMMIT` i powinna wycofać nieudane zmiany.
3. Po sukcesie SQL rozpakuj tę paczkę i **wgraj jej zawartość do katalogu głównego repozytorium** `LilKangoo/LilKangooMedia` (zachowaj ścieżki, zastąp tylko pliki o tych samych nazwach). Niczego nie usuwaj. Wykonaj **Commit / Push** na gałąź powiązaną z Netlify.
4. Po zakończonym deployu otwórz **https://lilkangoomedia.com/admin-studio.html** i zaloguj się **tym samym administratorem Supabase**, którego używasz w starym panelu.
5. W starym `/admin.html` w nagłówku pojawi się przycisk **Command Center**. Stary panel pozostaje dostępny jako awaryjna droga powrotna.

**Nowy SQL: 1 plik. Żadnych poprzednich migracji nie uruchamiamy ponownie.**

## Co działa w nowym panelu

- **Dashboard**: faktyczne liczby kanonicznych zasobów, projektów, kolekcji i opublikowanych Stories z Supabase (NIE wyświetla wymyślonych statystyk ruchu ani przychodów).
- **Media Library**: wspólny indeks oryginalnych URL zdjęć i ID YouTube; filtry foto/wideo, wyszukiwarka, strony wyników, podgląd, tytuły, ALT, tagi i opisy.
- **Browse website files**: wyszukiwarka istniejących zdjęć z `/api/media-catalog`. Dodanie do indeksu NIE wykonuje ponownego uploadu.
- **Upload photos**: JPG/PNG/WebP do 8 MB każdy, do 15 w jednym wsadzie; fizyczny plik trafia do istniejącego publicznego bucketa `portfolio`, a wpis do kanonicznej biblioteki. Dopóki nie przypiszesz go jako publiczny, nie pojawi się na stronie portfolio.
- **YouTube / Shorts**: wklejenie URL filmu lub Shorts, identyfikowany raz na podstawie 11-znakowego ID.
- **Multi-assign**: zaznacz wiele zdjęć lub filmów → `Assign to…` → wybierz jednocześnie kilka projektów, kolekcji albo stron usług → `Apply assignments`. Te same źródła nie są fizycznie kopiowane.
- **Usage / Inspector**: przy pojedynczym materiale lista miejsc użycia, niezależne `Publish / Hide`, zmiana kolejności, ustawienie zdjęcia jako okładki galerii.
- **Projects & Stories**: tworzenie/edycja projektu i kolekcji, opis, powiązana usługa, status Review/Public/Private, niezależny checkbox `Show a gallery card in Portfolio` oraz redakcja/publikacja Case Study.
- **Portfolio Collections**: foldery/tematyczne zbiory z własnymi kartami w Portfolio, niezależne od projektów-klientów.
- **Nawigacja biznesowa**: skróty do poprzednich modułów: CRM, kalendarz rezerwacji, raporty, usługi — BEZ zmian w logice płatności i refundacji.

## Jak rozwiązać podwójną kartę Eléa Golf Club

1. Otwórz **Command Center → Projects & Stories → Eléa Golf Club**.
2. W `Gallery access` pozostaw **Public** — umożliwia to otwarcie galerii po bezpośrednim adresie i wyświetlanie zdjęć w Story.
3. Odznacz `Show a gallery card in Portfolio` (SQL ustawia to automatycznie dla opublikowanego istniejącego Eléa Case Study).
4. W sekcji Story pozostaw `Publish the story` zaznaczone.
5. Na `/portfolio.html` projekt Eléa pojawi się **jako Story**, ale nie jako osobna karta Visual Gallery.
6. W **Media Library** możesz przypisać te same zdjęcia także do kolekcji `Sports & Hospitality` (jeśli ją utworzysz), bez ponownego przesyłania zdjęć.

**UWAGA:** „Hide” ukrywa konkretną publikację/przypisanie, **nie usuwa oryginalnego pliku**. Oryginalne zdjęcia z `Web.zip` i materiały prywatne Mariusza/Agnieszki nie są przez ten skrypt kopiowane ani publikowane. Jeśli mają się pojawić publicznie, trzeba podjąć osobną decyzję o ich wykorzystaniu.

## Przykładowa procedura kontroli po deployu

1. W panelu zobacz realne liczniki z Supabase, nie dane poglądowe z mockupu.
2. Przejdź do **Projects & Stories**: Eléa ma `Show a gallery card` wyłączone; Case Study pozostaje opublikowane.
3. Sprawdź **https://lilkangoomedia.com/portfolio.html** — karta galerii Eléa nie powinna być zdublowana, ale Story powinno pozostać widoczne.
4. Otwórz **https://lilkangoomedia.com/portfolio.html#/story/elea-golf-club** — sprawdź dwa filmy, galerię zdjęć i opis ponad 400 fotografii.
5. W **Media Library** wybierz jedno istniejące zdjęcie; `Assign to…` → przypisz je do drugiej kolekcji w statusie `Review`; sprawdź w Inspectorze dwa przypisania.
6. Przełącz jedno testowe przypisanie na `Public`, otwórz docelową galerię, potem przełącz na `Hide` i sprawdź, że inne przypisania pozostały.
7. Nie wykonuj rzeczywistych płatności; CRM, kalendarz i Stripe działają według starych kodów.
8. Na telefonie sprawdź poziomą nawigację, siatkę zdjęć, formularz projektu i dialog przypisania.

## Architektura / bezpieczeństwo

- Tabele: `lkm_studio_assets` (jeden wpis na URL zdjęcia lub ID wideo), `lkm_studio_placements` (wiele powiązań), `lkm_studio_audit` (zapis wywołań przypisania).
- Istniejące tabele `portfolio_images`, `media_videos` oraz `services.gallery_urls` pozostają źródłem dla publicznych ekranów. Administrator zapisuje powiązania transakcyjnie przez chronione RPC. Triggery aktualizują nowy indeks również wtedy, gdy materiały edytowane są w dotychczasowym CMS.
- `portfolio_galleries.show_in_portfolio`: osobna kontrola karty galerii. `lkm_case_studies.is_published` nadal steruje widocznością historii; galeria Public nadal niezbędna do pokazania Story.
- RLS na nowych tabelach: odczyt i zapis tylko dla administratora. RPC sprawdza `auth.uid()` i `lkm_is_admin()`.
- Żadnych zmian w tabelach Stripe, płatnościach, zwrotach i prywatnym buckecie deliverables. **Zwroty nadal wyłącznie przez aplikację Stripe**.
- **Ważne dotyczące prywatności**: bucket `portfolio` służy materiałom przeznaczonym do publikacji i jest publiczny. Nawet jeśli przypisanie ma `Review`, osoba mająca bezpośredni adres publicznego pliku może go otworzyć. Nigdy nie przesyłaj tu prywatnych plików klientów — używaj istniejącego prywatnego panelu dostarczania materiałów.

## Znane ograniczenia tej wersji

- Kanoniczność oznacza **ten sam URL lub YouTube ID**; nie jest to pełne wykrywanie identycznych pikseli przy różnych nazwach plików.
- Pola Title, ALT, Description i Tags w **Master Media Library** są metadanymi katalogu centralnego. Nie nadpisują automatycznie osobnych podpisów/ALT już przypisanych do istniejących galerii i filmów; te pozostają edytowalne w dotychczasowym panelu galerii.
- Foldery-kolekcje są na tym etapie płaskie (nie wielopoziomowe). Jeden zasób można przypinać do dowolnej liczby kolekcji/projektów.
- Na liście istniejącej galerii wyszukiwanie działa na aktualnej stronie wyników; dla wyszukiwania w całym indeksie użyj `All media`.
- Supabase/PostgREST i funkcje SQL nie były uruchamiane na Twoim środowisku produkcyjnym. Przetestowano lokalne scenariusze UI z mockami oraz logikę źródeł, NIE rzeczywiste uprawnienia RLS, storage ani płatności.
- Nowe **Command Center jest ciemne**; starsze specjalistyczne strony CRM, raportów, kalendarza i formularzy mogą nadal używać dotychczasowej kolorystyki. Ich głęboka przebudowa wizualna wymaga osobnej regresji, żeby nie uszkodzić funkcjonalności.
- Wybór ukrycia z projektu nie usuwa oryginału z repozytorium lub Storage. To działanie jest celowo niedestrukcyjne.

## Testy lokalne

- `node --test tests/studio-model.test.mjs` — 6/6 PASS.
- `python tests/test_studio_browser.py` — 8/8 scenariuszy PASS w mockowanym Chromium (desktop/mobile).
- `python tests/test_phase26_static.py` — 4/4 PASS.
- `node --check assets/lkm-v3/studio.mjs` — PASS.

### Strony i pliki

- `admin-studio.html` — nowy ciemny panel.
- `admin.html` — tylko przycisk prowadzący do Command Center.
- `portfolio.html` — podpięta obsługa kontroli widoczności kart.
- `assets/lkm-v3/studio.{css,mjs}` — logika, projekt UI i panel.
- `assets/lkm-v3/studio-model.mjs` — walidacja i niezależne funkcje.
- `assets/lkm-v3/studio-portfolio-visibility.js` — niezależna widoczność kart.
- `supabase/migrations/20261111_lkm_portfolio_studio.sql` — jedyna nowa migracja.

**To jest aktualizacja inkrementalna; NIE usuwaj starych plików ani starych SQL.**
