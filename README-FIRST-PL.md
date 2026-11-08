# LilKangooMedia — etap 3: jeden panel admin + biblioteka zdjęć

**Ważne:** ta paczka nie jest jeszcze zainstalowana na stronie. Najpierw sprawdzamy ją na gałęzi testowej GitHub i w Netlify Deploy Preview. Nie wgrywaj ZIP-a jako pojedynczego pliku do repozytorium — **rozpakuj go i skopiuj zawartość**.

## Co otrzymujesz

- W `/admin.html` jedno lewe menu: **Services & pricing**, **Enquiries & bookings**, **Articles & SEO**, **Portfolio & galleries**, **Media library**.
- Dotychczasowe logowanie przez Supabase. Nie trzeba tworzyć nowego użytkownika, bazy, API key ani hasła.
- **Media Library**: pobiera wykaz wszystkich obrazów z publicznego `assets/images/` w repozytorium GitHub `LilKangoo/LilKangooMedia` (gałąź `main`). Widać miniatury, wyszukiwarkę, sugerowane kategorie i strony wyników.
- Możliwość wybrania istniejącej galerii i dodania pojedynczego zdjęcia jako **REVIEW** (ukryte). Nie kopiuje pliku do Supabase Storage i nie usuwa oryginału.
- `/cms.html` nadal jest dostępny jako awaryjny osobny panel.

## Krok po kroku — GitHub + Netlify

1. Zapisz, który deployment Netlify działał ostatnio prawidłowo; w razie problemu będziemy mogli go przywrócić.
2. W GitHub `LilKangoo/LilKangooMedia` utwórz nową gałąź z `main`, np. **`lkm-phase3-test`**.
3. Rozpakuj ZIP i skopiuj do katalogu głównego repozytorium **tylko następujące pliki**, zachowując ich dokładne ścieżki:

   | Plik | Operacja |
   |---|---|
   | `admin.html` | REPLACE |
   | `assets/lkm-v3/admin.js` | REPLACE (tylko ten plik) |
   | `assets/lkm-v3/cms.js` | REPLACE (tylko ten plik) |
   | `assets/lkm-v3/admin-unified.css` | ADD |
   | `netlify/functions/media-catalog.mjs` | ADD |

4. **Nie zastępuj całego `assets/`, `assets/lkm-v3/` ani `netlify/`.** Pozostałe zdjęcia, `site.css`, `site.js`, `seed.js`, `store.js`, logo i **działający `netlify/functions/enquiry.mjs`** muszą zostać na miejscu. Nie zmieniaj `lkm-config.js`.
5. Commit / Push do gałęzi `lkm-phase3-test`. Otwórz link **Deploy Preview** w Netlify.
6. W podglądzie otwórz `/admin.html`, zaloguj się **tym samym kontem Supabase**, a potem przetestuj kolejno 5 zakładek z lewego menu.
7. W Media Library sprawdź liczbę znalezionych plików, wyszukiwanie i miniatury. Jeśli pojawi się błąd GitHub API, zajrzyj do **Netlify → Functions → Logs** funkcji `media-catalog`.
8. W **Portfolio & galleries** utwórz galerię z widocznością **Review**. W Media Library wybierz ją z rozwijanej listy i kliknij **Add to gallery (review)** na jednej fotografii. Wróć do galerii i sprawdź, czy zdjęcie zostało zapisane jako niewidoczne publicznie.
9. Sprawdź istniejące usługi i zapytania w adminie. Wyślij testowy formularz na stronie i potwierdź e-mail w Zoho. Dopiero wtedy połącz gałąź testową z `main`.

## Czego ta paczka NIE robi

- Nie przypisuje automatycznie każdego pliku do właściwego projektu / klienta. Kategorie z nazw plików są **propozycjami do weryfikacji**, nie potwierdzonym opisem zawartości zdjęcia.
- Nie publikuje automatycznie żadnych dawnych zdjęć, nawet jeśli były już publiczne. Zdjęcia dodawane przez panel mają status **Review**.
- Nie importuje dawnych artykułów do `blog_posts` ani nie zmienia ich adresów HTML, SEO, analityki i AdSense. To oddzielny kolejny etap.
- Nie uruchamia Stripe; działający formularz e-mail pozostaje bez zmian.
- Nie zabezpiecza plików z istniejącego publicznego katalogu `assets/images/` przed bezpośrednim dostępem: one są już w publicznym repozytorium i na stronie.

**Uwaga techniczna:** wykaz zdjęć pochodzi z GitHub Trees API i jest buforowany przez Netlify. Jeśli GitHub ograniczy dostęp lub zwróci niekompletną listę, panel pokaże ostrzeżenie albo błąd, a nie będzie twierdził, że zdjęć nie ma. W takim przypadku następnym rozwiązaniem będzie generowanie statycznego manifestu podczas buildu Netlify z całego repozytorium.

## Kontrola przed publikacją

- [ ] Główna strona, style i logo działają.
- [ ] Logowanie, wylogowywanie i edycja usług działają.
- [ ] Widać zapytania klientów.
- [ ] Blog i galerie otwierają się wewnątrz `/admin.html`.
- [ ] Media Library pokazuje obrazy.
- [ ] Dodana fotografia jest oznaczona jako Review i niewidoczna publicznie.
- [ ] Test formularza nadal daje wpis w Supabase i powiadomienie Zoho.
- [ ] Nie utracono żadnego katalogu `assets` ani dawnych podstron.
