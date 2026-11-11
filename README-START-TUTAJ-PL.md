# LilKangooMedia — Phase 29.4
## Mniejszy kangur i ruch na całej długości Home (aż do stopki)

Ta paczka zakłada **wdrożoną Phase 29.3**. Zmienia wyłącznie ruch dekoracyjnego logo i jego wielkość oraz przepuszczalność granatowej stopki, aby logo było widoczne również za nią. Pozostałe funkcje są bez zmian.

### 1. Podmiana plików

W lokalnym folderze projektu `LilKangooMedia` przejdź do `assets/lkm-v3/`. Najpierw utwórz kopię bezpieczeństwa. Następnie **podmień trzy pliki** z ZIP:

| Plik | Docelowe miejsce | Czynność |
| --- | --- | --- |
| `phase29-home.js` | `assets/lkm-v3/phase29-home.js` | PODMIEŃ |
| `phase29-home.css` | `assets/lkm-v3/phase29-home.css` | PODMIEŃ |
| `phase28-catalog.js` | `assets/lkm-v3/phase28-catalog.js` | PODMIEŃ (tylko aktualizacja wersji cache) |

**Nie podmieniaj** `index.html`, `site.js`, `site.css`, `service-detail-v14.js`, `reviews-public.js` i plików Supabase. Nowe pliki CSS/JS są ładowane automatycznie przez istniejący loader.

### 2. Co zostało zmienione

- Oryginalne logo: `/assets/lkm-v3/brand/logo-orange.png`, bez liter „LK” i bez nowej grafiki.
- Kangur około 25% mniejszy. W wersji mobilnej nie wychodzi tak daleko poza prawą krawędź.
- Przesunięcie pionowe obejmuje teraz ruch od górnej części pierwszego ekranu do dolnej części viewportu przy stopce — zależnie od rzeczywistego końca stopki.
- Ten sam ruch odtwarza się dokładnie w odwrotnym kierunku przy przewijaniu w górę.
- Biały pasek z czterema zaletami nadal pozostaje ponad dekoracją.
- Stopka pozostaje granatowa, ale jest lekko przezroczysta, aby znak mógł być subtelnie widoczny również za jej treścią.
- Przy `prefers-reduced-motion: reduce` ruch logo jest wyłączony.
- Ceny, oferty, formularze, menu, opis i reszta animacji pozostają bez zmian.

### 3. Wdrożenie

1. Otwórz GitHub Desktop i sprawdź listę zmienionych plików (powinny to być tylko trzy z tabeli).
2. Wykonaj Commit oraz Push.
3. Sprawdź w Netlify, czy wdrożenie ma status **Published**.
4. Otwórz `https://lilkangoomedia.com/#/` i odśwież `Shift + Command + R`.

### 4. Test po wdrożeniu

- Na komputerze przewiń od pierwszego ekranu do stopki: kangur powinien być mniejszy i poruszać się w dół zgodnie ze scrollem. Przy powrocie porusza się do góry.
- Przy białym pasku **Based in Cyprus** znak pozostaje za paskiem i nie utrudnia czytania.
- W stopce znak jest widoczny delikatnie za tłem i nie zakrywa linków.
- Sprawdź telefon; ani logo, ani tekst nie powinny tworzyć poziomego przewijania.
- Sprawdź menu, wybór usługi, pakietu i formularz; nie były modyfikowane.

### 5. SQL

**NIE JEST POTRZEBNY.** Nie uruchamiaj żadnych migracji Supabase.

### 6. Cofnięcie

Przywróć trzy wcześniejsze pliki z Phase 29.3 i wykonaj Commit/Push.

### 7. Testy lokalne

Wyniki testów dotyczą odtworzonego DOM w Chromium, a nie zalogowanej strony produkcyjnej. Wersję produkcyjną należy sprawdzić po opublikowaniu.
