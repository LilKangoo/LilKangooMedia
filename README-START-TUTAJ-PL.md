# LilKangooMedia — Phase 15 / Service Copy & Features

## Co otrzymujesz

- Profesjonalne opisy po angielsku dla **14 usług** (13 z katalogu + CyprusEye Partner Advertising).
- Osobne `features` usługi i `features` każdego zweryfikowanego pakietu.
- Admin: dodawanie, edycja, usuwanie, przesuwanie cech góra/dół, osobno dla usługi i każdego pakietu.
- Nowoczesna prezentacja tych cech na aktualnym szablonie Phase 14.
- Zmiana widocznej nazwy `brand-launch-packages` na **Brand Launch & Creative Setup**, bez zmiany URL/slug.
- **Nie zmieniamy cen, rozliczeń, pakietów, dodatków, zdjęć, filmów ani Stripe.**

## Kolejność instalacji

1. **Backup**: w Supabase Table Editor → `public.services` → Export CSV. To jest baza produkcyjna; koniecznie zapisz kopię.
2. W projekcie Supabase LilKangooMedia otwórz **SQL Editor** i wklej całość pliku `supabase/migrations/20261109_lkm_service_features_phase15.sql`. Wykonaj RUN.
3. Sprawdź wynik SELECT: powinno być 14 rekordów, jeśli wszystkie istnieją w bazie. W przypadku brakujących pozycji nie tworzy nowych usług; najpierw sprawdź ich slugi.
4. W GitHubie utwórz gałąź testową `lkm-service-features-v15` z aktualnej `main`.
5. Dodaj / zastąp **wyłącznie** cztery pliki (zachowaj ścieżki):
   - `assets/lkm-v3/admin.js` — ZASTĄP
   - `assets/lkm-v3/admin-unified.css` — ZASTĄP
   - `assets/lkm-v3/service-detail-v14.js` — ZASTĄP
   - `assets/lkm-v3/service-detail-v14.css` — ZASTĄP
6. Nie zmieniaj `index.html`, `home.html`, `site.js`, `service-bundle.js`, Netlify Functions ani żadnych folderów ze zdjęciami.
7. Sprawdź **Netlify Deploy Preview**: `/#/service/portrait-photography`, `/#/service/brand-launch-packages`, `/#/service/cypruseye-partner-advertising`, `/#/quote`, admin `#services`.
8. Zwróć uwagę: **Deploy Preview korzysta z produkcyjnego Supabase**, dopóki nie masz osobnego środowiska.
9. Kiedy wszystko działa, połącz zmiany do `main`.

## Jak edytować Features

Admin → Services & Pricing → Edit: pod Full description jest sekcja **Service highlights**. W każdym wariancie pod Package summary znajdziesz **Included in this package**. Możesz dodawać, usuwać oraz zmieniać kolejność strzałkami; kliknij **Save changes** żeby zapisać cały rekord.

## Ważna ochrona aktualnych pakietów

SQL **nie zmienia** `price_cents`, `pricing_model`, `show_from`, `package_id` i żadnych innych ustawień cenowych. Do `packages` dodaje jedynie pole `features` i tylko wtedy, gdy identyfikator pakietu oraz jego aktualny opis odpowiadają zweryfikowanej wersji oryginalnej, a `features` są dotąd puste. **Pakiety edytowane ręcznie pozostają bez zmian**. Wtedy uzupełnij ich features z poziomu admina.

## Bezpieczeństwo i testy

- Uruchom SQL przed podmianą admin.js, bo nowy formularz zapisuje kolumnę `features`.
- Kod używa `textContent` do prezentowania treści, bez interpretacji HTML w feature.
- Skrypt SQL może być ponownie uruchomiony; zaktualizuje opis główny ponownie. Nie uruchamiaj po ręcznym edytowaniu opisów, bo zresetuje tekst.
- Po teście porównaj `price_cents` w Supabase z eksportem CSV sprzed migracji.
- Materiał `docs/SERVICE-COPY-EN.md` jest przeznaczony do przeglądu tekstów i nie wymaga publikacji w GitHubie.

## Cofnięcie

GitHub: przywróć cztery pliki z wcześniejszego commita. Supabase: przywróć `summary`, `description`, `features`, tytuł i pakietowe `features` z własnego eksportu (nie nadpisuj innych kolumn/rekordów).

