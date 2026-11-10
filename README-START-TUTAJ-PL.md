# LilKangooMedia — Eléa Golf Club | Case Study + 18 curated images

## Najważniejsze

W archiwum Web.zip było 409 zdjęć. Wybrałem **18 różnorodnych zdjęć** z turnieju, finału, pola i drona.
Fotografie zoptymalizowano do WebP (maksymalny wymiar 2400 px; bez metadanych EXIF).

Treść Case Study została zaktualizowana: **ponad 400 dostarczonych fotografii** łącznie z pracą turniejową i osobnymi zamówieniami dwóch zawodników.
Mariusz i Agnieszka zostali opisani jako **osobni prywatni klienci**, a nie jako zlecenie Eléa Golf Club.

**Prywatne sesje:** sprawdziłem zdjęcia także z folderów Mariusz i Agnieszka. Fotografie tych osób nie trafiły do publicznej paczki, ponieważ zakres zgody na marketingową publikację ich indywidualnych sesji nie został potwierdzony. Możesz je później zatwierdzić i dodać przez CMS.

## KOLEJNOŚĆ WDROŻENIA — KONIECZNIE ZACHOWAJ

### 1. GitHub — nowa paczka plików
Rozpakuj ZIP **LKM_Elea_400.zip**. Zawartość wyślij do repozytorium `LilKangoo/LilKangooMedia` zachowując pełne ścieżki:

- `case-studies.html` — niewielka aktualizacja powiązania CSS i JS (zachowuje poprzednie skrypty)
- `assets/lkm-v3/elea-case-layout.js` — dwa filmy na samej górze + odtwarzanie YouTube po kliknięciu
- `assets/lkm-v3/elea-case-layout.css` — układ responsywny
- `assets/images/elea-golf-club/*.webp` — 18 zdjęć, nie wszystkie 409
- `supabase/migrations/20261110_lkm_elea_case_update_400photos.sql` — JEDYNY nowy SQL

`PREVIEW-18-PHOTOS.jpg` i `SOURCE_PHOTO_SELECTION.txt` służą do przeglądu; nie musisz dodawać ich do repozytorium. Pliki testowe też są opcjonalne.
**Nie wrzucaj pliku ZIP jako jednego archiwum do GitHub** — musisz przesłać zawartość po rozpakowaniu.

### 2. Netlify — poczekaj na udany deploy
Sprawdź czy wyświetla się zdjęcie: https://lilkangoomedia.com/assets/images/elea-golf-club/aerial-course-sand-bunkers.webp
Jeżeli dostajesz 404, nie uruchamiaj jeszcze SQL — obrazy nie są na serwerze.

### 3. Supabase — uruchom TYLKO jeden nowy SQL
Otwórz Supabase → SQL Editor → New query.
Wklej całą zawartość **`supabase/migrations/20261110_lkm_elea_case_update_400photos.sql`** i kliknij Run.

Ten SQL:
- aktualizuje ten sam istniejący wpis `elea-golf-club` (nie duplikuje galerii),
- zmienia „300+” na „400+” oraz dodaje indywidualną fotorelację Mariusza i Agnieszki,
- zachowuje dwa filmy `y1CB22Z-Qm4` i `kU3ACgDkxDo`,
- przypisuje **18 wybranych zdjęć** do galerii w kolejności,
- nadaje opis alternatywny, podpis i zdjęcie okładkowe z drona,
- nie kasuje żadnych wcześniej istniejących zdjęć ani innych galerii.

Przy ponownym uruchomieniu SQL fotografie nie powinny się duplikować.
**ŻADNYCH poprzednich SQL nie uruchamiaj ponownie.**

### 4. Sprawdzenie wyniku
Wynik ostatniego SELECT w SQL Editor powinien zawierać:
- `gallery_slug=elea-golf-club`
- `gallery_visibility=public`
- `case_study_published=true`
- `public_video_count=2`
- `public_photo_count>=18` (jeśli wcześniej były już zdjęcia, liczba może być większa)

Podgląd: https://lilkangoomedia.com/case-studies.html#/elea-golf-club
Kolejność: najpierw pełny film nad 18 dołkami, potem YouTube Short, następnie galeria zdjęć.
Zdjęć w publicznym Case Study zobaczysz maksymalnie 12; wszystkie 18 są widoczne pod „Open full project gallery”.

### 5. Późniejsze zmiany
Możesz dodawać więcej zdjęć przez Admin → Galleries → Eléa Golf Club, bez ponownego uruchamiania SQL.
Osobnych zdjęć prywatnych zawodników nie publikuj marketingowo bez potwierdzenia uprawnień / zgody na wykorzystanie wizerunku.

## Testy lokalne
- 7/7 testów Python — pliki, prywatność, ścieżki i zgodność SQL
- 5/5 scenariuszy Chromium — filmy u góry, mobile, click-to-play, inne Case Studies bez zmian
- Nie wykonano SQL na produkcyjnej bazie; to sprawdzisz po wdrożeniu.
