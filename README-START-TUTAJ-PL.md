# LilKangooMedia — Phase 26.3: Remove assignments + kontrast całego Admin

Ta aktualizacja naprawia problemy wskazane na zrzutach z 11.11.2026:
- „Remove” w **Master Media Library → Asset Inspector → Assignments & Usage**. „Hide” jedynie ukrywa użycie; „× Remove” całkowicie odłącza je od wskazanego projektu/kategorii/usługi i usuwa z listy. Oryginalny plik w Master Library, plik w Storage/GitHub i przypisania do INNYCH miejsc pozostają nietknięte.
- Jeśli zdjęcie nadal jest okładką galerii lub usługi, usuwanie przypisania jest BLOKOWANE. Najpierw wybierz inną okładkę.
- Kontrast: ciemne panele i czytelny tekst w osadzonych **Enquiries, CRM, Articles, Reviews, Services, Quotes, Calendar, Reports, Links**. Poprawka jest ograniczona do panelu administratora w iframe, bez zmian w publicznej stronie oraz logice sprzedaży.
- Świadomie zachowujemy **biały podgląd dokumentu wyceny i druk/PDF**. To dokument dla klienta, a nie karta interfejsu.

## Wdrożenie — WAŻNA KOLEJNOŚĆ

1. Zalecane: wykonaj backup projektu Supabase przed zmianą funkcji bazodanowej (opcjonalnie przetestuj na kopii).
2. Otwórz właściwy projekt w Supabase Dashboard → SQL Editor → New query.
3. Otwórz plik `supabase/migrations/20261111_lkm_studio_unassign.sql`, skopiuj jego zawartość i kliknij **Run**.
   - **To JEDYNY nowy SQL w tej aktualizacji.**
   - Wymagana jest wcześniej wdrożona Phase 26 (`20261111_lkm_portfolio_studio.sql`).
   - **NIE uruchamiaj ponownie** żadnych starych migracji, w tym Phase 26.
4. Po poprawnym wyniku SQL wgraj do `LilKangoo/LilKangooMedia` **TYLKO 3 zmienione pliki aplikacji**, zachowując ścieżki:
   - `assets/lkm-v3/studio.mjs`
   - `assets/lkm-v3/studio.css`
   - `assets/lkm-v3/studio-embedded.css`
5. Commit/Push, sprawdź **Published** w Netlify. Otwórz `https://lilkangoomedia.com/admin.html#media` i odśwież `Shift + Command + R` (Mac Chrome).
6. Wybierz zdjęcie używane w co najmniej dwóch miejscach. W Inspector → **× Remove** usuń tylko jedno przypisanie i potwierdź, że drugie nadal jest widoczne. Aby usunąć okładkę, najpierw ustaw nową przez **Set as cover photo**.
7. Sprawdź `#inquiries`, `#crm`, `#articles`, `#reviews`, `#quotes`, `#calendar`, `#reports`, `#links`, `#services`. Tekst i formularze w panelu powinny być czytelne.

## Semantyka i bezpieczeństwo

- **Hide:** pozostawia relację w bazie i Inspectorze; można przywrócić Publish.
- **Remove:** po potwierdzeniu usuwa relację ze wskazanym miejscem, a dla istniejącego publicznego Portfolio odłącza kompatybilny rekord galerii lub wpis filmu. Dla zdjęć w galerii oryginalny rekord `portfolio_images` jest zachowany jako *nieprzypisany* i nieopublikowany; dla filmu znika pojedynczy wiersz docelowy, **nie film na YouTube**.
- Blokada okładki chroni przed przypadkową utratą głównego zdjęcia. Przypisania gdzie indziej pozostają.
- Operacja używa oddzielnego `SECURITY DEFINER` RPC `lkm_studio_unassign`, sprawdza `lkm_is_admin()` i zapisuje zdarzenie w audycie. Brak nowych publicznych uprawnień do DELETE.
- **Brak zmian** w Stripe, refundach, rezerwacjach, CRM, klientach, zdjęciach fizycznych oraz starych SQL.
- Ciemny motyw dotyczy wyłącznie osadzonych ekranów wewnątrz `/admin.html`; klasyczna strona `/admin-legacy.html` pozostaje dostępna.

## Co zostało zweryfikowane

- Zgodność zmian z aktualną wersją repo GitHub przed przygotowaniem aktualizacji.
- 12 testów lokalnych Chromium (Supabase/RPC i Storage symulowane): różne przypisania, anulowanie, usunięcie jednego przypisania, pozostawienie oryginału, blokada okładki, widok mobilny, CRM, Enquiries, Reviews, Articles, Quotes, Reports, Calendar i Links.
- Przedstawione w testach komponenty i selektory CSS pochodzą z aktualnych plików źródłowych. Testy NIE zastępują kontroli produkcyjnych danych i nie uruchamiają prawdziwego PostgreSQL ani prywatnego Supabase.

## Plan awaryjny

Jeśli aplikacja nie może użyć nowej funkcji (404 / RPC not found), sprawdź uruchomienie tylko nowego SQL i odśwież schemat Supabase. Jeśli funkcja zgłasza `This photograph is the gallery cover`, to oczekiwane zabezpieczenie — wybierz inną okładkę. Jeśli wystąpi nieoczekiwany błąd, NIE odpalaj ponownie poprzednich migracji. Prześlij komunikat SQL/RPC.

Ten ZIP nie wykonuje sam żadnych zmian w bazie ani repozytorium. 
