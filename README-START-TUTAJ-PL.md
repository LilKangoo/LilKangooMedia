# LilKangooMedia — Phase 20.2: Sales Funnel Analytics (GA4)

## Co dodaje aktualizacja

Ta aktualizacja rozbudowuje GA4 o pomiar ścieżki klienta. Nie zmienia katalogu, cenników, Quick Enquiry, Supabase, Resend ani Stripe.

Nowe zdarzenia (tylko po wyrażeniu zgody na analitykę):

| Zdarzenie GA4 | Kiedy powstaje |
| --- | --- |
| `select_item` | Kliknięcie w link szczegółów usługi z karty katalogu. |
| `lkm_cta_click` | Kliknięcie przycisku typu Quick enquiry, Configure package, Continue to enquiry, kontakt/WhatsApp, wniosek o checkout. |
| `lkm_package_select` | Kliknięcie wariantu cenowego usługi. |
| `lkm_quote_view` | Przejście do widoku konfiguracji `#/quote`. |
| `lkm_request_view` | Przejście do formularza `#/request`. |
| `lkm_form_start` | Pierwsze wejście w pole danego formularza. |
| `lkm_form_submit_attempt` | Próba wysłania poprawnego formularza. **To nie jest potwierdzony lead.** |
| `lkm_form_validation_error` | Przeglądarka zgłasza brak wymaganego pola lub błąd walidacji (max raz na 1,5 s). |

**Już istniejące** `page_view`, `view_item`, `generate_lead` pozostają w dotychczasowych plikach. Skrypt Phase 20.2 nie emituje ich ponownie; nie zgłasza też `purchase`, który musi wynikać z potwierdzonej transakcji Stripe.

## Instalacja — po pomyślnym wdrożeniu Phase 20.1

1. Poczekaj, aż Phase 20.1 będzie mieć status **Published** w Netlify.
2. Rozpakuj tę paczkę i skopiuj pliki do tych samych ścieżek repozytorium `LilKangoo/LilKangooMedia`:
   - `index.html` (wersja Phase 20.1 + JEDNA linia skryptu)
   - `home.html` (wersja Phase 20.1 + JEDNA linia skryptu)
   - `assets/lkm-v3/phase20-funnel.js` (nowy plik)
3. Wykonaj Commit changes na GitHub. Netlify wdroży aktualizację.
4. Odśwież stronę przez Cmd + Shift + R.

**Uwaga na nadpisanie innych zmian:** index.html i home.html w tej paczce powstały z dokładnych plików Phase 20.1. Jeśli wprowadziłeś do nich jakiekolwiek inne zmiany, wgraj wyłącznie nowy `assets/lkm-v3/phase20-funnel.js`, a w obu bieżących plikach HTML dodaj ręcznie, zaraz przed `</head>`, tylko:

```html
<script defer src="/assets/lkm-v3/phase20-funnel.js"></script>
```

Nie podmieniaj danych Supabase, zmiennych środowiskowych, plików Stripe ani `netlify.toml`.

## Test po wdrożeniu

1. Otwórz LilKangooMedia.com w prywatnym oknie, nie wyrażaj zgody na Analytics. Przejdź katalog → usługa → formularz. Nowe zdarzenia **nie powinny** być wysyłane do GA4.
2. W kolejnym oknie zaakceptuj Analytics. Otwórz kartę usługi, kliknij Quick enquiry, wpisz próbny tekst. W GA4 → Realtime (lub DebugView podczas debugowania) powinny pojawić się zdarzenia pomiarowe.
3. Przejdź konfigurator → szczegóły. Zobacz `lkm_quote_view`, `lkm_request_view`.
4. Nie traktuj `lkm_form_submit_attempt` jako konwersji. Dopiero `generate_lead`, wysłany po sukcesie backendu, oznacza lead. Potwierdź także wpis w `contact_leads` i e-mail w Resend.
5. Na telefonie kliknij pasek „Configure package” / „Ask a question”: `lkm_cta_click` ma właściwe `placement=mobile_sticky`.

Uwaga: zdarzenia GA4 mogą pojawiać się w raportach standardowych z opóźnieniem. Aby raportować parametry `service_id`, `action_type`, `placement`, `form_type`, `package_id`, skonfiguruj **event-scoped custom dimensions** w Administracja → Custom definitions w GA4. Nie dodawaj żadnych danych osobowych jako wymiarów.

## Bezpieczeństwo i prywatność

- Dane osobowe z formularzy (imię, e-mail, telefon, wiadomość) nie są przekazywane do GA4 przez nowy skrypt.
- Tracking uruchamia się tylko gdy `lkm_analytics_consent === 'yes'` i istnieje funkcja `gtag` dostarczana przez dotychczasowy mechanizm zgody.
- Skrypt nie ma dostępu do klucza `service_role` i nie dotyka żadnej tabeli ani płatności.
- Słowo `submit_attempt` nie oznacza pomyślnej wysyłki — zbieramy je wyłącznie do diagnozowania utraty zainteresowanych użytkowników.

## Cofnięcie zmiany

Usuń linię `phase20-funnel.js` z `index.html` i `home.html` albo przywróć poprzedni deploy Netlify. Sam pozostawiony plik JS nie jest wykonywany, jeśli nie jest dołączony w HTML.

## Testy wykonane przed przekazaniem

- `node --check assets/lkm-v3/phase20-funnel.js` — PASS.
- Rzeczywisty Chromium (Playwright): brak wysyłki zdarzeń przed zgodą; select_item, CTA, formularze i etap wyceny po zgodzie; bez danych osobowych; brak duplikatów kroku wyceny — PASS.
- Archiwum ZIP: kontrola integralności i struktury plików — PASS.
- Produkcyjny deploy i rzeczywista widoczność raportów GA4: nie zostały jeszcze potwierdzone.

Kolejny etap: Phase 20.3 — dopracowanie UX katalogu, komunikatów i nawigacji mobilnej bez zmian w cenach i bazie.
