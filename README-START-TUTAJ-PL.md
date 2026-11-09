# LilKangooMedia — Phase 7: elastyczne ceny i rozwijana edycja usług

## Co zawiera paczka

**Wyłącznie 4 pliki, które należy zastąpić w repozytorium GitHub:**

1. `assets/lkm-v3/admin.js` — nowy panel edycji w akordeonie + elastyczne pakiety i dodatki.
2. `assets/lkm-v3/admin-unified.css` — układ pełnej szerokości, kolapsowalne karty, responsywne pola.
3. `assets/lkm-v3/site.js` — prezentacja ceny z jednostką, kalkulacja godzin/dni/osób/sztuk i powiadomienie w formularzu.
4. `assets/lkm-v3/site.css` — drobne style sekcji cenowych.

**Nie zastępuj całych folderów `assets` ani `netlify`.** Paczka nie zawiera i nie usuwa żadnych zdjęć, CMS, konfiguracji poczty, Supabase, Stripe ani formularzy Netlify.

Nie wymaga SQL: `services.packages` i `services.addons` są już JSONB. Dodano tylko dodatkowe pola w poszczególnych obiektach pakietów i dodatków. Wszystkie stare pakiety bez pola `pricing_model` pozostają **jednorazowe / fixed** z dotychczasową kwotą. Zachowano istniejące identyfikatory pakietów i metadane (np. `duration_hours`).

## 1. Wdrożenie bez ryzyka

1. Otwórz GitHub → `LilKangoo/LilKangooMedia`.
2. Utwórz gałąź `lkm-pricing-v7` na bazie aktualnej `main`.
3. Zastąp **dokładnie powyższe cztery pliki**, bez usuwania pozostałej zawartości katalogów.
4. Zrób Commit/Push; otwórz Netlify Deploy Preview gałęzi.
5. Sprawdź `/admin.html` → Services & Pricing. Lista ma być pełnej szerokości; `Edit ↓` rozwija, `Collapse ↑` zwija. Przetestuj nowy pakiet w niepublicznej testowej usłudze.
6. Sprawdź stronę publiczną: usługa wyceniana godzinowo pokazuje cenę `/hour`, możliwość wpisania liczby godzin i poprawne szacowanie; oferta miesięczna pokazuje `/month` bez automatycznej płatności.
7. Po akceptacji wykonaj Merge gałęzi do `main`.

**Uwaga:** Netlify Deploy Preview może korzystać z tej samej produkcyjnej bazy Supabase. Wszelkie zapisy w panelu testowym mogą pojawić się natychmiast na stronie live. Testuj zapisy na **osobnej nieaktywnej** usłudze; nie zmieniaj cennika istniejących usług na próbę.

## 2. Typy wyceny — działające w tej wersji

| Model | Co wprowadzić | Jak klient widzi |
|---|---|---|
| Fixed package | Jedna kwota za gotowy pakiet | `€149` |
| Per hour | Cena za godzinę, min., max. i krok | `€150/hour`, np. 3,5 godziny = `€525` |
| Per day | Cena za dzień, min., max. | `€.../day` |
| Per person | Cena za osobę | `€.../person` |
| Per item | Cena za produkt/sztukę | `€.../item` |
| Monthly subscription | Kwota miesięczna, opcjonalna opłata startowa, okres minimalny | `€.../month` + ewentualna opłata jednorazowa |
| Annual subscription | Kwota roczna, opcjonalny koszt uruchomienia | `€.../year` |
| Custom quote | Bez kwoty | `Custom quote` |

Każdy **pakiet** może mieć inny model. Nie trzeba tworzyć nowej usługi tylko dlatego, że jedna oferta jest jednorazowa, a druga abonamentowa. Możesz zmieniać kolejność pakietów przyciskami `↑` i `↓`. Dodatki mogą być jednorazowe, za jednostkę, miesięczne albo roczne. Opcja **Display as “From”** pozwala oznaczyć cenę początkową.

**Kwoty ilustracyjne w tej instrukcji nie są dodawane do bazy.** Aktualne ceny nie zostały automatycznie zmienione. Każdą nową cenę zatwierdzasz w panelu.

## 3. Jak ustawić istniejące rodzaje usług

- **Portrait & Family Photography:** zachowaj obecne pakiety 1h/3h/8h jako stałe ceny za pakiet; opcjonalnie dodaj inny pakiet godzinowy.
- **Personal Videography, Commercial Video & Reels:** jednorazowy film lub stawka godzinowa/dzienna; wybrana opcja zależy od faktycznej umowy.
- **Weddings & Engagements, Celebrations & Events:** stała cena pakietu, cały dzień lub indywidualna wycena.
- **Cyprus Photo Trips i Cyprus Video Trips:** obecne warianty czasowe są pakietami stałymi (np. 5h/8h/10h/20h), nie oznaczaj ich automatycznie jako stawka za godzinę.
- **Product & Brand Photography:** projekt, sztuka, godzina lub indywidualna wycena.
- **Social Media Management, Marketing & Advertising:** miesięczny abonament, opcjonalna opłata startowa lub dodatkowe jednorazowe materiały.
- **Graphic Design & Brand Identity:** jednorazowy projekt, cena od sztuki albo indywidualna wycena.
- **Website Design & Development:** jednorazowa cena budowy strony i oddzielny abonament/utrzymanie roczne (jako osobny pakiet lub dodatek).
- **Business Setup Packages:** obecne pakiety jednorazowe; nie zmieniaj cen bez potwierdzenia.

Nie założyliśmy nowych kwot. Wszystkie modele są dostępne, ale ustawisz je na podstawie własnego cennika.

## 4. Co trafia do zapytania i czego *nie* robimy

Formularz zapytania zapisuje nazwę pakietu, model ceny, liczbę wybranych jednostek i orientacyjną kwotę **w treści wiadomości** przesyłanej przez działający Netlify Function. Dzięki temu zapytanie widoczne w Supabase/Zoho zawiera potrzebne szczegóły bez migracji bazy.

- **Nie włączamy automatycznych subskrypcji Stripe.** Kwoty miesięczne i roczne to oferty wymagające zapytania; docelowo Stripe Billing musi mieć osobne produkty/ceny, onboarding, obsługę webhooków i anulowania.
- **Nie pozwalamy na standardowy Checkout dla pakietów zmiennych/abonamentowych.** Dotychczasowy endpoint jednorazowych płatności nie obsługuje bezpiecznie mnożenia godzin ani cyklicznych opłat.
- Podsumowanie na stronie to **orientacyjna wycena**, a nie zaksięgowana płatność ani potwierdzona rezerwacja.
- Nowe rodzaje cen wymagające progów wolumenowych, rabatów sezonowych, podatków lub osobnego harmonogramu płatności są **kolejnym etapem**, nie zostały zaimplementowane tutaj.

## 5. Testy

- `node --check` — `admin.js`, `site.js`: poprawna składnia.
- `node --test tests/pricing.test.cjs`: 7 testów jednostkowych kalkulacji.
- Test przeglądarkowy w odizolowanym HTML z atrapą Supabase: otwieranie/zamykanie edytora, zapis stawek, prezentacja cen, aktualizowanie liczby godzin, miesięczna kwota + opłata startowa, dane przekazywane w zapytaniu — przeszły.
- Nie testowano jeszcze **rzeczywistego** wdrożenia gałęzi Netlify z Twoją produkcyjną bazą, dlatego konieczny jest Deploy Preview.

## 6. Weryfikacja po wdrożeniu

1. `/admin.html#services` → wszystkie 13 usług obecne.
2. Dowolna usługa → `Edit ↓` i `Collapse ↑` → formularz jest pod daną usługą, nie obok listy.
3. Weryfikacja ofert już istniejących → ich kwoty są identyczne jak przed instalacją.
4. Nieaktywna usługa testowa → pakiet za godzinę, minimalna liczba godzin i krok 0,5.
5. Ta sama usługa → test pakietu miesięcznego z ewentualną opłatą startową.
6. Formularz kontaktowy i zapytań → nadal działa; żadne nowe ustawienia Netlify nie są potrzebne.
7. Portfolio, artykuły i Media Library → bez zmian.

Jeśli w produkcyjnym kodzie były równoległe niezacommitowane poprawki `site.js`/`admin.js`, najpierw porównaj różnice przed `Replace`. Paczka została przygotowana na bazie ostatniej dostępnej wersji projektu, więc nie należy nadpisywać nowszych zmian bez sprawdzenia.
