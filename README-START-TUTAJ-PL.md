# LilKangooMedia — Phase 24.1: Secure Client Portal Foundation

**Wersja do wgrania po Phase 23.4. Jeden ZIP, bez ręcznego edytowania kodu.**

## 1. SQL — uruchom TYLKO ten jeden nowy plik

`supabase/migrations/20261110_lkm_client_portal_foundation.sql`

1. Supabase Twojego projektu LilKangooMedia → **SQL Editor** → **New query**.
2. Wklej całą zawartość powyższego pliku i kliknij **Run**.
3. Jeżeli SQL wyświetla błąd, **nie wgrywaj nowego panelu klienta** i zachowaj treść błędu.

**Nie uruchamiaj ponownie ani nie zmieniaj** wcześniejszych plików SQL (Phase 21–23). **W tej paczce nie ma żadnej zmiany do wcześniejszych SQL**. Migracja jest dodająca: tworzy tylko `public.lkm_client_grants`, polityki dostępu i funkcje `lkm_client_portal_summary`, ochrony uprawnień oraz automatycznego cofnięcia dostępu.

## 2. Wymagane ustawienie Supabase Auth — bez pisania kodu

Wejdź w **Supabase → Authentication → URL Configuration → Redirect URLs** i dodaj dokładnie:

- `https://lilkangoomedia.com/client.html`
- `https://www.lilkangoomedia.com/client.html` (jeśli używasz adresu www)

Sprawdź też **Authentication → Providers → Email**, czy email OTP / magic link jest dostępny, a wysyłanie maili z Auth jest prawidłowo skonfigurowane. Domyślne limity Supabase Auth lub standardowy serwer e-mail Supabase mogą ograniczać rzeczywiste wysyłki; na szersze wdrożenie produkcyjne zalecane jest skonfigurowanie odpowiedniego serwera SMTP. Strona obsługuje zarówno link w e-mailu, jak i kod 6–8 cyfr, zależnie od ustawionego szablonu.

Bez dodania przekierowania link może prowadzić do niewłaściwego adresu i klient nie zaloguje się prawidłowo. **Nie wstawiaj `service_role` ani kluczy prywatnych do przeglądarki.**

## 3. GitHub → Netlify

Rozpakuj ZIP do głównego katalogu repozytorium `LilKangoo/LilKangooMedia`, zachowaj ścieżki, zastąp `admin-crm.html`, dodaj pozostałe pliki i wykonaj **Commit / Push**. Netlify wdroży projekt normalnie.

**Nowy adres klienta:** `https://lilkangoomedia.com/client.html`.

## 4. Jak admin uruchamia dostęp (wszystko z CRM)

1. Otwórz `https://lilkangoomedia.com/admin-crm.html` i zaloguj się jak zwykle.
2. Wybierz istniejące zgłoszenie. W jego karcie pojawi się **Client portal access**.
3. Kliknij **Enable client access**. Uprawnienie dotyczy tylko **dokładnego adresu e-mail zapisanego przy tym zgłoszeniu**. Możesz też kliknąć **Revoke access**.
4. Kliknij **Copy portal link**, a następnie wyślij klientowi ręcznie. Strona niczego sama nie wysyła.
5. Klient otwiera `/client.html`, wpisuje e-mail i korzysta z otrzymanego magic linku lub kodu OTP.

**Każdy klient widzi tylko zgłoszenia ręcznie udostępnione jego zweryfikowanemu e-mailowi.** Samo utworzenie konta Auth nie daje dostępu do zgłoszeń. W tej fazie panel wyświetla podstawowe podsumowanie: usługę, datę zgłoszenia, preferowany termin i status z bazy; NIE wyświetla prywatnych notatek, e-maili innych klientów, zamówień Stripe, wycen ani materiałów.

Zmiana e-maila zgłoszenia lub jego archiwizacja automatycznie wyłącza istniejące uprawnienie klienta. Przywrócenie dostępu wymaga ponownego kliknięcia Enable w CRM.

## 5. Co powinno działać po instalacji — testy odkładamy do Final Audit

- CRM: jedna sekcja **Client portal access** bez potrzeby otwierania odrębnego panelu administracyjnego.
- Enable / Revoke zapisuje uprawnienia w Supabase.
- Przycisk Copy portal link kopiuje `https://lilkangoomedia.com/client.html`.
- Formularz logowania e-mail wysyła link lub kod poprzez Supabase Auth (wymaga ustawień redirect/SMTP).
- Osoba z poprawnie zweryfikowanym, ale **nieuprawnionym** kontem widzi pustą listę.
- Uprawniony klient widzi tylko własne, przypisane zgłoszenia.
- Panel działa w mobilnym i komputerowym układzie.
- Rezerwacje, płatności, CRM, wyceny, raporty i formularze działają jak poprzednio — nie zostały zmodyfikowane.
- Zwrotów nie wykonujemy ze strony: **refundacje tylko w aplikacji Stripe**.

## 6. Testy lokalne (bez produkcyjnej bazy)

`node --test tests/phase24-client-core.test.mjs tests/phase24-security.test.mjs` — 12/12 PASS.

`python tests/test_phase24_browser.py` — 4/4 PASS (Chromium, offline mock Supabase): desktop, mobile, niewidoczne dane bez uprawnienia, włączanie/cofanie dostępu w CRM.

Testy integracji z realnym Supabase Auth i wysyłką e-maili zostaną przeprowadzone w **Final Audit**, po całej roadmapie. Lokalny test NIE jest potwierdzeniem, że produkcyjne ustawienia e-maili, redirectów i JWT są prawidłowe.

## 7. Bezpieczny rollback

Jeśli wystąpi problem, cofnij commit z plikami Phase 24.1 na GitHubie. Tabela pozostaje w Supabase bez wpływu na wcześniejsze etapy. Aby **natychmiast odciąć dostęp do wszystkich przypisanych zgłoszeń**, administrator może wykonać:

`UPDATE public.lkm_client_grants SET active=false;`

Ta komenda wyłącza tylko portal klienta. Nie zmienia żadnych zgłoszeń, płatności, rezerwacji ani historii wycen.

## Następne etapy

- **Phase 24.2:** projekty, zamówienia i status pracy (bez nowych, niezatwierdzonych uprawnień).
- **Phase 24.3:** dokumenty, bezpieczne dostarczanie zdjęć i filmów.
- **Phase 25:** PL/EN, indeksowalne podstrony usług, konwersja.
- **Final Content:** pierwsze prawdziwe Case Study z informacji dostarczonych przez Ciebie.
- **Final Audit:** kompletne testy produkcyjne (Netlify, Supabase Auth/RLS, Stripe bez refundów, CRM, SEO, dostępność, mobile).
