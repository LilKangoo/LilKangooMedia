# LilKangooMedia — Phase 12: filmy bezpośrednio w usługach

## Co zostało naprawione

**Przyczyna:** panel `Choose cover photo` pobierał tylko `portfolio_images`, czyli zdjęcia. Filmy są już prawidłowo importowane do `media_videos`, ale potrzebują osobnego przypisania do usługi (`service_slug`). Samo opublikowanie filmu w galerii `Films & Video Production` nie przypisuje go do usługi.

Po aktualizacji w **Admin → Services & Pricing → Edit** zobaczysz nową sekcję **Videos for this service**:

1. Kliknij **+ Choose videos from library**.
2. Zobaczysz miniatury filmów zaimportowanych z kanału YouTube, z wyszukiwarką i filtrem galerii.
3. Zaznacz jeden lub kilka filmów i kliknij **Attach selected videos**.
4. Przypisania są zapisywane **natychmiast w Supabase** (nie trzeba naciskać dodatkowo `Save changes` dla filmów). W sekcji pojawią się miniatury i przyciski **Hide / Publish / Remove**.
5. Otwórz stronę tej usługi w nowej karcie i odśwież. Film powinien pojawić się obok zdjęć; po kliknięciu będzie odtwarzany w istniejącym podglądzie.

Możesz też kliknąć **Choose a video instead** w oknie wyboru fotografii. Okładka usługi pozostaje zdjęciem; film dodajesz do jej materiałów.

Usunięcie przypisania usuwa wyłącznie rekord **film → usługa**. Nie kasuje filmu z YouTube ani z galerii portfolio. Dodanie już przypisanego filmu nie tworzy duplikatu. Każdy film może być użyty w kilku usługach.

## Aktualizacja — tylko jeden plik

**W repozytorium GitHub `LilKangoo/LilKangooMedia`:**

`assets/lkm-v3/video-admin.js` → **Replace** (podmień plik z tego ZIP-a)

Plik zawiera niezmienioną aktualną logikę Video Library i synchronizacji YouTube oraz *dodany* moduł przypisywania filmów do usług. Nie podmieniaj całego folderu `assets` i nie usuwaj istniejących plików.

**Nie wymagamy nowego SQL, klucza API ani zmian w Netlify.** Działająca migracja `media_videos` i RLS z Phase 10 pozostają bez zmian.

Zalecana procedura: utwórz gałąź `lkm-service-videos-v12` z aktualnej `main`, wgraj jeden plik, poczekaj na Netlify Deploy Preview, przetestuj na istniejącej usłudze, a po akceptacji połącz z `main`.

**Ważne:** Jeśli podgląd Netlify używa tej samej bazy Supabase co produkcja, przypinanie filmów w podglądzie zmienia dane produkcyjne. Najpierw użyj nieaktywnej usługi testowej lub przeprowadź test bez zapisu.

## Weryfikacja

- Wybierz w panelu usługę, np. **Commercial Video & Reels**.
- W nowej sekcji **Videos for this service** kliknij **Choose videos from library**.
- Wybierz film, kliknij **Attach selected videos**. Powinien pojawić się w miniaturach sekcji.
- Sprawdź publiczną stronę usługi pod `https://lilkangoomedia.com/#/service/SLUG_USLUGI` (lub odpowiednim adresem Deploy Preview).
- Kliknij miniaturę filmu, następnie przycisk odtwarzania; sprawdź strzałki i zamknięcie podglądu.
- Wróć do administratora i sprawdź przyciski **Hide**, **Publish** i **Remove**.

Jeśli film zapisuje się w administratorze, ale nie pojawia się publicznie, sprawdź w Supabase SQL Editor:

```sql
select youtube_id, title, service_slug, visibility, gallery_id
from public.media_videos
where service_slug is not null
order by updated_at desc
limit 40;
```

Na stronie są wyświetlane tylko rekordy z `visibility = 'public'` i przypisaniem do aktywnej usługi. Po nowym przypisaniu publiczna karta usługi wymaga odświeżenia.

## Testy przed dostarczeniem

- Kontrola składni JavaScript — PASS.
- Przeglądarka Chromium, mock Supabase: nowa sekcja w edytorze, pobieranie filmów, zaznaczanie, zapis, blokada duplikatów, usuwanie i dodawanie linku — PASS.
- Przeglądarka Chromium, oryginalny kod `site.js` z repozytorium (zgodny SHA): odczyt publicznych przypisań, miniatura filmu w usłudze, otwieranie odtwarzacza YouTube — PASS.
- **Nie wykonano operacji na produkcyjnym Supabase; wdrożenie i test na Netlify nadal wymagane.**
