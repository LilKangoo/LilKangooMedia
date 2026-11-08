# LilKangooMedia — dopracowanie treści strony (Phase 5)

Aktualizacja usuwa z widocznej strony komunikaty wdrożeniowe i techniczne oraz wprowadza profesjonalne opisy istniejących usług i galerii. **Nie przebudowuje formularza i nie zmienia płatności.**

## 1. Pliki do GitHuba

Na osobnej gałęzi utworzonej z aktualnej `main` podmień **wyłącznie**:

- `index.html`
- `home.html`
- `blog.html`
- `portfolio.html`
- `assets/lkm-v3/site.js`
- `assets/lkm-v3/cms-public.js`
- `assets/lkm-v3/cms.js`
- `assets/lkm-v3/admin.js`

**Nie zastępuj całego folderu `assets`.** Wszystkie zdjęcia, folder `assets/images`, logo, `site.css`, `store.js`, konfiguracja `lkm-config.js` i `netlify/functions/enquiry.mjs` zostają bez zmian. Nie dodawaj do GitHuba kluczy prywatnych Supabase/Resend.

Zrób commit na gałęzi testowej i otwórz **Deploy Preview w Netlify**. Dopiero po sprawdzeniu strony połącz gałąź z `main`.

## 2. Opisy usług i galerii w Supabase

Po opublikowaniu nowych plików wykonaj w **Supabase → SQL Editor**:

`supabase/migrations/20261109_lkm_professional_copy.sql`

**Przed wykonaniem zrób kopię danych** (minimum eksport tabel `services` i `portfolio_galleries`, np. przez Table Editor). Skrypt powinien być najpierw przetestowany na kopii bazy, jeśli ją posiadasz.

SQL:

- Proponuje nowe, profesjonalne streszczenia i opisy 13 usług, **ale aktualizuje je tylko wtedy, gdy są nadal identyczne z początkowymi tekstami**. Własnych zmian wprowadzonych później w panelu nie nadpisze.
- Poprawia tytuł „Business Setup Packages” na „Brand Launch Packages” tylko w przypadku niezmienionej nazwy; nie dotyczy zakładania spółek.
- Zastępuje techniczne opisy 5 galerii tylko tam, gdzie występuje oryginalny automatyczny komunikat o odtwarzaniu galerii.
- Zamienia prefiks `legacy-` w adresach 5 galerii na czyste nazwy. Stare odnośniki `#/gallery/legacy-...` są obsługiwane przez nowy kod. Jeśli nowa nazwa jest już zajęta, stara pozostaje do ręcznej kontroli.
- **Nie zmienia cen, pakietów, zdjęć, statusów publikacji ani zamówień.** Album indywidualny pozostaje ukryty, dopóki nie zdecydujesz inaczej.

## 3. Lista kontroli po wdrożeniu

1. Główna: bez opisów typu „migracja”, „stara strona”, „preview” i bez linku CMS w publicznej nawigacji.
2. Oferta: przejrzyj wszystkie 13 usług, porównaj aktualne ceny z Supabase i sprawdź konfigurator zapytania.
3. Portfolio: 5 galerii, prawidłowe zdjęcia, opisy bez komentarzy technicznych, działające odnośniki z głównej.
4. Klienci: prywatna galeria nie może się pojawić publicznie.
5. Blog: przy braku nowych artykułów pokażą się odnośniki do istniejących przewodników fotograficznych i artykułów o Cyprze.
6. Formularz: wyślij test, potwierdź rekord w `contact_leads` i e-mail w Zoho.
7. Telefon: sprawdź menu, karty, zdjęcia, przewijanie i brak poziomego paska.
8. Netlify: `Deploys → Published`; jeśli wystąpi problem, opublikuj poprzedni działający deployment.

## 4. Ustalenia audytu i dalsze prace

- Wszystkie nowe adresy SEO artykułów nadal wymagają wygenerowania niezależnych stron HTML. **Ta paczka nie migruje starych artykułów ani nie usuwa ich adresów.**
- Zdjęcia zaimportowane poprzednio mogą mieć ogólne teksty `alt`. Nie wymyślaliśmy opisów konkretnych zdjęć bez obejrzenia; publiczny widok przestaje jednak używać ich jako powtarzalnych podpisów pod fotografiami. Szczegółowe opisy ALT zostaną uzupełnione podczas przeglądu fotografii.
- Należy osobno sprawdzić zgodność AdSense i mechanizmu zgód w EOG z wymogami Google oraz ePrivacy/GDPR. Pozostawiono obecne identyfikatory Analytics/AdSense i nie wprowadzono nowych skryptów śledzących.
- Aktualne ceny mogły zostać zmienione w panelu Supabase — celowo ich nie dotykamy.
- Pełne archiwum chronionych galerii klientów nie zostało automatycznie opublikowane.
- Wykonano 4 kontrole składni JavaScript i 8 testów logicznych na danych testowych. **Pełny test wizualny i produkcyjny wymaga sprawdzenia przez Netlify Deploy Preview**.

## 5. Przywracanie

Jeśli po wdrożeniu coś nie działa, przywróć poprzedni działający deployment w Netlify. Zmiany w Supabase trzeba przywrócić oddzielnie z kopii, po upewnieniu się, że nie nadpiszą późniejszych edycji administratora.
