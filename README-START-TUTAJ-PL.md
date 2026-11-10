# LilKangooMedia — PHASE 21.3: Availability Calendar

**Jedna kompletna paczka ZIP do wgrania do istniejącego repozytorium GitHub.** Kod HTML, CSS, JavaScript i Netlify Functions jest gotowy. Nie edytujesz ręcznie kodu. Paczka zawiera też wszystkie pliki Phase 21.2 wymagane przez Phase 21.3, więc nie cofa wcześniejszych funkcji Stripe.

## NOWE FUNKCJE

- Nowy, chroniony kalendarz administratora pod adresem `https://lilkangoomedia.com/admin-calendar.html`.
- Link **Availability calendar** w istniejącym menu panelu administratora.
- Widok miesięczny dla wszystkich usług albo jednej wybranej; liczby zapytań, opłaconych zgłoszeń i blokad.
- Blokowanie lub odblokowywanie pojedynczych dni dla **wszystkich usług** albo jednej usługi. Opcjonalna prywatna notatka administratora.
- Baza `lkm_availability_blocks`: RLS dopuszcza odczyt i zmianę tylko przez istniejące konta administratorów, a unikalny indeks chroni przed zdublowaniem identycznej blokady.
- Publiczny endpoint `/api/availability?service=portrait-photography&month=2026-11` pokazuje tylko zablokowane daty (nigdy notatki, e-maila czy imienia klienta).
- Formularz klienta sprawdza datę i ostrzega o ręcznie zablokowanym terminie.
- Endpoint `/api/checkout` serwerowo odrzuca płatność dla ręcznie zablokowanej daty; jeśli brakuje tabeli lub połączenia z bazą, płatność jest blokowana (fail-closed).
- Nie tworzymy automatycznie potwierdzonych rezerwacji. Zapytania i opłacone zgłoszenia **wciąż wymagają Twojej akceptacji**.

## INSTALACJA

1. Rozpakuj ZIP. Wgraj **całą jego zawartość** do głównego folderu repozytorium GitHub `LilKangoo/LilKangooMedia`, zachowując ścieżki katalogów. Potwierdź zastąpienie plików `index.html`, `home.html`, `admin.html` i wcześniejszych plików Phase 21.2. Nie usuwaj żadnych plików repozytorium.
2. Wykonaj **Commit changes**. Netlify automatycznie opublikuje stronę. Żadne ręczne zmiany w plikach kodu nie są potrzebne.
3. **JEDNORAZOWY KROK SUPABASE — obowiązkowy do działania blokad:** otwórz istniejący projekt Supabase → **SQL Editor → New query**. Otwórz plik `supabase/migrations/20261110_lkm_availability_blocks.sql` z tej samej paczki, skopiuj jego kompletną zawartość do SQL Editor i kliknij **Run**. To jest migracja bazy, nie modyfikacja kodu witryny. Plik w GitHub NIE wykonuje SQL automatycznie. Nie publikuj haseł ani kluczy API.
4. Zaloguj się do `https://lilkangoomedia.com/admin-calendar.html` tym samym kontem, którego używasz w `/admin.html`. Wybierz usługę i dzień, dodaj testową blokadę oraz odśwież kalendarz.
5. Sprawdź na stronie klienta wybraną usługę i przejdź do formularza `/#/request`. Po wybraniu zablokowanej daty powinien pojawić się komunikat „Unavailable”. Następnie usuń testową blokadę w panelu administratora.
6. Jeśli masz włączony **Stripe TEST**, sprawdź, że Checkout nie przyjmuje ręcznie zablokowanej daty, a przy niezablokowanej może tworzyć sesję testową. **Nie włączaj płatności LIVE bez osobnego sprawdzenia terminów i polityki zwrotów.**

### Ważne: SQL to obowiązkowa jednorazowa konfiguracja
W tej fazie dodajemy **nową tabelę w Supabase**. Same pliki GitHub/Netlify nie mają uprawnień do wykonania migracji schematu bazy; dlatego trzeba uruchomić dostarczony SQL w Supabase SQL Editor. Jeśli wgrasz ZIP, ale pominiesz SQL, kalendarz administratora pokaże błąd i Stripe Checkout nie pozwoli na pobranie płatności (bezpieczne blokowanie błędnej konfiguracji). Zwykłe zapytania e-mail nadal mogą działać.

## OGRANICZENIA — KONIECZNIE PRZECZYTAJ

- **Brak obietnicy „wolny termin = gwarantowana rezerwacja”.** Status zielony oznacza tylko brak wpisanej blokady. Potwierdza go administrator.
- **Jedna data nie oznacza jeszcze jednego slotu godzinowego.** Przy sesjach tego samego dnia lub wielu fotografach kalendarz wymaga od Ciebie decyzji, co blokować globalnie, a co dla konkretnej usługi.
- **Ochrona przed dwoma jednoczesnymi płatnościami nie jest jeszcze atomowa.** Checkout sprawdza daty zablokowane przez admina, ale jeśli dwie osoby równocześnie otworzą płatność dla nieblokowanego dnia, system nie tworzy jeszcze transakcyjnego „hold”. Rzeczywiste blokady slotów / zatwierdzanie i zwroty wymagają **Phase 21.4**.
- Zgłoszenia z płatnością pokazywane na kalendarzu nadal mają status pending, nie confirmed.
- Publiczne API udostępnia same daty blokad, bez przyczyn i informacji o klientach.
- Można cofnąć aplikację poprzez poprzedni Netlify deploy/commit GitHub. Nie usuwaj tabeli, jeśli znajdują się w niej już realne blokady.
- Dla produkcji zalecane: najpierw SQL i konfiguracja na stagingu, testowy Checkout, dopiero później użycie live.

## TESTY (opcjonalnie, dla developera)

- `node --test tests/phase21-payments.test.mjs tests/phase21-availability.test.mjs`
- `python tests/test_phase21_availability_browser.py` (Chromium + Playwright) — komputer i telefon, bez prawdziwego Supabase/Stripe.
- Stare testy Phase 21.2 również pozostały w paczce.

## RESZTA ROADMAPY

- **21.4** — atomowe blokady / hold slotów, potwierdzanie i odrzucanie rezerwacji, bezpieczne zwroty.
- **22** — portfolio i filmy przy usługach, opinie dopasowane do usługi, case studies, B2B pakiety.
- **23** — CRM, oferty PDF, akceptacja wycen, automatyczne follow-upy i linki do płatności.
- **24** — panel klienta, zamówienia, faktury, pliki do pobrania, ponowne rezerwacje.
- **25** — PL/EN, indeksowalne URL usług, analiza sprzedaży, optymalizacja konwersji.
