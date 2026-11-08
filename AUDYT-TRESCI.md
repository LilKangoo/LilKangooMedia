# Audyt treści — LilKangooMedia.com

Zakres: aktualny kod strony głównej, usług, konfiguratora, portfolio i bloga, a także początkowe opisy 13 usług w bazie oraz pięć zaimportowanych galerii. Podstawą był projekt GitHub LilKangoo/LilKangooMedia i pliki migracji Supabase. Nie było dostępu do aktualnej prywatnej zawartości wszystkich tabel Supabase, dlatego skrypt **nie nadpisuje indywidualnie zmodyfikowanych opisów**.

| Problem | Poprawka |
|---|---|
| Strona główna zapowiadała migrację zdjęć przed uruchomieniem | Zastąpiono opisem rzeczywistych dziedzin portfolio |
| Podstrona usługi wspominała o cenach skopiowanych z wcześniejszych stron | Zastąpiono informacją o potwierdzeniu terminu i zakresu |
| Konfigurator wspominał o edytowalności cen przez administratora | Zastąpiono informacją o wycenie i zasadach rezerwacji |
| Formularz zapowiadał niedziałający system e-mail | Poprawiono opis; działająca integracja Netlify/Resend pozostaje nietknięta |
| Stopka i menu mobilne pokazywały odnośnik do CMS | Usunięto publiczny odnośnik do panelu administracyjnego |
| „Original price list” mogło prowadzić do nieaktualnych ofert | Odnośnik prowadzi do aktualnego katalogu usług |
| Kafelki portfolio nie kierowały do odpowiednich galerii | Cztery kategorie kierują do galerii; videography do odpowiedniej usługi |
| Opisy pięciu galerii zaczynały się od komunikatu technicznego | Przygotowano merytoryczne opisy zgodne z ich kategoriami |
| Publiczne adresy galerii zawierały prefiks `legacy-` | SQL przygotowuje czyste slugi, a JavaScript obsługuje dawne odnośniki |
| Zdjęcia miały powtarzające się podpisy typu „photograph 1” | Puste podpisy są ukrywane; nie ma fikcyjnych opisów zdjęć |
| Pusta lista bloga wspominała o dawnych artykułach | Pokazuje bezpośrednie odnośniki do istniejących zbiorów artykułów |
| Formularz linkował do `/faq`, mimo że istnieje `FAQ.html` | Link poprawiono na `/FAQ.html` |
| „Explore & Book” sugerowało natychmiastowe potwierdzenie | Zmieniono przycisk na „Explore Services” |

**Czego nie oceniono bez dostępu do aktualnych danych:** opisów po ręcznych zmianach w panelu, zdjęć w chronionych prywatnych galeriach, wszystkich starych artykułów, aktywnej konfiguracji płatności i działania każdej integracji na Netlify. Nie można więc uczciwie zagwarantować braku wszystkich błędów produkcyjnych na podstawie samego audytu plików.
