# LilKangooMedia — Phase 16: kolejność sekcji usług

Paczka zmienia **tylko wygląd/układ** stron wszystkich usług. Nie dotyka Supabase, cen, pakietów, formularza ani płatności.

## Pliki do podmiany (tylko te dwa)

- `assets/lkm-v3/service-detail-v14.js` — replace
- `assets/lkm-v3/service-detail-v14.css` — replace

Nazwy plików pozostają `v14`, żeby nie zmieniać istniejących odniesień w `index.html` i `home.html`.

## Kolejność na stronie

1. Tytuł, krótki opis, galeria zdjęć i filmów
2. **About this service** — widoczny pełny opis bez dropdown (jeśli opis jest dłuższy niż wstęp)
3. **What we offer** — lista zalet/elementów usługi, jeśli wpisane w panelu admin
4. **Available packages** — rozwinięte informacje bez "Read package details"; dokładne included features z Phase 15
5. **How it works** — trzy poziome kroki na komputerze, pełna szerokość kontenera; pionowo na telefonie
6. **Plan & pricing / Ready to continue?** — podsumowanie wybranego pakietu i przycisk **Continue with this package →** (lub **Request a quote →** bez pakietów)

### Instalacja

1. Zaktualizuj repozytorium, najlepiej na gałęzi `lkm-service-flow-v16`.
2. Wgraj oba pliki **we właściwe katalogi**. Nie podmieniaj całych folderów.
3. Uruchom Netlify Deploy Preview.
4. Otwórz usługę `CyprusEye Partner Advertising`, `Portrait & Family Photography` i jedną usługę wycenianą indywidualnie.
5. Sprawdź zmianę pakietu, cenę w sekcji dolnej, przycisk przejścia do `#/quote`, zdjęcia, filmy i funkcjonalność Phase 13.
6. Po potwierdzeniu działania scal gałąź z `main`.

### Uwaga

- Nie ma migracji SQL i nie trzeba podmieniać `index.html`/`home.html`, jeśli skrypty Phase 14 już się tam ładują.
- Pełny opis jest wyświetlany tylko raz, kiedy dane pozwalają odróżnić go od krótkiego opisu. Jeżeli short description jest identyczny z full description, unikamy identycznej powtórki.
- Przy zmianie pakietu strona korzysta z tego samego mechanizmu kalkulacji co przed aktualizacją.
- Formularz wysyła zapytanie, **nie potwierdza rezerwacji ani nie pobiera automatycznej płatności**.
