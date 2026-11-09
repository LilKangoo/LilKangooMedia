# LilKangooMedia — Phase 19 · Links library

## Cel

Nowa pozycja **↗ Links library** w panelu administratora LilKangooMedia. Umożliwia szybkie znalezienie i wysłanie właściwego publicznego linku do usługi, artykułu, galerii, recenzji lub innej ważnej strony.

**Uwaga:** to paczka DO WDROŻENIA. Nie wprowadzono żadnych zmian do Twojej strony produkcyjnej ani bazy Supabase.

## Co zawiera

- `/admin.html` — dołączony **jeden** nowy skrypt w istniejącym panelu; reszta bez zmian.
- `/admin-reviews.html` — nowy link do Links library w menu recenzji; reszta bez zmian.
- `/admin-links.html` — osobna podstrona biblioteki wewnątrz administracji, wymagająca istniejącego logowania admina.
- `/assets/lkm-v3/admin-links-nav.js` — wpis w bocznym menu panelu.
- `/assets/lkm-v3/admin-links.js` — pobieranie aktualnych danych usług, galerii i artykułów; wyszukiwanie; filtrowanie; kopiowanie.
- `/assets/lkm-v3/admin-links.css` — wygląd kart i responsywny układ.
- `/netlify/functions/link-preview.js` — indywidualny podgląd do udostępniania (Open Graph) dla usług i galerii; bez nowych uprawnień ani tabel.
- `/netlify.toml` — istniejące ustawienia Netlify z dopisanymi dwoma regułami rewrites.
- `/tests/test_phase19.cjs` — testy jednostkowe logiki i metadanych (Node 18+).

## Skąd bierzemy linki?

- **Services / Personal** i **Services / Business**: z aktualnej publicznej tabeli `services` w Supabase; wyłącznie `active = true`.
- **Portfolio galleries**: z `portfolio_galleries` i zdjęć publicznych `portfolio_images` w Supabase.
- **Articles & guides**: z `assets/lkm-v3/articles-index.json` generowanego podczas wdrożenia Netlify; jeśli indeks jest pusty — z opublikowanych `blog_posts`. Zachowujemy oryginalne istniejące `permalink`/`legacy_path` i SEO `seo_title`/`seo_description`.
- **Main pages**: homepage, usługi, wersje Personal/Business, About, Contact, Portfolio, Articles, Customer reviews, FAQ. Dla zwykłych stron HTML katalog odczytuje rzeczywisty `<title>`, meta description i OG image, jeśli są obecne.
- **Social & contact**: oficjalne linki do Google Reviews, Leave a Google review, WhatsApp, Facebook, Instagram i YouTube podane wcześniej na stronie.

**Nie wymyślamy** nowych linków do niewydanych usług czy artykułów. Liczba dostępnych linków i folderów zależy od tego, co jest rzeczywiście opublikowane w CMS/Supabase.

## Jak działa wysyłanie linków?

W każdej karcie jest obraz, tytuł, SEO/meta title, meta description, slug, gotowy adres, przyciski:

- **Copy link** — kopiuje publiczny link do przesłania klientowi.
- **Copy text** — kopiuje tytuł, krótki opis i link, gotowe do wklejenia w WhatsApp, e-mail lub Messenger.
- **Open** — otwiera link w nowej karcie.
- **Copy direct page URL** — dodatkowa opcja przy usługach i galeriach. Kopiuje standardowy adres strony z `#`, bez indywidualnej karty Open Graph.

### Dlaczego usługi i galerie mają specjalny link?

Standardowy adres usługi `https://lilkangoomedia.com/#/service/<slug>` działa u odwiedzających, ale `#` nie dociera do serwera i Facebook/WhatsApp może wyświetlić ogólne zdjęcie oraz tytuł strony głównej. Dlatego **Copy link** kopiuje dla usługi:

`https://lilkangoomedia.com/share/service/<slug>`

Dla galerii:

`https://lilkangoomedia.com/share/gallery/<slug>`

Netlify Functions odczytuje **publiczne** dane z Supabase i zwraca HTML z własnym `og:title`, `og:description`, `og:image` i `og:url` dla danej pozycji. Przeglądarka klienta automatycznie przechodzi na istniejącą stronę usługi lub galerii. Nie zmieniamy dotychczasowych ścieżek SPA ani konfiguratora. Nowe lub edytowane usługi w Supabase mogą aktualizować podgląd bez zmiany kodu (serwery społecznościowe mogą cache'ować wcześniejszy podgląd).

Przy artykułach używamy ich **oryginalnych osobnych stron SEO**, a przy zwykłych podstronach — rzeczywistych publicznych adresów. Podgląd z indywidualnym zdjęciem nie jest obiecywany dla zewnętrznych platform, na których LilKangooMedia nie ma kontroli nad metadanymi.

## Instalacja — 5 kroków

1. Rozpakuj ZIP. Skopiuj zawartość do repozytorium `LilKangoo/LilKangooMedia`, zachowując ścieżki. Nowe pliki dodaj, a trzy istniejące (`admin.html`, `admin-reviews.html`, `netlify.toml`) zaktualizuj. Pozostałe pliki zostaw bez zmian.
2. Najlepiej wykonaj zmiany na gałęzi testowej i uruchom **Netlify Deploy Preview**. W środowisku Preview otwórz `/admin-links.html` i zaloguj się istniejącym kontem administratora.
3. Sprawdź foldery, wyszukiwanie po tytule/slugu, **Copy link** i **Copy text**, poprawność zdjęć oraz liczbę usług, galerii i artykułów.
4. Zweryfikuj nowy endpoint **na domenie deploy preview**: `https://TWOJ-PREVIEW.netlify.app/share/service/portrait-photography`. Po odczytaniu metadanych link powinien otworzyć właściwą podstronę (po stronie produkcyjnej link będzie na `lilkangoomedia.com`). Można zweryfikować nagłówki `og:title` / `og:image` narzędziem Facebook Sharing Debugger, jeśli URL preview jest dostępny publicznie.
5. Po udanych testach zmerguj do `main`, poczekaj na Netlify deploy i sprawdź właściwy produkcyjny adres `/share/service/portrait-photography`. Teraz przyciski **Copy link** będą gotowe do wysyłania klientom.

**Nie uruchamiamy żadnego SQL.** Moduł korzysta z istniejącej sesji Supabase Auth i wymaga uprawnienia administratora. Nie edytuje żadnych rekordów i nie wpływa na Phase 17 (Google Reviews) lub Phase 18 (Pricing & Custom Quotes).

## Ważne uwagi

- Share pages wymagają **Netlify Functions** — nie zadziałają na innej usłudze hostingowej bez osobnej adaptacji. Obecne repo zawiera `netlify.toml` i używa Netlify Functions jako systemu docelowego tej paczki.
- W `netlify/functions/link-preview.js` jako fallback wstawiony jest istniejący publiczny klucz Supabase z `lkm-config.js` (to **publishable key**, nie `service_role`); preferowane są zmienne Netlify `SUPABASE_URL` i `SUPABASE_ANON_KEY`, jeśli istnieją. Jeśli zmienisz projekt Supabase, dostosuj również ten fallback lub ustaw zmienne środowiskowe.
- Share URL skierowany na domenę produkcyjną zacznie działać **dopiero po publicznym deployu**. Testuj wersję preview przez domenę Netlify Preview.
- Jeśli witryna przez jakiś czas nie może pobrać kategorii CMS, moduł pokaże ostrzeżenie, ale nadal udostępni załadowane linki.
- Część platform społecznościowych buforuje poprzednie miniatury; w razie potrzeby odśwież ich cache za pomocą narzędzia debuggera danej platformy.
- Archiwum zawiera jedynie pliki panelu i endpointu; **nie zawiera** prywatnych danych klientów ani kluczy `service_role`.

## Testy

Z lokalnej kopii paczki: `node tests/test_phase19.cjs` (bez instalowania zależności). Testy sprawdzają generowanie metadanych, bezpieczny slug, zachowanie nieopublikowanej strony, awarię bazy, automatyczne linki do usług i galerii, filtrowanie i kopiowanie. Pełny wizualny test Netlify Preview pozostaje do wykonania — uruchamianie lokalnej przeglądarki jest blokowane w środowisku przygotowania paczki.
