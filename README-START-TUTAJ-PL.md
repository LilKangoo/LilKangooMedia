# LilKangooMedia — Phase 28.1
## Czarny gradient + centrowanie fotografii w kafelkach Services

Ta paczka jest **aktualizacją Phase 28.0**, nie niezależną wersją katalogu.

### Co zostało poprawione
- Gradient po prawej jest **czarny**, bez zielonego zabarwienia.
- Zdjęcie jest przycinane i **centrowane w lewej, widocznej części kafelka** (`object-fit: cover; object-position: 50% 50%`). Zamiast używać całej szerokości kafelka i przykrywać środek zdjęcia gradientem, zdjęcie wykorzystuje kontrolowany lewy obszar i stopniowo przechodzi w czerń.
- Gradient zaczyna się dalej od lewej krawędzi, tak aby środek fotografii pozostawał dobrze widoczny. Tekst pozostaje po prawej na ciemnym tle.
- Delikatnie dopasowano szerokość prawego bloku i rozmiar nagłówków do wąskich ekranów.
- Odświeżono wersje adresów CSS i JS do `28-1`, aby ograniczyć ryzyko wczytywania starego CSS z cache przeglądarki.

### Instalacja
1. Upewnij się, że Phase 28.0 został wcześniej wdrożony.
2. Zrób kopię zapasową trzech istniejących plików w swoim projekcie.
3. Rozpakuj ten ZIP. Otwórz w nim folder `assets/lkm-v3/`.
4. W folderze projektu `LilKangooMedia/assets/lkm-v3/` **podmień wszystkie trzy pliki** o identycznych nazwach:
   - `assets/lkm-v3/phase28-catalog.css`
   - `assets/lkm-v3/phase28-catalog.js`
   - `assets/lkm-v3/service-detail-v14.js`
5. Zapisz zmiany, zrób Commit/Push do GitHub. Poczekaj, aż Netlify pokaże `Published`.
6. Odśwież stronę w Chrome skrótem **Shift + Command + R**.
7. Otwórz:
   - https://lilkangoomedia.com/#/services?audience=business
   - https://lilkangoomedia.com/#/services?audience=personal

### Co należy sprawdzić po wdrożeniu
- Jasne zdjęcia produktowe i zdjęcia z logo: główny motyw widoczny po LEWEJ, nie zasłonięty przez gradient.
- Czarne przejście po PRAWEJ oraz biały tekst i złote ceny — bez zbyt jasnego tła pod napisami.
- Widok mobilny i desktop: widać całe karty, bez poziomego przewijania.
- Cały kafelek pozostaje klikalny. Personal/Business, filtry i wyszukiwanie działają jak wcześniej.
- Szczegóły pakietów i formularz zapytania nadal działają.

### SQL
**Nie jest potrzebny.** Żadnych zmian Supabase, cen, danych klientów ani routingu.

### Weryfikacja wykonana podczas przygotowania
- 8 szerokości ekranów od 320 do 1440 px w Chromium — testy regresyjne przeszły.
- Sprawdzone zrzuty testowe przy 320, 390 i 1440 px.
- Są to lokalne testy widoku na próbkach z aktualnej struktury katalogu, nie test produkcji na zalogowanym koncie.

### Cofnięcie zmiany
Przywróć kopie zapasowe powyższych trzech plików (Phase 28.0), zrób Commit/Push i odśwież stronę. Nie jest potrzebne przywracanie bazy danych.
