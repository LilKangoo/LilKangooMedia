# LilKangooMedia — Phase 22.1 · Service Portfolio & Real Projects

## Instalacja: JEDNA PACZKA, bez edytowania kodu

Ta paczka została przygotowana na podstawie GitHub main z wgranym Phase 21.4B.
Poczekaj na zakończenie wdrażania Phase 21.4B, następnie:

1. Rozpakuj `LKM_Phase22_1_FULL.zip`.
2. Wgraj pliki do katalogu głównego repozytorium `LilKangoo/LilKangooMedia`, **zachowując foldery**.
3. Zastąp istniejące `index.html`, `home.html` i `admin.html` plikami z tej paczki.
4. Dodaj 3 nowe pliki w `assets/lkm-v3/`.
5. Zatwierdź GitHub **Commit changes** i sprawdź Netlify **Published**.

Nie trzeba uruchamiać SQL ani dodawać zmiennych środowiskowych. Niczego nie zmieniaj ręcznie w kodzie.

## Jak przypisać prawdziwe realizacje do usług

1. Zaloguj się do `https://lilkangoomedia.com/admin.html#galleries`.
2. Otwórz istniejącą galerię lub utwórz nową. W formularzu galerii wybierz **Related service**.
3. Ustaw widoczność galerii na **Public** i kliknij **Save gallery**.
4. Upewnij się, że co najmniej jedno zdjęcie w galerii jest **Public**. Alternatywnie dodaj publiczny film YouTube do tej galerii przez Video Manager.
5. Otwórz podstronę powiązanej usługi (w panelu galerii pojawia się link do podglądu). W sekcji „See this service in action” pojawią się projekty przypisane do usługi.

Jeśli galeria jest ukryta, jej media nie są publiczne lub nie wskazano „Related service”, nie będzie wyświetlana jako realizacja tej usługi. Wtedy pozostanie neutralny link do całego portfolio. Maksymalnie 4 projekty na stronę usługi.

## Co zmienia aktualizacja

- Dodaje sekcję z opublikowanymi projektami zgodnymi z `portfolio_galleries.related_service_slug`.
- Wyświetla obrazy tylko z publicznych zdjęć; dla galerii bez zdjęć może pokazać miniaturę jej publicznego filmu.
- Każda karta prowadzi do właściwej galerii na `/portfolio.html#/gallery/<slug>`.
- Na każdej stronie usługi dodaje link do publicznych opinii klientów, **bez zgadywania**, że opinia dotyczy właśnie tej usługi.
- W CMS wyjaśnia funkcję `Related service` i dodaje podgląd przypisanej usługi.
- Ogranicza liczbę projektów i ładuje miniatury z `loading=lazy`.
- Chroni przed wstrzyknięciem HTML przez tytuł/opis galerii (DOM/textContent).

## Bezpieczeństwo i zgodność

- Nie zmienia SQL, rezerwacji, blokad godzinowych, Supabase RLS, Stripe, webhooków, cen ani zwrotów.
- Nie tworzy fikcyjnych realizacji ani opinii.
- Nie wyświetla galerii oznaczonych `private` lub `review`.
- Publiczne dane pobierane są z obecnego Supabase przez obecny anonimowy klucz i aktualne RLS.
- Nie wymaga podawania klucza `service_role` w przeglądarce.
- Jeśli baza chwilowo nie działa, klient nadal widzi zwykły link do portfolio.

## Testy wykonane lokalnie

- `node --check` obu skryptów JS: PASS.
- Chromium Desktop 1280×900 i mobile 375×812: PASS.
- Galeria dopasowana do usługi, właściwy link, tylko publiczne media, sanitizacja opisu, brak duplikatu sekcji, przerenderowanie SPA, brak wyników i wskazówka w panelu: PASS.
- Struktura ZIP `unzip -t`: PASS.

**Uwaga:** nie był wykonywany test z produkcyjną bazą danych. Wyświetlane galerie zależą od rzeczywistych publicznych danych i przypisań skonfigurowanych w CMS. Phase 22.2 obejmie dalszy rozwój sekcji opinii i wiarygodności.
