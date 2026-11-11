# LilKangooMedia — Phase 26.5: Service Video & Admin Modal Contrast

## Punkt wyjścia

Jest to **poprawka uzupełniająca do zainstalowanej wersji 26.4** (nie pełna paczka projektu).
Sprawdzono plik `assets/lkm-v3/studio-embedded.css` w repozytorium GitHub
`LilKangoo/LilKangooMedia` przed przygotowaniem ZIP-a: jego Git blob SHA
`1426ee0be8277f3392aac725b6a4056be2e00253` był zgodny z paczką LKM 26.4.

## Co poprawia

1. **Services & Pricing → Videos for this service:** biały panel i nieczytelne jasne opisy. Teraz ciemna karta, czytelny nagłówek, opisy, liczba filmów, przyciski, karty przypiętych filmów i komunikaty.
2. **Okno Choose videos from library:** okno, filtry, pola formularzy, listy filmów, zaznaczenia, statusy, przyciski, tooltipy/napisy i focus klawiatury.
3. **Video Library:** ujednolicenie jasnego dotąd okna zarządzania filmami, wewnętrznych formularzy, wierszy i przycisków.
4. **Synchronize YouTube videos:** ciemne okno synchronizacji, czytelne tytuły, opisy, wyniki, formularze, statusy i ostrzeżenia.
5. **Okno wyboru zdjęcia i podgląd artykułu:** dodatkowa poprawka: `cms.js` tworzy okna poza `#cmsRoot`, więc wcześniejsze selektory nie obejmowały ich we wszystkich przypadkach.
6. **Usługowy photo picker:** powiązany panel „Choose a video instead” również otrzymuje właściwy kontrast.

Plik źródłowy `video-admin.js` wstrzykuje CSS dopiero w trakcie działania strony. Dlatego sama wcześniejsza poprawka ogólnego motywu była niewystarczająca. Nowe selektory celują wyłącznie w iframe administracyjny; NIE zmieniają stron publicznych ani wydruku ofert.

## Instalacja — JEDEN plik, BEZ SQL

1. Upewnij się, że korzystasz już z wersji **LKM 26.4**.
2. Pobierz i rozpakuj plik `LKM_26_5_Service_Video_Admin_Contrast.zip`.
3. Otwórz lokalny folder/repozytorium **LilKangooMedia**.
4. Zrób kopię zapasową pliku `assets/lkm-v3/studio-embedded.css`.
5. Z rozpakowanego ZIP-a skopiuj:

   `assets/lkm-v3/studio-embedded.css`

   do dokładnie tego samego miejsca w folderze projektu, zastępując stary plik.
   **Nie twórz dodatkowego folderu `assets` w `assets/lkm-v3`.**
6. Zrób **Commit + Push** do odpowiedniej gałęzi GitHub, z której wdrażany jest serwis.
7. Sprawdź w **Netlify → Deploys**, czy wdrożenie ma status **Published**.
8. W Chrome na Macu wykonaj twarde odświeżenie strony: **Shift + Command + R**.

## Co sprawdzić po wdrożeniu

- `https://lilkangoomedia.com/admin#services` — otwórz usługę i przewiń do **Videos for this service**. Opisy, przyciski i karty powinny być czytelne na ciemnym tle.
- Kliknij **Choose videos from library** — sprawdź filtry, zaznaczenie, przyciski, pustą listę i komunikaty; nie musisz nic zapisywać.
- W panelu/backupie otwórz **Video Library** oraz **Synchronize YouTube videos**, sprawdź opisy i formularze.
- `https://lilkangoomedia.com/admin#articles` — otwórz wybór zdjęcia i podgląd artykułu.
- `https://lilkangoomedia.com/admin#crm` — upewnij się, że poprawki 26.4 nadal działają.
- Sprawdź przy szerokim i wąskim oknie. Nie musisz zmieniać danych ani cen.

## SQL / inne pliki

**SQL: NIE JEST POTRZEBNY.** Nie uruchamiaj migracji Supabase i nie zmieniaj RLS.
**Nie podmieniaj:** `studio.mjs`, `studio.css`, `video-admin.js`, `video.css`, `admin.html`, `admin-legacy.html`, `cms.js`, `phase24-*` ani żadnych innych plików. Nie zmieniamy logiki zapisów, filmów, galerii ani cennika.

## Weryfikacja przed wydaniem

- Plik bazowy jest zgodny z GitHub i wersją LKM 26.4.
- Audyt selektorów w aktualnych źródłach: `video-admin.js`, `video.css`, `cms.js`, `article-admin.css`, `studio-embedded.css` i istniejące moduły CRM.
- Test CSS: brak błędów składni na poziomie reguł.
- Lokalny Chromium: **29 reprezentatywnych elementów × 3 szerokości (1400, 390, 320 px)**, minimalny zmierzony kontrast **6,96:1**. Użyto testowej strony odtwarzającej odpowiednie źródłowe klasy i deklaracje CSS, włącznie z CSS dołączanym dynamicznie.
- Poza osadzonym panelem administracyjnym sprawdzono, że nowe reguły nie zmieniają wyglądu publicznego/nieosadzonego komponentu.
- **Nie wykonano pełnego testu zalogowanego panelu z produkcyjnym Supabase.** Po wdrożeniu sprawdź rzeczywiste ekrany. Lokalny przegląd selektorów nie gwarantuje wykrycia wszystkich możliwych stanów danych.

## Jak cofnąć

Przywróć skopiowany przed instalacją plik `assets/lkm-v3/studio-embedded.css` z 26.4, zrób Commit + Push i sprawdź publikację w Netlify. Żadnego SQL nie trzeba cofać.
