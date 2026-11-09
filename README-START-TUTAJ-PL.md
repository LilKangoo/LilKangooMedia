# LilKangooMedia — Phase 9: About Us

Aktualizacja sekcji **About Us** na głównej stronie oraz starych adresów HTML. Teksty i biografie bazują na oryginalnym `AboutUs.html` z repozytorium. Zdjęcia Michaela i Lilyanny oraz przykłady prac wykorzystują istniejące ścieżki `/assets/images/`.

## Instalacja — tylko na gałęzi testowej

1. Utwórz na GitHubie gałąź `lkm-about-v9` na podstawie najnowszej `main`.
2. Rozpakuj paczkę. Wgraj wyłącznie cztery pliki (zachowując nazwy i ścieżki):
   - `assets/lkm-v3/site.js` — zamień
   - `assets/lkm-v3/site.css` — zamień
   - `AboutUs.html` — zamień
   - `About Us.html` — zamień (istniejący alternatywny adres)
3. Nie zastępuj całego folderu `assets`; nie usuwaj zdjęć ani żadnych innych plików.
4. Zrób Commit / Push. Na Netlify Deploy Preview sprawdź `/#/about`, `/AboutUs.html` oraz `/About%20Us.html`.
5. Sprawdź zdjęcia zespołu, działanie przycisków, wygląd na telefonie, formularz kontaktowy i pozostałe sekcje. Dopiero wtedy połącz z `main`.

## Zakres treści

- Zmodernizowany hero z trzema autentycznymi zdjęciami portfolio.
- Opis studia i podejścia do pracy, bez niepotwierdzonych liczb.
- Profil Michaela: fotografia, film, montaż, publikacje (na podstawie oryginalnej biografii).
- Profil Lilyanny: projektowanie graficzne, ilustracja, pisanie; studia w Atenach i projekty europejskie (na podstawie oryginału).
- Karty zakresów działalności i CTA do kontaktu.
- Nowa wersja HTML zachowuje canonical `https://lilkangoomedia.com/aboutus`; nie zmienia starych linków do artykułów ani galerii.
- Zachowane logowanie i cała integracja formularzy; brak zmian w Supabase/Netlify Functions.
- Google Analytics na stronach About HTML wymaga wcześniej zapisanej zgody. Brak automatycznego wczytywania AdSense w nowej wersji About — najpierw należy skonfigurować Google-certified CMP dla reklam w EOG. Identyfikator wydawcy w meta jest zachowany.

## Kontrole

Uruchom `node --check assets/lkm-v3/site.js`. Sprawdź również plik HTML i assety w Netlify Deploy Preview. Testy składni i obecności odniesień do lokalnych plików są przeprowadzane podczas budowy paczki.

**Uwaga:** jeśli w repozytorium `site.js` uległ zmianie po wdrożeniu Phase 7, przed zastąpieniem porównaj różnice w GitHub Pull Request, żeby nie nadpisać nowszych modyfikacji.
