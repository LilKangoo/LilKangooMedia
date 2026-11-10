# LilKangooMedia — Phase 25.3: Conversion & Customer Journey

## WDROŻENIE — tylko jeden ZIP, zero nowego SQL

1. **Supabase / SQL: NIC NIE URUCHAMIAJ.** Liczba nowych plików SQL: **0**. Liczba zmienionych poprzednich plików SQL: **0**. Żadnej wcześniejszej migracji NIE powtarzaj.
2. Rozpakuj **LKM_25_3.zip** i prześlij wszystkie pliki i foldery do głównego katalogu repozytorium GitHub **LilKangoo/LilKangooMedia** na gałęzi **main**, zachowując foldery. Zatwierdź Commit/Push i pozwól Netlify zakończyć build.
3. Nie zmieniaj Stripe, Supabase, e-mail, RLS, domeny ani kluczy API. Nie trzeba ręcznie modyfikować HTML ani JS.
4. Po pomyślnym buildzie przejdziemy do pierwszego prawdziwego case study z Twoich materiałów, potem wykonamy pełny audyt produkcyjny.

## Co zmienia Phase 25.3

- W katalogu usług i na stronie głównej przy kartach pojawia się dodatkowy **Build a quote →**. **Quick enquiry** i **Explore** zostają bez zmian.
- Kliknięcie nowego linku prowadzi w **jednym kliknięciu do ekranu konfiguracji właściwej usługi**, bez otwierania jej galerii. Mechanizm uruchamia pełną nową sesję widoku SPA, by wybrać właściwą usługę nawet jeśli w tej samej karcie przeglądarki wcześniej konfigurowano inną.
- Na stronie SEO usługi dodatkowy link **Build a quote →** pojawia się dopiero, gdy publiczne Supabase potwierdzi aktywność konkretnej usługi. Przy braku danych nadal można otworzyć dotychczasowy katalog.
- Na małych ekranach przy konfiguracji usługi i formularzu zapytania pojawia się jeden dyskretny pasek przy dolnej krawędzi. W konfiguratorze **wyzwala istniejący link Continue to details** — ważne, ponieważ stare dodatki i multi-service bundle zapisują swój stan po kliknięciu właśnie tego linku. W formularzu **nie wysyła wiadomości za użytkownika**: przewija do pierwszego pustego pola wymaganego, a następnie do istniejącego przycisku Submit.
- Nie zmieniono struktury formularzy, cen, pakietów, sesji Stripe, kalendarza, statusów CRM ani operacji finansowych. Brak publicznego lub prywatnego nowego API.
- Nowe kliknięcia Build a quote mogą emitować wyłącznie anonimowe zdarzenie CTA w istniejącym GA4, jeśli użytkownik zgodził się na analitykę (bez e-maila i danych osobowych).
- **Język strony: wyłącznie angielski.** Nie tworzymy wersji polskiej.

## Jak działa wstrzyknięcie assetów

Plik `scripts/build_service_pages.py` (istniejący z Phase 25.2) został zaktualizowany. Podczas standardowego builda Netlify dodaje do wynikowych `index.html` i `home.html` trzy znaczniki: mały skrypt startowy, CSS i skrypt CTA. Robi to idempotentnie — nie dodaje ich dwukrotnie. Dzięki temu ZIP **nie nadpisuje** bieżących stron głównych i nie cofa zmian innych faz.

Pakiet aktualizuje także `assets/lkm-v3/service-seo.mjs`, zachowując kontrolę aktywnej usługi przez publiczny katalog. 14 publicznych `services/*.html` jest dołączonych dla wygody; generator pozostaje źródłem tych stron podczas Netlify build.

## Co powinno działać — lista do Final Audit

1. `https://lilkangoomedia.com/#/services` — przy każdej aktywnej usłudze dostępny przycisk **Build a quote →**, obok dotychczasowego **Quick enquiry**.
2. Wybranie Build a quote na stronie katalogu otwiera właściwe `/#/quote` od razu dla klikniętej usługi; również po wcześniejszym wyborze innej usługi.
3. `/services/website-design.html` — po potwierdzeniu aktywności przez Supabase pojawia się skrót do wyceny.
4. Telefon: `/#/quote` — dolny pasek **Continue to your details →** zachowuje pakiety i dodatki.
5. Telefon: `/#/request` — dolny pasek prowadzi do kolejnego wymaganego pola, nie wysyła sam formularza i nie odpala Stripe.
6. Na desktopie pasek nie zasłania interfejsu; quick enquiries, checkout, rezerwacje, dostarczanie plików, CRM i SEO nadal działają tak samo jak wcześniej.

**Nie używaj danych prawdziwego klienta do testu usuwania.** Końcowy audyt Supabase / Stripe / Netlify / formularzy odbędzie się po zakończeniu roadmapy.

## Testy lokalne

```
node --test tests/phase25_direct_start.test.mjs
node --test tests/phase25_service_seo.test.mjs
python3 -m unittest discover -s tests -p 'test_phase25_3_conversion.py' -v
python3 -m unittest discover -s tests -p 'test_phase25_service_pages.py' -v
python3 tests/test_phase25_3_browser.py
python3 tests/test_phase25_seo_browser.py
```

Testy browserowe używają lokalnego Chromium i symulowanych odpowiedzi Supabase; nie wysyłają zapytań do produkcyjnej bazy.

## Plan po tej paczce

- **Final Content:** pierwsze prawdziwe Case Study (po otrzymaniu materiałów i informacji użytkownika).
- **Final Audit:** end-to-end na produkcji: dane i RLS Supabase, prywatne Storage, Stripe test/live bez zwrotów ze strony, kalendarz, webhooks, formularze, CRM, oferty, autoryzacja klienta, SEO, responsywność, dostępność i wydajność.

Zwroty płatności pozostają **wyłącznie w aplikacji Stripe**.
