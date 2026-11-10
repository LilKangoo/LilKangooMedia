# LilKangooMedia — Phase 21.1: Booking Preferences (FULL ZIP)

**Jedna paczka, bez ręcznej edycji kodu.** Przygotowano na bazie wdrożonej Phase 20.5 i obecnego repozytorium `LilKangoo/LilKangooMedia` (`main`, 10 listopada 2026).

## Co zostało dodane
- Na ekranie `/#/request` klient wybiera preferowaną porę (elastycznie / rano / po południu / wieczorem), alternatywny termin i lokalizację wydarzenia.
- Po prawej stronie zamówienia widzi aktualizowane podsumowanie preferowanego terminu i lokalizacji.
- Formularz przesyła te dane istniejącym endpointem `POST /api/enquiry` (Netlify); trafiają do `contact_leads.message` w Supabase i do powiadomienia Resend. Nie potrzeba nowych tabel ani wykonywania SQL.
- Backend odrzuca daty z przeszłości, nieistniejące daty, błędne przedziały czasu i niepoprawną datę alternatywną.
- Zachowana jest ochrona przed ponownym wprowadzeniem tego samego zgłoszenia z Phase 20.4.
- Istniejący przycisk Stripe Checkout na ekranie zapytania jest na razie ukryty, ponieważ w repozytorium funkcje `functions/api/checkout.js` i `functions/api/stripe-webhook.js` są w formacie Cloudflare Pages, podczas gdy `netlify.toml` korzysta z Netlify Functions. Brak aktualnie zweryfikowanej pary Netlify Checkout + webhook. To zapobiega błędnym obietnicom płatności.

**WAŻNE:** Ta wersja nie pokazuje dostępności w czasie rzeczywistym, nie blokuje terminów i nie pobiera płatności. Klient wysyła **prośbę o potwierdzenie terminu**. Datę i ewentualne koszty dojazdu potwierdza LilKangooMedia. Prawdziwy kalendarz i Stripe będą kolejnym etapem 21.2 — po wdrożeniu serwerowej obsługi i testach webhooków.

## Instalacja — bez edycji kodu
1. Rozpakuj plik ZIP.
2. Otwórz repozytorium GitHub `LilKangoo/LilKangooMedia`.
3. Wgraj **wszystkie pliki zawarte w ZIP**, zachowując strukturę katalogów (`assets/lkm-v3/`, `netlify/functions/`, `tests/`). Jeśli GitHub pyta o podmianę istniejących plików, zaakceptuj.
4. Wykonaj `Commit changes` i sprawdź w Netlify, czy deploy ma status `Published`.
5. Sprawdź `https://lilkangoomedia.com/#/services`, otwórz dowolną usługę, wybierz pakiet i przejdź do ekranu zapytania. Zobacz sekcję "When and where?".
6. Wyślij **jedno testowe zapytanie** (np. wpisz `PHASE 21.1 TEST` w treści) i sprawdź je w `Supabase > contact_leads` oraz w `Admin > Enquiries & bookings`. W polu `message` powinny pojawić się `BOOKING PREFERENCES`.
7. Sprawdź, że przycisk płatności nie jest pokazywany, a rezerwacja jest opisana jako oczekująca na potwierdzenie.

## Bezpieczeństwo i zgodność
- Brak nowych sekretów, ustawień Netlify, tabel, migracji SQL lub edycji `netlify.toml`.
- Zachowano obecne artykuły, SEO, ceny, pakiety, galerie, formularze kontaktowe i analitykę.
- Wersja obejmuje tylko zmienione/dodane pliki. **Nie jest to kompletna kopia całego repozytorium** — wgrywamy ją na istniejący projekt.
- Nie wgrywaj archiwum przez Netlify Drop zamiast przez GitHub — byłaby to niepełna strona.
- Jeśli wystąpi problem, w Netlify możesz przywrócić poprzedni działający deploy, a w GitHub cofnąć commit tej aktualizacji.

## Testy przygotowania
- `node --check assets/lkm-v3/phase21-booking.js`: PASS.
- `node --check netlify/functions/enquiry.mjs`: PASS.
- `node --test tests/netlify-enquiry.test.mjs`: 15/15 PASS (m.in. duplikaty, Resend, daty, booking preferences).
- Test Chromium desktop 1280 px i mobile 390 px: PASS — pola, podsumowanie, brak checkout, SPA rerender.
- Rzeczywisty deploy Netlify i dostarczenie maila wymagają potwierdzenia po wdrożeniu.

## Kolejny etap
**Phase 21.2: bezpieczna integracja Netlify Stripe Checkout + podpisany webhook + ręczne potwierdzanie dostępności.** Nie włączamy realnych płatności bez pozytywnych testów technicznych i konfiguracji Stripe.
