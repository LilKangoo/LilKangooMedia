# LilKangooMedia · Phase 11 — Official YouTube Channel Sync

**Cel:** wczytać rzeczywiste filmy z oficjalnego kanału YouTube do działającej Video Library i wyświetlić je na stronie LilKangooMedia bez wpisywania tytułów i opisów z pamięci.

Źródło wskazane przez właściciela: https://www.youtube.com/@lilKangooMedia

Identyfikator kanału odnaleziony w oryginalnej stronie LilKangooMedia: `UCgIrKPHFpPy6srhdq4SjEtw`.

**WAŻNE:** dostępnymi narzędziami nie udało się bezpośrednio odczytać bieżącej listy filmów z YouTube. Niniejsza paczka **nie zawiera zgadywanych filmów, ich tytułów ani opisów**. Zamiast tego wgrywa synchronizator, który po uruchomieniu na Netlify odczytuje bieżące metadane z YouTube. Filmy nie są dodawane do produkcyjnej bazy, dopóki administrator nie wybierze i nie zatwierdzi ich w panelu.

## KROK 1 — GitHub, gałąź testowa

Utwórz gałąź `lkm-youtube-sync-v11` od aktualnej `main`.

Przenieś do repozytorium **TYLKO** poniższe pliki z ZIP-a:

| Plik | Operacja |
|---|---|
| `assets/lkm-v3/video-admin.js` | Replace |
| `assets/lkm-v3/video.css` | Replace |
| `netlify/functions/youtube-channel-sync.mjs` | Add |

**Nie zastępuj całych folderów**, nie dotykaj plików `site.js`, `cms-public.js`, `admin.js`, `index.html`, `netlify/functions/enquiry.mjs` ani bazowej konfiguracji. Phase 10 (Video Library i tabela `media_videos`) musi już działać.

## KROK 2 — Netlify Deploy Preview

Po Push otwórz Deploy Preview z gałęzi testowej. Netlify musi widzieć nową funkcję `/api/youtube-channel-sync`.

Otwórz `/admin.html`, zaloguj się i kliknij **Video Library → Synchronize YouTube channel → Load channel videos**.

- W panelu pojawi się lista **rzeczywistych** filmów z oryginalnymi tytułami, opisami, datami i miniaturami YouTube.
- Sprawdź ich zawartość, używając linków „Watch on YouTube”.
- Zaznacz te, które mają być widoczne na stronie. Domyślnie zaznaczona jest cała pobrana lista.
- Jeśli film ma znaleźć się także w konkretnej usłudze, wybierz tę usługę z listy obok filmu. Bez wyboru trafi tylko do galerii wideo.
- Kliknij **Import & publish selected videos** i potwierdź operację.

**Uwaga: Deploy Preview i strona live mogą używać tej samej produkcyjnej bazy Supabase!** Kliknięcie Import & publish zapisuje filmy jako publiczne i może natychmiast pokazać je na prawdziwej stronie. Jeśli wolisz bezpiecznie sprawdzić sam wygląd panelu, zatrzymaj się przed tym przyciskiem.

## KROK 3 — Gdzie pojawią się filmy?

Synchronizator tworzy, jeśli potrzebna, jedną publiczną galerię:

**Films & Video Production**

`https://lilkangoomedia.com/portfolio.html#/gallery/video-portfolio`

Galeria pokazuje miniatury i prawdziwe tytuły z YouTube. Wbudowany odtwarzacz w Phase 10 otwiera się po kliknięciu i obsługuje strzałki oraz urządzenia mobilne.

Jeżeli administrator dodatkowo przypisze film do istniejącej usługi, pojawi się on także w tej usłudze. Nie przypisujemy automatycznie po słowach w tytule — mogłoby to przedstawić film w nieodpowiedniej kategorii. Film opublikowany na kanale jest publiczny na YouTube, lecz w panelu można zdecydować, czy ma być widoczny na stronie.

### Bez dodatkowego klucza API

Synchronizator pobiera publiczny **RSS YouTube**. To źródło zawiera wyłącznie **najnowsze filmy** (typowo do około 15), nie kompletny katalog kanału. Panel informuje o ograniczeniu.

### Pełniejsze archiwum YouTube

Aby pobrać starsze filmy, w Google Cloud Console włącz **YouTube Data API v3** i utwórz klucz API. W Netlify → Project configuration → Environment variables dodaj:

- Name: `YOUTUBE_API_KEY`
- Value: *klucz z Google Cloud Console, tylko do sekcji Functions*
- Secret: **Yes**, scope: Functions, Production (i Deploy Preview, jeśli testujesz w podglądzie)

Po zmianie wykonaj nowy deploy. **Nie wklejaj klucza do GitHuba, `lkm-config.js` ani JavaScript uruchamianego w przeglądarce.** W Google Cloud ogranicz dostęp klucza do YouTube Data API v3. Funkcja potwierdza zgodność identyfikatora kanału z podanym handlem i pobiera do 300 ostatnich publicznych filmów, sprawdzając możliwość osadzania. Jeżeli kanał ma więcej, pozostaje kolejna partia do zaimportowania; liczba jest jawnie oznaczona w panelu.

## Co pozostaje niezmienione

- Wszystkie istniejące filmy już zapisane w `media_videos`, w tym ręcznie poprawione tytuły i opisy.
- Wszystkie zdjęcia, przypisania zdjęć i istniejące galerie.
- Ceny usług, zapytania, Supabase Auth, Stripe, Netlify Forms, Zoho i Resend.
- Struktura SQL — **brak nowej migracji**, wykorzystujemy tabelę z Phase 10.

Synchronizator sprawdza obecne rekordy i nie tworzy ich ponownie. Możesz uruchamiać import wielokrotnie, np. po dodaniu nowych filmów na YouTube.

## Kontrola i ograniczenia

- Działanie przetestowano lokalnie na **symulowanych** odpowiedziach YouTube/Supabase. Nie wykonano rzeczywistego importu na koncie LilKangooMedia.
- RSS może być niedostępny albo ograniczony przez YouTube na Netlify. Wtedy należy użyć autoryzowanego YouTube Data API.
- Film może mieć ograniczenia osadzania. Wersja RSS nie zawiera pełnych informacji o ustawieniu „embeddable”; w przypadku błędu odtwarzacz wyświetla link do YouTube.
- Jeśli Google zwróci inny kanał lub podejrzaną nazwę kanału, synchronizator przerywa operację zamiast importować cudze filmy.
- Odtwarzacz `youtube-nocookie.com` może nadal wymagać sprawdzenia konfiguracji prywatności i zgód RODO.
- Nie wgrywamy plików MP4 do GitHuba ani Supabase Storage.

## Testy

W katalogu `tests` znajduje się test automatyczny: `node --test tests/youtube-sync.test.mjs`.

Przetestowano: podgląd tytułu i opisu z XML, publikowanie, brak duplikatów, przypisanie do usługi, blokowanie niewłaściwych filmów, dostęp administratora, obsługę niezgodnego kanału, sprawdzanie YouTube API. Wszystkie 8 testów zakończyło się sukcesem przy symulowanych odpowiedziach.
