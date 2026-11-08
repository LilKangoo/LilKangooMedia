# LilKangooMedia — odtworzenie oryginalnych galerii (Phase 4)

**Stan:** przygotowany import SQL dla pięciu galerii zweryfikowanych bezpośrednio w historycznych plikach HTML na GitHubie. Nie zmienia kodu strony, konfiguracji, zdjęć ani formularzy. **Nie został jeszcze wykonany na Twoim Supabase.**

## Szybki import — możesz zrobić od razu

1. W Supabase projektu **LilKangooMedia** otwórz **SQL Editor → New query**.
2. Otwórz `sql/01-IMPORT-VERIFIED-LEGACY-GALLERIES.sql`, skopiuj CAŁĄ zawartość i uruchom **Run**. To SQL dla bazy CMS utworzonej w Phase 1.
3. Na końcu zapytania pojawi się lista galerii i liczba przypisanych zdjęć. Powinieneś zobaczyć: **Portraits 52**, **Nature 28**, **Products 34**, **Graphic Design 22**, **Igor & Gabrysia 74**. Razem **210 powiązań zdjęć**.
4. Otwórz `https://lilkangoomedia.com/admin.html` → **Portfolio & Galleries**. Cztery oryginalnie publiczne galerie są oznaczone jako `public`, a galeria klienta **Igor & Gabrysia** jako `review` (niewidoczna publicznie).
5. Sprawdź `https://lilkangoomedia.com/portfolio.html` w oknie prywatnym. Cztery galerie kategorii powinny już być widoczne. Jeśli wyświetlą się brakujące fotografie, zobacz `review/PHOTO-ASSIGNMENTS-VERIFIED.csv` i skoryguj nieistniejące adresy (zanim dokonasz dalszej publikacji).

**Uwaga:** te cztery galerie były dostępne publicznie na starych podstronach, dlatego import utrzymuje ich publiczny charakter. Indywidualne albumy klientów publikuj dopiero po ocenie prywatności i zgód. W trakcie importu nie kopiujemy żadnych zdjęć do Supabase Storage — zachowujemy istniejące URL `/assets/images/*`.

**Bezpieczeństwo:** SQL jest powtarzalny (`ON CONFLICT DO NOTHING`), nie usuwa zdjęć ani starych podstron. Zmienia wyłącznie ograniczenie `UNIQUE(original_path)` w tabeli `portfolio_images`, aby jedno zdjęcie mogło należeć do kilku galerii. W zamian dodaje indeks unikalny `(gallery_id, original_path)`. Jeżeli zależy Ci na możliwości cofnięcia zmian, utwórz wcześniej backup bazy.

## Pełna inwentaryzacja wszystkich dawnych galerii (następny krok)

W repozytorium są liczne osobne strony sesji i niektóre mają tytuł **Protected Page**. Nie można z nich bezpiecznie odczytać przyporządkowania zdjęć, jeśli nie zawierają jawnej galerii HTML. **Nie przypisujemy fotografii do klientów tylko na podstawie podobnych nazw plików.**

Do pełnego importu masz skrypt, który przeszukuje **CAŁE lokalne repozytorium** i automatycznie odtwarza zdjęcia w kolejności **wewnątrz sekcji oryginalnej galerii Mobirise**, również dla innych jawnych galerii realizacji.

### MacBook, Terminal

Otwórz folder repozytorium `LilKangooMedia` (ten, w którym są m.in. `Portraits.html`, `Nature.html`, `Products.html`, `GraphicDesign.html` i `assets/images`). Otwórz w nim Terminal albo użyj `cd`.

Paczka ZIP musi zostać rozpakowana. Uruchom poniższe polecenie, podmieniając ścieżkę do rozpakowanej paczki na swoją:

```bash
python3 "/ścieżka/do/LilKangooMedia_Legacy_Galleries_Phase4/scripts/build_legacy_import.py" . --output "$HOME/Desktop/LKM-Galleries-Review"
```

Jeśli nie wiesz, jak wpisać pełną ścieżkę, możesz przeciągnąć plik `build_legacy_import.py` z Findera bezpośrednio do Terminala, a za ścieżką dopisać ` . --output "$HOME/Desktop/LKM-Galleries-Review"`.

Na pulpicie powstaną:

- `GALLERIES-REVIEW.csv` — lista wszystkich galerii, prawdziwych stron źródłowych, kategorii, ilości zdjęć i statusu publikacji.
- `PHOTO-ASSIGNMENTS.csv` — **każde zdjęcie i jego prawdziwa stara galeria**, z dokładną kolejnością.
- `SKIPPED-AND-PROTECTED.csv` — strony chronione hasłem, artykuły i strony, z których nie da się wiarygodnie pobrać galerii.
- `UNASSIGNED-FILES.csv` — obrazy dostępne w `assets/images`, które nie występują w żadnej potwierdzonej galerii i wymagają manualnej klasyfikacji.
- `MISSING-IMAGE-FILES.csv` — zdjęcia wskazane na starej stronie HTML, ale nieodnalezione lokalnie.
- `IMPORT-LEGACY-GALLERIES.sql` — SQL dla pełnego importu. **Nie uruchamiaj go przed przejrzeniem CSV.**

Wszystkie pozostałe galerie klientów otrzymują domyślnie kategorię **Client Projects — Review** i status **review**. Admin może następnie ustawić prawidłowe kategorie i zdecydować, które realizacje mają się wyświetlać publicznie. Nie wpisujemy do kategorii „Wedding” na podstawie zgadywania po nazwisku lub numerze fotografii.

### Ważne ograniczenia

- Katalog `assets/images` ma ponad tysiąc pozycji. **To nie znaczy, że każda z nich była galerią publiczną.** Wśród nich mogą być miniatury, loga i zdjęcia prywatnych sesji. Wszystkie pozostają w oryginalnym folderze; nie przenosimy ani nie kasujemy.
- Albumy ze starych stron z hasłem (`Protected Page`) mogą wymagać osobnego, ręcznego mapowania oryginalnego źródła/backupów. Sam katalog `assets/images` nie jest wystarczającym dowodem przynależności zdjęcia do danej sesji.
- Import do Supabase **nie zmienia** plików `Portraits.html`, `Nature.html`, `Products.html`, `GraphicDesign.html` ani starych linków SEO. Nowe galerie są prezentowane przez istniejący `/portfolio.html`. Przekierowania i docelowe adresy SEO galerii możemy zaprojektować osobno.
- Obecny publiczny kod CMS może pobierać jednorazowo maksymalnie 1000 rekordów zdjęć. Przy pełnym imporcie przekraczającym ten limit konieczna jest paginacja frontendu; część zdjęć może nie pojawić się przed jej dodaniem. Z tego powodu nie publikuj całego masowego importu, dopóki jej nie wdrożymy.

### Podstawowe testy

W folderze paczki:

```bash
python3 -m unittest discover -s tests -v
```

Skrypt korzysta wyłącznie ze standardowej biblioteki Python 3, bez instalowania dodatkowych pakietów i bez kluczy Supabase.
