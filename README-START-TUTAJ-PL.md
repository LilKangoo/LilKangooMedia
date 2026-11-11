# LilKangooMedia — Phase 28.0: Compact Gradient Services Catalogue

Data: 11 listopada 2026

## ZAWARTOŚĆ PACZKI — dokładnie trzy pliki do skopiowania

1. `assets/lkm-v3/service-detail-v14.js` — **PODMIEŃ istniejący plik**. Zawiera dotychczasowy układ Phase 27 oraz mały moduł, który wczytuje Phase 28. Bez utraty poprzedniego wyglądu pojedynczej usługi.
2. `assets/lkm-v3/phase28-catalog.js` — **DODAJ NOWY plik**. Rozbudowuje katalog `/#/services` i jego karty, nie zmieniając logiki w `site.js`.
3. `assets/lkm-v3/phase28-catalog.css` — **DODAJ NOWY plik**. Odpowiada za styl gradientu, przełącznika i responsywne karty.

**Wszystkie trzy pliki umieść w istniejącym folderze `LilKangooMedia/assets/lkm-v3/`.** Nie kopiuj folderu `assets` do już istniejącego `assets/lkm-v3/` (unikaj zagnieżdżenia `assets/lkm-v3/assets/lkm-v3/`).

## INSTALACJA

1. **Warunek:** upewnij się, że wcześniejsza wersja Phase 27.0 działa na stronie (użytkownik potwierdził ją w rozmowie). Paczka zawiera kompletny plik `service-detail-v14.js` bazujący na dostarczonej Phase 27.
2. Zapisz kopię dotychczasowego `LilKangooMedia/assets/lkm-v3/service-detail-v14.js` poza folderem lub zachowaj jego wersję w GitHub.
3. Rozpakuj ZIP. W folderze projektu podmień `assets/lkm-v3/service-detail-v14.js` oraz dodaj `phase28-catalog.js`, `phase28-catalog.css` w `assets/lkm-v3/`.
4. Nie zmieniaj `index.html`, `site.js`, istniejącego `phase27-service.css`, innych stylów, konfiguracji Supabase, danych ani innych plików.
5. Wykonaj **Commit / Push** do repozytorium GitHub. Poczekaj na status **Published** w Netlify (nie zakładaj, że GitHub commit oznacza automatycznie zakończony deploy).
6. Otwórz **https://lilkangoomedia.com/#/services?audience=business** i wykonaj twarde odświeżenie `Shift + Command + R` w Chrome na Macu.
7. Sprawdź również **https://lilkangoomedia.com/#/services?audience=personal**.

## JAK DZIAŁA PHASE 28

- Widoczny, podpisany przełącznik „Personal Services” / „Business Services” z ikonami, opisem i oznaczeniem aktywnej zakładki.
- Kompaktowe karty: fotografia wypełnia całe tło, jej lewa część pozostaje eksponowana, a po prawej ciemnozielony gradient pozwala czytać tytuł, cenę i opis.
- Cena i jej model pochodzą z istniejących, renderowanych danych. Nie ma nowych wartości ani zgadywania cen. Jeśli w cenniku cena zaczyna się już od „From”, nie dublujemy etykiety „Packages from”.
- Zamiast opisów korzyści wymyślonych przez szablon, pokazujemy do trzech istniejących `features` z danych usługi. Gdy ich nie ma — dotychczasowe `summary`.
- W katalogu ukryte zostają powtarzające się „Explore”, „Quick enquiry”, „Build a quote”, które były dodawane przez stare moduły. **Nadal istnieją i działają na stronach usług oraz w procesach formularzy**.
- Całą kartę pokrywa jeden dostępny z klawiatury link do `#/service/<slug>`. Kliknięcie zdjęcia, tekstu, ceny lub pustej przestrzeni otwiera ofertę.
- Filtry kategorii, wyszukiwarka, SPA routing, indywidualne oferty Phase 27, ceny, formularze, Supabase, Stripe i CRM pozostają nienaruszone.
- Kod i CSS są ograniczone wyłącznie do widoku katalogu `/#/services`; inne podstrony nie otrzymują tych zmian.

## TEST PO WDROŻENIU

**Komputer:**
1. Na Business Services znajdź np. „Commercial Video & Reels”. Kliknij osobno zdjęcie, cenę i pustą przestrzeń karty. Za każdym razem powinno otwierać jej szczegóły.
2. Wróć, przełącz na Personal Services. Powinny wyświetlić się właściwe usługi, a etykieta aktywnego wyboru powinna się zmienić.
3. Wybierz kategorię i wyszukaj usługę; upewnij się, że filtry działają jak wcześniej.
4. Na stronie szczegółowej sprawdź pakiety, ich wybór, podsumowanie i przejście do zapytania (Phase 27 nie został zastąpiony).

**Telefon:**
1. Sprawdź przełącznik, cenę, czytelność tekstu na gradiencie i brak poziomego przewijania.
2. Kliknij kartę w miejscu zdjęcia oraz nad tekstem; powinna prowadzić do właściwej usługi.
3. Zweryfikuj stronę usługi i przycisk kontynuacji.

## TESTY WYKONANE PRZED WYDANIEM

- Test odtworzonego katalogu w Chromium / Playwright, ze strukturą DOM i selektorami faktycznych modułów `site.js`, `phase20-conversion.js`, `phase20-ux.js` i `phase25-conversion.js`.
- Rozdzielczości: 1440, 1130, 1024, 800, 760, 700, 390 i 320 px.
- Sprawdzone: przełącznik Personal/Business; liczba kart; wszystkie pełnokartowe linki; rzeczywista nawigacja linku; etykiety cen; ukrycie starych przycisków; brak poziomego przewijania; brak błędów JS testu.
- `node --check` dla obu plików JS.

**Granice testów:** przeglądarka testowała lokalny katalog z przykładowymi danymi, a nie zalogowaną produkcję z Supabase. Żadne dane produkcyjne nie zostały zmienione i nie twierdzimy, że proces produkcyjny został w pełni przetestowany.

## SQL

**NIEPOTRZEBNY.** Nie uruchamiaj żadnych migracji ani zapytań SQL.

## ROLLBACK

Jeśli wystąpi nieoczekiwany problem, przywróć z kopii poprzedni `assets/lkm-v3/service-detail-v14.js` (Phase 27). Nowe `phase28-catalog.js` i `phase28-catalog.css` można pozostawić, ponieważ bez loadera nie będą wczytywane, lub je usunąć. Wykonaj Commit / Push i sprawdź Published. Nie cofaj żadnego SQL.
