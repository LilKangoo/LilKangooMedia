# LilKangooMedia — Phase 29.3
## Poprawka Home: mobile overlay, granatowa stopka, kangur w tle i animacje przy przewijaniu

Paczka jest przygotowana **dla strony mającej już wdrożoną Phase 29.2**. Zawiera dokładnie trzy pliki JavaScript/CSS oraz tę instrukcję. Nie modyfikuje cennika, zapytań, kalendarza, danych i Supabase.

### 1. Podmień pliki

W lokalnym repozytorium LilKangooMedia otwórz `assets/lkm-v3/`.

Zrób kopię dotychczasowych trzech plików, potem skopiuj z ZIP i **PODMIEŃ**:

| Plik z ZIP | Docelowa ścieżka | Operacja |
| --- | --- | --- |
| `assets/lkm-v3/phase28-catalog.js` | `assets/lkm-v3/phase28-catalog.js` | PODMIEŃ |
| `assets/lkm-v3/phase29-home.js` | `assets/lkm-v3/phase29-home.js` | PODMIEŃ |
| `assets/lkm-v3/phase29-home.css` | `assets/lkm-v3/phase29-home.css` | PODMIEŃ |

**Nie ruszaj:** `index.html`, `site.js`, `site.css`, `service-detail-v14.js`, `reviews-public.js`, plików panelu administratora i bazy danych. Nie dodawaj żadnych tagów `<script>` ani `<link>` — loader w `phase28-catalog.js` załaduje dwa pozostałe pliki z parametrem `v=29-3`.

### 2. Co zostało naprawione

- **Mobile, Real moments / Remarkable stories:** zdjęcie i jego kontener mają tę samą wysokość; tekst nie nakłada się na obraz. Naprawa działa przy 320–760 px.
- **Stopka tylko na Home:** granatowa zamiast ciemnozielonej, czytelne teksty i linki, nie dotyczy osobnych stron publicznych.
- **Oryginalny kangur LilKangooMedia:** użyty istniejący `/assets/lkm-v3/brand/logo-orange.png` (bez monogramu „LK”). Znak wyświetlany w tle od pierwszego ekranu do końca Home, za treścią i za zachowanym białym paskiem z zaletami.
- **Scroll obu kierunków:** znak porusza się i delikatnie obraca w oparciu o pozycję scroll; ruch dokładnie odwraca się przy przewijaniu w górę.
- **Sekcje i kafelki:** szybkie, krótkie animacje pojawiania z dołu, z lewej i prawej, powtarzane przy ponownym wejściu w viewport. Animowane są jedynie `opacity` i `transform`, bez zmiany wysokości lub układu.
- **Dostępność:** animacje są wyłączane przy `prefers-reduced-motion: reduce`; fokus klawiatury utrzymuje widoczność aktywnego elementu.
- **Nawigacja:** wszystkie dotychczasowe linki pozostają niezmienione; nie modyfikujemy ich logiki ani routera.

### 3. Wdrożenie

1. W GitHub Desktop sprawdź, że zmodyfikowane są **tylko trzy pliki** z tabeli.
2. Wykonaj Commit i Push.
3. Sprawdź status `Published` we wdrożeniu Netlify powiązanym z repozytorium.
4. Otwórz `https://lilkangoomedia.com/#/` i wykonaj twarde odświeżenie na Macu: `Shift + Command + R`.

### 4. Co koniecznie sprawdzić na stronie

1. Telefon (np. 390 px): `Real moments. Remarkable stories.` nie zachodzi na zdjęcie. Powinno być oddzielne, równe kadrowanie i tekst pod zdjęciem.
2. Stopka Home: widoczna ciemnogranatowa zamiast zielonej; linki czytelne.
3. Na górze strony kangur jest subtelnie widoczny za treścią; biały pasek `Based in Cyprus...` pozostaje biały i zakrywa dekorację.
4. Podczas przewijania w dół i w górę znak pozostaje w tle, a karty i sekcje płynnie wchodzą w widok ponownie.
5. Rozwiń menu `Services`, kliknij Personal i Business; sprawdź również portfolio, opinie, artykuły, About i Contact.
6. Wybierz usługę i pakiet oraz otwórz zapytanie — żadne funkcje biznesowe nie powinny się zmienić.
7. Przetestuj na komputerze i telefonie; jeśli widać starsze style, sprawdź czy Netlify rzeczywiście opublikowało nową wersję.

### 5. SQL

**NIE JEST POTRZEBNY.** Żadnych migracji Supabase.

### 6. Cofnięcie zmian

Przywróć te same trzy pliki z poprzedniej kopii (Phase 29.2), wykonaj Commit i Push. Pozostałych plików nie trzeba dotykać.

### 7. Zakres wykonanych testów

Testy w lokalnym, odtworzonym DOM w Chromium: **10 szerokości** (320, 360, 375, 390, 430, 620, 760, 1024, 1280, 1440 px), brak nachodzenia zdjęcia i tekstu, prawidłowy kolor stopki, biała belka, zachowane menu/odnośniki, logo z właściwego pliku, odwracalne transformacje przy scroll up/down, powtarzalne wejście sekcji do widoku, `prefers-reduced-motion`, brak poziomego overflow i błędów JavaScript.

**Uwaga:** testy są lokalne na odtworzonych komponentach, nie zastępują kontroli zalogowanej/produkcyjnej witryny. Paczka nie publikuje plików samodzielnie.
