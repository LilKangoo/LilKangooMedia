# LilKangooMedia — Phase 26.2 / Command Center UX & Contrast Fix

**ZAKRES:** poprawka istniejącego `/admin.html`, a nie nowa strona administratora. Strona publiczna, Stripe, CRM i dane Supabase pozostają nietknięte.

## Instrukcja instalacji — 2 kroki

1. Otwórz repozytorium GitHub `LilKangoo/LilKangooMedia` i prześlij **3 pliki** z folderu `assets/lkm-v3/` tej paczki. Zastąp istniejące wersje, zachowując nazwy i ścieżki. Wykonaj **Commit / Push** i zaczekaj, aż Netlify pokaże status **Published**.
2. Otwórz **https://lilkangoomedia.com/admin.html#media**. Na Macu wykonaj **Shift + Command + R** (odświeżenie bez cache). Jeżeli strona jest już otwarta, zamknij poprzednie karty Admin i otwórz link ponownie.

**NOWY SQL: BRAK.** Nie uruchamiaj żadnych wcześniejszych migracji. Nie trzeba zmieniać ustawień Stripe, Storage ani środowiska Netlify.

## Pliki do zastąpienia

- `assets/lkm-v3/studio.mjs` — drag & drop, kolejka plików, przycisk ustawiania okładki w Master Media Library.
- `assets/lkm-v3/studio.css` — czytelne, aktywne pola uploadu i okładki w ciemnym interfejsie.
- `assets/lkm-v3/studio-embedded.css` — poprawa kontrastu zagnieżdżonych narzędzi, bez zmian ich logiki.

Folder `tests/` zawiera testy lokalne. Nie trzeba ich uruchamiać ani przegrywać do produkcji. `README-START-TUTAJ-PL.md` jest instrukcją.

## 1. Drag & drop w Master Media Library

Można upuścić fotografie bezpośrednio na poziomym polu **Drop photos here to upload** w bibliotece albo wybrać **Upload photos** i przeciągnąć je do większego obszaru w oknie. Można upuścić **jedną fotografię lub do 15 na raz**. Obsługiwane formaty to JPG, PNG i WebP, maksymalnie **8 MB na plik**. Upuszczenie pokazuje kolejkę i rozmiar; kliknięcie **Upload into master library** rozpoczyna transfer.

Zdjęcia zapisują się do istniejącego **publicznego** bucketu `portfolio` i do Master Media Library. **Nie pojawiają się automatycznie w Portfolio**, dopóki nie przypiszesz ich publicznie do projektu/kolekcji/usługi. Jednak *posiadacz bezpośredniego URL pliku może go otworzyć*, ponieważ bucket jest publiczny. **Nie przesyłaj tu prywatnych plików klientów** — do nich służy oddzielny, chroniony system Client Deliverables.

Jeśli któryś plik ma nieobsługiwany format lub przekroczy limit, zostanie pominięty i pojawi się ostrzeżenie. W razie błędów częściowego transferu komunikat pokaże liczbę poprawnie dodanych zdjęć.

## 2. Set cover photo

W **Master Media Library** kliknij miniaturę wybranego zdjęcia. W prawym panelu **Asset Inspector → Assignments & usage** kliknij **★ Set as cover photo**. Wybierz galerię, kolekcję lub projekt i zatwierdź. System używa istniejącego zdjęcia, przypina je jako **publiczne** do wskazanej galerii (jeśli nie było przypięte), a następnie ustawia `cover_image_id` i potwierdza zapis.

Ta czynność **nie publikuje samej galerii**, jeśli była ustawiona na Review/Private, i nie zmienia okładek innych galerii. Weryfikacja wymaga poprawnego działania istniejących reguł administracyjnych Supabase.

## 3. Spójny wygląd podstron administracyjnych

W panelu **Articles & SEO** poprawiono edytor treści i jego narzędzia: ciemna powierzchnia i czytelny jasny tekst. W **Customer Reviews** ukryto podwójny pasek boczny, poprawiono karty opinii, statystyki, formularze i ostrzeżenia. Dodatkowe reguły obejmują moduły **Services & Pricing, Portfolio legacy, CRM, Quotes, Calendar, Reports i Links Library**, łącznie z polami formularzy, statusami oraz kontrastem.

Reguły motywu są stosowane **wyłącznie w osadzonych wewnątrz Command Center modułach**, nie do samodzielnie otwieranych stron i nie do wydruku PDF wycen. W razie problemu stary panel działa nadal pod `/admin-legacy.html`.

## 4. Co sprawdzić po deployu

1. **Media Library:** upuść 1 JPG; po pojawieniu się kolejki potwierdź upload. Ponów test na 2–3 zdjęciach. Upewnij się, że zdjęcia pozostają bez publicznego przypisania.
2. **Cover:** wybierz jedno istniejące zdjęcie i ustaw okładkę w testowej galerii. Sprawdź, czy miniatura się zmienia.
3. **Articles:** otwórz istniejący wpis i sprawdź czytelność tekstu w polu edycji oraz przycisków.
4. **Reviews:** sprawdź, czy widać **jeden** pasek boczny i czy każdą opinię można odczytać.
5. **CRM / Quotes / Calendar / Reports / Services / Links:** przejdź przez zakładki, sprawdź pola formularzy i podpisy. **Nie wykonuj testowych płatności ani przypadkowych zapisów do danych klientów**.
6. **Telefon:** sprawdź szerokość i przewijanie na ekranie mobilnym.

## Kontrola jakości wykonana lokalnie

- `node --check` dla `studio.mjs` — PASS.
- **13/13** scenariuszy Chromium z mockiem Supabase i Storage — PASS.
- W testach stylów dla rzeczywistych starszych arkuszy CRM, Quotes, Reports i Calendar osiągnięto kontrast tekstu na testowanych kartach powyżej **11:1** (stan testowego DOM).
- Sprawdzono brak nowych migracji, brak zmiany kodu Stripe, zachowanie możliwości użycia jednego zdjęcia w wielu galeriach.

**Granica testów:** to testy lokalne, bez operacji na produkcyjnym Supabase. Aby potwierdzić działanie na live, wykonaj powyższą listę kontrolną po deployu. W razie błędu dołącz screenshot i tekst błędu z konsoli lub status z Supabase; nie uruchamiaj SQL na podstawie domysłów.

## Cofnięcie zmian

Jeżeli aktualizacja powoduje problem, przywróć **tylko trzy powyższe pliki** do wersji sprzed wdrożenia przez `Revert` w GitHub i wdroż ponownie przez Netlify. **Nie cofaj migracji Supabase** — ta paczka ich nie zawiera.
