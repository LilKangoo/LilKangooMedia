# LilKangooMedia — Phase 14: Universal Service Page

## Co poprawia

Nowa strona szczegółowa WSZYSTKICH usług wykorzystujących `#/service/<slug>`:
- jeden nagłówek H1, krótki wstęp, galeria zdjęć/wideo, czytelne podsumowanie ceny;
- osobne, responsywne karty pakietów z ceną, jednostką rozliczenia i rozkładanymi szczegółami;
- pełny opis usługi pod „About this service” zamiast dublowania długich opisów;
- wygodne przejście do istniejącego konfiguratora `#/quote`, obsługa wybranej opcji;
- brak ingerencji w Supabase, obecne ceny, galerie, filmy, formularz enquiry i Stripe;
- usprawnienie zgodności z Phase 13 (po wybraniu drugiej usługi podsumowanie nie jest niepotrzebnie usuwane w cyklu DOM).

## Wgraj na GitHub (najlepiej przez gałąź testową)

Rozpakuj ZIP. Do folderu głównego repozytorium LilKangoo/LilKangooMedia wgraj **wyłącznie**:

1. `index.html` — zamień obecny plik;
2. `home.html` — zamień obecny plik;
3. `assets/lkm-v3/service-detail-v14.js` — dodaj;
4. `assets/lkm-v3/service-detail-v14.css` — dodaj;
5. `assets/lkm-v3/service-bundle.js` — zamień obecny plik (zachowuje Phase 13 i poprawia cykl aktualizacji podsumowania).

Nie nadpisuj folderu `assets` ani `netlify` jako całości. Pozostałe pliki z ZIP, w tym `README` i `tests`, są do weryfikacji lokalnej — nie trzeba ich publikować.

**Uwaga na równoległe zmiany:** Pliki `index.html` i `home.html` opierają się na aktualnej strukturze strony w czasie przygotowania paczki i zawierają istniejące skrypty oraz dodatkowo Phase 13 i 14. Jeśli po tej dacie zmieniałeś nagłówki HTML, nie zastępuj ich bez porównania; możesz zamiast tego dodać ręcznie wyłącznie dwie linie:

```html
<link rel="stylesheet" href="/assets/lkm-v3/service-detail-v14.css">
<script defer src="/assets/lkm-v3/service-detail-v14.js"></script>
```

Obie linie powinny się znaleźć wewnątrz `<head>`, a skrypt Phase 14 musi zostać uruchomiony po `site.js`.

## Sprawdź w Netlify Deploy Preview

1. Usługa z 4 pakietami i płatnością miesięczną: `/#/service/cypruseye-partner-advertising` oraz `/home.html#/service/cypruseye-partner-advertising`.
2. Jedna z usług z pakietami godzinowymi (np. fotografia): wybierz drugi pakiet → „Configure package & request” → sprawdź wybraną cenę.
3. `#/quote`: dodaj inną usługę → sprawdź sumy miesięczne/jednorazowe i przejście dalej.
4. Usługa bez pakietów: pokaż „Custom quote”, bez wymyślonej ceny 0€.
5. Otwórz podgląd zdjęcia i filmu, sprawdź przewijanie i zamknięcie.
6. Telefony 320–390 px: brak poziomego scrolla, czytelne karty, działający CTA.
7. `#/request`: testowe zapytanie z kilku usług, sprawdź Enquiries & Bookings oraz e-mail.
8. Nie sprawdzaj płatności Stripe realną kartą w produkcji. Dla kilku usług wniosek pozostaje enquiry-only.

Podgląd może korzystać z PRODUKCYJNEJ bazy Supabase — nie zmieniaj aktywnych usług testowo, chyba że to zamierzone.

## Testy lokalne

Kod sprawdzono w Chromium na symulowanym katalogu: 13 usług obecnego przykładowego zestawu + jeden rekord CyprusEye z 4 pakietami miesięcznymi. Sprawdzono pojedyncze H1, ilości pakietów, brak duplikatu starego układu, wybór pakietu, przejście do Phase 13, dobranie drugiej usługi, przeliczenie, układ przy szerokościach 320, 375, 390, 768, 1024, 1440 px, brak błędów JavaScript. Testy nie zastępują weryfikacji z produkcyjnym Supabase i rzeczywistymi zdjęciami i filmami.

## Cofnięcie zmian

Z poprzedniej wersji przywróć `index.html`, `home.html`, `assets/lkm-v3/service-bundle.js`. Pozostałe dwa nowe pliki Phase 14 możesz pozostawić nieużywane albo usunąć. Nie trzeba przywracać bazy danych — migracji SQL nie ma.
