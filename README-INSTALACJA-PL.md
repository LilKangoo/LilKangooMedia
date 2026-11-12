# LilKangooMedia — Phase 30.5: Service Details Graphite & Gold

## Zakres
Jeden wspólny arkusz dla wszystkich stron szczegółów usług w aplikacji (`/#/service/...`) korzystających z szablonu Phase 27. Poprawiono kolory, kontrast, tła, granice i przyciski w: hero, opisie, galerii, „What you get”, pakietach, zaznaczeniu oferty, panelu ceny, mobilnym dolnym pasku, „How it works”, projektach, opiniach i krótkim oknie zapytania.

Nie zmieniono żadnych cen, danych, zapytań Supabase, routingu, menu, logiki pakietów ani formularzy. Nie jest potrzebny SQL.

## Instalacja
1. Rozpakuj ZIP. Struktura folderów jest taka sama jak w repozytorium.
2. W folderze lokalnym projektu znajdź `assets/lkm-v3/phase27-service.css` i zachowaj jego kopię (lub użyj później opcji Revert w GitHub Desktop).
3. Skopiuj plik z ZIP **`assets/lkm-v3/phase27-service.css`** w to samo miejsce w projekcie, potwierdzając podmianę.
4. W GitHub Desktop sprawdź, że zmienił się **tylko** `assets/lkm-v3/phase27-service.css`.
5. Wykonaj Commit i Push origin.
6. Sprawdź status `Published` w Netlify.
7. Otwórz https://lilkangoomedia.com/#/service/commercial-video-reels i odśwież twardo `Shift + Command + R` (Chrome/macOS). Jeśli przeglądarka pokazuje stary motyw, sprawdź jeszcze w trybie incognito po nowym wdrożeniu.

**Nie edytuj** `netlify.toml`, `scripts/phase30_apply_theme.py`, `site.js`, `service-detail-v14.js` ani bazy danych.

## Checklista po wdrożeniu
- Tytuł „Commercial Video & Reels” jest jasny na grafitowym tle.
- Opis usługi jest czytelny, a główny przycisk złoty.
- „What you get” to ciemna karta z jasnymi punktami.
- Pakiety mają grafitowe tła, złote ceny i wyraźne zaznaczenie wybranego pakietu.
- Panel z ceną i przyciskiem Continue jest grafitowo-złoty.
- Na telefonie pasek Continue nie zasłania formularza i odpowiada na wybór pakietu.
- „How it works”, projekty, opinie i dolne CTA są zgodne z paletą Graphite & Gold.
- Sprawdź dodatkowo co najmniej jedną usługę Personal i inny pakiet Business (np. fotograficzny).
- Przejdź cały proces wyboru pakietu i otwarcia zapytania (bez finalizowania zamówienia testowego).

## Testy lokalne
Testowany był **odtworzony szablon** z aktualnym arkuszem Phase 27 i motywem Phase 30 na szerokościach 320, 390, 560, 760, 1024 i 1440 px. Bez poziomego scrolla i z właściwymi obliczonymi kolorami pierwszego ekranu, pakietów, opinii oraz mobilnego paska. Kontrast przykładowych kombinacji: 16.6:1 (tytuł/grafit), 13.1:1 (tekst/karta), 9.0:1 (złoto/karta), 9.1:1 (tekst/złoty CTA). Wdrożenie produkcyjne wymaga potwierdzenia; test lokalny nie obejmuje prawdziwych danych klienta ani wysyłania zapytań.

## Cofnięcie
Przywróć poprzednią wersję `assets/lkm-v3/phase27-service.css` z kopii lub w GitHub Desktop użyj Revert commit, a następnie Push.
