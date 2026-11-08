# LilKangooMedia — Photo Manager Phase 6

Aktualizacja do istniejącej strony `lilkangoomedia.com` (Netlify + Supabase). **Nie jest to pełny projekt.** Kopiuj tylko wskazane pliki, w dokładnie te same ścieżki. Pozostałe pliki strony i zdjęcia pozostają bez zmian.

## 1. Zapisz kopię danych, zanim cokolwiek zmienisz

W Supabase → Table Editor wyeksportuj/utwórz kopię tabel `public.portfolio_images` i `public.portfolio_galleries`. Nie usuwaj żadnej bazy i nie uruchamiaj migracji CMS Phase 1 ponownie.

## 2. Supabase SQL — wykonaj PRZED aktualizacją plików

Supabase → **SQL Editor → New query** → wklej całą zawartość pliku:

`supabase/migrations/20261109_lkm_media_management.sql`

Kliknij **Run**. Skrypt jest addytywny. Dodaje metadane plików do `portfolio_images` oraz tabelę `lkm_media_hidden` z RLS. Niczego nie usuwa.

Weryfikacja:

```sql
SELECT COUNT(*) AS galleries FROM public.portfolio_galleries;
SELECT COUNT(*) AS photos FROM public.portfolio_images;
SELECT COUNT(*) AS removed_items FROM public.lkm_media_hidden;
```

## 3. GitHub i Netlify — tylko sześć plików + sw.js

Zaktualizuj gałąź TESTOWĄ opartą na aktualnej `main`, np. `lkm-photo-manager-v6`, przez MERGE poniższych plików:

| Ścieżka w repozytorium | Czynność |
|---|---|
| `assets/lkm-v3/cms.js` | Replace **tylko ten plik** |
| `assets/lkm-v3/cms.css` | Replace **tylko ten plik** |
| `assets/lkm-v3/cms-public.js` | Replace **tylko ten plik** |
| `assets/lkm-v3/cms-public.css` | Replace **tylko ten plik** |
| `assets/lkm-v3/admin.js` | Replace **tylko ten plik** |
| `assets/lkm-v3/admin-unified.css` | Replace **tylko ten plik** |
| `sw.js` | Replace — wyłącza bezgraniczne cache'owanie zdjęć i czyści dawną pamięć podręczną |

**Nie zastępuj całego `assets`, `netlify`, `index.html`, `home.html`, `admin.html`, `lkm-config.js`.** Nie zmieniaj działającego `netlify/functions/enquiry.mjs`, konfiguracji Resend, DNS ani Google Analytics.

Netlify → Deploys → otwórz **Deploy Preview** dla gałęzi. Przetestuj wyświetlanie nowego interfejsu. Po zaakceptowaniu Merge do `main`.

**UWAGA:** Deploy Preview wykorzystuje to samo produkcyjne Supabase, jeśli `lkm-config.js` wskazuje ten sam projekt. Każda operacja edycji, publikacji, przesunięcia lub usunięcia przypisania z preview zmienia również dane produkcyjne. Najpierw obejrzyj interfejs; zapisy testuj tylko na specjalnie przygotowanym, niepublicznym albumie albo w osobnym projekcie testowym Supabase.

## 4. Co nowego

### Publiczne portfolio
- Kliknięcie zdjęcia otwiera pełnoekranowy podgląd.
- Strzałki lewo/prawo, klawisze **← / →**, **Esc**, przewijanie gestem na telefonie.
- Licznik zdjęć i podpis, zamknięcie krzyżykiem lub kliknięciem tła.

### Admin → Portfolio & Galleries
- Miniatury fotografii w wybranej galerii, edycja przez kliknięcie.
- Zaznacz wiele / zaznacz wszystkie; **Remove from gallery**, **Publish selected**, **Set to review**.
- Wybierz zdjęcie okładki przez **Set cover**.
- **Choose from Media Library** z automatycznie wybraną aktualną galerią.
- **Upload photos** pozwala dodać 1–15 nowych fotografii na raz (do 8 MB na plik).
- Szczegółowe adresy URL pozostają w sekcji Advanced i nie są potrzebne do zwykłej pracy.

### Admin → Media Library
- Pliki istniejące na GitHubie + nowe pliki przesłane do Supabase Storage.
- Wyszukiwanie, kategorie, wybór docelowej galerii, oznaczenie aktualnych galerii przy każdej miniaturze.
- Zaznaczanie wielu zdjęć; jednorazowe przypisanie wybranych do galerii. Zdjęcie można umieścić w kilku galeriach — nie usuwa to wcześniejszych przypisań.
- Etykiety w KB/MB na podstawie metadanych GitHuba lub przesłanego pliku oraz rzeczywiste wymiary w pikselach po wczytaniu miniatury.
- **Automatyczne doładowywanie przy przewijaniu** po 48 zdjęć. Dostępny także przycisk Load more.
- **Remove** oznacza odpięcie od galerii + odwracalne ukrycie z Media Library, **nie trwałe usunięcie pliku**. Można zaznaczyć Show removed photos i przywrócić Restore. Nie kasuje to innych odniesień do zdjęcia w HTML, usługach i artykułach.

### Admin → Services & pricing
- Miniatury zdjęcia głównego i galerii zamiast samego pola URL.
- Wybór z **Portfolio galleries** albo z istniejących plików GitHub w **Media Library**.
- Usuwanie zdjęć z usługi przez Remove × (wymaga Save changes).
- Dodawanie nowego zdjęcia bezpośrednio do Supabase Storage. Zapisane zdjęcie pojawi się również w Media Library.

### Poprawka pamięci podręcznej przeglądarki
Dawny `sw.js` zapisywał w Cache Storage praktycznie wszystkie żądania sieciowe, w tym tysiące zdjęć. Powodowało to widoczny w konsoli błąd `QuotaExceededError`. Nowa wersja SW usuwa jego stare cache i **nie przechwytuje żądań zdjęć, logowania ani API**. Offline cache strony z dawnego Mobirise przestaje być dostępny; jest to celowe przy działającym CMS.

## 5. Co sprawdzić po wdrożeniu

1. `https://lilkangoomedia.com/portfolio.html` → otwórz galerię → kliknij zdjęcie → naciśnij strzałki / Esc.
2. `https://lilkangoomedia.com/admin.html#services` → Edit → Choose existing photo → wybierz → Save changes.
3. `https://lilkangoomedia.com/admin.html#galleries` → wybierz galerię → miniatury, Set cover, select, Remove from gallery. Nie wykonuj destrukcyjnych testów na galerii klienta.
4. `https://lilkangoomedia.com/admin.html#media` → wybierz galerię docelową, sprawdź rozmiar i wymiary zdjęć, przewiń w dół, wybierz zdjęcie i Add to gallery; potwierdź przypisanie.
5. Potwierdź, że formularz kontaktowy i `Admin → Enquiries` działają bez zmian.

**Nie trzeba konfigurować nowych sekretów Netlify, Resend, Zoho, Google, Stripe.** Wymagana jest tylko migracja SQL z kroku 2.

## Ważna granica bezpieczeństwa

**Prywatność uploadów:** obecny bucket Supabase `portfolio` jest publiczny. Status **Review** ukrywa zdjęcie w nowym portfolio, ale **nie chroni bezpośredniego adresu pliku**. Nie przesyłaj poufnych galerii klientów do tego bucketu bez osobnego rozwiązania z prywatnym bucketem i uwierzytelnionymi linkami.


Istniejące pliki w publicznym repozytorium GitHub nie stają się prywatne po ukryciu w Media Library. Trwałe kasowanie źródłowych plików jest odrębną, potencjalnie destrukcyjną operacją wymagającą audytu powiązań z usługami, galeriami, HTML i SEO. Celowo nie włączono jej do masowego przycisku Remove.

Testy: pliki JS sprawdzone składniowo (`node --check`), scenariusze galerii, wyboru fotografii, wielokrotnego przypisania, batch remove/restore oraz upload sprawdzone w Chromium na danych symulowanych. Rzeczywista baza Supabase i wdrożenie Netlify wymagają potwierdzenia w Deploy Preview / produkcji.
