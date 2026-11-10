# LilKangooMedia — Phase 23.3A: Administrator Controls / Unified Sales CRM

## JAK WSTAWIĆ — kolejność ważna

1. **Supabase > SQL Editor > New query:** wklej całą zawartość pliku:
   `supabase/migrations/20261110_lkm_crm_admin_controls.sql`
   i uruchom **Run**. Migracja jest addytywna; nie czyści zgłoszeń ani ofert.
   Wymaga wcześniejszych Phase 21.4A, 23.1 i 23.2 (wdrożone według Twoich informacji).
2. Rozpakuj ten ZIP i wgraj zawartość do głównego folderu repozytorium `LilKangoo/LilKangooMedia` na GitHubie. **Zachowaj ścieżki plików.** Zatwierdź zmiany — Netlify powinien wdrożyć wersję automatycznie.
3. Otwórz `https://lilkangoomedia.com/admin-crm.html` i zaloguj się administratorem.

**Nie wprowadzaj żadnego sekretu do plików JS/HTML.** W tym etapie nie trzeba ustawiać nowych zmiennych Netlify. Nie uruchamiaj ponownie starszych migracji — dwie starsze są w paczce wyłącznie dla kompletności zestawu.

## CO NOWE

- **Edycja zgłoszenia bezpośrednio w CRM**: imię, e-mail, telefon, usługa, ID pakietu, preferowana data i oryginalna treść wiadomości. Bezpośredni zapis do istniejącego `public.contact_leads` przez zalogowanego administratora i RLS.
- **Archiwum**: usuwa z aktywnego lejka, ale zachowuje dane, notatki i ofertę; można przywrócić.
- **Trwałe usuwanie**: możliwe TYLKO po archiwizacji i ręcznym wpisaniu `DELETE`. Baza blokuje tę operację, jeżeli są powiązane oferty, rezerwacje lub zamówienia Stripe z danym e-mailem. Istniejące notatki i historia CRM dla usuniętego klienta są usuwane razem z nim; log zachowuje tylko identyfikator i rodzaj operacji, bez danych osobowych.
- **Nienaruszalność potwierdzonej rezerwacji**: nie można edytować jej dnia/usługi bez wcześniejszej zmiany w kalendarzu. Statusy rezerwacji/płatności nie są zmieniane przez CRM.
- **Historia zmian (audit)**: kto/kiedy/które pola poprawił; bez zapisywania dodatkowych kopii danych osobowych.
- **Powiązane wyceny w karcie klienta**: otwórz odpowiednią ofertę lub utwórz nową — bez przeszukiwania osobnej listy.
- **Usuwanie draftów wycen**: możliwe z generatora ofert po wpisaniu `DELETE`; *wysłane oferty są chronione*. Jest to ręczne usunięcie szkicu, nie cofnięcie płatności.
- **Due now**: szybki filtr zaległych follow-upów w CRM; żadne automatyczne e-maile ani SMS nie są wysyłane.
- **Link z istniejącego Admin > Enquiries & bookings**: `Edit · archive · manage enquiries` do tego samego CRM.

## CO SPRAWDZIĆ PO WDROŻENIU (BEZ KASOWANIA PRAWDZIWYCH DANYCH)

1. W `admin-crm.html` sprawdź sekcję `Enquiry management` w karcie klienta.
2. Popraw np. opis **testowego** zgłoszenia przez `Edit enquiry` > `Save enquiry changes`; odśwież stronę i sprawdź zapis.
3. Rozwiń `Enquiry change history` — powinny być zapisane nazwy zmienionych pól.
4. `Archive enquiry` > przejdź do `Archived` > `Restore enquiry` > `Active`.
5. Zobacz `Quotations` w tej samej karcie. Przy wcześniejszej ofercie powinien być link `Open`.
6. W `admin-quotes.html` tylko robocza oferta posiada `Discard draft`. **Nie testuj na prawdziwej ofercie**, jeśli chcesz ją zachować.
7. Sprawdź w `admin.html#leads` przycisk prowadzący do CRM.

## WAŻNE GRANICE

- Zmiana danych zgłoszenia NIE zmienia już zapisanych danych i kwot w ofertach PDF. To świadoma ochrona historii wyceny. Jeśli trzeba zmienić ofertę, popraw jej draft w Quotation Builder albo utwórz nową wersję.
- CRM i Quotation Builder są stronami administratorskimi; dostęp do danych wymaga aktualnego tokenu Supabase i wpisu administratora (RLS).
- Trwałe usuwanie zgłoszeń z historią płatności, zaakceptowanej rezerwacji lub podpiętymi wycenami **jest celowo zablokowane**. Takie zgłoszenia archiwizuj.
- Obecny moduł nie oferuje klientom akceptacji ofert przez link. To osobny etap 23.3B i wymaga bezpieczeństwa tokenów, podpisów oraz testów.
- **Zwroty robimy wyłącznie w aplikacji Stripe**; ten ZIP nie ma funkcji refundowania, pobierania pieniędzy ani automatycznego wysyłania.
- Pełny test produkcyjny Supabase/Netlify/Stripe wykonamy jako Final Audit po ukończeniu roadmapy. Testy lokalne z mockami nie zastępują tego audytu.
- Jeżeli SQL nie został uruchomiony, nowy CRM nie załaduje się poprawnie. Wykonaj migrację **przed** wgraniem JS/HTML.

## TESTY W PAKIECIE

- `node --test tests/*.test.mjs`
- `python tests/test_phase23_3_admin_browser.py`
- `python tests/test_phase23_3_quotes_browser.py`

Z testów przeglądarkowych użyto wyłącznie przykładowych rekordów i mockowanego backendu. Testy nie przesyłały żadnych danych do produkcji.

## JAK COFNĄĆ UI (JEŻELI KONIECZNE)

Przywróć poprzednie pliki UI i JS z repozytorium GitHub (przed tym commitem). Sama migracja dodaje kolumny, funkcje i historię zmian — wycofanie UI nie wymaga kasowania żadnych danych. **Nie usuwaj tabel ani funkcji SQL bez przemyślanego planu migracji**, jeżeli zdążyły pojawić się zapisy.
