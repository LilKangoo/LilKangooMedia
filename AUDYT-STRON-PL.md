# LilKangooMedia — audyt szablonów Phase 30

| Grupa | Pliki / trasa zweryfikowane w źródłach | Sposób ujednolicenia |
|---|---|---|
| Główna aplikacja | `index.html`, `home.html`, SPA `#/services`, `#/service/...`, `#/quote`, `#/request`, `#/about`, `#/contact` | CSS Graphite & Gold; **Home 29.6 i jego kangur bez zmian**, formularze na czytelnych powierzchniach |
| Business | `business-solutions.html`, `business-restaurants.html`, `business-hotels.html`, `business-retail.html`, `business-brands.html` | wspólny header, grafitowe sekcje, złote CTA, istniejący `#business-brief` |
| Portfolio i projekty | `portfolio.html`, `case-studies.html` oraz `portfolio.html#/stories` | CMS/Case studies na matowym graficie; zachowanie galerii i projektu |
| Artykuły | `blog.html`, strony generowane przez `scripts/build_articles.py`, CSS `article.css` | grafitowe sekcje, kontrastowe karty, ciepłe jasne pole do długiego tekstu |
| Usługi SEO | `services/*.html` generowane przez `scripts/build_service_pages.py`, CSS `service-seo.css` | jednolity header, grafit, złote CTA, czytelne panele zakresu i FAQ |
| Opinie | `Reviews.html`, publiczny adres `/reviews.html` | spójny header, grafitowy katalog, wizualna poprawka i alias adresu, bez zmian recenzji |
| About | `AboutUs.html`, `About Us.html` | grafit + złoto, białe teksty, neutralne karty, wspólne menu |
| Panel administracyjny i klient | `admin*.html`, `cms.html`, `client.html`, `proposal.html` | celowo bez zmian — wymagają własnego motywu i ochrony przepływów |
| Stare pliki legacy | m.in. `FAQ.html`, stare produkty i HTML Mobirise | bez automatycznych zmian — nie korzystają ze wspólnych szablonów publicznych |

**Uwaga:** nie wszystkie historyczne pliki HTML są aktywnymi podstronami. Skrypt dopasowuje tylko pliki korzystające z potwierdzonych współczesnych stylów, zamiast narzucać zmiany na nieznane interfejsy.
