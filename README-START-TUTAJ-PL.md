# LilKangooMedia — Phase 8: Articles & SEO

**Cel:** pełny katalog dotychczasowych publicznych artykułów, nowoczesny wygląd pod dotychczasowymi adresami, import treści do Supabase i edytor umożliwiający nowe publikacje. **Bez ingerencji w usługi, ceny, galerie klientów, pocztę, formularze, Stripe i już działające funkcje.**

## 1. Co dokładnie otrzymujesz

- Generator działający w **Netlify podczas builda**, który odczytuje strony wskazane na `Education.html` i `articlesaboutcyprus.html`. Nie opiera się na zgadywaniu nazw artykułów.
- Odtwarza treść publicznych wpisów (nagłówki, akapity, linki, listy i obrazy), **zachowuje faktyczne tytuły, opisy i historyczne kanoniczne adresy URL**, nadaje wspólny nowoczesny szablon HTML. Nie pisze od nowa treści i nie dodaje zmyślonych informacji czy dat.
- Generuje nowoczesne strony kategorii także pod `/Education.html` i `/articlesaboutcyprus.html`, listę wpisów `/blog.html`, dane uporządkowane `BlogPosting` i uzupełnienia `sitemap.xml`.
- Generuje `assets/lkm-v3/articles-index.json` (publiczną listę) i `assets/lkm-v3/articles-import.json` (do jednorazowego importu z poziomu panelu admin). Dane obu powstają automatycznie; **nie trzeba ich ręcznie dodawać do GitHuba**.
- Nowy edytor pod **Admin → Articles & SEO**: import artykułów, wyszukiwarka, kategorie, wizualne formatowanie tekstu, tryb HTML, wybór/uplod zdjęć, SEO i podgląd.
- Nowe wpisy publikowane z Supabase po buildzie jako `/articles/nazwa-artykulu.html`. Istniejące wpisy z zaimportowanym `legacy_path` pozostają pod oryginalnym adresem.
- Opcjonalna automatyczna publikacja po kliknięciu Save — zabezpieczony tokenem admina Netlify Build Hook.

## 2. Najważniejsze — wdrożenie bez ryzyka

1. Zrób kopię danych `blog_posts` i `blog_categories` (jeśli masz już w nich treści).
2. W GitHubie utwórz z bieżącej `main` gałąź **`lkm-articles-v8`**. Nie publikuj bezpośrednio na `main`.
3. Rozpakuj ZIP. Wgraj zawartość do **głównego katalogu** repozytorium (nie sam ZIP ani folder o nazwie paczki). Zachowaj ścieżki:

   | Ścieżka | Co zrobić |
   |---|---|
   | `netlify.toml` | ADD (nowa konfiguracja builda) |
   | `scripts/build_articles.py` | ADD |
   | `assets/lkm-v3/article.css` | ADD |
   | `assets/lkm-v3/article-consent.js` | ADD |
   | `assets/lkm-v3/article-admin.css` | ADD |
   | `assets/lkm-v3/cms.js` | REPLACE, **tylko ten plik** |
   | `assets/lkm-v3/cms-public.js` | REPLACE, **tylko ten plik** |
   | `netlify/functions/publish-articles.mjs` | ADD |

4. **Foldery łącz (Merge), nie Replace**. Nie usuwaj niczego z `assets/images`, `netlify/functions/enquiry.mjs`, `assets/lkm-v3/site.js`, `admin.js`, `site.css`, `lkm-config.js`, starych stron HTML ani oryginalnych zdjęć.
5. Commit/Push gałęzi `lkm-articles-v8`, otwórz **Netlify Deploy Preview**. W Build logs wypatruj komunikatu `LilKangooMedia articles: original=... published Supabase=... total=... skipped=...`. Liczba zależy od rzeczywiście dostępnych oryginalnych plików w repozytorium. Oczekujemy kilkudziesięciu, bo indeksy linkują do dwóch głównych zbiorów artykułów.
6. Sprawdź w Deploy Preview: `/blog.html`, `/Education.html`, `/articlesaboutcyprus.html`, 2–3 stare artykuły i `/admin.html#articles`. Sprawdź również stronę główną, galerie, działający formularz i `/api/enquiry` (GET powinien zwrócić 405).
7. Dopiero po akceptacji połącz PR z `main`, poczekaj na udany produkcyjny deployment Netlify.

**Zmiana techniczna Netlify:** `netlify.toml` uruchamia `python3 scripts/build_articles.py`, publish directory pozostaje `.` (katalog główny) i funkcje pozostają w `netlify/functions`. Generator zmienia tylko pliki w **tymczasowym checkout Netlify**; nie nadpisuje plików artykułów w GitHubie.

## 3. Import do Supabase — bez SQL i przepisywania artykułów

1. Po pierwszym działającym deploymentcie zaloguj się do `https://lilkangoomedia.com/admin.html#articles`.
2. Kliknij **Import existing articles**.
3. Panel pokaże liczbę wpisów do importu; potwierdź.
4. Oczekuj potwierdzenia importu. Import **pomija wpisy mające już tę samą nazwę slug lub stary URL** i nie nadpisuje Twoich zmian. Dotychczasowe publiczne artykuły otrzymają status `Published`.
5. Po imporcie ustaw i sprawdź zdjęcia, kategorie, SEO i treść. Zapis zmian wymaga **kolejnego deploymentu**, aby zaktualizować statyczne HTML.

**Uwaga o okresie przejściowym:** stare artykuły będą od razu dostępne w nowej szacie po pierwszym deploymencie, jeszcze przed importem do Supabase. Import dodaje ich edytowalną wersję do panelu.

## 4. Automatyczna publikacja po zapisaniu (zalecane)

Żeby nowe i edytowane artykuły aktualizowały się w Netlify bez ręcznego robienia Push:

1. Netlify → projekt `lilkangoomedia.com` → **Project configuration / Build & deploy → Build hooks** (lokalizacja opcji może się zmienić). Utwórz hook o nazwie `LilKangooMedia Articles`, kierujący na gałąź `main`.
2. Skopiuj wygenerowany URL `https://api.netlify.com/build_hooks/...` (jest sekretem).
3. W **Project configuration → Environment variables** dodaj `NETLIFY_BUILD_HOOK_URL`, zaznacz **Contains secret values**, zakres **Functions**, kontekst **Production**. URL wklej wyłącznie tam, nigdy do pliku w GitHubie.
4. Wykonaj nowy deployment, aby funkcja `publish-articles` miała dostęp do sekretu.
5. Kiedy zapisujesz artykuł ze statusem `Published`, CMS zleca nowy deployment. Strona będzie aktualna **po jego zakończeniu**, nie natychmiast w chwili zapisu.

**Bez tego sekretu** artykuły można nadal dodawać i edytować, ale po publikacji trzeba uruchomić ręcznie nowy Netlify deploy. Nie podawaj URL build hooka w rozmowie.

## 5. SEO, bezpieczeństwo i ograniczenia

- Generator wybiera tylko **publiczne, faktyczne artykuły wskazane przez dwa stare indeksy**. Galerie klientów i strony zabezpieczone hasłem nie są importowane.
- Istniejące canonical, tytuły i meta opisy są zachowywane z oryginalnych źródeł, o ile poprawne; nie dodajemy wymyślonych dat autorstwa ani nowej treści.
- Na stagingu sprawdź przykładowe artykuły, zwłaszcza te z nietypowym układem. Generator wypisuje pominięte pliki w Build logs zamiast publikować niekompletne strony.
- Publikacja statusu `Draft`, `Review` lub `Archived` wymaga deploya; serwerowa wersja z odpowiednimi uprawnieniami może wygenerować dla ukrytego starszego artykułu stronę `noindex`.
- **HTML jest filtrowany**, a artykuły w bazie modyfikować mogą tylko administratorzy z Supabase Auth i RLS.
- Nazwy i metadane starego Google Analytics GA4, Search Console oraz wydawcy AdSense pozostają w generowanych dokumentach. **Wyświetlanie reklam AdSense** na nowych szablonach wymaga osobnego audytu zgodności z CMP w EOG; nie publikuj na produkcji, zanim sprawdzisz ewentualne przychody i politykę reklam.
- Strony artykułów są HTML generowanym na serwerze, a nie tylko hash-route w JavaScript — Google otrzymuje nagłówki i treść bez renderowania JS.
- W etapie 8 **nie zmieniamy żadnych cen, usług, zdjęć, formularzy i logowania**.

## 6. Kontrola i wycofanie

- Sprawdzenie składni JS: `node --check assets/lkm-v3/cms.js` i `node --check assets/lkm-v3/cms-public.js`.
- Testy generatora: `python3 -m unittest discover -s tests -v` (folder `tests` dołączony do paczki).
- Jeśli staging nie przejdzie testu, **nie scalaj gałęzi**.
- Jeśli problem pojawi się po produkcyjnym merge, Netlify → Deploys → wybierz ostatni działający deployment → Publish deploy, a następnie wycofaj problematyczny commit w GitHubie, żeby kolejny automatyczny deploy nie przywrócił błędu.
