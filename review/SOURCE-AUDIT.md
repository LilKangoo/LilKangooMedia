# Evidence: old LilKangooMedia galleries

Read via GitHub connector from `LilKangoo/LilKangooMedia` on `main` (2026-11-08).

The source of each photo's gallery membership is the `<section class="... mbr-gallery ...">` in the original public HTML. Original Mobirise pages repeat images in the visible gallery and lightbox; image `data-src` paths were deduplicated while retaining the first occurrence order.

| Old page | Confirmed gallery | Distinct originals | Import status |
| --- | --- | ---: | --- |
| `Portraits.html` | Portraits | 52 | Public (was public) |
| `Nature.html` | Nature Photography | 28 | Public (was public) |
| `Products.html` | Products & Jewellery Photography | 34 | Public (was public) |
| `GraphicDesign.html` | Graphic Design | 22 | Public (was public) |
| `IgoriGabrysia.html` | 18 Igor & Gabrysia | 74 | Review (client gallery) |

Total 210 validated image memberships. `Photography.html` is a category hub; do not import its three thumbnail links as full galleries. `Videography.html` contains no legacy photo gallery and cannot be reliably transformed into a photo gallery. Many named client HTML pages return `<title>Protected Page</title>` with no gallery `<img>` tags; importing their photographs by filename alone would be guesswork. These pages remain untouched.

Public release after SQL needs only Supabase SQL migration; website `/portfolio.html` already reads published `portfolio_galleries` and `portfolio_images` from Supabase.
