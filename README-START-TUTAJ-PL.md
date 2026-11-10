# LilKangooMedia — Phase 25.2: English-only Service SEO Pages

## JEDYNE KROKI WDROŻENIA

1. **SUPABASE / SQL: NIC NIE URUCHAMIAJ.** Nowe SQL: **BRAK (0 plików)**. Zmienione istniejące SQL: **BRAK**. Nie uruchamiaj ponownie żadnej wcześniejszej migracji.
2. Rozpakuj **LKM_25_2.zip**. Prześlij WSZYSTKIE pliki i podfoldery z ZIP do głównego katalogu repozytorium GitHub `LilKangoo/LilKangooMedia` (gałąź `main`), zachowując ścieżki, następnie Commit / Push.
3. Netlify samo wykona obecną komendę build w bezpiecznej kolejności:
   - `python3 scripts/build_articles.py` (obecny generator artykułów),
   - `python3 scripts/build_service_pages.py` (NOWY, tylko publiczne strony usług),
   - `python3 scripts/phase20_rebuild_sitemap.py` (zaktualizowana sitemap).
4. Nie zmieniaj Stripe, Supabase ENV, Resend, Cloudflare ani istniejących adresów `/#/service/...`. Nie trzeba edytować kodu ręcznie.

## Co zostało dodane

- **14 publicznych stron HTML:** `/services/index.html` oraz 13 indywidualnych przewodników:
  - `/services/portrait-photography.html`
  - `/services/personal-videography.html`
  - `/services/wedding-photography-video.html`
  - `/services/cyprus-photo-trips.html`
  - `/services/cyprus-video-trips.html`
  - `/services/private-events.html`
  - `/services/product-brand-photography.html`
  - `/services/commercial-video-reels.html`
  - `/services/social-media-management.html`
  - `/services/graphic-design.html`
  - `/services/website-design.html`
  - `/services/brand-launch-packages.html`
  - `/services/marketing-advertising.html`
- Każda strona ma unikalny angielski opis, H1, FAQ, meta description, canonical, Open Graph i JSON-LD `Service`/`BreadcrumbList`. Podstrony nie pokazują wymyślonych cen, ocen, dostępności czy wyników klientów.
- Istniejący katalog SPA i Supabase nadal odpowiadają za aktualne pakiety, ceny i zapytania. Skrypt JS na stronie SEO odczytuje wyłącznie aktywną usługę z PUBLICZNEGO endpointu Supabase. Żadne dane prywatne nie są ujawniane.
- Strony SEO działają statycznie, nawet jeśli JavaScript jest niedostępny. Link kieruje do istniejącego katalogu `/#/service/<slug>`.
- Nowa strona zbiorcza dostępna z linku **Service Guides** w stopce strony głównej. Link zostanie dodany przez generator podczas deployu, jeśli stopka ma standardowy znacznik.
- Generator sitemap dodaje tylko fizycznie istniejące, indeksowalne HTML tych 14 stron. Usługi wycofane ze źródłowego seed mogą zostać usunięte z generowanych stron i sitemap.

## Co zostało zmienione w porównaniu do GitHub

- **Modyfikowane pliki konfiguracyjne:** `netlify.toml`, `scripts/phase20_rebuild_sitemap.py`.
- **Nowe pliki:** `scripts/build_service_pages.py`, `assets/lkm-v3/service-seo.css`, `assets/lkm-v3/service-seo.mjs`, `assets/lkm-v3/service-seo-index.json`, 14 `services/*.html`, README i testy.
- **Nie modyfikujemy** `assets/lkm-v3/seed.js`, żadnego SQL, skryptów admina, klienta, rezerwacji, płatności, Stripe ani formularzy.
- Podczas builda skrypt bezpiecznie dodaje odnośnik do `index.html` i `home.html` w wynikowym katalogu Netlify. W oryginalnym repo te pliki pozostają niezmienione; skrypt powtórzony wielokrotnie nie wstawi drugiego linku.

## Ograniczenia i aktualizacje katalogu

Podstrony powstają z **13 znanych, aktywnych usług w repozytoryjnym `assets/lkm-v3/seed.js`** i unikalnych tekstów umieszczonych w generatorze. Jest to statyczny punkt odniesienia; **dodanie nowej usługi wyłącznie w panelu admina Supabase nie tworzy automatycznie nowej strony SEO**. Aby opublikować dla niej stronę SEO, trzeba rozszerzyć listę treści w generatorze podczas następnej aktualizacji. Jeśli wyłączysz usługę w Supabase, dynamiczny przycisk nie będzie kierować do nieaktywnej pozycji; trwałe wycofanie strony z sitemap wymaga również aktualizacji seed/generatora. Ostateczną zgodność stron z katalogiem produkcyjnym sprawdzimy w finalnym audycie.

Zdjęcia okładkowe pobierane są z `cover_url` usługi w repozytoryjnym seed. Jeśli plik został usunięty lub zmienił adres, należy odświeżyć przypisanie; nie tworzymy fałszywych zdjęć.

## Kontrola po wdrożeniu — na Final Audit

- `/services/index.html` otwiera zestawienie 13 usług.
- 13 indywidualnych stron mają odpowiednie adresy i unikalne title/canonical.
- Service Guides w stopce strony głównej; linki do `/portfolio.html`, `/#/contact` i `/#/service/slug` działają.
- `https://lilkangoomedia.com/sitemap.xml` zawiera 14 `/services/` URL.
- Żadna strona nie nadpisuje formularzy, płatności czy paneli administracyjnych.
- Zmiana pakietów w Supabase aktualizuje panel dynamicznych pakietów, ale nie wpisuje starych kwot w statyczne SEO.
- Test rzeczywistego indeksowania w Google Search Console po finalnym audycie (sama publikacja sitemap nie gwarantuje indeksowania).

## Testy lokalne (opcjonalne)

```
python3 -m unittest discover -s tests -p test_phase25_service_pages.py -v
node --test tests/phase25_service_seo.test.mjs
python3 tests/test_phase25_seo_browser.py
```

Testy uruchomiono lokalnie bez zapisu do produkcyjnej bazy. Pełne sprawdzenie na Netlify/Supabase/GSC pozostaje na końcu roadmapy.

## Co dalej

- **Phase 25.3:** Conversion & Journey Optimisation (CTA, mniej ekranów, poprawa ścieżki zakupowej).
- **Final Content:** pierwsze prawdziwe Case Study na podstawie przesłanych przez Ciebie materiałów.
- **Final Audit:** sprawdzenie całego systemu (SEO, RLS, Storage, rezerwacje, Stripe test/live, formularze, UX, CRM).
- Strona pozostaje **tylko po angielsku**. Phase 25.1 PL/EN została pominięta na Twoją decyzję.
- **Zwroty tylko w Stripe App.** Żadna aktualizacja strony nie umożliwia automatycznych refundów.
