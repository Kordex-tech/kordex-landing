# StepUp NEO Slovenian landing — PR review

Target: `landing/sl-v1` → `main` in `Kordex-tech/kordex-landing`. The change adds `landing-sl/`, preserves the existing root landing and demo, and makes small compatible changes to the local and Netlify contact handlers. `system-v2.css`, `theme.js`, and local Manrope files are copied from the supplied system-v2 preview archive built from `e45c6ad3`.

## Screenshots

- [360 px](landing-sl-360.png)
- [1440 px](landing-sl-1440.png)

## FRT images used

Each image is converted locally to WebP at 480, 960 and 1600 px widths. Source comments appear next to each image in `landing-sl/index.html`.

| Original in `landing_media/frt_site/` | New basename in `landing-sl/media/` | Use |
|---|---|---|
| `b1b868_0d0261b5521a41f2832bb1e196276917~mv2.jpg` | `packing` | Packaging |
| `b1b868_3a29a543a49f4b07bcb23325a6ffa7db~mv2.jpg` | `hero-lift` | Hero |
| `b1b868_54f2c58784604e598b6d4b423855e443~mv2.jpg` | `floor-lift` | Floor lift |
| `b1b868_6a47cc88834643b1b72c9eb69ce7fc8a~mv2.jpg` | `warehouse-carry` | Loading |
| `b1b868_812a69a9df144650a956fe7c74c7ae32~mv2.jpg` | `warehouse-walk` | Warehouse |
| `b1b868_b7c6cb651b7f408992eb33b958697bc8~mv2.jpg` | `pallet-carry` | Pallets |
| `b1b868_dc1ca87cada64d18bd9217d781618ada~mv2.png` | `production` | Production |

The logo comes from `landing_media/KORDEX_logo_horizontal_A_ime.png`. `how-to-wear.mp4` is a 720p H.264, silent, 5.9 MiB conversion of `landing_media/video/StepUp_NEO_How_to_Wear_FRT_EN.mp4`; `how-to-poster.webp` is a frame from this video. The two wearing photos and the older FRT YouTube video were removed after review.

## Copy for language review

All new Slovenian phrasing is marked `data-draft="sl"`; the complete [phrase list](draft-phrases.md) is included here. Product facts are sourced from the supplied StepUp NEO FAQ, FRT site text, and KORDEX Slovenian one-pager. The 178 million euro figure is explicitly the 2020–2024 annual average for six selected diagnoses from NIJZ and EF UL.

## Checks

- Chromium at 360, 768, 1024 and 1440 px: no horizontal scroll, no broken images, no JavaScript exceptions. The How to Wear video spans the content width; process and testimonial headings stay on one line on wide screens; the contact details sit in the footer.
- Lighthouse mobile on this repository's local Node server: Performance **96**, Accessibility **100**, initial transfer **299 KiB** without video.
- Form uses this repository's `/api/contact` endpoint with `/.netlify/functions/contact` as fallback. The older budget and pilot questions are sent as `not_asked`; optional phone, product and consent fields are retained by both handlers.
- Local test: one fake lead was accepted into a temporary `leads.jsonl` outside the repository; the Netlify function returned 200 with a mocked webhook and retained the same optional fields. The browser showed `Poslano`.
- Existing `/` and `/demo.html` still render; the existing homepage's Slovenian language switch works.
- Outbound lead delivery depends on `CONTACT_WEBHOOK_URL`. It is not configured by this PR; the local Node server stores leads in `leads.jsonl` when running.
- The form uses the task's `[GLAS: ime, telefon]` placeholder until a contact person and number are supplied.
- `robots=noindex`; no production deployment.

## Point 10: search and link previews

- [Updated 360 px screenshot](stepup-v2-360.jpg) and [1440 px screenshot](stepup-v2-1440.jpg). The browser check covers the landing and all four detail pages at both widths, with no horizontal overflow, broken images or JavaScript errors.
- The landing includes one JSON-LD `@graph` with `Organization`, `Product`, and `FAQPage`. The eight structured FAQ answers are generated from the visible FAQ text. There are no review, rating or telephone fields. Local JSON parsing and content matching passed.
- Open Graph title, description and a 1200 × 630 image are set for LinkedIn and WhatsApp. The image is at `sl/media/stepup-neo-og.jpg`.
- Detail pages: `/sl/stepup-neo/`, `/sl/zakon/`, `/sl/vprasanja/`, `/sl/viri/`. They are linked from the landing with “Več →”, with no menu entries. Expandable text uses native `details` in HTML.
- `sitemap.xml` uses future canonical `/sl/` URLs. Preview `robots.txt` disallows crawling and all pages retain `noindex`. `robots.production.txt` is ready for the later publication step, but is not active.
- `landing-sl/prices.json` is the sole price source. `npm run build:stepup` updates visible price markers, Product offers, FAQ answers and `llms.txt`; `npm run check:stepup` verifies that output is current. The Netlify build runs the generator automatically.
- All new Slovenian copy for language review is marked `data-draft="sl"` in the HTML files.

## Point 11: calculator

- [360 px screenshot](stepup-calc-360.jpg) and [1440 px screenshot](stepup-calc-1440.jpg). The page at `/landing-sl/izracun/` reuses the landing background video and poster. The only landing links are below the 9 300 € example and in the footer.
- The supplied calculator's formulas, field defaults and copy are preserved. Its `kordex-prices` JSON and static price examples are generated from `landing-sl/prices.json`; prices displayed in Chromium are 2 149 € at 20 units and 2 099 € at 50 units. Both widths have no horizontal overflow or JavaScript errors.
- The new landing phrase is “Izračunajte za svoje podjetje →”. Calculator phrases for language review are marked `data-draft="sl"` in `landing-sl/izracun/index.html`, including its title, introduction, input hints, results, explanations and caveat.
- The exact NIJZ primary source for the stated 2024 average of 36.5 calendar days per absence was **not found**. NIJZ's [2024 first release](https://nijz.si/podatki/prva-objava-bolniska-odsotnost-v-letu-2024/) and [statistical yearbook](https://nijz.si/wp-content/uploads/2025/12/2.6_Bolniska_odsotnost_2024_Z-1.pdf) were checked. The supplied wording and default of 26 working days remain unchanged pending a verifiable source.
