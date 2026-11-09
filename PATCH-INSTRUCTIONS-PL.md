# Phase 19.1 — kompaktowa biblioteka linków (UI only)

Ta paczka jest dla strony LilKangooMedia, na której Phase 19 i Netlify już działają.

## Instalacja

1. Rozpakuj archiwum.
2. W repozytorium `LilKangoo/LilKangooMedia` zastąp pliki w tych samych ścieżkach:
   - `assets/lkm-v3/admin-links.js`
   - `assets/lkm-v3/admin-links.css`
3. Utwórz commit, co uruchomi wdrożenie na Netlify.
4. Po publikacji otwórz `https://lilkangoomedia.com/admin-links.html` i zrób pełne odświeżenie (Cmd+Shift+R).
5. Sprawdź kategorię, filtrowanie, kopiowanie linku, kopiowanie tekstu, przycisk Open oraz rozszerzenie „SEO & more”.

Nie modyfikuj bazy Supabase ani konfiguracji Netlify. Wszystkie inne funkcje i pliki Phase 19 pozostają niezmienione.

## Zmiany

- Usunięte górne statystyki, długi opis i powielony nagłówek wyników.
- Jednoliniowe filtry kategorii i kompaktowe wyszukiwanie z kontekstowym przyciskiem Clear.
- Karty zawierają miniaturę/symbol, nazwę, krótki opis, skrócony URL i działania Copy link / Copy text / Open.
- Pełne metadane SEO oraz opcjonalne „Copy direct page URL” znajdują się w „SEO & more”.
- Responsywny układ dla telefonów i mniejszych ekranów.

Testy Node i test funkcji Netlify wykonano na pełnej paczce źródłowej Phase 19.1. Nie wykonano testu graficznego w prawdziwej przeglądarce: lokalne środowisko blokuje Chromium (ERR_BLOCKED_BY_ADMINISTRATOR).
