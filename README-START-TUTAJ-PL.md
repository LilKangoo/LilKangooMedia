# LilKangooMedia — Phase 27: Service Page UX Redesign (11.11.2026)

**WERSJA: 27.0** — wdrożenie zaakceptowanego mockupu strony pojedynczej usługi, desktop + mobile.

## Co zawiera ZIP

Do folderu głównego Twojego repozytorium `LilKangooMedia` wgraj **dokładnie 2 pliki**, zachowując ścieżki:

1. `assets/lkm-v3/service-detail-v14.js` — **PODMIEŃ istniejący plik**.
2. `assets/lkm-v3/phase27-service.css` — **DODAJ nowy plik** (jeżeli jeszcze go nie ma).

To pełne pliki, a nie fragmenty do ręcznego dopisywania. Nowy JavaScript sam dołącza arkusz `phase27-service.css`, dlatego **NIE zmieniaj `index.html` ani innych plików**. Pozostałe pliki i wcześniejsze aktualizacje (w tym Phase 26.5 panelu admina) mają zostać nietknięte.

## Instalacja — krok po kroku

1. Otwórz lokalny folder projektu `LilKangooMedia` (ten sam, którego używasz do GitHub / Netlify).
2. Dla bezpieczeństwa skopiuj istniejący `assets/lkm-v3/service-detail-v14.js` w inne miejsce jako kopię awaryjną.
3. Rozpakuj tę paczkę. Skopiuj **oba** pliki z podfolderu `assets/lkm-v3/` do istniejącego folderu `LilKangooMedia/assets/lkm-v3/`.
4. Potwierdź **Replace / Zastąp** dla `service-detail-v14.js`; plik `phase27-service.css` będzie nowy.
5. Upewnij się, że nie powstał dodatkowy, podwójny folder `LilKangooMedia/LilKangooMedia/` ani `assets/lkm-v3/assets/lkm-v3/`.
6. W repozytorium GitHub wykonaj Commit i Push zmian. Sprawdź status **Published** w Netlify.
7. Otwórz https://lilkangoomedia.com/#/service/commercial-video-reels i wykonaj pełne odświeżenie Chrome na Mac: **Shift + Command + R**.
8. Jeśli nowy wygląd się nie pojawi, najpierw sprawdź, czy oba pliki znajdują się w podanych ścieżkach w opublikowanym commicie. Nie uruchamiaj migracji SQL.

## Zakres zmian

- Nagłówek usługi + galeria zestawione w dwóch kolumnach na desktopie, jedna kolumna na telefonie.
- „About this service” i „What you get” w zwartej sekcji; teksty pochodzą wyłącznie z istniejącej oferty/CMS.
- Pakiety przesunięte wyżej. Kliknięcie **całej karty** wybiera pakiet, ale zostaje zachowany dotychczasowy przycisk i obsługa klawiatury.
- Desktop: po prawej podsumowanie z **faktycznie wybranym pakietem i ceną**, przycisk `Continue with this package` prowadzi do dotychczasowego `#/quote`.
- Telefon: jeden dolny pasek ze wskazaną opcją, ceną i przyciskiem **Continue**. Zastępuje wcześniejszy ogólny pasek mobilny na stronach szczegółów usługi, żeby nie dublować przycisków.
- Przewijanie po zmianie pakietu jest przywracane na wysokość klikniętej karty, zamiast pozostawać u góry strony. Nie zmieniono bazowego mechanizmu danych pakietu.
- „How it works” jest małą sekcją z trzema krokami.
- „See this service in action” to mniejsze karty rzeczywistych projektów zaimportowanych/powiązanych w CMS; brak wymyślonych przykładów.
- Opinie firmy znajdują się **na końcu** strony. Nie przypisujemy ich do konkretnej usługi, jeśli źródło tego nie potwierdza.
- Dla usług bez pakietów dostępny pozostaje dotychczasowy tryb wyceny indywidualnej.

## Test po wgraniu

**Komputer (desktop):**

1. Wejdź na `https://lilkangoomedia.com/#/service/commercial-video-reels`.
2. Potwierdź nowy układ: galeria przy nagłówku, krótki opis, pakiety, małe `How it works`, niewielka sekcja projektów i opinie na dole.
3. Wybierz `Single Reel — 30–45 seconds` (widoczna cena z aktualnego katalogu, obecnie na przesłanym zrzucie €250), potem `Content Pack – 3 Reels` (na zrzucie €650). **Nie powinno przenieść na górę**; panel podsumowania musi pokazać odpowiednią nazwę i cenę.
4. Kliknij `Continue with this package` i sprawdź, czy na formularzu zapytania nadal jest wybrany właściwy pakiet i pozostałe kroki działają.
5. Obejrzyj galerię zdjęć/filmów i zweryfikuj, że sekcje projektów oraz opinii wczytują się z rzeczywistych danych.

**Telefon:**

1. Otwórz tę samą stronę przy wąskim ekranie.
2. Kliknij dwie różne karty i sprawdź zmianę nazwy/ceny w dolnym pasku.
3. Sprawdź przycisk `Continue`, brak poziomego przewijania oraz brak zasłaniania pakietów.
4. Przejdź do innej usługi, np. `#/service/website-design`, i potwierdź, że szablon działa niezależnie od rodzaju cennika.

## SQL

**BRAK. Nie uruchamiaj żadnego SQL.** Paczka nie zmienia bazy Supabase, RLS, danych, płatności, CRM, panelu admina ani konfiguracji Stripe.

## Co sprawdzono przed wydaniem

- Aktualny oryginalny plik `assets/lkm-v3/service-detail-v14.js` w repozytorium `LilKangoo/LilKangooMedia` miał SHA GitHub `d775d1eb942e68a0a588d356dd2aa284fc07625e` (wersja przed podmianą).
- Przeanalizowano istniejące `site.js`, `phase20-ux.js`, `phase20-conversion.js`, `phase22-related-work.js`, `phase22-trust-reviews.js`, style i selektory z bieżącej architektury.
- `node --check` dla nowego JavaScriptu.
- Test lokalny Chromium z symulowanym katalogiem CMS i ponownym renderowaniem (bez prywatnego Supabase): 5 rozdzielczości: 1440, 1024, 760, 390 i 320 px.
- Po zmianie pakietu: zgodność ceny z wybraną opcją, brak przesunięcia viewportu, poprawna kolejność sekcji dołączanych asynchronicznie, kliknięcie całej karty i brak błędów JS / poziomego overflow.

**Ograniczenie:** test lokalny odtwarza zachowanie i strukturę komponentów bez dostępu do zalogowanych usług produkcyjnych. Po deployu wykonaj podaną wyżej kontrolę rzeczywistych filmów, portfolio, opinii, Supabase i pełnego formularza. Nie przedstawiam testu lokalnego jako testu produkcji.

## Cofnięcie zmian (rollback)

Jeśli pojawi się nieoczekiwany problem, przywróć poprzedni `assets/lkm-v3/service-detail-v14.js` z kopii lub z wcześniejszego commita, a dodany `assets/lkm-v3/phase27-service.css` możesz pozostawić (nie jest wtedy ładowany) albo usunąć. Commit / Push i sprawdź status Published. Nie cofaj ani nie modyfikuj żadnego SQL — tu nie było migracji.
