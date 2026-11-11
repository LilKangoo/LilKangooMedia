# LilKangooMedia — Phase 30.0: Graphite & Gold na wszystkich nowoczesnych stronach publicznych

**Gotowy pakiet instalacyjny bez SQL.** Sprawdzony względem istniejącej struktury repozytorium `LilKangoo/LilKangooMedia` na dzień 11 listopada 2026. Ten pakiet nie wymaga edytowania wielu plików HTML ręcznie.

## 1. Cel i zakres

- Wspólna kolorystyka matowy grafit / złoto / bokeh / jasny tekst zgodna z zaakceptowaną stroną Home 29.6.
- Spójne, przyklejone do góry menu na podstronach publicznych, aktywna sekcja, Services -> Personal/Business i Our Work -> Project Stories.
- Oryginalne logo kangura `assets/lkm-v3/brand/logo-orange.png` jako delikatne tło, animowane proporcjonalnie do przewijania (w dół i w górę). **Na Home istniejąca animacja z Phase 29 pozostaje bez zmian.**
- Zgodne style dla dynamicznych Services, Business, CMS portfolio, artykułów, opinii, realizacji, samodzielnego About Us i statycznych poradników usług.
- Pola formularzy, długie artykuły i treści wymagające wysokiej czytelności zachowują jasne powierzchnie tam, gdzie pomaga to w obsłudze.
- Zachowujemy `#business-brief` i przycisk `Request a quote`, `/portfolio.html#/stories`, menu usług, realne ceny, Supabase, SEO oraz formularze.

### Celowo poza zakresem

`admin*.html`, `cms.html`, `client.html`, `proposal.html` i starsze strony Mobirise niekorzystające z obecnych szablonów (np. dawne HTML produktów i FAQ). Nie zmieniamy automatycznie interfejsów administracyjnych ani portalu klienta. Starsze strony warto przebudowywać odrębnie po audycie ich funkcji.

## 2. Instalacja — dokładnie które pliki kopiować

**Wymagane:** lokalne repozytorium `LilKangooMedia`, z dotychczas wdrożoną Phase 29.6.

1. Pobierz ZIP i rozpakuj.
2. Otwórz folder główny lokalnego projektu `LilKangooMedia` — ten, w którym znajduje się `netlify.toml` i foldery `assets/`, `scripts/`.
3. Skopiuj wszystkie pliki z paczki, zachowując katalogi:

| Plik w ZIP | Docelowe miejsce w Twoim repozytorium | Operacja |
|---|---|---|
| `netlify.toml` | `LilKangooMedia/netlify.toml` | **Podmień** |
| `assets/lkm-v3/phase30-public.css` | `LilKangooMedia/assets/lkm-v3/phase30-public.css` | **Dodaj** |
| `assets/lkm-v3/phase30-public.js` | `LilKangooMedia/assets/lkm-v3/phase30-public.js` | **Dodaj** |
| `scripts/phase30_apply_theme.py` | `LilKangooMedia/scripts/phase30_apply_theme.py` | **Dodaj** |

Nie kopiuj README do folderu assets — możesz go zachować obok ZIP-a.

4. **Przed podmianą `netlify.toml` zrób kopię** i sprawdź w GitHub Desktop, czy plik nie zawiera Twoich nowszych własnych zmian. Paczka bazuje na obecnym poleceniu budowania stron: `build_articles.py`, `build_service_pages.py`, `phase20_rebuild_sitemap.py`. Dodaje na końcu wywołanie `phase30_apply_theme.py`, niczego z poprzednich kroków nie usuwa.
5. W GitHub Desktop sprawdź cztery wskazane pliki, wykonaj **Commit** i **Push**.
6. W Netlify sprawdź nowy deploy. W logach budowania powinien pojawić się wiersz `LKM Phase 30: checked ... HTML files, updated ...`.
7. Po statusie **Published** otwórz stronę w trybie prywatnym lub odśwież `Shift + Command + R`.

**Nie musisz ręcznie otwierać ani edytować `index.html`, `blog.html`, `portfolio.html`, artykułów, poradników ani starych plików CSS**. Netlify uruchamia skrypt po wygenerowaniu publicznych podstron, dołączając motyw do właściwych plików HTML. Przy kolejnym deployu również będzie to działało automatycznie.

## 3. Co sprawdzić po wdrożeniu

1. **Home:** `https://lilkangoomedia.com/` — nadal tak samo jak 29.6 (kangur/animacje) i bez podwójnego menu.
2. **Services:** `https://lilkangoomedia.com/#/services` — karty, przełącznik Personal / Business, ceny.
3. **Przykład usługi:** `https://lilkangoomedia.com/#/service/commercial-video-reels` — wybór pakietu i przejście do zapytania.
4. **Business:** `https://lilkangoomedia.com/business-solutions.html` — formularz i przycisk `Request a quote`.
5. **Portfolio:** `https://lilkangoomedia.com/portfolio.html` oraz zakładka Project Stories.
6. **Artykuły:** `https://lilkangoomedia.com/blog.html` i konkretny opublikowany artykuł.
7. **Opinie:** `https://lilkangoomedia.com/reviews.html` — wyszukiwanie, filtry, kartoteka i linki do Google.
8. **Przewodniki usług:** `https://lilkangoomedia.com/services/commercial-video-reels.html`.
9. **About Us:** `https://lilkangoomedia.com/AboutUs.html`.
10. Sprawdź menu i kontrast tekstu na telefonie i komputerze; testuj przewijanie w obie strony.

## 4. SQL / dane

**BRAK SQL.** Bez migracji i zmian w Supabase. Nie aktualizujemy ofert, cenników, adresów w bazie, rezerwacji ani zamówień.

## 5. Testy i ograniczenia

- Audyt oparto na bieżących plikach repozytorium i ich szablonach.
- Test modułu nawigacji i stylów wykonany lokalnie na sześciu szerokościach ekranu (320, 375, 390, 768, 1024, 1440 px), na pięciu odtworzonych typach podstron: **30 kombinacji**.
- Sprawdzono idempotencję etapu budowania, wykluczenie admin/client/legacy, brak poziomego przewijania w symulacjach, link Business CTA, mobilne menu oraz kangura (w tym `prefers-reduced-motion`).
- Nie mam potwierdzenia przejścia pełnego testu wszystkich dynamicznych danych i funkcji na produkcji. Po wdrożeniu należy wykonać powyższą kontrolę na prawdziwych stronach.
- Netlify wygeneruje HTML podczas buildu. W źródłowych plikach lokalnych zobaczysz stary HTML, dopóki nie uruchomisz procesu generowania lokalnie — to zamierzone.

## 6. Cofnięcie zmian

W GitHub Desktop użyj **Revert** dla commitu Phase 30 lub przywróć poprzedni `netlify.toml` (bez `phase30_apply_theme.py`) i usuń nowo dodane dwa zasoby CSS/JS oraz skrypt. Następny deploy zbuduje dotychczasową wersję stron. Baza Supabase pozostanie nietknięta.
