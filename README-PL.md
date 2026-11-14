# LilKangooMedia: jeden panel Projects & Portfolio

**Cel:** zastąpić w panelu admin osobne zakładki `Projects & Stories` oraz `Portfolio Collections` jednym centrum `Projects & Portfolio`, bez łączenia ani kasowania rekordów w Supabase.

## Co zostanie zmienione

- Jedna pozycja w lewym menu `Projects & Portfolio`.
- Wszystkie rekordy pokazane pionowo (lista **nad** wspólnym edytorem), z dwoma jednoznacznymi typami: **Work Gallery · Project** oraz **Portfolio · Collection**.
- Wyszukiwarka: nazwa, klient, slug i kategoria (bez problemów z wielkimi literami/akcentami).
- Filtry: typ, status, data dodania od/do; sortowanie od najnowszych, od najstarszych lub alfabetyczne.
- Dokładna data dodania pochodząca z istniejącego pola `portfolio_galleries.created_at` (czas UTC).
- Istniejące ustawienia galerii, wielokrotne przypisania usług, edytor Case Studies, Media Library, publikacja i adresy URL są zachowane.
- Zarządzanie projektami na stronie głównej jest w zwijanej sekcji **pod edytorem**.
- Historyczny link `#collections` przekierowuje do wspólnego panelu z filtrem Collections.

## Instalacja na Macu

1. Rozpakuj ZIP, pozostawiając folder `LKM_Unified_Admin_Patch` bez zmian.
2. Otwórz **Terminal**.
3. Wejdź do lokalnego repozytorium (jeżeli jest pod typową ścieżką):

```bash
cd "$HOME/Documents/GitHub/LilKangooMedia"
```

4. Sprawdź najpierw pliki (bez ich zmiany). Zastąp ścieżkę do rozpakowanego ZIP rzeczywistą lokalizacją, np. `~/Downloads/...`:

```bash
python3 "$HOME/Downloads/LKM_Unified_Admin_Patch/apply_unified_admin.py" --repo "$PWD" --dry-run
```

5. Jeśli zobaczysz `PRECHECK PASS`, zastosuj zmianę:

```bash
python3 "$HOME/Downloads/LKM_Unified_Admin_Patch/apply_unified_admin.py" --repo "$PWD"
npm test
node --check assets/lkm-v3/studio.mjs
node --check assets/lkm-v3/studio-model.mjs
```

6. Sprawdź `git diff` i panel lokalnie przed jakimkolwiek wysłaniem na GitHub. Nie zmieniaj bazy Supabase i nie wgrywaj SQL, ponieważ ta modyfikacja go nie potrzebuje.

**Ważne:** skrypt jest celowo przypięty do czterech konkretnych wersji plików z `main` GitHub (14 listopada 2026). Jeśli nie pasują, przerwie pracę **zanim zmieni cokolwiek**, zamiast nadpisywać nowszą wersję. Przed edycją zapisuje lokalny folder kopii zapasowej `LKM_UNIFIED_ADMIN_BACKUP_...`.

**Stan:** Kod w paczce jest gotowy do zastosowania, ale zmiany **nie zostały** wgrane na GitHub ani na działającą stronę. GitHub odmówił zapisu z aktualnego połączenia (403). Zmian nie można uznać za przetestowane na Twojej bazie Supabase, dopóki nie zostaną zastosowane w repozytorium i sprawdzone lokalnie.
