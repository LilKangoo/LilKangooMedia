# LilKangooMedia — Phase 21.4A: potwierdzenia i ochrona przed podwójną rezerwacją

**Jedna kompletna paczka ZIP.** Zawiera wszystkie niezbędne pliki strony, kalendarza, wcześniejsze kompatybilne pliki Phase 21.3, kod backendu i nową migrację Supabase. Nie trzeba ręcznie zmieniać żadnej linijki HTML, CSS ani JavaScript.

## Wdrożenie — dokładna kolejność

1. Rozpakuj archiwum ZIP na komputerze.
2. **ZANIM wgrasz nowe pliki na GitHub, uruchom migrację** w swoim projekcie Supabase: SQL Editor > New query > otwórz plik `supabase/migrations/20261110_lkm_booking_confirmations.sql`, skopiuj CAŁĄ jego zawartość, wklej do SQL Editor i kliknij Run. To jednorazowy krok niezbędny do utworzenia bazy potwierdzonych rezerwacji. Nie edytuj SQL. Poprzednia migracja Phase 21.3 musi już działać.
3. Otwórz GitHub repo `LilKangoo/LilKangooMedia`, wgraj **całą strukturę folderów** z ZIP do katalogu głównego repo. Zatwierdź aktualizację (Commit changes).
4. Po zakończonym deployu Netlify przejdź do `https://lilkangoomedia.com/admin-calendar.html` i zaloguj się jako administrator.
5. Wybierz dzień z istniejącym zapytaniem, kliknij **Confirm full day**. Dla tego samego dnia i usługi kolejne zgłoszenie nie będzie mogło zostać potwierdzone. W publicznym kalendarzu dzień pojawi się jako niedostępny.
6. Dla potwierdzonego zgłoszenia kliknij **Email confirmation to client**: otworzy się Twój program pocztowy z gotowym tematem i treścią. Wysłanie wiadomości nadal wymaga kliknięcia Send przez Ciebie.
7. Aby anulować potwierdzoną rezerwację, kliknij **Cancel confirmed booking**. Zwolni to dzień dla danej usługi. Jeśli klient już zapłacił, zgłoszenie dostanie status `refund_review_required` (lub `test_refund_review_required`) — SPRAWDŹ, CZY I JAKI ZWROT NALEŻY WYKONAĆ W STRIPE.

## Zakres i ograniczenia

- Potwierdzenie zajmuje **cały dzień** dla jednej usługi. To bezpieczne, konserwatywne zabezpieczenie, nie grafik godzinowy i nie zarządzanie zespołem wielu fotografów. Dokładne sloty godzinowe i przydzielanie personelu to następny etap.
- Tylko konto zarejestrowane w `admin_users` może zatwierdzać lub anulować rezerwacje.
- Zatwierdzenie / anulowanie w Supabase jest transakcyjne. Unikalny indeks blokuje jednoczesne zatwierdzenie dwóch różnych zgłoszeń na ten sam dzień dla tej samej usługi. Ręczne globalne blokady dat też są sprawdzane.
- Płatność (nawet opłacona w Stripe) nadal nie potwierdza automatycznie terminu. Strona klienta i Checkout odczytują potwierdzone dni jako niedostępne.
- **Uwaga:** klient z otwartą wcześniej sesją Stripe może dokończyć płatność mimo późniejszego zajęcia daty. Zapisana płatność nadal jest tylko `paid_pending_confirmation`; nie powstanie drugi potwierdzony booking. Takie zgłoszenia wymagają Twojej ręcznej decyzji. Nie uruchamiaj Stripe LIVE bez własnego procesu obsługi takich sytuacji.
- **Żadnych automatycznych zwrotów**: zmiana statusu nie wysyła pieniędzy. Zwróć je ręcznie po weryfikacji w Stripe. Automatyczny kontrolowany refund workflow i timeouty holdów pozostają do Phase 21.4B.
- Nie są wysyłane automatyczne e-maile potwierdzające. W kalendarzu jest bezpieczny link `mailto` do ręcznego wysłania.
- Nie dodawaliśmy ani nie zmienialiśmy kluczy Netlify, Stripe i Supabase; nie zmieniliśmy cen usług.
- SQL jest jedynym nieuniknionym dodatkowym krokiem poza GitHub/Netlify; plik w archiwum jest gotowy i nie wymaga modyfikacji.
- Migracja została sprawdzona statycznie, ale nie była wykonana na Twojej rzeczywistej bazie. Zrób test na koncie administratora przed obsługą klientów.

## Testy lokalne w archiwum

`node --test tests/phase21-payments.test.mjs tests/phase21-availability.test.mjs tests/phase21-confirmations.test.mjs`

`python tests/test_phase21_availability_browser.py`

`python tests/test_phase21_confirmations_browser.py`

Przeglądarka używa mocków Supabase, więc testy nie pobierają pieniędzy i nie zmieniają danych.

## Co dalej — breakdown

- Phase 19–20: katalog, szybkie zapytania, analityka, formularze, SEO — wgrane według informacji właściciela.
- Phase 21.1: preferencje terminu — wgrane.
- Phase 21.2: Netlify Stripe — wgrane, produkcyjne płatności nadal zależą od konfiguracji i testu.
- Phase 21.3: kalendarz ręcznych blokad — wgrane + SQL potwierdzone przez właściciela.
- **Phase 21.4A: potwierdzenia całodniowe, ochrona przed konfliktami i statusy zwrotów — w paczce.**
- Phase 21.4B: rzeczywiste godzinowe sloty / holdy przed płatnością, proces zwrotów i komunikacji — plan.
- Phase 22: portfolio i dowody jakości przy usługach.
- Phase 23: CRM sprzedaży, oferty PDF i follow-up.
- Phase 24: panel klienta i dostarczanie materiałów.
- Phase 25: wielojęzyczność PL/EN i optymalizacja SEO/konwersji.
