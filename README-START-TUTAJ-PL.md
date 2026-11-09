# LilKangooMedia — Phase 10: YouTube videos & gallery lightbox

Aktualizacja rozszerza działającą stronę. Nie zmienia cenników, zamówień, formularzy, artykułów ani istniejących danych zdjęć. Nie usuwaj całych folderów przy kopiowaniu.

## Dlaczego YouTube?

Filmy są hostowane i transkodowane przez YouTube. LilKangooMedia pobiera jedynie miniatury i otwiera odtwarzacz na żądanie klienta. Obsługiwane są standardowe adresy YouTube, linki `youtu.be`, `/shorts/` i `/live/`. Film musi zezwalać na osadzanie.

## KROK 1 — Supabase, tylko raz

W Supabase otwórz **SQL Editor → New query** i uruchom:

`supabase/migrations/20261109_lkm_youtube_media.sql`

Skrypt dodaje nową tabelę `public.media_videos` z RLS i nie zmienia starych tabel. Przed pracą na bazie produkcyjnej zrób kopię bezpieczeństwa. W razie błędu prześlij jego treść, nie wykonuj wielokrotnie losowych poprawek SQL.

## KROK 2 — GitHub (najpierw Deploy Preview)

Utwórz gałąź `lkm-youtube-gallery-v10` z aktualnej `main`, a następnie wgraj pliki z ZIP w odpowiednie lokalizacje, **zastępując WYŁĄCZNIE te konkretne pliki**:

| Plik | Co zrobić |
|---|---|
| `index.html` | Replace |
| `home.html` | Replace |
| `portfolio.html` | Replace |
| `admin.html` | Replace |
| `assets/lkm-v3/site.js` | Replace |
| `assets/lkm-v3/cms-public.js` | Replace |
| `assets/lkm-v3/video.css` | Add |
| `assets/lkm-v3/video-admin.js` | Add |
| `supabase/migrations/20261109_lkm_youtube_media.sql` | Add jako zapis migracji |

Nie wgrywaj ponownie `cms.js`, `admin.js`, `site.css`, nie ruszaj zdjęć ani Netlify Functions. Nie usuwaj folderów `assets`, `netlify` ani `supabase`.

## KROK 3 — test panelu i galerii

1. Otwórz Deploy Preview `admin.html#media` i zaloguj się normalnie.
2. W lewym menu pojawi się **Video Library**. Dostępny jest także przycisk **Manage service videos** w rozwiniętej usłudze i **Manage gallery videos** po wybraniu galerii.
3. W Video Library wybierz `Portfolio gallery` lub `Service`, a potem docelowe miejsce.
4. Wklej adres YouTube lub Shorts, dodaj tytuł i wybierz `Review` (na test) albo `Public` (aby pokazać publicznie). Kliknij **Add video to selected location**.
5. Po kliknięciu **Publish** film pojawi się na stronie: w `/portfolio.html#/gallery/...` lub w danej usłudze pod `/#/service/...`.
6. W usłudze kliknij duże zdjęcie, aby je powiększyć. Strzałki, Esc i gest przesuwania umożliwiają nawigację między zdjęciami a filmami.
7. Sprawdź działanie na telefonie. Po zatwierdzeniu połącz gałąź z `main`.

**Uwaga o środowisku testowym:** Deploy Preview domyślnie korzysta z tej samej bazy Supabase co strona produkcyjna. Film z ustawieniem `Public` przypisany do publicznej galerii lub aktywnej usługi może od razu pojawić się na stronie live. Do testowania bez publicznej publikacji wybierz `Review` albo osobny testowy projekt Supabase.

## Funkcje i granice aktualizacji

- Miniatury zdjęć i filmów w tych samych galeriach.
- Odtwarzacz YouTube w powiększeniu, po kliknięciu (privacy-enhanced `youtube-nocookie.com`).
- Strzałki i klawiatura, przesuwanie na telefonie, zamykanie odtwarzacza po opuszczeniu podglądu.
- Video Library: dodawanie, edycja, tytuł, opis, kolejność, przypisanie, widoczność, usuwanie przypisania. Film może być przypisany do kilku miejsc poprzez osobne rekordy, bez ponownego uploadu.
- `Remove` usuwa rekord przypisania z Supabase, nie usuwa filmu na YouTube.
- Nie wgrywa plików MP4 do Netlify/GitHub, nie obsługuje uploadu do YouTube; publiczny film należy wcześniej opublikować tam.
- YouTube może odmówić osadzania filmu, np. ze względu na ustawienia właściciela, ograniczenia wieku lub regionu; wtedy w podglądzie jest link **Watch on YouTube**.
- Pliki wideo/miniatury to zasoby zewnętrzne. Tryb `youtube-nocookie.com` nie zastępuje pełnego przeglądu zgodności z polityką cookies/RODO.

## Testy

Przeszedł `node --check` na wszystkich trzech skryptach JS. Testy lokalnej przeglądarki Chromium (dane symulowane): foto→film, strzałki i Escape, galeria mieszana, dodanie filmu Shorts, odczyt i edycja w panelu. Testów z produkcyjnym Supabase, Netlify i realnymi filmami YouTube jeszcze nie przeprowadzono.
