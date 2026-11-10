# LilKangooMedia — Phase 21.4B
## Godzinowe potwierdzanie rezerwacji + bezpieczne blokady na czas Stripe Checkout

**Jedna kompletna paczka ZIP. Bez ręcznej edycji kodu.** Wykorzystuje wdrożone już Phase 20.1–20.5 i Phase 21.1–21.4A.

### ZASADA DOTYCZĄCA ZWROTÓW
**Na stronie NIE MA żadnych automatycznych ani ręcznych refundacji przez API.** Zwroty wykonywane są WYŁĄCZNIE w aplikacji/panelu Stripe przez właściciela firmy. Anulowanie płatnego zgłoszenia w LilKangooMedia może wyświetlać status `refund_review_required`, ale **NIE zwraca pieniędzy, nie wywołuje API zwrotów, nie zmienia bilansu Stripe**. Po anulowaniu płatnej rezerwacji sprawdź ją osobno w Stripe i skontaktuj się z klientem.

### CO NOWEGO
1. Administrator może zatwierdzić konkretny przedział 30-minutowy (np. 09:00–10:00), zamiast blokować cały dzień. Zachowany jest przycisk **Confirm full day**.
2. Supabase blokuje nakładające się potwierdzenia tej samej usługi i dnia. Terminy są przechowywane w minutach od północy czasu cypryjskiego (bez niejednoznaczności czasu letniego).
3. Działające wcześniej, potwierdzone rezerwacje całodniowe nadal zajmują cały dzień.
4. Przed utworzeniem sesji Stripe backend tworzy transakcyjną blokadę całodniową dla usługi i daty. **Nie jest to jeszcze automatyczna rezerwacja konkretnej godziny.** Używamy całego dnia, ponieważ różne pakiety mogą mieć różne długości, które nie są jeszcze jednolicie modelowane.
5. Stripe Checkout wygasa po około 32 minutach. Zwolnienie blokady następuje dopiero po *podpisanym* webhooku Stripe `checkout.session.expired` albo `checkout.session.async_payment_failed`. Po opłaceniu blokada zostaje do decyzji administratora.
6. Gdy Stripe nie dostarczy powiadomienia o wygaśnięciu, zaległa blokada jest widoczna w kalendarzu. Administrator może ją usunąć **dopiero po 35 minutach i po sprawdzeniu w aplikacji Stripe, że płatność nie nastąpiła i sesja jest nieaktywna**. Nie usuwaj niezweryfikowanych blokad.
7. Publiczny kalendarz pokazuje jedynie niedostępne dni i zarezerwowane przedziały godzinowe — żadnych danych osobowych klienta.
8. Klient wysyła zapytanie o termin tak jak dotąd. **Wybranie terminu i zapłata nie potwierdzają automatycznie rezerwacji.**

### INSTALACJA — 3 KROKI
1. **Supabase > SQL Editor > New query:** otwórz dołączony plik `supabase/migrations/20261110_lkm_hourly_slots_checkout_holds.sql`, skopiuj całą zawartość do SQL Editor i kliknij **Run**. Nie zmieniaj SQL. Sprawdź brak błędów. **Wykonaj tylko NOWY plik Phase 21.4B**, nie uruchamiaj ponownie starych migracji. Jeśli wystąpi błąd, **nie aktywuj płatności Stripe LIVE**.
2. **GitHub:** rozpakuj archiwum, wgraj wszystkie pliki (z wyjątkiem `README` jeśli nie chcesz) do głównego katalogu `LilKangoo/LilKangooMedia`, zachowując foldery. Możesz zastąpić pliki o tych samych nazwach. `Commit changes` → Netlify deploy.
3. **Stripe:** w ustawieniach istniejącego webhooka `https://lilkangoomedia.com/api/stripe-webhook` upewnij się, że dostarczane są zdarzenia `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`. Zostaw sekret webhooka po stronie Netlify. **Nie dodawaj żadnego webhooka zwrotów.**

**Konfiguracja wymaga wykonania SQL i ewentualnej zmiany rodzaju nasłuchiwanych zdarzeń w Stripe; samego kodu NIE trzeba ręcznie edytować.** Jeśli płatności LIVE działają, najbezpieczniej przeprowadzić instalację w trybie wyłączonym/testowym i włączyć je ponownie dopiero po weryfikacji.

### KONTROLA PO WDROŻENIU
- Otwórz `https://lilkangoomedia.com/admin-calendar.html` i zaloguj się dotychczasowym kontem administratora.
- Na dniu z testowym zgłoszeniem wybierz **Confirm time slot**, np. 09:00–10:00. Następnie dla innego zgłoszenia tej SAMEJ usługi spróbuj 09:30–10:30 — taki konflikt ma być odrzucony.
- Powinien być widoczny także **Confirm full day**. Stare rezerwacje całodniowe pozostają zajęte.
- W trybie Stripe TEST rozpocznij Checkout na wolny dzień. W kalendarzu powinna pojawić się blokada `holding`. Zweryfikuj zachowanie, a potem pozwól testowej sesji wygasnąć. Nie sprawdzaj tego na prawdziwych kartach podczas instalacji.
- Zapytanie `/api/availability?service=<RZECZYWISTY_SLUG>&month=2026-11` powinno zwrócić `blocked_dates` i `occupied_slots`. Wpisz rzeczywisty identyfikator istniejącej usługi, nie dosłownie tekst w nawiasach.
- Nie zakładaj, że `enabled` na `/api/payment-options` dowodzi bezpieczeństwa produkcyjnego: wymagana jest jeszcze pełna testowa płatność, webhook, baza i decyzja administratora.

### WAŻNE OGRANICZENIA
- Sloty 30-minutowe służą **administratorowi do potwierdzania godzin**. Klient nadal wskazuje preferowaną porę; nie wybiera jeszcze gwarantowanej godziny w czasie rzeczywistym.
- Płatny Checkout konserwatywnie blokuje **CAŁY dzień dla danej usługi**, nie tylko wybraną godzinę, do czasu decyzji lub wygaśnięcia sesji. Dwa niezależne zgłoszenia o innych godzinach nadal mogą przyjść jako zwykłe zapytania.
- Zwroty, częściowe zwroty, korekty, chargebacki i rozliczenia wyłącznie w aplikacji Stripe; strona nie implementuje refundacji.
- Jeśli webhook `checkout.session.expired` zaginie, blokada może pozostać do ręcznej interwencji. Nigdy nie zwalniaj jej, dopóki nie potwierdzisz stanu w Stripe.
- SQL i front-end przetestowane automatycznie/makietą, ale **nie podłączano produkcyjnej bazy Supabase ani prawdziwej płatności**. W szczególności nie twierdzimy, że migracja SQL została uruchomiona w bazie.

### TESTY ZAWARTE W PACZCE
- `node --test tests/phase21-slots-holds.test.mjs tests/phase21-confirmations.test.mjs tests/phase21-availability.test.mjs tests/phase21-payments.test.mjs`
- `python tests/test_phase21_confirmations_browser.py`
- `python tests/test_phase21_slots_browser.py`

### PLAN DALEJ
- **Phase 21.4B:** ta paczka (kod i testy ukończone; wdrożenie i produkcyjne sprawdzenie przed nami).
- **Phase 22:** portfolio, filmy i opinie właściwe dla konkretnej usługi, case studies, podstrony branżowe.
- **Phase 23:** CRM, oferty PDF, akceptacja wycen, automatyczne follow-upy, linki płatności.
- **Phase 24:** panel klienta, statusy zamówień, dokumenty i bezpieczne przekazywanie zdjęć/filmów.
- **Phase 25:** PL/EN, indeksowalne podstrony usług, rozbudowana analityka i optymalizacja konwersji.
