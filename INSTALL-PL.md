# LilKangooMedia — formularz na Netlify (naprawa /api/enquiry)

## Stan

Nowa strona wysyła POST do `/api/enquiry`. Obecne `/functions/api/enquiry.js` to handler Cloudflare Pages; Netlify nie publikuje go jako funkcji. Dodatkowo formularz do wysyłki wymaga skonfigurowania serwerowego dostępu do Supabase i usługi Resend. Ta mała paczka nie zmienia HTML, katalogu zdjęć, panelu, bazy ani Stripe.

## Wgranie (NAJPIERW gałąź testowa)

1. Rozpakuj ZIP i skopiuj tylko `netlify/functions/enquiry.mjs` do root repozytorium, zachowując strukturę katalogów (GitHub > `netlify` > `functions` > `enquiry.mjs`). Nie umieszczaj jej w `assets` i nie zastępuj folderów `assets`/`functions`.
2. Commit, push, sprawdź deploy Netlify. Nowa funkcja powinna być widoczna w Netlify > Logs > Functions.
3. Otwórz `https://TWOJ-TEST-DEPLOY.netlify.app/api/enquiry` w przeglądarce. Oczekiwany wynik: `405` i JSON `Method not allowed.`. `404` oznacza, że funkcja nie została opublikowana lub Netlify ma inne ustawienia katalogu Functions.

## Zmienne środowiskowe (Netlify > Project configuration > Environment variables)

Dodaj bezpiecznie w UI (scope Functions/all scopes):

- `SUPABASE_URL` = URL projektu LilKangooMedia, np. `https://...supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = klucz serwerowy projektu Supabase (nowy `sb_secret_...` lub legacy service_role JWT). **NIGDY** do kodu GitHub/frontend.
- `RESEND_API_KEY` = klucz usługi Resend `re_...`
- `FROM_EMAIL` = np. `LilKangooMedia <website@lilkangoomedia.com>` **po weryfikacji domeny w Resend**
- `CONTACT_EMAIL` = `photo@lilkangoomedia.com`
- `TURNSTILE_SECRET` = opcjonalny klucz serwerowy Turnstile; **ustaw go dopiero razem z prawidłowym publicznym TURNSTILE_SITE_KEY** w `lkm-config.js`, inaczej wszystkie przesłania będą odrzucane.

Nie wklejaj tych kluczy do rozmowy, repo, `lkm-config.js`, ani `netlify.toml`. Po ustawieniu zmiennych uruchom nowy deployment; Netlify odczytuje konfigurację środowiska z chwili publikacji.

## Test końcowy

1. Wyślij formularz ze strony testowej (prawdziwym, własnym adresem e-mail, wiadomość `TEST LKM`).
2. Sprawdź **Supabase > Table editor > contact_leads**: powinien pojawić się nowy wpis.
3. Sprawdź odebrany e-mail na `photo@lilkangoomedia.com` oraz status w Resend > Emails.
4. Jeśli nie działa, sprawdź Netlify > Logs > Functions > enquiry; 503 to najczęściej brak ustawionych kluczy, 502 z `saved: true` to zapisany lead, ale problem powiadomienia.
5. Dopiero po teście na preview, merge do `main`.

## Uwaga o Stripe

Ta paczka naprawia tylko formularz `POST /api/enquiry`. `/api/checkout` i webhook Stripe nadal wymagają osobnej migracji na Netlify, zanim można włączyć płatności.

## Ochrona przed spamem

Aktualna wersja używa honeypot i podstawowej walidacji, ale nie ma skutecznego ograniczenia liczby żądań. Przed większym ruchem włącz Cloudflare Turnstile (site key w frontend + secret w Netlify), monitoruj błędy i dodaj rate limiting po stronie serwera.
