# LilKangooMedia — Phase 24.2: Projects & Order Tracking

Paczka **LKM_24_2.zip** to kompletna *aktualizacja przyrostowa* (overlay) do aktualnie wdrożonej strony (Phase 24.1). Zawiera wszystkie nowe i zmodyfikowane pliki tego etapu, z poprawnymi ścieżkami. **Nie zastępuje całego repozytorium.** Nie usuwaj z GitHub żadnych innych plików.

## 1. SQL — DOKŁADNIE JEDEN NOWY PLIK

| Nazwa | Co zrobić |
| --- | --- |
| `supabase/migrations/20261110_lkm_client_projects.sql` | **URUCHOM TERAZ** w Supabase SQL Editor w projekcie LilKangooMedia. Najpierw SQL, potem GitHub. |
| Wszystkie starsze migracje | **NIE uruchamiaj ponownie.** Nie są dołączone, nie zostały zmodyfikowane. |

SQL tworzy `public.lkm_client_projects` oraz `public.lkm_client_project_updates`, zabezpieczenia RLS, kontrolę powiązania z opłaconym zamówieniem i tylko-do-odczytu RPC `public.lkm_client_project_dashboard()`. Nie aktualizuje istniejących zgłoszeń, zamówień Stripe, rezerwacji, wycen ani transakcji. Nie wymaga nowych kluczy API.

Jeżeli poprzednia migracja `20261110_lkm_client_portal_foundation.sql` (Phase 24.1) nie została wykonana, wykonaj ją najpierw; zgodnie z ostatnią informacją od Ciebie została już wykonana.

## 2. GitHub i Netlify

1. Rozpakuj `LKM_24_2.zip`.
2. Wgraj jego pliki **z zachowaniem ścieżek** do istniejącego `LilKangoo/LilKangooMedia` (`main`): folder `assets/lkm-v3/` ma pozostać pod `assets/lkm-v3/`.
3. Commit / Push i poczekaj na poprawne zakończenie deployu Netlify.
4. Nie zmieniaj ręcznie istniejących plików. Nie dodawaj nowych Netlify environment variables.

## 3. Co admin może robić w jednym panelu CRM

Adres: `https://lilkangoomedia.com/admin-crm.html`.

- Otwórz zapytanie klienta. Bez przełączania ekranów zobaczysz sekcję **Project & delivery tracking** obok **Client portal access**.
- **Create project**: tytuł, opis, etap, postęp (0–100%), przewidywana data, kolejny krok. Początkowo projekt jest **Private — admin only**.
- **Client visibility**: przełącz na **Visible to granted client**, gdy informacje są gotowe. Klient nadal musi mieć aktywny grant dostępu z Phase 24.1 i poprawnie zweryfikowany e-mail.
- **Optional matching Stripe order**: możesz wskazać jedno rzeczywiste zamówienie powiązane z tym samym adresem e-mail. Nie jest dopasowywane automatycznie i nie jest tworzone nowe zamówienie. W menu ładowane są najnowsze wpisy; gdy właściwy nie jest dostępny, pozostaw pole puste.
- **Add project update**: publikuj informację o postępie lub zapisz jako prywatny szkic. Wpisy można edytować, ukryć i usunąć. Nie dodawaj tutaj prywatnych notatek CRM.
- Projekt można usunąć tylko, gdy **nie był opublikowany i nie ma aktualizacji**. Inne projekty należy ukryć zamiast kasować historię.

Projekt ma status realizacji **niezależny** od statusu rezerwacji, CRM, wycen i płatności. Zmiana `Delivered` na projekcie nie potwierdza rezerwacji, nie wystawia faktury i nie uruchamia przelewu.

## 4. Co zobaczy klient

Adres: `https://lilkangoomedia.com/client.html`.

Dopiero po zalogowaniu zweryfikowanym e-mailem i ręcznym przyznaniu dostępu klient zobaczy:

- Swoje udostępnione wcześniej zgłoszenia z Phase 24.1.
- **Project progress** — opublikowane projekty, etap, procent realizacji, termin i następny krok.
- Opublikowane **Project updates**, ułożone od najnowszych.
- Informację o **jednym ręcznie przypisanym opłaconym zamówieniu**, jeśli administrator dokona takiego powiązania i e-mail jest zgodny. Kwota to zapisana kwota brutto, nie saldo po zwrotach ani faktura.

Klient **nie** widzi prywatnych notatek CRM, innych zgłoszeń, innych zamówień, wersji roboczych projektów i aktualizacji, danych innych klientów ani nie może zmieniać statusów projektu. Bez aktywnego grantu nic nie zostanie udostępnione. Brak SQL Phase 24.2 nie powinien blokować wyświetlania starszych zgłoszeń — sekcja projektów pokaże tylko informację o chwilowej niedostępności.

## 5. Czego ta faza celowo nie robi

- Brak automatycznych e-maili, przypomnień i aktualizacji statusów płatności.
- Brak jakichkolwiek zwrotów z aplikacji LilKangooMedia — **zwroty wyłącznie w aplikacji Stripe**.
- Brak automatycznego przypisywania zamówień po samym e-mailu.
- Brak załączników, galerii prywatnych, faktur i plików do pobrania — to Phase 24.3.
- Brak kompleksowego testu produkcyjnego; zgodnie z ustaleniem wykonamy go po Phase 25, razem z pierwszym prawdziwym Case Study.

## 6. Testy lokalne wykonane przed spakowaniem

- `node --test tests/phase24-projects.test.mjs` — weryfikacja uprawnień, sanitacji, powiązań Stripe i regresji.
- Playwright/Chromium `tests/test_phase24_projects_browser.py` — symulowany backend, desktop + mobile, panel klienta i admina oraz odmowa dostępu użytkownikowi bez roli admina.
- Testy produkcyjne (prawdziwe maile Supabase, RLS RPC i rzeczywiste rekordy) **nie zostały wykonane**.

## 7. Rollback

Usuń/skomentuj odnośnik do `phase24-admin-projects.js` i CSS w `admin-crm.html` oraz cofnij `phase24-client.mjs` i `client.html` do Phase 24.1. Nie usuwaj danych z nowo utworzonych tabel bez ich wcześniejszego wyeksportowania. Zapisane w bazie projekty nie wpływają na istniejące zamówienia.
