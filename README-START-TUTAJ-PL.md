# LilKangooMedia — Phase 20.3: Customer UX & Navigation

## Co poprawiliśmy

- Katalog: działający przycisk **Search** przewijający do widocznych wyników, przycisk **Clear**, skrót `/` do wyszukiwarki (poza polami formularzy).
- Wyszukiwanie przy włączonym filtrze kategorii: wskazówki dotyczące wyników w **innych kategoriach** i przycisk **Search all categories** zachowujący wpisany tekst.
- Nazwy usług na kartach są klikalne; pozostają dotychczasowe przyciski Explore i Quick enquiry.
- Mobile: pasek kategorii przewijany poziomo, wygodniejsze kontrolki wyszukiwarki.
- Szczegóły usługi: skrót do pakietów/sekcji zapytań i powrót do katalogu; bez ingerencji w ceny.
- Formularze: data preferowana nie może być z przeszłości; czytelna informacja, że termin musi zostać potwierdzony przez LilKangooMedia.
- Kontakt: wygodny skrót do istniejącego numeru WhatsApp.

Nie zmienialiśmy Supabase, admina, Netlify Functions, cen, zniżek, Stripe, danych klientów ani URL-i SEO.

## Instalacja (po zakończeniu Phase 20.2)

### Najłatwiejsza metoda — pełna paczka

1. W Netlify sprawdź, czy Phase 20.2 ma status **Published**.
2. Rozpakuj `LilKangooMedia_Phase20_3_CUSTOMER_UX_FULL.zip`.
3. Skopiuj pliki do repozytorium GitHub `LilKangoo/LilKangooMedia` **z zachowaniem ścieżek**:
   - `index.html` (HTML Phase 20.2 + dwie nowe linie)
   - `home.html` (HTML Phase 20.2 + dwie nowe linie)
   - `assets/lkm-v3/phase20-ux.js` (nowy)
   - `assets/lkm-v3/phase20-ux.css` (nowy)
4. Commit changes → poczekaj na nowy deploy Netlify → Cmd + Shift + R.

### Bezpieczna metoda, jeśli po Phase 20.2 zmieniałeś HTML

Nie nadpisuj `index.html` ani `home.html`. Rozpakuj `LilKangooMedia_Phase20_3_CUSTOMER_UX_PATCH.zip`, dodaj **dwa nowe pliki** `assets/lkm-v3/phase20-ux.js` i `assets/lkm-v3/phase20-ux.css`. W **obu** obecnych plikach `index.html` i `home.html` dodaj dokładnie raz, tuż przed `</head>`:

```html
<link rel="stylesheet" href="/assets/lkm-v3/phase20-ux.css">
<script defer src="/assets/lkm-v3/phase20-ux.js"></script>
```

Nie usuwaj istniejących skryptów `phase20-conversion.js` ani `phase20-funnel.js`.

## Test po wdrożeniu

1. Otwórz `https://lilkangoomedia.com/#/services?audience=personal` na telefonie i komputerze.
2. Wpisz fragment nazwy usługi i kliknij `Search`: strona przewija do wyników. `Clear` usuwa wpis.
3. Wybierz kategorię i wpisz nazwę usługi z innej kategorii: powinny pokazać się podpowiedzi i `Search all categories`.
4. Kliknij nazwę dowolnej usługi oraz `Quick enquiry`: oba działania muszą funkcjonować.
5. Na stronie szczegółów kliknij `Jump to packages`. Sprawdź też mobilny pasek z Phase 20.1.
6. W konfiguratorze i formularzu Quick enquiry spróbuj wybrać minioną datę: pole nie powinno tego akceptować.
7. Sprawdź, czy po Phase 20.2 zachowały się zdarzenia GA4, bez podwójnego liczenia. Ten moduł **nie dodaje nowych zdarzeń**.
8. Jeśli chcesz przetestować zapis zapytania, użyj własnego adresu e-mail, potem sprawdź `contact_leads` oraz Resend. Nie testuj na danych klientów.

## Cofnięcie zmiany

Usuń tylko powyższe dwie linie HTML z **obu** stron albo wróć do poprzedniego działającego deployu Netlify. Nowe pliki CSS/JS bez linków w HTML nie będą ładowane.

## Testy wykonane

- `node --check assets/lkm-v3/phase20-ux.js` — PASS.
- Test w Chromium (Playwright): Clear/Search, wyniki w innych kategoriach, przełączenie na All z zachowaniem wpisanej frazy, formularz z Phase 20.1, walidacja daty, brak pętli DOM — PASS.
- HTML `index.html` i `home.html` pochodzi z dokładnej paczki Phase 20.2 z dopisanymi tylko dwoma linkami do nowych zasobów.
- Kontrola integralności ZIP — PASS.
- **Rzeczywisty deploy produkcyjny, płatności i zapis danych po tej aktualizacji nie były wykonywane**. Te elementy sprawdź na Netlify i Supabase po wdrożeniu.

## Kolejny krok

Phase 20.4 — poprawa niezawodności formularzy, komunikatów o częściowym powodzeniu i dostępności, potem Phase 20.5 SEO/performance.
