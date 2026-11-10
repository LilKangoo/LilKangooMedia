# LilKangooMedia — Phase 23.4: Sales Reporting

**Jedna paczka ZIP do aktualizacji repozytorium `LilKangoo/LilKangooMedia` na branch `main`.**
Nadpisz tylko pliki zawarte w paczce, zachowując ich ścieżki. Pozostałych plików NIE usuwaj.

## SQL — dokładna instrukcja

**NOWY SQL DO URUCHOMIENIA: BRAK (0 plików).**
**ZMIENIONE POPRZEDNIE SQL: BRAK.**
Nie uruchamiaj ponownie żadnej migracji SQL z poprzednich faz (21.1–23.3B).
Phase 23.4 używa tylko odczytu istniejących tabel:
- `public.contact_leads`
- `public.lkm_crm_lead_details`
- `public.lkm_crm_quotes`
- `public.lkm_quote_approvals`
- `public.stripe_orders`

Wszystkie korzystają z dotychczasowych uprawnień RLS i zalogowanego administratora.

## Instalacja w GitHub

1. Rozpakuj `LKM_23_4.zip`.
2. Wgraj zawartość do głównego katalogu repozytorium `LilKangoo/LilKangooMedia`, zachowując ścieżki folderów.
3. Zatwierdź i wykonaj push do `main`; poczekaj na zakończenie automatycznego deployu Netlify.
4. Nowy prywatny panel: **https://lilkangoomedia.com/admin-reports.html**

Nie trzeba zmieniać kluczy API, ustawień Stripe, Resend ani Supabase.

## Co dodano

- Filtr 30 / 90 / 365 dni / cała historia oraz filtr wg usługi.
- Statystyki zgłoszeń i bieżących etapów CRM; szacowana wartość OTWARTEGO lejka (nie wpływy).
- Wartość WYSŁANYCH i ZAAKCEPTOWANYCH wersji ofert z zapisanych pozycji oraz rabatu.
- Zarejestrowane płatności Stripe LIVE — kwota BRUTTO wpływów z zapisanych zamówień, bez potrącania ręcznych zwrotów i prowizji; test mode wykluczony.
- Historia miesięczna zgłoszeń, najczęściej wskazywane usługi oraz rodzaje formularzy.
- Ręczne follow-upy i lista wysłanych ofert bez ostatecznej odpowiedzi, z linkami do istniejących paneli.
- Eksport zbiorczego raportu CSV (bez e-maili, telefonów, nazwisk czy wiadomości klientów).
- Linki `Reports` w CRM, Quotation Builder i starym panelu administratora.
- Brak operacji POST/PATCH/DELETE, automatycznych e-maili, automatycznych płatności i jakichkolwiek zwrotów.

### Ważne zasady odczytu

- Okres odnosi się do **daty utworzenia konkretnego rekordu** (zgłoszenie / wycena / zamówienie). Etap CRM prezentuje AKTUALNY stan zgłoszeń utworzonych w wybranym okresie; nie odtwarza historycznej zmiany statusu.
- Jedna usługa może mieć wiele wycen / rewizji; wszystkie wersje oznaczone jako `sent` liczą się osobno.
- Akceptacja oferty nie oznacza zapłaty, potwierdzonej rezerwacji ani wyniku sprzedaży netto.
- Płatności testowe nie są ujęte w kwocie LIVE. **Ręczne zwroty i prowizje Stripe nie są odliczane** — ich wiarygodne rozliczenie pozostaje w aplikacji Stripe.
- Przy wyborze „All history” wykres miesięczny pokazuje 6 ostatnich miesięcy, podczas gdy sumy obejmują całą zachowaną historię.
- Dane pochodzą z tabel istniejących w Supabase; klient nie dostaje do nich dostępu. Bez uprawnień administratora nie wykonujemy zapytań raportowych.
- Gdy któraś tabela nie odpowiada lub wynik przekroczy 10 000 rekordów na tabelę, panel pokaże błąd zamiast niepełnej sumy.

## Co powinno działać po instalacji (możemy zweryfikować podczas Final Audit)

1. `https://lilkangoomedia.com/admin-reports.html`: logowanie administratora i podsumowanie.
2. Filtry 30/90/365/All i wybór usługi przeliczają liczby bez zmian w bazie.
3. `Export summary CSV` pobiera wyłącznie zagregowane wiersze, bez prywatnych danych osobowych.
4. Statystyki Stripe nie obejmują statusów testowych i są opisane jako GROSS, nie NET.
5. `https://lilkangoomedia.com/admin-crm.html`: na górze nowy link Reports, poprzedni CRM działa jak wcześniej.
6. `https://lilkangoomedia.com/admin-quotes.html`: na górze nowy link Reports; edycja ofert niezmieniona.
7. `https://lilkangoomedia.com/admin.html`: nowa pozycja Sales reports.

Zgodnie z ustaleniami pełny test produkcyjny robimy po wszystkich fazach wraz z uzupełnieniem jednego prawdziwego Case Study.

## Testy lokalne

- `node --test tests/phase23-report-core.test.mjs` — 13 testów logiki/struktury.
- `python tests/test_reporting_browser.py` — 2 testy układu / filtrów / CSV (Chromium desktop 1280px, mobile 390px) oraz 1 test odmowy dostępu bez uprawnień; wymaga Playwright i systemowego Chromium.
- Browser testy używają DANYCH SYMULOWANYCH i nie wysyłają nic do produkcji.

## Przywrócenie poprzedniej wersji

Przywróć pliki z poprzedniego commita GitHub (Revert danego commita). Nie trzeba cofać migracji SQL, bo nie ma żadnej nowej. W raportach nie powstają żadne nowe dane.

## Następna faza

**Phase 24.1 — Client Dashboard foundation**: projekt bezpiecznego logowania klientów, rozdzielenie uprawnień administrator / klient, powiązania zamówień i projektów, z minimalnym udostępnianiem danych.
Zwroty pozostają **wyłącznie w aplikacji Stripe**.
