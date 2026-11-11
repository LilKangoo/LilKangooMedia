# LilKangooMedia — Phase 26.4: Admin Contrast Hotfix

**Poprawka uzupełniająca do LKM 26.3.** Dotyczy błędów widocznych na dwóch zrzutach z 11 listopada 2026, bez zmian w bazie danych, formularzach ani logice aplikacji.

## Co naprawia

1. **Sales CRM → Client portal access:** biały prostokąt, niewidoczne opisy, teksty stanu, adres e-mail, linki i etykiety. Teraz karta jest ciemnozielona i czytelna.
2. **Sales CRM → Project & delivery tracking:** biały panel z jasnymi nagłówkami/opisami. Poprawiono także podrzędne pola, stany, notatki i komunikaty.
3. **Sales CRM → Files & deliverables:** profilaktyczna poprawka analogicznych jasnych kart w module dostarczania plików.
4. **Articles & SEO:** dotychczasowa poprawka stylowała `.cms-item`, ale prawdziwe wiersze artykułów to `.lkm-blog-item`. Poprawiono tła, tytuły, ścieżki, statusy Published/Review/Draft/Archived, hover, wybór i focus. Wewnętrzne okna edytora zachowują ciemny motyw.

**Dlaczego pozostały błędy po 26.3:** pliki źródłowe `article-admin.css`, `phase24-admin-portal.css`, `phase24-admin-projects.css` i `phase24-deliverables-admin.css` mają własne, jasne domyślne style. Poprzedni arkusz tematu nie obejmował wszystkich ich klas.

## Wdrożenie — tylko JEDEN plik

1. **Warunek:** najpierw musi być zainstalowana wersja **LKM 26.3**. Ta paczka jest poprawką do niej, a nie kompletnym projektem.
2. Rozpakuj ZIP **LKM_26_4_Admin_Contrast_Hotfix.zip**.
3. Otwórz swój katalog projektu / repozytorium **LilKangoo/LilKangooMedia** i przejdź do folderu:

   `assets/lkm-v3/`

4. Dla bezpieczeństwa zrób lokalną kopię dotychczasowego `studio-embedded.css`.
5. Z ZIP skopiuj **TYLKO**:

   `assets/lkm-v3/studio-embedded.css`

   **Podmień** dokładnie plik o tej samej nazwie we wskazanym folderze. Nie twórz dodatkowego podfolderu `assets` wewnątrz `assets/lkm-v3`.
6. Zapisz zmianę w GitHub (**Commit / Push**), następnie sprawdź w **Netlify → Deploys**, czy nowa wersja ma status **Published**.
7. W Chrome na Macu otwórz:
   - `https://lilkangoomedia.com/admin#crm` — sprawdź prawy panel „Client portal access”, „Project & delivery tracking” i „Files & deliverables”.
   - `https://lilkangoomedia.com/admin#articles` — sprawdź listę artykułów, statusy, zaznaczenie i wyszukiwanie.

   Po każdej stronie odśwież `Shift + Command + R` (hard refresh). Jeśli nadal widać stare style, otwórz stronę w oknie incognito, aby wykluczyć cache przeglądarki.

## Ważne — czego NIE robić

- **SQL: NIE JEST POTRZEBNY.** Nie otwieraj SQL Editora. Nie uruchamiaj ponownie migracji z LKM 26.3.
- **Nie podmieniaj** `studio.mjs`, `studio.css`, `admin.html`, `admin-crm.html`, `cms.js` ani plików `phase24-*` — nie były zmieniane.
- **Nie zmieniaj** ustawień Supabase, RLS, Stripe, cen, treści artykułów ani bazy danych.
- ZIP zawiera tylko zmieniony arkusz CSS i tę instrukcję. Rozpakowanie ZIP-a **nie wdraża** aktualizacji automatycznie.

## Kontrola i zakres testów

- Porównano pliki wersji 26.3 z repozytorium LilKangoo/LilKangooMedia (zgodne SHA).
- Potwierdzono rzeczywiste nazwy klas w kodzie repozytorium i kolejność podłączanych arkuszy.
- CSS przeszedł kontrolę składni.
- Lokalny test przeglądarkowy Chromium na makietach **odtwarzających rzeczywiste klasy i istotne reguły CSS**: szerokości 1400, 390 i 320 px. Zmierzony kontrast 15 reprezentatywnych elementów: **minimum 7,79:1**, czyli powyżej 4,5:1.
- **Nie testowano zalogowanej produkcyjnej aplikacji na prawdziwych danych Supabase.** Potwierdź rezultat na wskazanych ekranach po publikacji Netlify.

## Cofnięcie

Jeżeli zobaczysz nieoczekiwane zachowanie wizualne, przywróć kopię poprzedniego `assets/lkm-v3/studio-embedded.css` (z wersji 26.3), wykonaj Commit / Push i sprawdź Netlify Published. Brak migracji do cofania.
