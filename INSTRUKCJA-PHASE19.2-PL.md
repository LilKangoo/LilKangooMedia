# LilKangooMedia — Phase 19.2 · Homepage i zdjęcia META

## Instalacja
1. Rozpakuj ZIP.
2. W repozytorium GitHub `LilKangoo/LilKangooMedia` podmień **tylko jeden plik**:
   `assets/lkm-v3/admin-links.js`
3. Wykonaj commit i sprawdź deploy Netlify.
4. Otwórz `https://lilkangoomedia.com/admin-links.html`, wykonaj Cmd+Shift+R.
5. W sekcji Main pages sprawdź pierwszą kartę "LilKangooMedia.com — Homepage": widoczny adres `lilkangoomedia.com` i przycisk Copy link powinien kopiować `https://lilkangoomedia.com/`.
6. Sprawdź zdjęcia na kartach Main pages — powinny pojawić się tam, gdzie jest poprawny URL obrazu. Wypróbuj filtrowanie, Copy link, Copy text i Open.

## Zmiany
- Wyraźny link do strony głównej na pierwszym miejscu w Main pages.
- Zamiast mylącego `/` na karcie Home wyświetlany jest adres `lilkangoomedia.com` (kopiowany URL pozostaje pełny).
- Usunięto warunek zastępujący wszystkie miniatury Main pages symbolami.
- Podczas odczytu metadanych ze statycznych stron używane jest `og:image`, a w razie jego braku `twitter:image` lub `twitter:image:src`; jeśli odczyt się nie uda, pozostaje wcześniej skonfigurowany URL miniatury.
- Zachowano małe karty, przyciski, SEO & more, logikę Supabase i Netlify.

## Ważne
Część stron z trasami `/#/...` korzysta z tej samej strony HTML (SPA). Nie ma odrębnego serwerowego `og:image` dla każdego fragmentu URL. Pokazywana w bibliotece miniatura może więc być obrazem przypisanym do danego widoku, a nie osobnym metadanym Open Graph. Jeśli kilka kart pokazuje taki sam obraz, przyczyną może być wspólna grafika dla strony głównej.

## Testy lokalne
- `node --check assets/lkm-v3/admin-links.js` — PASS
- `node tests/test_phase19.cjs` z istniejącej pełnej paczki po podmianie JS — PASS

Test wdrożenia na Netlify i przeglądarki na żywo należy wykonać po commicie.
