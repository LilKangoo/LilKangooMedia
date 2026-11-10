# LilKangooMedia — Phase 24.3: Client Deliverables

Jedna paczka `LKM_24_3.zip` to **aktualizacja nakładkowa**: wgraj zawartość do korzenia repozytorium `LilKangoo/LilKangooMedia`, zachowując foldery. Nie kasuj innych plików projektu.

## 1. SQL — TYLKO TEN JEDEN PLIK

**URUCHOM:** `supabase/migrations/20261110_lkm_client_deliverables.sql`.

Supabase → SQL Editor → New query → wklej cały plik → Run. **Zrób ten krok PRZED wdrożeniem GitHub/Netlify.**

**NIE URUCHAMIAJ:** wszystkich poprzednich plików SQL, w szczególności:
- `20261110_lkm_client_portal_foundation.sql`
- `20261110_lkm_client_projects.sql`
- `20261110_lkm_quotations.sql`
- `20261110_lkm_crm_admin_controls.sql`

**Starsze SQL zmienione w tej paczce: BRAK.** W ZIP jest tylko jeden plik `.sql`. Nowy SQL tworzy prywatny bucket `lkm-client-deliverables`, jedną tabelę metadanych i niezbędne zasady RLS i funkcję read-only dla klienta.

## 2. GitHub

Rozpakuj `LKM_24_3.zip`, wgraj zawartość do istniejącego repozytorium i wykonaj Commit/Push. Netlify powinien uruchomić deploy. Nie dodawaj nowych kluczy i nie zmieniaj `lkm-config.js`.

Zmodyfikowane istniejące pliki: `admin-crm.html`, `client.html`, `assets/lkm-v3/phase24-client.mjs`.

Nowe moduły i style w `assets/lkm-v3/phase24-deliverables-*` oraz migracja SQL. Formularze, CRM, Stripe, rezerwacje, wcześniejsze migracje i dane nie są modyfikowane.

## 3. Jak używać

**Admin:** otwórz `/admin-crm.html`, wybierz klienta, przewiń do `Project & delivery tracking` (Phase 24.2) i utwórz/zapisz projekt. Poniżej pojawia się `Files & client deliveries`:

- `Add a private file`: maksymalnie 20 plików w jednej paczce (JPG, PNG, WebP, HEIC, MP4, MOV, PDF lub ZIP), każdy do 45 MB, upload do **prywatnego** Supabase Storage. Ustaw tytuł, typ i opis.
- `Add an external delivery link`: dla dużych filmów i całych galerii z Adobe/Drive itd., z własnym HTTPS URL (uprawnienia na zewnętrznej platformie należy kontrolować osobno).
- `Publish` / `Unpublish`, `Edit`, `Download` / `Open external link`, `Remove` (wymaga wpisania `DELETE`).
- Każdy nowy materiał jest **domyślnie nieopublikowany**. Aby klient go widział, muszą być jednocześnie aktywne: dostęp klienta z Phase 24.1, publikacja projektu z Phase 24.2 oraz publikacja tego konkretnego materiału z Phase 24.3.

**Klient:** zaloguje się do `/client.html` przez e-mail i poniżej postępu projektu zobaczy `Your files & downloads`. Bez udostępnienia nie zobaczy listy ani plików. Prywatne pliki pobiera za pomocą JWT i Storage RLS; nie udostępniamy publicznych URL.

Jeżeli dodasz projekt już w otwartym CRM, kliknij `Refresh files` w sekcji dostarczania materiałów.

## 4. Ograniczenia / bezpieczeństwo

- Supabase Storage ma ograniczenia rozmiaru wynikające z planu i ustawień projektu. Limit tej funkcji to **45 MB na plik** (bucket ma limit 50 MiB). Jeśli plan Supabase ma niższy limit, użyj zewnętrznej usługi udostępniania.
- Linki zewnętrzne mogą być używane również poza panelem. Cofnięcie dostępu w CRM **nie unieważnia** linku u dostawcy — rozważ hasło, ograniczone uprawnienia i datę wygaśnięcia w usłudze zewnętrznej.
- Prywatny plik w Supabase podlega nowej kontroli RLS przy każdym pobraniu. Nie tworzymy trwałych ani publicznych linków i nie udostępniamy ścieżek storage innym klientom.
- `Remove` najpierw usuwa rekord dostępu, potem obiekt Storage. Jeżeli sam Storage zwróci błąd, obiekt pozostaje prywatny i niedostępny przez portal, ale administrator musi go wyczyścić w panelu Storage.
- Brak automatycznych e-maili, skanowania antywirusowego, szyfrowania end-to-end i automatycznych masowych transferów. Nie umieszczaj plików wykonawczych ani danych szczególnie wrażliwych bez dodatkowych procedur bezpieczeństwa.
- Dokumenty finansowe/faktury nie są generowane. **Zwroty wyłącznie w aplikacji Stripe**. Brak kodu API zwrotów lub płatności w tej aktualizacji.
- Żadne testy nie są wykonywane na produkcji; końcowy audyt zgodnie z ustaleniem użytkownika po zakończeniu pozostałych faz.

## 5. Co powinno działać po wdrożeniu (do audytu na koniec)

1. SQL działa bez błędów i bucket Storage ma `Public = false`.
2. W CRM projekt może otrzymać prywatny upload i zewnętrzny link; publikację można cofnąć.
3. Klient widzi tylko udostępnione pliki przypisane do jego projektu, a jego e-mail jest zweryfikowany.
4. Cofnięcie dostępu, archiwizacja zgłoszenia, ukrycie projektu lub pliku blokuje dostęp do prywatnego Storage.
5. Zdjęcia/filmy można podejrzeć na komputerze i telefonie, a pliki pobrać; dokumenty/ZIP są pobierane bez osadzania w stronie.
6. Edycja i usunięcie innych zgłoszeń, rezerwacji, wycen i Stripe nie są dotknięte aktualizacją.

## 6. Rollback

W GitHub cofnij tylko pliki Phase 24.3: trzy zmienione pliki HTML/JS do ich wersji Phase 24.2 i usuń nowe `phase24-deliverables-*` moduły. **Nie usuwaj automatycznie bucketu ani tabeli SQL**: zawierają potencjalne dane klientów. W razie konieczności pozostaw je zabezpieczone RLS i ustal plan retencji/archiwizacji.
