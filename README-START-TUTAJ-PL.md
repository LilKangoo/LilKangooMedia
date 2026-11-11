# LilKangooMedia — Phase 29.5
## Większy kangur bliżej środka strony — bez zmian animacji

Ta paczka zakłada, że na stronie jest już wdrożona **Phase 29.4**.

### 1. Podmień dwa pliki

1. Pobierz i rozpakuj ZIP.
2. Otwórz lokalny folder projektu `LilKangooMedia`.
3. Wejdź do folderu `assets/lkm-v3/`.
4. Zrób kopię bezpieczeństwa, a potem podmień **tylko** poniższe pliki:

| Plik w ZIP | Miejsce docelowe | Czynność |
|---|---|---|
| `assets/lkm-v3/phase29-home.css` | `assets/lkm-v3/phase29-home.css` | **PODMIEŃ** |
| `assets/lkm-v3/phase28-catalog.js` | `assets/lkm-v3/phase28-catalog.js` | **PODMIEŃ** (wersja CSS w cache: 29-5) |

**Nie zmieniaj** `phase29-home.js`, `site.js`, `site.css`, `index.html`, `service-detail-v14.js`, `phase28-catalog.css`, plików Supabase ani panelu administracyjnego.

### 2. Co się zmieniło

- Oryginalne logo kangura (`/assets/lkm-v3/brand/logo-orange.png`) jest większe: na desktopie maksymalnie ok. **445 px**, na telefonie maksymalnie **290 px**. Jest to wzrost około 30–40%, zależnie od szerokości ekranu.
- Logo zostało przesunięte w lewo do pozycji, w której środek znaku znajduje się około **71% szerokości ekranu**, licząc od lewej strony — mniej więcej w połowie drogi między prawą krawędzią a środkiem.
- Nadal przesuwa się od początku strony aż do stopki; przewijanie w górę odwraca jego ruch.
- Warstwy, przezroczystość, biała belka z zaletami, menu, animacje sekcji, oferty, ceny i formularze pozostały bez zmian.
- Ograniczenie ruchu (`prefers-reduced-motion`) nadal działa.

### 3. Publikacja

1. W GitHub Desktop sprawdź, czy zmieniły się tylko **dwa** wymienione pliki.
2. Zrób **Commit** i **Push**.
3. Sprawdź status **Published** w Netlify.
4. Otwórz `https://lilkangoomedia.com/#/` i odśwież: **Shift + Command + R**.

### 4. Sprawdź po wdrożeniu

- Na desktopie kangur powinien być bardziej w centrum strony, ale nadal po prawej stronie.
- Na telefonie logo powinno być większe, ale nie może powodować poziomego scrolla.
- Przewiń aż do stopki i z powrotem: pozycja kangura powinna zmieniać się płynnie.
- Biała belka, kafelki i opisy muszą pozostać czytelne.

### 5. SQL

**Nie jest potrzebny.** Bez zmian danych Supabase.

### 6. Cofnięcie

Przywróć te dwa pliki z poprzedniej paczki `LKM_29_4_Kangaroo_Smaller_Full_Page_Scroll.zip` i wykonaj Commit/Push.

Testy przeprowadzone na lokalnym odtworzonym widoku — potwierdź zachowanie na działającej stronie po wdrożeniu.
