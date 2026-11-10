# LilKangooMedia — Phase 21.2: Netlify Stripe Checkout & Signed Webhooks

**Jedna kompletna paczka do aktualizacji istniejącego repozytorium GitHub. Bez ręcznej edycji kodu, bez nowego SQL.**
Baza: rzeczywisty `LilKangoo/LilKangooMedia` na gałęzi `main` po Phase 21.1 (10.11.2026).

## Co dodano
- Bezpieczne funkcje Netlify: `POST /api/checkout`, `POST /api/stripe-webhook`, `GET /api/payment-options`.
- Checkout w przeglądarce tylko po **wyraźnym włączeniu** integracji i wyłącznie dla aktywnej usługi z `booking_mode` `deposit` lub `full`, stałym pakietem i prostymi jednorazowymi dodatkami.
- Serwer liczy należność z aktywnego rekordu w Supabase. Cena wysłana przez przeglądarkę jest ignorowana. Pakiety miesięczne, godzinowe, „from”, niestandardowe, łączone i z opłatą wdrożeniową nadal obsługuje zapytanie.
- Płatność kartą przez Stripe Checkout; idempotentny request tworzenia sesji.
- Weryfikacja HMAC SHA256 podpisu webhooku Stripe na surowym body i ograniczenie czasu podpisu do ±5 minut. Oddzielne środowiska test/live.
- Zapis do istniejącej `stripe_orders` atomowym INSERT ON CONFLICT DO NOTHING. Status `paid_pending_confirmation` lub `test_paid_pending_confirmation` — **zapłacenie nie potwierdza daty**.
- Powiadomienie Resend po nowym zapisie. Błąd Resend nie anuluje opłaconego zamówienia ani nie powoduje podwójnego zapisu.
- Zdarzenia z innych projektów Stripe ignorowane po identyfikatorze `lkm_project`.
- Oryginalny (niekompatybilny z Netlify) `#checkoutButton` pozostaje ukryty przez Phase 21.1. Nowy, odrębny przycisk pojawia się wyłącznie wtedy, gdy integracja jest włączona i wybór usługi jest zgodny z warunkami płatności.

## Instalacja — bez zmian w kodzie
1. Rozpakuj ZIP, wgraj **wszystkie pliki** do repozytorium `LilKangoo/LilKangooMedia`, zachowując nazwy katalogów, potwierdź zastąpienie `index.html`, `home.html` i plików Phase 21.1.
2. Zapisz `Commit changes`. Poczekaj na nowy deploy w Netlify (`Published`). **Po samym deployu pobieranie płatności jest wyłączone**.
3. Sprawdź `https://lilkangoomedia.com/api/payment-options`: powinno zwracać `{"enabled":false,"mode":"off"}`. Formularze zapytań muszą działać bez zmian.
4. Test Stripe wymaga konfiguracji **ustawień usług, nie kodu** (patrz poniżej); jeśli nie chcesz na razie korzystać z płatności, skończ na kroku 3.

## Jak uruchomić bezpieczny TEST — ustawienia Netlify/Stripe
Poniższych sekretów NIE wpisuj do kodu ani ZIP-a. Netlify → Site configuration → Environment variables → Add a variable (dostępne dla Functions):
- `LKM_PAYMENTS_MODE` = `test`
- `STRIPE_SECRET_KEY` = **Stripe test secret key** (`sk_test_...`)
- `STRIPE_WEBHOOK_SECRET` = **sekret podpisu dla testowego endpointu webhook**, (`whsec_...`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` = istniejące sekrety Netlify dla aplikacji i bazy; muszą być poprawnie ustawione.
- `SITE_URL` = `https://lilkangoomedia.com/`
- Opcjonalnie `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_EMAIL` (prawdopodobnie już są używane dla zapytań).
- Jeśli wypełniony jest `TURNSTILE_SECRET`, Checkout wymaga prawidłowego tokenu Turnstile z formularza.

W Stripe w **trybie testowym** zarejestruj endpoint webhook: `https://lilkangoomedia.com/api/stripe-webhook`, nasłuchujący `checkout.session.completed` (i opcjonalnie `checkout.session.async_payment_succeeded`). Zapisz jego sekret podpisu jako `STRIPE_WEBHOOK_SECRET` w Netlify. Po zmianie zmiennych wykonaj nowy deploy Netlify, jeśli wymaga tego panel.

W panelu administracyjnym wybraną usługę o **potwierdzonej, stałej cenie** ustaw na tryb `deposit` lub `full` (oraz odpowiedni procent zaliczki). **Nie uruchamiaj dla pakietów wycenianych indywidualnie.** Przetestuj kartą testową Stripe. W Supabase `stripe_orders` powinien pojawić się wpis `test_paid_pending_confirmation`, a w adminie wpis w części zamówień. Potwierdź podpis webhooku w Stripe oraz zapis tylko jednego wiersza po ponowieniu eventu. Jeśli nie widzisz potwierdzenia w bazie, nie przełączaj integracji na live.

### Tryb LIVE — dopiero po udanym teście
Zmienne Netlify: `LKM_PAYMENTS_MODE=live`, `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_WEBHOOK_SECRET=whsec_...` z **live** endpointu webhook oraz `LKM_LIVE_PAYMENTS_APPROVED=YES`. Tryb live jest **zablokowany**, jeśli choć jeden z tych warunków jest niespełniony. Zarejestruj webhook także w live Stripe i przeprowadź kontrolowaną płatność. Poinformuj klienta, że termin nadal wymaga ręcznego potwierdzenia. Zasady zaliczek, zwrotów i podatek muszą być zgodne z Twoją ofertą.

### Ważne ograniczenia
- Ten etap **nie tworzy kalendarza dostępności, blokad terminów ani automatycznego potwierdzenia**. W przyszłej Phase 21.3 dopracujemy dostępność. Zanim jej nie ma, zaliczki trzeba obsługiwać jako rezerwacje **oczekujące na potwierdzenie**, z możliwością ręcznego zwrotu przez Stripe.
- W przypadku awarii Resend po zapisie płatności mail może nie dotrzeć. Zamówienie pozostaje w `stripe_orders` i trzeba kontrolować je w panelu.
- Samego POST do webhooku nie wolno testować bez prawidłowego podpisu Stripe — zwróci 400.
- Nie publikuj w GitHub żadnego `sk_test`, `sk_live`, `whsec` ani `SUPABASE_SERVICE_ROLE_KEY`.
- ZIP jest **aktualizacją/overlay**, nie całym repozytorium. Wgrywaj przez GitHub, nie Netlify Drop.
- Ta wersja nie implementuje usług cyklicznych, wielousługowych ani płatności po zatwierdzonej wycenie (późniejsze etapy).

## Testy w paczce
`node --test tests/phase21-payments.test.mjs` — serwerowe scenariusze płatności. `python tests/test_phase21_payment_browser.py` — odizolowane testy Chromium (opcjonalnie, wymaga Playwright i Chromium). Testy wymagają istniejącej Phase 21.1 (w paczce zachowano jej JS/CSS).

## Cofnięcie
Jeżeli deploy nie przejdzie, przywróć poprzedni commit GitHub/Netlify. Wyłączenie nowych płatności bez cofania kodu: w Netlify ustaw `LKM_PAYMENTS_MODE=off` i opublikuj zmianę ustawień.
