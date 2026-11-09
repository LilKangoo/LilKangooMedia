# LilKangooMedia — Phase 13: Multi-Service Quote Builder

## Co zmienia

Klient, konfigurując dowolną usługę w `/#/quote` lub `/home.html#/quote`, może teraz dodać kolejne **aktywne** usługi z aktualnego cennika Supabase. Dostaje listę z miniaturami, kategoriami i wyszukiwarką. Dla każdej wybranej usługi może ustawić pakiet, ilość (np. liczbę godzin) i dodatki. Sumowanie korzysta z tego samego `LKMPricing.estimate()` co istniejąca witryna.

W podsumowaniu oddzielnie widać kwoty jednorazowe, miesięczne i roczne. Pozycje „Custom quote” nie są zgadywane ani traktowane jako €0 — wyświetlają się jako wycena indywidualna. Wybrane dodatkowe usługi i pełne podsumowanie przechodzą do kroku **Send request** oraz do treści zapytania zapisywanego przez aktualny formularz i wysyłanego e-mailem.

**Ważne:** przy kilku usługach wysyłamy **jedno zapytanie**. Obecny Stripe checkout dotyczy pojedynczego pakietu, dlatego na etapie łączonego zamówienia nie jest oferowany. Nie ma automatycznych płatności, nie są tworzone nowe tabele ani modyfikowane ceny. Ostateczna wycena i dostępność pozostają do potwierdzenia przez LilKangooMedia.

## Wdrożenie: najbezpieczniejsza metoda (GitHub + Netlify)

1. Utwórz gałąź `lkm-multi-service-v13` od aktualnej `main`.
2. Przenieś **dwa nowe pliki** z paczki do **istniejącego** folderu `assets/lkm-v3/` (nie zastępuj całego folderu):
   - `service-bundle.js`
   - `service-bundle.css`
3. Otwórz w GitHubie **obydwa** pliki `index.html` oraz `home.html`. W każdym, wewnątrz `<head>`, **bezpośrednio przed `</head>`**, wstaw dwie linie:

```html
<link rel="stylesheet" href="/assets/lkm-v3/service-bundle.css">
<script src="/assets/lkm-v3/service-bundle.js" defer></script>
```

4. Commit/Push na gałęzi testowej. Otwórz Netlify **Deploy Preview** (nie produkcję) i przejdź do usługi, potem do **Configure package**.
5. Sprawdź testy poniżej. Po udanym teście połącz gałąź z `main`.

**Alternatywa na Macu:** jeśli repozytorium jest sklonowane lokalnie, skopiuj całą zawartość ZIP do katalogu głównego repozytorium, a w terminalu będąc w tym katalogu uruchom:

```bash
python3 APPLY-PHASE13.py
```

Skrypt dodaje dokładnie dwie wymagane linie do aktualnych plików HTML. Nie podmienia reszty zawartości i można go uruchomić ponownie bez duplikatów. Nie ma potrzeby commitować `APPLY-PHASE13.py` do repozytorium.

## Test kontrolny

- Otwórz np. **Personal Videography → Configure package**. Pod głównym pakietem pojawi się **Add more services**.
- Dodaj inną aktywną usługę, wybierz jej pakiet i sprawdź, czy podsumowanie zawiera **oba** pakiety.
- Zmień pakiet drugiej usługi i liczbę godzin (jeśli ma stawkę godzinową). Sprawdź aktualizację ceny.
- Dodaj abonament miesięczny: cena **/month** jest osobna od opłaty jednorazowej.
- Dodaj usługę z ceną **Custom quote**: suma wyświetla wycenę indywidualną, nie fikcyjną cenę zero.
- Wybierz **Continue to details**. Zobacz oba pakiety i podsumowanie. Przy kilku usługach nie ma przycisku Stripe.
- Wyślij jedno testowe zapytanie i sprawdź jego tekst w **Admin → Enquiries & Bookings** oraz w Zoho. Sekcja `[ADDITIONAL SERVICES]` zawiera listę, pakiety, ilości, dodatki i łączną estymację.
- Usuń dodaną usługę i sprawdź powrót do wyceny tylko usługi głównej.

## Zakres i bezpieczeństwo

- **Brak SQL.** Korzysta z istniejącej publicznej tabeli `services` i istniejącego modułu `LKMPricing`.
- **Brak zmian w `site.js`.** Aktualny formularz, filmy, galerii, pakiety, logowanie i sesja pozostały nienaruszone.
- **Brak zmian w backendzie** — szczegóły trafiają do pola `message`, z uwzględnieniem limitu 3000 znaków serwera.
- Dostępne są wyłącznie usługi aktywne; dane i ceny są czytane z Supabase, nie ze statycznych wpisów w kodzie.
- Klient może modyfikować wyświetlone dane w przeglądarce. To **nie jest wiążąca wycena ani finalna cena płatności**. Przed wysłaniem faktury trzeba porównać zapytanie z obowiązującym cennikiem.
- W przypadku, gdy pobranie usług z Supabase nie działa, istniejąca strona i formularze działają bez dodatkowego modułu.

## Testy techniczne

- Kontrola składni: `node --check assets/lkm-v3/service-bundle.js`.
- Lokalny test automatyczny w Chromium na danych symulowanych: dodanie godzinowej usługi, zmiana ilości, dodatek, abonament miesięczny, wycena indywidualna, usunięcie usługi, przekazanie do formularza, blokada Stripe i utworzenie opisu zapytania. **Wszystkie sprawdzenia przeszły**.
- Nie przeprowadzono testu na produkcyjnym Supabase. Wdrażaj najpierw na gałęzi testowej.
