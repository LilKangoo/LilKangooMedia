# LilKangooMedia — Phase 20.4: Reliable Enquiries

**Instaluj po Phase 20.3** (Customer UX). Ta poprawka rozwiązuje problem niejednoznacznego wyniku formularza, gdy Supabase zapisze zapytanie, ale e-mail z Resend nie wyjdzie lub klient utraci połączenie.

## Co zmienia

1. Każdy formularz (`bookingForm`, `contactForm` i `lkm20-quick-form`) dostaje własny losowy identyfikator `request_id` (UUID v4) **przed** wysłaniem przez istniejącą funkcję. Przy ponowieniu wysyłki tego samego formularza identyfikator pozostaje taki sam; po zmianie wpisanych danych powstaje nowy.
2. Endpoint Netlify `POST /api/enquiry` wykorzystuje `request_id` jako identyfikator rekordu w istniejącej tabeli `contact_leads` (kolumna `id uuid primary key`). Ponowienie tego samego identyfikatora zwraca potwierdzenie istniejącego zgłoszenia, zamiast tworzyć duplikat lub wysyłać drugi e-mail.
3. Jeśli Supabase zapisał rekord, ale Resend nie wyśle maila, serwer zwraca `200 {ok:true,saved:true,notification_sent:false}`. Klient otrzymuje potwierdzenie, ponieważ zapytanie rzeczywiście jest w bazie. Błąd trafia do logów Netlify.
4. Przy braku konfiguracji Resend zapis do Supabase nadal działa; w logach Netlify widoczny jest błąd powiadomienia. Dane kontaktowe pozostają w panelu **Enquiries & bookings**.
5. Stare formularze bez `request_id` nadal działają.

**Nie zmieniamy:** tabel i polityk RLS Supabase, cen, Stripe, artykułów, SEO, konfiguratora, schematu usług, opinii Google ani poprzednich modułów Phase 20.

## Wariant A — polecany FULL

1. Upewnij się, że Phase 20.3 ma status **Published** w Netlify.
2. Rozpakuj `LilKangooMedia_Phase20_4_RELIABLE_FORMS_FULL.zip`.
3. Przekopiuj dokładnie pliki i foldery do głównego katalogu GitHub `LilKangoo/LilKangooMedia`:
   - `index.html`
   - `home.html`
   - `assets/lkm-v3/phase20-reliability.js` (nowy)
   - `netlify/functions/enquiry.mjs` (aktualizacja istniejącego endpointu)
   - `tests/netlify-enquiry.test.mjs` (aktualizacja testów)
4. W GitHub wykonaj **Commit changes**. Poczekaj na Netlify → Deploys → **Published**.
5. Otwórz stronę przez Cmd + Shift + R.

**Uwaga:** `index.html` oraz `home.html` opierają się dokładnie na Phase 20.3 i mają dodaną tylko jedną linię `<script>`.

## Wariant B — PATCH, jeśli edytowałeś HTML po Phase 20.3

Zamiast nadpisywać `index.html` i `home.html`, skopiuj z PATCH tylko 3 pliki:
- `assets/lkm-v3/phase20-reliability.js`
- `netlify/functions/enquiry.mjs`
- `tests/netlify-enquiry.test.mjs`

Następnie w **obu** własnych plikach `index.html` i `home.html` dodaj dokładnie raz, przed `</head>`:

```html
<script defer src="/assets/lkm-v3/phase20-reliability.js"></script>
```

Nie usuwaj już istniejących `phase20-conversion.js`, `phase20-funnel.js`, `phase20-ux.js` ani ich CSS.

## Test po instalacji

1. Otwórz `https://lilkangoomedia.com/#/contact` i wyślij **jedno własne testowe zapytanie**. Powinno pojawić się w Supabase → Table editor → `contact_leads` oraz w adminie → Enquiries & bookings.
2. Sprawdź Resend → Emails i skrzynkę LilKangooMedia. Jeżeli mail nie dotarł, ale zgłoszenie jest w tabeli, **nie wysyłaj go ponownie**; sprawdź Netlify → Logs → Functions → `enquiry`.
3. Otwórz losową usługę i wyślij test przez **Quick enquiry**. Sprawdź, czy przypisana jest poprawna usługa.
4. W Network → `/api/enquiry` poprawna odpowiedź powinna zawierać `ok: true`, `saved: true` i `notification_sent: true` (albo `false`, jeśli powiadomienie nie działa).
5. Sprawdź mobilny pasek CTA, wyszukiwarkę i GA4 — poprawka nie zmienia tych funkcji.

**Nie testuj na danych prawdziwych klientów.** Nie wyłączaj Resend ani nie zmieniaj produkcyjnych kluczy, aby sztucznie symulować błąd. Automatyczne testy z atrapami API obejmują nieudany Resend i duplikaty.

### Ważne ograniczenie

Zapis do Supabase jest źródłem prawdy, ale ta aktualizacja **nie tworzy kolejki ponawiania nieudanych powiadomień e-mail**. Gdy Resend nie działa, zapytania są widoczne w bazie, ale e-mail nie zostanie automatycznie wysłany później. Warto więc kontrolować admin → Enquiries & bookings i logi Netlify do czasu naprawy Resend. Duplikat z tym samym identyfikatorem nie ponawia powiadomienia.

## Kontrola techniczna

- `node --check netlify/functions/enquiry.mjs` — PASS.
- `node --check assets/lkm-v3/phase20-reliability.js` — PASS.
- `node --test tests/netlify-enquiry.test.mjs` — 11 PASS.
- Chromium/Playwright: stały identyfikator przy ponownej próbie, nowy po edycji formularza i przy kolejnym otwarciu Quick enquiry — PASS.
- Archiwum ZIP: integralność i kontrola ścieżek — PASS.

**Nie testowano realnego zapisu/Resend/Netlify na produkcji.** Potwierdź działanie po wdrożeniu.

## Cofanie zmian

W Netlify wybierz poprzedni działający deploy lub przywróć poprzednią wersję `netlify/functions/enquiry.mjs`, usuń jedną linię skryptu z `index.html` i `home.html`. Sam plik `phase20-reliability.js` nie jest uruchamiany bez odwołania z HTML.

## Następny etap

Phase 20.5 — audyt SEO, wydajności stron i zgodności linków bez naruszania zachowanych adresów artykułów.
