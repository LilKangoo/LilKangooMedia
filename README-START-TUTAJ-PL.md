# LilKangooMedia — Phase 18: cenniki, wybór wielu opcji i Custom quote

Aktualizacja do istniejącej strony LilKangooMedia.com (GitHub → Netlify, Supabase).
**Nie jest to pełna kopia strony.** Zawiera tylko dwie strony wejściowe (dodane odnośniki do nowego modułu), dwa nowe pliki frontendu i migrację SQL.

## Zakres

1. 33 **nowe, uzgodnione pozycje cenowe** w siedmiu usługach wcześniej wycenianych indywidualnie. W tym Social Media Management: **16 postów / €250 miesięcznie, 24 / €450, 48 / €950**.
2. `Custom quote` jako osobna opcja dla każdej aktywnej usługi, bez usuwania oryginalnych cen i pakietów.
3. Klient może **łączyć niezależne pakiety z jednej usługi**. Na przykład jeden pakiet fotografii wydarzenia i jeden filmowania. Nie może naliczyć jednocześnie dwóch alternatywnych długości tej samej usługi.
4. Prośba o indywidualną wycenę także **obok** już wybranego płatnego pakietu.
5. Oddzielne sumy opłat jednorazowych, miesięcznych i rocznych. Dodatkowe pozycje i prośba o custom quote trafiają do istniejącego zgłoszenia.
6. Dotychczasowy konfigurator Phase 13 (`Add more services`) działa nadal. Dla wieloelementowych zgłoszeń nie uruchamiamy automatycznej płatności Stripe — to **zapytanie**, nie z góry potwierdzona rezerwacja.

## Instalacja: kroki

### Krok A — GitHub (można przygotować i sprawdzić bez zmieniania danych w Supabase)

Wgraj z katalogu tej paczki do repozytorium **LilKangoo/LilKangooMedia**, zachowując dokładnie ścieżki:

- `index.html` — dodane jedynie odnośniki do nowego CSS i JS
- `home.html` — to samo co `index.html`
- `assets/lkm-v3/phase18-pricing.js` — nowy moduł
- `assets/lkm-v3/phase18-pricing.css` — nowe style
- `supabase/migrations/20261109_lkm_phase18_pricing_and_custom_quotes.sql` — gotowy plik do osobnego uruchomienia w Supabase
- `docs/PHASE18-PRICING-EN.json` — czytelne źródło uzgodnionych pozycji do audytu

**Nie zastępuj** pozostałych plików: `site.js`, `store.js`, `admin.js`, `service-bundle.js`, `service-detail-v14.js`, `seed.js`, plików mediów, Netlify Functions, konfiguracji Stripe.

Najpierw wykonaj commit na gałęzi testowej i sprawdź Netlify Deploy Preview. Na tym etapie nowe pakiety jeszcze **nie** pojawią się, jeśli migracja bazy nie była uruchomiona.

### Krok B — Supabase SQL Editor (UWAGA: zmienia dane produkcyjne!)

Migracja z pliku `supabase/migrations/20261109_lkm_phase18_pricing_and_custom_quotes.sql` działa na tabeli `public.services` i automatycznie:

- Dodaje 33 pozycje w 7 wskazanych usługach **TYLKO JEŚLI** nie mają one jeszcze opublikowanego żadnego płatnego pakietu; zachowa wcześniej samodzielnie przygotowane płatne pakiety.
- Dołącza `Custom quote` na końcu wszystkich **aktywnych** usług, chyba że dana usługa już zawiera opcję wyceny indywidualnej.
- Pozostawia wszystkie istniejące ceny i opisy pozostałych usług, ich fotografie, cechy, galerie i ustawienia admina bez zmian.

**Przed uruchomieniem:** wyeksportuj kopię zapasową tabeli `public.services` z Supabase (łącznie z `packages` i `addons`). Jeśli Netlify Preview używa tej samej produkcyjnej bazy co `main`, uruchom SQL dopiero w oknie publikacyjnym albo użyj osobnego projektu Supabase staging do testowania. Uruchomienie migracji w bazie produkcyjnej może pokazać nowe pakiety na aktualnej publicznej stronie jeszcze przed mergem.

Po uruchomieniu SQL sprawdź w jego wyniku liczbę opcji i `custom_quotes`. Dla 7 usług powinny się pojawić zgodne ceny. Dla usług istniejących mających już pakiety liczby opcji wzrosną zwykle o 1.

Migracja jest idempotentna przy standardowych danych: drugi raz nie dopisuje tych samych pakietów ani drugiej opcji `Custom quote`. Jeśli dana usługa miała już samodzielnie skonfigurowane płatne pakiety, migracja celowo je **pomija**; można je wtedy porównać i edytować w panelu admina.

### Krok C — weryfikacja i publikacja

1. `/#/service/social-media-management` — dokładnie: Starter 16 postów €250/mies., Business 24 posty €450/mies., Growth 48 postów €950/mies. + Custom quote. **Nie ma obietnicy wideo ani rolek w tych pakietach.**
2. `/#/service/private-events` — pięć wariantów ceny + Custom quote.
3. `/#/quote` — zaznacz fotografię 2h €290 i dodatkowo film 2h €490. Pełna wycena orientacyjna €780; dwa warianty czasu fotografii powinny się wykluczać.
4. `/#/request` — wybór dodatkowego pakietu i wymagania Custom quote widoczne w podsumowaniu.
5. Sprawdź `/#/service/website-design` — warianty od €500, roczna opieka €300/rok i Custom quote.
6. Panel `/admin.html#services`: otwórz usługę, sprawdź pakiety i ceny. Panel admina **już obsługuje** ceny fixed/month/year/quote, dodawanie i edycję opisów oraz cech. Zapis zmienionej ceny przez admin zachowuje istniejące metadane grupowania (`combinable`, `choice_group`).
7. Wyślij testowe zapytanie i potwierdź jego odbiór e-mail/Supabase oraz to, że każdy dodatkowy pakiet znajduje się w `message`.
8. Testuj ekrany mobilne oraz brak problemów w galerii zdjęć i usługach, które miały już pakiety.

## Jak działa wielokrotny wybór?

Dla usług z nowymi pakietami łączonymi UI korzysta z ich metadanych `combinable:true` i `choice_group`. W danej grupie (np. długości fotografowania) można wybrać **jeden wariant**; można natomiast dołączyć pakiet z innej grupy (np. filmowanie). Dla Social Media Management pakiety **nie** są łączone, bo są alternatywnymi abonamentami.

Jeśli dopiszesz przez panel admina **nowy** pakiet, będzie to standardowy wariant jednokrotnego wyboru, chyba że dostanie metadane `combinable` i `choice_group` analogiczne do już dodanych. Nie jest to obecnie osobny checkbox w panelu admina. Za to niezależne, wielokrotnie wybierane **dodatki (`addons`)** nadal można swobodnie tworzyć w adminie.

## Odpowiedzialne ceny i zakresy

Ceny są **propozycjami zaakceptowanymi do wdrożenia** w tej rozmowie. Ceny typu "From" są minimalnymi punktami wejścia. Nie dodaliśmy niezaplanowanych obietnic (liczby zdjęć w wydarzeniach, liczby wizyt w pakietach social, gwarantowanych rolek, reklamowego budżetu itp.). Dokładne zasady poprawek, dojazdu, produkcji treści, terminy dostaw i wydatki reklamowe muszą być ustalone w potwierdzeniu zakresu przed przyjęciem zlecenia.

## Co pozostało nietknięte?

- Stare ceny pakietów: zdjęcia prywatne, wideo prywatne, śluby, wycieczki, Brand Launch, CyprusEye Partner Advertising.
- System płatności Stripe, konfiguracje sekretów, Netlify Functions, uwierzytelnianie i tabela zapytań.
- Oryginalne zdjęcia, galerie, usługi, SEO, blog i istniejące pliki CSS/JS.

## Phase 17 — Google Reviews

To odrębne, otwarte zadanie. Czekamy na eksport recenzji z Google Takeout. Ta paczka nie dotyka opinii ani panelu Reviews.
