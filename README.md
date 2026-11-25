# KORDEX Landing

Static landing page and demo for KORDEX Industrial Safety Intelligence.

## What Is Here

This repo currently contains a framework-free website:

- Landing page: `index.html`, `assets/css/landing.css`, `assets/js/contact-form.js`, `assets/js/i18n.js`
- Interactive demo: `demo.html`, `assets/css/demo.css`, `assets/js/demo.js`
- Slovenian StepUp NEO page: `landing-sl/index.html` with self-hosted assets and no tracking
- StepUp NEO detail pages: `sl/stepup-neo/`, `sl/zakon/`, `sl/vprasanja/`, `sl/viri/`
- Images: `assets/images/`
- Local Node server: `server.js`
- Netlify function: `netlify/functions/contact.js`

There is no app framework, database, test runner, package lockfile, or source/build directory split. A small Node build step keeps StepUp NEO prices in sync.

## Run

```sh
npm start
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/demo.html`
- `http://localhost:3000/landing-sl/`

The Slovenian page submits to the same contact endpoints. It marks the older
budget and pilot survey fields as `not_asked`; the handlers retain its optional
`phone`, `product`, and `consent` fields. No lead is emailed unless
`CONTACT_WEBHOOK_URL` is configured. The page remains `noindex` while under review.

Edit StepUp NEO prices only in `landing-sl/prices.json`. Run
`npm run build:stepup` to refresh the static HTML, calculator price JSON, JSON-LD and `llms.txt`, then
commit those generated files. `npm run check:stepup` verifies that they match.
Netlify runs the build for every preview deploy. The preview uses `robots.txt`
(`Disallow: /`) and every StepUp page has `noindex` in its HTML.
`robots.production.txt` is a separate future template and is not in use.
Canonical URLs point to the planned `/sl/` production paths. The Open Graph
image and URL currently point to the Netlify preview so link previews work
during review; switch them only when publishing is authorized.

## Business Logic

The only backend business logic today is lead capture.

`assets/js/contact-form.js` serializes the contact form and tries these endpoints in order:

1. `/api/contact`
2. `/.netlify/functions/contact`

`server.js` and `netlify/functions/contact.js` both:

- validate required contact fields,
- validate email format,
- block honeypot submissions through the hidden `website` field,
- normalize budget-owner and pilot-readiness values,
- calculate `pilot_readiness_score`,
- derive `willing_to_pay_now`,
- add UTM, referrer, user-agent, IP, timestamp, and trace ID metadata,
- optionally forward the lead to `CONTACT_WEBHOOK_URL`.

The local Node server also appends accepted leads to `leads.jsonl`.

## Current Gaps

- Contact business rules are duplicated between local and Netlify handlers.
- There are no automated tests.
- There is no shared module boundary for lead validation/scoring.
- There is no deployment config beyond the Netlify function and `.replit`.
- `kordex-landing.tar.gz` is tracked even though it appears to be a deployment/archive artifact.

## Suggested Next Structure

If this grows beyond a static page, move toward:

```text
public/
  index.html
  demo.html
  assets/
src/
  landing/
  demo/
  contact/
    leadRules.js
    leadRules.test.js
netlify/
  functions/
server.js
README.md
AGENTS.md
```

The first useful refactor would be extracting duplicated lead validation and scoring into one shared module.
