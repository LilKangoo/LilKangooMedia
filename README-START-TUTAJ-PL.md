# LilKangooMedia — Phase 23.1 Sales CRM

Aktualizacja dla `LilKangoo/LilKangooMedia` (GitHub + Netlify + Supabase).

## Co otrzymujesz

- Prywatny panel `/admin-crm.html` dostępny po zalogowaniu istniejącym kontem admina Supabase.
- Etapy sprzedaży: New, Qualified, Proposal sent, Negotiating, Won, Lost.
- Widok kolumnowy oraz lista; wyszukiwanie i filtrowanie.
- Priorytet i szacowana wartość zlecenia w EUR (NIE przychód).
- Data kolejnego kontaktu, lista terminów przypadających dziś i zaległych.
- Prywatne notatki oraz dziennik ręcznie wykonanych kontaktów.
- Przyciski otwierające aplikację poczty, telefonu i WhatsApp. Nic nie wysyła się automatycznie.
- Zgłoszenia są pobierane z dotychczasowej `public.contact_leads` — również formularze B2B z Phase 22.4.
- Dodatkowy link „Sales CRM & follow-ups” w starym panelu `/admin.html`.

## Instalacja — poprawna kolejność

1. Zrób kopię danych lub snapshot projektu Supabase, jeśli to możliwe.
2. W projekcie Supabase używanym przez LilKangooMedia otwórz **SQL Editor → New query**.
3. Wklej BEZ ZMIAN całą zawartość pliku `supabase/migrations/20261110_lkm_sales_crm.sql` i kliknij **Run**. SQL tworzy **dwie nowe tabele**, z dostępem ograniczonym do administratorów poprzez istniejące `public.lkm_is_admin()`.
4. Rozpakuj ZIP. Wgraj pliki z folderów i katalogu głównego do repozytorium **LilKangoo/LilKangooMedia**, z zachowaniem ścieżek. Nie wgrywaj ich w dodatkowy podfolder. Dla istniejącego `admin.html` wybierz zastąpienie pliku.
5. Wykonaj **Commit changes**; poczekaj na zakończony deploy Netlify.
6. Otwórz `https://lilkangoomedia.com/admin.html`, kliknij „Sales CRM & follow-ups” albo przejdź na `https://lilkangoomedia.com/admin-crm.html`.
7. Zaloguj się tym samym kontem Supabase Admin. Po załadowaniu powinna się pojawić lista rzeczywistych zapytań.

**Żadne nowe klucze środowiskowe nie są potrzebne.** Nie zapisuj hasła ani kluczy service-role w HTML/JS.

## Szybkie sprawdzenie (nie pełny audyt)

- Czy administrator widzi tablicę z zapytaniami (nazwiska i e-maile znane z poprzedniego panelu)?
- Czy otwarcie klienta pokazuje jego oryginalny brief?
- Czy zapis zmiany statusu, wartości i terminu follow-up pozostaje po odświeżeniu strony?
- Czy dodana notatka typu „Internal note” pojawia się w historii?
- Czy użytkownik niezalogowany widzi ekran logowania, a nie prywatne dane?
- Czy wcześniejsze `/admin.html`, kalendarz i formularze pozostają dostępne?

W razie komunikatu o braku tabeli CRM sprawdź, czy uruchomiono SQL w PRAWIDŁOWYM projekcie Supabase. Nie przenoś danych ani nie zmieniaj reguł bezpieczeństwa na `anon`.

## Granice etapu 23.1

- Przyciski kontaktu są ręczne. **Brak automatycznych przypomnień, wysyłania e-maili, akceptacji ofert czy generowania PDF**; te funkcje należą do kolejnych etapów.
- `Won` w CRM **nie jest potwierdzeniem terminu ani zaksięgowaniem płatności**. Statusy Stripe i rezerwacji pozostają odrębne.
- Nie ma API zwrotów, przycisków refundacji ani automatycznych zwrotów. **Refundacje wyłącznie w aplikacji Stripe.**
- Pełny audyt produkcyjny całego serwisu wykonamy po zakończeniu Phase 23–25.
- Pierwsze case study powstanie dopiero na końcu projektu z materiałów i informacji dostarczonych przez właściciela, bez wymyślonych wyników.

## Pliki

```
admin.html
admin-crm.html
assets/lkm-v3/phase23-crm.js
assets/lkm-v3/phase23-crm.css
assets/lkm-v3/phase23-crm-admin-nav.js
supabase/migrations/20261110_lkm_sales_crm.sql
tests/phase23-crm-structure.test.mjs
tests/test_phase23_crm_browser.py
README-START-TUTAJ-PL.md
```

## Testy lokalne

- `node --test tests/phase23-crm-structure.test.mjs` — 6/6 PASS.
- `python tests/test_phase23_crm_browser.py` — PASS komputer 1400 px, telefon 390 px, kontrola niezalogowanego użytkownika, na *symulowanych odpowiedziach bazy*.
- Testy nie łączą się z produkcją i nie zmieniają rzeczywistych danych.
