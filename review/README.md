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
| `b1b868_23164d26a80246ae8673148b1ab69ca0~mv2.jpg` | `lever` | Wearing step |
| `b1b868_2c7b03cb75f247e38eedaa9b1fdc34d6~mv2.jpg` | `fastening` | Wearing step |
| `b1b868_3a29a543a49f4b07bcb23325a6ffa7db~mv2.jpg` | `hero-lift` | Hero |
| `b1b868_54f2c58784604e598b6d4b423855e443~mv2.jpg` | `floor-lift` | Floor lift |
| `b1b868_6a47cc88834643b1b72c9eb69ce7fc8a~mv2.jpg` | `warehouse-carry` | Loading |
| `b1b868_812a69a9df144650a956fe7c74c7ae32~mv2.jpg` | `warehouse-walk` | Warehouse |
| `b1b868_b7c6cb651b7f408992eb33b958697bc8~mv2.jpg` | `pallet-carry` | Pallets |
| `b1b868_bb5d5a52e91b447daa64e583ccb2128d~mv2.png` | `how-to-steps` | Click-to-load FRT video poster |
| `b1b868_dc1ca87cada64d18bd9217d781618ada~mv2.png` | `production` | Production |

The logo comes from `landing_media/KORDEX_logo_horizontal_A_ime.png`. `how-to-wear.mp4` is a 720p H.264, silent, 5.9 MiB conversion of `landing_media/video/StepUp_NEO_How_to_Wear_FRT_EN.mp4`; `how-to-poster.webp` is a frame from this video. The FRT YouTube iframe is created only after a click.

## Copy for language review

All new Slovenian phrasing is marked `data-draft="sl"`; the complete [phrase list](draft-phrases.md) is included here. Product facts are sourced from the supplied StepUp NEO FAQ, FRT site text, and KORDEX Slovenian one-pager. The 178 million euro figure is explicitly the 2020–2024 annual average for six selected diagnoses from NIJZ and EF UL.

## Checks

- Chromium at 360 and 1440 px: no horizontal scroll, no broken images, no external requests before video click, no JavaScript exceptions.
- Lighthouse mobile on this repository's local Node server: Performance **96**, Accessibility **100**, initial transfer **299 KiB** without video.
- Form uses this repository's `/api/contact` endpoint with `/.netlify/functions/contact` as fallback. The older budget and pilot questions are sent as `not_asked`; optional phone, product and consent fields are retained by both handlers.
- Local test: one fake lead was accepted into a temporary `leads.jsonl` outside the repository; the Netlify function returned 200 with a mocked webhook and retained the same optional fields. The browser showed `Poslano`.
- Existing `/` and `/demo.html` still render; the existing homepage's Slovenian language switch works.
- Outbound lead delivery depends on `CONTACT_WEBHOOK_URL`. It is not configured by this PR; the local Node server stores leads in `leads.jsonl` when running.
- The form uses the task's `[GLAS: ime, telefon]` placeholder until a contact person and number are supplied.
- `robots=noindex`; no production deployment.
