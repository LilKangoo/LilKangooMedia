# Phase 16 — Testy lokalne

- 14 usług przeanalizowanych w lokalnym Chromium na danych testowych.
- Kontrola jednego H1 na stronie i prawidłowej kolejności About → What we offer → Available packages → How it works → Plan & pricing.
- Pakiety mają treść widoczną bez rozwijania; dane `features` wyświetlają się jako listy.
- Zmiana pakietu CyprusEye z €50/mies. na €450/mies. odświeża dolne podsumowanie.
- CTA przechodzi do obecnego `#/quote` z modułem Phase 13.
- Układy 320, 375, 390, 768, 850, 1024 i 1440 px bez poziomego overflow.
- Brak błędów JS w testach.

**Uwaga:** test na symulowanych rekordach i lokalnym HTML, nie jest testem produkcyjnego Supabase / Netlify. Obrazy w lokalnych screenshotach nie wczytywały się, bo nie kopiowano biblioteki zdjęć do środowiska testowego. ZIP nie zmienia ścieżek ani plików zdjęć.
