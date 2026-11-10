# LilKangooMedia — Phase 23.2 Quotation Builder

Aktualizacja do `LilKangoo/LilKangooMedia` (GitHub → Netlify; Supabase). Działa z istniejącym Phase 23.1 CRM.

## Co nowego

- **Prywatny panel** `https://lilkangoomedia.com/admin-quotes.html` (logowanie istniejącym kontem administratora Supabase).
- Link **Create quotation** w panelu `https://lilkangoomedia.com/admin-crm.html` po otwarciu klienta oraz **Quotation Builder** w głównym adminie.
- Wycena powiązana z realnym zapytaniem w `public.contact_leads`, z danymi klienta, firmy, wprowadzeniem, zakresem, warunkami i datą ważności.
- **Pozycje wyceny**: własne usługi albo wybrane aktywne pakiety z katalogu, z możliwością zmiany opisu, ilości i ceny. Obsługiwane ilości od 0,25 w krokach 0,25. Rabat jako stała kwota w euro. Wszystkie kwoty obliczane są w groszach euro, bez zgadywania stawek podatkowych.
- Numery wycen automatycznie nadawane przez Supabase: `LKM-Q-000001`, `LKM-Q-000002` itd.
- **Zapis szkicu**, odświeżanie i ponowne otwarcie wcześniej zapisanej wyceny, ręczne oznaczenie „wysłana” (bez wysyłki), możliwość utworzenia nowej wersji na podstawie poprzedniej wyceny.
- **Elegancki wydruk A4** z logo LilKangooMedia, danymi klienta, zestawieniem pozycji, sumami i warunkami. PDF generuje natywna funkcja przeglądarki **Print / Save as PDF**. Bez bibliotek zewnętrznych i bez przetwarzania dokumentu na obcym serwerze.
- Oddzielne tabele CRM i wycen. Wyceny **nie zmieniają płatności Stripe, rezerwacji, faktur i statusów zamówień**.

## Instalacja — kolejność

1. Potwierdź, że **Phase 23.1 CRM** jest już zainstalowana i działa (potwierdzone w ostatnim zrzucie ekranu).
2. W **istniejącym** projekcie Supabase LilKangooMedia przejdź do **SQL Editor → New query**.
3. Wklej całą zawartość pliku **`supabase/migrations/20261110_lkm_quotations.sql`** i kliknij **Run**. To nowa migracja dla Phase 23.2. Plik `20261110_lkm_sales_crm.sql` jest dołączony wyłącznie jako odniesienie do poprzedniej fazy — **NIE uruchamiaj go ponownie**, skoro CRM już działa.
4. Rozpakuj ZIP i wgraj jego pliki do głównego katalogu repozytorium `LilKangoo/LilKangooMedia` z zachowaniem struktury katalogów. Nie umieszczaj całości w dodatkowym folderze.
5. Zastąp istniejące `admin.html`, `admin-crm.html`, `assets/lkm-v3/phase23-crm.js` (zmiany są tylko addytywne, zachowują funkcje CRM). **Nie usuwaj innych plików.**
6. Commit changes → automatyczny deploy Netlify.
7. Otwórz **`https://lilkangoomedia.com/admin-crm.html`**, wybierz klienta, kliknij **Create quotation** (lub odwiedź `https://lilkangoomedia.com/admin-quotes.html` i wybierz zgłoszenie).

## Jak zrobić pierwszą wycenę

1. Wybierz realne zapytanie klienta (np. testowe, które masz w CRM). Dane klienta wstawią się z zapytania.
2. Wpisz tytuł, dane firmy (jeśli chcesz), okres ważności, zakres i warunki.
3. Dodaj pozycję `+ Add from catalogue` albo `+ Add custom line`. Sprawdź ilości, ceny jednostkowe i ewentualny rabat.
4. Kliknij **Save quotation**. Baza nada numer `LKM-Q-...`.
5. Kliknij **Print / Save as PDF** → w Chrome na Mac wybierz **Destination: Save as PDF**, format **A4**, zapisz plik. W Safari wybierz **Print → PDF → Save as PDF**. Jeśli nagłówek/stópka przeglądarki psują wygląd, wyłącz opcję „Headers and footers” w oknie drukowania.
6. **Załącz plik PDF ręcznie** do e-maila klienta. W panelu przycisk `Draft email to client` jedynie otwiera szkic w programie pocztowym — **nie dołącza pliku automatycznie**.
7. Dopiero po faktycznym wysłaniu dokumentu kliknij **Mark sent manually**. Aby zmienić ceny lub zakres w już wysłanej wycenie, użyj **Create revised draft**; oryginalny dokument zachowuje swój numer.

**Nie wysyłaj dokumentu do klienta bez sprawdzenia zakresu, wyceny i warunków.** Podany numer jest numerem *wyceny*, nie numerem faktury. Wycena nie potwierdza terminu i nie pobiera pieniędzy. Ta faza nie oblicza VAT ani nie wystawia dokumentów podatkowych.

## Szybkie sprawdzenie po wdrożeniu (nie pełny audyt)

- [ ] `/admin-crm.html` dalej pokazuje rzeczywiste leady i szczegóły sprzedaży.
- [ ] `Create quotation` w wybranym leadzie otwiera edytor z poprawnym imieniem, mailem i telefonem.
- [ ] `Add from catalogue` pokazuje tylko faktyczne, aktywne pakiety z konkretną ceną; zmiana godzin/ilości przelicza subtotal.
- [ ] `Save quotation` zapisuje dane i nadaje numer `LKM-Q-...`; odświeżenie wyświetla zapisaną wycenę na liście.
- [ ] `Print / Save as PDF` otwiera systemowe okno drukowania, a pobrany PDF ma logo, dane klienta, pozycje, sumę, daty i warunki. PDF testowy z jedną pozycją mieścił się na 1 stronie A4.
- [ ] `Mark sent manually` nie wysyła maila; kopia „Create revised draft” może służyć do nowej wersji.
- [ ] Bez logowania/roli administratora nie widać danych klientów. Wcześniejsze kalendarze, rezerwacje i płatności nie zmieniły się.

## Bezpieczeństwo i ograniczenia

- SQL włącza **RLS** i daje dostęp wyłącznie zalogowanym administratorom `public.lkm_is_admin()`. Nie udostępnia ofert jako publicznych linków ani nie używa klucza `service_role` w JS.
- Oferta jest widoczna **tylko w panelu administratora**. Klient dostaje PDF ręcznie, nie link do prywatnego panelu. Akceptacja/odrzucenie ofert i przypomnienia należą do Phase 23.3.
- `Mark sent manually` zmienia status tylko wyceny. Nie zmienia etapu CRM, nie tworzy rezerwacji i nie pobiera płatności.
- **Zwroty wyłącznie w aplikacji Stripe.** Brak przycisków/endpointów refund w tym pakiecie.
- Case Study uzupełnimy na **końcu** po otrzymaniu od Ciebie prawdziwych zdjęć, filmów i opisu projektu.
- Pełny audyt produkcyjny całej platformy zgodnie z ustaleniem wykonamy dopiero po Phase 25.

## Pliki w ZIP

```
README-START-TUTAJ-PL.md
admin.html
admin-crm.html
admin-quotes.html
assets/lkm-v3/phase23-crm.js
assets/lkm-v3/phase23-crm.css
assets/lkm-v3/phase23-crm-quote-admin-nav.js
assets/lkm-v3/phase23-quotes.css
assets/lkm-v3/phase23-quotes.js
assets/lkm-v3/phase23-quotes-core.mjs
supabase/migrations/20261110_lkm_quotations.sql
supabase/migrations/20261110_lkm_sales_crm.sql   (poprzednia faza; nie uruchamiaj ponownie)
tests/phase23-quotes-core.test.mjs
tests/test_phase23_quotes_browser.py
tests/phase23-crm-structure.test.mjs
tests/test_phase23_crm_browser.py
```

## Weryfikacja lokalna

- `node --test tests/phase23-crm-structure.test.mjs tests/phase23-quotes-core.test.mjs` — **16/16 PASS**.
- `python tests/test_phase23_quotes_browser.py` — PASS komputer 1280 px, telefon 390 px, test dostępu dla nie-admina; dokument PDF testowy poprawnie wygenerowany (1 strona A4).
- `python tests/test_phase23_crm_browser.py` — PASS wcześniejszych funkcji CRM na komputerze i telefonie.
- Testy używają **symulowanych danych i odpowiedzi Supabase**. Nie wykonywano rzeczywistych zapisów na produkcji i nie wysyłano maili.
