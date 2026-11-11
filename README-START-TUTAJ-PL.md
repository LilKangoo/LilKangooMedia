# LilKangooMedia — Phase 26.1: Command Center W GŁÓWNYM PANELU ADMIN

**Poprawka z 11 listopada 2026 r.** Użytkownik zgłosił, że ciemny Command Center działał tylko pod `/admin-studio.html`, natomiast `/admin.html` nadal otwierał stary panel. Ta aktualizacja **NAPRAWIA DOKŁADNIE TEN PROBLEM**.

## NOWY SQL: BRAK

**Nie uruchamiaj żadnego SQL.** Wszystkie tabele i RPC Phase 26 z poprzedniej paczki pozostają bez zmian. Nie uruchamiaj ponownie wcześniejszych migracji ani plików Eléa Golf Club.

## Co teraz robią adresy?

- `https://lilkangoomedia.com/admin.html` — **GŁÓWNY** panel Command Center z ciemnym motywem, menu treści i narzędzi firmowych.
- `https://lilkangoomedia.com/admin-studio.html` — przekierowuje do **głównego** `/admin.html`; istniejące zakładki/odsyłacze nadal działają.
- `https://lilkangoomedia.com/admin-legacy.html` — zapasowy **klasyczny panel**, z nienaruszoną funkcjonalnością. Nie jest już domyślnym Admin.

## Instalacja — potrzebujesz wyłącznie GitHub / Netlify

1. Rozpakuj `LKM_26_1_Admin.zip`.
2. Wgraj **wszystkie pliki z paczki** do **katalogu głównego** repozytorium `LilKangoo/LilKangooMedia`, zachowując ścieżki. Zamień pliki o identycznych nazwach. **Nie usuwaj** innych plików projektu.
3. Zrób `Commit changes` na branchu, który Netlify wdraża jako produkcyjny.
4. Sprawdź, czy Netlify pokazuje **Published** dla tego commita. Nie trzeba nic konfigurować w Supabase ani Stripe.
5. Otwórz `https://lilkangoomedia.com/admin.html` (w pierwszej kolejności bez żadnych parametrów `?utm_source=...`).
6. Jeśli nadal widać starą wersję, zrób twarde odświeżenie na Macu: **Shift + Command + R**, ewentualnie otwórz w prywatnym oknie. Sprawdź, czy Netlify naprawdę opublikował nowy `admin.html`.

## Jak wygląda jeden Admin?

W jednym ciemnym menu masz:

- **Overview** — dashboard Command Center z prawdziwymi licznikami Supabase.
- **Master Media Library** — zdjęcia, filmy, wyszukiwanie, przypisania do wielu kolekcji / projektów / usług.
- **Projects & Stories** — projekty, historie współpracy oraz niezależna widoczność karty galerii i Case Study.
- **Portfolio Collections** — tematyczne kolekcje fotografii i wideo.
- **Articles & SEO**, **Customer Reviews**, **Links Library**.
- **Services & Pricing**, **Enquiries & Bookings**, **Sales CRM**, **Quotes & Proposals**, **Availability Calendar**, **Sales Reports**.

**Ważny szczegół techniczny:** zakładki Portfolio Studio są natywną częścią Command Center. Dla dotychczasowych, złożonych narzędzi biznesowych (CRM, wyceny, kalendarz, itp.) nowy panel wyświetla **ich istniejące strony w tej samej bezpiecznej ramce administracyjnej (same-origin iframe)**. Pozwala to mieć jedno menu i jeden adres Admin, zachowując ich sprawdzone funkcje, zamiast ryzykownie przepisywać płatności i formularze. Wygląd starszych formularzy może miejscami zachować elementy poprzedniego wzornictwa — otrzymują jednak ciemne tło oraz nowe otoczenie. To nie jest jeszcze całkowite przepisanie każdego modułu na identyczny system komponentów.

W interfejsie: **zieleń** = publikacja/sukces, **złoto** = wyróżnienia, **czerwień** = ukrywanie/ostrzeżenia. Cały interfejs pozostaje **po angielsku**.

## Pliki w paczce

```text
admin.html                                  [ZMODYFIKOWANY — nowy GŁÓWNY Admin]
admin-studio.html                           [ZMODYFIKOWANY — przekierowanie do Admin]
admin-legacy.html                           [NOWY — zabezpieczenie / stary panel]
assets/lkm-v3/studio.mjs                    [ZMODYFIKOWANY — wspólne menu i trasy]
assets/lkm-v3/studio.css                    [ZMODYFIKOWANY — panel i ramki narzędzi]
assets/lkm-v3/studio-embedded.css           [NOWY — ciemny wygląd starych narzędzi]
README-START-TUTAJ-PL.md                    [INSTRUKCJA]
```

**Nie zmieniono**: SQL, RLS, Storage, `store.js`, rezerwacji, Stripe, plików publicznej strony, danych CRM, plików klientów. Zwroty tylko w Stripe.

## Testy i co należy sprawdzić na produkcji

**Testy lokalne na mockowanym Supabase:** 8 scenariuszy poprzedniego Studio + 6 nowych scenariuszy integracji Admin (wszystkie zaliczone); `node --check studio.mjs` PASS. Nie wykonano zapisu do produkcyjnego Supabase ani płatności.

Test końcowy po deployu:

1. `/admin.html` powinien wyświetlać ciemny **Command Center** zamiast starego menu.
2. Kliknięcie **Services & Pricing** powinno pokazać dotychczasowe usługi *wewnątrz* nowej strony Admin.
3. Kliknięcie **Media Library** powinno przywrócić natywny ciemny edytor zdjęć i filmów.
4. **CRM → Quotes → Calendar** powinny otwierać istniejące narzędzia w tym samym Command Center; nie wykonuj prawdziwej płatności w teście.
5. **Projects & Stories** powinno zachować Eléa Golf Club i ustawienie ukrywania drugiej karty galerii.
6. `/admin-studio.html` powinien przenieść do `/admin.html`.
7. W razie problemu wejdź na `/admin-legacy.html` i użyj oryginalnego panelu; niczego nie usuwamy z bazy.

**Dwa ograniczenia:** pierwsze wejście do starszej zakładki może na moment pokazać jej oryginalny wygląd przed nałożeniem ciemnego motywu; przy przejściu do innej zakładki niezapisany formularz w starszym narzędziu może zostać zamknięty — **zapisz przed zmianą zakładki**.

## Co zrobić, jeśli nadal nie widać zmian?

- Sprawdź w produkcyjnym repo, czy zawartość `admin.html` zawiera **`id="lkmStudio"`**. Jeśli nadal zawiera `id="adminRoot"`, to nowy plik nie został wdrożony.
- Sprawdź, czy nowe pliki `assets/lkm-v3/studio.mjs` i `studio-embedded.css` znajdują się w repozytorium **w tym samym katalogu**, co `studio.css`.
- Otwórz bezpośrednio `/admin.html`, nie stary link z cache; twardo odśwież.
- Jeśli otwiera się czarny panel z błędem danych, sprawdź, czy wcześniejsza migracja Phase 26 została poprawnie wykonana. **Nie uruchamiaj jej ponownie bez analizy konkretnego komunikatu błędu.**

**Stan po wygenerowaniu:** kod i testy lokalne gotowe; wdrożenie w GitHub/Netlify jest po stronie użytkownika. Nie twierdzimy, że produkcja została przetestowana end-to-end.
