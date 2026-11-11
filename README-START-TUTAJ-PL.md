# LilKangooMedia — Phase 28.2
## Kafelki Home „Find exactly what you need.” w stylu Services 28.1

Paczka jest **nakładką na Phase 28.1**. Nie zmienia danych w Supabase ani logiki usług i zapytań.

### Co zostało zmienione
- Wyłącznie kafelki sekcji **Find exactly what you need.** na stronie głównej (Home) korzystają z tego samego wyglądu co karty katalogu `#/services`.
- Kompaktowa karta ma fotografię wycentrowaną w widocznej lewej części (`object-fit: cover; object-position: 50% 50%`), płynny **czarny** gradient i biały tytuł po prawej.
- Zachowane zostały istniejące **krótkie opisy** z Home — zamiast trzech punktów z CMS wyświetlanych w katalogu Services.
- Zachowane: istniejące ceny i sposoby ich prezentowania (w tym ceny miesięczne i wyceny indywidualne), kategorie, zdjęcia i linki do ofert.
- Kliknięcie **całego kafelka** otwiera szczegóły danej usługi; nadmiarowe przyciski Quick enquiry / Build a quote / Explore nie zajmują miejsca na kartach.
- Pozostałe sekcje Home (nagłówek, Personal/Business, portfolio, kontakt) pozostają nietknięte.
- Katalog Services z poprzedniej wersji zachowuje gradient, krótkie korzyści, filtrowanie i wyszukiwarkę.

### Instalacja na Macu — krok po kroku
1. Upewnij się, że w projekcie jest już Phase 28.1.
2. Przed podmianą zrób kopię zapasową tych trzech aktualnych plików.
3. Rozpakuj ZIP. W paczce znajdziesz folder `assets/lkm-v3/`.
4. W swoim lokalnym folderze repozytorium `LilKangooMedia/assets/lkm-v3/` podmień dokładnie **trzy pliki**:
   - `assets/lkm-v3/phase28-catalog.css`
   - `assets/lkm-v3/phase28-catalog.js`
   - `assets/lkm-v3/service-detail-v14.js`
5. Zrób **Commit / Push** na GitHub w używanej gałęzi produkcyjnej.
6. Sprawdź, że Netlify zakończył wdrożenie ze statusem `Published`.
7. Otwórz https://lilkangoomedia.com/ i odśwież stronę przez **Shift + Command + R**.

### Sprawdź po wdrożeniu
- Sekcja **Find exactly what you need.**: foto z lewej, czarny gradient i tekst z prawej, krótki opis pod ceną.
- Wybór dowolnego z sześciu wyróżnionych kafelków prowadzi do tej konkretnej oferty.
- W wersji mobilnej karty nie powodują poziomego przewijania.
- https://lilkangoomedia.com/#/services?audience=business i https://lilkangoomedia.com/#/services?audience=personal — katalog powinien wyglądać i działać jak w 28.1.
- W detalach usługi nadal można wybrać pakiet i przejść do formularza zapytania.

### SQL
**Niepotrzebny.** Nie uruchamiaj migracji ani skryptów Supabase.

### Testy wykonane przy przygotowaniu
- 11 szerokości w Chromium (320, 360, 390, 420, 700, 760, 800, 1024, 1130, 1280, 1440 px): **PASS**.
- Widok Home: sześć przykładowych kart, tekst opisu pozostaje niezmieniony, ceny i pełny obszar klikalny.
- Regresja katalogu Services: zachowane korzyści i przełącznik, brak poziomego przewijania.
- Zdjęcia i opisy w testach są przykładowe; **nie jest to test z rzeczywistą bazą produkcyjną**. Finalne zachowanie potwierdź po wdrożeniu.

### Cofnięcie zmian
Przywróć kopie zapasowe trzech plików z wersji **Phase 28.1**, zrób Commit/Push i odśwież stronę. Cofanie bazy danych nie jest wymagane.
