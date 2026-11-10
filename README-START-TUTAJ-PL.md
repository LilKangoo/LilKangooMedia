# LilKangooMedia Phase 23.3B — klient akceptuje/odrzuca ofertę + przypomnienia w CRM

## WAŻNE: DOKŁADNIE JEDEN NOWY SQL

**Uruchom TYLKO:** `supabase/migrations/20261110_lkm_quote_approvals.sql`

**Nie uruchamiaj ponownie żadnego z poprzednich:** `20261110_lkm_sales_crm.sql`, `20261110_lkm_quotations.sql`, `20261110_lkm_crm_admin_controls.sql` ani migracji Stripe, kalendarza i Case Studies.

Ta paczka zawiera **tylko jeden plik .sql**. Nie zawiera żadnych zmienionych starszych migracji.

## Kolejność wdrożenia

1. Najpierw w tym samym projekcie Supabase otwórz SQL Editor → New query. Skopiuj **całą** zawartość `supabase/migrations/20261110_lkm_quote_approvals.sql`. Kliknij Run; wynik powinien być bez błędów. Migracja jest addytywna; nie zmienia istniejących zamówień, płatności ani faktur.
2. Wgraj pozostałe pliki z ZIP do głównego katalogu GitHub `LilKangoo/LilKangooMedia` z zachowaniem ścieżek. Wykonaj Commit/Push. Deploy przez Netlify.
3. W panelu `https://lilkangoomedia.com/admin-quotes.html` wybierz *już wysłaną* wycenę. Jeśli to jeszcze szkic, zapisz poprawne dane, pobierz PDF i kliknij **Mark sent manually** (nie wysyła wiadomości).
4. Kliknij **Generate client decision link** → **Copy link**. Prześlij klientowi link ręcznie, np. z załącznikiem PDF. Link prowadzi do `https://lilkangoomedia.com/proposal.html#token=...`. Nie publikuj go w otwartych kanałach.
5. Klient może zobaczyć ofertę i wybrać **Accept quotation** (podaje imię i zaznacza zgodę na warunki) lub **Decline quotation**. Odpowiedź jest jednokrotna, nieodwracalna z tego linku. Jeśli trzeba skorygować zakres/cenę — tworzysz **Create revised draft** z nowym numerem wyceny.
6. Odśwież `admin-quotes.html`, aby zobaczyć status *pending / accepted / declined*. W `admin-crm.html` jest lista **Proposals to follow up**, a w karcie klienta status przypisanej oferty.

## Co już działa po tej aktualizacji

- Nowa prywatna strona `proposal.html`: prezentuje tylko konkretną wysłaną wersję wyceny, po weryfikacji sekretnego linku. Zdjęć klientów, notatek CRM i innych ofert nie pobiera.
- Przechowywany jest wyłącznie SHA-256 linku. Utworzenie nowego linku unieważnia wcześniejszy. Po decyzji klienta nie można go zresetować w tej samej ofercie.
- Wycena oznaczona jako wysłana jest niemodyfikowalna w Supabase; nową wersję przygotowuje się przez utworzenie kolejnego szkicu.
- Lista przypomnień **w panelu** dotyczy wysłanych wycen bez odpowiedzi. Nie ma automatycznych e-maili/WhatsApp, brak harmonogramu zewnętrznego.
- Żadnych wywołań Stripe / checkout / refundacji. **Zwroty wyłącznie w aplikacji Stripe**.
- Akceptacja wyceny to potwierdzenie proponowanego zakresu i warunków; nie jest uwierzytelnionym podpisem elektronicznym, fakturą, opłaconą usługą ani automatycznie potwierdzoną rezerwacją. To link, który klient musi traktować poufnie.

## Bezpieczna kontrola po wdrożeniu

- Użyj **testowej wyceny**. Nie wykonuj akceptacji ani odrzucenia na rzeczywistym zamówieniu klienta w ramach testów.
- Otwórz wycenę oznaczoną `sent`; sprawdź generowanie linku. Otwórz go w prywatnym oknie, bez logowania do administracji.
- Zweryfikuj sumę, rabat, opis i warunki. Zatwierdź tylko testowy przykład. Po odświeżeniu w Admin Quotes powinien widnieć status `accepted`.
- Zwróć uwagę, że tego samego testowego linku nie da się ponownie zaakceptować/odrzucić.
- Otwórz CRM i sprawdź sekcję `Proposals to follow up` oraz dane oferty w karcie klienta.

## Testy i ograniczenia

- Testy struktury/logiki Node: `node --test tests/phase23-approvals.test.mjs`.
- Test przeglądarkowy izolowany na mock-data: `python3 tests/test_phase23_approvals_browser.py` (wymaga Chromium + Playwright; nie wysyła nic do produkcji).
- Funkcje SQL i rzeczywisty zapis w Twoim Supabase nie zostały uruchomione z tego środowiska. Zweryfikujemy to po wdrożeniu oraz kompleksowo na końcu roadmapy.
- W przypadku błędu: przywróć zmienione pliki z poprzedniej paczki Phase 23.3A, nie usuwaj tabeli `lkm_quote_approvals` bez sprawdzenia historii wysłanych wycen.

## Dokładna lista plików w tej paczce

- README-START-TUTAJ-PL.md
- proposal.html
- assets/lkm-v3/phase23-proposal.js
- assets/lkm-v3/phase23-proposal.css
- assets/lkm-v3/phase23-quotes.js
- assets/lkm-v3/phase23-quotes.css
- assets/lkm-v3/phase23-crm.js
- assets/lkm-v3/phase23-crm.css
- supabase/migrations/20261110_lkm_quote_approvals.sql (**tylko ten SQL**)
- tests/phase23-approvals.test.mjs
- tests/test_phase23_approvals_browser.py
