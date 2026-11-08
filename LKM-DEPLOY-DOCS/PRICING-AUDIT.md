# LilKangooMedia pricing audit — source snapshot (8 November 2026)

Sources checked:
- `https://lilkangoomedia.com/shop` plus supplied `shop.html`
- supplied `home.html`
- supplied `holiday.html`
- supplied `yourbusiness.html`
- supplied `webdesign.html`, `Products.html`, `AboutUs.html`, `FAQ.html`

These numbers are **public website prices at the time of the supplied HTML snapshot**, not a commitment that the current private business pricing is still valid. The original site warns that prices can vary and travel fees/extras may apply.

| Category | Product/package | Published price |
|---|---|---:|
| Photography | Photo Basic / 1h | €149 |
| Photography | Photo Combo / 3h | €349 |
| Photography | Photo All Day / 8h | €999 |
| Videography | Video Basic / 1h | €349 |
| Videography | Video Combo / 3h | €599 |
| Videography | Video All Day / 8h | €2,199 |
| Weddings | Basic / 5h | €549 |
| Weddings | Combo / 5h + 1h photoshoot | €1,299 |
| Weddings | All Day / 8h + 2h photoshoot | €2,499 |
| Private photo trip | 5h | €400 |
| Private photo trip | 8h | €500 |
| Private photo trip | 10h | €600 |
| Private photo trip | 20h (two days) | €1,100 |
| Private video trip | 5h | €800 |
| Private video trip | 8h | €900 |
| Private video trip | 10h | €1,000 |
| Private video trip | 20h (two days) | €1,800 |
| Business Setup | Basic | €1,500 |
| Business Setup | Simple | €2,500 |
| Business Setup | Premium | €10,000 |
| Digital shop | 20 B&W Lightroom Presets | €19.99 |
| Digital shop | 20 RGB Lightroom Presets | €19.99 |

**Pricing source caveats:**
- The original shop has two different ranges for photos in the 3-hour photography package (`60–120` in best seller description and `60–100` in comparison table). Verify actual deliverables.
- The existing home page advertises a 10h photo trip for €600 with a range of `50–150 images`, but `holiday.html` lists the 10h trip as `up to 60 photos`. Both prices match but delivery terms conflict. Confirm before showing a guarantee.
- Previous business discussions mentioned €150/h photography, €250/h videography, website creation from €500 and annual €300 maintenance. These **differ from or are not directly supported by** the current supplied public site, so this release does not silently override public package pricing.
- Social Media Management, Marketing and Web Design do not have a confirmed standalone fixed price in the supplied public content. They are therefore set to **Custom quote** in the initial catalog.
- The three Business Setup products are **one-time brand setup products**, not social-media management subscriptions.
- New optional extras have NO prices seeded by default, because actual business rates and deliverables require confirmation.
- All payment modes start as `enquiry` in the SQL seed, so no customer is inadvertently charged against unapproved pricing or availability.

**Contact destination:** new contact and booking forms are prepared for `photo@lilkangoomedia.com`. This is a target configured in backend; actual delivery depends on secure mail provider integration and verified sending domain.
