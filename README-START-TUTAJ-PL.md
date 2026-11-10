# LilKangooMedia — Portfolio + Stories Behind the Work

## Co zrobiliśmy

Wszystkie galerie i prawdziwe historie realizacji są dostępne w **jednym miejscu: `/portfolio.html`**.

- Na stronie Portfolio pojawiają się dwie eleganckie sekcje: **Visual galleries** oraz **Stories behind the work**.
- Pod istniejącymi galeriami widać zajawkę opublikowanych historii z przyciskiem **View all stories**.
- Zakładka **Stories behind the work**: `/portfolio.html#/stories` — wszystkie opublikowane Case Studies, pobierane z Supabase.
- Czytanie Case Study w samym Portfolio: `/portfolio.html#/story/elea-golf-club`. Nie przeładowuje strony przy zmianie zakładek.
- Na stronie galerii danej realizacji pojawia się **Read the project story**, jeśli Case Study jest opublikowane.
- Na stronie historii są: cele, sposób pracy, wyniki wyłącznie faktycznie wpisane w CMS, dostarczone materiały, **filmy przed fotografiami**, link do pełnej galerii i zapytania.
- Eléa Golf Club zachowuje kolejność dwóch filmów: pełny przelot nad 18 dołkami, następnie Short. Filmy uruchamiają się **dopiero po kliknięciu** (YouTube nocookie).
- Linki z homepage, stron B2B i sekcji powiązanych projektów prowadzą teraz do Portfolio Stories. Podgląd historii w edytorze administracyjnym również otwiera właściwy adres w Portfolio.
- Istniejący `/case-studies.html` i jego adresy `#/slug` pozostają działające; to zgodność wsteczna dla starych linków, a nie osobna pozycja w nowej nawigacji.

## Instalacja

1. Rozpakuj `LKM_Portfolio_Stories.zip`.
2. Otwórz repozytorium GitHub `LilKangoo/LilKangooMedia`.
3. Wgraj zawartość ZIP **do katalogu głównego repozytorium**, zachowując ścieżki i zastępując pliki o tych samych nazwach. Nie usuwaj innych plików.
4. Commit / Push do gałęzi podpiętej do Netlify. Po ukończeniu deploya otwórz:
   - Portfolio: `https://lilkangoomedia.com/portfolio.html`
   - Stories: `https://lilkangoomedia.com/portfolio.html#/stories`
   - Eléa: `https://lilkangoomedia.com/portfolio.html#/story/elea-golf-club`
5. Na telefonie sprawdź nawigację, kliknij Case Study, uruchom filmy i przejdź do galerii zdjęć.

## SQL / Supabase

- **NOWY SQL: BRAK.**
- **Nie uruchamiaj ponownie żadnej wcześniejszej migracji ani importu Eléa Golf Club.**
- Historie pojawiają się automatycznie wyłącznie wtedy, gdy `lkm_case_studies.is_published = true` i powiązana galeria ma `visibility = 'public'`.
- Zdjęcia i filmy są pobierane z tych samych rekordów CMS co wcześniej. Jeżeli Eléa ma już przypisane zdjęcia w Supabase i ich adresy zostały wdrożone do Netlify, będą widoczne w nowym układzie.

## Jak będzie działać nowa sekcja

```
Portfolio (/portfolio.html)
  ├── Visual galleries (fotografia, wideo, projekty)
  │     └── Jedna galeria → [Read the project story]
  └── Stories behind the work (Case Studies)
        └── Eléa Golf Club /portfolio.html#/story/elea-golf-club
              ├── Cel i przebieg realizacji
              ├── Dostarczone materiały i potwierdzone rezultaty
              ├── Filmy (2) – do odtworzenia po kliknięciu
              ├── Zdjęcia (do 12 na stronie, reszta w galerii)
              └── CTA – Explore services / Start a project
```

## Pliki aktualizacji

- `portfolio.html` — ładuje nową integrację na stronie portfolio.
- `assets/lkm-v3/portfolio-stories.mjs` — wyświetla opublikowane Case Studies z Supabase, nawigację, link między galerią i historią, szczegóły, film i fotografie.
- `assets/lkm-v3/portfolio-stories.css` — spójny, responsywny wygląd.
- `index.html`, `home.html` — nowy link do Stories wewnątrz Portfolio.
- `business-brands.html`, `business-retail.html`, `business-hotels.html`, `business-restaurants.html`, `business-solutions.html` — linki z ofert B2B prowadzą do sekcji w Portfolio.
- `assets/lkm-v3/phase22-related-work.js` — z kart realizacji pod usługami link do historii otwiera stronę Portfolio.
- `admin-case-studies.html`, `assets/lkm-v3/case-studies-admin.mjs` — podgląd i link z edytora prowadzą do historii w Portfolio; edytor danych bez zmian.
- `tests/` — testy kodu i lokalne testy przeglądarkowe (nie wymagane do działania witryny).

## Co NIE zmienia się

- Nie zmieniamy CMS admin, bazy danych, Supabase Auth/RLS, cen, ofert, Stripe, formularzy, kalendarza ani panelu klienta.
- Nie usuwamy dotychczasowych galerii, zdjęć ani filmów.
- Nie zmieniamy języka strony — zostaje angielski.
- W razie niedostępności Case Studies pozostałe galerie dalej mogą działać.

## Sprawdzone lokalnie

- 6/6 testów statycznych.
- 7/7 scenariuszy przeglądarki Chromium: dostępność kart, przegląd historii, przechodzenie bez przeładowania, kolejność film→zdjęcia, odtwarzanie po kliknięciu, galeria↔historia, ukrywanie szkiców, błędy API i brak poziomego przewijania na telefonie.
- **To nie jest weryfikacja live Supabase lub deploymentu Netlify.** Prawdziwe sprawdzenie na domenie następuje po Twoim pushu.

## Odwrócenie aktualizacji (gdyby była potrzeba)

W GitHub można przywrócić poprzednie wersje zmienionych plików HTML i `phase22-related-work.js` z historii commitów. Nowe `portfolio-stories.mjs` i `portfolio-stories.css` można wtedy usunąć. Baza danych pozostanie nietknięta.
